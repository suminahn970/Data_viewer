"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"

interface DataCleaningPanelProps {
  data: {
    headers: string[]
    rows: string[][]
    fileName: string
  }
}

export function DataCleaningPanel({ data }: DataCleaningPanelProps) {
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(() => {
    const visibility: Record<string, boolean> = {}
    if (data?.headers) {
      data.headers.forEach((header) => {
        visibility[header] = true
      })
    }
    return visibility
  })
  const [searchQuery, setSearchQuery] = useState("")
  const [processingSteps] = useState([
    { label: "File Validation", status: "complete" },
    { label: "Data Parsing", status: "complete" },
    { label: "Schema Detection", status: "complete" },
    { label: "Quality Check", status: "processing" },
  ])

  const toggleColumn = (header: string) => {
    setColumnVisibility((prev) => ({
      ...prev,
      [header]: !prev[header],
    }))
  }

  const visibleHeaders = data?.headers?.filter((h) => columnVisibility[h]) || []
  const displayRows = data?.rows?.slice(0, 5) || []

  if (!data || !data.headers || !data.rows) {
    return null
  }

  return (
    <Card className="shadow-sm rounded-[24px]">
      <CardHeader className="border-b border-border pb-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-foreground">Data Cleaning</CardTitle>
          <Badge variant="secondary" className="text-xs">
            {data.rows.length} rows
          </Badge>
        </div>

        {/* Processing Steps */}
        <div className="mt-4 space-y-2">
          {processingSteps.map((step, index) => (
            <div key={index} className="flex items-center gap-3 text-sm">
              {step.status === "complete" ? (
                <CheckCircle2 className="h-4 w-4 text-[#0071e3]" />
              ) : step.status === "processing" ? (
                <Loader2 className="h-4 w-4 animate-spin text-[#0071e3]" />
              ) : (
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              )}
              <span className={step.status === "complete" ? "text-foreground" : "text-muted-foreground"}>
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {/* Column Management */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-foreground mb-3">Column Management</h3>
          <div className="flex flex-wrap gap-2">
            {data.headers.map((header) => (
              <div
                key={header}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-muted/30"
              >
                <Switch
                  checked={columnVisibility[header] === true}
                  onCheckedChange={() => toggleColumn(header)}
                  className="data-[state=checked]:bg-[#0071e3]"
                />
                <span className="text-sm text-foreground">{header}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="mb-4 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search data..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 rounded-lg"
          />
        </div>

        {/* Data Preview */}
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                {visibleHeaders.map((header) => (
                  <TableHead key={header} className="font-semibold text-foreground">
                    {header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayRows.map((row, rowIndex) => (
                <TableRow key={rowIndex} className="hover:bg-muted/50">
                  {visibleHeaders.map((header, cellIndex) => {
                    const headerIndex = data.headers.indexOf(header)
                    return (
                      <TableCell key={cellIndex} className="text-foreground">
                        {row[headerIndex] || "-"}
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
