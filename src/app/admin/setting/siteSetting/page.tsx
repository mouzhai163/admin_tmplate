"use client";

import React, { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/m_ui/ImageUpload";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

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

      // 表单数据已经通过 form.reset 设置
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


  // 表单提交处理
  const onSubmit = async (data: SiteSettingsForm) => {

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
              <FormField
                control={form.control}
                name="siteLogo"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-start gap-4">
                      <FormLabel className="w-18 flex-shrink-0 pt-2">
                        网站 Logo
                      </FormLabel>
                      <div className="flex-1">
                        <FormControl>
                          <ImageUpload
                            value={field.value}
                            onChange={field.onChange}
                            maxSize={100}
                            previewSize={80}
                          />
                        </FormControl>
                      </div>
                    </div>
                  </FormItem>
                )}
              />

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
