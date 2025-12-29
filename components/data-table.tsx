"use client"

import { useState, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, X } from "lucide-react" // ⭐️ X 아이콘 추가
import { Button } from "@/components/ui/button"

// ⭐️ Props 확장: filterColumn, filterValue 추가
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

  // ⭐️ 검색어 필터와 차트 클릭 필터를 동시에 적용
  const filteredRows = useMemo(() => {
    if (!result || !result.preview_rows) return []
    
    let rows = result.preview_rows

    // 1. 차트 클릭 필터 적용 (차트에서 특정 항목을 선택했을 때)
    if (filterColumn && filterValue) {
      const colIdx = result.headers.indexOf(filterColumn)
      if (colIdx !== -1) {
        rows = rows.filter((row) => String(row[colIdx]) === String(filterValue))
      }
    }

    // 2. 검색어 필터 적용
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      rows = rows.filter((row) =>
        row.some((cell) => String(cell).toLowerCase().includes(query))
      )
    }

    return rows
  }, [result, searchQuery, filterColumn, filterValue])

  if (!result || !result.headers || !result.preview_rows) {
    return (
      <Card className="rounded-[24px] border border-[#d2d2d7] shadow-sm">
        <div className="p-8">
          <h2 className="text-lg font-semibold text-[#1d1d1f] mb-6">Data Table</h2>
          <p className="text-[#86868b]">데이터가 없습니다. CSV 파일을 업로드해주세요.</p>
        </div>
      </Card>
    )
  }

  const formatCellValue = (value: string | number): string => {
    if (typeof value === "number") {
      return value.toLocaleString()
    }
    const numValue = Number(value)
    if (!isNaN(numValue) && value !== "" && String(value).trim() !== "") {
      return numValue.toLocaleString()
    }
    return String(value)
  }

  return (
    <Card className="rounded-[24px] border border-[#d2d2d7] shadow-sm animate-in fade-in duration-700">
      <div className="p-8 border-b border-[#d2d2d7]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-[#1d1d1f]">Data Table</h2>
          {/* ⭐️ 필터가 걸려있을 때 상태 표시 */}
          {filterValue && (
            <div className="flex items-center gap-2 bg-primary/5 text-primary text-xs px-3 py-1.5 rounded-full border border-primary/10">
              <span className="font-medium">"{filterValue}"</span> 데이터만 표시 중
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#86868b]" />
            <Input
              placeholder="데이터 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-[12px] border-[#d2d2d7]"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="h-4 w-4 text-[#86868b]" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="p-8 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-[#d2d2d7]">
              {result.headers.map((header) => (
                <TableHead key={header} className="text-[#86868b] font-semibold whitespace-nowrap">
                  {header}
                  {filterColumn === header && filterValue && " 📍"}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={result.headers.length} className="text-center text-[#86868b] py-20">
                  조건에 맞는 데이터가 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              filteredRows.map((row, index) => (
                <TableRow key={index} className="hover:bg-[#f5f5f7]/50 border-[#d2d2d7] transition-colors">
                  {row.map((cell, cellIndex) => (
                    <TableCell key={cellIndex} className="text-[#1d1d1f] whitespace-nowrap">
                      {formatCellValue(cell)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <div className="mt-6 flex justify-between items-center text-sm text-[#86868b]">
          <div>
            총 <span className="text-[#1d1d1f] font-medium">{filteredRows.length.toLocaleString()}</span>건 발견
          </div>
          {result.total_rows && (
            <div className="italic">
              (전체 {result.total_rows.toLocaleString()}건 중)
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}