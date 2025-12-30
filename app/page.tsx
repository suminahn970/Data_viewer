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
import { generateDataInsight } from "@/lib/gemini"
import { useToast } from "@/hooks/use-toast"
import { motion } from "framer-motion"
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

// 타입 정의
interface UploadedData {
  headers: string[];
  rows: string[][];
  fileName: string;
}

interface DataResult {
  headers: string[];
  preview_rows: string[][];
  total_rows?: number;
}

interface DisplayMetric {
  label: string;
  value: number;
  unit: string;
  feature: string | null;
}

export default function DashboardPage() {
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false)
  const [uploadedData, setUploadedData] = useState<UploadedData | null>(null)
  const [displayMetrics, setDisplayMetrics] = useState<DisplayMetric[]>([])
  const [result, setResult] = useState<DataResult | null>(null)
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

  const sanitizeRawData = useCallback((rawData: unknown): DataResult | null => {
    if (!rawData || typeof rawData !== 'object') return null;
    const data = rawData as { headers?: unknown; preview_rows?: unknown };
    
    if (!data.headers || !Array.isArray(data.headers)) return null;
    
    const cleanHeaders = (data.headers as unknown[]).map((h: unknown) => 
      String(h || "").trim().replace(/^["']|["']$/g, '') || "column"
    );
    
    if (!data.preview_rows || !Array.isArray(data.preview_rows)) {
      return { ...data, headers: cleanHeaders, preview_rows: [] } as DataResult;
    }
    
    const cleanRows = (data.preview_rows as unknown[])
      .map((row: unknown) => {
        const rowArray = Array.isArray(row) ? row : cleanHeaders.map(() => null);
        return cleanHeaders.map((_, i) => String(rowArray[i] || "").trim().replace(/[\x00-\x1F\x7F-\x9F]/g, ""));
      })
      .filter((row: string[]) => row.some(cell => cell !== ""));
      
    return { ...data, headers: cleanHeaders, preview_rows: cleanRows } as DataResult;
  }, []);

  const analyzeFile = useCallback(async (file: File, targetColumn?: string, limit?: string) => {
    setIsAnalyzing(true); 
    setAiInsight(""); 
    
    const finalLimit = limit || rowLimit;
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("row_limit", finalLimit)
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://data-viewer-zyxg.onrender.com';
      const response = await fetch(`${apiUrl}/analyze`, {
        method: "POST", 
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: '알 수 없는 오류' }));
        throw new Error(errorData.error || `서버 오류 (${response.status})`);
      }
      
      const data = await response.json() as { 
        result?: unknown; 
        display_metrics?: DisplayMetric[];
      };
      
      const sanitizedResult = sanitizeRawData(data.result);
      
      if (sanitizedResult) {
        setResult(sanitizedResult)
        setDisplayMetrics(data.display_metrics || [])
        setIsSanitized(true)
        setUploadedData({ 
          headers: sanitizedResult.headers, 
          rows: sanitizedResult.preview_rows.slice(0, 10), 
          fileName: file.name 
        });
        
        // ✨ [AI 인사이트] 데이터 로드 후 AI 인사이트 호출
        try {
          const insight = await generateDataInsight(sanitizedResult.headers, sanitizedResult.preview_rows);
          setAiInsight(insight);
        } catch (aiError) {
          // AI 인사이트 실패는 사용자에게 알리지 않음 (선택적 기능)
          console.error("AI 인사이트 생성 실패:", aiError);
        }

        // localStorage에 저장 (선택적 기능)
        try {
          localStorage.setItem('dash_result', JSON.stringify(sanitizedResult));
          localStorage.setItem('dash_filename', file.name);
        } catch (storageError) {
          console.warn("localStorage 저장 실패:", storageError);
        }

        toast({
          title: "파일 분석 완료",
          description: "데이터 분석이 성공적으로 완료되었습니다.",
        });
      } else {
        throw new Error('데이터 파싱에 실패했습니다.');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
      console.error("파일 분석 실패:", error);
      
      toast({
        title: "파일 분석 실패",
        description: errorMessage,
        variant: "destructive",
      });
    } finally { 
      setIsAnalyzing(false);
    }
  }, [rowLimit, sanitizeRawData, toast])

  useEffect(() => { setIsClient(true) }, [])

  if (!isClient) return <div className="min-h-screen bg-white" />

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 text-left font-sans">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-[1600px] px-8 py-12">
          {/* Header Section */}
          <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="mb-12"
          >
            <div className="glass-card rounded-3xl p-10 glass-card-hover">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center border border-primary/10">
                  <LayoutDashboard className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-slate-900 tracking-tight leading-tight mb-1">
                    인텔리전트 데이터 분석
                  </h1>
                  <p className="text-base text-slate-500 font-medium tracking-wide">
                    AI 기반 실시간 데이터 인사이트 플랫폼
                  </p>
                </div>
              </div>
              <FileUploadZone 
                onDataUploaded={setUploadedData} 
                onFileSelected={(file) => { setCurrentFile(file); analyzeFile(file); }} 
              />
            </div>
          </motion.header>

            {isAnalyzing ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="py-40 text-center space-y-6"
              >
                <Sparkles className="w-16 h-16 text-primary animate-pulse mx-auto" />
                <p className="text-2xl font-bold text-slate-800 tracking-tight">데이터 분석 및 AI 인사이트 생성 중...</p>
              </motion.div>
            ) : result && (
              <div className="space-y-6">
                {/* Bento Grid Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* KPI Metrics - Full Width */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                    className="lg:col-span-12"
                  >
                    <KpiMetrics displayMetrics={displayMetrics} />
                  </motion.div>

                  {/* Gemini AI Insight - Full Width with Special Styling */}
                  {aiInsight && (
                    <motion.section
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                      className="lg:col-span-12"
                    >
                      <div className="glass-card rounded-3xl p-10 apple-gradient apple-glow relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 opacity-50" />
                        <div className="relative flex items-center gap-8">
                          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border border-primary/20 backdrop-blur-sm">
                            <Sparkles className="w-10 h-10 text-primary animate-pulse" />
                          </div>
                          <div className="flex-1 text-left">
                            <p className="text-xs font-black text-primary/60 uppercase tracking-[0.3em] mb-3">
                              Gemini AI Analysis Report
                            </p>
                            <h3 className="text-2xl font-bold leading-relaxed text-slate-900 tracking-tight">
                              "{aiInsight.trim()}"
                            </h3>
                          </div>
                        </div>
                      </div>
                    </motion.section>
                  )}

                  {/* Data Cleaning Section - Left Column */}
                  <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="lg:col-span-6"
                  >
                    <DataCleaningSection 
                      data={translatedUploadedData || undefined} 
                      result={translatedResult || undefined} 
                      isTranslated={isTranslated}
                      setIsTranslated={setIsTranslated} 
                      onCleanData={() => {}} 
                      isCleaning={isCleaning} 
                      rowLimit={rowLimit} 
                      onRowLimitChange={(v) => currentFile && analyzeFile(currentFile, undefined, v)}
                    />
                  </motion.section>

                  {/* Smart Insights Panel - Right Column */}
                  {translatedResult && translatedUploadedData && (
                    <motion.section
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
                      className="lg:col-span-6"
                    >
                      <SmartInsightsPanel data={translatedUploadedData} result={translatedResult} />
                    </motion.section>
                  )}

                  {/* Visual Insight - Full Width */}
                  <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="lg:col-span-12"
                  >
                    {result && (
                      <VisualInsight 
                        headers={displayHeaders} 
                        previewRows={result.preview_rows} 
                        onElementClick={setFilterValue} 
                        activeFilter={filterValue} 
                      />
                    )}
                  </motion.section>

                  {/* Data Table - Full Width */}
                  <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className="lg:col-span-12"
                  >
                    {translatedResult && (
                      <DataTable 
                        result={translatedResult} 
                        filterColumn={null} 
                        filterValue={filterValue} 
                      />
                    )}
                  </motion.section>
                </div>
              </div>
            )}
        </div>
      </main>
    </div>
  )
}