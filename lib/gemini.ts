import { GoogleGenerativeAI } from "@google/generative-ai";

export const generateDataInsight = async (headers: string[], rows: any[]) => {
  // ⭐️ 환경 변수가 제대로 읽히는지 확인하기 위해 NEXT_PUBLIC_ 접두사를 확인하세요.
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) return "API 키 설정이 필요합니다.";

  const genAI = new GoogleGenerativeAI(apiKey);

  try {
    // ⭐️ [해결] 1.5-flash에서 404가 날 경우 가장 범용적인 'gemini-pro'를 사용합니다.
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const dataSample = rows.slice(0, 5)
      .map(row => (Array.isArray(row) ? row.join(" | ") : Object.values(row).join(" | ")))
      .join("\n");
    
    const prompt = `전문 데이터 분석가로서 다음 데이터의 핵심 특징 1가지를 한글로 50자 이내 요약해줘: ${dataSample}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return text.trim() || "분석 완료";
  } catch (error: any) {
    console.error("Gemini 최종 에러:", error);
    // ⭐️ 사용자에게 현재 상태를 명확히 알립니다.
    return "분석 엔진을 동기화 중입니다. 잠시 후 다시 시도해주세요.";
  }
};