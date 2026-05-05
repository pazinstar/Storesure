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
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { FileCheck, Clock, AlertCircle, CheckCircle2 } from "lucide-react";

const procurementData = [
  { month: "Jul", lpo: 12, requisitions: 18, tenders: 2 },
  { month: "Aug", lpo: 15, requisitions: 22, tenders: 3 },
  { month: "Sep", lpo: 8, requisitions: 14, tenders: 1 },
  { month: "Oct", lpo: 20, requisitions: 28, tenders: 4 },
  { month: "Nov", lpo: 18, requisitions: 25, tenders: 2 },
  { month: "Dec", lpo: 10, requisitions: 16, tenders: 1 },
];

const workflowStatus = [
  { name: "Completed", value: 45, color: "hsl(var(--success))" },
  { name: "In Progress", value: 28, color: "hsl(var(--primary))" },
  { name: "Pending Approval", value: 15, color: "hsl(var(--warning))" },
  { name: "Rejected", value: 12, color: "hsl(var(--destructive))" },
];

const pendingApprovals = [
  { id: "REQ-2024-0234", type: "Requisition", item: "Science Lab Equipment", amount: "KES 245,000", status: "Pending HOD", urgent: true },
  { id: "LPO-2024-0089", type: "LPO", item: "Office Stationery", amount: "KES 45,600", status: "Pending Bursar", urgent: false },
  { id: "TND-2024-0012", type: "Tender", item: "Annual Textbooks", amount: "KES 1.2M", status: "Evaluation", urgent: true },
  { id: "REQ-2024-0235", type: "Requisition", item: "Sports Equipment", amount: "KES 89,000", status: "Pending Principal", urgent: false },
];

const chartConfig = {
  lpo: { label: "LPOs", color: "hsl(var(--primary))" },
  requisitions: { label: "Requisitions", color: "hsl(var(--secondary))" },
  tenders: { label: "Tenders", color: "hsl(var(--accent))" },
};

export function ProcurementAnalytics() {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {/* Procurement Activity Chart */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-primary" />
            Procurement Activity (PPADA 2015 Tracking)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[280px]">
            <BarChart data={procurementData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="month" className="text-muted-foreground" />
              <YAxis className="text-muted-foreground" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="requisitions" fill="var(--color-requisitions)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="lpo" fill="var(--color-lpo)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="tenders" fill="var(--color-tenders)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Workflow Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Workflow Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={workflowStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {workflowStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <ChartTooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {workflowStatus.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-muted-foreground">{item.name}</span>
                </div>
                <span className="font-medium text-foreground">{item.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pending Approvals */}
      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-warning" />
            Pending Approvals (Requires Action)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {pendingApprovals.map((item) => (
              <div 
                key={item.id} 
                className="flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-center gap-4">
                  {item.urgent ? (
                    <AlertCircle className="h-5 w-5 text-destructive" />
                  ) : (
                    <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
                  )}
                  <div>
                    <p className="font-medium text-foreground">{item.item}</p>
                    <p className="text-sm text-muted-foreground">{item.id} • {item.type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-semibold text-foreground">{item.amount}</span>
                  <Badge variant={item.urgent ? "destructive" : "secondary"}>
                    {item.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
