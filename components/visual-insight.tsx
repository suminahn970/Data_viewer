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
  Sparkles, BarChart3, Tags, Fingerprint, PieChart as PieIcon, 
  SortAsc, SortDesc, HelpCircle, CheckCircle2 
} from "lucide-react"

interface VisualInsightProps {
  headers: string[]
  previewRows: (string | number)[][]
  onElementClick: (value: string | null) => void
  activeFilter: string | null
}

const COLORS = [
  "hsl(217, 91%, 60%)", "hsl(142, 76%, 36%)", "hsl(38, 92%, 50%)",
  "hsl(0, 72%, 51%)", "hsl(262, 83%, 58%)", "hsl(201, 96%, 32%)",
  "hsl(24, 95%, 53%)", "hsl(280, 67%, 64%)",
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

const TYPE_BASED_GUIDES = {
  categorical: [
    "각 그룹 간의 수치 격차가 전략적으로 중요한 의미를 갖나요?",
    "상위 항목들이 전체 결과의 대부분을 점유하고 있지는 않은지 확인해보세요.",
    "그룹의 개수가 너무 많다면 유사한 항목끼리 묶어서 분석이 필요할 수 있습니다."
  ],
  default: [
    "이 데이터가 비즈니스 의사결정에 어떤 직접적인 힌트를 주나요?",
    "이상치(Outlier)를 제외했을 때 결과가 드라마틱하게 변하는지 체크해보세요."
  ]
};

export function VisualInsight({ headers, previewRows, onElementClick, activeFilter }: VisualInsightProps) {
  const [xAxis, setXAxis] = useState<string>("")
  const [yAxis, setYAxis] = useState<string>("")
  const [aggType, setAggType] = useState<"avg" | "sum">("avg")
  const [chartType, setChartType] = useState<"bar" | "pie">("bar")
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc")

  // ⭐️ [해결 1] 번역된 헤더를 기반으로 변수 타입을 재분류
  const columnTypes = useMemo(() => {
    const numeric: string[] = []
    const categorical: string[] = []
    const identifiers: string[] = []

    headers.forEach((header, idx) => {
      // previewRows는 원본 데이터이므로 idx를 통해 직접 접근
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

  // ⭐️ [해결 2] 번역 상태(headers)가 바뀔 때 선택된 축 이름도 번역된 이름으로 강제 업데이트
  useEffect(() => {
    if (headers.length > 0) {
      // 현재 xAxis가 headers 리스트에 없다면(언어가 바뀌었다면) 추천값으로 초기화
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
      .sort((a, b) => sortOrder === "desc" ? b.value - a.value : a.value - b.value)
      .slice(0, 10) 
  }, [xAxis, yAxis, aggType, headers, previewRows, sortOrder])

  const currentGuides = useMemo(() => columnTypes.categorical.includes(xAxis) ? TYPE_BASED_GUIDES.categorical : TYPE_BASED_GUIDES.default, [xAxis, columnTypes]);

  return (
    <Card className="rounded-[40px] border-none bg-white p-10 shadow-[0_8px_40px_rgb(0,0,0,0.04)] animate-in fade-in duration-700">
      <div className="space-y-10">
        <div className="flex flex-wrap items-center gap-6 p-6 bg-slate-50/50 rounded-[32px] border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="bg-white p-2.5 rounded-xl shadow-sm"><Tags className="w-4 h-4 text-primary" /></div>
            <div className="space-y-0.5 text-left">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-left">그룹화 기준 (X)</p>
              <Select value={xAxis} onValueChange={setXAxis}>
                <SelectTrigger className="w-[180px] h-9 border-none bg-transparent shadow-none font-bold text-slate-800 p-0 focus:ring-0 text-left">
                  <SelectValue placeholder="항목 선택" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-slate-100 text-left">
                  {columnTypes.categorical.map(col => (
                    <SelectItem key={col} value={col} className="rounded-xl font-medium text-left">
                      <span className="flex items-center gap-2"><span className="text-[9px] bg-emerald-50 text-emerald-500 px-1.5 py-0.5 rounded font-bold">가</span>{col}</span>
                    </SelectItem>
                  ))}
                  {columnTypes.identifiers.map(col => (
                    <SelectItem key={col} value={col} className="rounded-xl font-medium opacity-60 text-left">
                      <span className="flex items-center gap-2"><Fingerprint className="w-3 h-3 text-slate-300" />{col}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white p-2.5 rounded-xl shadow-sm"><BarChart3 className="w-4 h-4 text-primary" /></div>
            <div className="space-y-0.5 text-left">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-left">측정 지표 (Y)</p>
              <Select value={yAxis} onValueChange={setYAxis}>
                <SelectTrigger className="w-[180px] h-9 border-none bg-transparent shadow-none font-bold text-slate-800 p-0 focus:ring-0 text-left">
                  <SelectValue placeholder="수치 선택" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-slate-100 text-left">
                  {columnTypes.numeric.map(col => (
                    <SelectItem key={col} value={col} className="rounded-xl font-medium text-left">
                      <span className="flex items-center gap-2"><span className="text-[9px] bg-blue-50 text-blue-500 px-1.5 py-0.5 rounded font-bold">#</span>{col}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-2xl shadow-sm border border-slate-50">
            <button onClick={() => setChartType("bar")} className={`p-2 rounded-xl transition-all ${chartType === "bar" ? "bg-primary text-white shadow-md" : "text-slate-300 hover:text-slate-500"}`}><BarChart3 className="w-4 h-4" /></button>
            <button onClick={() => setChartType("pie")} className={`p-2 rounded-xl transition-all ${chartType === "pie" ? "bg-primary text-white shadow-md" : "text-slate-300 hover:text-slate-500"}`}><PieIcon className="w-4 h-4" /></button>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_320px] gap-8 min-h-[500px]">
          <div className="space-y-8 flex flex-col min-w-0">
            <div className="bg-blue-50/40 border border-blue-100/50 rounded-[32px] p-8 flex items-start gap-5 text-left">
              <div className="bg-blue-500/10 p-3 rounded-2xl text-left"><Sparkles className="w-6 h-6 text-blue-600" /></div>
              <div className="space-y-1.5 text-left">
                <p className="text-[11px] font-black text-blue-400 uppercase tracking-[0.2em] text-left">Insight Discovery</p>
                <h4 className="text-xl font-bold text-slate-900 leading-tight text-left">{xAxis} 기반 시각화 분석</h4>
                <p className="text-sm text-slate-500 font-medium leading-relaxed text-left">언어 설정을 반영하여 실시간으로 차트 레이블을 재매핑했습니다.</p>
              </div>
            </div>

            <div className="h-[450px] w-full bg-slate-50/30 rounded-[32px] p-8 border border-slate-50 relative">
              <ResponsiveContainer width="100%" height="100%" key={headers.join(',') + chartType}>
                {chartType === "pie" ? (
                  <PieChart>
                    <Pie data={chartData} cx="50%" cy="50%" innerRadius={80} outerRadius={140} paddingAngle={5} dataKey="value">
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }} />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                ) : (
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                    <XAxis dataKey="name" fontSize={11} fontWeight={700} tick={{ fill: "#94a3b8" }} axisLine={false} tickLine={false} dy={10} />
                    <YAxis fontSize={11} fontWeight={700} tick={{ fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: '#f1f5f9', radius: 12 }} contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey="value" radius={[12, 12, 12, 12]} barSize={40}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                )}
              </ResponsiveContainer>
              {chartData.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-slate-300 font-bold text-left">유효한 수치 데이터를 선택해주세요.</div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)] flex flex-col h-full text-left">
            <div className="flex items-center gap-2 mb-8 text-slate-900 text-left font-bold">
              <HelpCircle className="w-5 h-5 text-primary text-left" />
              분석 가이드
            </div>
            <div className="space-y-5 flex-1 text-left">
              {currentGuides.map((guide, idx) => (
                <div key={idx} className="bg-slate-50/50 p-4 rounded-2xl border border-slate-50 text-left">
                  <div className="flex gap-3 text-left">
                    <CheckCircle2 className="w-4 h-4 text-slate-200 shrink-0 mt-0.5 text-left" />
                    <p className="text-[12px] text-slate-600 font-semibold leading-relaxed text-left">{guide}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}