import { useState, useMemo } from "react";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/ui/table-pagination";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useReadOnlyGuard } from "@/hooks/useReadOnlyGuard";
import { useLibrary, BorrowerType } from "@/contexts/LibraryContext";
import { useStudents } from "@/contexts/StudentContext";
import { useStaff } from "@/contexts/StaffContext";
import { toast } from "sonner";
import {
  Search,
  BookOpen,
  ArrowUpFromLine,
  ArrowDownToLine,
  User,
  Calendar,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { format } from "date-fns";



export default function IssueReturn() {
  const { students } = useStudents();
  const { staff } = useStaff();

  const {
    getActiveLoans,
    getRecentReturns,
    getAvailableBooks,
    getBookCopyByAccession,
    issueBook,
    returnBook,
  } = useLibrary();

  const [issueDialogOpen, setIssueDialogOpen] = useState(false);
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null);
  const { isReadOnly, blockAction } = useReadOnlyGuard();

  // Issue form state
  const [issueAccessionNo, setIssueAccessionNo] = useState("");
  const [borrowerType, setBorrowerType] = useState<"Student" | "Staff">("Student");
  const [borrowerSearch, setBorrowerSearch] = useState("");
  const [selectedBorrower, setSelectedBorrower] = useState<{
    id: string; name: string; identifier: string; class?: string; type: BorrowerType
  } | null>(null);
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [bookLookup, setBookLookup] = useState<{ title: string; author: string; status: string } | null>(null);

  // Filtered borrower list based on type + search
  const borrowerResults = useMemo(() => {
    const term = borrowerSearch.toLowerCase();
    if (!term) return [];
    if (borrowerType === "Student") {
      return students
        .filter((s) => s.status === "active")
        .filter((s) =>
          `${s.firstName} ${s.lastName}`.toLowerCase().includes(term) ||
          s.admissionNo.toLowerCase().includes(term) ||
          s.class.toLowerCase().includes(term)
        )
        .slice(0, 8)
        .map((s) => ({
          id: s.id,
          name: `${s.firstName} ${s.lastName}`,
          identifier: s.admissionNo,
          class: `${s.class}${s.stream ? ` ${s.stream}` : ""}`,
          type: "Student" as BorrowerType,
        }));
    } else {
      return staff
        .filter((s) => s.status === "active")
        .filter((s) =>
          s.name.toLowerCase().includes(term) ||
          (s.tscNumber ?? "").toLowerCase().includes(term) ||
          (s.staffNumber ?? "").toLowerCase().includes(term)
        )
        .slice(0, 8)
        .map((s) => ({
          id: s.id,
          name: s.name,
          identifier: s.tscNumber ?? s.staffNumber ?? s.inventoryNumber,
          class: s.designation,
          type: "Staff" as BorrowerType,
        }));
    }
  }, [borrowerType, borrowerSearch, students, staff]);

  // Return form state
  const [returnAccessionNo, setReturnAccessionNo] = useState("");
  const [returnCondition, setReturnCondition] = useState<"Good" | "Fair" | "Poor" | "Damaged">("Good");
  const [returnNotes, setReturnNotes] = useState("");
  const [returnBookInfo, setReturnBookInfo] = useState<{ title: string; borrower: string; dueDate: Date } | null>(null);

  const activeLoans = getActiveLoans();
  const recentReturns = getRecentReturns(7);
  const availableBooks = getAvailableBooks();

  const filteredActiveLoans = useMemo(() => {
    if (!searchTerm) return activeLoans;
    const term = searchTerm.toLowerCase();
    return activeLoans.filter(
      (loan) =>
        loan.borrowerName.toLowerCase().includes(term) ||
        loan.bookTitle.toLowerCase().includes(term) ||
        loan.accessionNo.toLowerCase().includes(term) ||
        loan.borrowerId.toLowerCase().includes(term)
    );
  }, [activeLoans, searchTerm]);

  const getDaysRemaining = (dueDate: Date) => {
    const today = new Date();
    const diff = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const handleAccessionLookup = (accNo: string) => {
    setIssueAccessionNo(accNo);
    if (accNo.length >= 5) {
      const book = getBookCopyByAccession(accNo);
      if (book) {
        setBookLookup({
          title: book.title,
          author: book.author,
          status: book.status,
        });
      } else {
        setBookLookup(null);
      }
    } else {
      setBookLookup(null);
    }
  };

  const handleReturnLookup = (accNo: string) => {
    setReturnAccessionNo(accNo);
    if (accNo.length >= 5) {
      const book = getBookCopyByAccession(accNo);
      if (book && (book.status === "Issued" || book.status === "Overdue")) {
        setReturnBookInfo({
          title: book.title,
          borrower: book.currentBorrowerName || "",
          dueDate: book.dueDate || new Date(),
        });
      } else {
        setReturnBookInfo(null);
      }
    } else {
      setReturnBookInfo(null);
    }
  };

  const handleIssueBook = () => {
    if (!selectedBorrower) {
      toast.error("Please select a borrower");
      return;
    }

    const result = issueBook({
      accessionNo: issueAccessionNo,
      borrowerId: selectedBorrower.identifier,
      borrowerName: selectedBorrower.name,
      borrowerType: selectedBorrower.type,
      borrowerClass: selectedBorrower.class,
      issueDate: new Date(issueDate),
      dueDate: new Date(dueDate),
    });

    if (result.success) {
      toast.success(`Book issued successfully. Transaction: ${result.transactionNo}`);
      setIssueDialogOpen(false);
      resetIssueForm();
    } else {
      toast.error(result.message);
    }
  };

  const handleReturnBook = () => {
    const result = returnBook({
      accessionNo: returnAccessionNo,
      returnCondition,
      notes: returnNotes || undefined,
    });

    if (result.success) {
      toast.success("Book returned successfully");
      setReturnDialogOpen(false);
      resetReturnForm();
    } else {
      toast.error(result.message);
    }
  };

  const resetIssueForm = () => {
    setIssueAccessionNo("");
    setBorrowerSearch("");
    setSelectedBorrower(null);
    setIssueDate(new Date().toISOString().split("T")[0]);
    setDueDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);
    setBookLookup(null);
  };

  const resetReturnForm = () => {
    setReturnAccessionNo("");
    setReturnCondition("Good");
    setReturnNotes("");
    setReturnBookInfo(null);
    setSelectedLoanId(null);
  };

  const openReturnForLoan = (loan: typeof activeLoans[0]) => {
    setReturnAccessionNo(loan.accessionNo);
    setReturnBookInfo({
      title: loan.bookTitle,
      borrower: loan.borrowerName,
      dueDate: loan.dueDate,
    });
    setSelectedLoanId(loan.id);
    setReturnDialogOpen(true);
  };

  const loansPage = usePagination(filteredActiveLoans);
  const returnsPage = usePagination(recentReturns);

  const overdueCount = activeLoans.filter((l) => l.status === "Overdue").length;
  const dueThisWeek = activeLoans.filter((l) => {
    const days = getDaysRemaining(l.dueDate);
    return days >= 0 && days <= 7;
  }).length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Issue / Return</h1>
          <p className="text-muted-foreground">
            Process book issues and returns for students and staff
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              if (!blockAction("process book returns")) {
                resetReturnForm();
                setReturnDialogOpen(true);
              }
            }}
            disabled={isReadOnly}
          >
            <ArrowDownToLine className="mr-2 h-4 w-4" />
            Return Book
          </Button>
          <Button
            onClick={() => {
              if (!blockAction("issue books")) {
                resetIssueForm();
                setIssueDialogOpen(true);
              }
            }}
            disabled={isReadOnly}
          >
            <ArrowUpFromLine className="mr-2 h-4 w-4" />
            Issue Book
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <BookOpen className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{activeLoans.length}</p>
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
              <CheckCircle className="h-8 w-8 text-chart-2" />
              <div>
                <p className="text-2xl font-bold">{recentReturns.length}</p>
                <p className="text-sm text-muted-foreground">Returns (7 days)</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-chart-4" />
              <div>
                <p className="text-2xl font-bold">{dueThisWeek}</p>
                <p className="text-sm text-muted-foreground">Due This Week</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Active Loans and Recent Returns */}
      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">Active Loans</TabsTrigger>
          <TabsTrigger value="returns">Recent Returns</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Active Loans</CardTitle>
                  <CardDescription>Books currently on loan</CardDescription>
                </div>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search borrower or book..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Book Details</TableHead>
                    <TableHead>Borrower</TableHead>
                    <TableHead>Issue Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredActiveLoans.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No active loans found
                      </TableCell>
                    </TableRow>
                  ) : (
                    loansPage.paginatedItems.map((loan) => {
                      const daysRemaining = getDaysRemaining(loan.dueDate);
                      return (
                        <TableRow key={loan.id}>
                          <TableCell className="font-mono text-sm">{loan.transactionNo}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{loan.bookTitle}</p>
                              <p className="text-xs text-muted-foreground">
                                {loan.accessionNo}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="font-medium">{loan.borrowerName}</p>
                                <p className="text-xs text-muted-foreground">
                                  {loan.borrowerId} • {loan.borrowerClass}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {format(loan.issueDate, "dd MMM yyyy")}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p>{format(loan.dueDate, "dd MMM yyyy")}</p>
                              <p
                                className={`text-xs ${daysRemaining < 0
                                    ? "text-destructive"
                                    : daysRemaining <= 3
                                      ? "text-chart-4"
                                      : "text-muted-foreground"
                                  }`}
                              >
                                {daysRemaining < 0
                                  ? `${Math.abs(daysRemaining)} days overdue`
                                  : `${daysRemaining} days left`}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={loan.status === "Overdue" ? "destructive" : "default"}
                            >
                              {loan.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={isReadOnly}
                              onClick={() => {
                                if (!blockAction("process book returns")) {
                                  openReturnForLoan(loan);
                                }
                              }}
                            >
                              Return
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
              <TablePagination page={loansPage.page} totalPages={loansPage.totalPages} from={loansPage.from} to={loansPage.to} total={filteredActiveLoans.length} onPageChange={loansPage.setPage} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="returns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Returns</CardTitle>
              <CardDescription>Books returned in the last 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Book Details</TableHead>
                    <TableHead>Borrower</TableHead>
                    <TableHead>Return Date</TableHead>
                    <TableHead>Condition</TableHead>
                    <TableHead>Late Days</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentReturns.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No recent returns
                      </TableCell>
                    </TableRow>
                  ) : (
                    returnsPage.paginatedItems.map((ret) => (
                      <TableRow key={ret.id}>
                        <TableCell className="font-mono text-sm">{ret.transactionNo}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{ret.bookTitle}</p>
                            <p className="text-xs text-muted-foreground">
                              {ret.accessionNo}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{ret.borrowerName}</p>
                            <p className="text-xs text-muted-foreground">
                              {ret.borrowerId} • {ret.borrowerClass}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {ret.returnDate && format(ret.returnDate, "dd MMM yyyy")}
                        </TableCell>
                        <TableCell>
                          <Badge variant={ret.returnCondition === "Damaged" ? "destructive" : "secondary"}>
                            {ret.returnCondition}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {ret.lateDays > 0 ? (
                            <Badge variant="destructive">{ret.lateDays} days</Badge>
                          ) : (
                            <Badge variant="outline">On time</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              <TablePagination page={returnsPage.page} totalPages={returnsPage.totalPages} from={returnsPage.from} to={returnsPage.to} total={recentReturns.length} onPageChange={returnsPage.setPage} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Issue Book Dialog */}
      <Dialog open={issueDialogOpen} onOpenChange={setIssueDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Issue Book</DialogTitle>
            <DialogDescription>
              Issue a book to a student or staff member
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Scan Book Barcode / Accession No.</Label>
              <Input
                placeholder="Scan or enter accession number (e.g., ACC/2024/0001)"
                value={issueAccessionNo}
                onChange={(e) => handleAccessionLookup(e.target.value)}
              />
              {bookLookup && (
                <div className={`text-sm p-2 rounded ${bookLookup.status === "Available" ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400" : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"}`}>
                  <p className="font-medium">{bookLookup.title}</p>
                  <p className="text-xs">{bookLookup.author} • Status: {bookLookup.status}</p>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>Borrower Type</Label>
              <div className="grid grid-cols-2 rounded-md border overflow-hidden">
                <button
                  type="button"
                  className={`py-2 text-sm font-medium transition-colors ${
                    borrowerType === "Student"
                      ? "bg-primary text-primary-foreground"
                      : "bg-background text-foreground hover:bg-muted"
                  }`}
                  onClick={() => {
                    setBorrowerType("Student");
                    setBorrowerSearch("");
                    setSelectedBorrower(null);
                  }}
                >
                  Student
                </button>
                <button
                  type="button"
                  className={`py-2 text-sm font-medium transition-colors ${
                    borrowerType === "Staff"
                      ? "bg-primary text-primary-foreground"
                      : "bg-background text-foreground hover:bg-muted"
                  }`}
                  onClick={() => {
                    setBorrowerType("Staff");
                    setBorrowerSearch("");
                    setSelectedBorrower(null);
                  }}
                >
                  Staff
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>
                {borrowerType === "Student"
                  ? "Student (Name / Admission No.)"
                  : "Staff (Name / TSC / Staff No.)"}
              </Label>
              {selectedBorrower ? (
                <div className="flex items-center justify-between p-2 rounded-md border bg-muted">
                  <div>
                    <p className="font-medium text-sm">{selectedBorrower.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedBorrower.identifier}
                      {selectedBorrower.class ? ` • ${selectedBorrower.class}` : ""}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedBorrower(null);
                      setBorrowerSearch("");
                    }}
                  >
                    Change
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    placeholder={
                      borrowerType === "Student"
                        ? "Search name or admission no."
                        : "Search name, TSC or staff no."
                    }
                    value={borrowerSearch}
                    onChange={(e) => setBorrowerSearch(e.target.value)}
                  />
                  {borrowerResults.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-md">
                      {borrowerResults.map((b) => (
                        <button
                          key={b.id}
                          type="button"
                          className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors"
                          onClick={() => {
                            setSelectedBorrower(b);
                            setBorrowerSearch("");
                          }}
                        >
                          <span className="font-medium">{b.name}</span>
                          <span className="text-muted-foreground ml-2">
                            {b.identifier}{b.class ? ` • ${b.class}` : ""}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                  {borrowerSearch.length > 0 && borrowerResults.length === 0 && (
                    <p className="mt-1 text-xs text-muted-foreground">No results found</p>
                  )}
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Issue Date</Label>
                <Input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIssueDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleIssueBook}
              disabled={!issueAccessionNo || !selectedBorrower || bookLookup?.status !== "Available"}
            >
              Issue Book
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Return Book Dialog */}
      <Dialog open={returnDialogOpen} onOpenChange={setReturnDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Return Book</DialogTitle>
            <DialogDescription>Process a book return</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Scan Book Barcode / Accession No.</Label>
              <Input
                placeholder="Scan or enter accession number"
                value={returnAccessionNo}
                onChange={(e) => handleReturnLookup(e.target.value)}
                disabled={!!selectedLoanId}
              />
              {returnBookInfo && (
                <div className="text-sm p-2 rounded bg-muted">
                  <p className="font-medium">{returnBookInfo.title}</p>
                  <p className="text-xs text-muted-foreground">
                    Borrower: {returnBookInfo.borrower} • Due: {format(returnBookInfo.dueDate, "dd MMM yyyy")}
                  </p>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>Condition on Return</Label>
              <Select value={returnCondition} onValueChange={(v) => setReturnCondition(v as typeof returnCondition)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select condition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Good">Good</SelectItem>
                  <SelectItem value="Fair">Fair</SelectItem>
                  <SelectItem value="Poor">Poor - Needs Repair</SelectItem>
                  <SelectItem value="Damaged">Damaged</SelectItem>
                </SelectContent>
              </Select>
              {returnCondition === "Damaged" && (
                <p className="text-xs text-destructive">
                  Note: Book will be marked as Damaged and removed from circulation
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Notes (Optional)</Label>
              <Input
                placeholder="Any remarks about the return"
                value={returnNotes}
                onChange={(e) => setReturnNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setReturnDialogOpen(false);
              resetReturnForm();
            }}>
              Cancel
            </Button>
            <Button
              onClick={handleReturnBook}
              disabled={!returnAccessionNo || !returnBookInfo}
            >
              Process Return
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}