'use client'
import Sidebar from '@/components/layout/Sidebar'
import Topbar from '@/components/layout/Topbar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="dashboard-layout flex h-full">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 min-h-screen relative overflow-hidden overflow-y-auto">
        <Topbar />
        <main className="main-content flex-1 flex flex-col min-h-0 p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
