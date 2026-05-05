import { useState, Fragment } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Download,
  Printer,
  FileSpreadsheet,
  BookOpen,
  ArrowDownToLine,
  ArrowUpFromLine,
  Scale,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { LedgerExportDialog, LedgerExportFilters } from "@/components/stores/LedgerExportDialog";
import { ConsumablesLedgerPrintTemplate, LedgerTransaction } from "@/components/prints/ConsumablesLedgerPrintTemplate";
import PrintDialog from "@/components/prints/PrintDialog";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";

import { ConsumableLedgerItem, ConsumableLedgerReceipt, ConsumableLedgerIssue } from "@/mock/data";

const months = [
  { value: "2024-01", label: "January 2024" },
  { value: "2024-02", label: "February 2024" },
  { value: "2023-12", label: "December 2023" },
  { value: "2023-11", label: "November 2023" },
];

const stores = [
  { value: "main", label: "Main Store" },
  { value: "science", label: "Science Lab Store" },
  { value: "sports", label: "Sports Store" },
  { value: "kitchen", label: "Kitchen Store" },
];

// Extract items for filter dropdown
const allItems = [
  { code: "STA-001", name: "A4 Paper Reams" },
  { code: "STA-002", name: "Blue Ballpoint Pens" },
  { code: "STA-003", name: "Manila Paper (Assorted)" },
  { code: "CLN-001", name: "Toilet Paper Rolls" },
  { code: "CLN-002", name: "Liquid Soap (5L)" },
  { code: "LAB-001", name: "HCL Acid (500ml)" },
];

