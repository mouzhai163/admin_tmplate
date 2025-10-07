import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';

// 邮件配置类型
interface MailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

// 发送邮件参数类型
export interface SendMailOptions {
  to: string | string[];           // 收件人邮箱
  subject: string;                  // 邮件主题
  text?: string;                    // 纯文本内容
  html?: string;                    // HTML 内容
  from?: string;                    // 发件人（可选，默认使用配置）
  cc?: string | string[];           // 抄送
  bcc?: string | string[];          // 密送
  attachments?: Array<{             // 附件
    filename: string;
    content?: string | Buffer;
    path?: string;
  }>;
}

// 邮件发送结果类型
export interface MailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

class MailerService {
  private transporter: Transporter<SMTPTransport.SentMessageInfo> | null = null;
  private config: MailConfig;
  private defaultFrom: string;

  constructor() {
    // 从环境变量读取配置
    this.config = {
      host: process.env.MAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.MAIL_PORT || '587'),
      secure: process.env.MAIL_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.MAIL_USER || '',
        pass: process.env.MAIL_PASSWORD || '',
      },
    };

    this.defaultFrom = process.env.MAIL_FROM || process.env.MAIL_USER || '';

    // 验证配置
    if (!this.config.auth.user || !this.config.auth.pass) {
      console.warn('⚠️ 邮件服务未配置，请在 .env 中设置 MAIL_USER 和 MAIL_PASSWORD');
    }
  }

  /**
   * 获取或创建 transporter
   */
  private getTransporter(): Transporter<SMTPTransport.SentMessageInfo> {
    if (!this.transporter) {
      this.transporter = nodemailer.createTransport(this.config);
    }
    return this.transporter;
  }

  /**
   * 验证邮件服务配置是否正确
   */
  async verify(): Promise<boolean> {
    try {
      const transporter = this.getTransporter();
      await transporter.verify();
      console.log('✅ 邮件服务器连接成功');
      return true;
    } catch (error) {
      console.error('❌ 邮件服务器连接失败:', error);
      return false;
    }
  }

  /**
   * 发送邮件
   */
  async sendMail(options: SendMailOptions): Promise<MailResult> {
    try {
      // 检查必要参数
      if (!options.to) {
        throw new Error('收件人地址不能为空');
      }
      if (!options.subject) {
        throw new Error('邮件主题不能为空');
      }
      if (!options.text && !options.html) {
        throw new Error('邮件内容不能为空（text 或 html 至少提供一个）');
      }

      const transporter = this.getTransporter();

      // 发送邮件
      const info = await transporter.sendMail({
        from: options.from || this.defaultFrom,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        cc: options.cc ? (Array.isArray(options.cc) ? options.cc.join(', ') : options.cc) : undefined,
        bcc: options.bcc ? (Array.isArray(options.bcc) ? options.bcc.join(', ') : options.bcc) : undefined,
        subject: options.subject,
        text: options.text,
        html: options.html,
        attachments: options.attachments,
      });

      console.log('mailer - 邮件发送成功:', info.messageId);
      
      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error) {
      console.error('mailer - 邮件发送失败:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
      };
    }
  }

/**
 * 发送验证邮件（点击链接验证）
 * @param to 收件人邮箱
 * @param verifyUrl 验证链接
 * @param userName 用户名（可选）
 */
