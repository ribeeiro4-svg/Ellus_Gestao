import React from 'react'
import ReportsNavigation from '@/components/eip/ReportsNavigation'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Central de Relatórios | EIP',
  description: 'Executive Intelligence Platform',
}



export default function RelatoriosLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-950">
      <div className="px-6 py-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Central de Relatórios (EIP)</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Executive Intelligence Platform - Análises e Indicadores
        </p>
      </div>
      
      <ReportsNavigation />
      
      <main className="flex-1 overflow-auto p-6">
        {children}
      </main>
    </div>
  )
}
