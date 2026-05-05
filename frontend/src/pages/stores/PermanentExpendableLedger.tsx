import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TablePagination } from "@/components/ui/table-pagination";
import { usePagination } from "@/hooks/usePagination";
import { History, Filter, Info, Loader2, Download } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { S2LedgerEntry, S2TxnType, S2Condition } from "@/mock/data";
import { S2LedgerExportDialog, S2ExportFilters } from "@/components/stores/S2LedgerExportDialog";
import { useSchool } from "@/contexts/SchoolContext";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

// ─── Local UI helpers ─────────────────────────────────────────────────────────
type TxnType = S2TxnType;
type Condition = S2Condition;

const TXN_BADGE: Record<TxnType, string> = {
  RECEIPT: "bg-emerald-100 text-emerald-800 border-emerald-200",
  ISSUE: "bg-blue-100 text-blue-800 border-blue-200",
  TRANSFER: "bg-amber-100 text-amber-800 border-amber-200",
  RETURN: "bg-purple-100 text-purple-800 border-purple-200",
  DAMAGE_LOSS: "bg-red-100 text-red-800 border-red-200",
};

const CONDITION_BADGE: Record<Condition, string> = {
  NEW: "bg-emerald-100 text-emerald-800",
  GOOD: "bg-blue-100 text-blue-800",
  FAIR: "bg-amber-100 text-amber-800",
  POOR: "bg-orange-100 text-orange-800",
  DAMAGED: "bg-red-100 text-red-800",
  LOST: "bg-red-200 text-red-900",
  OBSOLETE: "bg-zinc-200 text-zinc-700",
  CONDEMNED: "bg-zinc-300 text-zinc-800",
};

const fmt = (n: number) => n.toLocaleString("en-KE");
const fmtMoney = (n: number | string) => Number(n).toLocaleString("en-KE", { minimumFractionDigits: 2 });

