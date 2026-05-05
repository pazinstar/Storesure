import { useState } from "react";
import { Plus, Search, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/ui/table-pagination";

const fmt = (n: number) => new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(n);

interface Asset { id: string; no: string; name: string; category: string; acquisitionDate: string; cost: number; accumDepr: number; rate: string; location: string; status: "ACTIVE" | "DISPOSED" | "FULLY DEPR"; }

const INITIAL: Asset[] = [
  { id: "1", no: "FA-001", name: "Main School Building", category: "BUILDING", acquisitionDate: "01 Jul 2010", cost: 8500000, accumDepr: 2125000, rate: "2.5%", location: "Main Campus", status: "ACTIVE" },
  { id: "2", no: "FA-002", name: "Administration Block", category: "BUILDING", acquisitionDate: "15 Mar 2015", cost: 3200000, accumDepr: 480000, rate: "2.5%", location: "Main Campus", status: "ACTIVE" },
  { id: "3", no: "FA-003", name: "School Bus (KBZ 123A)", category: "VEHICLE", acquisitionDate: "10 Jun 2018", cost: 4500000, accumDepr: 1350000, rate: "25%", location: "Transport", status: "ACTIVE" },
  { id: "4", no: "FA-004", name: "School Bus (KBZ 456B)", category: "VEHICLE", acquisitionDate: "20 Aug 2019", cost: 4800000, accumDepr: 1200000, rate: "25%", location: "Transport", status: "ACTIVE" },
  { id: "5", no: "FA-005", name: "Science Lab Equipment", category: "LAB EQUIP", acquisitionDate: "01 Jan 2020", cost: 650000, accumDepr: 195000, rate: "20%", location: "Science Lab", status: "ACTIVE" },
  { id: "6", no: "FA-006", name: "Computer Lab (30 PCs)", category: "COMPUTERS", acquisitionDate: "15 Apr 2021", cost: 900000, accumDepr: 270000, rate: "33%", location: "ICT Lab", status: "ACTIVE" },
  { id: "7", no: "FA-007", name: "Library Furniture", category: "FURNITURE", acquisitionDate: "01 Jul 2022", cost: 280000, accumDepr: 42000, rate: "10%", location: "Library", status: "ACTIVE" },
  { id: "8", no: "FA-008", name: "Kitchen Equipment", category: "EQUIPMENT", acquisitionDate: "01 Jan 2023", cost: 350000, accumDepr: 52500, rate: "15%", location: "Kitchen", status: "ACTIVE" },
  { id: "9", no: "FA-009", name: "Generator (100KVA)", category: "EQUIPMENT", acquisitionDate: "01 Mar 2023", cost: 420000, accumDepr: 63000, rate: "15%", location: "Power Room", status: "ACTIVE" },
  { id: "10", no: "FA-010", name: "Old Typewriters (5)", category: "OFFICE EQ", acquisitionDate: "01 Jul 2005", cost: 25000, accumDepr: 25000, rate: "20%", location: "Stores", status: "FULLY DEPR" },
];

const CATEGORIES = ["BUILDING","VEHICLE","LAB EQUIP","COMPUTERS","FURNITURE","EQUIPMENT","OFFICE EQ"];
const EMPTY = { no: "", name: "", category: "EQUIPMENT", acquisitionDate: "", cost: "", usefulLife: "", rate: "", method: "STRAIGHT_LINE", location: "", supplier: "", invoiceRef: "" };

export default function AssetRegister() {
  const { toast } = useToast();
  const [assets, setAssets] = useState<Asset[]>(INITIAL);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("ALL");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [form, setForm] = useState<any>(EMPTY);

  const filtered = assets.filter(a =>
    (catFilter === "ALL" || a.category === catFilter) &&
    (a.name.toLowerCase().includes(search.toLowerCase()) || a.no.toLowerCase().includes(search.toLowerCase()))
  );
  const { page, setPage, pageSize, setPageSize, paginatedItems, totalPages, from, to, total: totalRows } = usePagination(filtered);

  const totalCost = assets.reduce((s, a) => s + a.cost, 0);
  const totalAccumDepr = assets.reduce((s, a) => s + a.accumDepr, 0);
  const totalNBV = totalCost - totalAccumDepr;

  const toggle = (id: string) => setExpanded(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const save = () => {
    if (!form.name || !form.acquisitionDate || !form.cost) { toast({ title: "Fill required fields", variant: "destructive" }); return; }
    setAssets(prev => [...prev, { id: Date.now().toString(), no: form.no || `FA-${String(prev.length + 1).padStart(3, "0")}`, name: form.name, category: form.category, acquisitionDate: form.acquisitionDate, cost: Number(form.cost), accumDepr: 0, rate: `${form.rate}%`, location: form.location, status: "ACTIVE" }]);
    toast({ title: "Asset added to register" });
    setDialogOpen(false); setForm(EMPTY);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Asset Register</h1>
          <p className="text-muted-foreground">Complete register of Property, Plant & Equipment (PPE)</p>
        </div>
        <Button onClick={() => { setForm(EMPTY); setDialogOpen(true); }}><Plus className="mr-2 h-4 w-4" />New Asset</Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card><CardContent className="pt-4"><div className="text-xl font-bold">{fmt(totalCost)}</div><div className="text-sm text-muted-foreground">Total Cost</div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="text-xl font-bold text-amber-600">{fmt(totalAccumDepr)}</div><div className="text-sm text-muted-foreground">Accum. Depreciation</div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="text-xl font-bold text-green-700">{fmt(totalNBV)}</div><div className="text-sm text-muted-foreground">Net Book Value (NBV)</div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="text-2xl font-bold">{assets.filter(a => a.status === "ACTIVE").length}</div><div className="text-sm text-muted-foreground">Active Assets</div></CardContent></Card>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search asset number or name..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="w-44"><SelectValue placeholder="All Categories" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Categories</SelectItem>
            {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8"></TableHead>
                <TableHead>Asset No</TableHead><TableHead>Name</TableHead><TableHead>Category</TableHead>
                <TableHead>Acquired</TableHead><TableHead className="text-right">Cost</TableHead>
                <TableHead className="text-right">Accum. Depr.</TableHead><TableHead className="text-right">NBV</TableHead>
                <TableHead>Rate</TableHead><TableHead>Location</TableHead><TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedItems.map(a => {
                const nbv = a.cost - a.accumDepr;
                return (
                  <>
                    <TableRow key={a.id} className="cursor-pointer hover:bg-muted/50" onClick={() => toggle(a.id)}>
                      <TableCell>{expanded.has(a.id) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}</TableCell>
                      <TableCell className="font-mono font-medium">{a.no}</TableCell>
                      <TableCell className="font-medium">{a.name}</TableCell>
                      <TableCell><Badge variant="outline">{a.category}</Badge></TableCell>
                      <TableCell className="text-sm">{a.acquisitionDate}</TableCell>
                      <TableCell className="text-right">{fmt(a.cost)}</TableCell>
                      <TableCell className="text-right text-amber-600">{fmt(a.accumDepr)}</TableCell>
                      <TableCell className={`text-right font-bold ${nbv === 0 ? "text-red-500" : "text-green-700"}`}>{fmt(nbv)}</TableCell>
                      <TableCell className="text-sm">{a.rate}</TableCell>
                      <TableCell className="text-sm">{a.location}</TableCell>
                      <TableCell>
                        <Badge className={a.status === "ACTIVE" ? "bg-green-100 text-green-800" : a.status === "FULLY DEPR" ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"}>
                          {a.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                    {expanded.has(a.id) && (
                      <TableRow key={`${a.id}-detail`}>
                        <TableCell colSpan={11} className="bg-muted/20 px-8 py-3 text-sm">
                          <div className="grid grid-cols-3 gap-4">
                            <div><span className="text-muted-foreground">Asset No:</span> {a.no}</div>
                            <div><span className="text-muted-foreground">Category:</span> {a.category}</div>
                            <div><span className="text-muted-foreground">Location:</span> {a.location}</div>
                            <div><span className="text-muted-foreground">Acquisition Date:</span> {a.acquisitionDate}</div>
                            <div><span className="text-muted-foreground">Cost:</span> {fmt(a.cost)}</div>
                            <div><span className="text-muted-foreground">Depreciation Rate:</span> {a.rate} p.a.</div>
                            <div><span className="text-muted-foreground">Accum. Depr. to date:</span> {fmt(a.accumDepr)}</div>
                            <div><span className="text-muted-foreground">Current NBV:</span> <strong>{fmt(a.cost - a.accumDepr)}</strong></div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                );
              })}
            </TableBody>
          </Table>
          <TablePagination page={page} totalPages={totalPages} from={from} to={to} total={totalRows} onPageChange={setPage} />
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>New Fixed Asset</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-1"><Label>Asset No</Label><Input value={form.no} onChange={e => setForm((p: any) => ({ ...p, no: e.target.value }))} placeholder="Auto-assigned if blank" /></div>
            <div className="space-y-1"><Label>Asset Name *</Label><Input value={form.name} onChange={e => setForm((p: any) => ({ ...p, name: e.target.value }))} /></div>
            <div className="space-y-1">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={v => setForm((p: any) => ({ ...p, category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>Acquisition Date *</Label><Input type="date" value={form.acquisitionDate} onChange={e => setForm((p: any) => ({ ...p, acquisitionDate: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Cost (KES) *</Label><Input type="number" value={form.cost} onChange={e => setForm((p: any) => ({ ...p, cost: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Useful Life (years)</Label><Input type="number" value={form.usefulLife} onChange={e => setForm((p: any) => ({ ...p, usefulLife: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Depreciation Rate (%)</Label><Input type="number" value={form.rate} onChange={e => setForm((p: any) => ({ ...p, rate: e.target.value }))} /></div>
            <div className="space-y-1">
              <Label>Method</Label>
              <Select value={form.method} onValueChange={v => setForm((p: any) => ({ ...p, method: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="STRAIGHT_LINE">Straight Line</SelectItem><SelectItem value="REDUCING_BALANCE">Reducing Balance</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>Location</Label><Input value={form.location} onChange={e => setForm((p: any) => ({ ...p, location: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Supplier</Label><Input value={form.supplier} onChange={e => setForm((p: any) => ({ ...p, supplier: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Invoice / LPO Ref</Label><Input value={form.invoiceRef} onChange={e => setForm((p: any) => ({ ...p, invoiceRef: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={save}>Add Asset</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
