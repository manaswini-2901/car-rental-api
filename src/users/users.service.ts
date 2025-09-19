import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { User } from './user.entity';

function withoutPassword(user: User) {
  if (!user) return null;
  const { password, ...rest } = user;
  return rest;
}

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private repo: Repository<User>) {}

  async findAll() {
    const users = await this.repo.find();
    return users.map(withoutPassword);
  }

  async findPaged(page = 1, limit = 10, q?: string) {
    const take = Math.max(1, Math.min(100, limit));
    const skip = (Math.max(1, page) - 1) * take;

    const where = q
      ? [
          { firstName: ILike(`%${q}%`) },
          { lastName: ILike(`%${q}%`) },
          { email: ILike(`%${q}%`) },
        ]
      : undefined;

    const [rows, total] = await this.repo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip,
      take,
    });

    return {
      data: rows.map(withoutPassword),
      page,
      limit: take,
      total,
      pages: Math.ceil(total / take),
    };
  }

  async findOne(id: number) {
    const user = await this.repo.findOne({ where: { id } });
    if (!user) throw new NotFoundException({ errors: { id: 'User not found' } });
    return withoutPassword(user);
  }

  async create(userData: Partial<User>) {
    // Check for duplicate email
    const existing = await this.repo.findOne({ where: { email: userData.email } });
    if (existing) {
      throw new BadRequestException({ errors: { email: 'Email already in use' } });
    }

    const user = this.repo.create(userData);
    try {
      const saved = await this.repo.save(user);
      return withoutPassword(saved);
    } catch (e: any) {
      if (e?.code === '23505') {
        throw new BadRequestException({ errors: { email: 'Email already in use' } });
      }
      throw e;
    }
  }

  async update(id: number, changes: Partial<User>) {
    const user = await this.repo.findOne({ where: { id } });
    if (!user) throw new NotFoundException({ errors: { id: 'User not found' } });

    // If email is changing, re-check uniqueness
    if (changes.email && changes.email !== user.email) {
      const dup = await this.repo.findOne({ where: { email: changes.email } });
      if (dup) throw new BadRequestException({ errors: { email: 'Email already in use' } });
    }

    // Ignore password updates
    if ('password' in changes) {
      delete (changes as any).password;
    }

    Object.assign(user, changes);
    const saved = await this.repo.save(user);
    return withoutPassword(saved);
  }

  async remove(id: number) {
    const user = await this.repo.findOne({ where: { id } });
    if (!user) throw new NotFoundException({ errors: { id: 'User not found' } });
    await this.repo.remove(user);
    return { success: true };
  }
}
