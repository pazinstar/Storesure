import { useState, useMemo } from "react";
import { Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/ui/table-pagination";
import { useSchool } from "@/contexts/SchoolContext";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { FUNDS, getTrialBalance, getTrialBalanceTotals } from "../mockLedger";

const fmt = (n: number) => new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(n);

const YEARS = ["FY2024/25", "FY2023/24", "FY2022/23"];

interface LineItem { label: string; amount: number; indent?: boolean; bold?: boolean; separator?: boolean; }

// ── Balance Sheet ────────────────────────────────────────────────────────────
const ASSETS_NONCURRENT: LineItem[] = [
  { label: "Property, Plant & Equipment (Cost)", amount: 23625000, indent: true },
  { label: "Less: Accumulated Depreciation", amount: -5607500, indent: true },
  { label: "Net Book Value – PPE", amount: 18017500, indent: true, bold: true },
];
const ASSETS_CURRENT: LineItem[] = [
  { label: "Cash at Bank – Equity", amount: 2980000, indent: true },
  { label: "Cash at Bank – KCB", amount: 679500, indent: true },
  { label: "Cash on Hand", amount: 51500, indent: true },
  { label: "Student Debtors (Fees Receivable)", amount: 2390000, indent: true },
  { label: "Inventory – Stores", amount: 485000, indent: true },
  { label: "Total Current Assets", amount: 6586000, indent: true, bold: true },
];
const LIABILITIES_CURRENT: LineItem[] = [
  { label: "Accounts Payable – Creditors", amount: 580000, indent: true },
  { label: "Salaries Payable", amount: 0, indent: true },
  { label: "Total Current Liabilities", amount: 580000, indent: true, bold: true },
];
const EQUITY: LineItem[] = [
  { label: "Accumulated Fund (Opening)", amount: 21563500, indent: true },
  { label: "Surplus / (Deficit) for the Year", amount: 2460000, indent: true },
  { label: "Total Net Assets / Fund Balance", amount: 24023500, indent: true, bold: true },
];

// ── Income Statement ─────────────────────────────────────────────────────────
const INCOME: LineItem[] = [
  { label: "School Fees – Tuition", amount: 5400000, indent: true },
  { label: "School Fees – Boarding", amount: 7920000, indent: true },
  { label: "School Fees – Activity Fees", amount: 540000, indent: true },
  { label: "Government Capitation Grant", amount: 960000, indent: true },
  { label: "Donations & Grants", amount: 320000, indent: true },
  { label: "Other Income (Interest, etc.)", amount: 62000, indent: true },
  { label: "Total Income", amount: 15202000, indent: true, bold: true },
];
const EXPENDITURE: LineItem[] = [
  { label: "Staff Salaries & Wages", amount: 7560000, indent: true },
  { label: "Food Supplies & Catering", amount: 1850000, indent: true },
  { label: "Utilities (Electricity, Water)", amount: 612000, indent: true },
  { label: "Stationery & Office Supplies", amount: 285000, indent: true },
  { label: "Repairs & Maintenance", amount: 420000, indent: true },
  { label: "Depreciation Expense", amount: 1200000, indent: true },
  { label: "Other Operating Expenses", amount: 815000, indent: true },
  { label: "Total Expenditure", amount: 12742000, indent: true, bold: true },
];

// ── Trial Balance is sourced per-fund from mockLedger ────────────────────────

function StatementLine({ item }: { item: LineItem }) {
  if (item.separator) return <Separator className="my-1" />;
  return (
    <div className={`flex justify-between py-0.5 text-sm ${item.bold ? "font-semibold border-t mt-1 pt-2" : ""} ${item.indent ? "pl-6" : "font-bold text-base"}`}>
      <span>{item.label}</span>
      <span className={item.amount < 0 ? "text-red-600" : ""}>{item.amount !== undefined ? fmt(Math.abs(item.amount)) : ""}</span>
    </div>
  );
}

function Section({ title, items }: { title: string; items: LineItem[] }) {
  return (
    <div className="mb-4">
      <div className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-1">{title}</div>
      {items.map((item, i) => <StatementLine key={i} item={item} />)}
    </div>
  );
}

export default function FinancialStatements() {
  const { toast } = useToast();
  const { school } = useSchool();
  const [year, setYear] = useState("FY2024/25");
  const [activeTab, setActiveTab] = useState("balance-sheet");
  const [tbAccount, setTbAccount] = useState("Tuition");

  const surplus = INCOME.find(i => i.bold)!.amount - EXPENDITURE.find(i => i.bold)!.amount;
  const scaledTB = useMemo(() => getTrialBalance(tbAccount), [tbAccount]);
  const tbTotals = useMemo(() => getTrialBalanceTotals(tbAccount), [tbAccount]);
  const scaledTBTotalDr = tbTotals.debit;
  const scaledTBTotalCr = tbTotals.credit;
  const { page: tbPage, setPage: setTbPage, pageSize: tbPageSize, setPageSize: setTbPageSize, paginatedItems: paginatedTB, totalPages: tbTotalPages, from: tbFrom, to: tbTo, total: tbTotal } = usePagination(scaledTB);
  const fmtPdf = (n: number) => new Intl.NumberFormat("en-KE", { maximumFractionDigits: 0 }).format(Math.abs(n));

  const pdfHeader = (doc: jsPDF, title: string, subtitle: string) => {
    const w = doc.internal.pageSize.getWidth();
    let y = 14;
    doc.setFontSize(14); doc.setFont("helvetica", "bold");
    doc.text(school?.name ?? "School", w / 2, y, { align: "center" }); y += 7;
    doc.setFontSize(11); doc.setFont("helvetica", "bold");
    doc.text(title, w / 2, y, { align: "center" }); y += 6;
    doc.setFontSize(9); doc.setFont("helvetica", "normal");
    doc.text(subtitle, w / 2, y, { align: "center" }); y += 8;
    return y;
  };

  const printBalanceSheet = () => {
    const doc = new jsPDF();
    let y = pdfHeader(doc, "STATEMENT OF FINANCIAL POSITION (BALANCE SHEET)", `As at 31 January 2025 — ${year}`);
    const w = doc.internal.pageSize.getWidth();
    const lx = 20; const rx = w - 20;

    const heading = (text: string) => { doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.text(text, lx, y); y += 1; doc.line(lx, y, rx, y); y += 5; };
    const subHeading = (text: string) => { doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(100); doc.text(text, lx, y); doc.setTextColor(0); y += 5; };
    const line = (label: string, amount: number, bold = false) => { doc.setFont("helvetica", bold ? "bold" : "normal"); doc.setFontSize(9); doc.text(label, lx + 8, y); doc.text(fmtPdf(amount), rx, y, { align: "right" }); y += 5; };
    const totalLine = (label: string, amount: number) => { y += 1; doc.line(lx, y, rx, y); y += 4; doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.text(label, lx, y); doc.text(fmtPdf(amount), rx, y, { align: "right" }); y += 6; };

    heading("ASSETS");
    subHeading("Non-Current Assets");
    ASSETS_NONCURRENT.forEach(i => line(i.label, i.amount, i.bold));
    y += 2; subHeading("Current Assets");
    ASSETS_CURRENT.forEach(i => line(i.label, i.amount, i.bold));
    totalLine("TOTAL ASSETS", 18017500 + 6586000);

    y += 4; heading("LIABILITIES AND NET ASSETS");
    subHeading("Current Liabilities");
    LIABILITIES_CURRENT.forEach(i => line(i.label, i.amount, i.bold));
    y += 2; subHeading("Net Assets / Fund Balance");
    EQUITY.forEach(i => line(i.label, i.amount, i.bold));
    totalLine("TOTAL LIABILITIES AND NET ASSETS", 580000 + 24023500);

    doc.save(`BalanceSheet_${year}.pdf`);
    toast({ title: "Balance Sheet PDF downloaded" });
  };

  const printIncomeStatement = () => {
    const doc = new jsPDF();
    let y = pdfHeader(doc, "STATEMENT OF FINANCIAL PERFORMANCE", `For the period ended 31 January 2025 — ${year}`);
    const w = doc.internal.pageSize.getWidth();
    const lx = 20; const rx = w - 20;

    const subHeading = (text: string) => { doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(100); doc.text(text, lx, y); doc.setTextColor(0); y += 5; };
    const line = (label: string, amount: number, bold = false) => { doc.setFont("helvetica", bold ? "bold" : "normal"); doc.setFontSize(9); doc.text(label, lx + 8, y); doc.text(fmtPdf(amount), rx, y, { align: "right" }); y += 5; };

    subHeading("INCOME");
    INCOME.forEach(i => line(i.label, i.amount, i.bold));
    y += 4; subHeading("EXPENDITURE");
    EXPENDITURE.forEach(i => line(i.label, i.amount, i.bold));
    y += 2; doc.line(lx, y, rx, y); y += 5;
    doc.setFont("helvetica", "bold"); doc.setFontSize(11);
    doc.text(surplus >= 0 ? "Surplus for the Period" : "Deficit for the Period", lx, y);
    doc.text(fmtPdf(surplus), rx, y, { align: "right" }); y += 6;

    doc.save(`IncomeStatement_${year}.pdf`);
    toast({ title: "Income Statement PDF downloaded" });
  };

  const printTrialBalance = () => {
    const doc = new jsPDF();
    let y = pdfHeader(doc, `TRIAL BALANCE – ${tbAccount}`, `As at 31 January 2025 — ${year}`);

    autoTable(doc, {
      startY: y,
      head: [["Code", "Account Name", "Debit (KES)", "Credit (KES)"]],
      body: [
        ...scaledTB.map(r => [r.code, r.name, r.debit ? fmtPdf(r.debit) : "—", r.credit ? fmtPdf(r.credit) : "—"]),
        ["", "TOTALS", fmtPdf(scaledTBTotalDr), fmtPdf(scaledTBTotalCr)],
      ],
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [40, 40, 40] },
      didParseCell: (data) => { const raw = data.row.raw as any[]; if (raw[1] === "TOTALS") { data.cell.styles.fontStyle = "bold"; data.cell.styles.fillColor = [230, 230, 230]; } },
    });

    doc.save(`TrialBalance_${tbAccount}_${year}.pdf`);
    toast({ title: `Trial Balance (${tbAccount}) PDF downloaded` });
  };

  const printCashFlow = () => {
    const doc = new jsPDF();
    let y = pdfHeader(doc, "STATEMENT OF CASH FLOWS", `For the period ended 31 January 2025 — ${year}`);
    const w = doc.internal.pageSize.getWidth();
    const lx = 20; const rx = w - 20;

    const subHeading = (text: string) => { doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(100); doc.text(text, lx, y); doc.setTextColor(0); y += 5; };
    const line = (label: string, amount: number) => { doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.text(label, lx + 8, y); doc.text(amount < 0 ? `(${fmtPdf(amount)})` : fmtPdf(amount), rx, y, { align: "right" }); y += 5; };
    const subtotal = (label: string, amount: number) => { y += 1; doc.line(lx, y, rx, y); y += 4; doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.text(label, lx, y); doc.text(amount < 0 ? `(${fmtPdf(amount)})` : fmtPdf(amount), rx, y, { align: "right" }); y += 7; };

    subHeading("A. OPERATING ACTIVITIES");
    [["Fees received from students", 14860000], ["Capitation & grants received", 1280000], ["Other receipts", 62000], ["Staff salaries paid", -7560000], ["Suppliers paid (food, utilities, etc.)", -3982000]].forEach(([l, a]) => line(l as string, a as number));
    subtotal("Net Cash from Operating Activities", 4660000);

    subHeading("B. INVESTING ACTIVITIES");
    line("Purchase of fixed assets (PPE)", -250000);
    subtotal("Net Cash used in Investing Activities", -250000);

    subHeading("C. FINANCING ACTIVITIES");
    doc.setFont("helvetica", "italic"); doc.setFontSize(9); doc.text("No financing activities in period", lx + 8, y); y += 5;
    subtotal("Net Cash from Financing Activities", 0);

    y += 2; doc.line(lx, y, rx, y); y += 5;
    doc.setFont("helvetica", "bold"); doc.setFontSize(10);
    doc.text("Net Increase in Cash & Cash Equivalents", lx, y); doc.text(fmtPdf(4410000), rx, y, { align: "right" }); y += 6;
    doc.setFont("helvetica", "normal"); doc.setFontSize(9);
    doc.text("Opening Cash & Cash Equivalents", lx, y); doc.text(fmtPdf(3455000), rx, y, { align: "right" }); y += 5;
    y += 1; doc.line(lx, y, rx, y); y += 4;
    doc.setFont("helvetica", "bold"); doc.setFontSize(10);
    doc.text("Closing Cash & Cash Equivalents", lx, y); doc.text(fmtPdf(3711000), rx, y, { align: "right" });

    doc.save(`CashFlowStatement_${year}.pdf`);
    toast({ title: "Cash Flow Statement PDF downloaded" });
  };

  const handlePrint = () => {
    if (activeTab === "balance-sheet") printBalanceSheet();
    else if (activeTab === "income") printIncomeStatement();
    else if (activeTab === "trial-balance") printTrialBalance();
    else if (activeTab === "cash-flow") printCashFlow();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Financial Statements</h1>
          <p className="text-muted-foreground">IPSAS-aligned statements — Balance Sheet, Income Statement, Cash Flow, Trial Balance</p>
        </div>
        <div className="flex gap-2 items-end">
          <div className="space-y-1">
            <Label className="text-xs">Financial Year</Label>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>{YEARS.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Button variant="outline" onClick={handlePrint}><Printer className="mr-2 h-4 w-4" />Print PDF</Button>
        </div>
      </div>

      <Tabs defaultValue="balance-sheet" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="balance-sheet">Balance Sheet</TabsTrigger>
          <TabsTrigger value="income">Income Statement</TabsTrigger>
          <TabsTrigger value="trial-balance">Trial Balance</TabsTrigger>
          <TabsTrigger value="cash-flow">Cash Flow</TabsTrigger>
        </TabsList>

        {/* Balance Sheet */}
        <TabsContent value="balance-sheet">
          <Card>
            <CardHeader>
              <CardTitle className="text-center text-base">STATEMENT OF FINANCIAL POSITION (BALANCE SHEET)</CardTitle>
              <div className="text-center text-sm text-muted-foreground">As at 31 January 2025 — {year}</div>
            </CardHeader>
            <CardContent className="max-w-2xl mx-auto">
              <div className="font-bold text-sm border-b pb-2 mb-3">ASSETS</div>
              <Section title="Non-Current Assets" items={ASSETS_NONCURRENT} />
              <Section title="Current Assets" items={ASSETS_CURRENT} />
              <div className="flex justify-between font-bold text-base border-t-2 pt-2 mt-2">
                <span>TOTAL ASSETS</span><span>{fmt(18017500 + 6586000)}</span>
              </div>
              <div className="font-bold text-sm border-b pb-2 mb-3 mt-6">LIABILITIES AND NET ASSETS</div>
              <Section title="Current Liabilities" items={LIABILITIES_CURRENT} />
              <div className="flex justify-between font-bold text-sm border-t pt-1 mb-4">
                <span>Total Liabilities</span><span>{fmt(580000)}</span>
              </div>
              <Section title="Net Assets / Fund Balance" items={EQUITY} />
              <div className="flex justify-between font-bold text-base border-t-2 pt-2 mt-2">
                <span>TOTAL LIABILITIES AND NET ASSETS</span><span>{fmt(580000 + 24023500)}</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Income Statement */}
        <TabsContent value="income">
          <Card>
            <CardHeader>
              <CardTitle className="text-center text-base">STATEMENT OF FINANCIAL PERFORMANCE (INCOME & EXPENDITURE)</CardTitle>
              <div className="text-center text-sm text-muted-foreground">For the period ended 31 January 2025 — {year}</div>
            </CardHeader>
            <CardContent className="max-w-2xl mx-auto">
              <Section title="Income" items={INCOME} />
              <Section title="Expenditure" items={EXPENDITURE} />
              <Separator className="my-3" />
              <div className={`flex justify-between font-bold text-lg ${surplus >= 0 ? "text-green-700" : "text-red-600"}`}>
                <span>{surplus >= 0 ? "Surplus for the Period" : "Deficit for the Period"}</span>
                <span>{fmt(Math.abs(surplus))}</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trial Balance */}
        <TabsContent value="trial-balance">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3 flex-wrap gap-2">
              <div>
                <CardTitle className="text-center text-base">TRIAL BALANCE – {tbAccount}</CardTitle>
                <div className="text-center text-sm text-muted-foreground">As at 31 January 2025 — {year}</div>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <Label className="text-xs whitespace-nowrap">Account</Label>
                  <Select value={tbAccount} onValueChange={setTbAccount}>
                    <SelectTrigger className="w-40 h-8"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {FUNDS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground whitespace-nowrap">Show</span>
                  <Select value={String(tbPageSize)} onValueChange={(v) => setTbPageSize(Number(v))}>
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
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3 font-medium">Code</th>
                    <th className="text-left p-3 font-medium">Account Name</th>
                    <th className="text-right p-3 font-medium">Debit (KES)</th>
                    <th className="text-right p-3 font-medium">Credit (KES)</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTB.map(row => (
                    <tr key={row.code} className="border-b hover:bg-muted/30">
                      <td className="p-3 font-mono">{row.code}</td>
                      <td className="p-3">{row.name}</td>
                      <td className="p-3 text-right">{row.debit ? fmt(row.debit) : "—"}</td>
                      <td className="p-3 text-right">{row.credit ? fmt(row.credit) : "—"}</td>
                    </tr>
                  ))}
                  <tr className="font-bold bg-muted/30 border-t-2">
                    <td className="p-3" colSpan={2}>TOTALS</td>
                    <td className="p-3 text-right text-green-700">{fmt(scaledTBTotalDr)}</td>
                    <td className="p-3 text-right text-green-700">{fmt(scaledTBTotalCr)}</td>
                  </tr>
                  <tr className="bg-muted/10">
                    <td className="p-3 text-xs text-muted-foreground" colSpan={2}>Difference</td>
                    <td className="p-3 text-right text-xs text-green-700" colSpan={2}>{scaledTBTotalDr === scaledTBTotalCr ? "NIL — BALANCED" : fmt(Math.abs(scaledTBTotalDr - scaledTBTotalCr))}</td>
                  </tr>
                </tbody>
              </table>
              <TablePagination page={tbPage} totalPages={tbTotalPages} from={tbFrom} to={tbTo} total={tbTotal} onPageChange={setTbPage} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cash Flow */}
        <TabsContent value="cash-flow">
          <Card>
            <CardHeader>
              <CardTitle className="text-center text-base">STATEMENT OF CASH FLOWS</CardTitle>
              <div className="text-center text-sm text-muted-foreground">For the period ended 31 January 2025 — {year}</div>
            </CardHeader>
            <CardContent className="max-w-2xl mx-auto text-sm space-y-4">
              <div>
                <div className="font-bold uppercase tracking-wide text-muted-foreground text-xs mb-2">A. Operating Activities</div>
                {[
                  { label: "Fees received from students", amount: 14860000 },
                  { label: "Capitation & grants received", amount: 1280000 },
                  { label: "Other receipts", amount: 62000 },
                  { label: "Staff salaries paid", amount: -7560000 },
                  { label: "Suppliers paid (food, utilities, etc.)", amount: -3982000 },
                ].map((r, i) => (
                  <div key={i} className="flex justify-between pl-4 py-0.5">
                    <span>{r.label}</span>
                    <span className={r.amount < 0 ? "text-red-600" : "text-green-700"}>{r.amount < 0 ? `(${fmt(Math.abs(r.amount))})` : fmt(r.amount)}</span>
                  </div>
                ))}
                <div className="flex justify-between font-semibold border-t pt-1 mt-1">
                  <span>Net Cash from Operating Activities</span>
                  <span className="text-green-700">{fmt(4660000)}</span>
                </div>
              </div>
              <div>
                <div className="font-bold uppercase tracking-wide text-muted-foreground text-xs mb-2">B. Investing Activities</div>
                {[
                  { label: "Purchase of fixed assets (PPE)", amount: -250000 },
                ].map((r, i) => (
                  <div key={i} className="flex justify-between pl-4 py-0.5">
                    <span>{r.label}</span>
                    <span className="text-red-600">({fmt(Math.abs(r.amount))})</span>
                  </div>
                ))}
                <div className="flex justify-between font-semibold border-t pt-1 mt-1">
                  <span>Net Cash used in Investing Activities</span>
                  <span className="text-red-600">({fmt(250000)})</span>
                </div>
              </div>
              <div>
                <div className="font-bold uppercase tracking-wide text-muted-foreground text-xs mb-2">C. Financing Activities</div>
                <div className="pl-4 text-muted-foreground py-0.5">No financing activities in period</div>
                <div className="flex justify-between font-semibold border-t pt-1 mt-1">
                  <span>Net Cash from Financing Activities</span>
                  <span>—</span>
                </div>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-base">
                <span>Net Increase in Cash & Cash Equivalents</span>
                <span className="text-green-700">{fmt(4410000)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Opening Cash & Cash Equivalents</span>
                <span>{fmt(3455000)}</span>
              </div>
              <div className="flex justify-between font-bold text-base border-t pt-2">
                <span>Closing Cash & Cash Equivalents</span>
                <span className="text-blue-700">{fmt(3711000)}</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
