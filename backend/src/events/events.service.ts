import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Redis from 'ioredis';
import { Event } from './event.entity';
import { REDIS_CLIENT } from '../redis/redis.module';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private readonly eventRepo: Repository<Event>,
    @Inject(REDIS_CLIENT)
    private readonly redis: Redis,
  ) {}

  async ingestEvent(payload: {
    store_id: string;
    event_type: string;
    timestamp: string;
    data: Record<string, any> | null;
  }): Promise<Event> {
    const event = this.eventRepo.create({
      store_id: payload.store_id,
      event_type: payload.event_type,
      timestamp: new Date(payload.timestamp),
      data: payload.data,
    });

    const saved = await this.eventRepo.save(event);

    const message = JSON.stringify({
      eventId: saved.event_id,
      eventType: saved.event_type,
      timestamp: saved.timestamp,
      data: saved.data,
    });

    await this.redis.publish(`events:${saved.store_id}`, message);

    return saved;
  }
}
