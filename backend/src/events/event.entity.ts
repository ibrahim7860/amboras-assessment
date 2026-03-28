import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
} from 'typeorm';

@Entity('events')
@Index('IDX_events_store_timestamp', ['store_id', 'timestamp'])
@Index('IDX_events_store_type_timestamp', ['store_id', 'event_type', 'timestamp'])
export class Event {
  @PrimaryGeneratedColumn('uuid')
  event_id: string;

  @Column({ type: 'varchar' })
  store_id: string;

  @Column({ type: 'varchar' })
  event_type: string;

  @Column({ type: 'timestamp' })
  timestamp: Date;

  @Column({ type: 'jsonb', nullable: true })
  data: Record<string, any> | null;
}
