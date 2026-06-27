const fs = require('fs');
let path = 'c:/ÁUREA TECH - EM DEV/Éllus Gestão Estratégica/Ellus_Gestao/src/lib/hooks/useNotifications.ts';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/id: 'rec-hoje'[\s\S]*?link: '\/financeiro',/, match => match.replace("link: '/financeiro',", "link: '/financeiro?tab=receitas&status=aberto',"));
content = content.replace(/id: 'rec-7dias'[\s\S]*?link: '\/financeiro',/, match => match.replace("link: '/financeiro',", "link: '/financeiro?tab=receitas&status=aberto',"));
content = content.replace(/id: 'rec-30dias'[\s\S]*?link: '\/financeiro',/, match => match.replace("link: '/financeiro',", "link: '/financeiro?tab=receitas&status=aberto',"));

content = content.replace(/id: 'inadimp-1mes'[\s\S]*?link: '\/associados',/, match => match.replace("link: '/associados',", "link: '/associados?status=inadimplente',"));
content = content.replace(/id: 'inadimp-2mes'[\s\S]*?link: '\/associados',/, match => match.replace("link: '/associados',", "link: '/associados?status=inadimplente',"));
content = content.replace(/id: 'inadimp-3mais'[\s\S]*?link: '\/associados',/, match => match.replace("link: '/associados',", "link: '/associados?status=inadimplente',"));

content = content.replace(/id: 'desp-hoje'[\s\S]*?link: '\/financeiro',/, match => match.replace("link: '/financeiro',", "link: '/financeiro?tab=despesas&status=aberto',"));
content = content.replace(/id: 'desp-7dias'[\s\S]*?link: '\/financeiro',/, match => match.replace("link: '/financeiro',", "link: '/financeiro?tab=despesas&status=aberto',"));
content = content.replace(/id: 'desp-30dias'[\s\S]*?link: '\/financeiro',/, match => match.replace("link: '/financeiro',", "link: '/financeiro?tab=despesas&status=aberto',"));

content = content.replace(/id: 'conc-hoje'[\s\S]*?link: '\/financeiro',/, match => match.replace("link: '/financeiro',", "link: '/financeiro?tab=conciliacao',"));
content = content.replace(/id: 'conc-dias'[\s\S]*?link: '\/financeiro',/, match => match.replace("link: '/financeiro',", "link: '/financeiro?tab=conciliacao',"));

content = content.replace(/id: 'assoc-sem-lanc'[\s\S]*?link: '\/associados',/, match => match.replace("link: '/associados',", "link: '/associados?filter=sem_lancamento',"));

content = content.replace(/id: 'zapsign-assoc'[\s\S]*?link: '\/associados',/, match => match.replace("link: '/associados',", "link: '/associados?filterTermo=pendente',"));
content = content.replace(/id: 'zapsign-presidente'[\s\S]*?link: '\/associados',/, match => match.replace("link: '/associados',", "link: '/associados?filterTermo=pendente',"));

content = content.replace(/id: 'estrat-resultado'[\s\S]*?link: '\/financeiro',/, match => match.replace("link: '/financeiro',", "link: '/financeiro?tab=geral',"));
content = content.replace(/id: 'estrat-caixa'[\s\S]*?link: '\/financeiro',/, match => match.replace("link: '/financeiro',", "link: '/financeiro?tab=geral',"));
content = content.replace(/id: 'estrat-fechamento'[\s\S]*?link: '\/financeiro',/, match => match.replace("link: '/financeiro',", "link: '/financeiro?tab=receitas',"));

fs.writeFileSync(path, content);
console.log('done');
