'use client'

import React from 'react'
import { Download, FileText, Printer, FileSpreadsheet } from 'lucide-react'

interface EIPReportContainerProps {
  title: string
  description?: string
  children: React.ReactNode
  reportId?: string
  onExportPDF?: () => void
  onExportExcel?: () => void
  onExportCSV?: () => void
  onPrint?: () => void
  filters?: React.ReactNode
}

export default function EIPReportContainer({
  title,
  description,
  children,
  reportId,
  onExportPDF,
  onExportExcel,
  onExportCSV,
  onPrint,
  filters
}: EIPReportContainerProps) {
  return (
    <div id={reportId} className="space-y-6 bg-transparent">
      {/* Header do Relatório */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
          {description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</p>
          )}
        </div>
        
        {/* Export Actions */}
        <div className="flex items-center space-x-2">
          {onExportPDF && (
            <button onClick={onExportPDF} className="p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 rounded-md transition-colors" title="Exportar PDF">
              <FileText className="w-5 h-5" />
            </button>
          )}
          {onExportExcel && (
            <button onClick={onExportExcel} className="p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 rounded-md transition-colors" title="Exportar Excel">
              <FileSpreadsheet className="w-5 h-5" />
            </button>
          )}
          {onExportCSV && (
            <button onClick={onExportCSV} className="p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 rounded-md transition-colors" title="Exportar CSV">
              <Download className="w-5 h-5" />
            </button>
          )}
          {onPrint && (
            <button onClick={onPrint} className="p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 rounded-md transition-colors" title="Imprimir">
              <Printer className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Área de Filtros Específicos do Relatório */}
      {filters && (
        <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm">
          {filters}
        </div>
      )}

      {/* Conteúdo do Relatório */}
      <div className="grid gap-6">
        {children}
      </div>
    </div>
  )
}
