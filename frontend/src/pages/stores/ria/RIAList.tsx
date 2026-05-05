import { useMemo, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { useRIA, RIARecord } from "@/contexts/RIAContext";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
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
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { CalendarDays, Plus, Clock, FileText, ArrowUpFromLine, Eye, Check, X, Trash2 } from "lucide-react";
import { ItemCombobox, StoreItem } from "@/components/stores/ItemCombobox";
import { useNotifications } from "@/contexts/NotificationContext";

type TabKey = "active" | "pending" | "expired" | "all";

function statusBadge(status: RIARecord["status"]) {
  switch (status) {
    case "active":
      return <Badge className="bg-success/10 text-success border-success/20">Active</Badge>;
    case "pending":
      return <Badge className="bg-warning/10 text-warning border-warning/20">Pending</Badge>;
    case "expired":
      return <Badge variant="destructive">Expired</Badge>;
    case "draft":
      return <Badge variant="secondary">Draft</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export default function RIAList() {
  const { rias, createDraft, submitForApproval, approve, reject } = useRIA();
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<TabKey>(user?.role === "headteacher" ? "pending" : "active");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    department: "",
    costCenter: "",
    officer: "",
    startDate: "",
    endDate: "",
    notes: "",
  });
  const [items, setItems] = useState<Array<{ itemCode: string; itemName: string; unit: string; approvedQty: number }>>([]);
  const { data: settings } = useQuery({ queryKey: ["inventory-settings"], queryFn: api.getInventorySettings });
  const { data: storeItems } = useQuery({ queryKey: ["store-items"], queryFn: api.getStoreItems });
  const { data: inventoryItems = [] } = useQuery({ queryKey: ["inventory"], queryFn: () => api.getInventory() });

  const receivingUnits = settings?.departmentLocations || [
    "Kitchen", "Science Lab", "Boarding", "Administration", "Sports", "Library", "Sanitation"
  ];
  const comboboxItems: StoreItem[] = inventoryItems.map(i => ({ code: String(i.id), description: i.name, unit: i.unit, assetType: "Consumable" as const }));

  const filtered = useMemo(() => {
    let list = rias || [];
    if (q) {
      const lc = q.toLowerCase();
      list = list.filter(
        (r) =>
          r.number?.toLowerCase()?.includes(lc) ||
          r.department?.toLowerCase()?.includes(lc) ||
          r.responsibleOfficer?.toLowerCase()?.includes(lc)
      );
    }
    if (from) list = list.filter((r) => r.startDate >= from);
    if (to) list = list.filter((r) => r.endDate <= to);
    return list;
  }, [rias, tab, q, from, to]);

  useEffect(() => {
    if (user?.role === "headteacher") {
      setTab("pending");
    }
  }, [user?.role]);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmState, setConfirmState] = useState<{ type: "approve" | "reject" | "issue"; target: RIARecord | null }>({
    type: "approve",
    target: null,
  });
  const onConfirm = () => {
    const t = confirmState.target;
    if (!t) return setConfirmOpen(false);
    if (confirmState.type === "approve") {
      approve(t.id, user!.role as any);
      toast.success("RIA approved");
      addNotification({ title: "RIA Approved", message: `${t.number} for ${t.department} approved`, type: "success", link: "/stores/ria" });
    } else if (confirmState.type === "reject") {
      reject(t.id);
      toast.success("RIA rejected");
      addNotification({ title: "RIA Rejected", message: `${t.number} for ${t.department} rejected`, type: "error", link: "/stores/ria" });
    } else if (confirmState.type === "issue") {
      // Navigate to Issue flow
      navigate("/stores/issue");
    }
    setConfirmOpen(false);
  };

  const addItem = () => setItems(prev => [...prev, { itemCode: "", itemName: "", unit: "Unit", approvedQty: 0 }]);
  const removeItem = (idx: number) => setItems(prev => prev.filter((_, i) => i !== idx));
  const handleItemSelect = (idx: number, selected: StoreItem) => {
    setItems(prev => prev.map((p, i) => i === idx ? { ...p, itemCode: selected.code, itemName: selected.description, unit: selected.unit } : p));
  };

  const buildPayload = () => ({
    department: form.department || "Department",
    costCenter: form.costCenter || "COST-XX",
    responsibleOfficer: form.officer || (user?.name || "Officer"),
    startDate: form.startDate || new Date().toISOString().slice(0, 10),
    endDate: form.endDate || new Date().toISOString().slice(0, 10),
    notes: form.notes,
    items: items.map((it) => ({ itemCode: it.itemCode || it.itemName.toUpperCase().replace(/\s+/g, "-"), itemName: it.itemName, unit: it.unit, approvedQty: it.approvedQty, usedQty: 0 })),
  });

  const resetForm = () => {
    setForm({ department: "", costCenter: "", officer: "", startDate: "", endDate: "", notes: "" });
    setItems([]);
  };

  const onSaveDraft = async () => {
    const draft = await createDraft(buildPayload());
    toast.success(`Draft created: ${draft.number}`);
    addNotification({ title: "RIA Draft Created", message: `${draft.number} for ${form.department}`, type: "info", link: `/stores/ria/view/${draft.id}` });
    setCreateOpen(false);
    resetForm();
    navigate(`/stores/ria/view/${draft.id}`);
  };

  const onSubmit = async () => {
    if (!form.department || items.length === 0) {
      toast.error("Fill required fields and add at least one item");
      return;
    }
    const draft = await createDraft(buildPayload());
    submitForApproval(draft.id);
    toast.success(`${draft.number} submitted for approval`);
    addNotification({ title: "RIA Submitted", message: `${draft.number} for ${form.department} submitted for approval`, type: "info", link: `/stores/ria/view/${draft.id}` });
    setCreateOpen(false);
    resetForm();
    navigate(`/stores/ria/view/${draft.id}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Routine Issue Authorities</h1>
          <p className="text-muted-foreground mt-1">Pre-approve recurring stock issues</p>
        </div>
        {user?.role !== "headteacher" && (
          <Button className="gap-2" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Create New RIA
          </Button>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="relative">
          <Input placeholder="Search RIA number, department…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
        <TabsList>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="pending">Pending Approval</TabsTrigger>
          <TabsTrigger value="expired">Expired</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
        {(["active", "pending", "expired", "all"] as TabKey[]).map((k) => (
          <TabsContent key={k} value={k}>
            <Card>
              <CardHeader>
                <CardTitle>RIA List</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>RIA No.</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Period</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Usage</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered
                        .filter((r) => (k === "all" ? true : r.status === k))
                        .map((r) => {
                          const total = r.items.reduce((s, it) => s + it.approvedQty, 0);
                          const used = r.items.reduce((s, it) => s + it.usedQty, 0);
                          const pct = total > 0 ? Math.round((used / total) * 100) : 0;
                          const usageClass = pct >= 90 ? "text-destructive" : pct >= 80 ? "text-warning" : "text-muted-foreground";
                          const canModerate = (user?.role === "bursar" || user?.role === "headteacher") && r.status === "pending";
                          return (
                            <TableRow key={r.id}>
                              <TableCell className="font-mono">{r.number}</TableCell>
                              <TableCell>{r.department}</TableCell>
                              <TableCell className="text-sm">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <CalendarDays className="h-4 w-4" />
                                  <span>{r.startDate} → {r.endDate}</span>
                                </div>
                              </TableCell>
                              <TableCell>{statusBadge(r.status)}</TableCell>
                              <TableCell className="w-48">
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground">{used}/{total}</span>
                                    <span className={usageClass}>{pct}%</span>
                                  </div>
                                  <Progress value={pct} />
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-1">
                                  <Button variant="ghost" size="sm" asChild>
                                    <Link to={`/stores/ria/view/${r.id}`}>
                                      <Eye className="h-4 w-4 mr-1" /> View
                                    </Link>
                                  </Button>
                                  {user?.role !== "headteacher" && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setConfirmState({ type: "issue", target: r });
                                        setConfirmOpen(true);
                                      }}
                                    >
                                      <ArrowUpFromLine className="h-4 w-4 mr-1" /> Issue
                                    </Button>
                                  )}
                                  {canModerate && (
                                    <>
                                      <Button
                                        size="sm"
                                        className="gap-1"
                                        onClick={() => {
                                          setConfirmState({ type: "approve", target: r });
                                          setConfirmOpen(true);
                                        }}
                                      >
                                        <Check className="h-4 w-4" /> Approve
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="destructive"
                                        className="gap-1"
                                        onClick={() => {
                                          setConfirmState({ type: "reject", target: r });
                                          setConfirmOpen(true);
                                        }}
                                      >
                                        <X className="h-4 w-4" /> Reject
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      {filtered.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground">
                            No RIAs match the current filters
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create RIA</DialogTitle>
            <DialogDescription>Define period and approved items for routine issue</DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label>Period Start *</Label>
                <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Period End *</Label>
                <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Receiving Unit *</Label>
                <Select value={form.department} onValueChange={(v) => setForm({ ...form, department: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {receivingUnits.map((u) => (
                      <SelectItem key={u} value={u}>{u}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Cost Center</Label>
                <Input placeholder="e.g., BOARDING" value={form.costCenter} onChange={(e) => setForm({ ...form, costCenter: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Responsible Officer *</Label>
                <Input placeholder="Officer name" value={form.officer} onChange={(e) => setForm({ ...form, officer: e.target.value })} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea rows={2} placeholder="Additional details…" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Approved Items</Label>
                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Item
                </Button>
              </div>

              {items.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[300px]">Item</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Approved Qty</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((it, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          <ItemCombobox
                            items={comboboxItems}
                            value={it.itemCode}
                            onSelect={(selected) => handleItemSelect(idx, selected)}
                            placeholder="Search item..."
                          />
                        </TableCell>
                        <TableCell>
                          <Input value={it.unit} readOnly className="w-20 bg-muted" />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={0}
                            value={it.approvedQty}
                            onChange={(e) =>
                              setItems((prev) => prev.map((p, i) => (i === idx ? { ...p, approvedQty: Number(e.target.value) } : p)))
                            }
                            className="w-24"
                          />
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => removeItem(idx)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="rounded-md border p-8 text-center text-muted-foreground">
                  No items added yet — click "Add Item" to start
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCreateOpen(false); resetForm(); }}>Cancel</Button>
            <Button variant="secondary" onClick={onSaveDraft}>Save as Draft</Button>
            <Button onClick={onSubmit}>Submit for Approval</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Action</DialogTitle>
            <DialogDescription>
              {confirmState.type === "approve" && "Approve this Routine Issue Authority? This will activate the period and items."}
              {confirmState.type === "reject" && "Reject this Routine Issue Authority? It will be marked as cancelled."}
              {confirmState.type === "issue" && "Proceed to Issue Stock using this RIA context?"}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancel</Button>
            <Button
              variant={confirmState.type === "reject" ? "destructive" : "default"}
              onClick={onConfirm}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function entregue(fn: (v: any) => void, v: string) {
  fn(v as any);
}