const STORES = [
  { value: "main", label: "Main Store" },
  { value: "science", label: "Science Lab Store" },
  { value: "sports", label: "Sports Store" },
  { value: "boarding", label: "Boarding Store" },
  { value: "workshop", label: "Workshop Store" },
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function PermanentExpendableLedger() {
  const { school } = useSchool();
  const [itemFilter, setItemFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [auditOpenFor, setAuditOpenFor] = useState<string | null>(null);
  const [exportOpen, setExportOpen] = useState(false);

  const { data: txns = [], isLoading, isError } = useQuery({
    queryKey: ["s2-ledger", itemFilter, typeFilter],
    queryFn: () => api.getS2Ledger({ item: itemFilter, type: typeFilter }),
  });

  // Distinct item list — derived from server data so we don't ship a hardcoded list
  const itemOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const t of txns) map.set(t.itemCode, t.itemName);
    return Array.from(map.entries()).map(([code, name]) => ({ code, name }));
  }, [txns]);

  const filtered = txns;
  const { page, setPage, paginatedItems, totalPages, from, to, total } = usePagination(filtered, 12);

  // Summary cards
  const summary = useMemo(() => {
    const itemsOnHand = new Map<string, number>();
    for (const t of txns) itemsOnHand.set(t.itemCode, t.runningBalance);
    const totalUnits = Array.from(itemsOnHand.values()).reduce((s, n) => s + n, 0);
    const valueOnHand = txns.length
      ? Array.from(itemsOnHand.entries()).reduce((s, [code, qty]) => {
          const last = [...txns].reverse().find((x: S2LedgerEntry) => x.itemCode === code);
          return s + qty * Number(last?.unitCost ?? 0);
        }, 0)
      : 0;
    const damageLossCount = txns.filter((t: S2LedgerEntry) => t.txnType === "DAMAGE_LOSS").length;
    return { totalUnits, valueOnHand, items: itemsOnHand.size, damageLossCount };
  }, [txns]);

  const auditTrail = useMemo(() => {
    if (!auditOpenFor) return [];
    return txns.filter((t: S2LedgerEntry) => t.itemCode === auditOpenFor);
  }, [auditOpenFor, txns]);

  // ─── Export helpers ─────────────────────────────────────────────────────────
  const PDF_HEADERS = [
    "Date","Ref No","Type","Item","Category","Unit",
    "Qty Recd","Qty Issued","Balance","Unit Cost","Total Value",
    "Supplier/From","Recipient","Department","Condition","Remarks",
    "Created By","Approved By",
  ];

  const filterRowsForExport = (filters: S2ExportFilters) =>
    txns.filter((t: S2LedgerEntry) => t.date >= filters.dateFrom && t.date <= filters.dateTo);

  const rowToArray = (t: S2LedgerEntry) => [
    t.date, t.refNo, t.txnType.replace("_", "/"),
    `${t.itemCode} — ${t.itemName}`, t.category, t.unit,
    t.qtyReceived || "", t.qtyIssued || "", t.runningBalance,
    fmtMoney(t.unitCost), fmtMoney(t.totalValue),
    t.txnType === "TRANSFER" ? (t.fromDept || "") : t.supplier,
    t.txnType === "TRANSFER" ? (t.toDept || "") : t.recipient,
    t.department, t.condition, t.remarks,
    t.createdBy, t.approvedBy,
  ];

  const handleExportPDF = (filters: S2ExportFilters) => {
    const rows = filterRowsForExport(filters);
    if (!rows.length) {
      toast.error("No transactions in the selected date range");
      return;
    }
    const doc = new jsPDF({ orientation: "landscape", format: "a3" });
    const pageW = doc.internal.pageSize.getWidth();
    let y = 14;

    doc.setFontSize(13); doc.setFont("helvetica", "bold");
    doc.text(school?.name ?? "School", pageW / 2, y, { align: "center" }); y += 7;
    doc.setFontSize(10); doc.setFont("helvetica", "normal");
    doc.text("S2 — Permanent & Expendable Stores Ledger", pageW / 2, y, { align: "center" }); y += 6;
    doc.setFontSize(9);
    doc.text(`Store: ${filters.storeLabel}    Period: ${filters.dateFrom} → ${filters.dateTo}    Rows: ${rows.length}`, pageW / 2, y, { align: "center" }); y += 6;

    autoTable(doc, {
      startY: y,
      head: [PDF_HEADERS],
      body: rows.map(rowToArray),
      styles: { fontSize: 6, cellPadding: 1 },
      headStyles: { fillColor: [109, 40, 217], fontSize: 6 },
    });

    doc.save(`S2_Ledger_${filters.store}_${filters.dateFrom}_${filters.dateTo}.pdf`);
    toast.success("PDF downloaded");
  };

  const handleExportExcel = (filters: S2ExportFilters) => {
    const rows = filterRowsForExport(filters);
    if (!rows.length) {
      toast.error("No transactions in the selected date range");
      return;
    }
    const wb = XLSX.utils.book_new();
    const meta = [
      ["School", school?.name ?? "School"],
      ["Report", "S2 — Permanent & Expendable Stores Ledger"],
      ["Store", filters.storeLabel],
      ["Period", `${filters.dateFrom} → ${filters.dateTo}`],
      ["Rows", rows.length],
      [],
    ];
    const data = [...meta, PDF_HEADERS, ...rows.map(rowToArray)];
    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, "S2 Ledger");
    XLSX.writeFile(wb, `S2_Ledger_${filters.store}_${filters.dateFrom}_${filters.dateTo}.xlsx`);
    toast.success("Excel downloaded");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">S2 — Permanent & Expendable Stores Ledger</h1>
          <p className="text-muted-foreground">Permanent stores, expendable items, and reusable institutional assets</p>
        </div>
        <div className="flex items-center gap-2 self-start">
          <Badge variant="outline" className="bg-muted/30">Read-only ledger view</Badge>
          <Button variant="outline" size="sm" onClick={() => setExportOpen(true)}>
            <Download className="mr-2 h-4 w-4" />Export
          </Button>
        </div>
      </div>

      {/* Read-only notice */}
      <div className="rounded-md border bg-blue-50 border-blue-200 p-3 flex gap-3">
        <Info className="h-4 w-4 text-blue-700 mt-0.5 shrink-0" />
        <div className="text-xs text-blue-900 leading-relaxed">
          This ledger is the system of record for permanent and expendable items — entries are posted automatically from the
          source workflows. Use <span className="font-semibold">Receive Stock (GRN)</span> for receipts, <span className="font-semibold">Issue Stock</span> for issues,
          <span className="font-semibold"> Stock Transfers</span> for department-to-department moves, and <span className="font-semibold">Stock Adjustments</span> for returns
          and damage / loss / obsolete / condemned write-offs. Every posting on those pages whose item has Asset Type
          <span className="font-mono"> Permanent</span> or <span className="font-mono">Expendable</span> lands here.
        </div>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardContent className="pt-4">
          <div className="text-xl font-bold">{summary.items}</div>
          <div className="text-xs text-muted-foreground">Distinct Items Tracked</div>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <div className="text-xl font-bold">{fmt(summary.totalUnits)}</div>
          <div className="text-xs text-muted-foreground">Total Units On Hand</div>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <div className="text-xl font-bold">KES {fmtMoney(summary.valueOnHand)}</div>
          <div className="text-xs text-muted-foreground">Stock Value On Hand</div>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <div className="text-xl font-bold text-red-700">{summary.damageLossCount}</div>
          <div className="text-xs text-muted-foreground">Damage / Loss Records</div>
        </CardContent></Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-3">
          <div className="flex flex-wrap items-center gap-4">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <div className="space-y-1">
              <Label className="text-xs">Item</Label>
              <Select value={itemFilter} onValueChange={setItemFilter}>
                <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All items</SelectItem>
                  {itemOptions.map(i => <SelectItem key={i.code} value={i.code}>{i.code} — {i.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Transaction Type</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All types</SelectItem>
                  <SelectItem value="RECEIPT">Receipt</SelectItem>
                  <SelectItem value="ISSUE">Issue</SelectItem>
                  <SelectItem value="TRANSFER">Transfer</SelectItem>
                  <SelectItem value="RETURN">Return</SelectItem>
                  <SelectItem value="DAMAGE_LOSS">Damage / Loss</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ledger Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>S2 Ledger Transactions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-auto">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-xs">Ref No</TableHead>
                  <TableHead className="text-xs">Type</TableHead>
                  <TableHead className="text-xs">Item</TableHead>
                  <TableHead className="text-xs">Category</TableHead>
                  <TableHead className="text-xs">Unit</TableHead>
                  <TableHead className="text-xs text-right">Qty Recd</TableHead>
                  <TableHead className="text-xs text-right">Qty Issued</TableHead>
                  <TableHead className="text-xs text-right">Balance</TableHead>
                  <TableHead className="text-xs text-right">Unit Cost</TableHead>
                  <TableHead className="text-xs text-right">Total Value</TableHead>
                  <TableHead className="text-xs">Supplier / From</TableHead>
                  <TableHead className="text-xs">Recipient</TableHead>
                  <TableHead className="text-xs">Department</TableHead>
                  <TableHead className="text-xs">Condition</TableHead>
                  <TableHead className="text-xs">Remarks</TableHead>
                  <TableHead className="text-xs">Created By</TableHead>
                  <TableHead className="text-xs">Approved By</TableHead>
                  <TableHead className="text-xs"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedItems.map(t => (
                  <TableRow key={t.id}>
                    <TableCell className="text-xs whitespace-nowrap">{t.date}</TableCell>
                    <TableCell className="text-xs font-mono">{t.refNo}</TableCell>
                    <TableCell><Badge variant="outline" className={TXN_BADGE[t.txnType]}>{t.txnType.replace("_", "/")}</Badge></TableCell>
                    <TableCell className="text-xs">{t.itemCode} — {t.itemName}</TableCell>
                    <TableCell className="text-xs">{t.category}</TableCell>
                    <TableCell className="text-xs">{t.unit}</TableCell>
                    <TableCell className="text-xs text-right text-emerald-700 font-semibold">{t.qtyReceived || "—"}</TableCell>
                    <TableCell className="text-xs text-right text-blue-700 font-semibold">{t.qtyIssued || "—"}</TableCell>
                    <TableCell className="text-xs text-right font-bold bg-muted/20">{t.runningBalance}</TableCell>
                    <TableCell className="text-xs text-right">{fmtMoney(t.unitCost)}</TableCell>
                    <TableCell className="text-xs text-right">{fmtMoney(t.totalValue)}</TableCell>
                    <TableCell className="text-xs">{t.txnType === "TRANSFER" ? t.fromDept : t.supplier}</TableCell>
                    <TableCell className="text-xs">{t.txnType === "TRANSFER" ? t.toDept : t.recipient}</TableCell>
                    <TableCell className="text-xs">{t.department}</TableCell>
                    <TableCell><Badge variant="outline" className={CONDITION_BADGE[t.condition]}>{t.condition}</Badge></TableCell>
                    <TableCell className="text-xs max-w-[220px] truncate" title={t.remarks}>{t.remarks}</TableCell>
                    <TableCell className="text-xs">{t.createdBy}</TableCell>
                    <TableCell className="text-xs">{t.approvedBy}</TableCell>
                    <TableCell><Button variant="ghost" size="sm" onClick={() => setAuditOpenFor(t.itemCode)}><History className="h-3.5 w-3.5" /></Button></TableCell>
                  </TableRow>
                ))}
                {isLoading && (
                  <TableRow><TableCell colSpan={19} className="h-24 text-center text-muted-foreground">
                    <Loader2 className="h-4 w-4 inline mr-2 animate-spin" />Loading S2 ledger…
                  </TableCell></TableRow>
                )}
                {!isLoading && isError && (
                  <TableRow><TableCell colSpan={19} className="h-24 text-center text-red-700">Failed to load S2 ledger from backend.</TableCell></TableRow>
                )}
                {!isLoading && !isError && paginatedItems.length === 0 && (
                  <TableRow><TableCell colSpan={19} className="h-24 text-center text-muted-foreground">No transactions found.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <TablePagination page={page} totalPages={totalPages} from={from} to={to} total={total} onPageChange={setPage} />
        </CardContent>
      </Card>

      {/* Export dialog */}
      <S2LedgerExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        stores={STORES}
        onExportPDF={handleExportPDF}
        onExportExcel={handleExportExcel}
      />

      {/* Audit-trail dialog */}
      {auditOpenFor && (
        <Dialog open={!!auditOpenFor} onOpenChange={(o) => !o && setAuditOpenFor(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Audit Trail — {auditOpenFor}</DialogTitle>
              <DialogDescription>Full transaction history for this item</DialogDescription>
            </DialogHeader>
            <div className="overflow-auto max-h-[60vh]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Date</TableHead>
                    <TableHead className="text-xs">Ref</TableHead>
                    <TableHead className="text-xs">Type</TableHead>
                    <TableHead className="text-xs text-right">In</TableHead>
                    <TableHead className="text-xs text-right">Out</TableHead>
                    <TableHead className="text-xs text-right">Balance</TableHead>
                    <TableHead className="text-xs">Department</TableHead>
                    <TableHead className="text-xs">Condition</TableHead>
                    <TableHead className="text-xs">Created By</TableHead>
                    <TableHead className="text-xs">Approved By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditTrail.map(a => (
                    <TableRow key={a.id}>
                      <TableCell className="text-xs">{a.date}</TableCell>
                      <TableCell className="text-xs font-mono">{a.refNo}</TableCell>
                      <TableCell><Badge variant="outline" className={TXN_BADGE[a.txnType]}>{a.txnType.replace("_", "/")}</Badge></TableCell>
                      <TableCell className="text-xs text-right text-emerald-700">{a.qtyReceived || "—"}</TableCell>
                      <TableCell className="text-xs text-right text-blue-700">{a.qtyIssued || "—"}</TableCell>
                      <TableCell className="text-xs text-right font-bold">{a.runningBalance}</TableCell>
                      <TableCell className="text-xs">{a.department}</TableCell>
                      <TableCell><Badge variant="outline" className={CONDITION_BADGE[a.condition]}>{a.condition}</Badge></TableCell>
                      <TableCell className="text-xs">{a.createdBy}</TableCell>
                      <TableCell className="text-xs">{a.approvedBy}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

