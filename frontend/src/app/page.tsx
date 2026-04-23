'use client'

import { AppShell } from '@/components/AppShell'
import { Dashboard } from '@/components/pages/Dashboard'

export default function Home() {
  return (
    <AppShell>
      <Dashboard />
    </AppShell>
  )
}
