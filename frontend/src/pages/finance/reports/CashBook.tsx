import { useState, useMemo } from "react";
import { Printer, Download, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useSchool } from "@/contexts/SchoolContext";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/ui/table-pagination";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import {
  FUNDS,
  getCashBookReceipts,
  getCashBookPayments,
  getCashBookReceiptsTotals,
  getCashBookPaymentsTotals,
  type CashBookReceiptRow as ReceiptRow,
  type CashBookPaymentRow as PaymentRow,
} from "../mockLedger";

const fmt = (n: number) => n === 0 ? "" : n.toLocaleString("en-KE");
const fmtAmt = (n: number) => n.toLocaleString("en-KE", { minimumFractionDigits: 2 });

const MONTHS = ["July 2024","August 2024","September 2024","October 2024","November 2024","December 2024","January 2025","February 2025"];
const FY_OPTIONS = ["FY 2024/2025","FY 2023/2024"];

// ─── Export helpers ───────────────────────────────────────────────────────────
function buildReceiptsRows(rows: ReceiptRow[]) {
  return rows.map(r => ([
    r.date, r.recNo, r.receivedFrom, r.chqNo,
    r.cash||"", r.bank||"", r.total||"", r.arr||"",
    r.prepay||"", r.tenders||"", r.bes||"", r.ewc||"",
    r.pe||"", r.rmi||"", r.adminCosts||"", r.ltt||"",
    r.activity||"", r.bursary||"",
  ]));
}
function buildPaymentsRows(rows: PaymentRow[]) {
  return rows.map(r => ([
    r.date, r.recNo, r.payee, r.chqNo,
    r.cash||"", r.bank||"", r.total||"", r.cred||"", r.prepay||"",
    r.tenders||"", r.bes||"", r.ewc||"", r.rmi||"",
    r.adminCosts||"", r.ltt||"", r.activity||"", r.homescience||"",
    r.bursary||"", r.advance||"",
  ]));
}

/* ─── shared cell styles ─────────────────────────────────────────────────── */
const th = "px-3 py-2 text-right font-semibold whitespace-nowrap text-xs";
const thL = "px-3 py-2 text-left font-semibold whitespace-nowrap text-xs";
const td = "px-3 py-1.5 text-right whitespace-nowrap text-xs";
const tdL = "px-3 py-1.5 text-left whitespace-nowrap text-xs";

