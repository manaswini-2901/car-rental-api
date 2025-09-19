import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AuthGuard } from './auth.guard';
import { User } from '../users/user.entity';

@Module({
  imports: [
    ConfigModule, // gives access to ConfigService
    TypeOrmModule.forFeature([User]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (cfg: ConfigService) => {
        const secret = cfg.get<string>('SESSION_SECRET');
        if (!secret) {
          throw new Error('SESSION_SECRET is missing from .env');
        }
        return {
          secret: '6433e0d892b4ca8e780edd3679b079dfce630864e51460b6f1e725c8b1b5a632',
          signOptions: { expiresIn: '1d' },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthGuard],
  exports: [AuthService, AuthGuard, JwtModule],
})
export class AuthModule {}
