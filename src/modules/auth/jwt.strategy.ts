import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }
  validate(payload: any) {
    // Ensure roles is always an array
    let roles: string[] = [];
    if (payload.roles) {
      if (Array.isArray(payload.roles)) {
        roles = payload.roles;
      } else if (typeof payload.roles === 'string') {
        roles = [payload.roles];
      }
    }
    
    return { userId: payload.sub, roles };
  }
}
