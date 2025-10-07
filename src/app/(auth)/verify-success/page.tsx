"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

const getErrorMessage = (error: string) => {
  switch (error) {
    case "token_expired":
      return "验证链接已过期，请重新发送验证邮件";
    case "invalid_token":
      return "验证链接无效，请重新发送验证邮件";
    case "already_verified":
      return "该邮箱已经验证过了";
    default:
      return "验证失败，请重试";
  }
};

// ✅ 将主要逻辑提取为独立组件
function VerifySuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [countdown, setCountdown] = useState(5);
  const [status, setStatus] = useState<"success" | "error" | "loading">("loading");
  const [message, setMessage] = useState("");

  // 第一个 useEffect: 初始化状态
  useEffect(() => {
    const error = searchParams.get("error");
    const verified = searchParams.get("verified");
    
    // ✅ 检查是否直接访问 (没有任何参数)
    if (!error && !verified) {
      router.replace("/login");
      return;
    }
    
    if (error) {
      setStatus("error");
      setMessage(getErrorMessage(error));
    } else {
      setStatus("success");
      setMessage("您的邮箱已成功验证，现在可以登录了");
    }
  }, [searchParams, router]);

  // 第二个 useEffect: 处理倒计时和跳转
  useEffect(() => {
    if (status !== "success") return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push("/login");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [status, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50 p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-12 pb-8">
          <div className="flex flex-col items-center space-y-6">
            {/* 图标 */}
            {status === "loading" && (
              <div className="rounded-full bg-blue-100 p-4">
                <Loader2 className="h-16 w-16 text-blue-600 animate-spin" />
              </div>
            )}

            {status === "success" && (
              <div className="rounded-full bg-green-100 p-4 animate-bounce">
                <CheckCircle2 className="h-16 w-16 text-green-600" />
              </div>
            )}

            {status === "error" && (
              <div className="rounded-full bg-red-100 p-4">
                <XCircle className="h-16 w-16 text-red-600" />
              </div>
            )}

            {/* 内容区域 */}
            <div className="text-center space-y-3 px-4">
              {/* 成功和加载状态: 显示标题 + 描述 */}
              {status !== "error" && (
                <>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {status === "loading" && "验证中..."}
                    {status === "success" && "验证成功!"}
                  </h1>
                  <p className="text-gray-600 text-sm">{message}</p>
                </>
              )}
              
              {/* 错误状态: 只显示大号错误信息 */}
              {status === "error" && (
                <h1 className="text-xl font-semibold text-red-600 leading-relaxed px-2">
                  {message}
                </h1>
              )}
            </div>

            {/* 倒计时 */}
            {status === "success" && (
              <div className="text-center space-y-4 w-full">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-blue-800 font-medium">
                    {countdown} 秒后自动跳转到登录页...
                  </p>
                </div>
                <Button onClick={() => router.push("/login")} className="w-full">
                  立即前往登录
                </Button>
              </div>
            )}

            {/* 错误时的操作按钮 */}
            {status === "error" && (
              <div className="flex flex-col gap-3 w-full mt-2">
                <Button onClick={() => router.push("/signup")} className="w-full">
                  重新注册
                </Button>
                <Button onClick={() => router.push("/login")} variant="outline" className="w-full">
                  返回登录
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ✅ 默认导出: 用 Suspense 包裹
export default function VerifySuccessPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    }>
      <VerifySuccessContent />
    </Suspense>
  );
}