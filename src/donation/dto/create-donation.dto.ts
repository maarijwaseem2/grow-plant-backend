import {
  IsInt,
  Min,
  Max,
  IsString,
  IsPositive,
  IsNumber,
  IsNotEmpty,
} from 'class-validator';

export class CreateDonationDto {
  @IsString()
  @IsPositive()
  userId: string;

  @IsInt()
  @Min(1, { message: 'You must donate at least 1 plant.' })
  @Max(200, { message: 'You cannot donate more than 200 plants.' })
  quantity: number;

  @IsNumber()
  @IsNotEmpty()
  total: number;
}
