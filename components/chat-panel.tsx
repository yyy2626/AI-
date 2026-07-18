'use client'

import { useEffect, useRef, useState } from 'react'
import { Send, MessageCircle } from 'lucide-react'
import { type GameState, SPECIES, getStage, getMood, moodText } from '@/lib/game'

type Msg = { role: 'user' | 'assistant'; content: string }

type ChatPanelProps = {
  pet: GameState
}

export function ChatPanel({ pet }: ChatPanelProps) {
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // ペットが切り替わったら会話をリセット
  useEffect(() => {
    setMessages([{ role: 'assistant', content: `やあ！ぼく${pet.name}だよ。なにかお話ししよう！` }])
  }, [pet.id, pet.name])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading])

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return
    const next: Msg[] = [...messages, { role: 'user', content: text }]
    setMessages(next)
    setInput('')
    setLoading(true)
    try {
      const stage = getStage(pet)
      const mood = getMood(pet)
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: next,
          pet: {
            name: pet.name,
            personality: SPECIES[pet.species].personality,
            stage: stage.label,
            level: pet.level,
            intelligence: pet.intelligence,
            mood: moodText[mood],
          },
        }),
      })
      const data = (await res.json()) as { text: string }
      setMessages((m) => [...m, { role: 'assistant', content: data.text }])
    } catch {
      setMessages((m) => [
        ...m,
        { role: 'assistant', content: 'ごめんね、いまお話できないみたい…' },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.nativeEvent.isComposing && e.keyCode !== 229) {
      e.preventDefault()
      void send()
    }
  }

  const stage = getStage(pet)

  return (
    <div className="flex h-[28rem] flex-col rounded-3xl border border-border bg-card/70 shadow-lg backdrop-blur">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <span className="flex size-9 items-center justify-center overflow-hidden rounded-full" style={{ backgroundColor: 'oklch(0.96 0.045 95)' }}>
          <img src={stage.image || '/placeholder.svg'} alt="" aria-hidden="true" className="size-full object-cover" />
        </span>
        <div className="flex flex-col">
          <span className="flex items-center gap-1.5 text-sm font-extrabold text-foreground">
            <MessageCircle className="size-4 text-primary" aria-hidden="true" />
            {pet.name}とおしゃべり
          </span>
          <span className="text-xs font-medium text-muted-foreground">IQ {pet.intelligence} ・ {stage.label}</span>
        </div>
      </div>

      <div ref={scrollRef} className="flex flex-1 flex-col gap-2.5 overflow-y-auto p-4">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex animate-[slideUp_0.3s_ease] ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <span
              className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm font-medium leading-relaxed shadow-sm ${
                m.role === 'user'
                  ? 'rounded-br-sm bg-primary text-primary-foreground'
                  : 'rounded-bl-sm bg-muted text-foreground'
              }`}
            >
              {m.content}
            </span>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <span className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-muted px-4 py-3 shadow-sm">
              <span className="size-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
              <span className="size-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
              <span className="size-2 animate-bounce rounded-full bg-muted-foreground" />
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 border-t border-border p-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="メッセージを入力…"
          className="flex-1 rounded-full border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground outline-none transition-colors focus:border-primary"
          aria-label="メッセージ"
        />
        <button
          type="button"
          onClick={send}
          disabled={loading || !input.trim()}
          className="flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition-transform active:scale-90 disabled:opacity-40"
          aria-label="送信"
        >
          <Send className="size-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
