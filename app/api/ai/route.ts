import { NextRequest, NextResponse } from 'next/server'
import { anthropic } from '@/lib/claude'

// Wire client-specific AI feature here (chatbot, matcher, recommendation engine, etc.)
// The `anthropic` client is imported and ready to use.

export async function POST(_req: NextRequest) {
  // TODO: implement client-specific AI logic here
  // Example:
  //   const { message } = await req.json()
  //   const response = await anthropic.messages.create({
  //     model: 'claude-opus-4-6',
  //     max_tokens: 1024,
  //     messages: [{ role: 'user', content: message }],
  //   })
  //   return NextResponse.json({ reply: response.content[0] })

  // Silence unused import warning during development
  void anthropic

  return NextResponse.json({ message: 'AI route ready' })
}
