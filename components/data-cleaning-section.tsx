"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { CheckCircle2 } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface DataCleaningSectionProps {
  data?: {
    headers: string[]
    rows: string[][]
    fileName: string
  }
  result?: {
    headers: string[]
    preview_rows: (string | number)[][]
    total_rows?: number
  }
}

export function DataCleaningSection({ data, result }: DataCleaningSectionProps) {
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(() => {
    const visibility: Record<string, boolean> = {}
    if (data?.headers) {
      data.headers.forEach((header) => {
        visibility[header] = true
      })
    }
    return visibility
  })

  const toggleColumn = (header: string) => {
    setColumnVisibility((prev) => ({
      ...prev,
      [header]: !prev[header],
    }))
  }

  const headers = data?.headers || []
  const visibleHeaders = headers.filter((h) => columnVisibility[h])
  const displayRows = data?.rows?.slice(0, 5) || []

  if (!data || !headers.length) return null

  return (
    <Card className="rounded-[32px] border-none bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden h-full flex flex-col">
      {/* ⭐️ 헤더 영역: KPI 카드와 선을 맞추기 위한 패딩 조정 */}
      <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <h2 className="text-md font-bold text-slate-900 tracking-tight">데이터 미리보기</h2>
          {result && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-500 border border-emerald-100">
              <CheckCircle2 className="w-3 h-3" />
              정제 완료
            </span>
          )}
        </div>
        <p className="text-[11px] text-slate-400 font-medium tracking-tight">상위 5개 샘플 데이터</p>
      </div>

      <div className="p-8 flex-1 flex flex-col">
        {/* 컬럼 설정 영역 */}
        <div className="mb-6">
          <h3 className="text-[11px] font-bold text-slate-300 mb-4 uppercase tracking-widest">Display Columns</h3>
          <div className="flex flex-wrap gap-2">
            {headers.map((header) => (
              <div
                key={header}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-slate-200 transition-all duration-200"
              >
                <Switch
                  checked={columnVisibility[header] !== false}
                  onCheckedChange={() => toggleColumn(header)}
                  className="scale-75 data-[state=checked]:bg-primary"
                />
                <span className="text-[11px] font-bold text-slate-600 tracking-tight">{header}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 테이블 영역: 하단 선을 맞추기 위해 flex-1 적용 */}
        <div className="rounded-2xl border border-slate-100 overflow-hidden bg-white flex-1">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="hover:bg-transparent border-slate-100">
                {visibleHeaders.map((header) => (
                  <TableHead key={header} className="text-[10px] font-bold text-slate-400 py-3 uppercase tracking-tighter">
                    {header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayRows.length > 0 ? (
                displayRows.map((row, rowIndex) => (
                  <TableRow key={rowIndex} className="hover:bg-slate-50/30 border-slate-50">
                    {visibleHeaders.map((header, cellIndex) => {
                      const headerIndex = headers.indexOf(header)
                      return (
                        <TableCell key={cellIndex} className="text-[11px] font-medium text-slate-700 py-3.5">
                          {row[headerIndex] || "-"}
                        </TableCell>
                      )
                    })}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={visibleHeaders.length} className="text-center py-12 text-xs text-slate-300">
                    표시할 데이터가 없습니다.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </Card>
  )
}