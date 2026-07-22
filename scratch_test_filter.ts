import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

const envPath = path.resolve(process.cwd(), '.env')
const envContent = fs.readFileSync(envPath, 'utf-8')
const env: Record<string, string> = {}
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/)
  if (match) {
    env[match[1].trim()] = match[2].trim().replace(/^['"](.*)['"]$/, '$1')
  }
})

const sb = createClient(env['NEXT_PUBLIC_SUPABASE_URL'] || '', env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] || '')

async function run() {
  const nome = 'Aretha de Oliveira Dias da Silva'
  const { data: assoc } = await sb.from('associados').select('id, nome').ilike('nome', `%${nome}%`).single()
  
  const { data: lancamentos } = await sb.from('lancamentos')
    .select('*')
    .eq('tipo', 'receita')
    .or(`associado_id.eq.${assoc?.id},descricao.ilike.%${nome}%`)
    
  const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  
  MESES.forEach((mes, idx) => {
    const matches = lancamentos?.filter((l: any) => {
      const isCorrectAssociate = l.associado_id === assoc?.id;
      const isTargetCategory = l.categoria?.toUpperCase().includes('MENSALIDADE') || 
                             l.descricao?.toUpperCase().includes('MENSALIDADE') ||
                             l.categoria?.toUpperCase().includes('ADESÃO') ||
                             l.descricao?.toUpperCase().includes('ADESÃO');
      
      if (!isCorrectAssociate || !isTargetCategory) return false;

      const d = new Date(l.data);
      const compMes = l.competencia_mes !== undefined && l.competencia_mes !== null ? l.competencia_mes : d.getMonth();
      const compAno = l.competencia_ano !== undefined && l.competencia_ano !== null ? l.competencia_ano : d.getFullYear();

      return compMes === idx && compAno === 2026;
    })
    
    console.log(`${mes}: ${matches?.length} matches`)
  })
}
run()
