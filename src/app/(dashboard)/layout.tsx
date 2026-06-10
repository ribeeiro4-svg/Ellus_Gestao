'use client'
import Sidebar from '@/components/layout/Sidebar'
import Topbar from '@/components/layout/Topbar'
import { SearchProvider } from '@/lib/contexts/SearchContext'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SearchProvider>
      <div className="dashboard-layout flex h-full text-slate-900">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 h-screen relative overflow-hidden overflow-y-auto">
          <Topbar />
          <main className="main-content flex-1 flex flex-col min-h-0 p-4 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </SearchProvider>
  )
}