async sendVerificationEmail(
  to: string, 
  verifyUrl: string,
  userName?: string
): Promise<MailResult> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6; 
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
          }
          .container { 
            max-width: 600px; 
            margin: 40px auto; 
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; 
            padding: 40px 30px; 
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
          }
          .content { 
            padding: 40px 30px;
          }
          .content p {
            margin: 0 0 16px 0;
            color: #555;
          }
          .button-container {
            text-align: center;
            margin: 30px 0;
          }
          .button { 
            display: inline-block; 
            background: #667eea; 
            color: white !important; 
            padding: 14px 40px; 
            text-decoration: none; 
            border-radius: 6px;
            font-weight: 600;
            font-size: 16px;
            box-shadow: 0 2px 4px rgba(102, 126, 234, 0.4);
            transition: all 0.3s ease;
          }
          .button:hover { 
            background: #5568d3;
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(102, 126, 234, 0.6);
          }
          .link-section {
            background: #f9f9f9;
            padding: 15px;
            border-radius: 6px;
            margin: 20px 0;
          }
          .link-label {
            font-size: 12px;
            color: #666;
            margin-bottom: 8px;
          }
          .link { 
            color: #667eea;
            word-break: break-all;
            font-size: 13px;
            font-family: monospace;
          }
          .notice {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 12px 16px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .notice p {
            margin: 0;
            color: #856404;
            font-size: 14px;
          }
          .footer { 
            text-align: center; 
            padding: 20px;
            background: #f9f9f9;
            color: #666; 
            font-size: 12px;
            border-top: 1px solid #eee;
          }
          .footer p {
            margin: 5px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>验证您的邮箱</h1>
          </div>
          <div class="content">
            <p>您好${userName ? ` <strong>${userName}</strong>` : ''}，</p>
            <p>感谢您注册 MZ 后台系统！为了确保账户安全，请验证您的邮箱地址。</p>
            
            <div class="button-container">
              <a href="${verifyUrl}" class="button">立即验证邮箱</a>
            </div>
            
            <div class="link-section">
              <div class="link-label">或复制以下链接到浏览器地址栏：</div>
              <div class="link">${verifyUrl}</div>
            </div>
            
            <div class="notice">
              <p><strong>提示：</strong>此验证链接将在 <strong>1 小时</strong>后失效，请尽快完成验证。</p>
            </div>
            
            <p style="margin-top: 30px; font-size: 14px; color: #888;">如果这不是您的操作，请忽略此邮件，您的账户不会被激活。</p>
          </div>
          <div class="footer">
            <p>此邮件由系统自动发送，请勿回复</p>
            <p>© ${new Date().getFullYear()} MZ 后台系统 保留所有权利</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const textContent = `
邮箱验证

您好${userName ? ` ${userName}` : ''}，

感谢您注册 MZ 后台系统！为了确保账户安全，请点击以下链接验证您的邮箱地址：

${verifyUrl}

此验证链接将在 24 小时后失效，请尽快完成验证。

如果这不是您的操作，请忽略此邮件。

---
此邮件由系统自动发送，请勿回复
© ${new Date().getFullYear()} MZ 后台系统
  `.trim();

  return this.sendMail({
    to,
    subject: '验证您的邮箱 - MZ 后台系统',
    html,
    text: textContent,
  });
}

  /**
   * 发送密码重置邮件
   */
  async sendPasswordResetEmail(to: string, resetLink: string, userName?: string): Promise<MailResult> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #f5576c; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>重置密码</h1>
            </div>
            <div class="content">
              <p>您好${userName ? ` ${userName}` : ''}，</p>
              <p>我们收到了您重置密码的请求。请点击下面的按钮重置您的密码：</p>
              <div style="text-align: center;">
                <a href="${resetLink}" class="button">重置密码</a>
              </div>
              <p>或复制以下链接到浏览器：</p>
              <p style="word-break: break-all; color: #667eea;">${resetLink}</p>
              <p>此链接将在 <strong>1 小时</strong> 后失效。</p>
              <p><strong>如果这不是您的操作，请忽略此邮件，您的密码不会被更改。</strong></p>
            </div>
            <div class="footer">
              <p>此邮件由系统自动发送，请勿回复</p>
              <p>&copy; ${new Date().getFullYear()} MZ 后台系统</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendMail({
      to,
      subject: '重置密码',
      html,
      text: `请访问以下链接重置密码：${resetLink}（1小时内有效）`,
    });
  }

  /**
   * 发送通知邮件
   */
  async sendNotificationEmail(
    to: string | string[],
    subject: string,
    message: string,
    type: 'info' | 'warning' | 'success' | 'error' = 'info'
  ): Promise<MailResult> {
    const colors = {
      info: { bg: '#667eea', text: '通知' },
      warning: { bg: '#f5a623', text: '警告' },
      success: { bg: '#4caf50', text: '成功' },
      error: { bg: '#f44336', text: '错误' },
    };

    const color = colors[type];

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: ${color.bg}; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${color.text}</h1>
            </div>
            <div class="content">
              <p>${message}</p>
            </div>
            <div class="footer">
              <p>此邮件由系统自动发送，请勿回复</p>
              <p>&copy; ${new Date().getFullYear()} MZ 后台系统</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendMail({
      to,
      subject,
      html,
      text: message,
    });
  }
}

// 导出单例
const mailer = new MailerService();
export default mailer;

// 也导出类，方便需要创建多个实例的场景
export { MailerService };