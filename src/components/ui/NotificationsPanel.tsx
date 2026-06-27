'use client'
import React, { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  X,
  Bell,
  AlertTriangle,
  TrendingDown,
  Users,
  FileSignature,
  RefreshCw,
  CreditCard,
  Target,
  Shield,
  Landmark,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react'
import { useNotifications, type Notification, type NotificationCategory, type NotificationPriority } from '@/lib/hooks/useNotifications'

// ─── Helpers ───────────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<NotificationCategory, string> = {
  mensalidade: 'Mensalidades',
  inadimplencia: 'Inadimplência',
  despesa: 'Pagamentos',
  conciliacao: 'Conciliação Bancária',
  associado: 'Associados',
  zapsign: 'Documentos ZapSign',
  presidente: 'Assinaturas do Presidente',
  estrategia: 'Estratégico',
}

const CATEGORY_ICONS: Record<NotificationCategory, React.ReactNode> = {
  mensalidade: <CreditCard size={14} />,
  inadimplencia: <AlertTriangle size={14} />,
  despesa: <TrendingDown size={14} />,
  conciliacao: <RefreshCw size={14} />,
  associado: <Users size={14} />,
  zapsign: <FileSignature size={14} />,
  presidente: <Shield size={14} />,
  estrategia: <Target size={14} />,
}

const PRIORITY_COLORS: Record<NotificationPriority, { dot: string; border: string; text: string; bg: string }> = {
  critico: { dot: 'bg-rose-500', border: 'border-rose-200', text: 'text-rose-600', bg: 'bg-rose-50' },
  urgente: { dot: 'bg-orange-500', border: 'border-orange-200', text: 'text-orange-600', bg: 'bg-orange-50' },
  alta:    { dot: 'bg-amber-500',  border: 'border-amber-200',  text: 'text-amber-600',  bg: 'bg-amber-50' },
  media:   { dot: 'bg-blue-400',   border: 'border-blue-100',   text: 'text-blue-500',   bg: 'bg-blue-50' },
  info:    { dot: 'bg-slate-300',  border: 'border-slate-100',  text: 'text-slate-500',  bg: 'bg-slate-50' },
}

const PRIORITY_LABELS: Record<NotificationPriority, string> = {
  critico: 'CRÍTICO',
  urgente: 'URGENTE',
  alta: 'ALTA',
  media: 'MÉDIA',
  info: 'INFO',
}

// ─── Item Component ────────────────────────────────────────────────────────────

function NotificationItem({ notif, onClose }: { notif: Notification; onClose: () => void }) {
  const router = useRouter()
  const colors = PRIORITY_COLORS[notif.priority]

  const handleClick = useCallback(() => {
    if (notif.link) {
      router.push(notif.link)
      onClose()
    }
  }, [notif.link, router, onClose])

  return (
    <button
      onClick={handleClick}
      className={`w-full text-left flex items-start gap-3 px-4 py-3 rounded-2xl border transition-all hover:shadow-sm group ${colors.border} ${colors.bg}`}
    >
      <div className="mt-1 flex-shrink-0">
        <div className={`w-2 h-2 rounded-full ${colors.dot} mt-0.5`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[11px] font-black text-slate-800 leading-snug">{notif.title}</p>
          <span className={`shrink-0 text-[8px] font-black tracking-widest px-1.5 py-0.5 rounded-full ${colors.text} bg-white border ${colors.border}`}>
            {PRIORITY_LABELS[notif.priority]}
          </span>
        </div>
        <p className="text-[10px] font-medium text-slate-500 mt-0.5 leading-snug line-clamp-2">{notif.description}</p>
      </div>
      {notif.link && (
        <ArrowRight size={13} className={`mt-1 flex-shrink-0 ${colors.text} opacity-0 group-hover:opacity-100 transition-opacity`} />
      )}
    </button>
  )
}

// ─── Main Panel ────────────────────────────────────────────────────────────────

interface NotificationsPanelProps {
  onClose: () => void
}

export default function NotificationsPanel({ onClose }: NotificationsPanelProps) {
  const { notifications, urgentCount, loading } = useNotifications()

  // Agrupar por categoria
  const grouped = notifications.reduce<Record<NotificationCategory, Notification[]>>(
    (acc, n) => {
      if (!acc[n.category]) acc[n.category] = []
      acc[n.category].push(n)
      return acc
    },
    {} as Record<NotificationCategory, Notification[]>
  )

  const categories = Object.keys(grouped) as NotificationCategory[]

  return (
    <div className="absolute right-0 top-full mt-2 w-[420px] max-h-[80vh] z-[200] flex flex-col rounded-3xl bg-white shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-3 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-white sticky top-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center">
            <Bell size={15} className="text-white" />
          </div>
          <div>
            <h3 className="text-[12px] font-black text-slate-800 tracking-tight">Centro de Notificações</h3>
            {loading ? (
              <p className="text-[10px] text-slate-400 font-medium">Carregando...</p>
            ) : notifications.length === 0 ? (
              <p className="text-[10px] text-emerald-500 font-bold">Tudo em ordem! ✓</p>
            ) : (
              <p className="text-[10px] text-slate-400 font-medium">
                {notifications.length} notificação{notifications.length > 1 ? 'ões' : ''}
                {urgentCount > 0 && <span className="text-rose-500 font-bold"> · {urgentCount} urgente{urgentCount > 1 ? 's' : ''}</span>}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 transition-colors text-slate-400"
        >
          <X size={16} />
        </button>
      </div>

      {/* Content */}
      <div className="overflow-y-auto flex-1 p-4 flex flex-col gap-5">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
          </div>
        )}

        {!loading && notifications.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="w-14 h-14 rounded-3xl bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 size={28} className="text-emerald-500" />
            </div>
            <div className="text-center">
              <p className="text-[13px] font-black text-slate-800">Tudo em ordem!</p>
              <p className="text-[11px] text-slate-400 font-medium mt-1">Nenhuma notificação pendente.</p>
            </div>
          </div>
        )}

        {!loading && categories.map(category => (
          <div key={category}>
            {/* Category Header */}
            <div className="flex items-center gap-2 mb-2 px-1">
              <div className="text-slate-400">{CATEGORY_ICONS[category]}</div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                {CATEGORY_LABELS[category]}
              </span>
              <div className="flex-1 h-px bg-slate-100" />
              <span className="text-[9px] font-black text-slate-300">{grouped[category].length}</span>
            </div>

            {/* Items */}
            <div className="flex flex-col gap-2">
              {grouped[category].map(notif => (
                <NotificationItem key={notif.id} notif={notif} onClose={onClose} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/80">
        <p className="text-[9px] font-bold text-slate-400 text-center uppercase tracking-widest">
          Atualizado em tempo real com os dados do sistema
        </p>
      </div>
    </div>
  )
}
