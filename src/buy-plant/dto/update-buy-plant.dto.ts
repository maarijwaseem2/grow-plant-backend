import { PartialType } from '@nestjs/mapped-types';
import { CreateBuyPlantDto } from './create-buy-plant.dto';

export class UpdateBuyPlantDto extends PartialType(CreateBuyPlantDto) {}
