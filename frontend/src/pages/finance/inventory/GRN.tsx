import { useState } from "react";
import { Plus, Search, Send, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/ui/table-pagination";

const fmt = (n: number) => new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(n);
const STATUS_COLORS: Record<string, string> = { DRAFT: "bg-gray-100 text-gray-700", POSTED: "bg-green-100 text-green-800", REVERSED: "bg-red-100 text-red-700" };

interface GRN { id: string; no: string; date: string; supplier: string; lpoRef: string; invoiceRef: string; totalItems: number; totalValue: number; period: string; status: string; }

const INITIAL: GRN[] = [
  { id: "1", no: "GRN-2025-001", date: "05 Jan 2025", supplier: "Unga Holdings Ltd", lpoRef: "LPO-001", invoiceRef: "INV-2025-001", totalItems: 3, totalValue: 145000, period: "P01 Jan-25", status: "POSTED" },
  { id: "2", no: "GRN-2025-002", date: "08 Jan 2025", supplier: "AMS Suppliers", lpoRef: "LPO-002", invoiceRef: "INV-2025-002", totalItems: 5, totalValue: 67000, period: "P01 Jan-25", status: "POSTED" },
  { id: "3", no: "GRN-2025-003", date: "10 Jan 2025", supplier: "Book Sellers Ltd", lpoRef: "LPO-003", invoiceRef: "INV-2025-003", totalItems: 2, totalValue: 42000, period: "P01 Jan-25", status: "DRAFT" },
  { id: "4", no: "GRN-2025-004", date: "12 Jan 2025", supplier: "Plumbers & Co.", lpoRef: "LPO-004", invoiceRef: "INV-2025-005", totalItems: 1, totalValue: 8500, period: "P01 Jan-25", status: "DRAFT" },
  { id: "5", no: "GRN-2025-005", date: "15 Jan 2025", supplier: "Unga Holdings Ltd", lpoRef: "LPO-005", invoiceRef: "INV-2025-006", totalItems: 4, totalValue: 95000, period: "P01 Jan-25", status: "DRAFT" },
  { id: "6", no: "GRN-2025-006", date: "18 Jan 2025", supplier: "AMS Suppliers", lpoRef: "LPO-006", invoiceRef: "INV-2025-007", totalItems: 6, totalValue: 34000, period: "P01 Jan-25", status: "POSTED" },
];

const SUPPLIERS = ["Unga Holdings Ltd","AMS Suppliers","Book Sellers Ltd","Plumbers & Co.","Kenya Power & Lighting"];
const ITEMS = ["ITM001 – Maize Flour 10kg","ITM002 – Cooking Oil 20L","ITM003 – Sugar 50kg","ITM004 – Exercise Books","ITM005 – Pens","ITM006 – Biology Textbook","ITM007 – Chemistry Textbook","ITM008 – Cleaning Detergent","ITM009 – Toilet Paper","ITM010 – Diesel Fuel","ITM011 – Chalk","ITM012 – Printer Paper"];
const PERIODS = ["P01 Jan-25","P02 Feb-25"];
const EMPTY_HDR = { date: "", supplier: "", lpoRef: "", invoiceRef: "", period: "", narration: "" };
const EMPTY_LINE = { item: "", qty: "", unitCost: "", lineTotal: "" };

export default function GRN() {
  const { toast } = useToast();
  const [grns, setGRNs] = useState<GRN[]>(INITIAL);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [hdr, setHdr] = useState<any>(EMPTY_HDR);
  const [lines, setLines] = useState<any[]>([{ ...EMPTY_LINE }]);

  const filtered = grns.filter(g =>
    (statusFilter === "ALL" || g.status === statusFilter) &&
    (g.no.toLowerCase().includes(search.toLowerCase()) || g.supplier.toLowerCase().includes(search.toLowerCase()))
  );
  const { page, setPage, pageSize, setPageSize, paginatedItems, totalPages, from, to, total: totalRows } = usePagination(filtered);

  const lineTotal = lines.reduce((s: number, l: any) => s + (Number(l.lineTotal) || Number(l.qty) * Number(l.unitCost) || 0), 0);
  const addLine = () => setLines((p: any[]) => [...p, { ...EMPTY_LINE }]);
  const removeLine = (i: number) => setLines((p: any[]) => p.filter((_: any, idx: number) => idx !== i));
  const updateLine = (i: number, field: string, value: string) => {
    setLines((p: any[]) => p.map((l: any, idx: number) => {
      if (idx !== i) return l;
      const u = { ...l, [field]: value };
      if (field === "qty" || field === "unitCost") u.lineTotal = String(Number(u.qty || 0) * Number(u.unitCost || 0));
      return u;
    }));
  };

  const save = () => {
    if (!hdr.date || !hdr.supplier || !hdr.period) { toast({ title: "Fill all required fields", variant: "destructive" }); return; }
    const no = `GRN-2025-${String(grns.length + 1).padStart(3, "0")}`;
    setGRNs(p => [...p, { id: Date.now().toString(), no, date: hdr.date, supplier: hdr.supplier, lpoRef: hdr.lpoRef || "—", invoiceRef: hdr.invoiceRef || "—", totalItems: lines.length, totalValue: lineTotal, period: hdr.period, status: "DRAFT" }]);
    toast({ title: "GRN saved as draft" });
    setDialogOpen(false); setHdr(EMPTY_HDR); setLines([{ ...EMPTY_LINE }]);
  };

  const post = (id: string) => { setGRNs(p => p.map(g => g.id === id ? { ...g, status: "POSTED" } : g)); toast({ title: "GRN posted — inventory updated, AP created" }); };
  const reverse = (id: string) => { setGRNs(p => p.map(g => g.id === id ? { ...g, status: "REVERSED" } : g)); toast({ title: "GRN reversed" }); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Goods Received Notes (GRN)</h1>
          <p className="text-muted-foreground">Receive stock against LPOs — Dr Inventory → Cr Accounts Payable</p>
        </div>
        <Button onClick={() => { setHdr(EMPTY_HDR); setLines([{ ...EMPTY_LINE }]); setDialogOpen(true); }}><Plus className="mr-2 h-4 w-4" />New GRN</Button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search GRN no or supplier..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
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
                <TableHead>GRN No</TableHead><TableHead>Date</TableHead><TableHead>Supplier</TableHead>
                <TableHead>LPO Ref</TableHead><TableHead>Invoice Ref</TableHead>
                <TableHead className="text-right">Items</TableHead><TableHead className="text-right">Total Value</TableHead>
                <TableHead>Period</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedItems.map(g => (
                <TableRow key={g.id}>
                  <TableCell className="font-mono font-medium">{g.no}</TableCell>
                  <TableCell>{g.date}</TableCell><TableCell>{g.supplier}</TableCell>
                  <TableCell className="font-mono text-sm">{g.lpoRef}</TableCell>
                  <TableCell className="font-mono text-sm">{g.invoiceRef}</TableCell>
                  <TableCell className="text-right">{g.totalItems}</TableCell>
                  <TableCell className="text-right font-medium">{fmt(g.totalValue)}</TableCell>
                  <TableCell className="font-mono text-sm">{g.period}</TableCell>
                  <TableCell><Badge className={STATUS_COLORS[g.status]}>{g.status}</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {g.status === "DRAFT" && <Button size="sm" className="h-7 text-xs" onClick={() => post(g.id)}><Send className="mr-1 h-3 w-3" />Post</Button>}
                      {g.status === "POSTED" && <Button size="sm" variant="outline" className="h-7 text-xs text-red-600" onClick={() => reverse(g.id)}><RotateCcw className="mr-1 h-3 w-3" />Reverse</Button>}
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New Goods Received Note</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1"><Label>Date *</Label><Input type="date" value={hdr.date} onChange={e => setHdr((p: any) => ({ ...p, date: e.target.value }))} /></div>
              <div className="space-y-1">
                <Label>Supplier *</Label>
                <Select value={hdr.supplier} onValueChange={v => setHdr((p: any) => ({ ...p, supplier: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{SUPPLIERS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label>LPO Reference</Label><Input value={hdr.lpoRef} onChange={e => setHdr((p: any) => ({ ...p, lpoRef: e.target.value }))} /></div>
              <div className="space-y-1"><Label>Supplier Invoice No</Label><Input value={hdr.invoiceRef} onChange={e => setHdr((p: any) => ({ ...p, invoiceRef: e.target.value }))} /></div>
              <div className="space-y-1">
                <Label>Period *</Label>
                <Select value={hdr.period} onValueChange={v => setHdr((p: any) => ({ ...p, period: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{PERIODS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1"><Label>Narration</Label><Textarea value={hdr.narration} onChange={e => setHdr((p: any) => ({ ...p, narration: e.target.value }))} rows={2} /></div>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Items Received</Label>
                <Button type="button" size="sm" variant="outline" onClick={addLine}><Plus className="mr-1 h-3 w-3" />Add Item</Button>
              </div>
              <Table>
                <TableHeader><TableRow><TableHead>Item</TableHead><TableHead className="w-24">Qty Rcvd</TableHead><TableHead className="w-32">Unit Cost</TableHead><TableHead className="w-32">Line Total</TableHead><TableHead className="w-10"></TableHead></TableRow></TableHeader>
                <TableBody>
                  {lines.map((l: any, i: number) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Select value={l.item} onValueChange={v => updateLine(i, "item", v)}>
                          <SelectTrigger className="h-8"><SelectValue placeholder="Select item" /></SelectTrigger>
                          <SelectContent>{ITEMS.map(it => <SelectItem key={it} value={it}>{it}</SelectItem>)}</SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell><Input className="h-8" type="number" value={l.qty} onChange={e => updateLine(i, "qty", e.target.value)} /></TableCell>
                      <TableCell><Input className="h-8" type="number" value={l.unitCost} onChange={e => updateLine(i, "unitCost", e.target.value)} /></TableCell>
                      <TableCell><Input className="h-8 bg-muted/50" type="number" value={l.lineTotal} readOnly /></TableCell>
                      <TableCell>{lines.length > 1 && <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => removeLine(i)}><Trash2 className="h-3 w-3" /></Button>}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex justify-end text-sm font-semibold">Total: {fmt(lineTotal)}</div>
            </div>
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
