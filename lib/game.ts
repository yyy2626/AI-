// ===== 種類（species）=====
export type Species = 'denki' | 'mofu' | 'aqua'

export type SpeciesInfo = {
  id: Species
  name: string
  emojiFree: string
  personality: string
  images: [string, string, string]
  theme: string
}

export const SPECIES: Record<Species, SpeciesInfo> = {
  denki: {
    id: 'denki',
    name: 'でんきち',
    emojiFree: 'でんき',
    personality: '元気いっぱいで好奇心おうせい。ちょっとおっちょこちょいだけど、いつも前向きな電気タイプのAIペット。語尾に「ビリ！」をつけて話すことがある。',
    images: ['/pet-stage-0.png', '/pet-stage-1.png', '/pet-stage-2.png'],
    theme: 'oklch(0.86 0.16 90)',
  },
  mofu: {
    id: 'mofu',
    name: 'もふりん',
    emojiFree: 'もふ',
    personality: 'おっとりやさしい甘えんぼう。もふもふで、なでられるのが大好き。のんびりした口調で話す、ふわふわタイプのAIペット。',
    images: ['/pet-mofu-0.png', '/pet-mofu-1.png', '/pet-mofu-2.png'],
    theme: 'oklch(0.8 0.12 10)',
  },
  aqua: {
    id: 'aqua',
    name: 'あくあ',
    emojiFree: 'あくあ',
    personality: 'かしこくてクール、でも根はさみしがりや。水のように落ち着いた話し方をする、みずタイプのAIペット。',
    images: ['/pet-aqua-0.png', '/pet-aqua-1.png', '/pet-aqua-2.png'],
    theme: 'oklch(0.78 0.13 210)',
  },
}

// ===== 着せ替えアイテム =====
export type AccessoryId = 'hat' | 'glasses' | 'crown' | 'ribbon'

export type AccessoryInfo = {
  id: AccessoryId
  name: string
  image: string
  price: number
  // キャラ円の中心を基準にした配置（%）
  position: { top: string; left: string; width: string; rotate?: string }
}

export const ACCESSORIES: Record<AccessoryId, AccessoryInfo> = {
  hat: {
    id: 'hat',
    name: 'パーティぼうし',
    image: '/acc-hat.png',
    price: 30,
    position: { top: '-14%', left: '50%', width: '46%' },
  },
  ribbon: {
    id: 'ribbon',
    name: 'ピンクリボン',
    image: '/acc-ribbon.png',
    price: 20,
    position: { top: '2%', left: '72%', width: '34%' },
  },
  glasses: {
    id: 'glasses',
    name: 'まるメガネ',
    image: '/acc-glasses.png',
    price: 40,
    position: { top: '34%', left: '50%', width: '54%' },
  },
  crown: {
    id: 'crown',
    name: 'おうかん',
    image: '/acc-crown.png',
    price: 80,
    position: { top: '-10%', left: '50%', width: '44%' },
  },
}

export const ACCESSORY_LIST = Object.values(ACCESSORIES)

// ===== ペット状態 =====
export type GameState = {
  id: string
  name: string
  species: Species
  level: number
  exp: number
  fullness: number
  happiness: number
  energy: number
  cleanliness: number
  affection: number
  intelligence: number
  equipped: AccessoryId[]
  bornAt: number
  lastTick: number
  isSleeping: boolean
}

export type SaveData = {
  pets: GameState[]
  activeId: string
  coins: number
  owned: AccessoryId[]
}

export const MAX_STAT = 100

const DECAY_PER_SEC = {
  fullness: 0.06,
  happiness: 0.045,
  energy: 0.035,
  cleanliness: 0.04,
}

const SLEEP_ENERGY_RECOVER_PER_SEC = 0.9
const SLEEP_DECAY_MULTIPLIER = 0.35

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

export function createPet(species: Species = 'denki', name?: string): GameState {
  const now = Date.now()
  return {
    id: uid(),
    name: name || SPECIES[species].name,
    species,
    level: 1,
    exp: 0,
    fullness: 70,
    happiness: 70,
    energy: 80,
    cleanliness: 80,
    affection: 10,
    intelligence: 0,
    equipped: [],
    bornAt: now,
    lastTick: now,
    isSleeping: false,
  }
}

export function createInitialSave(): SaveData {
  const first = createPet('denki')
  return { pets: [first], activeId: first.id, coins: 20, owned: [] }
}

const clamp = (v: number) => Math.max(0, Math.min(MAX_STAT, v))

export function expForLevel(level: number): number {
  return 20 + (level - 1) * 15
}

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
    cleanliness: clamp(state.cleanliness - DECAY_PER_SEC.cleanliness * elapsedSec * mult),
    energy,
    lastTick: now,
  }

  if (next.isSleeping && next.energy >= MAX_STAT) {
    next.isSleeping = false
  }
  return next
}

