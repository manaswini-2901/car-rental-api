import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]) ?? [];

    // If no @Roles() present, allow (AuthGuard will still enforce login)
    if (required.length === 0) return true;

    const req = ctx.switchToHttp().getRequest();
    const role: string | undefined = req.userRole; // set by your AuthGuard earlier
    if (!role || !required.includes(role)) throw new ForbiddenException('Admins only');
    return true;
  }
}
