import { IsEmail, IsString } from 'class-validator';

export class TenantLoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}
