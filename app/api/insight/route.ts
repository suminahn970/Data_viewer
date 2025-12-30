// app/api/insight/route.ts
// 서버 사이드에서 AI 인사이트 생성 (API 키 보안 처리)
import { NextResponse } from 'next/server';
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

// OpenAI 클라이언트 (서버 사이드만)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Gemini 클라이언트 (서버 사이드만)
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenerativeAI(apiKey);
};

export async function POST(req: Request) {
  try {
    const { headers, rows, provider = 'openai' } = await req.json();

    if (!headers || !Array.isArray(headers) || !rows || !Array.isArray(rows)) {
      return NextResponse.json(
        { error: '유효하지 않은 요청 데이터입니다.' },
        { status: 400 }
      );
    }

    // 데이터 샘플 추출 (최대 5행)
    const dataSample = rows.slice(0, 5)
      .map(row => (Array.isArray(row) ? row.join(" | ") : Object.values(row).join(" | ")))
      .join("\n");

    let insight = "";

    if (provider === 'gemini') {
      const genAI = getGeminiClient();
      if (!genAI) {
        return NextResponse.json(
          { error: 'Gemini API 키가 설정되지 않았습니다.' },
          { status: 500 }
        );
      }

      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        generationConfig: {
          temperature: 0.7,
          topP: 0.95,
          topK: 40,
        }
      });
      
      const prompt = `너는 한국인 자산관리 전문가야. 모든 분석은 반드시 한국어로 작성하고, 배롱배롱 대표님이 바로 이해할 수 있게 전문적이면서도 쉽게 설명해줘. 다음 데이터의 핵심 특징 1가지를 한글로 50자 이내 요약해줘: ${dataSample}`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      insight = response.text().trim() || "분석 완료";
    } else {
      // OpenAI (기본값)
      if (!process.env.OPENAI_API_KEY) {
        return NextResponse.json(
          { error: 'OpenAI API 키가 설정되지 않았습니다.' },
          { status: 500 }
        );
      }

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "너는 데이터 분석가야. 한글 50자 이내로 요약해줘." },
          { role: "user", content: `데이터: ${dataSample}` }
        ],
      });

      insight = completion.choices[0].message.content || "분석 완료";
    }

    return NextResponse.json({ insight });
  } catch (error: unknown) {
    console.error("AI 인사이트 생성 에러:", error);
    const errorMessage = error instanceof Error ? error.message : "알 수 없는 오류";
    
    // 프로덕션에서는 상세 에러 정보를 숨김
    return NextResponse.json(
      { error: "데이터 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요." },
      { status: 500 }
    );
  }
}
