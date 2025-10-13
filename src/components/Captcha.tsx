"use client";

import { useState, useImperativeHandle, forwardRef, useRef } from "react";
import SliderCaptcha from "rc-slider-captcha";
import type { ActionType } from "rc-slider-captcha";
// import "rc-slider-captcha/dist/index.css";
import { toast } from "sonner";

// 验证参数类型
type VerifyParam = {
  x: number; // 拼图 x 轴移动值
  y: number; // y 轴移动值
  sliderOffsetX: number; // 滑块 x 轴偏移值
  duration: number; // 操作持续时长（毫秒）
  trail: [number, number][]; // 移动轨迹
  targetType: "puzzle" | "button"; // 操作目标
  errorCount: number; // 连续错误次数
};

// 组件属性类型
interface CaptchaProps {
  /**
   * 验证成功的回调，返回验证token
   */
  onSuccess?: (token: string) => void;
  /**
   * 验证失败的回调
   */
  onFail?: (reason: string) => void;
  /**
   * 自定义样式
   */
  className?: string;
  /**
   * 是否自动刷新
   */
  autoRefresh?: boolean;
  /**
   * 验证码类型：login、signup 或 forgotPassword
   */
  type?: "login" | "signup" | "forgotPassword";
}

// 组件暴露的方法
export interface CaptchaRef {
  /**
   * 手动刷新验证码
   */
  refresh: () => void;
  /**
   * 重置验证码状态
   */
  reset: () => void;
  /**
   * 获取验证状态
   */
  isVerified: () => boolean;
  /**
   * 获取客户端ID
   */
  getClientId: () => string;
}

const Captcha = forwardRef<CaptchaRef, CaptchaProps>(
  ({ onSuccess, onFail, className = "", autoRefresh = true, type = "login" }, ref) => {
    // 状态管理
    const [sessionId, setSessionId] = useState<string>("");
    const [verified, setVerified] = useState<boolean>(false);
    const sliderRef = useRef<ActionType | undefined>(undefined);

    /**
     * 获取或生成客户端唯一ID
     */
    const getClientId = (): string => {
      const storageKey = 'captcha_client_id';
      let clientId = localStorage.getItem(storageKey);
      
      if (!clientId) {
        // 生成一个UUID作为客户端识别码（兼容性更好的方法）
        clientId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
        localStorage.setItem(storageKey, clientId);
      }
      
      return clientId;
    };


    /**
     * 初始化验证码
     */
    const initCaptcha = async () => {
      try {
        const clientId = getClientId();
        
        const response = await fetch("/api/captcha/init", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Client-ID": clientId,  // 发送客户端ID
            "X-Captcha-Type": type,   // 发送验证码类型
          },
        });
        
        const result = await response.json();


        if (!result.success) {
          throw new Error(result.error || "初始化失败");
        }

        setSessionId(result.data.sessionId);
        setVerified(false);

        return {
          bgUrl: result.data.bgUrl,
          puzzleUrl: result.data.puzzleUrl,
        };
      } catch (error) {
        console.error("初始化验证码失败:", error);
        toast.error("验证码加载失败", {
          description: "请检查网络连接或刷新重试",
          duration: 3000,
        });
        throw error;
      }
    };

    /**
     * 验证滑块
     */
    const verifyCaptcha = async (data: VerifyParam): Promise<void> => {
      try {
        // 如果已经验证成功，直接返回
        if (verified) {
          return Promise.resolve();
        }

        // 确保有会话ID
        if (!sessionId) {
          const reason = "验证码未正确加载";
          onFail?.(reason);
          return Promise.reject(reason);
        }

        const response = await fetch("/api/captcha/verify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Client-ID": getClientId(),  // 发送客户端ID
            "X-Captcha-Type": type,        // 发送验证码类型
          },
          body: JSON.stringify({
            sessionId,
            x: data.x,
            y: data.y,
            duration: data.duration,
            trail: data.trail,
          }),
        });

        const result = await response.json();

        if (!result.success) {
          const reason = result.error || "验证失败";
          onFail?.(reason);
          
          // 如果是尝试次数过多，需要刷新
          if (reason.includes("尝试次数过多")) {
            toast.error("验证失败", {
              description: reason,
              duration: 3000,
            });
            // 自动刷新
            if (autoRefresh) {
              setTimeout(() => {
                sliderRef.current?.refresh?.(true);
              }, 1000);
            }
          }
          return Promise.reject(reason);
        }

        // 验证成功
        setVerified(true);
        const token = result.data.token;
        onSuccess?.(token);
        return Promise.resolve();
      } catch (error) {
        console.error("验证失败:", error);
        const reason = "验证过程出错";
        onFail?.(reason);
        return Promise.reject(reason);
      }
    };

    // 暴露给父组件的方法
    useImperativeHandle(ref, () => ({
      refresh: () => {
        if (sliderRef.current?.refresh) {
          sliderRef.current.refresh(true);
          setVerified(false);
          setSessionId("");
        }
      },
      reset: () => {
        setVerified(false);
        setSessionId("");
      },
      isVerified: () => verified,
      getClientId: () => getClientId(),
    }));

    return (
      <div className={className}>
        <SliderCaptcha
          actionRef={sliderRef}
          request={initCaptcha}
          onVerify={verifyCaptcha}
          limitErrorCount={5}
          autoRefreshOnError={autoRefresh}
          errorHoldDuration={1000}
          tipText={{
            default: "向右拖动滑块填充拼图",
            loading: "加载中...",
          }}
          bgSize={{ width: 320, height: 160 }}
          puzzleSize={{ width: 60 }}
          style={{
            "--rcsc-primary": "#3b82f6", // 主题色
            "--rcsc-primary-light": "#60a5fa",
            "--rcsc-error": "#ef4444",
            "--rcsc-error-light": "#f87171",
            "--rcsc-success": "#10b981",
            "--rcsc-success-light": "#34d399",
          }}
        />
      </div>
    );
  }
);

Captcha.displayName = "Captcha";

export default Captcha;