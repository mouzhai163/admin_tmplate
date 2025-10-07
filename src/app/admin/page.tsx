import { auth } from '@/lib/auth'
import { headers } from 'next/headers';
import React from 'react'

export default async function Page() {
  const adminInfo = await auth.api.getSession({
    headers: await headers(),
  });

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="grid auto-rows-min gap-4 md:grid-cols-3">
        <ul className="bg-muted/50 aspect-video rounded-xl" >
          <li>邮箱:{adminInfo?.user?.email}</li>
          <li>角色:{adminInfo?.user?.role}</li>
          <li>封禁:{adminInfo?.user?.banned}</li>
          <li>封禁时间:{adminInfo?.user?.bannedAt?.toISOString()}</li>
          <li>解封时间:{adminInfo?.user?.bannedUntil?.toISOString()}</li>
          <li>封禁原因:{adminInfo?.user?.bannedReason}</li>
        </ul>
        <div className="bg-muted/50 aspect-video rounded-xl" />
        <div className="bg-muted/50 aspect-video rounded-xl" />
      </div>
      <div className="bg-muted/50 min-h-[100vh] flex-1 rounded-xl md:min-h-min" />
    </div>
  )
}
