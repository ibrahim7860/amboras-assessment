import { IsOptional, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { Period } from './overview-query.dto';

export class TopProductsQueryDto {
  @IsOptional()
  @IsEnum(Period)
  period: Period = Period.TODAY;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 10;
}
