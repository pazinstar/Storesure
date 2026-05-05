import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";

export default function StoreDashboard() {
  const { data: recentTransactions = [] } = useQuery({
    queryKey: ['dashboard-transactions'],
    queryFn: () => api.getDashboardTransactions()
  });

  const { data: lowStockItems = [] } = useQuery({
    queryKey: ['dashboard-low-stock'],
    queryFn: () => api.getDashboardLowStock()
  });

  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.getDashboardStats()
  });

  return (
    <div className="flex-1 space-y-6 p-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Store Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Main Store • Overview and quick stats
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats ? (
          <>
            <StatCard
              title="Total Items"
              value={stats.totalItems.value}
              icon={Package}
              trend={stats.totalItems.trend}
              trendUp={stats.totalItems.trendUp}
            />
            <StatCard
              title="Low Stock Items"
              value={stats.lowStockItems.value}
              icon={AlertTriangle}
              trend={stats.lowStockItems.trend}
              trendUp={stats.lowStockItems.trendUp}
            />
            <StatCard
              title="S11 This Month"
              value={stats.s11ThisMonth.value}
              icon={ArrowDownToLine}
              trend={stats.s11ThisMonth.trend}
              trendUp={stats.s11ThisMonth.trendUp}
            />
            <StatCard
              title="S13 This Month"
              value={stats.s13ThisMonth.value}
              icon={ArrowUpFromLine}
              trend={stats.s13ThisMonth.trend}
              trendUp={stats.s13ThisMonth.trendUp}
            />
          </>
        ) : (
          <div className="col-span-full h-32 flex items-center justify-center text-muted-foreground">Loading stats...</div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Recent Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between rounded-lg border border-border p-3"
                >
                  <div className="flex items-center gap-3">
                    {tx.type === "S11" ? (
                      <ArrowDownToLine className="h-4 w-4 text-success" />
                    ) : tx.type === "S13" ? (
                      <ArrowUpFromLine className="h-4 w-4 text-warning" />
                    ) : (
                      <TrendingUp className="h-4 w-4 text-info" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-foreground">{tx.item}</p>
                      <p className="text-xs text-muted-foreground">
                        {tx.type} • Qty: {tx.qty} • {tx.date}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      tx.status === "Completed"
                        ? "default"
                        : tx.status === "Pending"
                          ? "secondary"
                          : "outline"
                    }
                  >
                    {tx.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Low Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {lowStockItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-lg border border-border p-3"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Minimum: {item.minimum} {item.unit}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-destructive">
                      {item.current}
                    </p>
                    <p className="text-xs text-muted-foreground">{item.unit}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {stats ? (
          <>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
                    <TrendingUp className="h-6 w-6 text-success" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Stock Value</p>
                    <p className="text-2xl font-bold text-foreground">{stats.stockValue}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-info/10">
                    <Package className="h-6 w-6 text-info" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Categories</p>
                    <p className="text-2xl font-bold text-foreground">{stats.categories}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-warning/10">
                    <TrendingDown className="h-6 w-6 text-warning" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Pending Issues</p>
                    <p className="text-2xl font-bold text-foreground">{stats.pendingIssues}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>
    </div>
  );
}
