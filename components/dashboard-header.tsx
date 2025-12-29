import { Bell, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export function DashboardHeader() {
  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <h1 className="text-xl font-semibold tracking-tight text-foreground">Analytics</h1>

            <nav className="hidden md:flex items-center gap-6">
              <a href="#" className="text-sm font-medium text-foreground transition-colors hover:text-muted-foreground">
                Overview
              </a>
              <a href="#" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                Products
              </a>
              <a href="#" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                Customers
              </a>
              <a href="#" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                Reports
              </a>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
              <Bell className="h-5 w-5" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 text-sm font-medium">
                  Last 30 days
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-36">
                <DropdownMenuItem>Last 7 days</DropdownMenuItem>
                <DropdownMenuItem>Last 30 days</DropdownMenuItem>
                <DropdownMenuItem>Last 90 days</DropdownMenuItem>
                <DropdownMenuItem>Last year</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  )
}
