import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { validateCaptchaToken } from "@/lib/captcha-validator";
import { redis } from "@/lib/redis";

// 错误代码常量
const ErrorCodes = {
  INVALID_CAPTCHA: "INVALID_CAPTCHA",
  USER_NOT_FOUND: "USER_NOT_FOUND",
  RATE_LIMITED: "RATE_LIMITED",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, captchaToken, redirectTo } = body;

    // 验证必要参数
    if (!email || !captchaToken) {
      return NextResponse.json(
        { 
          code: "BAD_REQUEST", 
          message: "邮箱和验证码是必需的" 
        },
        { status: 400 }
      );
    }

    // 标准化邮箱地址
    const normalizedEmail = email.toLowerCase().trim();

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json(
        { 
          code: "BAD_REQUEST", 
          message: "请输入有效的邮箱地址" 
        },
        { status: 400 }
      );
    }

    // 验证验证码 - 忘记密码页面使用专门的 forgotPassword 类型验证码
    const captchaValid = await validateCaptchaToken(captchaToken, "forgotPassword");
    if (!captchaValid) {
      return NextResponse.json(
        { 
          code: ErrorCodes.INVALID_CAPTCHA, 
          message: "验证码无效或已过期" 
        },
        { status: 400 }
      );
    }

    // 频率限制检查 - 使用邮箱作为key，1分钟内只能请求一次
    const rateLimitKey = `forgot_password:${normalizedEmail}`;
    const existingRequest = await redis.get(rateLimitKey);
    
    if (existingRequest) {
      return NextResponse.json(
        { 
          code: ErrorCodes.RATE_LIMITED, 
          message: "请求过于频繁，请1分钟后再试" 
        },
        { status: 429 }
      );
    }

    try {
      // 调用 better-auth 的密码重置功能
      const result = await auth.api.forgetPassword({
        body: {
          email: normalizedEmail,
          redirectTo: redirectTo || "/reset-password",
        },
        headers: req.headers,
      });

      // 检查响应
      if (!result) {
        return NextResponse.json(
          { 
            code: ErrorCodes.INTERNAL_ERROR, 
            message: "密码重置请求失败" 
          },
          { status: 500 }
        );
      }

      // better-auth API 返回 { status: boolean }
      // status 为 true 表示成功，false 表示失败
      if (result.status === true) {
        // 成功 - 设置频率限制
        await redis.setex(rateLimitKey, 60, "1");
        
        console.log(`Password reset email sent successfully to: ${normalizedEmail}`);
        
        return NextResponse.json(
          { 
            success: true,
            message: "密码重置邮件已发送" 
          },
          { status: 200 }
        );
      } else {
        // 失败 - 可能是用户不存在或其他错误
        // 不设置频率限制，避免恶意锁定不存在的邮箱
        return NextResponse.json(
          { 
            code: ErrorCodes.USER_NOT_FOUND, 
            message: "未找到该邮箱对应的账号" 
          },
          { status: 404 }
        );
      }

    } catch (error) {
      console.error("Password reset error:", error);
      
      // 检查是否是 better-auth 的特定错误
      if (error instanceof Error) {
        // 用户不存在的情况
        if (error.message.includes("User not found") || 
            error.message.includes("user not found") ||
            error.message.includes("No user found")) {
          return NextResponse.json(
            { 
              code: ErrorCodes.USER_NOT_FOUND, 
              message: "未找到该邮箱对应的账号" 
            },
            { status: 404 }
          );
        }
      }
      
      return NextResponse.json(
        { 
          code: ErrorCodes.INTERNAL_ERROR, 
          message: "系统错误，请稍后重试" 
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error("Forgot password API error:", error);
    
    return NextResponse.json(
      { 
        code: ErrorCodes.INTERNAL_ERROR, 
        message: "系统错误，请稍后重试" 
      },
      { status: 500 }
    );
  }
}
