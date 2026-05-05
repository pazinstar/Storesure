import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { toast } from "sonner";
import { useNotifications } from "@/contexts/NotificationContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useReadOnlyGuard } from "@/hooks/useReadOnlyGuard";
import { useAuth } from "@/contexts/AuthContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Filter, FileText, Eye, Edit, Printer, CheckCircle, Clock, Truck, Package, XCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";


const getStatusBadge = (status: string) => {
  switch (status) {
    case "draft":
      return <Badge variant="outline" className="flex items-center gap-1"><Edit className="h-3 w-3" />Draft</Badge>;
    case "pending_approval":
      return <Badge variant="secondary" className="flex items-center gap-1"><Clock className="h-3 w-3" />Pending Approval</Badge>;
    case "approved":
      return <Badge className="bg-primary flex items-center gap-1"><CheckCircle className="h-3 w-3" />Approved</Badge>;
    case "pending_delivery":
      return <Badge className="bg-secondary flex items-center gap-1"><Truck className="h-3 w-3" />Awaiting Delivery</Badge>;
    case "partial_delivery":
      return <Badge className="bg-accent flex items-center gap-1"><Package className="h-3 w-3" />Partial Delivery</Badge>;
    case "delivered":
      return <Badge className="bg-chart-2 flex items-center gap-1"><CheckCircle className="h-3 w-3" />Delivered</Badge>;
    case "cancelled":
      return <Badge variant="destructive" className="flex items-center gap-1"><XCircle className="h-3 w-3" />Cancelled</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const getPaymentBadge = (status: string) => {
  switch (status) {
    case "pending":
      return <Badge variant="outline">Pending</Badge>;
    case "processing":
      return <Badge variant="secondary">Processing</Badge>;
    case "paid":
      return <Badge className="bg-chart-2">Paid</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const LPOManagement = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const { data: lpos = [] } = useQuery({
    queryKey: ['lpos'],
    queryFn: () => api.getLPOs()
  });

  const { data: stats = { total: 0, pendingDelivery: 0, pendingPayment: 0, totalValue: 0 } } = useQuery({
    queryKey: ['lpo-stats'],
    queryFn: () => api.getLPOStats()
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => api.getActiveSuppliers()
  });

  const { data: tenders = [] } = useQuery({
    queryKey: ['tenders'],
    queryFn: () => api.getTenders()
  });

  const { data: requisitions = [] } = useQuery({
    queryKey: ['purchase-requisitions'],
    queryFn: () => api.getPurchaseRequisitions()
  });

  const createMutation = useMutation({
    mutationFn: (data: Parameters<typeof api.createLPO>[0]) => api.createLPO(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lpos'] });
      queryClient.invalidateQueries({ queryKey: ['lpo-stats'] });
      setIsDialogOpen(false);
      resetForm();
      toast.success("LPO generated successfully");
      addNotification({ title: "LPO Generated", message: `New LPO created successfully`, type: "success", link: "/procurement/lpo" });
    },
    onError: (error) => toast.error("Failed to create LPO: " + error.message)
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { isReadOnly, blockAction } = useReadOnlyGuard();

  // Form State
  const [sourceId, setSourceId] = useState("");
  const [vendorId, setVendorId] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [lpoValue, setLpoValue] = useState("");

  const resetForm = () => {
    setSourceId("");
    setVendorId("");
    setDeliveryDate("");
    setPaymentTerms("");
    setLpoValue("");
  };

  const handleCreateLPO = () => {
    if (!sourceId || !vendorId || !deliveryDate || !paymentTerms || !lpoValue) {
      toast.error("Please fill in all fields.");
      return;
    }

    const supplier = suppliers.find(s => s.id === vendorId);
    if (!supplier) {
      toast.error("Invalid supplier selected.");
      return;
    }

    createMutation.mutate({
      lpoNumber: `LPO-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
      date: new Date().toISOString().split('T')[0],
      supplierId: supplier.id,
      supplierName: supplier.name,
      requisitionRef: sourceId,
      items: [],
      totalAmount: parseFloat(lpoValue),
      status: "Pending Approval",
      paymentStatus: "Pending",
      deliveryStatus: 0,
      notes: `Expected delivery: ${deliveryDate}, Terms: ${paymentTerms}`
    });
  };

  const filteredLPOs = lpos.filter(
    (lpo) =>
      lpo.lpoNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lpo.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lpo.requisitionRef && lpo.requisitionRef.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">LPO Management</h1>
          <p className="text-muted-foreground">Local Purchase Orders per PPADA 2015 Section 135</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              disabled={isReadOnly}
              onClick={() => { if (blockAction("create LPOs")) return; }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create LPO
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Local Purchase Order</DialogTitle>
              <DialogDescription>
                Generate LPO from approved requisition or tender award
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="source">Source Document</Label>
                <Select value={sourceId} onValueChange={setSourceId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select approved requisition/tender" />
                  </SelectTrigger>
                  <SelectContent>
                    {requisitions.filter(r => r.status === "Approved").map(req => (
                      <SelectItem key={req.id} value={req.requisitionNumber}>
                        {req.requisitionNumber} - {req.department}
                      </SelectItem>
                    ))}
                    {tenders.filter(t => t.status === "Closed" || t.status === "Awarded").map(tnd => (
                      <SelectItem key={tnd.id} value={tnd.tenderNumber}>
                        {tnd.tenderNumber} - {tnd.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vendor">Vendor</Label>
                  <Select value={vendorId} onValueChange={setVendorId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select vendor" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map(sup => (
                        <SelectItem key={sup.id} value={sup.id}>{sup.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="delivery">Expected Delivery Date</Label>
                  <Input
                    id="delivery"
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="terms">Payment Terms</Label>
                  <Select value={paymentTerms} onValueChange={setPaymentTerms}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select terms" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cash on Delivery">Cash on Delivery</SelectItem>
                      <SelectItem value="Net 30 Days">Net 30 Days</SelectItem>
                      <SelectItem value="Net 60 Days">Net 60 Days</SelectItem>
                      <SelectItem value="50% Advance">50% Advance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="value">LPO Value (KES)</Label>
                  <Input
                    id="value"
                    type="number"
                    placeholder="0.00"
                    value={lpoValue}
                    onChange={(e) => setLpoValue(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateLPO} disabled={createMutation.isPending || isReadOnly}>
                <FileText className="h-4 w-4 mr-2" />
                {createMutation.isPending ? "Generating..." : "Generate LPO"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total LPOs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">This fiscal year</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Delivery</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary">{stats.pendingDelivery}</div>
            <p className="text-xs text-muted-foreground">Awaiting goods</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Payment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{stats.pendingPayment}</div>
            <p className="text-xs text-muted-foreground">Awaiting clearance</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KES {stats.totalValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Committed this year</p>
          </CardContent>
        </Card>
      </div>

      {/* LPO Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Local Purchase Orders</CardTitle>
              <CardDescription>Track and manage all LPOs</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search LPOs..."
                  className="pl-8 w-[250px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>LPO No.</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Delivery Progress</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLPOs.map((lpo) => (
                <TableRow key={lpo.id}>
                  <TableCell className="font-medium">{lpo.lpoNumber}</TableCell>
                  <TableCell>{lpo.date}</TableCell>
                  <TableCell>{lpo.supplierName}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{lpo.requisitionRef || "N/A"}</Badge>
                  </TableCell>
                  <TableCell>{lpo.items?.length || 0}</TableCell>
                  <TableCell className="font-semibold">KES {lpo.totalAmount?.toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={lpo.deliveryStatus || 0} className="h-2 w-16" />
                      <span className="text-xs text-muted-foreground">{lpo.deliveryStatus || 0}%</span>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(lpo.status?.toLowerCase()?.replace(' ', '_') || '')}</TableCell>
                  <TableCell>{getPaymentBadge(lpo.paymentStatus?.toLowerCase() || 'pending')}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Printer className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default LPOManagement;
