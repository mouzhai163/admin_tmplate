// src/app/page.tsx
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { requireUserSession } from "@/lib/checkSession";
import Link from "next/link";
import { formatToCNTime } from "@/lib/myUtils";

export default async function Page() {
  // 获取会话信息
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // 使用检查函数
  const userSession = await requireUserSession();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* 页面标题 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            用户信息调试页面
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            查看当前登录状态和用户详细信息
          </p>
        </div>

        {/* 登录状态卡片 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            {session?.user ? (
              <>
                <span className="inline-block w-3 h-3 bg-green-500 rounded-full"></span>
                已登录
              </>
            ) : (
              <>
                <span className="inline-block w-3 h-3 bg-red-500 rounded-full"></span>
                未登录
              </>
            )}
          </h2>

          {session?.user ? (
            <div className="space-y-4">
              {/* 用户基本信息 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">用户 ID</p>
                  <p className="text-lg font-mono text-gray-900 dark:text-white break-all">
                    {session.user.id}
                  </p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">用户名</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {session.user.name}
                  </p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">邮箱</p>
                  <p className="text-lg text-gray-900 dark:text-white">
                    {session.user.email}
                  </p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">角色</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      session.user.role === 'admin' 
                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' 
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    }`}>
                      {session.user.role || 'user'}
                    </span>
                  </p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">邮箱验证</p>
                  <p className="text-lg text-gray-900 dark:text-white">
                    {session.user.emailVerified ? (
                      <span className="text-green-600 dark:text-green-400">✅ 已验证</span>
                    ) : (
                      <span className="text-red-600 dark:text-red-400">❌ 未验证</span>
                    )}
                  </p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">封禁状态</p>
                  <p className="text-lg text-gray-900 dark:text-white">
                    {session.user.banned ? (
                      <span className="text-red-600 dark:text-red-400">🚫 已封禁</span>
                    ) : (
                      <span className="text-green-600 dark:text-green-400">✅ 正常</span>
                    )}
                  </p>
                </div>
              </div>

              {/* 封禁详细信息 */}
              {session.user.banned && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-red-900 dark:text-red-200 mb-2">
                    封禁详情
                  </h3>
                  <div className="space-y-2 text-sm">
                    {session.user.bannedAt && (
                      <p className="text-red-800 dark:text-red-300">
                        <span className="font-medium">封禁时间：</span>
                        {formatToCNTime(new Date(session.user.bannedAt))}
                      </p>
                    )}
                    {session.user.bannedUntil ? (
                      <p className="text-red-800 dark:text-red-300">
                        <span className="font-medium">解封时间：</span>
                        {formatToCNTime(new Date(session.user.bannedUntil))}
                      </p>
                    ) : (
                      <p className="text-red-800 dark:text-red-300 font-semibold">
                        ⚠️ 永久封禁
                      </p>
                    )}
                    {session.user.bannedReason && (
                      <p className="text-red-800 dark:text-red-300">
                        <span className="font-medium">封禁原因：</span>
                        {session.user.bannedReason}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* 时间信息 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">创建时间</p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {formatToCNTime(new Date(session.user.createdAt))}
                  </p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">更新时间</p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {formatToCNTime(new Date(session.user.updatedAt))}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                您还未登录，请先登录以查看用户信息
              </p>
              <Link
                href="/login"
                className="inline-block px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                前往登录
              </Link>
            </div>
          )}
        </div>

        {/* 检查函数结果 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            requireUserSession() 结果
          </h2>
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">返回值：</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {userSession ? (
                <span className="text-green-600 dark:text-green-400">✅ 返回了 Session 对象</span>
              ) : (
                <span className="text-red-600 dark:text-red-400">❌ 返回 false</span>
              )}
            </p>
          </div>
        </div>

        {/* 完整 Session 对象 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            完整 Session 对象（JSON）
          </h2>
          <pre className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg overflow-auto text-xs">
            <code className="text-gray-800 dark:text-gray-200">
              {JSON.stringify(session, null, 2)}
            </code>
          </pre>
        </div>

        {/* 快捷链接 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            快捷链接
          </h2>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/login"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              登录页面
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              注册页面
            </Link>
            <Link
              href="/admin"
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              管理后台
            </Link>
            {session?.user && (
              <form action="/api/auth/sign-out" method="POST">
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  退出登录
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}