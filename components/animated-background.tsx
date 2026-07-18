'use client'

import { useMemo } from 'react'

type Blob = { top: string; left: string; size: string; color: string; delay: string; dur: string }
type Dot = { top: string; left: string; size: string; color: string; delay: string; dur: string }

export function AnimatedBackground() {
  const blobs = useMemo<Blob[]>(
    () => [
      { top: '-8%', left: '-6%', size: '42vmin', color: 'var(--primary)', delay: '0s', dur: '14s' },
      { top: '10%', left: '70%', size: '38vmin', color: 'var(--secondary)', delay: '-3s', dur: '17s' },
      { top: '60%', left: '-10%', size: '46vmin', color: 'var(--chart-4)', delay: '-6s', dur: '19s' },
      { top: '65%', left: '65%', size: '40vmin', color: 'var(--chart-5)', delay: '-9s', dur: '16s' },
    ],
    [],
  )

  const dots = useMemo<Dot[]>(() => {
    const palette = ['var(--primary)', 'var(--secondary)', 'var(--chart-4)', 'var(--chart-5)']
    return Array.from({ length: 18 }, (_, i) => ({
      top: `${Math.round((Math.sin(i * 12.9) * 0.5 + 0.5) * 100)}%`,
      left: `${Math.round(((i * 61) % 100))}%`,
      size: `${6 + (i % 4) * 4}px`,
      color: palette[i % palette.length],
      delay: `${-(i % 7)}s`,
      dur: `${8 + (i % 6)}s`,
    }))
  }, [])

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* うっすら動くグラデーションブロブ */}
      {blobs.map((b, i) => (
        <span
          key={`b-${i}`}
          className="absolute rounded-full opacity-30 blur-3xl animate-[drift_var(--dur)_ease-in-out_infinite]"
          style={
            {
              top: b.top,
              left: b.left,
              width: b.size,
              height: b.size,
              backgroundColor: b.color,
              animationDelay: b.delay,
              ['--dur' as string]: b.dur,
            } as React.CSSProperties
          }
        />
      ))}

      {/* ふわふわ浮かぶ粒 */}
      {dots.map((d, i) => (
        <span
          key={`d-${i}`}
          className="absolute rounded-full opacity-40 animate-[bob_var(--dur)_ease-in-out_infinite]"
          style={
            {
              top: d.top,
              left: d.left,
              width: d.size,
              height: d.size,
              backgroundColor: d.color,
              animationDelay: d.delay,
              ['--dur' as string]: d.dur,
            } as React.CSSProperties
          }
        />
      ))}

      {/* うっすらドットグリッド */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: 'radial-gradient(currentColor 1.5px, transparent 1.5px)',
          backgroundSize: '22px 22px',
          color: 'var(--foreground)',
        }}
      />
    </div>
  )
}
