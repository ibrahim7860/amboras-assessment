import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DailyStoreMetric } from './daily-store-metric.entity';
import { Event } from '../events/event.entity';
import { EventsModule } from '../events/events.module';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { ViewersService } from './viewers.service';

@Module({
  imports: [TypeOrmModule.forFeature([DailyStoreMetric, Event]), EventsModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, ViewersService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
