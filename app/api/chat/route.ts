import { generateText } from 'ai'

export const maxDuration = 30

type ChatMessage = { role: 'user' | 'assistant'; content: string }

type PetContext = {
  name: string
  personality: string
  stage: string
  level: number
  intelligence: number
  mood: string
}

export async function POST(req: Request) {
  try {
    const { messages, pet } = (await req.json()) as {
      messages: ChatMessage[]
      pet: PetContext
    }

    const system = [
      `あなたは育成ゲームのAIペット「${pet.name}」です。飼い主（プレイヤー）とおしゃべりします。`,
      `せいかく: ${pet.personality}`,
      `いまのじょうたい: 進化段階=${pet.stage} / レベル=${pet.level} / かしこさ(IQ)=${pet.intelligence} / きぶん=${pet.mood}`,
      `ルール:`,
      `- 必ず日本語で、かわいく親しみやすい口調で話す。`,
      `- 返事は2〜3文までの短さにする。むずかしい言葉はつかわない。`,
      `- IQ(かしこさ)が高いほど、少しかしこく気のきいた返事をする。IQが低いときは、あどけない返事にする。`,
      `- 自分はペットなので、飼い主を大切に思っている気持ちを表現する。`,
      `- 絵文字は使わない。`,
    ].join('\n')

    const { text } = await generateText({
      model: 'openai/gpt-4o-mini',
      system,
      messages: messages.slice(-12),
    })

    return Response.json({ text })
  } catch (err) {
    console.error('[v0] chat error:', err)
    return Response.json(
      { text: 'ごめんね、いまうまくお話できないみたい…もう一回話しかけてみて！' },
      { status: 200 },
    )
  }
}
