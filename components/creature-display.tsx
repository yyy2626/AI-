'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { type GameState, type Mood, getStage, getMood, moodText } from '@/lib/game'

type FloatingText = { id: number; text: string; kind: string }

type CreatureDisplayProps = {
  state: GameState
  floating: FloatingText[]
  bounceKey: number
}

const moodRing: Record<Mood, string> = {
  happy: 'shadow-[0_0_0_8px_rgba(250,204,21,0.25)]',
  normal: 'shadow-[0_0_0_8px_rgba(94,234,212,0.2)]',
  sad: 'shadow-[0_0_0_8px_rgba(148,163,184,0.25)]',
  sleepy: 'shadow-[0_0_0_8px_rgba(129,140,248,0.25)]',
  hungry: 'shadow-[0_0_0_8px_rgba(251,146,60,0.3)]',
}

export function CreatureDisplay({ state, floating, bounceKey }: CreatureDisplayProps) {
  const stage = getStage(state)
  const mood = getMood(state)
  const [bounce, setBounce] = useState(false)

  useEffect(() => {
    if (bounceKey === 0) return
    setBounce(true)
    const t = setTimeout(() => setBounce(false), 500)
    return () => clearTimeout(t)
  }, [bounceKey])

  return (
    <div className="relative flex flex-col items-center justify-center py-4">
      {/* 進化ステージ表示 */}
      <span className="mb-3 rounded-full bg-accent px-4 py-1 text-sm font-bold text-accent-foreground shadow-sm">
        Stage {stage.index + 1} ・ {stage.label}
      </span>

      <div className="relative">
        {/* ふきだしテキスト */}
        <div className="pointer-events-none absolute inset-x-0 -top-2 z-20 flex justify-center">
          {floating.map((f) => (
            <span
              key={f.id}
              className="absolute animate-[floatUp_1.1s_ease-out_forwards] whitespace-nowrap rounded-full bg-primary px-3 py-1 text-sm font-bold text-primary-foreground shadow-md"
            >
              {f.text}
            </span>
          ))}
        </div>

        {/* キャラクター */}
        <div
          className={`relative flex size-52 items-center justify-center overflow-hidden rounded-full transition-transform sm:size-60 ${moodRing[mood]} ${
            bounce ? 'animate-[pop_0.5s_ease]' : ''
          } ${state.isSleeping ? 'opacity-80' : ''}`}
          style={{ backgroundColor: 'oklch(0.96 0.045 95)' }}
        >
          <Image
            src={stage.image || '/placeholder.svg'}
            alt={`${state.name}（${stage.label}）`}
            width={240}
            height={240}
            priority
            className={`size-52 object-cover sm:size-60 ${
              state.isSleeping ? '' : 'animate-[idle_3s_ease-in-out_infinite]'
            }`}
          />
          {state.isSleeping && (
            <span className="absolute right-4 top-4 animate-pulse text-2xl font-black text-secondary-foreground">
              Z
            </span>
          )}
        </div>
      </div>

      {/* 名前ときもち */}
      <div className="mt-4 text-center">
        <h2 className="text-2xl font-extrabold text-foreground">{state.name}</h2>
        <p className="text-sm font-semibold text-muted-foreground">{moodText[mood]}</p>
      </div>
    </div>
  )
}
