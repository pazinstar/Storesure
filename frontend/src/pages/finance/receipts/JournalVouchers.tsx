import { useState } from "react";
import { Plus, Search, Send, RotateCcw, Trash2, AlertTriangle, Download } from "lucide-react";
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

interface JV { id: string; no: string; date: string; fund: string; reference: string; description: string; totalDr: number; totalCr: number; period: string; status: string; }

const FUNDS = ["Tuition", "Operation", "Infrastructure", "School Fund"];
const FUND_COLORS: Record<string, string> = { Tuition: "bg-blue-100 text-blue-800", Operation: "bg-emerald-100 text-emerald-800", Infrastructure: "bg-amber-100 text-amber-800", "School Fund": "bg-purple-100 text-purple-800" };

const INITIAL: JV[] = [
  { id: "1", no: "JV-2025-001", date: "31 Jan 2025", fund: "Operation", reference: "Accrual", description: "Month-end accruals", totalDr: 285000, totalCr: 285000, period: "P01 Jan-25", status: "POSTED" },
  { id: "2", no: "JV-2025-002", date: "31 Jan 2025", fund: "Tuition", reference: "Prepay", description: "Prepayment amortization", totalDr: 12000, totalCr: 12000, period: "P01 Jan-25", status: "POSTED" },
  { id: "3", no: "JV-2025-003", date: "31 Jan 2025", fund: "Operation", reference: "Adj", description: "Stock consumption adjustment", totalDr: 45000, totalCr: 45000, period: "P01 Jan-25", status: "DRAFT" },
  { id: "4", no: "JV-2025-004", date: "31 Jan 2025", fund: "Operation", reference: "Reversal", description: "Month-end reversal", totalDr: 285000, totalCr: 285000, period: "P02 Feb-25", status: "DRAFT" },
  { id: "5", no: "JV-2025-005", date: "15 Jan 2025", fund: "Tuition", reference: "Opening", description: "Opening balance entry", totalDr: 1250000, totalCr: 1250000, period: "P01 Jan-25", status: "POSTED" },
];

const ACCOUNTS = ["1100 – Cash at Hand","1200 – Cash at Bank – Equity","1300 – Student Debtors","1400 – Inventory / Stores","1500 – Prepayments","2100 – Accounts Payable","2200 – Deferred Income","3100 – Accumulated Fund","4100 – School Fees Income","5100 – Staff Salaries","5200 – Teaching Materials","5300 – Utilities","5400 – Repairs & Maintenance","5500 – Depreciation"];
const PERIODS = ["P01 Jan-25","P02 Feb-25","P04 Oct-24"];

const EMPTY_HDR = { date: "", fund: "", reference: "", description: "", period: "" };
const EMPTY_LINE = { account: "", dr: "", cr: "", narration: "" };

