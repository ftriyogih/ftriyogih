'use client'

import { DashboardLayoutContent } from './dashboard-layout-content'
import { Providers } from '@/app/providers'
import { Suspense } from 'react'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" /></div>}>
        <DashboardLayoutContent>{children}</DashboardLayoutContent>
      </Suspense>
    </Providers>
  )
}