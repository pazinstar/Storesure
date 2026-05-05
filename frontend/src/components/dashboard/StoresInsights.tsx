import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent 
} from "@/components/ui/chart";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid,
  BarChart,
  Bar
} from "recharts";
import { Package, ArrowDownCircle, ArrowUpCircle, AlertTriangle, Clock, TrendingUp } from "lucide-react";
import { useRIA } from "@/contexts/RIAContext";
import { differenceInCalendarDays } from "date-fns";
import { Link } from "react-router-dom";

const stockMovementData = [
  { month: "Jul", received: 450, issued: 380 },
  { month: "Aug", received: 520, issued: 420 },
  { month: "Sep", received: 380, issued: 350 },
  { month: "Oct", received: 620, issued: 540 },
  { month: "Nov", received: 480, issued: 460 },
  { month: "Dec", received: 350, issued: 320 },
];

const storeBalances = [
  { store: "Main Store", items: 4250, value: "KES 2.1M" },
  { store: "Science Lab", items: 1840, value: "KES 890K" },
  { store: "Sports Store", items: 560, value: "KES 340K" },
  { store: "Kitchen Store", items: 1280, value: "KES 420K" },
];

const lowStockAlerts = [
  { item: "A4 Paper Reams", current: 15, minimum: 50, store: "Main Store", status: "Critical" },
  { item: "Chalk Boxes", current: 8, minimum: 20, store: "Main Store", status: "Critical" },
  { item: "Lab Chemicals - HCL", current: 5, minimum: 10, store: "Science Lab", status: "Low" },
  { item: "Printer Cartridges", current: 3, minimum: 10, store: "Main Store", status: "Critical" },
  { item: "Exercise Books", current: 120, minimum: 200, store: "Main Store", status: "Low" },
];

const expiringItems = [
  { item: "First Aid Supplies", expiry: "2024-01-15", store: "Sick Bay", daysLeft: 14 },
  { item: "Lab Chemicals - Sodium", expiry: "2024-02-01", store: "Science Lab", daysLeft: 31 },
  { item: "Food Stores - Rice", expiry: "2024-01-30", store: "Kitchen Store", daysLeft: 29 },
];

const chartConfig = {
  received: { label: "S11 - Received", color: "hsl(var(--success))" },
  issued: { label: "S13 - Issued", color: "hsl(var(--primary))" },
};

export function StoresInsights() {
  const { rias } = useRIA();
  const active = rias.filter(r => r.status === "active");
  const pending = rias.filter(r => r.status === "pending");
  const nearLimitAlerts = active.flatMap(r =>
    r.items
      .map(it => {
        const pct = it.approvedQty > 0 ? (it.usedQty / it.approvedQty) * 100 : 0;
        return { ria: r, item: it, pct };
      })
      .filter(x => x.pct >= 80)
  );
  const expiringSoon = active.filter(r => differenceInCalendarDays(new Date(r.endDate), new Date()) <= 7);

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Routine Issue Authorities
            </span>
            <Link to="/stores/ria" className="text-sm text-primary hover:underline">View All</Link>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Active</p>
              <p className="mt-1 text-2xl font-semibold">{active.length}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Near Limit</p>
              <p className="mt-1 text-2xl font-semibold text-warning">{nearLimitAlerts.length}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Expiring Soon</p>
              <p className="mt-1 text-2xl font-semibold text-destructive">{expiringSoon.length}</p>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {nearLimitAlerts.slice(0, 3).map(({ ria, item, pct }, idx) => (
              <div key={idx} className="flex items-center justify-between rounded-md border p-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-warning" />
                  <p className="text-sm">
                    {ria.department} RIA: {item.itemName}
                  </p>
                </div>
                <span className={`text-xs font-medium ${pct >= 90 ? "text-destructive" : "text-warning"}`}>
                  {Math.round(pct)}%
                </span>
              </div>
            ))}
            {nearLimitAlerts.length === 0 && (
              <p className="text-sm text-muted-foreground">No near-limit usage alerts</p>
            )}
          </div>
        </CardContent>
      </Card>
      {/* Stock Movement Chart */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Stock Movement (S11/S13 Analysis)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[280px]">
            <AreaChart data={stockMovementData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="month" className="text-muted-foreground" />
              <YAxis className="text-muted-foreground" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area 
                type="monotone" 
                dataKey="received" 
                stackId="1"
                stroke="var(--color-received)" 
                fill="var(--color-received)" 
                fillOpacity={0.6}
              />
              <Area 
                type="monotone" 
                dataKey="issued" 
                stackId="2"
                stroke="var(--color-issued)" 
                fill="var(--color-issued)" 
                fillOpacity={0.6}
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Store Balances */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Store Balances by Location</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {storeBalances.map((store) => (
              <div key={store.store} className="flex items-center justify-between border-b border-border pb-3 last:border-0">
                <div>
                  <p className="font-medium text-foreground">{store.store}</p>
                  <p className="text-sm text-muted-foreground">{store.items.toLocaleString()} items</p>
                </div>
                <span className="font-semibold text-primary">{store.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Low Stock Alerts */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Low Stock Alerts (GoK Standards)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {lowStockAlerts.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between rounded-lg border border-border p-3">
                <div className="flex items-center gap-3">
                  <ArrowDownCircle className={`h-5 w-5 ${item.status === "Critical" ? "text-destructive" : "text-warning"}`} />
                  <div>
                    <p className="font-medium text-foreground">{item.item}</p>
                    <p className="text-sm text-muted-foreground">{item.store}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-semibold text-foreground">{item.current} / {item.minimum}</p>
                    <p className="text-xs text-muted-foreground">Current / Min</p>
                  </div>
                  <Badge variant={item.status === "Critical" ? "destructive" : "secondary"}>
                    {item.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Expiring Items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ArrowUpCircle className="h-5 w-5 text-warning" />
            Expiring Soon
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {expiringItems.map((item, idx) => (
              <div key={idx} className="rounded-lg border border-border p-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-foreground">{item.item}</p>
                  <Badge variant={item.daysLeft <= 14 ? "destructive" : "secondary"}>
                    {item.daysLeft} days
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{item.store} • Expires: {item.expiry}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
