import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, ParseIntPipe, Query, UseGuards
} from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '../auth/auth.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@UseGuards(AuthGuard)
@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly users: UsersService) {}

  // List (paged + search)
  @Get()
  list(@Query('page') page?: string, @Query('limit') limit?: string, @Query('q') q?: string) {
    return this.users.findPaged(Number(page) || 1, Number(limit) || 10, q?.trim() || undefined);
  }

  @Get(':id')
  getOne(@Param('id', ParseIntPipe) id: number) {
    return this.users.findOne(id);
  }

  @Post()
  create(@Body() body: CreateUserDto) {
    return this.users.create(body);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateUserDto) {
    return this.users.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.users.remove(id);
  }
}
