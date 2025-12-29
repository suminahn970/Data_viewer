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
import { useState } from "react"

interface UploadedData {
  headers: string[]
  rows: string[][]
  fileName: string
}

interface DisplayMetric {
  label: string
  value: number
  unit: string
  feature: string | null
}

interface AnalysisPreset {
  label: string
  column: string
  type: "distribution" | "statistics" | "status"
}

interface AnalysisResult {
  headers: string[]
  preview_rows: (string | number)[][]
  total_rows?: number
}

export default function DashboardPage() {
  const [uploadedData, setUploadedData] = useState<UploadedData | null>(null)
  const [displayMetrics, setDisplayMetrics] = useState<DisplayMetric[]>([])
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [mainFeature, setMainFeature] = useState<string | null>(null)
  const [analysisPresets, setAnalysisPresets] = useState<AnalysisPreset[]>([])
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null)
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisPreset | null>(null)
  const [currentFile, setCurrentFile] = useState<File | null>(null)
  const [rowLimit, setRowLimit] = useState<string>("10")
  const [analyzedRows, setAnalyzedRows] = useState<number>(0)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const handleDataUploaded = (data: UploadedData) => {
    setUploadedData(data)
  }

  const handleFileSelected = async (file: File) => {
    setCurrentFile(file)
    await analyzeFile(file)
  }

  const analyzeFile = async (file: File, targetColumn?: string, limit?: string) => {
    setIsAnalyzing(true)

    try {
      const formData = new FormData()
      formData.append("file", file)
      if (targetColumn) {
        formData.append("target_column", targetColumn)
      }
      // ⭐️ 수정: 매개변수로 들어온 limit이 있으면 그것을 쓰고, 없으면 상태값(rowLimit)을 씁니다.
      formData.append("row_limit", limit || rowLimit)

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://data-viewer-zyxg.onrender.com'}/analyze`, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Analysis failed")
      }

      const analysisData = await response.json()
      setDisplayMetrics(analysisData.display_metrics || [])
      setResult(analysisData.result)
      setMainFeature(analysisData.main_feature || null)
      setAnalyzedRows(analysisData.analyzed_rows || 0)
      
      if (analysisData.analysis_presets && analysisData.analysis_presets.length > 0) {
        setAnalysisPresets(analysisData.analysis_presets)
      }
      
      if (targetColumn) {
        setSelectedPreset(targetColumn)
        const preset = analysisData.analysis_presets?.find((p: AnalysisPreset) => p.column === targetColumn)
        if (preset) {
          setSelectedAnalysis(preset)
        }
      } else if (!targetColumn && !selectedPreset) {
        setSelectedPreset(null)
        setSelectedAnalysis(null)
      }
    } catch (error) {
      console.error("Error analyzing data:", error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handlePresetClick = async (preset: AnalysisPreset) => {
    if (!currentFile) return
    
    if (selectedAnalysis?.column === preset.column) {
      setSelectedAnalysis(null)
      setSelectedPreset(null)
    } else {
      setSelectedAnalysis(preset)
      setSelectedPreset(preset.column)
      await analyzeFile(currentFile, preset.column, rowLimit)
    }
  }

  // ⭐️ 핵심 수정 부분: 비동기 상태 업데이트 문제를 해결하기 위해 value를 직접 넘깁니다.
  const handleRowLimitChange = async (value: string) => {
    setRowLimit(value)
    if (currentFile) {
      // ⭐️ analyzeFile의 세 번째 인자로 value를 직접 전달하여 즉시 반영되게 합니다.
      await analyzeFile(currentFile, selectedPreset || undefined, value)
    }
  }

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />

      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-[1400px] px-12 py-10">
          <div className="space-y-8">
            <FileUploadZone onDataUploaded={handleDataUploaded} onFileSelected={handleFileSelected} />

            {isAnalyzing && (
              <div className="text-center text-[#86868b] py-8 font-medium">데이터 분석 중...</div>
            )}

            {uploadedData && (
              <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
                <DataCleaningSection data={uploadedData} result={result || undefined} />
                <SmartInsightsPanel data={uploadedData} result={result || undefined} />
              </div>
            )}

            {analysisPresets.length > 0 && (
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex flex-wrap gap-2">
                  {analysisPresets.map((preset) => (
                    <Button
                      key={preset.column}
                      variant={selectedPreset === preset.column ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePresetClick(preset)}
                      className={
                        selectedPreset === preset.column
                          ? "bg-primary text-primary-foreground"
                          : ""
                      }
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <Select value={rowLimit} onValueChange={handleRowLimitChange}>
                    <SelectTrigger className="w-[140px] h-9 text-sm">
                      <SelectValue placeholder="데이터 양 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10개 샘플</SelectItem>
                      <SelectItem value="50">50개</SelectItem>
                      <SelectItem value="100">100개</SelectItem>
                      <SelectItem value="all">전체 데이터</SelectItem>
                    </SelectContent>
                  </Select>
                  {analyzedRows > 0 && (
                    <span className="text-sm text-muted-foreground">
                      현재 {analyzedRows.toLocaleString()}개의 데이터를 분석 중입니다
                    </span>
                  )}
                </div>
              </div>
            )}

            <KpiMetrics displayMetrics={displayMetrics} mainFeature={mainFeature || undefined} />

            {selectedAnalysis && result && (
              <VisualInsight
                selectedAnalysis={selectedAnalysis}
                headers={result.headers}
                previewRows={result.preview_rows}
              />
            )}

            <DataTable result={result || undefined} />
          </div>
        </div>
      </main>
    </div>
  )
}