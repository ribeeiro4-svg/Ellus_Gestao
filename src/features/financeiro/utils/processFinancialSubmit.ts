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
    const cleaned = String(val).replace(/\./g, '').replace(',', '.')
    return parseFloat(cleaned) || 0
  }

  // Função para garantir que campos UUID sejam null se inválidos/undefined
  const cleanId = (val: any) => {
    if (!val || val === 'undefined' || val === 'null' || val === '') return null
    return val
  }

  // Fallback para randomUUID caso não disponível (ambientes sem HTTPS ou antigos)
  const generateUUID = () => {
    try {
      return crypto.randomUUID()
    } catch {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0
        const v = c === 'x' ? r : (r & 0x3) | 0x8
        return v.toString(16)
      })
    }
  }

  const safeData = {
    ...data,
    valor: parseValue(data.valor),
    associado_id: cleanId(data.associado_id),
    fornecedor_id: cleanId(data.fornecedor_id),
    diretor_id: cleanId(data.diretor_id),
    conta_id: cleanId(data.conta_id)
  }

  const { is_lote, selected_associados, recorrencia_ativa, recorrencia_meses, ...dbData } = safeData
  
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
        associado_id: cleanId(assocId), 
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
    const baseDesc = dbData.descricao.toUpperCase().replace(/\s*-\s*.*$/, '')
    const finalDesc = assoc ? `${baseDesc} - ${assoc.nome.toUpperCase()}` : baseDesc
    const recId = generateUUID()

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

    if (editingItem) {
      const targetId = editingItem.id || data.id
      if (!targetId || String(targetId) === 'undefined') {
        return { error: 'ID do lançamento não encontrado. Tente atualizar a página.' }
      }

      const r1 = await actions.atualizar(targetId, batch[0])
      if (r1?.error) return r1
      if (batch.length > 1) {
        const r2 = await actions.inserirBulk(batch.slice(1))
        if (r2?.error) return r2
      }
      return { error: null }
    }
    
    return await inserirBulk(batch)
  }

  // 3. Processamento Individual ou Edição Simples
  if (editingItem) {
    const targetId = editingItem.id || data.id
    if (!targetId || String(targetId) === 'undefined') {
      return { error: 'ID do lançamento não encontrado. Tente atualizar a página.' }
    }
    return await atualizar(targetId, dbData)
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
