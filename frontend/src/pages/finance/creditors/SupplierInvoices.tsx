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

interface Invoice { id: string; no: string; supplier: string; invoiceDate: string; dueDate: string; lpoRef: string; gross: number; tax: number; net: number; period: string; status: string; narration: string; }

const INITIAL: Invoice[] = [
  { id: "1", no: "INV-2025-001", supplier: "Unga Holdings Ltd", invoiceDate: "02 Jan 2025", dueDate: "01 Feb 2025", lpoRef: "LPO-001", gross: 145000, tax: 0, net: 145000, period: "P01 Jan-25", status: "POSTED", narration: "Food supplies" },
  { id: "2", no: "INV-2025-002", supplier: "AMS Suppliers", invoiceDate: "05 Jan 2025", dueDate: "04 Feb 2025", lpoRef: "LPO-002", gross: 67000, tax: 0, net: 67000, period: "P01 Jan-25", status: "POSTED", narration: "Stationery" },
  { id: "3", no: "INV-2025-003", supplier: "Book Sellers Ltd", invoiceDate: "08 Jan 2025", dueDate: "07 Feb 2025", lpoRef: "LPO-003", gross: 42000, tax: 0, net: 42000, period: "P01 Jan-25", status: "DRAFT", narration: "Textbooks" },
  { id: "4", no: "INV-2025-004", supplier: "Kenya Power & Lighting", invoiceDate: "10 Jan 2025", dueDate: "10 Feb 2025", lpoRef: "—", gross: 18500, tax: 2775, net: 21275, period: "P01 Jan-25", status: "POSTED", narration: "Electricity Jan" },
  { id: "5", no: "INV-2025-005", supplier: "Plumbers & Co.", invoiceDate: "12 Jan 2025", dueDate: "11 Feb 2025", lpoRef: "LPO-004", gross: 8500, tax: 0, net: 8500, period: "P01 Jan-25", status: "DRAFT", narration: "Plumbing repairs" },
  { id: "6", no: "INV-2025-006", supplier: "Unga Holdings Ltd", invoiceDate: "15 Jan 2025", dueDate: "14 Feb 2025", lpoRef: "LPO-005", gross: 95000, tax: 0, net: 95000, period: "P01 Jan-25", status: "DRAFT", narration: "Food supplies Feb" },
  { id: "7", no: "INV-2025-007", supplier: "AMS Suppliers", invoiceDate: "18 Jan 2025", dueDate: "17 Feb 2025", lpoRef: "LPO-006", gross: 34000, tax: 0, net: 34000, period: "P01 Jan-25", status: "POSTED", narration: "Cleaning supplies" },
  { id: "8", no: "INV-2025-008", supplier: "Book Sellers Ltd", invoiceDate: "20 Jan 2025", dueDate: "19 Feb 2025", lpoRef: "LPO-007", gross: 28000, tax: 0, net: 28000, period: "P01 Jan-25", status: "DRAFT", narration: "Library books" },
];

const SUPPLIERS = ["Unga Holdings Ltd","AMS Suppliers","Book Sellers Ltd","Kenya Power & Lighting","Plumbers & Co.","Tech Supplies Ltd"];
const ACCOUNTS = ["1400 – Inventory / Stores","5200 – Teaching Materials","5300 – Utilities","5400 – Repairs & Maintenance","6200 – Furniture & Equipment"];
const PERIODS = ["P01 Jan-25","P02 Feb-25","P04 Oct-24"];
const EMPTY_HDR = { supplier: "", invoiceDate: "", dueDate: "", lpoRef: "", period: "", narration: "" };
const EMPTY_LINE = { description: "", account: "", qty: "", unitPrice: "", amount: "" };

