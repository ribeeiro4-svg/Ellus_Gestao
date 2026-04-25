
export interface NFSeEntrada {
  id: string;
  tenant_id: string;
  numero_nfse: string;
  codigo_verificacao?: string;
  chave_nacional?: string;
  data_emissao: string;
  data_competencia: string;
  situacao: 'autorizada' | 'cancelada' | 'substituida';
  
  prestador_id: string;
  municipio_prestacao_ibge?: string;
  municipio_incidencia_ibge?: string;
  
  valor_bruto: number;
  valor_deducoes: number;
  base_calculo: number;
  aliquota_iss?: number;
  valor_iss: number;
  iss_retido: boolean;
  
  valor_irrf: number;
  valor_pis: number;
  valor_cofins: number;
  valor_csll: number;
  valor_pcc_total: number;
  valor_liquido: number;
  
  descricao_servico?: string;
  codigo_servico_lc116?: string;
  codigo_nbs?: string;
  
  conta_despesa_id?: string;
  centro_custo_id?: string;
  projeto_id?: string;
  
  status_escrituracao: 'pendente' | 'concluida';
  lancamento_contabil_id?: string;
  xml_url?: string;
  
  prestador?: {
    nome: string;
    cpf_cnpj: string;
  };

  created_at: string;
  updated_at: string;
}

export interface NFSeRetencao {
  id: string;
  tenant_id: string;
  nfse_id: string;
  tipo_retencao: 'IRRF' | 'PIS' | 'COFINS' | 'CSLL' | 'PCC' | 'ISS';
  valor: number;
  aliquota?: number;
  data_vencimento_darf?: string;
  conta_passivo_id?: string;
  status_recolhimento: 'pendente' | 'pago' | 'atrasado';
  created_at: string;
}

export interface FornecedorContaMap {
  id: string;
  tenant_id: string;
  fornecedor_id: string;
  tipo_operacao: 'mercadoria' | 'servico';
  conta_contabil_id: string;
}

export interface NFSeParserResult {
  nota: Partial<NFSeEntrada>;
  prestador: {
    cnpj: string;
    razao_social: string;
    inscricao_municipal?: string;
    endereco?: string;
    email?: string;
  };
  retencoes: Partial<NFSeRetencao>[];
}
