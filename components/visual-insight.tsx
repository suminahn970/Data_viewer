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
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { useMemo } from "react"

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

// 파스텔 색상 팔레트 (애플 대시보드 느낌의 부드러운 색상)
const COLORS = [
  "hsl(217, 91%, 60%)", // 부드러운 파란색
  "hsl(142, 76%, 36%)", // 부드러운 초록색
  "hsl(38, 92%, 50%)",  // 부드러운 노란색
  "hsl(0, 72%, 51%)",   // 부드러운 빨간색
  "hsl(262, 83%, 58%)", // 부드러운 보라색
  "hsl(201, 96%, 32%)", // 부드러운 청록색
  "hsl(24, 95%, 53%)",  // 부드러운 주황색
  "hsl(280, 67%, 64%)", // 부드러운 핑크색
]

export function VisualInsight({ selectedAnalysis, headers, previewRows }: VisualInsightProps) {
  const chartData = useMemo(() => {
    if (!selectedAnalysis || !headers || !previewRows || previewRows.length === 0) {
      return null
    }

    const columnIndex = headers.findIndex((h) => h === selectedAnalysis.column)
    if (columnIndex === -1) return null

    // 해당 컬럼의 데이터 추출
    const columnData = previewRows
      .map((row) => row[columnIndex])
      .filter((val) => val !== null && val !== undefined && val !== "")

    if (columnData.length === 0) return null

    switch (selectedAnalysis.type) {
      case "distribution": {
        // 범주형 데이터 카운트
        const counts: Record<string, number> = {}
        columnData.forEach((val) => {
          const key = String(val)
          counts[key] = (counts[key] || 0) + 1
        })

        return Object.entries(counts)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 10) // 상위 10개만
      }

      case "statistics": {
        // 수치형 데이터 히스토그램
        const numericData = columnData
          .map((val) => {
            const num = typeof val === "number" ? val : parseFloat(String(val))
            return isNaN(num) ? null : num
          })
          .filter((val) => val !== null) as number[]

        if (numericData.length === 0) return null

        const min = Math.min(...numericData)
        const max = Math.max(...numericData)
        const bins = 10
        const binWidth = (max - min) / bins

        const histogram: Record<string, number> = {}
        numericData.forEach((val) => {
          const binIndex = Math.min(Math.floor((val - min) / binWidth), bins - 1)
          const binLabel = `${(min + binIndex * binWidth).toFixed(0)}-${(min + (binIndex + 1) * binWidth).toFixed(0)}`
          histogram[binLabel] = (histogram[binLabel] || 0) + 1
        })

        return Object.entries(histogram)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => {
            const aStart = parseFloat(a.name.split("-")[0])
            const bStart = parseFloat(b.name.split("-")[0])
            return aStart - bStart
          })
      }

      case "status": {
        // 불리언/상태형 데이터 비중
        const counts: Record<string, number> = {}
        columnData.forEach((val) => {
          const key = String(val).trim()
          counts[key] = (counts[key] || 0) + 1
        })

        return Object.entries(counts).map(([name, value]) => ({ name, value }))
      }

      default:
        return null
    }
  }, [selectedAnalysis, headers, previewRows])

  if (!selectedAnalysis || !chartData || chartData.length === 0) {
    return null
  }

  const renderChart = () => {
    switch (selectedAnalysis.type) {
      case "distribution":
        // Pie Chart 또는 Bar Chart
        if (chartData.length <= 5) {
          // 5개 이하면 Pie Chart
          return (
            <ChartContainer
              config={{
                value: {
                  label: selectedAnalysis.column,
                  color: "hsl(var(--chart-1))",
                },
              }}
              className="h-[400px] w-full"
            >
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }} />
              </PieChart>
            </ChartContainer>
          )
        } else {
          // 5개 초과면 Bar Chart
          return (
            <ChartContainer
              config={{
                value: {
                  label: selectedAnalysis.column,
                  color: "hsl(var(--chart-2))",
                },
              }}
              className="h-[400px] w-full"
            >
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" fill="hsl(var(--chart-2))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ChartContainer>
          )
        }

      case "statistics":
        // Area Chart 또는 Histogram (Bar Chart로 표시)
        return (
          <ChartContainer
            config={{
              value: {
                label: selectedAnalysis.column,
                color: "hsl(var(--chart-3))",
              },
            }}
            className="h-[400px] w-full"
          >
            <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-3))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--chart-3))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey="value"
                stroke="hsl(var(--chart-3))"
                strokeWidth={2}
                fill="url(#colorValue)"
              />
            </AreaChart>
          </ChartContainer>
        )

      case "status":
        // Donut Chart (Pie Chart with innerRadius)
        return (
          <ChartContainer
            config={{
              value: {
                label: selectedAnalysis.column,
                color: "hsl(var(--chart-4))",
              },
            }}
            className="h-[400px] w-full"
          >
              <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={120}
                innerRadius={60}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }} />
              <Legend />
            </PieChart>
          </ChartContainer>
        )

      default:
        return null
    }
  }

  return (
    <Card className="rounded-3xl border border-border bg-card p-8 shadow-sm animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground mb-2">{selectedAnalysis.label}</h3>
        <p className="text-sm text-muted-foreground">컬럼: {selectedAnalysis.column}</p>
      </div>
      <div>{renderChart()}</div>
    </Card>
  )
}

