import {
  IsNotEmpty,
  IsString,
  IsEmail,
  MinLength,
  IsIn,
  IsOptional,
} from 'class-validator';
import { UserRole } from '../userRole.enum';
import { errorMessages } from 'src/shared/constant/constant';

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  username: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(5)
  password: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(5)
  rePassword: string;

  @IsOptional()
  @IsString()
  mobile?: string;

  @IsOptional()
  @IsString()
  province?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  nic?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  bikeDetails?: string;

  @IsOptional()
  @IsString()
  bikeName?: string;

  @IsOptional()
  @IsString()
  bikeNumber?: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsString()
  experience?: string;

  @IsOptional()
  @IsString()
  services?: string;

  @IsNotEmpty()
  @IsString()
  @IsIn(Object.values(UserRole), {
    message: errorMessages.role,
  })
  role: UserRole;
}
