import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { redis } from "@/lib/redis";
import { CaptchaSession } from "../init/captcha.types";
import { generateFingerprint } from "../init/route";
import { getClientIp } from "@/lib/myUtils";

// 验证滑块位置和行为
function validateCaptcha(
  data: {
    x: number;
    y: number;
    duration: number;
    trail?: [number, number][];
  },
  session: {
    puzzleX: number;
    puzzleY: number;
  }
): { isValid: boolean; reason?: string } {
  // 1. 位置验证
  const positionTolerance = 3; // 允许3像素误差
  if (Math.abs(data.x - session.puzzleX) > positionTolerance) {
    return { isValid: false, reason: "位置不正确" };
  }
  // 2. 时长验证
  if (data.duration < 300) {
    return { isValid: false, reason: "操作过快" };
  }
  if (data.duration > 30000) {
    return { isValid: false, reason: "操作超时" };
  }

  // 3. 轨迹验证
  if (!data.trail || data.trail.length < 5) {
    return { isValid: false, reason: "操作异常" };
  }

  // 4. Y轴偏移验证
  if (Math.abs(data.y) > 40) {
    return { isValid: false, reason: "操作异常" };
  }

  // 5. 轨迹平滑度验证
  for (let i = 1; i < data.trail.length; i++) {
    const dx = Math.abs(data.trail[i][0] - data.trail[i - 1][0]);
    if (dx > 50) {
      return { isValid: false, reason: "操作异常" };
    }
  }

  return { isValid: true };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, x, y, duration, trail } = body;
    const type = request.headers.get("X-Captcha-Type") || "login"; // 从 header 获取类型

    // 验证参数
    if (!sessionId || typeof x !== "number" || typeof y !== "number") {
      return NextResponse.json(
        { success: false, error: "参数错误" },
        { status: 400 }
      );
    }

    // 获取客户端信息
    const clientId = request.headers.get("X-Client-ID");

    // 验证 clientId
    if (!clientId) {
      return NextResponse.json(
        { success: false, error: "缺少客户端ID" },
        { status: 400 }
      );
    }
    const ip = getClientIp(request) || "unknown";
    const userAgent = request.headers.get("user-agent");
    //获取用户ip+ua生成指纹
    const fingerprint = await generateFingerprint(ip, userAgent);

    // 验证 type 参数
    if (!["login", "signup","forgotPassword"].includes(type)) {
      return NextResponse.json(
        { success: false, error: "无效的验证码类型" },
        { status: 400 }
      );
    }

    // 从 Redis 获取会话数据，使用带类型的 key
    const redisKey = `captcha:${type}:${clientId}`;
    const sessionData = await redis.hgetall(redisKey);
    
    // 转换并验证会话数据
    let session: CaptchaSession | null = null;
    if (sessionData && Object.keys(sessionData).length > 0) {
      // 验证会话ID、指纹和过期时间
      if (
        sessionData.id === sessionId &&
        sessionData.clientId === clientId &&
        sessionData.sessionFingerprint === fingerprint &&
        new Date(sessionData.expiresAt as string) > new Date() &&
        sessionData.verified !== 'true'
      ) {
        session = {
          id: sessionData.id as string,
          clientId: sessionData.clientId as string,
          puzzleX: parseInt(sessionData.puzzleX as string),
          puzzleY: parseInt(sessionData.puzzleY as string),
          imageIndex: parseInt(sessionData.imageIndex as string),
          sessionFingerprint: sessionData.sessionFingerprint as string,
          ipAddress: sessionData.ipAddress as string,
          createdAt: sessionData.createdAt as string,
          expiresAt: sessionData.expiresAt as string,
          verified: sessionData.verified === 'true',
          verificationToken: sessionData.verificationToken as string || '',
        };
      }
    }

    if (!session) {
      return NextResponse.json(
        { success: false, error: "会话无效或已过期" },
        { status: 400 }
      );
    }

    // 验证位置和行为
    const validation = validateCaptcha(
      { x, y, duration, trail },
      { puzzleX: session.puzzleX, puzzleY: session.puzzleY }
    );

    if (!validation.isValid) {
      
      return NextResponse.json(
        { success: false, error: validation.reason || "验证失败" },
        { status: 400 }
      );
    }

    // 生成验证token
    const token = crypto.randomBytes(32).toString("hex");

    // 更新会话状态
    const updatedSession = {
      ...session,
      verified: 'true',
      verificationToken: token,
    };
    
    // 更新 Redis 中的数据
    await redis.hset(redisKey, updatedSession);
    
    const tokenTTL = 90; // 90秒有效期
    const expiresAt = new Date(new Date().getTime() + tokenTTL * 1000).toISOString();
    
    // 创建反向索引，用于验证token，也包含类型信息 
    await redis.hset(`verified:${type}:${token}`, {
      clientId,
      type,
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt,
    });
    
    // 设置过期时间（传入秒数，不是时间戳）
    await redis.expire(redisKey, tokenTTL);
    await redis.expire(`verified:${type}:${token}`, tokenTTL);

    return NextResponse.json({
      success: true,
      data: { token },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "验证失败" },
      { status: 500 }
    );
  }
}
