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
      <div className="grid gap-6 md:grid-cols-3">
        {[1, 2, 3].map((index) => (
          <Card key={index} className="rounded-[32px] border-none bg-white p-8 shadow-sm animate-pulse">
            <div className="space-y-6">
              <div className="h-4 w-20 bg-slate-100 rounded" />
              <div className="h-10 w-32 bg-slate-100 rounded" />
              <div className="h-[80px] bg-slate-50 rounded-2xl" />
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
          className="group rounded-[32px] border-none bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.06)] transition-all duration-500"
        >
          <div className="space-y-6">
            <div className="relative">
              {/* ⭐️ 라벨 대비 강화 */}
              <p className="text-[11px] font-bold text-slate-400 mb-1 uppercase tracking-widest">
                {metric.label}
              </p>
              
              <div className="flex items-baseline gap-1">
                {/* ⭐️ 화폐 단위가 앞에 붙는 경우 ($1,000) */}
                {(metric.unit === "₩" || metric.unit === "$") && (
                  <span className="text-xl font-bold text-slate-900 mr-0.5">{metric.unit}</span>
                )}
                
                {/* ⭐️ 수치 폰트 굵기 강화 */}
                <p className="text-4xl font-extrabold text-slate-900 tracking-tighter">
                  {formatValue(metric.value, metric.label)}
                </p>
                
                {/* ⭐️ 화폐 외 단위가 뒤에 붙는 경우 (35.4 세) */}
                {metric.unit && metric.unit !== "₩" && metric.unit !== "$" && (
                  <span className="text-lg font-bold text-slate-400 ml-1">{metric.unit}</span>
                )}
              </div>

              {mainFeature && (
                <span className="absolute top-0 right-0 px-2 py-0.5 bg-primary/5 text-primary text-[10px] font-bold rounded-full border border-primary/10">
                  {mainFeature}
                </span>
              )}
            </div>

            <div className="h-[80px] w-full opacity-40 group-hover:opacity-100 transition-opacity duration-700">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockChartData}>
                  <defs>
                    <linearGradient id={`lineGradient-${index}`} x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#0071e3" />
                      <stop offset="100%" stopColor="#63b3ed" />
                    </linearGradient>
                  </defs>
                  <Line
                    type="natural"
                    dataKey="value"
                    stroke={`url(#lineGradient-${index})`}
                    strokeWidth={3}
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