import React, { useState, useEffect } from 'react';
import { X, User, MessageCircle, Copy, ChevronDown, Clock, AlertTriangle, AlertCircle, CheckCircle2, Info, Trash2, Plus, HandshakeIcon } from 'lucide-react';
import { fmtR } from '@/lib/utils/formatters';
import { TODOS_TEMPLATES, determinarEtapaPorDias } from '@/features/cobranca/utils/cobrancaUtils';

interface CobrancaDrawerProps {
  associadoId: string | null;
  isOpen: boolean;
  onClose: () => void;
  associadoNome?: string;
}

const CANAL_OPTIONS = [
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'email',    label: 'E-mail' },
  { value: 'carta',    label: 'Carta / Cartório' },
  { value: 'ligacao',  label: 'Ligação' },
];

const URGENCIA_COLORS: Record<string, string> = {
  baixa:   'bg-slate-100 text-slate-500 border-slate-200',
  media:   'bg-amber-50 text-amber-600 border-amber-200',
  alta:    'bg-orange-50 text-orange-600 border-orange-200',
  critica: 'bg-red-50 text-red-600 border-red-200',
  positivo:'bg-emerald-50 text-emerald-600 border-emerald-200',
};

const URGENCIA_ICON: Record<string, React.ReactNode> = {
  baixa:   <Info size={14} />,
  media:   <Clock size={14} />,
  alta:    <AlertTriangle size={14} />,
  critica: <AlertCircle size={14} />,
  positivo:<CheckCircle2 size={14} />,
};

