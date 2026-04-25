
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
  // Suporta namespaces (ex: <ns2:vServ>) e garante boundary (\b) para evitar match parcial (ex: Valor em ValorServicos)
  const regex = new RegExp(`<([\\w\\d]+:)?${tag}\\b[^>]*>(.*?)<\\/([\\w\\d]+:)?${tag}>`, 'i');
  const match = xml.match(regex);
  return match ? match[2].trim() : '';
}

/**
 * Tenta extrair valores de múltiplas tags possíveis e converte para número
 */
function extractValue(xml: string, tags: string[]): number {
  for (const tag of tags) {
    const val = extractTag(xml, tag);
    if (val) {
      let normalized = val.trim();
      
      // Se tem vírgula, assume formato brasileiro 1.234,56 ou 1234,56
      if (normalized.includes(',')) {
        normalized = normalized.replace(/\./g, '').replace(',', '.');
      } 
      // Se não tem vírgula mas tem ponto, o parseFloat tratará como decimal padrão (XML)
      // Antigamente aqui fazíamos replace de ponto por vazio incondicionalmente, o que causava erro de escala 100x
      
      const num = parseFloat(normalized);
      if (!isNaN(num)) return num;
    }
  }
  return 0;
}

function normalizeDate(dateStr: string): string {
  if (!dateStr) return new Date().toISOString();
  
  // 1. Se já é ISO (YYYY-MM-DD...)
  if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) return dateStr;
  
  // 2. Se é Formato Brasileiro (DD/MM/YYYY...)
  const brMatch = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (brMatch) {
    return `${brMatch[3]}-${brMatch[2]}-${brMatch[1]}`;
  }

  // 3. Se é apenas data sem separador (YYYYMMDD)
  if (/^\d{8}$/.test(dateStr)) {
    return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
  }

  return dateStr;
}

function parseAbrasf(xml: string): NFSeParserResult {
  const numero = extractTag(xml, 'Numero');
  const rawDate = extractTag(xml, 'DataEmissao') || extractTag(xml, 'dhEmi');
  const dataEmissao = normalizeDate(rawDate);
  
  // ... resto do código ...
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

  const valorLiquido = extractValue(xml, ['ValorLiquido', 'vLiquido', 'vLiq', 'ValorLiq']) || (valorBruto - valorIrrf - valorPis - valorCofins - valorCsll - (issRetido ? valorIss : 0));

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
  const rawDate = extractTag(xml, 'dhEmi');
  const dataEmissao = normalizeDate(rawDate);
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

  const valorLiquido = extractValue(xml, ['vLiq', 'ValorLiquido', 'vLiquido', 'ValorLiq']) || (valorBruto - valorIrrf - valorPis - valorCofins - valorCsll - (issRetido ? valorIss : 0));

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
