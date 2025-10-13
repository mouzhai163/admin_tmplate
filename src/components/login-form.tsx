"use client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { PasswordInput } from "./m_ui/PasswordInput";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Clock, Shield, Mail } from "lucide-react";
import z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { authClient } from "@/lib/auth-client";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { formatDate } from "@/lib/myUtils";
import CaptchaVerification, { CaptchaVerificationRef } from "./m_ui/CaptchaVerification";
import { useRouter } from "next/navigation";

// zod校验规则
const loginSchema = z.object({
  email: z.string().trim().email("请输入有效的邮箱地址!"),
  password: z
    .string()
    .trim()
    .min(8, "密码至少8位!")
    .max(128, "密码不能超过128位!"),
});

// 推断TypeScript数据类型
type loginForm = z.infer<typeof loginSchema>;

// 封禁信息类型
interface BanInfo {
  bannedAt?: string;
  bannedUntil?: string;
  reason?: string;
}

// 邮箱未验证信息类型
interface EmailNotVerifiedInfo {
  email: string;
}

// 错误代码枚举
const ErrorCodes = {
  INVALID_EMAIL_OR_PASSWORD: "INVALID_EMAIL_OR_PASSWORD",
  INVALID_CAPTCHA: "INVALID_CAPTCHA",
  EMAIL_NOT_VERIFIED: "EMAIL_NOT_VERIFIED",
  USER_BANNED: "USER_BANNED",
} as const;

