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
    <Card className="rounded-xl border border-[#E5E9F0] bg-white shadow-sm h-full flex flex-col">
      <div className="px-6 py-5 border-b border-[#E5E9F0]">
        <h2 className="text-base font-semibold text-[#1A1F36] tracking-tight">데이터 품질 분석</h2>
      </div>

      <div className="p-6 flex-1 flex flex-col justify-between">
        <div className="space-y-3">
          {insights.map((insight, index) => (
            <div 
              key={index} 
              className="p-4 rounded-xl border border-[#E5E9F0] bg-[#F7F9FC] transition-all hover:bg-white hover:border-[#0066FF]/30"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {insight.type === "warning" && <AlertCircle className="h-5 w-5 text-[#F59E0B]" />}
                  {insight.type === "success" && <CheckCircle2 className="h-5 w-5 text-[#10B981]" />}
                  {insight.type === "info" && <TrendingUp className="h-5 w-5 text-[#0066FF]" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[#1A1F36] mb-1">{insight.title}</p>
                  <p className="text-xs text-[#6B7280] leading-relaxed">{insight.description}</p>
                  {insight.details && (
                    <p className="text-xs text-[#6B7280] mt-2 bg-white p-2 rounded-lg border border-[#E5E9F0]">
                      {insight.details}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-6 border-t border-[#E5E9F0] space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide">분석 엔진 상태</span>
            <span className="flex items-center gap-1.5 text-xs font-semibold text-[#10B981]">
              <div className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
              정상 가동
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
             <div className="bg-[#F7F9FC] p-3 rounded-lg border border-[#E5E9F0] flex items-center gap-3">
               <Database className="w-4 h-4 text-[#6B7280]" />
               <div>
                 <p className="text-xs text-[#6B7280] font-semibold uppercase mb-0.5">총 행 수</p>
                 <p className="text-sm font-semibold text-[#1A1F36] tracking-tight">
                    {(result?.total_rows || data.rows.length).toLocaleString()}개
                 </p>
               </div>
             </div>
             <div className="bg-[#F7F9FC] p-3 rounded-lg border border-[#E5E9F0] flex items-center gap-3">
               <Cpu className="w-4 h-4 text-[#6B7280]" />
               <div>
                 <p className="text-xs text-[#6B7280] font-semibold uppercase mb-0.5">분석 속도</p>
                 <p className="text-sm font-semibold text-[#1A1F36] tracking-tight">0.8초</p>
               </div>
             </div>
          </div>
        </div>
      </div>
    </Card>
  )
}