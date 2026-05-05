import { useState, useEffect, useMemo } from "react";
import { Plus, Search, Pencil, Trash2, Info, Eye, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/ui/table-pagination";
import { useAuth } from "@/contexts/AuthContext";
import { SCHOOL_CATEGORIES } from "@/contexts/ClientSetupContext";
import { studentsService } from "@/services/students.service";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(n);

// ─── FDSE Reference (read-only table at bottom) ────────────────────────────

type SchoolCategory = "day" | "boarding_a" | "boarding_b" | "special_needs";

interface FDSEVoteHead {
  name: string;
  gokAmounts: Record<SchoolCategory, number>;
}

const FDSE_VOTE_HEADS: FDSEVoteHead[] = [
  { name: "Tuition (TLM & Exams)", gokAmounts: { day: 12870, boarding_a: 12870, boarding_b: 12870, special_needs: 12870 } },
  { name: "SMASSE/CEMASTEA", gokAmounts: { day: 150, boarding_a: 150, boarding_b: 150, special_needs: 150 } },
  { name: "Repair, Maintenance & Improvement", gokAmounts: { day: 3474, boarding_a: 3474, boarding_b: 3474, special_needs: 3474 } },
  { name: "Local Travel & Transport", gokAmounts: { day: 400, boarding_a: 400, boarding_b: 400, special_needs: 400 } },
  { name: "Administrative Costs", gokAmounts: { day: 500, boarding_a: 500, boarding_b: 500, special_needs: 500 } },
  { name: "Electricity, Water & Conservancy", gokAmounts: { day: 3000, boarding_a: 3000, boarding_b: 3000, special_needs: 3000 } },
  { name: "Activity Fees", gokAmounts: { day: 600, boarding_a: 600, boarding_b: 600, special_needs: 600 } },
  { name: "Personal Emoluments", gokAmounts: { day: 1250, boarding_a: 1250, boarding_b: 1250, special_needs: 1250 } },
  { name: "Medical & Insurance", gokAmounts: { day: 0, boarding_a: 0, boarding_b: 0, special_needs: 0 } },
  { name: "Boarding Equipment & Stores", gokAmounts: { day: 0, boarding_a: 20000, boarding_b: 15000, special_needs: 25000 } },
  { name: "Top-Up (Special Needs)", gokAmounts: { day: 0, boarding_a: 0, boarding_b: 0, special_needs: 2730 } },
];

// ─── Types ──────────────────────────────────────────────────────────────────

interface FeeStructureItem {
  id?: number;
  vote_head: string;
  gok_amount: number;
  parent_amount: number;
  annual_amount: number;
  funding_type: string;
}

interface FeeStructure {
  id: string;
  name: string;
  effective_from: string;
  effective_to: string;
  student_category: string;
  term1_pct: number;
  term2_pct: number;
  term3_pct: number;
  is_active: boolean;
  approved_by: string;
  approval_ref: string;
  allow_update: boolean;
  notes: string;
  items?: FeeStructureItem[];
  annual_total: number;
  item_count?: number;
  created_at: string;
}

const EMPTY_FORM = {
  name: "",
  effective_from: "",
  effective_to: "",
  student_category: "boarder",
  term1_pct: "50",
  term2_pct: "30",
  term3_pct: "20",
  approved_by: "",
  approval_ref: "",
  notes: "",
  items: [] as { vote_head: string; gok_amount: string; parent_amount: string }[],
};

// ─── Component ──────────────────────────────────────────────────────────────

export default function FeeStructures() {
  const { toast } = useToast();
  const { user } = useAuth();
  const schoolCategory = (user?.school?.category as SchoolCategory) || "day";
  const categoryLabel = SCHOOL_CATEGORIES.find(c => c.value === schoolCategory)?.label || "Day School";

  const [structures, setStructures] = useState<FeeStructure[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("ALL");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<typeof EMPTY_FORM>(EMPTY_FORM);
  const [detail, setDetail] = useState<FeeStructure | null>(null);
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await studentsService.getFeeStructures();
      setStructures(data);
    } catch (e: any) {
      toast({ title: "Failed to load fee structures", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const filtered = structures.filter(fs =>
    (catFilter === "ALL" || fs.student_category === catFilter) &&
    (fs.name.toLowerCase().includes(search.toLowerCase()) || fs.id.toLowerCase().includes(search.toLowerCase()))
  );

  const { page, setPage, paginatedItems, totalPages, from, to, total: totalRows } = usePagination(filtered);

  const openNew = () => {
    setForm({
      ...EMPTY_FORM,
      items: FDSE_VOTE_HEADS
        .filter(vh => vh.gokAmounts[schoolCategory] > 0)
        .map(vh => ({
          vote_head: vh.name,
          gok_amount: String(vh.gokAmounts[schoolCategory]),
          parent_amount: "0",
        })),
    });
    setEditId(null);
    setDialogOpen(true);
  };

  const openEdit = async (fs: FeeStructure) => {
    try {
      const full = await studentsService.getFeeStructure(fs.id);
      setForm({
        name: full.name,
        effective_from: full.effective_from,
        effective_to: full.effective_to,
        student_category: full.student_category,
        term1_pct: String(full.term1_pct),
        term2_pct: String(full.term2_pct),
        term3_pct: String(full.term3_pct),
        approved_by: full.approved_by,
        approval_ref: full.approval_ref,
        notes: full.notes,
        items: (full.items || []).map((it: FeeStructureItem) => ({
          vote_head: it.vote_head,
          gok_amount: String(it.gok_amount),
          parent_amount: String(it.parent_amount),
        })),
      });
      setEditId(fs.id);
      setDialogOpen(true);
    } catch (e: any) {
      toast({ title: "Failed to load fee structure", description: e.message, variant: "destructive" });
    }
  };

  const openDetail = async (fs: FeeStructure) => {
    try {
      const full = await studentsService.getFeeStructure(fs.id);
      setDetail(full);
      setDetailOpen(true);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const save = async () => {
    if (!form.name || !form.effective_from || !form.effective_to) {
      toast({ title: "Required fields missing", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        effective_from: form.effective_from,
        effective_to: form.effective_to,
        student_category: form.student_category,
        term1_pct: Number(form.term1_pct),
        term2_pct: Number(form.term2_pct),
        term3_pct: Number(form.term3_pct),
        approved_by: form.approved_by,
        approval_ref: form.approval_ref,
        notes: form.notes,
        items: form.items.map(it => ({
          vote_head: it.vote_head,
          gok_amount: it.gok_amount,
          parent_amount: it.parent_amount,
        })),
      };
      if (editId) {
        await studentsService.updateFeeStructure(editId, payload);
        toast({ title: "Fee structure updated" });
      } else {
        await studentsService.createFeeStructure(payload);
        toast({ title: "Fee structure created" });
      }
      setDialogOpen(false);
      loadData();
    } catch (e: any) {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    try {
      await studentsService.deleteFeeStructure(id);
      toast({ title: "Fee structure deleted" });
      loadData();
    } catch (e: any) {
      toast({ title: "Delete failed", description: e.message, variant: "destructive" });
    }
  };

  const addItem = () => {
    setForm(p => ({ ...p, items: [...p.items, { vote_head: "", gok_amount: "0", parent_amount: "0" }] }));
  };

  const removeItem = (idx: number) => {
    setForm(p => ({ ...p, items: p.items.filter((_, i) => i !== idx) }));
  };

  const updateItem = (idx: number, field: string, val: string) => {
    setForm(p => ({
      ...p,
      items: p.items.map((it, i) => i === idx ? { ...it, [field]: val } : it),
    }));
  };

  const formTotal = form.items.reduce((s, it) => s + Number(it.gok_amount || 0) + Number(it.parent_amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Fee Structures</h1>
          <p className="text-muted-foreground">FDSE-aligned fee structures — GOK capitation and parent contributions</p>
        </div>
        <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" />New Fee Structure</Button>
      </div>

      {/* School Category Banner */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Info className="h-5 w-5 text-primary shrink-0" title="Fee structures are pre-populated based on FDSE guidelines for your school category." />
              <div>
                <div className="text-sm text-muted-foreground">School Category (FDSE)</div>
                <div className="font-semibold text-lg">{categoryLabel}</div>
              </div>
            </div>
            <Badge variant="outline" className="text-sm">{user?.school?.name || "Current School"}</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="pt-4"><div className="text-2xl font-bold">{structures.length}</div><div className="text-sm text-muted-foreground">Fee Structures</div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="text-2xl font-bold text-green-700">{structures.filter(s => s.is_active).length}</div><div className="text-sm text-muted-foreground">Active</div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="text-2xl font-bold text-muted-foreground">{structures.filter(s => !s.is_active).length}</div><div className="text-sm text-muted-foreground">Inactive</div></CardContent></Card>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name or ID..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="All Categories" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Categories</SelectItem>
            <SelectItem value="boarder">Boarder</SelectItem>
            <SelectItem value="day_scholar">Day Scholar</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Term Split</TableHead>
                  <TableHead className="text-right">Annual Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-28">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedItems.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="py-8 text-center text-muted-foreground">No fee structures found. Click "New Fee Structure" to create one.</TableCell></TableRow>
                ) : null}
                {paginatedItems.map(fs => (
                  <TableRow key={fs.id}>
                    <TableCell className="font-mono text-sm">{fs.id}</TableCell>
                    <TableCell className="font-medium">{fs.name}</TableCell>
                    <TableCell><Badge variant="outline">{fs.student_category === 'boarder' ? 'Boarder' : 'Day Scholar'}</Badge></TableCell>
                    <TableCell className="text-sm">{fs.effective_from} — {fs.effective_to}</TableCell>
                    <TableCell className="text-sm">{fs.term1_pct}/{fs.term2_pct}/{fs.term3_pct}</TableCell>
                    <TableCell className="text-right font-bold">{fmt(Number(fs.annual_total))}</TableCell>
                    <TableCell>
                      <Badge className={fs.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"}>
                        {fs.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openDetail(fs)} title="View"><Eye className="h-3.5 w-3.5" /></Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(fs)} title="Edit"><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500" onClick={() => remove(fs.id)} title="Delete"><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <TablePagination page={page} totalPages={totalPages} from={from} to={to} total={totalRows} onPageChange={setPage} />
        </CardContent>
      </Card>

      {/* FDSE Reference Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">FDSE GOK Capitation Reference</CardTitle>
          <CardDescription>Standard GOK capitation amounts per student per year by school category</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vote Head</TableHead>
                <TableHead className="text-right">Day School</TableHead>
                <TableHead className="text-right">Boarding A*</TableHead>
                <TableHead className="text-right">Boarding B*</TableHead>
                <TableHead className="text-right">Special Needs</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {FDSE_VOTE_HEADS.map(vh => (
                <TableRow key={vh.name}>
                  <TableCell className="font-medium">{vh.name}</TableCell>
                  <TableCell className="text-right">{vh.gokAmounts.day > 0 ? fmt(vh.gokAmounts.day) : "—"}</TableCell>
                  <TableCell className="text-right">{vh.gokAmounts.boarding_a > 0 ? fmt(vh.gokAmounts.boarding_a) : "—"}</TableCell>
                  <TableCell className="text-right">{vh.gokAmounts.boarding_b > 0 ? fmt(vh.gokAmounts.boarding_b) : "—"}</TableCell>
                  <TableCell className="text-right">{vh.gokAmounts.special_needs > 0 ? fmt(vh.gokAmounts.special_needs) : "—"}</TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted/50 font-semibold">
                <TableCell>Total GOK Capitation</TableCell>
                <TableCell className="text-right">{fmt(FDSE_VOTE_HEADS.reduce((s, v) => s + v.gokAmounts.day, 0))}</TableCell>
                <TableCell className="text-right">{fmt(FDSE_VOTE_HEADS.reduce((s, v) => s + v.gokAmounts.boarding_a, 0))}</TableCell>
                <TableCell className="text-right">{fmt(FDSE_VOTE_HEADS.reduce((s, v) => s + v.gokAmounts.boarding_b, 0))}</TableCell>
                <TableCell className="text-right">{fmt(FDSE_VOTE_HEADS.reduce((s, v) => s + v.gokAmounts.special_needs, 0))}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Fee Structure — {detail?.name}</DialogTitle></DialogHeader>
          {detail && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div><span className="text-muted-foreground">ID:</span> {detail.id}</div>
                <div><span className="text-muted-foreground">Category:</span> {detail.student_category === 'boarder' ? 'Boarder' : 'Day Scholar'}</div>
                <div><span className="text-muted-foreground">Status:</span> <Badge className={detail.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"}>{detail.is_active ? "Active" : "Inactive"}</Badge></div>
                <div><span className="text-muted-foreground">Effective:</span> {detail.effective_from} — {detail.effective_to}</div>
                <div><span className="text-muted-foreground">Term Split:</span> {detail.term1_pct}% / {detail.term2_pct}% / {detail.term3_pct}%</div>
                <div><span className="text-muted-foreground">Annual Total:</span> <span className="font-bold">{fmt(Number(detail.annual_total))}</span></div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vote Head</TableHead>
                    <TableHead className="text-right">GOK Amount</TableHead>
                    <TableHead className="text-right">Parent Amount</TableHead>
                    <TableHead className="text-right">Annual Amount</TableHead>
                    <TableHead>Funding</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(detail.items || []).map((it, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{it.vote_head}</TableCell>
                      <TableCell className="text-right text-green-700">{fmt(Number(it.gok_amount))}</TableCell>
                      <TableCell className="text-right text-blue-700">{fmt(Number(it.parent_amount))}</TableCell>
                      <TableCell className="text-right font-bold">{fmt(Number(it.annual_amount))}</TableCell>
                      <TableCell><Badge variant="outline">{it.funding_type}</Badge></TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/50 font-semibold">
                    <TableCell>Totals</TableCell>
                    <TableCell className="text-right text-green-700">{fmt((detail.items || []).reduce((s, it) => s + Number(it.gok_amount), 0))}</TableCell>
                    <TableCell className="text-right text-blue-700">{fmt((detail.items || []).reduce((s, it) => s + Number(it.parent_amount), 0))}</TableCell>
                    <TableCell className="text-right">{fmt(Number(detail.annual_total))}</TableCell>
                    <TableCell />
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editId ? "Edit Fee Structure" : "New Fee Structure"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label>Name *</Label>
                <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. FS-2025-Boarder" />
              </div>
              <div className="space-y-1">
                <Label>Effective From *</Label>
                <Input type="date" value={form.effective_from} onChange={e => setForm(p => ({ ...p, effective_from: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Effective To *</Label>
                <Input type="date" value={form.effective_to} onChange={e => setForm(p => ({ ...p, effective_to: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Student Category</Label>
                <Select value={form.student_category} onValueChange={v => setForm(p => ({ ...p, student_category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="boarder">Boarder</SelectItem>
                    <SelectItem value="day_scholar">Day Scholar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>T1 / T2 / T3 %</Label>
                <div className="flex gap-1">
                  <Input className="w-16" value={form.term1_pct} onChange={e => setForm(p => ({ ...p, term1_pct: e.target.value }))} />
                  <Input className="w-16" value={form.term2_pct} onChange={e => setForm(p => ({ ...p, term2_pct: e.target.value }))} />
                  <Input className="w-16" value={form.term3_pct} onChange={e => setForm(p => ({ ...p, term3_pct: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Approved By</Label>
                <Input value={form.approved_by} onChange={e => setForm(p => ({ ...p, approved_by: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2} />
            </div>

            {/* Vote Head Items */}
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Vote Head Items</Label>
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">Annual Total: <strong>{fmt(formTotal)}</strong></span>
                <Button size="sm" variant="outline" onClick={addItem}><Plus className="mr-1 h-3 w-3" />Add Item</Button>
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40%]">Vote Head</TableHead>
                  <TableHead className="text-right">GOK Amount</TableHead>
                  <TableHead className="text-right">Parent Amount</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {form.items.map((it, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <Input value={it.vote_head} onChange={e => updateItem(idx, "vote_head", e.target.value)} placeholder="Vote head name" />
                    </TableCell>
                    <TableCell>
                      <Input type="number" className="text-right" value={it.gok_amount} onChange={e => updateItem(idx, "gok_amount", e.target.value)} />
                    </TableCell>
                    <TableCell>
                      <Input type="number" className="text-right" value={it.parent_amount} onChange={e => updateItem(idx, "parent_amount", e.target.value)} />
                    </TableCell>
                    <TableCell className="text-right font-medium">{fmt(Number(it.gok_amount || 0) + Number(it.parent_amount || 0))}</TableCell>
                    <TableCell>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500" onClick={() => removeItem(idx)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editId ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
