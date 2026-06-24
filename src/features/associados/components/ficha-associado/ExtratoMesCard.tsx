import React from 'react'
import { Check, Clock, Calendar, Minus } from 'lucide-react'
import { fmtR } from '@/lib/utils/formatters'

interface ExtratoMesCardProps {
  mes: string
  valor: number
  status: 'pago' | 'adesao' | 'pendente' | 'nao_cobrado' | 'futuro' | string
  isEmCobranca?: boolean
}

export default function ExtratoMesCard({ mes, valor, status, isEmCobranca }: ExtratoMesCardProps) {
  const getStyles = () => {
    switch (status) {
      case 'pago':
        return { 
          bg: 'bg-emerald-50 border-emerald-100', 
          text: 'text-emerald-700', 
          badge: 'bg-emerald-500 text-white', 
          icon: <Check size={10} />, 
          label: 'Pago' 
        }
      case 'adesao_paga':
        return { 
          bg: 'bg-emerald-50 border-emerald-100', 
          text: 'text-emerald-700', 
          badge: 'bg-emerald-500 text-white', 
          icon: <Check size={10} />, 
          label: 'Adesão Paga' 
        }
      case 'adesao':
        return { 
          bg: 'bg-blue-50 border-blue-100', 
          text: 'text-blue-700', 
          badge: 'bg-blue-600 text-white', 
          icon: <Calendar size={10} />, 
          label: 'Adesão' 
        }
      case 'pendente':
        return { 
          bg: 'bg-amber-50 border-amber-100', 
          text: 'text-amber-700', 
          badge: 'bg-amber-500 text-white', 
          icon: <Clock size={10} />, 
          label: 'Pendente' 
        }
      case 'a_vencer':
        return { 
          bg: 'bg-indigo-50 border-indigo-100', 
          text: 'text-indigo-700', 
          badge: 'bg-indigo-400 text-white', 
          icon: <Calendar size={10} />, 
          label: 'A Vencer' 
        }
      case 'futuro':
        return { 
          bg: 'bg-slate-50 border-slate-100', 
          text: 'text-slate-400', 
          badge: 'bg-slate-300 text-white', 
          icon: <Clock size={10} />, 
          label: 'Aguardando' 
        }
      default:
        return { 
          bg: 'bg-gray-50 border-gray-100', 
          text: 'text-gray-400', 
          badge: 'bg-gray-200 text-white', 
          icon: <Minus size={10} />, 
          label: '--' 
        }
    }
  }

  const styles = getStyles()

  return (
    <div className={`p-4 rounded-2xl border ${styles.bg} transition-all hover:shadow-md flex flex-col gap-2 relative overflow-hidden group`}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-widest opacity-60">{mes}</span>
        <div className={`w-5 h-5 rounded-lg flex items-center justify-center ${styles.badge} shadow-sm group-hover:scale-110 transition-transform`}>
          {styles.icon}
        </div>
      </div>
      
      <div className="flex flex-col">
        <span className={`text-sm font-black ${styles.text}`}>{fmtR(valor)}</span>
        <span className={`text-[9px] font-bold uppercase tracking-tight opacity-70`}>{styles.label}</span>
      </div>

      {isEmCobranca && (
        <div className="absolute top-0 right-0 left-0 h-1 bg-orange-500 animate-pulse" />
      )}
      {isEmCobranca && (
        <span className="absolute bottom-2 right-2 text-[7px] font-black uppercase text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded-sm">
          Em Cobrança
        </span>
      )}
    </div>
  )
}
