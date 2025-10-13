"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Mail, CheckCircle2 } from "lucide-react";
import z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import CaptchaVerification, { CaptchaVerificationRef } from "./m_ui/CaptchaVerification";

// zod校验规则
const forgotPasswordSchema = z.object({
  email: z.string().trim().email("请输入有效的邮箱地址!"),
});

// 推断TypeScript数据类型
type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [sentEmail, setSentEmail] = useState("");
  const [isAlertVisible, setIsAlertVisible] = useState(false);
  const [countdown, setCountdown] = useState(0); // 倒计时秒数
  
  const captchaVerificationRef = useRef<CaptchaVerificationRef>(null); // 验证码组件引用

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  // 倒计时效果
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const onSubmit = async (FormData: ForgotPasswordForm) => {
    // 检查验证码是否已验证
    if (!captchaVerificationRef.current?.isVerified()) {
      toast.error("请先完成人机验证", {
        description: "请点击复选框完成安全验证",
        duration: 3000,
      });
      return;
    }
    
    const captchaToken = captchaVerificationRef.current.getToken();

    try {
      setIsLoading(true);
      
      // 调用本地API
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: FormData.email,
          captchaToken: captchaToken,
          redirectTo: "/reset-password",
        }),
      });

      const result = await response.json();
      
      setIsLoading(false);
      
      if (!response.ok) {
        // 处理错误
        // 清理 Redis 记录并重置验证码
        if (captchaToken && captchaVerificationRef.current) {
          const clientId = captchaVerificationRef.current.getClientId();
          await fetch("/api/captcha/clear", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              token: captchaToken,
              clientId: clientId,
            }),
          });
        }
        
        captchaVerificationRef.current?.reset();
        
        // 错误处理
        if (result.code === "INVALID_CAPTCHA") {
          toast.error("验证失败", {
            description: "验证码无效或已过期，请重新验证",
            duration: 4000,
          });
        } else if (result.code === "USER_NOT_FOUND") {
          toast.error("发送失败", {
            description: "未找到该邮箱对应的账号",
            duration: 4000,
          });
        } else if (result.code === "RATE_LIMITED") {
          toast.error("请求过于频繁", {
            description: "请1分钟后再试",
            duration: 4000,
          });
        } else {
          toast.error("系统错误", {
            description: result.message || "发送重置邮件失败，请稍后重试",
            duration: 4000,
          });
        }
        return;
      }
      
      // 成功后显示提示
      setSentEmail(FormData.email);
      setEmailSent(true);
      
      // 重置验证码状态（确保下次需要重新验证）
      captchaVerificationRef.current?.reset();
      
      // 启动60秒倒计时
      setCountdown(60);
      
      // 使用 setTimeout 让浏览器先渲染初始状态，然后触发淡入动画
      setTimeout(() => {
        setIsAlertVisible(true);
      }, 10);
      
      // 4.5秒后开始淡出动画
      setTimeout(() => {
        setIsAlertVisible(false);
      }, 4500);
      
      // 5秒后完全移除卡片（动画完成后）
      setTimeout(() => {
        setEmailSent(false);
      }, 5000);
      
    } catch (err) {
      setIsLoading(false);
      // 发生错误时不启动倒计时
      console.error("发送重置邮件异常:", err);
      toast.error("系统错误", {
        description: "发送重置邮件失败，请稍后重试",
        duration: 4000,
      });
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="p-0">
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 md:p-8">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center text-center">
                <h1 className="text-2xl font-bold">重 置 密 码</h1>
                <p className="text-muted-foreground text-sm mt-2">
                  输入您的邮箱地址，我们将发送重置密码链接
                </p>
              </div>

              {/* 邮件发送成功 Alert */}
              <div 
                className={`
                  grid
                  transition-all duration-500 ease-in-out
                  ${isAlertVisible 
                    ? 'grid-rows-[1fr] opacity-100' 
                    : 'grid-rows-[0fr] opacity-0'
                  }
                `}
              >
                <div className="overflow-hidden">
                  {emailSent && (
                    <Alert 
                      className={`
                        border-2 border-green-500 bg-green-50 dark:bg-green-950
                        transition-transform duration-500 ease-in-out
                        ${isAlertVisible 
                          ? 'translate-y-0' 
                          : '-translate-y-2'
                        }
                      `}
                    >
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <AlertTitle className="text-sm font-semibold text-green-800 dark:text-green-200">
                        邮件已发送
                      </AlertTitle>
                      <AlertDescription className="mt-2">
                        <p className="text-xs text-green-700 dark:text-green-300">
                          我们已将重置密码链接发送到{" "}
                          <span className="font-medium">{sentEmail}</span>
                        </p>
                        <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                          请查看您的邮箱（包括垃圾邮件文件夹）并点击链接重置密码。
                        </p>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>

              <div className="grid">
                <Label htmlFor="email" className="mb-2">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="请输入您的邮箱地址"
                  disabled={isLoading}
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-xs mt-1 ml-1 text-red-500">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* 人机验证组件 - 倒计时期间隐藏 */}
              <div 
                className={cn(
                  "transition-all duration-300 ease-in-out",
                  countdown > 0 ? "opacity-0 h-0 overflow-hidden" : "opacity-100"
                )}
              >
                <CaptchaVerification
                  ref={captchaVerificationRef}
                  type="forgotPassword"
                />
              </div>

              <Button 
                type="submit" 
                className={cn("w-full", countdown > 0 && "opacity-80 cursor-not-allowed")}
                disabled={isLoading || countdown > 0}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Mail className="h-4 w-4 animate-pulse" />
                    发送中...
                  </span>
                ) : countdown > 0 ? (
                  <span className="flex items-center gap-2">
                    <Mail className="h-4 w-4 opacity-70" />
                    <span className="font-medium">{countdown}秒后可重新发送</span>
                  </span>
                ) : (
                  "发送重置链接"
                )}
              </Button>

              <div className="text-center text-sm">
                <a
                  href="/login"
                  className="text-primary hover:underline underline-offset-4"
                >
                  ← 返回登录
                </a>
              </div>

              <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
                <span className="bg-card text-muted-foreground relative z-10 px-2">
                  还没有账号?
                </span>
              </div>

              <div className="text-center text-sm">
                <a href="/signup" className="underline underline-offset-4">
                  立即注册
                </a>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
      <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </div>
    </div>
  );
}

