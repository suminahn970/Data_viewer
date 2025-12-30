import OpenAI from "openai";

// ⭐️ 키가 있는지 콘솔에서 직접 확인하는 로직 추가
const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;

const openai = new OpenAI({
  apiKey: apiKey || "", 
  dangerouslyAllowBrowser: true,
});

export const generateDataInsight = async (headers: string[], rows: any[]) => {
  if (!apiKey) {
    console.error("OpenAI API 키가 설정되지 않았습니다!");
    return "API 키를 확인해 주세요.";
  }

  try {
    const dataSample = rows.slice(0, 5).map(row => row.join(" | ")).join("\n");
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "너는 데이터 분석가야. 한글 50자 이내로 요약해줘." },
        { role: "user", content: `데이터: ${dataSample}` }
      ],
    });

    return completion.choices[0].message.content;
  } catch (error: any) {
    // ⭐️ 여기서 실제 에러 원인을 콘솔에 찍어줍니다.
    console.error("GPT 호출 실제 에러:", error.message);
    return "데이터를 정밀 분석 중입니다..."; 
  }
};