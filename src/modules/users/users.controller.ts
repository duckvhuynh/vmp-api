import { 
  Controller, 
  Get, 
  Post, 
  Patch, 
  Delete, 
  Body, 
  Param, 
  UseGuards, 
  Req,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth, 
  ApiParam 
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { 
  CreateUserDto, 
  UpdateUserDto, 
  UserResponseDto, 
  ChangePasswordDto 
} from './dto/user.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { Roles } from '../../common/roles.decorator';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ 
    summary: 'Get current user profile',
    description: 'Retrieve the authenticated user\'s profile information'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'User profile retrieved successfully',
    type: UserResponseDto
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMe(@Req() req: any): Promise<UserResponseDto> {
    return this.usersService.findById(req.user.userId);
  }

  @Patch('me')
  @ApiOperation({ 
    summary: 'Update current user profile',
    description: 'Update the authenticated user\'s profile information'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'User profile updated successfully',
    type: UserResponseDto
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateMe(
    @Req() req: any,
    @Body() updateUserDto: UpdateUserDto
  ): Promise<UserResponseDto> {
    return this.usersService.update(req.user.userId, updateUserDto);
  }

  @Post('me/change-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ 
    summary: 'Change user password',
    description: 'Change the authenticated user\'s password'
  })
  @ApiResponse({ status: 204, description: 'Password changed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid current password' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async changePassword(
    @Req() req: any,
    @Body() changePasswordDto: ChangePasswordDto
  ): Promise<void> {
    return this.usersService.changePassword(
      req.user.userId, 
      changePasswordDto.currentPassword, 
      changePasswordDto.newPassword
    );
  }

  @Get()
  @Roles('admin')
  @ApiOperation({ 
    summary: 'Get all users',
    description: 'Retrieve all users (admin only)'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Users retrieved successfully',
    type: [UserResponseDto]
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async findAll(): Promise<UserResponseDto[]> {
    return this.usersService.findAll();
  }

  @Get(':id')
  @Roles('admin')
  @ApiOperation({ 
    summary: 'Get user by ID',
    description: 'Retrieve a specific user by ID (admin only)'
  })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'User retrieved successfully',
    type: UserResponseDto
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(@Param('id') id: string): Promise<UserResponseDto> {
    return this.usersService.findById(id);
  }

  @Post()
  @Roles('admin')
  @ApiOperation({ 
    summary: 'Create a new user',
    description: 'Create a new user (admin only)'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'User created successfully',
    type: UserResponseDto
  })
  @ApiResponse({ status: 400, description: 'Invalid input data or email already exists' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    return this.usersService.createUser(createUserDto);
  }

  @Patch(':id')
  @Roles('admin')
  @ApiOperation({ 
    summary: 'Update user by ID',
    description: 'Update a specific user by ID (admin only)'
  })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'User updated successfully',
    type: UserResponseDto
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto
  ): Promise<UserResponseDto> {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ 
    summary: 'Delete user by ID',
    description: 'Delete a specific user by ID (admin only)'
  })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 204, description: 'User deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.usersService.remove(id);
  }
}

