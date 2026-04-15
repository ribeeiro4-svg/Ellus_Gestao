# ─── .env.local ──────────────────────────────────────────────────────────
# Copie este arquivo para .env.local e preencha com seus valores reais

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://SEU_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key_aqui
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui   # Apenas no servidor

# App
NEXT_PUBLIC_APP_URL=https://seu-dominio.vercel.app
NEXT_PUBLIC_APP_NAME=ACPROBEC Dashboard

# Email (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxx
EMAIL_FROM=noreply@seudominio.com.br

# ─── vercel.json ──────────────────────────────────────────────────────────
# {
#   "framework": "nextjs",
#   "regions": ["gru1"],
#   "env": {
#     "NEXT_PUBLIC_SUPABASE_URL": "@supabase_url",
#     "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase_anon_key"
#   }
# }

# ─── next.config.js ───────────────────────────────────────────────────────
# /** @type {import('next').NextConfig} */
# const nextConfig = {
#   images: {
#     domains: ['seu_project_id.supabase.co'],
#   },
#   experimental: {
#     serverActions: true,
#   },
# }
# module.exports = nextConfig

# ─── PASSOS PARA DEPLOY NO VERCEL ────────────────────────────────────────
#
# 1. Criar projeto no Supabase (supabase.com)
#    - Copiar URL e ANON KEY do painel Settings > API
#    - Rodar as migrations: supabase db push
#
# 2. Criar projeto no GitHub
#    git init
#    git add .
#    git commit -m "init"
#    git remote add origin https://github.com/seu-usuario/acprobec-dashboard
#    git push -u origin main
#
# 3. Importar no Vercel (vercel.com)
#    - New Project > Import Git Repository
#    - Framework: Next.js (detectado automático)
#    - Environment Variables: adicionar as do .env.local
#    - Deploy!
#
# 4. Configurar domínio personalizado no Vercel (opcional)
#    - Settings > Domains > Add
