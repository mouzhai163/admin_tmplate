import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";
import db from "@/db";
import { websiteInfo } from "@/db/schema/webSite_info";
export async function generateMetadata(): Promise<Metadata> {
  // 链接数据库
  const website_info = await db.select().from(websiteInfo).limit(1).then(res => res[0])

  return {
    title: website_info?.siteName || "默认网站名",
    description: website_info?.siteDesc || "默认网站描述",
    keywords: website_info?.siteKeywords || "默认网站关键词",
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster position="top-center" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