function gainExp(state: GameState, amount: number): GameState {
  let exp = state.exp + amount
  let level = state.level
  while (exp >= expForLevel(level)) {
    exp -= expForLevel(level)
    level += 1
  }
  return { ...state, exp, level }
}

export type ActionId = 'feed' | 'play' | 'study' | 'sleep' | 'pet' | 'clean'

export type ActionEffect = 'happy' | 'eat' | 'study' | 'sleep' | 'love' | 'clean' | 'fail'

export type ActionResult = {
  state: GameState
  message: string
  ok: boolean
  effect: ActionEffect
  coins: number
}

export function performAction(state: GameState, action: ActionId): ActionResult {
  const s = applyDecay(state)

  if (s.isSleeping && action !== 'sleep') {
    return { state: s, message: `${s.name}はぐっすり眠っているよ…`, ok: false, effect: 'fail', coins: 0 }
  }

  switch (action) {
    case 'feed': {
      if (s.fullness >= MAX_STAT - 1) {
        return { state: s, message: 'おなかいっぱいみたい！', ok: false, effect: 'fail', coins: 0 }
      }
      let next = { ...s, fullness: clamp(s.fullness + 25), happiness: clamp(s.happiness + 5) }
      next = gainExp(next, 4)
      return { state: next, message: 'もぐもぐ…おいしい！', ok: true, effect: 'eat', coins: 1 }
    }
    case 'play': {
      if (s.energy < 15) {
        return { state: s, message: 'つかれていて遊べないみたい…', ok: false, effect: 'fail', coins: 0 }
      }
      let next = {
        ...s,
        happiness: clamp(s.happiness + 22),
        energy: clamp(s.energy - 15),
        fullness: clamp(s.fullness - 8),
        affection: clamp(s.affection + 3),
      }
      next = gainExp(next, 8)
      return { state: next, message: 'たのしい！もっと遊ぼう！', ok: true, effect: 'happy', coins: 2 }
    }
    case 'study': {
      if (s.energy < 20) {
        return { state: s, message: '眠くて集中できないよ…', ok: false, effect: 'fail', coins: 0 }
      }
      if (s.fullness < 15) {
        return { state: s, message: 'おなかがすいて勉強できない…', ok: false, effect: 'fail', coins: 0 }
      }
      let next = {
        ...s,
        intelligence: s.intelligence + 6,
        energy: clamp(s.energy - 18),
        fullness: clamp(s.fullness - 10),
        happiness: clamp(s.happiness - 4),
      }
      next = gainExp(next, 14)
      return { state: next, message: 'かしこくなった！AIレベルアップ！', ok: true, effect: 'study', coins: 3 }
    }
    case 'clean': {
      if (s.cleanliness >= MAX_STAT - 1) {
        return { state: s, message: 'ぴかぴかだよ！', ok: false, effect: 'fail', coins: 0 }
      }
      let next = { ...s, cleanliness: clamp(s.cleanliness + 30), happiness: clamp(s.happiness + 4) }
      next = gainExp(next, 5)
      return { state: next, message: 'さっぱり！きれいになった♪', ok: true, effect: 'clean', coins: 1 }
    }
    case 'sleep': {
      const next = { ...s, isSleeping: !s.isSleeping }
      return {
        state: next,
        message: next.isSleeping ? 'おやすみzzz…' : 'ぱっちり！目が覚めた！',
        ok: true,
        effect: 'sleep',
        coins: 0,
      }
    }
    case 'pet': {
      let next = { ...s, happiness: clamp(s.happiness + 12), affection: clamp(s.affection + 4) }
      next = gainExp(next, 3)
      return { state: next, message: 'なでなで…うれしいな♪', ok: true, effect: 'love', coins: 0 }
    }
    default:
      return { state: s, message: '', ok: false, effect: 'fail', coins: 0 }
  }
}

export type Stage = { index: 0 | 1 | 2; label: string; image: string }

export function getStage(state: GameState): Stage {
  const imgs = SPECIES[state.species].images
  if (state.level >= 7) return { index: 2, label: 'エボリューション', image: imgs[2] }
  if (state.level >= 3) return { index: 1, label: 'ベビー', image: imgs[1] }
  return { index: 0, label: 'たまご', image: imgs[0] }
}

export type Mood = 'happy' | 'normal' | 'sad' | 'sleepy' | 'hungry' | 'dirty'

export function getMood(state: GameState): Mood {
  if (state.isSleeping) return 'sleepy'
  if (state.fullness < 25) return 'hungry'
  if (state.cleanliness < 25) return 'dirty'
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
  dirty: 'よごれちゃった…',
}

export function getActivePet(save: SaveData): GameState {
  return save.pets.find((p) => p.id === save.activeId) ?? save.pets[0]
}
