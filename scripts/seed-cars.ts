import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { CarsService } from '../src/cars/cars.service';
import { CreateCarDto } from '../src/cars/dto/create-car.dto';

async function seedCars() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const carsService = app.get(CarsService);

  const cars: CreateCarDto[] = [
    { brand: 'Hyundai', model: 'Elantra', pricePerDay: 40, available: true, description: 'Affordable compact sedan' },
    { brand: 'Kia', model: 'Sportage', pricePerDay: 60, available: true, description: 'Versatile crossover SUV' },
    { brand: 'Chevrolet', model: 'Malibu', pricePerDay: 55, available: true, description: 'Comfortable midsize sedan' },
    { brand: 'Ford', model: 'Mustang', pricePerDay: 100, available: true, description: 'Iconic American sports car' },
    { brand: 'Volkswagen', model: 'Golf', pricePerDay: 50, available: true, description: 'Popular European hatchback' },
    { brand: 'Nissan', model: 'Altima', pricePerDay: 45, available: true, description: 'Reliable midsize sedan' },
    { brand: 'Subaru', model: 'Outback', pricePerDay: 70, available: true, description: 'Rugged wagon for adventures' },
    { brand: 'Mazda', model: 'CX-5', pricePerDay: 65, available: true, description: 'Stylish compact SUV' },
    { brand: 'Jeep', model: 'Wrangler', pricePerDay: 90, available: true, description: 'Off-road legend' },
    { brand: 'Honda', model: 'Accord', pricePerDay: 60, available: true, description: 'Spacious and efficient sedan' },
  ];

  for (const car of cars) {
    await carsService.create(car);
    console.log(`Seeded car: ${car.brand} ${car.model}`);
  }

  await app.close();
}

seedCars();
