export async function processFinancialSubmit(
  data: any,
  editingItem: any,
  associados: any[],
  actions: {
    inserir: (d: any) => Promise<any>,
    atualizar: (id: string, d: any) => Promise<any>,
    inserirBulk: (d: any[]) => Promise<any>
  }
) {
  const { inserir, atualizar, inserirBulk } = actions
  
  // Função para limpar e converter valores numéricos brasileiros
  const parseValue = (val: any) => {
    if (typeof val === 'number') return val
    if (!val) return 0
    // Remove pontos de milhar e substitui vírgula por ponto
    const cleaned = String(val).replace(/\./g, '').replace(',', '.')
    return parseFloat(cleaned) || 0
  }

  const safeData = {
    ...data,
    valor: parseValue(data.valor),
    associado_id: data.associado_id || null,
    fornecedor_id: data.fornecedor_id || null,
    diretor_id: data.diretor_id || null,
    conta_id: data.conta_id || null
  }

  const { is_lote, selected_associados, recorrencia_ativa, recorrencia_meses, ...dbData } = safeData
  
  // Helper para extrair competência com segurança
  const getComp = (dtStr: string) => {
    const p = dtStr.includes('-') ? dtStr.split('-').map(Number) : dtStr.split('/').reverse().map(Number)
    return { mes: p[1] - 1, ano: p[0] }
  }

  // 1. Processamento em Lote (Multi-Associados)
  if (is_lote && selected_associados?.length > 0 && !editingItem) {
    const comp = getComp(dbData.data)
    const batch = selected_associados.map((assocId: string) => {
      const assoc = associados.find(a => a.id === assocId)
      return { 
        ...dbData, 
        descricao: `${dbData.descricao.toUpperCase()} - ${assoc?.nome.toUpperCase() || 'LOTE'}`,
        associado_id: assocId, 
        status: safeData.status || 'aberto',
        competencia_mes: comp.mes,
        competencia_ano: comp.ano
      }
    })
    return await inserirBulk(batch)
  }

  // 2. Processamento de Recorrência (Mesmo em modo de edição)
  if (recorrencia_ativa) {
    const mesesAFrente = Number(recorrencia_meses || 12)
    const batch = []
    const assoc = safeData.associado_id ? associados.find(a => a.id === safeData.associado_id) : null
    const baseDesc = dbData.descricao.toUpperCase().replace(/\s*-\s*.*$/, '') // Limpa sufixos antigos
    const finalDesc = assoc ? `${baseDesc} - ${assoc.nome.toUpperCase()}` : baseDesc
    const recId = crypto.randomUUID()

    for (let i = 0; i <= mesesAFrente; i++) {
        const parts = safeData.data.includes('-') 
            ? safeData.data.split('-').map(Number)
            : safeData.data.split('/').reverse().map(Number);
        
        const d = new Date(parts[0], parts[1] - 1 + i, parts[2]);
        const lastDay = new Date(parts[0], parts[1] + i, 0).getDate();
        if (parts[2] > lastDay) d.setDate(lastDay);

        const dataString = d.toISOString().split('T')[0];
        const comp = getComp(dataString)
        
        batch.push({ 
          ...dbData, 
          descricao: finalDesc, 
          data: dataString, 
          status: i === 0 ? (safeData.status || 'aberto') : 'aberto',
          competencia_mes: comp.mes,
          competencia_ano: comp.ano,
          recorrencia_id: recId
        });
    }

    // Se estiver editando, removemos o original e inserimos a nova série
    if (editingItem) {
      await actions.atualizar(editingItem.id, batch[0]) // Atualiza o primeiro
      if (batch.length > 1) await actions.inserirBulk(batch.slice(1)) // Insere os demais
      return { error: null }
    }
    
    return await inserirBulk(batch)
  }

  // 3. Processamento Individual ou Edição Simples
  if (editingItem) {
    return await atualizar(editingItem.id, dbData)
  }

  const assoc = safeData.associado_id ? associados.find(a => a.id === safeData.associado_id) : null
  const baseDesc = dbData.descricao.toUpperCase().replace(/\s*-\s*.*$/, '')
  const finalDesc = assoc ? `${baseDesc} - ${assoc.nome.toUpperCase()}` : baseDesc
  const mainComp = getComp(dbData.data)
  
  const itemsToInsert = []
  itemsToInsert.push({ 
    ...dbData, 
    descricao: finalDesc, 
    status: safeData.status || 'aberto',
    competencia_mes: mainComp.mes,
    competencia_ano: mainComp.ano
  })

  // Lógica de Troco via PIX
  if (safeData.troco_via_pix && Number(safeData.valor_troco) > 0) {
      itemsToInsert.push({
          tipo: 'despesa',
          descricao: `TROCO EM PIX - ${assoc?.nome.toUpperCase() || 'CLIENTE'}`,
          valor: parseValue(safeData.valor_troco),
          data: dbData.data,
          status: 'pago',
          conta_id: dbData.conta_id,
          categoria: 'TROCO',
          forma_pagamento: 'PIX',
          competencia_mes: mainComp.mes,
          competencia_ano: mainComp.ano
      })
  }

  return await inserirBulk(itemsToInsert)
}
