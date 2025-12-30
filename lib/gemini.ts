// lib/gemini.ts
// 클라이언트 사이드에서 서버 API 호출 (API 키는 서버에서 관리)
import { generateDataInsight as generateInsight } from './gpt';

export const generateDataInsight = async (headers: string[], rows: any[]): Promise<string> => {
  // Gemini 제공자를 사용하여 서버 API 호출
  return generateInsight(headers, rows, 'gemini');
};