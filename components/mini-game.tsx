'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Cookie, Star, Bomb, Play, Trophy } from 'lucide-react'

type Item = {
  id: number
  x: number // 0-100 (%)
  y: number // 0-100 (%)
  vy: number
  kind: 'food' | 'star' | 'bomb'
  gone: boolean
}

type MiniGameProps = {
  onFinish: (result: { coins: number; happiness: number; score: number }) => void
}

const GAME_SEC = 25

export function MiniGame({ onFinish }: MiniGameProps) {
  const [phase, setPhase] = useState<'idle' | 'playing' | 'over'>('idle')
  const [items, setItems] = useState<Item[]>([])
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(GAME_SEC)
  const [lastResult, setLastResult] = useState<{ coins: number; score: number } | null>(null)

  const rafRef = useRef<number | null>(null)
  const lastTs = useRef<number>(0)
  const spawnAcc = useRef<number>(0)
  const idRef = useRef<number>(0)
  const scoreRef = useRef<number>(0)
  const endRef = useRef<number>(0)

  const start = useCallback(() => {
    setItems([])
    setScore(0)
    scoreRef.current = 0
    setTimeLeft(GAME_SEC)
    endRef.current = performance.now() + GAME_SEC * 1000
    lastTs.current = performance.now()
    spawnAcc.current = 0
    setPhase('playing')
  }, [])

  const finish = useCallback(() => {
    setPhase('over')
    const s = Math.max(0, scoreRef.current)
    const coins = Math.round(s / 3)
    const happiness = Math.min(40, Math.round(s / 2))
    setLastResult({ coins, score: s })
    onFinish({ coins, happiness, score: s })
  }, [onFinish])

  // ゲームループ
  useEffect(() => {
    if (phase !== 'playing') return

    const step = (ts: number) => {
      const dt = Math.min(0.05, (ts - lastTs.current) / 1000)
      lastTs.current = ts

      // 残り時間
      const remain = Math.max(0, endRef.current - ts)
      setTimeLeft(Math.ceil(remain / 1000))

      // スポーン
      spawnAcc.current += dt
      const spawnEvery = 0.55
      if (spawnAcc.current >= spawnEvery) {
        spawnAcc.current = 0
        const r = Math.random()
        const kind: Item['kind'] = r < 0.16 ? 'bomb' : r < 0.32 ? 'star' : 'food'
        idRef.current += 1
        setItems((prev) => [
          ...prev,
          {
            id: idRef.current,
            x: 8 + Math.random() * 84,
            y: -8,
            vy: 26 + Math.random() * 22,
            kind,
            gone: false,
          },
        ])
      }

      // 落下
      setItems((prev) =>
        prev
          .map((it) => ({ ...it, y: it.y + it.vy * dt }))
          .filter((it) => it.y < 112 && !it.gone),
      )

      if (remain <= 0) {
        finish()
        return
      }
      rafRef.current = requestAnimationFrame(step)
    }

    rafRef.current = requestAnimationFrame(step)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [phase, finish])

  const hit = useCallback((item: Item) => {
    setItems((prev) => prev.map((it) => (it.id === item.id ? { ...it, gone: true } : it)))
    let delta = 0
    if (item.kind === 'food') delta = 3
    else if (item.kind === 'star') delta = 6
    else delta = -5
    scoreRef.current += delta
    setScore((s) => s + delta)
  }, [])

  return (
    <div className="rounded-3xl border border-border bg-card/70 p-4 shadow-lg backdrop-blur">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-lg font-extrabold text-foreground">
          <Trophy className="size-5 text-chart-4" aria-hidden="true" />
          フードキャッチ
        </h3>
        {phase === 'playing' && (
          <div className="flex items-center gap-3 text-sm font-bold">
            <span className="rounded-full bg-secondary px-3 py-1 text-secondary-foreground">のこり {timeLeft}s</span>
            <span className="rounded-full bg-chart-4 px-3 py-1 text-white">スコア {score}</span>
          </div>
        )}
      </div>

      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-gradient-to-b from-secondary/25 to-accent/25 sm:aspect-[4/3]">
        {/* プレイ中の落下アイテム */}
        {phase === 'playing' &&
          items.map((it) => (
            <button
              key={it.id}
              type="button"
              aria-label={it.kind === 'bomb' ? 'ばくだん' : it.kind === 'star' ? 'スター' : 'ごはん'}
              onPointerDown={(e) => {
                e.preventDefault()
                hit(it)
              }}
              className="absolute flex size-12 -translate-x-1/2 items-center justify-center rounded-2xl shadow-md transition-transform active:scale-90"
              style={{
                left: `${it.x}%`,
                top: `${it.y}%`,
                backgroundColor:
                  it.kind === 'bomb'
                    ? 'var(--destructive)'
                    : it.kind === 'star'
                      ? 'var(--chart-4)'
                      : 'var(--primary)',
                touchAction: 'none',
              }}
            >
              {it.kind === 'bomb' ? (
                <Bomb className="size-6 text-white" aria-hidden="true" />
              ) : it.kind === 'star' ? (
                <Star className="size-6 fill-current text-white" aria-hidden="true" />
              ) : (
                <Cookie className="size-6 text-primary-foreground" aria-hidden="true" />
              )}
            </button>
          ))}

        {/* スタート画面 */}
        {phase === 'idle' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
            <p className="text-balance text-sm font-semibold text-foreground">
              おちてくる<span className="text-primary">ごはん</span>と
              <span className="text-chart-4">スター</span>をタップ！
              <br />
              <span className="text-destructive">ばくだん</span>はさわっちゃダメ！
            </p>
            <button
              type="button"
              onClick={start}
              className="flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-base font-extrabold text-primary-foreground shadow-md transition-transform active:scale-95 hover:-translate-y-0.5"
            >
              <Play className="size-5 fill-current" aria-hidden="true" />
              スタート！
            </button>
          </div>
        )}

        {/* 結果画面 */}
        {phase === 'over' && lastResult && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-card/80 p-6 text-center backdrop-blur">
            <span className="animate-[popIn_0.4s_ease] text-3xl font-black text-foreground">おわり！</span>
            <p className="text-lg font-bold text-foreground">スコア {lastResult.score}</p>
            <p className="rounded-full bg-chart-4 px-4 py-1.5 text-base font-extrabold text-white">
              {lastResult.coins} コインGET！
            </p>
            <button
              type="button"
              onClick={start}
              className="mt-1 flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-extrabold text-primary-foreground shadow-md transition-transform active:scale-95 hover:-translate-y-0.5"
            >
              <Play className="size-4 fill-current" aria-hidden="true" />
              もう一回
            </button>
          </div>
        )}
      </div>

      <p className="mt-3 text-center text-xs font-medium text-muted-foreground">
        スコアに応じてコインときげんがアップ！かせいだコインでショップの着せ替えを買おう。
      </p>
    </div>
  )
}
