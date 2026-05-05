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

interface Addition { id: string; no: string; date: string; asset: string; supplier: string; cost: number; fundedBy: string; paymentMethod: string; period: string; status: string; }

const INITIAL: Addition[] = [
  { id: "1", no: "ADD-2025-001", date: "10 Jan 2025", asset: "Computer Lab Projector", supplier: "AMS Suppliers", cost: 85000, fundedBy: "Own Funds", paymentMethod: "CHEQUE", period: "P01 Jan-25", status: "POSTED" },
  { id: "2", no: "ADD-2025-002", date: "12 Jan 2025", asset: "Science Lab Microscopes", supplier: "AMS Suppliers", cost: 120000, fundedBy: "Own Funds", paymentMethod: "EFT", period: "P01 Jan-25", status: "POSTED" },
  { id: "3", no: "ADD-2025-003", date: "15 Jan 2025", asset: "Admin Printer (A3)", supplier: "Tech Supplies Ltd", cost: 45000, fundedBy: "Own Funds", paymentMethod: "CHEQUE", period: "P01 Jan-25", status: "DRAFT" },
  { id: "4", no: "ADD-2025-004", date: "18 Jan 2025", asset: "Sports Equipment Set", supplier: "Sports Gear Ltd", cost: 65000, fundedBy: "Donation", paymentMethod: "CHEQUE", period: "P01 Jan-25", status: "DRAFT" },
  { id: "5", no: "ADD-2025-005", date: "20 Jan 2025", asset: "Water Tank (10,000L)", supplier: "Tanks & Pipes Ltd", cost: 180000, fundedBy: "Own Funds", paymentMethod: "EFT", period: "P01 Jan-25", status: "DRAFT" },
];

const SUPPLIERS = ["AMS Suppliers","Tech Supplies Ltd","Sports Gear Ltd","Tanks & Pipes Ltd","Book Sellers Ltd","Kenya Power"];
const CATEGORIES = ["BUILDING","VEHICLE","LAB EQUIP","COMPUTERS","FURNITURE","EQUIPMENT","OFFICE EQ"];
const PERIODS = ["P01 Jan-25","P02 Feb-25"];
const EMPTY = { asset: "", category: "EQUIPMENT", usefulLife: "", rate: "", method: "STRAIGHT_LINE", acquisitionDate: "", cost: "", supplier: "", invoiceRef: "", paymentMethod: "CHEQUE", bankAccount: "Cash at Bank – Equity", fundedBy: "Own Funds", period: "", narration: "" };

export default function Additions() {
  const { toast } = useToast();
  const [additions, setAdditions] = useState<Addition[]>(INITIAL);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<any>(EMPTY);

  const filtered = additions.filter(a =>
    (statusFilter === "ALL" || a.status === statusFilter) &&
    (a.no.toLowerCase().includes(search.toLowerCase()) || a.asset.toLowerCase().includes(search.toLowerCase()))
  );
  const { page, setPage, pageSize, setPageSize, paginatedItems, totalPages, from, to, total: totalRows } = usePagination(filtered);

  const save = () => {
    if (!form.asset || !form.cost || !form.period) { toast({ title: "Fill all required fields", variant: "destructive" }); return; }
    const no = `ADD-2025-${String(additions.length + 1).padStart(3, "0")}`;
    setAdditions(p => [...p, { id: Date.now().toString(), no, date: form.acquisitionDate || new Date().toLocaleDateString("en-KE"), asset: form.asset, supplier: form.supplier, cost: Number(form.cost), fundedBy: form.fundedBy, paymentMethod: form.paymentMethod, period: form.period, status: "DRAFT" }]);
    toast({ title: "Asset addition saved as draft" });
    setDialogOpen(false); setForm(EMPTY);
  };

  const post = (id: string) => { setAdditions(p => p.map(a => a.id === id ? { ...a, status: "POSTED" } : a)); toast({ title: "Addition posted — Dr PPE, Cr Bank/AP" }); };
  const reverse = (id: string) => { setAdditions(p => p.map(a => a.id === id ? { ...a, status: "REVERSED" } : a)); toast({ title: "Addition reversed" }); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Asset Additions</h1>
          <p className="text-muted-foreground">Record new asset acquisitions — Dr PPE → Cr Bank/Cash or AP</p>
        </div>
        <Button onClick={() => { setForm(EMPTY); setDialogOpen(true); }}><Plus className="mr-2 h-4 w-4" />New Addition</Button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search voucher no or asset..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
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
                <TableHead>Voucher No</TableHead><TableHead>Date</TableHead><TableHead>Asset</TableHead>
                <TableHead>Supplier</TableHead><TableHead className="text-right">Cost</TableHead>
                <TableHead>Funded By</TableHead><TableHead>Payment</TableHead>
                <TableHead>Period</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedItems.map(a => (
                <TableRow key={a.id}>
                  <TableCell className="font-mono font-medium">{a.no}</TableCell>
                  <TableCell>{a.date}</TableCell><TableCell className="font-medium">{a.asset}</TableCell>
                  <TableCell>{a.supplier}</TableCell>
                  <TableCell className="text-right font-medium">{fmt(a.cost)}</TableCell>
                  <TableCell>{a.fundedBy}</TableCell>
                  <TableCell><Badge variant="outline">{a.paymentMethod}</Badge></TableCell>
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
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>New Asset Addition</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="col-span-2 space-y-1"><Label>Asset Name *</Label><Input value={form.asset} onChange={e => setForm((p: any) => ({ ...p, asset: e.target.value }))} /></div>
            <div className="space-y-1">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={v => setForm((p: any) => ({ ...p, category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>Acquisition Date</Label><Input type="date" value={form.acquisitionDate} onChange={e => setForm((p: any) => ({ ...p, acquisitionDate: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Cost (KES) *</Label><Input type="number" value={form.cost} onChange={e => setForm((p: any) => ({ ...p, cost: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Useful Life (years)</Label><Input type="number" value={form.usefulLife} onChange={e => setForm((p: any) => ({ ...p, usefulLife: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Depr. Rate (%)</Label><Input type="number" value={form.rate} onChange={e => setForm((p: any) => ({ ...p, rate: e.target.value }))} /></div>
            <div className="space-y-1">
              <Label>Method</Label>
              <Select value={form.method} onValueChange={v => setForm((p: any) => ({ ...p, method: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="STRAIGHT_LINE">Straight Line</SelectItem><SelectItem value="REDUCING_BALANCE">Reducing Balance</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Supplier</Label>
              <Select value={form.supplier} onValueChange={v => setForm((p: any) => ({ ...p, supplier: v }))}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{SUPPLIERS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>Invoice Ref</Label><Input value={form.invoiceRef} onChange={e => setForm((p: any) => ({ ...p, invoiceRef: e.target.value }))} /></div>
            <div className="space-y-1">
              <Label>Payment Method</Label>
              <Select value={form.paymentMethod} onValueChange={v => setForm((p: any) => ({ ...p, paymentMethod: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="CASH">Cash</SelectItem><SelectItem value="CHEQUE">Cheque</SelectItem><SelectItem value="EFT">EFT</SelectItem><SelectItem value="AP">On Account (AP)</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>Funded By</Label><Input value={form.fundedBy} onChange={e => setForm((p: any) => ({ ...p, fundedBy: e.target.value }))} placeholder="Own Funds / Grant / Donation" /></div>
            <div className="space-y-1">
              <Label>Period *</Label>
              <Select value={form.period} onValueChange={v => setForm((p: any) => ({ ...p, period: v }))}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{PERIODS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
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
