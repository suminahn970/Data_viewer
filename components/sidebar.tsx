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
    <aside className="w-[280px] border-r border-sidebar-border bg-sidebar flex flex-col">
      <div className="p-8 border-b border-sidebar-border">
        <h1 className="text-xl font-semibold text-sidebar-foreground">Analytics Pro</h1>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.label}>
              <button
                onClick={() => setActiveItem(item.label)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all",
                  activeItem === item.label
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent",
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
