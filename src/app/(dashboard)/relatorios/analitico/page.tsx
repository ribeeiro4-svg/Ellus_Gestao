'use client'

import React, { useEffect, useState } from 'react'
import EIPReportContainer from '@/components/eip/EIPReportContainer'
import { Card } from '@/components/ui/card'
import { getEIPAnaliticoData } from '@/app/actions/eip/analitico'
import { exportToExcel } from '@/lib/exportUtils'
import { useTenant } from '@/lib/hooks/useTenant'
import { Database, Download, Table2 } from 'lucide-react'

type FonteDados = 'lancamentos' | 'projetos' | 'associados';

export default function AnaliticoPage() {
  const { tenant } = useTenant()
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [fonte, setFonte] = useState<FonteDados>('lancamentos')

  useEffect(() => {
    async function loadData() {
      if (!tenant) return
      setLoading(true)
      try {
        const result = await getEIPAnaliticoData(tenant.id, fonte)
        setData(result)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [tenant, fonte])

  // Pega as colunas do primeiro registro para montar a tabela dinamicamente
  const columns = data.length > 0 ? Object.keys(data[0]).filter(k => k !== 'tenant_id') : []

  return (
    <div className="space-y-8 pb-10">
      <EIPReportContainer
        title="Módulo Analítico (Data Grid)"
        description="Extração massiva de dados crus e geração de relatórios tabulares pesados."
        reportId="painel-analitico"
        onExportExcel={() => exportToExcel(data, `Base_${fonte}`)}
        filters={
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Fonte de Dados:</span>
            </div>
            <select 
              value={fonte}
              onChange={(e) => setFonte(e.target.value as FonteDados)}
              className="px-3 py-1.5 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-primary/50 outline-none min-w-[200px]"
            >
              <option value="lancamentos">Financeiro (Lançamentos)</option>
              <option value="associados">Cadastros (Associados)</option>
              <option value="projetos">Projetos & Demandas</option>
            </select>
          </div>
        }
      >
        <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Table2 className="w-4 h-4" />
              <span>{data.length} registros encontrados</span>
            </div>
            <button 
              onClick={() => exportToExcel(data, `Base_${fonte}`)}
              className="flex items-center gap-2 px-3 py-1.5 bg-primary text-white rounded-md text-sm hover:bg-primary/90 transition-colors"
            >
              <Download className="w-4 h-4" />
              Exportar XLSX Completo
            </button>
          </div>

          <div className="overflow-x-auto max-h-[600px] custom-scrollbar">
            {loading ? (
              <div className="flex flex-col items-center justify-center p-12 text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                Carregando base de dados...
              </div>
            ) : data.length === 0 ? (
              <div className="p-12 text-center text-gray-500">Nenhum dado encontrado para esta fonte.</div>
            ) : (
              <table className="w-full text-sm text-left whitespace-nowrap">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-800 sticky top-0 shadow-sm z-10">
                  <tr>
                    {columns.map((col, i) => (
                      <th key={i} className="px-4 py-3 font-medium">
                        {col.replace(/_/g, ' ')}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {data.map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      {columns.map((col, cIdx) => {
                        let val = row[col];
                        if (typeof val === 'boolean') val = val ? 'Sim' : 'Não';
                        if (val === null || val === undefined) val = '-';
                        if (typeof val === 'object') val = JSON.stringify(val);
                        
                        return (
                          <td key={cIdx} className="px-4 py-2 text-gray-900 dark:text-gray-100 max-w-[300px] truncate">
                            {String(val)}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>
      </EIPReportContainer>
    </div>
  )
}
