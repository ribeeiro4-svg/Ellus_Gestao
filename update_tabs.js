const fs = require('fs')
const path = require('path')

const getSwitcher = (activePath) => `
        <div className="flex items-center gap-4">
          <div className="hidden lg:flex bg-slate-100/60 p-1.5 rounded-[22px] items-center gap-1 border border-slate-200/40 backdrop-blur-sm shadow-inner">
            <a href="/configuracoes/colaboradores" className={\`flex items-center gap-2 px-4 py-2.5 rounded-[18px] text-[10px] font-black uppercase tracking-wider transition-all duration-500 \${'${activePath}' === '/configuracoes/colaboradores' ? 'bg-white text-emerald-700 shadow-md shadow-slate-200/50 scale-100' : 'text-slate-500 hover:bg-white/50 hover:text-slate-700 scale-95 hover:scale-100'}\`}>
              <Users size={14} className={'${activePath}' === '/configuracoes/colaboradores' ? 'text-emerald-500' : 'opacity-70'} />
              Colaboradores
            </a>
            <a href="/configuracoes/perfis" className={\`flex items-center gap-2 px-4 py-2.5 rounded-[18px] text-[10px] font-black uppercase tracking-wider transition-all duration-500 \${'${activePath}' === '/configuracoes/perfis' ? 'bg-white text-emerald-700 shadow-md shadow-slate-200/50 scale-100' : 'text-slate-500 hover:bg-white/50 hover:text-slate-700 scale-95 hover:scale-100'}\`}>
              <Shield size={14} className={'${activePath}' === '/configuracoes/perfis' ? 'text-emerald-500' : 'opacity-70'} />
              Perfis
            </a>
            <a href="/auditoria" className={\`flex items-center gap-2 px-4 py-2.5 rounded-[18px] text-[10px] font-black uppercase tracking-wider transition-all duration-500 \${'${activePath}' === '/auditoria' ? 'bg-white text-emerald-700 shadow-md shadow-slate-200/50 scale-100' : 'text-slate-500 hover:bg-white/50 hover:text-slate-700 scale-95 hover:scale-100'}\`}>
              <Activity size={14} className={'${activePath}' === '/auditoria' ? 'text-emerald-500' : 'opacity-70'} />
              Auditoria
            </a>
          </div>`

const files = [
  { p: 'src/app/(dashboard)/configuracoes/colaboradores/page.tsx', route: '/configuracoes/colaboradores' },
  { p: 'src/app/(dashboard)/configuracoes/perfis/page.tsx', route: '/configuracoes/perfis' },
  { p: 'src/app/(dashboard)/auditoria/page.tsx', route: '/auditoria' }
]

files.forEach(f => {
  const fullPath = path.join(__dirname, f.p)
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8')
    
    // Ensure all 3 icons are imported
    ;['Users', 'Shield', 'Activity'].forEach(icon => {
      if (!content.includes(icon)) {
        content = content.replace(/import \{ ([^}]+) \} from 'lucide-react'/, (match, p1) => {
          return 'import { ' + p1 + ', ' + icon + ' } from "lucide-react"'
        })
      }
    })

    if (f.route === '/configuracoes/colaboradores') {
      content = content.replace(
        /<\/div>\s*<button onClick=\{\(\) => openModal\(\)\} className="btn-primary[^>]+>\s*<Plus size=\{16\} \/> Novo Colaborador\s*<\/button>\s*<\/div>/,
        '</div>' + getSwitcher(f.route) + `
          <button onClick={() => openModal()} className="btn-primary text-xs uppercase font-black px-6 py-3 flex items-center gap-2 bg-[#0e2d22] hover:bg-[#1a4a38] text-white rounded-xl shadow-lg shadow-emerald-900/30">
            <Plus size={16} /> Novo Colaborador
          </button>
        </div>
      </div>`
      )
    } else {
      content = content.replace(
        /<\/div>\s*<\/div>\s*<div className="table-card/,
        '</div>' + getSwitcher(f.route) + `
        </div>
      </div>
      <div className="table-card`
      )
    }

    fs.writeFileSync(fullPath, content)
    console.log('Updated', f.p)
  }
})
