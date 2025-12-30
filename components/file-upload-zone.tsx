"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Upload, FileText, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface FileUploadZoneProps {
  onDataUploaded: (data: { headers: string[]; rows: string[][]; fileName: string }) => void
  onFileSelected?: (file: File) => void
}

export function FileUploadZone({ onDataUploaded, onFileSelected }: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const processFile = useCallback((file: File) => {
    setUploadedFile(file)
    
    // 파일 객체를 전달 (백엔드 API 호출용)
    if (onFileSelected) {
      onFileSelected(file)
    }
    
    // 로컬 미리보기용 데이터 처리
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const lines = text.split("\n").filter((line) => line.trim())
      const headers = lines[0].split(",").map((h) => h.trim())
      const rows = lines.slice(1).map((line) => line.split(",").map((cell) => cell.trim()))
      onDataUploaded({ headers, rows, fileName: file.name })
    }
    reader.readAsText(file)
  }, [onFileSelected, onDataUploaded])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file && file.name.endsWith(".csv")) {
      processFile(file)
    }
  }, [processFile])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      processFile(file)
    }
  }, [processFile])

  const handleRemove = () => {
    setUploadedFile(null)
  }

  return (
    <div className={`relative rounded-xl border-2 border-dashed ${isDragging ? 'border-[#0066FF] bg-[#0066FF]/5' : 'border-[#E5E9F0]'} bg-white p-8 shadow-sm transition-all hover:shadow-md`}>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn("flex flex-col items-center justify-center transition-all", isDragging && "scale-[1.01]")}
      >
        {!uploadedFile ? (
          <>
            <div className="rounded-xl bg-[#0066FF]/10 p-4 mb-4">
              <Upload className="h-6 w-6 text-[#0066FF]" />
            </div>
            <h3 className="text-base font-semibold text-[#1A1F36] mb-1">CSV 파일을 드래그하거나 선택하세요</h3>
            <p className="text-sm text-[#6B7280] mb-6">최대 10MB까지 지원</p>
            <label htmlFor="file-upload">
              <Button className="bg-[#0066FF] hover:bg-[#0052CC] text-white rounded-lg px-6 shadow-sm">
                파일 선택
              </Button>
              <input id="file-upload" type="file" accept=".csv" className="hidden" onChange={handleFileSelect} />
            </label>
          </>
        ) : (
          <div className="flex items-center gap-4 w-full">
            <div className="rounded-lg bg-[#0066FF]/10 p-3">
              <FileText className="h-5 w-5 text-[#0066FF]" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-[#1A1F36]">{uploadedFile.name}</p>
              <p className="text-xs text-[#6B7280]">{(uploadedFile.size / 1024).toFixed(2)} KB</p>
            </div>
            <Button variant="ghost" size="sm" onClick={handleRemove} className="rounded-lg h-8 w-8 p-0 hover:bg-[#F7F9FC]">
              <X className="h-4 w-4 text-[#6B7280]" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
