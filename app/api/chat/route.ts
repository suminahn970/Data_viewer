// app/api/chat/route.ts
import { NextResponse } from 'next/server';
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // ⭐️ 스크린샷 2.52.26에서 설정한 키를 읽어옵니다.
});

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "너는 데이터 분석가야. 한글 50자 이내로 요약해줘." },
        { role: "user", content: prompt }
      ],
    });

    return NextResponse.json({ result: completion.choices[0].message.content });
  } catch (error: any) {
    console.error("GPT 서버 에러:", error);
    return NextResponse.json({ error: "분석 실패" }, { status: 500 });
  }
}