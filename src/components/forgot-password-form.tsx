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
import { useState } from "react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";

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

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (FormData: ForgotPasswordForm) => {
    try {
      setIsLoading(true);
      
      await authClient.requestPasswordReset({
        email: FormData.email,
        redirectTo: "/reset-password",
      })
      
      // 成功后显示提示
      setSentEmail(FormData.email);
      setEmailSent(true);
      
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
      
      
      setIsLoading(false);
    } catch (err) {
      setIsLoading(false);
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

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Mail className="h-4 w-4 animate-pulse" />
                    发送中...
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

