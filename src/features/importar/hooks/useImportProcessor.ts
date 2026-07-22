import { useState } from 'react'
import type { LancamentoInput, AssociadoInput, ProLaboreItem } from '@/lib/types'
import { parseExcelDate } from '../utils/excelUtils'

export function useImportProcessor(associadosAtuais: any[]) {
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<{ type: 'financeiro' | 'associados' | 'prolabore', data: any[] } | null>(null)
  const [ignoredCount, setIgnoredCount] = useState(0)

  const processData = (data: any[]) => {
    if (data.length === 0) return
    const firstRow = data[0]
    
    if ('Recorrência Ativa' in firstRow || 'Valor Recebido' in firstRow) {
      const mapped: LancamentoInput[] = data.map(row => ({
        data: parseExcelDate(row.Data),
        descricao: row.Descrição || 'Importado',
        categoria: row.Categoria || 'Geral',
        tipo: String(row.Tipo || 'receita').toLowerCase() as any,
        valor: Number(row.Valor || 0),
        status: String(row.Status || 'aberto').toLowerCase() as any,
        forma_pagamento: row['Forma Pagamento'] || 'PIX',
        valor_recebido: Number(row['Valor Recebido'] || 0),
        troco_via_pix: String(row['Troco via PIX'] || '').toLowerCase() === 'sim',
        recorrencia_ativa: String(row['Recorrência Ativa'] || '').toLowerCase() === 'sim',
        competencia_mes: row['Competência Mês'] ? Number(row['Competência Mês']) : undefined,
        competencia_ano: row['Competência Ano'] ? Number(row['Competência Ano']) : undefined,
        taxa: row.Taxa ? Number(row.Taxa) : 0,
        conciliado: false
      }))
      setPreview({ type: 'financeiro', data: mapped })
    } else if ('CPF / CNPJ' in firstRow || 'Data Ingresso' in firstRow) {
      let totalIgnored = 0
      const mapped: AssociadoInput[] = []
      data.forEach(row => {
        const nomeClean = String(row.Nome || '').trim().toLowerCase()
        const cpfClean = String(row['CPF / CNPJ'] || '').replace(/\D/g, '')
        const jaExiste = associadosAtuais.find(a => String(a.nome || '').trim().toLowerCase() === nomeClean && String(a.cpf || '').replace(/\D/g, '') === cpfClean)
        if (jaExiste) totalIgnored++
        else {
          mapped.push({
            codigo: String(row.ID || Math.floor(Math.random() * 10000)),
            nome: row.Nome,
            cpf: row['CPF / CNPJ'] || '',
            categoria: row.Categoria || 'Pleno',
            email: row.Email || '',
            telefone: row.Telefone || '',
            data_ingresso: parseExcelDate(row['Data Ingresso']),
            mensalidade: Number(row.Mensalidade || 0),
            status: String(row.Status || 'ativo').toLowerCase() as any,
            vencimento_dia: row['Vencimento Dia'] ? Number(row['Vencimento Dia']) : 10,
            recorrencia_ativa: String(row['Recorrência Ativa'] || '').toLowerCase() === 'sim',
            plano_saude: row['Plano de Saúde'] || 'Não Possui',
            termo_status: row['Status Termo'] || 'Pendente'
          })
        }
      })
      setIgnoredCount(totalIgnored)
      setPreview({ type: 'associados', data: mapped })
    } else if ('Nome do Diretor' in firstRow && 'Mês Início' in firstRow) {
      const grouped = data.reduce((acc: any, row) => {
        const nome = row['Nome do Diretor']
        if (!acc[nome]) acc[nome] = { id: Math.random().toString(), nome, periodos: [] }
        acc[nome].periodos.push({
          id: Math.random().toString(),
          valor: Number(row['Valor Mensal'] || 0),
          mes_inicio: Number(row['Mês Início'] || 1) - 1,
          ano_inicio: Number(row['Ano Início'] || 2024),
          mes_fim: row['Mês Fim'] ? Number(row['Mês Fim']) - 1 : undefined,
          ano_fim: row['Ano Fim'] ? Number(row['Ano Fim']) : undefined
        })
        return acc
      }, {})
      setPreview({ type: 'prolabore', data: Object.values(grouped) })
    } else {
      throw new Error('Modelo não reconhecido.')
    }
  }

  return { loading, setLoading, preview, setPreview, ignoredCount, setIgnoredCount, processData }
}
