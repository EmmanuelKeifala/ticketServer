/** @format */

import {Redis} from 'ioredis';
require('dotenv').config();

// Redis client function
const redisClient = () => {
  if (process.env.REDIS_URL) {
    console.log(`Redis Connect`);
    return process.env.REDIS_URL;
  }
  throw new Error('Redis connection failed');
};

export const redis = new Redis(redisClient());
