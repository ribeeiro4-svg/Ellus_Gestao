export interface TarefaTesoureiro {
  id: string
  bloco: string
  atividade: string
  base_normativa: string
  periodicidade: string
  status: 'A Fazer' | 'Em Andamento' | 'Concluído'
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
      status: "A Fazer"
    },
    {
      id: "t-2",
      bloco: "Receitas e cobrança",
      atividade: "Conferir mensalidades e contribuições recebidas; atualizar planilha de inadimplência do dia",
      base_normativa: "Art. 7.2 'a' 'c'",
      periodicidade: "Diária (08:45 - 09:30)",
      status: "A Fazer"
    },
    {
      id: "t-3",
      bloco: "Despesas e compromissos",
      atividade: "Conferir vencimentos do dia/semana; programar pagamentos autorizados pela Diretoria",
      base_normativa: "Art. 7.2 'b' 'd'",
      periodicidade: "Diária (09:30 - 10:15)",
      status: "A Fazer"
    },
    {
      id: "t-4",
      bloco: "Conciliação bancária",
      atividade: "Realizar conciliação bancária periódica (extrato Cora x registros internos)",
      base_normativa: "Art. 7.2 'f'",
      periodicidade: "Semanal",
      status: "A Fazer"
    },
    {
      id: "t-5",
      bloco: "Relatório Financeiro",
      atividade: "Elaborar relatório financeiro mensal para a Diretoria",
      base_normativa: "Art. 7.2 'g'",
      periodicidade: "Mensal (até dia 5)",
      status: "A Fazer"
    },
    {
      id: "t-6",
      bloco: "Benefícios / HGU",
      atividade: "Verificar inclusões/exclusões de associados em benefícios com impacto financeiro (plano de saúde HGU)",
      base_normativa: "Art. 7.2 'i' 'j' 'k'",
      periodicidade: "Semanal",
      status: "A Fazer"
    },
    {
      id: "t-7",
      bloco: "Documentação",
      atividade: "Organizar comprovantes, recibos, notas fiscais e extratos da semana",
      base_normativa: "Art. 7.2 'e' 'r'",
      periodicidade: "Semanal",
      status: "A Fazer"
    },
    {
      id: "t-8",
      bloco: "Planejamento / Provisionamento",
      atividade: "Atualizar provisionamento de recebimentos e despesas (mês corrente e seguinte)",
      base_normativa: "Art. 7.2 'h' 'p' 'q'",
      periodicidade: "Semanal",
      status: "A Fazer"
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
