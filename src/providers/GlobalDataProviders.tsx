'use client'

import { useState, useEffect } from 'react'

import { FechamentoProvider } from '@/lib/hooks/useFechamento'
import { ContasProvider } from '@/lib/hooks/useContas'
import { CategoriasProvider } from '@/lib/hooks/useCategorias'
import { FornecedoresProvider } from '@/lib/hooks/useFornecedores'
import { AssociadosProvider } from '@/lib/hooks/useAssociados'
import { DiretoriaProvider } from '@/lib/hooks/useDiretoria'
import { MetasProvider } from '@/lib/hooks/useMetas'
import { ProjecaoProvider } from '@/lib/hooks/useProjecao'
import { FinanceiroProvider } from '@/lib/hooks/useFinanceiro'

export function GlobalDataProviders({ children }: { children: React.ReactNode }) {
  const [mountedLevel, setMountedLevel] = useState(0)

  useEffect(() => {
    // Montagem progressiva (staggering) para evitar congelamento do navegador
    // devido a múltiplas requisições pesadas simultâneas.
    const t1 = setTimeout(() => setMountedLevel(1), 200)
    const t2 = setTimeout(() => setMountedLevel(2), 600)
    const t3 = setTimeout(() => setMountedLevel(3), 1000)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); }
  }, [])

  return (
    <>
      {mountedLevel < 3 && (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 text-slate-500 fixed inset-0 z-[9999]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-lg font-medium text-slate-700">
            {mountedLevel === 0 && 'Carregando estrutura do sistema...'}
            {mountedLevel === 1 && 'Sincronizando cadastros...'}
            {mountedLevel === 2 && 'Processando dados financeiros...'}
          </p>
          <p className="text-sm text-slate-400 mt-2">Isso garante uma navegação sem travamentos.</p>
        </div>
      )}

      <div style={{ display: mountedLevel >= 3 ? 'block' : 'none' }}>
        <FechamentoProvider>
          <ContasProvider>
            <CategoriasProvider>
              {mountedLevel >= 1 && (
                <FornecedoresProvider>
                  <AssociadosProvider>
                    <DiretoriaProvider>
                      {mountedLevel >= 2 && (
                        <MetasProvider>
                          <ProjecaoProvider>
                            <FinanceiroProvider>
                              {children}
                            </FinanceiroProvider>
                          </ProjecaoProvider>
                        </MetasProvider>
                      )}
                    </DiretoriaProvider>
                  </AssociadosProvider>
                </FornecedoresProvider>
              )}
            </CategoriasProvider>
          </ContasProvider>
        </FechamentoProvider>
      </div>
    </>
  )
}
