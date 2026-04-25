const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

function getEnv(key) {
  try {
    const content = fs.readFileSync('.env', 'utf8')
    const lines = content.split('\n')
    for (const line of lines) {
      if (line.trim().startsWith(key + '=')) {
        return line.split('=')[1].trim().replace(/^"|"$/g, '')
      }
    }
  } catch (e) {}
  return null
}

const url = getEnv('NEXT_PUBLIC_SUPABASE_URL')
const key = getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
const table = process.argv[2] || 'lancamentos'

if (!url || !key) {
    console.error('URL or Key not found in .env')
    process.exit(1)
}

const supabase = createClient(url, key)

async function probe() {
  console.log(`Probing table: ${table}...`)
  const { data, error } = await supabase.from(table).select('*').limit(50)
  if (error) {
      console.log('Error:', error.message)
  } else {
      console.log('Total found:', data.length)
      data.forEach((row, i) => {
          console.log(`Row ${i+1}:`, JSON.stringify(row, null, 2))
      })
  }
}
probe()