type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [isLoading, setIsLoading] = useState(false);
  const [banInfo, setBanInfo] = useState<BanInfo | null>(null);
  const [emailNotVerifiedInfo, setEmailNotVerifiedInfo] =
    useState<EmailNotVerifiedInfo | null>(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false); // 邮件发送 loading 状态
  
  const captchaVerificationRef = useRef<CaptchaVerificationRef>(null); // 验证码组件引用
  const route = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (FormData: loginForm) => {
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
      setBanInfo(null); // 清除之前的封禁信息
      setEmailNotVerifiedInfo(null); // 清除之前的邮箱未验证信息

      // 创建自定义的请求来传递额外数据
      const response = await fetch("/api/auth/sign-in/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: FormData.email,
          password: FormData.password,
          captchaToken: captchaToken,
        }),
      });

      const result = await response.json();
      
      // 处理响应 - better-auth 直接返回错误对象，不是包装在 error 字段中
      setIsLoading(false);
      
      if (!response.ok || result.code) {
        // 这是一个错误响应
        const error = result;
        // 登录失败后清理 Redis 记录并重置验证码
        
        // 调用清理 API 删除 Redis 中的验证记录
        if (captchaToken && captchaVerificationRef.current) {
          const clientId = captchaVerificationRef.current.getClientId();
          fetch("/api/captcha/clear", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              token: captchaToken,
              clientId: clientId,
            }),
          })
        }
        
        captchaVerificationRef.current?.reset();
        
        // 使用对象映射优化错误处理
        const errorHandlers: Record<ErrorCode, () => void> = {
          [ErrorCodes.INVALID_EMAIL_OR_PASSWORD]: () => {
            toast.error("登录失败", {
              description: "账号或者密码错误!",
              duration: 4000,
            });
          },
          
          [ErrorCodes.INVALID_CAPTCHA]: () => {
            toast.error("验证失败", {
              description: "验证码无效或已过期，请重新验证",
              duration: 4000,
            });
          },
          
          [ErrorCodes.EMAIL_NOT_VERIFIED]: () => {
            setEmailNotVerifiedInfo({ email: FormData.email });
          },
          
          [ErrorCodes.USER_BANNED]: () => {
            try {
              const banData = error.message ? JSON.parse(error.message) : {};
              setBanInfo(banData);
            } catch (e) {
              console.error("解析封禁信息失败:", e);
              setBanInfo({ reason: "账号已被封禁" });
            }
          },
        };
        
        // 执行对应的错误处理器
        const errorCode = error.code as ErrorCode;
        
        const handler = errorHandlers[errorCode];
        if (handler) {
          handler();
        } else {
          // 默认错误处理 - 显示更友好的错误信息
          const defaultMessages: Record<string, string> = {
            "BAD_REQUEST": "请求参数错误",
            "UNAUTHORIZED": "未授权访问",
            "FORBIDDEN": "访问被拒绝",
            "NOT_FOUND": "资源不存在",
            "INTERNAL_SERVER_ERROR": "服务器内部错误",
          };
          
          toast.error("登录失败", {
            description: error.message || defaultMessages[error.status] || "未知错误，请稍后重试",
            duration: 4000,
          });
        }
        return;
      }

      // 登录成功
      toast.success("登录成功", {
        description: "正在跳转到管理后台...",
        duration: 2000,
      });
      // 重置验证码状态
      captchaVerificationRef.current?.reset();
      //等待2秒跳转到首页
      setTimeout(() => {
        route.replace("/");
      }, 2000);
    } catch (err) {
      setIsLoading(false);
      const errorMessage = "登录过程发生异常，请稍后重试";
      toast.error("系统错误", {
        description: errorMessage,
        duration: 4000,
      });
    }
  };
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 md:p-8">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center text-center">
                <h1 className="text-2xl font-bold">M Z 后 台 系 统</h1>
              </div>

              {/* 封禁信息 Alert */}
              {banInfo && (
                <Alert variant="destructive" className="border-2">
                  <Shield className="h-4 w-4" />
                  <AlertTitle className="text-sm font-semibold">
                    账户已被封禁
                  </AlertTitle>
                  <AlertDescription className="mt-2 space-y-1">
                    {/* 封禁时间 */}
                    {banInfo.bannedAt && (
                      <div className="flex items-center gap-1.5 text-xs">
                        <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="font-medium">封禁时间：</span>
                        <span>{formatDate(new Date(banInfo.bannedAt))}</span>
                      </div>
                    )}

                    {/* 解封时间或永久封禁 */}
                    {banInfo.bannedUntil ? (
                      <div className="flex items-center gap-1.5 text-xs">
                        <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="font-medium">解封时间：</span>
                        <span>{formatDate(new Date(banInfo.bannedUntil))}</span>
                      </div>
                    ) : banInfo.bannedAt ? (
                      <div className="flex items-center gap-1.5 text-xs">
                        <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="font-medium">封禁类型：</span>
                        <span>永久封禁</span>
                      </div>
                    ) : null}

                    {/* 封禁原因 */}
                    {banInfo.reason && (
                      <div className="flex items-center gap-1.5 text-xs">
                        <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="font-medium">封禁原因：</span>
                        <span>{banInfo.reason}</span>
                      </div>
                    )}

                    {/* 如果没有任何详细信息 */}
                    {!banInfo.bannedAt && !banInfo.reason && (
                      <p className="text-xs">您的账户已被封禁，无法登录系统</p>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {/* 邮箱未验证 Alert */}
              {emailNotVerifiedInfo && (
                <Alert variant="destructive" className="border-2">
                  <Mail className="h-4 w-4" />
                  <AlertTitle className="text-sm font-semibold">
                    邮箱未验证
                  </AlertTitle>
                  <AlertDescription className="mt-2">
                    <p className="text-xs mb-2">
                      请先验证您的邮箱地址后再登录。点击下方按钮发送验证邮件至{" "}
                      <span className="font-medium">
                        {emailNotVerifiedInfo.email}
                      </span>
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      disabled={isSendingEmail}
                      onClick={async () => {
                        try {
                          setIsSendingEmail(true);
                          await authClient.sendVerificationEmail({
                            email: emailNotVerifiedInfo.email,
                            callbackURL: "/verify-success",
                          });
                          toast.success("验证邮件已发送", {
                            description:
                              "请在邮箱中查看,如果没有请在邮箱中查看垃圾邮件!",
                            duration: 2000,
                          });
                        } catch (error) {
                          console.error("发送验证邮件失败:", error);
                          toast.error("发送失败", {
                            description: "邮件发送失败!请重试!",
                            duration: 2000,
                          });
                        } finally {
                          setIsSendingEmail(false);
                        }
                      }}
                    >
                      {isSendingEmail ? "发送中..." : "发送验证邮件"}{" "}
                      {/* 新增: 动态文本 */}
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid">
                <Label htmlFor="email" className="mb-2">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="请输入邮箱地址"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-xs mt-1 ml-1 text-red-500">
                    {errors.email.message}
                  </p>
                )}
              </div>
              <div className="grid gap-3">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  <a
                    tabIndex={-1}
                    href="/forgot-password"
                    className="ml-auto text-sm underline-offset-2 underline"
                  >
                    忘记密码
                  </a>
                </div>
                <PasswordInput
                  id="password"
                  placeholder="请输入密码"
                  register={register}
                  error={errors.password?.message}
                />
              </div>
              
              {/* 人机验证组件 */}
              <CaptchaVerification
                ref={captchaVerificationRef}
              />
              
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "登录中..." : "登录"}
              </Button>

              <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
                <span className="bg-card text-muted-foreground relative z-10 px-2">
                  Or continue with
                </span>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Button variant="outline" type="button" className="w-full">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path
                      d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"
                      fill="currentColor"
                    />
                  </svg>
                  <span className="sr-only">Login with Apple</span>
                </Button>
                <Button variant="outline" type="button" className="w-full">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path
                      d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                      fill="currentColor"
                    />
                  </svg>
                  <span className="sr-only">Login with Google</span>
                </Button>
                <Button variant="outline" type="button" className="w-full">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path
                      d="M6.915 4.03c-1.968 0-3.683 1.28-4.871 3.113C.704 9.208 0 11.883 0 14.449c0 .706.07 1.369.21 1.973a6.624 6.624 0 0 0 .265.86 5.297 5.297 0 0 0 .371.761c.696 1.159 1.818 1.927 3.593 1.927 1.497 0 2.633-.671 3.965-2.444.76-1.012 1.144-1.626 2.663-4.32l.756-1.339.186-.325c.061.1.121.196.183.3l2.152 3.595c.724 1.21 1.665 2.556 2.47 3.314 1.046.987 1.992 1.22 3.06 1.22 1.075 0 1.876-.355 2.455-.843a3.743 3.743 0 0 0 .81-.973c.542-.939.861-2.127.861-3.745 0-2.72-.681-5.357-2.084-7.45-1.282-1.912-2.957-2.93-4.716-2.93-1.047 0-2.088.467-3.053 1.308-.652.57-1.257 1.29-1.82 2.05-.69-.875-1.335-1.547-1.958-2.056-1.182-.966-2.315-1.303-3.454-1.303zm10.16 2.053c1.147 0 2.188.758 2.992 1.999 1.132 1.748 1.647 4.195 1.647 6.4 0 1.548-.368 2.9-1.839 2.9-.58 0-1.027-.23-1.664-1.004-.496-.601-1.343-1.878-2.832-4.358l-.617-1.028a44.908 44.908 0 0 0-1.255-1.98c.07-.109.141-.224.211-.327 1.12-1.667 2.118-2.602 3.358-2.602zm-10.201.553c1.265 0 2.058.791 2.675 1.446.307.327.737.871 1.234 1.579l-1.02 1.566c-.757 1.163-1.882 3.017-2.837 4.338-1.191 1.649-1.81 1.817-2.486 1.817-.524 0-1.038-.237-1.383-.794-.263-.426-.464-1.13-.464-2.046 0-2.221.63-4.535 1.66-6.088.454-.687.964-1.226 1.533-1.533a2.264 2.264 0 0 1 1.088-.285z"
                      fill="currentColor"
                    />
                  </svg>
                  <span className="sr-only">Login with Meta</span>
                </Button>
              </div>
              <div className="text-center text-sm">
                没有账号?点击这里{" "}
                <a href="/signup" className="underline underline-offset-4">
                  注册
                </a>
              </div>
            </div>
          </form>
          <div className="bg-muted relative hidden md:block">
            <Image
              src="/login_bg.jpg"
              alt="Image"
              fill
              draggable={false} // 阻止拖拽
              className="absolute inset-0 h-full w-full object-cover scale-110 select-none dark:brightness-[0.2] dark:grayscale"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
