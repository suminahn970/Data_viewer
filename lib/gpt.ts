// lib/gpt.ts
// 클라이언트 사이드에서 서버 API 호출 (API 키는 서버에서 관리)
export const generateDataInsight = async (
  headers: string[], 
  rows: any[],
  provider: 'openai' | 'gemini' = 'openai'
): Promise<string> => {
  try {
    const response = await fetch('/api/insight', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ headers, rows, provider }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || '서버 오류가 발생했습니다.');
    }

    const data = await response.json();
    return data.insight || "분석 완료";
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "알 수 없는 오류";
    console.error("AI 인사이트 생성 실패:", errorMessage);
    return "데이터를 정밀 분석 중입니다...";
  }
};