const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src/features/associados/components/AssociadosTab.tsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Remove state
content = content.replace(
  "  const [filterAdesao, setFilterAdesao] = useState<string>('todos')\n",
  ""
);

// 2. Remove filter logic
content = content.replace(
  `    if (filterAdesao !== 'todos') {
      res = res.filter((a: any) => {
        const hasAdesaoPaga = lancamentos.some(l => 
          l.associado_id === a.id && 
          l.status === 'pago' && 
          (l.categoria?.toUpperCase().includes('ADESÃO') || l.descricao?.toUpperCase().includes('ADESÃO'))
        )
        return filterAdesao === 'identificada' ? hasAdesaoPaga : !hasAdesaoPaga
      })
    }
    
`,
  ""
);

// 3. Remove dependencies
content = content.replace(
  "filterAdesao, filterCpfPresence",
  "filterCpfPresence"
);
content = content.replace(
  " || filterAdesao !== 'todos'",
  ""
);
content = content.replace(
  "setFilterAdesao('todos'); ",
  ""
);

// 4. Remove UI dropdown
content = content.replace(
  `          <select value={filterAdesao} onChange={e => setFilterAdesao(e.target.value)} className="bg-gray-50 px-4 py-3 rounded-2xl text-xs font-bold border-none outline-none">
            <option value="todos">ADESÃO (TODOS)</option>
            <option value="identificada">ADESÃO IDENTIFICADA</option>
            <option value="pendente">ADESÃO PENDENTE</option>
          </select>
`,
  ""
);

fs.writeFileSync(file, content, 'utf8');
console.log('Removed filterAdesao successfully.');
