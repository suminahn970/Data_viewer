"use client"

import { Sidebar } from "@/components/sidebar"
import { FileUploadZone } from "@/components/file-upload-zone"
import { KpiMetrics } from "@/components/kpi-metrics"
import { DataTable } from "@/components/data-table"
import { DataCleaningSection } from "@/components/data-cleaning-section"
import { SmartInsightsPanel } from "@/components/smart-insights-panel"
import { VisualInsight } from "@/components/visual-insight"
import { Button } from "@/components/ui/button"
import { useState, useEffect, useCallback, useMemo } from "react"
import { 
  Trash2, 
  LayoutDashboard, 
  FileBarChart2, 
  XCircle, 
  BarChart3, 
  Download, 
  FileText, 
  Share2, 
  ChevronDown,
  Layout,
  CheckCircle2,
  Sparkles
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// ⭐️ 번역 맵 및 지능형 번역기
const COLUMN_MAP: Record<string, string> = {
  "Project Code": "프로젝트 코드",
  "Title": "과제명",
  "Commitment in U.A": "지원 금액",
  "Country": "국가",
  "Status": "진행 상태",
  "Sector": "분야",
  "GENDER": "성별",
  "AGE": "나이",
  "user_id": "사용자 ID",
  "monthly_income_manwon": "월 소득(만원)",
  "monthly_premium_chonwon": "월 보험료(천원)",
  "avg_steps": "평균 걸음 수",
};

const smartTranslate = (header: string): string => {
  const h = header.toUpperCase().trim();
  if (COLUMN_MAP[header]) return COLUMN_MAP[header];
  if (COLUMN_MAP[h]) return COLUMN_MAP[h];
  if (h.includes("GENDER")) return "성별";
  if (h.includes("AGE")) return "나이";
  if (h.includes("INVEST")) return "투자 성향";
  if (h.includes("MUTUAL FUNDS")) return "뮤추얼 펀드";
  if (h.includes("EQUITY")) return "주식 시장";
  if (h.includes("DEBENTURES")) return "채권";
  if (h.includes("GOLD")) return "금 투자";
  return header;
};

export default function DashboardPage() {
  const [isClient, setIsClient] = useState(false)
  const [uploadedData, setUploadedData] = useState<any>(null)
  const [displayMetrics, setDisplayMetrics] = useState([])
  const [result, setResult] = useState<any>(null)
  const [analysisPresets, setAnalysisPresets] = useState([])
  const [selectedAnalysis, setSelectedAnalysis] = useState<any>(null)
  const [currentFile, setCurrentFile] = useState<File | null>(null)
  const [rowLimit, setRowLimit] = useState("10")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isCleaning, setIsCleaning] = useState(false)
  const [filterValue, setFilterValue] = useState<string | null>(null)
  const [isTranslated, setIsTranslated] = useState(false);
  const [isSanitized, setIsSanitized] = useState(false);

  const displayHeaders = useMemo(() => {
    const targetHeaders = result?.headers || uploadedData?.headers || [];
    if (!targetHeaders.length) return [];
    return isTranslated ? targetHeaders.map((h: string) => smartTranslate(h)) : targetHeaders;
  }, [result?.headers, uploadedData?.headers, isTranslated]);

  const translatedResult = useMemo(() => {
    if (!result) return null;
    return { ...result, headers: displayHeaders };
  }, [result, displayHeaders]);

  const translatedUploadedData = useMemo(() => {
    if (!uploadedData) return null;
    return { ...uploadedData, headers: displayHeaders };
  }, [uploadedData, displayHeaders]);

  const clearFilter = () => setFilterValue(null);

  const sanitizeRawData = useCallback((rawData: any) => {
    if (!rawData || !rawData.headers) return null;
    const cleanHeaders = rawData.headers.map((h: string, i: number) => {
      const trimmed = String(h || "").trim().replace(/^["']|["']$/g, '');
      return trimmed === "" ? `column_${i}` : trimmed;
    });
    const cleanRows = (rawData.preview_rows || [])
      .map((row: any) => {
        const rowArray = Array.isArray(row) ? row : cleanHeaders.map(h => row[h]);
        return cleanHeaders.map((_, i) => {
          const cell = rowArray[i];
          if (cell === null || cell === undefined || String(cell).trim() === "") return "0"; 
          return String(cell).trim().replace(/^["'“”‘’]|["'“”‘’]$/g, '').replace(/[\x00-\x1F\x7F-\x9F]/g, "");
        });
      })
      .filter((row: string[]) => row.some(cell => cell !== "0" && cell !== ""));
    return { ...rawData, headers: cleanHeaders, preview_rows: cleanRows };
  }, []);

  useEffect(() => {
    setIsClient(true)
    try {
      const savedResult = localStorage.getItem('dash_result')
      if (savedResult && savedResult !== "undefined") {
        const parsed = JSON.parse(savedResult);
        if (parsed && parsed.headers) setResult(parsed);
      }
    } catch (e) { localStorage.clear() }
  }, [])

  const handleReset = () => {
    if (confirm("모든 분석 기록을 초기화할까요?")) {
      localStorage.clear(); window.location.reload();
    }
  }

  const handleExportCSV = useCallback(() => {
    if (!result || !result.preview_rows) return;
    const headers = displayHeaders.join(",");
    const rows = result.preview_rows.map(row => 
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    ).join("\n");
    const csvContent = "\uFEFF" + headers + "\n" + rows;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Analysis_Report_${new Date().getTime()}.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  }, [result, displayHeaders]);

  const analyzeFile = useCallback(async (file: File, targetColumn?: string, limit?: string) => {
    setIsAnalyzing(true); setIsSanitized(false); setResult(null); 
    setFilterValue(null); setSelectedAnalysis(null);
    const finalLimit = limit || rowLimit;
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("row_limit", finalLimit)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://data-viewer-zyxg.onrender.com'}/analyze`, {
        method: "POST", body: formData,
      });
      if (!response.ok) throw new Error(`서버 응답 오류 (${response.status})`);
      const data = await response.json();
      const sanitizedResult = sanitizeRawData(data.result);
      if (!sanitizedResult) throw new Error("데이터 파싱 실패");
      setDisplayMetrics(data.display_metrics || [])
      setResult(sanitizedResult)
      setIsSanitized(true)
      setUploadedData({
        headers: sanitizedResult.headers,
        rows: sanitizedResult.preview_rows.slice(0, 10),
        fileName: file.name
      });
      localStorage.setItem('dash_result', JSON.stringify(sanitizedResult));
      localStorage.setItem('dash_filename', file.name);
      if (data.analysis_presets?.length > 0) setSelectedAnalysis(data.analysis_presets[0])
    } catch (error: any) {
      const errorMsg = error.message.includes("fetch") 
        ? "서버 연결에 실패했습니다 (CORS 문제)." 
        : error.message;
      alert(`파일 로드 실패: ${errorMsg}`);
    } finally { setIsAnalyzing(false) }
  }, [rowLimit, sanitizeRawData])

  const handleCleanData = async () => {
    if (!currentFile) return
    setIsCleaning(true)
    try {
      const formData = new FormData()
      formData.append("file", currentFile)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://data-viewer-zyxg.onrender.com'}/clean`, {
        method: "POST", body: formData
      });
      const data = await response.json()
      const cleanedFile = new File([data.cleaned_data], currentFile.name, { type: "text/csv" })
      setCurrentFile(cleanedFile); analyzeFile(cleanedFile);
    } catch (error) { console.error(error) } finally { setIsCleaning(false) }
  }

  if (!isClient) return <div className="min-h-screen bg-white" />

  return (
    <div className="flex min-h-screen bg-white text-left">
      <Sidebar />
      <main className="flex-1 overflow-auto bg-slate-50/50">
        <div className="mx-auto max-w-[1400px] px-12 py-10">
          <div className="space-y-10">
            {/* Header 섹션 */}
            <header className="flex justify-between items-center bg-white p-8 rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white">
                <div className="flex-1 text-left">
                    <div className="flex items-center gap-3 mb-2 justify-start">
                        <LayoutDashboard className="w-7 h-7 text-primary" />
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight text-left">인텔리전트 데이터 분석 플랫폼</h1>
                        {isSanitized && (
                          <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-black uppercase tracking-wider">Auto-Sanitized</span>
                          </div>
                        )}
                    </div>
                    <FileUploadZone 
                        onDataUploaded={setUploadedData} 
                        onFileSelected={(file) => { setCurrentFile(file); analyzeFile(file); }} 
                    />
                </div>
                {result && (
                  <div className="flex items-center gap-3 ml-8">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button className="rounded-2xl bg-slate-900 hover:bg-slate-800 text-white px-6 py-6 shadow-xl flex items-center gap-2">
                          <Download className="w-4 h-4" /> <span className="font-bold">내보내기</span> <ChevronDown className="w-3 h-3 opacity-50" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-2xl p-2 border-slate-100 shadow-2xl min-w-[200px] bg-white">
                        <DropdownMenuItem onClick={handleExportCSV} className="rounded-xl p-3 cursor-pointer hover:bg-slate-50">
                          <div className="flex items-center gap-3 text-left font-bold">
                            <div className="p-2 bg-emerald-50 rounded-lg"><FileText className="w-4 h-4 text-emerald-600" /></div>
                            <div><p className="text-xs">CSV 다운로드</p><p className="text-[10px] text-slate-400 font-medium">정제 완료 데이터</p></div>
                          </div>
                        </DropdownMenuItem>
                        <div className="h-[1px] bg-slate-100 my-1" />
                        <DropdownMenuItem onClick={handleReset} className="rounded-xl p-3 cursor-pointer hover:bg-red-50 text-red-600">
                          <div className="flex items-center gap-3"><Trash2 className="w-4 h-4" /><p className="text-xs font-bold">기록 초기화</p></div>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
            </header>

            {isAnalyzing ? (
              <div className="py-40 text-center space-y-6">
                <Sparkles className="w-16 h-16 text-primary animate-pulse mx-auto" />
                <p className="text-xl font-bold text-slate-800 text-left">데이터 수선 및 분석 중...</p>
              </div>
            ) : !result ? (
              <div className="flex flex-col items-center justify-center py-40 bg-white rounded-[40px] border-2 border-dashed border-slate-200">
                <FileBarChart2 className="w-14 h-14 text-slate-300 mb-6" />
                <h2 className="text-xl font-bold text-slate-800">분석할 파일을 업로드해 주세요</h2>
              </div>
            ) : (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-3 duration-1000">
                {/* 1. KPI 지표 섹션 */}
                <KpiMetrics displayMetrics={displayMetrics} />
                
                {/* 2. 데이터 관리 섹션 (Full Width) */}
                <section className="w-full">
                  <DataCleaningSection 
                    data={translatedUploadedData} 
                    result={translatedResult} 
                    isTranslated={isTranslated}
                    setIsTranslated={setIsTranslated}
                    onCleanData={handleCleanData}
                    isCleaning={isCleaning} 
                    rowLimit={rowLimit} 
                    onRowLimitChange={(v) => analyzeFile(currentFile!, undefined, v)}
                  />
                </section>

                {/* 3. 지능형 시각화 거울 (Full Width로 독립 확장) */}
                <section className="space-y-6 w-full">
                  <div className="flex items-center gap-3 px-2 justify-start">
                    <Layout className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-bold text-slate-900 text-left">지능형 시각화 거울</h3>
                  </div>
                  <div className="w-full min-h-[600px] bg-white p-10 rounded-[40px] shadow-[0_8px_40px_rgb(0,0,0,0.04)] border border-white relative text-left">
                    {filterValue && (
                        <div className="absolute top-10 right-10 flex items-center gap-3 px-4 py-2 bg-primary/5 border border-primary/10 rounded-2xl animate-in slide-in-from-top-2 z-10">
                            <span className="text-xs font-bold text-primary tracking-tight">필터링 중: {filterValue}</span>
                            <button onClick={clearFilter} className="text-slate-400 hover:text-primary"><XCircle className="w-4 h-4" /></button>
                        </div>
                    )}
                    <VisualInsight 
                      headers={displayHeaders} 
                      previewRows={result.preview_rows} 
                      onElementClick={setFilterValue} 
                      activeFilter={filterValue} 
                    />
                  </div>
                </section>

                {/* 4. 스마트 인사이트 패널 (차트 하단 Full Width로 배치) */}
                <section className="w-full">
                  <SmartInsightsPanel data={translatedResult} result={translatedResult} />
                </section>

                {/* 5. 데이터 테이블 섹션 (Full Width) */}
                <section className="bg-white rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden border border-slate-50 text-left w-full">
                    <DataTable 
                        result={translatedResult} 
                        filterColumn={selectedAnalysis?.column} 
                        filterValue={filterValue} 
                    />
                </section>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}