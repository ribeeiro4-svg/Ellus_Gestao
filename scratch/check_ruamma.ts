import { createClient } from './src/lib/supabase/client'

async function checkLaunch() {
  const supabase = createClient()
  
  // 1. Find Ruamma
  const { data: associates, error: assocError } = await supabase
    .from('associados')
    .select('id, nome')
    .ilike('nome', '%RUAMMA%')
    
  if (assocError) {
    console.error('Error finding associate:', assocError)
    return
  }
  
  console.log('Associates found:', associates)
  
  if (!associates || associates.length === 0) {
    console.log('No associate found with name RUAMMA')
    return
  }
  
  const ruammaId = associates[0].id
  
  // 2. Find launches for Ruamma
  const { data: launches, error: launchError } = await supabase
    .from('lancamentos')
    .select('*')
    .eq('associado_id', ruammaId)
    
  console.log('Launches found for Ruamma:', launches)
  
  // 3. Search specifically for 2026-02-10
  const { data: specificLaunch, error: specError } = await supabase
    .from('lancamentos')
    .select('*')
    .eq('data', '2026-02-10')
    .ilike('descricao', '%RUAMMA%')
    
  console.log('Specific launches on 2026-02-10 for Ruamma:', specificLaunch)
}

checkLaunch()
