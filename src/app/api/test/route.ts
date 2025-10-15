import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

// 生成随机用户名
function generateRandomUsername(): string {
  const adjectives = ['快乐的', '聪明的', '勇敢的', '优秀的', '酷炫的', '神秘的', '温柔的', '强大的', '灵活的', '睿智的'];
  const nouns = ['小熊', '小猫', '小狗', '小兔', '小鸟', '小鱼', '小虎', '小龙', '小马', '小羊'];
  const randomNum = Math.floor(Math.random() * 10000);
  
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  
  return `${adjective}${noun}${randomNum}`;
}

// 生成随机邮箱
function generateRandomEmail(): string {
  const domains = ['example.com', 'test.com', 'demo.com', 'sample.com', 'mail.com'];
  const randomString = Math.random().toString(36).substring(2, 10);
  const timestamp = Date.now();
  const domain = domains[Math.floor(Math.random() * domains.length)];
  
  return `user_${randomString}_${timestamp}@${domain}`;
}

export async function GET() {
  try {
    const results = [];
    const errors = [];

    for (let i = 0; i < 10; i++) {
      const username = generateRandomUsername();
      const email = generateRandomEmail();
      
      try {
        const result = await auth.api.createUser({
          body: {
            name: username,
            email: email,
            password: "123456789",
            role: "user",
          }
        });
        
        results.push({
          success: true,
          name: username,
          email: email,
          id: result?.user?.id || 'unknown'
        });
        
      } catch (error) {
        errors.push({
          success: false,
          name: username,
          email: email,
          error: error instanceof Error ? error.message : '创建失败'
        });
      }
    }

    return NextResponse.json({ 
      code: 200, 
      message: "批量创建用户完成",
      summary: {
        total: 10,
        success: results.length,
        failed: errors.length
      },
      results: results,
      errors: errors
    });
    
  } catch (error) {
    return NextResponse.json({ 
      code: 500, 
      message: "服务器错误",
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}