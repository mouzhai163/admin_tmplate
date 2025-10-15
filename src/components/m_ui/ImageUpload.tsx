"use client"

import React, { useState } from "react"
import Image from "next/image"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { X, Upload } from "lucide-react"
import { toast } from "sonner"

interface ImageUploadProps {
  value?: string
  onChange?: (value: string) => void
  onError?: (error: string | null) => void
  maxSize?: number // 单位: KB
  accept?: string
  placeholder?: string
  previewSize?: number // 预览图尺寸
  className?: string
}

export function ImageUpload({
  value,
  onChange,
  onError,
  maxSize = 100, // 默认 100KB
  accept = "image/*",
  placeholder = "",
  previewSize = 80,
  className = "",
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(value || null)
  const [error, setError] = useState<string | null>(null)

  // 清除图片
  const clearImage = () => {
    setPreview(null)
    setError(null)
    onChange?.("")
    onError?.(null)
    
    // 清除文件输入框
    const fileInput = document.getElementById("image-upload-input") as HTMLInputElement
    if (fileInput) {
      fileInput.value = ""
    }
  }

  // 处理文件上传
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]

      // 清除之前的错误状态
      setError(null)
      onError?.(null)

      // 文件类型验证
      if (!file.type.startsWith("image/")) {
        const errorMsg = "请选择图片文件"
        setError(errorMsg)
        onError?.(errorMsg)
        toast.error("文件类型错误", {
          description: errorMsg,
        })
        e.target.value = ""
        setPreview(null)
        onChange?.("")
        return
      }

      // 文件大小验证
      if (file.size > maxSize * 1024) {
        const errorMsg = `文件大小不能超过 ${maxSize}KB`
        setError(errorMsg)
        onError?.(errorMsg)
        toast.error("文件过大", {
          description: errorMsg,
        })
        e.target.value = ""
        setPreview(null)
        onChange?.("")
        return
      }

      // 读取文件
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64String = reader.result as string
        setPreview(base64String)
        onChange?.(base64String)
      }

      reader.onerror = () => {
        const errorMsg = "文件读取失败，请重试"
        setError(errorMsg)
        onError?.(errorMsg)
        toast.error("文件读取失败", {
          description: "请重试或选择其他文件",
        })
        e.target.value = ""
        setPreview(null)
        onChange?.("")
      }

      reader.readAsDataURL(file)
    }
  }

  // 当 value 属性变化时，更新预览
  React.useEffect(() => {
    if (value !== preview) {
      setPreview(value || null)
    }
  }, [value, preview])

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex flex-col gap-3">
        <div className="relative">
          <Input
            id="image-upload-input"
            type="file"
            accept={accept}
            onChange={handleFileChange}
            className="file:mr-4 items-center file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 hover:file:cursor-pointer"
          />
          {!preview && placeholder && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Upload className="h-4 w-4" />
                <span className="text-sm">{placeholder}</span>
              </div>
            </div>
          )}
        </div>
        
        <p className="text-xs text-muted-foreground">
          支持 JPG、PNG、GIF、WebP 格式，文件大小不超过 {maxSize}KB
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-1 text-destructive text-xs bg-destructive/10 px-2 py-1 rounded border border-destructive/20">
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
          <span>{error}</span>
        </div>
      )}

      {preview && (
        <div className="relative inline-block group">
          <div className="relative overflow-hidden rounded-lg border-2 border-dashed border-muted hover:border-muted-foreground/50 transition-colors bg-muted/20">
            <Image
              src={preview}
              alt="预览"
              width={previewSize}
              height={previewSize}
              style={{ width: previewSize, height: previewSize }}
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
          </div>
          <Badge
            variant="destructive"
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 cursor-pointer hover:scale-110 transition-transform shadow-lg border-2 border-background"
            onClick={clearImage}
            title="删除图片"
          >
            <X className="h-3 w-3" />
          </Badge>
        </div>
      )}
    </div>
  )
}
