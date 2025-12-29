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
  ScatterChart, // ⭐️ 추가: 상관관계 분석용
  Scatter,      // ⭐️ 추가: 상관관계 분석용
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts"
import { useMemo, useEffect, useState } from "react"

interface AnalysisPreset {
  label: string
  column: string
  type: "distribution" | "statistics" | "status" | "correlation" | "outlier" // ⭐️ 타입 확장
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

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  const chartData = useMemo(() => {
    if (!selectedAnalysis || !headers || !previewRows || previewRows.length === 0) return null

    // ⭐️ [신규] 상관관계(Correlation) 데이터 처리 로직
    if (selectedAnalysis.type === "correlation") {
      const [col1, col2] = selectedAnalysis.column.split("__vs__")
      const idx1 = headers.indexOf(col1)
      const idx2 = headers.indexOf(col2)
      if (idx1 === -1 || idx2 === -1) return null

      return previewRows.map((row) => ({
        x: typeof row[idx1] === "number" ? row[idx1] : parseFloat(String(row[idx1])),
        y: typeof row[idx2] === "number" ? row[idx2] : parseFloat(String(row[idx2])),
      })).filter(d => !isNaN(d.x) && !isNaN(d.y)).slice(0, 300) // 성능을 위해 300개 제한
    }

    const columnIndex = headers.indexOf(selectedAnalysis.column)
    if (columnIndex === -1) return null

    const columnData = previewRows
      .map((row) => row[columnIndex])
      .filter((val) => val !== null && val !== undefined && val !== "")

    if (columnData.length === 0) return null

    // ⭐️ [신규] 이상치(Outlier) 데이터 처리 로직
    if (selectedAnalysis.type === "outlier") {
      const nums = columnData.map(v => parseFloat(String(v))).filter(v => !isNaN(v))
      if (nums.length === 0) return null
      const avg = nums.reduce((a, b) => a + b, 0) / nums.length
      // 평균에서 50% 이상 차이나면 임시 이상치로 간주 (시각적 강조용)
      return nums.map((v, i) => ({
        name: i,
        value: v,
        isOutlier: Math.abs(v - avg) > avg * 0.5
      })).slice(0, 50) // 바 차트 가독성을 위해 50개 제한
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

  if (!mounted || !selectedAnalysis || !chartData || chartData.length === 0) return null

  const renderChart = () => {
    return (
      <div className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          {/* 상관관계 분석: 산점도 */}
          {selectedAnalysis.type === "correlation" ? (
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis type="number" dataKey="x" name="X축" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis type="number" dataKey="y" name="Y축" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter name="관계 분석" data={chartData} fill="hsl(217, 91%, 60%)" fillOpacity={0.6} />
            </ScatterChart>
          ) : 
          /* 이상치 분석: 강조 바 차트 */
          selectedAnalysis.type === "outlier" ? (
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.2} />
              <XAxis dataKey="name" hide />
              <YAxis fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {chartData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.isOutlier ? "hsl(0, 72%, 51%)" : "hsl(217, 91%, 60%)"} />
                ))}
              </Bar>
            </BarChart>
          ) :
          /* 기존 차트 로직 */
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
    <Card className="rounded-3xl border border-border bg-card p-8 shadow-sm transition-all duration-500 animate-in fade-in slide-in-from-bottom-4">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground mb-1">{selectedAnalysis.label}</h3>
        <p className="text-sm text-muted-foreground">자동 통찰 탐지 결과</p>
      </div>
      {renderChart()}
    </Card>
  )
}