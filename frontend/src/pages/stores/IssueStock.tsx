import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useReadOnlyGuard } from "@/hooks/useReadOnlyGuard";
import { useAuth } from "@/contexts/AuthContext";
import { useAuditLog } from "@/hooks/useAuditLog";
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
import { Search, Plus, ArrowUpFromLine, FileText, Eye, Printer, User } from "lucide-react";
import S13PrintTemplate, { S13PrintData } from "@/components/prints/S13PrintTemplate";
import PrintDialog from "@/components/prints/PrintDialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useRIA } from "@/contexts/RIAContext";
import { useS12, S12Requisition, S12Item } from "@/contexts/S12Context";
import { toast } from "sonner";
import { useNotifications } from "@/contexts/NotificationContext";
import { api } from "@/services/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { S13Record } from "@/mock/data";

export default function IssueStock() {
  const { data: initialRecords = [] } = useQuery({
    queryKey: ['s13-records'],
    queryFn: () => api.getS13Records()
  });
  const { data: settings } = useQuery({
    queryKey: ['inventory-settings'],
    queryFn: () => api.getInventorySettings()
  });

  const { data: s13Stats } = useQuery({
    queryKey: ['s13-stats'],
    queryFn: () => api.getS13Stats(),
    staleTime: 1000 * 60,
  });

  const departments = settings?.departmentLocations || [];

  const [records, setRecords] = useState<S13Record[]>([]);
  const queryClient = useQueryClient();
  useEffect(() => {
    if (initialRecords.length > 0 && records.length === 0) {
      setRecords(initialRecords);
    }
  }, [initialRecords]);

  const [searchTerm, setSearchTerm] = useState("");
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<S13Record | null>(null);
  const [issueDialogOpen, setIssueDialogOpen] = useState(false);
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [printData, setPrintData] = useState<S13PrintData | null>(null);
  const { isReadOnly, blockAction } = useReadOnlyGuard();
  const { user } = useAuth();
  const { logStoresAction } = useAuditLog();
  const { addNotification } = useNotifications();
  const { rias, addUsage } = useRIA();
  const { getPendingIssues, getRequisitionById, issueItems } = useS12();
  const activeRIAs = rias.filter(r => r.status === "active");
  const [issueType, setIssueType] = useState<"normal" | "ria">("normal");
  const [selectedRIA, setSelectedRIA] = useState<string>("");
  const [riaIssued, setRiaIssued] = useState<Record<string, number>>({});
  const [selectedReqId, setSelectedReqId] = useState<string>("");
  const [issuedQuantities, setIssuedQuantities] = useState<Record<string, number>>({});
  const [inventoryItemsMap, setInventoryItemsMap] = useState<Record<string, any>>({});
  const [s13Date, setS13Date] = useState<string>(new Date().toISOString().split('T')[0]);
  const [departmentInput, setDepartmentInput] = useState<string>("");
  const [requestedByInput, setRequestedByInput] = useState<string>("");
  const [purposeInput, setPurposeInput] = useState<string>("");
  const pendingRequisitions = getPendingIssues();
  const selectedReq = selectedReqId ? getRequisitionById(selectedReqId) : undefined;

  useEffect(() => {
    if (selectedReq) {
      setDepartmentInput(selectedReq.requestingDepartment || "");
      setRequestedByInput(selectedReq.requestedBy || "");
    } else {
      setDepartmentInput("");
      setRequestedByInput("");
    }
  }, [selectedReq]);

  // When a requisition is selected, fetch the current inventory items for each requisition item
  useEffect(() => {
    let mounted = true;
    const loadInventoryItems = async () => {
      if (!selectedReq || !selectedReq.items || selectedReq.items.length === 0) {
        setInventoryItemsMap({});
        return;
      }
      try {
        const results = await Promise.all(
          selectedReq.items.map(async (it: any) => {
            // itemCode may be an object or string depending on API/mocks
            const code = it.itemCode && typeof it.itemCode === 'string' ? it.itemCode : (it.itemCode?.id || it.itemCode || it.id);
            try {
              const inv = await api.getItem(code);
              return [code, inv];
            } catch (err) {
              return [code, null];
            }
          })
        );

        if (!mounted) return;
        const map: Record<string, any> = {};
        results.forEach(([code, inv]) => {
          if (code) map[code] = inv;
        });
        setInventoryItemsMap(map);
      } catch (e) {
        setInventoryItemsMap({});
      }
    };

    loadInventoryItems();
    return () => { mounted = false; };
  }, [selectedReq]);

  const createS13Mutation = useMutation({
    mutationFn: (newRecord: Omit<S13Record, "id">) => api.createS13Record(newRecord),
    onSuccess: (savedRecord) => {
      setRecords(prev => [savedRecord, ...prev]);
      queryClient.setQueryData(['s13-records'], (oldData: any) => [savedRecord, ...(oldData || [])]);
      queryClient.invalidateQueries(['s13-records']);
      toast.success("Items issued successfully via API");
      addNotification({ title: "Stock Issued (S13)", message: `${savedRecord.id} — ${savedRecord.department}`, type: "success", link: "/stores/issue" });
      // After successful S13 creation, post S2 issue transactions for the issued items (best-effort).
      (async () => {
        try {
          if (selectedReq && Object.keys(issuedQuantities).length > 0) {
            for (const it of selectedReq.items) {
              const qty = issuedQuantities[it.id] ?? 0;
              if (!qty || qty <= 0) continue;
              const itemCode = it.itemCode && typeof it.itemCode === 'string' ? it.itemCode : (it.itemCode?.id || it.itemCode || it.id);
              const unit_cost = (inventoryItemsMap[itemCode]?.unitCost) || it.unitPrice || 0;
              try {
                await api.createS2Issue({ item_id: itemCode, date: savedRecord.date || new Date().toISOString().split('T')[0], qty, unit_cost, custodian_id: '', custodian_name: '', dept_id: savedRecord.department, dept_name: savedRecord.department, ref_no: savedRecord.id, created_by: user?.name || 'system' });
              } catch (e) {
                console.warn('S2 issue post failed for', itemCode, e);
              }
            }
          }
        } catch (e) {
          console.warn('Failed to post S2 issues after S13 creation', e);
        }
      })();

      setIssueDialogOpen(false);
      setSelectedReqId("");
      setIssuedQuantities({});
      setSelectedRIA("");
      setRiaIssued({});
    },
    onError: () => {
      toast.error("Failed to create S13 record. Network error.");
    }
  });

  const handleIssueNormal = () => {
    if (!selectedReq) return;
    const hasQty = Object.values(issuedQuantities).some((q) => q > 0);
    if (!hasQty) {
      toast.error("Enter quantities to issue");
      return;
    }

    const invalid = selectedReq.items.some((it) => {
      const approved = it.quantityApproved ?? it.quantityRequested;
      const issued = it.quantityIssued ?? 0;
      const balance = Math.max(approved - issued, 0);
      const val = issuedQuantities[it.id] ?? 0;
      return val > balance;
    });
    if (invalid) {
      toast.error("One or more quantities exceed balance");
      return;
    }

    const itemsCount = Object.values(issuedQuantities).reduce((s, v) => s + (Number(v) || 0), 0);

    const newS13Record: Omit<S13Record, "id"> = {
      date: s13Date,
      department: selectedReq.requestingDepartment || departmentInput,
      requestedBy: selectedReq.requestedBy || requestedByInput || user?.name || 'Storekeeper',
      items: itemsCount,
      status: "Issued",
      purpose: purposeInput,
    };

    console.debug('S13 payload (normal):', newS13Record);

    issueItems(selectedReq.id, user?.name || "Storekeeper", issuedQuantities);
    logStoresAction("UPDATE", `Issued items for ${selectedReq.s12Number} via S13`);
    createS13Mutation.mutate(newS13Record);
  };

  const handleIssueRIA = () => {
    if (!selectedRIA) return;
    const ria = activeRIAs.find(r => r.id === selectedRIA)!;
    const hasQty = Object.values(riaIssued).some((q) => q > 0);
    if (!hasQty) {
      toast.error("Enter quantities to issue");
      return;
    }

    const invalid = ria.items.some((it) => {
      const available = it.approvedQty - it.usedQty;
      const val = riaIssued[it.itemCode] ?? 0;
      return val > available;
    });
    if (invalid) {
      toast.error("One or more quantities exceed available");
      return;
    }

    ria.items.forEach((it) => {
      const val = riaIssued[it.itemCode] ?? 0;
      if (val > 0) {
        addUsage(ria.number, it.itemCode, val);
      }
    });

    const riaItemsCount = Object.values(riaIssued).reduce((s, v) => s + (Number(v) || 0), 0);
    const newS13Record: Omit<S13Record, "id"> = {
      date: s13Date,
      department: ria.department,
      requestedBy: user?.name || "Staff",
      items: riaItemsCount,
      status: "Issued",
      purpose: purposeInput,
    };

    console.debug('S13 payload (ria):', newS13Record);

    logStoresAction("UPDATE", `Issued items from ${ria.number} via S13`);
    createS13Mutation.mutate(newS13Record);
  };

  const handlePrintS13 = (record: S13Record) => {
    // Create print data from the record
    const mockItems = [
      { description: "Whiteboard Markers (Assorted)", unit: "Pack", requestedQty: 10, issuedQty: 10, unitPrice: 350 },
      { description: "Chalk Box (White)", unit: "Box", requestedQty: 5, issuedQty: 5, unitPrice: 120 },
      { description: "Duster - Board", unit: "Pcs", requestedQty: 3, issuedQty: 3, unitPrice: 80 },
      { description: "Manila Paper (Assorted)", unit: "Pack", requestedQty: 2, issuedQty: 2, unitPrice: 450 },
    ];

    const data: S13PrintData = {
      id: record.id,
      date: record.date,
      department: record.department,
      requestedBy: record.requestedBy,
      requisitionRef: "REQ-2024-001",
      purpose: "Teaching materials for Term 1",
      items: mockItems,
      issuedBy: user?.name || "Storekeeper",
      issuedBySignature: record.status === "Issued" ? user?.name : undefined,
      issuedAt: record.status === "Issued" ? `${record.date} 14:30` : undefined,
      status: record.status,
    };

    setPrintData(data);
    setPrintDialogOpen(true);
    logStoresAction("S13 Printed", `Printed S13 record ${record.id}`);
  };

  const handleViewS13 = (id: string) => {
    const rec = records.find(r => r.id === id) || null;
    setSelectedRecord(rec);
    setViewDialogOpen(true);
    logStoresAction("S13 Viewed", `Viewed S13 record ${id}`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Issued":
        return <Badge className="bg-success/10 text-success border-success/20">Issued</Badge>;
      case "Pending":
        return <Badge className="bg-warning/10 text-warning border-warning/20">Pending</Badge>;
      case "Partial":
        return <Badge className="bg-info/10 text-info border-info/20">Partial</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="flex-1 space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Issue Stock (S13)</h1>
          <p className="text-muted-foreground mt-1">
            Process stock requisitions and issue items to departments
          </p>
        </div>
        <Dialog open={issueDialogOpen} onOpenChange={setIssueDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="gap-2"
              disabled={isReadOnly}
              onClick={() => { if (blockAction("issue stock")) return; setIssueDialogOpen(true); }}
            >
              <Plus className="h-4 w-4" />
              Issue Stock
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New S13 - Issue Voucher</DialogTitle>
              <DialogDescription>
                Process a stock requisition and issue items
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Issue Type</Label>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 text-sm">
                    <RadioGroup className="grid grid-cols-2 gap-4" value={issueType} onValueChange={(v) => setIssueType(v as any)}>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem id="issue-normal" value="normal" />
                        <span>Normal Issue</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem id="issue-ria" value="ria" />
                        <span>Routine Issue</span>
                      </div>
                    </RadioGroup>
                  </label>
                </div>
              </div>
                <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="s13-number">S13 Number</Label>
                  <Input id="s13-number" value="S13-2024-006" readOnly className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="issue-date">Date</Label>
                  <Input id="issue-date" type="date" value={s13Date} onChange={(e) => setS13Date(e.target.value)} />
                </div>
              </div>
              {/* Requisition/department/requestedBy group moved below requisition selector for clarity */}
              {issueType === "ria" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2">
                    <Label>Select Active RIA</Label>
                    <Select value={selectedRIA} onValueChange={setSelectedRIA}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose RIA" />
                      </SelectTrigger>
                      <SelectContent>
                        {activeRIAs.map(r => (
                          <SelectItem key={r.id} value={r.id}>
                            {r.number} • {r.department} ({r.startDate} to {r.endDate})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {selectedRIA && (
                    <div className="col-span-2">
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Item</TableHead>
                              <TableHead>Approved</TableHead>
                              <TableHead>Used</TableHead>
                              <TableHead>Available</TableHead>
                              <TableHead>Issue Now</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {activeRIAs.find(r => r.id === selectedRIA)!.items.map((it) => {
                              const available = it.approvedQty - it.usedQty;
                              const val = riaIssued[it.itemCode] ?? 0;
                              const over = val > available;
                              return (
                                <TableRow key={it.itemCode}>
                                  <TableCell>{it.itemName}</TableCell>
                                  <TableCell>{it.approvedQty} {it.unit}</TableCell>
                                  <TableCell>{it.usedQty} {it.unit}</TableCell>
                                  <TableCell className={available <= Math.ceil(it.approvedQty * 0.1) ? "text-warning" : ""}>
                                    {available} {it.unit}
                                  </TableCell>
                                  <TableCell className="w-40">
                                    <Input
                                      type="number"
                                      min={0}
                                      max={available}
                                      value={val}
                                      onChange={(e) => {
                                        const n = Math.max(0, Number(e.target.value));
                                        setRiaIssued((prev) => ({ ...prev, [it.itemCode]: n }));
                                      }}
                                    />
                                    {over && <p className="text-xs text-destructive mt-1">Exceeds available</p>}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Quantities will be validated against remaining allowance.
                      </p>
                    </div>
                  )}
                </div>
              )}
              {issueType === "normal" && (
                <div className="space-y-2">
                  <Label>Requisition Reference</Label>
                  <Select value={selectedReqId} onValueChange={(v) => { setSelectedReqId(v); setIssuedQuantities({}); }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select approved/partial requisition" />
                    </SelectTrigger>
                    <SelectContent>
                      {pendingRequisitions.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.s12Number} • {r.requestingDepartment} • {new Date(r.requestDate).toISOString().slice(0, 10)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Department and Requested By should reflect selected requisition when present */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Select value={departmentInput} onValueChange={(v) => setDepartmentInput(v)} disabled={issueType === "ria" || !!selectedReq}>
                    <SelectTrigger>
                      <SelectValue placeholder={selectedReq ? selectedReq.requestingDepartment : "Select department"} />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedReq && (
                    <p className="text-xs text-muted-foreground">From requisition: {selectedReq.requestingDepartment}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="requested-by">Requested By</Label>
                  <Input id="requested-by" placeholder={selectedReq ? selectedReq.requestedBy : "Staff name"} value={requestedByInput} onChange={(e) => setRequestedByInput(e.target.value)} disabled={issueType === "ria" || !!selectedReq} />
                  {selectedReq && (
                    <p className="text-xs text-muted-foreground">From requisition: {selectedReq.requestedBy}</p>
                  )}
                </div>
              </div>
              {issueType === "normal" && selectedReq && (
                <div className="space-y-2">
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item</TableHead>
                          <TableHead>Approved</TableHead>
                          <TableHead>Already Issued</TableHead>
                          <TableHead>Balance</TableHead>
                          <TableHead>Issue Now</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedReq.items.map((item) => {
                            const approved = item.quantityApproved ?? item.quantityRequested;
                            const issued = item.quantityIssued ?? 0;
                            const reqBalance = Math.max(approved - issued, 0);
                            const inv = (() => {
                              const code = item.itemCode && typeof item.itemCode === 'string' ? item.itemCode : (item.itemCode?.id || item.itemCode || item.id);
                              return inventoryItemsMap[code];
                            })();
                            const stockAvailable = inv ? (inv.openingBalance ?? 0) : Infinity;
                            const allowedMax = Math.min(reqBalance, stockAvailable);
                            const val = issuedQuantities[item.id] ?? 0;
                            const over = val > allowedMax;
                          return (
                            <TableRow key={item.id}>
                              <TableCell>{item.description}</TableCell>
                              <TableCell>{approved} {item.unit}</TableCell>
                              <TableCell>{issued} {item.unit}</TableCell>
                              <TableCell className={reqBalance === 0 ? "text-muted-foreground" : ""}>
                                {reqBalance} {item.unit}
                                {inv && (
                                  <div className="text-xs text-muted-foreground">In stock: {inv.openingBalance} {inv.unit}</div>
                                )}
                              </TableCell>
                              <TableCell className="w-40">
                                <Input
                                  type="number"
                                  min={0}
                                  max={allowedMax}
                                  value={val}
                                  onChange={(e) => {
                                    const n = Math.max(0, Number(e.target.value));
                                    setIssuedQuantities((prev) => ({ ...prev, [item.id]: n }));
                                  }}
                                />
                                {over && <p className="text-xs text-destructive mt-1">Exceeds allowed (req/stock)</p>}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    You can issue partially; balances remain for future issues.
                  </p>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="purpose">Purpose</Label>
                <Textarea id="purpose" placeholder="State the purpose for the requisition..." value={purposeInput} onChange={(e) => setPurposeInput(e.target.value)} disabled={issueType === "ria"} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline">Save as Draft</Button>
              {issueType === "normal" ? (
                <Button onClick={handleIssueNormal} disabled={!selectedReq}>
                  Issue Items
                </Button>
              ) : (
                <Button onClick={handleIssueRIA} disabled={!selectedRIA}>
                  Issue Items
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10">
                <ArrowUpFromLine className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold text-foreground">{s13Stats?.thisMonth ?? '—'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning/10">
                <FileText className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-foreground">{s13Stats?.pending ?? '—'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-info/10">
                <User className="h-5 w-5 text-info" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Departments</p>
                <p className="text-2xl font-bold text-foreground">{s13Stats?.departments ?? '—'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <ArrowUpFromLine className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Items Issued</p>
                <p className="text-2xl font-bold text-foreground">{s13Stats?.itemsIssued ?? '—'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Recent S13 Records</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search S13..."
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
                  <TableHead>S13 Number</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Requested By</TableHead>
                  <TableHead className="text-right">Items</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.filter(r => {
                  if (!searchTerm) return true;
                  const q = searchTerm.toLowerCase();
                  return (
                    String(r.id).toLowerCase().includes(q) ||
                    String(r.department || '').toLowerCase().includes(q) ||
                    String(r.requestedBy || '').toLowerCase().includes(q) ||
                    String(r.status || '').toLowerCase().includes(q)
                  );
                }).map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-mono text-sm font-medium">{record.id}</TableCell>
                    <TableCell>{record.date}</TableCell>
                    <TableCell>{record.department}</TableCell>
                    <TableCell>{record.requestedBy}</TableCell>
                    <TableCell className="text-right">{record.items}</TableCell>
                    <TableCell>{getStatusBadge(record.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleViewS13(record.id)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handlePrintS13(record)}
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* View S13 Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>S13 Details</DialogTitle>
            <DialogDescription>Read-only view of the selected S13</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            {selectedRecord ? (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>S13 Number</Label>
                    <Input value={selectedRecord.id} readOnly className="bg-muted" />
                  </div>
                  <div>
                    <Label>Date</Label>
                    <Input value={selectedRecord.date} readOnly className="bg-muted" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Department</Label>
                    <Input value={selectedRecord.department} readOnly className="bg-muted" />
                  </div>
                  <div>
                    <Label>Requested By</Label>
                    <Input value={selectedRecord.requestedBy} readOnly className="bg-muted" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Items</Label>
                    <Input value={String(selectedRecord.items)} readOnly className="bg-muted" />
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Input value={selectedRecord.status} readOnly className="bg-muted" />
                  </div>
                  <div>
                    <Label>Issued At</Label>
                    <Input value={selectedRecord.date} readOnly className="bg-muted" />
                  </div>
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

      {/* Print Dialog */}
      <PrintDialog
        open={printDialogOpen}
        onOpenChange={setPrintDialogOpen}
        title={printData?.id || "S13 Document"}
      >
        {printData && <S13PrintTemplate data={printData} />}
      </PrintDialog>
    </div>
  );
}
