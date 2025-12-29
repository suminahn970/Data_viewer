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
  
  // ⭐️ 인터랙티브 필터: 차트에서 선택한 카테고리 값을 저장
  const [filterValue, setFilterValue] = useState<string | null>(null)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const analyzeFile = useCallback(async (file: File, targetColumn?: string, limit?: string) => {
    setIsAnalyzing(true)
    setResult(null) 
    setSelectedAnalysis(null)
    setFilterValue(null) // ⭐️ 새로운 분석 시 기존 필터 초기화
    
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

            {isAnalyzing ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-gray-400 animate-pulse font-medium">지능형 인사이트를 분석 중입니다...</p>
              </div>
            ) : (
              result && (
                <div key={`dashboard-root-${selectedPreset}`} className="space-y-8 animate-in fade-in duration-700">
                  <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
                    <DataCleaningSection data={uploadedData} result={result} />
                    <SmartInsightsPanel data={uploadedData} result={result} />
                  </div>

                  <div className="flex flex-wrap items-center gap-4">
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
                              setFilterValue(null) // ⭐️ 프리셋 해제 시 필터도 해제
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
                      {/* ⭐️ 인터랙티브 필터 적용: 클릭 이벤트와 현재 필터값 전달 */}
                      <VisualInsight
                        selectedAnalysis={selectedAnalysis}
                        headers={result.headers}
                        previewRows={result.preview_rows}
                        onElementClick={setFilterValue} 
                        activeFilter={filterValue}
                      />
                    </div>
                  )}
                  
                  {/* ⭐️ 인터랙티브 필터 적용: 어떤 컬럼을 어떤 값으로 필터링할지 전달 */}
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