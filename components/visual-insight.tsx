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
import { Sparkles } from "lucide-react" // ✨ 아이콘 추가

interface AnalysisPreset {
  label: string
  column: string
  type: "distribution" | "statistics" | "status" | "correlation" | "outlier"
  insight?: string // ⭐️ 백엔드에서 보낸 인사이트 문장
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

  if (!mounted || !selectedAnalysis || !chartData || chartData.length === 0) return null

  const renderChart = () => {
    return (
      <div className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          {selectedAnalysis.type === "correlation" ? (
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis type="number" dataKey="x" name="X축" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis type="number" dataKey="y" name="Y축" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter name="관계 분석" data={chartData} fill="hsl(217, 91%, 60%)" fillOpacity={0.6} />
            </ScatterChart>
          ) : 
          selectedAnalysis.type === "outlier" ? (
            <BarChart data={chartData} onClick={handlePointClick}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.2} />
              <XAxis dataKey="name" hide />
              <YAxis fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} cursor="pointer">
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
                innerRadius={selectedAnalysis.type === "status" ? 60 : 0}
                outerRadius={120}
                paddingAngle={5}
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
              <Legend />
            </PieChart>
          ) : selectedAnalysis.type === "statistics" ? (
            <AreaChart data={chartData} onClick={handlePointClick}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.2} />
              <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke={COLORS[0]} 
                fill={COLORS[0]} 
                fillOpacity={activeFilter ? 0.5 : 0.2} 
                cursor="pointer"
              />
            </AreaChart>
          ) : (
            <BarChart data={chartData} onClick={handlePointClick}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.2} />
              <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip cursor={{ fill: 'transparent' }} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} cursor="pointer">
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
    )
  }

  return (
    <Card className="rounded-3xl border border-border bg-card p-8 shadow-sm transition-all duration-500 animate-in fade-in slide-in-from-bottom-4">
      <div className="mb-6 flex flex-col gap-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-1">{selectedAnalysis.label}</h3>
            <p className="text-sm text-muted-foreground font-medium italic underline underline-offset-4 decoration-primary/30">
              분석 대상: {selectedAnalysis.column}
            </p>
          </div>
          {activeFilter && (
            <div className="bg-primary/10 text-primary text-xs px-3 py-1 rounded-full animate-bounce font-semibold">
              필터 적용 중: {activeFilter}
            </div>
          )}
        </div>

        {/* ⭐️ [신규] 인사이트 문장화 카드 영역 */}
        {selectedAnalysis.insight && (
          <div className="bg-slate-50/80 border border-slate-100 rounded-2xl p-4 flex items-start gap-3 shadow-inner">
            <div className="mt-1 bg-primary/20 p-1.5 rounded-lg">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">AI 자동 통찰</p>
              <p className="text-sm text-slate-700 leading-relaxed font-medium">
                {selectedAnalysis.insight}
              </p>
            </div>
          </div>
        )}
      </div>

      <div>{renderChart()}</div>
      
      <p className="text-[10px] text-muted-foreground mt-6 text-center italic opacity-70">
        * 그래프를 클릭하여 상세 데이터를 필터링해 보세요.
      </p>
    </Card>
  )
}