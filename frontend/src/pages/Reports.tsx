import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, TrendingUp, Package, AlertCircle } from "lucide-react";

const reports = [
  {
    id: 1,
    title: "Monthly Inventory Report",
    description: "Complete overview of inventory status and movements",
    date: "January 2024",
    type: "Monthly",
    icon: FileText,
  },
  {
    id: 2,
    title: "Low Stock Items",
    description: "Items that need immediate restocking attention",
    date: "Current",
    type: "Alert",
    icon: AlertCircle,
  },
  {
    id: 3,
    title: "Category Analysis",
    description: "Breakdown of inventory by category and usage",
    date: "Q4 2023",
    type: "Quarterly",
    icon: Package,
  },
  {
    id: 4,
    title: "Usage Trends",
    description: "Historical data on item checkouts and returns",
    date: "2023",
    type: "Annual",
    icon: TrendingUp,
  },
];

const quickStats = [
  { label: "Total Items", value: "2,346", change: "+12%" },
  { label: "Value", value: "$127,450", change: "+8%" },
  { label: "Categories", value: "12", change: "0%" },
  { label: "Locations", value: "48", change: "+3%" },
];

export default function Reports() {
  return (
    <div className="flex-1 space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reports & Analytics</h1>
          <p className="text-muted-foreground mt-1">
            View and download inventory reports
          </p>
        </div>
        <Button className="gap-2">
          <Download className="h-4 w-4" />
          Export All
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {quickStats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-6">
              <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
              <p className="mt-2 text-3xl font-bold text-foreground">{stat.value}</p>
              <p className="mt-1 text-sm text-success">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {reports.map((report) => (
          <Card key={report.id} className="overflow-hidden">
            <CardHeader className="border-b border-border bg-muted/50">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <report.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{report.title}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {report.description}
                    </p>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Period</p>
                  <p className="font-medium text-foreground">{report.date}</p>
                </div>
                <Badge variant="outline">{report.type}</Badge>
              </div>
              <Button className="w-full mt-4 gap-2" variant="outline">
                <Download className="h-4 w-4" />
                Download Report
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generate Custom Report</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Create a custom report with specific parameters and date ranges.
          </p>
          <Button>Create Custom Report</Button>
        </CardContent>
      </Card>
    </div>
  );
}
