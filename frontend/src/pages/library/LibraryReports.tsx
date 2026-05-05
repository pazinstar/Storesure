import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FileText,
  Download,
  BookOpen,
  Users,
  TrendingUp,
  AlertTriangle,
  ClipboardList,
  FileSpreadsheet,
  ChevronDown,
} from "lucide-react";
import { useLibrary } from "@/contexts/LibraryContext";
import { useSchool } from "@/contexts/SchoolContext";
import { toast } from "sonner";
import {
  exportStockRegisterPDF,
  exportStockRegisterExcel,
  exportIssuedBooksPDF,
  exportIssuedBooksExcel,
  exportOverduePDF,
  exportOverdueExcel,
  exportLostDamagedPDF,
  exportLostDamagedExcel,
  exportBorrowingHistoryPDF,
  exportBorrowingHistoryExcel,
} from "@/services/libraryReports.service";

// ─── Report definitions ───────────────────────────────────────────────────────

const reportDefs = [
  {
    id: "stock-register",
    title: "Library Stock Register",
    description: "Complete inventory of all library holdings with accession numbers, categories, and current status",
    icon: BookOpen,
    category: "Inventory",
  },
  {
    id: "issued-books",
    title: "Issued Books Report",
    description: "List of all currently issued books with borrower details and due dates",
    icon: Users,
    category: "Circulation",
  },
  {
    id: "overdue-books",
    title: "Overdue Books Report",
    description: "Books past their due date with borrower contact details and days overdue",
    icon: AlertTriangle,
    category: "Circulation",
  },
  {
    id: "lost-damaged",
    title: "Lost / Damaged Register",
    description: "Record of all books marked as lost or damaged with remarks",
    icon: ClipboardList,
    category: "Inventory",
  },
  {
    id: "borrowing-history",
    title: "Borrowing History",
    description: "Complete borrowing history for all transactions including returns",
    icon: TrendingUp,
    category: "Circulation",
  },
] as const;

type ReportId = typeof reportDefs[number]["id"];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LibraryReports() {
  const { bookCopies, getActiveLoans, getOverdueLoans, loanTransactions } = useLibrary();
  const { currentSchool } = useSchool();
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [generating, setGenerating] = useState<`${ReportId}-${"pdf" | "xlsx"}` | null>(null);

  // ─── Data selectors ──────────────────────────────────────────────────────────

  function getReportData(id: ReportId) {
    switch (id) {
      case "stock-register":
        return bookCopies;
      case "issued-books":
        return getActiveLoans();
      case "overdue-books":
        return getOverdueLoans();
      case "lost-damaged":
        return bookCopies.filter((c) => c.status === "Lost" || c.status === "Damaged");
      case "borrowing-history":
        return loanTransactions;
    }
  }

  // ─── Export handler ──────────────────────────────────────────────────────────

  async function handleExport(id: ReportId, fmt: "pdf" | "xlsx") {
    const key = `${id}-${fmt}` as const;
    setGenerating(key);
    try {
      const data = getReportData(id) as any[];
      if (fmt === "pdf") {
        switch (id) {
          case "stock-register":    exportStockRegisterPDF(data, currentSchool); break;
          case "issued-books":      exportIssuedBooksPDF(data, currentSchool); break;
          case "overdue-books":     exportOverduePDF(data, currentSchool); break;
          case "lost-damaged":      exportLostDamagedPDF(data, currentSchool); break;
          case "borrowing-history": exportBorrowingHistoryPDF(data, currentSchool); break;
        }
      } else {
        switch (id) {
          case "stock-register":    exportStockRegisterExcel(data, currentSchool); break;
          case "issued-books":      exportIssuedBooksExcel(data, currentSchool); break;
          case "overdue-books":     exportOverdueExcel(data, currentSchool); break;
          case "lost-damaged":      exportLostDamagedExcel(data, currentSchool); break;
          case "borrowing-history": exportBorrowingHistoryExcel(data, currentSchool); break;
        }
      }
      toast.success(`${fmt.toUpperCase()} report downloaded`);
    } catch (err) {
      toast.error("Failed to generate report");
      console.error(err);
    } finally {
      setGenerating(null);
    }
  }

  // ─── Custom report builder state ─────────────────────────────────────────────

  const [customType, setCustomType] = useState<ReportId>("stock-register");
  const [customFmt, setCustomFmt] = useState<"pdf" | "xlsx">("pdf");

  // ─── Derived ─────────────────────────────────────────────────────────────────

  const visibleReports =
    categoryFilter === "all"
      ? reportDefs
      : reportDefs.filter((r) => r.category.toLowerCase() === categoryFilter);

  const activeLoansCount = getActiveLoans().length;
  const overdueCount = getOverdueLoans().length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Library Reports</h1>
          <p className="text-muted-foreground">
            Generate and download library management reports — PDF &amp; Excel with school letterhead
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="inventory">Inventory</SelectItem>
              <SelectItem value="circulation">Circulation</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <BookOpen className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{bookCopies.length}</p>
                <p className="text-sm text-muted-foreground">Total Copies</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-chart-2" />
              <div>
                <p className="text-2xl font-bold">{activeLoansCount}</p>
                <p className="text-sm text-muted-foreground">Active Loans</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-destructive" />
              <div>
                <p className="text-2xl font-bold">{overdueCount}</p>
                <p className="text-sm text-muted-foreground">Overdue</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-chart-4" />
              <div>
                <p className="text-2xl font-bold">{reportDefs.length}</p>
                <p className="text-sm text-muted-foreground">Report Types</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reports Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {visibleReports.map((report) => {
          const data = getReportData(report.id);
          const count = Array.isArray(data) ? data.length : 0;
          const isPdfBusy = generating === `${report.id}-pdf`;
          const isXlsBusy = generating === `${report.id}-xlsx`;

          return (
            <Card key={report.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <report.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{report.title}</CardTitle>
                      <Badge variant="secondary" className="mt-1">{report.category}</Badge>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">{count} record{count !== 1 ? "s" : ""}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">{report.description}</p>
                <div className="flex items-center justify-end gap-2">
                  {/* PDF button */}
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isPdfBusy || count === 0}
                    onClick={() => handleExport(report.id, "pdf")}
                  >
                    <FileText className="mr-1.5 h-3.5 w-3.5 text-red-500" />
                    {isPdfBusy ? "Generating…" : "PDF"}
                  </Button>
                  {/* Excel button */}
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isXlsBusy || count === 0}
                    onClick={() => handleExport(report.id, "xlsx")}
                  >
                    <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5 text-green-600" />
                    {isXlsBusy ? "Generating…" : "Excel"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Custom Report Builder */}
      <Card>
        <CardHeader>
          <CardTitle>Custom Report</CardTitle>
          <CardDescription>Choose a report type and format, then download</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="space-y-2 flex-1">
              <Label>Report Type</Label>
              <Select value={customType} onValueChange={(v) => setCustomType(v as ReportId)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {reportDefs.map((r) => (
                    <SelectItem key={r.id} value={r.id}>{r.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 w-36">
              <Label>Format</Label>
              <Select value={customFmt} onValueChange={(v) => setCustomFmt(v as "pdf" | "xlsx")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="xlsx">Excel</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button disabled={!!generating}>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleExport(customType, "pdf")}>
                  <FileText className="mr-2 h-4 w-4 text-red-500" />
                  Download as PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport(customType, "xlsx")}>
                  <FileSpreadsheet className="mr-2 h-4 w-4 text-green-600" />
                  Download as Excel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
