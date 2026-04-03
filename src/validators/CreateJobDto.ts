// src/validators/CreateJobDto.ts
import { IsString, IsNumber, IsArray, Min, Max } from 'class-validator';

export class CreateJobDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsNumber()
  @Min(0)
  @Max(1000000)
  budget: number;

  @IsArray()
  @IsString({ each: true })
  tags: string[];
}