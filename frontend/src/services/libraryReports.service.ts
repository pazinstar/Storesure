import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { format } from "date-fns";
import type { School } from "@/contexts/SchoolContext";
import type { BookCopy, LoanTransaction } from "@/contexts/LibraryContext";

// ─── Letterhead helpers ───────────────────────────────────────────────────────

function addLetterhead(doc: jsPDF, school: School | null, reportTitle: string): number {
  const pageW = doc.internal.pageSize.getWidth();
  let y = 15;

  // School name
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(school?.name ?? "School Name", pageW / 2, y, { align: "center" });
  y += 7;

  // Address / contact line
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const contact = [school?.address, school?.phone, school?.email].filter(Boolean).join("  |  ");
  doc.text(contact, pageW / 2, y, { align: "center" });
  y += 5;

  // Divider
  doc.setDrawColor(40, 40, 40);
  doc.setLineWidth(0.5);
  doc.line(14, y, pageW - 14, y);
  y += 6;

  // Report title
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text(reportTitle.toUpperCase(), pageW / 2, y, { align: "center" });
  y += 6;

  // Generated date
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text(`Generated: ${format(new Date(), "dd MMMM yyyy, HH:mm")}`, pageW / 2, y, { align: "center" });
  doc.setTextColor(0);
  y += 5;

  // Second divider
  doc.line(14, y, pageW - 14, y);
  y += 6;

  return y;
}

function saveDoc(doc: jsPDF, filename: string) {
  doc.save(`${filename}_${format(new Date(), "yyyyMMdd")}.pdf`);
}

// ─── Excel letterhead rows ────────────────────────────────────────────────────

function xlsLetterhead(school: School | null, reportTitle: string): string[][] {
  return [
    [school?.name ?? "School Name"],
    [
      [school?.address, school?.phone, school?.email].filter(Boolean).join("  |  "),
    ],
    [reportTitle.toUpperCase()],
    [`Generated: ${format(new Date(), "dd MMMM yyyy, HH:mm")}`],
    [], // blank separator
  ];
}

function saveWorkbook(wb: XLSX.WorkBook, filename: string) {
  XLSX.writeFile(wb, `${filename}_${format(new Date(), "yyyyMMdd")}.xlsx`);
}

function applyXlsLetterheadStyle(ws: XLSX.WorkSheet, headerRows: number, colCount: number) {
  // Merge letterhead cells across columns
  for (let r = 0; r < headerRows - 1; r++) {
    if (!ws["!merges"]) ws["!merges"] = [];
    ws["!merges"].push({ s: { r, c: 0 }, e: { r, c: colCount - 1 } });
  }
}

// ─── 1. Library Stock Register ────────────────────────────────────────────────

export function exportStockRegisterPDF(copies: BookCopy[], school: School | null) {
  const doc = new jsPDF({ orientation: "landscape" });
  const startY = addLetterhead(doc, school, "Library Stock Register");

  autoTable(doc, {
    startY,
    head: [["Accession No.", "Title", "Author", "Category", "ISBN", "Location", "Date Received", "Status", "Remarks"]],
    body: copies.map((c) => [
      c.accessionNo,
      c.title,
      c.author,
      c.category,
      c.isbn ?? "-",
      c.location,
      format(c.receivedDate, "dd/MM/yyyy"),
      c.status,
      c.statusRemarks ?? "-",
    ]),
    styles: { fontSize: 7.5 },
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [245, 247, 255] },
  });

  saveDoc(doc, "library_stock_register");
}