// ─── Component ────────────────────────────────────────────────────────────────
export default function CashBook() {
  const { school } = useSchool();
  const { toast } = useToast();
  const [month, setMonth] = useState("July 2024");
  const [fy, setFy] = useState("FY 2024/2025");
  const [account, setAccount] = useState("Tuition");

  const title = `Cash Book – ${account} – ${month} – ${fy}`;

  const receipts = useMemo(() => getCashBookReceipts(account), [account]);
  const payments = useMemo(() => getCashBookPayments(account), [account]);
  const totalsR = useMemo(() => getCashBookReceiptsTotals(account), [account]);
  const totalsP = useMemo(() => getCashBookPaymentsTotals(account), [account]);

  const { page: recPage, setPage: setRecPage, paginatedItems: recItems, totalPages: recTotalPages, from: recFrom, to: recTo, total: recTotal } = usePagination(receipts, 15);
  const { page: payPage, setPage: setPayPage, paginatedItems: payItems, totalPages: payTotalPages, from: payFrom, to: payTo, total: payTotal } = usePagination(payments, 15);

  const exportPDF = () => {
    const doc = new jsPDF({ orientation: "landscape", format: "a3" });
    const pageW = doc.internal.pageSize.getWidth();
    let y = 14;

    doc.setFontSize(13); doc.setFont("helvetica", "bold");
    doc.text(school?.name ?? "School", pageW / 2, y, { align: "center" }); y += 7;
    doc.setFontSize(10); doc.setFont("helvetica", "normal");
    doc.text(title, pageW / 2, y, { align: "center" }); y += 8;

    doc.setFontSize(10); doc.setFont("helvetica", "bold");
    doc.text("RECEIPTS", 14, y); y += 4;

    autoTable(doc, {
      startY: y,
      head: [["Date","Rec No","Received From","Chq No","Cash","Bank","Total","Arr","Prepay","Tenders","BES","E.W&C","PE","RMI","Admin Costs","L.T&T","Activity","Bursary"]],
      body: [
        ...buildReceiptsRows(receipts),
        [totalsR.receivedFrom, "", "", "",
          fmtAmt(totalsR.cash), fmtAmt(totalsR.bank), fmtAmt(totalsR.total), fmtAmt(totalsR.arr),
          fmtAmt(totalsR.prepay), fmtAmt(totalsR.tenders), fmtAmt(totalsR.bes), fmtAmt(totalsR.ewc),
          fmtAmt(totalsR.pe), fmtAmt(totalsR.rmi), fmtAmt(totalsR.adminCosts), fmtAmt(totalsR.ltt),
          fmtAmt(totalsR.activity), fmtAmt(totalsR.bursary)],
      ],
      styles: { fontSize: 6, cellPadding: 1 },
      headStyles: { fillColor: [30, 80, 160], fontSize: 6 },
      didParseCell: (data) => {
        const row = data.row.raw as any[];
        if (row[2] === "TOTALS" || row[0] === "TOTALS") {
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.fillColor = [220, 230, 255];
        }
        if (typeof row[2] === "string" && (row[2].includes("BAL") || row[2].includes("Opening"))) {
          data.cell.styles.fontStyle = "italic";
        }
      },
    });

    const afterReceipts = (doc as any).lastAutoTable.finalY + 8;
    doc.setFontSize(10); doc.setFont("helvetica", "bold");
    doc.text("PAYMENTS", 14, afterReceipts);

    autoTable(doc, {
      startY: afterReceipts + 4,
      head: [["Date","Rec No","Payee","Chq No","Cash","Bank","Total","Cred","Prepay","Tenders","BES","E.W&C","R.M&I","Admin Costs","L.T&T","Activity","Homescience","Bursary","Advance"]],
      body: [
        ...buildPaymentsRows(payments),
        [totalsP.payee, "", "", "",
          fmtAmt(totalsP.cash), fmtAmt(totalsP.bank), fmtAmt(totalsP.total), fmtAmt(totalsP.cred), fmtAmt(totalsP.prepay),
          fmtAmt(totalsP.tenders), fmtAmt(totalsP.bes), fmtAmt(totalsP.ewc), fmtAmt(totalsP.rmi),
          fmtAmt(totalsP.adminCosts), fmtAmt(totalsP.ltt), fmtAmt(totalsP.activity), fmtAmt(totalsP.homescience),
          fmtAmt(totalsP.bursary), fmtAmt(totalsP.advance)],
      ],
      styles: { fontSize: 6, cellPadding: 1 },
      headStyles: { fillColor: [160, 40, 40], fontSize: 6 },
      didParseCell: (data) => {
        const row = data.row.raw as any[];
        if (row[2] === "TOTALS" || row[0] === "TOTALS") {
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.fillColor = [255, 220, 220];
        }
      },
    });

    doc.save(`CashBook_${account}_${month.replace(" ", "_")}.pdf`);
    toast({ title: "PDF downloaded" });
  };

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();

    const recHeaders = ["Date","Rec No","Received From","Chq No","Cash","Bank","Total","Arr","Prepay","Tenders","BES","E.W&C","PE","RMI","Admin Costs","L.T&T","Activity","Bursary"];
    const recData = [
      recHeaders,
      ...buildReceiptsRows(receipts),
      [totalsR.receivedFrom,"","","",
        totalsR.cash, totalsR.bank, totalsR.total, totalsR.arr,
        totalsR.prepay, totalsR.tenders, totalsR.bes, totalsR.ewc,
        totalsR.pe, totalsR.rmi, totalsR.adminCosts, totalsR.ltt,
        totalsR.activity, totalsR.bursary],
    ];
    const wsRec = XLSX.utils.aoa_to_sheet(recData);
    XLSX.utils.book_append_sheet(wb, wsRec, "Receipts");

    const payHeaders = ["Date","Rec No","Payee","Chq No","Cash","Bank","Total","Cred","Prepay","Tenders","BES","E.W&C","R.M&I","Admin Costs","L.T&T","Activity","Homescience","Bursary","Advance"];
    const payData = [
      payHeaders,
      ...buildPaymentsRows(payments),
      [totalsP.payee,"","","",
        totalsP.cash, totalsP.bank, totalsP.total, totalsP.cred, totalsP.prepay,
        totalsP.tenders, totalsP.bes, totalsP.ewc, totalsP.rmi,
        totalsP.adminCosts, totalsP.ltt, totalsP.activity, totalsP.homescience,
        totalsP.bursary, totalsP.advance],
    ];
    const wsPay = XLSX.utils.aoa_to_sheet(payData);
    XLSX.utils.book_append_sheet(wb, wsPay, "Payments");

    XLSX.writeFile(wb, `CashBook_${account}_${month.replace(" ", "_")}.xlsx`);
    toast({ title: "Excel downloaded" });
  };

  /* ── Pure-HTML receipt table ────────────────────────────────────────────── */
  const renderReceiptsTable = (rows: ReceiptRow[]) => (
    <div style={{ overflow: 'auto', maxHeight: 460 }}>
      <table style={{ minWidth: 1800, width: '100%', borderCollapse: 'collapse' }}>
        <thead style={{ position: 'sticky', top: 0, zIndex: 2 }}>
          <tr style={{ background: '#eff6ff' }}>
            <th className={thL}>Date</th>
            <th className={thL}>Rec No</th>
            <th className={thL} style={{ minWidth: 180 }}>Received From</th>
            <th className={thL}>Chq No</th>
            <th className={th}>Cash</th>
            <th className={th}>Bank</th>
            <th className={th}>Total</th>
            <th className={th}>Arr</th>
            <th className={th}>Prepay</th>
            <th className={th}>Tenders</th>
            <th className={th}>BES</th>
            <th className={th}>E.W&C</th>
            <th className={th}>PE</th>
            <th className={th}>RMI</th>
            <th className={th}>Admin Costs</th>
            <th className={th}>L.T&T</th>
            <th className={th}>Activity</th>
            <th className={th}>Bursary</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} style={{ background: r.isBalance ? '#eff6ff' : r.receivedFrom.includes("Receipt Summaries") ? '#fff' : '#f9fafb', borderBottom: '1px solid #e5e7eb', fontWeight: r.isBalance ? 600 : 400, fontStyle: r.isBalance ? 'italic' : 'normal' }}>
              <td className={tdL}>{r.date}</td>
              <td className={`${tdL} font-mono`}>{r.recNo}</td>
              <td className={tdL}>{r.receivedFrom}</td>
              <td className={tdL}>{r.chqNo}</td>
              <td className={td}>{fmt(r.cash)}</td>
              <td className={td}>{fmt(r.bank)}</td>
              <td className={td}>{fmt(r.total)}</td>
              <td className={td}>{fmt(r.arr)}</td>
              <td className={td}>{fmt(r.prepay)}</td>
              <td className={td}>{fmt(r.tenders)}</td>
              <td className={td}>{fmt(r.bes)}</td>
              <td className={td}>{fmt(r.ewc)}</td>
              <td className={td}>{fmt(r.pe)}</td>
              <td className={td}>{fmt(r.rmi)}</td>
              <td className={td}>{fmt(r.adminCosts)}</td>
              <td className={td}>{fmt(r.ltt)}</td>
              <td className={td}>{fmt(r.activity)}</td>
              <td className={td}>{fmt(r.bursary)}</td>
            </tr>
          ))}
          <tr style={{ background: '#dbeafe', fontWeight: 700, borderTop: '2px solid #3b82f6' }}>
            <td className={tdL} colSpan={4} style={{ fontWeight: 700 }}>TOTALS</td>
            <td className={td}>{fmtAmt(totalsR.cash)}</td>
            <td className={td}>{fmtAmt(totalsR.bank)}</td>
            <td className={td}>{fmtAmt(totalsR.total)}</td>
            <td className={td}>{fmtAmt(totalsR.arr)}</td>
            <td className={td}>{fmtAmt(totalsR.prepay)}</td>
            <td className={td}>{fmtAmt(totalsR.tenders)}</td>
            <td className={td}>{fmtAmt(totalsR.bes)}</td>
            <td className={td}>{fmtAmt(totalsR.ewc)}</td>
            <td className={td}>{fmtAmt(totalsR.pe)}</td>
            <td className={td}>{fmtAmt(totalsR.rmi)}</td>
            <td className={td}>{fmtAmt(totalsR.adminCosts)}</td>
            <td className={td}>{fmtAmt(totalsR.ltt)}</td>
            <td className={td}>{fmtAmt(totalsR.activity)}</td>
            <td className={td}>{fmtAmt(totalsR.bursary)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );

  /* ── Pure-HTML payment table ────────────────────────────────────────────── */
  const renderPaymentsTable = (rows: PaymentRow[]) => (
    <div style={{ overflow: 'auto', maxHeight: 460 }}>
      <table style={{ minWidth: 1900, width: '100%', borderCollapse: 'collapse' }}>
        <thead style={{ position: 'sticky', top: 0, zIndex: 2 }}>
          <tr style={{ background: '#fef2f2' }}>
            <th className={thL}>Date</th>
            <th className={thL}>Rec No</th>
            <th className={thL} style={{ minWidth: 200 }}>Payee</th>
            <th className={thL}>Chq No</th>
            <th className={th}>Cash</th>
            <th className={th}>Bank</th>
            <th className={th}>Total</th>
            <th className={th}>Cred</th>
            <th className={th}>Prepay</th>
            <th className={th}>Tenders</th>
            <th className={th}>BES</th>
            <th className={th}>E.W&C</th>
            <th className={th}>R.M&I</th>
            <th className={th}>Admin Costs</th>
            <th className={th}>L.T&T</th>
            <th className={th}>Activity</th>
            <th className={th}>Homescience</th>
            <th className={th}>Bursary</th>
            <th className={th}>Advance</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} style={{ background: r.isBalance ? '#fef2f2' : r.payee.includes("Cash") ? '#f9fafb' : '#fff', borderBottom: '1px solid #e5e7eb', fontWeight: r.isBalance ? 600 : 400, fontStyle: r.isBalance ? 'italic' : 'normal' }}>
              <td className={tdL}>{r.date}</td>
              <td className={`${tdL} font-mono`}>{r.recNo}</td>
              <td className={tdL}>{r.payee}</td>
              <td className={`${tdL} font-mono`}>{r.chqNo}</td>
              <td className={td}>{fmt(r.cash)}</td>
              <td className={td}>{fmt(r.bank)}</td>
              <td className={td}>{fmt(r.total)}</td>
              <td className={td}>{fmt(r.cred)}</td>
              <td className={td}>{fmt(r.prepay)}</td>
              <td className={td}>{fmt(r.tenders)}</td>
              <td className={td}>{fmt(r.bes)}</td>
              <td className={td}>{fmt(r.ewc)}</td>
              <td className={td}>{fmt(r.rmi)}</td>
              <td className={td}>{fmt(r.adminCosts)}</td>
              <td className={td}>{fmt(r.ltt)}</td>
              <td className={td}>{fmt(r.activity)}</td>
              <td className={td}>{fmt(r.homescience)}</td>
              <td className={td}>{fmt(r.bursary)}</td>
              <td className={td}>{fmt(r.advance)}</td>
            </tr>
          ))}
          <tr style={{ background: '#fee2e2', fontWeight: 700, borderTop: '2px solid #ef4444' }}>
            <td className={tdL} colSpan={4} style={{ fontWeight: 700 }}>TOTALS</td>
            <td className={td}>{fmtAmt(totalsP.cash)}</td>
            <td className={td}>{fmtAmt(totalsP.bank)}</td>
            <td className={td}>{fmtAmt(totalsP.total)}</td>
            <td className={td}>{fmtAmt(totalsP.cred)}</td>
            <td className={td}>{fmtAmt(totalsP.prepay)}</td>
            <td className={td}>{fmtAmt(totalsP.tenders)}</td>
            <td className={td}>{fmtAmt(totalsP.bes)}</td>
            <td className={td}>{fmtAmt(totalsP.ewc)}</td>
            <td className={td}>{fmtAmt(totalsP.rmi)}</td>
            <td className={td}>{fmtAmt(totalsP.adminCosts)}</td>
            <td className={td}>{fmtAmt(totalsP.ltt)}</td>
            <td className={td}>{fmtAmt(totalsP.activity)}</td>
            <td className={td}>{fmtAmt(totalsP.homescience)}</td>
            <td className={td}>{fmtAmt(totalsP.bursary)}</td>
            <td className={td}>{fmtAmt(totalsP.advance)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-6 min-w-0" style={{ maxWidth: '100%' }}>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cash Book</h1>
          <p className="text-muted-foreground">Monthly receipts and payments with analysis columns</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportPDF}>
            <Printer className="mr-2 h-4 w-4" />PDF
          </Button>
          <Button variant="outline" onClick={exportExcel}>
            <Download className="mr-2 h-4 w-4" />Excel
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-3">
          <div className="flex flex-wrap items-center gap-4">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <div className="space-y-1">
              <Label className="text-xs">Month</Label>
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>{MONTHS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Financial Year</Label>
              <Select value={fy} onValueChange={setFy}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>{FY_OPTIONS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Fund</Label>
              <Select value={account} onValueChange={setAccount}>
                <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                <SelectContent>{FUNDS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Badge variant="outline" className="self-end mb-0.5">{title}</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4">
          <div className="text-xl font-bold text-blue-700">{fmtAmt(totalsR.cash)}</div>
          <div className="text-xs text-muted-foreground">Total Cash Received</div>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <div className="text-xl font-bold text-blue-700">{fmtAmt(totalsR.bank)}</div>
          <div className="text-xs text-muted-foreground">Total Bank Received</div>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <div className="text-xl font-bold text-red-700">{fmtAmt(totalsP.cash)}</div>
          <div className="text-xs text-muted-foreground">Total Cash Payments</div>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <div className="text-xl font-bold text-red-700">{fmtAmt(totalsP.bank)}</div>
          <div className="text-xs text-muted-foreground">Total Bank Payments</div>
        </CardContent></Card>
      </div>

      {/* Receipts / Payments Tabs */}
      <Tabs defaultValue="receipts" className="min-w-0">
        <TabsList>
          <TabsTrigger value="receipts" className="gap-2">
            <span className="h-2 w-2 rounded-full bg-blue-500 inline-block" />
            Receipts
          </TabsTrigger>
          <TabsTrigger value="payments" className="gap-2">
            <span className="h-2 w-2 rounded-full bg-red-500 inline-block" />
            Payments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="receipts" className="min-w-0">
          <Card className="min-w-0 overflow-hidden">
            <CardContent className="p-0 pt-1">
              <div className="px-4 py-2 bg-blue-700 text-white text-sm font-semibold rounded-t">
                JULY RECEIPTS – {account} – {fy}
              </div>
              {renderReceiptsTable(recItems)}
              <TablePagination page={recPage} totalPages={recTotalPages} from={recFrom} to={recTo} total={recTotal} onPageChange={setRecPage} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="min-w-0">
          <Card className="min-w-0 overflow-hidden">
            <CardContent className="p-0 pt-1">
              <div className="px-4 py-2 bg-red-700 text-white text-sm font-semibold rounded-t">
                JULY PAYMENTS – {account} – {fy}
              </div>
              {renderPaymentsTable(payItems)}
              <TablePagination page={payPage} totalPages={payTotalPages} from={payFrom} to={payTo} total={payTotal} onPageChange={setPayPage} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
