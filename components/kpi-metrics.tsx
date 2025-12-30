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
  { value: 30 }, { value: 45 }, { value: 32 }, { value: 50 }, 
  { value: 42 }, { value: 65 }, { value: 58 },
]

export function KpiMetrics({ displayMetrics = [], mainFeature }: KpiMetricsProps) {
  
  const formatValue = (value: number, label: string): string => {
    // ⭐️ 천 단위 콤마 + 평균일 때만 소수점 1자리 노출
    return value.toLocaleString(undefined, {
      minimumFractionDigits: label.includes("(평균)") ? 1 : 0,
      maximumFractionDigits: 1
    })
  }

  if (displayMetrics.length === 0) {
    return (
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
        {[1, 2, 3, 4].map((index) => (
          <Card key={index} className="rounded-xl border border-[#E5E9F0] bg-white p-6 shadow-sm animate-pulse">
            <div className="space-y-4">
              <div className="h-3 w-20 bg-[#E5E9F0] rounded" />
              <div className="h-8 w-32 bg-[#E5E9F0] rounded" />
              <div className="h-[60px] bg-[#F7F9FC] rounded-lg" />
            </div>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
      {displayMetrics.map((metric, index) => (
        <Card
          key={index}
          className="group rounded-xl border border-[#E5E9F0] bg-white p-6 shadow-sm hover:shadow-md hover:border-[#0066FF]/30 transition-all duration-300"
        >
          <div className="space-y-4">
            <div className="relative">
              <p className="text-xs font-semibold text-[#6B7280] mb-2 uppercase tracking-wide">
                {metric.label}
              </p>
              
              <div className="flex items-baseline gap-1">
                {(metric.unit === "₩" || metric.unit === "$") && (
                  <span className="text-lg font-semibold text-[#1A1F36] mr-0.5">{metric.unit}</span>
                )}
                
                <p className="text-3xl font-semibold text-[#1A1F36] tracking-tight">
                  {formatValue(metric.value, metric.label)}
                </p>
                
                {metric.unit && metric.unit !== "₩" && metric.unit !== "$" && (
                  <span className="text-base font-medium text-[#6B7280] ml-1">{metric.unit}</span>
                )}
              </div>

              {mainFeature && (
                <span className="absolute top-0 right-0 px-2 py-0.5 bg-[#0066FF]/10 text-[#0066FF] text-[10px] font-semibold rounded-lg">
                  {mainFeature}
                </span>
              )}
            </div>

            <div className="h-[60px] w-full opacity-50 group-hover:opacity-100 transition-opacity duration-300">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockChartData}>
                  <defs>
                    <linearGradient id={`lineGradient-${index}`} x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#0066FF" />
                      <stop offset="100%" stopColor="#00A3FF" />
                    </linearGradient>
                  </defs>
                  <Line
                    type="natural"
                    dataKey="value"
                    stroke={`url(#lineGradient-${index})`}
                    strokeWidth={2.5}
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