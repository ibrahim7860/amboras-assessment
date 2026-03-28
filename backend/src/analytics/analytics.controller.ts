import { Controller, Get, MessageEvent, Query, Sse, UseGuards } from '@nestjs/common';
import { Observable } from 'rxjs';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AnalyticsService } from './analytics.service';
import { ViewersService } from './viewers.service';
import { OverviewQueryDto } from './dto/overview-query.dto';
import { TopProductsQueryDto } from './dto/top-products-query.dto';
import { RecentActivityQueryDto } from './dto/recent-activity-query.dto';

@Controller('api/v1/analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly viewersService: ViewersService,
  ) {}

  @Get('viewers/count')
  async getViewerCount(
    @CurrentUser() user: { storeId: string },
  ) {
    const count = await this.viewersService.getViewerCount(user.storeId);
    return { count };
  }

  @Sse('viewers/stream')
  getViewerStream(
    @CurrentUser() user: { userId: string; storeId: string },
  ): Observable<MessageEvent> {
    return this.viewersService.getViewerStream(user.storeId, user.userId);
  }

  @Sse('events/stream')
  getEventStream(
    @CurrentUser() user: { storeId: string },
  ): Observable<MessageEvent> {
    return this.analyticsService.getEventStream(user.storeId);
  }

  @Get('overview')
  getOverview(
    @CurrentUser() user: { storeId: string },
    @Query() query: OverviewQueryDto,
  ) {
    return this.analyticsService.getOverview(
      user.storeId,
      query.period,
      query.startDate,
      query.endDate,
    );
  }

  @Get('top-products')
  getTopProducts(
    @CurrentUser() user: { storeId: string },
    @Query() query: TopProductsQueryDto,
  ) {
    return this.analyticsService.getTopProducts(
      user.storeId,
      query.period,
      query.limit,
    );
  }

  @Get('recent-activity')
  getRecentActivity(
    @CurrentUser() user: { storeId: string },
    @Query() query: RecentActivityQueryDto,
  ) {
    return this.analyticsService.getRecentActivity(user.storeId, query.limit);
  }
}
