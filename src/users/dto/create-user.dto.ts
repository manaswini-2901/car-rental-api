
console.log('[CreateUserDto loaded with fields: phone/role/status]');
import { IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, MinLength, Matches, MaxLength } from 'class-validator';

export class CreateUserDto {
  @IsString() @IsNotEmpty() @MaxLength(50)
  firstName: string;

  @IsString() @IsNotEmpty() @MaxLength(50)
  lastName: string;

  @IsEmail()
  email: string;

  @IsString() @MinLength(8)
  password: string;

  @IsOptional()
  @Matches(/^[0-9+\-\s()]{7,20}$/)
  phone?: string;

  @IsOptional()
  @IsIn(['Admin', 'User'])
  role?: 'Admin' | 'User';

  @IsOptional()
  @IsIn(['Active', 'Inactive'])
  status?: 'Active' | 'Inactive';

  @IsOptional()
  isActive?: boolean;
}

