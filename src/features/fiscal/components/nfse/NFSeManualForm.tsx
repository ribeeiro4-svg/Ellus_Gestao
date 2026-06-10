
'use client'
import React, { useState, useEffect } from 'react'
import { FileText, Save, Loader2, AlertCircle, Building2, DollarSign, Calculator, MapPin, Search, Eraser } from 'lucide-react'
import { lancarNFSeManualAction } from '@/features/fiscal/actions/nfseActions'
import { fmtR } from '@/lib/utils/formatters'

export default function NFSeManualForm({ onSaved }: { onSaved: () => void }) {
  const [loading, setLoading] = useState(false)
  const [fetchingCnpj, setFetchingCnpj] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const initialData = {
    numero_nfse: '',
    data_emissao: new Date().toISOString().split('T')[0],
    data_competencia: new Date().toISOString().split('T')[0],
    valor_bruto: '',
    valor_irrf: '',
    valor_pis: '',
    valor_cofins: '',
    valor_csll: '',
    valor_iss: '',
    iss_retido: false,
    cnpj_prestador: '',
    razao_social_prestador: '',
    descricao_servico: '',
    codigo_servico_lc116: '',
    // Campos de Endereço
    cep: '',
    logradouro: '',
    numero_end: '',
    complemento: '',
    bairro: '',
    cidade: '',
    uf: ''
  }

  const [formData, setFormData] = useState(initialData)

  const handleLimpar = () => {
    if (confirm('Deseja realmente limpar todos os campos?')) {
      setFormData(initialData)
      setError(null)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      const target = e.target as HTMLInputElement
      setFormData(prev => ({ ...prev, [name]: target.checked }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  // Busca CNPJ via API Pública
  const handleBuscaCnpj = async () => {
    const cleanCnpj = formData.cnpj_prestador.replace(/\D/g, '')
    if (cleanCnpj.length !== 14) return alert('CNPJ Inválido para busca')
    
    setFetchingCnpj(true)
    setError(null)
    try {
      const res = await fetch(`https://publica.cnpj.ws/cnpj/${cleanCnpj}`)
      if (!res.ok) throw new Error('Empresa não encontrada ou limite de busca excedido.')
      const data = await res.json()
      
      if (data && data.razao_social) {
        setFormData(prev => ({
          ...prev,
          razao_social_prestador: data.razao_social,
          cep: data.estabelecimento?.cep || '',
          logradouro: data.estabelecimento?.logradouro || '',
          numero_end: data.estabelecimento?.numero || '',
          complemento: data.estabelecimento?.complemento || '',
          bairro: data.estabelecimento?.bairro || '',
          cidade: data.estabelecimento?.cidade?.nome || '',
          uf: data.estabelecimento?.estado?.sigla || ''
        }))
      }
    } catch (err: any) {
      setError(`Erro na busca: ${err.message}`)
    } finally {
      setFetchingCnpj(false)
    }
  }

  const calcularLiquido = () => {
    const bruto = parseFloat(formData.valor_bruto) || 0
    const irrf = parseFloat(formData.valor_irrf) || 0
    const pis = parseFloat(formData.valor_pis) || 0
    const cofins = parseFloat(formData.valor_cofins) || 0
    const csll = parseFloat(formData.valor_csll) || 0
    const iss = formData.iss_retido ? (parseFloat(formData.valor_iss) || 0) : 0
    
    return bruto - irrf - pis - cofins - csll - iss
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const payload = {
        ...formData,
        valor_bruto: parseFloat(formData.valor_bruto) || 0,
        valor_irrf: parseFloat(formData.valor_irrf) || 0,
        valor_pis: parseFloat(formData.valor_pis) || 0,
        valor_cofins: parseFloat(formData.valor_cofins) || 0,
        valor_csll: parseFloat(formData.valor_csll) || 0,
        valor_iss: parseFloat(formData.valor_iss) || 0,
        valor_liquido: calcularLiquido()
      }

      if (!payload.numero_nfse || !payload.cnpj_prestador || !payload.valor_bruto) {
        throw new Error('Número, CNPJ e Valor Bruto são obrigatórios.')
      }

      const res = await lancarNFSeManualAction(payload)
      if (res.success) {
        alert('NFS-e lançada com sucesso!')
        onSaved()
      } else {
        throw new Error(res.error)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 animate-shake">
          <AlertCircle size={18} />
          <span className="text-xs font-black uppercase tracking-widest">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dados da Nota */}
        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <FileText size={20} />
            </div>
            <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest">Dados da Nota Fiscal</h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Número da Nota</label>
              <input 
                name="numero_nfse"
                value={formData.numero_nfse}
                onChange={handleChange}
                placeholder="Ex: 20240001"
                className="w-full bg-slate-50 border border-slate-100 px-4 py-3 rounded-2xl text-sm font-bold outline-none focus:ring-2 ring-emerald-500/10 focus:border-emerald-500 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Data de Emissão</label>
              <input 
                type="date"
                name="data_emissao"
                value={formData.data_emissao}
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-100 px-4 py-3 rounded-2xl text-sm font-bold outline-none focus:ring-2 ring-emerald-500/10 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Descrição do Serviço</label>
            <textarea 
              name="descricao_servico"
              value={formData.descricao_servico}
              onChange={handleChange}
              rows={3}
              placeholder="Descreva o serviço prestado..."
              className="w-full bg-slate-50 border border-slate-100 px-4 py-3 rounded-2xl text-sm font-bold outline-none focus:ring-2 ring-emerald-500/10 focus:border-emerald-500 transition-all resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Código LC 116</label>
              <input 
                name="codigo_servico_lc116"
                value={formData.codigo_servico_lc116}
                onChange={handleChange}
                placeholder="Ex: 01.01"
                className="w-full bg-slate-50 border border-slate-100 px-4 py-3 rounded-2xl text-sm font-bold outline-none focus:ring-2 ring-emerald-500/10 focus:border-emerald-500 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Competência</label>
              <input 
                type="date"
                name="data_competencia"
                value={formData.data_competencia}
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-100 px-4 py-3 rounded-2xl text-sm font-bold outline-none focus:ring-2 ring-emerald-500/10 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Dados do Prestador */}
        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                <Building2 size={20} />
              </div>
              <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest">Identificação do Prestador</h3>
            </div>
            <div className="flex items-center gap-2">
              <button 
                type="button"
                onClick={handleLimpar}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
              >
                <Eraser size={12} />
                Limpar
              </button>
              <button 
                type="button"
                onClick={handleBuscaCnpj}
                disabled={fetchingCnpj || !formData.cnpj_prestador}
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all disabled:opacity-50"
              >
                {fetchingCnpj ? <Loader2 size={12} className="animate-spin" /> : <Search size={12} />}
                Puxar Dados
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">CNPJ do Prestador</label>
              <input 
                name="cnpj_prestador"
                value={formData.cnpj_prestador}
                onChange={handleChange}
                placeholder="00.000.000/0000-00"
                className="w-full bg-slate-50 border border-slate-100 px-4 py-3 rounded-2xl text-sm font-bold outline-none focus:ring-2 ring-blue-500/10 focus:border-blue-500 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Razão Social / Nome</label>
              <input 
                name="razao_social_prestador"
                value={formData.razao_social_prestador}
                onChange={handleChange}
                placeholder="Nome do fornecedor de serviço"
                className="w-full bg-slate-50 border border-slate-100 px-4 py-3 rounded-2xl text-sm font-bold outline-none focus:ring-2 ring-blue-500/10 focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          {/* Endereço do Prestador */}
          <div className="pt-4 border-t border-slate-50 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <MapPin size={14} className="text-slate-400" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Endereço de Faturamento</span>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">CEP</label>
                <input name="cep" value={formData.cep} onChange={handleChange} className="w-full bg-slate-50 border border-slate-100 px-4 py-3 rounded-2xl text-xs font-bold outline-none" />
              </div>
              <div className="col-span-2 space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Logradouro</label>
                <input name="logradouro" value={formData.logradouro} onChange={handleChange} className="w-full bg-slate-50 border border-slate-100 px-4 py-3 rounded-2xl text-xs font-bold outline-none" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Número</label>
                <input name="numero_end" value={formData.numero_end} onChange={handleChange} className="w-full bg-slate-50 border border-slate-100 px-4 py-3 rounded-2xl text-xs font-bold outline-none" />
              </div>
              <div className="col-span-2 space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Bairro</label>
                <input name="bairro" value={formData.bairro} onChange={handleChange} className="w-full bg-slate-50 border border-slate-100 px-4 py-3 rounded-2xl text-xs font-bold outline-none" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Cidade</label>
                <input name="cidade" value={formData.cidade} onChange={handleChange} className="w-full bg-slate-50 border border-slate-100 px-4 py-3 rounded-2xl text-xs font-bold outline-none" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">UF</label>
                <input name="uf" value={formData.uf} onChange={handleChange} maxLength={2} className="w-full bg-slate-50 border border-slate-100 px-4 py-3 rounded-2xl text-xs font-bold outline-none text-center uppercase" />
              </div>
            </div>
          </div>
        </div>

        {/* Valores e Retenções */}
        <div className="lg:col-span-2 bg-slate-900 rounded-[40px] p-8 lg:p-12 text-white shadow-2xl relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                <DollarSign size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black tracking-tight">Cálculo de Impostos e Retenções</h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400 opacity-80">Preencha os valores para apuração automática</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-white/40 uppercase ml-1">Valor Bruto (R$)</label>
                <input 
                  type="number"
                  step="0.01"
                  name="valor_bruto"
                  value={formData.valor_bruto}
                  onChange={handleChange}
                  placeholder="0,00"
                  className="w-full bg-white/5 border border-white/10 px-4 py-3 rounded-2xl text-sm font-bold outline-none focus:ring-2 ring-emerald-500/50 focus:border-emerald-500 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-white/40 uppercase ml-1">IRRF (R$)</label>
                <input 
                  type="number"
                  step="0.01"
                  name="valor_irrf"
                  value={formData.valor_irrf}
                  onChange={handleChange}
                  placeholder="0,00"
                  className="w-full bg-white/5 border border-white/10 px-4 py-3 rounded-2xl text-sm font-bold outline-none focus:ring-2 ring-emerald-500/50 focus:border-emerald-500 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-white/40 uppercase ml-1">PIS (R$)</label>
                <input 
                  type="number"
                  step="0.01"
                  name="valor_pis"
                  value={formData.valor_pis}
                  onChange={handleChange}
                  placeholder="0,00"
                  className="w-full bg-white/5 border border-white/10 px-4 py-3 rounded-2xl text-sm font-bold outline-none focus:ring-2 ring-emerald-500/50 focus:border-emerald-500 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-white/40 uppercase ml-1">COFINS (R$)</label>
                <input 
                  type="number"
                  step="0.01"
                  name="valor_cofins"
                  value={formData.valor_cofins}
                  onChange={handleChange}
                  placeholder="0,00"
                  className="w-full bg-white/5 border border-white/10 px-4 py-3 rounded-2xl text-sm font-bold outline-none focus:ring-2 ring-emerald-500/50 focus:border-emerald-500 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-white/40 uppercase ml-1">CSLL (R$)</label>
                <input 
                  type="number"
                  step="0.01"
                  name="valor_csll"
                  value={formData.valor_csll}
                  onChange={handleChange}
                  placeholder="0,00"
                  className="w-full bg-white/5 border border-white/10 px-4 py-3 rounded-2xl text-sm font-bold outline-none focus:ring-2 ring-emerald-500/50 focus:border-emerald-500 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-white/40 uppercase ml-1">ISS (R$)</label>
                <div className="relative">
                  <input 
                    type="number"
                    step="0.01"
                    name="valor_iss"
                    value={formData.valor_iss}
                    onChange={handleChange}
                    placeholder="0,00"
                    className="w-full bg-white/5 border border-white/10 px-4 py-3 rounded-2xl text-sm font-bold outline-none focus:ring-2 ring-emerald-500/50 focus:border-emerald-500 transition-all"
                  />
                  <div className="mt-2 flex items-center gap-2">
                    <input 
                      type="checkbox"
                      id="iss_retido"
                      name="iss_retido"
                      checked={formData.iss_retido}
                      onChange={handleChange}
                      className="w-4 h-4 rounded border-white/20 bg-white/5 text-emerald-500 focus:ring-emerald-500"
                    />
                    <label htmlFor="iss_retido" className="text-[10px] font-bold text-white/60 uppercase">ISS Retido</label>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-12 flex flex-col md:flex-row items-center justify-between gap-8 pt-8 border-t border-white/10">
              <div className="flex items-center gap-6">
                <div className="text-center md:text-left">
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-[2px] mb-1">Valor Líquido Apurado</p>
                  <p className="text-4xl font-black text-emerald-400 font-mono tracking-tighter">
                    {fmtR(calcularLiquido())}
                  </p>
                </div>
                <div className="hidden md:block w-px h-12 bg-white/10" />
                <div className="hidden md:flex items-center gap-3 text-white/60">
                  <Calculator size={20} />
                  <span className="text-[10px] font-black uppercase tracking-widest leading-tight">Cálculo em tempo real<br/>incluindo retenções</span>
                </div>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full md:w-auto px-12 py-5 bg-emerald-500 text-slate-900 rounded-[24px] font-black text-sm uppercase tracking-widest shadow-xl shadow-emerald-500/20 hover:bg-emerald-400 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                Salvar Nota Fiscal
              </button>
            </div>
          </div>
          
          {/* Abstract background shapes */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 blur-[120px] rounded-full -mr-64 -mt-64" />
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-500/10 blur-[80px] rounded-full -ml-32 -mb-32" />
        </div>
      </div>
    </form>
  )
}
