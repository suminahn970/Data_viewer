"use client"

import { useState, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface DataCleaningSectionProps {
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

export function DataCleaningSection({ data, result }: DataCleaningSectionProps) {
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(() => {
    const visibility: Record<string, boolean> = {}
    if (data?.headers) {
      data.headers.forEach((header) => {
        visibility[header] = true
      })
    }
    return visibility
  })

  const processingSteps = useMemo(() => {
    const steps = [
      { label: "File Validation", status: "complete" as const },
      { label: "Data Parsing", status: "complete" as const },
      { label: "Schema Detection", status: "complete" as const },
      { label: "Quality Check", status: (result ? "complete" : "processing") as const },
    ]
    return steps
  }, [result])

  const toggleColumn = (header: string) => {
    setColumnVisibility((prev) => ({
      ...prev,
      [header]: !prev[header],
    }))
  }

  const visibleHeaders = data?.headers?.filter((h) => columnVisibility[h]) || []
  const displayRows = data?.rows?.slice(0, 5) || []

  return (
    <Card className="rounded-[24px] border border-[#d2d2d7] shadow-sm">
      <div className="p-8 border-b border-[#d2d2d7]">
        <h2 className="text-lg font-semibold text-[#1d1d1f] mb-6">Data Cleaning</h2>

        {/* Step-by-step progress UI */}
        <div className="space-y-3">
          {processingSteps.map((step, index) => (
            <div key={index} className="flex items-center gap-3">
              {step.status === "complete" ? (
                <CheckCircle2 className="h-5 w-5 text-[#34c759]" />
              ) : step.status === "processing" ? (
                <Loader2 className="h-5 w-5 animate-spin text-[#0071e3]" />
              ) : (
                <AlertCircle className="h-5 w-5 text-[#86868b]" />
              )}
              <span className={`text-sm ${step.status === "complete" ? "text-[#1d1d1f]" : "text-[#86868b]"}`}>
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="p-8">
        {/* Column Management */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-[#1d1d1f] mb-4">Column Management</h3>
          <div className="flex flex-wrap gap-3">
            {data.headers.map((header) => (
              <div
                key={header}
                className="flex items-center gap-3 px-4 py-2 rounded-[12px] border border-[#d2d2d7] bg-[#f5f5f7]"
              >
                <Switch
                  checked={columnVisibility[header] === true}
                  onCheckedChange={() => toggleColumn(header)}
                  className="data-[state=checked]:bg-[#0071e3]"
                />
                <span className="text-sm text-[#1d1d1f]">{header}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Data Preview */}
        <div className="rounded-[12px] border border-[#d2d2d7] overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-[#d2d2d7]">
                {visibleHeaders.map((header) => (
                  <TableHead key={header} className="font-semibold text-[#86868b]">
                    {header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayRows.map((row, rowIndex) => (
                <TableRow key={rowIndex} className="hover:bg-[#f5f5f7]/50 border-[#d2d2d7]">
                  {visibleHeaders.map((header, cellIndex) => {
                    const headerIndex = data.headers.indexOf(header)
                    return (
                      <TableCell key={cellIndex} className="text-[#1d1d1f]">
                        {row[headerIndex] || "-"}
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </Card>
  )
}
