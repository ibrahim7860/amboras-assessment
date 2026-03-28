import { IsEnum, IsOptional, IsDateString } from 'class-validator';

export enum Period {
  TODAY = 'today',
  WEEK = 'week',
  MONTH = 'month',
}

export class OverviewQueryDto {
  @IsOptional()
  @IsEnum(Period)
  period: Period = Period.TODAY;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
