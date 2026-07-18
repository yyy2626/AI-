import type { LucideIcon } from 'lucide-react'

type StatBarProps = {
  icon: LucideIcon
  label: string
  value: number
  colorClass: string
}

export function StatBar({ icon: Icon, label, value, colorClass }: StatBarProps) {
  const pct = Math.round(value)
  const low = pct < 25
  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${colorClass} text-white shadow-sm`}
      >
        <Icon className="size-5" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center justify-between text-sm font-semibold">
          <span className="text-foreground">{label}</span>
          <span className={low ? 'text-destructive' : 'text-muted-foreground'}>{pct}%</span>
        </div>
        <div
          className="h-3 w-full overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={label}
        >
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${colorClass} ${
              low ? 'animate-pulse' : ''
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  )
}
