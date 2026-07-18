'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Cookie, Gamepad2, BookOpen, Sparkles, Star, RotateCcw } from 'lucide-react'
import {
  type ActionId,
  type GameState,
  applyDecay,
  createInitialState,
  expForLevel,
  performAction,
} from '@/lib/game'
import { StatBar } from '@/components/stat-bar'
import { CreatureDisplay } from '@/components/creature-display'
import { ActionBar } from '@/components/action-bar'

const SAVE_KEY = 'ai-pet-save-v1'

type FloatingText = { id: number; text: string; kind: string }

function loadState(): GameState {
  if (typeof window === 'undefined') return createInitialState()
  try {
    const raw = window.localStorage.getItem(SAVE_KEY)
    if (!raw) return createInitialState()
    const parsed = JSON.parse(raw) as GameState
    return applyDecay(parsed)
  } catch {
    return createInitialState()
  }
}

export function PetGame() {
  const [state, setState] = useState<GameState>(() => createInitialState())
  const [ready, setReady] = useState(false)
  const [floating, setFloating] = useState<FloatingText[]>([])
  const [message, setMessage] = useState('AIペットを育てよう！')
  const [bounceKey, setBounceKey] = useState(0)
  const [levelUpFlash, setLevelUpFlash] = useState(false)
  const floatId = useRef(0)
  const prevLevel = useRef(1)

  // 初回ロード（クライアントのみ）
  useEffect(() => {
    const loaded = loadState()
    setState(loaded)
    prevLevel.current = loaded.level
    setReady(true)
  }, [])

  // 保存
  useEffect(() => {
    if (!ready) return
    try {
      window.localStorage.setItem(SAVE_KEY, JSON.stringify(state))
    } catch {
      // ignore
    }
  }, [state, ready])

  // 時間経過でステータス減衰
  useEffect(() => {
    if (!ready) return
    const timer = setInterval(() => {
      setState((s) => applyDecay(s))
    }, 2000)
    return () => clearInterval(timer)
  }, [ready])

  // レベルアップ検知
  useEffect(() => {
    if (state.level > prevLevel.current) {
      setLevelUpFlash(true)
      const t = setTimeout(() => setLevelUpFlash(false), 1400)
      prevLevel.current = state.level
      return () => clearTimeout(t)
    }
    prevLevel.current = state.level
  }, [state.level])

  const pushFloating = useCallback((text: string, kind: string) => {
    const id = ++floatId.current
    setFloating((f) => [...f, { id, text, kind }])
    setTimeout(() => {
      setFloating((f) => f.filter((x) => x.id !== id))
    }, 1100)
  }, [])

  const handleAction = useCallback(
    (action: ActionId) => {
      setState((current) => {
        const result = performAction(current, action)
        setMessage(result.message)
        if (result.ok) {
          setBounceKey((k) => k + 1)
          pushFloating(result.message.slice(0, 12), result.effect)
        }
        return result.state
      })
    },
    [pushFloating],
  )

  const handleReset = useCallback(() => {
    if (!window.confirm('本当に最初から育て直しますか？（今の子はいなくなります）')) return
    const fresh = createInitialState()
    setState(fresh)
    prevLevel.current = 1
    setMessage('あたらしいAIペットが生まれた！')
  }, [])

  const expNeed = expForLevel(state.level)
  const expPct = Math.min(100, Math.round((state.exp / expNeed) * 100))

  return (
    <div className="mx-auto w-full max-w-md">
      {/* ヘッダー */}
      <header className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Sparkles className="size-5" aria-hidden="true" />
          </span>
          <h1 className="text-xl font-extrabold tracking-tight text-foreground">AIっち</h1>
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-sm font-bold text-muted-foreground shadow-sm transition-colors hover:text-foreground"
        >
          <RotateCcw className="size-4" aria-hidden="true" />
          リセット
        </button>
      </header>

      <div className="rounded-3xl border border-border bg-card/60 p-4 shadow-lg backdrop-blur sm:p-6">
        {/* レベル & EXP */}
        <div className="mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1.5 rounded-full bg-chart-4 px-3 py-1 text-sm font-extrabold text-white shadow-sm">
            <Star className="size-4 fill-current" aria-hidden="true" />
            Lv.{state.level}
          </span>
          <span className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-sm font-bold text-secondary-foreground shadow-sm">
            <BookOpen className="size-4" aria-hidden="true" />
            IQ {state.intelligence}
          </span>
        </div>
        <div className="mb-4">
          <div className="mb-1 flex justify-between text-xs font-semibold text-muted-foreground">
            <span>つぎのレベルまで</span>
            <span>
              {state.exp} / {expNeed} EXP
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-chart-5 transition-all duration-500"
              style={{ width: `${expPct}%` }}
            />
          </div>
        </div>

        {/* キャラクター */}
        <div className="relative rounded-2xl bg-gradient-to-b from-accent/30 to-secondary/20 p-2">
          {levelUpFlash && (
            <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
              <span className="animate-[pop_0.5s_ease] rounded-2xl bg-primary px-6 py-3 text-2xl font-black text-primary-foreground shadow-xl">
                LEVEL UP!
              </span>
            </div>
          )}
          <CreatureDisplay state={state} floating={floating} bounceKey={bounceKey} />
        </div>

        {/* メッセージ */}
        <div className="my-4 flex min-h-11 items-center justify-center rounded-2xl bg-muted px-4 py-2 text-center text-sm font-bold text-foreground">
          {message}
        </div>

        {/* ステータス */}
        <div className="mb-5 flex flex-col gap-3">
          <StatBar icon={Cookie} label="おなか" value={state.fullness} colorClass="bg-primary" />
          <StatBar icon={Gamepad2} label="きげん" value={state.happiness} colorClass="bg-chart-5" />
          <StatBar icon={Sparkles} label="げんき" value={state.energy} colorClass="bg-chart-4" />
        </div>

        {/* アクション */}
        <ActionBar onAction={handleAction} isSleeping={state.isSleeping} />
      </div>

      <p className="mt-4 text-center text-xs font-medium text-muted-foreground text-balance">
        ごはん・あそび・べんきょうでお世話しよう。時間がたつとステータスは減っていくよ。Lv.3とLv.7で進化！
      </p>
    </div>
  )
}
