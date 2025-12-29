"use client"

import { DollarSign, ShoppingCart, Users, TrendingUp } from "lucide-react"

const metrics = [
  {
    label: "Total Revenue",
    value: "$48,574",
    change: "+12.5%",
    trend: "up",
    icon: DollarSign,
  },
  {
    label: "Orders",
    value: "1,429",
    change: "+8.2%",
    trend: "up",
    icon: ShoppingCart,
  },
  {
    label: "Customers",
    value: "3,842",
    change: "+23.1%",
    trend: "up",
    icon: Users,
  },
  {
    label: "Conversion Rate",
    value: "3.24%",
    change: "-2.4%",
    trend: "down",
    icon: TrendingUp,
  },
]

export function MetricsGrid() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric) => {
        const Icon = metric.icon
        return (
          <div
            key={metric.label}
            className="bg-white rounded-2xl p-6 shadow-sm border border-[#e5e5e7] transition-all duration-200 hover:shadow-md"
          >
            <div className="flex items-start justify-between mb-8">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f5f5f7]">
                <Icon className="h-5 w-5 text-[#1d1d1f]" strokeWidth={2} />
              </div>
              <div
                className={`flex items-center gap-1 text-[13px] font-medium ${
                  metric.trend === "up" ? "text-[#34c759]" : "text-[#ff3b30]"
                }`}
              >
                <span>{metric.change}</span>
                <TrendingUp className={`h-3.5 w-3.5 ${metric.trend === "down" ? "rotate-180" : ""}`} strokeWidth={2} />
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-[13px] font-medium text-[#86868b]">{metric.label}</p>
              <p className="text-[32px] font-semibold text-[#1d1d1f] tracking-tight leading-none">{metric.value}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
