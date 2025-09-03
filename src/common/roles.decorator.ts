import { SetMetadata } from '@nestjs/common';

export type Role = 'passenger' | 'driver' | 'admin' | 'dispatcher';
export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
