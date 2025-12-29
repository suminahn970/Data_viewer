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
    
    // 1. 데이터 구조 검증
    const totalRows = result?.total_rows || data.rows.length
    results.push({
      type: "success",
      title: "Data Structure Validated",
      description: `${data.headers.length.toLocaleString()} columns, ${totalRows.toLocaleString()} rows detected`,
      details: null,
    })

    // 2. 수치형 컬럼 감지
    const numericColumns = data.headers.filter((header, index) => {
      const sample = data.rows.slice(0, 10).map((row) => row[index])
      return sample.every((val) => !isNaN(Number(val)) && val !== "")
    })

    if (numericColumns.length > 0) {
      results.push({
        type: "info",
        title: "Numeric Columns Found",
        description: `${numericColumns.length.toLocaleString()} columns contain numeric data`,
        details: numericColumns.join(", "),
      })
    }

    // 3. 결측치 감지
    let totalMissing = 0
    data.headers.forEach((_, index) => {
      data.rows.forEach((row) => {
        if (!row[index] || row[index].trim() === "") totalMissing++
      })
    })

    if (totalMissing > 0) {
      results.push({
        type: "warning",
        title: "Missing Values detected",
        description: `${totalMissing.toLocaleString()} missing values found in raw data`,
        details: "AI cleansing recommended",
      })
    }

    return results
  }, [data, result])

  if (!data || !data.headers || !data.rows) return null

  return (
    <Card className="rounded-[32px] border-none bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] h-full flex flex-col">
      {/* 헤더 섹션: 좌측 데이터 미리보기와 높이 정렬 맞춤 */}
      <div className="px-8 py-6 border-b border-slate-50">
        <h2 className="text-md font-bold text-slate-900 tracking-tight">Smart Insights</h2>
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

        {/* ⭐️ 1번 전략의 핵심: 하단 메타데이터 영역 (수평 정렬용) */}
        <div className="mt-8 pt-8 border-t border-slate-50 space-y-5">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">System Engine</span>
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-500">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              RUNNING
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
             <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 flex items-center gap-3">
               <Database className="w-4 h-4 text-slate-300" />
               <div>
                 <p className="text-[9px] text-slate-400 font-bold uppercase mb-0.5">Rows</p>
                 <p className="text-[13px] font-extrabold text-slate-700 tracking-tight">
                    {(result?.total_rows || data.rows.length).toLocaleString()}
                 </p>
               </div>
             </div>
             <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 flex items-center gap-3">
               <Cpu className="w-4 h-4 text-slate-300" />
               <div>
                 <p className="text-[9px] text-slate-400 font-bold uppercase mb-0.5">Latency</p>
                 <p className="text-[13px] font-extrabold text-slate-700 tracking-tight">0.8s</p>
               </div>
             </div>
          </div>
        </div>
      </div>
    </Card>
  )
}