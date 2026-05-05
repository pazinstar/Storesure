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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/ui/table-pagination";

const fmt = (n: number) => new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(n);
const STATUS_COLORS: Record<string, string> = { DRAFT: "bg-gray-100 text-gray-700", POSTED: "bg-green-100 text-green-800", REVERSED: "bg-red-100 text-red-700" };

interface Note { id: string; no: string; type: "CREDIT" | "DEBIT"; supplier: string; invoice: string; date: string; amount: number; reason: string; account: string; period: string; status: string; }

const INITIAL: Note[] = [
  { id: "1", no: "CDN-2025-001", type: "CREDIT", supplier: "Unga Holdings Ltd", invoice: "INV-2025-001", date: "10 Jan 2025", amount: 5000, reason: "Overcharge on invoice", account: "2100 – Accounts Payable", period: "P01 Jan-25", status: "POSTED" },
  { id: "2", no: "CDN-2025-002", type: "DEBIT", supplier: "AMS Suppliers", invoice: "INV-2025-002", date: "12 Jan 2025", amount: 2500, reason: "Additional delivery charge", account: "5400 – Repairs & Maintenance", period: "P01 Jan-25", status: "POSTED" },
  { id: "3", no: "CDN-2025-003", type: "CREDIT", supplier: "Book Sellers Ltd", invoice: "INV-2025-003", date: "14 Jan 2025", amount: 3000, reason: "Wrong items returned", account: "2100 – Accounts Payable", period: "P01 Jan-25", status: "DRAFT" },
  { id: "4", no: "CDN-2025-004", type: "CREDIT", supplier: "Kenya Power & Lighting", invoice: "INV-2025-004", date: "16 Jan 2025", amount: 1275, reason: "Billing error credit", account: "5300 – Utilities", period: "P01 Jan-25", status: "DRAFT" },
  { id: "5", no: "CDN-2025-005", type: "DEBIT", supplier: "Plumbers & Co.", invoice: "INV-2025-005", date: "18 Jan 2025", amount: 1000, reason: "Late delivery penalty", account: "2100 – Accounts Payable", period: "P01 Jan-25", status: "DRAFT" },
  { id: "6", no: "CDN-2025-006", type: "CREDIT", supplier: "Unga Holdings Ltd", invoice: "INV-2025-006", date: "20 Jan 2025", amount: 8000, reason: "Goods returned to supplier", account: "1400 – Inventory / Stores", period: "P01 Jan-25", status: "POSTED" },
];

const SUPPLIERS = ["Unga Holdings Ltd","AMS Suppliers","Book Sellers Ltd","Kenya Power & Lighting","Plumbers & Co."];
const INVOICES = ["INV-2025-001","INV-2025-002","INV-2025-003","INV-2025-004","INV-2025-005","INV-2025-006"];
const ACCOUNTS = ["2100 – Accounts Payable","1400 – Inventory / Stores","5200 – Teaching Materials","5300 – Utilities","5400 – Repairs & Maintenance"];
const PERIODS = ["P01 Jan-25","P02 Feb-25"];
const EMPTY = { type: "CREDIT" as "CREDIT" | "DEBIT", supplier: "", invoice: "", date: "", amount: "", reason: "", account: "", period: "" };

