"use client"

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const data = [
  { date: "Jan 1", revenue: 2890 },
  { date: "Jan 5", revenue: 3420 },
  { date: "Jan 10", revenue: 3180 },
  { date: "Jan 15", revenue: 3890 },
  { date: "Jan 20", revenue: 4120 },
  { date: "Jan 25", revenue: 3950 },
  { date: "Jan 30", revenue: 4480 },
  { date: "Feb 4", revenue: 4220 },
  { date: "Feb 9", revenue: 4680 },
  { date: "Feb 14", revenue: 5120 },
  { date: "Feb 19", revenue: 4890 },
  { date: "Feb 24", revenue: 5340 },
  { date: "Mar 1", revenue: 5680 },
]

export function RevenueChart() {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#e5e5e7]">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-base font-semibold text-[#1d1d1f]">Revenue Overview</h3>
          <p className="text-[13px] text-[#86868b] mt-1">Daily revenue for the last 30 days</p>
        </div>
        <div className="text-right">
          <p className="text-[28px] font-semibold text-[#1d1d1f] tracking-tight leading-none">$48,574</p>
          <p className="text-[13px] text-[#86868b] mt-1">Total revenue</p>
        </div>
      </div>

      <ChartContainer
        config={{
          revenue: {
            label: "Revenue",
            color: "hsl(var(--chart-1))",
          },
        }}
        className="h-[280px] w-full"
      >
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--chart-1))" stopOpacity={0.2} />
              <stop offset="100%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} opacity={0.5} />
          <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
          <YAxis
            stroke="hsl(var(--muted-foreground))"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `$${value}`}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="hsl(var(--chart-1))"
            strokeWidth={2}
            fill="url(#revenueGradient)"
          />
        </AreaChart>
      </ChartContainer>
    </div>
  )
}
