// ─── Tipos de Role ────────────────────────────────────────────────────────────
export type UserRole =
  | 'admin'
  | 'presidente'
  | 'vice-presidente'
  | 'tesoureiro'
  | 'diretoria'
  | 'secretaria'
  | 'viewer'

// ─── Permissões disponíveis ────────────────────────────────────────────────────
export type Permission =
  | 'dashboard:view'
  | 'associados:view' | 'associados:write' | 'associados:delete'
  | 'atendimentos:view' | 'atendimentos:write'
  | 'financeiro:view' | 'financeiro:write' | 'financeiro:delete' | 'financeiro:conciliar'
  | 'planejamento:view' | 'planejamento:write'
  | 'fechamento:write'
  | 'estrategia:view' | 'estrategia:write'
  | 'tarefas:view' | 'tarefas:write'
  | 'bens:view' | 'bens:write'
  | 'recrutamento:view' | 'recrutamento:write'
  | 'fiscal:view' | 'fiscal:write'
  | 'contabil:view'
  | 'importar:write'
  | 'configuracoes:view' | 'configuracoes:write'
  | 'usuarios:view' | 'usuarios:write'
  | 'audit:view'

// ─── Permissões por Role ───────────────────────────────────────────────────────
const FULL_ACCESS: Permission[] = [
  'dashboard:view',
  'associados:view', 'associados:write', 'associados:delete',
  'atendimentos:view', 'atendimentos:write',
  'financeiro:view', 'financeiro:write', 'financeiro:delete', 'financeiro:conciliar',
  'planejamento:view', 'planejamento:write',
  'fechamento:write',
  'estrategia:view', 'estrategia:write',
  'tarefas:view', 'tarefas:write',
  'bens:view', 'bens:write',
  'recrutamento:view', 'recrutamento:write',
  'fiscal:view', 'fiscal:write',
  'contabil:view',
  'importar:write',
  'configuracoes:view', 'configuracoes:write',
  'usuarios:view', 'usuarios:write',
  'audit:view',
]

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: FULL_ACCESS,

  // Presidente tem acesso total EXCETO auditoria (módulo restrito ao Tesoureiro)
  presidente: [
    'dashboard:view',
    'associados:view', 'associados:write', 'associados:delete',
    'atendimentos:view', 'atendimentos:write',
    'financeiro:view', 'financeiro:write', 'financeiro:delete', 'financeiro:conciliar',
    'planejamento:view', 'planejamento:write',
    'fechamento:write',
    'estrategia:view', 'estrategia:write',
    'tarefas:view', 'tarefas:write',
    'bens:view', 'bens:write',
    'recrutamento:view', 'recrutamento:write',
    'fiscal:view', 'fiscal:write',
    'contabil:view',
    'importar:write',
    'configuracoes:view', 'configuracoes:write',
    'usuarios:view', 'usuarios:write',
    // audit:view removido intencionalmente — apenas Tesoureiro e Admin
  ],

  'vice-presidente': [
    'dashboard:view',
    'associados:view', 'associados:write', 'associados:delete',
    'atendimentos:view', 'atendimentos:write',
    'financeiro:view', 'financeiro:write', 'financeiro:delete', 'financeiro:conciliar',
    'planejamento:view', 'planejamento:write',
    'fechamento:write',
    'estrategia:view', 'estrategia:write',
    'tarefas:view', 'tarefas:write',
    'bens:view', 'bens:write',
    'recrutamento:view', 'recrutamento:write',
    'fiscal:view', 'fiscal:write',
    'contabil:view',
    'configuracoes:view',
    'usuarios:view',
    // audit:view removido intencionalmente — apenas Tesoureiro e Admin
  ],

  tesoureiro: [
    'dashboard:view',
    'associados:view', 'associados:write',
    'atendimentos:view', 'atendimentos:write',
    'financeiro:view', 'financeiro:write', 'financeiro:delete', 'financeiro:conciliar',
    'planejamento:view', 'planejamento:write',
    'fechamento:write',
    'estrategia:view',
    'tarefas:view', 'tarefas:write',
    'bens:view', 'bens:write',
    'recrutamento:view', 'recrutamento:write',
    'fiscal:view', 'fiscal:write',
    'contabil:view',
    'audit:view',
  ],

  diretoria: [
    'dashboard:view',
    'associados:view', 'associados:write',
    'atendimentos:view', 'atendimentos:write',
    'financeiro:view',
    'planejamento:view',
    'estrategia:view', 'estrategia:write',
    'tarefas:view', 'tarefas:write',
    'bens:view',
    'recrutamento:view', 'recrutamento:write',
    'fiscal:view',
    'contabil:view',
    // audit:view removido intencionalmente — apenas Tesoureiro e Admin
  ],

  secretaria: [
    'dashboard:view',
    'associados:view', 'associados:write',
    'atendimentos:view', 'atendimentos:write',
    'tarefas:view', 'tarefas:write',
    'recrutamento:view', 'recrutamento:write',
  ],

  viewer: [
    'dashboard:view',
    'associados:view',
    'atendimentos:view',
    'financeiro:view',
    'planejamento:view',
    'estrategia:view',
    'tarefas:view',
    'bens:view',
    'recrutamento:view',
  ],
}

// ─── Mapeamento de rota → permissão necessária ─────────────────────────────────
export const ROUTE_PERMISSIONS: Record<string, Permission> = {
  '/resumo': 'dashboard:view',
  '/associados': 'associados:view',
  '/atendimentos': 'atendimentos:view',
  '/financeiro': 'financeiro:view',
  '/planejamento': 'planejamento:view',
  '/fechamento': 'fechamento:write',
  '/estrategia': 'estrategia:view',
  '/gestao-tarefas': 'tarefas:view',
  '/bens-duraveis': 'bens:view',
  '/recrutamento': 'recrutamento:view',
  '/fiscal': 'fiscal:view',
  '/contabil': 'contabil:view',
  '/importar': 'importar:write',
  '/configuracoes': 'configuracoes:view',
  '/audit': 'audit:view',
}

// ─── Helper: checa se um role tem uma permissão ───────────────────────────────
export function roleHasPermission(role: UserRole | null | undefined, permission: Permission): boolean {
  if (!role) return false
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false
}

// ─── Label legível por role ───────────────────────────────────────────────────
export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrador',
  presidente: 'Presidente',
  'vice-presidente': 'Vice-Presidente',
  tesoureiro: 'Tesoureiro',
  diretoria: 'Diretoria',
  secretaria: 'Secretaria',
  viewer: 'Visualizador',
}

// ─── Cor por role (badge) ─────────────────────────────────────────────────────
export const ROLE_COLORS: Record<UserRole, string> = {
  admin: 'bg-rose-100 text-rose-700',
  presidente: 'bg-purple-100 text-purple-700',
  'vice-presidente': 'bg-indigo-100 text-indigo-700',
  tesoureiro: 'bg-emerald-100 text-emerald-700',
  diretoria: 'bg-blue-100 text-blue-700',
  secretaria: 'bg-amber-100 text-amber-700',
  viewer: 'bg-slate-100 text-slate-600',
}
