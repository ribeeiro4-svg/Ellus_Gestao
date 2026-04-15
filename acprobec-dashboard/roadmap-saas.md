# Roadmap de Desenvolvimento — SaaS Dashboard de Associações

## 🏁 FASE 1 — MVP (2–3 semanas)
> Funcional para a ACPROBEC usar em produção

- [x] Design completo do frontend (HTML/CSS/JS — pronto)
- [ ] Migrar HTML → Next.js (estrutura gerada ✅)
- [ ] Configurar Supabase + migrations SQL (script pronto ✅)
- [ ] Autenticação (login/logout com Supabase Auth)
- [ ] Conectar todos os hooks (useFinanceiro, useAssociados, etc.)
- [ ] Importação CSV/Excel funcionando com Supabase
- [ ] Deploy no Vercel + domínio

**Entregável:** Dashboard funcionando online com dados reais da ACPROBEC

---

## 🚀 FASE 2 — Produto (3–4 semanas)
> Preparar para venda como SaaS

- [ ] Multi-tenancy (cada associação = 1 tenant isolado)
- [ ] Página de registro de novas associações
- [ ] Planos e limites por plano (básico/pro/multi)
- [ ] Edição inline nas tabelas (sem precisar reimportar)
- [ ] Filtro por período (mês/trimestre/ano) em todos os gráficos
- [ ] Exportação para Excel (.xlsx) real
- [ ] Relatório PDF gerado no servidor (Puppeteer ou react-pdf)
- [ ] Histórico real de associados mês a mês
- [ ] Página de perfil e configurações da associação

**Entregável:** SaaS multi-tenant pronto para os primeiros clientes

---

## 💰 FASE 3 — Monetização (2–3 semanas)
> Colocar no mercado para venda

- [ ] Integração com Stripe ou Pagar.me para cobrança
- [ ] Página de pricing pública
- [ ] Trial de 14 dias
- [ ] Onboarding guiado (wizard de configuração)
- [ ] Email de boas-vindas + notificações (Resend)
- [ ] Alertas automáticos de inadimplência por email
- [ ] Painel admin (ver todos os tenants, métricas SaaS)
- [ ] Landing page de vendas

**Entregável:** SaaS comercialmente ativo com cobrança automática

---

## 🌟 FASE 4 — Crescimento (contínuo)
> Funcionalidades premium e escala

- [ ] White-label (logo e cores personalizadas por tenant)
- [ ] App mobile (React Native ou PWA)
- [ ] API pública para integrações
- [ ] Integração com sistemas de contabilidade (TOTVS, Omie)
- [ ] Módulo de votações e assembleias
- [ ] Módulo de comunicados e mensagens aos associados
- [ ] Dashboard para contadores (visão multi-associação)

---

## 💵 Modelo de Negócio

| Plano      | Preço/mês | Associados | Usuários | Funcionalidades |
|------------|-----------|------------|----------|-----------------|
| **Básico** | R$ 97     | até 100    | 2        | Core completo   |
| **Pro**    | R$ 197    | ilimitado  | 5        | + Email, PDF    |
| **Multi**  | R$ 397    | ilimitado  | ilimitado| + White-label   |

**Meta conservadora:** 20 clientes × R$ 197 = **R$ 3.940/mês** em 3 meses

---

## 📋 Próximos Passos Imediatos

1. **Antigravity** cria repositório GitHub e projeto Vercel
2. **Antigravity** cria projeto Supabase e roda as migrations SQL
3. **Antigravity** copia os arquivos gerados para o projeto e completa as páginas
4. **Testar** com dados reais da ACPROBEC
5. **Ajustar** visual conforme feedback
6. **Go live!** 🚀
