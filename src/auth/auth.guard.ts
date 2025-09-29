// Extend Request type to include userId, userEmail, and userRole
interface AuthRequest extends Request {
  userId?: number;
  userEmail?: string;
  userRole?: string;
}

import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly cfg: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req: AuthRequest = context.switchToHttp().getRequest();

    const cookieName = this.cfg.get<string>('SESSION_COOKIE_NAME') || 'crsid';
    const token = req.cookies?.[cookieName];

    if (!token) {
      throw new UnauthorizedException({ errors: { auth: 'Login required' } });
    }

    try {
      const secret = this.cfg.get<string>('JWT_SECRET') || '';
      const payload = await this.jwt.verifyAsync(token, { secret });

      // attach payload to request
      req.userId = payload?.sub;
      req.userEmail = payload?.email;
      req.userRole = payload?.role;

      return true;
    } catch {
      throw new UnauthorizedException({ errors: { auth: 'Session expired or invalid' } });
    }
  }
}
