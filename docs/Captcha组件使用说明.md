# Captcha 组件使用说明

## 📦 组件介绍

`Captcha` 是一个基于滑块拼图的安全验证组件，具有多维度防护机制，可有效防止机器人和自动化攻击。

## 🚀 快速开始

### 基础使用

```tsx
import Captcha from "@/components/Captcha";

export function MyForm() {
  const [verified, setVerified] = useState(false);

  return (
    <div>
      <Captcha
        onSuccess={() => {
          setVerified(true);
          console.log("验证成功！");
        }}
        onFail={(reason) => {
          setVerified(false);
          console.log("验证失败:", reason);
        }}
      />
      <button disabled={!verified}>提交</button>
    </div>
  );
}
```

### 高级使用（带ref控制）

```tsx
import { useRef } from "react";
import Captcha, { CaptchaRef } from "@/components/Captcha";

export function AdvancedForm() {
  const captchaRef = useRef<CaptchaRef>(null);
  const [verified, setVerified] = useState(false);

  const handleSubmit = async () => {
    if (!captchaRef.current?.isVerified()) {
      alert("请先完成验证");
      return;
    }
    // 处理表单提交
  };

  const handleReset = () => {
    captchaRef.current?.reset(); // 重置验证码状态
    captchaRef.current?.refresh(); // 刷新验证码图片
  };

  return (
    <div>
      <Captcha
        ref={captchaRef}
        onSuccess={() => setVerified(true)}
        onFail={() => setVerified(false)}
        debug={true} // 开启调试模式
      />
      <button onClick={handleSubmit}>提交</button>
      <button onClick={handleReset}>重置</button>
    </div>
  );
}
```

## 📋 API 参考

### Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `onSuccess` | `() => void` | - | 验证成功回调 |
| `onFail` | `(reason: string) => void` | - | 验证失败回调 |
| `debug` | `boolean` | `false` | 是否显示调试信息 |
| `images` | `string[]` | `["/captcha/001.jpg"]` | 验证图片列表 |
| `config` | `object` | 见下方 | 验证配置 |
| `tipText` | `object` | 见下方 | 提示文本配置 |
| `className` | `string` | `""` | 自定义样式类名 |
| `autoRefresh` | `boolean` | `true` | 错误后是否自动刷新 |

### Config 配置项

```typescript
{
  positionTolerance: 5,    // 位置误差容忍度（像素）
  minDuration: 300,        // 最小操作时长（毫秒）
  maxDuration: 30000,      // 最大操作时长（毫秒）
  minTrailPoints: 5,       // 最少轨迹点数
  maxYDeviation: 40,       // 最大Y轴偏移（像素）
  maxTrailJump: 50,        // 轨迹最大跳跃（像素）
  maxErrorCount: 5         // 最大错误次数
}
```

### TipText 提示文本

```typescript
{
  default: "向右拖动滑块填充拼图",
  loading: "加载中...",
  moving: "释放即可验证",
  verifying: "验证中...",
  success: "验证成功",
  error: "验证失败，请重试"
}
```

### Ref 方法

通过 `ref` 可以调用以下方法：

| 方法 | 类型 | 说明 |
|------|------|------|
| `refresh()` | `() => void` | 刷新验证码（生成新图片） |
| `reset()` | `() => void` | 重置验证状态 |
| `isVerified()` | `() => boolean` | 获取当前验证状态 |

## 🎨 样式定制

组件支持 CSS 变量定制主题色：

```css
.my-captcha {
  --rcsc-primary: #3b82f6;        /* 主题色 */
  --rcsc-primary-light: #60a5fa;  /* 主题色（浅） */
  --rcsc-error: #ef4444;           /* 错误色 */
  --rcsc-error-light: #f87171;     /* 错误色（浅） */
  --rcsc-success: #10b981;         /* 成功色 */
  --rcsc-success-light: #34d399;   /* 成功色（浅） */
}
```

## 🔒 安全特性

组件内置六大安全验证维度：

1. **位置验证** - 验证滑块位置是否准确
2. **时长验证** - 防止机器人瞬间完成
3. **轨迹验证** - 检查是否有真实拖动轨迹
4. **Y轴验证** - 检测人类的自然抖动
5. **轨迹平滑度** - 检测不自然的跳跃
6. **错误次数限制** - 防止暴力破解

## 💡 使用场景

### 1. 登录表单

```tsx
<LoginForm>
  <Input name="username" />
  <Input name="password" type="password" />
  <Captcha onSuccess={() => setCanSubmit(true)} />
  <Button disabled={!canSubmit}>登录</Button>
</LoginForm>
```

### 2. 注册表单

```tsx
<RegisterForm>
  {/* 表单字段 */}
  <Captcha 
    onSuccess={() => enableSubmit()}
    config={{ minDuration: 500 }} // 注册时增加难度
  />
</RegisterForm>
```

### 3. 敏感操作

```tsx
<DeleteConfirmDialog>
  <p>确定要删除吗？</p>
  <Captcha 
    onSuccess={performDelete}
    tipText={{ default: "滑动验证以确认删除" }}
  />
</DeleteConfirmDialog>
```

## 📝 注意事项

1. **图片准备**
   - 建议准备多张验证图片（10+）
   - 图片应有足够的细节和对比度
   - 图片尺寸建议：320x160 像素以上

2. **安全建议**
   - 生产环境关闭 `debug` 模式
   - 配合后端验证使用
   - 定期更新图片库

3. **性能优化**
   - 图片使用 CDN 加速
   - 启用图片懒加载
   - 合理设置错误次数限制

## 🤝 配合后端

虽然前端验证提供了基础防护，但建议配合后端验证：

```javascript
// 后端验证示例（Node.js）
app.post('/api/verify-captcha', async (req, res) => {
  const { x, duration, trail } = req.body;
  
  // 验证逻辑
  if (isValidCaptcha(x, duration, trail)) {
    // 生成验证令牌
    const token = generateToken();
    res.json({ success: true, token });
  } else {
    res.status(400).json({ success: false });
  }
});
```

## 📚 更多示例

查看 `src/components/login-form.tsx` 中的完整实现示例。