export function exportStockRegisterExcel(copies: BookCopy[], school: School | null) {
  const headers = ["Accession No.", "Title", "Author", "Category", "ISBN", "Location", "Date Received", "Status", "Remarks"];
  const rows = copies.map((c) => [
    c.accessionNo, c.title, c.author, c.category, c.isbn ?? "", c.location,
    format(c.receivedDate, "dd/MM/yyyy"), c.status, c.statusRemarks ?? "",
  ]);
  const letterhead = xlsLetterhead(school, "Library Stock Register");
  const ws = XLSX.utils.aoa_to_sheet([...letterhead, headers, ...rows]);
  applyXlsLetterheadStyle(ws, letterhead.length, headers.length);
  ws["!cols"] = [14, 30, 22, 14, 14, 16, 14, 12, 25].map((w) => ({ wch: w }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Stock Register");
  saveWorkbook(wb, "library_stock_register");
}

// ─── 2. Issued Books Report ───────────────────────────────────────────────────

export function exportIssuedBooksPDF(loans: LoanTransaction[], school: School | null) {
  const doc = new jsPDF({ orientation: "landscape" });
  const startY = addLetterhead(doc, school, "Issued Books Report");

  autoTable(doc, {
    startY,
    head: [["Transaction No.", "Accession No.", "Book Title", "Borrower", "ID / Adm. No.", "Type", "Class", "Issue Date", "Due Date", "Status"]],
    body: loans.map((l) => [
      l.transactionNo,
      l.accessionNo,
      l.bookTitle,
      l.borrowerName,
      l.borrowerId,
      l.borrowerType,
      l.borrowerClass ?? "-",
      format(l.issueDate, "dd/MM/yyyy"),
      format(l.dueDate, "dd/MM/yyyy"),
      l.status,
    ]),
    styles: { fontSize: 7.5 },
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [245, 247, 255] },
  });

  saveDoc(doc, "issued_books_report");
}

export function exportIssuedBooksExcel(loans: LoanTransaction[], school: School | null) {
  const headers = ["Transaction No.", "Accession No.", "Book Title", "Borrower", "ID / Adm. No.", "Type", "Class", "Issue Date", "Due Date", "Status"];
  const rows = loans.map((l) => [
    l.transactionNo, l.accessionNo, l.bookTitle, l.borrowerName, l.borrowerId,
    l.borrowerType, l.borrowerClass ?? "", format(l.issueDate, "dd/MM/yyyy"),
    format(l.dueDate, "dd/MM/yyyy"), l.status,
  ]);
  const letterhead = xlsLetterhead(school, "Issued Books Report");
  const ws = XLSX.utils.aoa_to_sheet([...letterhead, headers, ...rows]);
  applyXlsLetterheadStyle(ws, letterhead.length, headers.length);
  ws["!cols"] = [16, 16, 30, 22, 14, 10, 12, 13, 13, 10].map((w) => ({ wch: w }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Issued Books");
  saveWorkbook(wb, "issued_books_report");
}

// ─── 3. Overdue Books Report ──────────────────────────────────────────────────

export function exportOverduePDF(loans: LoanTransaction[], school: School | null) {
  const doc = new jsPDF({ orientation: "landscape" });
  const startY = addLetterhead(doc, school, "Overdue Books Report");
  const today = new Date();

  autoTable(doc, {
    startY,
    head: [["Transaction No.", "Accession No.", "Book Title", "Borrower", "Type", "Class", "Due Date", "Days Overdue"]],
    body: loans.map((l) => [
      l.transactionNo,
      l.accessionNo,
      l.bookTitle,
      l.borrowerName,
      l.borrowerType,
      l.borrowerClass ?? "-",
      format(l.dueDate, "dd/MM/yyyy"),
      String(Math.ceil((today.getTime() - l.dueDate.getTime()) / 86400000)),
    ]),
    styles: { fontSize: 7.5 },
    headStyles: { fillColor: [220, 38, 38], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [255, 245, 245] },
  });

  saveDoc(doc, "overdue_books_report");
}

export function exportOverdueExcel(loans: LoanTransaction[], school: School | null) {
  const today = new Date();
  const headers = ["Transaction No.", "Accession No.", "Book Title", "Borrower", "Type", "Class", "Due Date", "Days Overdue"];
  const rows = loans.map((l) => [
    l.transactionNo, l.accessionNo, l.bookTitle, l.borrowerName, l.borrowerType,
    l.borrowerClass ?? "", format(l.dueDate, "dd/MM/yyyy"),
    Math.ceil((today.getTime() - l.dueDate.getTime()) / 86400000),
  ]);
  const letterhead = xlsLetterhead(school, "Overdue Books Report");
  const ws = XLSX.utils.aoa_to_sheet([...letterhead, headers, ...rows]);
  applyXlsLetterheadStyle(ws, letterhead.length, headers.length);
  ws["!cols"] = [16, 16, 30, 22, 10, 12, 13, 14].map((w) => ({ wch: w }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Overdue Books");
  saveWorkbook(wb, "overdue_books_report");
}

// ─── 4. Lost / Damaged Register ──────────────────────────────────────────────

export function exportLostDamagedPDF(copies: BookCopy[], school: School | null) {
  const doc = new jsPDF({ orientation: "landscape" });
  const startY = addLetterhead(doc, school, "Lost / Damaged Books Register");

  autoTable(doc, {
    startY,
    head: [["Accession No.", "Title", "Author", "Category", "Location", "Status", "Remarks"]],
    body: copies.map((c) => [
      c.accessionNo, c.title, c.author, c.category, c.location, c.status, c.statusRemarks ?? "-",
    ]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [180, 83, 9], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [255, 251, 235] },
  });

  saveDoc(doc, "lost_damaged_register");
}

export function exportLostDamagedExcel(copies: BookCopy[], school: School | null) {
  const headers = ["Accession No.", "Title", "Author", "Category", "Location", "Status", "Remarks"];
  const rows = copies.map((c) => [
    c.accessionNo, c.title, c.author, c.category, c.location, c.status, c.statusRemarks ?? "",
  ]);
  const letterhead = xlsLetterhead(school, "Lost / Damaged Books Register");
  const ws = XLSX.utils.aoa_to_sheet([...letterhead, headers, ...rows]);
  applyXlsLetterheadStyle(ws, letterhead.length, headers.length);
  ws["!cols"] = [16, 30, 22, 14, 16, 12, 35].map((w) => ({ wch: w }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Lost & Damaged");
  saveWorkbook(wb, "lost_damaged_register");
}

// ─── 5. Borrowing History ─────────────────────────────────────────────────────

export function exportBorrowingHistoryPDF(loans: LoanTransaction[], school: School | null) {
  const doc = new jsPDF({ orientation: "landscape" });
  const startY = addLetterhead(doc, school, "Borrowing History");

  autoTable(doc, {
    startY,
    head: [["Transaction No.", "Book Title", "Borrower", "Type", "Issue Date", "Due Date", "Return Date", "Late Days", "Condition"]],
    body: loans.map((l) => [
      l.transactionNo,
      l.bookTitle,
      l.borrowerName,
      l.borrowerType,
      format(l.issueDate, "dd/MM/yyyy"),
      format(l.dueDate, "dd/MM/yyyy"),
      l.returnDate ? format(l.returnDate, "dd/MM/yyyy") : "-",
      l.lateDays > 0 ? String(l.lateDays) : "-",
      l.returnCondition ?? "-",
    ]),
    styles: { fontSize: 7.5 },
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [245, 247, 255] },
  });

  saveDoc(doc, "borrowing_history");
}

export function exportBorrowingHistoryExcel(loans: LoanTransaction[], school: School | null) {
  const headers = ["Transaction No.", "Book Title", "Borrower", "Type", "Issue Date", "Due Date", "Return Date", "Late Days", "Condition"];
  const rows = loans.map((l) => [
    l.transactionNo, l.bookTitle, l.borrowerName, l.borrowerType,
    format(l.issueDate, "dd/MM/yyyy"), format(l.dueDate, "dd/MM/yyyy"),
    l.returnDate ? format(l.returnDate, "dd/MM/yyyy") : "",
    l.lateDays > 0 ? l.lateDays : "",
    l.returnCondition ?? "",
  ]);
  const letterhead = xlsLetterhead(school, "Borrowing History");
  const ws = XLSX.utils.aoa_to_sheet([...letterhead, headers, ...rows]);
  applyXlsLetterheadStyle(ws, letterhead.length, headers.length);
  ws["!cols"] = [16, 30, 22, 10, 13, 13, 13, 10, 14].map((w) => ({ wch: w }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Borrowing History");
  saveWorkbook(wb, "borrowing_history");
}
