'use client'
import Sidebar from '@/components/layout/Sidebar'
import Topbar from '@/components/layout/Topbar'
import { SearchProvider } from '@/lib/contexts/SearchContext'
import ReleaseNotesModal from '@/components/modals/ReleaseNotesModal'
import { GlobalDataProviders } from '@/providers/GlobalDataProviders'
import BackToTopButton from '@/components/ui/BackToTopButton'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SearchProvider>
      <GlobalDataProviders>
        <div className="dashboard-layout flex h-full text-slate-900">
          <Sidebar />
          <div id="main-scroll-container" className="flex-1 flex flex-col min-w-0 h-screen relative overflow-hidden overflow-y-auto scroll-smooth">
            <Topbar />
            <main className="main-content flex-1 flex flex-col min-h-0 p-4 lg:px-8 lg:pb-8 lg:pt-3">
              {children}
            </main>
          </div>
        </div>
        <ReleaseNotesModal />
        <BackToTopButton />
      </GlobalDataProviders>
    </SearchProvider>
  )
}
