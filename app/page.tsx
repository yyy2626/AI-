import { PetGame } from '@/components/pet-game'
import { AnimatedBackground } from '@/components/animated-background'

export default function Page() {
  return (
    <main className="relative flex min-h-dvh items-center justify-center px-4 py-6">
      <AnimatedBackground />
      <PetGame />
    </main>
  )
}
