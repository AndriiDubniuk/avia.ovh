import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateBillingCheckoutDto {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  planCode: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  customerName: string;

  @IsEmail()
  @MaxLength(160)
  customerEmail: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  companyName?: string;
}
