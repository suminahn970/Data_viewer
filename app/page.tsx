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
import { Sparkles, RefreshCcw } from "lucide-react" // ✨ 아이콘 추가

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
  const [isCleaning, setIsCleaning] = useState(false) // ⭐️ 정제 상태 추가

  const [filterValue, setFilterValue] = useState<string | null>(null)

  useEffect(() => {
    setIsClient(true)
  }, [])

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

  // ⭐️ [신규] 스마트 데이터 정제 함수
  const handleCleanData = async () => {
    if (!currentFile) return
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
      
      // 1. 알림창 표시
      alert(`✨ 정제 완료!\n- 중복 데이터 ${data.removed_duplicates}건 제거\n- 결측치 ${data.fixed_missing}건 보정`);

      // 2. 정제된 CSV 텍스트를 다시 File 객체로 변환
      const cleanedFile = new File([data.cleaned_data], currentFile.name, { type: "text/csv" })
      
      // 3. 파일 상태 업데이트 및 재분석 실행
      setCurrentFile(cleanedFile)
      analyzeFile(cleanedFile)

    } catch (error) {
      console.error("정제 오류:", error)
      alert("데이터 정제 중 오류가 발생했습니다.")
    } finally {
      setIsCleaning(false)
    }
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
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-[1400px] px-12 py-10">
          <div className="space-y-8">
            <FileUploadZone 
              onDataUploaded={setUploadedData} 
              onFileSelected={(file) => { 
                setCurrentFile(file); 
                analyzeFile(file); 
              }} 
            />

            {isAnalyzing || isCleaning ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-gray-400 animate-pulse font-medium">
                  {isCleaning ? "스마트 정제 기능을 실행 중입니다..." : "지능형 인사이트를 분석 중입니다..."}
                </p>
              </div>
            ) : (
              result && (
                <div key={`dashboard-root-${selectedPreset}`} className="space-y-8 animate-in fade-in duration-700">
                  <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
                    <DataCleaningSection data={uploadedData} result={result} />
                    <SmartInsightsPanel data={uploadedData} result={result} />
                  </div>

                  <div className="flex flex-wrap items-center gap-4">
                    {/* ⭐️ 스마트 정제 버튼 추가 */}
                    <Button 
                      onClick={handleCleanData}
                      variant="outline"
                      className="border-primary/30 text-primary hover:bg-primary/5 font-bold rounded-xl px-6"
                      disabled={isCleaning}
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      스마트 데이터 정제
                    </Button>

                    <div className="h-6 w-[1px] bg-gray-200 mx-2" />

                    <div className="flex flex-wrap gap-2">
                      {analysisPresets.map((preset: any) => (
                        <Button
                          key={`preset-${preset.column}`}
                          variant={selectedPreset === preset.column ? "default" : "outline"}
                          disabled={isAnalyzing}
                          onClick={() => {
                            if (selectedPreset !== preset.column) {
                              analyzeFile(currentFile!, preset.column)
                            } else {
                              setSelectedPreset(null)
                              setSelectedAnalysis(null)
                              setFilterValue(null)
                            }
                          }}
                        >
                          {preset.label}
                        </Button>
                      ))}
                    </div>
                    
                    <div className="ml-auto">
                      <Select value={rowLimit} onValueChange={handleRowLimitChange} disabled={isAnalyzing}>
                        <SelectTrigger className="w-[140px] h-9 text-xs">
                          <SelectValue placeholder="데이터 범위" />
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
                  
                  {selectedAnalysis && result && (
                    <div 
                      key={`chart-area-${selectedPreset}-${result.preview_rows.length}`} 
                      className="w-full min-h-[450px]"
                    >
                      <VisualInsight
                        selectedAnalysis={selectedAnalysis}
                        headers={result.headers}
                        previewRows={result.preview_rows}
                        onElementClick={setFilterValue} 
                        activeFilter={filterValue}
                      />
                    </div>
                  )}
                  
                  <DataTable 
                    result={result} 
                    filterColumn={selectedAnalysis?.column}
                    filterValue={filterValue}
                  />
                </div>
              )
            )}
          </div>
        </div>
      </main>
    </div>
  )
}