// src/validators/CreateMessageDto.ts
import { IsUUID, IsString, MinLength } from 'class-validator';

export class CreateMessageDto {
  @IsUUID()
  applicationId: string;

  @IsString()
  @MinLength(1)
  content: string;
}