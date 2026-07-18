'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Cookie,
  Gamepad2,
  BookOpen,
  Sparkles,
  Star,
  Coins,
  Home,
  Trophy,
  Shirt,
  Users,
  MessageCircle,
  Heart,
} from 'lucide-react'
import {
  type ActionId,
  type ActionEffect,
  type SaveData,
  type Species,
  type AccessoryId,
  ACCESSORIES,
  applyDecay,
  createInitialSave,
  createPet,
  expForLevel,
  getActivePet,
  performAction,
} from '@/lib/game'
import { StatBar } from '@/components/stat-bar'
import { CreatureDisplay } from '@/components/creature-display'
import { ActionBar } from '@/components/action-bar'
import { MiniGame } from '@/components/mini-game'
import { ShopPanel } from '@/components/shop-panel'
import { CollectionPanel } from '@/components/collection-panel'
import { ChatPanel } from '@/components/chat-panel'

const SAVE_KEY = 'ai-pet-save-v2'
const HATCH_COST = 50

type Tab = 'home' | 'game' | 'shop' | 'friends' | 'talk'
type FloatingText = { id: number; text: string; kind: string }

function loadSave(): SaveData {
  if (typeof window === 'undefined') return createInitialSave()
  try {
    const raw = window.localStorage.getItem(SAVE_KEY)
    if (!raw) return createInitialSave()
    const parsed = JSON.parse(raw) as SaveData
    if (!parsed.pets?.length) return createInitialSave()
    parsed.pets = parsed.pets.map((p) => applyDecay(p))
    return parsed
  } catch {
    return createInitialSave()
  }
}

const TABS: { id: Tab; label: string; icon: typeof Home }[] = [
  { id: 'home', label: 'おせわ', icon: Home },
  { id: 'game', label: 'ゲーム', icon: Trophy },
  { id: 'shop', label: 'きせかえ', icon: Shirt },
  { id: 'friends', label: 'なかま', icon: Users },
  { id: 'talk', label: 'トーク', icon: MessageCircle },
]

