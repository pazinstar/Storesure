import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useReadOnlyGuard } from "@/hooks/useReadOnlyGuard";
import { useAuditLog } from "@/hooks/useAuditLog";
import { useAuth } from "@/contexts/AuthContext";
import { LPO, LPOStatus } from "@/mock/data";
import { procurementService } from "@/services/procurement.service";
import { Supplier } from "@/mock/procurement.mock";
import { useS12 } from "@/contexts/S12Context";
import { toast } from "sonner";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus, Search, Filter, Eye, Printer,
  CheckCircle, Clock, Truck, Package, XCircle,
  FileText, Send, Edit, Link2
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import PrintDialog from "@/components/prints/PrintDialog";
import LPOPrintTemplate, { LPOPrintData } from "@/components/prints/LPOPrintTemplate";
import { ItemCombobox, AssetType, StoreItem } from "@/components/stores/ItemCombobox";

interface LPOItemForm {
  itemCode: string;
  description: string;
  unit: string;
  assetType: AssetType | "";
  quantity: number;
  unitPrice: number;
}

const getStatusBadge = (status: string) => {
  const config: Record<string, { icon: React.ReactNode; className: string }> = {
    "Draft": { icon: <Edit className="h-3 w-3" />, className: "bg-muted text-muted-foreground" },
    "Pending Approval": { icon: <Clock className="h-3 w-3" />, className: "bg-secondary text-secondary-foreground" },
    "Approved": { icon: <CheckCircle className="h-3 w-3" />, className: "bg-primary/10 text-primary" },
    "Sent to Supplier": { icon: <Send className="h-3 w-3" />, className: "bg-info/10 text-info" },
    "Partially Delivered": { icon: <Package className="h-3 w-3" />, className: "bg-accent text-accent-foreground" },
    "Fully Delivered": { icon: <CheckCircle className="h-3 w-3" />, className: "bg-chart-2 text-white" },
    "Cancelled": { icon: <XCircle className="h-3 w-3" />, className: "bg-destructive text-destructive-foreground" },
    // Potential backend alternatives
    "Pending": { icon: <Clock className="h-3 w-3" />, className: "bg-secondary text-secondary-foreground" },
    "Processing": { icon: <Clock className="h-3 w-3" />, className: "bg-secondary text-secondary-foreground" },
    "Completed": { icon: <CheckCircle className="h-3 w-3" />, className: "bg-chart-2 text-white" },
  };
  const c = config[status] || { icon: <Clock className="h-3 w-3" />, className: "bg-muted text-muted-foreground" };
  return (
    <Badge className={`${c.className} gap-1`} variant={!config[status] ? "outline" : "default"}>
      {c.icon}
      {status || "Unknown"}
    </Badge>
  );
};

const getPaymentBadge = (status: string) => {
  switch (status) {
    case "Pending": return <Badge variant="outline">Pending</Badge>;
    case "Processing": return <Badge variant="secondary">Processing</Badge>;
    case "Paid": return <Badge className="bg-chart-2 text-white">Paid</Badge>;
    default: return <Badge variant="outline">{status}</Badge>;
  }
};

