'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import {
  type GameState,
  type Mood,
  type ActionEffect,
  ACCESSORIES,
  getStage,
  getMood,
  moodText,
} from '@/lib/game'
import { BurstEffect } from '@/components/burst-effect'

type FloatingText = { id: number; text: string; kind: string }

type CreatureDisplayProps = {
  state: GameState
  floating: FloatingText[]
  bounceKey: number
  effect: ActionEffect
}

const moodRing: Record<Mood, string> = {
  happy: 'shadow-[0_0_0_10px_rgba(250,204,21,0.28)]',
  normal: 'shadow-[0_0_0_10px_rgba(94,234,212,0.22)]',
  sad: 'shadow-[0_0_0_10px_rgba(148,163,184,0.28)]',
  sleepy: 'shadow-[0_0_0_10px_rgba(129,140,248,0.28)]',
  hungry: 'shadow-[0_0_0_10px_rgba(251,146,60,0.32)]',
  dirty: 'shadow-[0_0_0_10px_rgba(120,113,108,0.3)]',
}

export function CreatureDisplay({ state, floating, bounceKey, effect }: CreatureDisplayProps) {
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
      <span className="mb-3 animate-[popIn_0.4s_ease] rounded-full bg-accent px-4 py-1 text-sm font-bold text-accent-foreground shadow-sm">
        Stage {stage.index + 1} ・ {stage.label}
      </span>

      <div className="relative">
        {/* バーストエフェクト */}
        <BurstEffect fireKey={bounceKey} effect={effect} />

        {/* ふきだしテキスト */}
        <div className="pointer-events-none absolute inset-x-0 -top-2 z-40 flex justify-center">
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
          className={`relative flex size-52 items-center justify-center rounded-full transition-all duration-300 sm:size-60 ${moodRing[mood]} ${
            bounce ? 'animate-[pop_0.5s_ease]' : ''
          } ${state.isSleeping ? 'opacity-85' : ''}`}
        >
          {/* 円の中身（画像）はオーバーフロー隠す */}
          <div
            className="relative size-full overflow-hidden rounded-full"
            style={{ backgroundColor: 'oklch(0.96 0.045 95)' }}
          >
            <Image
              src={stage.image || '/placeholder.svg'}
              alt={`${state.name}（${stage.label}）`}
              width={240}
              height={240}
              priority
              className={`size-full object-cover ${
                state.isSleeping ? '' : 'animate-[idle_3s_ease-in-out_infinite]'
              }`}
            />
          </div>

          {/* 着せ替えオーバーレイ（円の外にはみ出してOK） */}
          {state.equipped.map((id) => {
            const acc = ACCESSORIES[id]
            return (
              <img
                key={id}
                src={acc.image || '/placeholder.svg'}
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute z-20 drop-shadow-md"
                style={{
                  top: acc.position.top,
                  left: acc.position.left,
                  width: acc.position.width,
                  transform: `translate(-50%, 0) rotate(${acc.position.rotate ?? '0deg'})`,
                }}
              />
            )
          })}

          {state.isSleeping && (
            <span className="absolute right-3 top-3 z-30 animate-[bob_2s_ease-in-out_infinite] text-2xl font-black text-secondary-foreground">
              Z
            </span>
          )}
        </div>
      </div>

      <div className="mt-4 text-center">
        <h2 className="text-2xl font-extrabold text-foreground">{state.name}</h2>
        <p className="text-sm font-semibold text-muted-foreground">{moodText[mood]}</p>
      </div>
    </div>
  )
}
