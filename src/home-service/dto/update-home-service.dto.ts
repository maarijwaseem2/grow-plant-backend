import { PartialType } from '@nestjs/mapped-types';
import { CreateHomeServiceDto } from './create-home-service.dto';

export class UpdateHomeServiceDto extends PartialType(CreateHomeServiceDto) {}
