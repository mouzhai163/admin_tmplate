# CaptchaVerification 组件使用指南

## 概述

`CaptchaVerification` 是一个可复用的人机验证组件，结合了复选框和滑块验证码，提供了优雅的用户体验。

## 基本用法

```tsx
import CaptchaVerification, { CaptchaVerificationRef } from "@/components/CaptchaVerification";
import { useRef } from "react";

function MyForm() {
  const captchaRef = useRef<CaptchaVerificationRef>(null);

  const handleSubmit = () => {
    // 检查是否已验证
    if (!captchaRef.current?.isVerified()) {
      alert("请先完成人机验证");
      return;
    }

    // 获取验证token
    const token = captchaRef.current.getToken();
    console.log("验证token:", token);
  };

  return (
    <form>
      {/* 其他表单字段 */}
      
      <CaptchaVerification
        ref={captchaRef}
        onVerified={(token) => {
          console.log("验证成功", token);
        }}
      />
      
      <button onClick={handleSubmit}>提交</button>
    </form>
  );
}
```

## 属性说明

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `onVerified` | `(token: string) => void` | - | 验证成功的回调函数 |
| `onFail` | `() => void` | - | 验证失败的回调函数 |
| `checkboxText` | `string` | "点击进行人机验证" | 复选框文本 |
| `verifiedText` | `string` | "人机验证已通过" | 验证成功后的文本 |
| `dialogTitle` | `string` | "人机验证" | 弹窗标题 |
| `dialogDescription` | `string` | "请完成滑块验证以证明您不是机器人" | 弹窗描述 |
| `showSuccessToast` | `boolean` | `true` | 是否显示成功提示 |
| `className` | `string` | - | 自定义样式类名 |

## 暴露的方法

通过 ref 可以访问以下方法：

- `isVerified()`: 返回是否已验证
- `getToken()`: 获取验证token
- `reset()`: 重置验证状态
- `getClientId()`: 获取客户端ID

## 高级用法示例

### 1. 自定义文本和样式

```tsx
<CaptchaVerification
  ref={captchaRef}
  checkboxText="我不是机器人"
  verifiedText="验证通过 ✓"
  dialogTitle="安全验证"
  dialogDescription="请滑动拼图完成验证"
  className="my-4"
/>
```

### 2. 注册表单示例

```tsx
function SignupForm() {
  const captchaRef = useRef<CaptchaVerificationRef>(null);

  const onSubmit = async (data) => {
    if (!captchaRef.current?.isVerified()) {
      toast.error("请完成人机验证");
      return;
    }

    const captchaToken = captchaRef.current.getToken();
    
    await fetch("/api/signup", {
      method: "POST",
      body: JSON.stringify({
        ...data,
        captchaToken
      })
    });
  };

  return (
    <form onSubmit={onSubmit}>
      <input name="email" type="email" required />
      <input name="password" type="password" required />
      
      <CaptchaVerification
        ref={captchaRef}
        onVerified={() => {
          // 可以在这里启用提交按钮等
        }}
        showSuccessToast={false} // 不显示默认提示
      />
      
      <button type="submit">注册</button>
    </form>
  );
}
```

### 3. 在评论表单中使用

```tsx
function CommentForm() {
  const captchaRef = useRef<CaptchaVerificationRef>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!captchaRef.current?.isVerified()) {
      toast.warning("请先进行人机验证");
      return;
    }

    setIsSubmitting(true);
    // 提交评论...
    
    // 提交后重置验证状态
    captchaRef.current.reset();
    setIsSubmitting(false);
  };

  return (
    <div>
      <textarea placeholder="写下你的评论..." />
      
      <CaptchaVerification
        ref={captchaRef}
        checkboxText="验证后发表评论"
        dialogTitle="发表评论前请验证"
      />
      
      <button 
        onClick={handleSubmit}
        disabled={isSubmitting}
      >
        发表评论
      </button>
    </div>
  );
}
```

## 错误处理

组件内部已经处理了大部分错误情况，但你可以通过 `onFail` 回调来处理特定的错误：

```tsx
<CaptchaVerification
  ref={captchaRef}
  onFail={() => {
    // 自定义错误处理
    console.error("验证失败");
  }}
/>
```

## 注意事项

1. 组件依赖于 localStorage 存储客户端ID，请确保浏览器支持
2. 验证token有时效性，请在获取后尽快使用
3. 组件会自动处理验证码的刷新和重试
4. 验证成功后，复选框会被禁用，防止重复验证
