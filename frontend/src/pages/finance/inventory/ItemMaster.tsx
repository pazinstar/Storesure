import { useState } from "react";
import { Plus, Search, Pencil, AlertTriangle } from "lucide-react";
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

interface Item { id: string; code: string; name: string; category: string; unit: string; costPrice: number; qtyOnHand: number; reorderLevel: number; account: string; active: boolean; description: string; assetType: string; }

const INITIAL: Item[] = [
  { id: "1", code: "ITM001", name: "Maize Flour 10kg", category: "FOODSTUFF", unit: "Bag", costPrice: 1250, qtyOnHand: 80, reorderLevel: 20, account: "1400", active: true, description: "", assetType: "Consumable" },
  { id: "2", code: "ITM002", name: "Cooking Oil 20L", category: "FOODSTUFF", unit: "Jerrican", costPrice: 3200, qtyOnHand: 45, reorderLevel: 10, account: "1400", active: true, description: "", assetType: "Consumable" },
  { id: "3", code: "ITM003", name: "Sugar 50kg", category: "FOODSTUFF", unit: "Bag", costPrice: 4500, qtyOnHand: 30, reorderLevel: 10, account: "1400", active: true, description: "", assetType: "Consumable" },
  { id: "4", code: "ITM004", name: "Exercise Books (per box)", category: "STATIONERY", unit: "Box", costPrice: 850, qtyOnHand: 120, reorderLevel: 30, account: "1400", active: true, description: "", assetType: "Consumable" },
  { id: "5", code: "ITM005", name: "Pens (box of 50)", category: "STATIONERY", unit: "Box", costPrice: 350, qtyOnHand: 85, reorderLevel: 20, account: "1400", active: true, description: "", assetType: "Consumable" },
  { id: "6", code: "ITM006", name: "Biology Textbook", category: "TEXTBOOKS", unit: "Pcs", costPrice: 1200, qtyOnHand: 200, reorderLevel: 50, account: "1400", active: true, description: "", assetType: "Permanent" },
  { id: "7", code: "ITM007", name: "Chemistry Textbook", category: "TEXTBOOKS", unit: "Pcs", costPrice: 1200, qtyOnHand: 180, reorderLevel: 50, account: "1400", active: true, description: "", assetType: "Permanent" },
  { id: "8", code: "ITM008", name: "Cleaning Detergent 5L", category: "CHEMICALS", unit: "Carton", costPrice: 850, qtyOnHand: 60, reorderLevel: 15, account: "1400", active: true, description: "", assetType: "Consumable" },
  { id: "9", code: "ITM009", name: "Toilet Paper 48s", category: "HYGIENE", unit: "Carton", costPrice: 1800, qtyOnHand: 40, reorderLevel: 10, account: "1400", active: true, description: "", assetType: "Consumable" },
  { id: "10", code: "ITM010", name: "Motor Fuel (Diesel)", category: "FUEL", unit: "Litres", costPrice: 185, qtyOnHand: 500, reorderLevel: 100, account: "1400", active: true, description: "", assetType: "Consumable" },
  { id: "11", code: "ITM011", name: "Chalk (box)", category: "STATIONERY", unit: "Box", costPrice: 150, qtyOnHand: 200, reorderLevel: 50, account: "1400", active: true, description: "", assetType: "Consumable" },
  { id: "12", code: "ITM012", name: "Printer Paper (ream)", category: "STATIONERY", unit: "Ream", costPrice: 550, qtyOnHand: 150, reorderLevel: 40, account: "1400", active: true, description: "", assetType: "Consumable" },
];

const CATEGORIES = ["FOODSTUFF","STATIONERY","TEXTBOOKS","CHEMICALS","HYGIENE","FUEL","HARDWARE","OTHER"];
const ASSET_TYPES = ["Consumable", "Expendable", "Permanent", "Fixed Asset"];
const EMPTY = { code: "", name: "", category: "STATIONERY", unit: "Pcs", costPrice: "", qtyOnHand: "", reorderLevel: "", account: "1400", description: "", assetType: "" };

