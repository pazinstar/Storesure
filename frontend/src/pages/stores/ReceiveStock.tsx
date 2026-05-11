import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useAuditLog } from "@/hooks/useAuditLog";
import { useReadOnlyGuard } from "@/hooks/useReadOnlyGuard";
import { useAuth } from "@/contexts/AuthContext";
import { LPO, AssetType } from "@/mock/data";
import { toast } from "sonner";
import { useNotifications } from "@/contexts/NotificationContext";
import { api } from "@/services/api";
import { assetsService } from '@/services/assets.service';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ReusableTable, { Column } from '@/components/ui/reusable-table';
import { TablePagination } from '@/components/ui/table-pagination';
import { DocumentStatus, S11Record } from "@/mock/data";
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
import {
  Search, Plus, ArrowDownToLine, FileText, Eye, Printer,
  Lock, Send, CheckCircle, Clock, FileCheck, PenLine, XCircle
} from "lucide-react";
import S11PrintTemplate, { S11PrintData } from "@/components/prints/S11PrintTemplate";
import PrintDialog from "@/components/prints/PrintDialog";
import CapitalizationSummaryDialog from '@/components/CapitalizationSummaryDialog';

// Type for selected LPO items in form
interface SelectedLPOData {
  lpo: LPO;
  items: Array<{ description: string; quantity: number; unit: string; assetType: AssetType; unitPrice: number }>;
}

