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
  ResponsiveContainer, // ⭐️ 필수 추가
  Tooltip,
  Legend,
} from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { useMemo, useEffect, useState } from "react"

interface AnalysisPreset {
  label: string
  column: string
  type: "distribution" | "statistics" | "status"
}

interface VisualInsightProps {
  selectedAnalysis: AnalysisPreset | null
  headers: string[]
  previewRows: (string | number)[][]
}

const COLORS = [
  "hsl(217, 91%, 60%)", "hsl(142, 76%, 36%)", "hsl(38, 92%, 50%)",
  "hsl(0, 72%, 51%)", "hsl(262, 83%, 58%)", "hsl(201, 96%, 32%)",
  "hsl(24, 95%, 53%)", "hsl(280, 67%, 64%)",
]

export function VisualInsight({ selectedAnalysis, headers, previewRows }: VisualInsightProps) {
  const [mounted, setMounted] = useState(false)

  // ⭐️ 클라이언트 사이드 렌더링 보장 (Hydration 에러 방지)
  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  const chartData = useMemo(() => {
    if (!selectedAnalysis || !headers || !previewRows || previewRows.length === 0) return null

    const columnIndex = headers.indexOf(selectedAnalysis.column)
    if (columnIndex === -1) return null

    const columnData = previewRows
      .map((row) => row[columnIndex])
      .filter((val) => val !== null && val !== undefined && val !== "")

    if (columnData.length === 0) return null

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

  // 마운트 전이거나 데이터가 없으면 충돌 방지를 위해 null 반환
  if (!mounted || !selectedAnalysis || !chartData || chartData.length === 0) return null

  const renderChart = () => {
    return (
      <div className="h-[400px] w-full">
        {/* ⭐️ ResponsiveContainer로 감싸야 튕김 현상을 막을 수 있습니다. */}
        <ResponsiveContainer width="100%" height="100%">
          {selectedAnalysis.type === "distribution" && chartData.length <= 5 ? (
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={selectedAnalysis.type === "status" ? 60 : 0}
                outerRadius={120}
                paddingAngle={5}
                dataKey="value"
              >
                {chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          ) : selectedAnalysis.type === "statistics" ? (
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.2} />
              <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip />
              <Area type="monotone" dataKey="value" stroke={COLORS[0]} fill={COLORS[0]} fillOpacity={0.2} />
            </AreaChart>
          ) : (
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.2} />
              <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip cursor={{ fill: 'transparent' }} />
              <Bar dataKey="value" fill={COLORS[1]} radius={[4, 4, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    )
  }

  return (
    <Card className="rounded-3xl border border-border bg-card p-8 shadow-sm transition-all duration-500">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground mb-1">{selectedAnalysis.label}</h3>
        <p className="text-sm text-muted-foreground">분석 대상: {selectedAnalysis.column}</p>
      </div>
      {renderChart()}
    </Card>
  )
}