import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const products = [
  {
    name: "Wireless Headphones Pro",
    category: "Electronics",
    sales: 1289,
    revenue: "$38,670",
    trend: "+12%",
  },
  {
    name: "Smart Watch Series 5",
    category: "Wearables",
    sales: 892,
    revenue: "$26,760",
    trend: "+8%",
  },
  {
    name: "Premium Laptop Stand",
    category: "Accessories",
    sales: 743,
    revenue: "$11,145",
    trend: "+23%",
  },
  {
    name: "Ergonomic Mouse",
    category: "Accessories",
    sales: 654,
    revenue: "$9,810",
    trend: "+5%",
  },
  {
    name: "USB-C Hub Pro",
    category: "Accessories",
    sales: 521,
    revenue: "$15,630",
    trend: "-2%",
  },
]

export function ProductsTable() {
  return (
    <Card className="shadow-sm">
      <CardHeader className="border-b border-border pb-6">
        <CardTitle className="text-lg font-semibold text-foreground">Top Products</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-semibold text-foreground">Product</TableHead>
              <TableHead className="font-semibold text-foreground">Category</TableHead>
              <TableHead className="font-semibold text-foreground text-right">Sales</TableHead>
              <TableHead className="font-semibold text-foreground text-right">Revenue</TableHead>
              <TableHead className="font-semibold text-foreground text-right">Trend</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.name} className="hover:bg-muted/50">
                <TableCell className="font-medium text-foreground">{product.name}</TableCell>
                <TableCell className="text-muted-foreground">{product.category}</TableCell>
                <TableCell className="text-right text-foreground">{product.sales.toLocaleString()}</TableCell>
                <TableCell className="text-right font-medium text-foreground">{product.revenue}</TableCell>
                <TableCell
                  className={`text-right font-medium ${
                    product.trend.startsWith("+") ? "text-chart-2" : "text-destructive"
                  }`}
                >
                  {product.trend}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
