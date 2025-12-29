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
import { useState, useEffect } from "react"

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

  useEffect(() => {
    setIsClient(true)
  }, [])

  const analyzeFile = async (file: File, targetColumn?: string, limit?: string) => {
    // ⭐️ 1. 분석 시작 시 기존 데이터와 선택 상태를 즉시 비워서 충돌 방지
    setIsAnalyzing(true)
    if (!targetColumn) {
        setResult(null)
        setSelectedAnalysis(null)
        setSelectedPreset(null)
    }

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
      
      // ⭐️ 2. 데이터를 한 번에 세팅
      setDisplayMetrics(data.display_metrics || [])
      setResult(data.result)
      if (data.analysis_presets) setAnalysisPresets(data.analysis_presets)
      
      if (targetColumn) {
        setSelectedPreset(targetColumn)
        const preset = data.analysis_presets?.find((p: any) => p.column === targetColumn)
        setSelectedAnalysis(preset || null)
      }
    } catch (error) {
      console.error("Error:", error)
      alert("분석 중 오류가 발생했습니다.")
    } finally {
      setIsAnalyzing(false)
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
              onFileSelected={(file) => { setCurrentFile(file); analyzeFile(file); }} 
            />

            {/* 분석 중일 때는 아래 콘텐츠를 그리지 않음으로써 DOM 에러 방지 */}
            {isAnalyzing ? (
              <div className="text-center py-20 text-gray-400 animate-pulse font-medium">
                데이터 분석 및 그래프 생성 중...
              </div>
            ) : result && (
              <>
                <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
                  <DataCleaningSection data={uploadedData} result={result} />
                  <SmartInsightsPanel data={uploadedData} result={result} />
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex flex-wrap gap-2">
                    {analysisPresets.map((preset: any) => (
                      <Button
                        key={preset.column}
                        variant={selectedPreset === preset.column ? "default" : "outline"}
                        onClick={() => {
                          if (selectedPreset === preset.column) {
                            setSelectedPreset(null)
                            setSelectedAnalysis(null)
                          } else {
                            // 버튼 클릭 시 즉시 재분석 요청
                            analyzeFile(currentFile!, preset.column)
                          }
                        }}
                      >
                        {preset.label}
                      </Button>
                    ))}
                  </div>
                  <Select value={rowLimit} onValueChange={handleRowLimitChange}>
                    <SelectTrigger className="w-[140px] ml-auto">
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

                <KpiMetrics displayMetrics={displayMetrics} />
                
                {/* ⭐️ 그래프 컴포넌트: 데이터가 있고 분석 중이 아닐 때만 렌더링 */}
                {selectedAnalysis && result && (
                  <div key={`${selectedPreset}-${rowLimit}`} className="w-full">
                    <VisualInsight
                      selectedAnalysis={selectedAnalysis}
                      headers={result.headers}
                      previewRows={result.preview_rows}
                    />
                  </div>
                )}
                
                <DataTable result={result} />
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}