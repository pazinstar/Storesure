import { useState, useEffect } from "react";
import { Plus, ChevronDown, ChevronRight, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/ui/table-pagination";
import { studentsService } from "@/services/students.service";

const fmt = (n: number) => new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(n);

interface BillLine { id: number; vote_head: string; amount: number; paid: number; balance: number; }
interface StudentBill {
  id: string; bill_number: string; student: string; student_name: string;
  admission_no: string; class_name: string; fee_structure: string;
  term: string; year: string; bill_date: string;
  total_amount: number; status: string; lines: BillLine[];
}

// Group bills into "billing runs" by term + year
interface BillingGroup {
  key: string; term: string; year: string; status: string;
  bills: StudentBill[]; total: number; studentCount: number;
}

function groupBills(bills: StudentBill[]): BillingGroup[] {
  const map = new Map<string, StudentBill[]>();
  for (const b of bills) {
    const key = `${b.term}-${b.year}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(b);
  }
  const groups: BillingGroup[] = [];
  for (const [key, items] of map) {
    const hasDraft = items.some(b => b.status === "draft");
    groups.push({
      key,
      term: items[0].term,
      year: items[0].year,
      status: hasDraft ? "draft" : "posted",
      bills: items,
      total: items.reduce((s, b) => s + Number(b.total_amount), 0),
      studentCount: items.length,
    });
  }
  return groups.sort((a, b) => {
    if (a.year !== b.year) return b.year.localeCompare(a.year);
    return b.term.localeCompare(a.term);
  });
}

const TERM_LABELS: Record<string, string> = { T1: "Term 1", T2: "Term 2", T3: "Term 3" };

export default function TermBilling() {
  const { toast } = useToast();
  const [bills, setBills] = useState<StudentBill[]>([]);
  const [feeStructures, setFeeStructures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [posting, setPosting] = useState<string | null>(null);
  const [form, setForm] = useState({ term: "T1", year: "2025", fee_structure_id: "" });

  const loadData = async () => {
    try {
      setLoading(true);
      const [billData, fsData] = await Promise.all([
        studentsService.getBills(),
        studentsService.getFeeStructures({ is_active: "true" }),
      ]);
      setBills(billData);
      setFeeStructures(fsData);
    } catch (e: any) {
      toast({ title: "Failed to load billing data", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const groups = groupBills(bills);
  const { page, setPage, paginatedItems: paginatedGroups, totalPages, from, to, total: totalRows } = usePagination(groups);

  const generate = async () => {
    if (!form.fee_structure_id) {
      toast({ title: "Select a fee structure", variant: "destructive" });
      return;
    }
    setGenerating(true);
    try {
      const result = await studentsService.generateBillingRun({
        term: form.term,
        year: form.year,
        fee_structure_id: form.fee_structure_id,
      });
      toast({ title: `Billing run generated — ${result.bills_created} students billed` });
      setDialogOpen(false);
      loadData();
    } catch (e: any) {
      toast({ title: "Generation failed", description: e.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const postRun = async (term: string, year: string) => {
    const key = `${term}-${year}`;
    setPosting(key);
    try {
      const result = await studentsService.postBillingRun({ term, year });
      toast({ title: `${result.posted} bills posted to student accounts` });
      loadData();
    } catch (e: any) {
      toast({ title: "Post failed", description: e.message, variant: "destructive" });
    } finally {
      setPosting(null);
    }
  };

  const totalBilled = bills.reduce((s, b) => s + Number(b.total_amount), 0);
  const draftCount = bills.filter(b => b.status === "draft").length;
  const postedCount = bills.filter(b => b.status === "posted").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Term Billing</h1>
          <p className="text-muted-foreground">Generate fee bills for students per term from active fee structures</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}><Plus className="mr-2 h-4 w-4" />New Billing Run</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card><CardContent className="pt-4"><div className="text-2xl font-bold">{bills.length}</div><div className="text-sm text-muted-foreground">Total Bills</div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="text-2xl font-bold text-green-700">{postedCount}</div><div className="text-sm text-muted-foreground">Posted</div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="text-2xl font-bold text-yellow-600">{draftCount}</div><div className="text-sm text-muted-foreground">Draft</div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="text-2xl font-bold">{fmt(totalBilled)}</div><div className="text-sm text-muted-foreground">Total Amount Billed</div></CardContent></Card>
      </div>

      {/* Billing Runs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Billing Runs (grouped by Term/Year)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  <TableHead>Term</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead className="text-right">Students</TableHead>
                  <TableHead className="text-right">Total Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedGroups.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="py-8 text-center text-muted-foreground">No billing runs yet. Click "New Billing Run" to generate bills.</TableCell></TableRow>
                )}
                {paginatedGroups.map(g => (
                  <>
                    <TableRow key={g.key} className="cursor-pointer hover:bg-muted/50" onClick={() => setExpandedGroup(expandedGroup === g.key ? null : g.key)}>
                      <TableCell>{expandedGroup === g.key ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}</TableCell>
                      <TableCell className="font-medium">{TERM_LABELS[g.term] || g.term}</TableCell>
                      <TableCell>{g.year}</TableCell>
                      <TableCell className="text-right">{g.studentCount.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-bold">{fmt(g.total)}</TableCell>
                      <TableCell>
                        <Badge className={g.status === "posted" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                          {g.status.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {g.status === "draft" && (
                          <Button
                            size="sm" className="h-7 text-xs"
                            disabled={posting === g.key}
                            onClick={e => { e.stopPropagation(); postRun(g.term, g.year); }}
                          >
                            {posting === g.key ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Send className="mr-1 h-3 w-3" />}
                            Post Run
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                    {expandedGroup === g.key && (
                      <TableRow key={`${g.key}-detail`}>
                        <TableCell colSpan={7} className="p-0 bg-muted/20">
                          <div className="px-6 py-4">
                            <p className="text-sm font-medium mb-3">Student Bills — {TERM_LABELS[g.term]} {g.year}</p>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Bill #</TableHead>
                                  <TableHead>Adm No</TableHead>
                                  <TableHead>Student Name</TableHead>
                                  <TableHead>Class</TableHead>
                                  <TableHead className="text-right">Total Amount</TableHead>
                                  <TableHead>Status</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {g.bills.map(b => (
                                  <TableRow key={b.id}>
                                    <TableCell className="font-mono text-sm">{b.bill_number || b.id}</TableCell>
                                    <TableCell className="font-mono text-sm">{b.admission_no}</TableCell>
                                    <TableCell>{b.student_name}</TableCell>
                                    <TableCell>{b.class_name}</TableCell>
                                    <TableCell className="text-right font-medium">{fmt(Number(b.total_amount))}</TableCell>
                                    <TableCell>
                                      <Badge className={b.status === "posted" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"}>
                                        {b.status}
                                      </Badge>
                                    </TableCell>
                                  </TableRow>
                                ))}
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
          )}
          <TablePagination page={page} totalPages={totalPages} from={from} to={to} total={totalRows} onPageChange={setPage} />
        </CardContent>
      </Card>

      {/* New Billing Run Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>New Billing Run</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1">
              <Label>Fee Structure *</Label>
              <Select value={form.fee_structure_id} onValueChange={v => setForm(p => ({ ...p, fee_structure_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select fee structure" /></SelectTrigger>
                <SelectContent>
                  {feeStructures.map(fs => (
                    <SelectItem key={fs.id} value={fs.id}>
                      {fs.name} ({fs.student_category}) — {fmt(Number(fs.annual_total))}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Term</Label>
              <Select value={form.term} onValueChange={v => setForm(p => ({ ...p, term: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="T1">Term 1</SelectItem>
                  <SelectItem value="T2">Term 2</SelectItem>
                  <SelectItem value="T3">Term 3</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Year</Label>
              <Select value={form.year} onValueChange={v => setForm(p => ({ ...p, year: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="2026">2026</SelectItem>
                  <SelectItem value="2025">2025</SelectItem>
                  <SelectItem value="2024">2024</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm text-muted-foreground">
              This will generate bills for all active students using the selected fee structure.
              Term percentage will be applied to each vote head's annual amount.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={generate} disabled={generating}>
              {generating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generate Bills
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
