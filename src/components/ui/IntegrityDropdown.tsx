'use client'
import React, { useState, useRef, useEffect } from 'react'
import { ShieldCheck, CloudLightning, Target, Trash2, RefreshCw, Zap, FileText } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function IntegrityDropdown({
  onIntegracaoTotal,
  onRastrearIrregularidades,
  onLimparProvisoes,
  onLimparExtrato,
  onAuditoriaRecorrencia,
  onLimparProjecao,
  onRecorrenciaLote,
}: any) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  return (
    <div className="relative inline-block text-left z-[100]" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 text-emerald-600 rounded-md text-[9px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-all"
      >
        <ShieldCheck size={12} />
        Gestão de Integridade
        <span className={`ml-1 transition-transform ${isOpen ? 'rotate-180' : ''}`}>v</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 md:w-96 origin-top-right rounded-2xl bg-[#0b2218] shadow-2xl ring-1 ring-emerald-500/20 focus:outline-none overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="p-5 border-b border-white/5">
            <div className="flex items-center gap-3">
              <ShieldCheck className="text-emerald-400" size={20} />
              <div>
                <h3 className="text-emerald-400 text-xs font-black tracking-widest">AUDITORIA E INTEGRIDADE</h3>
                <p className="text-white/40 text-[10px] font-bold">Ferramentas Premium</p>
              </div>
            </div>
          </div>
          
          <div className="p-3 flex flex-col gap-1">
            <button onClick={() => { setIsOpen(false); onIntegracaoTotal && onIntegracaoTotal() }} className="flex items-center gap-4 px-4 py-3 hover:bg-white/5 rounded-xl transition-all text-left group">
              <div className="bg-emerald-500/10 p-2 rounded-lg group-hover:bg-emerald-500/20 transition-all"><CloudLightning size={16} className="text-emerald-400" /></div>
              <div>
                <div className="text-white text-[10px] font-black tracking-widest mb-0.5">INTEGRAÇÃO TOTAL</div>
                <div className="text-white/40 text-[9px] font-bold">Sincronizar Fiscal e Contábil</div>
              </div>
            </button>
            <button onClick={() => { setIsOpen(false); onRastrearIrregularidades ? onRastrearIrregularidades() : alert('Em desenvolvimento...') }} className="flex items-center gap-4 px-4 py-3 hover:bg-white/5 rounded-xl transition-all text-left group">
              <div className="bg-emerald-500/10 p-2 rounded-lg group-hover:bg-emerald-500/20 transition-all"><Target size={16} className="text-emerald-400" /></div>
              <div>
                <div className="text-white text-[10px] font-black tracking-widest mb-0.5">RASTREAR IRREGULARIDADES</div>
                <div className="text-white/40 text-[9px] font-bold">Auditoria Adesão vs Mensalidade</div>
              </div>
            </button>
            <button onClick={() => { setIsOpen(false); onLimparProvisoes && onLimparProvisoes() }} className="flex items-center gap-4 px-4 py-3 hover:bg-white/5 rounded-xl transition-all text-left group">
              <div className="bg-white/5 p-2 rounded-lg group-hover:bg-white/10 transition-all"><Trash2 size={16} className="text-white/40 group-hover:text-white/70" /></div>
              <div>
                <div className="text-white/70 text-[10px] font-black tracking-widest mb-0.5 group-hover:text-white transition-all">LIMPAR PROVISÕES</div>
                <div className="text-white/40 text-[9px] font-bold">Remover mensalidades duplicadas</div>
              </div>
            </button>
            <button onClick={() => { setIsOpen(false); onLimparExtrato && onLimparExtrato() }} className="flex items-center gap-4 px-4 py-3 hover:bg-white/5 rounded-xl transition-all text-left group">
              <div className="bg-white/5 p-2 rounded-lg group-hover:bg-white/10 transition-all"><RefreshCw size={16} className="text-white/40 group-hover:text-white/70" /></div>
              <div>
                <div className="text-white/70 text-[10px] font-black tracking-widest mb-0.5 group-hover:text-white transition-all">LIMPAR EXTRATO</div>
                <div className="text-white/40 text-[9px] font-bold">Conciliações em duplicidade</div>
              </div>
            </button>
            <button onClick={() => { setIsOpen(false); onAuditoriaRecorrencia ? onAuditoriaRecorrencia() : alert('Em desenvolvimento...') }} className="flex items-center gap-4 px-4 py-3 bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/20 rounded-xl transition-all text-left group">
              <div className="bg-emerald-500/20 p-2 rounded-lg shadow-[0_0_15px_rgba(16,185,129,0.3)]"><Zap size={16} className="text-emerald-400" /></div>
              <div>
                <div className="text-emerald-400 text-[10px] font-black tracking-widest mb-0.5">AUDITORIA DE RECORRÊNCIA</div>
                <div className="text-emerald-500/60 text-[9px] font-bold uppercase tracking-wider">Verificar mensalidades faltantes</div>
              </div>
            </button>
            <button onClick={() => { setIsOpen(false); onLimparProjecao ? onLimparProjecao() : alert('Em desenvolvimento...') }} className="flex items-center gap-4 px-4 py-3 hover:bg-rose-500/5 border border-transparent hover:border-rose-500/20 rounded-xl transition-all text-left group">
              <div className="bg-rose-500/10 p-2 rounded-lg group-hover:bg-rose-500/20 transition-all"><Trash2 size={16} className="text-rose-400" /></div>
              <div>
                <div className="text-rose-400/80 text-[10px] font-black tracking-widest mb-0.5 group-hover:text-rose-400 transition-all">LIMPAR PROJEÇÕES INCORRETAS</div>
                <div className="text-rose-500/50 text-[9px] font-bold">Remover padrão (Mês/Ano)</div>
              </div>
            </button>
            <button onClick={() => { setIsOpen(false); onRecorrenciaLote && onRecorrenciaLote() }} className="flex items-center gap-4 px-4 py-3 hover:bg-white/5 rounded-xl transition-all text-left group">
              <div className="bg-white/5 p-2 rounded-lg group-hover:bg-white/10 transition-all"><Zap size={16} className="text-white/40 group-hover:text-white/70" /></div>
              <div>
                <div className="text-white/70 text-[10px] font-black tracking-widest mb-0.5 group-hover:text-white transition-all">RECORRÊNCIA AUTOMÁTICA</div>
                <div className="text-white/40 text-[9px] font-bold">Gerar faturamentos em lote</div>
              </div>
            </button>
            <button onClick={() => { setIsOpen(false); router.push('/auditoria') }} className="flex items-center gap-4 px-4 py-3 hover:bg-white/5 rounded-xl transition-all text-left group">
              <div className="bg-white/5 p-2 rounded-lg group-hover:bg-white/10 transition-all"><FileText size={16} className="text-white/40 group-hover:text-white/70" /></div>
              <div>
                <div className="text-white/70 text-[10px] font-black tracking-widest mb-0.5 group-hover:text-white transition-all">CENTRO DE AUDITORIA</div>
                <div className="text-white/40 text-[9px] font-bold">Histórico completo de logs</div>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
