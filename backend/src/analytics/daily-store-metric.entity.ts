import { Entity, PrimaryGeneratedColumn, Column, Unique } from 'typeorm';

@Entity('daily_store_metrics')
@Unique(['store_id', 'date'])
export class DailyStoreMetric {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  store_id: string;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  revenue: number;

  @Column({ type: 'int', default: 0 })
  page_views: number;

  @Column({ type: 'int', default: 0 })
  add_to_cart: number;

  @Column({ type: 'int', default: 0 })
  remove_from_cart: number;

  @Column({ type: 'int', default: 0 })
  checkout_started: number;

  @Column({ type: 'int', default: 0 })
  purchases: number;
}
