const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  const { data: buckets, error: getError } = await supabase.storage.listBuckets()
  if (getError) {
    console.error('Erro listando buckets:', getError)
    return
  }
  console.log('Buckets existentes:', buckets.map(b => b.name))

  if (!buckets.find(b => b.name === 'logos')) {
    console.log('Criando bucket logos...')
    const { data, error } = await supabase.storage.createBucket('logos', { public: true })
    if (error) {
      console.error('Erro criando bucket:', error)
    } else {
      console.log('Bucket logos criado com sucesso!')
    }
  } else {
    console.log('Bucket logos já existe.')
  }
}

run()
