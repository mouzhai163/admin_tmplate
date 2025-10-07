"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils"; // shadcn 默认的 className 合并函数

interface PasswordInputProps {
  id: string;
  label?: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean; // ✅ 新增: 添加 disabled 属性
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register?: any;
  className?: string;
}

export function PasswordInput({
  id,
  label,
  placeholder = "请输入密码",
  error,
  disabled = false, // ✅ 新增: 默认值为 false
  register,
  className,
}: PasswordInputProps) {
  const [show, setShow] = useState(false);

  return (
    <div className="grid">
      {label && <Label htmlFor={id} className="mb-2">{label}</Label>}

      <div className="relative">
        <Input
          id={id}
          type={show ? "text" : "password"}
          placeholder={placeholder}
          disabled={disabled} // ✅ 新增: 传递 disabled 给 Input
          {...(register ? register(id) : {})}
          className={cn("pr-10", error && "border-red-500", className)}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setShow((prev) => !prev)}
          disabled={disabled} // ✅ 新增: 禁用切换按钮
          className={cn(
            "absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground",
            disabled && "cursor-not-allowed opacity-50" // ✅ 新增: 禁用时的样式
          )}
        >
          {show ? (
            <EyeOff className="w-5 h-5 cursor-pointer" />
          ) : (
            <Eye className="w-5 h-5 cursor-pointer" />
          )}
        </button>
      </div>
        {error && <p className="text-xs mt-1 ml-1 text-red-500">{error}</p>}
    </div>
  );
}