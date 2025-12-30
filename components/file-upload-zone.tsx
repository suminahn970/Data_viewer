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

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  const processFile = useCallback((file: File) => {
    // 파일 크기 검증
    if (file.size > MAX_FILE_SIZE) {
      alert(`파일 크기가 너무 큽니다. 최대 ${MAX_FILE_SIZE / (1024 * 1024)}MB까지 업로드 가능합니다.`);
      return;
    }

    // 파일 타입 검증 (MIME 타입 및 확장자)
    const isValidType = file.type === "text/csv" || 
                       file.type === "application/vnd.ms-excel" ||
                       file.name.toLowerCase().endsWith(".csv");
    
    if (!isValidType) {
      alert("CSV 파일만 업로드 가능합니다.");
      return;
    }

    setUploadedFile(file)
    
    // 파일 객체를 전달 (백엔드 API 호출용)
    if (onFileSelected) {
      onFileSelected(file)
    }
    
    // 로컬 미리보기용 데이터 처리 (파일 크기 제한 내에서만)
    if (file.size > 5 * 1024 * 1024) {
      // 5MB 이상은 미리보기 생략 (성능 최적화)
      onDataUploaded({ headers: [], rows: [], fileName: file.name });
      return;
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string
        const lines = text.split("\n").filter((line) => line.trim())
        if (lines.length === 0) {
          alert("파일이 비어있습니다.");
          return;
        }
        const headers = lines[0].split(",").map((h) => h.trim())
        const rows = lines.slice(1).map((line) => line.split(",").map((cell) => cell.trim()))
        onDataUploaded({ headers, rows, fileName: file.name })
      } catch (error) {
        console.error("파일 처리 오류:", error);
        alert("파일을 읽는 중 오류가 발생했습니다.");
      }
    }
    reader.onerror = () => {
      alert("파일을 읽는 중 오류가 발생했습니다.");
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
    <div className="relative rounded-3xl border-2 border-dashed border-border bg-card p-12 shadow-sm backdrop-blur-sm transition-all hover:shadow-md">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn("flex flex-col items-center justify-center transition-all", isDragging && "scale-[1.02]")}
      >
        {!uploadedFile ? (
          <>
            <div className="rounded-full bg-muted p-6 mb-6">
              <Upload className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Drop your CSV file here, or browse</h3>
            <p className="text-sm text-muted-foreground mb-6">CSV 파일만 지원 (최대 10MB)</p>
            <label htmlFor="file-upload">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-6 shadow-sm">
                Browse Files
              </Button>
              <input id="file-upload" type="file" accept=".csv" className="hidden" onChange={handleFileSelect} />
            </label>
          </>
        ) : (
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-primary/10 p-3">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">{uploadedFile.name}</p>
              <p className="text-xs text-muted-foreground">{(uploadedFile.size / 1024).toFixed(2)} KB</p>
            </div>
            <Button variant="ghost" size="sm" onClick={handleRemove} className="rounded-full h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
