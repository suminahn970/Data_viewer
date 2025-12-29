"use client"

import { Users, TrendingUp } from "lucide-react"

const insights = [
  {
    icon: Users,
    label: "New Customers",
    value: "284",
    subtitle: "This month",
  },
  {
    icon: TrendingUp,
    label: "Avg. Order Value",
    value: "$142",
    subtitle: "+$12 from last month",
  },
]

export function CustomerInsights() {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#e5e5e7] h-full">
      <h3 className="text-base font-semibold text-[#1d1d1f] mb-6">Customer Insights</h3>

      <div className="space-y-8">
        {insights.map((insight, index) => {
          const Icon = insight.icon
          return (
            <div key={index} className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#f5f5f7]">
                <Icon className="h-5 w-5 text-[#1d1d1f]" strokeWidth={2} />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-[13px] font-medium text-[#86868b]">{insight.label}</p>
                <p className="text-[28px] font-semibold text-[#1d1d1f] tracking-tight leading-none">{insight.value}</p>
                <p className="text-[12px] text-[#86868b]">{insight.subtitle}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
