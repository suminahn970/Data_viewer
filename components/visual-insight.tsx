"use client"

import { Card } from "@/components/ui/card"
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts"
import { useMemo, useEffect, useState } from "react"
import { Sparkles } from "lucide-react"

interface AnalysisPreset {
  label: string
  column: string
  type: "distribution" | "statistics" | "status" | "correlation" | "outlier"
  insight?: string  // ⭐️ 백엔드에서 보낸 문장을 명확히 정의
}

interface VisualInsightProps {
  selectedAnalysis: AnalysisPreset | null
  headers: string[]
  previewRows: (string | number)[][]
  onElementClick?: (value: string | null) => void
  activeFilter?: string | null
}

const COLORS = [
  "hsl(217, 91%, 60%)", "hsl(142, 76%, 36%)", "hsl(38, 92%, 50%)",
  "hsl(0, 72%, 51%)", "hsl(262, 83%, 58%)", "hsl(201, 96%, 32%)",
  "hsl(24, 95%, 53%)", "hsl(280, 67%, 64%)",
]

export function VisualInsight({ 
  selectedAnalysis, 
  headers, 
  previewRows, 
  onElementClick, 
  activeFilter 
}: VisualInsightProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  const chartData = useMemo(() => {
    if (!selectedAnalysis || !headers || !previewRows || previewRows.length === 0) return null

    if (selectedAnalysis.type === "correlation") {
      const [col1, col2] = selectedAnalysis.column.split("__vs__")
      const idx1 = headers.indexOf(col1)
      const idx2 = headers.indexOf(col2)
      if (idx1 === -1 || idx2 === -1) return null

      return previewRows.map((row) => ({
        x: typeof row[idx1] === "number" ? row[idx1] : parseFloat(String(row[idx1])),
        y: typeof row[idx2] === "number" ? row[idx2] : parseFloat(String(row[idx2])),
      })).filter(d => !isNaN(d.x) && !isNaN(d.y)).slice(0, 300)
    }

    const columnIndex = headers.indexOf(selectedAnalysis.column)
    if (columnIndex === -1) return null

    const columnData = previewRows
      .map((row) => row[columnIndex])
      .filter((val) => val !== null && val !== undefined && val !== "")

    if (columnData.length === 0) return null

    if (selectedAnalysis.type === "outlier") {
      const nums = columnData.map(v => parseFloat(String(v))).filter(v => !isNaN(v))
      if (nums.length === 0) return null
      const avg = nums.reduce((a, b) => a + b, 0) / nums.length
      return nums.map((v, i) => ({
        name: String(v),
        value: v,
        isOutlier: Math.abs(v - avg) > avg * 0.5
      })).slice(0, 50)
    }

    try {
      if (selectedAnalysis.type === "distribution" || selectedAnalysis.type === "status") {
        const counts: Record<string, number> = {}
        columnData.forEach((val) => {
          const key = String(val).trim()
          counts[key] = (counts[key] || 0) + 1
        })
        return Object.entries(counts)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 10)
      }

      if (selectedAnalysis.type === "statistics") {
        const numericData = columnData
          .map((val) => (typeof val === "number" ? val : parseFloat(String(val))))
          .filter((val) => !isNaN(val)) as number[]

        if (numericData.length === 0) return null
        const min = Math.min(...numericData)
        const max = Math.max(...numericData)
        const bins = 10
        const binWidth = (max - min) / bins || 1

        const histogram: Record<string, number> = {}
        numericData.forEach((val) => {
          const binIndex = Math.min(Math.floor((val - min) / binWidth), bins - 1)
          const binLabel = `${(min + binIndex * binWidth).toFixed(0)}-${(min + (binIndex + 1) * binWidth).toFixed(0)}`
          histogram[binLabel] = (histogram[binLabel] || 0) + 1
        })
        return Object.entries(histogram).map(([name, value]) => ({ name, value }))
      }
    } catch (e) {
      console.error("데이터 처리 에러:", e)
      return null
    }
    return null
  }, [selectedAnalysis, headers, previewRows])

  const handlePointClick = (data: any) => {
    if (!onElementClick) return
    const clickedValue = data.name || data.activeLabel || data.payload?.name
    if (clickedValue === activeFilter) {
      onElementClick(null)
    } else {
      onElementClick(clickedValue)
    }
  }

  if (!mounted || !selectedAnalysis || !chartData) return null

  return (
    <Card className="rounded-3xl border border-border bg-card p-8 shadow-sm transition-all duration-500 animate-in fade-in slide-in-from-bottom-4">
      <div className="mb-6 flex flex-col gap-5">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-bold text-foreground mb-1 tracking-tight">
              {selectedAnalysis.label}
            </h3>
            <p className="text-sm text-muted-foreground font-medium">
              분석 컬럼: <span className="text-primary">{selectedAnalysis.column}</span>
            </p>
          </div>
          {activeFilter && (
            <div className="bg-primary/10 text-primary text-xs px-3 py-1.5 rounded-full animate-pulse font-bold border border-primary/20">
              필터링: {activeFilter}
            </div>
          )}
        </div>

        {/* ⭐️ 인사이트 카드: 존재 여부를 더 확실하게 체크 */}
        {selectedAnalysis.insight ? (
          <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-5 flex items-start gap-4 shadow-sm group hover:shadow-md transition-shadow">
            <div className="mt-0.5 bg-blue-500/10 p-2 rounded-xl group-hover:scale-110 transition-transform">
              <Sparkles className="w-5 h-5 text-blue-600" />
            </div>
            <div className="space-y-1">
              <p className="text-[11px] font-black text-blue-400 uppercase tracking-[0.2em]">AI Insights</p>
              <p className="text-[15px] text-slate-800 leading-relaxed font-semibold">
                {selectedAnalysis.insight}
              </p>
            </div>
          </div>
        ) : (
          /* 디버깅용: 데이터가 없을 때만 조용히 숨김 (테스트 시에는 '분석 중...' 메시지로 확인 가능) */
          <div className="h-0 opacity-0" />
        )}
      </div>

      <div className="h-[400px] w-full mt-2">
        <ResponsiveContainer width="100%" height="100%">
          {/* 차트 렌더링 로직 (기존과 동일하되 타입 안정성 유지) */}
          {selectedAnalysis.type === "correlation" ? (
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis type="number" dataKey="x" name="X" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis type="number" dataKey="y" name="Y" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter data={chartData} fill="hsl(217, 91%, 60%)" fillOpacity={0.6} />
            </ScatterChart>
          ) : 
          selectedAnalysis.type === "outlier" ? (
            <BarChart data={chartData} onClick={handlePointClick}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
              <XAxis dataKey="name" hide />
              <YAxis fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} cursor="pointer">
                {chartData.map((entry: any, index: number) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.name === activeFilter ? "#000" : (entry.isOutlier ? "hsl(0, 72%, 51%)" : "hsl(217, 91%, 60%)")} 
                    fillOpacity={activeFilter && entry.name !== activeFilter ? 0.3 : 1}
                  />
                ))}
              </Bar>
            </BarChart>
          ) :
          selectedAnalysis.type === "distribution" && chartData.length <= 5 ? (
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={selectedAnalysis.type === "status" ? 70 : 0}
                outerRadius={130}
                paddingAngle={4}
                dataKey="value"
                onClick={handlePointClick}
                cursor="pointer"
              >
                {chartData.map((entry: any, index: number) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.name === activeFilter ? "#000" : COLORS[index % COLORS.length]} 
                    fillOpacity={activeFilter && entry.name !== activeFilter ? 0.3 : 1}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" height={36}/>
            </PieChart>
          ) : (
            <BarChart data={chartData} onClick={handlePointClick}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
              <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip cursor={{ fill: 'transparent' }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} cursor="pointer">
                {chartData.map((entry: any, index: number) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.name === activeFilter ? "#000" : COLORS[index % COLORS.length]} 
                    fillOpacity={activeFilter && entry.name !== activeFilter ? 0.3 : 1}
                  />
                ))}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
      
      <div className="mt-8 pt-6 border-t border-slate-50 flex justify-center">
        <p className="text-[11px] text-muted-foreground font-medium bg-slate-50 px-4 py-1.5 rounded-full">
           그래프 요소를 클릭하여 표 데이터를 상세 필터링할 수 있습니다.
        </p>
      </div>
    </Card>
  )
}