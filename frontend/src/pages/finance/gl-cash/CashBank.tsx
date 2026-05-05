import { useState } from "react";
import { Download, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/ui/table-pagination";

const fmt = (n: number) => new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(n);

const PERIODS = ["P01 Jan-25", "P02 Feb-25", "P12 Jun-24", "P11 May-24"];

interface BookEntry { id: string; date: string; voucher: string; type: string; narration: string; receipts: number; payments: number; balance: number; }

const EQUITY_ENTRIES: BookEntry[] = [
  { id: "1", date: "01 Jan 2025", voucher: "OB-2025", type: "OPEN BAL", narration: "Opening balance b/f", receipts: 2850000, payments: 0, balance: 2850000 },
  { id: "2", date: "05 Jan 2025", voucher: "RV-2025-001", type: "RECEIPT", narration: "School fees – Form 1 batch (140 students)", receipts: 450000, payments: 0, balance: 3300000 },
  { id: "3", date: "06 Jan 2025", voucher: "RV-2025-002", type: "RECEIPT", narration: "School fees – Form 2 batch (120 students)", receipts: 380000, payments: 0, balance: 3680000 },
  { id: "4", date: "10 Jan 2025", voucher: "PV-2025-001", type: "PAYMENT", narration: "January salaries – teaching & non-teaching staff", receipts: 0, payments: 1050000, balance: 2630000 },
  { id: "5", date: "12 Jan 2025", voucher: "PV-2025-002", type: "PAYMENT", narration: "AMS Suppliers – food supplies inv INV-AMS-0891", receipts: 0, payments: 185000, balance: 2445000 },
  { id: "6", date: "15 Jan 2025", voucher: "RV-2025-003", type: "RECEIPT", narration: "School fees – Form 3 batch (95 students)", receipts: 290000, payments: 0, balance: 2735000 },
  { id: "7", date: "15 Jan 2025", voucher: "ADD-2025-001", type: "PAYMENT", narration: "Computer Lab Projector – Tech Supplies Ltd", receipts: 0, payments: 85000, balance: 2650000 },
  { id: "8", date: "18 Jan 2025", voucher: "PV-2025-003", type: "PAYMENT", narration: "Kenya Power – electricity Jan 2025", receipts: 0, payments: 38000, balance: 2612000 },
  { id: "9", date: "20 Jan 2025", voucher: "RV-2025-004", type: "RECEIPT", narration: "School fees – Form 4 batch (130 students)", receipts: 410000, payments: 0, balance: 3022000 },
  { id: "10", date: "25 Jan 2025", voucher: "PV-2025-004", type: "PAYMENT", narration: "Nairobi Water – water bill Jan 2025", receipts: 0, payments: 12500, balance: 3009500 },
  { id: "11", date: "28 Jan 2025", voucher: "PV-2025-005", type: "PAYMENT", narration: "Tech Supplies Ltd – stationery & office", receipts: 0, payments: 45000, balance: 2964500 },
  { id: "12", date: "31 Jan 2025", voucher: "JV-2025-001", type: "JOURNAL", narration: "Interest income – Equity Bank Jan 2025", receipts: 15500, payments: 0, balance: 2980000 },
];

const KCB_ENTRIES: BookEntry[] = [
  { id: "1", date: "01 Jan 2025", voucher: "OB-2025", type: "OPEN BAL", narration: "Opening balance b/f", receipts: 520000, payments: 0, balance: 520000 },
  { id: "2", date: "08 Jan 2025", voucher: "RV-2025-005", type: "RECEIPT", narration: "HELB capitation grant – Term 1 2025", receipts: 320000, payments: 0, balance: 840000 },
  { id: "3", date: "15 Jan 2025", voucher: "PV-2025-006", type: "PAYMENT", narration: "Sports Gear Ltd – sports equipment", receipts: 0, payments: 65000, balance: 775000 },
  { id: "4", date: "22 Jan 2025", voucher: "PV-2025-007", type: "PAYMENT", narration: "Book Sellers Ltd – library books", receipts: 0, payments: 92000, balance: 683000 },
  { id: "5", date: "31 Jan 2025", voucher: "JV-2025-002", type: "JOURNAL", narration: "Bank charges – KCB Jan 2025", receipts: 0, payments: 3500, balance: 679500 },
];

const CASH_ENTRIES: BookEntry[] = [
  { id: "1", date: "01 Jan 2025", voucher: "OB-2025", type: "OPEN BAL", narration: "Opening balance b/f", receipts: 85000, payments: 0, balance: 85000 },
  { id: "2", date: "07 Jan 2025", voucher: "RV-2025-006", type: "RECEIPT", narration: "Miscellaneous fees – school ID cards", receipts: 12000, payments: 0, balance: 97000 },
  { id: "3", date: "10 Jan 2025", voucher: "PV-2025-008", type: "PAYMENT", narration: "Petty cash – cleaning supplies", receipts: 0, payments: 8500, balance: 88500 },
  { id: "4", date: "18 Jan 2025", voucher: "PV-2025-009", type: "PAYMENT", narration: "Petty cash – courier & postage", receipts: 0, payments: 2200, balance: 86300 },
  { id: "5", date: "25 Jan 2025", voucher: "PV-2025-010", type: "PAYMENT", narration: "Petty cash – refreshments (staff meeting)", receipts: 0, payments: 4800, balance: 81500 },
  { id: "6", date: "31 Jan 2025", voucher: "CV-2025-001", type: "CONTRA", narration: "Cash transferred to Equity Bank", receipts: 0, payments: 30000, balance: 51500 },
];

const TYPE_BADGE: Record<string, string> = {
  "OPEN BAL": "bg-gray-100 text-gray-700",
  "RECEIPT": "bg-green-100 text-green-800",
  "PAYMENT": "bg-red-100 text-red-700",
  "JOURNAL": "bg-purple-100 text-purple-700",
  "CONTRA": "bg-blue-100 text-blue-700",
};

function BookTable({ entries }: { entries: BookEntry[] }) {
  const totalReceipts = entries.filter(e => e.type !== "OPEN BAL").reduce((s, e) => s + e.receipts, 0);
  const totalPayments = entries.reduce((s, e) => s + e.payments, 0);
  const closingBalance = entries.length ? entries[entries.length - 1].balance : 0;
  const { page, setPage, pageSize, setPageSize, paginatedItems, totalPages, from, to, total: totalRows } = usePagination(entries);

  return (
    <>
      <div className="flex items-center gap-2 px-4 py-2 border-b">
        <span className="text-sm text-muted-foreground whitespace-nowrap">Show</span>
        <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
          <SelectTrigger className="w-20 h-8"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="25">25</SelectItem>
            <SelectItem value="50">50</SelectItem>
            <SelectItem value="100">100</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">entries</span>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead><TableHead>Voucher</TableHead><TableHead>Type</TableHead>
            <TableHead>Narration</TableHead>
            <TableHead className="text-right">Receipts</TableHead>
            <TableHead className="text-right">Payments</TableHead>
            <TableHead className="text-right">Balance</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedItems.map(e => (
            <TableRow key={e.id}>
              <TableCell className="text-sm">{e.date}</TableCell>
              <TableCell className="font-mono text-sm">{e.voucher}</TableCell>
              <TableCell><Badge className={TYPE_BADGE[e.type] ?? "bg-gray-100"}>{e.type}</Badge></TableCell>
              <TableCell className="text-sm max-w-[280px] truncate">{e.narration}</TableCell>
              <TableCell className="text-right text-green-700">{e.receipts ? fmt(e.receipts) : "—"}</TableCell>
              <TableCell className="text-right text-red-600">{e.payments ? fmt(e.payments) : "—"}</TableCell>
              <TableCell className="text-right font-medium">{fmt(e.balance)}</TableCell>
            </TableRow>
          ))}
          <TableRow className="font-bold bg-muted/30 border-t-2">
            <TableCell colSpan={4}>Totals</TableCell>
            <TableCell className="text-right text-green-700">{fmt(totalReceipts)}</TableCell>
            <TableCell className="text-right text-red-600">{fmt(totalPayments)}</TableCell>
            <TableCell className="text-right">{fmt(closingBalance)}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <TablePagination page={page} totalPages={totalPages} from={from} to={to} total={totalRows} onPageChange={setPage} />
    </>
  );
}

