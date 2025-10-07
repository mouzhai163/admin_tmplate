import { mysqlTable, varchar } from "drizzle-orm/mysql-core";

export const adminInfo = mysqlTable("admin_info", {
  id: varchar("id", { length: 36 }).primaryKey(),
  consoleName: varchar("consoleName", { length: 255 }).default("默认后台系统"),
})