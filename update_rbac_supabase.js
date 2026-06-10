const fs = require('fs')
const path = require('path')

const filesToUpdate = [
  'src/app/api/auth/login/route.ts',
  'src/app/api/colaboradores/route.ts',
  'src/app/api/colaboradores/[id]/route.ts',
  'src/app/api/colaboradores/[id]/status/route.ts',
  'src/app/api/colaboradores/[id]/senha/route.ts',
  'src/app/api/perfis/route.ts',
  'src/app/api/perfis/[id]/route.ts',
  'src/app/api/perfis/[id]/permissoes/route.ts',
  'src/app/api/auditoria/route.ts'
]

filesToUpdate.forEach(f => {
  const fullPath = path.join(__dirname, f)
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8')
    content = content.replace(/import \{ createServerSupabase \} from '@\/lib\/supabase\/server'/g, 'import { createAdminSupabase } from \'@/lib/auth/rbac\'')
    content = content.replace(/await createServerSupabase\(\)/g, 'createAdminSupabase()')
    fs.writeFileSync(fullPath, content)
    console.log('Updated', f)
  } else {
    console.log('Not found', f)
  }
})
