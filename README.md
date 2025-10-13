# Admin Template - 现代化管理后台模板

<div align="center">
  <h1>🚀 Admin Template</h1>
  <p>基于 Next.js 15 + TypeScript + Tailwind CSS 的现代化管理后台模板</p>
  <p>
    <img src="https://img.shields.io/badge/Next.js-15.5.2-black" alt="Next.js Version" />
    <img src="https://img.shields.io/badge/TypeScript-5.9.3-blue" alt="TypeScript Version" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC" alt="Tailwind CSS Version" />
    <img src="https://img.shields.io/badge/better--auth-1.3.24-green" alt="Better Auth Version" />
  </p>
</div>


##  功能特性

###  完整的认证系统
- **多种登录方式**：邮箱密码登录、OAuth 社交登录（Apple、Google、Meta）
- **注册功能**：邮箱注册、邮箱验证
- **密码管理**：忘记密码、重置密码
- **安全特性**：
  - 滑块验证码防机器人
  - 登录失败次数限制
  - 请求频率限制（防暴力破解）
  - 用户封禁管理

###  现代化 UI/UX
- **响应式设计**：完美适配桌面、平板、手机
- **深色模式**：支持明暗主题切换
- **组件库**：基于 Shadcn/ui 的精美组件
- **动画效果**：流畅的页面过渡和交互动画

###  安全防护
- **验证码系统**：
  - 自定义滑块验证码
  - 支持多种类型（登录、注册、忘记密码）
  - Redis 缓存验证状态
  - 防重放攻击
- **会话管理**：
  - JWT Token 认证
  - 会话过期自动刷新
  - 单点登录支持

###  管理功能
- **用户管理**：用户列表、编辑、封禁/解封
- **站点设置**：网站基本信息配置
- **权限控制**：基于角色的访问控制（开发中）

###  性能优化
- **Next.js 15 App Router**：服务端渲染、流式传输
- **Redis 缓存**：验证码、会话、频率限制
- **数据库优化**：Drizzle ORM、连接池管理

##  技术栈

