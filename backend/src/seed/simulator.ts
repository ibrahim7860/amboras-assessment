import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../redis/redis.module';

const STORE_IDS = ['store_001', 'store_002', 'store_003'];

const EVENT_TYPES = [
  { type: 'page_view', weight: 0.6 },
  { type: 'add_to_cart', weight: 0.2 },
  { type: 'remove_from_cart', weight: 0.05 },
  { type: 'checkout_started', weight: 0.1 },
  { type: 'purchase', weight: 0.05 },
];

interface ProductRef {
  product_id: string;
  name: string;
  price: number;
}

function pickWeightedEventType(): string {
  const rand = Math.random();
  let cumulative = 0;
  for (const { type, weight } of EVENT_TYPES) {
    cumulative += weight;
    if (rand < cumulative) return type;
  }
  return 'page_view';
}

function buildEventData(
  eventType: string,
  product: ProductRef,
): Record<string, any> {
  switch (eventType) {
    case 'page_view':
      return {
        productId: product.product_id,
        productName: product.name,
        url: `/products/${product.product_id}`,
      };
    case 'add_to_cart': {
      const quantity = Math.ceil(Math.random() * 3);
      return {
        productId: product.product_id,
        productName: product.name,
        price: product.price,
        quantity,
      };
    }
    case 'remove_from_cart':
      return {
        productId: product.product_id,
        productName: product.name,
      };
    case 'checkout_started':
      return {
        productId: product.product_id,
        productName: product.name,
        cartTotal: +(product.price * Math.ceil(Math.random() * 3)).toFixed(2),
      };
    case 'purchase': {
      const qty = Math.ceil(Math.random() * 3);
      return {
        productId: product.product_id,
        productName: product.name,
        price: product.price,
        quantity: qty,
        revenue: +(product.price * qty).toFixed(2),
      };
    }
    default:
      return {};
  }
}

async function simulate() {
  console.log('Starting live event simulator...\n');

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  const dataSource = app.get(DataSource);
  const redis = app.get<Redis>(REDIS_CLIENT);

  // Load products for all stores
  const productsByStore: Record<string, ProductRef[]> = {};
  for (const storeId of STORE_IDS) {
    const rows = await dataSource.query(
      `SELECT product_id, name, price FROM products WHERE store_id = $1`,
      [storeId],
    );
    productsByStore[storeId] = rows.map(
      (r: { product_id: string; name: string; price: string }) => ({
        product_id: r.product_id,
        name: r.name,
        price: parseFloat(r.price),
      }),
    );
  }

  const totalProducts = Object.values(productsByStore).reduce(
    (sum, arr) => sum + arr.length,
    0,
  );
  console.log(`Loaded ${totalProducts} products across ${STORE_IDS.length} stores.`);
  console.log('Generating events at ~5-10/sec. Press Ctrl+C to stop.\n');

  let totalEvents = 0;
  let running = true;
  const startTime = Date.now();
  let lastReportTime = startTime;
  let eventsSinceLastReport = 0;

  function scheduleNext() {
    if (!running) return;
    const delay = 100 + Math.random() * 100; // 100-200ms
    setTimeout(generateEvent, delay);
  }

  async function generateEvent() {
    if (!running) return;

    try {
      const storeId = STORE_IDS[Math.floor(Math.random() * STORE_IDS.length)];
      const products = productsByStore[storeId];
      const product = products[Math.floor(Math.random() * products.length)];
      const eventType = pickWeightedEventType();
      const timestamp = new Date();
      const data = buildEventData(eventType, product);

      // Insert event into DB
      const result = await dataSource.query(
        `INSERT INTO events (store_id, event_type, timestamp, data)
         VALUES ($1, $2, $3, $4)
         RETURNING event_id`,
        [storeId, eventType, timestamp, JSON.stringify(data)],
      );

      const eventId = result[0].event_id;

      // Publish to Redis for SSE
      await redis.publish(
        `events:${storeId}`,
        JSON.stringify({ eventId, eventType, timestamp, data }),
      );

      // Upsert daily_store_metrics
      const todayStr = timestamp.toISOString().split('T')[0];
      const revenue = eventType === 'purchase' ? (data.revenue || 0) : 0;
      const pageViews = eventType === 'page_view' ? 1 : 0;
      const addToCart = eventType === 'add_to_cart' ? 1 : 0;
      const removeFromCart = eventType === 'remove_from_cart' ? 1 : 0;
      const checkoutStarted = eventType === 'checkout_started' ? 1 : 0;
      const purchases = eventType === 'purchase' ? 1 : 0;

      await dataSource.query(
        `INSERT INTO daily_store_metrics (id, store_id, date, revenue, page_views, add_to_cart, remove_from_cart, checkout_started, purchases)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (store_id, date) DO UPDATE SET
           revenue = daily_store_metrics.revenue + EXCLUDED.revenue,
           page_views = daily_store_metrics.page_views + EXCLUDED.page_views,
           add_to_cart = daily_store_metrics.add_to_cart + EXCLUDED.add_to_cart,
           remove_from_cart = daily_store_metrics.remove_from_cart + EXCLUDED.remove_from_cart,
           checkout_started = daily_store_metrics.checkout_started + EXCLUDED.checkout_started,
           purchases = daily_store_metrics.purchases + EXCLUDED.purchases`,
        [storeId, todayStr, revenue, pageViews, addToCart, removeFromCart, checkoutStarted, purchases],
      );

      totalEvents++;
      eventsSinceLastReport++;

      // Print stats every 5 seconds
      const now = Date.now();
      if (now - lastReportTime >= 5000) {
        const elapsed = (now - lastReportTime) / 1000;
        const rate = (eventsSinceLastReport / elapsed).toFixed(1);
        const totalElapsed = ((now - startTime) / 1000).toFixed(0);
        console.log(
          `[${totalElapsed}s] ${totalEvents} events total | ${rate} events/sec | last: ${storeId} ${eventType}`,
        );
        lastReportTime = now;
        eventsSinceLastReport = 0;
      }
    } catch (err) {
      console.error('Error generating event:', err);
    }

    scheduleNext();
  }

  // Graceful shutdown
  const shutdown = async () => {
    if (!running) return;
    running = false;
    console.log('\n\nShutting down simulator...');

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n=== Simulator Summary ===`);
    console.log(`  Total events: ${totalEvents}`);
    console.log(`  Duration:     ${elapsed}s`);
    console.log(`  Avg rate:     ${(totalEvents / (parseFloat(elapsed) || 1)).toFixed(1)} events/sec`);

    await app.close();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  // Start the loop
  scheduleNext();
}

simulate();
