import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';

export class RegisterAgencyDto {
  @IsString()
  agencyName: string;

  @IsString()
  agencySlug: string;

  @IsEmail()
  agencyEmail: string;

  @IsOptional()
  @IsString()
  agencyPhone?: string;

  @IsEmail()
  ownerEmail: string;

  @IsString()
  @MinLength(2)
  ownerFirstName: string;

  @IsString()
  @MinLength(2)
  ownerLastName: string;

  @IsString()
  @MinLength(8)
  password: string;
}
