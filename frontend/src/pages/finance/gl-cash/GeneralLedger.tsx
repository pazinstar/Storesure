import { useState } from "react";
import { Search, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/ui/table-pagination";

const fmt = (n: number) => new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(n);

const ACCOUNTS = [
  { code: "1100", name: "Cash on Hand" },
  { code: "1200", name: "Cash at Bank – Equity" },
  { code: "1201", name: "Cash at Bank – KCB" },
  { code: "1300", name: "Student Debtors" },
  { code: "2100", name: "Accounts Payable" },
  { code: "3100", name: "Retained Surplus" },
  { code: "4100", name: "School Fees Income" },
  { code: "4200", name: "Other Income" },
  { code: "5100", name: "Staff Salaries" },
  { code: "5200", name: "Food Supplies Expense" },
  { code: "5300", name: "Utilities Expense" },
  { code: "6100", name: "Depreciation Expense" },
];

const PERIODS = ["P01 Jan-25", "P02 Feb-25", "P12 Jun-24", "P11 May-24", "P10 Apr-24"];

interface GLEntry { id: string; date: string; voucher: string; type: string; narration: string; debit: number; credit: number; balance: number; }

const GL_DATA: Record<string, GLEntry[]> = {
  "1200": [
    { id: "1", date: "01 Jan 2025", voucher: "OB-2025", type: "OPEN BAL", narration: "Opening balance b/f", debit: 2850000, credit: 0, balance: 2850000 },
    { id: "2", date: "05 Jan 2025", voucher: "RV-2025-001", type: "RECEIPT", narration: "School fees – Form 1 batch", debit: 450000, credit: 0, balance: 3300000 },
    { id: "3", date: "06 Jan 2025", voucher: "RV-2025-002", type: "RECEIPT", narration: "School fees – Form 2 batch", debit: 380000, credit: 0, balance: 3680000 },
    { id: "4", date: "10 Jan 2025", voucher: "PV-2025-001", type: "PAYMENT", narration: "January salaries", debit: 0, credit: 1050000, balance: 2630000 },
    { id: "5", date: "12 Jan 2025", voucher: "PV-2025-002", type: "PAYMENT", narration: "Food supplies – AMS Suppliers", debit: 0, credit: 185000, balance: 2445000 },
    { id: "6", date: "15 Jan 2025", voucher: "RV-2025-003", type: "RECEIPT", narration: "School fees – Form 3 batch", debit: 290000, credit: 0, balance: 2735000 },
    { id: "7", date: "15 Jan 2025", voucher: "ADD-2025-001", type: "PPE", narration: "Computer Lab Projector – Tech Supplies", debit: 0, credit: 85000, balance: 2650000 },
    { id: "8", date: "18 Jan 2025", voucher: "PV-2025-003", type: "PAYMENT", narration: "Kenya Power – electricity", debit: 0, credit: 38000, balance: 2612000 },
    { id: "9", date: "20 Jan 2025", voucher: "RV-2025-004", type: "RECEIPT", narration: "School fees – Form 4 batch", debit: 410000, credit: 0, balance: 3022000 },
    { id: "10", date: "25 Jan 2025", voucher: "PV-2025-004", type: "PAYMENT", narration: "Water bill – Nairobi Water", debit: 0, credit: 12500, balance: 3009500 },
    { id: "11", date: "28 Jan 2025", voucher: "PV-2025-005", type: "PAYMENT", narration: "Stationery – Tech Supplies Ltd", debit: 0, credit: 45000, balance: 2964500 },
    { id: "12", date: "31 Jan 2025", voucher: "JV-2025-001", type: "JOURNAL", narration: "Interest income – Equity Bank", debit: 15500, credit: 0, balance: 2980000 },
  ],
  "1300": [
    { id: "1", date: "01 Jan 2025", voucher: "OB-2025", type: "OPEN BAL", narration: "Opening balance b/f", debit: 680000, credit: 0, balance: 680000 },
    { id: "2", date: "01 Jan 2025", voucher: "BILL-2025-T1", type: "BILLING", narration: "Term 1 2025 billing – all students", debit: 3240000, credit: 0, balance: 3920000 },
    { id: "3", date: "05 Jan 2025", voucher: "RV-2025-001", type: "RECEIPT", narration: "School fees – Form 1 batch", debit: 0, credit: 450000, balance: 3470000 },
    { id: "4", date: "06 Jan 2025", voucher: "RV-2025-002", type: "RECEIPT", narration: "School fees – Form 2 batch", debit: 0, credit: 380000, balance: 3090000 },
    { id: "5", date: "15 Jan 2025", voucher: "RV-2025-003", type: "RECEIPT", narration: "School fees – Form 3 batch", debit: 0, credit: 290000, balance: 2800000 },
    { id: "6", date: "20 Jan 2025", voucher: "RV-2025-004", type: "RECEIPT", narration: "School fees – Form 4 batch", debit: 0, credit: 410000, balance: 2390000 },
  ],
};

const TYPE_COLORS: Record<string, string> = {
  "OPEN BAL": "bg-gray-100 text-gray-700",
  "RECEIPT": "bg-green-100 text-green-800",
  "PAYMENT": "bg-red-100 text-red-700",
  "JOURNAL": "bg-purple-100 text-purple-700",
  "BILLING": "bg-blue-100 text-blue-700",
  "PPE": "bg-amber-100 text-amber-700",
};

export default function GeneralLedger() {
  const { toast } = useToast();
  const [accountCode, setAccountCode] = useState("1200");
  const [fromPeriod, setFromPeriod] = useState("P01 Jan-25");
  const [toPeriod, setToPeriod] = useState("P01 Jan-25");
  const [results, setResults] = useState<GLEntry[] | null>(null);

  const query = () => {
    const data = GL_DATA[accountCode] ?? [];
    setResults(data);
    toast({ title: `GL loaded — ${data.length} entries` });
  };

  const { page, setPage, pageSize, setPageSize, paginatedItems: paginatedResults, totalPages, from, to, total: totalRows } = usePagination(results ?? []);
  const selectedAccount = ACCOUNTS.find(a => a.code === accountCode);
  const openingBalance = results?.[0]?.balance ? results[0].balance - results[0].debit + results[0].credit : 0;
  const totalDebits = results?.reduce((s, e) => s + e.debit, 0) ?? 0;
  const totalCredits = results?.reduce((s, e) => s + e.credit, 0) ?? 0;
  const closingBalance = results?.length ? results[results.length - 1].balance : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">General Ledger</h1>
          <p className="text-muted-foreground">Inquiry on any account's transaction history and running balance</p>
        </div>
        {results && <Button variant="outline" onClick={() => toast({ title: "Export to Excel — coming soon" })}><Download className="mr-2 h-4 w-4" />Export</Button>}
      </div>

      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-1 flex-1 min-w-[220px]">
              <Label>Account *</Label>
              <Select value={accountCode} onValueChange={v => { setAccountCode(v); setResults(null); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ACCOUNTS.map(a => <SelectItem key={a.code} value={a.code}>{a.code} – {a.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 w-40">
              <Label>From Period</Label>
              <Select value={fromPeriod} onValueChange={setFromPeriod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PERIODS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1 w-40">
              <Label>To Period</Label>
              <Select value={toPeriod} onValueChange={setToPeriod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PERIODS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Button onClick={query}><Search className="mr-2 h-4 w-4" />Run Query</Button>
          </div>
        </CardContent>
      </Card>

      {results && (
        <>
          <div className="grid grid-cols-4 gap-4">
            <Card><CardContent className="pt-4"><div className="text-lg font-bold">{fmt(openingBalance)}</div><div className="text-sm text-muted-foreground">Opening Balance</div></CardContent></Card>
            <Card><CardContent className="pt-4"><div className="text-lg font-bold text-green-700">{fmt(totalDebits)}</div><div className="text-sm text-muted-foreground">Total Debits</div></CardContent></Card>
            <Card><CardContent className="pt-4"><div className="text-lg font-bold text-red-600">{fmt(totalCredits)}</div><div className="text-sm text-muted-foreground">Total Credits</div></CardContent></Card>
            <Card><CardContent className="pt-4"><div className={`text-lg font-bold ${closingBalance < 0 ? "text-red-600" : "text-blue-700"}`}>{fmt(closingBalance)}</div><div className="text-sm text-muted-foreground">Closing Balance</div></CardContent></Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3 flex-wrap gap-2">
              <div className="flex items-center gap-4">
                <CardTitle className="text-base">
                  {accountCode} – {selectedAccount?.name} &nbsp;|&nbsp; {fromPeriod} → {toPeriod}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead><TableHead>Voucher No</TableHead><TableHead>Type</TableHead>
                    <TableHead>Narration</TableHead>
                    <TableHead className="text-right">Debit (KES)</TableHead>
                    <TableHead className="text-right">Credit (KES)</TableHead>
                    <TableHead className="text-right">Balance (KES)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedResults.map(e => (
                    <TableRow key={e.id} className={e.balance < 0 ? "bg-red-50" : ""}>
                      <TableCell className="text-sm">{e.date}</TableCell>
                      <TableCell className="font-mono text-sm">{e.voucher}</TableCell>
                      <TableCell><Badge className={TYPE_COLORS[e.type] ?? "bg-gray-100 text-gray-700"}>{e.type}</Badge></TableCell>
                      <TableCell className="text-sm max-w-[260px] truncate">{e.narration}</TableCell>
                      <TableCell className="text-right text-green-700">{e.debit ? fmt(e.debit) : "—"}</TableCell>
                      <TableCell className="text-right text-red-600">{e.credit ? fmt(e.credit) : "—"}</TableCell>
                      <TableCell className={`text-right font-medium ${e.balance < 0 ? "text-red-600" : ""}`}>{fmt(e.balance)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-bold bg-muted/30 border-t-2">
                    <TableCell colSpan={4}>Totals</TableCell>
                    <TableCell className="text-right text-green-700">{fmt(totalDebits)}</TableCell>
                    <TableCell className="text-right text-red-600">{fmt(totalCredits)}</TableCell>
                    <TableCell className="text-right">{fmt(closingBalance)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              <TablePagination page={page} totalPages={totalPages} from={from} to={to} total={totalRows} onPageChange={setPage} />
            </CardContent>
          </Card>
        </>
      )}

      {!results && (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Search className="h-12 w-12 mb-3 opacity-30" />
          <p className="text-sm">Select an account and period range, then click <strong>Run Query</strong></p>
        </div>
      )}
    </div>
  );
}
