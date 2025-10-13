"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, AlertCircle, ShieldCheck } from "lucide-react";
import z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { PasswordInput } from "./m_ui/PasswordInput";
import { useRouter, useSearchParams } from "next/navigation";

// zod校验规则
const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .trim()
      .min(8, "密码至少8位!")
      .max(128, "密码不能超过128位!"),
    confirm: z
      .string()
      .trim()
      .min(8, "确认密码至少8位!")
      .max(128, "确认密码不能超过128位!"),
  })
  .refine((data) => data.password === data.confirm, {
    path: ["confirm"],
    message: "两次密码不一致!",
  });

// 推断TypeScript数据类型
type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

export function ResetPasswordForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [tokenError, setTokenError] = useState(false);
  const [isValidatingToken, setIsValidatingToken] = useState(true);
  const [token, setToken] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
  });

  // 验证 token 是否存在
  useEffect(() => {
    const token = searchParams.get("token");
    const error = searchParams.get("error");

    if (error) {
      setTokenError(true);
      setIsValidatingToken(false);
      toast.error("链接无效", {
        description: "重置密码链接已过期或无效，请重新申请",
        duration: 4000,
      });
    } else if (!token) {
      setTokenError(true);
      setIsValidatingToken(false);
      toast.error("缺少验证信息", {
        description: "无效的重置密码链接",
        duration: 4000,
      });
    } else {
      setToken(token);
      // token 存在，准备就绪
      setIsValidatingToken(false);
    }
  }, [searchParams]);

  const onSubmit = async (FormData: ResetPasswordForm) => {
    try {
      setIsLoading(true);

      // 调用 better-auth 的重置密码方法
      const { data, error } = await authClient.resetPassword({
        newPassword: FormData.password,
        token
      });

      if (error) {
        setIsLoading(false);
        let errorMessage = "密码重置失败，请重试";
        if (error.status === 400) {
          errorMessage = "链接已过期或无效，请重新申请重置密码";
        } else if (error.message) {
          errorMessage = error.message;
        }

        toast.error("重置失败", {
          description: errorMessage,
          duration: 4000,
        });
        return;
      }

      if (data) {
        setResetSuccess(true);
        
        toast.success("密码重置成功", {
          description: "即将跳转到登录页面...",
          duration: 2000,
        });

        // 2秒后跳转到登录页
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      }
    } catch (err) {
      setIsLoading(false);
      console.error("重置密码异常:", err);
      toast.error("系统错误", {
        description: "密码重置过程发生异常，请稍后重试",
        duration: 4000,
      });
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="p-0">
          {isValidatingToken ? (
            // 正在验证 token
            <div className="p-6 md:p-8">
              <div className="flex flex-col gap-6 items-center justify-center min-h-[300px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <p className="text-muted-foreground text-sm">正在验证链接...</p>
              </div>
            </div>
          ) : tokenError ? (
            // token 无效
            <div className="p-6 md:p-8">
              <div className="flex flex-col gap-6">
                <div className="flex flex-col items-center text-center">
                  <h1 className="text-2xl font-bold">重 置 密 码</h1>
                </div>

                <Alert variant="destructive" className="border-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle className="text-sm font-semibold">
                    链接无效或已过期
                  </AlertTitle>
                  <AlertDescription className="mt-2">
                    <p className="text-xs">
                      该重置密码链接已过期或无效。请返回登录页面，重新申请重置密码。
                    </p>
                  </AlertDescription>
                </Alert>

                <Button
                  onClick={() => router.push("/forgot-password")}
                  className="w-full"
                >
                  重新申请重置密码
                </Button>

                <div className="text-center text-sm">
                  <a
                    href="/login"
                    className="text-primary hover:underline underline-offset-4"
                  >
                    ← 返回登录
                  </a>
                </div>
              </div>
            </div>
          ) : (
            // 显示重置密码表单
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 md:p-8">
              <div className="flex flex-col gap-6">
                <div className="flex flex-col items-center text-center">
                  <h1 className="text-2xl font-bold">重 置 密 码</h1>
                  <p className="text-muted-foreground text-sm mt-2">
                    请输入您的新密码
                  </p>
                </div>

                {/* 重置成功 Alert */}
                {resetSuccess && (
                  <Alert className="border-2 border-green-500 bg-green-50 dark:bg-green-950">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertTitle className="text-sm font-semibold text-green-800 dark:text-green-200">
                      密码重置成功
                    </AlertTitle>
                    <AlertDescription className="mt-2">
                      <p className="text-xs text-green-700 dark:text-green-300">
                        您的密码已成功重置，即将跳转到登录页面...
                      </p>
                    </AlertDescription>
                  </Alert>
                )}


                <PasswordInput
                  id="password"
                  label="新密码"
                  placeholder="请输入新密码"
                  register={register}
                  error={errors.password?.message}
                  disabled={isLoading || resetSuccess}
                />

                <PasswordInput
                  id="confirm"
                  label="确认新密码"
                  placeholder="请再次输入新密码"
                  register={register}
                  error={errors.confirm?.message}
                  disabled={isLoading || resetSuccess}
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading || resetSuccess}
                >
                  {isLoading ? "重置中..." : resetSuccess ? "重置成功" : "重置密码"}
                </Button>

                <div className="text-center text-sm">
                  <a
                    href="/login"
                    className="text-primary hover:underline underline-offset-4"
                  >
                    ← 返回登录
                  </a>
                </div>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
      <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </div>
    </div>
  );
}

