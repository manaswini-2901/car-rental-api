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

  async findFiltered({
    q, brand, min, max, available, page = 1, pageSize = 10,
  }: {
    q?: string;
    brand?: string;
    min?: number;
    max?: number;
    available?: boolean;
    page?: number;
    pageSize?: number;
  }) {
    const whereBase: any = {};
    if (available !== undefined) whereBase.available = available;
    if (brand) whereBase.brand = ILike(`%${brand}%`);

    if (min != null && max != null) whereBase.pricePerDay = Between(min, max);
    else if (min != null) whereBase.pricePerDay = MoreThanOrEqual(min);
    else if (max != null) whereBase.pricePerDay = LessThanOrEqual(max);

    const skip = (page - 1) * pageSize;
    const order = { pricePerDay: 'ASC' as const, id: 'ASC' as const };

    let data: Car[] = [];
    let total = 0;

    if (q && q.trim()) {
      const s = `%${q.trim()}%`;
      [data, total] = await this.repo.findAndCount({
        where: [
          { ...whereBase, brand: ILike(s) },
          { ...whereBase, model: ILike(s) },
          { ...whereBase, description: ILike(s) },
        ],
        order,
        skip,
        take: pageSize,
      });
    } else {
      [data, total] = await this.repo.findAndCount({
        where: whereBase,
        order,
        skip,
        take: pageSize,
      });
    }

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
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
