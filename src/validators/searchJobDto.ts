// src/validators/SearchJobsDto.ts
import { IsOptional, IsInt, Min, IsArray, IsString, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';
import { JobStatus } from '@prisma/client';

export class SearchJobsDto {
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @IsOptional()
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') return [value];
    return undefined;
  })
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsEnum(JobStatus)
  status?: JobStatus;
}