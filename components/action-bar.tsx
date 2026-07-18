'use client'

import { Cookie, Gamepad2, BookOpen, Moon, Hand, type LucideIcon } from 'lucide-react'
import type { ActionId } from '@/lib/game'

type ActionDef = {
  id: ActionId
  label: string
  icon: LucideIcon
  color: string
  text: string
}

type ActionBarProps = {
  onAction: (id: ActionId) => void
  isSleeping: boolean
}

export function ActionBar({ onAction, isSleeping }: ActionBarProps) {
  const actions: ActionDef[] = [
    { id: 'feed', label: 'ごはん', icon: Cookie, color: 'bg-primary', text: 'text-primary-foreground' },
    { id: 'play', label: 'あそぶ', icon: Gamepad2, color: 'bg-secondary', text: 'text-secondary-foreground' },
    { id: 'study', label: 'べんきょう', icon: BookOpen, color: 'bg-chart-4', text: 'text-white' },
    { id: 'pet', label: 'なでる', icon: Hand, color: 'bg-chart-5', text: 'text-white' },
    { id: 'sleep', label: isSleeping ? 'おこす' : 'ねむる', icon: Moon, color: 'bg-accent', text: 'text-accent-foreground' },
  ]

  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
      {actions.map((a) => {
        const disabled = isSleeping && a.id !== 'sleep'
        return (
          <button
            key={a.id}
            type="button"
            onClick={() => onAction(a.id)}
            disabled={disabled}
            className={`group flex flex-col items-center gap-2 rounded-2xl border-2 border-transparent bg-card p-3 shadow-sm transition-all active:scale-95 hover:-translate-y-0.5 hover:border-border hover:shadow-md disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0`}
          >
            <span
              className={`flex size-11 items-center justify-center rounded-xl ${a.color} ${a.text} shadow-sm transition-transform group-hover:scale-110`}
            >
              <a.icon className="size-6" aria-hidden="true" />
            </span>
            <span className="text-sm font-bold text-foreground">{a.label}</span>
          </button>
        )
      })}
    </div>
  )
}
