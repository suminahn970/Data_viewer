"use client"

import { useState, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, X, Filter, ChevronDown } from "lucide-react" // ⭐️ ChevronDown 추가
import { Button } from "@/components/ui/button"

interface DataTableProps {
  result?: {
    headers: string[]
    preview_rows: (string | number)[][]
    total_rows?: number
  }
  filterColumn?: string | null
  filterValue?: string | null
}

export function DataTable({ result, filterColumn, filterValue }: DataTableProps) {
  const [searchQuery, setSearchQuery] = useState("")
  // ⭐️ [상태 추가] 현재 화면에 표시할 행의 제한 (초기값 100)
  const [displayLimit, setDisplayLimit] = useState(100)

  const filteredRows = useMemo(() => {
    if (!result || !result.preview_rows) return []
    let rows = result.preview_rows

    // 1. 차트 연동 필터
    if (filterColumn && filterValue) {
      const colIdx = result.headers.indexOf(filterColumn)
      if (colIdx !== -1) {
        rows = rows.filter((row) => String(row[colIdx]) === String(filterValue))
      }
    }

    // 2. 검색어 필터
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      rows = rows.filter((row) =>
        row.some((cell) => String(cell).toLowerCase().includes(query))
      )
    }
    return rows
  }, [result, searchQuery, filterColumn, filterValue])

  // ⭐️ [계산] 현재 필터링된 결과 중 displayLimit 만큼만 잘라서 노출
  const visibleRows = useMemo(() => {
    return filteredRows.slice(0, displayLimit)
  }, [filteredRows, displayLimit])

  // ⭐️ [계산] 더 보기 버튼 노출 여부
  const hasMore = filteredRows.length > displayLimit

  if (!result || !result.headers || !result.preview_rows) {
    return (
      <Card className="rounded-[32px] border-none bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Data Table</h2>
        <p className="text-slate-400 text-sm">데이터를 분석하면 여기에 표가 나타납니다.</p>
      </Card>
    )
  }

  const formatCellValue = (value: string | number): string => {
    if (typeof value === "number") return value.toLocaleString()
    const numValue = Number(value)
    if (!isNaN(numValue) && value !== "" && String(value).trim() !== "") return numValue.toLocaleString()
    return String(value)
  }

  return (
    <Card className="rounded-[32px] border-none bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <div className="p-8 border-b border-slate-50">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">상세 데이터 내역</h2>
            {filterValue && (
              <div className="flex items-center gap-2 bg-primary/5 text-primary text-[10px] font-bold px-3 py-1 rounded-full border border-primary/10 animate-in zoom-in-95">
                <Filter className="w-3 h-3" />
                <span>{filterColumn}: {filterValue}</span>
              </div>
            )}
          </div>
          
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            {/* ⭐️ 표시 개수 정보 갱신 */}
            Showing {Math.min(displayLimit, filteredRows.length).toLocaleString()} of {filteredRows.length.toLocaleString()} entries
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
          <Input
            placeholder="데이터 내 키워드 검색..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setDisplayLimit(100) // 검색 시에는 다시 100개로 리셋하여 성능 최적화
            }}
            className="pl-12 h-12 rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white transition-all shadow-none placeholder:text-slate-300"
          />
          {searchQuery && (
            <button onClick={() => { setSearchQuery(""); setDisplayLimit(100); }} className="absolute right-4 top-1/2 -translate-y-1/2 hover:text-primary transition-colors">
              <X className="h-4 w-4 text-slate-300" />
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto relative">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow className="hover:bg-transparent border-slate-100">
              {result.headers.map((header) => (
                <TableHead key={header} className="text-[11px] font-bold text-slate-400 py-4 uppercase tracking-tighter">
                  <div className="flex items-center gap-1.5">
                    {header}
                    {filterColumn === header && filterValue && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={result.headers.length} className="text-center py-20">
                  <div className="flex flex-col items-center gap-2 opacity-30">
                    <Search className="w-10 h-10 mb-2" />
                    <p className="text-sm font-bold">검색 결과가 없습니다</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              visibleRows.map((row, index) => (
                <TableRow key={index} className="hover:bg-slate-50/30 border-slate-50 transition-colors">
                  {row.map((cell, cellIndex) => (
                    <TableCell key={cellIndex} className="text-[11px] font-medium text-slate-600 py-4">
                      {formatCellValue(cell)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* ⭐️ [추가] 데이터 더 보기 버튼 영역 */}
        {hasMore && (
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white via-white/95 to-transparent flex items-end justify-center pb-8 pointer-events-none">
            <Button 
              onClick={() => setDisplayLimit(filteredRows.length)} 
              variant="outline"
              className="rounded-full px-10 h-14 border-slate-200 bg-white text-slate-600 font-bold shadow-lg hover:bg-slate-50 hover:text-primary transition-all pointer-events-auto group"
            >
              전체 데이터 {filteredRows.length.toLocaleString()}건까지 펼치기
              <ChevronDown className="ml-2 w-4 h-4 group-hover:translate-y-1 transition-transform" />
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}