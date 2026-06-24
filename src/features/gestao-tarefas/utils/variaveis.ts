/**
 * Substitui variáveis no formato {{nome_variavel}} por valores reais.
 * @param template O texto do modelo
 * @param variaveis Objeto com chave-valor das variáveis
 * @returns Texto processado
 */
export const processarVariaveis = (template: string, variaveis: Record<string, string>) => {
  let resultado = template
  Object.entries(variaveis).forEach(([chave, valor]) => {
    const regex = new RegExp(`{{${chave}}}`, 'g')
    resultado = resultado.replace(regex, valor)
  })
  return resultado
}

/**
 * Extrai todas as variáveis no formato {{variavel}} de um texto.
 */
export const extrairVariaveis = (texto: string): string[] => {
  const matches = texto.match(/{{(.*?)}}/g)
  if (!matches) return []
  return matches.map(m => m.replace(/{{|}}/g, ''))
}
