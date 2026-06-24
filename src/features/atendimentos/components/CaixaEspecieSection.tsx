'use client'
import React, { useState, useMemo } from 'react'
import { DollarSign, Printer, Calendar, Wallet } from 'lucide-react'
import { useFinanceiro } from '@/lib/hooks/useFinanceiro'
import { gerarFechamentoCaixaPdf } from '../utils/gerarRelatorioCaixa'

export default function CaixaEspecieSection() {
  const { lancamentos } = useFinanceiro()
  const [dataFiltro, setDataFiltro] = useState(new Date().toISOString().split('T')[0])

  // Filtrar apenas recebimentos em dinheiro de adesões
  const caixaLancamentos = useMemo(() => {
    return lancamentos.filter(l => 
      l.forma_pagamento === 'Dinheiro' && 
      l.tipo === 'receita' &&
      (l.descricao?.toUpperCase().includes('ADESÃO') || l.categoria?.toUpperCase().includes('ADESÃO'))
    )
  }, [lancamentos])

  const saldos = useMemo(() => {
    const hoje = new Date(dataFiltro + 'T12:00:00Z') // Força o fuso para não dar offset de dia
    const inicioSemana = new Date(hoje)
    inicioSemana.setDate(hoje.getDate() - hoje.getDay()) // Domingo da semana
    
    let saldoDia = 0
    let saldoSemana = 0
    let saldoMes = 0

    caixaLancamentos.forEach(l => {
      if (!l.data) return
      const dataLancamento = new Date(l.data + 'T12:00:00Z')
      const valor = Number(l.valor) || 0

      // Dia
      if (dataLancamento.toISOString().split('T')[0] === dataFiltro) {
        saldoDia += valor
      }
      
      // Semana (Domingo a Sábado da semana selecionada)
      const fimSemana = new Date(inicioSemana)
      fimSemana.setDate(inicioSemana.getDate() + 6)
      if (dataLancamento >= inicioSemana && dataLancamento <= fimSemana) {
        saldoSemana += valor
      }

      // Mês
      if (dataLancamento.getMonth() === hoje.getMonth() && dataLancamento.getFullYear() === hoje.getFullYear()) {
        saldoMes += valor
      }
    })

    return { saldoDia, saldoSemana, saldoMes }
  }, [caixaLancamentos, dataFiltro])

  const lancamentosDoDia = useMemo(() => {
    return caixaLancamentos.filter(l => {
      const d = l.data
      return d && d.startsWith(dataFiltro)
    })
  }, [caixaLancamentos, dataFiltro])

  const fmtR = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
  }

  const handleFecharCaixa = () => {
    if (lancamentosDoDia.length === 0) {
      alert('Não há movimentações em dinheiro neste dia para fechar.')
      return
    }
    gerarFechamentoCaixaPdf(dataFiltro, lancamentosDoDia, saldos.saldoDia)
  }

  return (
    <div className="mt-8 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col gap-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
            <Wallet className="text-emerald-500" size={24} />
            Caixa (Espécie)
          </h2>
          <p className="text-xs text-slate-500 mt-1">Controle de recebimentos físicos (Taxas de Adesão em Dinheiro)</p>
        </div>
        
        <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-xl border border-slate-100">
          <Calendar size={16} className="text-slate-400 ml-2" />
          <input 
            type="date" 
            value={dataFiltro}
            onChange={(e) => setDataFiltro(e.target.value)}
            className="bg-transparent border-none outline-none text-sm font-bold text-slate-700 cursor-pointer"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex flex-col gap-1">
          <p className="text-[10px] font-black text-emerald-600/70 uppercase tracking-widest">Saldo do Dia</p>
          <p className="text-2xl font-black text-emerald-700">{fmtR(saldos.saldoDia)}</p>
        </div>
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col gap-1">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Acumulado na Semana</p>
          <p className="text-xl font-bold text-slate-700">{fmtR(saldos.saldoSemana)}</p>
        </div>
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col gap-1">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Acumulado no Mês</p>
          <p className="text-xl font-bold text-slate-700">{fmtR(saldos.saldoMes)}</p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between border-b pb-2">
          <h3 className="text-sm font-bold text-slate-700">Movimentações do Dia</h3>
          <button 
            onClick={handleFecharCaixa}
            disabled={lancamentosDoDia.length === 0}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase rounded-xl transition-all ${
              lancamentosDoDia.length > 0 
                ? 'bg-slate-800 text-white hover:bg-slate-900 shadow-md hover:shadow-lg'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Printer size={14} />
            Fechar Caixa
          </button>
        </div>

        {lancamentosDoDia.length === 0 ? (
          <div className="py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <p className="text-sm text-slate-400 font-medium">Nenhum recebimento em espécie neste dia.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {lancamentosDoDia.map(l => (
              <div key={l.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <DollarSign size={18} />
                  </div>
                  <div className="flex flex-col">
                    <p className="text-sm font-bold text-slate-700">{(l as any).associados?.nome || (l as any).associado?.nome || (l as any).associado_nome || '--'}</p>
                    <p className="text-[11px] text-slate-500 uppercase">{l.descricao}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-emerald-600">{fmtR(l.valor)}</p>
                  <p className="text-[10px] text-slate-400 uppercase">{l.status === 'pago' ? 'Recebido' : 'Pendente'}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
