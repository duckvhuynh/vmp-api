import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';

@Injectable()
export class AuthService {
  constructor(private users: UsersService, private jwt: JwtService) {}

  async register(payload: { name: string; email: string; password: string; phone?: string }) {
    const existing = await this.users.findByEmail(payload.email);
    if (existing) throw new UnauthorizedException('Email already registered');
    const passwordHash = await argon2.hash(payload.password);
    const user = await this.users.create({
      name: payload.name,
      email: payload.email,
      passwordHash,
      phone: payload.phone,
      roles: ['passenger'],
    });
    return this.issueTokens(user.id, user.roles);
  }

  async login(email: string, password: string) {
    const user = await this.users.findByEmail(email);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const ok = await argon2.verify(user.passwordHash, password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');
    return this.issueTokens(user.id, user.roles);
  }

  async refresh(userId: string, roles: string[]) {
    return this.issueTokens(userId, roles);
  }

  private issueTokens(sub: string, roles: string[]) {
    const payload = { sub, roles };
    const accessToken = this.jwt.sign(payload, { expiresIn: '15m' });
    const refreshToken = this.jwt.sign(payload, { expiresIn: '7d' });
    return { accessToken, refreshToken };
  }
}
