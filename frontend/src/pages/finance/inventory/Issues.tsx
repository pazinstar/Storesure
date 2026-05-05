import { useState } from "react";
import { Plus, Search, Send, RotateCcw, Trash2, AlertTriangle } from "lucide-react";
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

interface Issue { id: string; no: string; date: string; issuedTo: string; purpose: string; totalItems: number; totalValue: number; period: string; status: string; }

const INITIAL: Issue[] = [
  { id: "1", no: "ISS-2025-001", date: "10 Jan 2025", issuedTo: "Kitchen Dept", purpose: "Meal Preparation", totalItems: 4, totalValue: 32400, period: "P01 Jan-25", status: "POSTED" },
  { id: "2", no: "ISS-2025-002", date: "12 Jan 2025", issuedTo: "Admin Office", purpose: "Office Supplies", totalItems: 3, totalValue: 8550, period: "P01 Jan-25", status: "POSTED" },
  { id: "3", no: "ISS-2025-003", date: "15 Jan 2025", issuedTo: "Science Labs", purpose: "Lab Consumables", totalItems: 2, totalValue: 5200, period: "P01 Jan-25", status: "DRAFT" },
  { id: "4", no: "ISS-2025-004", date: "18 Jan 2025", issuedTo: "Library", purpose: "Books for Students", totalItems: 1, totalValue: 12000, period: "P01 Jan-25", status: "POSTED" },
  { id: "5", no: "ISS-2025-005", date: "20 Jan 2025", issuedTo: "Maintenance", purpose: "Cleaning Supplies", totalItems: 3, totalValue: 9050, period: "P01 Jan-25", status: "DRAFT" },
  { id: "6", no: "ISS-2025-006", date: "22 Jan 2025", issuedTo: "Kitchen Dept", purpose: "Meal Preparation", totalItems: 5, totalValue: 45200, period: "P01 Jan-25", status: "DRAFT" },
];

const ITEMS_MOCK: Record<string, number> = { "ITM001 – Maize Flour 10kg": 80, "ITM002 – Cooking Oil 20L": 45, "ITM003 – Sugar 50kg": 30, "ITM004 – Exercise Books": 120, "ITM005 – Pens": 85, "ITM006 – Biology Textbook": 200, "ITM008 – Cleaning Detergent": 60, "ITM011 – Chalk": 200, "ITM012 – Printer Paper": 150 };
const ITEM_COSTS: Record<string, number> = { "ITM001 – Maize Flour 10kg": 1250, "ITM002 – Cooking Oil 20L": 3200, "ITM003 – Sugar 50kg": 4500, "ITM004 – Exercise Books": 850, "ITM005 – Pens": 350, "ITM006 – Biology Textbook": 1200, "ITM008 – Cleaning Detergent": 850, "ITM011 – Chalk": 150, "ITM012 – Printer Paper": 550 };
const DEPARTMENTS = ["Kitchen Dept","Admin Office","Science Labs","Library","Maintenance","ICT Lab","Teaching Staff","Sports Dept"];
const PERIODS = ["P01 Jan-25","P02 Feb-25"];
const EMPTY_HDR = { date: "", issuedTo: "", purpose: "", approvedBy: "", period: "", narration: "" };
const EMPTY_LINE = { item: "", qty: "", unitCost: "", lineTotal: "" };

