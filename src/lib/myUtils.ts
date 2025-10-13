import { toZonedTime, format } from "date-fns-tz";
import { consola } from "consola";
//日志打印组件
export const logger = consola.withTag("MZ-APP");
/**
 * 获取客户端IP
 * @param req 请求对象
 * @returns 
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getClientIp = (req: any): string => {
  // 工具函数：标准化 IPv4-mapped IPv6
  const normalizeIp = (ip: string): string => {
    if (!ip) return ip;
    // IPv4-mapped IPv6 "::ffff:127.0.0.1"
    const m = ip.match(/::ffff:(\d+\.\d+\.\d+\.\d+)/);
    if (m) return m[1];
    // 去掉端口（如果有）
    return ip.split(":").slice(-1)[0];
  };

  // 1. x-forwarded-for（可能是逗号分隔的多个）
  const forwarded = req.headers?.get("x-forwarded-for");
  if (forwarded) {
    const firstIp = Array.isArray(forwarded)
      ? forwarded[0]
      : forwarded.split(",")[0];
    return normalizeIp(firstIp.trim());
  }

  // 2. 常见代理头
  const realIp = req.headers?.["x-real-ip"] || req.headers?.["cf-connecting-ip"];
  if (realIp) return normalizeIp(realIp);

  // 3. Node.js 原生
  const remoteAddress =
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    req.info?.remoteAddress;
  if (remoteAddress) return normalizeIp(remoteAddress);

  // 4. 兜底
  return "unknown";
};
/**
 * 将UTC时间转换为东八区时间
 * @param date UTC时间
 * @param fmt 时间格式
 * @returns 东八区时间
 */
export function formatToCNTime(date: Date, fmt = "yyyy-MM-dd HH:mm:ss") {
  const timeZone = "Asia/Shanghai";
  const zonedDate = toZonedTime(date, timeZone);
  return format(zonedDate, fmt, { timeZone });
}

/**
 * 格式化东八区时间
 * @param date 东八区时间
 * @returns 格式化后的时间
 */
export const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};


