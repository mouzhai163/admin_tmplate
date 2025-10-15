import * as U from "./schema/auth-schema";
import type { InferSelectModel, InferInsertModel } from "drizzle-orm";

/**
 * schema推导数据类型文件
 */
export type User = InferSelectModel<typeof U.user>;
export type NewUser = InferInsertModel<typeof U.user>;
export type Session = InferSelectModel<typeof U.session>;
export type NewSession = InferInsertModel<typeof U.session>;
export type Account = InferSelectModel<typeof U.account>;
export type NewAccount = InferInsertModel<typeof U.account>;
export type Verification = InferSelectModel<typeof U.verification>;
export type NewVerification = InferInsertModel<typeof U.verification>;


