import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, ParseIntPipe, UseGuards, Query, Req, ForbiddenException
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthGuard } from '../auth/auth.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  // --- PUBLIC: create first user (bootstrap Admin)
  @Post()
  create(@Body() body: CreateUserDto) {
    return this.users.create(body);
  }

  // --- ADMIN ONLY: list all users
  @UseGuards(AuthGuard)
  @Get()
  list(@Req() req: any, @Query('page') page?: string, @Query('limit') limit?: string, @Query('q') q?: string) {
    if (req.userRole !== 'Admin') {
      throw new ForbiddenException({ errors: { auth: 'Only Admin can list all users' } });
    }
    return this.users.findPaged(Number(page) || 1, Number(limit) || 10, q?.trim() || undefined);
  }

  // --- SELF OR ADMIN: view a single user
  @UseGuards(AuthGuard)
  @Get(':id')
  getOne(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    if (req.userRole !== 'Admin' && req.userId !== id) {
      throw new ForbiddenException({ errors: { auth: 'Not allowed' } });
    }
    return this.users.findOne(id);
  }

  // --- SELF OR ADMIN: update a single user
  @UseGuards(AuthGuard)
  @Patch(':id')
  update(@Req() req: any, @Param('id', ParseIntPipe) id: number, @Body() body: UpdateUserDto) {
    if (req.userRole !== 'Admin' && req.userId !== id) {
      throw new ForbiddenException({ errors: { auth: 'Not allowed' } });
    }
    return this.users.update(id, body);
  }

  // --- ADMIN ONLY: delete user
  @UseGuards(AuthGuard)
  @Delete(':id')
  delete(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    if (req.userRole !== 'Admin') {
      throw new ForbiddenException({ errors: { auth: 'Only Admin can delete users' } });
    }
    return this.users.remove(id);
  }
}

