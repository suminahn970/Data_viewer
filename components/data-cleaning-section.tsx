"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CheckCircle2, Layout, Languages, Sparkles, Loader2, Database } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface DataCleaningSectionProps {
  data?: {
    headers: string[]
    rows: (string | number)[][]
    fileName: string
  }
  result?: {
    headers: string[]
    preview_rows: (string | number)[][]
    total_rows?: number
  }
  isTranslated: boolean;
  setIsTranslated: (val: boolean) => void;
  onCleanData: () => void;
  isCleaning: boolean;
  rowLimit: string;
  onRowLimitChange: (val: string) => void;
}

// ⭐️ 지능형 번역 맵 (긴 문장 및 대문자 대응)
const COLUMN_MAP: Record<string, string> = {
  "GENDER": "성별",
  "AGE": "나이",
  "MUTUAL FUNDS": "뮤추얼 펀드",
  "EQUITY MARKET": "주식 시장",
  "DEBENTURES": "채권",
  "GOVERNMENT BONDS": "정부 채권",
  "FIXED DEPOSITS": "정기 예금",
  "GOLD": "금 투자",
  "INVESTMENT": "투자 성향",
  "user_id": "사용자 ID",
};

// ⭐️ 긴 질문 문장에서 키워드를 추출해 번역하는 함수
const smartTranslate = (header: string): string => {
  const h = header.toUpperCase().trim();
  if (COLUMN_MAP[header]) return COLUMN_MAP[header];
  if (COLUMN_MAP[h]) return COLUMN_MAP[h];
  
  // 스크린샷 1.39.52에 나타난 긴 질문들 처리
  if (h.includes("GENDER")) return "성별";
  if (h.includes("AGE")) return "나이";
  if (h.includes("MUTUAL FUNDS")) return "뮤추얼 펀드";
  if (h.includes("EQUITY MARKET")) return "주식 시장";
  if (h.includes("DEBENTURES")) return "채권";
  if (h.includes("GOVERNMENT BONDS")) return "정부 채권";
  if (h.includes("FIXED DEPOSITS")) return "정기 예금";
  if (h.includes("GOLD")) return "금 투자";
  if (h.includes("INVEST")) return "투자 여부";
  
  return header;
};

