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
    // ⭐️ [보안책 1] 분석 시작 시 모든 결과물을 즉시 null로 만들어 DOM에서 제거합니다.
    setIsAnalyzing(true)
    setResult(null) 
    setSelectedAnalysis(null)

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
      } else {
        setSelectedPreset(null)
      }
    } catch (error) {
      console.error("Error:", error)
    } finally {
      // ⭐️ [보안책 2] 모든 데이터가 준비된 후에만 다시 화면을 그립니다.
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

            {isAnalyzing ? (
              <div className="text-center py-20 text-gray-400 animate-pulse">
                새로운 데이터를 분석하고 그래프를 생성 중입니다...
              </div>
            ) : (
              // ⭐️ [보안책 3] 데이터가 있을 때만 렌더링 영역을 활성화합니다.
              result && (
                <div className="space-y-8 animate-in fade-in duration-500">
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
                            if (selectedPreset !== preset.column) {
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
                  
                  {/* ⭐️ [보안책 4] 그래프 컴포넌트가 바뀔 때마다 완전히 새로 그립니다. */}
                  {selectedAnalysis && (
                    <div key={`${selectedPreset}-${rowLimit}`} className="w-full">
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