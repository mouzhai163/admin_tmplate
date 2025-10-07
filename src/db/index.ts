import 'dotenv/config';
import { drizzle } from "drizzle-orm/mysql2";
import mysql from 'mysql2/promise';

// 创建带时区参数的连接
const connection = await mysql.createConnection({
  uri: process.env.DATABASE_URL as string,
});

const db = drizzle(connection);

export default db;