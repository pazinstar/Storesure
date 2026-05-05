import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/services/api";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Download,
  FileText,
  Scale,
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowLeftRight,
  AlertTriangle,
  Clock,
  Printer,
} from "lucide-react";

const iconMap: Record<string, any> = {
  Scale,
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowLeftRight,
  AlertTriangle,
  Clock,
  FileText
};

export default function StoreReports() {
  const [store, setStore] = useState("all");
  const [from, setFrom] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10));
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));
  const [category, setCategory] = useState("all");

  const { data: reports = [] } = useQuery({ queryKey: ["store-reports"], queryFn: api.getStoreReports });
  const { data: settings } = useQuery({ queryKey: ["inventory-settings"], queryFn: api.getInventorySettings });

  const exportMutation = useMutation({
    mutationFn: (reportId: number) => api.exportReport(reportId, { store, from, to, category }),
    onSuccess: (data) => {
      const url = window.URL.createObjectURL(data);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `report_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      toast.success("Report exported successfully!");
    },
    onError: () => {
      toast.error("Failed to export report.");
    }
  });

  const handleExport = (reportId: number) => {
    exportMutation.mutate(reportId);
  };

  const handlePrint = (reportId: number) => {
    exportMutation.mutateAsync(reportId).then(() => {
      window.print();
    });
  };

  return (
    <div className="flex-1 space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Store Reports</h1>
          <p className="text-muted-foreground mt-1">
            Generate and download inventory reports
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Report Parameters</CardTitle>
          <CardDescription>Select parameters for report generation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="store">Store</Label>
              <Select value={store} onValueChange={setStore}>
                <SelectTrigger>
                  <SelectValue placeholder="Select store" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stores</SelectItem>
                  {settings?.departmentLocations.map((loc) => (
                    <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                  ))}
                  <SelectItem value="main">Main Store</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="from-date">From Date</Label>
              <Input id="from-date" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="to-date">To Date</Label>
              <Input id="to-date" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {settings?.categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {reports.map((report: any) => {
          const Icon = iconMap[report.icon] || FileText;
          return (
            <Card key={report.id} className="overflow-hidden">
              <CardHeader className="border-b border-border bg-muted/50">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base">{report.title}</CardTitle>
                    <Badge variant="outline" className="mt-1">
                      {report.category}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground mb-4">{report.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Last: {report.lastGenerated}
                  </span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="gap-1" onClick={() => handlePrint(report.id)} disabled={exportMutation.isPending}>
                      <Printer className="h-3.5 w-3.5" />
                      Print
                    </Button>
                    <Button size="sm" className="gap-1" onClick={() => handleExport(report.id)} disabled={exportMutation.isPending}>
                      <Download className="h-3.5 w-3.5" />
                      Export
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Custom Report Builder</CardTitle>
          <CardDescription>Create a custom report with specific fields and filters</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <FileText className="h-12 w-12 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">
                Need a report with specific data? Use the custom report builder to select exactly
                which fields and filters you need for your analysis.
              </p>
            </div>
            <Button variant="outline">Build Custom Report</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
