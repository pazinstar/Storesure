import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { format } from "date-fns";
import type { School } from "@/contexts/SchoolContext";
import type { Student } from "@/contexts/StudentContext";
import type {
  DistributionRegisterRecord,
  NotCollectedRecord,
  ReplacementRecord,
} from "@/mock/students.mock";

// ─── Letterhead helpers ───────────────────────────────────────────────────────

function addLetterhead(doc: jsPDF, school: School | null, reportTitle: string): number {
  const pageW = doc.internal.pageSize.getWidth();
  let y = 15;

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(school?.name ?? "School Name", pageW / 2, y, { align: "center" });
  y += 7;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const contact = [school?.address, school?.phone, school?.email].filter(Boolean).join("  |  ");
  doc.text(contact, pageW / 2, y, { align: "center" });
  y += 5;

  doc.setDrawColor(40, 40, 40);
  doc.setLineWidth(0.5);
  doc.line(14, y, pageW - 14, y);
  y += 6;

  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text(reportTitle.toUpperCase(), pageW / 2, y, { align: "center" });
  y += 6;

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text(`Generated: ${format(new Date(), "dd MMMM yyyy, HH:mm")}`, pageW / 2, y, { align: "center" });
  doc.setTextColor(0);
  y += 5;

  doc.line(14, y, pageW - 14, y);
  y += 6;

  return y;
}

function saveDoc(doc: jsPDF, filename: string) {
  doc.save(`${filename}_${format(new Date(), "yyyyMMdd")}.pdf`);
}

function xlsLetterhead(school: School | null, reportTitle: string): string[][] {
  return [
    [school?.name ?? "School Name"],
    [[school?.address, school?.phone, school?.email].filter(Boolean).join("  |  ")],
    [reportTitle.toUpperCase()],
    [`Generated: ${format(new Date(), "dd MMMM yyyy, HH:mm")}`],
    [],
  ];
}

function saveWorkbook(wb: XLSX.WorkBook, filename: string) {
  XLSX.writeFile(wb, `${filename}_${format(new Date(), "yyyyMMdd")}.xlsx`);
}

function applyXlsLetterheadStyle(ws: XLSX.WorkSheet, headerRows: number, colCount: number) {
  for (let r = 0; r < headerRows - 1; r++) {
    if (!ws["!merges"]) ws["!merges"] = [];
    ws["!merges"].push({ s: { r, c: 0 }, e: { r, c: colCount - 1 } });
  }
}

// ─── Student Register ─────────────────────────────────────────────────────────

export function exportStudentRegisterPDF(students: Student[], school: School | null) {
  const doc = new jsPDF({ orientation: "landscape" });
  const y = addLetterhead(doc, school, "Student Register");

  autoTable(doc, {
    startY: y,
    head: [["Adm No.", "Name", "Class", "Stream", "Gender", "Admission Date", "Parent/Guardian", "Phone", "Status"]],
    body: students.map((s) => [
      s.admissionNo,
      `${s.firstName} ${s.lastName}`,
      s.class,
      s.stream ?? "-",
      s.gender,
      s.admissionDate ? format(new Date(s.admissionDate), "dd MMM yyyy") : "-",
      s.parentName || "-",
      s.parentPhone || "-",
      s.status.charAt(0).toUpperCase() + s.status.slice(1),
    ]),
    headStyles: { fillColor: [22, 160, 133], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [245, 251, 250] },
    styles: { fontSize: 8 },
  });

  saveDoc(doc, "student_register");
}

