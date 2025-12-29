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

  // 1. 하이드레이션 오류 방지
  useEffect(() => {
    setIsClient(true)
  }, [])

  // 2. 분석 함수 최적화 (useCallback으로 메모이제이션)
  const analyzeFile = useCallback(async (file: File, targetColumn?: string, limit?: string) => {
    // 분석 시작 시 이전 상태를 확실히 초기화하여 DOM 충돌 방지
    setIsAnalyzing(true)
    setResult(null) 
    setSelectedAnalysis(null)
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
      
      // 상태 업데이트를 한 번에 처리하여 불필요한 리렌더링 방지
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

            {/* 분석 중일 때 보여줄 UI: 하단 영역 전체를 비워서 DOM 충돌 차단 */}
            {isAnalyzing ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-gray-400 animate-pulse">새로운 데이터를 분석하고 그래프를 생성 중입니다...</p>
              </div>
            ) : (
              result && (
                <div key={`dashboard-content-${selectedPreset}`} className="space-y-8 animate-in fade-in duration-500">
                  <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
                    <DataCleaningSection data={uploadedData} result={result} />
                    <SmartInsightsPanel data={uploadedData} result={result} />
                  </div>

                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex flex-wrap gap-2">
                      {analysisPresets.map((preset: any) => (
                        <Button
                          key={`btn-${preset.column}`}
                          variant={selectedPreset === preset.column ? "default" : "outline"}
                          disabled={isAnalyzing}
                          onClick={() => {
                            if (selectedPreset !== preset.column) {
                              analyzeFile(currentFile!, preset.column)
                            } else {
                              // 같은 버튼 누르면 선택 해제
                              setSelectedPreset(null)
                              setSelectedAnalysis(null)
                            }
                          }}
                        >
                          {preset.label}
                        </Button>
                      ))}
                    </div>
                    
                    <div className="ml-auto">
                      <Select value={rowLimit} onValueChange={handleRowLimitChange} disabled={isAnalyzing}>
                        <SelectTrigger className="w-[140px]">
                          <SelectValue placeholder="샘플 개수" />
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
                  
                  {/* 그래프 컴포넌트: key를 구체화하여 데이터 변경 시 완전 재렌더링 유도 */}
                  {selectedAnalysis && result && (
                    <div 
                      key={`visual-container-${selectedPreset}-${result.preview_rows.length}`} 
                      className="w-full min-h-[400px] transition-all"
                    >
                      <VisualInsight
                        selectedAnalysis={selectedAnalysis}
                        headers={result.headers}
                        previewRows={result.preview_rows}
                      />
                    </div>
                  )}
                  
                  <DataTable result={result} />
                </div>
              )
            )}
          </div>
        </div>
      </main>
    </div>
  )
}