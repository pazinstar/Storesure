import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BookOpen,
  Users,
  BookCopy,
  AlertTriangle,
  TrendingUp,
  Clock,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useLibrary } from "@/contexts/LibraryContext";

const CATEGORY_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function LibraryDashboard() {
  const {
    bookCopies,
    bookTitles,
    loanTransactions,
    getOverdueLoans,
    getTotalCopies,
    getAvailableCopies,
    getIssuedCopies,
    isLoading,
  } = useLibrary();

  // ── KPIs ────────────────────────────────────────────────────────────────────
  const overdueLoans = getOverdueLoans();
  const activeLoans = loanTransactions.filter((t) => t.status === "Active" || t.status === "Overdue");
  const uniqueBorrowers = new Set(activeLoans.map((t) => t.borrowerId)).size;

  // ── Circulation trends (last 6 months) ──────────────────────────────────────
  const circulationData = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      const m = d.getMonth();
      const y = d.getFullYear();
      const issued = loanTransactions.filter((t) => {
        const id = new Date(t.issueDate);
        return id.getMonth() === m && id.getFullYear() === y;
      }).length;
      const returned = loanTransactions.filter((t) => {
        if (!t.returnDate) return false;
        const rd = new Date(t.returnDate);
        return rd.getMonth() === m && rd.getFullYear() === y;
      }).length;
      return { month: MONTH_LABELS[m], issued, returned };
    });
  }, [loanTransactions]);

  // ── Category distribution ────────────────────────────────────────────────────
  const categoryDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    bookCopies.forEach((c) => {
      counts[c.category] = (counts[c.category] ?? 0) + 1;
    });
    const total = bookCopies.length || 1;
    return Object.entries(counts)
      .map(([name, count], i) => ({
        name,
        value: Math.round((count / total) * 100),
        color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
      }))
      .sort((a, b) => b.value - a.value);
  }, [bookCopies]);

  // ── Overdue list ─────────────────────────────────────────────────────────────
  const overdueList = useMemo(() => {
    const today = new Date();
    return overdueLoans.slice(0, 5).map((t) => ({
      id: t.id,
      title: t.bookTitle,
      borrower: t.borrowerName,
      cls: t.borrowerClass ?? t.borrowerType,
      daysOverdue: Math.max(1, Math.ceil((today.getTime() - new Date(t.dueDate).getTime()) / 86400000)),
    }));
  }, [overdueLoans]);

  // ── Recent activity ──────────────────────────────────────────────────────────
  const recentActivity = useMemo(() => {
    return [...loanTransactions]
      .sort((a, b) => {
        const aDate = a.returnDate ?? a.issueDate;
        const bDate = b.returnDate ?? b.issueDate;
        return new Date(bDate).getTime() - new Date(aDate).getTime();
      })
      .slice(0, 5)
      .map((t) => {
        const isReturn = !!t.returnDate;
        const eventDate = new Date(isReturn ? t.returnDate! : t.issueDate);
        const diffMs = Date.now() - eventDate.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const timeAgo =
          diffMins < 60
            ? `${diffMins} min${diffMins !== 1 ? "s" : ""} ago`
            : diffMins < 1440
            ? `${Math.floor(diffMins / 60)} hr${Math.floor(diffMins / 60) !== 1 ? "s" : ""} ago`
            : `${Math.floor(diffMins / 1440)} day${Math.floor(diffMins / 1440) !== 1 ? "s" : ""} ago`;
        return {
          id: t.id,
          action: isReturn ? "Book Returned" : "Book Issued",
          details: `${t.bookTitle} — ${t.borrowerName}`,
          time: timeAgo,
          type: isReturn ? "return" : "issue",
        };
      });
  }, [loanTransactions]);

  // ── Branch statistics ────────────────────────────────────────────────────────
  const branchStats = useMemo(() => {
    const map: Record<string, { titles: Set<string>; total: number; issued: number }> = {};
    bookCopies.forEach((c) => {
      if (!map[c.location]) map[c.location] = { titles: new Set(), total: 0, issued: 0 };
      map[c.location].titles.add(c.title);
      map[c.location].total += 1;
      if (c.status === "Issued" || c.status === "Overdue") map[c.location].issued += 1;
    });
    return Object.entries(map).map(([branch, s]) => ({
      branch,
      titles: s.titles.size,
      copies: s.total,
      utilization: s.total > 0 ? Math.round((s.issued / s.total) * 100) : 0,
    }));
  }, [bookCopies]);

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Library Dashboard</h1>
        <p className="text-muted-foreground">Overview of library operations and circulation statistics</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Titles</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bookTitles.length}</div>
            <p className="text-xs text-muted-foreground">Unique titles in catalogue</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Copies</CardTitle>
            <BookCopy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getTotalCopies()}</div>
            <p className="text-xs text-green-600">{getAvailableCopies()} available · {getIssuedCopies()} issued</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Borrowers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueBorrowers}</div>
            <p className="text-xs text-muted-foreground">{activeLoans.length} active loan{activeLoans.length !== 1 ? "s" : ""}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overdue Books</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overdueLoans.length}</div>
            <p className={`text-xs ${overdueLoans.length > 0 ? "text-red-600" : "text-green-600"}`}>
              {overdueLoans.length > 0 ? "Requires follow-up" : "All books on time"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Circulation Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Circulation Trends
            </CardTitle>
            <CardDescription>Monthly book issues and returns (last 6 months)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={circulationData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Line type="monotone" dataKey="issued" stroke="hsl(var(--primary))" strokeWidth={2} name="Issued" />
                <Line type="monotone" dataKey="returned" stroke="hsl(var(--chart-2))" strokeWidth={2} name="Returned" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Collection by Category</CardTitle>
            <CardDescription>Distribution of library copies</CardDescription>
          </CardHeader>
          <CardContent>
            {categoryDistribution.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No copies in catalogue</p>
            ) : (
              <div className="flex items-center gap-8">
                <ResponsiveContainer width="50%" height={200}>
                  <PieChart>
                    <Pie
                      data={categoryDistribution}
                      cx="50%" cy="50%"
                      innerRadius={50} outerRadius={80}
                      paddingAngle={2} dataKey="value"
                    >
                      {categoryDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => `${v}%`} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {categoryDistribution.map((cat) => (
                    <div key={cat.name} className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: cat.color }} />
                      <span className="text-sm">{cat.name}</span>
                      <span className="text-sm text-muted-foreground ml-auto">{cat.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Overdue + Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Overdue Books
            </CardTitle>
            <CardDescription>Books requiring follow-up action</CardDescription>
          </CardHeader>
          <CardContent>
            {overdueList.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No overdue books</p>
            ) : (
              <div className="space-y-3">
                {overdueList.map((book) => (
                  <div key={book.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{book.title}</p>
                      <p className="text-xs text-muted-foreground">{book.borrower} · {book.cls}</p>
                    </div>
                    <Badge variant="destructive" className="text-xs">{book.daysOverdue} days</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No activity yet</p>
            ) : (
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className={`h-2 w-2 rounded-full mt-2 ${activity.type === "issue" ? "bg-blue-500" : "bg-green-500"}`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.action}</p>
                      <p className="text-xs text-muted-foreground">{activity.details}</p>
                      <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Branch Statistics */}
      {branchStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Branch Statistics</CardTitle>
            <CardDescription>Collection and utilization by library location</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {branchStats.map((branch) => (
                <div key={branch.branch} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{branch.branch}</span>
                      <Badge variant="secondary">{branch.titles} title{branch.titles !== 1 ? "s" : ""}</Badge>
                      <Badge variant="outline">{branch.copies} cop{branch.copies !== 1 ? "ies" : "y"}</Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">{branch.utilization}% utilization</span>
                  </div>
                  <Progress value={branch.utilization} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
