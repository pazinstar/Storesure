import { useState } from "react";
import { Plus, Eye, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/ui/table-pagination";

const fmt = (n: number) => new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(n);

interface Run { id: string; no: string; period: string; dateRun: string; assetsProcessed: number; totalDepr: number; status: "POSTED" | "DRAFT"; }

const PREVIEW = [
  { asset: "Main School Building", category: "BUILDING", nbvBefore: 6375000, method: "SL", rate: "2.5%", monthlyDepr: 17708, nbvAfter: 6357292 },
  { asset: "Administration Block", category: "BUILDING", nbvBefore: 2720000, method: "SL", rate: "2.5%", monthlyDepr: 6667, nbvAfter: 2713333 },
  { asset: "School Bus (KBZ 123A)", category: "VEHICLE", nbvBefore: 3150000, method: "RB", rate: "25%", monthlyDepr: 65625, nbvAfter: 3084375 },
  { asset: "School Bus (KBZ 456B)", category: "VEHICLE", nbvBefore: 3600000, method: "RB", rate: "25%", monthlyDepr: 75000, nbvAfter: 3525000 },
  { asset: "Science Lab Equipment", category: "LAB EQUIP", nbvBefore: 455000, method: "SL", rate: "20%", monthlyDepr: 7583, nbvAfter: 447417 },
  { asset: "Computer Lab (30 PCs)", category: "COMPUTERS", nbvBefore: 630000, method: "SL", rate: "33%", monthlyDepr: 17325, nbvAfter: 612675 },
  { asset: "Library Furniture", category: "FURNITURE", nbvBefore: 238000, method: "SL", rate: "10%", monthlyDepr: 1983, nbvAfter: 236017 },
  { asset: "Kitchen Equipment", category: "EQUIPMENT", nbvBefore: 297500, method: "SL", rate: "15%", monthlyDepr: 3719, nbvAfter: 293781 },
  { asset: "Generator (100KVA)", category: "EQUIPMENT", nbvBefore: 357000, method: "SL", rate: "15%", monthlyDepr: 4463, nbvAfter: 352537 },
];
const TOTAL_DEPR = PREVIEW.reduce((s, p) => s + p.monthlyDepr, 0);

const INITIAL_RUNS: Run[] = [
  { id: "1", no: "DEPR-2025-001", period: "P01 Jan-25", dateRun: "31 Jan 2025", assetsProcessed: 9, totalDepr: TOTAL_DEPR, status: "POSTED" },
  { id: "2", no: "DEPR-2024-012", period: "P12 Jun-24", dateRun: "30 Jun 2024", assetsProcessed: 9, totalDepr: TOTAL_DEPR, status: "POSTED" },
  { id: "3", no: "DEPR-2024-011", period: "P11 May-24", dateRun: "31 May 2024", assetsProcessed: 9, totalDepr: TOTAL_DEPR, status: "POSTED" },
  { id: "4", no: "DEPR-2024-010", period: "P10 Apr-24", dateRun: "30 Apr 2024", assetsProcessed: 9, totalDepr: TOTAL_DEPR, status: "POSTED" },
];

const PERIODS = ["P01 Jan-25","P02 Feb-25","P03 Mar-25"];

export default function DepreciationRun() {
  const { toast } = useToast();
  const [runs, setRuns] = useState<Run[]>(INITIAL_RUNS);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [period, setPeriod] = useState("");
  const [previewed, setPreviewed] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const { page, setPage, pageSize, setPageSize, paginatedItems, totalPages, from, to, total: totalRows } = usePagination(runs);

  const toggle = (id: string) => setExpanded(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const postRun = () => {
    const no = `DEPR-2025-${String(runs.length + 1).padStart(3, "0")}`;
    setRuns(p => [...p, { id: Date.now().toString(), no, period, dateRun: new Date().toLocaleDateString("en-KE"), assetsProcessed: 9, totalDepr: TOTAL_DEPR, status: "POSTED" }]);
    toast({ title: `${no} posted — depreciation of ${fmt(TOTAL_DEPR)} recorded` });
    setDialogOpen(false); setPeriod(""); setPreviewed(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Depreciation Run</h1>
          <p className="text-muted-foreground">Compute and post periodic depreciation — Dr Depr. Expense → Cr Accum. Depreciation</p>
        </div>
        <Button onClick={() => { setPeriod(""); setPreviewed(false); setDialogOpen(true); }}><Plus className="mr-2 h-4 w-4" />New Depreciation Run</Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-4">
            <CardTitle className="text-base">Depreciation Runs History</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8"></TableHead>
                <TableHead>Run No</TableHead><TableHead>Period</TableHead><TableHead>Date Run</TableHead>
                <TableHead className="text-right">Assets Processed</TableHead>
                <TableHead className="text-right">Total Depreciation</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedItems.map(r => (
                <>
                  <TableRow key={r.id} className="cursor-pointer hover:bg-muted/50" onClick={() => toggle(r.id)}>
                    <TableCell>{expanded.has(r.id) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}</TableCell>
                    <TableCell className="font-mono font-medium">{r.no}</TableCell>
                    <TableCell>{r.period}</TableCell>
                    <TableCell>{r.dateRun}</TableCell>
                    <TableCell className="text-right">{r.assetsProcessed}</TableCell>
                    <TableCell className="text-right font-medium">{fmt(r.totalDepr)}</TableCell>
                    <TableCell><Badge className="bg-green-100 text-green-800">{r.status}</Badge></TableCell>
                  </TableRow>
                  {expanded.has(r.id) && (
                    <TableRow key={`${r.id}-d`}>
                      <TableCell colSpan={7} className="bg-muted/20 p-0">
                        <div className="px-6 py-3">
                          <Table>
                            <TableHeader><TableRow><TableHead>Asset</TableHead><TableHead>Category</TableHead><TableHead>NBV Before</TableHead><TableHead>Method</TableHead><TableHead>Rate</TableHead><TableHead className="text-right">Monthly Depr.</TableHead><TableHead className="text-right">NBV After</TableHead></TableRow></TableHeader>
                            <TableBody>
                              {PREVIEW.map(p => (
                                <TableRow key={p.asset}>
                                  <TableCell className="text-sm">{p.asset}</TableCell>
                                  <TableCell><Badge variant="outline" className="text-xs">{p.category}</Badge></TableCell>
                                  <TableCell className="text-sm">{fmt(p.nbvBefore)}</TableCell>
                                  <TableCell className="text-xs">{p.method}</TableCell>
                                  <TableCell className="text-xs">{p.rate}</TableCell>
                                  <TableCell className="text-right text-amber-700">{fmt(p.monthlyDepr)}</TableCell>
                                  <TableCell className="text-right">{fmt(p.nbvAfter)}</TableCell>
                                </TableRow>
                              ))}
                              <TableRow className="font-bold border-t">
                                <TableCell colSpan={5}>Total Depreciation</TableCell>
                                <TableCell className="text-right text-amber-700">{fmt(TOTAL_DEPR)}</TableCell>
                                <TableCell></TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))}
            </TableBody>
          </Table>
          <TablePagination page={page} totalPages={totalPages} from={from} to={to} total={totalRows} onPageChange={setPage} />
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New Depreciation Run</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-end gap-4">
              <div className="space-y-1 flex-1">
                <Label>Accounting Period *</Label>
                <Select value={period} onValueChange={p => { setPeriod(p); setPreviewed(false); }}>
                  <SelectTrigger><SelectValue placeholder="Select period" /></SelectTrigger>
                  <SelectContent>{PERIODS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Button variant="outline" disabled={!period} onClick={() => { setPreviewed(true); toast({ title: "Preview computed" }); }}>
                <Eye className="mr-2 h-4 w-4" />Preview
              </Button>
            </div>

            {previewed && (
              <>
                <Separator />
                <div>
                  <h4 className="font-semibold mb-3">Depreciation Preview — {period}</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Asset</TableHead><TableHead>Category</TableHead><TableHead className="text-right">NBV Before</TableHead>
                        <TableHead>Method</TableHead><TableHead>Rate</TableHead>
                        <TableHead className="text-right">Monthly Depr.</TableHead><TableHead className="text-right">NBV After</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {PREVIEW.map(p => (
                        <TableRow key={p.asset}>
                          <TableCell className="text-sm font-medium">{p.asset}</TableCell>
                          <TableCell><Badge variant="outline" className="text-xs">{p.category}</Badge></TableCell>
                          <TableCell className="text-right">{fmt(p.nbvBefore)}</TableCell>
                          <TableCell className="text-xs">{p.method}</TableCell>
                          <TableCell className="text-xs">{p.rate}</TableCell>
                          <TableCell className="text-right font-medium text-amber-700">{fmt(p.monthlyDepr)}</TableCell>
                          <TableCell className="text-right">{fmt(p.nbvAfter)}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="font-bold border-t bg-muted/30">
                        <TableCell colSpan={5}>Total Depreciation for {period}</TableCell>
                        <TableCell className="text-right text-amber-700">{fmt(TOTAL_DEPR)}</TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button disabled={!previewed} onClick={postRun}>Post Depreciation Run</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
