
import { NFSeParserResult } from '@/lib/types/nfse';

/**
 * Parser para Notas Fiscais de Serviços Tomados (NFS-e)
 * Suporta ABRASF e Padrão Nacional ADN
 */
export function parseNFSeXML(xml: string): NFSeParserResult {
  const cleanXml = xml.replace(/\s+/g, ' ');

  // 1. Detectar Formato
  const isAbrasf = cleanXml.includes('abrasf.org.br') || cleanXml.includes('xmlns="http://www.abrasf.org.br');
  const isADN = cleanXml.includes('sped.fazenda.gov.br/nfse');

  if (isADN) {
    return parseADN(cleanXml);
  } else {
    // Por padrão tenta ABRASF ou genérico se não for explicitamente ADN
    return parseAbrasf(cleanXml);
  }
}

function extractTag(xml: string, tag: string): string {
  const regex = new RegExp(`<${tag}[^>]*>(.*?)<\/${tag}>`, 'i');
  const match = xml.match(regex);
  return match ? match[1].trim() : '';
}

/**
 * Tenta extrair valores de múltiplas tags possíveis e converte para número
 */
function extractValue(xml: string, tags: string[]): number {
  for (const tag of tags) {
    const val = extractTag(xml, tag);
    if (val) {
      // Remove pontos de milhar e converte vírgula decimal para ponto
      const normalized = val.replace(/\./g, '').replace(',', '.');
      const num = parseFloat(normalized);
      if (!isNaN(num)) return num;
    }
  }
  return 0;
}

function parseAbrasf(xml: string): NFSeParserResult {
  const numero = extractTag(xml, 'Numero');
  const dataEmissao = extractTag(xml, 'DataEmissao') || extractTag(xml, 'dhEmi') || new Date().toISOString();
  
  // Tenta várias tags comuns para valor bruto
  const valorBruto = extractValue(xml, ['ValorServicos', 'vServicos', 'vServ', 'ValorBruto', 'Valor']);
  
  const codigoServico = extractTag(xml, 'ItemListaServico') || extractTag(xml, 'CodigoServico');
  const discriminacao = extractTag(xml, 'Discriminacao') || extractTag(xml, 'xDescServ');
  
  // Dados do Prestador - Tenta blocos diferentes
  const prestadorXml = xml.match(/<(PrestadorServico|emit|Prestador)>(.*?)<\/(PrestadorServico|emit|Prestador)>/i)?.[2] || xml;
  const cnpj = extractTag(prestadorXml, 'Cnpj') || extractTag(prestadorXml, 'CNPJ') || extractTag(prestadorXml, 'Cpf') || extractTag(prestadorXml, 'CPF');
  const razaoSocial = extractTag(prestadorXml, 'RazaoSocial') || extractTag(prestadorXml, 'xNome') || extractTag(prestadorXml, 'Nome');

  // Retenções
  const valorIrrf = extractValue(xml, ['ValorIrrf', 'vIRRF']);
  const valorPis = extractValue(xml, ['ValorPis', 'vPIS']);
  const valorCofins = extractValue(xml, ['ValorCofins', 'vCOFINS']);
  const valorCsll = extractValue(xml, ['ValorCsll', 'vCSLL']);
  const valorIss = extractValue(xml, ['ValorIss', 'vISS']);
  const issRetido = extractTag(xml, 'IssRetido') === '1' || extractTag(xml, 'indISS') === '1' || extractTag(xml, 'ISSRetido') === 'S';

  const valorLiquido = extractValue(xml, ['ValorLiquido', 'vLiquido']) || (valorBruto - valorIrrf - valorPis - valorCofins - valorCsll - (issRetido ? valorIss : 0));

  return {
    nota: {
      numero_nfse: numero,
      data_emissao: dataEmissao,
      data_competencia: dataEmissao.split('T')[0],
      valor_bruto: valorBruto,
      valor_liquido: valorLiquido,
      valor_irrf: valorIrrf,
      valor_pis: valorPis,
      valor_cofins: valorCofins,
      valor_csll: valorCsll,
      valor_pcc_total: valorPis + valorCofins + valorCsll,
      valor_iss: valorIss,
      iss_retido: issRetido,
      descricao_servico: discriminacao,
      codigo_servico_lc116: codigoServico,
      situacao: 'autorizada'
    },
    prestador: {
      cnpj: cnpj,
      razao_social: razaoSocial
    },
    retencoes: []
  };
}

function parseADN(xml: string): NFSeParserResult {
  const chave = extractTag(xml, 'chNFSe');
  const numero = extractTag(xml, 'nNFSe');
  const dataEmissao = extractTag(xml, 'dhEmi');
  const valorBruto = extractValue(xml, ['vServ', 'vServicos', 'ValorServicos']);
  const codigoNbs = extractTag(xml, 'cNBS');
  const discriminacao = extractTag(xml, 'xDescServ');

  const prestadorXml = xml.match(/<emit>(.*?)<\/emit>/i)?.[1] || '';
  const cnpj = extractTag(prestadorXml, 'CNPJ') || extractTag(prestadorXml, 'CPF');
  const razaoSocial = extractTag(prestadorXml, 'xNome');

  const valorIrrf = extractValue(xml, ['vIRRF']);
  const valorPis = extractValue(xml, ['vPIS']);
  const valorCofins = extractValue(xml, ['vCOFINS']);
  const valorCsll = extractValue(xml, ['vCSLL']);
  const valorIss = extractValue(xml, ['vISS']);
  const issRetido = extractTag(xml, 'indISS') === '1';

  const valorLiquido = extractValue(xml, ['vLiq', 'ValorLiquido']) || (valorBruto - valorIrrf - valorPis - valorCofins - valorCsll - (issRetido ? valorIss : 0));

  return {
    nota: {
      numero_nfse: numero,
      chave_nacional: chave,
      data_emissao: dataEmissao,
      data_competencia: dataEmissao.split('T')[0],
      valor_bruto: valorBruto,
      valor_liquido: valorLiquido,
      valor_irrf: valorIrrf,
      valor_pis: valorPis,
      valor_cofins: valorCofins,
      valor_csll: valorCsll,
      valor_pcc_total: valorPis + valorCofins + valorCsll,
      valor_iss: valorIss,
      iss_retido: issRetido,
      descricao_servico: discriminacao,
      codigo_nbs: codigoNbs,
      situacao: 'autorizada'
    },
    prestador: {
      cnpj: cnpj,
      razao_social: razaoSocial
    },
    retencoes: []
  };
}
