"use client"

import type React from "react"

import { Upload, FileSpreadsheet, X } from "lucide-react"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"

interface UploadedData {
  headers: string[]
  rows: string[][]
  fileName: string
}

interface CsvUploadProps {
  onDataUploaded?: (data: UploadedData) => void
}

export function CsvUpload({ onDataUploaded }: CsvUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile && droppedFile.type === "text/csv") {
      setFile(droppedFile)
      processFile(droppedFile)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      processFile(selectedFile)
    }
  }

  const processFile = async (file: File) => {
    try {
      const text = await file.text()
      const lines = text.split("\n").filter((line) => line.trim())

      if (lines.length === 0) return

      const headers = lines[0].split(",").map((h) => h.trim())
      const rows = lines.slice(1).map((line) => line.split(",").map((cell) => cell.trim()))

      const uploadedData: UploadedData = {
        headers,
        rows,
        fileName: file.name,
      }

      if (onDataUploaded) {
        onDataUploaded(uploadedData)
      }
    } catch (error) {
      console.error("Error processing CSV:", error)
    }
  }

  const handleRemoveFile = () => {
    setFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#e5e5e7]">
      <h2 className="text-base font-semibold text-[#1d1d1f] mb-4">Import Data</h2>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-xl p-12 transition-all duration-200 ${
          isDragging ? "border-[#0071e3] bg-[#0071e3]/5" : "border-[#d2d2d7] bg-white"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        {!file ? (
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f5f5f7]">
              <Upload className="h-5 w-5 text-[#86868b]" strokeWidth={2} />
            </div>
            <div>
              <p className="text-[15px] text-[#1d1d1f]">
                Drop your CSV file here, or{" "}
                <span className="text-[#0071e3] font-medium cursor-pointer hover:underline">browse</span>
              </p>
              <p className="text-[13px] text-[#86868b] mt-1">Supports CSV files up to 10MB</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#0071e3]/10">
              <FileSpreadsheet className="h-6 w-6 text-[#0071e3]" strokeWidth={2} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[15px] font-medium text-[#1d1d1f] truncate">{file.name}</p>
              <p className="text-[13px] text-[#86868b]">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation()
                handleRemoveFile()
              }}
              className="h-8 w-8 rounded-full text-[#86868b] hover:text-[#1d1d1f] hover:bg-[#f5f5f7]"
            >
              <X className="h-4 w-4" strokeWidth={2} />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
