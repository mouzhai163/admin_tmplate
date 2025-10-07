// schema.ts
import { mysqlTable, varchar, boolean, text } from "drizzle-orm/mysql-core";

export const websiteInfo = mysqlTable("website_info", {
  id: varchar("id", { length: 36 }).primaryKey(),
  siteName: varchar("siteName", { length: 255 }).default("NextJS后台模板"),
  siteDesc: text("siteDesc").default("遇事不决可问春风,春风不语即问本心"),
  siteKeywords: text("siteKeywords").default("NextJS后台模板,后台模板"),
  siteLogo: text("siteLogo"),
  isSingleUser: boolean("isSingleUser").default(false),
});
