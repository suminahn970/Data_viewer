"use client"

import { LayoutDashboard, Upload, Database, BarChart3, Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", active: true },
  { icon: Upload, label: "Import Data", active: false },
  { icon: Database, label: "Data Sources", active: false },
  { icon: BarChart3, label: "Analytics", active: false },
  { icon: Settings, label: "Settings", active: false },
]

export function Sidebar() {
  const [activeItem, setActiveItem] = useState("Dashboard")

  return (
    <aside className="w-[280px] border-r border-[#E5E9F0] bg-white flex flex-col">
      <div className="p-6 border-b border-[#E5E9F0]">
        <h1 className="text-lg font-semibold text-[#1A1F36]">데이터 분석</h1>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.label}>
              <button
                onClick={() => setActiveItem(item.label)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
                  activeItem === item.label
                    ? "bg-[#0066FF]/10 text-[#0066FF] shadow-sm"
                    : "text-[#6B7280] hover:text-[#1A1F36] hover:bg-[#F7F9FC]",
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}
