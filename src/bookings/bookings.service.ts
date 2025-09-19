import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
    @InjectRepository(Booking) private repo: Repository<Booking>,
    @InjectRepository(Car) private cars: Repository<Car>,
    @InjectRepository(User) private users: Repository<User>,
  ) {}

  // Create booking for a specific userId (caller is the logged-in user)
  async create(userId: number, dto: CreateBookingDto) {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException({ errors: { user: 'User not found' } });

    const car = await this.cars.findOne({ where: { id: dto.carId } });
    if (!car) throw new NotFoundException({ errors: { carId: 'Car not found' } });

    const nights = nightsBetween(dto.startDate, dto.endDate);
    if (nights <= 0) {
      throw new BadRequestException({ errors: { dates: 'endDate must be after startDate' } });
    }

    // Simple overlap rule:
    // newStart <= existingEnd AND newEnd >= existingStart
    const overlap = await this.repo.createQueryBuilder('b')
      .where('b.carId = :carId', { carId: car.id })
      .andWhere('b.status != :cancelled', { cancelled: 'Cancelled' })
      .andWhere('b.startDate <= :newEnd', { newEnd: dto.endDate })
      .andWhere('b.endDate >= :newStart', { newStart: dto.startDate })
      .getExists();

    if (overlap) {
      throw new BadRequestException({ errors: { car: 'Car is already booked for these dates' } });
    }

    const totalPrice = nights * Number(car.pricePerDay);

    const booking = this.repo.create({
      user,
      car,
      startDate: dto.startDate,
      endDate: dto.endDate,
      totalPrice,
      status: 'Confirmed',
    });

    return this.repo.save(booking);
  }

  // Admin can pass userId/carId/status to filter. Controller will restrict for Users.
  async findPaged(page = 1, limit = 10, userId?: number, carId?: number, status?: 'Confirmed' | 'Cancelled') {
    const take = Math.max(1, Math.min(100, limit));
    const skip = (Math.max(1, page) - 1) * take;

    const where: any = {};
    if (userId) where.user = { id: userId };
    if (carId) where.car = { id: carId };
    if (status) where.status = status;

    const [rows, total] = await this.repo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip,
      take,
    });

    return { data: rows, page, limit: take, total, pages: Math.ceil(total / take) };
  }

  async findOne(id: number) {
    const booking = await this.repo.findOne({ where: { id } });
    if (!booking) throw new NotFoundException({ errors: { id: 'Booking not found' } });
    return booking;
  }

  // User can cancel own; Admin can cancel any
  async cancel(id: number, actor: { userId: number; role: 'Admin' | 'User' }) {
    const booking = await this.findOne(id);
    if (actor.role !== 'Admin' && booking.user.id !== actor.userId) {
      throw new ForbiddenException({ errors: { auth: 'Not allowed' } });
    }
    if (booking.status === 'Cancelled') return booking;
    booking.status = 'Cancelled';
    return this.repo.save(booking);
  }

  // Admin hard-delete
  async adminDelete(id: number) {
    const booking = await this.findOne(id);
    await this.repo.remove(booking);
    return { success: true };
  }
}
