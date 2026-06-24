'use client'
import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Lancamento } from '@/lib/types'
import { ChevronDown, ChevronRight, Loader2 } from 'lucide-react'

export function AssociadoLancamentos({ associadoId }: { associadoId: string }) {
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([])
  const [loading, setLoading] = useState(true)
  const [expandPagos, setExpandPagos] = useState(false)

  useEffect(() => {
    async function fetchLancamentos() {
      if (!associadoId) return;
      setLoading(true);
      const sb = createClient();
      const { data } = await sb.from('lancamentos')
        .select('*')
        .eq('associado_id', associadoId)
        .order('data', { ascending: false });
      
      if (data) {
        setLancamentos(data);
      }
      setLoading(false);
    }
    fetchLancamentos();
  }, [associadoId]);

  if (!associadoId) return null;

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-slate-400 text-sm mt-2">
        <Loader2 size={14} className="animate-spin" /> Carregando lançamentos do associado...
      </div>
    )
  }
  
  if (lancamentos.length === 0) {
    return (
      <div className="text-xs text-slate-400 mt-2 italic">Nenhum lançamento financeiro encontrado para este associado.</div>
    )
  }

  const abertos = lancamentos.filter(l => l.status === 'aberto')
  const pagos = lancamentos.filter(l => l.status === 'pago')
  
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  
  const atrasados = abertos.filter(l => new Date(l.data) < hoje)
  const pendentes = abertos.filter(l => new Date(l.data) >= hoje)

  const renderItem = (l: Lancamento) => {
    const isAtrasado = abertos.includes(l) && atrasados.includes(l)
    return (
      <div key={l.id} className="flex flex-col gap-1 text-[11px] p-2 rounded border bg-white border-slate-200">
        <div className="flex justify-between items-start">
          <span className="font-bold text-slate-700">{l.descricao?.replace(/ \[FIXO\]| \[VARIÁVEL\]| \[PARCIAL\]/g, '')}</span>
          <span className="font-bold">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(l.valor)}
          </span>
        </div>
        <div className="flex justify-between items-center mt-1">
          <span className="text-[10px] text-slate-500">{new Date(l.data).toLocaleDateString('pt-BR')}</span>
          {l.status === 'pago' ? (
             <span className="text-[9px] font-black bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded uppercase">PAGO</span>
          ) : isAtrasado ? (
             <span className="text-[9px] font-black bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded uppercase">ATRASADO</span>
          ) : (
             <span className="text-[9px] font-black bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded uppercase">ABERTO</span>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 mt-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
      <h4 className="text-xs font-bold text-slate-700 mb-1">Lançamentos Financeiros (Associado)</h4>
      
      {atrasados.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <h5 className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">Atrasados</h5>
          <div className="flex flex-col gap-1">
            {atrasados.map(renderItem)}
          </div>
        </div>
      )}

      {pendentes.length > 0 && (
        <div className="flex flex-col gap-1.5 mt-2">
          <h5 className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Abertos / A Vencer</h5>
          <div className="flex flex-col gap-1">
            {pendentes.map(renderItem)}
          </div>
        </div>
      )}

      {pagos.length > 0 && (
        <div className="flex flex-col gap-1.5 mt-2">
          <button 
            type="button" 
            onClick={() => setExpandPagos(!expandPagos)}
            className="flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider hover:text-slate-700 transition-colors"
          >
            {expandPagos ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            Pagos ({pagos.length})
          </button>
          
          {expandPagos && (
            <div className="flex flex-col gap-1 mt-1">
              {pagos.map(renderItem)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
