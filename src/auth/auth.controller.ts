import { Controller, Post, Body, Res, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from './auth.guard';
import type { Response, Request } from 'express';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  async login(
    @Body() body: { email: string; password: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const { token, user } = await this.auth.validateAndSign(body.email, body.password);

    // set HTTP-only cookie from env
    const cookieName = process.env.SESSION_COOKIE_NAME || 'crsid';
    const isSecure = String(process.env.SESSION_SECURE) === 'true';
    const sameSite = (process.env.SESSION_SAMESITE as 'lax'|'strict'|'none') || 'lax';

    res.cookie(cookieName, token, {
      httpOnly: true,
      secure: isSecure,
      sameSite,
      path: '/',
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    return { success: true, user: { id: user.id, email: user.email } };
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    const cookieName = process.env.SESSION_COOKIE_NAME || 'crsid';
    res.clearCookie(cookieName, { path: '/' });
    return { success: true };
  }

  @Get('me')
  // Only keep the correct implementation below

  @Get('me')
  @UseGuards(AuthGuard)
  async getProfile(@Req() req: Request) {
    const { userId, userRole } = req as Request & { userId?: number; userRole?: string };
    return {
      id: userId,
      role: userRole,
      // add email if you want, but you may need to fetch it from DB
    };
  }
}
