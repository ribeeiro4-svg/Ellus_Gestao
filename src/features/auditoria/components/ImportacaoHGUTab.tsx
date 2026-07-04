'use client'

import React, { useState, useRef } from 'react'
import { UploadCloud, FileSpreadsheet, CheckCircle2, AlertCircle, Download } from 'lucide-react'
import * as XLSX from 'xlsx'
import { useAssociados } from '@/lib/hooks/useAssociados'
import type { Associado } from '@/lib/types'

interface ImportedRow {
  titular: string
  vencimento: string
  rawVencimento: number
  competencia: string
  atraso: number
  total: number
  situacao: string
  
  // Crossed data
  associadoResponsavel?: Associado
  matchType?: 'titular' | 'dependente' | 'none'
  dependenteNome?: string
}

export default function ImportacaoHGUTab() {
  const { associados, loading } = useAssociados()
  const [data, setData] = useState<ImportedRow[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const processExcel = (buffer: ArrayBuffer) => {
    setIsProcessing(true)
    try {
      const workbook = XLSX.read(buffer, { type: 'array' })
      const firstSheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[firstSheetName]
      const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

      // Pular as 4 primeiras linhas (cabeçalho da planilha) e pegar os dados
      // Row 4 (índice 4) é o cabeçalho das colunas reais: Titular, Vencimento, Competência, Atraso (dias), Total (R$), Situação
      const rows = rawData.slice(5).filter((row: any) => row.length > 0 && row[0])

      const processedRows: ImportedRow[] = rows.map((row: any) => {
        const titularOriginal = String(row[0] || '').trim()
        
        let matchType: 'titular' | 'dependente' | 'none' = 'none'
        let associadoResponsavel: Associado | undefined
        let dependenteNome = ''

        // 1. Buscar se é um associado principal
        const matchPrincipal = associados.find(a => 
          a.nome.trim().toLowerCase() === titularOriginal.toLowerCase()
        )

        if (matchPrincipal) {
          matchType = 'titular'
          associadoResponsavel = matchPrincipal
        } else {
          // 2. Buscar se é um dependente
          for (const assoc of associados) {
            if (Array.isArray(assoc.dependentes)) {
              const depMatch = assoc.dependentes.find((d: any) => 
                d.nome?.trim().toLowerCase() === titularOriginal.toLowerCase()
              )
              if (depMatch) {
                matchType = 'dependente'
                associadoResponsavel = assoc
                dependenteNome = depMatch.nome
                break
              }
            }
          }
        }

        return {
          titular: titularOriginal,
          vencimento: row[1] ? formatExcelDate(row[1]) : '',
          rawVencimento: typeof row[1] === 'number' ? row[1] : 0,
          competencia: row[2] || '',
          atraso: parseInt(row[3] || '0', 10),
          total: parseFloat(row[4] || '0'),
          situacao: row[5] || '',
          associadoResponsavel,
          matchType,
          dependenteNome
        }
      })

      // Ordenar agrupando pelo titular e cronologicamente (vencimento mais antigo primeiro)
      processedRows.sort((a, b) => {
        const nameA = a.titular.toLowerCase()
        const nameB = b.titular.toLowerCase()
        if (nameA < nameB) return -1
        if (nameA > nameB) return 1
        return a.rawVencimento - b.rawVencimento
      })

      setData(processedRows)
    } catch (error) {
      console.error("Erro ao processar planilha:", error)
      alert("Erro ao processar arquivo. Verifique se o formato está correto.")
    } finally {
      setIsProcessing(false)
    }
  }

  const formatExcelDate = (serial: number | string) => {
    if (typeof serial === 'number') {
      const date = new Date((serial - 25569) * 86400 * 1000)
      return date.toLocaleDateString('pt-BR')
    }
    return String(serial)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (evt) => {
      if (evt.target?.result) {
        processExcel(evt.target.result as ArrayBuffer)
      }
    }
    reader.readAsArrayBuffer(file)
  }

  const exportCsv = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Titular,Vencimento,Competencia,Atraso(dias),Valor,Situacao,Responsavel(Sistema),Status Responsavel\n"
      + data.map(r => {
        return `"${r.titular}","${r.vencimento}","${r.competencia}","${r.atraso}","${r.total}","${r.situacao}","${r.associadoResponsavel?.nome || 'NÃO ENCONTRADO'}","${r.associadoResponsavel?.status || '-'}"`
      }).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "cruzamento_hgu.csv");
    document.body.appendChild(link);
    link.click();
  }

  return (
    <div className="bg-white rounded-[40px] border border-slate-100 p-8 shadow-xl shadow-slate-200/40 animate-in fade-in duration-300">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/40 backdrop-blur-md py-4 px-6 rounded-2xl border border-white/60 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-blue-900 flex items-center justify-center text-white shadow-lg shadow-blue-900/20">
            <FileSpreadsheet size={22} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight">Importação HGU</h1>
            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest opacity-70">
              Cruzamento de Inadimplência do Plano de Saúde
            </p>
          </div>
        </div>

        {data.length > 0 && (
          <button 
            onClick={exportCsv}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-[14px] text-[11px] font-black uppercase tracking-wider transition-all"
          >
            <Download size={14} />
            Exportar CSV
          </button>
        )}
      </div>

      {/* CONTEÚDO */}
      {data.length === 0 ? (
        <div 
          className={`flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-3xl p-8 transition-colors ${dragActive ? 'border-blue-500 bg-blue-50/50' : 'border-slate-300 bg-white/30'}`}
          onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragActive(false)
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
              const file = e.dataTransfer.files[0]
              const reader = new FileReader()
              reader.onload = (evt) => {
                if (evt.target?.result) processExcel(evt.target.result as ArrayBuffer)
              }
              reader.readAsArrayBuffer(file)
            }
          }}
        >
          <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-6 shadow-inner">
            <UploadCloud size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-700 mb-2">Importar Planilha de Mensalidades HGU</h3>
          <p className="text-sm text-slate-500 max-w-md text-center mb-6">
            Arraste e solte o arquivo <b>.xlsx</b> fornecido pela HGU, ou clique no botão abaixo.
            O sistema cruzará automaticamente os titulares com nossa base de associados e dependentes.
          </p>
          
          <input 
            type="file" 
            accept=".xlsx, .xls" 
            className="hidden" 
            ref={fileInputRef}
            onChange={handleFileUpload} 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={loading || isProcessing}
            className="bg-[#0e2d22] hover:bg-[#0a2018] text-white px-8 py-3.5 rounded-[16px] text-xs font-black uppercase tracking-widest transition-all shadow-xl disabled:opacity-50"
          >
            {loading ? 'Carregando base de associados...' : isProcessing ? 'Processando Planilha...' : 'Selecionar Arquivo'}
          </button>
        </div>
      ) : (
        <div className="flex-1 bg-white/60 backdrop-blur-md border border-white/60 rounded-3xl p-6 shadow-sm overflow-hidden flex flex-col">
          
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="w-10 h-10 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center">
                <FileSpreadsheet size={18} />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total de Registros</p>
                <p className="text-xl font-black text-slate-800">{data.length}</p>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                <CheckCircle2 size={18} />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Responsáveis Encontrados</p>
                <p className="text-xl font-black text-emerald-600">{data.filter(d => d.matchType !== 'none').length}</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="w-10 h-10 bg-red-100 text-red-600 rounded-xl flex items-center justify-center">
                <AlertCircle size={18} />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Não Identificados</p>
                <p className="text-xl font-black text-red-600">{data.filter(d => d.matchType === 'none').length}</p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-sm text-slate-600 whitespace-nowrap">
              <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="px-6 py-4">Titular (Planilha)</th>
                  <th className="px-6 py-4">Vencimento</th>
                  <th className="px-6 py-4">Atraso</th>
                  <th className="px-6 py-4">Valor</th>
                  <th className="px-6 py-4">Situação (HGU)</th>
                  <th className="px-6 py-4 bg-emerald-50/50">Responsável Encontrado</th>
                  <th className="px-6 py-4 bg-emerald-50/50">Status na Associação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {data.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-800">
                      {row.titular}
                    </td>
                    <td className="px-6 py-4">
                      {row.vencimento} <span className="text-[10px] text-slate-400 ml-1">({row.competencia})</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${row.atraso > 60 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                        {row.atraso} dias
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(row.total)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                        {row.situacao}
                      </span>
                    </td>
                    <td className="px-6 py-4 bg-emerald-50/30">
                      {row.matchType !== 'none' ? (
                        <div className="flex flex-col">
                          <span className="font-bold text-[#0e2d22]">{row.associadoResponsavel?.nome}</span>
                          {row.matchType === 'dependente' && (
                            <span className="text-[9px] text-blue-600 font-bold tracking-wider uppercase">Dependente Vinculado</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[11px] font-bold text-red-400 italic">Não encontrado</span>
                      )}
                    </td>
                    <td className="px-6 py-4 bg-emerald-50/30">
                      {row.associadoResponsavel ? (
                        <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider ${
                          row.associadoResponsavel.status === 'ativo' ? 'bg-emerald-100 text-emerald-700' :
                          row.associadoResponsavel.status === 'inadimplente' ? 'bg-red-100 text-red-700' :
                          'bg-slate-200 text-slate-600'
                        }`}>
                          {row.associadoResponsavel.status}
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
        </div>
      )}
    </div>
  )
}
