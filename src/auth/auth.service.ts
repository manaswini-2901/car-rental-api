import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private repo: Repository<User>,
    private jwt: JwtService,
  ) {}

  async validateAndSign(email: string, password: string) {
    const user = await this.repo.findOne({ where: { email } });
    if (!user || user.password !== password) {
      throw new BadRequestException({ errors: { email: 'Invalid email or password' } });
    }
  // keep payload minimal
  const token = await this.jwt.signAsync({ sub: user.id, role: user.role });
  return { user, token };
  }
}
