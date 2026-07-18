'use client'

import { useMemo } from 'react'
import type { ActionEffect } from '@/lib/game'

type BurstProps = {
  /** 変化するたびにバーストを再生するためのキー */
  fireKey: number
  effect: ActionEffect
}

const EFFECT_COLORS: Record<ActionEffect, string[]> = {
  happy: ['var(--chart-5)', 'var(--accent)', 'var(--secondary)'],
  eat: ['var(--primary)', 'var(--accent)', 'var(--chart-4)'],
  study: ['var(--secondary)', 'var(--chart-5)', 'var(--accent)'],
  love: ['var(--primary)', 'var(--chart-5)', 'var(--accent)'],
  clean: ['var(--secondary)', 'var(--chart-4)', 'var(--accent)'],
  sleep: ['var(--secondary)', 'var(--muted-foreground)'],
  fail: ['var(--muted-foreground)'],
}

export function BurstEffect({ fireKey, effect }: BurstProps) {
  const particles = useMemo(() => {
    const colors = EFFECT_COLORS[effect] ?? EFFECT_COLORS.happy
    const count = effect === 'fail' ? 6 : 16
    return Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2
      const dist = 70 + (i % 5) * 14
      return {
        id: i,
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist,
        color: colors[i % colors.length],
        size: 8 + (i % 3) * 4,
        delay: (i % 4) * 20,
      }
    })
    // fireKeyが変わるたびに新しい粒を作る
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fireKey, effect])

  if (fireKey === 0) return null

  return (
    <div key={fireKey} aria-hidden="true" className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute rounded-full animate-[burst_0.7s_ease-out_forwards]"
          style={
            {
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
              animationDelay: `${p.delay}ms`,
              ['--bx' as string]: `${p.x}px`,
              ['--by' as string]: `${p.y}px`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  )
}
