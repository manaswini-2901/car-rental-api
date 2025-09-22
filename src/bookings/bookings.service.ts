import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Booking } from './booking.entity';
import { Car } from '../cars/car.entity';
import { User } from '../users/user.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';

function nightsBetween(startISO: string, endISO: string): number {
  const s = new Date(startISO);
  const e = new Date(endISO);
  const diff = e.getTime() - s.getTime();
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return 0;
  if (diff <= 0) return 0;
  return Math.ceil(diff / (24 * 60 * 60 * 1000));
}

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking) private bookingRepo: Repository<Booking>,
    @InjectRepository(Car) private carRepo: Repository<Car>,
    @InjectRepository(User) private users: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  // Create booking for a specific userId (caller is the logged-in user)
  async create(userId: number, carId: number, startDate: string, endDate: string) {
    return this.dataSource.transaction(async (manager) => {
      const car = await manager.findOne(Car, { where: { id: carId } });
      if (!car) throw new NotFoundException({ errors: { carId: 'Car not found' } });

      if (!car.available) {
        throw new BadRequestException({ errors: { carId: 'Car is not available' } });
      }

      const user = await manager.findOne(User, { where: { id: userId } });
      if (!user) throw new NotFoundException({ errors: { user: 'User not found' } });

      const start = new Date(startDate);
      const end = new Date(endDate);
      if (!(start < end)) {
        throw new BadRequestException({ errors: { date: 'Start date must be before end date' } });
      }

      // simple total calculation
      const days = Math.max(1, Math.ceil((+end - +start) / (24 * 3600 * 1000)));
      const totalPrice = Number((car.pricePerDay * days).toFixed(2));

      const booking = new Booking();
  booking.startDate = start.toISOString().slice(0, 10);
  booking.endDate = end.toISOString().slice(0, 10);
      booking.totalPrice = totalPrice;
      booking.status = 'Confirmed';
      booking.user = user;
      booking.car = car;
      await manager.save(booking);

      // flip car to unavailable now that it’s booked
      car.available = false;
      await manager.save(car);

      return booking;
    });
  }

  // Admin can pass userId/carId/status to filter. Controller will restrict for Users.
  async findPaged(page = 1, limit = 10, userId?: number, carId?: number, status?: 'Confirmed' | 'Cancelled') {
    const take = Math.max(1, Math.min(100, limit));
    const skip = (Math.max(1, page) - 1) * take;

    const where: any = {};
    if (userId) where.user = { id: userId };
    if (carId) where.car = { id: carId };
    if (status) where.status = status;

  const [rows, total] = await this.bookingRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip,
      take,
    });

    return { data: rows, page, limit: take, total, pages: Math.ceil(total / take) };
  }

  async findOne(id: number) {
  const booking = await this.bookingRepo.findOne({ where: { id } });
    if (!booking) throw new NotFoundException({ errors: { id: 'Booking not found' } });
    return booking;
  }

  // User can cancel own; Admin can cancel any
  async cancel(id: number, userId: number, isAdmin = false) {
    return await this.dataSource.transaction(async (manager) => {
      try {
        const booking = await manager.findOne(Booking, {
          where: { id },
          relations: ['user', 'car'],
        });
        if (!booking) {
          console.error('Booking not found for id:', id);
          throw new NotFoundException({ errors: { id: 'Booking not found' } });
        }

        // Only owner or admin can cancel
        if (!isAdmin && booking.user.id !== userId) {
          console.error('Forbidden: userId mismatch', { bookingUserId: booking.user.id, userId });
          throw new ForbiddenException();
        }

        // If already cancelled, just return
        if (booking.status === 'Cancelled') {
          console.log('Booking already cancelled:', id);
          return booking;
        }

        booking.status = 'Cancelled';
        await manager.save(booking);
        console.log('Booking cancelled:', id);

        // Check if all bookings for this car are cancelled
        const activeBookings = await manager.count(Booking, {
          where: { car: { id: booking.car.id }, status: 'Confirmed' as any },
        });
        console.log(`Active bookings for car ${booking.car.id}:`, activeBookings);

        // If no active bookings, mark car as available
        if (activeBookings === 0) {
          booking.car.available = true;
          await manager.save(booking.car);
          console.log(`Car ${booking.car.id} marked available after cancellation.`);
        } else {
          console.log(`Car ${booking.car.id} still has active bookings.`);
        }

        return booking;
      } catch (err) {
        console.error('Error in cancel transaction:', err);
        throw err;
      }
    });
  }

  // Admin hard-delete
  async adminDelete(id: number) {
    const booking = await this.findOne(id);
  await this.bookingRepo.remove(booking);
    return { success: true };
  }
}
