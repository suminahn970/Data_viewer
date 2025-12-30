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
// ⭐️ [변경] Gemini 대신 GPT 서비스 임포트
import { generateDataInsight } from "@/lib/gemini"
import { 
  Trash2, 
  LayoutDashboard, 
  FileBarChart2, 
  XCircle, 
  BarChart3, 
  Download, 
  FileText, 
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

// ⭐️ 번역 맵 및 지능형 번역기 유지
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
};

const smartTranslate = (header: string): string => {
  const h = header.toUpperCase().trim();
  if (COLUMN_MAP[header]) return COLUMN_MAP[header];
  if (COLUMN_MAP[h]) return COLUMN_MAP[h];
  if (h.includes("GENDER")) return "성별";
  if (h.includes("AGE")) return "나이";
  return header;
};

export default function DashboardPage() {
  const [isClient, setIsClient] = useState(false)
  const [uploadedData, setUploadedData] = useState<any>(null)
  const [displayMetrics, setDisplayMetrics] = useState([])
  const [result, setResult] = useState<any>(null)
  const [currentFile, setCurrentFile] = useState<File | null>(null)
  const [rowLimit, setRowLimit] = useState("10")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isCleaning, setIsCleaning] = useState(false)
  const [filterValue, setFilterValue] = useState<string | null>(null)
  const [isTranslated, setIsTranslated] = useState(false);
  const [isSanitized, setIsSanitized] = useState(false);
  const [aiInsight, setAiInsight] = useState<string>(""); 

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
    const cleanHeaders = rawData.headers.map((h: string) => String(h || "").trim().replace(/^["']|["']$/g, '') || "column");
    const cleanRows = (rawData.preview_rows || [])
      .map((row: any) => {
        const rowArray = Array.isArray(row) ? row : cleanHeaders.map((h: string) => row[h]);
        return cleanHeaders.map((_: string, i: number) => String(rowArray[i] || "").trim().replace(/[\x00-\x1F\x7F-\x9F]/g, ""));
      })
      .filter((row: string[]) => row.some(cell => cell !== ""));
    return { ...rawData, headers: cleanHeaders, preview_rows: cleanRows };
  }, []);

  const analyzeFile = useCallback(async (file: File, targetColumn?: string, limit?: string) => {
    setIsAnalyzing(true); 
    setAiInsight(""); 
    
    const finalLimit = limit || rowLimit;
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("row_limit", finalLimit)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/analyze`, {
        method: "POST", body: formData,
      });
      
      const data = await response.json();
      const sanitizedResult = sanitizeRawData(data.result);
      
      if (sanitizedResult) {
        setResult(sanitizedResult)
        setDisplayMetrics(data.display_metrics || [])
        setIsSanitized(true)
        setUploadedData({ headers: sanitizedResult.headers, rows: sanitizedResult.preview_rows.slice(0, 10), fileName: file.name });
        
        // ✨ [GPT 연동] 데이터 로드 후 GPT 인사이트 호출
        try {
          const insight = await generateDataInsight(sanitizedResult.headers, sanitizedResult.preview_rows);
          setAiInsight(insight);
        } catch (aiError) {
          console.error("GPT Insight Failed", aiError);
        }

        localStorage.setItem('dash_result', JSON.stringify(sanitizedResult));
        localStorage.setItem('dash_filename', file.name);
      }
    } catch (error) { 
      alert("파일 로드 실패"); 
    } finally { setIsAnalyzing(false) }
  }, [rowLimit, sanitizeRawData])

  useEffect(() => { setIsClient(true) }, [])

  if (!isClient) return <div className="min-h-screen bg-white" />

  return (
    <div className="flex min-h-screen bg-white text-left font-sans">
      <Sidebar />
      <main className="flex-1 overflow-auto bg-[#F7F9FC]">
        <div className="mx-auto max-w-[1400px] px-12 py-10">
          <div className="space-y-8">
            <header className="flex justify-between items-center bg-white p-8 rounded-2xl shadow-sm border border-[#E5E9F0]">
                <div className="flex-1 text-left">
                    <div className="flex items-center gap-3 mb-4 justify-start">
                        <LayoutDashboard className="w-6 h-6 text-[#0066FF]" />
                        <h1 className="text-2xl font-semibold text-[#1A1F36] tracking-tight text-left">데이터 분석 대시보드</h1>
                    </div>
                    <FileUploadZone onDataUploaded={setUploadedData} onFileSelected={(file) => { setCurrentFile(file); analyzeFile(file); }} />
                </div>
            </header>

            {isAnalyzing ? (
              <div className="py-40 text-center space-y-6">
                <Sparkles className="w-16 h-16 text-[#0066FF] animate-pulse mx-auto" />
                <p className="text-xl font-semibold text-[#1A1F36]">데이터 분석 및 AI 인사이트 생성 중...</p>
              </div>
            ) : result && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-1000">
                <KpiMetrics displayMetrics={displayMetrics} />
                
                {/* AI 요약 카드 */}
                {aiInsight && (
                  <section className="w-full bg-gradient-to-r from-[#0066FF] to-[#0052CC] text-white p-8 rounded-2xl shadow-lg flex items-center gap-6 animate-in zoom-in-95 duration-700">
                    <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                      <Sparkles className="w-7 h-7 text-white" />
                    </div>
                    <div className="text-left flex-1">
                      <p className="text-xs font-semibold text-white/80 uppercase tracking-wider mb-2">AI 데이터 인사이트</p>
                      <h3 className="text-lg font-semibold leading-relaxed text-white">"{aiInsight.trim()}"</h3>
                    </div>
                  </section>
                )}

                <section className="w-full">
                  <DataCleaningSection 
                    data={translatedUploadedData} result={translatedResult} isTranslated={isTranslated}
                    setIsTranslated={setIsTranslated} onCleanData={() => {}} isCleaning={isCleaning} 
                    rowLimit={rowLimit} onRowLimitChange={(v) => analyzeFile(currentFile!, undefined, v)}
                  />
                </section>

                <section className="space-y-4 w-full">
                  <div className="flex items-center gap-3 px-2 justify-start text-left">
                    <Layout className="w-5 h-5 text-[#0066FF]" />
                    <h3 className="text-lg font-semibold text-[#1A1F36]">AI 데이터 요약</h3>
                  </div>
                  <div className="w-full bg-white rounded-2xl shadow-sm border border-[#E5E9F0] relative text-left">
                    <VisualInsight headers={displayHeaders} previewRows={result.preview_rows} onElementClick={setFilterValue} activeFilter={filterValue} />
                  </div>
                </section>

                <section className="w-full"><SmartInsightsPanel data={translatedResult} result={translatedResult} /></section>
                
                <section className="bg-white rounded-2xl shadow-sm overflow-hidden border border-[#E5E9F0] text-left w-full">
                    <DataTable result={translatedResult} filterColumn={null} filterValue={filterValue} />
                </section>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}