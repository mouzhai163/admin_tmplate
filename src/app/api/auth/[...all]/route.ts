import { auth } from "@/lib/auth"; // 指向您的 auth 文件的路径
import { toNextJsHandler } from "better-auth/next-js";

export const { POST, GET } = toNextJsHandler(auth);