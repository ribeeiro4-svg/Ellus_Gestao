'use client'
import React from 'react'
import ApresentacaoDiretoria from '@/features/diretoria/components/ApresentacaoDiretoria'
import { FinanceiroProvider } from '@/lib/hooks/useFinanceiro'
import { AssociadosProvider } from '@/lib/hooks/useAssociados'
import { MetasProvider } from '@/lib/hooks/useMetas'
import { ProjecaoProvider } from '@/lib/hooks/useProjecao'

import { ExecutiveInsightProvider } from '@/lib/eip/providers/ExecutiveInsightProvider'

export default function DiretoriaPage() {
  return (
    <FinanceiroProvider>
      <AssociadosProvider>
        <MetasProvider>
          <ProjecaoProvider>
            <ExecutiveInsightProvider>
              <ApresentacaoDiretoria />
            </ExecutiveInsightProvider>
          </ProjecaoProvider>
        </MetasProvider>
      </AssociadosProvider>
    </FinanceiroProvider>
  )
}
