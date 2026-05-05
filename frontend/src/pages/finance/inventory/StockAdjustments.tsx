import { useState } from "react";
import { Plus, Search, Send, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/ui/table-pagination";

const fmt = (n: number) => new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(n);
const STATUS_COLORS: Record<string, string> = { DRAFT: "bg-gray-100 text-gray-700", POSTED: "bg-green-100 text-green-800", REVERSED: "bg-red-100 text-red-700" };

interface Adj { id: string; no: string; date: string; item: string; type: "INCREASE" | "DECREASE"; qtyBefore: number; adjQty: number; qtyAfter: number; valueImpact: number; reason: string; docRef: string; period: string; status: string; }

const INITIAL: Adj[] = [
  { id: "1", no: "ADJ-2025-001", date: "20 Jan 2025", item: "Maize Flour 10kg", type: "INCREASE", qtyBefore: 75, adjQty: 5, qtyAfter: 80, valueImpact: 6250, reason: "Stock count variance", docRef: "STKCOUNT-001", period: "P01 Jan-25", status: "POSTED" },
  { id: "2", no: "ADJ-2025-002", date: "20 Jan 2025", item: "Cooking Oil 20L", type: "DECREASE", qtyBefore: 50, adjQty: 5, qtyAfter: 45, valueImpact: -16000, reason: "Spillage/wastage", docRef: "STKCOUNT-001", period: "P01 Jan-25", status: "POSTED" },
  { id: "3", no: "ADJ-2025-003", date: "20 Jan 2025", item: "Sugar 50kg", type: "INCREASE", qtyBefore: 28, adjQty: 2, qtyAfter: 30, valueImpact: 9000, reason: "Stock count variance", docRef: "STKCOUNT-001", period: "P01 Jan-25", status: "POSTED" },
  { id: "4", no: "ADJ-2025-004", date: "25 Jan 2025", item: "Exercise Books (per box)", type: "DECREASE", qtyBefore: 125, adjQty: 5, qtyAfter: 120, valueImpact: -4250, reason: "Damaged goods", docRef: "INSPECT-002", period: "P01 Jan-25", status: "DRAFT" },
  { id: "5", no: "ADJ-2025-005", date: "25 Jan 2025", item: "Pens (box of 50)", type: "INCREASE", qtyBefore: 80, adjQty: 5, qtyAfter: 85, valueImpact: 1750, reason: "Found in store room", docRef: "INSPECT-002", period: "P01 Jan-25", status: "DRAFT" },
];

const ITEMS: Record<string, { qty: number; cost: number }> = {
  "ITM001 – Maize Flour 10kg": { qty: 80, cost: 1250 },
  "ITM002 – Cooking Oil 20L": { qty: 45, cost: 3200 },
  "ITM003 – Sugar 50kg": { qty: 30, cost: 4500 },
  "ITM004 – Exercise Books": { qty: 120, cost: 850 },
  "ITM005 – Pens": { qty: 85, cost: 350 },
  "ITM011 – Chalk": { qty: 200, cost: 150 },
  "ITM012 – Printer Paper": { qty: 150, cost: 550 },
};

const PERIODS = ["P01 Jan-25","P02 Feb-25"];
const EMPTY = { item: "", type: "INCREASE" as "INCREASE" | "DECREASE", adjQty: "", docRef: "", reason: "", period: "" };

export default function StockAdjustments() {
  const { toast } = useToast();
  const [adjs, setAdjs] = useState<Adj[]>(INITIAL);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<any>(EMPTY);

  const selectedItem = ITEMS[form.item];
  const qtyBefore = selectedItem?.qty ?? 0;
  const adjQty = Number(form.adjQty) || 0;
  const qtyAfter = form.type === "INCREASE" ? qtyBefore + adjQty : qtyBefore - adjQty;
  const unitCost = selectedItem?.cost ?? 0;
  const valueImpact = (form.type === "INCREASE" ? adjQty : -adjQty) * unitCost;

  const filtered = adjs.filter(a =>
    (statusFilter === "ALL" || a.status === statusFilter) &&
    (a.no.toLowerCase().includes(search.toLowerCase()) || a.item.toLowerCase().includes(search.toLowerCase()))
  );
  const { page, setPage, pageSize, setPageSize, paginatedItems, totalPages, from, to, total: totalRows } = usePagination(filtered);

  const save = () => {
    if (!form.item || !form.adjQty || !form.period) { toast({ title: "Fill all required fields", variant: "destructive" }); return; }
    const no = `ADJ-2025-${String(adjs.length + 1).padStart(3, "0")}`;
    setAdjs(p => [...p, { id: Date.now().toString(), no, date: new Date().toLocaleDateString("en-KE"), item: form.item.split(" – ").slice(1).join(" – ") || form.item, type: form.type, qtyBefore, adjQty, qtyAfter, valueImpact, reason: form.reason, docRef: form.docRef, period: form.period, status: "DRAFT" }]);
    toast({ title: "Stock adjustment saved as draft" });
    setDialogOpen(false); setForm(EMPTY);
  };

  const post = (id: string) => { setAdjs(p => p.map(a => a.id === id ? { ...a, status: "POSTED" } : a)); toast({ title: "Adjustment posted — stock ledger updated" }); };
  const reverse = (id: string) => { setAdjs(p => p.map(a => a.id === id ? { ...a, status: "REVERSED" } : a)); toast({ title: "Adjustment reversed" }); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Stock Adjustments</h1>
          <p className="text-muted-foreground">Correct stock discrepancies found during physical counts</p>
        </div>
        <Button onClick={() => { setForm(EMPTY); setDialogOpen(true); }}><Plus className="mr-2 h-4 w-4" />New Adjustment</Button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search adjustment no or item..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="ALL">All Status</SelectItem><SelectItem value="DRAFT">Draft</SelectItem><SelectItem value="POSTED">Posted</SelectItem><SelectItem value="REVERSED">Reversed</SelectItem></SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Adj No</TableHead><TableHead>Date</TableHead><TableHead>Item</TableHead>
                <TableHead>Type</TableHead><TableHead className="text-right">Qty Before</TableHead>
                <TableHead className="text-right">Adj Qty</TableHead><TableHead className="text-right">Qty After</TableHead>
                <TableHead className="text-right">Value Impact</TableHead>
                <TableHead>Reason</TableHead><TableHead>Period</TableHead>
                <TableHead>Status</TableHead><TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedItems.map(a => (
                <TableRow key={a.id}>
                  <TableCell className="font-mono font-medium">{a.no}</TableCell>
                  <TableCell>{a.date}</TableCell>
                  <TableCell className="font-medium">{a.item}</TableCell>
                  <TableCell><Badge className={a.type === "INCREASE" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>{a.type === "INCREASE" ? "+" : "−"} {a.type}</Badge></TableCell>
                  <TableCell className="text-right">{a.qtyBefore}</TableCell>
                  <TableCell className={`text-right font-medium ${a.type === "INCREASE" ? "text-green-700" : "text-red-600"}`}>{a.type === "INCREASE" ? "+" : "−"}{a.adjQty}</TableCell>
                  <TableCell className="text-right">{a.qtyAfter}</TableCell>
                  <TableCell className={`text-right font-medium ${a.valueImpact >= 0 ? "text-green-700" : "text-red-600"}`}>{a.valueImpact >= 0 ? "+" : ""}{fmt(a.valueImpact)}</TableCell>
                  <TableCell className="text-sm max-w-[140px] truncate">{a.reason}</TableCell>
                  <TableCell className="font-mono text-sm">{a.period}</TableCell>
                  <TableCell><Badge className={STATUS_COLORS[a.status]}>{a.status}</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {a.status === "DRAFT" && <Button size="sm" className="h-7 text-xs" onClick={() => post(a.id)}><Send className="mr-1 h-3 w-3" />Post</Button>}
                      {a.status === "POSTED" && <Button size="sm" variant="outline" className="h-7 text-xs text-red-600" onClick={() => reverse(a.id)}><RotateCcw className="mr-1 h-3 w-3" />Reverse</Button>}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination page={page} totalPages={totalPages} from={from} to={to} total={totalRows} onPageChange={setPage} />
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>New Stock Adjustment</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1">
              <Label>Item *</Label>
              <Select value={form.item} onValueChange={v => setForm((p: any) => ({ ...p, item: v }))}>
                <SelectTrigger><SelectValue placeholder="Select item" /></SelectTrigger>
                <SelectContent>{Object.keys(ITEMS).map(it => <SelectItem key={it} value={it}>{it}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {selectedItem && <div className="text-sm text-muted-foreground bg-muted/50 rounded p-2">Current stock: <strong>{selectedItem.qty}</strong> units @ {fmt(selectedItem.cost)}/unit</div>}
            <div className="space-y-1">
              <Label>Adjustment Type</Label>
              <Select value={form.type} onValueChange={v => setForm((p: any) => ({ ...p, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="INCREASE">Increase (add stock)</SelectItem><SelectItem value="DECREASE">Decrease (remove stock)</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>Adjustment Quantity *</Label><Input type="number" value={form.adjQty} onChange={e => setForm((p: any) => ({ ...p, adjQty: e.target.value }))} /></div>
            {form.adjQty && selectedItem && (
              <div className="text-sm bg-muted/50 rounded p-2 space-y-1">
                <div>Qty After: <strong>{qtyAfter}</strong></div>
                <div>Value Impact: <strong className={valueImpact >= 0 ? "text-green-700" : "text-red-600"}>{valueImpact >= 0 ? "+" : ""}{fmt(valueImpact)}</strong></div>
              </div>
            )}
            <div className="space-y-1"><Label>Supporting Document Ref</Label><Input value={form.docRef} onChange={e => setForm((p: any) => ({ ...p, docRef: e.target.value }))} placeholder="e.g. STKCOUNT-001" /></div>
            <div className="space-y-1">
              <Label>Period *</Label>
              <Select value={form.period} onValueChange={v => setForm((p: any) => ({ ...p, period: v }))}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{PERIODS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>Reason</Label><Textarea value={form.reason} onChange={e => setForm((p: any) => ({ ...p, reason: e.target.value }))} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={save}>Save as Draft</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
