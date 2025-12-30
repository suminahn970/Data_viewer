"use client"

import { useState, useMemo, useEffect } from "react"
import { Card } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  ResponsiveContainer, Tooltip, Legend,
} from "recharts"
import { 
  Sparkles, BarChart3, TrendingUp, AlertCircle, 
  CheckCircle2, Info, ArrowUpRight, ArrowDownRight
} from "lucide-react"

interface VisualInsightProps {
  headers: string[]
  previewRows: (string | number)[][]
  onElementClick: (value: string | null) => void
  activeFilter: string | null
}

const COLORS = [
  "#0066FF", "#00A3FF", "#4D9EFF", "#7AB8FF",
  "#0052CC", "#003D99", "#002966", "#1A4DFF",
]

const parseToNumeric = (val: any): number => {
  if (typeof val === 'number') return val;
  if (!val || String(val).trim() === "") return 0;
  let str = String(val).trim();
  const isPercentage = str.endsWith('%');
  const cleanStr = str.replace(/[^0-9.-]/g, '');
  let num = parseFloat(cleanStr);
  if (isNaN(num)) return 0;
  return isPercentage ? num / 100 : num;
};

export function VisualInsight({ headers, previewRows, onElementClick, activeFilter }: VisualInsightProps) {
  const [xAxis, setXAxis] = useState<string>("")
  const [yAxis, setYAxis] = useState<string>("")
  const [aggType, setAggType] = useState<"avg" | "sum">("avg")
  const [chartType, setChartType] = useState<"bar" | "pie">("bar")

  const columnTypes = useMemo(() => {
    const numeric: string[] = []
    const categorical: string[] = []
    const identifiers: string[] = []

    headers.forEach((header, idx) => {
      const sample = previewRows.slice(0, 50).map(row => row[idx]).filter(v => v !== null && v !== "");
      
      const isNumeric = sample.length > 0 && sample.every(val => {
        const clean = String(val).replace(/[^0-9.-]/g, '');
        return clean !== "" && !isNaN(Number(clean));
      });
      
      if (isNumeric) {
        numeric.push(header)
      } else {
        const uniqueValues = new Set(sample).size;
        const uniqueRatio = uniqueValues / (sample.length || 1);
        if (uniqueRatio > 0.7) {
          identifiers.push(header)
        } else {
          categorical.push(header)
        }
      }
    })
    return { numeric, categorical, identifiers, recommendedX: categorical[0] || headers[0] }
  }, [headers, previewRows])

  useEffect(() => {
    if (headers.length > 0) {
      if (!headers.includes(xAxis)) setXAxis(columnTypes.recommendedX);
      if (!headers.includes(yAxis)) setYAxis(columnTypes.numeric[0] || "");
    }
  }, [headers, columnTypes, xAxis, yAxis])

  const chartData = useMemo(() => {
    if (!xAxis || !yAxis || headers.length === 0) return []
    const xIdx = headers.indexOf(xAxis); 
    const yIdx = headers.indexOf(yAxis)
    
    if (xIdx === -1 || yIdx === -1) return []
    
    const groups: Record<string, { total: number; count: number }> = {}
    previewRows.forEach(row => {
      const xVal = String(row[xIdx] || "N/A").trim();
      const yVal = parseToNumeric(row[yIdx]); 
      
      if (!groups[xVal]) groups[xVal] = { total: 0, count: 0 }
      groups[xVal].total += yVal; groups[xVal].count += 1
    })

    return Object.entries(groups)
      .map(([name, stat]) => ({
        name, value: aggType === "avg" ? Number((stat.total / (stat.count || 1)).toFixed(2)) : stat.total
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8) 
  }, [xAxis, yAxis, aggType, headers, previewRows])

  // AI 인사이트 생성
  const insights = useMemo(() => {
    if (chartData.length === 0) return []
    
    const insights = []
    const topItem = chartData[0]
    const total = chartData.reduce((sum, item) => sum + item.value, 0)
    const topPercentage = ((topItem.value / total) * 100).toFixed(1)
    
    // 주요 인사이트
    insights.push({
      type: "primary",
      icon: TrendingUp,
      title: "주요 발견",
      value: `${topItem.name}`,
      description: `전체의 ${topPercentage}%를 차지하며 가장 높은 비중을 보입니다.`,
      trend: "up"
    })

    // 통계 인사이트
    if (chartData.length > 1) {
      const avg = total / chartData.length
      const aboveAvg = chartData.filter(item => item.value > avg).length
      insights.push({
        type: "stat",
        icon: BarChart3,
        title: "평균 대비",
        value: `${aboveAvg}개 항목`,
        description: `평균값(${avg.toFixed(1)})을 초과하는 항목입니다.`,
        trend: aboveAvg > chartData.length / 2 ? "up" : "down"
      })
    }

    // 데이터 품질 인사이트
    if (previewRows.length > 0) {
      insights.push({
        type: "quality",
        icon: CheckCircle2,
        title: "데이터 품질",
        value: `${chartData.length}개 그룹`,
        description: `${previewRows.length}개 행에서 분석된 결과입니다.`,
        trend: "neutral"
      })
    }

    return insights
  }, [chartData, previewRows])

  return (
    <Card className="rounded-2xl border border-[#E5E9F0] bg-white p-8 shadow-sm">
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#0066FF]/10 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-[#0066FF]" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#1A1F36]">데이터 요약 분석</h3>
              <p className="text-xs text-[#6B7280] mt-0.5">AI 기반 핵심 인사이트</p>
            </div>
          </div>
        </div>

        {/* AI 인사이트 카드 그리드 */}
        {insights.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {insights.map((insight, idx) => {
              const Icon = insight.icon
              return (
                <div
                  key={idx}
                  className="bg-gradient-to-br from-white to-[#F7F9FC] p-5 rounded-xl border border-[#E5E9F0] hover:border-[#0066FF]/30 transition-all hover:shadow-md"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-8 h-8 bg-[#0066FF]/10 rounded-lg flex items-center justify-center">
                      <Icon className="w-4 h-4 text-[#0066FF]" />
                    </div>
                    {insight.trend === "up" && <ArrowUpRight className="w-4 h-4 text-[#10B981]" />}
                    {insight.trend === "down" && <ArrowDownRight className="w-4 h-4 text-[#EF4444]" />}
                    {insight.trend === "neutral" && <Info className="w-4 h-4 text-[#6B7280]" />}
                  </div>
                  <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-1">
                    {insight.title}
                  </p>
                  <p className="text-lg font-semibold text-[#1A1F36] mb-2">
                    {insight.value}
                  </p>
                  <p className="text-xs text-[#6B7280] leading-relaxed">
                    {insight.description}
                  </p>
                </div>
              )
            })}
          </div>
        )}

        {/* 차트 컨트롤 */}
        <div className="flex flex-wrap items-center gap-4 p-4 bg-[#F7F9FC] rounded-xl border border-[#E5E9F0]">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#0066FF]" />
            <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide">그룹화</p>
            <Select value={xAxis} onValueChange={setXAxis}>
              <SelectTrigger className="w-[160px] h-8 border-[#E5E9F0] bg-white text-sm font-medium">
                <SelectValue placeholder="항목 선택" />
              </SelectTrigger>
              <SelectContent>
                {columnTypes.categorical.map(col => (
                  <SelectItem key={col} value={col}>{col}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#0066FF]" />
            <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide">측정값</p>
            <Select value={yAxis} onValueChange={setYAxis}>
              <SelectTrigger className="w-[160px] h-8 border-[#E5E9F0] bg-white text-sm font-medium">
                <SelectValue placeholder="수치 선택" />
              </SelectTrigger>
              <SelectContent>
                {columnTypes.numeric.map(col => (
                  <SelectItem key={col} value={col}>{col}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => setChartType("bar")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                chartType === "bar"
                  ? "bg-[#0066FF] text-white shadow-sm"
                  : "bg-white text-[#6B7280] border border-[#E5E9F0] hover:bg-[#F7F9FC]"
              }`}
            >
              막대
            </button>
            <button
              onClick={() => setChartType("pie")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                chartType === "pie"
                  ? "bg-[#0066FF] text-white shadow-sm"
                  : "bg-white text-[#6B7280] border border-[#E5E9F0] hover:bg-[#F7F9FC]"
              }`}
            >
              원형
            </button>
          </div>
        </div>

        {/* 차트 영역 */}
        <div className="bg-[#F7F9FC] rounded-xl p-6 border border-[#E5E9F0]">
          {chartData.length > 0 ? (
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                {chartType === "pie" ? (
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: '12px',
                        border: '1px solid #E5E9F0',
                        backgroundColor: 'white',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      iconType="circle"
                      wrapperStyle={{ fontSize: '12px', color: '#6B7280' }}
                    />
                  </PieChart>
                ) : (
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E9F0" opacity={0.5} />
                    <XAxis
                      dataKey="name"
                      fontSize={12}
                      fontWeight={500}
                      tick={{ fill: "#6B7280" }}
                      axisLine={false}
                      tickLine={false}
                      dy={10}
                    />
                    <YAxis
                      fontSize={12}
                      fontWeight={500}
                      tick={{ fill: "#6B7280" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: '#F7F9FC', radius: 8 }}
                      contentStyle={{
                        borderRadius: '12px',
                        border: '1px solid #E5E9F0',
                        backgroundColor: 'white',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      }}
                    />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="#0066FF">
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[400px] flex items-center justify-center text-[#6B7280]">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 text-[#9CA3AF] mx-auto mb-3" />
                <p className="text-sm font-medium">유효한 데이터를 선택해주세요</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
