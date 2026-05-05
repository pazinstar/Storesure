import { useState } from "react";
import { RefreshCw, Download, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/ui/table-pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const fmt = (n: number) => new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(n);

interface AgeRow { supplier: string; current: number; days31_60: number; days61_90: number; days90plus: number; total: number; invoices: { no: string; date: string; amount: number; due: string; days: number }[]; }

const DATA: AgeRow[] = [
  {
    supplier: "Unga Holdings Ltd", current: 95000, days31_60: 145000, days61_90: 0, days90plus: 0, total: 240000,
    invoices: [{ no: "INV-2025-006", date: "15 Jan 2025", amount: 95000, due: "14 Feb 2025", days: 14 }, { no: "INV-2025-001", date: "02 Jan 2025", amount: 145000, due: "01 Feb 2025", days: 45 }],
  },
  {
    supplier: "AMS Suppliers", current: 34000, days31_60: 67000, days61_90: 0, days90plus: 0, total: 101000,
    invoices: [{ no: "INV-2025-007", date: "18 Jan 2025", amount: 34000, due: "17 Feb 2025", days: 11 }, { no: "INV-2025-002", date: "05 Jan 2025", amount: 67000, due: "04 Feb 2025", days: 42 }],
  },
  {
    supplier: "Book Sellers Ltd", current: 70000, days31_60: 0, days61_90: 0, days90plus: 0, total: 70000,
    invoices: [{ no: "INV-2025-003", date: "08 Jan 2025", amount: 42000, due: "07 Feb 2025", days: 24 }, { no: "INV-2025-008", date: "20 Jan 2025", amount: 28000, due: "19 Feb 2025", days: 11 }],
  },
  {
    supplier: "Kenya Power & Lighting", current: 0, days31_60: 21275, days61_90: 0, days90plus: 0, total: 21275,
    invoices: [{ no: "INV-2025-004", date: "10 Jan 2025", amount: 21275, due: "10 Feb 2025", days: 32 }],
  },
  {
    supplier: "Plumbers & Co.", current: 8500, days31_60: 0, days61_90: 0, days90plus: 0, total: 8500,
    invoices: [{ no: "INV-2025-005", date: "12 Jan 2025", amount: 8500, due: "11 Feb 2025", days: 20 }],
  },
];

const TOTALS = {
  current: DATA.reduce((s, r) => s + r.current, 0),
  days31_60: DATA.reduce((s, r) => s + r.days31_60, 0),
  days61_90: DATA.reduce((s, r) => s + r.days61_90, 0),
  days90plus: DATA.reduce((s, r) => s + r.days90plus, 0),
  total: DATA.reduce((s, r) => s + r.total, 0),
};

export default function CreditorAgeing() {
  const { toast } = useToast();
  const [asOf, setAsOf] = useState("2025-02-28");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = (s: string) => setExpanded(prev => { const n = new Set(prev); n.has(s) ? n.delete(s) : n.add(s); return n; });

  const overdueTotal = TOTALS.days31_60 + TOTALS.days61_90 + TOTALS.days90plus;
  const overduePct = Math.round((overdueTotal / TOTALS.total) * 100);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Creditor Ageing</h1>
          <p className="text-muted-foreground">Outstanding accounts payable aged by supplier</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">As at:</span>
            <Input type="date" className="w-40" value={asOf} onChange={e => setAsOf(e.target.value)} />
          </div>
          <Button variant="outline" onClick={() => toast({ title: "Ageing refreshed" })}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>
          <Button variant="outline" onClick={() => toast({ title: "Exporting to Excel..." })}><Download className="mr-2 h-4 w-4" />Export</Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card><CardContent className="pt-4"><div className="text-xl font-bold">{fmt(TOTALS.total)}</div><div className="text-sm text-muted-foreground">Total Outstanding</div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="text-xl font-bold text-green-700">{fmt(TOTALS.current)}</div><div className="text-sm text-muted-foreground">Current (0–30 days)</div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="text-xl font-bold text-amber-600">{fmt(overdueTotal)}</div><div className="text-sm text-muted-foreground">Overdue (31+ days)</div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="text-xl font-bold text-red-600">{overduePct}%</div><div className="text-sm text-muted-foreground">% Overdue</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Ageing Analysis — as at {new Date(asOf).toLocaleDateString("en-KE", { day: "2-digit", month: "short", year: "numeric" })}</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8"></TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead className="text-right">Current (0–30)</TableHead>
                <TableHead className="text-right bg-amber-50">31–60 Days</TableHead>
                <TableHead className="text-right bg-orange-50">61–90 Days</TableHead>
                <TableHead className="text-right bg-red-50">90+ Days</TableHead>
                <TableHead className="text-right font-bold">Total Outstanding</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {DATA.map(row => (
                <>
                  <TableRow key={row.supplier} className="cursor-pointer hover:bg-muted/50" onClick={() => toggle(row.supplier)}>
                    <TableCell>{expanded.has(row.supplier) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}</TableCell>
                    <TableCell className="font-medium">{row.supplier}</TableCell>
                    <TableCell className="text-right">{row.current ? fmt(row.current) : "—"}</TableCell>
                    <TableCell className={`text-right bg-amber-50 ${row.days31_60 ? "text-amber-700 font-medium" : ""}`}>{row.days31_60 ? fmt(row.days31_60) : "—"}</TableCell>
                    <TableCell className={`text-right bg-orange-50 ${row.days61_90 ? "text-orange-700 font-medium" : ""}`}>{row.days61_90 ? fmt(row.days61_90) : "—"}</TableCell>
                    <TableCell className={`text-right bg-red-50 ${row.days90plus ? "text-red-700 font-bold" : ""}`}>{row.days90plus ? fmt(row.days90plus) : "—"}</TableCell>
                    <TableCell className="text-right font-bold">{fmt(row.total)}</TableCell>
                  </TableRow>
                  {expanded.has(row.supplier) && (
                    <TableRow key={`${row.supplier}-detail`}>
                      <TableCell colSpan={7} className="p-0 bg-muted/20">
                        <div className="px-8 py-3">
                          <Table>
                            <TableHeader><TableRow><TableHead>Invoice No</TableHead><TableHead>Invoice Date</TableHead><TableHead>Due Date</TableHead><TableHead className="text-right">Amount</TableHead><TableHead className="text-right">Age (days)</TableHead></TableRow></TableHeader>
                            <TableBody>
                              {row.invoices.map(inv => (
                                <TableRow key={inv.no}>
                                  <TableCell className="font-mono text-sm">{inv.no}</TableCell>
                                  <TableCell className="text-sm">{inv.date}</TableCell>
                                  <TableCell className="text-sm">{inv.due}</TableCell>
                                  <TableCell className="text-right">{fmt(inv.amount)}</TableCell>
                                  <TableCell className={`text-right font-medium ${inv.days > 60 ? "text-red-600" : inv.days > 30 ? "text-amber-600" : "text-green-600"}`}>{inv.days}</TableCell>
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
              <TableRow className="font-bold border-t-2 bg-muted/30">
                <TableCell></TableCell>
                <TableCell>TOTAL</TableCell>
                <TableCell className="text-right">{fmt(TOTALS.current)}</TableCell>
                <TableCell className="text-right bg-amber-50 text-amber-700">{fmt(TOTALS.days31_60)}</TableCell>
                <TableCell className="text-right bg-orange-50">{fmt(TOTALS.days61_90)}</TableCell>
                <TableCell className="text-right bg-red-50">{fmt(TOTALS.days90plus)}</TableCell>
                <TableCell className="text-right">{fmt(TOTALS.total)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
