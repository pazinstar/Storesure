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

interface Disposal { id: string; no: string; date: string; asset: string; method: string; proceeds: number; nbvAtDisposal: number; gainLoss: number; period: string; status: string; }

const INITIAL: Disposal[] = [
  { id: "1", no: "DISP-2025-001", date: "15 Jan 2025", asset: "Old Typewriters (5) – FA-010", method: "WRITE_OFF", proceeds: 0, nbvAtDisposal: 0, gainLoss: 0, period: "P01 Jan-25", status: "POSTED" },
  { id: "2", no: "DISP-2024-005", date: "30 Jun 2024", asset: "Old School Minibus – FA-011", method: "SALE", proceeds: 850000, nbvAtDisposal: 450000, gainLoss: 400000, period: "P12 Jun-24", status: "POSTED" },
  { id: "3", no: "DISP-2024-003", date: "15 Mar 2024", asset: "Broken Photocopier – FA-012", method: "WRITE_OFF", proceeds: 0, nbvAtDisposal: 15000, gainLoss: -15000, period: "P09 Mar-24", status: "POSTED" },
];

const ASSETS = ["FA-010 – Old Typewriters (5)","FA-003 – School Bus (KBZ 123A)","FA-005 – Science Lab Equipment","FA-006 – Computer Lab (30 PCs)","FA-007 – Library Furniture"];
const ASSET_NBV: Record<string, number> = { "FA-010 – Old Typewriters (5)": 0, "FA-003 – School Bus (KBZ 123A)": 3150000, "FA-005 – Science Lab Equipment": 455000, "FA-006 – Computer Lab (30 PCs)": 630000, "FA-007 – Library Furniture": 238000 };
const PERIODS = ["P01 Jan-25","P02 Feb-25"];
const EMPTY = { asset: "", date: "", method: "WRITE_OFF", proceeds: "0", bosSurveyRef: "", period: "", notes: "" };

