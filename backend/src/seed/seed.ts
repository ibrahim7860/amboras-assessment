import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

const STORES = [
  { storeId: 'store_001', email: 'alice@techstore.com', name: 'Alice Johnson' },
  { storeId: 'store_002', email: 'bob@fashionhub.com', name: 'Bob Smith' },
  { storeId: 'store_003', email: 'carol@homecraft.com', name: 'Carol Davis' },
];

const PRODUCTS_BY_STORE: Record<string, { name: string; price: number; category: string }[]> = {
  store_001: [
    { name: 'Mechanical Keyboard', price: 129.99, category: 'Electronics' },
    { name: 'Wireless Mouse', price: 59.99, category: 'Electronics' },
    { name: 'USB-C Hub', price: 49.99, category: 'Electronics' },
    { name: '27" 4K Monitor', price: 449.99, category: 'Electronics' },
    { name: 'Noise-Cancelling Headphones', price: 299.99, category: 'Electronics' },
    { name: '1TB NVMe SSD', price: 89.99, category: 'Electronics' },
    { name: 'Webcam HD 1080p', price: 69.99, category: 'Electronics' },
    { name: 'Laptop Stand', price: 39.99, category: 'Electronics' },
    { name: 'Bluetooth Speaker', price: 79.99, category: 'Electronics' },
    { name: 'Gaming Mousepad XL', price: 29.99, category: 'Electronics' },
    { name: 'USB Microphone', price: 119.99, category: 'Electronics' },
    { name: 'HDMI Cable 6ft', price: 12.99, category: 'Electronics' },
    { name: 'Wireless Charger', price: 34.99, category: 'Electronics' },
    { name: 'Portable Power Bank', price: 44.99, category: 'Electronics' },
    { name: 'Ethernet Adapter', price: 19.99, category: 'Electronics' },
    { name: 'Keyboard Wrist Rest', price: 24.99, category: 'Electronics' },
    { name: 'Screen Protector Pack', price: 14.99, category: 'Electronics' },
    { name: 'Cable Management Kit', price: 16.99, category: 'Electronics' },
    { name: 'LED Desk Lamp', price: 54.99, category: 'Electronics' },
    { name: 'Smart Plug 2-Pack', price: 27.99, category: 'Electronics' },
  ],
  store_002: [
    { name: 'Slim Fit Jeans', price: 69.99, category: 'Clothing' },
    { name: 'Running Sneakers', price: 119.99, category: 'Clothing' },
    { name: 'Leather Jacket', price: 249.99, category: 'Clothing' },
    { name: 'Cotton T-Shirt', price: 24.99, category: 'Clothing' },
    { name: 'Wool Sweater', price: 89.99, category: 'Clothing' },
    { name: 'Denim Shorts', price: 44.99, category: 'Clothing' },
    { name: 'Canvas Backpack', price: 64.99, category: 'Clothing' },
    { name: 'Silk Scarf', price: 39.99, category: 'Clothing' },
    { name: 'Baseball Cap', price: 19.99, category: 'Clothing' },
    { name: 'Aviator Sunglasses', price: 149.99, category: 'Clothing' },
    { name: 'Linen Shirt', price: 54.99, category: 'Clothing' },
    { name: 'Chino Pants', price: 59.99, category: 'Clothing' },
    { name: 'Fleece Hoodie', price: 49.99, category: 'Clothing' },
    { name: 'Leather Belt', price: 34.99, category: 'Clothing' },
    { name: 'Ankle Boots', price: 139.99, category: 'Clothing' },
    { name: 'Puffer Vest', price: 79.99, category: 'Clothing' },
    { name: 'Graphic Tee', price: 29.99, category: 'Clothing' },
    { name: 'Swim Trunks', price: 34.99, category: 'Clothing' },
    { name: 'Crossbody Bag', price: 44.99, category: 'Clothing' },
    { name: 'Knit Beanie', price: 22.99, category: 'Clothing' },
  ],
  store_003: [
    { name: 'Soy Candle Set', price: 29.99, category: 'Home & Garden' },
    { name: 'Cast Iron Skillet', price: 44.99, category: 'Home & Garden' },
    { name: 'Ceramic Vase', price: 34.99, category: 'Home & Garden' },
    { name: 'Throw Blanket', price: 49.99, category: 'Home & Garden' },
    { name: 'Herb Garden Kit', price: 24.99, category: 'Home & Garden' },
    { name: 'Wall Art Print', price: 39.99, category: 'Home & Garden' },
    { name: 'Bamboo Cutting Board', price: 22.99, category: 'Home & Garden' },
    { name: 'Essential Oil Diffuser', price: 36.99, category: 'Home & Garden' },
    { name: 'Linen Napkin Set', price: 19.99, category: 'Home & Garden' },
    { name: 'Decorative Pillow', price: 32.99, category: 'Home & Garden' },
    { name: 'Stoneware Mug Set', price: 27.99, category: 'Home & Garden' },
    { name: 'Garden Tool Set', price: 42.99, category: 'Home & Garden' },
    { name: 'Wooden Picture Frame', price: 18.99, category: 'Home & Garden' },
    { name: 'Cotton Bath Towels', price: 34.99, category: 'Home & Garden' },
    { name: 'Succulent Planter', price: 16.99, category: 'Home & Garden' },
    { name: 'Spice Rack Organizer', price: 28.99, category: 'Home & Garden' },
    { name: 'Scented Room Spray', price: 14.99, category: 'Home & Garden' },
    { name: 'Ceramic Dinner Plates', price: 54.99, category: 'Home & Garden' },
    { name: 'Woven Storage Basket', price: 26.99, category: 'Home & Garden' },
    { name: 'Glass Water Pitcher', price: 21.99, category: 'Home & Garden' },
  ],
};

