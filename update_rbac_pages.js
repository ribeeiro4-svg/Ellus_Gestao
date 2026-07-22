const fs = require('fs')
const path = require('path')

const files = [
  'src/app/(dashboard)/configuracoes/colaboradores/page.tsx',
  'src/app/(dashboard)/configuracoes/perfis/page.tsx',
  'src/app/(dashboard)/auditoria/page.tsx'
]

files.forEach(f => {
  const fullPath = path.join(__dirname, f)
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8')
    
    // Remove imports
    content = content.replace(/import \{ useRbacAuth, RbacLoginForm \} from '@\/features\/rbac\/components\/RbacLogin'/g, '')
    
    // Replace default exports with the Content component directly
    if (f.includes('colaboradores/page.tsx')) {
      content = content.replace(/export default function ColaboradoresPage\(\) \{[\s\S]*?return <ColaboradoresContent token=\{token\} \/>\n\}/, 'export default function ColaboradoresPage() {\n  return <ColaboradoresContent />\n}')
      content = content.replace(/function ColaboradoresContent\(\{ token \}: \{ token: string \}\) \{/g, 'function ColaboradoresContent() {')
      content = content.replace(/useColaboradores\(token\)/g, 'useColaboradores()')
      content = content.replace(/usePerfis\(token\)/g, 'usePerfis()')
    }
    else if (f.includes('perfis/page.tsx')) {
      content = content.replace(/export default function PerfisPage\(\) \{[\s\S]*?return <PerfisContent token=\{token\} \/>\n\}/, 'export default function PerfisPage() {\n  return <PerfisContent />\n}')
      content = content.replace(/function PerfisContent\(\{ token \}: \{ token: string \}\) \{/g, 'function PerfisContent() {')
      content = content.replace(/usePerfis\(token\)/g, 'usePerfis()')
    }
    else if (f.includes('auditoria/page.tsx')) {
      content = content.replace(/export default function AuditoriaPage\(\) \{[\s\S]*?return <AuditoriaContent token=\{token\} \/>\n\}/, 'export default function AuditoriaPage() {\n  return <AuditoriaContent />\n}')
      content = content.replace(/function AuditoriaContent\(\{ token \}: \{ token: string \}\) \{/g, 'function AuditoriaContent() {')
    }

    // Replace Authorization headers in Auditoria
    content = content.replace(/headers: \{ Authorization: `Bearer \$\{token\}` \}/g, '')

    fs.writeFileSync(fullPath, content)
    console.log('Updated', f)
  }
})
