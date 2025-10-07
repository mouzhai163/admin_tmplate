"use client";

import React, { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { X } from "lucide-react";

// Zod Schema 定义
const siteSettingsSchema = z.object({
  siteName: z
    .string()
    .min(1, "网站名称不能为空")
    .max(50, "网站名称不能超过50个字符"),
  siteDesc: z
    .string()
    .min(1, "网站描述不能为空")
    .max(200, "网站描述不能超过200个字符"),
  siteKeywords: z.string().optional(),
  siteLogo: z.string().optional(),
});

type SiteSettingsForm = z.infer<typeof siteSettingsSchema>;

export default function SiteSettingsPage() {
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);

  // 使用 react-hook-form
  const form = useForm<SiteSettingsForm>({
    resolver: zodResolver(siteSettingsSchema),
    defaultValues: {
      siteName: "",
      siteDesc: "",
      siteKeywords: "",
      siteLogo: "",
    },
  });

  // 在组件顶部添加状态管理
  const [isLoading, setIsLoading] = useState(true);

  // 添加数据获取函数
  const fetchSiteSettings = async () => {
    try {
      setIsLoading(true);
      // 这里从数据库中取数据
      const response = await fetch("/api/site-settings");
      const data = await response.json();
      // 更新表单默认值
      form.reset({
        siteName: data.siteName || "",
        siteDesc: data.siteDesc || "",
        siteKeywords: data.siteKeywords || "",
        siteLogo: data.siteLogo || "",
      });

      // 如果有logo，设置预览
      if (data.siteLogo) {
        setLogoPreview(data.siteLogo);
      }
    } catch (error) {
      console.error("获取网站设置失败:", error);
      toast.error("获取数据失败", {
        description: "请刷新页面重试",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 在组件中添加useEffect
  useEffect(() => {
    fetchSiteSettings();
  }, []);

  // 清除图片预览
  const clearLogoPreview = () => {
    setLogoPreview(null);
    setLogoError(null);
    form.setValue("siteLogo", "");
    // 清除文件输入框
    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }
  };

  // 文件上传处理
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // 清除之前的错误状态
      setLogoError(null);

      // 文件验证
      if (!file.type.startsWith("image/")) {
        const errorMsg = "请选择图片文件";
        setLogoError(errorMsg);
        toast.error("文件类型错误", {
          description: errorMsg,
        });
        // 清除文件输入和预览
        e.target.value = "";
        setLogoPreview(null);
        form.setValue("siteLogo", "");
        return;
      }

      if (file.size > 100 * 1024) {
        // 100KB 限制
        const errorMsg = "文件大小不能超过100KB";
        setLogoError(errorMsg);
        toast.error("文件过大", {
          description: errorMsg,
        });
        // 清除文件输入和预览
        e.target.value = "";
        setLogoPreview(null);
        form.setValue("siteLogo", "");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;

        // 同时更新预览和表单数据
        setLogoPreview(base64String);
        form.setValue("siteLogo", base64String);
      };

      reader.onerror = () => {
        const errorMsg = "文件读取失败，请重试或选择其他文件";
        setLogoError(errorMsg);
        toast.error("文件读取失败", {
          description: "请重试或选择其他文件",
        });
        // 清除文件输入和预览
        e.target.value = "";
        setLogoPreview(null);
        form.setValue("siteLogo", "");
      };

      reader.readAsDataURL(file);
    }
  };

  // 表单提交处理
  const onSubmit = async (data: SiteSettingsForm) => {
    // 检查是否有文件上传错误
    if (logoError) {
      toast.error("保存失败", {
        description: "请检查上传的文件格式是否正确",
      });
      return;
    }

    try {
      const response = await fetch("/api/site-settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error);
      }
      const result = await response.json();
      toast.success("保存成功", {
        description: result.message,
      });
    } catch (error) {
      if (error instanceof Error) {
        toast.error("保存失败", {
          description: error.message,
        });
      } else {
        toast.error("保存失败", {
          description: "服务器异常!",
        });
      }
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-5xl p-6">
        <Card className="shadow-lg rounded-2xl">
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">加载中...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl p-6">
      <Card className="shadow-lg rounded-2xl">
        <CardHeader>
          <CardTitle className="text-xl font-bold">网站设置</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* 网站名称 */}
              <FormField
                control={form.control}
                name="siteName"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-start gap-4 mb-3">
                      <FormLabel className="w-18 flex-shrink-0 pt-2">
                        网站名称<span className="text-red-500 -ml-1">*</span>
                      </FormLabel>
                      <div className="flex-1 relative">
                        <FormControl>
                          <Input placeholder="请输入网站名称" {...field} />
                        </FormControl>
                        {form.formState.errors.siteName && (
                          <FormMessage className="absolute top-full left-0 mt-1 inline-flex items-center gap-1 text-red-500 text-xs bg-red-50 px-2 py-1 rounded border border-red-200 z-10">
                            <svg
                              className="w-3 h-3 flex-shrink-0"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                                clipRule="evenodd"
                              />
                            </svg>
                            <span>
                              {form.formState.errors.siteName?.message}
                            </span>
                          </FormMessage>
                        )}
                      </div>
                    </div>
                  </FormItem>
                )}
              />

              {/* 网站描述 */}
              <FormField
                control={form.control}
                name="siteDesc"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-start gap-4 mb-3">
                      <FormLabel className="w-18 flex-shrink-0 pt-2">
                        网站描述<span className="text-red-500 -ml-1">*</span>
                      </FormLabel>
                      <div className="flex-1 relative">
                        <FormControl>
                          <Textarea
                            placeholder="请输入网站描述"
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        {form.formState.errors.siteDesc && (
                          <FormMessage className="absolute top-full left-0 mt-1 inline-flex items-center gap-1 text-red-500 text-xs bg-red-50 px-2 py-1 rounded border border-red-200 z-10">
                            <svg
                              className="w-3 h-3 flex-shrink-0"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                                clipRule="evenodd"
                              />
                            </svg>
                            <span>
                              {form.formState.errors.siteDesc?.message}
                            </span>
                          </FormMessage>
                        )}
                      </div>
                    </div>
                  </FormItem>
                )}
              />

              {/* 网站关键词 */}
              <FormField
                control={form.control}
                name="siteKeywords"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-start gap-4">
                      <FormLabel className="w-18 flex-shrink-0 pt-2">
                        网站关键词
                      </FormLabel>
                      <div className="flex-1">
                        <FormControl>
                          <Input
                            placeholder="多个关键词用英文逗号分隔"
                            {...field}
                          />
                        </FormControl>
                      </div>
                    </div>
                  </FormItem>
                )}
              />

              {/* 网站 Logo */}
              <div className="flex items-start gap-4">
                <FormLabel className="w-18 flex-shrink-0 pt-2">
                  网站 Logo
                </FormLabel>
                <div className="flex-1 space-y-4 relative">
                  <div className="flex flex-col gap-3">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="file:mr-4 items-center file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 hover:file:cursor-pointer"
                    />
                    <p className="text-xs text-muted-foreground">
                      支持 JPG、PNG、GIF、WebP 格式，文件大小不超过 100KB
                    </p>
                  </div>

                  {logoError && (
                    <div className="absolute top-full left-0 mt-1 flex items-center gap-1 text-destructive text-xs bg-destructive/10 px-2 py-1 rounded border border-destructive/20 z-10">
                      <svg
                        className="w-3 h-3 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>{logoError}</span>
                    </div>
                  )}

                  {logoPreview && (
                    <div className="relative inline-block group">
                      <div className="relative overflow-hidden rounded-lg border-2 border-dashed border-muted hover:border-muted-foreground/50 transition-colors bg-muted/20">
                        <Image
                          src={logoPreview}
                          alt="Logo 预览"
                          width={80}
                          height={80}
                          className="h-20 w-20 object-cover"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                      </div>
                      <Badge
                        variant="destructive"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 cursor-pointer hover:scale-110 transition-transform shadow-lg border-2 border-background"
                        onClick={clearLogoPreview}
                        title="删除图片"
                      >
                        <X className="h-3 w-3" />
                      </Badge>
                    </div>
                  )}
                </div>
              </div>

              {/* 提交按钮 */}
              <div className="flex justify-end">
                <Button type="submit" className="hover:cursor-pointer">保存设置</Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