export default function ReceiveStock() {
  const [page, setPage] = useState(1);
  const { data: pageData, isLoading: isPageLoading } = useQuery({
    queryKey: ['s11-records', page],
    queryFn: () => api.getS11RecordsPaginated(page),
    keepPreviousData: true,
  });

  const { data: s11Stats } = useQuery({
    queryKey: ['s11-stats'],
    queryFn: () => api.getS11Stats(),
    staleTime: 1000 * 60, // 1 minute
  });
  const { data: settings } = useQuery({
    queryKey: ['inventory-settings'],
    queryFn: () => api.getInventorySettings()
  });

  const storeLocations = settings?.storeLocations || [];

  const [records, setRecords] = useState<S11Record[]>([]);
  const queryClient = useQueryClient();
  useEffect(() => {
    if (pageData?.results && records.length === 0) setRecords(pageData.results);
  }, [pageData]);

  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [lpoReference, setLpoReference] = useState("");
  const [selectedLpoData, setSelectedLpoData] = useState<SelectedLPOData | null>(null);
  const [receivedQuantities, setReceivedQuantities] = useState<Record<number, number>>({});
  const [itemConfirmed, setItemConfirmed] = useState<Record<number, boolean>>({});
  const [editReason, setEditReason] = useState("");
  const [sourceType, setSourceType] = useState<"Supplier" | "Internal Store">("Supplier");
  const [storeLocation, setStoreLocation] = useState("");
  const [internalSourceStore, setInternalSourceStore] = useState("");
  const [signatureConfirmed, setSignatureConfirmed] = useState(false);
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [printData, setPrintData] = useState<S11PrintData | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<S11Record | null>(null);
  const [capSuggestions, setCapSuggestions] = useState<any[]>([]);
  const [showCapDialog, setShowCapDialog] = useState(false);
  const [supplierName, setSupplierName] = useState("");
  const [lpoDate, setLpoDate] = useState("");
  const { logStoresAction } = useAuditLog();
  const { isReadOnly, blockAction } = useReadOnlyGuard();
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const { data: lpos = [] } = useQuery({
    queryKey: ['lpos'],
    queryFn: () => api.getLPOs()
  });

  const getPendingDeliveryLPOs = () => {
    return lpos.filter((lpo: LPO) =>
      lpo.status === "Approved" ||
      lpo.status === "Sent to Supplier" ||
      lpo.status === "Partially Delivered"
    );
  };

  const getLPOByNumber = (lpoNumber: string) => {
    return lpos.find((lpo: LPO) => lpo.lpoNumber === lpoNumber);
  };

  // Get LPOs that can receive goods (Approved, Sent to Supplier, Partially Delivered)
  const availableLPOs = getPendingDeliveryLPOs();

  const handleLpoSelect = (lpoNumber: string) => {
    setLpoReference(lpoNumber);

    if (lpoNumber === "none") {
      setSelectedLpoData(null);
      setReceivedQuantities({});
      setItemConfirmed({});
      setEditReason("");
      setSupplierName("");
      setLpoDate("");
      return;
    }

    const lpo = getLPOByNumber(lpoNumber);
    if (lpo) {
      const items = lpo.items.map(item => ({
        description: item.description,
        quantity: item.quantity - item.deliveredQty, // Remaining to deliver
        unit: item.unit,
        assetType: item.assetType,
        unitPrice: item.unitPrice,
      }));

      setSelectedLpoData({ lpo, items });

      // Auto-fill supplier info and date
      setSupplierName(lpo.supplierName);
      setLpoDate(lpo.date);

      // Initialize received quantities with remaining quantities and all items confirmed
      const initialQtys: Record<number, number> = {};
      const initialConfirmed: Record<number, boolean> = {};
      items.forEach((item, idx) => {
        initialQtys[idx] = item.quantity;
        initialConfirmed[idx] = true;
      });
      setReceivedQuantities(initialQtys);
      setItemConfirmed(initialConfirmed);
      setEditReason("");
    } else {
      setSelectedLpoData(null);
      setReceivedQuantities({});
      setItemConfirmed({});
      setEditReason("");
      setSupplierName("");
      setLpoDate("");
    }
  };

  const handleReceivedQtyChange = (idx: number, value: string) => {
    const qty = parseInt(value) || 0;
    setReceivedQuantities(prev => ({ ...prev, [idx]: qty }));
  };

  const handleItemConfirmChange = (idx: number, checked: boolean) => {
    setItemConfirmed(prev => ({ ...prev, [idx]: checked }));
    // Reset quantity to LPO quantity when re-confirming
    if (checked && selectedLpoData) {
      setReceivedQuantities(prev => ({ ...prev, [idx]: selectedLpoData.items[idx].quantity }));
    }
  };

  const hasUncheckedItems = Object.values(itemConfirmed).some(v => v === false);

  const lpoTotal = selectedLpoData?.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0) || 0;
  const receivedTotal = selectedLpoData?.items.reduce((sum, item, idx) => sum + ((receivedQuantities[idx] || 0) * item.unitPrice), 0) || 0;

  const resetForm = () => {
    setDialogOpen(false);
    setLpoReference("");
    setSelectedLpoData(null);
    setReceivedQuantities({});
    setItemConfirmed({});
    setEditReason("");
    setSourceType("Supplier");
    setStoreLocation("");
    setInternalSourceStore("");
    setSignatureConfirmed(false);
    setSupplierName("");
    setLpoDate("");
  };

  const createS11Mutation = useMutation({
    mutationFn: (newRecord: Omit<S11Record, "id">) => api.createS11Record(newRecord),
    onSuccess: (savedRecord) => {
      setRecords(prev => [savedRecord, ...prev]);
      queryClient.setQueryData(['s11-records'], (oldData: any) => [savedRecord, ...(oldData || [])]);
      // Refresh stats and ensure list is fresh
      queryClient.invalidateQueries(['s11-stats']);
      queryClient.invalidateQueries(['s11-records']);
      toast.success("GRN Record Created", { description: `Status: ${savedRecord.status}` });
      addNotification({ title: "GRN Created (S11)", message: `${savedRecord.id} received — ${savedRecord.status}`, type: "success", link: "/stores/receive" });
      resetForm();
    },
    onError: () => {
      toast.error("Failed to create GRN. Network error.");
    }
  });

  const updateS11Mutation = useMutation({
    mutationFn: ({ id, updates }: { id: string, updates: Partial<S11Record> }) => api.updateS11Record(id, updates),
    onSuccess: (updatedRecord) => {
      setRecords(prev => prev.map(record => record.id === updatedRecord.id ? updatedRecord : record));
      queryClient.setQueryData(['s11-records'], (oldData: any) =>
        (oldData || []).map((r: S11Record) => r.id === updatedRecord.id ? updatedRecord : r)
      );
      queryClient.invalidateQueries(['s11-stats']);
      toast.success("Status Updated", { description: `${updatedRecord.id} is now ${updatedRecord.status}` });
      // If a GRN was posted, attempt to post S2 receipts for its items
      if (updatedRecord.status === "Posted") {
        (async () => {
          try {
            const full = await api.getS11Record(updatedRecord.id);
            const items: any[] = full.items || [];
            const capResults: any[] = [];
            for (const it of items) {
              const itemId = it.itemCode || it.item_id || it.id || it.code || it.item || null;
              const qty = it.qty || it.quantity || it.quantityReceived || it.receivedQty || 0;
              const unit_cost = it.unitCost || it.unit_cost || it.unitPrice || 0;
              if (!itemId || qty <= 0) continue;
              try {
                await api.createS2Receipt({ item_id: itemId, date: full.date || new Date().toISOString().split('T')[0], qty, unit_cost, supplier_name: full.supplier || full.supplierName || '', ref_no: full.lpoReference || full.reference || full.id, created_by: user?.name || 'system' });
              } catch (e: any) {
                const msg = `S2 receipt failed for ${itemId}: ${e?.message || String(e)}`;
                console.warn(msg, e);
                toast.error("S2 Receipt Post Failed", { description: msg });
                addNotification({ title: "S2 Receipt Failed", message: msg, type: "error", link: "/stores/receive" });
                // enqueue for retry
                try { const id = `${Date.now()}-${Math.random().toString(36).slice(2,8)}`; await import("@/lib/s2Queue").then(m => m.enqueue({ id, type: 'RECEIPT', payload: { item_id: itemId, date: full.date || new Date().toISOString().split('T')[0], qty, unit_cost, supplier_name: full.supplier || full.supplierName || '', ref_no: full.lpoReference || full.reference || full.id, created_by: user?.name || 'system' } })); } catch(_){}
              }

              // Run capitalization classification for this received item (auto-suggestion)
              try {
                const classifyRes = await assetsService.classifyItem({ item_id: itemId, qty, unit_cost });
                const classification = classifyRes?.classification;
                capResults.push({ item_id: itemId, description: it.description || '', qty, unit_cost, classification });
              } catch (e:any) {
                console.warn('Capitalization classify failed', e);
              }
            }
          } catch (e: any) {
            const msg = `Failed to post S2 receipts for S11 ${updatedRecord.id}: ${e?.message || String(e)}`;
            console.warn(msg, e);
            toast.error("S2 Receipts Batch Failed", { description: msg });
            addNotification({ title: "S2 Receipts Batch Failed", message: msg, type: "error", link: "/stores/receive" });
          }
          // After processing all items, show capitalization summary if any suggestions exist
          if (capResults.length > 0) {
            const interesting = capResults.filter(r => r.classification && (r.classification.suggested_action === 'capitalize' || r.classification.suggested_action === 'bulk_capitalize' || r.classification.override_required));
            if (interesting.length > 0) {
              setCapSuggestions(interesting);
              setShowCapDialog(true);
            }
          }
        })();
      }
    },
    onError: () => {
      toast.error("Failed to update GRN status.");
    }
  });

  const deleteS11Mutation = useMutation({
    mutationFn: (id: string) => api.deleteS11Record(id),
    onSuccess: (_, id) => {
      setRecords(prev => prev.filter(r => r.id !== id));
      queryClient.setQueryData(['s11-records'], (oldData: any) => (oldData || []).filter((r: S11Record) => r.id !== id));
      queryClient.invalidateQueries(['s11-stats']);
      queryClient.invalidateQueries(['s11-records']);
      toast.success("GRN deleted");
    },
    onError: () => {
      toast.error("Failed to delete GRN");
    }
  });

  const generateS11Payload = (status: DocumentStatus): Omit<S11Record, "id"> => {
    return {
      date: new Date().toISOString().split('T')[0],
      sourceType: sourceType,
      supplier: supplierName || (sourceType === "Supplier" ? "External Supplier" : "Internal Store"),
      storeLocation: storeLocation,
      // include lpo reference so backend can derive items and numeric totalValue
      lpoReference: lpoReference || null,
      // legacy field (string) kept for compatibility
      amount: receivedTotal,
      // also provide numeric total as a hint
      totalValue: receivedTotal,
      // indicate if the creator confirmed their digital signature
      signatureConfirmed: signatureConfirmed,
      status: status,
    };
  };

  const handleSaveDraft = () => {
    if (!storeLocation) {
      toast.error("Please select a store location");
      return;
    }
    logStoresAction("GRN Draft Saved", "S11 Draft saved via API");
    createS11Mutation.mutate(generateS11Payload("Draft"));
  };

  const handleSubmitForApproval = () => {
    if (!storeLocation) {
      toast.error("Please select a store location");
      return;
    }
    if (!signatureConfirmed) {
      toast.error("Please confirm your digital signature");
      return;
    }
    if (hasUncheckedItems && !editReason.trim()) {
      toast.error("Please provide a reason for quantity adjustments");
      return;
    }
    logStoresAction("GRN Submitted", `S11 Submitted for approval by ${user?.name}${editReason ? ` - Edit reason: ${editReason}` : ''}`);
    createS11Mutation.mutate(generateS11Payload("Submitted"));
  };

  const handleStatusChange = (id: string, currentStatus: DocumentStatus, newStatus: DocumentStatus) => {
    if (isReadOnly) {
      blockAction("change document status");
      return;
    }

    // Validate lifecycle transitions
    const validTransitions: Record<DocumentStatus, DocumentStatus[]> = {
      "Draft": ["Submitted"],
      "Submitted": ["Approved", "Draft"], // Can be returned to draft
      "Approved": ["Posted"],
      "Posted": ["Locked"],
      "Locked": [], // Cannot change once locked
    };

    if (!validTransitions[currentStatus].includes(newStatus)) {
      toast.error("Invalid Status Change", {
        description: `Cannot change from ${currentStatus} to ${newStatus}`
      });
      return;
    }

    logStoresAction("GRN Status Changed", `${id}: ${currentStatus} → ${newStatus}`);
    updateS11Mutation.mutate({ id, updates: { status: newStatus } });
  };

  const handleViewS11 = (id: string) => {
    const rec = records.find(r => r.id === id) || null;
    setSelectedRecord(rec);
    setViewDialogOpen(true);
    logStoresAction("S11 Viewed", `Viewed S11 record ${id}`);
  };

  // Capitalization dialog close handler
  const closeCapDialog = () => {
    setShowCapDialog(false);
    setCapSuggestions([]);
  };

  const handlePrintS11 = (record: S11Record) => {
    // Create print data from the record
    const mockItems = [
      { description: "A4 Printing Paper (Ream)", unit: "Ream", lpoQty: 50, receivedQty: 48, unitPrice: 450 },
      { description: "Box Files - Blue", unit: "Pcs", lpoQty: 20, receivedQty: 20, unitPrice: 150 },
      { description: "Stapler Heavy Duty", unit: "Pcs", lpoQty: 5, receivedQty: 5, unitPrice: 800 },
    ];

    const data: S11PrintData = {
      id: record.id,
      date: record.date,
      sourceType: record.sourceType,
      supplier: record.supplier,
      storeLocation: record.storeLocation,
      lpoReference: "LPO-2024-001",
      deliveryNote: "DN-001",
      items: mockItems,
      storekeeperName: record.storekeeperSignature || user?.name || "Storekeeper",
      storekeeperSignature: record.storekeeperSignature,
      signedAt: record.signedAt,
      status: record.status,
    };

    setPrintData(data);
    setPrintDialogOpen(true);
    logStoresAction("S11 Printed", `Printed S11 record ${record.id}`);
  };

  const getAssetTypeBadge = (assetType: AssetType) => {
    switch (assetType) {
      case "Consumable":
        return <Badge variant="outline" className="bg-info/10 text-info border-info/20 text-xs">Consumable</Badge>;
      case "Permanent":
        return <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20 text-xs">Permanent</Badge>;
      case "Fixed Asset":
        return <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs">Fixed Asset</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{assetType}</Badge>;
    }
  };

  const getStatusBadge = (status: DocumentStatus) => {
    const statusConfig: Record<DocumentStatus, { icon: React.ReactNode; className: string }> = {
      "Draft": { icon: <PenLine className="h-3 w-3" />, className: "bg-muted text-muted-foreground" },
      "Submitted": { icon: <Send className="h-3 w-3" />, className: "bg-info/10 text-info border-info/20" },
      "Approved": { icon: <CheckCircle className="h-3 w-3" />, className: "bg-success/10 text-success border-success/20" },
      "Posted": { icon: <FileCheck className="h-3 w-3" />, className: "bg-primary/10 text-primary border-primary/20" },
      "Locked": { icon: <Lock className="h-3 w-3" />, className: "bg-destructive/10 text-destructive border-destructive/20" },
    };

    const config = (statusConfig as any)[status] || statusConfig["Draft"];
    return (
      <Badge className={`${config.className} gap-1`}>
        {config.icon}
        {(statusConfig as any)[status] ? status : "Draft"}
      </Badge>
    );
  };

  const getNextAction = (status: DocumentStatus, id: string) => {
    if (isReadOnly) return null;

    switch (status) {
      case "Draft":
        return (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={() => handleStatusChange(id, status, "Submitted")}
          >
            <Send className="h-3 w-3" /> Submit
          </Button>
        );
      case "Submitted":
        return (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1 text-success"
            onClick={() => handleStatusChange(id, status, "Approved")}
          >
            <CheckCircle className="h-3 w-3" /> Approve
          </Button>
        );
      case "Approved":
        return (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1 text-primary"
            onClick={() => handleStatusChange(id, status, "Posted")}
          >
            <FileCheck className="h-3 w-3" /> Post
          </Button>
        );
      case "Posted":
        return (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1 text-destructive"
            onClick={() => handleStatusChange(id, status, "Locked")}
          >
            <Lock className="h-3 w-3" /> Lock
          </Button>
        );
      default:
        return <span className="text-xs text-muted-foreground">Finalized</span>;
    }
  };

  // Table columns for ReusableTable
  const columns: Column<any>[] = [
    { key: 'id', title: 'GRN Number', width: '140px', render: (row) => <div className="font-mono text-sm font-medium">{row.id}</div> },
    { key: 'date', title: 'Date', width: '120px' },
    { key: 'source', title: 'Source', render: (row) => <div className="space-y-0.5"><div className="text-xs text-muted-foreground">{row.sourceType}</div><div>{row.supplier}</div></div> },
    { key: 'storeLocation', title: 'Store Location', width: '160px' },
    { key: 'items', title: 'Items', align: 'right', width: '80px', render: (row) => typeof row.items === 'number' ? row.items : (row.items ? row.items.length : '-') },
    { key: 'totalValue', title: 'Total Value', align: 'right', width: '140px', render: (row) => (Number(row.totalValue ?? row.amount ?? 0) || 0).toLocaleString() },
    { key: 'signedBy', title: 'Signed By', width: '180px', render: (row) => row.storekeeperSignature ? (<div className="space-y-0.5"><div className="font-medium text-sm">{row.storekeeperSignature}</div><div className="text-xs text-muted-foreground">{row.signedAt}</div></div>) : (<span className="text-xs text-muted-foreground italic">Pending</span>) },
    { key: 'status', title: 'Status', width: '120px', render: (row) => getStatusBadge(row.status) },
    { key: 'actions', title: 'Actions', align: 'right', width: '180px', render: (row) => (
      <div className="flex justify-end gap-1">
        {getNextAction(row.status, row.id)}
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleViewS11(row.id)}>
          <Eye className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handlePrintS11(row)}>
          <Printer className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => { if (blockAction('delete records')) return; if (confirm(`Delete GRN ${row.id}?`)) deleteS11Mutation.mutate(row.id); }}>
          <XCircle className="h-4 w-4" />
        </Button>
      </div>
    ) }
  ];

  return (
    <div className="flex-1 space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Receive Stock (GRN)</h1>
          <p className="text-muted-foreground mt-1">Record items entering store (S11)</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="gap-2"
              disabled={isReadOnly || createS11Mutation.isPending}
              onClick={() => { if (blockAction("create stock records")) return; }}
            >
              <Plus className="h-4 w-4" />
              {createS11Mutation.isPending ? "Creating..." : "New GRN"}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New GRN - Goods Received Note</DialogTitle>
              <DialogDescription>
                Document lifecycle: Draft → Submitted → Approved → Posted → Locked
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {/* Document Header */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="grn-number">GRN Number</Label>
                  <Input id="grn-number" value="S11-2024-006" readOnly className="bg-muted font-mono" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Date Received</Label>
                  <Input id="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <div className="flex items-center h-10 px-3 rounded-md border bg-muted">
                    <Badge variant="secondary" className="gap-1">
                      <PenLine className="h-3 w-3" />
                      Draft
                    </Badge>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Source Information */}
              <div className="space-y-4">
                <h4 className="font-medium text-sm text-muted-foreground">SOURCE INFORMATION</h4>

                {/* LPO Reference - MUST be selected first */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>LPO Reference *</Label>
                    <Select value={lpoReference} onValueChange={handleLpoSelect}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select LPO first" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">-- No LPO --</SelectItem>
                        {availableLPOs.map(lpo => (
                          <SelectItem key={lpo.id} value={lpo.lpoNumber}>
                            {lpo.lpoNumber} - {lpo.supplierName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {!lpoReference && (
                      <p className="text-xs text-muted-foreground">Select an LPO to proceed</p>
                    )}
                  </div>
                  {lpoDate && (
                    <div className="space-y-2">
                      <Label>LPO Date</Label>
                      <Input value={lpoDate} readOnly className="bg-muted" />
                    </div>
                  )}
                </div>

                {/* Received From & Supplier - Auto-populated and read-only */}
                {lpoReference && lpoReference !== "none" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Received From</Label>
                      <Input
                        value="External Supplier"
                        readOnly
                        className="bg-muted"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Supplier Name</Label>
                      <Input
                        value={supplierName}
                        readOnly
                        className="bg-muted"
                      />
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Destination & Reference */}
              <div className="space-y-4">
                <h4 className="font-medium text-sm text-muted-foreground">DESTINATION & REFERENCE</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Store Location (Receiving) *</Label>
                    <Select value={storeLocation} onValueChange={setStoreLocation} disabled={!lpoReference || lpoReference === "none"}>
                      <SelectTrigger>
                        <SelectValue placeholder={!lpoReference || lpoReference === "none" ? "Select LPO first" : "Select store location"} />
                      </SelectTrigger>
                      <SelectContent>
                        {storeLocations.map(store => (
                          <SelectItem key={store} value={store}>{store}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="delivery-note">Delivery Note / Transfer Reference</Label>
                    <Input
                      id="delivery-note"
                      placeholder="Enter delivery note or transfer reference number"
                      disabled={!lpoReference || lpoReference === "none"}
                    />
                  </div>
                </div>
              </div>

              {/* LPO Items Table */}
              {selectedLpoData && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground">ITEMS FROM LPO</h4>
                      <p className="text-xs text-muted-foreground">
                        Uncheck an item to edit the received quantity
                      </p>
                    </div>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12">OK</TableHead>
                            <TableHead className="w-20">LPO Qty</TableHead>
                            <TableHead className="w-24">Received</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead className="w-24">Type</TableHead>
                            <TableHead className="w-24 text-right">Unit Cost (KES)</TableHead>
                            <TableHead className="text-right w-24">Total (KES)</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedLpoData.items.map((item, idx) => {
                            const receivedQty = receivedQuantities[idx] || 0;
                            const isConfirmed = itemConfirmed[idx] !== false;
                            const variance = receivedQty - item.quantity;
                            return (
                              <TableRow key={idx} className={!isConfirmed ? 'bg-warning/5' : ''}>
                                <TableCell>
                                  <Checkbox
                                    checked={isConfirmed}
                                    onCheckedChange={(checked) => handleItemConfirmChange(idx, checked as boolean)}
                                  />
                                </TableCell>
                                <TableCell className="text-muted-foreground">{item.quantity}</TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    min="0"
                                    value={receivedQty}
                                    onChange={(e) => handleReceivedQtyChange(idx, e.target.value)}
                                    disabled={isConfirmed}
                                    className={`w-20 h-8 text-center ${!isConfirmed ? 'border-warning bg-background' : 'bg-muted'} ${variance !== 0 ? 'border-warning' : ''}`}
                                  />
                                </TableCell>
                                <TableCell>
                                  <div>{item.description}</div>
                                  {variance !== 0 && (
                                    <span className={`text-xs ${variance > 0 ? 'text-success' : 'text-destructive'}`}>
                                      {variance > 0 ? '+' : ''}{variance} variance
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell>{getAssetTypeBadge(item.assetType)}</TableCell>
                                <TableCell className="text-right">{item.unitPrice.toLocaleString()}</TableCell>
                                <TableCell className="text-right font-medium">
                                  {(receivedQty * item.unitPrice).toLocaleString()}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                          <TableRow className="bg-muted/50">
                            <TableCell colSpan={4} className="text-xs text-muted-foreground">
                              LPO Total: {lpoTotal.toLocaleString()}
                            </TableCell>
                            <TableCell colSpan={2} className="text-right font-semibold">Received Total:</TableCell>
                            <TableCell className="text-right font-bold">
                              {receivedTotal.toLocaleString()}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>

                    {/* Edit Reason - shown when any item is unchecked */}
                    {hasUncheckedItems && (
                      <div className="space-y-2 rounded-lg border border-warning/50 bg-warning/5 p-4">
                        <Label htmlFor="edit-reason" className="text-warning-foreground flex items-center gap-2">
                          <PenLine className="h-4 w-4" />
                          Reason for Quantity Adjustment <span className="text-destructive">*</span>
                        </Label>
                        <Textarea
                          id="edit-reason"
                          placeholder="Explain why the received quantities differ from the LPO (e.g., damaged items, short delivery, substitution...)"
                          value={editReason}
                          onChange={(e) => setEditReason(e.target.value)}
                          rows={2}
                          className="border-warning/30"
                        />
                      </div>
                    )}
                  </div>
                </>
              )}

              <Separator />

              {/* Digital Signature & Remarks */}
              <div className="space-y-4">
                <h4 className="font-medium text-sm text-muted-foreground">AUTHORIZATION</h4>
                <div className="space-y-2">
                  <Label htmlFor="remarks">Remarks / Inspection Notes</Label>
                  <Textarea id="remarks" placeholder="Condition of goods, discrepancies, special notes..." rows={2} />
                </div>

                <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="signature"
                      checked={signatureConfirmed}
                      onCheckedChange={(checked) => setSignatureConfirmed(checked as boolean)}
                    />
                    <div className="space-y-1">
                      <Label htmlFor="signature" className="cursor-pointer">
                        Digital Signature Confirmation
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        I, <span className="font-medium">{user?.name || "Storekeeper"}</span>, confirm that I have physically received
                        and inspected the goods as documented above. This constitutes my digital signature.
                      </p>
                    </div>
                  </div>
                  {signatureConfirmed && (
                    <div className="flex items-center gap-2 text-xs text-success pl-7">
                      <CheckCircle className="h-3 w-3" />
                      Signed by {user?.name} at {new Date().toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={resetForm}>Cancel</Button>
              <Button variant="secondary" onClick={handleSaveDraft} disabled={createS11Mutation.isPending}>
                <PenLine className="h-4 w-4 mr-2" />
                Save as Draft
              </Button>
              <Button onClick={handleSubmitForApproval} disabled={!signatureConfirmed || createS11Mutation.isPending}>
                <Send className="h-4 w-4 mr-2" />
                {createS11Mutation.isPending ? "Submitting..." : "Submit for Approval"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Document Lifecycle Legend */}
      <Card className="border-dashed">
        <CardContent className="py-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Document Lifecycle:</span>
            <div className="flex items-center gap-2 text-xs">
              <Badge variant="secondary" className="gap-1"><PenLine className="h-3 w-3" /> Draft</Badge>
              <span className="text-muted-foreground">→</span>
              <Badge className="bg-info/10 text-info gap-1"><Send className="h-3 w-3" /> Submitted</Badge>
              <span className="text-muted-foreground">→</span>
              <Badge className="bg-success/10 text-success gap-1"><CheckCircle className="h-3 w-3" /> Approved</Badge>
              <span className="text-muted-foreground">→</span>
              <Badge className="bg-primary/10 text-primary gap-1"><FileCheck className="h-3 w-3" /> Posted</Badge>
              <span className="text-muted-foreground">→</span>
              <Badge className="bg-destructive/10 text-destructive gap-1"><Lock className="h-3 w-3" /> Locked</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-5">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10">
                <ArrowDownToLine className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold text-foreground">{s11Stats?.thisMonth ?? '—'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <PenLine className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Drafts</p>
                <p className="text-2xl font-bold text-foreground">{s11Stats?.drafts ?? '—'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-info/10">
                <Clock className="h-5 w-5 text-info" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-foreground">{s11Stats?.pending ?? '—'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10">
                <CheckCircle className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Posted</p>
                <p className="text-2xl font-bold text-foreground">{s11Stats?.posted ?? '—'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <ArrowDownToLine className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold text-foreground">{s11Stats ? `KES ${Number(s11Stats.totalValue).toLocaleString()}` : '—'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>GRN Records</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search GRN..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-full sm:w-[250px]"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <ReusableTable
              columns={columns}
              data={(pageData?.results || []).filter((r: any) => {
                if (!searchTerm) return true;
                const q = searchTerm.toLowerCase();
                return (
                  String(r.id).toLowerCase().includes(q) ||
                  String(r.supplier || '').toLowerCase().includes(q) ||
                  String(r.storeLocation || '').toLowerCase().includes(q) ||
                  String(r.status || '').toLowerCase().includes(q)
                );
              })}
              rowKey={(r: any) => r.id}
            />
          </div>
        </CardContent>

        <TablePagination
          page={page}
          totalPages={pageData && pageData.count ? Math.max(1, Math.ceil((pageData.count || 0) / (pageData.results?.length || 10))) : 1}
          from={(page - 1) * (pageData?.results?.length || 10) + 1}
          to={(page - 1) * (pageData?.results?.length || 10) + (pageData?.results?.length || 0)}
          total={pageData?.count || 0}
          onPageChange={(p) => setPage(p)}
        />
      </Card>

      {/* Print Dialog */}
      <PrintDialog
        open={printDialogOpen}
        onOpenChange={setPrintDialogOpen}
        title={printData?.id || "S11 Document"}
      >
        {printData && <S11PrintTemplate data={printData} />}
      </PrintDialog>

      {/* View GRN Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>GRN Details</DialogTitle>
            <DialogDescription>Read-only view of the selected GRN</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            {selectedRecord ? (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>GRN Number</Label>
                    <Input value={selectedRecord.id} readOnly className="bg-muted" />
                  </div>
                  <div>
                    <Label>Date</Label>
                    <Input value={selectedRecord.date} readOnly className="bg-muted" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Source</Label>
                    <Input value={selectedRecord.sourceType} readOnly className="bg-muted" />
                  </div>
                  <div>
                    <Label>Supplier</Label>
                    <Input value={selectedRecord.supplier} readOnly className="bg-muted" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Store Location</Label>
                    <Input value={selectedRecord.storeLocation} readOnly className="bg-muted" />
                  </div>
                  <div>
                    <Label>Items</Label>
                    <Input value={String(selectedRecord.items)} readOnly className="bg-muted" />
                  </div>
                  <div>
                    <Label>Total Value</Label>
                    <Input value={String(selectedRecord.totalValue ?? selectedRecord.amount ?? '')} readOnly className="bg-muted" />
                  </div>
                </div>

                <div>
                  <Label>Signed By</Label>
                  <Input value={selectedRecord.storekeeperSignature || ''} readOnly className="bg-muted" />
                </div>

                <div>
                  <Label>Signature Placement</Label>
                  <Textarea value={JSON.stringify(selectedRecord.signaturePlacement || {})} readOnly rows={3} className="bg-muted" />
                </div>
              </div>
            ) : (
              <div>No record selected</div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <CapitalizationSummaryDialog open={showCapDialog} onClose={() => { setShowCapDialog(false); setCapSuggestions([]); }} items={capSuggestions} />
    </div>
  );
}