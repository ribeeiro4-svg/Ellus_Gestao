'use client'
import React, { useState } from 'react'
import { useHistoricoAdesao } from '@/lib/hooks/useHistoricoAdesao'
import { Clock, Search, Trash2, UserCheck, Phone, CreditCard, Calendar, RefreshCw, Send } from 'lucide-react'

const WHATSAPP_MSG = (nome: string) =>
  `Olá, ${nome}!\n\nPara formalizar sua adesão à ACPROBEC, acesse o link abaixo, preencha seus dados com atenção, e continue para assinatura:\n\n*Atenção ao e-mail que você vai informar, pois a plataforma vai encaminhar um e-mail com um código para validar sua assinatura digital.*\n\nLink: https://app.zapsign.com.br/verificar/doc/dc27a27e-452e-4d27-aa03-1d62b669a1f3\n\n\nEm seguida, o próximo passo é realizar o pagamento da taxa de adesão, no valor de R$50,00.\n\nO pagamento da taxa de adesão (R$50,00), pode ser feito via pix abaixo:\n\nBanco CORA - *Chave: Pix CNPJ:* 64.219.750/0001-31\nAssociação Colaborativa De Profissionais Liberais, Comercio e Setor de Beleza\n\n*Ao concluir, basta nos enviar o comprovante de pagamento!*\n\nPara as mensalidades da associação, os boletos serão enviados para o e-mail que você cadastrar nesse termo de adesão. Sempre com vencimento no dia 10 de cada mês.`

export default function HistoricoAdesaoTab() {
  const { historico, loading, remover, refresh } = useHistoricoAdesao()
  const [busca, setBusca] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const filtrado = historico.filter(h =>
    h.nome_completo.toLowerCase().includes(busca.toLowerCase()) ||
    h.cpf.includes(busca) ||
    h.telefone.includes(busca)
  )

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  const formatCPF = (cpf: string) => {
    const digits = cpf.replace(/\D/g, '')
    if (digits.length === 11)
      return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    return cpf
  }

  const whatsappHref = (nome: string, telefone: string) =>
    `https://wa.me/${telefone.replace(/\D/g, '')}?text=${encodeURIComponent(WHATSAPP_MSG(nome))}`

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Clock size={18} className="text-violet-500" />
            Histórico de Novos Associados
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Registros gerados ao clicar em &quot;Salvar no Histórico&quot;
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-black bg-violet-100 text-violet-700 px-3 py-1.5 rounded-full uppercase tracking-widest">
            {filtrado.length} registro{filtrado.length !== 1 ? 's' : ''}
          </span>
          <button
            onClick={refresh}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            title="Atualizar"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar por nome, CPF ou telefone..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-violet-400 focus:bg-white transition-all"
        />
      </div>

      {/* Conteúdo */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400">Carregando histórico...</p>
        </div>
      ) : filtrado.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
          <UserCheck size={40} className="text-slate-200" />
          <p className="text-sm font-medium">
            {busca ? 'Nenhum resultado encontrado' : 'Nenhum registro ainda'}
          </p>
          <p className="text-xs text-center max-w-xs">
            {busca
              ? 'Tente outro termo de busca'
              : 'Os registros aparecerão aqui após clicar em "Salvar no Histórico"'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtrado.map((h) => (
            <div
              key={h.id}
              className="flex items-center justify-between gap-4 p-4 bg-white border border-slate-200 rounded-2xl hover:border-violet-200 hover:shadow-sm transition-all group"
            >
              {/* Ícone */}
              <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
                <UserCheck size={18} className="text-violet-600" />
              </div>

              {/* Dados */}
              <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  <UserCheck size={12} className="text-slate-400 flex-shrink-0" />
                  <span className="text-sm font-bold text-slate-800 truncate">{h.nome_completo}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CreditCard size={12} className="text-slate-400 flex-shrink-0" />
                  <span className="text-xs text-slate-600 font-mono">{formatCPF(h.cpf)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Phone size={12} className="text-slate-400 flex-shrink-0" />
                  <span className="text-xs text-slate-600 font-mono">{h.telefone}</span>
                </div>
              </div>

              {/* Data */}
              <div className="flex items-center gap-1.5 text-slate-400 flex-shrink-0">
                <Calendar size={12} />
                <span className="text-[11px]">{formatDate(h.created_at)}</span>
              </div>

              {/* Ações */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Botão Formalizar Termo */}
                <a
                  href={whatsappHref(h.nome_completo, h.telefone)}
                  target="_blank"
                  rel="noreferrer"
                  title="Enviar Termo de Adesão via WhatsApp"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white text-[11px] font-black uppercase tracking-wide transition-all border border-emerald-200 hover:border-emerald-500"
                >
                  <Send size={11} />
                  Formalizar Termo
                </a>

                {/* Deletar */}
                {confirmDelete === h.id ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => { remover(h.id); setConfirmDelete(null) }}
                      className="text-[10px] font-black text-red-500 hover:text-red-700 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      Confirmar
                    </button>
                    <button
                      onClick={() => setConfirmDelete(null)}
                      className="text-[10px] text-slate-400 hover:text-slate-600 px-2 py-1 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(h.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    title="Remover registro"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
