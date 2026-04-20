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
  
  const safeData = {
    ...data,
    valor: Number(data.valor),
    associado_id: data.associado_id || null,
    fornecedor_id: data.fornecedor_id || null,
    diretor_id: data.diretor_id || null,
    conta_id: data.conta_id || null
  }

  if (editingItem) {
    return await atualizar(editingItem.id, safeData)
  }

  const { is_lote, selected_associados, recorrencia_ativa, recorrencia_meses, ...dbData } = safeData
  
  // Helper para extrair competência com segurança
  const getComp = (dtStr: string) => {
    const p = dtStr.includes('-') ? dtStr.split('-').map(Number) : dtStr.split('/').reverse().map(Number)
    return { mes: p[1] - 1, ano: p[0] }
  }

  // 1. Processamento em Lote
  if (is_lote && selected_associados?.length > 0) {
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

  // 2. Processamento de Recorrência
  if (recorrencia_ativa) {
    const mesesAFrente = Number(recorrencia_meses || 12)
    const batch = []
    const assoc = safeData.associado_id ? associados.find(a => a.id === safeData.associado_id) : null
    const finalDesc = assoc ? `${dbData.descricao.toUpperCase()} - ${assoc.nome.toUpperCase()}` : dbData.descricao.toUpperCase()

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
          competencia_ano: comp.ano
        });
    }
    return await inserirBulk(batch)
  }

  // 3. Processamento Individual
  const assoc = safeData.associado_id ? associados.find(a => a.id === safeData.associado_id) : null
  const finalDesc = assoc ? `${dbData.descricao.toUpperCase()} - ${assoc.nome.toUpperCase()}` : dbData.descricao.toUpperCase()
  const mainComp = getComp(dbData.data)
  
  const itemsToInsert = []
  itemsToInsert.push({ 
    ...dbData, 
    descricao: finalDesc, 
    status: safeData.status || 'aberto',
    competencia_mes: mainComp.mes,
    competencia_ano: mainComp.ano
  })

  if (safeData.troco_via_pix && Number(safeData.valor_troco) > 0) {
      itemsToInsert.push({
          tipo: 'despesa',
          descricao: `TROCO EM PIX - ${assoc?.nome.toUpperCase() || 'CLIENTE'}`,
          valor: Number(safeData.valor_troco),
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
