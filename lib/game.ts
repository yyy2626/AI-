export type GameState = {
  name: string
  level: number
  exp: number
  fullness: number
  happiness: number
  energy: number
  intelligence: number
  bornAt: number
  lastTick: number
  isSleeping: boolean
}

export const MAX_STAT = 100

// 1秒あたりのステータス減少量
const DECAY_PER_SEC = {
  fullness: 0.06,
  happiness: 0.045,
  energy: 0.035,
}

// 睡眠中: エネルギー回復、他はゆっくり減少
const SLEEP_ENERGY_RECOVER_PER_SEC = 0.9
const SLEEP_DECAY_MULTIPLIER = 0.35

export function createInitialState(name = 'AIっち'): GameState {
  const now = Date.now()
  return {
    name,
    level: 1,
    exp: 0,
    fullness: 70,
    happiness: 70,
    energy: 80,
    intelligence: 0,
    bornAt: now,
    lastTick: now,
    isSleeping: false,
  }
}

const clamp = (v: number) => Math.max(0, Math.min(MAX_STAT, v))

export function expForLevel(level: number): number {
  return 20 + (level - 1) * 15
}

/** 経過時間に応じてステータスを減衰させる（オフライン中も適用） */
export function applyDecay(state: GameState, now = Date.now()): GameState {
  const elapsedSec = Math.max(0, (now - state.lastTick) / 1000)
  if (elapsedSec === 0) return state

  const mult = state.isSleeping ? SLEEP_DECAY_MULTIPLIER : 1

  let energy = state.energy
  if (state.isSleeping) {
    energy = clamp(state.energy + SLEEP_ENERGY_RECOVER_PER_SEC * elapsedSec)
  } else {
    energy = clamp(state.energy - DECAY_PER_SEC.energy * elapsedSec)
  }

  const next: GameState = {
    ...state,
    fullness: clamp(state.fullness - DECAY_PER_SEC.fullness * elapsedSec * mult),
    happiness: clamp(state.happiness - DECAY_PER_SEC.happiness * elapsedSec * mult),
    energy,
    lastTick: now,
  }

  // 睡眠中でエネルギー満タンになったら自然に起きる
  if (next.isSleeping && next.energy >= MAX_STAT) {
    next.isSleeping = false
  }
  return next
}

/** EXPを加算し、必要ならレベルアップ */
function gainExp(state: GameState, amount: number): GameState {
  let exp = state.exp + amount
  let level = state.level
  while (exp >= expForLevel(level)) {
    exp -= expForLevel(level)
    level += 1
  }
  return { ...state, exp, level }
}

export type ActionId = 'feed' | 'play' | 'study' | 'sleep' | 'pet'

export type ActionResult = {
  state: GameState
  message: string
  ok: boolean
  effect: 'happy' | 'eat' | 'study' | 'sleep' | 'love' | 'fail'
}

/** アクションを実行して新しい状態とメッセージを返す */
export function performAction(state: GameState, action: ActionId): ActionResult {
  const s = applyDecay(state)

  // 睡眠中は起こすだけ
  if (s.isSleeping && action !== 'sleep') {
    return {
      state: s,
      message: `${s.name}はぐっすり眠っているよ…`,
      ok: false,
      effect: 'fail',
    }
  }

  switch (action) {
    case 'feed': {
      if (s.fullness >= MAX_STAT - 1) {
        return { state: s, message: 'おなかいっぱいみたい！', ok: false, effect: 'fail' }
      }
      let next = { ...s, fullness: clamp(s.fullness + 25), happiness: clamp(s.happiness + 5) }
      next = gainExp(next, 4)
      return { state: next, message: 'もぐもぐ…おいしい！', ok: true, effect: 'eat' }
    }
    case 'play': {
      if (s.energy < 15) {
        return { state: s, message: 'つかれていて遊べないみたい…', ok: false, effect: 'fail' }
      }
      let next = {
        ...s,
        happiness: clamp(s.happiness + 22),
        energy: clamp(s.energy - 15),
        fullness: clamp(s.fullness - 8),
      }
      next = gainExp(next, 8)
      return { state: next, message: 'たのしい！もっと遊ぼう！', ok: true, effect: 'happy' }
    }
    case 'study': {
      if (s.energy < 20) {
        return { state: s, message: '眠くて集中できないよ…', ok: false, effect: 'fail' }
      }
      if (s.fullness < 15) {
        return { state: s, message: 'おなかがすいて勉強できない…', ok: false, effect: 'fail' }
      }
      let next = {
        ...s,
        intelligence: s.intelligence + 6,
        energy: clamp(s.energy - 18),
        fullness: clamp(s.fullness - 10),
        happiness: clamp(s.happiness - 4),
      }
      next = gainExp(next, 14)
      return { state: next, message: 'かしこくなった！AIレベルアップ！', ok: true, effect: 'study' }
    }
    case 'sleep': {
      const next = { ...s, isSleeping: !s.isSleeping }
      return {
        state: next,
        message: next.isSleeping ? 'おやすみzzz…' : 'ぱっちり！目が覚めた！',
        ok: true,
        effect: 'sleep',
      }
    }
    case 'pet': {
      let next = { ...s, happiness: clamp(s.happiness + 12) }
      next = gainExp(next, 3)
      return { state: next, message: 'なでなで…うれしいな♪', ok: true, effect: 'love' }
    }
    default:
      return { state: s, message: '', ok: false, effect: 'fail' }
  }
}

export type Stage = { index: 0 | 1 | 2; label: string; image: string }

export function getStage(state: GameState): Stage {
  if (state.level >= 7) return { index: 2, label: 'エボリューション', image: '/pet-stage-2.png' }
  if (state.level >= 3) return { index: 1, label: 'ベビー', image: '/pet-stage-1.png' }
  return { index: 0, label: 'たまご', image: '/pet-stage-0.png' }
}

export type Mood = 'happy' | 'normal' | 'sad' | 'sleepy' | 'hungry'

export function getMood(state: GameState): Mood {
  if (state.isSleeping) return 'sleepy'
  if (state.fullness < 25) return 'hungry'
  if (state.energy < 20) return 'sleepy'
  if (state.happiness < 25) return 'sad'
  if (state.happiness > 70 && state.fullness > 50) return 'happy'
  return 'normal'
}

export const moodText: Record<Mood, string> = {
  happy: 'ごきげん！',
  normal: 'ふつう',
  sad: 'さみしいよ…',
  sleepy: 'ねむい…',
  hungry: 'おなかすいた…',
}
