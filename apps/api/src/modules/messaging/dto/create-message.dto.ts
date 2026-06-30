import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { MessageType } from '@prisma/client';

export class CreateMessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  body: string;

  @IsOptional()
  @IsEnum(MessageType)
  messageType?: MessageType;
}
