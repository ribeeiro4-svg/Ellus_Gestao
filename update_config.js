const fs = require('fs')
const path = require('path')

const file = path.join(__dirname, 'src/app/(dashboard)/configuracoes/page.tsx')
let content = fs.readFileSync(file, 'utf8')

// 1. Update imports
content = content.replace(/import \{ \n  Settings/g, 'import { \n  Settings')
content = content.replace(/  Loader2\n\} from 'lucide-react'/, '  Loader2,\n  Shield,\n  Users,\n  Activity\n} from \'lucide-react\'')

// 2. Update TabType
content = content.replace(/type TabType = 'geral' \| 'financeiro' \| 'categorias' \| 'cobranca'/g, 'type TabType = \'geral\' | \'financeiro\' | \'categorias\' | \'cobranca\' | \'acessos\'')

// 3. Update tabs array
content = content.replace(/\{ id: 'cobranca', label: 'Regras de Cobrança', icon: Zap \},\n  \]/g, '{ id: \'cobranca\', label: \'Regras de Cobrança\', icon: Zap },\n    { id: \'acessos\', label: \'Controle de Acessos\', icon: Shield },\n  ]')

// 4. Add acessos rendering block at the very end before the last </div>\n    </div>\n  )\n}
const block = `
      {activeTab === 'acessos' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <a href="/configuracoes/colaboradores" className="group p-8 bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/40 hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
              <Users size={28} />
            </div>
            <h3 className="text-lg font-black text-slate-800 tracking-tight mb-2">Colaboradores</h3>
            <p className="text-sm text-slate-500 font-medium">Cadastre funcionários e gerencie os status de acesso à plataforma.</p>
          </a>
          
          <a href="/configuracoes/perfis" className="group p-8 bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/40 hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
              <Shield size={28} />
            </div>
            <h3 className="text-lg font-black text-slate-800 tracking-tight mb-2">Perfis e Permissões</h3>
            <p className="text-sm text-slate-500 font-medium">Defina quais módulos cada cargo pode ver, criar, editar ou excluir.</p>
          </a>

          <a href="/auditoria" className="group p-8 bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/40 hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
              <Activity size={28} />
            </div>
            <h3 className="text-lg font-black text-slate-800 tracking-tight mb-2">Log de Auditoria</h3>
            <p className="text-sm text-slate-500 font-medium">Histórico completo de segurança rastreando todas as ações por usuário e IP.</p>
          </a>
        </div>
      )}
`
content = content.replace(/      \{\/\* End Tabs \*\/\}\n    <\/div>\n  \)\n\}/, `      {/* End Tabs */}\n${block}\n    </div>\n  )\n}`)

// Since {/* End Tabs */} doesn't exist, let's find the end of the return statement
// The last tab is cobranca
content = content.replace(/      \{activeTab === 'cobranca' && \(\n        <ConfigCobrancaTab \/>\n      \)\}/, `      {activeTab === 'cobranca' && (\n        <ConfigCobrancaTab />\n      )}\n${block}`)

fs.writeFileSync(file, content)
console.log('updated')