export function PetGame() {
  const [save, setSave] = useState<SaveData>(() => createInitialSave())
  const [ready, setReady] = useState(false)
  const [tab, setTab] = useState<Tab>('home')
  const [floating, setFloating] = useState<FloatingText[]>([])
  const [message, setMessage] = useState('AIペットを育てよう！')
  const [bounceKey, setBounceKey] = useState(0)
  const [effect, setEffect] = useState<ActionEffect>('happy')
  const [levelUpFlash, setLevelUpFlash] = useState(false)
  const [coinGain, setCoinGain] = useState<{ id: number; amount: number } | null>(null)
  const floatId = useRef(0)
  const prevLevel = useRef(1)

  const pet = useMemo(() => getActivePet(save), [save])

  useEffect(() => {
    const loaded = loadSave()
    setSave(loaded)
    prevLevel.current = getActivePet(loaded).level
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready) return
    try {
      window.localStorage.setItem(SAVE_KEY, JSON.stringify(save))
    } catch {
      // ignore
    }
  }, [save, ready])

  // 時間経過（アクティブ以外もまとめて減衰）
  useEffect(() => {
    if (!ready) return
    const timer = setInterval(() => {
      setSave((s) => ({ ...s, pets: s.pets.map((p) => applyDecay(p)) }))
    }, 2000)
    return () => clearInterval(timer)
  }, [ready])

  useEffect(() => {
    if (pet.level > prevLevel.current) {
      setLevelUpFlash(true)
      const t = setTimeout(() => setLevelUpFlash(false), 1400)
      prevLevel.current = pet.level
      return () => clearTimeout(t)
    }
    prevLevel.current = pet.level
  }, [pet.level])

  const pushFloating = useCallback((text: string) => {
    const id = ++floatId.current
    setFloating((f) => [...f, { id, text, kind: 'msg' }])
    setTimeout(() => setFloating((f) => f.filter((x) => x.id !== id)), 1100)
  }, [])

  const showCoin = useCallback((amount: number) => {
    if (amount <= 0) return
    const id = Date.now()
    setCoinGain({ id, amount })
    setTimeout(() => setCoinGain((c) => (c?.id === id ? null : c)), 1200)
  }, [])

  const updateActive = useCallback((updater: (p: SaveData['pets'][number]) => SaveData['pets'][number]) => {
    setSave((s) => ({
      ...s,
      pets: s.pets.map((p) => (p.id === s.activeId ? updater(p) : p)),
    }))
  }, [])

  const handleAction = useCallback(
    (action: ActionId) => {
      const result = performAction(pet, action)
      setMessage(result.message)
      if (result.ok) {
        setEffect(result.effect)
        setBounceKey((k) => k + 1)
        pushFloating(result.message.slice(0, 12))
        showCoin(result.coins)
      } else {
        setEffect('fail')
      }
      setSave((s) => ({
        ...s,
        coins: s.coins + (result.ok ? result.coins : 0),
        pets: s.pets.map((p) => (p.id === s.activeId ? result.state : p)),
      }))
    },
    [pet, pushFloating, showCoin],
  )

  const handleMiniGameFinish = useCallback(
    ({ coins, happiness }: { coins: number; happiness: number; score: number }) => {
      setSave((s) => ({
        ...s,
        coins: s.coins + coins,
        pets: s.pets.map((p) =>
          p.id === s.activeId
            ? { ...p, happiness: Math.min(100, p.happiness + happiness) }
            : p,
        ),
      }))
    },
    [],
  )

  const handleBuy = useCallback((id: AccessoryId) => {
    setSave((s) => {
      if (s.owned.includes(id) || s.coins < ACCESSORIES[id].price) return s
      return { ...s, coins: s.coins - ACCESSORIES[id].price, owned: [...s.owned, id] }
    })
  }, [])

  const handleToggleEquip = useCallback((id: AccessoryId) => {
    updateActive((p) => {
      const has = p.equipped.includes(id)
      return { ...p, equipped: has ? p.equipped.filter((x) => x !== id) : [...p.equipped, id] }
    })
  }, [updateActive])

  const handleHatch = useCallback((species: Species) => {
    setSave((s) => {
      if (s.coins < HATCH_COST) return s
      const baby = createPet(species)
      return { ...s, coins: s.coins - HATCH_COST, pets: [...s.pets, baby], activeId: baby.id }
    })
    setTab('home')
    setMessage('あたらしいなかまが生まれた！')
  }, [])

  const handleSelectPet = useCallback((id: string) => {
    setSave((s) => ({ ...s, activeId: id }))
    setTab('home')
  }, [])

  const expNeed = expForLevel(pet.level)
  const expPct = Math.min(100, Math.round((pet.exp / expNeed) * 100))

  return (
    <div className="mx-auto w-full max-w-md">
      {/* ヘッダー */}
      <header className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm animate-[wiggle_3s_ease-in-out_infinite]">
            <Sparkles className="size-5" aria-hidden="true" />
          </span>
          <h1 className="text-xl font-extrabold tracking-tight text-foreground">AIっち</h1>
        </div>
        <div className="relative flex items-center gap-1.5 rounded-full bg-chart-4 px-3.5 py-1.5 text-sm font-extrabold text-white shadow-sm">
          <Coins className="size-4" aria-hidden="true" />
          {save.coins}
          {coinGain && (
            <span
              key={coinGain.id}
              className="pointer-events-none absolute -top-1 right-2 animate-[floatUp_1.2s_ease-out_forwards] text-sm font-black text-chart-4"
            >
              +{coinGain.amount}
            </span>
          )}
        </div>
      </header>

      {/* メインカード */}
      <div className="rounded-3xl border border-border bg-card/60 p-4 shadow-lg backdrop-blur sm:p-6">
        {tab === 'home' && (
          <div className="animate-[slideUp_0.3s_ease]">
            {/* レベル & IQ */}
            <div className="mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5 rounded-full bg-chart-4 px-3 py-1 text-sm font-extrabold text-white shadow-sm">
                <Star className="size-4 fill-current" aria-hidden="true" />
                Lv.{pet.level}
              </span>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 rounded-full bg-chart-5 px-3 py-1 text-sm font-bold text-white shadow-sm">
                  <Heart className="size-4 fill-current" aria-hidden="true" />
                  きずな {Math.round(pet.affection)}
                </span>
                <span className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-sm font-bold text-secondary-foreground shadow-sm">
                  <BookOpen className="size-4" aria-hidden="true" />
                  IQ {pet.intelligence}
                </span>
              </div>
            </div>

            {/* EXPバー */}
            <div className="mb-4">
              <div className="mb-1 flex justify-between text-xs font-semibold text-muted-foreground">
                <span>つぎのレベルまで</span>
                <span>
                  {pet.exp} / {expNeed} EXP
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
                <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center">
                  <span className="animate-[popIn_0.5s_ease] rounded-2xl bg-primary px-6 py-3 text-2xl font-black text-primary-foreground shadow-xl">
                    LEVEL UP!
                  </span>
                </div>
              )}
              <CreatureDisplay state={pet} floating={floating} bounceKey={bounceKey} effect={effect} />
            </div>

            {/* メッセージ */}
            <div className="my-4 flex min-h-11 items-center justify-center rounded-2xl bg-muted px-4 py-2 text-center text-sm font-bold text-foreground">
              {message}
            </div>

            {/* ステータス */}
            <div className="mb-5 flex flex-col gap-3">
              <StatBar icon={Cookie} label="おなか" value={pet.fullness} colorClass="bg-primary" />
              <StatBar icon={Gamepad2} label="きげん" value={pet.happiness} colorClass="bg-chart-5" />
              <StatBar icon={Sparkles} label="げんき" value={pet.energy} colorClass="bg-chart-4" />
              <StatBar icon={Sparkles} label="きれい" value={pet.cleanliness} colorClass="bg-chart-2" />
            </div>

            {/* アクション */}
            <ActionBar onAction={handleAction} isSleeping={pet.isSleeping} />
          </div>
        )}

        {tab === 'game' && (
          <div className="animate-[slideUp_0.3s_ease]">
            <MiniGame onFinish={handleMiniGameFinish} />
          </div>
        )}

        {tab === 'shop' && (
          <div className="animate-[slideUp_0.3s_ease]">
            <ShopPanel
              coins={save.coins}
              owned={save.owned}
              equipped={pet.equipped}
              onBuy={handleBuy}
              onToggleEquip={handleToggleEquip}
            />
          </div>
        )}

        {tab === 'friends' && (
          <div className="animate-[slideUp_0.3s_ease]">
            <CollectionPanel
              pets={save.pets}
              activeId={save.activeId}
              coins={save.coins}
              onSelect={handleSelectPet}
              onHatch={handleHatch}
            />
          </div>
        )}

        {tab === 'talk' && (
          <div className="animate-[slideUp_0.3s_ease]">
            <ChatPanel pet={pet} />
          </div>
        )}
      </div>

      {/* タブバー */}
      <nav className="mt-4 grid grid-cols-5 gap-1.5 rounded-3xl border border-border bg-card/70 p-2 shadow-lg backdrop-blur">
        {TABS.map((t) => {
          const active = tab === t.id
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex flex-col items-center gap-1 rounded-2xl py-2 text-xs font-bold transition-all active:scale-95 ${
                active
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-muted'
              }`}
              aria-current={active ? 'page' : undefined}
            >
              <t.icon className={`size-5 ${active ? 'animate-[popIn_0.3s_ease]' : ''}`} aria-hidden="true" />
              {t.label}
            </button>
          )
        })}
      </nav>
    </div>
  )
}
