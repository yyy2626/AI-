'use client'

import { ACCESSORY_LIST, type AccessoryId } from '@/lib/game'
import { Coins, Check, Lock } from 'lucide-react'

type ShopPanelProps = {
  coins: number
  owned: AccessoryId[]
  equipped: AccessoryId[]
  onBuy: (id: AccessoryId) => void
  onToggleEquip: (id: AccessoryId) => void
}

export function ShopPanel({ coins, owned, equipped, onBuy, onToggleEquip }: ShopPanelProps) {
  return (
    <div className="rounded-3xl border border-border bg-card/70 p-4 shadow-lg backdrop-blur">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-extrabold text-foreground">きせかえショップ</h3>
        <span className="flex items-center gap-1.5 rounded-full bg-chart-4 px-3 py-1 text-sm font-extrabold text-white shadow-sm">
          <Coins className="size-4" aria-hidden="true" />
          {coins}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {ACCESSORY_LIST.map((acc) => {
          const isOwned = owned.includes(acc.id)
          const isEquipped = equipped.includes(acc.id)
          const canBuy = coins >= acc.price
          return (
            <div
              key={acc.id}
              className={`flex flex-col items-center gap-2 rounded-2xl border-2 bg-card p-3 shadow-sm transition-colors ${
                isEquipped ? 'border-primary' : 'border-transparent'
              }`}
            >
              <div className="flex h-20 w-full items-center justify-center rounded-xl bg-muted p-2">
                <img
                  src={acc.image || '/placeholder.svg'}
                  alt={acc.name}
                  className="max-h-16 w-auto object-contain drop-shadow-sm"
                />
              </div>
              <span className="text-sm font-bold text-foreground">{acc.name}</span>

              {isOwned ? (
                <button
                  type="button"
                  onClick={() => onToggleEquip(acc.id)}
                  className={`flex w-full items-center justify-center gap-1.5 rounded-full px-3 py-2 text-sm font-bold shadow-sm transition-transform active:scale-95 ${
                    isEquipped
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground'
                  }`}
                >
                  {isEquipped ? (
                    <>
                      <Check className="size-4" aria-hidden="true" />
                      きてる
                    </>
                  ) : (
                    'きせる'
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onBuy(acc.id)}
                  disabled={!canBuy}
                  className="flex w-full items-center justify-center gap-1.5 rounded-full bg-chart-4 px-3 py-2 text-sm font-extrabold text-white shadow-sm transition-transform active:scale-95 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
                >
                  {canBuy ? (
                    <>
                      <Coins className="size-4" aria-hidden="true" />
                      {acc.price}
                    </>
                  ) : (
                    <>
                      <Lock className="size-4" aria-hidden="true" />
                      {acc.price}
                    </>
                  )}
                </button>
              )}
            </div>
          )
        })}
      </div>

      <p className="mt-4 text-center text-xs font-medium text-muted-foreground text-balance">
        コインはお世話やミニゲームでゲットできるよ。きせかえは今のAIっちに反映されるよ。
      </p>
    </div>
  )
}
