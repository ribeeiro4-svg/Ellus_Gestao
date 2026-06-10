const fs = require('fs')
const bcrypt = require('bcryptjs')
const { createClient } = require('@supabase/supabase-js')

const env = fs.readFileSync('.env', 'utf8')
const getEnv = (key) => env.split('\n').find(l => l.startsWith(key))?.split('=')[1]?.trim()

const supabaseUrl = getEnv('NEXT_PUBLIC_SUPABASE_URL')
const supabaseKey = getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
const supabase = createClient(supabaseUrl, supabaseKey)

async function seedAdmin() {
  const email = 'admin@acprobec.org'
  const senha = 'senha123'
  
  const salt = await bcrypt.genSalt(12)
  const senha_hash = await bcrypt.hash(senha, salt)

  console.log('Criando administrador com email:', email, 'e senha:', senha)

  const { data, error } = await supabase.from('colaboradores').insert({
    nome: 'Administrador Mestre',
    email,
    senha_hash,
    perfil_id: 1, // 1 é Administrador
    status: 'ativo'
  }).select('id, nome').single()

  if (error) {
    console.error('Erro ao criar admin:', error.message)
  } else {
    console.log('Admin criado com sucesso! ID:', data.id)
  }
}
seedAdmin()