export default function JournalVouchers() {
  const { toast } = useToast();
  const [jvs, setJVs] = useState<JV[]>(INITIAL);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [fundFilter, setFundFilter] = useState("ALL");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [hdr, setHdr] = useState<any>(EMPTY_HDR);
  const [lines, setLines] = useState<any[]>([{ ...EMPTY_LINE }, { ...EMPTY_LINE }]);

  const [exportOpen, setExportOpen] = useState(false);
  const [exportForm, setExportForm] = useState({ dateFrom: "", dateTo: "", fund: "ALL", account: "ALL", fileType: "pdf" });

  const filtered = jvs.filter(j =>
    (statusFilter === "ALL" || j.status === statusFilter) &&
    (fundFilter === "ALL" || j.fund === fundFilter) &&
    (j.no.toLowerCase().includes(search.toLowerCase()) || j.description.toLowerCase().includes(search.toLowerCase()) || j.fund.toLowerCase().includes(search.toLowerCase()))
  );
  const { page, setPage, pageSize, setPageSize, paginatedItems, totalPages, from, to, total: totalRows } = usePagination(filtered);

  const totalDr = lines.reduce((s: number, l: any) => s + (Number(l.dr) || 0), 0);
  const totalCr = lines.reduce((s: number, l: any) => s + (Number(l.cr) || 0), 0);
  const balanced = Math.abs(totalDr - totalCr) < 0.01;

  const addLine = () => setLines((p: any[]) => [...p, { ...EMPTY_LINE }]);
  const removeLine = (i: number) => setLines((p: any[]) => p.filter((_: any, idx: number) => idx !== i));
  const updateLine = (i: number, field: string, value: string) => setLines((p: any[]) => p.map((l: any, idx: number) => idx === i ? { ...l, [field]: value } : l));

  const save = () => {
    if (!hdr.date || !hdr.fund || !hdr.description || !hdr.period) { toast({ title: "Fill all required fields (including Fund)", variant: "destructive" }); return; }
    if (!balanced) { toast({ title: "Journal is not balanced — Debits must equal Credits", variant: "destructive" }); return; }
    const no = `JV-2025-${String(jvs.length + 1).padStart(3, "0")}`;
    setJVs(p => [...p, { id: Date.now().toString(), no, date: hdr.date, fund: hdr.fund, reference: hdr.reference, description: hdr.description, totalDr, totalCr, period: hdr.period, status: "DRAFT" }]);
    toast({ title: "Journal voucher saved as draft", description: `${hdr.fund} Fund` });
    setDialogOpen(false); setHdr(EMPTY_HDR); setLines([{ ...EMPTY_LINE }, { ...EMPTY_LINE }]);
  };

  const post = (id: string) => { setJVs(p => p.map(j => j.id === id ? { ...j, status: "POSTED" } : j)); toast({ title: "Journal posted to GL" }); };
  const reverse = (id: string) => { setJVs(p => p.map(j => j.id === id ? { ...j, status: "REVERSED" } : j)); toast({ title: "Journal reversed" }); };

  // ── Export logic ────────────────────────────────────────────────────────
  const handleExport = () => {
    let data = jvs.filter(j => j.status === "POSTED");
    if (exportForm.dateFrom) data = data.filter(j => j.date >= exportForm.dateFrom);
    if (exportForm.dateTo) data = data.filter(j => j.date <= exportForm.dateTo);
    if (exportForm.fund !== "ALL") data = data.filter(j => j.fund === exportForm.fund);
    if (exportForm.account !== "ALL") data = data.filter(j => j.period === exportForm.account);

    if (data.length === 0) { toast({ title: "No records match the selected filters", variant: "destructive" }); return; }

    if (exportForm.fileType === "pdf") {
      const win = window.open("", "_blank");
      if (!win) { toast({ title: "Pop-up blocked", variant: "destructive" }); return; }
      const periodLabel = [exportForm.dateFrom, exportForm.dateTo].filter(Boolean).join(" to ") || "All Periods";
      const accountLabel = exportForm.account === "ALL" ? "All Periods" : exportForm.account;
      const fundLabel = exportForm.fund === "ALL" ? "All Funds" : exportForm.fund;
      win.document.write(`<!DOCTYPE html><html><head><title>Journal Voucher Register</title>
        <style>
          body{font-family:Arial,sans-serif;font-size:11px;padding:20px;color:#333}
          h1{font-size:16px;margin-bottom:2px} .sub{color:#666;font-size:11px;margin-bottom:14px}
          table{width:100%;border-collapse:collapse;margin-top:8px}
          th,td{border:1px solid #ccc;padding:5px 7px;text-align:left;font-size:10px}
          th{background:#f5f5f5;font-weight:600} .r{text-align:right} .mono{font-family:monospace}
          .footer{margin-top:16px;font-size:9px;color:#999;border-top:1px solid #eee;padding-top:6px}
          @media print{body{padding:0}}
        </style></head><body>
        <h1>Journal Voucher Register</h1>
        <div class="sub">Period: ${periodLabel} &bull; Fund: ${fundLabel} &bull; Account Period: ${accountLabel} &bull; ${data.length} journal(s)</div>
        <table>
          <tr><th>JV No</th><th>Date</th><th>Fund</th><th>Reference</th><th>Description</th><th class="r">Total Dr</th><th class="r">Total Cr</th><th>Period</th></tr>`);
      let grandDr = 0, grandCr = 0;
      for (const j of data) {
        grandDr += j.totalDr; grandCr += j.totalCr;
        win.document.write(`<tr>
          <td class="mono">${j.no}</td><td>${j.date}</td><td>${j.fund}</td><td>${j.reference}</td><td>${j.description}</td>
          <td class="r">${fmt(j.totalDr)}</td><td class="r">${fmt(j.totalCr)}</td><td class="mono">${j.period}</td></tr>`);
      }
      win.document.write(`<tr style="font-weight:700;background:#f9f9f9">
        <td colspan="5">Grand Total</td><td class="r">${fmt(grandDr)}</td><td class="r">${fmt(grandCr)}</td><td></td></tr>`);
      win.document.write(`</table><div class="footer">Exported on ${new Date().toLocaleDateString("en-KE", { dateStyle: "long" })} &bull; StoreSure School Management</div></body></html>`);
      win.document.close(); win.focus(); win.print();
    } else {
      const header = ["JV No","Date","Fund","Reference","Description","Total Dr","Total Cr","Period","Status"];
      const csvRows = [header.join(",")];
      for (const j of data) {
        csvRows.push([
          `"${j.no}"`, `"${j.date}"`, `"${j.fund}"`, `"${j.reference}"`, `"${j.description.replace(/"/g, '""')}"`,
          j.totalDr, j.totalCr, `"${j.period}"`, `"${j.status}"`
        ].join(","));
      }
      const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url;
      a.download = `journal-vouchers-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click(); URL.revokeObjectURL(url);
    }
    toast({ title: `Export complete (${exportForm.fileType.toUpperCase()})`, description: `${data.length} journal(s) exported` });
    setExportOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Journal Vouchers</h1>
          <p className="text-muted-foreground">Manual GL adjustments — balanced double-entry journals</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { setExportForm({ dateFrom: "", dateTo: "", fund: "ALL", account: "ALL", fileType: "pdf" }); setExportOpen(true); }}>
            <Download className="mr-2 h-4 w-4" />Export
          </Button>
          <Button onClick={() => { setHdr(EMPTY_HDR); setLines([{ ...EMPTY_LINE }, { ...EMPTY_LINE }]); setDialogOpen(true); }}><Plus className="mr-2 h-4 w-4" />New Journal</Button>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search JV number, fund or description..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
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
                <TableHead>JV No</TableHead><TableHead>Date</TableHead><TableHead>Fund</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Description</TableHead><TableHead className="text-right">Total Dr</TableHead>
                <TableHead className="text-right">Total Cr</TableHead><TableHead>Period</TableHead>
                <TableHead>Status</TableHead><TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedItems.map(j => (
                <TableRow key={j.id}>
                  <TableCell className="font-mono font-medium">{j.no}</TableCell>
                  <TableCell>{j.date}</TableCell>
                  <TableCell><Badge className={FUND_COLORS[j.fund] ?? ""}>{j.fund}</Badge></TableCell>
                  <TableCell>{j.reference}</TableCell>
                  <TableCell>{j.description}</TableCell>
                  <TableCell className="text-right">{fmt(j.totalDr)}</TableCell>
                  <TableCell className="text-right">{fmt(j.totalCr)}</TableCell>
                  <TableCell className="font-mono text-sm">{j.period}</TableCell>
                  <TableCell><Badge className={STATUS_COLORS[j.status]}>{j.status}</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {j.status === "DRAFT" && <Button size="sm" className="h-7 text-xs" onClick={() => post(j.id)}><Send className="mr-1 h-3 w-3" />Post</Button>}
                      {j.status === "POSTED" && <Button size="sm" variant="outline" className="h-7 text-xs text-red-600" onClick={() => reverse(j.id)}><RotateCcw className="mr-1 h-3 w-3" />Reverse</Button>}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination page={page} totalPages={totalPages} from={from} to={to} total={totalRows} onPageChange={setPage} />
        </CardContent>
      </Card>

      {/* Export Dialog */}
      <Dialog open={exportOpen} onOpenChange={setExportOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Export Journal Vouchers</DialogTitle></DialogHeader>
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
              <Label>Account Period</Label>
              <Select value={exportForm.account} onValueChange={v => setExportForm(p => ({ ...p, account: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Periods</SelectItem>
                  {PERIODS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
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
            <p className="text-sm text-muted-foreground">Only posted journals matching the selected filters will be exported.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExportOpen(false)}>Cancel</Button>
            <Button onClick={handleExport}><Download className="mr-2 h-4 w-4" />Export</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New Journal Voucher</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-1"><Label>Date *</Label><Input type="date" value={hdr.date} onChange={e => setHdr((p: any) => ({ ...p, date: e.target.value }))} /></div>
              <div className="space-y-1">
                <Label>Fund *</Label>
                <Select value={hdr.fund} onValueChange={v => setHdr((p: any) => ({ ...p, fund: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select fund" /></SelectTrigger>
                  <SelectContent>{FUNDS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label>Reference</Label><Input value={hdr.reference} onChange={e => setHdr((p: any) => ({ ...p, reference: e.target.value }))} /></div>
              <div className="space-y-1">
                <Label>Period *</Label>
                <Select value={hdr.period} onValueChange={v => setHdr((p: any) => ({ ...p, period: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{PERIODS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1"><Label>Description *</Label><Textarea value={hdr.description} onChange={e => setHdr((p: any) => ({ ...p, description: e.target.value }))} rows={2} /></div>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Journal Lines</Label>
                <Button type="button" size="sm" variant="outline" onClick={addLine}><Plus className="mr-1 h-3 w-3" />Add Line</Button>
              </div>
              <Table>
                <TableHeader><TableRow><TableHead>Account</TableHead><TableHead className="text-right w-36">Debit (KES)</TableHead><TableHead className="text-right w-36">Credit (KES)</TableHead><TableHead>Narration</TableHead><TableHead className="w-10"></TableHead></TableRow></TableHeader>
                <TableBody>
                  {lines.map((l: any, i: number) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Select value={l.account} onValueChange={v => updateLine(i, "account", v)}>
                          <SelectTrigger className="h-8"><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>{ACCOUNTS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell><Input className="h-8 text-right" type="number" value={l.dr} onChange={e => updateLine(i, "dr", e.target.value)} /></TableCell>
                      <TableCell><Input className="h-8 text-right" type="number" value={l.cr} onChange={e => updateLine(i, "cr", e.target.value)} /></TableCell>
                      <TableCell><Input className="h-8" value={l.narration} onChange={e => updateLine(i, "narration", e.target.value)} /></TableCell>
                      <TableCell>{lines.length > 2 && <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => removeLine(i)}><Trash2 className="h-3 w-3" /></Button>}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex justify-end gap-8 text-sm border-t pt-2">
                <span>Total Dr: <strong>{fmt(totalDr)}</strong></span>
                <span>Total Cr: <strong>{fmt(totalCr)}</strong></span>
                {!balanced && totalDr > 0 && (
                  <span className="flex items-center gap-1 text-red-600 font-medium"><AlertTriangle className="h-4 w-4" />Not balanced (Diff: {fmt(Math.abs(totalDr - totalCr))})</span>
                )}
                {balanced && totalDr > 0 && <span className="text-green-600 font-medium">✓ Balanced</span>}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={!balanced && totalDr > 0}>Save as Draft</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