export default function LPOManagementPage() {
  const queryClient = useQueryClient();

  const { data: settings } = useQuery({
    queryKey: ['inventory-settings'],
    queryFn: () => api.getInventorySettings()
  });
  const { data: storeItems = [] } = useQuery({
    queryKey: ['store-items'],
    queryFn: () => api.getStoreItems()
  });
  const { data: stats = { total: 0, pendingDelivery: 0, pendingPayment: 0, totalValue: 0 } } = useQuery({
    queryKey: ['lpo-stats'],
    queryFn: () => api.getLPOStats()
  });
  const { data: lpos = [], isLoading: isLoadingLPOs } = useQuery<LPO[]>({
    queryKey: ['lpos'],
    queryFn: () => api.getLPOs()
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers"],
    queryFn: () => procurementService.getSuppliers(),
  });

  const createMutation = useMutation({
    mutationFn: (data: Parameters<typeof api.createLPO>[0]) => api.createLPO(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lpos'] }),
    onError: (error) => toast.error("Failed to create LPO: " + error.message)
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: Parameters<typeof api.updateLPO>[1] }) => api.updateLPO(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lpos'] }),
    onError: (error) => toast.error("Failed to update LPO: " + error.message)
  });

  const paymentTermsOptions = settings?.paymentTermsOptions || [];
  const storeLocations = settings?.storeLocations || [];

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [printData, setPrintData] = useState<LPOPrintData | null>(null);
  const [selectedLPO, setSelectedLPO] = useState<LPO | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  // Form state
  const [supplierId, setSupplierId] = useState("");
  const [storeLocation, setStoreLocation] = useState("");
  const [expectedDelivery, setExpectedDelivery] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [requisitionRef, setRequisitionRef] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<LPOItemForm[]>([
    { itemCode: "", description: "", unit: "", assetType: "", quantity: 0, unitPrice: 0 }
  ]);

  const { isReadOnly, blockAction } = useReadOnlyGuard();
  const { logStoresAction } = useAuditLog();
  const { user, canCreate } = useAuth();
  const { requisitions } = useS12();

  const getActiveSuppliers = () => suppliers.filter(s => s.status === "Active");
  const getSupplierById = (id: string) => suppliers.find(s => s.id === id);

  const activeSuppliers = getActiveSuppliers();

  // Get approved requisitions that can be linked to LPOs
  const approvedRequisitions = (requisitions || []).filter(
    r => r.status === "Approved" || r.status === "Partially Issued"
  );

  const filteredLPOs = (lpos || []).filter((lpo) => {
    const matchesSearch =
      lpo.lpoNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lpo.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lpo.requisitionRef?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesStatus = statusFilter === "all" || lpo.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleRequisitionChange = (ref: string) => {
    setRequisitionRef(ref);
    if (ref === "none") {
      setItems([{ itemCode: "", description: "", unit: "", assetType: "", quantity: 0, unitPrice: 0 }]);
      return;
    }

    const req = approvedRequisitions.find((r) => r.s12Number === ref);
    if (req && req.items && req.items.length > 0) {
      const newItems: LPOItemForm[] = req.items.map((item) => {
        // Find matching store item to get the correct assetType, if available
        const storeItem = storeItems.find((si: StoreItem) => si.code === item.itemCode);
        return {
          itemCode: item.itemCode,
          description: item.description,
          unit: item.unit,
          assetType: storeItem?.assetType || "Consumable",
          quantity: item.quantityApproved || item.quantityRequested || 0,
          unitPrice: item.unitPrice || 0,
        };
      });
      setItems(newItems);
    } else {
      setItems([{ itemCode: "", description: "", unit: "", assetType: "", quantity: 0, unitPrice: 0 }]);
    }
  };

  const handleAddItem = () => {
    setItems([...items, { itemCode: "", description: "", unit: "", assetType: "", quantity: 0, unitPrice: 0 }]);
  };

  const handleItemSelect = (index: number, selectedItem: StoreItem) => {
    const updated = [...items];
    updated[index] = {
      ...updated[index],
      itemCode: selectedItem.code,
      description: selectedItem.description,
      unit: selectedItem.unit,
      assetType: selectedItem.assetType,
    };
    setItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleItemChange = (index: number, field: keyof LPOItemForm, value: string | number) => {
    const updated = [...items];
    if (field === "quantity" || field === "unitPrice") {
      updated[index][field] = Number(value) || 0;
    } else if (field === "assetType") {
      updated[index][field] = value as AssetType | "";
    } else {
      updated[index][field] = value as string;
    }
    setItems(updated);
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  };

  const resetForm = () => {
    setSupplierId("");
    setStoreLocation("");
    setExpectedDelivery("");
    setPaymentTerms("");
    setRequisitionRef("");
    setNotes("");
    setItems([{ itemCode: "", description: "", unit: "", assetType: "", quantity: 0, unitPrice: 0 }]);
    setIsDialogOpen(false);
  };

  const handleSaveDraft = () => {
    if (!supplierId || !storeLocation) {
      toast.error("Please select a supplier and store location");
      return;
    }

    const validItems = items.filter(item => item.description && item.quantity > 0);
    if (validItems.length === 0) {
      toast.error("Please add at least one item");
      return;
    }

    const supplier = getSupplierById(supplierId);
    if (!supplier) {
      toast.error("Supplier not found");
      return;
    }

    const paymentLabel = paymentTermsOptions.find((p: any) => p.value === paymentTerms)?.label || paymentTerms;
    const storeName = storeLocation;

    createMutation.mutate({
      date: new Date().toISOString().split("T")[0],
      supplierId: supplier.id,
      supplierName: supplier.name,
      supplierAddress: supplier.physicalAddress,
      supplierPhone: supplier.phone,
      supplierEmail: supplier.email,
      supplierTaxPin: supplier.taxPin,
      storeLocation: storeName,
      items: validItems.map(item => ({
        id: crypto.randomUUID(),
        description: item.description,
        unit: item.unit,
        assetType: item.assetType || "Consumable",
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        deliveredQty: 0,
      })),
      totalValue: calculateTotal(),
      status: "Draft",
      paymentStatus: "Pending",
      paymentTerms: paymentLabel,
      expectedDeliveryDate: expectedDelivery,
      requisitionRef: requisitionRef && requisitionRef !== "none" ? requisitionRef : undefined,
      notes: notes || undefined,
      preparedBy: user?.name || "Unknown",
      preparedAt: new Date().toISOString(),
    });

    logStoresAction("LPO Created", `LPO draft created for ${supplier.name}`);
    toast.success("LPO Saved", { description: `Saved as draft` });
    resetForm();
  };

  const handleSubmitForApproval = () => {
    if (!supplierId || !storeLocation || !expectedDelivery || !paymentTerms) {
      toast.error("Please fill in all required fields");
      return;
    }

    const validItems = items.filter(item => item.description && item.quantity > 0 && item.unitPrice > 0);
    if (validItems.length === 0) {
      toast.error("Please add at least one complete item with price");
      return;
    }

    const supplier = getSupplierById(supplierId);
    if (!supplier) {
      toast.error("Supplier not found");
      return;
    }

    const paymentLabel = paymentTermsOptions.find((p: any) => p.value === paymentTerms)?.label || paymentTerms;
    const storeName = storeLocation;

    createMutation.mutate({
      date: new Date().toISOString().split("T")[0],
      supplierId: supplier.id,
      supplierName: supplier.name,
      supplierAddress: supplier.physicalAddress,
      supplierPhone: supplier.phone,
      supplierEmail: supplier.email,
      supplierTaxPin: supplier.taxPin,
      storeLocation: storeName,
      items: validItems.map(item => ({
        id: crypto.randomUUID(),
        description: item.description,
        unit: item.unit,
        assetType: item.assetType || "Consumable",
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        deliveredQty: 0,
      })),
      totalValue: calculateTotal(),
      status: "Pending Approval",
      paymentStatus: "Pending",
      paymentTerms: paymentLabel,
      expectedDeliveryDate: expectedDelivery,
      requisitionRef: requisitionRef && requisitionRef !== "none" ? requisitionRef : undefined,
      notes: notes || undefined,
      preparedBy: user?.name || "Unknown",
      preparedAt: new Date().toISOString(),
    });

    logStoresAction("LPO Submitted", "LPO submitted for approval");
    toast.success("LPO Submitted", { description: `Submitted for approval` });
    resetForm();
  };

  const handleStatusUpdate = (lpo: LPO, newStatus: LPOStatus) => {
    if (isReadOnly) {
      blockAction("update LPO status");
      return;
    }

    const now = new Date().toISOString();
    const updates: Partial<LPO> = { status: newStatus };

    if (newStatus === "Approved") {
      updates.approvedBy = user?.name;
      updates.approvedAt = now;
    }

    updateMutation.mutate({ id: lpo.id, data: updates });
    logStoresAction("LPO Status Updated", `${lpo.lpoNumber}: ${lpo.status} → ${newStatus}`);
    toast.success("Status Updated", { description: `${lpo.lpoNumber} is now ${newStatus}` });
  };

  const handlePrintLPO = (lpo: LPO, copyType: "original" | "duplicate") => {
    const data: LPOPrintData = {
      lpoNumber: lpo.lpoNumber,
      date: lpo.date,
      supplierName: lpo.supplierName,
      supplierAddress: lpo.supplierAddress,
      supplierPhone: lpo.supplierPhone,
      supplierEmail: lpo.supplierEmail,
      supplierTaxPin: lpo.supplierTaxPin,
      storeLocation: lpo.storeLocation,
      expectedDeliveryDate: lpo.expectedDeliveryDate,
      paymentTerms: lpo.paymentTerms,
      requisitionRef: lpo.requisitionRef,
      items: lpo.items.map(item => ({
        description: item.description,
        unit: item.unit,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
      preparedBy: lpo.preparedBy,
      preparedAt: lpo.preparedAt?.split("T")[0] || "",
      approvedBy: lpo.approvedBy,
      approvedAt: lpo.approvedAt?.split("T")[0],
      notes: lpo.notes,
      copyType,
    };

    setPrintData(data);
    setPrintDialogOpen(true);
    logStoresAction("LPO Printed", `${lpo.lpoNumber} printed as ${copyType}`);
    // Also open server-side printable HTML in a new tab for PDF/WeasyPrint
    try {
      const url = `/api/v1/storekeeper/stores/lpos/${lpo.id}/print-html/?copy=${copyType}`;
      window.open(url, '_blank');
    } catch (e) {
      // ignore in test env
    }
  };

  const handleViewLPO = (lpo: LPO) => {
    setSelectedLPO(lpo);
    setViewDialogOpen(true);
    logStoresAction("LPO Viewed", `Viewed ${lpo.lpoNumber}`);
  };

  const getDeliveryProgress = (lpo: LPO) => {
    if (!lpo.items) return 0;
    const totalOrdered = lpo.items.reduce((sum, item) => sum + item.quantity, 0);
    const totalDelivered = lpo.items.reduce((sum, item) => sum + item.deliveredQty, 0);
    return totalOrdered > 0 ? Math.round((totalDelivered / totalOrdered) * 100) : 0;
  };

  const getNextLPONumber = () => {
    return `LPO-${new Date().getFullYear()}-${String(lpos.length + 1).padStart(3, "0")}`;
  };


  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Purchase Orders (LPO)</h1>
          <p className="text-muted-foreground">Local Purchase Orders (LPO) per PPADA 2015 Section 135</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            {canCreate("stores") && (
              <Button
                disabled={isReadOnly}
                onClick={() => { if (blockAction("create LPOs")) return; }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create LPO
              </Button>
            )}
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Local Purchase Order</DialogTitle>
              <DialogDescription>
                LPO Number: {getNextLPONumber()} (Auto-generated)
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {/* Supplier & Store */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Supplier *</Label>
                  <Select value={supplierId} onValueChange={setSupplierId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeSuppliers.map(s => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name} ({s.taxPin})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Delivery Store *</Label>
                  <Select value={storeLocation} onValueChange={setStoreLocation}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select store" />
                    </SelectTrigger>
                    <SelectContent>
                      {storeLocations.map(s => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Dates & Terms */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Expected Delivery *</Label>
                  <Input
                    type="date"
                    value={expectedDelivery}
                    onChange={(e) => setExpectedDelivery(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Payment Terms *</Label>
                  <Select value={paymentTerms} onValueChange={setPaymentTerms}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select terms" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentTermsOptions.map(p => (
                        <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Requisition Ref</Label>
                  <Select value={requisitionRef} onValueChange={handleRequisitionChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select approved requisition" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">-- No Requisition --</SelectItem>
                      {approvedRequisitions.map(r => (
                        <SelectItem key={r.id} value={r.s12Number}>
                          {r.s12Number} - {r.requestingDepartment} ({r.status})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>Items</Label>
                  <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
                    <Plus className="h-3 w-3 mr-1" /> Add Item
                  </Button>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[280px]">Item</TableHead>
                      <TableHead className="w-24">Unit</TableHead>
                      <TableHead className="w-20">Qty</TableHead>
                      <TableHead className="w-28">Unit Price</TableHead>
                      <TableHead className="w-28">Total</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <ItemCombobox
                            items={storeItems}
                            value={item.itemCode}
                            onSelect={(selected) => handleItemSelect(index, selected)}
                            placeholder="Search item..."
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={item.unit}
                            readOnly
                            className="bg-muted"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={0}
                            value={item.quantity || ""}
                            onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={0}
                            step={0.01}
                            value={item.unitPrice || ""}
                            onChange={(e) => handleItemChange(index, "unitPrice", e.target.value)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          KES {(item.quantity * item.unitPrice).toLocaleString("en-KE", { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveItem(index)}
                            disabled={items.length === 1}
                          >
                            <XCircle className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={4} className="text-right font-bold">
                        Total:
                      </TableCell>
                      <TableCell className="font-bold">
                        KES {calculateTotal().toLocaleString("en-KE", { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label>Notes / Special Instructions</Label>
                <Textarea
                  placeholder="Any special delivery instructions or notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleSaveDraft}>
                <FileText className="h-4 w-4 mr-2" />
                Save Draft
              </Button>
              <Button onClick={handleSubmitForApproval}>
                <Send className="h-4 w-4 mr-2" />
                Submit for Approval
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
            <p className="text-xs text-muted-foreground">To be processed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              KES {Number(stats.totalValue || 0).toLocaleString("en-KE", { minimumFractionDigits: 2 })}
            </div>
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
              <CardDescription>Track and manage all LPOs with GRN linkage</CardDescription>
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
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Pending Approval">Pending Approval</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Sent to Supplier">Sent to Supplier</SelectItem>
                  <SelectItem value="Partially Delivered">Partially Delivered</SelectItem>
                  <SelectItem value="Fully Delivered">Fully Delivered</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredLPOs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {lpos.length === 0
                ? "No LPOs created yet. Click 'Create LPO' to add your first order."
                : "No LPOs match your search criteria."
              }
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>LPO No.</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Req. Ref</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Delivery</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>GRNs</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLPOs.map((lpo) => (
                  <TableRow key={lpo.id}>
                    <TableCell className="font-mono font-medium">{lpo.lpoNumber}</TableCell>
                    <TableCell>{lpo.date}</TableCell>
                    <TableCell className="max-w-[150px] truncate">{lpo.supplierName}</TableCell>
                    <TableCell>
                      {lpo.requisitionRef ? (
                        <Badge variant="outline">{lpo.requisitionRef}</Badge>
                      ) : "-"}
                    </TableCell>
                    <TableCell>{lpo.items?.length || 0}</TableCell>
                    <TableCell className="font-semibold">
                      KES {lpo.totalValue.toLocaleString("en-KE")}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={getDeliveryProgress(lpo)} className="h-2 w-16" />
                        <span className="text-xs text-muted-foreground">
                          {getDeliveryProgress(lpo)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(lpo.status)}</TableCell>
                    <TableCell>{getPaymentBadge(lpo.paymentStatus)}</TableCell>
                    <TableCell>
                      {lpo.linkedGRNs && lpo.linkedGRNs.length > 0 ? (
                        <Badge variant="outline" className="gap-1">
                          <Link2 className="h-3 w-3" />
                          {lpo.linkedGRNs.length}
                        </Badge>
                      ) : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleViewLPO(lpo)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handlePrintLPO(lpo, "original")}>
                          <Printer className="h-4 w-4" />
                        </Button>
                        {lpo.status === "Pending Approval" && !isReadOnly && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleStatusUpdate(lpo, "Approved")}
                          >
                            <CheckCircle className="h-4 w-4 text-primary" />
                          </Button>
                        )}
                        {lpo.status === "Approved" && !isReadOnly && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleStatusUpdate(lpo, "Sent to Supplier")}
                          >
                            <Send className="h-4 w-4 text-info" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* View LPO Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>LPO Details: {selectedLPO?.lpoNumber}</DialogTitle>
            <DialogDescription>
              Created on {selectedLPO?.date} for {selectedLPO?.supplierName}
            </DialogDescription>
          </DialogHeader>
          {selectedLPO && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Status:</span> {getStatusBadge(selectedLPO.status)}
                </div>
                <div>
                  <span className="font-medium">Payment:</span> {getPaymentBadge(selectedLPO.paymentStatus)}
                </div>
                <div>
                  <span className="font-medium">Store:</span> {selectedLPO.storeLocation}
                </div>
                <div>
                  <span className="font-medium">Expected Delivery:</span> {selectedLPO.expectedDeliveryDate}
                </div>
                <div>
                  <span className="font-medium">Payment Terms:</span> {selectedLPO.paymentTerms}
                </div>
                <div>
                  <span className="font-medium">Requisition:</span> {selectedLPO.requisitionRef || "N/A"}
                </div>
              </div>

              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Delivered</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(selectedLPO.items || []).map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.description}</TableCell>
                        <TableCell>{item.unit}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">{item.deliveredQty}</TableCell>
                        <TableCell className="text-right">
                          KES {item.unitPrice.toLocaleString("en-KE")}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          KES {(item.quantity * item.unitPrice).toLocaleString("en-KE")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-between items-center pt-2">
                <span className="font-bold">Total Value:</span>
                <span className="text-lg font-bold">
                  KES {selectedLPO.totalValue.toLocaleString("en-KE", { minimumFractionDigits: 2 })}
                </span>
              </div>

              {selectedLPO.linkedGRNs && selectedLPO.linkedGRNs.length > 0 && (
                <div className="pt-2">
                  <span className="font-medium">Linked GRNs:</span>
                  <div className="flex gap-2 mt-1">
                    {selectedLPO.linkedGRNs.map((grn) => (
                      <Badge key={grn} variant="outline">{grn}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => selectedLPO && handlePrintLPO(selectedLPO, "duplicate")}>
              <Printer className="h-4 w-4 mr-2" />
              Print Duplicate (PV)
            </Button>
            <Button onClick={() => selectedLPO && handlePrintLPO(selectedLPO, "original")}>
              <Printer className="h-4 w-4 mr-2" />
              Print Original
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Print Dialog */}
      {printData && (
        <PrintDialog
          open={printDialogOpen}
          onOpenChange={setPrintDialogOpen}
          title={`LPO: ${printData.lpoNumber} (${printData.copyType === "original" ? "Original" : "Duplicate"})`}
        >
          <LPOPrintTemplate data={printData} />
        </PrintDialog>
      )}
    </div>
  );
}
