import { redis } from "@/lib/redis";
import { logger } from "./myUtils";

/**
 * 验证 captcha token 是否有效
 * @param token 验证码 token
 * @returns 是否验证成功
 */
export async function validateCaptchaToken(token: string | null | undefined): Promise<boolean> {
  if (!token) {
    return false;
  }

  try {
    // 使用反向索引直接查找 token
    const tokenData = await redis.hgetall(`verified:${token}`);

    if (!tokenData || Object.keys(tokenData).length === 0) {
      return false;
    }
    
    
    // 获取 clientId
    const clientId = tokenData.clientId as string;
    if (!clientId) {
      return false;
    }

    // 验证原始会话是否存在且已验证
    const sessionData = await redis.hgetall(`captcha:${clientId}`);
    if (!sessionData || Object.keys(sessionData).length === 0) {
      return false;
    }

    // 确认会话已验证且 token 匹配
    if (!sessionData.verified || sessionData.verificationToken !== token) {
      return false;
    }
    
    // 验证成功，删除两个 key 防止重复使用
    await Promise.all([
      redis.del(`verified:${token}`),
      redis.del(`captcha:${clientId}`)
    ]);
    
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * 获取验证码会话统计信息
 */
// export async function getCaptchaStats() {
//   try {
//     const stats = {
//       total: 0,
//       verified: 0,
//       unverified: 0,
//       activeIps: new Set<string>(),
//       verifiedTokens: 0,
//     };
    
//     // 扫描所有验证码会话
//     let cursor = 0;
//     do {
//       const result = await redis.scan(cursor, {
//         match: "captcha:*",
//         count: 100,
//       });
      
//       cursor = Number(result[0]);
//       const keys = result[1];
      
//       // 获取每个会话的详细信息
//       for (const key of keys) {
//         const sessionData = await redis.hgetall(key);
//         if (sessionData && Object.keys(sessionData).length > 0) {
//           stats.total++;
          
//           if (sessionData.verified === 'true') {
//             stats.verified++;
//           } else {
//             stats.unverified++;
//           }
          
//           if (sessionData.ipAddress) {
//             stats.activeIps.add(sessionData.ipAddress as string);
//           }
//         }
//       }
//     } while (cursor !== 0);
    
//     // 统计已验证的 token 数量
//     cursor = 0;
//     do {
//       const result = await redis.scan(cursor, {
//         match: "verified:*",
//         count: 100,
//       });
      
//       cursor = Number(result[0]);
//       stats.verifiedTokens += result[1].length;
//     } while (cursor !== 0);
    
//     return {
//       ...stats,
//       uniqueIps: stats.activeIps.size,
//     };
//   } catch (error) {
//     console.error("获取验证码统计信息失败:", error);
//     return {
//       total: 0,
//       verified: 0,
//       unverified: 0,
//       uniqueIps: 0,
//       verifiedTokens: 0,
//     };
//   }
// }