import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent 
} from "@/components/ui/chart";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid,
  BarChart,
  Bar,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { Building2, TrendingDown, MapPin, ClipboardCheck } from "lucide-react";

const depreciationData = [
  { year: "2019", value: 52.5 },
  { year: "2020", value: 49.8 },
  { year: "2021", value: 47.2 },
  { year: "2022", value: 46.1 },
  { year: "2023", value: 45.8 },
  { year: "2024", value: 45.2 },
];

const assetsByCategory = [
  { category: "Furniture", count: 1250, value: "KES 8.2M" },
  { category: "ICT Equipment", count: 340, value: "KES 12.5M" },
  { category: "Vehicles", count: 8, value: "KES 15.4M" },
  { category: "Lab Equipment", count: 520, value: "KES 6.8M" },
  { category: "Buildings", count: 24, value: "KES 2.3M" },
];

const assetCondition = [
  { name: "Good", value: 68, color: "hsl(var(--success))" },
  { name: "Fair", value: 22, color: "hsl(var(--warning))" },
  { name: "Poor", value: 8, color: "hsl(var(--destructive))" },
  { name: "Condemned", value: 2, color: "hsl(var(--muted-foreground))" },
];

const recentMovements = [
  { asset: "Desktop Computer #45", from: "Admin Block", to: "Science Lab", date: "2024-12-28", officer: "J. Kamau" },
  { asset: "Projector #12", from: "Library", to: "Hall", date: "2024-12-27", officer: "M. Wanjiku" },
  { asset: "Office Chair #89", from: "Staff Room", to: "Admin Block", date: "2024-12-26", officer: "P. Ochieng" },
];

const pendingBOS = [
  { item: "Old Printers (5)", condition: "Condemned", recommendation: "Disposal", surveyor: "BOS Committee" },
  { item: "Damaged Desks (12)", condition: "Poor", recommendation: "Repair", surveyor: "BOS Committee" },
  { item: "Obsolete Computers (8)", condition: "Fair", recommendation: "Transfer", surveyor: "BOS Committee" },
];

const chartConfig = {
  value: { label: "Asset Value (KES M)", color: "hsl(var(--primary))" },
};

export function AssetAnalytics() {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {/* Depreciation Chart */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-primary" />
            Asset Depreciation Trend (GoK Standards)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[280px]">
            <LineChart data={depreciationData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="year" className="text-muted-foreground" />
              <YAxis className="text-muted-foreground" domain={[40, 55]} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="var(--color-value)" 
                strokeWidth={3}
                dot={{ fill: "var(--color-value)", strokeWidth: 2 }}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Asset Condition */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Asset Condition (BOS Ready)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={assetCondition}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {assetCondition.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <ChartTooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 space-y-2">
            {assetCondition.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-muted-foreground">{item.name}</span>
                </div>
                <span className="font-medium text-foreground">{item.value}%</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Assets by Category */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Assets by Category
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {assetsByCategory.map((cat) => (
              <div key={cat.category} className="flex items-center justify-between border-b border-border pb-2 last:border-0">
                <div>
                  <p className="font-medium text-foreground">{cat.category}</p>
                  <p className="text-sm text-muted-foreground">{cat.count.toLocaleString()} items</p>
                </div>
                <span className="font-semibold text-primary">{cat.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Asset Movements */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="h-5 w-5 text-secondary" />
            Recent Movements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentMovements.map((mov, idx) => (
              <div key={idx} className="rounded-lg border border-border p-3">
                <p className="font-medium text-foreground">{mov.asset}</p>
                <p className="text-sm text-muted-foreground">{mov.from} → {mov.to}</p>
                <p className="mt-1 text-xs text-muted-foreground">{mov.date} • {mov.officer}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Board of Survey Pending */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-warning" />
            Pending BOS Items
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {pendingBOS.map((item, idx) => (
              <div key={idx} className="rounded-lg border border-border p-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-foreground">{item.item}</p>
                  <Badge variant={item.condition === "Condemned" ? "destructive" : "secondary"}>
                    {item.recommendation}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">Condition: {item.condition}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
