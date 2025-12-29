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
import { useState, useCallback } from "react"

export default function DashboardPage() {
  const [uploadedData, setUploadedData] = useState<any>(null)
  const [displayMetrics, setDisplayMetrics] = useState([])
  const [result, setResult] = useState<any>(null)
  const [analysisPresets, setAnalysisPresets] = useState([])
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null)
  const [selectedAnalysis, setSelectedAnalysis] = useState<any>(null)
  const [currentFile, setCurrentFile] = useState<File | null>(null)
  const [rowLimit, setRowLimit] = useState("10")
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  // 분석 함수를 useCallback으로 감싸서 안정성을 높입니다.
  const analyzeFile = useCallback(async (file: File, targetColumn?: string, limit?: string) => {
    setIsAnalyzing(true)
    // ⭐️ 중요: 새로운 데이터를 가져오기 전에 이전 분석 결과와 프리셋을 초기화하여 React 충돌을 방지합니다.
    if (!targetColumn) {
        setResult(null);
        setSelectedAnalysis(null);
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
      setDisplayMetrics(data.display_metrics || [])
      setResult(data.result)
      if (data.analysis_presets) setAnalysisPresets(data.analysis_presets)
      
      if (targetColumn) {
        setSelectedPreset(targetColumn)
        const preset = data.analysis_presets?.find((p: any) => p.column === targetColumn)
        if (preset) setSelectedAnalysis(preset)
      }
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setIsAnalyzing(false)
    }
  }, [rowLimit])

  const handleRowLimitChange = async (value: string) => {
    setRowLimit(value)
    if (currentFile) {
      // ⭐️ 즉시 새로운 리밋으로 분석 요청
      await analyzeFile(currentFile, selectedPreset || undefined, value)
    }
  }

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
              <div className="text-center py-8 animate-pulse text-gray-500">데이터를 다시 분석하고 있습니다...</div>
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
                                setSelectedPreset(null);
                                setSelectedAnalysis(null);
                            } else {
                                analyzeFile(currentFile!, preset.column);
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
                {selectedAnalysis && (
                  <VisualInsight
                    selectedAnalysis={selectedAnalysis}
                    headers={result.headers}
                    previewRows={result.preview_rows}
                  />
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