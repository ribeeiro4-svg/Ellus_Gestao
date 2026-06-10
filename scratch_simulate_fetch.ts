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
  const tenantId = '971f92af-a72b-4bc4-a8e0-333d712ce6a7'
  const start = '2026-01-01'
  const end = '2026-12-31'
  
  let allData: any[] = []
  let from = 0
  const step = 1000
  let hasMore = true

  while (hasMore) {
    const { data, error } = await sb.from('lancamentos')
      .select('id, data, descricao')
      .eq('tenant_id', tenantId)
      .gte('data', start)
      .lte('data', end)
      .order('data', { ascending: false })
      .range(from, from + step - 1)

    if (error) throw error
    if (!data || data.length === 0) {
      hasMore = false
    } else {
      allData = [...allData, ...data]
      if (data.length < step) hasMore = false
      else from += step
    }
  }
  
  console.log('Total fetched:', allData.length)
  const julyDaiane = allData.filter(x => x.data === '2026-07-10' && x.descricao?.toLowerCase().includes('daiane'))
  console.log('July Daiane records:', julyDaiane)
}
run()
