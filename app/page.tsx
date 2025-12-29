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
import { Sparkles, Trash2 } from "lucide-react"

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

  // ⭐️ [보강] 로컬 스토리지 안전 복구 로직
  useEffect(() => {
    setIsClient(true)
    try {
      const savedMetrics = localStorage.getItem('dash_metrics')
      const savedResult = localStorage.getItem('dash_result')
      const savedPresets = localStorage.getItem('dash_presets')
      const savedFileName = localStorage.getItem('dash_filename')

      // 데이터가 모두 존재하고 'undefined' 문자열이 아닐 때만 파싱
      if (savedMetrics && savedResult && savedPresets && savedMetrics !== "undefined") {
        setDisplayMetrics(JSON.parse(savedMetrics))
        setResult(JSON.parse(savedResult))
        setAnalysisPresets(JSON.parse(savedPresets))
        if (savedFileName) setUploadedData({ name: savedFileName })
        console.log("🚀 분석 데이터를 안전하게 복구했습니다.")
      }
    } catch (e) {
      console.error("복구 중 데이터 충돌 발생. 저장소를 초기화합니다.")
      localStorage.clear() // 데이터가 깨져있으면 지워서 에러 방지
    }
  }, [])

  const handleReset = () => {
    if (confirm("모든 분석 데이터를 삭제하고 초기화할까요?")) {
      localStorage.clear()
      window.location.reload()
    }
  }

  const analyzeFile = useCallback(async (file: File, targetColumn?: string, limit?: string) => {
    setIsAnalyzing(true)
    setResult(null) 
    setSelectedAnalysis(null)
    setFilterValue(null)
    if (!targetColumn) setSelectedPreset(null)

    try {
      const formData = new FormData()
      formData.append("file", file)
      if (targetColumn) formData.append("target_column", targetColumn)
      formData.append("row_limit", limit || rowLimit)

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://data-viewer-zyxg.onrender.com'}/analyze`, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) throw new Error("Analysis failed")
      const data = await response.json()
      
      setDisplayMetrics(data.display_metrics || [])
      setResult(data.result)
      if (data.analysis_presets) setAnalysisPresets(data.analysis_presets)
      
      // 로컬 스토리지 업데이트
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
        alert("현재 세션에 파일 객체가 없습니다. 파일을 다시 업로드해 주세요.")
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
      if (!response.ok) throw new Error("Cleaning failed")
      const data = await response.json()
      alert(`✨ 정제 완료!\n- 중복: ${data.removed_duplicates}건 제거\n- 결측치: ${data.fixed_missing}건 보정`)
      const cleanedFile = new File([data.cleaned_data], currentFile.name, { type: "text/csv" })
      setCurrentFile(cleanedFile)
      analyzeFile(cleanedFile)
    } catch (error) {
      console.error("정제 오류:", error)
    } finally { setIsCleaning(false) }
  }

  const handleRowLimitChange = async (value: string) => {
    setRowLimit(value)
    if (currentFile) await analyzeFile(currentFile, selectedPreset || undefined, value)
  }

  if (!isClient) return <div className="min-h-screen bg-white" />

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-[1400px] px-12 py-10">
          <div className="space-y-8">
            <div className="flex justify-between items-end">
                <div className="flex-1">
                    <FileUploadZone 
                        onDataUploaded={setUploadedData} 
                        onFileSelected={(file) => { setCurrentFile(file); analyzeFile(file); }} 
                    />
                </div>
                {result && (
                    <Button variant="ghost" size="sm" onClick={handleReset} className="text-muted-foreground hover:text-destructive ml-4 mb-2">
                        <Trash2 className="w-4 h-4 mr-2" />
                        기록 삭제
                    </Button>
                )}
            </div>

            {isAnalyzing || isCleaning ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-gray-400 animate-pulse font-medium">처리 중...</p>
              </div>
            ) : (
              result && (
                <div key={`dashboard-root-${selectedPreset}`} className="space-y-8 animate-in fade-in duration-700">
                  <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
                    <DataCleaningSection data={uploadedData} result={result} />
                    <SmartInsightsPanel data={uploadedData} result={result} />
                  </div>

                  <div className="flex flex-wrap items-center gap-4">
                    <Button onClick={handleCleanData} variant="outline" className="border-primary/30 text-primary font-bold rounded-xl px-6">
                      <Sparkles className="w-4 h-4 mr-2" />
                      스마트 데이터 정제
                    </Button>
                    <div className="h-6 w-[1px] bg-gray-200 mx-2" />
                    <div className="flex flex-wrap gap-2">
                      {analysisPresets.map((preset: any) => (
                        <Button
                          key={`preset-${preset.column}`}
                          variant={selectedPreset === preset.column ? "default" : "outline"}
                          onClick={() => {
                            if (selectedPreset !== preset.column) {
                              if (currentFile) { analyzeFile(currentFile, preset.column) } 
                              else {
                                setSelectedPreset(preset.column)
                                const p = analysisPresets?.find((p: any) => p.column === preset.column)
                                setSelectedAnalysis(p || null)
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
                    <div className="ml-auto">
                      <Select value={rowLimit} onValueChange={handleRowLimitChange}>
                        <SelectTrigger className="w-[140px] h-9 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10개 샘플</SelectItem>
                          <SelectItem value="50">50개</SelectItem>
                          <SelectItem value="all">전체 데이터</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <KpiMetrics displayMetrics={displayMetrics} />
                  {selectedAnalysis && result && (
                    <div className="w-full min-h-[450px]">
                      <VisualInsight selectedAnalysis={selectedAnalysis} headers={result.headers} previewRows={result.preview_rows} onElementClick={setFilterValue} activeFilter={filterValue} />
                    </div>
                  )}
                  <DataTable result={result} filterColumn={selectedAnalysis?.column} filterValue={filterValue} />
                </div>
              )
            )}
          </div>
        </div>
      </main>
    </div>
  )
}