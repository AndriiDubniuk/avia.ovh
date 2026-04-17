import {
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreatePersonalBillingLinkDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  planCode: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  customerName?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(320)
  customerEmail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  companyName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  timezone?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(24 * 30)
  expiresInHours?: number;
}
