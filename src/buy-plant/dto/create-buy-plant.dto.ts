import {
  IsInt,
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
} from 'class-validator';
export enum PlantCategory {
  INDOOR_PLANTS = 'Indoor Plants',
  OUTDOOR_PLANTS = 'Outdoor Plants',
  FRUITS = 'Fruits',
  FLOWERS = 'Flowers',
  VEGETABLES = 'Vegetables',
  HERBS = 'Herbs',
}
export class CreateBuyPlantDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsInt()
  price: number;

  @IsNotEmpty()
  @IsInt()
  quantity: number;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsOptional()
  reservedQuantity: number;

  @IsNotEmpty()
  @IsEnum(PlantCategory)
  category: PlantCategory;

  @IsOptional()
  image?: string | File;
}
