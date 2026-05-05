import { useState } from "react";
import { CheckCircle2, Circle, AlertTriangle, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/ui/table-pagination";

const fmt = (n: number) => new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(n);

interface UnclearedItem { id: string; date: string; voucher: string; narration: string; amount: number; type: "DEPOSIT" | "PAYMENT"; cleared: boolean; }

const INIT_UNCLEARED: UnclearedItem[] = [
  { id: "1", date: "28 Jan 2025", voucher: "RV-2025-004", narration: "School fees – Form 4 batch (EFT lodged 28 Jan)", amount: 410000, type: "DEPOSIT", cleared: false },
  { id: "2", date: "29 Jan 2025", voucher: "PV-2025-005", narration: "Tech Supplies Ltd – cheque #001234", amount: 45000, type: "PAYMENT", cleared: false },
  { id: "3", date: "30 Jan 2025", voucher: "PV-2025-006", narration: "Book Sellers Ltd – cheque #001235", amount: 32000, type: "PAYMENT", cleared: false },
  { id: "4", date: "31 Jan 2025", voucher: "RV-2025-005", narration: "Capitation grant – HELB (lodged 31 Jan)", amount: 180000, type: "DEPOSIT", cleared: false },
  { id: "5", date: "31 Jan 2025", voucher: "PV-2025-007", narration: "Nairobi Water – EFT (processing)", amount: 12500, type: "PAYMENT", cleared: false },
];

export default function BankReconciliation() {
  const { toast } = useToast();
  const [account, setAccount] = useState("1200");
  const [period, setPeriod] = useState("P01 Jan-25");
  const [statementBalance, setStatementBalance] = useState("3540000");
  const [uncleared, setUncleared] = useState<UnclearedItem[]>(INIT_UNCLEARED);
  const [saved, setSaved] = useState(false);

  const toggle = (id: string) => setUncleared(p => p.map(u => u.id === id ? { ...u, cleared: !u.cleared } : u));

  const bookBalance = 2980000; // from GL
  const stmtBal = Number(statementBalance) || 0;

  const unclearedDeposits = uncleared.filter(u => u.type === "DEPOSIT" && !u.cleared).reduce((s, u) => s + u.amount, 0);
  const unclearedPayments = uncleared.filter(u => u.type === "PAYMENT" && !u.cleared).reduce((s, u) => s + u.amount, 0);

  // Adjusted bank balance = Stmt balance - uncleared deposits + uncleared payments
  const adjustedBankBalance = stmtBal - unclearedDeposits + unclearedPayments;
  const difference = bookBalance - adjustedBankBalance;
  const isReconciled = Math.abs(difference) < 1;

  const { page, setPage, pageSize, setPageSize, paginatedItems, totalPages, from, to, total: totalRows } = usePagination(uncleared);

  const save = () => {
    setSaved(true);
    toast({ title: isReconciled ? "Reconciliation saved — RECONCILED" : "Reconciliation saved with difference — review required", variant: isReconciled ? "default" : "destructive" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bank Reconciliation</h1>
          <p className="text-muted-foreground">Reconcile GL bank balance against bank statement</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => toast({ title: "Export — coming soon" })}><Download className="mr-2 h-4 w-4" />Export</Button>
          <Button onClick={save} className={isReconciled ? "" : "bg-amber-600 hover:bg-amber-700"}>Save Reconciliation</Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-1 w-52">
              <Label>Bank Account</Label>
              <Select value={account} onValueChange={setAccount}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1200">1200 – Equity Bank</SelectItem>
                  <SelectItem value="1201">1201 – KCB Bank</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 w-40">
              <Label>Period</Label>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="P01 Jan-25">P01 Jan-25</SelectItem>
                  <SelectItem value="P02 Feb-25">P02 Feb-25</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 w-52">
              <Label>Bank Statement Closing Balance (KES)</Label>
              <Input type="number" value={statementBalance} onChange={e => setStatementBalance(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-6">
        {/* Reconciliation Summary */}
        <Card>
          <CardHeader><CardTitle className="text-base">Reconciliation Statement</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between font-medium">
              <span>Balance as per Bank Statement</span>
              <span>{fmt(stmtBal)}</span>
            </div>
            <Separator />
            <div className="space-y-1">
              <div className="text-muted-foreground text-xs uppercase tracking-wide">Less: Uncleared Deposits (in books, not in bank)</div>
              {uncleared.filter(u => u.type === "DEPOSIT" && !u.cleared).map(u => (
                <div key={u.id} className="flex justify-between pl-3 text-red-600">
                  <span className="truncate max-w-[220px]">{u.narration}</span>
                  <span>({fmt(u.amount)})</span>
                </div>
              ))}
              {uncleared.filter(u => u.type === "DEPOSIT" && !u.cleared).length === 0 && <div className="pl-3 text-muted-foreground">None</div>}
            </div>
            <div className="space-y-1">
              <div className="text-muted-foreground text-xs uppercase tracking-wide">Add: Uncleared Payments (in books, not in bank)</div>
              {uncleared.filter(u => u.type === "PAYMENT" && !u.cleared).map(u => (
                <div key={u.id} className="flex justify-between pl-3 text-green-700">
                  <span className="truncate max-w-[220px]">{u.narration}</span>
                  <span>{fmt(u.amount)}</span>
                </div>
              ))}
              {uncleared.filter(u => u.type === "PAYMENT" && !u.cleared).length === 0 && <div className="pl-3 text-muted-foreground">None</div>}
            </div>
            <Separator />
            <div className="flex justify-between font-semibold">
              <span>Adjusted Bank Balance</span>
              <span>{fmt(adjustedBankBalance)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-semibold">
              <span>Balance as per GL (Book Balance)</span>
              <span>{fmt(bookBalance)}</span>
            </div>
            <Separator />
            <div className={`flex justify-between font-bold text-base ${isReconciled ? "text-green-700" : "text-red-600"}`}>
              <span>Difference</span>
              <span>{isReconciled ? "NIL — RECONCILED" : fmt(Math.abs(difference))}</span>
            </div>
            {isReconciled && (
              <div className="flex items-center gap-2 text-green-700 bg-green-50 rounded p-2">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm font-medium">Bank reconciliation is balanced</span>
              </div>
            )}
            {!isReconciled && (
              <div className="flex items-center gap-2 text-amber-700 bg-amber-50 rounded p-2">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm">Unreconciled difference of {fmt(Math.abs(difference))} — review uncleared items</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status Summary */}
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-4 grid grid-cols-2 gap-4">
              <div>
                <div className="text-lg font-bold text-blue-700">{fmt(bookBalance)}</div>
                <div className="text-sm text-muted-foreground">GL Book Balance</div>
              </div>
              <div>
                <div className="text-lg font-bold">{fmt(stmtBal)}</div>
                <div className="text-sm text-muted-foreground">Bank Statement Balance</div>
              </div>
              <div>
                <div className="text-lg font-bold text-red-600">{fmt(unclearedDeposits)}</div>
                <div className="text-sm text-muted-foreground">Uncleared Deposits</div>
              </div>
              <div>
                <div className="text-lg font-bold text-amber-600">{fmt(unclearedPayments)}</div>
                <div className="text-sm text-muted-foreground">Outstanding Cheques</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-sm text-muted-foreground mb-2">Reconciliation Status</div>
              {isReconciled
                ? <Badge className="bg-green-100 text-green-800 text-sm px-3 py-1">RECONCILED</Badge>
                : <Badge className="bg-amber-100 text-amber-800 text-sm px-3 py-1">IN PROGRESS</Badge>
              }
              {saved && <div className="mt-2 text-xs text-muted-foreground">Last saved: {new Date().toLocaleTimeString("en-KE")}</div>}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Uncleared Items Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-4">
            <CardTitle className="text-base">Uncleared Items — Mark as Cleared when confirmed on bank statement</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">Cleared</TableHead>
                <TableHead>Date</TableHead><TableHead>Voucher</TableHead>
                <TableHead>Type</TableHead><TableHead>Narration</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedItems.map(u => (
                <TableRow key={u.id} className={u.cleared ? "opacity-50 bg-muted/30" : ""}>
                  <TableCell>
                    <button onClick={() => toggle(u.id)} className="text-muted-foreground hover:text-foreground">
                      {u.cleared ? <CheckCircle2 className="h-5 w-5 text-green-600" /> : <Circle className="h-5 w-5" />}
                    </button>
                  </TableCell>
                  <TableCell className="text-sm">{u.date}</TableCell>
                  <TableCell className="font-mono text-sm">{u.voucher}</TableCell>
                  <TableCell>
                    <Badge className={u.type === "DEPOSIT" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-700"}>
                      {u.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{u.narration}</TableCell>
                  <TableCell className={`text-right font-medium ${u.type === "DEPOSIT" ? "text-green-700" : "text-red-600"}`}>
                    {u.type === "DEPOSIT" ? "+" : "−"}{fmt(u.amount)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination page={page} totalPages={totalPages} from={from} to={to} total={totalRows} onPageChange={setPage} />
        </CardContent>
      </Card>
    </div>
  );
}
