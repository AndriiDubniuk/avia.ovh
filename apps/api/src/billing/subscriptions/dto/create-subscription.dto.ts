import { Type } from 'class-transformer';
import {
  Equals,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { SubscriptionInterval } from '../enums/subscription-interval.enum';

export class ClientPayloadDto {
  @IsString()
  @MaxLength(120)
  external_ref: string;

  @IsString()
  @MaxLength(160)
  name: string;

  @IsEmail()
  @MaxLength(160)
  email: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;
}

export class PlanPayloadDto {
  @IsInt()
  @Min(100)
  amount_minor: number;

  @Equals('UAH')
  currency: 'UAH';

  @IsEnum(SubscriptionInterval)
  interval: SubscriptionInterval;
}

export class CreateSubscriptionDto {
  @ValidateNested()
  @Type(() => ClientPayloadDto)
  client: ClientPayloadDto;

  @ValidateNested()
  @Type(() => PlanPayloadDto)
  plan: PlanPayloadDto;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  timezone?: string;

  @Equals('immediate')
  start_mode: 'immediate';
}
