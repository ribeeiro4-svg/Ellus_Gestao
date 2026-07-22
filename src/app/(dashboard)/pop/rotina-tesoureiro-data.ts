export interface TarefaTesoureiro {
  id: string
  bloco: string
  atividade: string
  base_normativa: string
  periodicidade: string
  status: 'A Fazer' | 'Em Andamento' | 'Concluído'
  descricao_detalhada?: string
  atalhos?: { label: string, href: string }[]
  pops?: string[]
}

export const DADOS_ROTINA_TESOUREIRO = {
  capa: {
    responsavel: "Bruno Ribeiro Santos de Matos",
    cargo: "Tesoureiro — Diretoria Executiva",
    horario: "Terça a Sexta-feira, 08:30 às 13:30 (5h/dia)",
    reuniao: "Dia fixo: todo dia 5 de cada mês",
    normativa: "Organograma de Governança da ACPROBEC, item 7 (Tesoureiro) e item 9 (Centro de Custo)"
  },
  tarefas_iniciais: [
    {
      id: "t-1",
      bloco: "Abertura financeira do dia",
      atividade: "Verificar extrato bancário (Cora) e caixa; checar pagamentos e recebimentos das últimas 24h",
      base_normativa: "Art. 7.2 'a' 'f'",
      periodicidade: "Diária (08:30 - 08:45)",
      status: "A Fazer",
      descricao_detalhada: "Faça o login no banco Cora, exporte o extrato e compare com as entradas e saídas registradas no sistema do dia anterior. Verifique se não houve rejeição de transferências ou tarifas inesperadas.",
      atalhos: [{ label: 'Painel Financeiro', href: '/financeiro' }, { label: 'Conta Digital', href: '/configuracoes' }],
      pops: ['POP-02', 'POP-03']
    },
    {
      id: "t-2",
      bloco: "Receitas e cobrança",
      atividade: "Conferir mensalidades e contribuições recebidas; atualizar planilha de inadimplência do dia",
      base_normativa: "Art. 7.2 'a' 'c'",
      periodicidade: "Diária (08:45 - 09:30)",
      status: "A Fazer",
      descricao_detalhada: "Revise todos os Pix e boletos compensados. Atualize o status dos associados que pagaram e faça a régua de cobrança para os que venceram no dia anterior.",
      atalhos: [{ label: 'Inadimplência', href: '/financeiro?tab=inadimplencia' }, { label: 'Módulo de Associados', href: '/associados' }],
      pops: ['POP-02']
    },
    {
      id: "t-3",
      bloco: "Despesas e compromissos",
      atividade: "Conferir vencimentos do dia/semana; programar pagamentos autorizados pela Diretoria",
      base_normativa: "Art. 7.2 'b' 'd'",
      periodicidade: "Diária (09:30 - 10:15)",
      status: "A Fazer",
      descricao_detalhada: "Liste todas as contas a pagar do dia. Solicite autorização prévia caso haja alguma despesa não provisionada. Agende no banco os pagamentos já autorizados.",
      atalhos: [{ label: 'Nova Despesa', href: '/financeiro' }, { label: 'Gestão de Fornecedores', href: '/configuracoes' }],
      pops: ['POP-02', 'POP-04']
    },
    {
      id: "t-4",
      bloco: "Conciliação bancária",
      atividade: "Realizar conciliação bancária periódica (extrato Cora x registros internos)",
      base_normativa: "Art. 7.2 'f'",
      periodicidade: "Semanal",
      status: "A Fazer",
      descricao_detalhada: "Cruze linha a linha o extrato bancário com o software de gestão financeira. O saldo final do sistema deve bater exato aos centavos com o saldo do banco Cora.",
      atalhos: [{ label: 'Painel Financeiro', href: '/financeiro' }],
      pops: ['POP-03']
    },
    {
      id: "t-5",
      bloco: "Relatório Financeiro",
      atividade: "Elaborar relatório financeiro mensal para a Diretoria",
      base_normativa: "Art. 7.2 'g'",
      periodicidade: "Mensal (até dia 5)",
      status: "A Fazer",
      descricao_detalhada: "Gere o DFC, Balanço Patrimonial parcial e Livro Diário do mês fechado. Apresente os gráficos de inadimplência e evolução de receitas x despesas.",
      atalhos: [{ label: 'Painel de Controle', href: '/resumo' }, { label: 'Módulo Contábil', href: '/contabil' }],
      pops: ['POP-01', 'POP-07']
    },
    {
      id: "t-6",
      bloco: "Benefícios / HGU",
      atividade: "Verificar inclusões/exclusões de associados em benefícios com impacto financeiro (plano de saúde HGU)",
      base_normativa: "Art. 7.2 'i' 'j' 'k'",
      periodicidade: "Semanal",
      status: "A Fazer",
      descricao_detalhada: "Auditar quem entrou e saiu do plano de saúde. Certificar-se que a corretora faturou corretamente e que o associado será cobrado adequadamente.",
      atalhos: [{ label: 'Gestão de Vidas', href: '/associados' }],
      pops: ['POP-09', 'POP-10']
    },
    {
      id: "t-7",
      bloco: "Documentação",
      atividade: "Organizar comprovantes, recibos, notas fiscais e extratos da semana",
      base_normativa: "Art. 7.2 'e' 'r'",
      periodicidade: "Semanal",
      status: "A Fazer",
      descricao_detalhada: "Digitalizar todos os comprovantes físicos e anexar PDFs aos respectivos lançamentos no sistema. A contabilidade precisará disso no fechamento.",
      atalhos: [{ label: 'Módulo Fiscal / Notas', href: '/fiscal' }],
      pops: ['POP-04']
    },
    {
      id: "t-8",
      bloco: "Planejamento / Provisionamento",
      atividade: "Atualizar provisionamento de recebimentos e despesas (mês corrente e seguinte)",
      base_normativa: "Art. 7.2 'h' 'p' 'q'",
      periodicidade: "Semanal",
      status: "A Fazer",
      descricao_detalhada: "Lançar no sistema todas as contas fixas e parceladas dos próximos 60 dias para gerar um fluxo de caixa projetado realista.",
      atalhos: [{ label: 'Planejamento e Orçamentos', href: '/planejamento' }],
      pops: ['POP-05', 'POP-06']
    }
  ] as TarefaTesoureiro[],
  
  checklist_conciliacao: [
    "Exportar extrato do Cora do período",
    "Conferir todos os Pix recebidos x planilha interna",
    "Conferir todos os Pix/pagamentos enviados x planilha interna",
    "Identificar lançamentos não registrados internamente",
    "Identificar duplicidades de pagamento ou recebimento",
    "Verificar lançamentos 'Encontro de Contas' com valor zerado",
    "Conferir taxas e encargos bancários do período",
    "Registrar divergências encontradas com valor e data",
    "Corrigir/atualizar planilha interna conforme divergências",
    "Arquivar extrato conciliado com data de conferência"
  ]
}
