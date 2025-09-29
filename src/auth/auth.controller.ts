import { Controller, Post, Body, Res, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from './auth.guard';
import type { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { ApiBody } from '@nestjs/swagger';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  @ApiBody({ type: LoginDto })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { token, user } = await this.auth.validateAndSign(loginDto.email, loginDto.password);

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

@UseGuards(AuthGuard)
  @Get('profile')
  profile(@Req() req: any) {
    // Whatever you store in the session during login:
    // e.g. req.userId, req.userEmail, req.userRole
    return {
      id: req.userId,
      email: req.userEmail,
      role: req.userRole,
    };
  }
}

 
