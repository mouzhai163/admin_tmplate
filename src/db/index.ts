import 'dotenv/config';
import { drizzle } from "drizzle-orm/mysql2";
import mysql from 'mysql2/promise';

// 声明全局类型，避免 TypeScript 错误
declare global {
  var dbConnection: mysql.Pool | undefined;
}

// 创建连接池（使用单例模式，防止开发环境热重载时重复创建）
let pool: mysql.Pool;

if (process.env.NODE_ENV === 'production') {
  // 生产环境：直接创建连接池
  pool = mysql.createPool({
    uri: process.env.DATABASE_URL as string,
    waitForConnections: true,
    connectionLimit: 10,  // 最大连接数
    queueLimit: 0,        // 队列限制（0 表示无限制）
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
  });
} else {
  // 开发环境：使用全局变量缓存连接池，防止热重载时重复创建
  if (!global.dbConnection) {
    global.dbConnection = mysql.createPool({
      uri: process.env.DATABASE_URL as string,
      waitForConnections: true,
      connectionLimit: 10,  // 最大连接数
      queueLimit: 0,        // 队列限制（0 表示无限制）
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
    });
  }
  pool = global.dbConnection;
}

const db = drizzle(pool);

export default db;