function BalanceCard({ label, amount, sub }: { label: string; amount: number; sub?: string }) {
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="text-xl font-bold text-blue-700">{fmt(amount)}</div>
        <div className="text-sm font-medium">{label}</div>
        {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
      </CardContent>
    </Card>
  );
}

export default function CashBank() {
  const { toast } = useToast();
  const [period, setPeriod] = useState("P01 Jan-25");

  const equityClose = EQUITY_ENTRIES[EQUITY_ENTRIES.length - 1].balance;
  const kcbClose = KCB_ENTRIES[KCB_ENTRIES.length - 1].balance;
  const cashClose = CASH_ENTRIES[CASH_ENTRIES.length - 1].balance;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cash & Bank Book</h1>
          <p className="text-muted-foreground">View all cash and bank account movements by period</p>
        </div>
        <div className="flex gap-2 items-end">
          <div className="space-y-1">
            <Label className="text-xs">Period</Label>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>{PERIODS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Button variant="outline" onClick={() => toast({ title: "Export — coming soon" })}><Download className="mr-2 h-4 w-4" />Export</Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <BalanceCard label="Equity Bank" amount={equityClose} sub="Account 1200" />
        <BalanceCard label="KCB Bank" amount={kcbClose} sub="Account 1201" />
        <BalanceCard label="Cash on Hand" amount={cashClose} sub="Account 1100" />
        <Card>
          <CardContent className="pt-4">
            <div className="text-xl font-bold">{fmt(equityClose + kcbClose + cashClose)}</div>
            <div className="text-sm font-medium">Total Cash & Bank</div>
            <div className="text-xs text-muted-foreground">All accounts combined</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="equity">
        <TabsList>
          <TabsTrigger value="equity">Equity Bank (1200)</TabsTrigger>
          <TabsTrigger value="kcb">KCB Bank (1201)</TabsTrigger>
          <TabsTrigger value="cash">Cash on Hand (1100)</TabsTrigger>
        </TabsList>

        <TabsContent value="equity">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Equity Bank – {period}</CardTitle>
                <div className="flex gap-4 text-sm">
                  <span className="flex items-center gap-1 text-green-700"><TrendingUp className="h-3.5 w-3.5" />{fmt(EQUITY_ENTRIES.filter(e => e.type !== "OPEN BAL").reduce((s, e) => s + e.receipts, 0))} in</span>
                  <span className="flex items-center gap-1 text-red-600"><TrendingDown className="h-3.5 w-3.5" />{fmt(EQUITY_ENTRIES.reduce((s, e) => s + e.payments, 0))} out</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0"><BookTable entries={EQUITY_ENTRIES} /></CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="kcb">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">KCB Bank – {period}</CardTitle>
                <div className="flex gap-4 text-sm">
                  <span className="flex items-center gap-1 text-green-700"><TrendingUp className="h-3.5 w-3.5" />{fmt(KCB_ENTRIES.filter(e => e.type !== "OPEN BAL").reduce((s, e) => s + e.receipts, 0))} in</span>
                  <span className="flex items-center gap-1 text-red-600"><TrendingDown className="h-3.5 w-3.5" />{fmt(KCB_ENTRIES.reduce((s, e) => s + e.payments, 0))} out</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0"><BookTable entries={KCB_ENTRIES} /></CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cash">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Cash on Hand – {period}</CardTitle>
                <div className="flex gap-4 text-sm">
                  <span className="flex items-center gap-1 text-green-700"><TrendingUp className="h-3.5 w-3.5" />{fmt(CASH_ENTRIES.filter(e => e.type !== "OPEN BAL").reduce((s, e) => s + e.receipts, 0))} in</span>
                  <span className="flex items-center gap-1 text-red-600"><TrendingDown className="h-3.5 w-3.5" />{fmt(CASH_ENTRIES.reduce((s, e) => s + e.payments, 0))} out</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0"><BookTable entries={CASH_ENTRIES} /></CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
