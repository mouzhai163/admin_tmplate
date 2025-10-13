import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { logger } from "@/lib/myUtils";

/**
 * 清理验证码相关的 Redis 记录
 * 当登录失败需要刷新验证码时调用
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, clientId, type = "login" } = body;

    // 验证参数
    if (!clientId) {
      return NextResponse.json(
        { success: false, error: "缺少客户端ID" },
        { status: 400 }
      );
    }

    // 要删除的 keys，包含类型
    const keysToDelete = [`captcha:${type}:${clientId}`];
    
    // 如果有 token，也删除反向索引
    if (token) {
      keysToDelete.push(`verified:${type}:${token}`);
    }

    // 批量删除
    const deletePromises = keysToDelete.map(key => redis.del(key));
    const results = await Promise.all(deletePromises);

    return NextResponse.json({
      success: true,
      data: {
        deleted: results.reduce((sum, result) => sum + result, 0),
        keys: keysToDelete
      }
    });
  } catch (error) {
    logger.error("清理验证码记录失败:", error);
    return NextResponse.json(
      { success: false, error: "清理失败" },
      { status: 500 }
    );
  }
}
