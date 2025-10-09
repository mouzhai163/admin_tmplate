"use client";

import { useState, useImperativeHandle, forwardRef, useRef } from "react";
import SliderCaptcha from "rc-slider-captcha";
import type { ActionType } from "rc-slider-captcha";
// import "rc-slider-captcha/dist/index.css";
import { createPuzzle } from "create-puzzle";
import { sleep } from "ut2";
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
   * 验证成功的回调
   */
  onSuccess?: () => void;
  /**
   * 验证失败的回调
   */
  onFail?: (reason: string) => void;
  /**
   * 自定义验证图片列表
   */
  images?: string[];
  /**
   * 自定义配置
   */
  config?: {
    positionTolerance?: number; // 位置误差容忍度（默认5px）
    minDuration?: number; // 最小操作时长（默认300ms）
    maxDuration?: number; // 最大操作时长（默认30000ms）
    minTrailPoints?: number; // 最少轨迹点数（默认5）
    maxYDeviation?: number; // 最大Y轴偏移（默认40px）
    maxTrailJump?: number; // 轨迹最大跳跃（默认50px）
    maxErrorCount?: number; // 最大错误次数（默认5）
  };
  /**
   * 自定义提示文本
   */
  tipText?: {
    default?: string;
    loading?: string;
    moving?: string;
    verifying?: string;
    success?: string;
    error?: string;
  };
  /**
   * 自定义样式
   */
  className?: string;
  /**
   * 是否自动刷新
   */
  autoRefresh?: boolean;
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
}

const Captcha = forwardRef<CaptchaRef, CaptchaProps>(
  (
    {
      onSuccess,
      onFail,
      images = ["/captcha/001.jpg"],
      config = {},
      tipText = {},
      className = "",
      autoRefresh = true,
    },
    ref
  ) => {
    // 状态管理
    const [puzzleX, setPuzzleX] = useState<number>(-1); // 拼图实际位置，初始值-1表示未生成
    const [verified, setVerified] = useState<boolean>(false); // 是否已验证
    const sliderRef = useRef<ActionType | undefined>(undefined); // SliderCaptcha 实例引用

    // 合并配置
    const mergedConfig = {
      positionTolerance: 1,
      minDuration: 300,
      maxDuration: 30000,
      minTrailPoints: 5,
      maxYDeviation: 40,
      maxTrailJump: 50,
      maxErrorCount: 5,
      ...config,
    };

    // 合并提示文本
    const mergedTipText = {
      default: "向右拖动滑块填充拼图",
      loading: "加载中...",
      ...tipText,
    };

    /**
     * 安全的滑块验证函数
     * 多维度检测防止机器人和恶意攻击
     */
    const verifySliderCaptcha = async (data: VerifyParam): Promise<void> => {
      try {
        // 如果已经验证成功，直接返回
        if (verified) {
          return Promise.resolve();
        }
        
        // 1. 检查错误次数限制（防止暴力破解）
        if (data.errorCount >= mergedConfig.maxErrorCount) {
          const reason = "错误次数过多，请刷新后重试";
          toast.error("验证失败", {
            description: reason,
            duration: 3000,
          });
          onFail?.(reason);
          return Promise.reject(reason);
        }

        // 2. 位置验证（允许一定误差）
        // 确保拼图位置已经生成
        if (puzzleX === -1) {
          const reason = "验证码未正确加载";
          onFail?.(reason);
          return Promise.reject(reason);
        }
        
        
        // 直接比较 data.x 和 puzzleX
        const isPositionValid =
          Math.abs(data.x - puzzleX) <= mergedConfig.positionTolerance;
          

        // 3. 时长验证（防止机器人瞬间完成）
        const isDurationValid =
          data.duration >= mergedConfig.minDuration &&
          data.duration <= mergedConfig.maxDuration;

        // 4. 轨迹验证（检查是否有合理的移动轨迹）
        const isTrailValid =
          data.trail && data.trail.length >= mergedConfig.minTrailPoints;

        // 5. Y 轴移动验证（人类操作会有轻微抖动，机器人通常是直线）
        const isYMovementValid =
          Math.abs(data.y) <= mergedConfig.maxYDeviation;

        // 6. 轨迹平滑度验证（检测是否是自然的移动）
        let isTrailSmooth = true;
        if (data.trail && data.trail.length > 1) {
          for (let i = 1; i < data.trail.length; i++) {
            const dx = Math.abs(data.trail[i][0] - data.trail[i - 1][0]);
            if (dx > mergedConfig.maxTrailJump) {
              isTrailSmooth = false;
              break;
            }
          }
        }


        // 综合判断
        if (!isPositionValid) {
          const reason = "位置不正确";
          onFail?.(reason);
          return Promise.reject(reason);
        }

        if (!isDurationValid) {
          const reason =
            data.duration < mergedConfig.minDuration
              ? "操作过快"
              : "操作超时";
          onFail?.(reason);
          return Promise.reject(reason);
        }

        if (!isTrailValid) {
          const reason = "操作异常";
          onFail?.(reason);
          return Promise.reject(reason);
        }

        if (!isYMovementValid) {
          const reason = "操作异常";
          onFail?.(reason);
          return Promise.reject(reason);
        }

        if (!isTrailSmooth) {
          const reason = "操作异常";
          onFail?.(reason);
          return Promise.reject(reason);
        }

        // 模拟延迟（让验证看起来更真实）
        await sleep(300);

        // 验证成功
        // 防止多次触发成功回调
        if (!verified) {
          setVerified(true);
          onSuccess?.();
        }
        return Promise.resolve();
      } catch (error) {
        // 捕获意外错误
        const reason = "验证过程出错";
        onFail?.(reason);
        return Promise.reject(reason);
      }
    };

    /**
     * 生成拼图请求
     */
    const handlePuzzleRequest = async () => {
      try {
        // 检查图片数组是否为空
        if (!images || images.length === 0) {
          throw new Error("没有可用的验证图片");
        }
        
        // 随机选择一张图片
        const randomImage = images[Math.floor(Math.random() * images.length)];

        const puzzle = await createPuzzle(randomImage, {
          width: 60, // 拼图块宽度
          height: 60, // 拼图块高度
          bgWidth: 320, // 背景宽度
          bgHeight: 160, // 背景高度
        });

        // 保存拼图的实际 x 位置
        setPuzzleX(puzzle.x);
        setVerified(false); // 重置验证状态

        return {
          bgUrl: puzzle.bgUrl,
          puzzleUrl: puzzle.puzzleUrl,
        };
      } catch (error) {
        // 错误处理，提供更友好的错误信息
        toast.error("验证码加载失败", {
          description: "请检查网络连接或刷新重试",
          duration: 3000,
        });
        throw error;
      }
    };

    // 暴露给父组件的方法
    useImperativeHandle(ref, () => ({
      refresh: () => {
        if (sliderRef.current?.refresh) {
          sliderRef.current.refresh(true); // 重置错误计数
          setVerified(false);
        }
      },
      reset: () => {
        setVerified(false);
        setPuzzleX(-1); // 重置为未生成状态
      },
      isVerified: () => verified,
    }));

    return (
      <div className={className}>
        <SliderCaptcha
          actionRef={sliderRef}
          request={handlePuzzleRequest}
          onVerify={verifySliderCaptcha}
          limitErrorCount={mergedConfig.maxErrorCount}
          autoRefreshOnError={autoRefresh}
          errorHoldDuration={1000}
          tipText={mergedTipText}
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