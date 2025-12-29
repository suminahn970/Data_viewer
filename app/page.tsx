"use client"

import { Sidebar } from "@/components/sidebar"
import { FileUploadZone } from "@/components/file-upload-zone"
import { KpiMetrics } from "@/components/kpi-metrics"
import { DataTable } from "@/components/data-table"
import { DataCleaningSection } from "@/components/data-cleaning-section"
import { SmartInsightsPanel } from "@/components/smart-insights-panel"
import { VisualInsight } from "@/components/visual-insight"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useState, useEffect, useCallback } from "react"
import { Sparkles, Trash2, LayoutDashboard, FileBarChart2, XCircle } from "lucide-react" // ⭐️ XCircle 아이콘 추가

export default function DashboardPage() {
  const [isClient, setIsClient] = useState(false)
  const [uploadedData, setUploadedData] = useState<any>(null)
  const [displayMetrics, setDisplayMetrics] = useState([])
  const [result, setResult] = useState<any>(null)
  const [analysisPresets, setAnalysisPresets] = useState([])
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null)
  const [selectedAnalysis, setSelectedAnalysis] = useState<any>(null)
  const [currentFile, setCurrentFile] = useState<File | null>(null)
  const [rowLimit, setRowLimit] = useState("10")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isCleaning, setIsCleaning] = useState(false)
  const [filterValue, setFilterValue] = useState<string | null>(null)

  // ⭐️ [신규] 필터 해제 핸들러
  const clearFilter = () => setFilterValue(null);

  useEffect(() => {
    setIsClient(true)
    try {
      const savedResult = localStorage.getItem('dash_result')
      const savedMetrics = localStorage.getItem('dash_metrics')
      const savedPresets = localStorage.getItem('dash_presets')
      const savedFileName = localStorage.getItem('dash_filename')

      if (savedResult && savedResult !== "undefined") {
        const parsedResult = JSON.parse(savedResult)
        if (parsedResult && parsedResult.headers) {
          setResult(parsedResult)
          if (savedMetrics) setDisplayMetrics(JSON.parse(savedMetrics))
          if (savedPresets) setAnalysisPresets(JSON.parse(savedPresets))
          if (savedFileName) setUploadedData({ name: savedFileName, headers: parsedResult.headers })
        }
      }
    } catch (e) {
      localStorage.clear()
    }
  }, [])

  const handleReset = () => {
    if (confirm("모든 데이터를 초기화할까요?")) {
      localStorage.clear()
      window.location.reload()
    }
  }

  const analyzeFile = useCallback(async (file: File, targetColumn?: string, limit?: string) => {
    setIsAnalyzing(true)
    setResult(null) 
    setSelectedAnalysis(null)
    setFilterValue(null)
    
    const finalLimit = limit || rowLimit
    if (!targetColumn) setSelectedPreset(null)

    try {
      const formData = new FormData()
      formData.append("file", file)
      if (targetColumn) formData.append("target_column", targetColumn)
      formData.append("row_limit", finalLimit)

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://data-viewer-zyxg.onrender.com'}/analyze`, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) throw new Error("Analysis failed")
      const data = await response.json()
      
      setDisplayMetrics(data.display_metrics || [])
      setResult(data.result)
      if (data.analysis_presets) setAnalysisPresets(data.analysis_presets)
      
      localStorage.setItem('dash_metrics', JSON.stringify(data.display_metrics))
      localStorage.setItem('dash_result', JSON.stringify(data.result))
      localStorage.setItem('dash_presets', JSON.stringify(data.analysis_presets))
      localStorage.setItem('dash_filename', file.name)

      if (targetColumn) {
        setSelectedPreset(targetColumn)
        const preset = data.analysis_presets?.find((p: any) => p.column === targetColumn)
        setSelectedAnalysis(preset || null)
      }
    } catch (error) {
      console.error("분석 오류:", error)
    } finally {
      setIsAnalyzing(false)
    }
  }, [rowLimit])

  const handleCleanData = async () => {
    if (!currentFile) {
        alert("파일 객체가 없습니다. 파일을 다시 업로드해 주세요.")
        return
    }
    setIsCleaning(true)
    try {
      const formData = new FormData()
      formData.append("file", currentFile)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://data-viewer-zyxg.onrender.com'}/clean`, {
        method: "POST",
        body: formData,
      })
      const data = await response.json()
      alert(`✨ 정제 완료! (중복 ${data.removed_duplicates}건, 결측치 ${data.fixed_missing}건)`)
      const cleanedFile = new File([data.cleaned_data], currentFile.name, { type: "text/csv" })
      setCurrentFile(cleanedFile)
      analyzeFile(cleanedFile)
    } catch (error) {
      console.error("정제 실패:", error)
    } finally { setIsCleaning(false) }
  }

  const handleRowLimitChange = async (value: string) => {
    setRowLimit(value)
    if (currentFile) {
      await analyzeFile(currentFile, selectedPreset || undefined, value)
    }
  }

  if (!isClient) return <div className="min-h-screen bg-white" />

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <main className="flex-1 overflow-auto bg-slate-50/50">
        <div className="mx-auto max-w-[1400px] px-12 py-10">
          <div className="space-y-10">
            <div className="flex justify-between items-end bg-white p-8 rounded-[32px] border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3 tracking-tight">
                        <LayoutDashboard className="w-7 h-7 text-primary" />
                        인텔리전트 데이터 대시보드
                    </h1>
                    <FileUploadZone 
                        onDataUploaded={setUploadedData} 
                        onFileSelected={(file) => { setCurrentFile(file); analyzeFile(file); }} 
                    />
                </div>
                {result && (
                    <Button variant="ghost" size="sm" onClick={handleReset} className="mb-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all">
                        <Trash2 className="w-4 h-4 mr-2" /> 기록 초기화
                    </Button>
                )}
            </div>

            {isAnalyzing || isCleaning ? (
              <div className="space-y-10 animate-pulse">
                <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
                  <div className="h-80 bg-slate-200 rounded-[32px]" />
                  <div className="h-80 bg-slate-200 rounded-[32px]" />
                </div>
                <div className="grid grid-cols-4 gap-6">
                  {[1, 2, 3, 4].map(i => <div key={i} className="h-40 bg-slate-200 rounded-[32px]" />)}
                </div>
              </div>
            ) : !result ? (
              <div className="flex flex-col items-center justify-center py-40 bg-white rounded-[40px] border-2 border-dashed border-slate-200 shadow-sm transition-all hover:border-primary/20">
                <div className="bg-primary/5 p-8 rounded-full mb-8">
                    <FileBarChart2 className="w-14 h-14 text-primary animate-bounce" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-3 tracking-tight">분석할 CSV 파일을 업로드해 주세요</h2>
                <p className="text-slate-500 text-center max-w-sm leading-relaxed mb-10">AI 자동 데이터 정제 및 시각화 인사이트를 제공합니다.</p>
              </div>
            ) : (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-3 duration-1000">
                <div className="grid gap-6 lg:grid-cols-[1fr_400px] items-stretch">
                  <DataCleaningSection data={uploadedData} result={result} />
                  <SmartInsightsPanel data={uploadedData} result={result} />
                </div>

                <div className="flex flex-wrap items-center gap-4 bg-white p-5 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-50">
                  <Button onClick={handleCleanData} variant="outline" className="border-primary/20 text-primary font-bold rounded-xl px-8 hover:bg-primary/5">
                    <Sparkles className="w-4 h-4 mr-2" /> 스마트 데이터 정제
                  </Button>
                  <div className="h-8 w-[1px] bg-slate-100 mx-2" />
                  <div className="flex flex-wrap gap-2.5">
                    {analysisPresets.map((preset: any) => (
                      <Button
                        key={preset.column}
                        variant={selectedPreset === preset.column ? "default" : "secondary"}
                        className="rounded-xl font-bold px-5"
                        onClick={() => {
                          if (selectedPreset !== preset.column) {
                            if (currentFile) analyzeFile(currentFile, preset.column)
                            else {
                              setSelectedPreset(preset.column)
                              setSelectedAnalysis(analysisPresets.find((p: any) => p.column === preset.column))
                            }
                          } else {
                            setSelectedPreset(null); setSelectedAnalysis(null); setFilterValue(null);
                          }
                        }}
                      >
                        {preset.label}
                      </Button>
                    ))}
                  </div>
                  <div className="ml-auto flex items-center gap-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sampling</span>
                    <Select value={rowLimit} onValueChange={handleRowLimitChange}>
                      <SelectTrigger className="w-[140px] h-10 border-slate-100 rounded-xl font-bold text-slate-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10개 샘플</SelectItem>
                        <SelectItem value="50">50개 샘플</SelectItem>
                        <SelectItem value="100">100개 샘플</SelectItem>
                        <SelectItem value="all">전체 데이터</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <KpiMetrics displayMetrics={displayMetrics} />
                
                {selectedAnalysis && (
                  <div className="w-full min-h-[500px] bg-white p-10 rounded-[40px] shadow-[0_8px_40px_rgb(0,0,0,0.04)] animate-in zoom-in-95 duration-700 space-y-6">
                    {/* ⭐️ 필터 알림 배지 추가 */}
                    {filterValue && (
                        <div className="flex items-center gap-3 px-4 py-2 bg-primary/5 border border-primary/10 rounded-2xl animate-in slide-in-from-top-2">
                            <span className="text-xs font-bold text-primary tracking-tight">Active Chart Filter:</span>
                            <span className="px-3 py-1 bg-primary text-white text-[10px] font-bold rounded-full">
                                {selectedAnalysis.column} = {filterValue}
                            </span>
                            <button onClick={clearFilter} className="ml-auto text-slate-400 hover:text-primary transition-colors">
                                <XCircle className="w-5 h-5" />
                            </button>
                        </div>
                    )}
                    <VisualInsight 
                        selectedAnalysis={selectedAnalysis} 
                        headers={result.headers} 
                        previewRows={result.preview_rows} 
                        onElementClick={setFilterValue} 
                        activeFilter={filterValue} 
                    />
                  </div>
                )}
                <div className="bg-white rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
                    <DataTable 
                        result={result} 
                        filterColumn={selectedAnalysis?.column} 
                        filterValue={filterValue} 
                    />
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}