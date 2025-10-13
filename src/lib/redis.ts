import { Redis } from "@upstash/redis";

// Upstash SDK 自动从环境变量读取，不需要连接池
export const redis = Redis.fromEnv();
