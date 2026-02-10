// UPLOAD LEARN 7b: Redis là in-memory DB siêu nhanh, dùng làm message broker cho job queue.
// maxRetriesPerRequest=null là yêu cầu bắt buộc của BullMQ.

import IORedis from 'ioredis';
import { config } from './index';

export function createRedisConnection(): IORedis {
  return new IORedis({
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password,
    maxRetriesPerRequest: null, // Required by BullMQ
  });
}

// Singleton connection for general use
let redisConnection: IORedis | null = null;

export function getRedisConnection(): IORedis {
  if (!redisConnection) {
    redisConnection = createRedisConnection();
  }
  return redisConnection;
}

export async function closeRedisConnection(): Promise<void> {
  if (redisConnection) {
    await redisConnection.quit();
    redisConnection = null;
  }
}
