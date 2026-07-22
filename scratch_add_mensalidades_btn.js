const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src/features/associados/components/AssociadosTab.tsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Add import
if (!content.includes('PreviewMensalidadesModal')) {
  content = content.replace(
    "import PreviewAdesoesModal from './PreviewAdesoesModal'",
    "import PreviewAdesoesModal from './PreviewAdesoesModal'\nimport PreviewMensalidadesModal from './PreviewMensalidadesModal'"
  );
}

// 2. Add states
if (!content.includes('isPreviewMensalidadesOpen')) {
  content = content.replace(
    "const [isPreviewAdesoesOpen, setIsPreviewAdesoesOpen] = useState(false)\n  const [previewAdesoesData, setPreviewAdesoesData] = useState<any[]>([])",
    "const [isPreviewAdesoesOpen, setIsPreviewAdesoesOpen] = useState(false)\n  const [previewAdesoesData, setPreviewAdesoesData] = useState<any[]>([])\n  const [isPreviewMensalidadesOpen, setIsPreviewMensalidadesOpen] = useState(false)\n  const [previewMensalidadesData, setPreviewMensalidadesData] = useState<any[]>([])"
  );
}

// 3. Add handle methods
if (!content.includes('handleGerarMensalidades')) {
  const newMethods = `
  const handleGerarMensalidades = async () => {
    // Filtrar associados que têm Adesão mas NÃO têm Mensalidade
    const associadosAlvo = associados.filter((a: any) => {
      if (a.status === 'inativo') return false;
      const assocLancs = lancamentos.filter(l => l.associado_id === a.id);
      const temAdesao = assocLancs.some(l => (l.categoria || '').toUpperCase().includes('ADESÃO') || (l.descricao || '').toUpperCase().includes('ADESÃO'));
      const temMensalidade = assocLancs.some(l => (l.categoria || '').toUpperCase().includes('MENSALIDADE') || (l.descricao || '').toUpperCase().includes('MENSALIDADE'));
      return temAdesao && !temMensalidade;
    });

    if (associadosAlvo.length === 0) {
      setPreviewMensalidadesData([]);
      setIsPreviewMensalidadesOpen(true);
      return;
    }

    const hoje = new Date();
    const dataAtual = hoje.toISOString().split('T')[0];
    const preview = associadosAlvo.map((a: any) => {
      const contaPadrao = contas?.find((c: any) => c.padrao) || contas?.[0];
      return {
        tenant_id: a.tenant_id,
        associado_id: a.id,
        tipo: 'receita',
        categoria: 'MENSALIDADE',
        descricao: \`RECEB. DE MENSALIDADE - \${a.nome.toUpperCase()} [FIXO]\`,
        valor: a.plano_valor || 35.0,
        data: dataAtual,
        status: 'aberto',
        conta_id: contaPadrao?.id || null,
        forma_pagamento: 'Boleto'
      };
    });

    setPreviewMensalidadesData(preview);
    setIsPreviewMensalidadesOpen(true);
  }

  const handleConfirmGerarMensalidades = async (selected: any[]) => {
    const res = await insertLoteLancamentosAction(selected)
    if (res.error) {
      alert(\`Erro: \${res.error}\`)
    } else {
      alert(\`\${res.count} mensalidades lançadas com sucesso.\`)
      setIsPreviewMensalidadesOpen(false)
      refresh()
    }
  }
`;

  content = content.replace(
    "  const handleGerarAdesoes = async () => {",
    newMethods + "\n  const handleGerarAdesoes = async () => {"
  );
}

// 4. Add Button
if (!content.includes('handleGerarMensalidades')) {
  // It shouldn't get here because we just added the method, but let's do the UI anyway
}
content = content.replace(
    `<button onClick={handleGerarAdesoes} disabled={isSyncing} className="btn-secondary text-[10px] uppercase font-black px-4 py-2.5 flex items-center gap-2 bg-teal-50 text-teal-700 border-none hover:bg-teal-100">
            <Zap size={14} className={isSyncing ? 'animate-pulse' : ''} />
            Lançar Adesões
          </button>`,
    `<button onClick={handleGerarAdesoes} disabled={isSyncing} className="btn-secondary text-[10px] uppercase font-black px-4 py-2.5 flex items-center gap-2 bg-teal-50 text-teal-700 border-none hover:bg-teal-100">
            <Zap size={14} className={isSyncing ? 'animate-pulse' : ''} />
            Lançar Adesões
          </button>
          <button onClick={handleGerarMensalidades} disabled={isSyncing} className="btn-secondary text-[10px] uppercase font-black px-4 py-2.5 flex items-center gap-2 bg-indigo-50 text-indigo-700 border-none hover:bg-indigo-100">
            <Zap size={14} className={isSyncing ? 'animate-pulse' : ''} />
            Lançar Mensalidades
          </button>`
);

// 5. Add Modal Component
if (!content.includes('<PreviewMensalidadesModal')) {
  const modalTag = `
      <PreviewMensalidadesModal 
        isOpen={isPreviewMensalidadesOpen}
        onClose={() => setIsPreviewMensalidadesOpen(false)}
        previewData={previewMensalidadesData}
        associados={associados}
        onConfirm={handleConfirmGerarMensalidades}
      />
`;
  content = content.replace(
    "      <PreviewAdesoesModal",
    modalTag + "      <PreviewAdesoesModal"
  );
}

fs.writeFileSync(file, content, 'utf8');
console.log('AssociadosTab updated successfully.');
