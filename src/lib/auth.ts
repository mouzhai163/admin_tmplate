import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createAuthMiddleware, APIError } from "better-auth/api";
import db from "@/db";
import { session, user } from "@/db/schema/auth-schema";
import { eq, and, ne } from "drizzle-orm";
import * as schema from "@/db/schema/auth-schema";
import { websiteInfo } from "@/db/schema/webSite_info";
import mailer from "./mailer";
import { nextCookies } from "better-auth/next-js";
import { validateCaptchaToken } from "./captcha-validator";
import { logger } from "./myUtils";

export const auth = betterAuth({
  emailAndPassword: {
    enabled: true,
    //关闭注册后自动登录
    autoSignIn: false,
    // 用户必须先验证邮箱才能登录
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      await mailer.sendPasswordResetEmail(user.email, url, user.name);
    },
    onPasswordReset: async ({ user }) => {
      console.log("密码重置成功:", user.email);
    },
  },

  database: drizzleAdapter(db, {
    provider: "mysql", // 或 "mongodb", "postgresql", ...等
    schema, //需要你显式传入包含所有表的 schema 对象（含 user 表）
  }),
  session: {
    // cookie缓存,但是会影响到封禁账号登录的时候下发的token依旧在maxAge时间内有效
    // cookieCache: {
    //   enabled: true,
    //   maxAge: 60, // 60 秒
    // },
    expiresIn: 60 * 60 * 24 * 7, // 7 天
    updateAge: 60 * 60 * 24, // 1 天（每过一天更新会话过期时间）
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      // 创建一个超时 Promise
      const timeout = new Promise((_, reject) => {
        setTimeout(
          () => reject(new Error("邮件函数 - 邮件发送超时!请重试!")),
          10000
        ); // 10秒超时
      });
      // 替换掉回调网页
      url = url.replace("callbackURL=/","callbackURL=/verify-success")
      // 邮件发送 Promise
      const sendEmail = mailer.sendVerificationEmail(
        user.email,
        url,
        user.name
      );

      try {
        // 使用 Promise.race 竞速,哪个先完成就用哪个
        await Promise.race([sendEmail, timeout]);
        console.log("邮件函数 - 验证邮件发送成功:", user.email);
      } catch (error) {
        // 超时或发送失败,只记录错误,不影响注册流程
        console.error("邮件函数 - 验证邮件发送失败:", error);
      }
    },
    // 验证后自动登录
    // autoSignInAfterVerification : false,
    // 验证邮件过期时间
    expiresIn: 3600, // 1小时
  },
  // 扩展User表
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "user",
        input: false, // 不允许注册时由用户提交
      },
      banned: { type: "boolean", required: false, defaultValue: false },
      bannedAt: { type: "date", required: false },
      bannedUntil: { type: "date", required: false },
      bannedReason: { type: "string", required: false },
    },
  },
  hooks: {
    /**
     * 登录前验证 (before hook 在密码验证前执行)
     */
    before: createAuthMiddleware(async (ctx) => {
      const path = (ctx.path || "").replace(/\/+$/, "");

      // 在邮箱登录时验证验证码
      if (path === "/sign-in/email") {
        const captchaToken = ctx.body?.captchaToken;
        logger.info("captchaToken:", captchaToken);
        // 验证验证码 token
        const isValidCaptcha = await validateCaptchaToken(captchaToken, "login");
        if (!isValidCaptcha) {
          throw new APIError("BAD_REQUEST", {
            error: {
              message: "验证码无效或已过期，请重新验证",
              code: "INVALID_CAPTCHA",
            },
          });
        }
      }
      
      // 在邮箱注册时验证验证码
      if (path === "/sign-up/email") {
        const captchaToken = ctx.body?.captchaToken;
        logger.info("signup captchaToken:", captchaToken);
        // 验证验证码 token
        const isValidCaptcha = await validateCaptchaToken(captchaToken, "signup");
        if (!isValidCaptcha) {
          throw new APIError("BAD_REQUEST", {
            error: {
              message: "验证码无效或已过期，请重新验证",
              code: "INVALID_CAPTCHA",
            },
          });
        }
      }
    }),
    /**
     * 登录后统一处理逻辑 (after hook 在密码验证成功后执行)
     * 执行顺序:
     *  1. 检查用户是否被封禁 (密码验证成功后才检查,避免信息泄露)
     *  2. 检查单点登录模式 (清理其他 session)
     */
    after: createAuthMiddleware(async (ctx) => {
      // 统一处理 path: 去掉结尾的斜杠
      const path = (ctx.path || "").replace(/\/+$/, "");

      // ========== 第一步: 封禁检查 ==========
      // 只在邮箱登录接口执行封禁检查
      if (path === "/sign-in/email") {
        const email: string | undefined = ctx.body?.email?.toLowerCase?.();
        if (!email) return; // 交给默认校验报错

        // 查询用户封禁状态
        const user_info = await db
          .select()
          .from(user)
          .where(eq(user.email, email))
          .then((res) => res?.[0]);

        // 如果用户被封禁
        if (user_info?.banned) {
          // 检查临时封禁是否已过期
          const bannedUntil = user_info.bannedUntil
            ? new Date(user_info.bannedUntil)
            : null;

          if (bannedUntil && new Date() > bannedUntil) {
            // 临时封禁已过期 => 自动解封
            await db
              .update(user)
              .set({
                banned: false,
                bannedAt: null,
                bannedUntil: null,
                bannedReason: null,
              })
              .where(eq(user.email, email));
            // 解封成功,继续后续流程
          } else {
            // 仍然处于封禁中 => 删除刚创建的 session 并返回封禁信息
            const currentUser = ctx.context?.newSession?.user;
            if (currentUser) {
              await db
                .delete(session)
                .where(eq(session.userId, currentUser.id));
            }

            // 构建详细的封禁信息
            const banInfo: Record<string, string> = {};
            if (user_info.bannedAt) {
              banInfo.bannedAt = new Date(user_info.bannedAt).toISOString();
            }
            if (bannedUntil) {
              banInfo.bannedUntil = bannedUntil.toISOString();
            }
            if (user_info.bannedReason) {
              banInfo.reason = user_info.bannedReason;
            }

            throw new APIError("FORBIDDEN", {
              message: JSON.stringify(banInfo),
              code: "USER_BANNED",
            });
          }
        }
        // 没有被封禁或已自动解封,继续执行后续逻辑
      }

      // ========== 第二步: 单点登录检查 ==========
      // 只在任何登录接口成功后执行
      if (path.startsWith("/sign-in")) {
        // 判断是否登录成功 (after hook 中有 newSession 才代表登录成功)
        const loginSuccess = !!ctx.context?.newSession?.user;
        if (!loginSuccess) return;

        // 查询单点登录开关
        const websiteConfig = await db
          .select()
          .from(websiteInfo)
          .limit(1)
          .then((r) => r?.[0]);

        // 如果未启用单点登录,直接放行
        if (!websiteConfig?.isSingleUser) return;

        // 启用了单点登录 => 保留当前 session,删除该用户的其他 session
        const currentSession = ctx.context.newSession?.session;
        const currentUser = ctx.context.newSession?.user;

        if (currentSession && currentUser) {
          await db
            .delete(session)
            .where(
              and(
                eq(session.userId, currentUser.id),
                ne(session.id, currentSession.id)
              )
            );
        }
      }

      // 所有检查通过,放行
      return;
    }),
  },
  plugins: [nextCookies()],
});
