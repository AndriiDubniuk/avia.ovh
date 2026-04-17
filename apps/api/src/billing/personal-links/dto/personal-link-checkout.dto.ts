import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class PersonalLinkCheckoutDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  customerName: string;

  @IsEmail()
  @MaxLength(160)
  customerEmail: string;
}
