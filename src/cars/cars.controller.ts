// Extend Request type to include userId and userRole
import { Request } from 'express';
interface AuthRequest extends Request {
  userId?: number;
  userRole?: string;
}
import {
  Controller, Get, Post, Patch, Delete, Param, Body, Query,
  ParseIntPipe, UseGuards, Req, ForbiddenException
} from '@nestjs/common';
import { CarsService } from './cars.service';
import { CreateCarDto } from './dto/create-car.dto';
import { UpdateCarDto } from './dto/update-car.dto';
import { AuthGuard } from '../auth/auth.guard';

@Controller('cars')
export class CarsController {
  constructor(private readonly cars: CarsService) {}

  // --- ADMIN ONLY: set car availability directly
  @UseGuards(AuthGuard)
  @Patch(':id/available')
  async setAvailable(
    @Req() req: AuthRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { available: boolean }
  ) {
    if (req.userRole !== 'Admin') {
      throw new ForbiddenException({ errors: { auth: 'Only Admin can update car availability' } });
    }
    return this.cars.update(id, { available: body.available });
  }

  // --- ADMIN ONLY: create car
  @UseGuards(AuthGuard)
  @Post()
  create(@Req() req: AuthRequest, @Body() body: CreateCarDto) {
    if (req.userRole !== 'Admin') {
      throw new ForbiddenException({ errors: { auth: 'Only Admin can create cars' } });
    }
    return this.cars.create(body);
  }

  // --- ALL LOGGED IN: list cars with flexible backend filtering
  @UseGuards(AuthGuard)
  @Get()
  list(
    @Query('q') q?: string,
    @Query('brand') brand?: string,
    @Query('min') min?: string,
    @Query('max') max?: string,
    @Query('available') available?: string,
  ) {
    return this.cars.findFiltered({
      q,
      brand,
      min: min ? Number(min) : undefined,
      max: max ? Number(max) : undefined,
      available: available === 'true' ? true : available === 'false' ? false : undefined,
    });
  }

  // --- ALL LOGGED IN: view one car
  @UseGuards(AuthGuard)
  @Get(':id')
  getOne(@Param('id', ParseIntPipe) id: number) {
    return this.cars.findOne(id);
  }

  // --- ADMIN ONLY: update car
  @UseGuards(AuthGuard)
  @Patch(':id')
  update(@Req() req: AuthRequest, @Param('id', ParseIntPipe) id: number, @Body() body: UpdateCarDto) {
    if (req.userRole !== 'Admin') {
      throw new ForbiddenException({ errors: { auth: 'Only Admin can update cars' } });
    }
    return this.cars.update(id, body);
  }

  // --- ADMIN ONLY: delete car
  @UseGuards(AuthGuard)
  @Delete(':id')
  remove(@Req() req: AuthRequest, @Param('id', ParseIntPipe) id: number) {
    if (req.userRole !== 'Admin') {
      throw new ForbiddenException({ errors: { auth: 'Only Admin can delete cars' } });
    }
    return this.cars.remove(id);
  }
}
