import { useState } from "react";
import { Plus, Search, Send, RotateCcw, Trash2, Eye, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/ui/table-pagination";

const fmt = (n: number) => new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(n);
const STATUS_COLORS: Record<string, string> = { DRAFT: "bg-gray-100 text-gray-700", POSTED: "bg-green-100 text-green-800", REVERSED: "bg-red-100 text-red-700" };

interface PV { id: string; no: string; date: string; fund: string; particulars: string; chequeNo: string; lpoLso: string; cash: number; bank: number; total: number; voteheadAmounts: Record<string, number>; status: string; narration: string; }

const FUNDS = ["Tuition", "Operation", "Infrastructure", "School Fund"];
const FUND_COLORS: Record<string, string> = { Tuition: "bg-blue-100 text-blue-800", Operation: "bg-emerald-100 text-emerald-800", Infrastructure: "bg-amber-100 text-amber-800", "School Fund": "bg-purple-100 text-purple-800" };

const INITIAL: PV[] = [
  { id: "1", no: "PV-2025-001", date: "05 Jan 2025", fund: "Operation", particulars: "Unga Holdings Ltd – Food supplies", chequeNo: "3964", lpoLso: "LPO-2025-001", cash: 0, bank: 145000, total: 145000, voteheadAmounts: { BES: 145000 }, status: "POSTED", narration: "Food supplies – Jan" },
  { id: "2", no: "PV-2025-002", date: "06 Jan 2025", fund: "Operation", particulars: "Kenya Power & Lighting – Electricity", chequeNo: "3965", lpoLso: "", cash: 0, bank: 18500, total: 18500, voteheadAmounts: { "E.W&C": 11000, "R.M&I": 7500 }, status: "POSTED", narration: "Electricity bill Jan" },
  { id: "3", no: "PV-2025-003", date: "07 Jan 2025", fund: "Operation", particulars: "Staff Salaries – January", chequeNo: "3966", lpoLso: "", cash: 0, bank: 1050000, total: 1050000, voteheadAmounts: { "Admin Costs": 1050000 }, status: "POSTED", narration: "January payroll" },
  { id: "4", no: "PV-2025-004", date: "08 Jan 2025", fund: "Tuition", particulars: "AMS Suppliers – Stationery", chequeNo: "3967", lpoLso: "LPO-2025-004", cash: 0, bank: 67000, total: 67000, voteheadAmounts: { Tenders: 42000, BES: 25000 }, status: "DRAFT", narration: "" },
  { id: "5", no: "PV-2025-005", date: "10 Jan 2025", fund: "Infrastructure", particulars: "Plumbers & Co. – Plumbing repairs", chequeNo: "", lpoLso: "LSO-2025-002", cash: 8500, bank: 0, total: 8500, voteheadAmounts: { "R.M&I": 8500 }, status: "DRAFT", narration: "Plumbing repairs" },
  { id: "6", no: "PV-2025-006", date: "12 Jan 2025", fund: "Tuition", particulars: "Book Sellers Ltd – Textbooks", chequeNo: "3968", lpoLso: "LPO-2025-005", cash: 0, bank: 42000, total: 42000, voteheadAmounts: { "L.T&T": 30000, Activity: 12000 }, status: "DRAFT", narration: "" },
];

const VOTEHEADS = ["BES","E.W&C","PE","R.M&I","Admin Costs","L.T&T","Activity","Homescience","Bursary","Tenders","Advance"];
const ACCOUNTS = ["5100 – Staff Salaries","5200 – Teaching Materials","5300 – Utilities","5400 – Repairs & Maintenance","1400 – Inventory / Stores","6100 – Land & Buildings","6200 – Furniture & Equipment"];

const EMPTY_HDR = { date: "", fund: "", particulars: "", chequeNo: "", lpoLso: "", cash: "", bank: "", voteheadAmounts: {} as Record<string, number>, narration: "" };
const EMPTY_LINE = { account: "", description: "", amount: "" };

export default function PaymentVouchers() {
  const { toast } = useToast();
  const [pvs, setPVs] = useState<PV[]>(INITIAL);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [fundFilter, setFundFilter] = useState("ALL");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [hdr, setHdr] = useState<any>(EMPTY_HDR);
  const [lines, setLines] = useState<any[]>([{ ...EMPTY_LINE }]);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewPV, setViewPV] = useState<PV | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportForm, setExportForm] = useState({ dateFrom: "", dateTo: "", fund: "ALL", account: "ALL", fileType: "pdf" });

  const filtered = pvs.filter(p =>
    (statusFilter === "ALL" || p.status === statusFilter) &&
    (fundFilter === "ALL" || p.fund === fundFilter) &&
    (p.no.toLowerCase().includes(search.toLowerCase()) || p.particulars.toLowerCase().includes(search.toLowerCase()) || p.fund.toLowerCase().includes(search.toLowerCase()))
  );
  const { page, setPage, pageSize, setPageSize, paginatedItems, totalPages, from, to, total: totalRows } = usePagination(filtered);

  const lineTotal = lines.reduce((s: number, l: any) => s + (Number(l.amount) || 0), 0);

  const addLine = () => setLines((p: any[]) => [...p, { ...EMPTY_LINE }]);
  const removeLine = (i: number) => setLines((p: any[]) => p.filter((_: any, idx: number) => idx !== i));
  const updateLine = (i: number, field: string, value: string) => setLines((p: any[]) => p.map((l: any, idx: number) => idx === i ? { ...l, [field]: value } : l));

  const selectedVoteheads = Object.keys(hdr.voteheadAmounts);
  const toggleVotehead = (v: string) => {
    setHdr((p: any) => {
      const amounts = { ...p.voteheadAmounts };
      if (v in amounts) { delete amounts[v]; } else { amounts[v] = 0; }
      return { ...p, voteheadAmounts: amounts };
    });
  };

  const save = () => {
    if (!hdr.date || !hdr.fund || !hdr.particulars || selectedVoteheads.length === 0) { toast({ title: "Fill all required fields (including Fund) and select at least one votehead", variant: "destructive" }); return; }
    const cashAmt = Number(hdr.cash) || 0; const bankAmt = Number(hdr.bank) || 0;
    const noPV = `PV-2025-${String(pvs.length + 1).padStart(3, "0")}`;
    setPVs(p => [...p, { id: Date.now().toString(), no: noPV, date: hdr.date, fund: hdr.fund, particulars: hdr.particulars, chequeNo: hdr.chequeNo, lpoLso: hdr.lpoLso, cash: cashAmt, bank: bankAmt, total: cashAmt + bankAmt, voteheadAmounts: hdr.voteheadAmounts, status: "DRAFT", narration: hdr.narration }]);
    toast({ title: "Payment voucher saved as draft", description: `${hdr.fund} Fund` });
    setDialogOpen(false); setHdr(EMPTY_HDR); setLines([{ ...EMPTY_LINE }]);
  };

  const post = (id: string) => { setPVs(p => p.map(v => v.id === id ? { ...v, status: "POSTED" } : v)); toast({ title: "Payment voucher posted to GL" }); };
  const reverse = (id: string) => { setPVs(p => p.map(v => v.id === id ? { ...v, status: "REVERSED" } : v)); toast({ title: "Payment voucher reversed" }); };

  const openView = (pv: PV) => { setViewPV(pv); setViewDialogOpen(true); };

  // ── Export logic ────────────────────────────────────────────────────────
  const handleExport = () => {
    // Filter data by export form criteria
    let data = pvs.filter(p => p.status === "POSTED");
    if (exportForm.dateFrom) data = data.filter(p => p.date >= exportForm.dateFrom);
    if (exportForm.dateTo) data = data.filter(p => p.date <= exportForm.dateTo);
    if (exportForm.fund !== "ALL") data = data.filter(p => p.fund === exportForm.fund);
    if (exportForm.account !== "ALL") data = data.filter(p => Object.keys(p.voteheadAmounts).includes(exportForm.account));

    if (data.length === 0) {
      toast({ title: "No records match the selected filters", variant: "destructive" });
      return;
    }

    if (exportForm.fileType === "pdf") {
      // Generate printable PDF via browser print
      const win = window.open("", "_blank");
      if (!win) { toast({ title: "Pop-up blocked", variant: "destructive" }); return; }
      const periodLabel = [exportForm.dateFrom, exportForm.dateTo].filter(Boolean).join(" to ") || "All Periods";
      const accountLabel = exportForm.account === "ALL" ? "All Voteheads" : exportForm.account;
      const fundLabel = exportForm.fund === "ALL" ? "All Funds" : exportForm.fund;
      win.document.write(`<!DOCTYPE html><html><head><title>Payment Voucher Register</title>
        <style>
          body{font-family:Arial,sans-serif;font-size:11px;padding:20px;color:#333}
          h1{font-size:16px;margin-bottom:2px} .sub{color:#666;font-size:11px;margin-bottom:14px}
          table{width:100%;border-collapse:collapse;margin-top:8px}
          th,td{border:1px solid #ccc;padding:5px 7px;text-align:left;font-size:10px}
          th{background:#f5f5f5;font-weight:600} .r{text-align:right} .mono{font-family:monospace}
          .footer{margin-top:16px;font-size:9px;color:#999;border-top:1px solid #eee;padding-top:6px}
          @media print{body{padding:0}}
        </style></head><body>
        <h1>Payment Voucher Register</h1>
        <div class="sub">Period: ${periodLabel} &bull; Fund: ${fundLabel} &bull; Votehead: ${accountLabel} &bull; ${data.length} voucher(s)</div>
        <table>
          <tr><th>PV No</th><th>Date</th><th>Fund</th><th>Particulars</th><th>Cheque</th><th>LPO/LSO</th><th class="r">Cash</th><th class="r">Bank</th><th class="r">Total</th><th>Voteheads</th></tr>`);
      let grandTotal = 0;
      for (const v of data) {
        grandTotal += v.total;
        const vhs = Object.entries(v.voteheadAmounts).map(([k, a]) => `${k}: ${fmt(a)}`).join(", ");
        win.document.write(`<tr>
          <td class="mono">${v.no}</td><td>${v.date}</td><td>${v.fund}</td><td>${v.particulars}</td>
          <td class="mono">${v.chequeNo || "—"}</td><td class="mono">${v.lpoLso || "—"}</td>
          <td class="r">${v.cash ? fmt(v.cash) : "—"}</td><td class="r">${v.bank ? fmt(v.bank) : "—"}</td>
          <td class="r" style="font-weight:600">${fmt(v.total)}</td><td>${vhs}</td></tr>`);
      }
      win.document.write(`<tr style="font-weight:700;background:#f9f9f9">
        <td colspan="6">Grand Total</td><td class="r">${fmt(data.reduce((s, v) => s + v.cash, 0))}</td>
        <td class="r">${fmt(data.reduce((s, v) => s + v.bank, 0))}</td><td class="r">${fmt(grandTotal)}</td><td></td></tr>`);
      win.document.write(`</table><div class="footer">Exported on ${new Date().toLocaleDateString("en-KE", { dateStyle: "long" })} &bull; StoreSure School Management</div></body></html>`);
      win.document.close();
      win.focus();
      win.print();
    } else {
      // Generate CSV/Excel download
      const header = ["PV No","Date","Fund","Particulars","Cheque No","LPO/LSO","Cash","Bank","Total","Voteheads","Status","Narration"];
      const csvRows = [header.join(",")];
      for (const v of data) {
        const vhs = Object.entries(v.voteheadAmounts).map(([k, a]) => `${k}: ${a}`).join("; ");
        csvRows.push([
          `"${v.no}"`, `"${v.date}"`, `"${v.fund}"`, `"${v.particulars.replace(/"/g, '""')}"`,
          `"${v.chequeNo}"`, `"${v.lpoLso}"`,
          v.cash, v.bank, v.total,
          `"${vhs}"`, `"${v.status}"`, `"${(v.narration || "").replace(/"/g, '""')}"`
        ].join(","));
      }
      const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `payment-vouchers-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }

    toast({ title: `Export complete (${exportForm.fileType.toUpperCase()})`, description: `${data.length} voucher(s) exported` });
    setExportOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payment Vouchers</h1>
          <p className="text-muted-foreground">Record payments to suppliers and expenses — Dr Expense → Cr Bank/Cash</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { setExportForm({ dateFrom: "", dateTo: "", fund: "ALL", account: "ALL", fileType: "pdf" }); setExportOpen(true); }}>
            <Download className="mr-2 h-4 w-4" />Export
          </Button>
          <Button onClick={() => { setHdr(EMPTY_HDR); setLines([{ ...EMPTY_LINE }]); setDialogOpen(true); }}><Plus className="mr-2 h-4 w-4" />New Payment Voucher</Button>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search PV number, fund or particulars..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={fundFilter} onValueChange={setFundFilter}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="ALL">All Funds</SelectItem>{FUNDS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Status</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="POSTED">Posted</SelectItem>
            <SelectItem value="REVERSED">Reversed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>PV No</TableHead><TableHead>Date</TableHead><TableHead>Fund</TableHead>
                <TableHead>Particulars</TableHead><TableHead>Cheque No</TableHead><TableHead>LPO/LSO</TableHead>
                <TableHead className="text-right">Cash</TableHead><TableHead className="text-right">Bank</TableHead>
                <TableHead className="text-right">Total</TableHead><TableHead>Voteheads</TableHead>
                <TableHead>Status</TableHead><TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedItems.map(v => (
                <TableRow key={v.id}>
                  <TableCell className="font-mono font-medium">{v.no}</TableCell>
                  <TableCell>{v.date}</TableCell>
                  <TableCell><Badge className={FUND_COLORS[v.fund] ?? ""}>{v.fund}</Badge></TableCell>
                  <TableCell>{v.particulars}</TableCell>
                  <TableCell className="font-mono">{v.chequeNo}</TableCell>
                  <TableCell className="font-mono text-sm">{v.lpoLso || "—"}</TableCell>
                  <TableCell className="text-right font-medium">{fmt(v.cash)}</TableCell>
                  <TableCell className="text-right font-medium">{fmt(v.bank)}</TableCell>
                  <TableCell className="text-right font-medium">{fmt(v.total)}</TableCell>
                  <TableCell><div className="flex flex-wrap gap-1">{Object.keys(v.voteheadAmounts).map(vh => <Badge key={vh} variant="outline" className="text-xs">{vh}</Badge>)}</div></TableCell>
                  <TableCell><Badge className={STATUS_COLORS[v.status]}>{v.status}</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openView(v)}><Eye className="h-3.5 w-3.5" /></Button>
                      {v.status === "DRAFT" && <Button size="sm" className="h-7 text-xs" onClick={() => post(v.id)}><Send className="mr-1 h-3 w-3" />Post</Button>}
                      {v.status === "POSTED" && <Button size="sm" variant="outline" className="h-7 text-xs text-red-600" onClick={() => reverse(v.id)}><RotateCcw className="mr-1 h-3 w-3" />Reverse</Button>}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination page={page} totalPages={totalPages} from={from} to={to} total={totalRows} onPageChange={setPage} />
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Payment Voucher Details — {viewPV?.no}</DialogTitle></DialogHeader>
          {viewPV && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div><span className="text-muted-foreground">Date:</span> <span className="font-medium">{viewPV.date}</span></div>
                <div><span className="text-muted-foreground">Fund:</span> <Badge className={FUND_COLORS[viewPV.fund] ?? ""}>{viewPV.fund}</Badge></div>
                <div><span className="text-muted-foreground">Cheque No:</span> <span className="font-medium font-mono">{viewPV.chequeNo || "—"}</span></div>
                <div><span className="text-muted-foreground">LPO/LSO:</span> <span className="font-medium font-mono">{viewPV.lpoLso || "—"}</span></div>
                <div><span className="text-muted-foreground">Status:</span> <Badge className={STATUS_COLORS[viewPV.status]}>{viewPV.status}</Badge></div>
                <div className="md:col-span-3"><span className="text-muted-foreground">Narration:</span> <span className="font-medium">{viewPV.narration || "—"}</span></div>
              </div>
              <div className="text-sm"><span className="text-muted-foreground">Particulars:</span> <span className="font-medium">{viewPV.particulars}</span></div>
              <Separator />
              <div style={{ overflowX: 'auto', width: '100%' }}>
                <table className="text-sm border-collapse" style={{ minWidth: '900px', width: '100%' }}>
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-2 font-medium">Cash</th>
                      <th className="text-left p-2 font-medium">Bank</th>
                      <th className="text-left p-2 font-medium">Total</th>
                      {VOTEHEADS.map(v => <th key={v} className="text-right p-2 font-medium whitespace-nowrap">{v}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="p-2 font-medium">{fmt(viewPV.cash)}</td>
                      <td className="p-2 font-medium">{fmt(viewPV.bank)}</td>
                      <td className="p-2 font-semibold">{fmt(viewPV.total)}</td>
                      {VOTEHEADS.map(v => (
                        <td key={v} className="text-right p-2">
                          {viewPV.voteheadAmounts[v] ? <span className="font-medium">{fmt(viewPV.voteheadAmounts[v])}</span> : <span className="text-muted-foreground">—</span>}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export Dialog */}
      <Dialog open={exportOpen} onOpenChange={setExportOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Export Payment Vouchers</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Period From</Label>
                <Input type="date" value={exportForm.dateFrom} onChange={e => setExportForm(p => ({ ...p, dateFrom: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Period To</Label>
                <Input type="date" value={exportForm.dateTo} onChange={e => setExportForm(p => ({ ...p, dateTo: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Fund</Label>
              <Select value={exportForm.fund} onValueChange={v => setExportForm(p => ({ ...p, fund: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="ALL">All Funds</SelectItem>{FUNDS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Votehead</Label>
              <Select value={exportForm.account} onValueChange={v => setExportForm(p => ({ ...p, account: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Voteheads</SelectItem>
                  {VOTEHEADS.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>File Type</Label>
              <Select value={exportForm.fileType} onValueChange={v => setExportForm(p => ({ ...p, fileType: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="excel">Excel (CSV)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm text-muted-foreground">Only posted vouchers matching the selected filters will be exported.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExportOpen(false)}>Cancel</Button>
            <Button onClick={handleExport}><Download className="mr-2 h-4 w-4" />Export</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New Payment Voucher</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1"><Label>Date *</Label><Input type="date" value={hdr.date} onChange={e => setHdr((p: any) => ({ ...p, date: e.target.value }))} /></div>
              <div className="space-y-1">
                <Label>Fund *</Label>
                <Select value={hdr.fund} onValueChange={v => setHdr((p: any) => ({ ...p, fund: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select fund" /></SelectTrigger>
                  <SelectContent>{FUNDS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label>Cheque No</Label><Input value={hdr.chequeNo} onChange={e => setHdr((p: any) => ({ ...p, chequeNo: e.target.value }))} placeholder="e.g. 3964" /></div>
              <div className="space-y-1 col-span-3"><Label>Particulars *</Label><Input value={hdr.particulars} onChange={e => setHdr((p: any) => ({ ...p, particulars: e.target.value }))} placeholder="e.g. Unga Holdings Ltd – Food supplies" /></div>
              <div className="space-y-1"><Label>LPO/LSO No</Label><Input value={hdr.lpoLso} onChange={e => setHdr((p: any) => ({ ...p, lpoLso: e.target.value }))} placeholder="e.g. LPO-2025-001" /></div>
              <div className="space-y-1"><Label>Cash</Label><Input type="number" value={hdr.cash} onChange={e => setHdr((p: any) => ({ ...p, cash: e.target.value }))} placeholder="0" /></div>
              <div className="space-y-1"><Label>Bank</Label><Input type="number" value={hdr.bank} onChange={e => setHdr((p: any) => ({ ...p, bank: e.target.value }))} placeholder="0" /></div>
            </div>
            <div className="space-y-1">
              <Label>Voteheads * <span className="text-xs text-muted-foreground font-normal">(click to toggle, then enter amount)</span></Label>
              <div className="flex flex-wrap gap-1.5">
                {VOTEHEADS.map(v => {
                  const selected = v in hdr.voteheadAmounts;
                  return <Badge key={v} variant={selected ? "default" : "outline"} className={`cursor-pointer select-none ${selected ? "" : "opacity-50"}`} onClick={() => toggleVotehead(v)}>{v}</Badge>;
                })}
              </div>
              {selectedVoteheads.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {selectedVoteheads.map(v => (
                    <div key={v} className="space-y-1">
                      <Label className="text-xs">{v} Amount</Label>
                      <Input type="number" className="h-8" placeholder="0" value={hdr.voteheadAmounts[v] || ""} onChange={e => setHdr((p: any) => ({ ...p, voteheadAmounts: { ...p.voteheadAmounts, [v]: Number(e.target.value) || 0 } }))} />
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-1"><Label>Narration</Label><Textarea value={hdr.narration} onChange={e => setHdr((p: any) => ({ ...p, narration: e.target.value }))} rows={2} /></div>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Line Items</Label>
                <Button type="button" size="sm" variant="outline" onClick={addLine}><Plus className="mr-1 h-3 w-3" />Add Line</Button>
              </div>
              <Table>
                <TableHeader><TableRow><TableHead>Account</TableHead><TableHead>Description</TableHead><TableHead className="text-right w-36">Amount (KES)</TableHead><TableHead className="w-10"></TableHead></TableRow></TableHeader>
                <TableBody>
                  {lines.map((l: any, i: number) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Select value={l.account} onValueChange={v => updateLine(i, "account", v)}>
                          <SelectTrigger className="h-8"><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>{ACCOUNTS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell><Input className="h-8" value={l.description} onChange={e => updateLine(i, "description", e.target.value)} /></TableCell>
                      <TableCell><Input className="h-8 text-right" type="number" value={l.amount} onChange={e => updateLine(i, "amount", e.target.value)} /></TableCell>
                      <TableCell>{lines.length > 1 && <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => removeLine(i)}><Trash2 className="h-3 w-3" /></Button>}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex justify-end text-sm font-semibold">Total: {fmt(lineTotal)}</div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={save}>Save as Draft</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
