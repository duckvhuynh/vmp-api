import { Injectable, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as argon2 from 'argon2';
import { User, UserDocument } from './user.schema';
import { CreateUserDto, UpdateUserDto, UserResponseDto } from './dto/user.dto';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async findById(id: string): Promise<UserResponseDto> {
    const user = await this.userModel.findById(id).select('-passwordHash').exec();
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return this.mapToDto(user);
  }

  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.userModel.find().select('-passwordHash').exec();
    return users.map(user => this.mapToDto(user));
  }

  async create(data: Partial<User>): Promise<UserDocument> {
    return this.userModel.create(data);
  }

  async createUser(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const existing = await this.findByEmail(createUserDto.email);
    if (existing) {
      throw new BadRequestException('Email already registered');
    }

    const passwordHash = await argon2.hash(createUserDto.password);
    const user = await this.userModel.create({
      name: createUserDto.name,
      email: createUserDto.email,
      passwordHash,
      phone: createUserDto.phone,
      roles: createUserDto.roles || ['passenger'],
    });

    return this.mapToDto(user);
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existing = await this.findByEmail(updateUserDto.email);
      if (existing) {
        throw new BadRequestException('Email already registered');
      }
    }

    const updateData: any = {};
    if (updateUserDto.name) updateData.name = updateUserDto.name;
    if (updateUserDto.email) updateData.email = updateUserDto.email;
    if (updateUserDto.phone !== undefined) updateData.phone = updateUserDto.phone;
    if (updateUserDto.roles) updateData.roles = updateUserDto.roles;

    const updatedUser = await this.userModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .select('-passwordHash')
      .exec();

    if (!updatedUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return this.mapToDto(updatedUser);
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isValidPassword = await argon2.verify(user.passwordHash, currentPassword);
    if (!isValidPassword) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const newPasswordHash = await argon2.hash(newPassword);
    await this.userModel.findByIdAndUpdate(userId, { passwordHash: newPasswordHash }).exec();
  }

  async remove(id: string): Promise<void> {
    const result = await this.userModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
  }

  private mapToDto(user: UserDocument): UserResponseDto {
    return {
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      phone: user.phone,
      roles: user.roles as any[],
      createdAt: (user as any).createdAt,
      updatedAt: (user as any).updatedAt,
    };
  }
}
