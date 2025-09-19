import { IsInt, Min, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateBookingDto {
  @Type(() => Number)
  @IsInt() @Min(1)
  carId: number;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;
}
