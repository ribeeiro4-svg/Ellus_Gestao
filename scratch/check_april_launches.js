
import { supabase } from '../src/lib/supabase'

async function checkApril() {
  const { data, error } = await supabase
    .from('lancamentos')
    .select('*')
    .eq('id', '21cba051-3ed8-4ff4-9a58-d4ab629bbe43')

  console.log('Item 1:', data)

  const { data: data2 } = await supabase
    .from('lancamentos')
    .select('*')
    .eq('id', 'c19a44cc-a56d-41a7-b4f7-a2c316da181e')
  
  console.log('Item 2:', data2)
}

checkApril()
