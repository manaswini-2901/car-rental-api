import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, Between } from 'typeorm';
import { Car } from './car.entity';
import { CreateCarDto } from './dto/create-car.dto';
import { UpdateCarDto } from './dto/update-car.dto';

@Injectable()
export class CarsService {
  constructor(@InjectRepository(Car) private repo: Repository<Car>) {}

  async create(data: CreateCarDto) {
    const car = this.repo.create(data);
    return this.repo.save(car);
  }

  async findPaged(page = 1, limit = 10, q?: string, available?: boolean, minPrice?: number, maxPrice?: number) {
    const take = Math.max(1, Math.min(100, limit));
    const skip = (Math.max(1, page) - 1) * take;

    const where: any = {};
    if (q) {
      where.model = ILike(`%${q}%`);
    }
    if (available !== undefined) {
      where.available = available;
    }
    if (minPrice !== undefined && maxPrice !== undefined) {
      where.pricePerDay = Between(minPrice, maxPrice);
    }

    const [rows, total] = await this.repo.findAndCount({
      where,
      skip,
      take,
      order: { createdAt: 'DESC' },
    });

    return { data: rows, page, limit: take, total, pages: Math.ceil(total / take) };
  }

  async findOne(id: number) {
    const car = await this.repo.findOne({ where: { id } });
    if (!car) throw new NotFoundException({ errors: { id: 'Car not found' } });
    return car;
  }

  async update(id: number, changes: UpdateCarDto) {
    const car = await this.findOne(id);
    Object.assign(car, changes);
    return this.repo.save(car);
  }

  async remove(id: number) {
    const car = await this.findOne(id);
    await this.repo.remove(car);
    return { success: true };
  }
}
