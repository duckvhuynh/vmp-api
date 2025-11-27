import { CanActivate, ExecutionContext, Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
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
    
    // If no roles required, allow access
    if (!required || required.length === 0) return true;
    
    const req = context.switchToHttp().getRequest();
    const user = req.user as { userId?: string; roles?: Role[] } | undefined;
    
    // If roles are required but no user is present (not authenticated)
    // Throw 401 Unauthorized instead of returning false (which would be 403)
    if (!user || !user.userId) {
      throw new UnauthorizedException('Authentication required');
    }
    
    // If user has no roles array, deny access
    if (!user.roles || user.roles.length === 0) {
      throw new ForbiddenException('User has no assigned roles');
    }
    
    // Check if user has any of the required roles
    const hasRole = required.some((r) => user.roles!.includes(r));
    if (!hasRole) {
      throw new ForbiddenException(`Access denied. Required roles: ${required.join(', ')}`);
    }
    
    return true;
  }
}
