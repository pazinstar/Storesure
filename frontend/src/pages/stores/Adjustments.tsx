import { useState, useEffect } from "react";
import { api } from "@/services/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AdjustmentRecord } from "@/mock/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useReadOnlyGuard } from "@/hooks/useReadOnlyGuard";
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
import { Search, Plus, RefreshCw, Eye, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";

export default function Adjustments() {
  const queryClient = useQueryClient();

  const { data: initialAdjustments = [] } = useQuery({
    queryKey: ['adjustments'],
    queryFn: () => api.getAdjustments()
  });

  const { data: settings } = useQuery({
    queryKey: ['inventory-settings'],
    queryFn: () => api.getInventorySettings()
  });

  const { data: inventoryItems = [] } = useQuery({
    queryKey: ['inventory'],
    queryFn: () => api.getInventory()
  });

  const adjustmentReasons = settings?.adjustmentReasons || [];

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    item: '',
    type: '',
    qty: '',
    reason: '',
    remarks: ''
  });

  const createMutation = useMutation({
    mutationFn: (newAdjustment: Partial<AdjustmentRecord>) => api.createAdjustment(newAdjustment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adjustments'] });
      toast.success("Adjustment submitted for approval");
      setIsDialogOpen(false);
      setFormData({ item: '', type: '', qty: '', reason: '', remarks: '' });
    },
    onError: () => {
      toast.error("Failed to create stock adjustment.");
    }
  });

  const handleSubmit = () => {
    if (!formData.item || !formData.type || !formData.qty || !formData.reason) {
      toast.error("Please fill in all required fields");
      return;
    }

    createMutation.mutate({
      date: new Date().toISOString().split('T')[0],
      item: inventoryItems.find(i => i.id === formData.item)?.name || formData.item,
      type: formData.type as 'Addition' | 'Deduction',
      qty: parseInt(formData.qty, 10),
      reason: formData.reason,
      status: 'Pending',
      approvedBy: '-'
    });
  };

  const [adjustments, setAdjustments] = useState<AdjustmentRecord[]>([]);
  useEffect(() => {
    if (initialAdjustments.length > 0 && adjustments.length === 0) {
      setAdjustments(initialAdjustments);
    }
  }, [initialAdjustments]);

  const [searchTerm, setSearchTerm] = useState("");
  const { isReadOnly, blockAction } = useReadOnlyGuard();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Approved":
        return <Badge className="bg-success/10 text-success border-success/20">Approved</Badge>;
      case "Pending":
        return <Badge className="bg-warning/10 text-warning border-warning/20">Pending</Badge>;
      case "Rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    return type === "Addition" ? (
      <Badge className="bg-success/10 text-success border-success/20">
        <TrendingUp className="h-3 w-3 mr-1" />
        Addition
      </Badge>
    ) : (
      <Badge className="bg-destructive/10 text-destructive border-destructive/20">
        <TrendingDown className="h-3 w-3 mr-1" />
        Deduction
      </Badge>
    );
  };

  return (
    <div className="flex-1 space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Stock Adjustments</h1>
          <p className="text-muted-foreground mt-1">
            Manage inventory corrections — returns, damage, loss, obsolete, and condemned write-offs. Adjustments on <span className="font-mono">Permanent / Expendable</span> items post to the S2 ledger with full audit trail; <span className="font-mono">Consumable</span> adjustments post to S1.
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="gap-2"
              disabled={isReadOnly}
              onClick={() => { if (blockAction("create adjustments")) return; setIsDialogOpen(true); }}
            >
              <Plus className="h-4 w-4" />
              New Adjustment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Stock Adjustment</DialogTitle>
              <DialogDescription>
                Record a stock adjustment for inventory correction
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="adj-number">Adjustment No.</Label>
                  <Input id="adj-number" placeholder="Auto-generated" readOnly className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adj-date">Date</Label>
                  <Input id="adj-date" type="date" defaultValue={new Date().toISOString().split('T')[0]} readOnly className="bg-muted" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="item">Item</Label>
                <Select value={formData.item} onValueChange={(val) => setFormData(p => ({ ...p, item: val }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select item" />
                  </SelectTrigger>
                  <SelectContent>
                    {inventoryItems.map((invItem) => (
                      <SelectItem key={invItem.id} value={invItem.id}>
                        {invItem.id} - {invItem.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="adj-type">Type</Label>
                  <Select value={formData.type} onValueChange={(val) => setFormData(p => ({ ...p, type: val }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Addition">Addition</SelectItem>
                      <SelectItem value="Deduction">Deduction</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="qty">Quantity</Label>
                  <Input id="qty" type="number" placeholder="0" value={formData.qty} onChange={(e) => setFormData(p => ({ ...p, qty: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reason">Reason</Label>
                <Select value={formData.reason} onValueChange={(val) => setFormData(p => ({ ...p, reason: val }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select reason" />
                  </SelectTrigger>
                  <SelectContent>
                    {adjustmentReasons.map((reason) => (
                      <SelectItem key={reason} value={reason}>
                        {reason}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="remarks">Remarks</Label>
                <Textarea id="remarks" placeholder="Additional details..." value={formData.remarks} onChange={(e) => setFormData(p => ({ ...p, remarks: e.target.value }))} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={createMutation.isPending}>
                {createMutation.isPending ? "Submitting..." : "Submit for Approval"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <RefreshCw className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold text-foreground">12</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10">
                <TrendingUp className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Additions</p>
                <p className="text-2xl font-bold text-foreground">5</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                <TrendingDown className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Deductions</p>
                <p className="text-2xl font-bold text-foreground">7</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning/10">
                <AlertCircle className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-foreground">3</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Adjustment History</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search adjustments..."
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
                  <TableHead>Adj. No.</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Approved By</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adjustments.map((adj) => (
                  <TableRow key={adj.id}>
                    <TableCell className="font-mono text-sm font-medium">{adj.id}</TableCell>
                    <TableCell>{adj.date}</TableCell>
                    <TableCell className="font-medium">{adj.item}</TableCell>
                    <TableCell>{getTypeBadge(adj.type)}</TableCell>
                    <TableCell className="text-right font-semibold">{adj.qty}</TableCell>
                    <TableCell>{adj.reason}</TableCell>
                    <TableCell>{getStatusBadge(adj.status)}</TableCell>
                    <TableCell>{adj.approvedBy}</TableCell>
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
    </div>
  );
}
