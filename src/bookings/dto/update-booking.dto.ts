import { IsIn, IsOptional } from 'class-validator';
import type { BookingStatus } from '../booking.entity';

export class UpdateBookingDto {
  @IsOptional()
  @IsIn(['Confirmed', 'Cancelled'])
  status?: BookingStatus;
}
