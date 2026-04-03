// src/validators/RegisterDto.ts
import { IsEmail, IsString, MinLength, IsEnum, IsOptional, IsArray, ArrayMinSize } from 'class-validator';
import { UserRole } from '@prisma/client';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsEnum(UserRole)
  role: UserRole;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  skills?: string[];

  @IsOptional()
  @IsString()
  bio?: string;
}