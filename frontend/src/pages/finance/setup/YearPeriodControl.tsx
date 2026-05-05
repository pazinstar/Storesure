import { useState } from "react";
import { Plus, Lock, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/ui/table-pagination";

type YearStatus = "CLOSED" | "OPEN" | "FUTURE";
type PeriodStatus = "CLOSED" | "OPEN" | "FUTURE";

interface Period {
  id: string;
  number: string;
  name: string;
  start: string;
  end: string;
  status: PeriodStatus;
}

interface FinancialYear {
  id: string;
  name: string;
  start: string;
  end: string;
  status: YearStatus;
  periods: Period[];
}

const YEAR_STATUS_COLORS: Record<YearStatus, string> = {
  OPEN: "bg-green-100 text-green-800",
  CLOSED: "bg-gray-100 text-gray-700",
  FUTURE: "bg-blue-100 text-blue-800",
};

const PERIOD_STATUS_COLORS: Record<PeriodStatus, string> = {
  OPEN: "bg-green-100 text-green-800",
  CLOSED: "bg-gray-100 text-gray-700",
  FUTURE: "bg-blue-100 text-blue-800",
};

function makePeriods(yearId: string, statuses: PeriodStatus[]): Period[] {
  const months = ["Jul","Aug","Sep","Oct","Nov","Dec","Jan","Feb","Mar","Apr","May","Jun"];
  const fy = yearId === "fy2324" ? 23 : yearId === "fy2425" ? 24 : 25;
  const calYear = (i: number) => i < 6 ? `20${fy}` : `20${fy + 1}`;
  return months.map((m, i) => ({
    id: `${yearId}-p${String(i + 1).padStart(2, "0")}`,
    number: `P${String(i + 1).padStart(2, "0")}`,
    name: `${m}-${String(fy + (i >= 6 ? 1 : 0)).padStart(2, "0")}`,
    start: `01 ${m} ${calYear(i)}`,
    end: `${["31","28","30","31","30","31","31","29","31","30","31","30"][i]} ${m} ${calYear(i)}`,
    status: statuses[i],
  }));
}

const INITIAL_YEARS: FinancialYear[] = [
  {
    id: "fy2324", name: "FY 2023/24", start: "01 Jul 2023", end: "30 Jun 2024", status: "CLOSED",
    periods: makePeriods("fy2324", ["CLOSED","CLOSED","CLOSED","CLOSED","CLOSED","CLOSED","CLOSED","CLOSED","CLOSED","CLOSED","CLOSED","CLOSED"]),
  },
  {
    id: "fy2425", name: "FY 2024/25", start: "01 Jul 2024", end: "30 Jun 2025", status: "OPEN",
    periods: makePeriods("fy2425", ["CLOSED","CLOSED","CLOSED","OPEN","FUTURE","FUTURE","FUTURE","FUTURE","FUTURE","FUTURE","FUTURE","FUTURE"]),
  },
  {
    id: "fy2526", name: "FY 2025/26", start: "01 Jul 2025", end: "30 Jun 2026", status: "FUTURE",
    periods: makePeriods("fy2526", ["FUTURE","FUTURE","FUTURE","FUTURE","FUTURE","FUTURE","FUTURE","FUTURE","FUTURE","FUTURE","FUTURE","FUTURE"]),
  },
];

export default function YearPeriodControl() {
  const { toast } = useToast();
  const [years, setYears] = useState<FinancialYear[]>(INITIAL_YEARS);
  const [selectedYearId, setSelectedYearId] = useState("fy2425");
  const [newYearDialog, setNewYearDialog] = useState(false);
  const [newYear, setNewYear] = useState({ name: "", start: "", end: "" });

  const selectedYear = years.find(y => y.id === selectedYearId)!;
  const { page, setPage, pageSize, setPageSize, paginatedItems: paginatedPeriods, totalPages, from, to, total } = usePagination(selectedYear?.periods ?? []);;

  const togglePeriod = (periodId: string) => {
    setYears(prev => prev.map(y =>
      y.id === selectedYearId
        ? {
            ...y,
            periods: y.periods.map(p =>
              p.id === periodId
                ? { ...p, status: p.status === "OPEN" ? "CLOSED" : "OPEN" }
                : p
            ),
          }
        : y
    ));
    const period = selectedYear.periods.find(p => p.id === periodId);
    toast({ title: `Period ${period?.name} ${period?.status === "OPEN" ? "closed" : "opened"}` });
  };

  const addYear = () => {
    if (!newYear.name || !newYear.start || !newYear.end) {
      toast({ title: "All fields required", variant: "destructive" }); return;
    }
    const id = `fy_${Date.now()}`;
    const statuses: PeriodStatus[] = Array(12).fill("FUTURE");
    setYears(prev => [...prev, { id, name: newYear.name, start: newYear.start, end: newYear.end, status: "FUTURE", periods: makePeriods(id, statuses) }]);
    toast({ title: `${newYear.name} created with 12 periods` });
    setNewYearDialog(false);
    setNewYear({ name: "", start: "", end: "" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Year & Period Control</h1>
          <p className="text-muted-foreground">Manage financial years and open/close accounting periods</p>
        </div>
        <Button onClick={() => setNewYearDialog(true)}><Plus className="mr-2 h-4 w-4" />New Financial Year</Button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left: Year list */}
        <Card>
          <CardHeader><CardTitle className="text-base">Financial Years</CardTitle></CardHeader>
          <CardContent className="p-0">
            {years.map(y => (
              <button
                key={y.id}
                onClick={() => setSelectedYearId(y.id)}
                className={`w-full text-left px-4 py-3 border-b transition-colors hover:bg-muted/50 ${selectedYearId === y.id ? "bg-primary/10 border-l-2 border-primary" : ""}`}
              >
                <div className="font-semibold">{y.name}</div>
                <div className="text-xs text-muted-foreground">{y.start} – {y.end}</div>
                <Badge className={`mt-1 ${YEAR_STATUS_COLORS[y.status]}`}>{y.status}</Badge>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Right: Period table */}
        <Card className="col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-base">
                Periods — {selectedYear.name}
                <Badge className={`ml-2 ${YEAR_STATUS_COLORS[selectedYear.status]}`}>{selectedYear.status}</Badge>
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Start</TableHead>
                  <TableHead>End</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedPeriods.map(p => (
                  <TableRow key={p.id} className={p.status === "OPEN" ? "bg-green-50/50" : ""}>
                    <TableCell className="font-mono font-medium">{p.number}</TableCell>
                    <TableCell>{p.name}</TableCell>
                    <TableCell className="text-sm">{p.start}</TableCell>
                    <TableCell className="text-sm">{p.end}</TableCell>
                    <TableCell><Badge className={PERIOD_STATUS_COLORS[p.status]}>{p.status}</Badge></TableCell>
                    <TableCell>
                      {p.status !== "FUTURE" ? (
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => togglePeriod(p.id)}>
                          {p.status === "OPEN" ? <><Lock className="mr-1 h-3 w-3" />Close</> : <><Unlock className="mr-1 h-3 w-3" />Open</>}
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePagination page={page} totalPages={totalPages} from={from} to={to} total={total} onPageChange={setPage} />
          </CardContent>
        </Card>
      </div>

      <Dialog open={newYearDialog} onOpenChange={setNewYearDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>New Financial Year</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1"><Label>Year Name *</Label><Input placeholder="e.g. FY 2026/27" value={newYear.name} onChange={e => setNewYear(p => ({ ...p, name: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Start Date *</Label><Input type="date" value={newYear.start} onChange={e => setNewYear(p => ({ ...p, start: e.target.value }))} /></div>
            <div className="space-y-1"><Label>End Date *</Label><Input type="date" value={newYear.end} onChange={e => setNewYear(p => ({ ...p, end: e.target.value }))} /></div>
            <p className="text-xs text-muted-foreground">12 monthly periods will be created automatically with FUTURE status.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewYearDialog(false)}>Cancel</Button>
            <Button onClick={addYear}>Create Year</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
