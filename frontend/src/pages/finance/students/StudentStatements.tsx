import { useState, useEffect, useRef } from "react";
import { Search, Printer, Loader2, ChevronDown, ChevronRight, Eye, ArrowLeft, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/ui/table-pagination";
import { studentsService } from "@/services/students.service";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(n);

const TERM_LABELS: Record<string, string> = { T1: "Term 1", T2: "Term 2", T3: "Term 3" };

// ─── Types ──────────────────────────────────────────────────────────────────

interface BalanceRow {
  id: string; admission_no: string; name: string; class_name: string;
  stream: string; total_billed: number; total_paid: number;
  balance: number; outstanding: number; fees_in_advance: number;
}

interface BillLineDetail { vote_head: string; amount: number; paid: number; balance: number; }
interface ReceiptLineDetail { account: string; description: string; amount: number; }

interface TxLine {
  date: string; ref: string; type: "bill" | "receipt" | "bursary";
  description: string; debit: number; credit: number; balance: number;
  term?: string; year?: string; mode?: string;
  lines?: (BillLineDetail | ReceiptLineDetail)[];
}

interface VoteHeadSummary { vote_head: string; billed: number; paid: number; balance: number; }
interface AvailableTerm { term: string; year: string; }

interface StatementData {
  student: {
    id: string; admission_no: string; name: string; class: string;
    stream: string; status: string; parent_name: string; parent_phone: string;
  };
  total_billed: number; total_paid: number; balance: number; fees_in_advance: number;
  vote_head_summary: VoteHeadSummary[];
  available_terms: AvailableTerm[];
  transactions: TxLine[];
}

// ─── Print helper ───────────────────────────────────────────────────────────

function printStatement(statement: StatementData) {
  const win = window.open("", "_blank");
  if (!win) return;
  const s = statement.student;
  win.document.write(`<!DOCTYPE html><html><head><title>Statement — ${s.name}</title>
    <style>
      body{font-family:Arial,sans-serif;font-size:12px;padding:20px;color:#333}
      h1{font-size:18px;margin-bottom:4px}
      .meta{color:#666;margin-bottom:16px}
      .summary{display:flex;gap:40px;margin-bottom:16px;padding:12px;background:#f9f9f9;border-radius:4px}
      .summary div{text-align:center} .summary .label{font-size:11px;color:#888} .summary .value{font-size:16px;font-weight:bold}
      table{width:100%;border-collapse:collapse;margin-bottom:16px}
      th,td{border:1px solid #ddd;padding:6px 8px;text-align:left;font-size:11px}
      th{background:#f5f5f5;font-weight:600} .r{text-align:right}
      .cr{color:#16a34a} .pos{color:#dc2626;font-weight:600} .neg{color:#16a34a;font-weight:600}
      .footer{margin-top:20px;font-size:10px;color:#999;border-top:1px solid #eee;padding-top:8px}
      @media print{body{padding:0}}
    </style></head><body>
    <h1>Student Fee Statement</h1>
    <div class="meta">${s.name} &bull; ${s.admission_no} &bull; ${s.class} ${s.stream || ""}</div>
    <div class="summary">
      <div><div class="label">Total Billed</div><div class="value">${fmt(statement.total_billed)}</div></div>
      <div><div class="label">Total Paid</div><div class="value cr">${fmt(statement.total_paid)}</div></div>
      <div><div class="label">Balance</div><div class="value" style="color:${statement.balance > 0 ? '#dc2626' : '#16a34a'}">${fmt(statement.balance)}</div></div>
      ${statement.fees_in_advance > 0 ? `<div><div class="label">Fees in Advance</div><div class="value cr">${fmt(statement.fees_in_advance)}</div></div>` : ""}
    </div>`);
  if (statement.vote_head_summary.length) {
    win.document.write(`<h3 style="font-size:13px;margin-bottom:6px">Vote Head Balances</h3><table>
      <tr><th>Vote Head</th><th class="r">Billed</th><th class="r">Paid</th><th class="r">Balance</th></tr>`);
    for (const vh of statement.vote_head_summary)
      win.document.write(`<tr><td>${vh.vote_head}</td><td class="r">${fmt(vh.billed)}</td><td class="r cr">${fmt(vh.paid)}</td><td class="r ${vh.balance > 0 ? 'pos' : 'neg'}">${fmt(vh.balance)}</td></tr>`);
    win.document.write("</table>");
  }
  win.document.write(`<h3 style="font-size:13px;margin-bottom:6px">Transactions</h3><table>
    <tr><th>Date</th><th>Reference</th><th>Description</th><th class="r">Debit</th><th class="r">Credit</th><th class="r">Balance</th></tr>`);
  for (const t of statement.transactions)
    win.document.write(`<tr><td>${t.date}</td><td>${t.ref}</td><td>${t.description}</td><td class="r">${t.debit ? fmt(t.debit) : "—"}</td><td class="r cr">${t.credit ? fmt(t.credit) : "—"}</td><td class="r ${t.balance > 0 ? 'pos' : 'neg'}">${fmt(t.balance)}</td></tr>`);
  win.document.write(`</table><div class="footer">Printed on ${new Date().toLocaleDateString("en-KE", { dateStyle: "long" })} &bull; StoreSure School Management</div></body></html>`);
  win.document.close();
  win.focus();
  win.print();
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function StudentStatements() {
  const { toast } = useToast();

  // ── List view state ─────────────────────────────────────────────────────
  const [rows, setRows] = useState<BalanceRow[]>([]);
  const [classes, setClasses] = useState<string[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("ALL");

  // ── Detail view state ───────────────────────────────────────────────────
  const [activeStudent, setActiveStudent] = useState<BalanceRow | null>(null);
  const [statement, setStatement] = useState<StatementData | null>(null);
  const [loadingStatement, setLoadingStatement] = useState(false);
  const [termFilter, setTermFilter] = useState("ALL");
  const [expandedTx, setExpandedTx] = useState<number | null>(null);

  // ── Load balance summary ────────────────────────────────────────────────
  const loadBalances = async (params?: Record<string, string>) => {
    try {
      setLoadingList(true);
      const data = await studentsService.getStudentBalances(params);
      setRows(data.students);
      setClasses(data.classes);
    } catch (e: any) {
      toast({ title: "Failed to load balances", description: e.message, variant: "destructive" });
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => { loadBalances(); }, []);

  // Re-fetch when class filter changes
  const onClassChange = (val: string) => {
    setClassFilter(val);
    const params: Record<string, string> = {};
    if (val !== "ALL") params.class_name = val;
    if (search.length >= 2) params.search = search;
    loadBalances(params);
  };

  // Debounced search
  useEffect(() => {
    if (activeStudent) return; // don't refetch while viewing detail
    const timeout = setTimeout(() => {
      const params: Record<string, string> = {};
      if (classFilter !== "ALL") params.class_name = classFilter;
      if (search.length >= 2) params.search = search;
      loadBalances(params);
    }, 400);
    return () => clearTimeout(timeout);
  }, [search]);

  const { page, setPage, paginatedItems, totalPages, from, to, total: totalRows } = usePagination(rows);

  // ── Aggregates for stat cards ───────────────────────────────────────────
  const totalBilledAll = rows.reduce((s, r) => s + r.total_billed, 0);
  const totalPaidAll = rows.reduce((s, r) => s + r.total_paid, 0);
  const totalOutstanding = rows.reduce((s, r) => s + r.outstanding, 0);
  const totalFIA = rows.reduce((s, r) => s + r.fees_in_advance, 0);

  // ── View statement detail ───────────────────────────────────────────────
  const viewStatement = async (row: BalanceRow) => {
    setActiveStudent(row);
    setTermFilter("ALL");
    setExpandedTx(null);
    setLoadingStatement(true);
    try {
      const data = await studentsService.getStudentStatement(row.id);
      setStatement(data);
    } catch (e: any) {
      toast({ title: "Failed to load statement", description: e.message, variant: "destructive" });
      setStatement(null);
    } finally {
      setLoadingStatement(false);
    }
  };

  const printFromList = async (row: BalanceRow) => {
    try {
      const data = await studentsService.getStudentStatement(row.id);
      printStatement(data);
    } catch (e: any) {
      toast({ title: "Failed to load statement for print", description: e.message, variant: "destructive" });
    }
  };

  const onTermFilterChange = (val: string) => {
    setTermFilter(val);
    if (!activeStudent) return;
    setExpandedTx(null);
    setLoadingStatement(true);
    const params: Record<string, string> = {};
    if (val !== "ALL") {
      const [t, y] = val.split("-");
      params.term = t;
      params.year = y;
    }
    studentsService.getStudentStatement(activeStudent.id, Object.keys(params).length ? params : undefined)
      .then(data => setStatement(data))
      .catch((e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }))
      .finally(() => setLoadingStatement(false));
  };

  const backToList = () => {
    setActiveStudent(null);
    setStatement(null);
    setTermFilter("ALL");
    setExpandedTx(null);
  };

  // ── Detail view variables ───────────────────────────────────────────────
  const balance = statement?.balance ?? 0;
  const totalBilled = statement?.total_billed ?? 0;
  const totalPaid = statement?.total_paid ?? 0;
  const feesInAdvance = statement?.fees_in_advance ?? 0;
  const transactions = statement?.transactions ?? [];
  const voteHeadSummary = statement?.vote_head_summary ?? [];
  const availableTerms = statement?.available_terms ?? [];

  // =====================================================================
  // DETAIL VIEW
  // =====================================================================
  if (activeStudent) {
    return (
      <div className="space-y-6">
        {/* Header with back */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={backToList}><ArrowLeft className="h-5 w-5" /></Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Student Statement</h1>
              <p className="text-muted-foreground">{activeStudent.name} · {activeStudent.admission_no}</p>
            </div>
          </div>
          {statement && (
            <Button variant="outline" onClick={() => printStatement(statement)}>
              <Printer className="mr-2 h-4 w-4" />Print Statement
            </Button>
          )}
        </div>

        {/* Student Info + Balance Header */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold text-primary">
                  {activeStudent.name[0]}
                </div>
                <div>
                  <div className="text-lg font-semibold">{activeStudent.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {activeStudent.admission_no} · {activeStudent.class_name}{activeStudent.stream ? ` · ${activeStudent.stream}` : ""}
                  </div>
                  {statement?.student.parent_name && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Parent: {statement.student.parent_name}
                      {statement.student.parent_phone ? ` · ${statement.student.parent_phone}` : ""}
                    </div>
                  )}
                </div>
              </div>
              <div className="text-right">
                {loadingStatement ? (
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                ) : (
                  <>
                    <div className="text-sm text-muted-foreground">Current Balance</div>
                    <div className={`text-3xl font-bold ${balance > 0 ? "text-red-600" : "text-green-600"}`}>{fmt(balance)}</div>
                    <Badge className={balance > 0 ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}>
                      {balance > 0 ? "OUTSTANDING" : balance < 0 ? "OVERPAID" : "CLEARED"}
                    </Badge>
                  </>
                )}
              </div>
            </div>
            {!loadingStatement && (
              <div className="mt-4 grid grid-cols-4 gap-4 border-t pt-4">
                <div><div className="text-sm text-muted-foreground">Total Billed</div><div className="font-semibold">{fmt(totalBilled)}</div></div>
                <div><div className="text-sm text-muted-foreground">Total Paid</div><div className="font-semibold text-green-700">{fmt(totalPaid)}</div></div>
                <div><div className="text-sm text-muted-foreground">Outstanding</div><div className={`font-semibold ${balance > 0 ? "text-red-600" : "text-green-700"}`}>{fmt(Math.max(0, balance))}</div></div>
                <div><div className="text-sm text-muted-foreground">Fees in Advance</div><div className={`font-semibold ${feesInAdvance > 0 ? "text-blue-700" : "text-muted-foreground"}`}>{feesInAdvance > 0 ? fmt(feesInAdvance) : "—"}</div></div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Fees in Advance Banner */}
        {feesInAdvance > 0 && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="py-3">
              <div className="flex items-center gap-2 text-blue-800">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">
                  This student has <strong>{fmt(feesInAdvance)}</strong> in fees received in advance (overpayment). This will be applied to future term billing.
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Vote Head Balance Summary */}
        {voteHeadSummary.length > 0 && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Vote Head Balances</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vote Head</TableHead>
                    <TableHead className="text-right">Billed</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {voteHeadSummary.map(vh => (
                    <TableRow key={vh.vote_head}>
                      <TableCell className="font-medium">{vh.vote_head}</TableCell>
                      <TableCell className="text-right">{fmt(vh.billed)}</TableCell>
                      <TableCell className="text-right text-green-700">{fmt(vh.paid)}</TableCell>
                      <TableCell className={`text-right font-medium ${vh.balance > 0 ? "text-red-600" : "text-green-700"}`}>{fmt(vh.balance)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/50 font-semibold">
                    <TableCell>Total</TableCell>
                    <TableCell className="text-right">{fmt(voteHeadSummary.reduce((s, v) => s + v.billed, 0))}</TableCell>
                    <TableCell className="text-right text-green-700">{fmt(voteHeadSummary.reduce((s, v) => s + v.paid, 0))}</TableCell>
                    <TableCell className={`text-right ${voteHeadSummary.reduce((s, v) => s + v.balance, 0) > 0 ? "text-red-600" : "text-green-700"}`}>
                      {fmt(voteHeadSummary.reduce((s, v) => s + v.balance, 0))}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Controls — term filter */}
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Account Statement</h3>
          <Select value={termFilter} onValueChange={onTermFilterChange}>
            <SelectTrigger className="w-48"><SelectValue placeholder="All Terms" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Terms</SelectItem>
              {availableTerms.map(at => {
                const key = `${at.term}-${at.year}`;
                return <SelectItem key={key} value={key}>{TERM_LABELS[at.term] || at.term} {at.year}</SelectItem>;
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Transactions Table */}
        <Card>
          <CardContent className="p-0">
            {loadingStatement ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : transactions.length === 0 ? (
              <p className="px-4 py-8 text-center text-muted-foreground">No transactions found for this student</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8"></TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Debit (KES)</TableHead>
                    <TableHead className="text-right">Credit (KES)</TableHead>
                    <TableHead className="text-right">Balance (KES)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((t, i) => {
                    const hasLines = t.lines && t.lines.length > 0;
                    const isExpanded = expandedTx === i;
                    return (
                      <>
                        <TableRow key={i} className={hasLines ? "cursor-pointer hover:bg-muted/50" : ""} onClick={() => hasLines && setExpandedTx(isExpanded ? null : i)}>
                          <TableCell>
                            {hasLines && (isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />)}
                          </TableCell>
                          <TableCell className="text-sm">{t.date}</TableCell>
                          <TableCell className="font-mono text-sm">{t.ref}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs capitalize">{t.type}</Badge>
                            {t.mode && <span className="ml-1 text-xs text-muted-foreground">({t.mode})</span>}
                          </TableCell>
                          <TableCell>{t.description}</TableCell>
                          <TableCell className="text-right">{t.debit ? fmt(t.debit) : "—"}</TableCell>
                          <TableCell className="text-right text-green-700">{t.credit ? fmt(t.credit) : "—"}</TableCell>
                          <TableCell className={`text-right font-medium ${t.balance > 0 ? "text-red-600" : "text-green-700"}`}>{fmt(t.balance)}</TableCell>
                        </TableRow>
                        {isExpanded && hasLines && (
                          <TableRow key={`${i}-detail`}>
                            <TableCell colSpan={8} className="p-0 bg-muted/20">
                              <div className="px-8 py-3">
                                {t.type === "bill" ? (
                                  <Table>
                                    <TableHeader><TableRow>
                                      <TableHead>Vote Head</TableHead><TableHead className="text-right">Amount</TableHead>
                                      <TableHead className="text-right">Paid</TableHead><TableHead className="text-right">Balance</TableHead>
                                    </TableRow></TableHeader>
                                    <TableBody>
                                      {(t.lines as BillLineDetail[]).map((line, li) => (
                                        <TableRow key={li}>
                                          <TableCell className="text-sm">{line.vote_head}</TableCell>
                                          <TableCell className="text-right text-sm">{fmt(line.amount)}</TableCell>
                                          <TableCell className="text-right text-sm text-green-700">{fmt(line.paid)}</TableCell>
                                          <TableCell className={`text-right text-sm font-medium ${line.balance > 0 ? "text-red-600" : "text-green-700"}`}>{fmt(line.balance)}</TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                ) : t.type === "receipt" ? (
                                  <Table>
                                    <TableHeader><TableRow>
                                      <TableHead>Account</TableHead><TableHead>Description</TableHead><TableHead className="text-right">Amount</TableHead>
                                    </TableRow></TableHeader>
                                    <TableBody>
                                      {(t.lines as ReceiptLineDetail[]).map((line, li) => (
                                        <TableRow key={li}>
                                          <TableCell className="text-sm">{line.account}</TableCell>
                                          <TableCell className="text-sm">{line.description}</TableCell>
                                          <TableCell className="text-right text-sm text-green-700">{fmt(line.amount)}</TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                ) : null}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // =====================================================================
  // LIST VIEW (default)
  // =====================================================================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Student Statements</h1>
        <p className="text-muted-foreground">Fee account balances and statements for all students</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card><CardContent className="pt-4"><div className="text-2xl font-bold">{rows.length}</div><div className="text-sm text-muted-foreground">Active Students</div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="text-2xl font-bold">{fmt(totalBilledAll)}</div><div className="text-sm text-muted-foreground">Total Billed</div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="text-2xl font-bold text-red-600">{fmt(totalOutstanding)}</div><div className="text-sm text-muted-foreground">Total Outstanding</div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="text-2xl font-bold text-blue-700">{fmt(totalFIA)}</div><div className="text-sm text-muted-foreground">Fees in Advance</div></CardContent></Card>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name or admission no..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={classFilter} onValueChange={onClassChange}>
          <SelectTrigger className="w-48"><SelectValue placeholder="All Classes" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Classes</SelectItem>
            {classes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Student Balances Table */}
      <Card>
        <CardContent className="p-0">
          {loadingList ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Adm No</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead className="text-right">Total Billed</TableHead>
                  <TableHead className="text-right">Total Paid</TableHead>
                  <TableHead className="text-right">Outstanding</TableHead>
                  <TableHead className="text-right">Fees in Advance</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead className="w-24 text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedItems.length === 0 ? (
                  <TableRow><TableCell colSpan={9} className="py-8 text-center text-muted-foreground">No students found</TableCell></TableRow>
                ) : null}
                {paginatedItems.map(r => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell className="font-mono text-sm">{r.admission_no}</TableCell>
                    <TableCell>{r.class_name}</TableCell>
                    <TableCell className="text-right">{fmt(r.total_billed)}</TableCell>
                    <TableCell className="text-right text-green-700">{fmt(r.total_paid)}</TableCell>
                    <TableCell className={`text-right font-medium ${r.outstanding > 0 ? "text-red-600" : "text-green-700"}`}>
                      {r.outstanding > 0 ? fmt(r.outstanding) : "—"}
                    </TableCell>
                    <TableCell className={`text-right ${r.fees_in_advance > 0 ? "text-blue-700 font-medium" : "text-muted-foreground"}`}>
                      {r.fees_in_advance > 0 ? fmt(r.fees_in_advance) : "—"}
                    </TableCell>
                    <TableCell className={`text-right font-bold ${r.balance > 0 ? "text-red-600" : r.balance < 0 ? "text-blue-700" : "text-green-700"}`}>
                      {fmt(r.balance)}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-center gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" title="View Statement" onClick={() => viewStatement(r)}>
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7" title="Print Statement" onClick={() => printFromList(r)}>
                          <Printer className="h-3.5 w-3.5" />
                        </Button>
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
    </div>
  );
}
