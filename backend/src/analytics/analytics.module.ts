import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DailyStoreMetric } from './daily-store-metric.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DailyStoreMetric])],
  exports: [TypeOrmModule],
})
export class AnalyticsModule {}
