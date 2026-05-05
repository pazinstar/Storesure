import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/services/api";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  BarChart3,
  PieChart,
  FileSpreadsheet,
  Printer,
  Mail,
  ClipboardList,
  ShoppingCart,
  Users,
  DollarSign,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";



const getIconComponent = (iconName: string) => {
  switch (iconName) {
    case "BarChart3": return BarChart3;
    case "ClipboardList": return ClipboardList;
    case "ShoppingCart": return ShoppingCart;
    case "Users": return Users;
    case "DollarSign": return DollarSign;
    case "FileSpreadsheet": return FileSpreadsheet;
    default: return FileText;
  }
};

const ProcurementReports = () => {
  const [reportType, setReportType] = useState("");
  const [dateRange, setDateRange] = useState("");
  const [format, setFormat] = useState("");

  const { data: kpis = { totalValue: 0, utilization: 0, processingTime: 0, compliance: 0 } } = useQuery({
    queryKey: ['reportsKPIs'],
    queryFn: () => api.getReportsKPIs()
  });

  const { data: monthlySpend = [] } = useQuery({
    queryKey: ['reportsMonthlySpend'],
    queryFn: () => api.getReportsMonthlySpend()
  });

  const { data: categoryBreakdown = [] } = useQuery({
    queryKey: ['reportsCategoryBreakdown'],
    queryFn: () => api.getReportsCategoryBreakdown()
  });

  const { data: vendorPerformance = [] } = useQuery({
    queryKey: ['reportsVendorPerformance'],
    queryFn: () => api.getReportsVendorPerformance()
  });

  const { data: standardReports = [] } = useQuery({
    queryKey: ['reportsStandard'],
    queryFn: () => api.getReportsStandard()
  });

  const generateReportMutation = useMutation({
    mutationFn: () => api.generateReport(reportType, dateRange, format),
    onSuccess: (data) => {
      toast.success("Report generated successfully", { description: "Download will start shortly." });
      console.log("Downloading from:", data.url);
    },
    onError: (error) => toast.error("Report Generation Failed: " + error.message)
  });

  const handleGenerateReport = () => {
    if (!reportType || !dateRange || !format) {
      toast.error("Please configure all report options");
      return;
    }
    generateReportMutation.mutate();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Procurement Reports</h1>
          <p className="text-muted-foreground">PPADA 2015 compliant reporting and analytics</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            FY 2024/25
          </Button>
          <Button>
            <FileText className="h-4 w-4 mr-2" />
            Generate Custom Report
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Procurement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KES {(kpis.totalValue / 1000000).toFixed(2)}M</div>
            <p className="text-xs text-primary">↑ 12% from last year</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Budget Utilization</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.utilization}%</div>
            <p className="text-xs text-muted-foreground">Of approved budget</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Processing Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.processingTime} days</div>
            <p className="text-xs text-chart-2">↓ 2.3 days improvement</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Compliance Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.compliance}%</div>
            <p className="text-xs text-muted-foreground">PPADA compliance</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Budget vs Actual */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Planned vs Actual Spend
            </CardTitle>
            <CardDescription>Monthly budget utilization tracking</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={monthlySpend}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" tickFormatter={(value) => `${value / 1000}K`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => `KES ${value.toLocaleString()}`}
                />
                <Legend />
                <Line type="monotone" dataKey="planned" stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" name="Planned" />
                <Line type="monotone" dataKey="actual" stroke="hsl(var(--primary))" strokeWidth={2} name="Actual" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-secondary" />
              Procurement by Category
            </CardTitle>
            <CardDescription>Distribution across PPADA categories</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="50%" height={200}>
                <RechartsPieChart>
                  <Pie
                    data={categoryBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {categoryBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `KES ${(value / 1000000).toFixed(1)}M`} />
                </RechartsPieChart>
              </ResponsiveContainer>
              <div className="space-y-3">
                {categoryBreakdown.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <div>
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">KES {(item.value / 1000000).toFixed(1)}M</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vendor Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-accent" />
            Vendor Performance Summary
          </CardTitle>
          <CardDescription>Top vendors by procurement value and performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {vendorPerformance.map((vendor) => (
              <div key={vendor.vendor} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">{vendor.vendor}</p>
                  <p className="text-sm text-muted-foreground">{vendor.orders} orders • {vendor.value}</p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-sm font-medium">{vendor.onTime}%</p>
                    <p className="text-xs text-muted-foreground">On-Time</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">{vendor.quality}%</p>
                    <p className="text-xs text-muted-foreground">Quality</p>
                  </div>
                  <Badge variant={vendor.onTime >= 90 ? "default" : vendor.onTime >= 80 ? "secondary" : "destructive"}>
                    {vendor.onTime >= 90 ? "Excellent" : vendor.onTime >= 80 ? "Good" : "Needs Improvement"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Standard Reports */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Standard Reports
          </CardTitle>
          <CardDescription>PPADA 2015 compliant statutory and management reports</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {standardReports.map((report) => (
              <div key={report.name} className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    {(() => {
                      const Icon = getIconComponent(report.icon);
                      return <Icon className="h-5 w-5 text-primary" />;
                    })()}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{report.name}</h4>
                    <p className="text-xs text-muted-foreground mt-1">{report.description}</p>
                    <div className="flex items-center gap-2 mt-3">
                      <Badge variant="outline" className="text-xs">{report.format}</Badge>
                      <div className="flex gap-1 ml-auto">
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <Printer className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <Mail className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Custom Report Generator */}
      <Card>
        <CardHeader>
          <CardTitle>Custom Report Generator</CardTitle>
          <CardDescription>Generate tailored procurement reports</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label>Report Type</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="summary">Summary Report</SelectItem>
                  <SelectItem value="detailed">Detailed Report</SelectItem>
                  <SelectItem value="vendor">Vendor Report</SelectItem>
                  <SelectItem value="category">Category Report</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Date Range</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="q1">Q1 (Jul-Sep)</SelectItem>
                  <SelectItem value="q2">Q2 (Oct-Dec)</SelectItem>
                  <SelectItem value="q3">Q3 (Jan-Mar)</SelectItem>
                  <SelectItem value="q4">Q4 (Apr-Jun)</SelectItem>
                  <SelectItem value="fy">Full Year</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Format</Label>
              <Select value={format} onValueChange={setFormat}>
                <SelectTrigger>
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="excel">Excel</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button className="w-full" onClick={handleGenerateReport} disabled={generateReportMutation.isPending}>
                <Download className="h-4 w-4 mr-2" />
                {generateReportMutation.isPending ? "Generating..." : "Generate Report"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProcurementReports;