export default function CobrancaDrawer({ associadoId, isOpen, onClose, associadoNome }: CobrancaDrawerProps) {
  const [activeTab, setActiveTab] = useState<'historico' | 'acordos'>('historico');
  const [resumo, setResumo] = useState<any>(null);
  const [historico, setHistorico] = useState<any[]>([]);
  const [acordos, setAcordos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showNovaAcao, setShowNovaAcao] = useState(false);

  // Seleção de template
  const [codigoSelecionado, setCodigoSelecionado] = useState('');
  const [canalSelecionado, setCanalSelecionado] = useState('whatsapp');
  const [textoGerado, setTextoGerado] = useState('');
  const [carregandoTexto, setCarregandoTexto] = useState(false);
  const [observacao, setObservacao] = useState('');
  const [salvandoAcao, setSalvandoAcao] = useState(false);
  const [copiado, setCopiado] = useState(false);

  // Exclusão de Histórico
  const [selectedHistoricoIds, setSelectedHistoricoIds] = useState<string[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [pendingDeleteIds, setPendingDeleteIds] = useState<string[]>([]);
  const [deletando, setDeletando] = useState(false);

  // Acordos
  const [showNovoAcordo, setShowNovoAcordo] = useState(false);
  const [acordoForm, setAcordoForm] = useState({ valor_total: '', numero_parcelas: '2', data_primeira: '', observacoes: '' });
  const [salvandoAcordo, setSalvandoAcordo] = useState(false);

  useEffect(() => {
    if (isOpen && associadoId) {
      loadData();
    }
  }, [isOpen, associadoId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [resResumo, resHist, resAcordos] = await Promise.all([
        fetch(`/api/cobranca/associado/${associadoId}/resumo`),
        fetch(`/api/cobranca/associado/${associadoId}/historico`),
        fetch(`/api/cobranca/associado/${associadoId}/acordos`),
      ]);
      const dataResumo = await resResumo.json();
      const dataHist = await resHist.json();
      const dataAcordos = await resAcordos.json();

      setResumo(dataResumo);
      setHistorico(Array.isArray(dataHist) ? dataHist : []);
      setAcordos(Array.isArray(dataAcordos) ? dataAcordos : []);

      // Auto-seleciona o template pelo número de dias de atraso
      if (dataResumo?.diasAtraso != null) {
        const etapaSugerida = determinarEtapaPorDias(dataResumo.diasAtraso);
        setCodigoSelecionado(etapaSugerida.codigo);
        setCanalSelecionado(etapaSugerida.canal);
      }
    } catch (e) {
      console.error('Erro ao carregar dados de cobrança', e);
    }
    setLoading(false);
  };

  // Busca o texto toda vez que o template ou associado mudar
  useEffect(() => {
    if (!showNovaAcao || !codigoSelecionado || !associadoId) return;
    setCarregandoTexto(true);
    fetch(`/api/cobranca/associado/${associadoId}/texto/${codigoSelecionado}`)
      .then(res => res.json())
      .then(data => setTextoGerado(data.texto || ''))
      .catch(() => setTextoGerado('Erro ao gerar texto. Edite manualmente.'))
      .finally(() => setCarregandoTexto(false));
  }, [showNovaAcao, codigoSelecionado, associadoId]);

  const handleSalvarAcao = async () => {
    let targetWin: Window | null = null;
    if (canalSelecionado === 'whatsapp') {
      // Abre a janela de forma síncrona para evitar bloqueadores de pop-up
      targetWin = window.open('about:blank', '_blank');
    }

    setSalvandoAcao(true);
    try {
      await fetch(`/api/cobranca/associado/${associadoId}/acao`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          etapa: codigoSelecionado,
          canal: canalSelecionado,
          textoEnviado: textoGerado,
          observacao,
          dias_atraso_momento: resumo?.diasAtraso,
          valor_momento: resumo?.totalAtualizado?.total
        })
      });

      if (canalSelecionado === 'whatsapp' && targetWin) {
        // Monta o número com +55 e sem caracteres não-numéricos
        const rawPhone = (resumo?.telefone || '').replace(/\D/g, '');
        const phone = rawPhone ? `55${rawPhone}` : '';
        const waUrl = phone
          ? `https://wa.me/${phone}?text=${encodeURIComponent(textoGerado)}`
          : `https://wa.me/?text=${encodeURIComponent(textoGerado)}`;
        targetWin.location.href = waUrl;
      }

      setShowNovaAcao(false);
      setObservacao('');
      setTextoGerado('');
      loadData();
    } catch (e) {
      if (targetWin) targetWin.close();
      alert('Erro ao salvar ação');
    }
    setSalvandoAcao(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(textoGerado);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const handleExcluirHistorico = (ids: string[]) => {
    setPendingDeleteIds(ids);
    setPasswordInput('');
    setShowDeleteModal(true);
  };

  const confirmExclusao = async () => {
    if (passwordInput !== '19072425') {
      alert('Senha incorreta.');
      return;
    }
    setDeletando(true);
    try {
      const res = await fetch('/api/cobranca/acao', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: pendingDeleteIds })
      });
      if (!res.ok) throw new Error('Falha ao excluir');
      setSelectedHistoricoIds(prev => prev.filter(id => !pendingDeleteIds.includes(id)));
      setShowDeleteModal(false);
      loadData();
    } catch (e) {
      alert('Erro ao excluir registros');
    }
    setDeletando(false);
  };

  const handleSalvarAcordo = async () => {
    if (!acordoForm.valor_total || !acordoForm.numero_parcelas || !acordoForm.data_primeira) {
      alert('Preencha Valor Total, Nº de Parcelas e Data da 1ª Parcela.');
      return;
    }
    setSalvandoAcordo(true);
    try {
      const numParcelas = parseInt(acordoForm.numero_parcelas);
      const valorTotal = parseFloat(acordoForm.valor_total.replace(',', '.'));
      const valorParcela = Math.round((valorTotal / numParcelas) * 100) / 100;

      const res = await fetch(`/api/cobranca/associado/${associadoId}/acordos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          valor_total: valorTotal,
          numero_parcelas: numParcelas,
          valor_parcela: valorParcela,
          data_primeira: acordoForm.data_primeira,
          observacoes: acordoForm.observacoes || null,
        }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      setShowNovoAcordo(false);
      setAcordoForm({ valor_total: '', numero_parcelas: '2', data_primeira: '', observacoes: '' });
      loadData();
    } catch (e: any) {
      alert(`Erro ao salvar acordo: ${e.message}`);
    }
    setSalvandoAcordo(false);
  };

  const handleMarcarParcelaPaga = async (acordoId: string, parcelaId: string, valor: number) => {
    try {
      const res = await fetch(`/api/cobranca/acordo/${acordoId}?parcela=${parcelaId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pago_valor: valor }),
      });
      if (!res.ok) throw new Error('Falha');
      loadData();
    } catch {
      alert('Erro ao registrar pagamento.');
    }
  };

  const handleCancelarAcordo = async (acordoId: string) => {
    if (!confirm('Cancelar este acordo?')) return;
    await fetch(`/api/cobranca/acordo/${acordoId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'inadimplente' }),
    });
    loadData();
  };

  const etapaAtual = resumo?.diasAtraso != null ? determinarEtapaPorDias(resumo.diasAtraso) : null;
  const templateAtual = TODOS_TEMPLATES.find(t => t.codigo === codigoSelecionado);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-[100]" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 w-[480px] bg-white shadow-2xl z-[101] flex flex-col animate-in slide-in-from-right duration-300">

        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-black text-sm">
              {(associadoNome || '?').charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-800 leading-tight">{associadoNome || 'Associado'}</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Painel de Cobrança</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-200 rounded-full transition-colors">
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin w-8 h-8 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">

            {/* Cards de Resumo */}
            <div className="p-5 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-red-50 p-4 rounded-2xl border border-red-100">
                  <p className="text-[9px] font-black text-red-400 uppercase tracking-widest mb-1">Dias de Atraso</p>
                  <p className="text-2xl font-black text-red-600">{resumo?.diasAtraso ?? 0}</p>
                  <p className="text-[9px] font-bold text-red-300 mt-1">{resumo?.statusSuspensao ? '⛔ Suspenso' : 'Risco ativo'}</p>
                </div>
                <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100">
                  <p className="text-[9px] font-black text-orange-400 uppercase tracking-widest mb-1">Total Atualizado</p>
                  <p className="text-lg font-black text-orange-600 leading-tight">
                    {fmtR(resumo?.totalAtualizado?.total || 0)}
                  </p>
                  <p className="text-[9px] font-bold text-orange-300 mt-1">
                    +{fmtR(resumo?.totalAtualizado?.multa || 0)} multa
                  </p>
                </div>
              </div>

              {/* Banner de Suspensão */}
              {resumo?.suspensaoData && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-red-600 text-white shadow-lg">
                  <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                    <span className="text-lg">⛔</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-[9px] font-black uppercase tracking-widest opacity-80">Associado Suspenso</p>
                    <p className="text-sm font-black leading-tight">{resumo.suspensaoMotivo || 'Suspensão registrada'}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[9px] font-black uppercase tracking-widest opacity-70">Data</p>
                    <p className="text-sm font-black">{new Date(resumo.suspensaoData).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
              )}

              {/* Badge de etapa sugerida */}
              {etapaAtual && (
                <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border ${URGENCIA_COLORS[etapaAtual.urgencia]}`}>
                  {URGENCIA_ICON[etapaAtual.urgencia]}
                  <div className="flex-1">
                    <p className="text-[9px] font-black uppercase tracking-widest opacity-70">Ação sugerida</p>
                    <p className="text-xs font-black">{etapaAtual.label}</p>
                  </div>
                  <span className="text-[10px] font-black bg-white/60 px-2 py-1 rounded-lg border border-current/20">
                    {etapaAtual.codigo}
                  </span>
                  {!showNovaAcao && (
                    <button
                      onClick={() => setShowNovaAcao(true)}
                      className="px-3 py-1.5 bg-white text-slate-700 text-[10px] font-black uppercase rounded-xl hover:bg-slate-50 transition-colors shadow-sm border border-slate-200 ml-1 shrink-0"
                    >
                      Registrar
                    </button>
                  )}
                </div>
              )}

              {/* Formulário de Nova Ação */}
              {showNovaAcao && (
                <div className="bg-white border-2 border-emerald-100 rounded-3xl p-5 shadow-sm animate-in zoom-in-95 duration-200 flex flex-col gap-4">
                  <h3 className="text-[11px] font-black text-emerald-700 uppercase tracking-widest">Nova Ação de Cobrança</h3>

                  {/* Seletor de Template */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Template</label>
                    <div className="relative">
                      <select
                        value={codigoSelecionado}
                        onChange={e => setCodigoSelecionado(e.target.value)}
                        className="w-full h-11 pl-4 pr-10 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 outline-none appearance-none focus:border-emerald-400 transition-colors"
                      >
                        {TODOS_TEMPLATES.map(t => (
                          <option key={t.codigo} value={t.codigo}>
                            [{t.codigo}] {t.titulo} — {t.dias}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                    {templateAtual && (
                      <p className="text-[9px] font-bold text-slate-400">
                        Canal sugerido: <span className="text-emerald-600 uppercase">{templateAtual.canal}</span>
                      </p>
                    )}
                  </div>

                  {/* Canal */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Canal de envio</label>
                    <div className="flex flex-wrap gap-2">
                      {CANAL_OPTIONS.map(c => (
                        <label key={c.value} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase cursor-pointer border transition-all ${canalSelecionado === c.value ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-400 hover:border-slate-300'}`}>
                          <input type="radio" name="canal" className="hidden" checked={canalSelecionado === c.value} onChange={() => setCanalSelecionado(c.value)} />
                          {c.label}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Texto gerado — editável */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Texto da mensagem</label>
                      <button
                        onClick={handleCopy}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase border transition-all ${copiado ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}
                      >
                        <Copy size={12} />
                        {copiado ? 'Copiado!' : 'Copiar'}
                      </button>
                    </div>
                    {carregandoTexto ? (
                      <div className="h-36 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center">
                        <div className="animate-spin w-5 h-5 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full" />
                      </div>
                    ) : (
                      <textarea
                        value={textoGerado}
                        onChange={e => setTextoGerado(e.target.value)}
                        className="w-full h-40 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] font-mono text-slate-700 outline-none focus:border-emerald-400 transition-colors resize-none leading-relaxed"
                        placeholder="Texto gerado pelo template..."
                      />
                    )}
                    <p className="text-[9px] text-slate-400 font-bold">💡 O texto é editável antes de copiar — adapte como necessário.</p>
                  </div>

                  {/* Observações */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Observações (resposta / anotações)</label>
                    <textarea
                      value={observacao}
                      onChange={e => setObservacao(e.target.value)}
                      placeholder='Ex: "Pediu até dia 15", "Confirmou pagamento", "Não atendeu"...'
                      className="w-full h-16 p-3 bg-white border border-slate-200 rounded-2xl text-xs outline-none focus:border-emerald-400 transition-colors resize-none"
                    />
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button onClick={() => setShowNovaAcao(false)} className="flex-1 py-3 bg-slate-100 text-slate-500 text-[10px] font-black uppercase rounded-2xl hover:bg-slate-200 transition-colors">
                      Cancelar
                    </button>
                    <button
                      onClick={handleSalvarAcao}
                      disabled={salvandoAcao}
                      className="flex-1 py-3 bg-emerald-600 text-white text-[10px] font-black uppercase rounded-2xl hover:bg-emerald-500 transition-colors shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {salvandoAcao ? 'Salvando...' : (
                        <>
                          {canalSelecionado === 'whatsapp' ? <MessageCircle size={14} /> : '✓'}
                          {canalSelecionado === 'whatsapp' ? 'Salvar e Enviar' : 'Salvar Registro'}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Tabs Histórico / Acordos */}
              <div className="flex border-b border-slate-100 mt-2 items-center justify-between">
                <div className="flex flex-1">
                  <button
                    onClick={() => setActiveTab('historico')}
                    className={`pb-3 px-4 text-[11px] font-black uppercase tracking-widest border-b-2 transition-colors ${activeTab === 'historico' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                  >
                    Histórico ({historico.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('acordos')}
                    className={`pb-3 px-4 text-[11px] font-black uppercase tracking-widest border-b-2 transition-colors ${activeTab === 'acordos' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                  >
                    Acordos
                  </button>
                </div>
                {activeTab === 'historico' && selectedHistoricoIds.length > 0 && (
                  <button 
                    onClick={() => handleExcluirHistorico(selectedHistoricoIds)}
                    className="flex items-center gap-1.5 px-3 py-1 mb-2 bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 rounded-lg text-[10px] font-black uppercase transition-colors"
                  >
                    <Trash2 size={12} /> Excluir ({selectedHistoricoIds.length})
                  </button>
                )}
              </div>

              {/* Histórico */}
              {activeTab === 'historico' && (
                <div className="flex flex-col gap-3 pb-6">
                  {historico.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageCircle size={32} className="text-slate-200 mx-auto mb-2" />
                      <p className="text-xs text-slate-400 italic">Nenhuma ação registrada ainda.</p>
                    </div>
                  ) : (
                    historico.map(acao => {
                      const tpl = TODOS_TEMPLATES.find(t => t.codigo === acao.etapa);
                      const isSelected = selectedHistoricoIds.includes(acao.id);
                      return (
                        <div key={acao.id} className={`p-4 rounded-2xl border transition-colors relative group ${isSelected ? 'bg-red-50/50 border-red-200' : 'bg-slate-50 border-slate-100 hover:border-slate-200'}`}>
                          {/* Checkbox */}
                          <div className="absolute left-3 top-4">
                            <input 
                              type="checkbox" 
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) setSelectedHistoricoIds(prev => [...prev, acao.id]);
                                else setSelectedHistoricoIds(prev => prev.filter(id => id !== acao.id));
                              }}
                              className="w-4 h-4 rounded border-slate-300 text-red-500 focus:ring-red-500 cursor-pointer"
                            />
                          </div>
                          
                          <div className="ml-6">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black bg-white border border-slate-200 text-slate-600 px-2 py-0.5 rounded-lg">
                                  {acao.etapa}
                                </span>
                                <span className="text-[9px] font-black text-emerald-600 uppercase">
                                  {acao.canal}
                                </span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-[9px] text-slate-400 font-bold">
                                  {new Date(acao.realizado_em).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                                </span>
                                <button 
                                  onClick={() => handleExcluirHistorico([acao.id])}
                                  className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                  title="Excluir Registro"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                            {tpl && <p className="text-[10px] font-bold text-slate-500 mb-1">{tpl.titulo}</p>}
                            {acao.observacao && (
                              <p className="text-[11px] text-slate-600 bg-white rounded-xl p-2 border border-slate-100 mt-1 italic">
                                "{acao.observacao}"
                              </p>
                            )}
                            {acao.dias_atraso_momento != null && (
                              <p className="text-[9px] text-slate-300 mt-2 font-bold">
                                {acao.dias_atraso_momento} dias de atraso no momento
                                {acao.valor_momento != null && ` · R$ ${fmtR(acao.valor_momento)}`}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* Acordos */}
              {activeTab === 'acordos' && (
                <div className="flex flex-col gap-4 pb-6">
                  {/* Botão novo acordo */}
                  {!showNovoAcordo && (
                    <button
                      onClick={() => setShowNovoAcordo(true)}
                      className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-emerald-200 text-emerald-600 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:border-emerald-400 hover:bg-emerald-50 transition-all"
                    >
                      <Plus size={14} /> Registrar Novo Acordo
                    </button>
                  )}

                  {/* Formulário de novo acordo */}
                  {showNovoAcordo && (
                    <div className="bg-emerald-50 border-2 border-emerald-100 rounded-3xl p-5 flex flex-col gap-3 animate-in zoom-in-95 duration-200">
                      <h4 className="text-[11px] font-black text-emerald-700 uppercase tracking-widest">Novo Acordo de Parcelamento</h4>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-black text-slate-500 uppercase">Valor Total (R$)</label>
                          <input
                            type="number" step="0.01" placeholder="0,00"
                            value={acordoForm.valor_total}
                            onChange={e => setAcordoForm(f => ({ ...f, valor_total: e.target.value }))}
                            className="h-10 px-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-emerald-400"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-black text-slate-500 uppercase">Nº Parcelas</label>
                          <input
                            type="number" min="1" max="60"
                            value={acordoForm.numero_parcelas}
                            onChange={e => setAcordoForm(f => ({ ...f, numero_parcelas: e.target.value }))}
                            className="h-10 px-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-emerald-400"
                          />
                        </div>
                      </div>

                      {/* Preview do valor da parcela */}
                      {acordoForm.valor_total && acordoForm.numero_parcelas && (
                        <div className="bg-white rounded-xl px-4 py-2 border border-emerald-100 text-center">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Valor por parcela: </span>
                          <span className="text-sm font-black text-emerald-600">
                            {fmtR(parseFloat(acordoForm.valor_total.replace(',', '.') || '0') / parseInt(acordoForm.numero_parcelas || '1'))}
                          </span>
                        </div>
                      )}

                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase">Data da 1ª Parcela</label>
                        <input
                          type="date"
                          value={acordoForm.data_primeira}
                          onChange={e => setAcordoForm(f => ({ ...f, data_primeira: e.target.value }))}
                          className="h-10 px-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-emerald-400"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase">Observações</label>
                        <textarea
                          value={acordoForm.observacoes}
                          onChange={e => setAcordoForm(f => ({ ...f, observacoes: e.target.value }))}
                          placeholder='Ex: Associado comprometeu pagar até dia 10 de cada mês...'
                          className="h-14 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-emerald-400 resize-none"
                        />
                      </div>

                      <div className="flex gap-2">
                        <button onClick={() => setShowNovoAcordo(false)} className="flex-1 py-2.5 bg-white text-slate-500 border border-slate-200 text-[10px] font-black uppercase rounded-xl hover:bg-slate-50 transition-colors">
                          Cancelar
                        </button>
                        <button
                          onClick={handleSalvarAcordo}
                          disabled={salvandoAcordo}
                          className="flex-1 py-2.5 bg-emerald-600 text-white text-[10px] font-black uppercase rounded-xl hover:bg-emerald-500 transition-colors disabled:opacity-50"
                        >
                          {salvandoAcordo ? 'Salvando...' : '✓ Confirmar Acordo'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Lista de acordos */}
                  {acordos.length === 0 && !showNovoAcordo && (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <span className="text-2xl">🤝</span>
                      </div>
                      <p className="text-xs text-slate-400 font-bold">Nenhum acordo registrado.</p>
                      <p className="text-[10px] text-slate-300 mt-1">Clique em "Registrar Novo Acordo" para iniciar.</p>
                    </div>
                  )}

                  {acordos.map(acordo => {
                    const statusColors: Record<string, string> = {
                      ativo: 'bg-blue-50 text-blue-600 border-blue-100',
                      quitado: 'bg-emerald-50 text-emerald-600 border-emerald-100',
                      inadimplente: 'bg-red-50 text-red-600 border-red-100',
                    };
                    const parcelas: any[] = acordo.cobranca_acordos_parcelas || [];
                    const pagas = parcelas.filter(p => p.status === 'pago').length;
                    const progresso = parcelas.length > 0 ? Math.round((pagas / parcelas.length) * 100) : 0;

                    return (
                      <div key={acordo.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                        {/* Cabeçalho do acordo */}
                        <div className="p-4 flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${statusColors[acordo.status] || statusColors.ativo}`}>
                                {acordo.status}
                              </span>
                              <span className="text-[9px] text-slate-400 font-bold">
                                {new Date(acordo.criado_em).toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                            <p className="text-sm font-black text-slate-800">{fmtR(acordo.valor_total)}</p>
                            <p className="text-[10px] text-slate-400 font-bold">
                              {acordo.numero_parcelas}x de {fmtR(acordo.valor_parcela)} · 1ª em {new Date(acordo.data_primeira + 'T00:00:00').toLocaleDateString('pt-BR')}
                            </p>
                            {acordo.observacoes && (
                              <p className="text-[10px] text-slate-500 mt-1 italic">"{acordo.observacoes}"</p>
                            )}
                          </div>
                          {acordo.status === 'ativo' && (
                            <button
                              onClick={() => handleCancelarAcordo(acordo.id)}
                              className="p-1.5 text-slate-300 hover:text-red-500 transition-colors rounded-lg"
                              title="Cancelar Acordo"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>

                        {/* Barra de progresso */}
                        <div className="px-4 pb-3">
                          <div className="flex justify-between text-[9px] font-black text-slate-400 mb-1">
                            <span>{pagas}/{parcelas.length} parcelas pagas</span>
                            <span>{progresso}%</span>
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                              style={{ width: `${progresso}%` }}
                            />
                          </div>
                        </div>

                        {/* Parcelas */}
                        <div className="border-t border-slate-100 divide-y divide-slate-50">
                          {parcelas.sort((a, b) => a.numero - b.numero).map(parcela => {
                            const hoje = new Date(); hoje.setHours(0,0,0,0);
                            const venc = new Date(parcela.vencimento + 'T00:00:00');
                            const atrasada = parcela.status === 'pendente' && venc < hoje;

                            return (
                              <div key={parcela.id} className={`px-4 py-2.5 flex items-center justify-between gap-3 ${parcela.status === 'pago' ? 'opacity-50' : ''}`}>
                                <div className="flex items-center gap-2">
                                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black ${
                                    parcela.status === 'pago' ? 'bg-emerald-100 text-emerald-600' :
                                    atrasada ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'
                                  }`}>
                                    {parcela.numero}
                                  </span>
                                  <div>
                                    <p className="text-xs font-bold text-slate-700">{fmtR(parcela.valor)}</p>
                                    <p className={`text-[9px] font-bold ${atrasada ? 'text-red-400' : 'text-slate-400'}`}>
                                      Venc: {venc.toLocaleDateString('pt-BR')}
                                      {atrasada && ' · ATRASADA'}
                                    </p>
                                  </div>
                                </div>
                                {parcela.status === 'pago' ? (
                                  <span className="text-[9px] font-black text-emerald-500 uppercase">✓ Pago em {new Date(parcela.pago_em).toLocaleDateString('pt-BR')}</span>
                                ) : acordo.status === 'ativo' ? (
                                  <button
                                    onClick={() => handleMarcarParcelaPaga(acordo.id, parcela.id, parcela.valor)}
                                    className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 text-emerald-600 border border-emerald-100 text-[9px] font-black uppercase rounded-lg hover:bg-emerald-100 transition-colors"
                                  >
                                    <CheckCircle2 size={12} /> Pago
                                  </button>
                                ) : null}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal de Senha para Exclusão */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl flex flex-col gap-4">
            <div>
              <h3 className="text-sm font-black text-slate-800">Autenticação Necessária</h3>
              <p className="text-[11px] text-slate-500 font-medium mt-1">
                Você está prestes a excluir {pendingDeleteIds.length} registro(s) do histórico de cobrança. Informe a senha de administrador para confirmar.
              </p>
            </div>
            
            <input 
              type="password"
              placeholder="Senha de Exclusão"
              value={passwordInput}
              onChange={e => setPasswordInput(e.target.value)}
              className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-slate-800 outline-none focus:border-red-400"
              autoFocus
            />

            <div className="flex gap-2 pt-2">
              <button 
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2.5 bg-slate-100 text-slate-500 font-black text-[10px] uppercase rounded-xl hover:bg-slate-200 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmExclusao}
                disabled={deletando || !passwordInput}
                className="flex-1 py-2.5 bg-red-600 text-white font-black text-[10px] uppercase rounded-xl hover:bg-red-500 transition-colors disabled:opacity-50"
              >
                {deletando ? 'Aguarde...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
