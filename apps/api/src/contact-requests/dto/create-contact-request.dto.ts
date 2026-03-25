import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateContactRequestDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  companyName?: string;

  @IsEmail()
  @MaxLength(160)
  email: string;

  @IsString()
  @MinLength(3)
  @MaxLength(80)
  contact: string;

  @IsString()
  @MinLength(3)
  @MaxLength(160)
  serviceName: string;

  @IsString()
  @MinLength(10)
  message: string;
}
