import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
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

  async findFiltered({ q, brand, min, max, available }: {
    q?: string;
    brand?: string;
    min?: number;
    max?: number;
    available?: boolean;
  }) {
    const where: any = {};

    if (brand) where.brand = ILike(brand);
    if (available !== undefined) where.available = available;

    // price
    if (min != null && max != null) where.pricePerDay = Between(min, max);
    else if (min != null) where.pricePerDay = MoreThanOrEqual(min);
    else if (max != null) where.pricePerDay = LessThanOrEqual(max);

    // free-text across brand/model/description
    if (q && q.trim()) {
      const s = `%${q.trim()}%`;
      return this.repo.find({
        where: [
          { ...where, brand: ILike(s) },
          { ...where, model: ILike(s) },
          { ...where, description: ILike(s) },
        ],
        order: { pricePerDay: 'ASC', id: 'ASC' },
      });
    }

    return this.repo.find({
      where,
      order: { pricePerDay: 'ASC', id: 'ASC' },
    });
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
