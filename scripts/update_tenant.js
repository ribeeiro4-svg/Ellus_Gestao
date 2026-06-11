const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  const { data, error } = await supabase
    .from('tenants')
    .update({ 
      nome: 'Éllos',
      logo_url: '/ellos_logo_dark.svg'
    })
    .neq('nome', '')

  if (error) {
    console.error('Erro:', error)
  } else {
    console.log('Sucesso! Tenant atualizado para Éllos.')
  }
}

run()