export default function ItemMaster() {
  const { toast } = useToast();
  const [items, setItems] = useState<Item[]>(INITIAL);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("ALL");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<any>(EMPTY);

  const filtered = items.filter(i =>
    (catFilter === "ALL" || i.category === catFilter) &&
    (i.name.toLowerCase().includes(search.toLowerCase()) || i.code.toLowerCase().includes(search.toLowerCase()))
  );
  const { page, setPage, pageSize, setPageSize, paginatedItems, totalPages, from, to, total: totalRows } = usePagination(filtered);

  const totalValue = items.reduce((s, i) => s + i.costPrice * i.qtyOnHand, 0);
  const lowStock = items.filter(i => i.qtyOnHand <= i.reorderLevel).length;
  const categories = new Set(items.map(i => i.category)).size;

  const openEdit = (i: Item) => {
    setForm({ code: i.code, name: i.name, category: i.category, unit: i.unit, costPrice: String(i.costPrice), qtyOnHand: String(i.qtyOnHand), reorderLevel: String(i.reorderLevel), account: i.account, description: i.description, assetType: i.assetType });
    setEditId(i.id); setDialogOpen(true);
  };

  const save = () => {
    if (!form.code || !form.name || !form.costPrice) { toast({ title: "Required fields missing", variant: "destructive" }); return; }
    if (editId) {
      setItems(prev => prev.map(i => i.id === editId ? { ...i, ...form, costPrice: Number(form.costPrice), qtyOnHand: Number(form.qtyOnHand), reorderLevel: Number(form.reorderLevel) } : i));
      toast({ title: "Item updated" });
    } else {
      setItems(prev => [...prev, { ...form, id: Date.now().toString(), costPrice: Number(form.costPrice), qtyOnHand: Number(form.qtyOnHand), reorderLevel: Number(form.reorderLevel), active: true }]);
      toast({ title: "Item created" });
    }
    setDialogOpen(false);
  };

  const toggleActive = (id: string) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, active: !i.active } : i));
    toast({ title: "Item status updated" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Item Master</h1>
          <p className="text-muted-foreground">Catalogue of inventory items with financial valuation</p>
        </div>
        <Button onClick={() => { setForm(EMPTY); setEditId(null); setDialogOpen(true); }}><Plus className="mr-2 h-4 w-4" />New Item</Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card><CardContent className="pt-4"><div className="text-2xl font-bold">{items.length}</div><div className="text-sm text-muted-foreground">Total Items</div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="text-xl font-bold">{fmt(totalValue)}</div><div className="text-sm text-muted-foreground">Total Stock Value</div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="text-2xl font-bold text-amber-600">{lowStock}</div><div className="text-sm text-muted-foreground">Below Reorder Level</div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="text-2xl font-bold">{categories}</div><div className="text-sm text-muted-foreground">Categories</div></CardContent></Card>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search item code or name..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
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
                <TableHead>Code</TableHead><TableHead>Item Name</TableHead><TableHead>Category</TableHead>
                <TableHead>Asset Type</TableHead><TableHead>Unit</TableHead><TableHead className="text-right">Cost Price</TableHead>
                <TableHead className="text-right">Qty on Hand</TableHead><TableHead className="text-right">Reorder</TableHead>
                <TableHead className="text-right">Total Value</TableHead><TableHead>Status</TableHead>
                <TableHead className="w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedItems.map(item => {
                const lowStock = item.qtyOnHand <= item.reorderLevel;
                return (
                  <TableRow key={item.id} className={!item.active ? "opacity-50" : ""}>
                    <TableCell className="font-mono font-medium">{item.code}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {item.name}
                        {lowStock && <Badge className="bg-amber-100 text-amber-800 flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Low</Badge>}
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="outline">{item.category}</Badge></TableCell>
                    <TableCell className="text-sm">{item.assetType}</TableCell>
                    <TableCell className="text-sm">{item.unit}</TableCell>
                    <TableCell className="text-right">{fmt(item.costPrice)}</TableCell>
                    <TableCell className={`text-right font-medium ${lowStock ? "text-amber-600" : ""}`}>{item.qtyOnHand.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{item.reorderLevel}</TableCell>
                    <TableCell className="text-right font-medium">{fmt(item.costPrice * item.qtyOnHand)}</TableCell>
                    <TableCell><Badge className={item.active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"}>{item.active ? "Active" : "Inactive"}</Badge></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(item)}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button size="sm" variant="ghost" className="h-7 text-xs px-2" onClick={() => toggleActive(item.id)}>{item.active ? "Disable" : "Enable"}</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <TablePagination page={page} totalPages={totalPages} from={from} to={to} total={totalRows} onPageChange={setPage} />
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editId ? "Edit Item" : "New Item"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-1"><Label>Item Code *</Label><Input value={form.code} onChange={e => setForm((p: any) => ({ ...p, code: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Item Name *</Label><Input value={form.name} onChange={e => setForm((p: any) => ({ ...p, name: e.target.value }))} /></div>
            <div className="space-y-1">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={v => setForm((p: any) => ({ ...p, category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Asset Type *</Label>
              <Select value={form.assetType} onValueChange={v => setForm((p: any) => ({ ...p, assetType: v }))}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {ASSET_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>Unit of Measure</Label><Input value={form.unit} onChange={e => setForm((p: any) => ({ ...p, unit: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Cost Price (KES) *</Label><Input type="number" value={form.costPrice} onChange={e => setForm((p: any) => ({ ...p, costPrice: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Opening Qty</Label><Input type="number" value={form.qtyOnHand} onChange={e => setForm((p: any) => ({ ...p, qtyOnHand: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Reorder Level</Label><Input type="number" value={form.reorderLevel} onChange={e => setForm((p: any) => ({ ...p, reorderLevel: e.target.value }))} /></div>
            <div className="col-span-2 space-y-1"><Label>Description</Label><Textarea value={form.description} onChange={e => setForm((p: any) => ({ ...p, description: e.target.value }))} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={save}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
