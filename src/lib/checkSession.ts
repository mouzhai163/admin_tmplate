import { auth } from "@/lib/auth"; // 你的 better-auth 实例
import { headers } from "next/headers";

/**
 * 服务端检查是否登录管理员账户
 * @returns Session对象
 */
export async function requireAdminSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return false;
  }
  if(session?.user.role !== "admin") {
    return false;
  }

  return session; // 可选返回，用于后续逻辑（比如显示用户名）
}

/**
 * 服务端检查是否登录普通账户
 * @returns Session对象
 */
export async function requireUserSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return false;
  }
  return session; // 可选返回，用于后续逻辑（比如显示用户名）
}