### 前端技术
- **框架**: [Next.js 15.5.2](https://nextjs.org/) (App Router)
- **语言**: [TypeScript 5.9.3](https://www.typescriptlang.org/)
- **样式**: [Tailwind CSS 4.0](https://tailwindcss.com/)
- **UI 组件**: [Shadcn/ui](https://ui.shadcn.com/)
- **表单**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **状态管理**: React Context API
- **图表**: [Recharts](https://recharts.org/)

### 后端技术
- **认证**: [Better Auth 1.3.24](https://better-auth.com/)
- **数据库**: MySQL 8.0 + [Drizzle ORM](https://orm.drizzle.team/)
- **缓存**: [Redis](https://redis.io/) (Upstash)
- **邮件**: [Nodemailer](https://nodemailer.com/)
- **验证**: 自定义滑块验证码系统

### 开发工具
- **包管理**: npm / yarn / pnpm
- **代码规范**: ESLint + Prettier
- **Git Hooks**: Husky (推荐)

##  项目结构

```
admin-template/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # 认证相关页面（登录、注册等）
│   │   ├── admin/             # 管理后台页面
│   │   ├── api/               # API 路由
│   │   │   ├── auth/          # 认证相关 API
│   │   │   ├── captcha/       # 验证码 API
│   │   │   └── site-settings/ # 站点设置 API
│   │   └── layout.tsx         # 根布局
│   ├── components/            # React 组件
│   │   ├── ui/               # 基础 UI 组件（Shadcn/ui）
│   │   └── m_ui/             # 自定义业务组件
│   ├── db/                   # 数据库相关
│   │   ├── schema/           # Drizzle Schema 定义
│   │   └── index.ts          # 数据库连接
│   ├── lib/                  # 工具库
│   │   ├── auth.ts           # Better Auth 配置
│   │   ├── auth-client.ts    # 客户端认证
│   │   ├── redis.ts          # Redis 配置
│   │   ├── mailer.ts         # 邮件服务
│   │   └── utils.ts          # 工具函数
│   └── middleware.ts         # Next.js 中间件
├── public/                   # 静态资源
│   ├── avatars/             # 用户头像
│   └── captcha/             # 验证码图片
├── drizzle.config.ts        # Drizzle 配置
├── next.config.ts           # Next.js 配置
├── tailwind.config.ts       # Tailwind 配置
├── package.json             # 项目依赖
└── .env.example             # 环境变量示例
```

##  快速开始

### 前置要求

- Node.js 18+
- MySQL 8.0+
- Redis (可选：使用 Upstash Redis)
- npm/yarn/pnpm

### 安装步骤

1. **克隆项目**
```bash
git clone http://zhai.cm:3000/mouzhai/admin_tmplate.git
cd admin-template
```

2. **安装依赖**
```bash
npm install
# 或
yarn install
# 或
pnpm install
```

3. **环境配置**
复制 `.env.example` 为 `.env.local` 并填写配置：
```bash
cp .env.example .env.local
```

4. **数据库迁移**
```bash
npm run db:push
# 或
npm run db:migrate
```

5. **启动开发服务器**
```bash
npm run dev
```

访问 http://localhost:3000 查看项目

##  环境配置

创建 `.env.local` 文件并配置以下环境变量：

```env
# 数据库配置
DATABASE_URL="mysql://user:password@localhost:3306/admin_template"

# Redis 配置（Upstash）
UPSTASH_REDIS_REST_URL="https://xxx.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-token"

# Better Auth 配置
BETTER_AUTH_SECRET="your-secret-key"
BETTER_AUTH_URL="http://localhost:3000"

# 邮件配置（SMTP）
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="Admin Template <noreply@example.com>"

# 验证码配置
CAPTCHA_TTL="300" # 验证码有效期（秒）

# 其他配置
NEXT_PUBLIC_APP_NAME="Admin Template"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

##  功能模块

### 认证模块

#### 登录功能
- 邮箱密码登录
- 滑块验证码验证
- 记住登录状态
- 登录失败处理

#### 注册功能
- 邮箱注册
- 密码强度验证
- 邮箱验证
- 条款同意

#### 密码重置
- 忘记密码
- 邮件发送重置链接
- 60秒重发限制
- 安全令牌验证


### 用户管理(开发中)

- 用户列表展示
- 用户信息编辑
- 用户封禁/解封
- 角色权限管理

## 🔧 开发指南

### 添加新页面

1. 在 `src/app` 目录下创建新的路由文件夹
2. 创建 `page.tsx` 文件
3. 使用认证保护（如需要）：

```typescript
import { requireUserSession } from "@/lib/checkSession";

export default async function NewPage() {
  const session = await requireUserSession();
  
  return (
    <div>
      {/* 页面内容 */}
    </div>
  );
}
```

### 添加新组件

1. 在 `src/components` 目录下创建组件
2. 使用 TypeScript 定义 props
3. 导出组件供其他地方使用

### 自定义验证码类型

1. 更新类型定义：
```typescript
// src/components/Captcha.tsx
type?: "login" | "signup" | "forgotPassword" | "yourNewType";
```

2. 在使用处指定类型：
```typescript
<CaptchaVerification type="yourNewType" />
```

### 数据库操作

使用 Drizzle ORM 进行数据库操作：

```typescript
import db from "@/db";
import { user } from "@/db/schema/auth-schema";
import { eq } from "drizzle-orm";

// 查询用户
const users = await db.select().from(user).where(eq(user.email, email));

// 更新用户
await db.update(user).set({ name: "New Name" }).where(eq(user.id, userId));
```

##  部署说明

### Vercel 部署（推荐）

1. 将代码推送到 GitHub
2. 在 Vercel 中导入项目
3. 配置环境变量
4. 部署

### 自托管部署

1. 构建项目：
```bash
npm run build
```

2. 启动生产服务器：
```bash
npm run start
```

3. 使用 PM2 管理进程：
```bash
pm2 start npm --name "admin-template" -- start
```

### Docker 部署

创建 `Dockerfile`：
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
RUN npm ci --production
EXPOSE 3000
CMD ["npm", "start"]
```

##  贡献指南

欢迎贡献代码！请遵循以下步骤：

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

### 代码规范

- 使用 TypeScript 编写代码
- 遵循 ESLint 规则
- 提交前运行 `npm run lint`
- 编写清晰的提交信息

## 📝 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🙏 致谢

- [Next.js](https://nextjs.org/)
- [Shadcn/ui](https://ui.shadcn.com/)
- [Better Auth](https://better-auth.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Drizzle ORM](https://orm.drizzle.team/)

---

<div align="center">
  <p>如果这个项目对你有帮助，请给一个 ⭐️ Star</p>
  <p>Made with ❤️ by MZ</p>
</div>