export default function ConsumablesLedger() {
  const [selectedMonth, setSelectedMonth] = useState("2024-01");
  const [selectedStore, setSelectedStore] = useState("main");
  const [selectedItem, setSelectedItem] = useState<string>("STA-001");
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [printData, setPrintData] = useState<{
    transactions: LedgerTransaction[];
    filters: LedgerExportFilters;
    totals: { received: number; issued: number; closing: number };
  } | null>(null);
  const [auditMode, setAuditMode] = useState(false);

  const { data: fullLedgerData = [], isLoading } = useQuery({
    queryKey: ['consumables-ledger', selectedMonth, selectedStore],
    queryFn: () => api.getConsumablesLedger(selectedMonth, selectedStore)
  });

  const ledgerData = fullLedgerData;

  const totals = ledgerData.reduce(
    (acc, item) => ({
      openingValue: acc.openingValue + Number(item.openingValue || 0),
      receiptsValue: acc.receiptsValue + Number(item.totalReceiptsValue || 0),
      issuesValue: acc.issuesValue + Number(item.totalIssuesValue || 0),
      closingValue: acc.closingValue + Number(item.closingValue || 0),
    }),
    { openingValue: 0, receiptsValue: 0, issuesValue: 0, closingValue: 0 }
  );

  const selectedMonthLabel = months.find(m => m.value === selectedMonth)?.label || selectedMonth;
  const selectedStoreLabel = stores.find(s => s.value === selectedStore)?.label || selectedStore;

  // Generate transaction data for a specific item
  const generateItemTransactions = (itemCode: string, monthValue: string): {
    transactions: LedgerTransaction[];
    totalReceived: number;
    totalIssued: number;
    closingBalance: number;
  } => {
    const itemData = fullLedgerData.find((i: ConsumableLedgerItem) => i.itemCode === itemCode);
    if (!itemData) {
      return { transactions: [], totalReceived: 0, totalIssued: 0, closingBalance: 0 };
    }

    const transactions: LedgerTransaction[] = [];
    let runningBalance = itemData.openingQty;

    // Opening balance row
    transactions.push({
      date: format(new Date(monthValue + "-01"), "dd-MM-yyyy"),
      fromTo: "Opening Balance",
      rate: null,
      grnNo: null,
      reqNo: null,
      unit: itemData.unit,
      received: null,
      issued: null,
      balance: runningBalance,
      signature: "-",
    });

    // Combine and sort all transactions by date
    const allTx: Array<
      | { date: string; type: "receipt"; data: ConsumableLedgerReceipt }
      | { date: string; type: "issue"; data: ConsumableLedgerIssue }
    > = [
      ...itemData.receipts.map(r => ({ date: r.date, type: "receipt" as const, data: r })),
      ...itemData.issues.map(i => ({ date: i.date, type: "issue" as const, data: i })),
    ].sort((a, b) => a.date.localeCompare(b.date));

    for (const tx of allTx) {
      if (tx.type === "receipt") {
        runningBalance += tx.data.qty;
        transactions.push({
          date: format(new Date(tx.data.date), "dd-MM-yyyy"),
          fromTo: "Supplier Receipt",
          rate: tx.data.unitCost,
          grnNo: tx.data.grnNo,
          reqNo: null,
          unit: itemData.unit,
          received: tx.data.qty,
          issued: null,
          balance: runningBalance,
          signature: "3/3 Committee ✓",
        });
      } else {
        runningBalance -= tx.data.qty;
        transactions.push({
          date: format(new Date(tx.data.date), "dd-MM-yyyy"),
          fromTo: tx.data.dept,
          rate: null,
          grnNo: null,
          reqNo: tx.data.s13No,
          unit: itemData.unit,
          received: null,
          issued: tx.data.qty,
          balance: runningBalance,
          signature: "SK ✓ | REC ✓",
        });
      }
    }

    return {
      transactions,
      totalReceived: itemData.totalReceiptsQty,
      totalIssued: itemData.totalIssuesQty,
      closingBalance: itemData.closingQty,
    };
  };

  const handleExportPDF = (filters: LedgerExportFilters) => {
    const result = generateItemTransactions(filters.item, filters.month);
    setPrintData({
      transactions: result.transactions,
      filters,
      totals: {
        received: result.totalReceived,
        issued: result.totalIssued,
        closing: result.closingBalance,
      },
    });
    setShowPrintDialog(true);
  };

  const handleExportExcel = (filters: LedgerExportFilters) => {
    const result = generateItemTransactions(filters.item, filters.month);

    // Generate CSV content
    const headers = ["Date", "From/To", "Rate", "GRN No", "Req No", "Unit", "Received", "Issued", "Balance", "Signature"];
    const rows = result.transactions.map(tx => [
      tx.date,
      tx.fromTo,
      tx.rate ?? "",
      tx.grnNo ?? "",
      tx.reqNo ?? "",
      tx.unit,
      tx.received ?? "",
      tx.issued ?? "",
      tx.balance,
      tx.signature,
    ]);

    const csvContent = [
      `"Receipt and Issues - Consumables Stores Ledger"`,
      `"Store: ${filters.storeLabel}"`,
      `"Item: ${filters.itemLabel}"`,
      `"Period: ${filters.monthLabel}"`,
      "",
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(",")),
      "",
      `"Total Receipts: ${result.totalReceived}","Total Issues: ${result.totalIssued}","Closing Balance: ${result.closingBalance}"`,
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `consumables-ledger-${filters.item}-${filters.month}.csv`;
    link.click();
    toast.success("Excel file exported successfully");
  };

  return (
    <div className="flex-1 space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Consumables Stores Ledger</h1>
          <p className="text-muted-foreground mt-1">
            Monthly inventory movements for audit compliance
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => setShowExportDialog(true)}>
            <Printer className="h-4 w-4" />
            Print
          </Button>
          <Button className="gap-2" onClick={() => setShowExportDialog(true)}>
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Export Dialog */}
      <LedgerExportDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        stores={stores}
        items={allItems}
        months={months}
        onExportPDF={handleExportPDF}
        onExportExcel={handleExportExcel}
      />

      {/* Print Dialog */}
      {printData && (
        <PrintDialog
          open={showPrintDialog}
          onOpenChange={setShowPrintDialog}
          title="Consumables Stores Ledger"
        >
          <ConsumablesLedgerPrintTemplate
            schoolName="Greenwood High School"
            storeName={printData.filters.storeLabel}
            itemName={printData.filters.itemLabel}
            period={printData.filters.monthLabel}
            transactions={printData.transactions}
            totalReceived={printData.totals.received}
            totalIssued={printData.totals.issued}
            closingBalance={printData.totals.closing}
            auditMode={auditMode}
          />
        </PrintDialog>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <Scale className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Opening Balance</p>
                <p className="text-2xl font-bold text-foreground">
                  KES {totals.openingValue.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                <ArrowDownToLine className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Receipts (S11)</p>
                <p className="text-2xl font-bold text-success">
                  KES {totals.receiptsValue.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <ArrowUpFromLine className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Issues (S13)</p>
                <p className="text-2xl font-bold text-primary">
                  KES {totals.issuesValue.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                <FileSpreadsheet className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Closing Balance</p>
                <p className="text-2xl font-bold text-foreground">
                  KES {totals.closingValue.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ledger Report Header */}
      <Card className="print:shadow-none">
        <CardHeader className="border-b border-border bg-muted/50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">
                CONSUMABLES STORES LEDGER
              </CardTitle>
              <CardDescription className="mt-1">
                {selectedStoreLabel} • {selectedMonthLabel}
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-xs">
              {ledgerData.length} Items
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {!auditMode ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="font-semibold">Item Code</TableHead>
                    <TableHead className="font-semibold">Item Description</TableHead>
                    <TableHead className="font-semibold">Unit</TableHead>
                    <TableHead className="text-right font-semibold">Opening Qty</TableHead>
                    <TableHead className="text-right font-semibold">Opening Value (KES)</TableHead>
                    <TableHead className="text-right font-semibold text-success">Receipts Qty</TableHead>
                    <TableHead className="text-right font-semibold text-success">Receipts Value (KES)</TableHead>
                    <TableHead className="text-right font-semibold text-primary">Issues Qty</TableHead>
                    <TableHead className="text-right font-semibold text-primary">Issues Value (KES)</TableHead>
                    <TableHead className="text-right font-semibold">Closing Qty</TableHead>
                    <TableHead className="text-right font-semibold">Closing Value (KES)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ledgerData.map((item) => (
                    <TableRow key={item.itemCode} className="hover:bg-muted/50">
                      <TableCell className="font-mono text-sm">{item.itemCode}</TableCell>
                      <TableCell className="font-medium">{item.itemName}</TableCell>
                      <TableCell>{item.unit}</TableCell>
                      <TableCell className="text-right">{item.openingQty.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{Number(item.openingValue).toLocaleString()}</TableCell>
                      <TableCell className="text-right text-success font-medium">
                        {item.totalReceiptsQty > 0 ? `+${item.totalReceiptsQty.toLocaleString()}` : "-"}
                      </TableCell>
                      <TableCell className="text-right text-success">
                        {item.totalReceiptsValue > 0 ? Number(item.totalReceiptsValue).toLocaleString() : "-"}
                      </TableCell>
                      <TableCell className="text-right text-primary font-medium">
                        {item.totalIssuesQty > 0 ? `-${item.totalIssuesQty.toLocaleString()}` : "-"}
                      </TableCell>
                      <TableCell className="text-right text-primary">
                        {item.totalIssuesValue > 0 ? Number(item.totalIssuesValue).toLocaleString() : "-"}
                      </TableCell>
                      <TableCell className="text-right font-semibold">{item.closingQty.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-semibold">{Number(item.closingValue).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}

                  {/* Totals Row */}
                  <TableRow className="bg-muted font-semibold border-t-2 border-border">
                    <TableCell colSpan={4} className="text-right">TOTALS:</TableCell>
                    <TableCell className="text-right">{Number(totals.openingValue).toLocaleString()}</TableCell>
                    <TableCell className="text-right text-success">-</TableCell>
                    <TableCell className="text-right text-success">{Number(totals.receiptsValue).toLocaleString()}</TableCell>
                    <TableCell className="text-right text-primary">-</TableCell>
                    <TableCell className="text-right text-primary">{Number(totals.issuesValue).toLocaleString()}</TableCell>
                    <TableCell className="text-right">-</TableCell>
                    <TableCell className="text-right">{Number(totals.closingValue).toLocaleString()}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          ) : !selectedItem ? (
            <div className="p-8 text-center text-muted-foreground">
              Please select an item from the parameters above to view its strict chronological ledger.
            </div>
          ) : (
            <div className="rounded-lg border-0 bg-background p-4 flex flex-col gap-4">
              {/* Immutable Header State */}
              <div className="flex items-center justify-between px-2 pb-2 border-b border-border">
                <div className="space-y-1">
                  <h4 className="flex items-center gap-2 font-semibold text-foreground text-lg">
                    <BookOpen className="h-5 w-5" />
                    System-Generated Chronological Ledger
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Strict read-only view. Transactions mapped continuously with frozen balances.
                  </p>
                </div>
                {auditMode && (
                  <Badge variant="outline" className="bg-primary/5 text-primary border-primary">
                    Audit Mode Active
                  </Badge>
                )}
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                      <TableHead className="whitespace-nowrap font-bold text-xs">Date</TableHead>
                      <TableHead className="whitespace-nowrap font-bold text-xs">From/To</TableHead>
                      <TableHead className="whitespace-nowrap font-bold text-right text-xs">Rate (KES)</TableHead>
                      <TableHead className="whitespace-nowrap font-bold text-xs">Receipt Voucher No</TableHead>
                      <TableHead className="whitespace-nowrap font-bold text-xs">Requisition No</TableHead>
                      <TableHead className="whitespace-nowrap font-bold text-xs">Unit</TableHead>
                      <TableHead className="whitespace-nowrap font-bold text-right text-xs text-success">No. Received</TableHead>
                      <TableHead className="whitespace-nowrap font-bold text-right text-xs text-primary">No. Issued</TableHead>
                      <TableHead className="whitespace-nowrap font-extrabold text-right text-xs">Balance</TableHead>
                      <TableHead className="whitespace-nowrap font-bold text-xs">Issue Voucher No / Sign</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {generateItemTransactions(selectedItem, selectedMonth).transactions.map((tx, idx) => (
                      <TableRow key={idx} className="hover:bg-muted/10">
                        <TableCell className="whitespace-nowrap text-xs font-mono">{tx.date}</TableCell>
                        <TableCell className="text-xs">{tx.fromTo}</TableCell>
                        <TableCell className="text-right text-xs">{tx.rate ? tx.rate.toLocaleString() : "-"}</TableCell>
                        <TableCell className="text-xs font-mono">{tx.grnNo || "-"}</TableCell>
                        <TableCell className="text-xs font-mono">{tx.reqNo || "-"}</TableCell>
                        <TableCell className="text-xs">{tx.unit}</TableCell>
                        <TableCell className="text-right text-xs font-semibold text-success">{tx.received || "-"}</TableCell>
                        <TableCell className="text-right text-xs font-semibold text-primary">{tx.issued || "-"}</TableCell>
                        <TableCell className="text-right text-xs font-bold bg-muted/20">{tx.balance.toLocaleString()}</TableCell>
                        <TableCell className="text-xs">{tx.signature}</TableCell>
                      </TableRow>
                    ))}
                    {generateItemTransactions(selectedItem, selectedMonth).transactions.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={10} className="h-24 text-center">
                          No transactions found for this period.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
