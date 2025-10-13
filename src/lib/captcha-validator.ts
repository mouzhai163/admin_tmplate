import { redis } from "@/lib/redis";

/**
 * 验证 captcha token 是否有效
 * @param token 验证码 token
 * @param type 验证码类型，默认为 login
 * @returns 是否验证成功
 */
export async function validateCaptchaToken(token: string | null | undefined, type: string = "login"): Promise<boolean> {
  if (!token) {
    return false;
  }

  try {
    // 使用反向索引直接查找 token，包含类型
    const tokenData = await redis.hgetall(`verified:${type}:${token}`);

    if (!tokenData || Object.keys(tokenData).length === 0) {
      return false;
    }
    
    
    // 获取 clientId
    const clientId = tokenData.clientId as string;
    if (!clientId) {
      return false;
    }

    // 验证原始会话是否存在且已验证，包含类型
    const sessionData = await redis.hgetall(`captcha:${type}:${clientId}`);
    if (!sessionData || Object.keys(sessionData).length === 0) {
      return false;
    }

    // 确认会话已验证且 token 匹配
    if (!sessionData.verified || sessionData.verificationToken !== token) {
      return false;
    }
    
    // 验证成功，删除两个 key 防止重复使用
    await Promise.all([
      redis.del(`verified:${type}:${token}`),
      redis.del(`captcha:${type}:${clientId}`)
    ]);
    
    return true;
  } catch (error) {
    return false;
  }
}