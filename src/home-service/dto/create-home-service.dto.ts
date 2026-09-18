import {
  IsNotEmpty,
  IsString,
  IsUUID,
  IsNumber,
  IsPositive,
  IsArray,
  ValidateNested,
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

export class CreateHomeServiceDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlantOrder)
  plants: PlantOrder[];

  @IsNumber()
  @IsNotEmpty()
  total: number;

  @IsNotEmpty()
  @IsString()
  location: string;

  @IsNotEmpty()
  @IsString()
  address: string;

  // BuyPlant entity ka ID
}
