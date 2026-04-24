export type PlanoContasItem = {
  codigo: string
  descricao: string
  nivel: number
  tipo: 'sintetica' | 'analitica'
  natureza: 'devedora' | 'credora'
  classificacao: string
  aceita_lancamentos?: boolean
}

// Plano de Contas ITG 2002 (R1) — Associações sem fins lucrativos
// Versão 2.0 — Expandido para 5 Níveis para suporte a projetos e centros de custo
export const PLANO_CONTAS_ITG2002: PlanoContasItem[] = [
  // ── 1 ATIVO ────────────────────────────────────────────────────────────────
  { codigo:'1', descricao:'ATIVO', nivel:1, tipo:'sintetica', natureza:'devedora', classificacao:'ativo' },
  { codigo:'1.1', descricao:'ATIVO CIRCULANTE', nivel:2, tipo:'sintetica', natureza:'devedora', classificacao:'ativo' },
  { codigo:'1.1.1', descricao:'CAIXA E EQUIVALENTES DE CAIXA', nivel:3, tipo:'sintetica', natureza:'devedora', classificacao:'ativo' },
  { codigo:'1.1.1.01', descricao:'Caixa Geral', nivel:4, tipo:'sintetica', natureza:'devedora', classificacao:'ativo' },
  { codigo:'1.1.1.01.001', descricao:'Caixa Sede', nivel:5, tipo:'analitica', natureza:'devedora', classificacao:'ativo', aceita_lancamentos:true },
  
  { codigo:'1.1.1.02', descricao:'Bancos Conta Corrente', nivel:4, tipo:'sintetica', natureza:'devedora', classificacao:'ativo' },
  { codigo:'1.1.1.02.001', descricao:'Banco Cora — Conta Principal', nivel:5, tipo:'analitica', natureza:'devedora', classificacao:'ativo', aceita_lancamentos:true },
  { codigo:'1.1.1.02.002', descricao:'Banco do Brasil — Convênios', nivel:5, tipo:'analitica', natureza:'devedora', classificacao:'ativo', aceita_lancamentos:true },
  { codigo:'1.1.1.02.003', descricao:'Outras Contas Bancárias', nivel:5, tipo:'analitica', natureza:'devedora', classificacao:'ativo', aceita_lancamentos:true },
  
  { codigo:'1.1.1.03', descricao:'Aplicações Financeiras', nivel:4, tipo:'sintetica', natureza:'devedora', classificacao:'ativo' },
  { codigo:'1.1.1.03.001', descricao:'Aplicações de Liquidez Imediata', nivel:5, tipo:'analitica', natureza:'devedora', classificacao:'ativo', aceita_lancamentos:true },
  { codigo:'1.1.1.03.002', descricao:'CDB/RDB Curto Prazo', nivel:5, tipo:'analitica', natureza:'devedora', classificacao:'ativo', aceita_lancamentos:true },

  { codigo:'1.1.2', descricao:'CRÉDITOS', nivel:3, tipo:'sintetica', natureza:'devedora', classificacao:'ativo' },
  { codigo:'1.1.2.01', descricao:'Mensalidades e Contribuições', nivel:4, tipo:'sintetica', natureza:'devedora', classificacao:'ativo' },
  { codigo:'1.1.2.01.001', descricao:'Mensalidades de Associados a Receber', nivel:5, tipo:'analitica', natureza:'devedora', classificacao:'ativo', aceita_lancamentos:true },
  { codigo:'1.1.2.01.002', descricao:'Taxas de Adesão a Receber', nivel:5, tipo:'analitica', natureza:'devedora', classificacao:'ativo', aceita_lancamentos:true },
  
  { codigo:'1.1.2.02', descricao:'Outros Créditos', nivel:4, tipo:'sintetica', natureza:'devedora', classificacao:'ativo' },
  { codigo:'1.1.2.02.001', descricao:'Adiantamentos a Empregados', nivel:5, tipo:'analitica', natureza:'devedora', classificacao:'ativo', aceita_lancamentos:true },
  { codigo:'1.1.2.02.002', descricao:'Adiantamentos a Fornecedores', nivel:5, tipo:'analitica', natureza:'devedora', classificacao:'ativo', aceita_lancamentos:true },
  { codigo:'1.1.2.02.003', descricao:'(-) Provisão p/ Créditos de Liquidação Duvidosa', nivel:5, tipo:'analitica', natureza:'credora', classificacao:'ativo', aceita_lancamentos:true },

  { codigo:'1.1.3', descricao:'ESTOQUES', nivel:3, tipo:'sintetica', natureza:'devedora', classificacao:'ativo' },
  { codigo:'1.1.3.01', descricao:'Materiais e Insumos', nivel:4, tipo:'sintetica', natureza:'devedora', classificacao:'ativo' },
  { codigo:'1.1.3.01.001', descricao:'Estoque de Materiais de Consumo', nivel:5, tipo:'analitica', natureza:'devedora', classificacao:'ativo', aceita_lancamentos:true },
  { codigo:'1.1.3.01.002', descricao:'Estoque de Materiais para Distribuição', nivel:5, tipo:'analitica', natureza:'devedora', classificacao:'ativo', aceita_lancamentos:true },

  { codigo:'1.2', descricao:'ATIVO NÃO CIRCULANTE', nivel:2, tipo:'sintetica', natureza:'devedora', classificacao:'ativo' },
  { codigo:'1.2.2', descricao:'IMOBILIZADO', nivel:3, tipo:'sintetica', natureza:'devedora', classificacao:'ativo' },
  { codigo:'1.2.2.01', descricao:'Bens Imóveis', nivel:4, tipo:'sintetica', natureza:'devedora', classificacao:'ativo' },
  { codigo:'1.2.2.01.001', descricao:'Terrenos', nivel:5, tipo:'analitica', natureza:'devedora', classificacao:'ativo', aceita_lancamentos:true },
  { codigo:'1.2.2.01.002', descricao:'Edificações', nivel:5, tipo:'analitica', natureza:'devedora', classificacao:'ativo', aceita_lancamentos:true },
  
  { codigo:'1.2.2.02', descricao:'Bens Móveis', nivel:4, tipo:'sintetica', natureza:'devedora', classificacao:'ativo' },
  { codigo:'1.2.2.02.001', descricao:'Móveis e Utensílios', nivel:5, tipo:'analitica', natureza:'devedora', classificacao:'ativo', aceita_lancamentos:true },
  { codigo:'1.2.2.02.002', descricao:'Equipamentos de Informática', nivel:5, tipo:'analitica', natureza:'devedora', classificacao:'ativo', aceita_lancamentos:true },
  { codigo:'1.2.2.02.003', descricao:'Veículos', nivel:5, tipo:'analitica', natureza:'devedora', classificacao:'ativo', aceita_lancamentos:true },
  
  { codigo:'1.2.2.03', descricao:'(-) Depreciações Acumuladas', nivel:4, tipo:'sintetica', natureza:'credora', classificacao:'ativo' },
  { codigo:'1.2.2.03.001', descricao:'(-) Depreciação Acumulada — Edificações', nivel:5, tipo:'analitica', natureza:'credora', classificacao:'ativo', aceita_lancamentos:true },
  { codigo:'1.2.2.03.002', descricao:'(-) Depreciação Acumulada — Equipamentos', nivel:5, tipo:'analitica', natureza:'credora', classificacao:'ativo', aceita_lancamentos:true },

  // ── 2 PASSIVO ──────────────────────────────────────────────────────────────
  { codigo:'2', descricao:'PASSIVO', nivel:1, tipo:'sintetica', natureza:'credora', classificacao:'passivo' },
  { codigo:'2.1', descricao:'PASSIVO CIRCULANTE', nivel:2, tipo:'sintetica', natureza:'credora', classificacao:'passivo' },
  { codigo:'2.1.1', descricao:'OBRIGAÇÕES TRABALHISTAS E SOCIAIS', nivel:3, tipo:'sintetica', natureza:'credora', classificacao:'passivo' },
  { codigo:'2.1.1.01', descricao:'Salários e Remunerações a Pagar', nivel:4, tipo:'sintetica', natureza:'credora', classificacao:'passivo' },
  { codigo:'2.1.1.01.001', descricao:'Salários a Pagar', nivel:5, tipo:'analitica', natureza:'credora', classificacao:'passivo', aceita_lancamentos:true },
  { codigo:'2.1.1.01.002', descricao:'Férias a Pagar', nivel:5, tipo:'analitica', natureza:'credora', classificacao:'passivo', aceita_lancamentos:true },
  { codigo:'2.1.1.01.003', descricao:'13º Salário a Pagar', nivel:5, tipo:'analitica', natureza:'credora', classificacao:'passivo', aceita_lancamentos:true },
  { codigo:'2.1.1.01.004', descricao:'Rescisões a Pagar', nivel:5, tipo:'analitica', natureza:'credora', classificacao:'passivo', aceita_lancamentos:true },
  
  { codigo:'2.1.1.02', descricao:'Encargos Sociais a Recolher', nivel:4, tipo:'sintetica', natureza:'credora', classificacao:'passivo' },
  { codigo:'2.1.1.02.001', descricao:'FGTS a Recolher', nivel:5, tipo:'analitica', natureza:'credora', classificacao:'passivo', aceita_lancamentos:true },
  { codigo:'2.1.1.02.002', descricao:'INSS a Recolher', nivel:5, tipo:'analitica', natureza:'credora', classificacao:'passivo', aceita_lancamentos:true },
  { codigo:'2.1.1.02.003', descricao:'PIS s/ Folha a Recolher', nivel:5, tipo:'analitica', natureza:'credora', classificacao:'passivo', aceita_lancamentos:true },
  { codigo:'2.1.1.02.004', descricao:'IRRF a Recolher (Retenções)', nivel:5, tipo:'analitica', natureza:'credora', classificacao:'passivo', aceita_lancamentos:true },
  { codigo:'2.1.1.02.005', descricao:'CSRF/PCC a Recolher (4,65%)', nivel:5, tipo:'analitica', natureza:'credora', classificacao:'passivo', aceita_lancamentos:true },
  { codigo:'2.1.1.02.006', descricao:'ISS Retido a Recolher', nivel:5, tipo:'analitica', natureza:'credora', classificacao:'passivo', aceita_lancamentos:true },

  { codigo:'2.1.3', descricao:'FORNECEDORES E CONTAS A PAGAR', nivel:3, tipo:'sintetica', natureza:'credora', classificacao:'passivo' },
  { codigo:'2.1.3.01', descricao:'Fornecedores de Bens e Serviços', nivel:4, tipo:'sintetica', natureza:'credora', classificacao:'passivo' },
  { codigo:'2.1.3.01.001', descricao:'Fornecedores Nacionais', nivel:5, tipo:'analitica', natureza:'credora', classificacao:'passivo', aceita_lancamentos:true },
  { codigo:'2.1.3.01.002', descricao:'Serviços de Terceiros a Pagar', nivel:5, tipo:'analitica', natureza:'credora', classificacao:'passivo', aceita_lancamentos:true },
  
  { codigo:'2.1.3.02', descricao:'Outras Contas a Pagar', nivel:4, tipo:'sintetica', natureza:'credora', classificacao:'passivo' },
  { codigo:'2.1.3.02.001', descricao:'Aluguéis a Pagar', nivel:5, tipo:'analitica', natureza:'credora', classificacao:'passivo', aceita_lancamentos:true },
  { codigo:'2.1.3.02.002', descricao:'Energia e Água a Pagar', nivel:5, tipo:'analitica', natureza:'credora', classificacao:'passivo', aceita_lancamentos:true },

  { codigo:'2.3', descricao:'PATRIMÔNIO SOCIAL', nivel:2, tipo:'sintetica', natureza:'credora', classificacao:'patrimonio_social' },
  { codigo:'2.3.1', descricao:'PATRIMÔNIO SOCIAL INICIAL', nivel:3, tipo:'sintetica', natureza:'credora', classificacao:'patrimonio_social' },
  { codigo:'2.3.1.01', descricao:'Fundo Social Inicial', nivel:4, tipo:'sintetica', natureza:'credora', classificacao:'patrimonio_social' },
  { codigo:'2.3.1.01.001', descricao:'Fundo Social Efetivado', nivel:5, tipo:'analitica', natureza:'credora', classificacao:'patrimonio_social', aceita_lancamentos:true },
  
  { codigo:'2.3.2', descricao:'SUPERÁVITS/DÉFICITS ACUMULADOS', nivel:3, tipo:'sintetica', natureza:'credora', classificacao:'patrimonio_social' },
  { codigo:'2.3.2.01', descricao:'Superávits ou Déficits de Exercícios Anteriores', nivel:4, tipo:'sintetica', natureza:'credora', classificacao:'patrimonio_social' },
  { codigo:'2.3.2.01.001', descricao:'Superávits/Déficits Acumulados', nivel:5, tipo:'analitica', natureza:'credora', classificacao:'patrimonio_social', aceita_lancamentos:true },

  // ── 3 INGRESSOS (RECEITAS) ────────────────────────────────────────────────
  { codigo:'3', descricao:'INGRESSOS', nivel:1, tipo:'sintetica', natureza:'credora', classificacao:'ingresso' },
  { codigo:'3.1', descricao:'INGRESSOS DAS ATIVIDADES COM RESTRIÇÃO', nivel:2, tipo:'sintetica', natureza:'credora', classificacao:'ingresso' },
  { codigo:'3.1.1', descricao:'CONTRIBUIÇÕES E MENSALIDADES', nivel:3, tipo:'sintetica', natureza:'credora', classificacao:'ingresso' },
  { codigo:'3.1.1.01', descricao:'Mensalidades Sociais', nivel:4, tipo:'sintetica', natureza:'credora', classificacao:'ingresso' },
  { codigo:'3.1.1.01.001', descricao:'Mensalidades de Associados', nivel:5, tipo:'analitica', natureza:'credora', classificacao:'ingresso', aceita_lancamentos:true },
  { codigo:'3.1.1.01.002', descricao:'Taxas de Adesão de Novos Membros', nivel:5, tipo:'analitica', natureza:'credora', classificacao:'ingresso', aceita_lancamentos:true },
  
  { codigo:'3.1.2', descricao:'DOAÇÕES E SUBVENÇÕES', nivel:3, tipo:'sintetica', natureza:'credora', classificacao:'ingresso' },
  { codigo:'3.1.2.01', descricao:'Doações de Pessoas Físicas', nivel:4, tipo:'sintetica', natureza:'credora', classificacao:'ingresso' },
  { codigo:'3.1.2.01.001', descricao:'Doações Espontâneas — PF', nivel:5, tipo:'analitica', natureza:'credora', classificacao:'ingresso', aceita_lancamentos:true },
  
  { codigo:'3.2', descricao:'OUTROS INGRESSOS OPERACIONAIS', nivel:2, tipo:'sintetica', natureza:'credora', classificacao:'ingresso' },
  { codigo:'3.2.1', descricao:'SERVIÇOS E EVENTOS', nivel:3, tipo:'sintetica', natureza:'credora', classificacao:'ingresso' },
  { codigo:'3.2.1.01', descricao:'Ingressos de Cursos e Treinamentos', nivel:4, tipo:'sintetica', natureza:'credora', classificacao:'ingresso' },
  { codigo:'3.2.1.01.001', descricao:'Inscrições em Cursos Livres', nivel:5, tipo:'analitica', natureza:'credora', classificacao:'ingresso', aceita_lancamentos:true },

  // ── 4 DISPÊNDIOS (DESPESAS) ────────────────────────────────────────────────
  { codigo:'4', descricao:'DISPÊNDIOS', nivel:1, tipo:'sintetica', natureza:'devedora', classificacao:'despesa' },
  { codigo:'4.1', descricao:'DISPÊNDIOS DAS ATIVIDADES FIM', nivel:2, tipo:'sintetica', natureza:'devedora', classificacao:'despesa' },
  { codigo:'4.1.1', descricao:'DISPÊNDIOS COM PESSOAL — ATIV. FIM', nivel:3, tipo:'sintetica', natureza:'devedora', classificacao:'despesa' },
  { codigo:'4.1.1.01', descricao:'Remuneração e Benefícios — Ativ. Fim', nivel:4, tipo:'sintetica', natureza:'devedora', classificacao:'despesa' },
  { codigo:'4.1.1.01.001', descricao:'Salários e Ordenados — Ativ. Fim', nivel:5, tipo:'analitica', natureza:'devedora', classificacao:'despesa', aceita_lancamentos:true },
  { codigo:'4.1.1.01.002', descricao:'Encargos Sociais s/ Folha — Ativ. Fim', nivel:5, tipo:'analitica', natureza:'devedora', classificacao:'despesa', aceita_lancamentos:true },
  { codigo:'4.1.1.01.003', descricao:'Bolsa-Auxílio (Estagiários)', nivel:5, tipo:'analitica', natureza:'devedora', classificacao:'despesa', aceita_lancamentos:true },
  { codigo:'4.1.1.01.004', descricao:'Auxílio Transporte e Benefícios (Estagiários)', nivel:5, tipo:'analitica', natureza:'devedora', classificacao:'despesa', aceita_lancamentos:true },

  { codigo:'4.2', descricao:'DISPÊNDIOS ADMINISTRATIVOS E GERAIS', nivel:2, tipo:'sintetica', natureza:'devedora', classificacao:'despesa' },
  { codigo:'4.2.1', descricao:'PESSOAL ADMINISTRATIVO', nivel:3, tipo:'sintetica', natureza:'devedora', classificacao:'despesa' },
  { codigo:'4.2.1.01', descricao:'Remuneração de Diretores e Gestores', nivel:4, tipo:'sintetica', natureza:'devedora', classificacao:'despesa' },
  { codigo:'4.2.1.01.001', descricao:'Pró-Labore da Diretoria Executiva', nivel:5, tipo:'analitica', natureza:'devedora', classificacao:'despesa', aceita_lancamentos:true },
  { codigo:'4.2.1.01.002', descricao:'Encargos s/ Pró-Labore', nivel:5, tipo:'analitica', natureza:'devedora', classificacao:'despesa', aceita_lancamentos:true },
  
  { codigo:'4.2.2', descricao:'MANUTENÇÃO E INFRAESTRUTURA', nivel:3, tipo:'sintetica', natureza:'devedora', classificacao:'despesa' },
  { codigo:'4.2.2.01', descricao:'Serviços de Utilidade Pública', nivel:4, tipo:'sintetica', natureza:'devedora', classificacao:'despesa' },
  { codigo:'4.2.2.01.001', descricao:'Energia Elétrica Sede', nivel:5, tipo:'analitica', natureza:'devedora', classificacao:'despesa', aceita_lancamentos:true },
  { codigo:'4.2.2.01.002', descricao:'Água e Esgoto Sede', nivel:5, tipo:'analitica', natureza:'devedora', classificacao:'despesa', aceita_lancamentos:true },
  { codigo:'4.2.2.01.003', descricao:'Serviços de Telecomunicações', nivel:5, tipo:'analitica', natureza:'devedora', classificacao:'despesa', aceita_lancamentos:true },
  { codigo:'4.2.2.01.004', descricao:'Materiais de Escritório e Expediente', nivel:5, tipo:'analitica', natureza:'devedora', classificacao:'despesa', aceita_lancamentos:true },
  { codigo:'4.2.2.01.005', descricao:'Materiais de Limpeza e Consumo da Sede', nivel:5, tipo:'analitica', natureza:'devedora', classificacao:'despesa', aceita_lancamentos:true },
  { codigo:'4.2.2.01.006', descricao:'Manutenção de Sistemas e Software', nivel:5, tipo:'analitica', natureza:'devedora', classificacao:'despesa', aceita_lancamentos:true },
  { codigo:'4.2.2.01.007', descricao:'Serviços de Terceiros - Pessoa Jurídica', nivel:5, tipo:'analitica', natureza:'devedora', classificacao:'despesa', aceita_lancamentos:true },
  { codigo:'4.2.2.01.008', descricao:'Assessoria Contábil e Jurídica', nivel:5, tipo:'analitica', natureza:'devedora', classificacao:'despesa', aceita_lancamentos:true },
  { codigo:'4.2.2.01.009', descricao:'Despesas com Gráfica e Impressos', nivel:5, tipo:'analitica', natureza:'devedora', classificacao:'despesa', aceita_lancamentos:true },
  { codigo:'4.2.2.01.010', descricao:'Aluguéis de Máquinas e Equipamentos', nivel:5, tipo:'analitica', natureza:'devedora', classificacao:'despesa', aceita_lancamentos:true },
  { codigo:'4.2.2.01.011', descricao:'Manutenção de Infraestrutura e Reparos', nivel:5, tipo:'analitica', natureza:'devedora', classificacao:'despesa', aceita_lancamentos:true },
  
  { codigo:'4.2.3', descricao:'DISPÊNDIOS FINANCEIROS', nivel:3, tipo:'sintetica', natureza:'devedora', classificacao:'despesa' },
  { codigo:'4.2.3.01', descricao:'Tarifas e Comissões Bancárias', nivel:4, tipo:'sintetica', natureza:'devedora', classificacao:'despesa' },
  { codigo:'4.2.3.01.001', descricao:'Taxas de Manutenção de Conta', nivel:5, tipo:'analitica', natureza:'devedora', classificacao:'despesa', aceita_lancamentos:true },
  { codigo:'4.2.3.01.002', descricao:'Taxas s/ Boletos e Recebimentos', nivel:5, tipo:'analitica', natureza:'devedora', classificacao:'despesa', aceita_lancamentos:true },
]
