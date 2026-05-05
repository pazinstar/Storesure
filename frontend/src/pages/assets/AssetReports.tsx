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
  Building2,
  History,
  ClipboardCheck,
  Trash2,
  AlertTriangle,
  MapPin,
  Printer,
  DollarSign,
} from "lucide-react";

const reports = [
  {
    id: 1,
    title: "Asset Register Report",
    description: "Complete list of all registered assets with current status and values",
    icon: Building2,
    category: "Inventory",
    lastGenerated: "Today",
  },
  {
    id: 2,
    title: "Asset Movement History",
    description: "Track all asset transfers and movements between locations",
    icon: History,
    category: "Tracking",
    lastGenerated: "2 days ago",
  },
  {
    id: 3,
    title: "Board of Survey Report",
    description: "Summary of all verification surveys and their findings",
    icon: ClipboardCheck,
    category: "Verification",
    lastGenerated: "1 week ago",
  },
  {
    id: 4,
    title: "Disposal Report",
    description: "All disposed assets with methods and recovered values",
    icon: Trash2,
    category: "Disposal",
    lastGenerated: "3 days ago",
  },
  {
    id: 5,
    title: "Missing/Unverified Assets",
    description: "Assets not accounted for in recent surveys",
    icon: AlertTriangle,
    category: "Alerts",
    lastGenerated: "Today",
  },
  {
    id: 6,
    title: "Assets by Location",
    description: "Breakdown of assets by physical location and department",
    icon: MapPin,
    category: "Location",
    lastGenerated: "1 day ago",
  },
  {
    id: 7,
    title: "Depreciation Report",
    description: "Asset depreciation schedule and current book values",
    icon: DollarSign,
    category: "Financial",
    lastGenerated: "Monthly",
  },
  {
    id: 8,
    title: "Maintenance Summary",
    description: "Asset maintenance history and upcoming service schedules",
    icon: FileText,
    category: "Maintenance",
    lastGenerated: "Weekly",
  },
];

const categories = [
  "All Categories",
  "IT Equipment",
  "Lab Equipment", 
  "Vehicles",
  "Furniture",
  "Equipment",
];

const locations = [
  "All Locations",
  "Admin Block",
  "Science Block",
  "IT Labs",
  "Library",
  "Sports Complex",
  "Boarding Section",
];

export default function AssetReports() {
  return (
    <div className="flex-1 space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Asset Reports</h1>
          <p className="text-muted-foreground mt-1">
            Generate and download asset management reports
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
              <Label htmlFor="category">Category</Label>
              <Select defaultValue="all">
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat.toLowerCase().replace(/\s+/g, "-")}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Select defaultValue="all">
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((loc) => (
                    <SelectItem key={loc} value={loc.toLowerCase().replace(/\s+/g, "-")}>
                      {loc}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="from-date">From Date</Label>
              <Input id="from-date" type="date" defaultValue="2024-01-01" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="to-date">To Date</Label>
              <Input id="to-date" type="date" defaultValue="2024-01-31" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {reports.map((report) => (
          <Card key={report.id} className="overflow-hidden">
            <CardHeader className="border-b border-border bg-muted/50 pb-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <report.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-sm font-medium truncate">{report.title}</CardTitle>
                  <Badge variant="outline" className="mt-1 text-xs">
                    {report.category}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-4 line-clamp-2">{report.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Last: {report.lastGenerated}
                </span>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <Printer className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Asset Summary</CardTitle>
            <CardDescription>Quick overview of asset statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-border p-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Assets</p>
                  <p className="text-2xl font-bold">1,248</p>
                </div>
                <Badge className="bg-success/10 text-success border-success/20">Active</Badge>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Value</p>
                  <p className="text-2xl font-bold">KES 45.2M</p>
                </div>
                <Badge variant="outline">Book Value</Badge>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-4">
                <div>
                  <p className="text-sm text-muted-foreground">This Year Acquisitions</p>
                  <p className="text-2xl font-bold">156</p>
                </div>
                <Badge className="bg-info/10 text-info border-info/20">+12%</Badge>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-4">
                <div>
                  <p className="text-sm text-muted-foreground">Disposals</p>
                  <p className="text-2xl font-bold">23</p>
                </div>
                <Badge variant="secondary">YTD</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Custom Report Builder</CardTitle>
            <CardDescription>Create a custom report with specific fields</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-4 py-8">
              <FileText className="h-16 w-16 text-muted-foreground" />
              <div className="text-center">
                <p className="font-medium">Need a custom report?</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Use the custom report builder to select exactly which fields 
                  and filters you need for your analysis.
                </p>
              </div>
              <Button variant="outline" className="mt-2">Build Custom Report</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