export default function SupplierInvoices() {
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>(INITIAL);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [hdr, setHdr] = useState<any>(EMPTY_HDR);
  const [lines, setLines] = useState<any[]>([{ ...EMPTY_LINE }]);

  const filtered = invoices.filter(i =>
    (statusFilter === "ALL" || i.status === statusFilter) &&
    (i.no.toLowerCase().includes(search.toLowerCase()) || i.supplier.toLowerCase().includes(search.toLowerCase()))
  );
  const { page, setPage, pageSize, setPageSize, paginatedItems, totalPages, from, to, total: totalRows } = usePagination(filtered);

  const totalAP = invoices.filter(i => i.status === "POSTED").reduce((s, i) => s + i.net, 0);
  const draftCount = invoices.filter(i => i.status === "DRAFT").length;

  const lineTotal = lines.reduce((s: number, l: any) => s + (Number(l.amount) || (Number(l.qty) * Number(l.unitPrice)) || 0), 0);

  const addLine = () => setLines((p: any[]) => [...p, { ...EMPTY_LINE }]);
  const removeLine = (i: number) => setLines((p: any[]) => p.filter((_: any, idx: number) => idx !== i));
  const updateLine = (i: number, field: string, value: string) => {
    setLines((p: any[]) => p.map((l: any, idx: number) => {
      if (idx !== i) return l;
      const updated = { ...l, [field]: value };
      if (field === "qty" || field === "unitPrice") updated.amount = String(Number(updated.qty || 0) * Number(updated.unitPrice || 0));
      return updated;
    }));
  };

  const save = () => {
    if (!hdr.supplier || !hdr.invoiceDate || !hdr.period) { toast({ title: "Fill all required fields", variant: "destructive" }); return; }
    const no = `INV-2025-${String(invoices.length + 1).padStart(3, "0")}`;
    setInvoices(p => [...p, { id: Date.now().toString(), no, supplier: hdr.supplier, invoiceDate: hdr.invoiceDate, dueDate: hdr.dueDate, lpoRef: hdr.lpoRef || "—", gross: lineTotal, tax: 0, net: lineTotal, period: hdr.period, status: "DRAFT", narration: hdr.narration }]);
    toast({ title: "Invoice saved as draft" });
    setDialogOpen(false); setHdr(EMPTY_HDR); setLines([{ ...EMPTY_LINE }]);
  };

  const post = (id: string) => { setInvoices(p => p.map(i => i.id === id ? { ...i, status: "POSTED" } : i)); toast({ title: "Invoice posted — AP liability created" }); };
  const reverse = (id: string) => { setInvoices(p => p.map(i => i.id === id ? { ...i, status: "REVERSED" } : i)); toast({ title: "Invoice reversed" }); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Supplier Invoices</h1>
          <p className="text-muted-foreground">Record AP invoices — Dr Inventory/Expense → Cr Accounts Payable</p>
        </div>
        <Button onClick={() => { setHdr(EMPTY_HDR); setLines([{ ...EMPTY_LINE }]); setDialogOpen(true); }}><Plus className="mr-2 h-4 w-4" />New Invoice</Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card><CardContent className="pt-4"><div className="text-2xl font-bold">{invoices.length}</div><div className="text-sm text-muted-foreground">Total Invoices</div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="text-2xl font-bold">{draftCount}</div><div className="text-sm text-muted-foreground">Pending (Draft)</div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="text-xl font-bold">{fmt(totalAP)}</div><div className="text-sm text-muted-foreground">Total AP Outstanding</div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="text-2xl font-bold text-amber-600">0</div><div className="text-sm text-muted-foreground">Overdue Invoices</div></CardContent></Card>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search invoice no or supplier..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Status</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="POSTED">Posted</SelectItem>
            <SelectItem value="REVERSED">Reversed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice No</TableHead><TableHead>Supplier</TableHead><TableHead>Inv. Date</TableHead>
                <TableHead>Due Date</TableHead><TableHead>LPO Ref</TableHead>
                <TableHead className="text-right">Gross</TableHead><TableHead className="text-right">Tax</TableHead>
                <TableHead className="text-right">Net</TableHead><TableHead>Period</TableHead>
                <TableHead>Status</TableHead><TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedItems.map(inv => (
                <TableRow key={inv.id}>
                  <TableCell className="font-mono font-medium">{inv.no}</TableCell>
                  <TableCell>{inv.supplier}</TableCell>
                  <TableCell className="text-sm">{inv.invoiceDate}</TableCell>
                  <TableCell className="text-sm">{inv.dueDate}</TableCell>
                  <TableCell className="font-mono text-sm">{inv.lpoRef}</TableCell>
                  <TableCell className="text-right">{fmt(inv.gross)}</TableCell>
                  <TableCell className="text-right">{inv.tax ? fmt(inv.tax) : "—"}</TableCell>
                  <TableCell className="text-right font-medium">{fmt(inv.net)}</TableCell>
                  <TableCell className="font-mono text-sm">{inv.period}</TableCell>
                  <TableCell><Badge className={STATUS_COLORS[inv.status]}>{inv.status}</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {inv.status === "DRAFT" && <Button size="sm" className="h-7 text-xs" onClick={() => post(inv.id)}><Send className="mr-1 h-3 w-3" />Post</Button>}
                      {inv.status === "POSTED" && <Button size="sm" variant="outline" className="h-7 text-xs text-red-600" onClick={() => reverse(inv.id)}><RotateCcw className="mr-1 h-3 w-3" />Reverse</Button>}
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
          <DialogHeader><DialogTitle>New Supplier Invoice</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label>Supplier *</Label>
                <Select value={hdr.supplier} onValueChange={v => setHdr((p: any) => ({ ...p, supplier: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{SUPPLIERS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label>Invoice Date *</Label><Input type="date" value={hdr.invoiceDate} onChange={e => setHdr((p: any) => ({ ...p, invoiceDate: e.target.value }))} /></div>
              <div className="space-y-1"><Label>Due Date</Label><Input type="date" value={hdr.dueDate} onChange={e => setHdr((p: any) => ({ ...p, dueDate: e.target.value }))} /></div>
              <div className="space-y-1"><Label>LPO Reference</Label><Input value={hdr.lpoRef} onChange={e => setHdr((p: any) => ({ ...p, lpoRef: e.target.value }))} /></div>
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
                <Label>Line Items</Label>
                <Button type="button" size="sm" variant="outline" onClick={addLine}><Plus className="mr-1 h-3 w-3" />Add Line</Button>
              </div>
              <Table>
                <TableHeader><TableRow><TableHead>Description</TableHead><TableHead>Account</TableHead><TableHead className="w-20">Qty</TableHead><TableHead className="w-28">Unit Price</TableHead><TableHead className="w-32">Amount</TableHead><TableHead className="w-10"></TableHead></TableRow></TableHeader>
                <TableBody>
                  {lines.map((l: any, i: number) => (
                    <TableRow key={i}>
                      <TableCell><Input className="h-8" value={l.description} onChange={e => updateLine(i, "description", e.target.value)} /></TableCell>
                      <TableCell>
                        <Select value={l.account} onValueChange={v => updateLine(i, "account", v)}>
                          <SelectTrigger className="h-8"><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>{ACCOUNTS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell><Input className="h-8" type="number" value={l.qty} onChange={e => updateLine(i, "qty", e.target.value)} /></TableCell>
                      <TableCell><Input className="h-8" type="number" value={l.unitPrice} onChange={e => updateLine(i, "unitPrice", e.target.value)} /></TableCell>
                      <TableCell><Input className="h-8 bg-muted/50" type="number" value={l.amount} readOnly /></TableCell>
                      <TableCell>{lines.length > 1 && <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => removeLine(i)}><Trash2 className="h-3 w-3" /></Button>}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex justify-end text-sm font-semibold">Net Total: {fmt(lineTotal)}</div>
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
