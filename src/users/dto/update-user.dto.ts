import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { IsOptional, IsIn, Matches, MaxLength, IsString, IsEmail } from 'class-validator';

export class UpdateUserDto extends PartialType(CreateUserDto) {
	// Enforce create-only password: even if client sends it, we’ll ignore it in service.
	@IsOptional()
	password?: never;

	// (Optional) re-affirm constraints for clarity
	@IsOptional() @IsString() @MaxLength(50) firstName?: string;
	@IsOptional() @IsString() @MaxLength(50) lastName?: string;
	@IsOptional() @IsEmail() email?: string;
	@IsOptional() @Matches(/^[0-9+\-\s()]{7,20}$/) phone?: string;
	@IsOptional() @IsIn(['Admin','User']) role?: 'Admin'|'User';
	@IsOptional() @IsIn(['Active','Inactive']) status?: 'Active'|'Inactive';
}
