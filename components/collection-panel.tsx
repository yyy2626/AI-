'use client'

import { type GameState, type Species, SPECIES, getStage } from '@/lib/game'
import { Coins, Check, Egg, Star } from 'lucide-react'

const HATCH_COST = 50

type CollectionPanelProps = {
  pets: GameState[]
  activeId: string
  coins: number
  onSelect: (id: string) => void
  onHatch: (species: Species) => void
}

export function CollectionPanel({ pets, activeId, coins, onSelect, onHatch }: CollectionPanelProps) {
  const canHatch = coins >= HATCH_COST

  return (
    <div className="flex flex-col gap-4">
      {/* 手持ちのなかま */}
      <div className="rounded-3xl border border-border bg-card/70 p-4 shadow-lg backdrop-blur">
        <h3 className="mb-3 text-lg font-extrabold text-foreground">なかま ({pets.length})</h3>
        <div className="grid grid-cols-2 gap-3">
          {pets.map((pet) => {
            const stage = getStage(pet)
            const isActive = pet.id === activeId
            return (
              <button
                key={pet.id}
                type="button"
                onClick={() => onSelect(pet.id)}
                className={`relative flex flex-col items-center gap-1.5 rounded-2xl border-2 bg-card p-3 shadow-sm transition-all active:scale-95 ${
                  isActive ? 'border-primary' : 'border-transparent hover:border-border'
                }`}
              >
                {isActive && (
                  <span className="absolute right-2 top-2 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
                    <Check className="size-4" aria-hidden="true" />
                  </span>
                )}
                <div
                  className="size-16 overflow-hidden rounded-full"
                  style={{ backgroundColor: 'oklch(0.96 0.045 95)' }}
                >
                  <img src={stage.image || '/placeholder.svg'} alt={pet.name} className="size-full object-cover" />
                </div>
                <span className="text-sm font-bold text-foreground">{pet.name}</span>
                <span className="flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                  <Star className="size-3 fill-current text-chart-4" aria-hidden="true" />
                  Lv.{pet.level} ・ {stage.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 新しいたまごをかえす */}
      <div className="rounded-3xl border border-border bg-card/70 p-4 shadow-lg backdrop-blur">
        <div className="mb-1 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-lg font-extrabold text-foreground">
            <Egg className="size-5 text-chart-5" aria-hidden="true" />
            あたらしいたまご
          </h3>
          <span className="flex items-center gap-1.5 rounded-full bg-chart-4 px-3 py-1 text-sm font-extrabold text-white shadow-sm">
            <Coins className="size-4" aria-hidden="true" />
            {coins}
          </span>
        </div>
        <p className="mb-3 text-xs font-medium text-muted-foreground">
          1匹 {HATCH_COST} コインで、すきな種類のなかまを増やせるよ。
        </p>
        <div className="grid grid-cols-3 gap-3">
          {Object.values(SPECIES).map((sp) => (
            <div
              key={sp.id}
              className="flex flex-col items-center gap-2 rounded-2xl border-2 border-transparent bg-card p-3 shadow-sm"
            >
              <div
                className="size-16 overflow-hidden rounded-full"
                style={{ backgroundColor: 'oklch(0.96 0.045 95)' }}
              >
                <img src={sp.images[1] || '/placeholder.svg'} alt={sp.name} className="size-full object-cover" />
              </div>
              <span className="text-sm font-bold text-foreground">{sp.name}</span>
              <button
                type="button"
                onClick={() => onHatch(sp.id)}
                disabled={!canHatch}
                className="flex w-full items-center justify-center gap-1 rounded-full bg-primary px-2 py-1.5 text-xs font-extrabold text-primary-foreground shadow-sm transition-transform active:scale-95 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
              >
                <Coins className="size-3.5" aria-hidden="true" />
                {HATCH_COST}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
