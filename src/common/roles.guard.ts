import { CanActivate, ExecutionContext, Injectable, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY, Role } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    // If no roles are required, allow access
    if (!required || required.length === 0) return true;
    
    const req = context.switchToHttp().getRequest();
    const user = req.user as { roles?: Role[] } | undefined;
    
    // If user is not authenticated, throw UnauthorizedException
    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }
    
    // If user has no roles, throw ForbiddenException
    if (!user.roles || user.roles.length === 0) {
      throw new ForbiddenException('User has no assigned roles');
    }
    
    // Check if user has at least one of the required roles
    const hasRequiredRole = required.some((r) => user.roles!.includes(r));
    
    if (!hasRequiredRole) {
      throw new ForbiddenException(
        `Access denied. Required roles: ${required.join(', ')}. User roles: ${user.roles.join(', ')}`
      );
    }
    
    return true;
  }
}
