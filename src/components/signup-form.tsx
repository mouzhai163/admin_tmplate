"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { PasswordInput } from "./m_ui/PasswordInput";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { useEffect, useState, useRef } from "react";
import CaptchaVerification, { CaptchaVerificationRef } from "./m_ui/CaptchaVerification";

// zod校验规则
const signUpSchema = z
  .object({
    name: z.string().trim().min(1, "用户名不能为空!"),
    email: z.string().trim().email("请输入有效的邮箱地址!").toLowerCase(),
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
type signUpForm = z.infer<typeof signUpSchema>;

export function SignupForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false); // 添加 loading 状态
  const captchaVerificationRef = useRef<CaptchaVerificationRef>(null); // 验证码组件引用

  // 检测用户是否已登录
  useEffect(() => {
    const checkAuth = async () => {
      const session = await authClient.getSession();
      if (session?.data?.user) {
        router.replace("/");
      }
    };
    checkAuth();
  }, [router]); // 修复依赖项

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(signUpSchema),
  });

  const onSubmit = async (FormData: signUpForm) => {
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
      setIsLoading(true); // 开始 loading

      // 创建自定义的请求来传递额外数据
      const response = await fetch("/api/auth/sign-up/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: FormData.name,
          email: FormData.email,
          password: FormData.password,
          captchaToken: captchaToken,
        }),
      });

      const result = await response.json();

      // 处理响应
      setIsLoading(false);
      
      if (!response.ok || result.code) {
        // 这是一个错误响应
        const error = result;
        
        // 注册失败后清理 Redis 记录并重置验证码
        if (captchaToken && captchaVerificationRef.current) {
          const clientId = captchaVerificationRef.current.getClientId();
          fetch("/api/captcha/clear", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              token: captchaToken,
              clientId: clientId,
              type: "signup",
            }),
          }).catch(err => {});
        }
        
        captchaVerificationRef.current?.reset();
        
        let msg = "";
        switch (error.code) {
          case "USER_ALREADY_EXISTS":
            msg = "邮箱已被注册!";
            break;
          case "INVALID_PASSWORD":
            msg = "密码不符合要求，请设置更强的密码";
            break;
          case "INVALID_EMAIL":
            msg = "邮箱格式不正确";
            break;
          case "RATE_LIMITED":
            msg = "操作太频繁，请稍后再试";
            break;
          case "INVALID_CAPTCHA":
            msg = "验证码无效或已过期，请重新验证";
            break;
          default:
            msg = error.message || "未知错误!，请重试";
            break;
        }
        toast.error("注册失败!", {
          description: msg,
          duration: 4000,
        });
        return;
      }

      // 注册成功
      toast.success("注册成功!", {
        description: "邮件已发送至邮箱,请验证账号!",
        duration: 4000,
      });
      
      // 重置验证码状态
      captchaVerificationRef.current?.reset();
      
      setTimeout(() => {
        router.replace("/login");
      }, 1000);
    } catch (err) {
      setIsLoading(false); // 异常时停止 loading
      toast.error("系统错误", {
        description: "注册过程发生异常，请稍后重试",
        duration: 4000,
      });
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="grid w-full max-w-md gap-4 bg-white p-8 rounded-lg shadow-md"
    >
      <h1 className="text-2xl font-semibold text-center">注 册</h1>
      
      {/* 用户名 */}
      <div className="grid">
        <Label htmlFor="name" className="mb-2">
          UserName
        </Label>
        <Input 
          id="name" 
          placeholder="请输入用户名" 
          disabled={isLoading} 
          {...register("name")} 
        />
        {errors.name && (
          <p className="text-xs mt-1 ml-1 text-red-500">
            {errors.name.message}
          </p>
        )}
      </div>

      {/* 邮箱 */}
      <div className="grid">
        <Label htmlFor="email" className="mb-2">
          Email
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="请输入邮箱地址"
          disabled={isLoading}
          {...register("email")}
        />
        {errors.email && (
          <p className="text-xs mt-1 ml-1 text-red-500">
            {errors.email.message}
          </p>
        )}
      </div>

      <PasswordInput
        id="password"
        label="Password"
        placeholder="请输入密码"
        register={register}
        error={errors.password?.message}
        disabled={isLoading}
      />

      <PasswordInput
        id="confirm"
        label="Confirm Password"
        placeholder="请再次输入密码"
        register={register}
        error={errors.confirm?.message}
        disabled={isLoading}
      />
      
      {/* 人机验证组件 */}
      <CaptchaVerification
        ref={captchaVerificationRef}
        type="signup"
        checkboxText="点击进行注册验证"
        verifiedText="验证通过，可以注册"
        dialogTitle="注册验证"
        dialogDescription="请完成滑块验证以继续注册"
      />

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "注册中..." : "创 建 账 户"}
      </Button>

      <p className="text-sm text-center text-muted-foreground">
        已经有账号了?{" "}
        <a href="/login" className="underline font-medium">
          登录
        </a>
      </p>
    </form>
  );
}