export function DataCleaningSection({ 
  data, 
  result, 
  isTranslated, 
  setIsTranslated,
  onCleanData,
  isCleaning,
  rowLimit,
  onRowLimitChange
}: DataCleaningSectionProps) {
  const currentHeaders = result?.headers || data?.headers || []
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (currentHeaders.length > 0) {
      const visibility: Record<string, boolean> = {}
      currentHeaders.forEach((h) => {
        visibility[h] = true
      })
      setColumnVisibility(visibility)
    }
  }, [currentHeaders.length]);

  const toggleColumn = (header: string) => {
    setColumnVisibility((prev) => ({
      ...prev,
      [header]: !prev[header],
    }))
  }

  const visibleHeaders = currentHeaders.filter((h) => columnVisibility[h] !== false)
  const displayRows = result?.preview_rows?.slice(0, 5) || data?.rows?.slice(0, 5) || []

  if (!currentHeaders.length) return null

  return (
    <Card className="rounded-xl border border-[#E5E9F0] bg-white shadow-sm overflow-hidden h-full flex flex-col">
      <div className="px-6 py-5 border-b border-[#E5E9F0] flex justify-between items-center bg-white">
        <div className="flex items-center gap-4">
          <h2 className="text-base font-semibold text-[#1A1F36] tracking-tight text-left">데이터 관리</h2>
          
          <Button 
            onClick={onCleanData} 
            disabled={isCleaning || (!data && !result)}
            variant="outline" 
            className="h-8 border-[#0066FF]/20 text-[#0066FF] text-xs font-semibold rounded-lg px-4 hover:bg-[#0066FF]/5 transition-all shadow-sm disabled:opacity-50"
          >
            {isCleaning ? <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 mr-2" />}
            {isCleaning ? "정제 중..." : "정제 실행"}
          </Button>

          {result && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20">
              <CheckCircle2 className="w-3 h-3" />
              정제 완료
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#F7F9FC] px-3 py-1.5 rounded-lg border border-[#E5E9F0]">
            <Database className="w-3.5 h-3.5 text-[#6B7280]" />
            <span className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide text-left">범위</span>
            <Select value={rowLimit} onValueChange={onRowLimitChange}>
              <SelectTrigger className="w-[100px] h-7 border-none bg-transparent shadow-none font-semibold text-[#1A1F36] text-xs focus:ring-0 p-0 text-left">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-lg border-[#E5E9F0]">
                <SelectItem value="10" className="text-xs font-medium text-left">10개 샘플</SelectItem>
                <SelectItem value="50" className="text-xs font-medium text-left">50개 샘플</SelectItem>
                <SelectItem value="all" className="text-xs font-medium text-left">전체 데이터</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="h-6 w-[1px] bg-[#E5E9F0]" />

          <div className="flex items-center gap-2 bg-[#F7F9FC] px-3 py-1.5 rounded-lg border border-[#E5E9F0]">
            <Languages className={`w-3.5 h-3.5 ${isTranslated ? 'text-[#0066FF]' : 'text-[#6B7280]'}`} />
            <span className={`text-xs font-semibold ${isTranslated ? 'text-[#0066FF]' : 'text-[#6B7280]'} uppercase tracking-wide text-left`}>
              한글화
            </span>
            <Switch 
              checked={isTranslated} 
              onCheckedChange={setIsTranslated} 
              className="data-[state=checked]:bg-[#0066FF] scale-75 shadow-none"
            />
          </div>
        </div>
      </div>

      <div className="p-6 flex-1 flex flex-col">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4 text-left">
             <Layout className="w-3.5 h-3.5 text-[#6B7280]" />
             <h3 className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide text-left">표시 컬럼 설정</h3>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 text-left">
            {currentHeaders.map((header) => (
              <div
                key={header}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-[#E5E9F0] bg-[#F7F9FC] hover:bg-white hover:border-[#0066FF]/30 hover:shadow-sm transition-all duration-200 group"
              >
                <div className="flex items-center gap-2.5 overflow-hidden text-left">
                  <Switch
                    checked={columnVisibility[header] !== false}
                    onCheckedChange={() => toggleColumn(header)}
                    className="scale-75 data-[state=checked]:bg-[#0066FF]"
                  />
                  <span className="text-xs font-medium text-[#6B7280] group-hover:text-[#0066FF] truncate transition-colors text-left">
                    {isTranslated ? smartTranslate(header) : header}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-[#E5E9F0] overflow-hidden bg-white flex-1">
          <Table>
            <TableHeader className="bg-[#F7F9FC]">
              <TableRow className="hover:bg-transparent border-[#E5E9F0]">
                {visibleHeaders.map((header) => (
                  <TableHead key={header} className="text-xs font-semibold text-[#6B7280] py-3 uppercase tracking-wide text-left">
                    {isTranslated ? smartTranslate(header) : header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayRows.length > 0 ? (
                displayRows.map((row, rowIndex) => (
                  <TableRow key={rowIndex} className="hover:bg-[#F7F9FC] border-[#E5E9F0] transition-colors text-left">
                    {visibleHeaders.map((header, cellIndex) => {
                      const headerIndex = currentHeaders.indexOf(header)
                      return (
                        <TableCell key={cellIndex} className="text-xs font-medium text-[#1A1F36] py-3 text-left">
                          {row[headerIndex] !== undefined ? String(row[headerIndex]) : "-"}
                        </TableCell>
                      )
                    })}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={visibleHeaders.length} className="text-center py-12 text-xs text-[#6B7280] font-medium text-left">
                    데이터가 존재하지 않습니다.
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