export default function Disposals() {
  const { toast } = useToast();
  const [disposals, setDisposals] = useState<Disposal[]>(INITIAL);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<any>(EMPTY);

  const filtered = disposals.filter(d =>
    (statusFilter === "ALL" || d.status === statusFilter) &&
    (d.no.toLowerCase().includes(search.toLowerCase()) || d.asset.toLowerCase().includes(search.toLowerCase()))
  );
  const { page, setPage, pageSize, setPageSize, paginatedItems, totalPages, from, to, total: totalRows } = usePagination(filtered);

  const nbvAtDisposal = ASSET_NBV[form.asset] ?? 0;
  const proceeds = Number(form.proceeds) || 0;
  const gainLoss = proceeds - nbvAtDisposal;

  const save = () => {
    if (!form.asset || !form.date || !form.period) { toast({ title: "Fill required fields", variant: "destructive" }); return; }
    const no = `DISP-2025-${String(disposals.length + 1).padStart(3, "0")}`;
    setDisposals(p => [...p, { id: Date.now().toString(), no, date: form.date, asset: form.asset, method: form.method, proceeds, nbvAtDisposal, gainLoss, period: form.period, status: "DRAFT" }]);
    toast({ title: "Disposal saved as draft" });
    setDialogOpen(false); setForm(EMPTY);
  };

  const post = (id: string) => { setDisposals(p => p.map(d => d.id === id ? { ...d, status: "POSTED" } : d)); toast({ title: "Disposal posted — asset removed from register" }); };
  const reverse = (id: string) => { setDisposals(p => p.map(d => d.id === id ? { ...d, status: "REVERSED" } : d)); toast({ title: "Disposal reversed" }); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Asset Disposals</h1>
          <p className="text-muted-foreground">Retire or sell fixed assets and record gain/loss on disposal</p>
        </div>
        <Button onClick={() => { setForm(EMPTY); setDialogOpen(true); }}><Plus className="mr-2 h-4 w-4" />New Disposal</Button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search disposal no or asset..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
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
                <TableHead>Disposal No</TableHead><TableHead>Date</TableHead><TableHead>Asset</TableHead>
                <TableHead>Method</TableHead><TableHead className="text-right">Proceeds</TableHead>
                <TableHead className="text-right">NBV at Disposal</TableHead>
                <TableHead className="text-right">Gain / (Loss)</TableHead>
                <TableHead>Period</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedItems.map(d => (
                <TableRow key={d.id}>
                  <TableCell className="font-mono font-medium">{d.no}</TableCell>
                  <TableCell>{d.date}</TableCell>
                  <TableCell className="font-medium">{d.asset}</TableCell>
                  <TableCell><Badge variant="outline">{d.method.replace("_", " ")}</Badge></TableCell>
                  <TableCell className="text-right">{d.proceeds ? fmt(d.proceeds) : "—"}</TableCell>
                  <TableCell className="text-right">{d.nbvAtDisposal ? fmt(d.nbvAtDisposal) : "—"}</TableCell>
                  <TableCell className={`text-right font-bold ${d.gainLoss > 0 ? "text-green-700" : d.gainLoss < 0 ? "text-red-600" : "text-gray-500"}`}>
                    {d.gainLoss > 0 ? `+${fmt(d.gainLoss)}` : d.gainLoss < 0 ? `(${fmt(Math.abs(d.gainLoss))})` : "—"}
                  </TableCell>
                  <TableCell className="font-mono text-sm">{d.period}</TableCell>
                  <TableCell><Badge className={STATUS_COLORS[d.status]}>{d.status}</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {d.status === "DRAFT" && <Button size="sm" className="h-7 text-xs" onClick={() => post(d.id)}><Send className="mr-1 h-3 w-3" />Post</Button>}
                      {d.status === "POSTED" && <Button size="sm" variant="outline" className="h-7 text-xs text-red-600" onClick={() => reverse(d.id)}><RotateCcw className="mr-1 h-3 w-3" />Reverse</Button>}
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
          <DialogHeader><DialogTitle>New Asset Disposal</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1">
              <Label>Asset *</Label>
              <Select value={form.asset} onValueChange={v => setForm((p: any) => ({ ...p, asset: v }))}>
                <SelectTrigger><SelectValue placeholder="Select asset" /></SelectTrigger>
                <SelectContent>{ASSETS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {form.asset && <div className="text-sm bg-muted/50 rounded p-2">NBV at disposal: <strong>{fmt(ASSET_NBV[form.asset] ?? 0)}</strong></div>}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1"><Label>Disposal Date *</Label><Input type="date" value={form.date} onChange={e => setForm((p: any) => ({ ...p, date: e.target.value }))} /></div>
              <div className="space-y-1">
                <Label>Method</Label>
                <Select value={form.method} onValueChange={v => setForm((p: any) => ({ ...p, method: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="SALE">Sale</SelectItem><SelectItem value="WRITE_OFF">Write-off</SelectItem><SelectItem value="DONATION">Donation</SelectItem><SelectItem value="EXCHANGE">Exchange</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1"><Label>Sale Proceeds (KES)</Label><Input type="number" value={form.proceeds} onChange={e => setForm((p: any) => ({ ...p, proceeds: e.target.value }))} /></div>
            {form.asset && (
              <div className="text-sm bg-muted/50 rounded p-2 space-y-1">
                <div>Gain / (Loss) on disposal: <strong className={gainLoss > 0 ? "text-green-700" : gainLoss < 0 ? "text-red-600" : ""}>{gainLoss >= 0 ? `+${fmt(gainLoss)}` : `(${fmt(Math.abs(gainLoss))})`}</strong></div>
              </div>
            )}
            <div className="space-y-1"><Label>Board of Survey Ref</Label><Input value={form.bosSurveyRef} onChange={e => setForm((p: any) => ({ ...p, bosSurveyRef: e.target.value }))} /></div>
            <div className="space-y-1">
              <Label>Period *</Label>
              <Select value={form.period} onValueChange={v => setForm((p: any) => ({ ...p, period: v }))}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{PERIODS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm((p: any) => ({ ...p, notes: e.target.value }))} rows={2} /></div>
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
