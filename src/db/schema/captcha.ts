import { mysqlTable, varchar, int, timestamp, boolean } from "drizzle-orm/mysql-core";

export const captchaSessions = mysqlTable("captcha_sessions", {
  id: varchar("id", { length: 36 }).primaryKey(),
  clientId: varchar("client_id", { length: 36 }).notNull(), // 客户端唯一ID
  puzzleX: int("puzzle_x").notNull(),
  puzzleY: int("puzzle_y").notNull(),
  imageIndex: int("image_index").notNull(),
  sessionFingerprint: varchar("session_fingerprint", { length: 64 }).notNull(),
  ipAddress: varchar("ip_address", { length: 45 }).notNull(), // 支持 IPv6
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  verified: boolean("verified").default(false).notNull(),
  verificationToken: varchar("verification_token", { length: 64 }),
});

export type CaptchaSession = typeof captchaSessions.$inferSelect;
export type NewCaptchaSession = typeof captchaSessions.$inferInsert;


