import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsUUID,
  IsInt,
  IsNumber,
  IsArray,
  ValidateNested,
  IsPositive,
} from 'class-validator';

import { Type } from 'class-transformer';
class PlantOrder {
  @IsString()
  plantId: string;

  @IsNumber()
  quantity: number;

  @IsString()
  name: string;
}
export class CreateOrderDto {
  @IsString()
  @IsPositive()
  userId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlantOrder)
  plants: PlantOrder[];

  @IsNumber()
  @IsNotEmpty()
  total: number;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsNotEmpty()
  postcode: string;
}
