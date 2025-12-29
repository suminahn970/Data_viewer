"use client"

import { useState, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search } from "lucide-react"

interface DataTableProps {
  result?: {
    headers: string[]
    preview_rows: (string | number)[][]
    total_rows?: number
  }
}

export function DataTable({ result }: DataTableProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredRows = useMemo(() => {
    if (!result || !result.preview_rows) return []
    
    if (!searchQuery) return result.preview_rows

    const query = searchQuery.toLowerCase()
    return result.preview_rows.filter((row) =>
      row.some((cell) => String(cell).toLowerCase().includes(query))
    )
  }, [result, searchQuery])

  if (!result || !result.headers || !result.preview_rows) {
    return (
      <Card className="rounded-[24px] border border-[#d2d2d7] shadow-sm">
        <div className="p-8">
          <h2 className="text-lg font-semibold text-[#1d1d1f] mb-6">Data Table</h2>
          <p className="text-[#86868b]">No data available. Please upload a CSV file.</p>
        </div>
      </Card>
    )
  }

  const formatCellValue = (value: string | number): string => {
    if (typeof value === "number") {
      return value.toLocaleString()
    }
    // 숫자로 변환 가능한 문자열인지 확인
    const numValue = Number(value)
    if (!isNaN(numValue) && value !== "" && String(value).trim() !== "") {
      return numValue.toLocaleString()
    }
    return String(value)
  }

  return (
    <Card className="rounded-[24px] border border-[#d2d2d7] shadow-sm">
      <div className="p-8 border-b border-[#d2d2d7]">
        <h2 className="text-lg font-semibold text-[#1d1d1f] mb-6">Data Table</h2>

        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#86868b]" />
            <Input
              placeholder="Search data..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-[12px] border-[#d2d2d7]"
            />
          </div>
        </div>
      </div>

      <div className="p-8">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-[#d2d2d7]">
              {result.headers.map((header) => (
                <TableHead key={header} className="text-[#86868b] font-semibold">
                  {header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={result.headers.length} className="text-center text-[#86868b] py-8">
                  No data found
                </TableCell>
              </TableRow>
            ) : (
              filteredRows.map((row, index) => (
                <TableRow key={index} className="hover:bg-[#f5f5f7]/50 border-[#d2d2d7]">
                  {row.map((cell, cellIndex) => (
                    <TableCell key={cellIndex} className="text-[#1d1d1f]">
                      {formatCellValue(cell)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {result.total_rows && (
          <div className="mt-4 text-sm text-[#86868b]">
            Showing {filteredRows.length} of {result.total_rows.toLocaleString()} rows
          </div>
        )}
      </div>
    </Card>
  )
}
