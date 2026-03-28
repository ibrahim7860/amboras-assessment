import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Redis from 'ioredis';
import { Observable } from 'rxjs';
import { MessageEvent } from '@nestjs/common';
import { Event } from '../events/event.entity';
import { DailyStoreMetric } from './daily-store-metric.entity';
import { REDIS_CLIENT } from '../redis/redis.module';
import { Period } from './dto/overview-query.dto';

export interface OverviewResult {
  revenue: number;
  eventCounts: {
    page_views: number;
    add_to_cart: number;
    remove_from_cart: number;
    checkout_started: number;
    purchases: number;
  };
  conversionRate: number;
}

export interface TopProductResult {
  productId: string;
  productName: string;
  revenue: number;
  unitsSold: number;
}

export interface RecentActivityResult {
  eventId: string;
  eventType: string;
  timestamp: Date;
  data: Record<string, any> | null;
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectRepository(Event)
    private readonly eventRepo: Repository<Event>,
    @InjectRepository(DailyStoreMetric)
    private readonly metricRepo: Repository<DailyStoreMetric>,
    @Inject(REDIS_CLIENT)
    private readonly redis: Redis,
  ) {}

  getEventStream(storeId: string): Observable<MessageEvent> {
    return new Observable<MessageEvent>((subscriber) => {
      const sub = this.redis.duplicate();
      const channel = `events:${storeId}`;

      sub.subscribe(channel).catch((err) => {
        this.logger.error(`Failed to subscribe to ${channel}: ${err.message}`);
        subscriber.error(err);
      });

      sub.on('message', (_ch: string, message: string) => {
        try {
          const parsed = JSON.parse(message);
          subscriber.next({
            data: parsed,
            id: parsed.eventId,
            type: 'event',
          });
        } catch (err) {
          this.logger.warn(`Failed to parse event message: ${err}`);
        }
      });

      return () => {
        sub.unsubscribe(channel).then(() => sub.quit()).catch(() => sub.disconnect());
      };
    });
  }

  async getOverview(
    storeId: string,
    period: Period,
    startDate?: string,
    endDate?: string,
  ): Promise<OverviewResult> {
    const cacheKey = `overview:${storeId}:${period}:${startDate || ''}:${endDate || ''}`;
    const cached = await this.cacheGet<OverviewResult>(cacheKey);
    if (cached) return cached;

    let result: OverviewResult;

    if (startDate && endDate) {
      result = await this.aggregateFromMetrics(storeId, startDate, endDate);
    } else if (period === Period.TODAY) {
      result = await this.aggregateFromEvents(storeId);
    } else {
      const days = period === Period.WEEK ? 7 : 30;
      const start = new Date();
      start.setDate(start.getDate() - days);
      result = await this.aggregateFromMetrics(
        storeId,
        start.toISOString().split('T')[0],
        new Date().toISOString().split('T')[0],
      );
    }

    await this.cacheSet(cacheKey, result, 30);
    return result;
  }

  async getTopProducts(storeId: string, period: Period, limit: number): Promise<TopProductResult[]> {
    const cacheKey = `top-products:${storeId}:${period}:${limit}`;
    const cached = await this.cacheGet<TopProductResult[]>(cacheKey);
    if (cached) return cached;

    const periodStart = this.getPeriodStart(period);

    const rows = await this.eventRepo
      .createQueryBuilder('e')
      .select("e.data->>'productId'", 'productId')
      .addSelect("e.data->>'productName'", 'productName')
      .addSelect("SUM((e.data->>'revenue')::decimal)", 'revenue')
      .addSelect("COUNT(*)::int", 'unitsSold')
      .where('e.store_id = :storeId', { storeId })
      .andWhere('e.event_type = :type', { type: 'purchase' })
      .andWhere('e.timestamp >= :start', { start: periodStart })
      .groupBy("e.data->>'productId'")
      .addGroupBy("e.data->>'productName'")
      .orderBy('revenue', 'DESC')
      .limit(limit)
      .getRawMany();

    const result = rows.map((r) => ({
      productId: r.productId,
      productName: r.productName,
      revenue: parseFloat(r.revenue) || 0,
      unitsSold: parseInt(r.unitsSold, 10) || 0,
    }));

    await this.cacheSet(cacheKey, result, 60);
    return result;
  }

  async getRecentActivity(storeId: string, limit: number): Promise<RecentActivityResult[]> {
    const events = await this.eventRepo.find({
      where: { store_id: storeId },
      order: { timestamp: 'DESC' },
      take: limit,
    });

    return events.map((e) => ({
      eventId: e.event_id,
      eventType: e.event_type,
      timestamp: e.timestamp,
      data: e.data,
    }));
  }

  private async aggregateFromEvents(storeId: string) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const rows = await this.eventRepo
      .createQueryBuilder('e')
      .select('e.event_type', 'eventType')
      .addSelect('COUNT(*)::int', 'count')
      .where('e.store_id = :storeId', { storeId })
      .andWhere('e.timestamp >= :start', { start: todayStart })
      .groupBy('e.event_type')
      .getRawMany();

    const revenueRow = await this.eventRepo
      .createQueryBuilder('e')
      .select("COALESCE(SUM((e.data->>'revenue')::decimal), 0)", 'revenue')
      .where('e.store_id = :storeId', { storeId })
      .andWhere('e.event_type = :type', { type: 'purchase' })
      .andWhere('e.timestamp >= :start', { start: todayStart })
      .getRawOne();

    const counts: Record<string, number> = {};
    for (const row of rows) {
      counts[row.eventType] = row.count;
    }

    const pageViews = counts['page_view'] || 0;
    const purchases = counts['purchase'] || 0;

    return {
      revenue: parseFloat(revenueRow?.revenue) || 0,
      eventCounts: {
        page_views: pageViews,
        add_to_cart: counts['add_to_cart'] || 0,
        remove_from_cart: counts['remove_from_cart'] || 0,
        checkout_started: counts['checkout_started'] || 0,
        purchases,
      },
      conversionRate: pageViews > 0 ? purchases / pageViews : 0,
    };
  }

  private async aggregateFromMetrics(
    storeId: string,
    startDate: string,
    endDate: string,
  ) {
    const row = await this.metricRepo
      .createQueryBuilder('m')
      .select('COALESCE(SUM(m.revenue), 0)', 'revenue')
      .addSelect('COALESCE(SUM(m.page_views), 0)::int', 'pageViews')
      .addSelect('COALESCE(SUM(m.add_to_cart), 0)::int', 'addToCart')
      .addSelect('COALESCE(SUM(m.remove_from_cart), 0)::int', 'removeFromCart')
      .addSelect('COALESCE(SUM(m.checkout_started), 0)::int', 'checkoutStarted')
      .addSelect('COALESCE(SUM(m.purchases), 0)::int', 'purchases')
      .where('m.store_id = :storeId', { storeId })
      .andWhere('m.date >= :startDate', { startDate })
      .andWhere('m.date <= :endDate', { endDate })
      .getRawOne();

    const pageViews = parseInt(row?.pageViews, 10) || 0;
    const purchases = parseInt(row?.purchases, 10) || 0;

    return {
      revenue: parseFloat(row?.revenue) || 0,
      eventCounts: {
        page_views: pageViews,
        add_to_cart: parseInt(row?.addToCart, 10) || 0,
        remove_from_cart: parseInt(row?.removeFromCart, 10) || 0,
        checkout_started: parseInt(row?.checkoutStarted, 10) || 0,
        purchases,
      },
      conversionRate: pageViews > 0 ? purchases / pageViews : 0,
    };
  }

  private async cacheGet<T>(key: string): Promise<T | null> {
    try {
      const cached = await this.redis.get(key);
      return cached ? (JSON.parse(cached) as T) : null;
    } catch (err) {
      this.logger.warn(`Redis GET failed for ${key}: ${err}`);
      return null;
    }
  }

  private async cacheSet(key: string, value: unknown, ttl: number): Promise<void> {
    try {
      await this.redis.set(key, JSON.stringify(value), 'EX', ttl);
    } catch (err) {
      this.logger.warn(`Redis SET failed for ${key}: ${err}`);
    }
  }

  private getPeriodStart(period: Period): Date {
    const now = new Date();
    if (period === Period.TODAY) {
      now.setHours(0, 0, 0, 0);
      return now;
    }
    const days = period === Period.WEEK ? 7 : 30;
    now.setDate(now.getDate() - days);
    return now;
  }
}
