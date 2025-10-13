"use server";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
// 移除数据库相关导入，完全使用 Redis
import path from "path";
import fs from "fs/promises";
import { getClientIp, logger } from "@/lib/myUtils";
import createPuzzle from 'node-puzzle';
import { redis } from "@/lib/redis";
import { CaptchaSession } from "./captcha.types";


// 获取验证码图片列表
async function getCaptchaImages() {
  const captchaDir = path.join(process.cwd(), "public", "captcha");
  try {
    const files = await fs.readdir(captchaDir);
    return files.filter(file => /\.(jpg|jpeg|png)$/i.test(file));
  } catch {
    return ["default.jpg"]; // 默认图片
  }
}

// 生成会话指纹
export async function generateFingerprint(ip: string, userAgent: string | null): Promise<string> {
  const data = `${ip}:${userAgent || 'unknown'}`;
  return crypto.createHash('sha256').update(data).digest('hex');
}



/**
 * 
 * @param request 
 * @returns 
 */
// 验证码过期时间
const TTL_SECONDS = 300; // 5 分钟
export async function POST(request: NextRequest) {

  const now = new Date(); // 统一使用一个now变量
  try {
    // 获取客户端信息
    const clientId = request.headers.get("X-Client-ID");
    const ip = getClientIp(request) || "unknown";
    const userAgent = request.headers.get("user-agent");

    // 验证 clientId
    if (!clientId || clientId.length !== 36) {
      return NextResponse.json(
        { success: false, error: "无效的客户端ID" },
        { status: 400 }
      );
    }

    const fingerprint = await generateFingerprint(ip, userAgent);


    // 从 Redis 获取会话数据
    const sessionData = await redis.hgetall(`captcha:${clientId}`);
    
    // 如果存在会话数据，转换类型
    let existingSession: CaptchaSession | null = null;
    if (sessionData && Object.keys(sessionData).length > 0) {
      // 检查是否已过期（虽然 Redis 会自动删除，但双重检查）
      const expiresAt = new Date(sessionData.expiresAt as string);
      if (expiresAt > now) {
        existingSession = {
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

    // 随机选择一张图片并生成拼图
    const images = await getCaptchaImages();
    const imageIndex = Math.floor(Math.random() * images.length);
    const imageName = images[imageIndex];
    const imagePath = path.join(process.cwd(), "public", "captcha", imageName);
    
    // 生成拼图
    const puzzle = await createPuzzle(imagePath, {
      width: 60,
      height: 60,
      bgWidth: 320,
      bgHeight: 160,
    });

    // 将 Buffer 转换为 base64 data URL
    const bgBase64 = puzzle.bg.toString('base64');
    const puzzleBase64 = puzzle.puzzle.toString('base64');
    const bgUrl = `data:image/jpeg;base64,${bgBase64}`;
    const puzzleUrl = `data:image/png;base64,${puzzleBase64}`;

    // 如果找到现有 session，直接复用（更新拼图位置和过期时间）
    if (existingSession) {
      logger.info("复用现有 session:", existingSession.id);
      
      const newExpiresAt = new Date(now.getTime() + TTL_SECONDS * 1000);
      
      // 更新 Redis 中的会话数据
      const updatedSession = {
        ...existingSession,
        puzzleX: puzzle.x.toString(),
        puzzleY: (puzzle.y || 0).toString(),
        imageIndex: imageIndex.toString(),
        createdAt: now.toISOString(),
        expiresAt: newExpiresAt.toISOString(),
        sessionFingerprint: fingerprint,
        ipAddress: ip,
      };
      
      // 使用 HSET 更新所有字段
      await redis.hset(`captcha:${clientId}`, updatedSession);
      // 重新设置过期时间
      await redis.expire(`captcha:${clientId}`, TTL_SECONDS);
      
      return NextResponse.json({
        success: true,
        data: {
          sessionId: existingSession.id,  // 复用原有的 sessionId
          bgUrl,
          puzzleUrl,
        },
      });
    }

    
    // 创建新的 session
    const sessionId = crypto.randomUUID();
    const expiresAt = new Date(now.getTime() + TTL_SECONDS * 1000); // TTL_SECONDS 秒后过期

    // 存储到 Redis
    const sessionDataForRedis = {
      id: sessionId,
      clientId,
      puzzleX: puzzle.x.toString(),
      puzzleY: (puzzle.y || 0).toString(),
      imageIndex: imageIndex.toString(),
      sessionFingerprint: fingerprint,
      ipAddress: ip,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      verified: 'false',
      verificationToken: '',
    };
    
    // 使用 HSET 存储所有字段
    await redis.hset(`captcha:${clientId}`, sessionDataForRedis);
    
    // 设置过期时间（Redis 会自动删除过期的 key）
    await redis.expire(`captcha:${clientId}`, TTL_SECONDS);
    
    // 返回数据（不包含答案）
    return NextResponse.json({
      success: true,
      data: {
        sessionId,
        bgUrl,
        puzzleUrl,
      },
    });
  } catch (error) {
    logger.error("生成验证码失败:", error);
    return NextResponse.json(
      { success: false, error: "生成验证码失败" },
      { status: 500 }
    );
  }
}
