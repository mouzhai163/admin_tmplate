"use client";

import { useState, useRef, forwardRef, useImperativeHandle } from "react";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Captcha, { CaptchaRef } from "../Captcha";

// 组件属性类型
interface CaptchaVerificationProps {
  /**
   * 验证成功的回调，返回验证token
   */
  onVerified?: (token: string) => void;
  /**
   * 验证失败的回调
   */
  onFail?: () => void;
  /**
   * 自定义复选框文本
   */
  checkboxText?: string;
  /**
   * 自定义验证成功文本
   */
  verifiedText?: string;
  /**
   * 自定义弹窗标题
   */
  dialogTitle?: string;
  /**
   * 自定义弹窗描述
   */
  dialogDescription?: string;
  /**
   * 是否显示成功提示
   */
  showSuccessToast?: boolean;
  /**
   * 自定义样式类名
   */
  className?: string;
  /**
   * 验证码类型：login、signup 或 forgotPassword
   */
  type?: "login" | "signup" | "forgotPassword";
}

// 组件暴露的方法
export interface CaptchaVerificationRef {
  /**
   * 获取验证状态
   */
  isVerified: () => boolean;
  /**
   * 获取验证token
   */
  getToken: () => string;
  /**
   * 重置验证状态
   */
  reset: () => void;
  /**
   * 获取客户端ID
   */
  getClientId: () => string;
}

const CaptchaVerification = forwardRef<CaptchaVerificationRef, CaptchaVerificationProps>(
  (
    {
      onVerified,
      onFail,
      checkboxText = "点击进行人机验证",
      verifiedText = "人机验证已通过",
      dialogTitle = "人机验证",
      dialogDescription = "请完成滑块验证以证明您不是机器人",
      showSuccessToast = true,
      className = "",
      type = "login",
    },
    ref
  ) => {
    const [captchaVerified, setCaptchaVerified] = useState(false);
    const [captchaToken, setCaptchaToken] = useState<string>("");
    const [showCaptchaDialog, setShowCaptchaDialog] = useState(false);
    const [isHumanVerified, setIsHumanVerified] = useState(false);
    
    const captchaRef = useRef<CaptchaRef>(null);

    // 暴露给父组件的方法
    useImperativeHandle(ref, () => ({
      isVerified: () => captchaVerified,
      getToken: () => captchaToken,
      reset: () => {
        setCaptchaVerified(false);
        setCaptchaToken("");
        setIsHumanVerified(false);
        captchaRef.current?.reset();
      },
      getClientId: () => captchaRef.current?.getClientId() || "",
    }));

    // 处理验证成功
    const handleVerificationSuccess = (token: string) => {
      setCaptchaVerified(true);
      setCaptchaToken(token);
      setIsHumanVerified(true);
      
      // 延迟关闭弹窗，让用户看到成功状态
      setTimeout(() => {
        setShowCaptchaDialog(false);
        if (showSuccessToast) {
          toast.success("验证成功", {
            description: "人机验证已通过",
            duration: 2000,
          });
        }
      }, 500);
      
      // 调用父组件的回调
      onVerified?.(token);
    };

    // 处理验证失败
    const handleVerificationFail = () => {
      setCaptchaVerified(false);
      setCaptchaToken("");
      toast.error("验证失败", {
        description: "请重新尝试",
        duration: 2000,
      });
      onFail?.();
    };

    return (
      <>
        {/* 人机验证复选框 */}
        <div className={`flex items-center space-x-2 py-2 ${className}`}>
          <Checkbox
            id="human-verify"
            checked={isHumanVerified}
            onCheckedChange={(checked: boolean | "indeterminate") => {
              if (checked && !isHumanVerified) {
                // 打开验证码弹窗
                setShowCaptchaDialog(true);
              }
            }}
            disabled={isHumanVerified}
            className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600 transition-all duration-300"
          />
          <label
            htmlFor="human-verify"
            className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer select-none transition-all duration-300 ${
              isHumanVerified ? "text-green-600" : ""
            }`}
          >
            {isHumanVerified ? (
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4 animate-in zoom-in duration-300" />
                {verifiedText}
              </span>
            ) : (
              checkboxText
            )}
          </label>
        </div>

        {/* 验证码弹窗 */}
        <Dialog open={showCaptchaDialog} onOpenChange={setShowCaptchaDialog}>
          <DialogContent className="sm:max-w-[360px] p-4">
            <DialogHeader>
              <DialogTitle>{dialogTitle}</DialogTitle>
              <DialogDescription>{dialogDescription}</DialogDescription>
            </DialogHeader>
            <div className="w-full mt-4">
              <Captcha
                ref={captchaRef}
                onSuccess={handleVerificationSuccess}
                onFail={handleVerificationFail}
                autoRefresh={true}
                className="w-full"
                type={type}
              />
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }
);

CaptchaVerification.displayName = "CaptchaVerification";

export default CaptchaVerification;


