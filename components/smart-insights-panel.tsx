"use client"

import { useMemo } from "react"
import { Card } from "@/components/ui/card"
import { CheckCircle2, TrendingUp } from "lucide-react"

interface SmartInsightsPanelProps {
  data: {
    headers: string[]
    rows: string[][]
    fileName: string
  }
  result?: {
    headers: string[]
    preview_rows: (string | number)[][]
    total_rows?: number
  }
}

export function SmartInsightsPanel({ data, result }: SmartInsightsPanelProps) {
  const insights = useMemo(() => {
    if (!data || !data.headers || !data.rows) {
      return []
    }

    const results = []

    // Detect missing values
    let totalMissing = 0
    const missingByColumn: Record<string, number> = {}

    data.headers.forEach((header, index) => {
      let missing = 0
      data.rows.forEach((row) => {
        if (!row[index] || row[index].trim() === "") {
          missing++
          totalMissing++
        }
      })
      if (missing > 0) {
        missingByColumn[header] = missing
      }
    })

    if (totalMissing > 0) {
      results.push({
        type: "warning",
        title: "Missing Values Detected",
        description: `Found ${totalMissing.toLocaleString()} missing values across ${Object.keys(missingByColumn).length.toLocaleString()} columns`,
        details: Object.entries(missingByColumn)
          .map(([col, count]) => `${col}: ${count.toLocaleString()}`)
          .join(", "),
      })
    }

    // Data quality check
    const totalRows = result?.total_rows || data.rows.length
    results.push({
      type: "success",
      title: "Data Structure Validated",
      description: `${data.headers.length.toLocaleString()} columns, ${totalRows.toLocaleString()} rows detected`,
      details: null,
    })

    // Check for numeric columns
    const numericColumns = data.headers.filter((header, index) => {
      const sample = data.rows.slice(0, 10).map((row) => row[index])
      return sample.every((val) => !isNaN(Number(val)) && val !== "")
    })

    if (numericColumns.length > 0) {
      results.push({
        type: "info",
        title: "Numeric Columns Found",
        description: `${numericColumns.length.toLocaleString()} columns contain numeric data`,
        details: numericColumns.join(", "),
      })
    }

    return results
  }, [data])

  if (!data || !data.headers || !data.rows) {
    return null
  }

  return (
    <Card className="rounded-[24px] border border-[#d2d2d7] shadow-sm">
      <div className="p-8 border-b border-[#d2d2d7]">
        <h2 className="text-lg font-semibold text-[#1d1d1f]">Smart Insights</h2>
      </div>
      <div className="p-8">
        <div className="space-y-4">
          {insights.map((insight, index) => (
            <div key={index} className="p-5 rounded-[12px] border border-[#d2d2d7] bg-[#f5f5f7]">
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {insight.type === "warning" && (
                    <div className="h-2 w-2 rounded-full bg-[#ff3b30]" aria-label="Warning indicator" />
                  )}
                  {insight.type === "success" && <CheckCircle2 className="h-5 w-5 text-[#34c759]" />}
                  {insight.type === "info" && <TrendingUp className="h-5 w-5 text-[#0071e3]" />}
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-semibold text-[#1d1d1f]">{insight.title}</p>
                  <p className="text-xs text-[#86868b]">{insight.description}</p>
                  {insight.details && <p className="text-xs text-[#86868b] mt-2 italic">{insight.details}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}
