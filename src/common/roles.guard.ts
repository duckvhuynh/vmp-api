import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY, Role } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private reflector: Reflector) {}
  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;
    const req = context.switchToHttp().getRequest();
    const user = req.user as { roles?: Role[] | string[] | string } | undefined;
    
    if (!user) {
      this.logger.warn('No user found in request');
      return false;
    }

    // Normalize roles to array
    let userRoles: Role[] = [];
    if (user.roles) {
      if (Array.isArray(user.roles)) {
        userRoles = user.roles as Role[];
      } else if (typeof user.roles === 'string') {
        // Handle case where roles might be stored as a single string
        userRoles = [user.roles as Role];
      }
    }

    if (userRoles.length === 0) {
      this.logger.warn(`User has no roles. Required: ${required.join(', ')}`);
      return false;
    }

    const hasRequiredRole = required.some((r) => userRoles.includes(r));
    
    if (!hasRequiredRole) {
      this.logger.warn(
        `User roles [${userRoles.join(', ')}] do not include required roles [${required.join(', ')}]`,
      );
    }

    return hasRequiredRole;
  }
}
