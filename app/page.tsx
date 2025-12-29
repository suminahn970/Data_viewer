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
import { Sparkles, Trash2, Download } from "lucide-react" // 📥 다운로드 아이콘 추가

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

  // ⭐️ [보강] 로컬 스토리지 안전 복구 및 파일 객체 재생성
  useEffect(() => {
    setIsClient(true)
    try {
      const savedMetrics = localStorage.getItem('dash_metrics')
      const savedResult = localStorage.getItem('dash_result')
      const savedPresets = localStorage.getItem('dash_presets')
      const savedFileName = localStorage.getItem('dash_filename')
      const savedRawCsv = localStorage.getItem('dash_raw_csv') // 원본 데이터 복구용

      if (savedMetrics && savedResult && savedPresets && savedMetrics !== "undefined") {
        setDisplayMetrics(JSON.parse(savedMetrics))
        setResult(JSON.parse(savedResult))
        setAnalysisPresets(JSON.parse(savedPresets))
        
        if (savedFileName) {
          setUploadedData({ name: savedFileName })
          // ⭐️ 저장된 CSV 텍스트가 있다면 File 객체로 다시 변환 (정제 기능을 위해)
          if (savedRawCsv) {
            const recoveredFile = new File([savedRawCsv], savedFileName, { type: "text/csv" })
            setCurrentFile(recoveredFile)
          }
        }
        console.log("🚀 분석 데이터 및 파일 객체를 완벽히 복구했습니다.")
      }
    } catch (e) {
      console.error("복구 실패:", e)
      localStorage.clear()
    }
  }, [])

  const handleReset = () => {
    if (confirm("모든 데이터를 삭제할까요?")) {
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
      
      // ⭐️ 정제 기능을 위해 파일의 텍스트 내용도 저장 (Blob -> Text)
      const reader = new FileReader()
      reader.onload = (e) => {
        if (e.target?.result) localStorage.setItem('dash_raw_csv', e.target.result as string)
      }
      reader.readAsText(file)

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
        alert("복구된 파일이 없습니다. 파일을 다시 업로드해 주세요.")
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

  // ⭐️ [신규] 정제된 데이터 다운로드 기능
  const handleDownload = () => {
    if (!currentFile) return
    const url = window.URL.createObjectURL(currentFile)
    const a = document.createElement('a')
    a.href = url
    a.download = `cleaned_${currentFile.name}`
    a.click()
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
                <div className="flex gap-2 mb-2">
                    {result && (
                        <>
                            <Button variant="outline" size="sm" onClick={handleDownload} className="text-gray-600">
                                <Download className="w-4 h-4 mr-2" />
                                CSV 결과 저장
                            </Button>
                            <Button variant="ghost" size="sm" onClick={handleReset} className="text-muted-foreground hover:text-destructive">
                                <Trash2 className="w-4 h-4 mr-2" />
                                기록 삭제
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {isAnalyzing || isCleaning ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-gray-400 animate-pulse font-medium">데이터 처리 중...</p>
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