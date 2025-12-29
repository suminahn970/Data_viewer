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

  // ⭐️ 하이드레이션 오류 방지를 위한 안전장치
  useEffect(() => {
    setIsClient(true)
  }, [])

  const analyzeFile = async (file: File, targetColumn?: string, limit?: string) => {
    setIsAnalyzing(true)
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
      console.error("Error:", error)
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

  // 아직 클라이언트가 준비 안 됐으면 빈 화면을 보여줍니다.
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

            {isAnalyzing && (
              <div className="text-center py-8 text-gray-400">분석 중입니다...</div>
            )}

            {!isAnalyzing && result && (
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
                
                {/* ⭐️ 그래프 컴포넌트 호출 시 에러 방지 처리 */}
                {selectedAnalysis && result && (
                  <div key={selectedPreset}> {/* key를 주어 컴포넌트를 깨끗하게 다시 그립니다. */}
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