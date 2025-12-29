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
import { Sparkles, Trash2, LayoutDashboard, FileBarChart2 } from "lucide-react" // ✨ 아이콘 추가

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

  useEffect(() => {
    setIsClient(true)
    try {
      const savedMetrics = localStorage.getItem('dash_metrics')
      const savedResult = localStorage.getItem('dash_result')
      const savedPresets = localStorage.getItem('dash_presets')
      const savedFileName = localStorage.getItem('dash_filename')

      if (savedMetrics && savedResult && savedPresets && savedMetrics !== "undefined") {
        setDisplayMetrics(JSON.parse(savedMetrics))
        setResult(JSON.parse(savedResult))
        setAnalysisPresets(JSON.parse(savedPresets))
        if (savedFileName) setUploadedData({ name: savedFileName })
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
        alert("파일 객체가 없습니다. 파일을 다시 업로드한 후 정제를 시도해 주세요.")
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
    } else {
      alert("파일을 다시 업로드하시면 데이터 범위를 조절할 수 있습니다.")
    }
  }

  if (!isClient) return <div className="min-h-screen bg-white" />

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <main className="flex-1 overflow-auto bg-slate-50/50">
        <div className="mx-auto max-w-[1400px] px-12 py-10">
          <div className="space-y-8">
            {/* 상단 헤더 섹션 */}
            <div className="flex justify-between items-end bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <LayoutDashboard className="w-6 h-6 text-primary" />
                        인텔리전트 데이터 대시보드
                    </h1>
                    <FileUploadZone 
                        onDataUploaded={setUploadedData} 
                        onFileSelected={(file) => { setCurrentFile(file); analyzeFile(file); }} 
                    />
                </div>
                {result && (
                    <Button variant="ghost" size="sm" onClick={handleReset} className="mb-2 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all">
                        <Trash2 className="w-4 h-4 mr-2" /> 기록 초기화
                    </Button>
                )}
            </div>

            {/* 메인 뷰포트 영역 */}
            {isAnalyzing || isCleaning ? (
              /* ⭐️ [Loading State] 스켈레톤 UI */
              <div className="space-y-8 animate-pulse">
                <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
                  <div className="h-64 bg-slate-200 rounded-2xl" />
                  <div className="h-64 bg-slate-200 rounded-2xl" />
                </div>
                <div className="flex gap-4">
                  {[1, 2, 3, 4].map(i => <div key={i} className="h-10 w-28 bg-slate-200 rounded-xl" />)}
                </div>
                <div className="grid grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-slate-200 rounded-2xl" />)}
                </div>
                <div className="h-96 bg-slate-200 rounded-2xl" />
              </div>
            ) : !result ? (
              /* ⭐️ [Empty State] 웰컴 안내 화면 */
              <div className="flex flex-col items-center justify-center py-32 bg-white rounded-3xl border-2 border-dashed border-slate-200 shadow-sm transition-all hover:border-primary/30">
                <div className="bg-primary/5 p-6 rounded-full mb-6">
                    <FileBarChart2 className="w-12 h-12 text-primary animate-bounce" />
                </div>
                <h2 className="text-xl font-bold text-slate-800 mb-2">분석할 CSV 파일을 업로드해 주세요</h2>
                <p className="text-slate-500 text-center max-w-sm mb-8 leading-relaxed">
                    파일을 올리시면 AI가 자동으로 결측치를 정제하고 <br/>
                    상관관계 및 통계 인사이트를 시각화합니다.
                </p>
                <div className="flex gap-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <span>Clean Data</span>
                    <span>•</span>
                    <span>Smart Insight</span>
                    <span>•</span>
                    <span>Visual Analysis</span>
                </div>
              </div>
            ) : (
              /* [Data State] 결과 대시보드 */
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-700">
                <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
                  <DataCleaningSection data={uploadedData} result={result} />
                  <SmartInsightsPanel data={uploadedData} result={result} />
                </div>

                <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                  <Button onClick={handleCleanData} variant="outline" className="border-primary/20 text-primary font-bold rounded-xl px-6 hover:bg-primary/5">
                    <Sparkles className="w-4 h-4 mr-2" /> 스마트 데이터 정제
                  </Button>

                  <div className="h-6 w-[1px] bg-slate-200 mx-2" />

                  <div className="flex flex-wrap gap-2">
                    {analysisPresets.map((preset: any) => (
                      <Button
                        key={preset.column}
                        variant={selectedPreset === preset.column ? "default" : "secondary"}
                        className="rounded-xl font-medium"
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

                  <div className="ml-auto flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-400">데이터 샘플링</span>
                    <Select value={rowLimit} onValueChange={handleRowLimitChange}>
                      <SelectTrigger className="w-[120px] h-9 text-xs border-slate-200 rounded-lg shadow-none">
                        <SelectValue placeholder="범위 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10개 샘플</SelectItem>
                        <SelectItem value="50">50개</SelectItem>
                        <SelectItem value="100">100개</SelectItem>
                        <SelectItem value="all">전체 데이터</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <KpiMetrics displayMetrics={displayMetrics} />
                
                {selectedAnalysis && (
                  <div className="w-full min-h-[450px] bg-white p-6 rounded-3xl border border-slate-100 shadow-sm animate-in zoom-in-95 duration-500">
                    <VisualInsight 
                      selectedAnalysis={selectedAnalysis} 
                      headers={result.headers} 
                      previewRows={result.preview_rows} 
                      onElementClick={setFilterValue} 
                      activeFilter={filterValue} 
                    />
                  </div>
                )}
                
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    <DataTable result={result} filterColumn={selectedAnalysis?.column} filterValue={filterValue} />
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}