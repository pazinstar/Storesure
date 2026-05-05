import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/ui/table-pagination";

const fmt = (n: number) => new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(n);

interface BudgetLine {
  id: string;
  head: string;
  account: string;
  accountName: string;
  year: string;
  period: string;
  approved: number;
  actual: number;
  committed: number;
}

const INITIAL: BudgetLine[] = [
  { id: "1", head: "Staff Salaries", account: "5100", accountName: "Staff Salaries", year: "FY 2024/25", period: "Full Year", approved: 4200000, actual: 2800000, committed: 350000 },
  { id: "2", head: "Teaching Materials", account: "5200", accountName: "Teaching Materials", year: "FY 2024/25", period: "Full Year", approved: 480000, actual: 210000, committed: 45000 },
  { id: "3", head: "Utilities", account: "5300", accountName: "Utilities", year: "FY 2024/25", period: "Full Year", approved: 120000, actual: 67500, committed: 0 },
  { id: "4", head: "Repairs & Maintenance", account: "5400", accountName: "Repairs & Maintenance", year: "FY 2024/25", period: "Full Year", approved: 200000, actual: 89000, committed: 30000 },
  { id: "5", head: "School Fees Income (Budget)", account: "4100", accountName: "School Fees Income", year: "FY 2024/25", period: "Full Year", approved: 6000000, actual: 4200000, committed: 0 },
  { id: "6", head: "Government Grants (Budget)", account: "4200", accountName: "Government Grants", year: "FY 2024/25", period: "Full Year", approved: 1500000, actual: 750000, committed: 0 },
  { id: "7", head: "PPE Additions", account: "6200", accountName: "Furniture & Equipment", year: "FY 2024/25", period: "Full Year", approved: 500000, actual: 495000, committed: 0 },
  { id: "8", head: "Other Expenses", account: "5500", accountName: "Depreciation", year: "FY 2024/25", period: "Full Year", approved: 1200000, actual: 997500, committed: 0 },
];

const ACCOUNTS = [
  "5100 – Staff Salaries", "5200 – Teaching Materials", "5300 – Utilities",
  "5400 – Repairs & Maintenance", "4100 – School Fees Income", "4200 – Government Grants",
  "6200 – Furniture & Equipment", "5500 – Depreciation",
];

const EMPTY_FORM = { head: "", account: "", year: "FY 2024/25", period: "Full Year", approved: "", notes: "" };

