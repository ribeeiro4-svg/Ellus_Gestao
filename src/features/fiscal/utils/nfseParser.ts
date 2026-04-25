
import { NFSeParserResult } from '@/lib/types/nfse';

/**
 * Parser para Notas Fiscais de Serviços Tomados (NFS-e)
 * Suporta ABRASF e Padrão Nacional ADN
 */
export function parseNFSeXML(xml: string): NFSeParserResult {
  const cleanXml = xml.replace(/\s+/g, ' ');

  // 1. Detectar Formato
  const isAbrasf = cleanXml.includes('abrasf.org.br');
  const isADN = cleanXml.includes('sped.fazenda.gov.br/nfse');

  if (isADN) {
    return parseADN(cleanXml);
  } else if (isAbrasf) {
    return parseAbrasf(cleanXml);
  }

  throw new Error('Formato de XML de NFS-e não reconhecido (Deve ser ABRASF ou Padrão Nacional ADN)');
}

function extractTag(xml: string, tag: string): string {
  const regex = new RegExp(`<${tag}[^>]*>(.*?)<\/${tag}>`, 'i');
  const match = xml.match(regex);
  return match ? match[1].trim() : '';
}

function parseAbrasf(xml: string): NFSeParserResult {
  const numero = extractTag(xml, 'Numero');
  const dataEmissao = extractTag(xml, 'DataEmissao');
  const valorBruto = parseFloat(extractTag(xml, 'ValorServicos') || '0');
  const codigoServico = extractTag(xml, 'ItemListaServico');
  const discriminacao = extractTag(xml, 'Discriminacao');
  
  // Dados do Prestador
  const prestadorXml = xml.match(/<PrestadorServico>(.*?)<\/PrestadorServico>/i)?.[1] || '';
  const cnpj = extractTag(prestadorXml, 'Cnpj') || extractTag(prestadorXml, 'Cpf');
  const razaoSocial = extractTag(prestadorXml, 'RazaoSocial');

  // Retenções
  const valorIrrf = parseFloat(extractTag(xml, 'ValorIrrf') || '0');
  const valorPis = parseFloat(extractTag(xml, 'ValorPis') || '0');
  const valorCofins = parseFloat(extractTag(xml, 'ValorCofins') || '0');
  const valorCsll = parseFloat(extractTag(xml, 'ValorCsll') || '0');
  const valorIss = parseFloat(extractTag(xml, 'ValorIss') || '0');
  const issRetido = extractTag(xml, 'IssRetido') === '1';

  const valorLiquido = valorBruto - valorIrrf - valorPis - valorCofins - valorCsll - (issRetido ? valorIss : 0);

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
    retencoes: [] // Será detalhado na escrituração
  };
}

function parseADN(xml: string): NFSeParserResult {
  const chave = extractTag(xml, 'chNFSe');
  const numero = extractTag(xml, 'nNFSe');
  const dataEmissao = extractTag(xml, 'dhEmi');
  const valorBruto = parseFloat(extractTag(xml, 'vServ') || '0');
  const codigoNbs = extractTag(xml, 'cNBS');
  const discriminacao = extractTag(xml, 'xDescServ');

  // Dados do Prestador
  const prestadorXml = xml.match(/<emit>(.*?)<\/emit>/i)?.[1] || '';
  const cnpj = extractTag(prestadorXml, 'CNPJ') || extractTag(prestadorXml, 'CPF');
  const razaoSocial = extractTag(prestadorXml, 'xNome');

  // Retenções (Padrão ADN usa grupos específicos para tributos federais e municipais)
  const valorIrrf = parseFloat(extractTag(xml, 'vIRRF') || '0');
  const valorPis = parseFloat(extractTag(xml, 'vPIS') || '0');
  const valorCofins = parseFloat(extractTag(xml, 'vCOFINS') || '0');
  const valorCsll = parseFloat(extractTag(xml, 'vCSLL') || '0');
  const valorIss = parseFloat(extractTag(xml, 'vISS') || '0');
  const issRetido = extractTag(xml, 'indISS') === '1'; // Simplificação do padrão ADN

  const valorLiquido = valorBruto - valorIrrf - valorPis - valorCofins - valorCsll - (issRetido ? valorIss : 0);

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
