# Estrutura do Projeto — ACPROBEC Dashboard SaaS

```
acprobec-dashboard/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── register/
│   │       └── page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx          ← Sidebar + Topbar
│   │   ├── page.tsx            ← Dashboard (visão geral)
│   │   ├── financeiro/
│   │   │   └── page.tsx
│   │   ├── receitas/
│   │   │   └── page.tsx
│   │   ├── despesas/
│   │   │   └── page.tsx
│   │   ├── associados/
│   │   │   └── page.tsx
│   │   ├── inadimplencia/
│   │   │   └── page.tsx
│   │   ├── metas/
│   │   │   └── page.tsx
│   │   ├── projetos/
│   │   │   └── page.tsx
│   │   ├── evolucao/
│   │   │   └── page.tsx
│   │   └── importar/
│   │       └── page.tsx
│   ├── api/
│   │   ├── auth/
│   │   │   └── [...nextauth]/route.ts
│   │   ├── financeiro/
│   │   │   └── route.ts
│   │   ├── associados/
│   │   │   └── route.ts
│   │   ├── metas/
│   │   │   └── route.ts
│   │   ├── projetos/
│   │   │   └── route.ts
│   │   └── importar/
│   │       └── route.ts
│   ├── globals.css
│   └── layout.tsx              ← Root layout
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── Topbar.tsx
│   │   └── Breadcrumb.tsx
│   ├── ui/
│   │   ├── KpiCard.tsx
│   │   ├── ChartCard.tsx
│   │   ├── DataTable.tsx
│   │   ├── StatusBadge.tsx
│   │   ├── ProgressBar.tsx
│   │   ├── Modal.tsx
│   │   └── Toast.tsx
│   ├── charts/
│   │   ├── BarChart.tsx
│   │   ├── LineChart.tsx
│   │   ├── DoughnutChart.tsx
│   │   └── MixedChart.tsx
│   └── importar/
│       ├── DropZone.tsx
│       ├── PreviewTable.tsx
│       └── TemplateCards.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts           ← Supabase browser client
│   │   ├── server.ts           ← Supabase server client
│   │   └── middleware.ts
│   ├── hooks/
│   │   ├── useFinanceiro.ts
│   │   ├── useAssociados.ts
│   │   ├── useMetas.ts
│   │   └── useProjetos.ts
│   ├── utils/
│   │   ├── formatters.ts       ← fmtR, fmtPct, etc
│   │   ├── calcMensal.ts
│   │   └── csvParser.ts
│   └── types/
│       └── index.ts            ← Todos os tipos TypeScript
├── styles/
│   └── design-tokens.css       ← Todas as CSS vars do sistema
├── public/
│   ├── modelos/
│   │   ├── modelo_financeiro.csv
│   │   ├── modelo_associados.csv
│   │   ├── modelo_metas.csv
│   │   └── modelo_projetos.csv
│   └── logo.svg
├── supabase/
│   └── migrations/
│       ├── 001_create_tenants.sql
│       ├── 002_create_financeiro.sql
│       ├── 003_create_associados.sql
│       ├── 004_create_metas.sql
│       └── 005_create_projetos.sql
├── middleware.ts               ← Proteção de rotas
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```