export default function Issues() {
  const { toast } = useToast();
  const [issues, setIssues] = useState<Issue[]>(INITIAL);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [hdr, setHdr] = useState<any>(EMPTY_HDR);
  const [lines, setLines] = useState<any[]>([{ ...EMPTY_LINE }]);
  const [stockWarning, setStockWarning] = useState<string[]>([]);

  const filtered = issues.filter(i =>
    (statusFilter === "ALL" || i.status === statusFilter) &&
    (i.no.toLowerCase().includes(search.toLowerCase()) || i.issuedTo.toLowerCase().includes(search.toLowerCase()))
  );
  const { page, setPage, pageSize, setPageSize, paginatedItems, totalPages, from, to, total: totalRows } = usePagination(filtered);

  const lineTotal = lines.reduce((s: number, l: any) => s + (Number(l.lineTotal) || 0), 0);
  const addLine = () => setLines((p: any[]) => [...p, { ...EMPTY_LINE }]);
  const removeLine = (i: number) => setLines((p: any[]) => p.filter((_: any, idx: number) => idx !== i));
  const updateLine = (i: number, field: string, value: string) => {
    setLines((prev: any[]) => {
      const updated = prev.map((l: any, idx: number) => {
        if (idx !== i) return l;
        const u = { ...l, [field]: value };
        if (field === "item") u.unitCost = String(ITEM_COSTS[value] || "");
        if (field === "qty" || field === "unitCost" || (field === "item" && u.qty)) u.lineTotal = String(Number(u.qty || 0) * Number(u.unitCost || 0));
        return u;
      });
      // Check stock
      const warnings = updated.filter((l: any) => l.item && l.qty && ITEMS_MOCK[l.item] !== undefined && Number(l.qty) > ITEMS_MOCK[l.item]).map((l: any) => l.item);
      setStockWarning(warnings);
      return updated;
    });
  };

  const save = () => {
    if (!hdr.date || !hdr.issuedTo || !hdr.period) { toast({ title: "Fill all required fields", variant: "destructive" }); return; }
    if (stockWarning.length > 0) { toast({ title: `Insufficient stock for: ${stockWarning.join(", ")}`, variant: "destructive" }); return; }
    const no = `ISS-2025-${String(issues.length + 1).padStart(3, "0")}`;
    setIssues(p => [...p, { id: Date.now().toString(), no, date: hdr.date, issuedTo: hdr.issuedTo, purpose: hdr.purpose, totalItems: lines.length, totalValue: lineTotal, period: hdr.period, status: "DRAFT" }]);
    toast({ title: "Issue saved as draft" });
    setDialogOpen(false); setHdr(EMPTY_HDR); setLines([{ ...EMPTY_LINE }]); setStockWarning([]);
  };

  const post = (id: string) => { setIssues(p => p.map(i => i.id === id ? { ...i, status: "POSTED" } : i)); toast({ title: "Issue posted — stock reduced, expense recorded" }); };
  const reverse = (id: string) => { setIssues(p => p.map(i => i.id === id ? { ...i, status: "REVERSED" } : i)); toast({ title: "Issue reversed" }); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inventory Issues</h1>
          <p className="text-muted-foreground">Issue items to departments — Dr Expense → Cr Inventory</p>
        </div>
        <Button onClick={() => { setHdr(EMPTY_HDR); setLines([{ ...EMPTY_LINE }]); setStockWarning([]); setDialogOpen(true); }}><Plus className="mr-2 h-4 w-4" />New Issue</Button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search issue no or department..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
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
                <TableHead>Issue No</TableHead><TableHead>Date</TableHead><TableHead>Issued To</TableHead>
                <TableHead>Purpose</TableHead><TableHead className="text-right">Items</TableHead>
                <TableHead className="text-right">Total Value</TableHead><TableHead>Period</TableHead>
                <TableHead>Status</TableHead><TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedItems.map(iss => (
                <TableRow key={iss.id}>
                  <TableCell className="font-mono font-medium">{iss.no}</TableCell>
                  <TableCell>{iss.date}</TableCell><TableCell>{iss.issuedTo}</TableCell>
                  <TableCell className="text-sm">{iss.purpose}</TableCell>
                  <TableCell className="text-right">{iss.totalItems}</TableCell>
                  <TableCell className="text-right font-medium">{fmt(iss.totalValue)}</TableCell>
                  <TableCell className="font-mono text-sm">{iss.period}</TableCell>
                  <TableCell><Badge className={STATUS_COLORS[iss.status]}>{iss.status}</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {iss.status === "DRAFT" && <Button size="sm" className="h-7 text-xs" onClick={() => post(iss.id)}><Send className="mr-1 h-3 w-3" />Post</Button>}
                      {iss.status === "POSTED" && <Button size="sm" variant="outline" className="h-7 text-xs text-red-600" onClick={() => reverse(iss.id)}><RotateCcw className="mr-1 h-3 w-3" />Reverse</Button>}
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
          <DialogHeader><DialogTitle>New Inventory Issue</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            {stockWarning.length > 0 && (
              <div className="flex items-center gap-2 rounded-md bg-amber-50 border border-amber-200 p-3 text-amber-800 text-sm">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>Insufficient stock for: {stockWarning.join(", ")}</span>
              </div>
            )}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1"><Label>Date *</Label><Input type="date" value={hdr.date} onChange={e => setHdr((p: any) => ({ ...p, date: e.target.value }))} /></div>
              <div className="space-y-1">
                <Label>Issued To *</Label>
                <Select value={hdr.issuedTo} onValueChange={v => setHdr((p: any) => ({ ...p, issuedTo: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select dept" /></SelectTrigger>
                  <SelectContent>{DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label>Purpose</Label><Input value={hdr.purpose} onChange={e => setHdr((p: any) => ({ ...p, purpose: e.target.value }))} /></div>
              <div className="space-y-1"><Label>Approved By</Label><Input value={hdr.approvedBy} onChange={e => setHdr((p: any) => ({ ...p, approvedBy: e.target.value }))} /></div>
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
                <Label>Items to Issue</Label>
                <Button type="button" size="sm" variant="outline" onClick={addLine}><Plus className="mr-1 h-3 w-3" />Add Item</Button>
              </div>
              <Table>
                <TableHeader><TableRow><TableHead>Item</TableHead><TableHead className="w-28">Qty Issued</TableHead><TableHead className="w-28">Unit Cost</TableHead><TableHead className="w-28">Line Total</TableHead><TableHead className="w-10"></TableHead></TableRow></TableHeader>
                <TableBody>
                  {lines.map((l: any, i: number) => (
                    <TableRow key={i} className={stockWarning.includes(l.item) ? "bg-amber-50" : ""}>
                      <TableCell>
                        <Select value={l.item} onValueChange={v => updateLine(i, "item", v)}>
                          <SelectTrigger className="h-8"><SelectValue placeholder="Select item" /></SelectTrigger>
                          <SelectContent>{Object.keys(ITEMS_MOCK).map(it => <SelectItem key={it} value={it}>{it} (stock: {ITEMS_MOCK[it]})</SelectItem>)}</SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell><Input className="h-8" type="number" value={l.qty} onChange={e => updateLine(i, "qty", e.target.value)} /></TableCell>
                      <TableCell><Input className="h-8 bg-muted/50" type="number" value={l.unitCost} readOnly /></TableCell>
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
