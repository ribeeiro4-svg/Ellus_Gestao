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
    
    // Add ChevronDown to lucide-react imports if it's missing
    if (!content.includes('ChevronDown')) {
      content = content.replace(/import \{ ([^}]+) \} from 'lucide-react'/, (match, p1) => {
        return `import { ${p1}, ChevronDown } from 'lucide-react'`
      })
    }

    // Shield is already in colaboradores and perfis, but we need to ensure it's in auditoria if not present
    if (f.includes('auditoria') && !content.includes('Shield')) {
      content = content.replace(/import \{ ([^}]+) \} from 'lucide-react'/, (match, p1) => {
        return `import { ${p1}, Shield } from 'lucide-react'`
      })
    }

    // Replace the header structure
    content = content.replace(
      /<div className="w-14 h-14 rounded-2xl bg-slate-[0-9]+ flex items-center justify-center text-white shadow-lg shadow-slate-[0-9]+\/20">\s*<([a-zA-Z0-9]+) size=\{28\} \/>\s*<\/div>\s*<div>\s*<h1 className="text-2xl font-black text-slate-800 tracking-tight leading-tight">([^<]+)<\/h1>\s*<p className="text-sm text-slate-500 font-bold uppercase tracking-widest opacity-70 mt-1">([^<]+)<\/p>\s*<\/div>/,
      (match, icon, title, subtitle) => {
        return `<div className="w-14 h-14 rounded-2xl bg-[#0e2d22] flex items-center justify-center text-white shadow-lg shadow-emerald-900/20 transition-all duration-500">
            <${icon} size={28} />
          </div>
          <div className="flex flex-col items-start">
            <div className="flex items-center gap-1.5 px-2.5 py-1 mb-2 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-emerald-100/50">
              <Shield size={10} />
              <span>SEGURANÇA DE DADOS</span>
              <ChevronDown size={10} className="opacity-50 ml-1" />
            </div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-tight">${title}</h1>
            <p className="text-sm text-slate-500 font-bold uppercase tracking-widest opacity-70 mt-1">${subtitle}</p>
          </div>`
      }
    )

    fs.writeFileSync(fullPath, content)
    console.log('Updated', f)
  }
})
