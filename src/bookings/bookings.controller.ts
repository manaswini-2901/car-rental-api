import {
  Controller, Post, Get, Patch, Delete,
  Body, Param, ParseIntPipe, Query, UseGuards, Req, ForbiddenException
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { AuthGuard } from '../auth/auth.guard';

@Controller('bookings')
@UseGuards(AuthGuard)
export class BookingsController {
  constructor(private readonly bookings: BookingsService) {}

  // Any logged-in user (or admin) creates a booking FOR THEMSELF
  @Post()
  create(@Req() req: any, @Body() body: CreateBookingDto) {
    return this.bookings.create(req.userId, body);
  }

  // List:
  // - Admin: can see all (and filter by userId/carId/status)
  // - User: can only see their own (we force userId = req.userId)
  @Get()
  list(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('userId') userId?: string,
    @Query('carId') carId?: string,
    @Query('status') status?: 'Confirmed' | 'Cancelled',
  ) {
    const isAdmin = req.userRole === 'Admin';
    const effectiveUserId = isAdmin ? (userId ? Number(userId) : undefined) : req.userId;
    return this.bookings.findPaged(
      Number(page) || 1,
      Number(limit) || 10,
      effectiveUserId,
      carId ? Number(carId) : undefined,
      status,
    );
  }

  // View one:
  // - Admin: can view any
  // - User: only their own
  @Get(':id')
  async getOne(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    const b = await this.bookings.findOne(id);
    if (req.userRole !== 'Admin' && b.user.id !== req.userId) {
      throw new ForbiddenException({ errors: { auth: 'Not allowed' } });
    }
    return b;
  }

  // Cancel:
  // - User: can cancel own
  // - Admin: can cancel any
  @Patch(':id/cancel')
  cancel(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.bookings.cancel(id, { userId: req.userId, role: req.userRole });
  }

  // Admin hard-delete
  @Delete(':id')
  remove(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    if (req.userRole !== 'Admin') {
      throw new ForbiddenException({ errors: { auth: 'Only Admin can delete bookings' } });
    }
    return this.bookings.adminDelete(id);
  }
}
