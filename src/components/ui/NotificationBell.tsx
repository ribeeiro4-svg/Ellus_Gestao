'use client'
import React, { useState, useRef, useEffect } from 'react'
import { Bell } from 'lucide-react'
import { useNotifications } from '@/lib/hooks/useNotifications'
import NotificationsPanel from './NotificationsPanel'

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const { urgentCount, loading } = useNotifications()

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [isOpen])

  return (
    <div ref={panelRef} className="relative">
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100 transition-colors text-slate-500 hover:text-slate-700"
        aria-label="Notificações"
      >
        <Bell size={18} />
        {!loading && urgentCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center leading-none shadow-sm">
            {urgentCount > 9 ? '9+' : urgentCount}
          </span>
        )}
      </button>

      {isOpen && <NotificationsPanel onClose={() => setIsOpen(false)} />}
    </div>
  )
}