export function exportStudentRegisterExcel(students: Student[], school: School | null) {
  const cols = ["Adm No.", "First Name", "Last Name", "Class", "Stream", "Gender", "Date of Birth", "Admission Date", "Parent/Guardian", "Phone", "Email", "Address", "Status"];
  const headerRows = xlsLetterhead(school, "Student Register");
  const dataRows = students.map((s) => [
    s.admissionNo,
    s.firstName,
    s.lastName,
    s.class,
    s.stream ?? "",
    s.gender,
    s.dateOfBirth ?? "",
    s.admissionDate ?? "",
    s.parentName,
    s.parentPhone,
    s.parentEmail ?? "",
    s.address,
    s.status,
  ]);

  const ws = XLSX.utils.aoa_to_sheet([...headerRows, cols, ...dataRows]);
  applyXlsLetterheadStyle(ws, headerRows.length, cols.length);
  ws["!cols"] = cols.map(() => ({ wch: 18 }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Student Register");
  saveWorkbook(wb, "student_register");
}

// ─── Distribution Register ────────────────────────────────────────────────────

export function exportDistributionRegisterPDF(records: DistributionRegisterRecord[], school: School | null) {
  const doc = new jsPDF({ orientation: "landscape" });
  const y = addLetterhead(doc, school, "Distribution Register");

  autoTable(doc, {
    startY: y,
    head: [["Dist. ID", "Date", "Class", "Item", "Qty Issued", "Receiving Teacher", "Signature"]],
    body: records.map((r) => [
      r.id,
      r.date ? format(new Date(r.date), "dd MMM yyyy") : r.date,
      r.class,
      r.item,
      r.qty,
      r.teacher,
      r.signature,
    ]),
    headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [235, 245, 255] },
    styles: { fontSize: 8 },
  });

  saveDoc(doc, "distribution_register");
}

export function exportDistributionRegisterExcel(records: DistributionRegisterRecord[], school: School | null) {
  const cols = ["Dist. ID", "Date", "Class", "Item", "Qty Issued", "Receiving Teacher", "Signature"];
  const headerRows = xlsLetterhead(school, "Distribution Register");
  const dataRows = records.map((r) => [r.id, r.date, r.class, r.item, r.qty, r.teacher, r.signature]);

  const ws = XLSX.utils.aoa_to_sheet([...headerRows, cols, ...dataRows]);
  applyXlsLetterheadStyle(ws, headerRows.length, cols.length);
  ws["!cols"] = [{ wch: 16 }, { wch: 14 }, { wch: 16 }, { wch: 30 }, { wch: 12 }, { wch: 22 }, { wch: 10 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Distribution Register");
  saveWorkbook(wb, "distribution_register");
}

// ─── Not Collected ────────────────────────────────────────────────────────────

export function exportNotCollectedPDF(records: NotCollectedRecord[], school: School | null) {
  const doc = new jsPDF();
  const y = addLetterhead(doc, school, "Not Collected List");

  autoTable(doc, {
    startY: y,
    head: [["Adm No.", "Student Name", "Class", "Item", "Reason", "Days Overdue"]],
    body: records.map((r) => [r.admNo, r.name, r.class, r.item, r.reason, `${r.daysOverdue} days`]),
    headStyles: { fillColor: [211, 84, 0], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [255, 248, 240] },
    styles: { fontSize: 9 },
  });

  saveDoc(doc, "not_collected_list");
}

export function exportNotCollectedExcel(records: NotCollectedRecord[], school: School | null) {
  const cols = ["Adm No.", "Student Name", "Class", "Item", "Reason", "Days Overdue"];
  const headerRows = xlsLetterhead(school, "Not Collected List");
  const dataRows = records.map((r) => [r.admNo, r.name, r.class, r.item, r.reason, r.daysOverdue]);

  const ws = XLSX.utils.aoa_to_sheet([...headerRows, cols, ...dataRows]);
  applyXlsLetterheadStyle(ws, headerRows.length, cols.length);
  ws["!cols"] = [{ wch: 14 }, { wch: 22 }, { wch: 16 }, { wch: 28 }, { wch: 28 }, { wch: 14 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Not Collected");
  saveWorkbook(wb, "not_collected_list");
}

// ─── Replacement History ──────────────────────────────────────────────────────

export function exportReplacementHistoryPDF(records: ReplacementRecord[], school: School | null) {
  const doc = new jsPDF({ orientation: "landscape" });
  const y = addLetterhead(doc, school, "Replacement History");

  autoTable(doc, {
    startY: y,
    head: [["Ref. ID", "Date", "Adm No.", "Student Name", "Class", "Item", "Reason", "Approved By", "Status"]],
    body: records.map((r) => [
      r.id,
      r.date ? format(new Date(r.date), "dd MMM yyyy") : r.date,
      r.admNo,
      r.name,
      r.class,
      r.item,
      r.reason,
      r.approvedBy || "-",
      r.status,
    ]),
    headStyles: { fillColor: [142, 68, 173], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [248, 240, 255] },
    styles: { fontSize: 8 },
  });

  saveDoc(doc, "replacement_history");
}

export function exportReplacementHistoryExcel(records: ReplacementRecord[], school: School | null) {
  const cols = ["Ref. ID", "Date", "Adm No.", "Student Name", "Class", "Item", "Reason", "Approved By", "Status"];
  const headerRows = xlsLetterhead(school, "Replacement History");
  const dataRows = records.map((r) => [r.id, r.date, r.admNo, r.name, r.class, r.item, r.reason, r.approvedBy, r.status]);

  const ws = XLSX.utils.aoa_to_sheet([...headerRows, cols, ...dataRows]);
  applyXlsLetterheadStyle(ws, headerRows.length, cols.length);
  ws["!cols"] = cols.map(() => ({ wch: 18 }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Replacement History");
  saveWorkbook(wb, "replacement_history");
}
