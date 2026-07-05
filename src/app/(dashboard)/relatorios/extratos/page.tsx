'use client'

import React from 'react'
import dynamic from 'next/dynamic'
import EIPReportContainer from '@/components/eip/EIPReportContainer'
import { FileText } from 'lucide-react'

// Importando dinamicamente o componente original sem alterar sua lógica interna
const RelatoriosFinanceirosTab = dynamic(
  () => import('@/features/financeiro/components/RelatoriosFinanceirosTab'),
  { ssr: false }
)

export default function ExtratosPage() {
  return (
    <div className="space-y-8 pb-10">
      <EIPReportContainer
        title="Extratos & Documentos (Financeiro)"
        description="Emissão de extratos, relatórios de provisões e fluxo de caixa analítico bruto."
        reportId="extratos-operacionais"
      >
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden p-1">
          {/* O componente original requer a prop cashReservePercentage. 
              Passamos um default razoável (ex: 20) como estava sendo usado no Financeiro */}
          <RelatoriosFinanceirosTab cashReservePercentage={20} />
        </div>
      </EIPReportContainer>
    </div>
  )
}
