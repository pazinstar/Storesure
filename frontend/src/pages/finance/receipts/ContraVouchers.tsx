import { useState } from "react";
import { Plus, Search, Send, RotateCcw, Download, ArrowRightLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/ui/table-pagination";

const fmt = (n: number) => new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(n);
const STATUS_COLORS: Record<string, string> = { DRAFT: "bg-gray-100 text-gray-700", POSTED: "bg-green-100 text-green-800", REVERSED: "bg-red-100 text-red-700" };

interface CV { id: string; no: string; date: string; fromFund: string; toFund: string; from: string; to: string; amount: number; chequeRef: string; period: string; status: string; narration: string; }

const INITIAL: CV[] = [
  { id: "1", no: "CV-2025-001", date: "03 Jan 2025", fromFund: "Tuition", toFund: "Tuition", from: "Cash at Hand", to: "Cash at Bank – Equity", amount: 50000, chequeRef: "DEP-001", period: "P01 Jan-25", status: "POSTED", narration: "Cash banked" },
  { id: "2", no: "CV-2025-002", date: "10 Jan 2025", fromFund: "Tuition", toFund: "Operation", from: "Cash at Bank – Equity", to: "Cash at Bank – KCB", amount: 120000, chequeRef: "TRF-018", period: "P01 Jan-25", status: "POSTED", narration: "Transfer to operations for Jan expenses" },
  { id: "3", no: "CV-2025-003", date: "15 Jan 2025", fromFund: "Tuition", toFund: "Infrastructure", from: "Cash at Bank – Equity", to: "Cash at Bank – KCB", amount: 300000, chequeRef: "TRF-019", period: "P01 Jan-25", status: "DRAFT", narration: "Allocation for dormitory repair" },
  { id: "4", no: "CV-2025-004", date: "20 Jan 2025", fromFund: "Operation", toFund: "School Fund", from: "Cash at Bank – KCB", to: "Petty Cash", amount: 5000, chequeRef: "WD-046", period: "P01 Jan-25", status: "DRAFT", narration: "Sports fund replenishment" },
];

const FUNDS = ["Tuition", "Operation", "Infrastructure", "School Fund"];
const ACCOUNTS = ["Cash at Hand", "Cash at Bank – Equity", "Cash at Bank – KCB", "Petty Cash"];
const PERIODS = ["P01 Jan-25", "P02 Feb-25", "P04 Oct-24"];
const EMPTY = { date: "", fromFund: "", toFund: "", from: "", to: "", amount: "", chequeRef: "", period: "", narration: "" };

interface PostingLine { fund: string; account: string; dr: number; cr: number; }
function buildPostings(cv: { fromFund: string; toFund: string; from: string; to: string; amount: number }): PostingLine[] {
  const amt = Number(cv.amount) || 0;
  if (cv.fromFund === cv.toFund) {
    return [
      { fund: cv.fromFund, account: cv.to, dr: amt, cr: 0 },
      { fund: cv.fromFund, account: cv.from, dr: 0, cr: amt },
    ];
  }
  return [
    { fund: cv.fromFund, account: `Due from ${cv.toFund} Fund`, dr: amt, cr: 0 },
    { fund: cv.fromFund, account: cv.from, dr: 0, cr: amt },
    { fund: cv.toFund, account: cv.to, dr: amt, cr: 0 },
    { fund: cv.toFund, account: `Due to ${cv.fromFund} Fund`, dr: 0, cr: amt },
  ];
}

export default function ContraVouchers() {
  const { toast } = useToast();
  const [cvs, setCVs] = useState<CV[]>(INITIAL);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [fundFilter, setFundFilter] = useState("ALL");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<any>(EMPTY);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportForm, setExportForm] = useState({ dateFrom: "", dateTo: "", fund: "ALL", fileType: "pdf" });

  const filtered = cvs.filter(c =>
    (statusFilter === "ALL" || c.status === statusFilter) &&
    (fundFilter === "ALL" || c.fromFund === fundFilter || c.toFund === fundFilter) &&
    (c.no.toLowerCase().includes(search.toLowerCase()) || c.from.toLowerCase().includes(search.toLowerCase()) || c.to.toLowerCase().includes(search.toLowerCase()) || c.fromFund.toLowerCase().includes(search.toLowerCase()) || c.toFund.toLowerCase().includes(search.toLowerCase()))
  );
  const { page, setPage, paginatedItems, totalPages, from, to, total: totalRows } = usePagination(filtered);

  const isCrossFund = form.fromFund && form.toFund && form.fromFund !== form.toFund;
  const previewPostings = form.fromFund && form.toFund && form.from && form.to && form.amount
    ? buildPostings({ fromFund: form.fromFund, toFund: form.toFund, from: form.from, to: form.to, amount: Number(form.amount) || 0 })
    : [];

  const interFundTotal = cvs.filter(c => c.status === "POSTED" && c.fromFund !== c.toFund).reduce((s, c) => s + c.amount, 0);
  const sameFundTotal = cvs.filter(c => c.status === "POSTED" && c.fromFund === c.toFund).reduce((s, c) => s + c.amount, 0);

  const save = () => {
    if (!form.date || !form.fromFund || !form.toFund || !form.from || !form.to || !form.amount || !form.period) { toast({ title: "Fill all required fields", variant: "destructive" }); return; }
    if (form.fromFund === form.toFund && form.from === form.to) { toast({ title: "Same-fund transfer must use different cash accounts", variant: "destructive" }); return; }
    const no = `CV-2025-${String(cvs.length + 1).padStart(3, "0")}`;
    setCVs(p => [...p, { id: Date.now().toString(), no, date: form.date, fromFund: form.fromFund, toFund: form.toFund, from: form.from, to: form.to, amount: Number(form.amount), chequeRef: form.chequeRef, period: form.period, status: "DRAFT", narration: form.narration }]);
    toast({ title: "Contra voucher saved as draft", description: form.fromFund === form.toFund ? `${form.fromFund} — same-fund transfer` : `${form.fromFund} → ${form.toFund} — inter-fund transfer` });
    setDialogOpen(false); setForm(EMPTY);
  };

  const post = (id: string) => {
    const cv = cvs.find(c => c.id === id); if (!cv) return;
    const lines = buildPostings(cv);
    const isCross = cv.fromFund !== cv.toFund;
    setCVs(p => p.map(c => c.id === id ? { ...c, status: "POSTED" } : c));
    toast({
      title: isCross ? `Inter-fund transfer posted: ${cv.fromFund} → ${cv.toFund}` : `Same-fund transfer posted: ${cv.fromFund}`,
      description: `${lines.length} ledger lines written • ${fmt(cv.amount)}`,
    });
  };
  const reverse = (id: string) => { setCVs(p => p.map(c => c.id === id ? { ...c, status: "REVERSED" } : c)); toast({ title: "Contra voucher reversed" }); };

  const handleExport = () => {
    let data = cvs.filter(c => c.status === "POSTED");
    if (exportForm.dateFrom) data = data.filter(c => c.date >= exportForm.dateFrom);
    if (exportForm.dateTo) data = data.filter(c => c.date <= exportForm.dateTo);
    if (exportForm.fund !== "ALL") data = data.filter(c => c.fromFund === exportForm.fund || c.toFund === exportForm.fund);
    if (data.length === 0) { toast({ title: "No records match the selected filters", variant: "destructive" }); return; }

    if (exportForm.fileType === "pdf") {
      const win = window.open("", "_blank"); if (!win) { toast({ title: "Pop-up blocked", variant: "destructive" }); return; }
      const periodLabel = [exportForm.dateFrom, exportForm.dateTo].filter(Boolean).join(" to ") || "All Periods";
      const fundLabel = exportForm.fund === "ALL" ? "All Funds" : exportForm.fund;
      win.document.write(`<!DOCTYPE html><html><head><title>Contra Voucher Register</title>
        <style>body{font-family:Arial,sans-serif;font-size:11px;padding:20px;color:#333}h1{font-size:16px;margin-bottom:2px}.sub{color:#666;font-size:11px;margin-bottom:14px}table{width:100%;border-collapse:collapse;margin-top:8px}th,td{border:1px solid #ccc;padding:5px 7px;text-align:left;font-size:10px}th{background:#f5f5f5;font-weight:600}.r{text-align:right}.mono{font-family:monospace}.xf{background:#fef3c7;color:#92400e;padding:1px 5px;border-radius:3px;font-size:9px;font-weight:600}.footer{margin-top:16px;font-size:9px;color:#999;border-top:1px solid #eee;padding-top:6px}@media print{body{padding:0}}</style>
        </head><body><h1>Contra Voucher Register</h1>
        <div class="sub">Period: ${periodLabel} &bull; Fund: ${fundLabel} &bull; ${data.length} voucher(s)</div>
        <table><tr><th>CV No</th><th>Date</th><th>From Fund</th><th>To Fund</th><th>From Account</th><th>To Account</th><th class="r">Amount</th><th>Cheque/Ref</th><th>Narration</th></tr>`);
      let grandTotal = 0, xfTotal = 0;
      for (const c of data) {
        const cross = c.fromFund !== c.toFund;
        grandTotal += c.amount; if (cross) xfTotal += c.amount;
        win.document.write(`<tr><td class="mono">${c.no}</td><td>${c.date}</td><td>${c.fromFund}${cross ? ' <span class="xf">XF</span>' : ''}</td><td>${c.toFund}</td><td>${c.from}</td><td>${c.to}</td><td class="r" style="font-weight:600">${fmt(c.amount)}</td><td class="mono">${c.chequeRef || "—"}</td><td>${c.narration || "—"}</td></tr>`);
      }
      win.document.write(`<tr style="font-weight:700;background:#f9f9f9"><td colspan="6">Grand Total</td><td class="r">${fmt(grandTotal)}</td><td colspan="2"></td></tr><tr style="background:#fffbeb"><td colspan="6">Of which Inter-Fund (XF)</td><td class="r">${fmt(xfTotal)}</td><td colspan="2"></td></tr>`);
      win.document.write(`</table><div class="footer">Exported on ${new Date().toLocaleDateString("en-KE", { dateStyle: "long" })} &bull; StoreSure School Management</div></body></html>`);
      win.document.close(); win.focus(); win.print();
    } else {
      const header = ["CV No", "Date", "From Fund", "To Fund", "From Account", "To Account", "Amount", "Cheque/Ref", "Period", "Status", "Inter-Fund", "Narration"];
      const rows = [header.join(",")];
      for (const c of data) {
        rows.push([`"${c.no}"`, `"${c.date}"`, `"${c.fromFund}"`, `"${c.toFund}"`, `"${c.from}"`, `"${c.to}"`, c.amount, `"${c.chequeRef}"`, `"${c.period}"`, `"${c.status}"`, c.fromFund !== c.toFund ? "YES" : "NO", `"${(c.narration || "").replace(/"/g, '""')}"`].join(","));
      }
      const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = `contra-vouchers-${new Date().toISOString().slice(0, 10)}.csv`; a.click(); URL.revokeObjectURL(url);
    }
    toast({ title: `Export complete (${exportForm.fileType.toUpperCase()})`, description: `${data.length} voucher(s) exported` });
    setExportOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Contra Vouchers</h1>
          <p className="text-muted-foreground">Cash ↔ Bank & inter-fund transfers — cross-fund posts to 4 ledger lines via inter-fund control accounts</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { setExportForm({ dateFrom: "", dateTo: "", fund: "ALL", fileType: "pdf" }); setExportOpen(true); }}>
            <Download className="mr-2 h-4 w-4" />Export
          </Button>
          <Button onClick={() => { setForm(EMPTY); setDialogOpen(true); }}><Plus className="mr-2 h-4 w-4" />New Contra Voucher</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Same-Fund Transfers (Posted)</div><div className="text-2xl font-bold mt-1">{fmt(sameFundTotal)}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground flex items-center gap-1"><ArrowRightLeft className="h-3 w-3" />Inter-Fund Transfers (Posted)</div><div className="text-2xl font-bold mt-1 text-amber-700">{fmt(interFundTotal)}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Total Posted</div><div className="text-2xl font-bold mt-1 text-green-700">{fmt(sameFundTotal + interFundTotal)}</div></CardContent></Card>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search voucher, account or fund..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
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
                <TableHead>CV No</TableHead><TableHead>Date</TableHead>
                <TableHead>From Fund → To Fund</TableHead>
                <TableHead>From Account</TableHead><TableHead>To Account</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Cheque/Ref</TableHead><TableHead>Period</TableHead>
                <TableHead>Status</TableHead><TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedItems.map(c => {
                const cross = c.fromFund !== c.toFund;
                return (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono font-medium">{c.no}</TableCell>
                    <TableCell>{c.date}</TableCell>
                    <TableCell className="text-sm">
                      <div className="flex items-center gap-1">
                        <span>{c.fromFund}</span>
                        <ArrowRightLeft className={`h-3 w-3 ${cross ? "text-amber-600" : "text-muted-foreground"}`} />
                        <span>{c.toFund}</span>
                        {cross && <Badge className="ml-1 bg-amber-100 text-amber-800 text-[10px] h-4 px-1">XF</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{c.from}</TableCell>
                    <TableCell className="text-sm">{c.to}</TableCell>
                    <TableCell className="text-right font-medium">{fmt(c.amount)}</TableCell>
                    <TableCell className="font-mono text-sm">{c.chequeRef || "—"}</TableCell>
                    <TableCell className="font-mono text-sm">{c.period}</TableCell>
                    <TableCell><Badge className={STATUS_COLORS[c.status]}>{c.status}</Badge></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {c.status === "DRAFT" && <Button size="sm" className="h-7 text-xs" onClick={() => post(c.id)}><Send className="mr-1 h-3 w-3" />Post</Button>}
                        {c.status === "POSTED" && <Button size="sm" variant="outline" className="h-7 text-xs text-red-600" onClick={() => reverse(c.id)}><RotateCcw className="mr-1 h-3 w-3" />Reverse</Button>}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <TablePagination page={page} totalPages={totalPages} from={from} to={to} total={totalRows} onPageChange={setPage} />
        </CardContent>
      </Card>

      {/* Export Dialog */}
      <Dialog open={exportOpen} onOpenChange={setExportOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Export Contra Vouchers</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1"><Label>Period From</Label><Input type="date" value={exportForm.dateFrom} onChange={e => setExportForm(p => ({ ...p, dateFrom: e.target.value }))} /></div>
              <div className="space-y-1"><Label>Period To</Label><Input type="date" value={exportForm.dateTo} onChange={e => setExportForm(p => ({ ...p, dateTo: e.target.value }))} /></div>
            </div>
            <div className="space-y-1">
              <Label>Fund</Label>
              <Select value={exportForm.fund} onValueChange={v => setExportForm(p => ({ ...p, fund: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="ALL">All Funds</SelectItem>{FUNDS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>File Type</Label>
              <Select value={exportForm.fileType} onValueChange={v => setExportForm(p => ({ ...p, fileType: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="pdf">PDF</SelectItem><SelectItem value="excel">Excel (CSV)</SelectItem></SelectContent>
              </Select>
            </div>
            <p className="text-sm text-muted-foreground">Only posted contra vouchers matching the filters will be exported. Inter-fund transfers are tagged XF.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExportOpen(false)}>Cancel</Button>
            <Button onClick={handleExport}><Download className="mr-2 h-4 w-4" />Export</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New CV Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>New Contra Voucher</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2 max-h-[70vh] overflow-y-auto pr-1">
            <div className="space-y-1"><Label>Date *</Label><Input type="date" value={form.date} onChange={e => setForm((p: any) => ({ ...p, date: e.target.value }))} /></div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>From Fund *</Label>
                <Select value={form.fromFund} onValueChange={v => setForm((p: any) => ({ ...p, fromFund: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{FUNDS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>To Fund *</Label>
                <Select value={form.toFund} onValueChange={v => setForm((p: any) => ({ ...p, toFund: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{FUNDS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>From Account (paying) *</Label>
                <Select value={form.from} onValueChange={v => setForm((p: any) => ({ ...p, from: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{ACCOUNTS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>To Account (receiving) *</Label>
                <Select value={form.to} onValueChange={v => setForm((p: any) => ({ ...p, to: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{ACCOUNTS.filter(a => a !== form.from || form.fromFund !== form.toFund).map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Amount (KES) *</Label><Input type="number" value={form.amount} onChange={e => setForm((p: any) => ({ ...p, amount: e.target.value }))} /></div>
              <div className="space-y-1"><Label>Cheque / Reference No</Label><Input value={form.chequeRef} onChange={e => setForm((p: any) => ({ ...p, chequeRef: e.target.value }))} /></div>
            </div>

            <div className="space-y-1">
              <Label>Period *</Label>
              <Select value={form.period} onValueChange={v => setForm((p: any) => ({ ...p, period: v }))}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{PERIODS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>Narration</Label><Textarea value={form.narration} onChange={e => setForm((p: any) => ({ ...p, narration: e.target.value }))} rows={2} /></div>

            {previewPostings.length > 0 && (
              <div className={`rounded-md border p-3 ${isCrossFund ? "border-amber-300 bg-amber-50" : "border-green-200 bg-green-50"}`}>
                <div className="flex items-center gap-2 mb-2">
                  <ArrowRightLeft className={`h-4 w-4 ${isCrossFund ? "text-amber-700" : "text-green-700"}`} />
                  <span className="text-xs font-semibold uppercase tracking-wide">
                    {isCrossFund ? `Inter-Fund Transfer — ${previewPostings.length} ledger lines` : `Same-Fund Transfer — ${previewPostings.length} ledger lines`}
                  </span>
                </div>
                <table className="w-full text-xs">
                  <thead><tr className="text-muted-foreground"><th className="text-left font-medium pb-1">Fund</th><th className="text-left font-medium pb-1">Account</th><th className="text-right font-medium pb-1">Dr</th><th className="text-right font-medium pb-1">Cr</th></tr></thead>
                  <tbody>
                    {previewPostings.map((l, i) => (
                      <tr key={i} className="border-t border-muted-foreground/10">
                        <td className="py-1 pr-2">{l.fund}</td>
                        <td className="py-1 pr-2">{l.account}</td>
                        <td className="py-1 text-right font-mono">{l.dr ? fmt(l.dr) : "—"}</td>
                        <td className="py-1 text-right font-mono">{l.cr ? fmt(l.cr) : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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
