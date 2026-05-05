import { useState } from "react";
import { FileText, Download, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/ui/table-pagination";

interface Report { id: string; name: string; description: string; category: string; lastRun?: string; }

const REPORTS: Report[] = [
  // Students
  { id: "R01", name: "Student Fee Statement", description: "Individual student fee account statement with running balance", category: "STUDENTS", lastRun: "31 Jan 2025" },
  { id: "R02", name: "Fee Collection Summary", description: "Fees collected per class/stream/period with receipts reconciliation", category: "STUDENTS", lastRun: "31 Jan 2025" },
  { id: "R03", name: "Fee Arrears Report", description: "Students with outstanding fee balances — aging analysis", category: "STUDENTS", lastRun: "31 Jan 2025" },
  // Creditors
  { id: "R06", name: "Supplier Payments Ledger", description: "Payment history per supplier for a date range", category: "CREDITORS" },
  // Inventory
  { id: "R07", name: "Stock Valuation Report", description: "Current stock balances at cost (FIFO) per item and category", category: "INVENTORY", lastRun: "31 Jan 2025" },
  { id: "R08", name: "Stock Movement Report", description: "GRN, issues and adjustments per item for a period", category: "INVENTORY" },
  // Fixed Assets
  { id: "R09", name: "Fixed Asset Register", description: "Full PPE listing with cost, accumulated depreciation and NBV", category: "ASSETS", lastRun: "31 Jan 2025" },
  { id: "R10", name: "Depreciation Schedule", description: "Monthly and annual depreciation charge per asset and category", category: "ASSETS" },
  { id: "R11", name: "Asset Disposal Report", description: "Disposed assets with gain/(loss) calculation", category: "ASSETS" },
  // GL
  { id: "R12", name: "General Ledger Listing", description: "Full GL transactions for any account and period range", category: "GL", lastRun: "31 Jan 2025" },
  { id: "R13", name: "Chart of Accounts Listing", description: "Full COA with balances and account types", category: "GL" },
  { id: "R14", name: "Bank Reconciliation Report", description: "Reconciliation statement for a given bank account and period", category: "GL" },
  // Budget
  { id: "R15", name: "Budget vs Actual Report", description: "Actual income/expenditure vs budget with variance analysis", category: "BUDGET", lastRun: "31 Jan 2025" },
];

const CATEGORY_COLORS: Record<string, string> = {
  STUDENTS: "bg-blue-100 text-blue-800",
  CREDITORS: "bg-orange-100 text-orange-800",
  INVENTORY: "bg-green-100 text-green-800",
  ASSETS: "bg-purple-100 text-purple-800",
  GL: "bg-gray-100 text-gray-700",
  BUDGET: "bg-amber-100 text-amber-800",
};

const CATEGORIES = ["ALL", "STUDENTS", "CREDITORS", "INVENTORY", "ASSETS", "GL", "BUDGET"];
const PERIODS = ["P01 Jan-25", "P02 Feb-25", "P12 Jun-24", "P11 May-24"];
const YEARS = ["FY2024/25", "FY2023/24"];

export default function Reports() {
  const { toast } = useToast();
  const [catFilter, setCatFilter] = useState("ALL");
  const [runDialogOpen, setRunDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [period, setPeriod] = useState("P01 Jan-25");
  const [year, setYear] = useState("FY2024/25");

  const filtered = REPORTS.filter(r => catFilter === "ALL" || r.category === catFilter);
  const { page, setPage, pageSize, setPageSize, paginatedItems, totalPages, from, to, total: totalRows } = usePagination(filtered);

  const openRun = (r: Report) => { setSelectedReport(r); setRunDialogOpen(true); };
  const run = () => {
    toast({ title: `${selectedReport?.name} — report generated`, description: `Period: ${period} | Year: ${year}` });
    setRunDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">Generate finance reports across all modules</p>
        </div>
        <div className="text-sm text-muted-foreground">{REPORTS.length} reports available</div>
      </div>

      <div className="flex gap-3 items-end flex-wrap">
        <div className="space-y-1">
          <Label className="text-xs flex items-center gap-1"><Filter className="h-3 w-3" /> Category</Label>
          <Select value={catFilter} onValueChange={setCatFilter}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c === "ALL" ? "All Categories" : c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap">Show</span>
          <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
            <SelectTrigger className="w-20 h-10"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">entries</span>
        </div>
        <div className="text-sm text-muted-foreground">{filtered.length} reports shown</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {paginatedItems.map(r => (
          <Card key={r.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <CardTitle className="text-sm font-semibold leading-snug">{r.name}</CardTitle>
                </div>
                <Badge className={`text-xs shrink-0 ${CATEGORY_COLORS[r.category]}`}>{r.category}</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xs text-muted-foreground mb-3">{r.description}</p>
              <div className="flex items-center justify-between">
                {r.lastRun
                  ? <span className="text-xs text-muted-foreground">Last run: {r.lastRun}</span>
                  : <span className="text-xs text-muted-foreground italic">Never run</span>
                }
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => openRun(r)}>
                    Run
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => toast({ title: `${r.name} — export coming soon` })}>
                    <Download className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <TablePagination page={page} totalPages={totalPages} from={from} to={to} total={totalRows} onPageChange={setPage} />

      <Dialog open={runDialogOpen} onOpenChange={setRunDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Run Report</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="text-sm font-medium">{selectedReport?.name}</div>
            <div className="text-xs text-muted-foreground">{selectedReport?.description}</div>
            <div className="space-y-1">
              <Label>Period</Label>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PERIODS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Financial Year</Label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{YEARS.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRunDialogOpen(false)}>Cancel</Button>
            <Button onClick={run}><FileText className="mr-2 h-4 w-4" />Generate Report</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
