import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TablePagination } from "@/components/ui/table-pagination";
import { usePagination } from "@/hooks/usePagination";
import { Search, Printer, FileText, Loader2, Filter } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { useSchool } from "@/contexts/SchoolContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { S12Requisition } from "@/mock/data";

const fmtDate = (s?: string) => {
  if (!s) return "";
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
};

const STATUS_BADGE: Record<string, string> = {
  "Draft": "bg-zinc-100 text-zinc-700 border-zinc-200",
  "Pending Approval": "bg-amber-100 text-amber-800 border-amber-200",
  "Approved": "bg-blue-100 text-blue-800 border-blue-200",
  "Issued": "bg-emerald-100 text-emerald-800 border-emerald-200",
  "Received": "bg-emerald-100 text-emerald-800 border-emerald-200",
  "Rejected": "bg-red-100 text-red-800 border-red-200",
  "Cancelled": "bg-zinc-200 text-zinc-700 border-zinc-300",
};

export default function SRIV() {
  const { currentSchool } = useSchool();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const { data: requisitions = [], isLoading, isError } = useQuery({
    queryKey: ["s12-requisitions"],
    queryFn: () => api.getS12Requisitions(),
  });

  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    return requisitions.filter((r: S12Requisition) =>
      (statusFilter === "ALL" || r.status === statusFilter) &&
      (
        !s ||
        r.s12Number?.toLowerCase().includes(s) ||
        r.requestingDepartment?.toLowerCase().includes(s) ||
        r.requestedBy?.toLowerCase().includes(s)
      )
    );
  }, [requisitions, search, statusFilter]);

  const { page, setPage, paginatedItems, totalPages, from, to, total } = usePagination(filtered, 10);

  // ─── PDF generator ──────────────────────────────────────────────────────────
  const generatePDF = (req: S12Requisition) => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 32;
    let y = margin;

    // School information from current school context (or fallback to logged-in user.school)
    const schoolName  = (currentSchool?.name ?? user?.school?.name ?? "School Name").toUpperCase();
    const schoolCode  = currentSchool?.code  ?? user?.school?.code  ?? "";
    const schoolAddr  = currentSchool?.address ?? "";
    const schoolPhone = currentSchool?.phone   ?? "";
    const schoolEmail = currentSchool?.email   ?? "";
    const schoolPrincipal = currentSchool?.principal ?? "";
    const printedBy = user?.name ?? "";

    // ── Header: school name & contact info, centred ────────────────────────
    doc.setTextColor(30, 64, 122);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.text(schoolName, pageW / 2, y + 6, { align: "center" });
    y += 18;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(80, 90, 110);
    const contactBits = [schoolAddr, schoolPhone, schoolEmail].filter(Boolean).join("  •  ");
    if (contactBits) {
      doc.text(contactBits, pageW / 2, y, { align: "center" });
      y += 11;
    }
    const metaBits = [
      schoolCode ? `School Code: ${schoolCode}` : "",
      schoolPrincipal ? `Principal: ${schoolPrincipal}` : "",
    ].filter(Boolean).join("  •  ");
    if (metaBits) {
      doc.text(metaBits, pageW / 2, y, { align: "center" });
      y += 11;
    }

    // Document title strip
    y += 4;
    doc.setDrawColor(30, 64, 122);
    doc.setLineWidth(0.6);
    doc.line(margin, y, pageW - margin, y);
    y += 14;

    doc.setFillColor(30, 64, 122);
    doc.rect(margin, y - 4, pageW - margin * 2, 22, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("STORES REQUISITION & ISSUE VOUCHER (SRIV)", pageW / 2, y + 11, { align: "center" });
    y += 28;

    // ── Info grid ───────────────────────────────────────────────────────────
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);

    const colW = (pageW - margin * 2) / 2;
    const labelVal = (label: string, value: string, x: number, yy: number) => {
      doc.setFont("helvetica", "bold");
      doc.text(label, x, yy);
      const labelW = doc.getTextWidth(label);
      doc.setFont("helvetica", "normal");
      const v = value || "_____________________";
      doc.text(v, x + labelW + 4, yy);
    };

    const info: [string, string, string, string][] = [
      ["Requisition No:", req.s12Number || "", "Department:", req.requestingDepartment || ""],
      ["Request Date:", fmtDate(req.requestDate), "Required By:", ""],
      ["Priority:", "Normal", "Vote Head:", ""],
      ["Requested By:", req.requestedBy || "", "Account:", ""],
      ["Purpose:", req.purpose || "", "Authorised Vote Head:", ""],
    ];

    doc.setDrawColor(220, 224, 232);
    doc.setFillColor(245, 247, 251);
    doc.rect(margin, y, pageW - margin * 2, info.length * 18 + 8, "FD");
    info.forEach((row, i) => {
      const yy = y + 18 + i * 18;
      labelVal(row[0], row[1], margin + 8, yy);
      labelVal(row[2], row[3], margin + colW + 8, yy);
    });
    y += info.length * 18 + 18;

    // ── ITEMS REQUESTED ─────────────────────────────────────────────────────
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("ITEMS REQUESTED", margin, y);
    y += 4;

    const itemRows = (req.items || []).slice(0, 8);
    while (itemRows.length < 8) {
      itemRows.push({
        id: `_blank_${itemRows.length}`,
        itemCode: "",
        description: "",
        unit: "",
        quantityRequested: 0,
        quantityApproved: 0,
        quantityIssued: 0,
        unitPrice: 0,
        remarks: "",
      } as any);
    }

    autoTable(doc, {
      startY: y + 4,
      head: [["#", "Item Code", "Item Description", "Unit", "In Stock", "Avail-able", "Qty Req'd", "Qty Approved", "Qty Issued", "Balance", "Remarks"]],
      body: itemRows.map((it: any, idx) => [
        String(idx + 1),
        it.itemCode || "",
        it.description || "",
        it.unit || "",
        "",
        "",
        it.quantityRequested ? String(it.quantityRequested) : "",
        it.quantityApproved ? String(it.quantityApproved) : "",
        it.quantityIssued ? String(it.quantityIssued) : "",
        "",
        it.remarks || "",
      ]),
      styles: { fontSize: 8, cellPadding: 4, lineColor: [200, 205, 215], lineWidth: 0.4 },
      headStyles: { fillColor: [30, 64, 122], textColor: 255, fontSize: 8, halign: "center" },
      columnStyles: {
        0: { cellWidth: 18, halign: "center" },
        1: { cellWidth: 60 },
        2: { cellWidth: 130 },
        3: { cellWidth: 36 },
        4: { cellWidth: 40, halign: "right" },
        5: { cellWidth: 44, halign: "right" },
        6: { cellWidth: 42, halign: "right", fillColor: [255, 251, 235] },
        7: { cellWidth: 44, halign: "right", fillColor: [236, 253, 245] },
        8: { cellWidth: 42, halign: "right", fillColor: [236, 253, 245] },
        9: { cellWidth: 42, halign: "right" },
      },
      margin: { left: margin, right: margin },
    });

    y = (doc as any).lastAutoTable.finalY + 10;

    // ── Totals & remarks ────────────────────────────────────────────────────
    const totalReq = (req.items || []).reduce((s: number, i: any) => s + (i.quantityRequested || 0), 0);
    const totalApp = (req.items || []).reduce((s: number, i: any) => s + (i.quantityApproved || 0), 0);
    const totalIss = (req.items || []).reduce((s: number, i: any) => s + (i.quantityIssued || 0), 0);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(`Total Items Requested: ${totalReq || "____"}`, margin, y);
    doc.text(`Total Items Approved: ${totalApp || "____"}`, margin + 200, y);
    doc.text(`Total Items Issued: ${totalIss || "____"}`, margin + 400, y);
    y += 14;

    doc.text("Additional Remarks / Instructions:", margin, y);
    y += 12;
    doc.setDrawColor(180, 188, 200);
    doc.line(margin, y, pageW - margin, y);
    y += 18;

    // ── APPROVAL & AUTHORISATION ────────────────────────────────────────────
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("APPROVAL & AUTHORISATION", margin, y);
    y += 4;

    autoTable(doc, {
      startY: y + 4,
      head: [["Role", "Name", "Signature", "Date", "Comments / Action"]],
      body: [
        ["Requested By", req.requestedBy || "", "", fmtDate(req.requestDate), ""],
        ["Head of Department (HOD)", "", "", "", ""],
        ["Bursar / Accounts", "", "", "", ""],
        ["Deputy Principal", "", "", "", ""],
        ["Principal", schoolPrincipal, "", "", ""],
      ],
      styles: { fontSize: 8.5, cellPadding: 6, lineColor: [200, 205, 215], lineWidth: 0.4, minCellHeight: 24 },
      headStyles: { fillColor: [30, 64, 122], textColor: 255, fontSize: 8.5, halign: "center" },
      columnStyles: {
        0: { cellWidth: 130, fontStyle: "bold" },
        1: { cellWidth: 110 },
        2: { cellWidth: 100 },
        3: { cellWidth: 70 },
        4: { cellWidth: "auto" },
      },
      margin: { left: margin, right: margin },
    });

    y = (doc as any).lastAutoTable.finalY + 16;

    // ── Detach line ─────────────────────────────────────────────────────────
    doc.setLineDashPattern([4, 3], 0);
    doc.setDrawColor(120, 130, 145);
    doc.line(margin, y, pageW - margin, y);
    doc.setLineDashPattern([], 0);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(80, 90, 110);
    doc.text("✂  DETACH HERE — ISSUE VOUCHER", pageW / 2, y + 12, { align: "center" });
    y += 22;
    doc.setTextColor(0, 0, 0);

    // ── Issue voucher block ────────────────────────────────────────────────
    const ivLine = (xLabel: number, label: string, value: string, xVal: number, lineEndX: number, yy: number) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text(label, xLabel, yy);
      doc.setFont("helvetica", "normal");
      if (value) doc.text(value, xVal, yy);
      doc.setDrawColor(200, 205, 215);
      doc.line(xVal, yy + 2, lineEndX, yy + 2);
    };

    const ivBoxH = 4 * 22 + 12;
    doc.setDrawColor(220, 224, 232);
    doc.rect(margin, y, pageW - margin * 2, ivBoxH);

    const c1 = margin + 10;
    const c2 = margin + 130;
    const c3 = margin + 270;
    const c4 = margin + 380;
    const cLineEnd = pageW - margin - 10;

    let yy = y + 16;
    ivLine(c1, "Issue Voucher No:", "", c2, c3 - 10, yy);
    ivLine(c3, "Linked Requisition No:", req.s12Number || "", c4, cLineEnd - 80, yy);
    doc.setFont("helvetica", "bold");
    doc.text("Issue Date:", cLineEnd - 75, yy);
    doc.line(cLineEnd - 75 + doc.getTextWidth("Issue Date:") + 4, yy + 2, cLineEnd, yy + 2);
    yy += 22;

    ivLine(c1, "Issued By:", "", c2, c3 - 10, yy);
    ivLine(c3, "Designation:", "", c4, cLineEnd - 80, yy);
    doc.setFont("helvetica", "bold");
    doc.text("Signature:", cLineEnd - 75, yy);
    doc.line(cLineEnd - 75 + doc.getTextWidth("Signature:") + 4, yy + 2, cLineEnd, yy + 2);
    yy += 22;

    ivLine(c1, "Received By:", "", c2, c3 - 10, yy);
    ivLine(c3, "Designation:", "", c4, cLineEnd - 80, yy);
    doc.setFont("helvetica", "bold");
    doc.text("Signature:", cLineEnd - 75, yy);
    doc.line(cLineEnd - 75 + doc.getTextWidth("Signature:") + 4, yy + 2, cLineEnd, yy + 2);
    yy += 22;

    ivLine(c1, "Date Received:", "", c2, c3 - 10, yy);
    doc.setFont("helvetica", "bold");
    doc.text("Condition on Receipt:", c3, yy);
    doc.setFont("helvetica", "normal");
    doc.text("Good / Partial / Damaged", c3 + doc.getTextWidth("Condition on Receipt:") + 6, yy);
    doc.setFont("helvetica", "bold");
    doc.text("Store Ref:", cLineEnd - 75, yy);
    doc.line(cLineEnd - 75 + doc.getTextWidth("Store Ref:") + 4, yy + 2, cLineEnd, yy + 2);

    y += ivBoxH + 18;

    // ── Footer ──────────────────────────────────────────────────────────────
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(110, 120, 135);
    doc.text(`Generated by StoreSure${printedBy ? ` • Printed by ${printedBy}` : ""}`, margin, y);
    doc.text(`Print Date: ${fmtDate(new Date().toISOString())}`, margin + 240, y);
    doc.text("CONFIDENTIAL — For official school use only.", pageW - margin, y, { align: "right" });

    doc.save(`SRIV_${(req.s12Number || req.id).replace(/\//g, "_")}.pdf`);
    toast.success(`SRIV PDF generated for ${req.s12Number}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">SRIV — Stores Requisition &amp; Issue Voucher</h1>
          <p className="text-muted-foreground">Browse S12 requisitions from the backend and generate the formal SRIV PDF for printing & signing.</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-3">
          <div className="flex flex-wrap items-center gap-4">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <div className="space-y-1 flex-1 min-w-[240px]">
              <Label className="text-xs">Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-8"
                  placeholder="Requisition No, Department, Requested By…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All statuses</SelectItem>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Pending Approval">Pending Approval</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Issued">Issued</SelectItem>
                  <SelectItem value="Received">Received</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base"><FileText className="h-4 w-4" />Requisitions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-auto">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="text-xs">Requisition No</TableHead>
                  <TableHead className="text-xs">Department</TableHead>
                  <TableHead className="text-xs">Requested By</TableHead>
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-xs text-right">Items</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedItems.map((r: S12Requisition) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-xs font-mono">{r.s12Number}</TableCell>
                    <TableCell className="text-xs">{r.requestingDepartment}</TableCell>
                    <TableCell className="text-xs">{r.requestedBy}</TableCell>
                    <TableCell className="text-xs whitespace-nowrap">{fmtDate(r.requestDate)}</TableCell>
                    <TableCell className="text-xs text-right">{r.items?.length ?? 0}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={STATUS_BADGE[r.status] ?? ""}>{r.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => generatePDF(r)}>
                        <Printer className="h-3.5 w-3.5 mr-1.5" />Generate PDF
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {isLoading && (
                  <TableRow><TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    <Loader2 className="inline h-4 w-4 mr-2 animate-spin" />Loading from backend…
                  </TableCell></TableRow>
                )}
                {!isLoading && isError && (
                  <TableRow><TableCell colSpan={7} className="h-24 text-center text-red-700">Failed to load requisitions.</TableCell></TableRow>
                )}
                {!isLoading && !isError && paginatedItems.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="h-24 text-center text-muted-foreground">No requisitions match your filters.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <TablePagination page={page} totalPages={totalPages} from={from} to={to} total={total} onPageChange={setPage} />
        </CardContent>
      </Card>
    </div>
  );
}
