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
      formData.append("row_limit", limit || rowLimit)

      const response = await fetch("http://localhost:8000/analyze", {
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
      // analysis_presets는 첫 로드 시에만 설정 (이후에는 유지)
      if (analysisData.analysis_presets && analysisData.analysis_presets.length > 0) {
        setAnalysisPresets(analysisData.analysis_presets)
      }
      if (targetColumn) {
        setSelectedPreset(targetColumn)
        // 선택된 preset 찾기
        const preset = analysisData.analysis_presets?.find((p: AnalysisPreset) => p.column === targetColumn)
        if (preset) {
          setSelectedAnalysis(preset)
        }
      } else if (!targetColumn && !selectedPreset) {
        // 초기 로드 시 선택 해제
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
    
    // 이미 같은 프리셋이 선택되어 있으면 차트만 토글, 아니면 재분석
    if (selectedAnalysis?.column === preset.column) {
      setSelectedAnalysis(null)
      setSelectedPreset(null)
    } else {
      setSelectedAnalysis(preset)
      setSelectedPreset(preset.column)
      // KPI 재계산을 위해 백엔드 호출
      await analyzeFile(currentFile, preset.column, rowLimit)
    }
  }

  const handleRowLimitChange = async (value: string) => {
    setRowLimit(value)
    if (currentFile) {
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
              <div className="text-center text-[#86868b] py-8">Analyzing data...</div>
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
                    <SelectTrigger size="sm" className="w-[140px]">
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