export default function BudgetMaster() {
  const { toast } = useToast();
  const [lines, setLines] = useState<BudgetLine[]>(INITIAL);
  const [yearFilter, setYearFilter] = useState("FY 2024/25");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const filtered = lines.filter(l =>
    (yearFilter === "ALL" || l.year === yearFilter) &&
    (l.head.toLowerCase().includes(search.toLowerCase()) || l.account.includes(search))
  );
  const { page, setPage, pageSize, setPageSize, paginatedItems, totalPages, from, to, total: totalRows } = usePagination(filtered);

  const totalBudget = filtered.reduce((s, l) => s + l.approved, 0);
  const totalSpent = filtered.reduce((s, l) => s + l.actual, 0);
  const totalCommitted = filtered.reduce((s, l) => s + l.committed, 0);
  const available = totalBudget - totalSpent - totalCommitted;
  const utilization = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

  const utilizationColor = (pct: number) => pct > 90 ? "text-red-600" : pct > 70 ? "text-amber-600" : "text-green-600";

  const openEdit = (l: BudgetLine) => {
    setForm({ head: l.head, account: l.account, year: l.year, period: l.period, approved: String(l.approved), notes: "" });
    setEditId(l.id);
    setDialogOpen(true);
  };

  const save = () => {
    if (!form.head || !form.account || !form.approved) { toast({ title: "All required fields must be filled", variant: "destructive" }); return; }
    const [code, ...rest] = form.account.split(" – ");
    if (editId) {
      setLines(prev => prev.map(l => l.id === editId ? { ...l, head: form.head, account: code.trim(), accountName: rest.join(" – "), year: form.year, period: form.period, approved: Number(form.approved) } : l));
      toast({ title: "Budget line updated" });
    } else {
      setLines(prev => [...prev, { id: Date.now().toString(), head: form.head, account: code.trim(), accountName: rest.join(" – "), year: form.year, period: form.period, approved: Number(form.approved), actual: 0, committed: 0 }]);
      toast({ title: "Budget line created" });
    }
    setDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Budget Master</h1>
          <p className="text-muted-foreground">Allocate and monitor budgets per account per financial year</p>
        </div>
        <Button onClick={() => { setForm(EMPTY_FORM); setEditId(null); setDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />New Budget Line
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card><CardContent className="pt-4"><div className="text-xl font-bold">{fmt(totalBudget)}</div><div className="text-sm text-muted-foreground">Total Approved Budget</div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="text-xl font-bold">{fmt(totalSpent)}</div><div className="text-sm text-muted-foreground">Total Actual Spent</div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="text-xl font-bold text-green-700">{fmt(available)}</div><div className="text-sm text-muted-foreground">Available Balance</div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className={`text-xl font-bold ${utilizationColor(utilization)}`}>{utilization}%</div><div className="text-sm text-muted-foreground">Overall Utilization</div><Progress value={utilization} className="mt-2 h-1.5" /></CardContent></Card>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search budget head or account..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={yearFilter} onValueChange={setYearFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Years</SelectItem>
            <SelectItem value="FY 2024/25">FY 2024/25</SelectItem>
            <SelectItem value="FY 2023/24">FY 2023/24</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Budget Head</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Year</TableHead>
                <TableHead className="text-right">Approved</TableHead>
                <TableHead className="text-right">Actual Spent</TableHead>
                <TableHead className="text-right">Committed</TableHead>
                <TableHead className="text-right">Available</TableHead>
                <TableHead>Utilization</TableHead>
                <TableHead className="w-16">Edit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedItems.map(l => {
                const used = l.actual + l.committed;
                const avail = l.approved - used;
                const pct = l.approved > 0 ? Math.round((l.actual / l.approved) * 100) : 0;
                return (
                  <TableRow key={l.id}>
                    <TableCell className="font-medium">{l.head}</TableCell>
                    <TableCell className="font-mono text-sm">{l.account} – {l.accountName}</TableCell>
                    <TableCell><Badge variant="outline">{l.year}</Badge></TableCell>
                    <TableCell className="text-right">{fmt(l.approved)}</TableCell>
                    <TableCell className="text-right">{fmt(l.actual)}</TableCell>
                    <TableCell className="text-right text-amber-700">{fmt(l.committed)}</TableCell>
                    <TableCell className={`text-right font-medium ${avail < 0 ? "text-red-600" : "text-green-700"}`}>{fmt(avail)}</TableCell>
                    <TableCell className="min-w-[120px]">
                      <div className="flex items-center gap-2">
                        <Progress value={Math.min(pct, 100)} className="h-1.5 flex-1" />
                        <span className={`text-xs font-medium ${utilizationColor(pct)}`}>{pct}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => openEdit(l)}>Edit</Button>
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
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editId ? "Edit Budget Line" : "New Budget Line"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1"><Label>Budget Head *</Label><Input value={form.head} onChange={e => setForm(p => ({ ...p, head: e.target.value }))} placeholder="e.g. Staff Salaries" /></div>
            <div className="space-y-1">
              <Label>Account *</Label>
              <Select value={form.account} onValueChange={v => setForm(p => ({ ...p, account: v }))}>
                <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
                <SelectContent>{ACCOUNTS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Financial Year</Label>
                <Select value={form.year} onValueChange={v => setForm(p => ({ ...p, year: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FY 2024/25">FY 2024/25</SelectItem>
                    <SelectItem value="FY 2023/24">FY 2023/24</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label>Period</Label><Input value={form.period} onChange={e => setForm(p => ({ ...p, period: e.target.value }))} /></div>
            </div>
            <div className="space-y-1"><Label>Approved Amount (KES) *</Label><Input type="number" value={form.approved} onChange={e => setForm(p => ({ ...p, approved: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2} /></div>
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
