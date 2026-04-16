'use client'
import Sidebar from '@/components/layout/Sidebar'
import Topbar from '@/components/layout/Topbar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="dashboard-layout h-full">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <Topbar />
        <main className="main-content flex-1">
          {children}
        </main>
      </div>
    </div>
  )
}
