import { Inject, Injectable, Logger, MessageEvent } from '@nestjs/common';
import { Observable } from 'rxjs';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../redis/redis.module';

@Injectable()
export class ViewersService {
  private readonly logger = new Logger(ViewersService.name);

  constructor(
    @Inject(REDIS_CLIENT)
    private readonly redis: Redis,
  ) {}

  private key(storeId: string): string {
    return `dashboard_viewers:${storeId}`;
  }

  async addViewer(storeId: string, userId: string): Promise<void> {
    await this.redis.hset(this.key(storeId), userId, Date.now().toString());
  }

  async removeViewer(storeId: string, userId: string): Promise<void> {
    await this.redis.hdel(this.key(storeId), userId);
  }

  async getViewerCount(storeId: string): Promise<number> {
    return this.redis.hlen(this.key(storeId));
  }

  getViewerStream(storeId: string, userId: string): Observable<MessageEvent> {
    return new Observable<MessageEvent>((subscriber) => {
      const sendCount = async () => {
        try {
          const count = await this.getViewerCount(storeId);
          subscriber.next({ data: { count } } as MessageEvent);
        } catch (err) {
          this.logger.warn(`Failed to get viewer count: ${err}`);
        }
      };

      // Register viewer first, then send initial count
      this.addViewer(storeId, userId)
        .then(() => sendCount())
        .catch((err) =>
          this.logger.warn(`Failed to register viewer: ${err.message}`),
        );

      const interval = setInterval(sendCount, 5000);

      return () => {
        clearInterval(interval);
        this.removeViewer(storeId, userId).catch((err) =>
          this.logger.warn(`Failed to remove viewer: ${err.message}`),
        );
      };
    });
  }
}