const EVENT_TYPES = [
  { type: 'page_view', weight: 0.6 },
  { type: 'add_to_cart', weight: 0.2 },
  { type: 'remove_from_cart', weight: 0.05 },
  { type: 'checkout_started', weight: 0.1 },
  { type: 'purchase', weight: 0.05 },
];

function pickWeightedEventType(): string {
  const rand = Math.random();
  let cumulative = 0;
  for (const { type, weight } of EVENT_TYPES) {
    cumulative += weight;
    if (rand < cumulative) return type;
  }
  return 'page_view';
}

interface ProductRef {
  product_id: string;
  name: string;
  price: number;
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

async function seed() {
  console.log('Starting seed...\n');

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  const dataSource = app.get(DataSource);

  try {
    // Step 1: Clear existing data
    console.log('Step 1/5: Clearing existing data...');
    await dataSource.query(
      `TRUNCATE TABLE daily_store_metrics, events, products, users RESTART IDENTITY CASCADE`,
    );
    console.log('  Done.\n');

    // Step 2: Seed users
    console.log('Step 2/5: Seeding users...');
    const hashedPassword = await bcrypt.hash('password123', 10);

    await dataSource
      .createQueryBuilder()
      .insert()
      .into('users')
      .values(
        STORES.map((s) => ({
          email: s.email,
          password: hashedPassword,
          store_id: s.storeId,
          name: s.name,
        })),
      )
      .execute();

    console.log(`  Inserted ${STORES.length} users.\n`);

    // Step 3: Seed products
    console.log('Step 3/5: Seeding products...');
    const productsByStore: Record<string, ProductRef[]> = {};

    for (const storeId of Object.keys(PRODUCTS_BY_STORE)) {
      const result = await dataSource
        .createQueryBuilder()
        .insert()
        .into('products')
        .values(
          PRODUCTS_BY_STORE[storeId].map((p) => ({
            store_id: storeId,
            name: p.name,
            price: p.price,
            category: p.category,
          })),
        )
        .returning(['product_id', 'name', 'price'])
        .execute();

      productsByStore[storeId] = result.raw.map(
        (row: { product_id: string; name: string; price: string }) => ({
          product_id: row.product_id,
          name: row.name,
          price: parseFloat(row.price),
        }),
      );
    }

    const totalProducts = Object.values(productsByStore).reduce(
      (sum, arr) => sum + arr.length,
      0,
    );
    console.log(`  Inserted ${totalProducts} products.\n`);

    // Step 4: Generate events
    console.log('Step 4/5: Generating events...');
    const EVENTS_PER_STORE = 166_667;
    const BATCH_SIZE = 5_000;
    const now = new Date();
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const timeRange = now.getTime() - ninetyDaysAgo.getTime();

    let totalEvents = 0;

    for (const storeId of Object.keys(productsByStore)) {
      const products = productsByStore[storeId];
      let storeEvents = 0;

      while (storeEvents < EVENTS_PER_STORE) {
        const batchSize = Math.min(BATCH_SIZE, EVENTS_PER_STORE - storeEvents);
        const values: {
          store_id: string;
          event_type: string;
          timestamp: Date;
          data: Record<string, any>;
        }[] = [];

        for (let i = 0; i < batchSize; i++) {
          const eventType = pickWeightedEventType();
          const product = products[Math.floor(Math.random() * products.length)];
          const timestamp = new Date(
            ninetyDaysAgo.getTime() + Math.random() * timeRange,
          );

          values.push({
            store_id: storeId,
            event_type: eventType,
            timestamp,
            data: buildEventData(eventType, product),
          });
        }

        await dataSource
          .createQueryBuilder()
          .insert()
          .into('events')
          .values(values)
          .execute();

        storeEvents += batchSize;
        totalEvents += batchSize;

        process.stdout.write(
          `\r  Progress: ${totalEvents.toLocaleString()} events inserted...`,
        );
      }
    }

    console.log(
      `\n  Inserted ${totalEvents.toLocaleString()} events total.\n`,
    );

    // Step 5: Pre-compute daily metrics + create partial index
    console.log('Step 5/5: Pre-computing daily metrics...');

    await dataSource.query(`
      INSERT INTO daily_store_metrics (id, store_id, date, revenue, page_views, add_to_cart, remove_from_cart, checkout_started, purchases)
      SELECT
        gen_random_uuid(),
        e.store_id,
        e.timestamp::date,
        COALESCE(SUM(CASE WHEN e.event_type = 'purchase' THEN (e.data->>'revenue')::decimal ELSE 0 END), 0),
        COUNT(*) FILTER (WHERE e.event_type = 'page_view'),
        COUNT(*) FILTER (WHERE e.event_type = 'add_to_cart'),
        COUNT(*) FILTER (WHERE e.event_type = 'remove_from_cart'),
        COUNT(*) FILTER (WHERE e.event_type = 'checkout_started'),
        COUNT(*) FILTER (WHERE e.event_type = 'purchase')
      FROM events e
      GROUP BY e.store_id, e.timestamp::date
      ON CONFLICT (store_id, date) DO UPDATE SET
        revenue = EXCLUDED.revenue,
        page_views = EXCLUDED.page_views,
        add_to_cart = EXCLUDED.add_to_cart,
        remove_from_cart = EXCLUDED.remove_from_cart,
        checkout_started = EXCLUDED.checkout_started,
        purchases = EXCLUDED.purchases
    `);

    const metricsCount = await dataSource.query(
      `SELECT COUNT(*) as count FROM daily_store_metrics`,
    );
    console.log(
      `  Computed ${metricsCount[0].count} daily metric records.\n`,
    );

    // Create partial index for purchase events
    await dataSource.query(`
      CREATE INDEX IF NOT EXISTS IDX_events_store_timestamp_purchase
      ON events (store_id, timestamp) WHERE event_type = 'purchase'
    `);
    console.log('  Created partial index for purchase events.\n');

    // Summary
    console.log('=== Seed Complete ===');
    console.log(`  Users:          ${STORES.length}`);
    console.log(`  Products:       ${totalProducts}`);
    console.log(`  Events:         ${totalEvents.toLocaleString()}`);
    console.log(`  Daily metrics:  ${metricsCount[0].count}`);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

seed();
