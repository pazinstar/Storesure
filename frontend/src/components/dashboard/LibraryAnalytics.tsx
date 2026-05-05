import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent 
} from "@/components/ui/chart";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid,
  LineChart,
  Line
} from "recharts";
import { BookOpen, Users, AlertCircle, TrendingUp } from "lucide-react";

const borrowingTrends = [
  { month: "Jul", issued: 320, returned: 280 },
  { month: "Aug", issued: 450, returned: 410 },
  { month: "Sep", issued: 380, returned: 360 },
  { month: "Oct", issued: 520, returned: 480 },
  { month: "Nov", issued: 410, returned: 390 },
  { month: "Dec", issued: 280, returned: 320 },
];

const textbookCoverage = [
  { class: "Form 1", coverage: 92 },
  { class: "Form 2", coverage: 88 },
  { class: "Form 3", coverage: 85 },
  { class: "Form 4", coverage: 95 },
];

const branchStats = [
  { branch: "Main Library", books: 5240, borrowed: 180, overdue: 12 },
  { branch: "Junior Section", books: 1840, borrowed: 95, overdue: 8 },
  { branch: "Reference Section", books: 1154, borrowed: 67, overdue: 3 },
];

const overdueBooks = [
  { title: "Physics Form 3", student: "John Mwangi", class: "3B", daysOverdue: 14, branch: "Main Library" },
  { title: "Chemistry Form 4", student: "Mary Njeri", class: "4A", daysOverdue: 10, branch: "Main Library" },
  { title: "Biology Form 2", student: "Peter Ouma", class: "2C", daysOverdue: 7, branch: "Junior Section" },
  { title: "Mathematics Form 1", student: "Jane Achieng", class: "1A", daysOverdue: 5, branch: "Main Library" },
];

const lostDamaged = [
  { title: "English Grammar", type: "Lost", student: "David Kimani", value: "KES 1,200" },
  { title: "History Atlas", type: "Damaged", student: "Grace Wambui", value: "KES 800" },
];

const chartConfig = {
  issued: { label: "Books Issued", color: "hsl(var(--primary))" },
  returned: { label: "Books Returned", color: "hsl(var(--success))" },
  coverage: { label: "Coverage %", color: "hsl(var(--secondary))" },
};

export function LibraryAnalytics() {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {/* Borrowing Trends */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Library Circulation (MoE Tracking)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[280px]">
            <BarChart data={borrowingTrends}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="month" className="text-muted-foreground" />
              <YAxis className="text-muted-foreground" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="issued" fill="var(--color-issued)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="returned" fill="var(--color-returned)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Branch Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Branch Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {branchStats.map((branch) => (
              <div key={branch.branch} className="border-b border-border pb-3 last:border-0">
                <p className="font-medium text-foreground">{branch.branch}</p>
                <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Holdings</p>
                    <p className="font-semibold text-foreground">{branch.books.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">On Loan</p>
                    <p className="font-semibold text-primary">{branch.borrowed}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Overdue</p>
                    <p className="font-semibold text-destructive">{branch.overdue}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Textbook Coverage */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-success" />
            Textbook Coverage by Class
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[200px]">
            <BarChart data={textbookCoverage} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis type="number" domain={[0, 100]} className="text-muted-foreground" />
              <YAxis dataKey="class" type="category" className="text-muted-foreground" width={60} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="coverage" fill="var(--color-coverage)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Overdue Books */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Overdue Books (Requires Follow-up)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {overdueBooks.map((book, idx) => (
              <div key={idx} className="flex items-center justify-between rounded-lg border border-border p-3">
                <div className="flex items-center gap-3">
                  <BookOpen className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-foreground">{book.title}</p>
                    <p className="text-sm text-muted-foreground">{book.student} • Class {book.class}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">{book.branch}</span>
                  <Badge variant="destructive">{book.daysOverdue} days overdue</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Lost/Damaged */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-5 w-5 text-warning" />
            Lost/Damaged (Pending Recovery)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {lostDamaged.map((item, idx) => (
              <div key={idx} className="rounded-lg border border-border p-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-foreground">{item.title}</p>
                  <Badge variant={item.type === "Lost" ? "destructive" : "secondary"}>
                    {item.type}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{item.student}</p>
                <p className="mt-1 text-sm font-semibold text-warning">Recovery: {item.value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
