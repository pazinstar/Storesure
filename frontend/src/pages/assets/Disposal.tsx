import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Search, Plus, Trash2, Eye, FileText, DollarSign, CheckCircle, Clock, XCircle } from "lucide-react";



export default function Disposal() {
  const { data: disposals = [] } = useQuery({
    queryKey: ['assetDisposals'],
    queryFn: () => api.getAssetDisposals()
  });

  const { data: disposalMethods = [] } = useQuery({
    queryKey: ['assetDisposalMethods'],
    queryFn: () => api.getAssetDisposalMethods()
  });

  const { data: disposalReasons = [] } = useQuery({
    queryKey: ['assetDisposalReasons'],
    queryFn: () => api.getAssetDisposalReasons()
  });

  const [searchTerm, setSearchTerm] = useState("");

  const filteredDisposals = disposals.filter((disp) =>
    disp.asset.toLowerCase().includes(searchTerm.toLowerCase()) ||
    disp.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Completed":
        return <Badge className="bg-success/10 text-success border-success/20"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
      case "In Process":
        return <Badge className="bg-info/10 text-info border-info/20"><Clock className="h-3 w-3 mr-1" />In Process</Badge>;
      case "Pending Approval":
        return <Badge className="bg-warning/10 text-warning border-warning/20"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case "Rejected":
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getMethodBadge = (method: string) => {
    switch (method) {
      case "Auction":
        return <Badge variant="outline" className="text-success">Auction</Badge>;
      case "Sale":
        return <Badge variant="outline" className="text-info">Sale</Badge>;
      case "Write-off":
        return <Badge variant="outline" className="text-destructive">Write-off</Badge>;
      case "Donation":
        return <Badge variant="outline" className="text-warning">Donation</Badge>;
      case "Trade-in":
        return <Badge variant="outline" className="text-primary">Trade-in</Badge>;
      default:
        return <Badge variant="outline">{method}</Badge>;
    }
  };

  return (
    <div className="flex-1 space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Asset Disposal</h1>
          <p className="text-muted-foreground mt-1">
            Manage disposal and write-off of school assets
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Disposal
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Initiate Asset Disposal</DialogTitle>
              <DialogDescription>
                Record disposal of an asset
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dsp-number">Disposal No.</Label>
                  <Input id="dsp-number" value="DSP-2024-004" readOnly className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dsp-date">Date</Label>
                  <Input id="dsp-date" type="date" defaultValue="2024-01-16" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="asset">Asset</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select asset" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ast-045">AST-045 - HP Laptop ProBook</SelectItem>
                    <SelectItem value="ast-089">AST-089 - Office Chair</SelectItem>
                    <SelectItem value="ast-012">AST-012 - Generator 25KVA</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="method">Disposal Method</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      {disposalMethods.map((method) => (
                        <SelectItem key={method} value={method.toLowerCase().replace(/\s+/g, "-")}>
                          {method}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reason">Reason</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select reason" />
                    </SelectTrigger>
                    <SelectContent>
                      {disposalReasons.map((reason) => (
                        <SelectItem key={reason} value={reason.toLowerCase().replace(/\s+/g, "-")}>
                          {reason}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="original-value">Original Value (KES)</Label>
                  <Input id="original-value" type="number" placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="disposal-value">Disposal Value (KES)</Label>
                  <Input id="disposal-value" type="number" placeholder="0" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="remarks">Remarks</Label>
                <Textarea id="remarks" placeholder="Additional details about the disposal..." />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline">Cancel</Button>
              <Button>Submit for Approval</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Trash2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Disposals</p>
                <p className="text-2xl font-bold text-foreground">156</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning/10">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-foreground">8</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                <DollarSign className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Written Off</p>
                <p className="text-2xl font-bold text-foreground">KES 2.4M</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10">
                <DollarSign className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Recovered</p>
                <p className="text-2xl font-bold text-foreground">KES 890K</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Disposal Records</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search disposals..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-full sm:w-[250px]"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Disposal No.</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Asset</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead className="text-right">Original</TableHead>
                  <TableHead className="text-right">Disposal</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDisposals.map((disposal) => (
                  <TableRow key={disposal.id}>
                    <TableCell className="font-mono text-sm font-medium">{disposal.id}</TableCell>
                    <TableCell>{disposal.date}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{disposal.asset}</p>
                        <p className="text-xs text-muted-foreground">{disposal.assetId}</p>
                      </div>
                    </TableCell>
                    <TableCell>{getMethodBadge(disposal.method)}</TableCell>
                    <TableCell className="text-sm">{disposal.reason}</TableCell>
                    <TableCell className="text-right">{disposal.originalValue}</TableCell>
                    <TableCell className="text-right font-semibold">{disposal.disposalValue}</TableCell>
                    <TableCell>{getStatusBadge(disposal.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Disposal Workflow</CardTitle>
          <CardDescription>Standard disposal approval process</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-center gap-1">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">1</div>
                <span className="text-xs text-muted-foreground">Initiate</span>
              </div>
              <div className="h-0.5 w-12 bg-border" />
              <div className="flex flex-col items-center gap-1">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground text-sm font-medium">2</div>
                <span className="text-xs text-muted-foreground">BOS Review</span>
              </div>
              <div className="h-0.5 w-12 bg-border" />
              <div className="flex flex-col items-center gap-1">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground text-sm font-medium">3</div>
                <span className="text-xs text-muted-foreground">Approval</span>
              </div>
              <div className="h-0.5 w-12 bg-border" />
              <div className="flex flex-col items-center gap-1">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground text-sm font-medium">4</div>
                <span className="text-xs text-muted-foreground">Execution</span>
              </div>
              <div className="h-0.5 w-12 bg-border" />
              <div className="flex flex-col items-center gap-1">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground text-sm font-medium">5</div>
                <span className="text-xs text-muted-foreground">Complete</span>
              </div>
            </div>
            <Button variant="outline" className="gap-2">
              <FileText className="h-4 w-4" />
              View Policy
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