export default function CreditDebitNotes() {
  const { toast } = useToast();
  const [notes, setNotes] = useState<Note[]>(INITIAL);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<any>(EMPTY);

  const post = (id: string) => { setNotes(p => p.map(n => n.id === id ? { ...n, status: "POSTED" } : n)); toast({ title: "Note posted" }); };
  const reverse = (id: string) => { setNotes(p => p.map(n => n.id === id ? { ...n, status: "REVERSED" } : n)); toast({ title: "Note reversed" }); };

  const save = () => {
    if (!form.supplier || !form.date || !form.amount || !form.period) { toast({ title: "Fill all required fields", variant: "destructive" }); return; }
    const no = `CDN-2025-${String(notes.length + 1).padStart(3, "0")}`;
    setNotes(p => [...p, { id: Date.now().toString(), no, type: form.type, supplier: form.supplier, invoice: form.invoice || "—", date: form.date, amount: Number(form.amount), reason: form.reason, account: form.account, period: form.period, status: "DRAFT" }]);
    toast({ title: `${form.type === "CREDIT" ? "Credit" : "Debit"} note saved as draft` });
    setDialogOpen(false); setForm(EMPTY);
  };

  const NoteTable = ({ data }: { data: Note[] }) => {
    const filtered = data.filter(n => n.no.toLowerCase().includes(search.toLowerCase()) || n.supplier.toLowerCase().includes(search.toLowerCase()));
    const { page, setPage, pageSize, setPageSize, paginatedItems, totalPages, from, to, total: totalRows } = usePagination(filtered);
    return (
      <>
        <div className="flex items-center gap-2 px-4 py-2 border-b">
          <span className="text-sm text-muted-foreground whitespace-nowrap">Show</span>
          <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
            <SelectTrigger className="w-20 h-8"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">entries</span>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Note No</TableHead><TableHead>Type</TableHead><TableHead>Supplier</TableHead>
              <TableHead>Related Invoice</TableHead><TableHead>Date</TableHead>
              <TableHead className="text-right">Amount</TableHead><TableHead>Reason</TableHead>
              <TableHead>Period</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedItems.map(n => (
              <TableRow key={n.id}>
                <TableCell className="font-mono font-medium">{n.no}</TableCell>
                <TableCell><Badge className={n.type === "CREDIT" ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"}>{n.type}</Badge></TableCell>
                <TableCell>{n.supplier}</TableCell>
                <TableCell className="font-mono text-sm">{n.invoice}</TableCell>
                <TableCell className="text-sm">{n.date}</TableCell>
                <TableCell className="text-right font-medium">{fmt(n.amount)}</TableCell>
                <TableCell className="text-sm max-w-[180px] truncate">{n.reason}</TableCell>
                <TableCell className="font-mono text-sm">{n.period}</TableCell>
                <TableCell><Badge className={STATUS_COLORS[n.status]}>{n.status}</Badge></TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {n.status === "DRAFT" && <Button size="sm" className="h-7 text-xs" onClick={() => post(n.id)}><Send className="mr-1 h-3 w-3" />Post</Button>}
                    {n.status === "POSTED" && <Button size="sm" variant="outline" className="h-7 text-xs text-red-600" onClick={() => reverse(n.id)}><RotateCcw className="mr-1 h-3 w-3" />Reverse</Button>}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination page={page} totalPages={totalPages} from={from} to={to} total={totalRows} onPageChange={setPage} />
      </>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Credit / Debit Notes</h1>
          <p className="text-muted-foreground">Adjustments to supplier invoices</p>
        </div>
        <Button onClick={() => { setForm(EMPTY); setDialogOpen(true); }}><Plus className="mr-2 h-4 w-4" />New Note</Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search note no or supplier..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All ({notes.length})</TabsTrigger>
          <TabsTrigger value="credit">Credit Notes ({notes.filter(n => n.type === "CREDIT").length})</TabsTrigger>
          <TabsTrigger value="debit">Debit Notes ({notes.filter(n => n.type === "DEBIT").length})</TabsTrigger>
        </TabsList>
        <TabsContent value="all"><Card><CardContent className="p-0"><NoteTable data={notes} /></CardContent></Card></TabsContent>
        <TabsContent value="credit"><Card><CardContent className="p-0"><NoteTable data={notes.filter(n => n.type === "CREDIT")} /></CardContent></Card></TabsContent>
        <TabsContent value="debit"><Card><CardContent className="p-0"><NoteTable data={notes.filter(n => n.type === "DEBIT")} /></CardContent></Card></TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>New Credit / Debit Note</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={v => setForm((p: any) => ({ ...p, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="CREDIT">Credit Note</SelectItem><SelectItem value="DEBIT">Debit Note</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Supplier *</Label>
              <Select value={form.supplier} onValueChange={v => setForm((p: any) => ({ ...p, supplier: v }))}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{SUPPLIERS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Related Invoice</Label>
              <Select value={form.invoice} onValueChange={v => setForm((p: any) => ({ ...p, invoice: v }))}>
                <SelectTrigger><SelectValue placeholder="Select invoice" /></SelectTrigger>
                <SelectContent>{INVOICES.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1"><Label>Date *</Label><Input type="date" value={form.date} onChange={e => setForm((p: any) => ({ ...p, date: e.target.value }))} /></div>
              <div className="space-y-1"><Label>Amount (KES) *</Label><Input type="number" value={form.amount} onChange={e => setForm((p: any) => ({ ...p, amount: e.target.value }))} /></div>
            </div>
            <div className="space-y-1">
              <Label>Account</Label>
              <Select value={form.account} onValueChange={v => setForm((p: any) => ({ ...p, account: v }))}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{ACCOUNTS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
              </Select>
            </div>
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
