import {
  IsNumber,
  IsBoolean,
  IsOptional,
  IsPositive,
  IsNotEmpty,
  ValidateNested,
  IsArray,
  IsString,
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
export class CreateServiceDto {
  @IsString()
userId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlantOrder)
  plants: PlantOrder[];

  @IsNumber()
  @IsNotEmpty()
  total: number;

  @IsNumber()
  @IsNotEmpty()
  latitude: number;

  @IsNumber()
  @IsNotEmpty()
  longitude: number;

  @IsString()
  locationName: string;

  @IsBoolean()
  @IsNotEmpty()
  isSubscription: boolean;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  subscriptionMonths?: number; // Optional if not subscribing

  @IsString()
  @IsNotEmpty()
  image?: string | File;
}
