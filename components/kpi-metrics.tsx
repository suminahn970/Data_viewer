"use client"

import { Card } from "@/components/ui/card"
import { LineChart, Line, ResponsiveContainer } from "recharts"

interface DisplayMetric {
  label: string
  value: number
  unit: string
  feature: string | null
}

interface KpiMetricsProps {
  displayMetrics?: DisplayMetric[]
  mainFeature?: string
}

const mockChartData = [
  { value: 20 },
  { value: 35 },
  { value: 25 },
  { value: 45 },
  { value: 40 },
  { value: 60 },
  { value: 55 },
]

export function KpiMetrics({ displayMetrics = [], mainFeature }: KpiMetricsProps) {
  // 값 포맷팅 함수
  const formatValue = (value: number, unit: string, label: string): string => {
    const formattedNumber = value.toLocaleString()
    
    // 평균은 화폐 단위(₩, $) 제거하고 숫자만 표시 (단, 나이 등 특정 단위는 유지)
    const isAverage = label.includes("(평균)")
    
    if (isAverage) {
      // 평균인 경우 화폐 단위 없이 숫자만 (천 단위 콤마는 유지)
      // 단, 나이(age) 등 특정 단위가 있는 경우는 표시 (세, 점 등)
      if (unit && unit !== "₩" && unit !== "$") {
        return `${formattedNumber} ${unit}`
      }
      return formattedNumber
    }
    
    // 합계나 다른 지표는 단위 포함
    if (unit) {
      // 단위가 앞에 오는 경우 (₩, $ 등)
      if (unit === "₩" || unit === "$") {
        return `${unit}${formattedNumber}`
      }
      // 단위가 뒤에 오는 경우 (세, 점, 명, 건, 개 등)
      return `${formattedNumber} ${unit}`
    }
    
    return formattedNumber
  }

  // 데이터가 없을 때 기본 카드 표시
  if (displayMetrics.length === 0) {
    return (
      <div className="grid gap-6 md:grid-cols-3">
        {[1, 2, 3].map((index) => (
          <Card
            key={index}
            className="rounded-3xl border border-border bg-card p-8 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="space-y-6">
              <div>
                <p className="text-sm text-muted-foreground mb-2">로딩 중...</p>
                <p className="text-4xl font-semibold text-foreground">0</p>
              </div>
              <div className="h-[80px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={mockChartData}>
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="hsl(var(--chart-2))"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {displayMetrics.map((metric, index) => (
        <Card
          key={index}
          className="rounded-3xl border border-border bg-card p-8 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="space-y-6">
            <div>
              <p className="text-sm text-muted-foreground mb-2">{metric.label}</p>
              <p className="text-4xl font-semibold text-foreground">
                {formatValue(metric.value, metric.unit, metric.label)}
              </p>
              {mainFeature && (
                <p className="text-xs text-slate-400 text-center mt-2">
                  (기준: {mainFeature})
                </p>
              )}
            </div>

            <div className="h-[80px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockChartData}>
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(var(--chart-2))"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
