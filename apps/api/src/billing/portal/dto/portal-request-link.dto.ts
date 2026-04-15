import { IsEmail, MaxLength } from 'class-validator';

export class PortalRequestLinkDto {
  @IsEmail()
  @MaxLength(160)
  email: string;
}
