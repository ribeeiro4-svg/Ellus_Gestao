// Tabela completa de CFOP para entradas — conforme Ajuste SINIEF e atualizações 2026
export interface CFOP {
  codigo: string
  descricao: string
  tipo: 'estadual' | 'interestadual' | 'importacao'
  categoria: string
}

export const TABELA_CFOP: CFOP[] = [
  // COMPRAS PARA INDUSTRIALIZAÇÃO / COMERCIALIZAÇÃO
  { codigo: '1.101', descricao: 'Compra para industrialização ou produção rural', tipo: 'estadual', categoria: 'Compras' },
  { codigo: '1.102', descricao: 'Compra para comercialização', tipo: 'estadual', categoria: 'Compras' },
  { codigo: '1.111', descricao: 'Compra para industrialização de mercadoria recebida anteriormente', tipo: 'estadual', categoria: 'Compras' },
  { codigo: '2.101', descricao: 'Compra para industrialização ou produção rural', tipo: 'interestadual', categoria: 'Compras' },
  { codigo: '2.102', descricao: 'Compra para comercialização', tipo: 'interestadual', categoria: 'Compras' },
  // USO E CONSUMO / ATIVO IMOBILIZADO
  { codigo: '1.401', descricao: 'Compras para o ativo permanente/imobilizado', tipo: 'estadual', categoria: 'Ativo Imobilizado' },
  { codigo: '1.403', descricao: 'Compra de mercadoria para uso e consumo', tipo: 'estadual', categoria: 'Consumo' },
  { codigo: '1.406', descricao: 'Compra de bem para o ativo imobilizado (encomenda)', tipo: 'estadual', categoria: 'Ativo Imobilizado' },
  { codigo: '1.407', descricao: 'Compra de mercadoria para uso ou consumo (encomenda)', tipo: 'estadual', categoria: 'Consumo' },
  { codigo: '2.401', descricao: 'Compras para o ativo permanente/imobilizado', tipo: 'interestadual', categoria: 'Ativo Imobilizado' },
  { codigo: '2.403', descricao: 'Compra de mercadoria para uso e consumo', tipo: 'interestadual', categoria: 'Consumo' },
  { codigo: '3.401', descricao: 'Compras para o ativo permanente/imobilizado (importação)', tipo: 'importacao', categoria: 'Ativo Imobilizado' },
  { codigo: '3.403', descricao: 'Compra de mercadoria para uso e consumo (importação)', tipo: 'importacao', categoria: 'Consumo' },
  // ENERGIA ELÉTRICA
  { codigo: '1.251', descricao: 'Compra de energia elétrica para distribuição ou comercialização', tipo: 'estadual', categoria: 'Energia' },
  { codigo: '1.252', descricao: 'Compra de energia elétrica por estabelecimento industrial', tipo: 'estadual', categoria: 'Energia' },
  { codigo: '1.253', descricao: 'Compra de energia elétrica por estabelecimento comercial', tipo: 'estadual', categoria: 'Energia' },
  { codigo: '1.254', descricao: 'Compra de energia elétrica por prestador de serviço de transporte', tipo: 'estadual', categoria: 'Energia' },
  { codigo: '1.255', descricao: 'Compra de energia elétrica para consumo por demanda contratada', tipo: 'estadual', categoria: 'Energia' },
  // SERVIÇOS
  { codigo: '1.301', descricao: 'Aquisição de serviço de comunicação para execução de serviço da mesma natureza', tipo: 'estadual', categoria: 'Serviços' },
  { codigo: '1.302', descricao: 'Aquisição de serviço de comunicação por estabelecimento industrial', tipo: 'estadual', categoria: 'Serviços' },
  { codigo: '1.303', descricao: 'Aquisição de serviço de comunicação por estabelecimento comercial', tipo: 'estadual', categoria: 'Serviços' },
  { codigo: '1.351', descricao: 'Aquisição de serviço de transporte para execução de serviço da mesma natureza', tipo: 'estadual', categoria: 'Serviços' },
  { codigo: '1.352', descricao: 'Aquisição de serviço de transporte por estabelecimento industrial', tipo: 'estadual', categoria: 'Serviços' },
  { codigo: '1.353', descricao: 'Aquisição de serviço de transporte por estabelecimento comercial', tipo: 'estadual', categoria: 'Serviços' },
  { codigo: '1.355', descricao: 'Aquisição de serviço de transporte para utilização na prestação de serviço ao associado', tipo: 'estadual', categoria: 'Serviços' },
  // DEVOLUÇÕES
  { codigo: '1.201', descricao: 'Devolução de venda de produção do estabelecimento', tipo: 'estadual', categoria: 'Devoluções' },
  { codigo: '1.202', descricao: 'Devolução de venda de mercadoria adquirida ou recebida de terceiros', tipo: 'estadual', categoria: 'Devoluções' },
  { codigo: '2.201', descricao: 'Devolução de venda de produção do estabelecimento', tipo: 'interestadual', categoria: 'Devoluções' },
  { codigo: '2.202', descricao: 'Devolução de venda de mercadoria adquirida ou recebida de terceiros', tipo: 'interestadual', categoria: 'Devoluções' },
  // COMBUSTÍVEIS
  { codigo: '1.651', descricao: 'Compra de combustível ou lubrificante para industrialização', tipo: 'estadual', categoria: 'Combustíveis' },
  { codigo: '1.652', descricao: 'Compra de combustível ou lubrificante para comercialização', tipo: 'estadual', categoria: 'Combustíveis' },
  { codigo: '1.653', descricao: 'Compra de combustível ou lubrificante por consumidor ou usuário final', tipo: 'estadual', categoria: 'Combustíveis' },
  { codigo: '2.651', descricao: 'Compra de combustível ou lubrificante para industrialização', tipo: 'interestadual', categoria: 'Combustíveis' },
  { codigo: '2.652', descricao: 'Compra de combustível ou lubrificante para comercialização', tipo: 'interestadual', categoria: 'Combustíveis' },
  { codigo: '2.653', descricao: 'Compra de combustível ou lubrificante por consumidor ou usuário final', tipo: 'interestadual', categoria: 'Combustíveis' },
  // TRANSFERÊNCIAS
  { codigo: '1.408', descricao: 'Transferência de bem do ativo imobilizado', tipo: 'estadual', categoria: 'Transferências' },
  { codigo: '1.409', descricao: 'Transferência de mercadoria para uso ou consumo', tipo: 'estadual', categoria: 'Transferências' },
  // IMPORTAÇÃO
  { codigo: '3.101', descricao: 'Compra para industrialização ou produção rural (importação)', tipo: 'importacao', categoria: 'Importação' },
  { codigo: '3.102', descricao: 'Compra para comercialização (importação)', tipo: 'importacao', categoria: 'Importação' },
]

export const CATEGORIAS_CFOP = [...new Set(TABELA_CFOP.map(c => c.categoria))].sort()

export function buscarCFOP(termo: string): CFOP[] {
  const t = termo.toLowerCase().trim()
  if (!t) return TABELA_CFOP
  return TABELA_CFOP.filter(c =>
    c.codigo.includes(t) ||
    c.descricao.toLowerCase().includes(t) ||
    c.categoria.toLowerCase().includes(t)
  )
}
