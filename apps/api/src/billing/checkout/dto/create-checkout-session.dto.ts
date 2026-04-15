import { IsBoolean, IsUrl } from 'class-validator';

export class CreateCheckoutSessionDto {
  @IsUrl({ protocols: ['https'], require_protocol: true })
  return_url: string;

  @IsBoolean()
  tokenization_requested: boolean;
}
