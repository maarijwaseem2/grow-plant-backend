import {
  IsNotEmpty,
  IsString,
  IsEmail,
  MinLength,
  Matches,
  IsIn,
} from 'class-validator';
import { UserRole } from '../userRole.enum';
import { errorMessages } from 'src/shared/constant/constant';

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  @Matches(/^[a-zA-Z]+$/, {
    message: errorMessages.name,
  })
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

  @IsNotEmpty()
  @IsString()
  @IsIn(Object.values(UserRole), {
    message: errorMessages.role,
  })
  role: UserRole;
}
