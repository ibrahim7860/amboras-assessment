import {
  Global,
  Module,
  Inject,
  OnApplicationShutdown,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export const REDIS_CLIENT = 'REDIS_CLIENT';

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: (configService: ConfigService) => {
        const logger = new Logger('RedisModule');

        const redis = new Redis({
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
          maxRetriesPerRequest: 3,
          retryStrategy(times) {
            return Math.min(times * 50, 2000);
          },
          lazyConnect: true,
          connectionName: 'analytics-api',
        });

        redis.on('connect', () => logger.log('Redis connected'));
        redis.on('ready', () => logger.log('Redis ready'));
        redis.on('close', () => logger.warn('Redis connection closed'));
        redis.on('reconnecting', () => logger.warn('Redis reconnecting...'));
        redis.on('error', (err) => logger.error(`Redis error: ${err.message}`));

        redis.connect().catch((err) => {
          logger.error(`Redis initial connection failed: ${err.message}`);
        });

        return redis;
      },
      inject: [ConfigService],
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule implements OnApplicationShutdown {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async onApplicationShutdown() {
    await this.redis.quit();
  }
}
