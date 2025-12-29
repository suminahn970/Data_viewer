"use client"

import { useMemo } from "react"
import { Card } from "@/components/ui/card"
import { CheckCircle2, TrendingUp, AlertCircle, Cpu, Database } from "lucide-react"

interface SmartInsightsPanelProps {
  data: {
    headers: string[]
    rows: string[][]
    fileName: string
  }
  result?: {
    headers: string[]
    preview_rows: (string | number)[][]
    total_rows?: number
  }
}

export function SmartInsightsPanel({ data, result }: SmartInsightsPanelProps) {
  const insights = useMemo(() => {
    if (!data || !data.headers || !data.rows) return []

    const results = []
    
    // 1. 데이터 구조 검증 (Data Structure Validated)
    const totalRows = result?.total_rows || data.rows.length
    results.push({
      type: "success",
      title: "데이터 구조 검증 완료",
      description: `${data.headers.length.toLocaleString()}개의 열과 ${totalRows.toLocaleString()}개의 행이 감지되었습니다.`,
      details: null,
    })

    // 2. 수치형 컬럼 감지 (Numeric Columns Found)
    const numericColumns = data.headers.filter((header, index) => {
      const sample = data.rows.slice(0, 10).map((row) => row[index])
      return sample.every((val) => !isNaN(Number(val)) && val !== "")
    })

    if (numericColumns.length > 0) {
      results.push({
        type: "info",
        title: "수치형 데이터 발견",
        description: `${numericColumns.length.toLocaleString()}개의 열에서 통계 분석이 가능한 수치 데이터를 확인했습니다.`,
        details: numericColumns.join(", "),
      })
    }

    // 3. 결측치 감지 (Missing Values detected)
    let totalMissing = 0
    data.headers.forEach((_, index) => {
      data.rows.forEach((row) => {
        if (!row[index] || row[index].trim() === "") totalMissing++
      })
    })

    if (totalMissing > 0) {
      results.push({
        type: "warning",
        title: "결측치(빈 데이터) 감지",
        description: `데이터 세트 내에서 ${totalMissing.toLocaleString()}개의 누락된 값이 발견되었습니다.`,
        details: "AI 스마트 정제 기능을 통해 보정하는 것을 권장합니다.",
      })
    }

    return results
  }, [data, result])

  if (!data || !data.headers || !data.rows) return null

  return (
    <Card className="rounded-[32px] border-none bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] h-full flex flex-col">
      {/* 헤더 섹션 한글화 */}
      <div className="px-8 py-6 border-b border-slate-50">
        <h2 className="text-md font-bold text-slate-900 tracking-tight">AI 데이터 인사이트</h2>
      </div>

      <div className="p-8 flex-1 flex flex-col justify-between">
        {/* 상단: 인사이트 목록 */}
        <div className="space-y-4">
          {insights.map((insight, index) => (
            <div 
              key={index} 
              className="p-4 rounded-2xl border border-slate-50 bg-slate-50/30 transition-all hover:bg-slate-50"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {insight.type === "warning" && <AlertCircle className="h-5 w-5 text-amber-500" />}
                  {insight.type === "success" && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
                  {insight.type === "info" && <TrendingUp className="h-5 w-5 text-blue-500" />}
                </div>
                <div className="flex-1">
                  <p className="text-[13px] font-bold text-slate-900 mb-0.5">{insight.title}</p>
                  <p className="text-[11px] text-slate-400 font-medium leading-relaxed">{insight.description}</p>
                  {insight.details && (
                    <p className="text-[10px] text-slate-400 mt-2 bg-white/50 p-2 rounded-lg border border-slate-100 italic">
                      {insight.details}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 하단 메타데이터 영역 한글화 (System Engine -> 분석 엔진 상태) */}
        <div className="mt-8 pt-8 border-t border-slate-50 space-y-5">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">분석 엔진 상태</span>
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-500">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              정상 가동 중
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
             <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 flex items-center gap-3">
               <Database className="w-4 h-4 text-slate-300" />
               <div>
                 <p className="text-[9px] text-slate-400 font-bold uppercase mb-0.5">총 행 수</p>
                 <p className="text-[13px] font-extrabold text-slate-700 tracking-tight">
                    {(result?.total_rows || data.rows.length).toLocaleString()}개
                 </p>
               </div>
             </div>
             <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 flex items-center gap-3">
               <Cpu className="w-4 h-4 text-slate-300" />
               <div>
                 <p className="text-[9px] text-slate-400 font-bold uppercase mb-0.5">분석 속도</p>
                 <p className="text-[13px] font-extrabold text-slate-700 tracking-tight">0.8초</p>
               </div>
             </div>
          </div>
        </div>
      </div>
    </Card>
  )
}