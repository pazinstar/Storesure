import { useState } from "react";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/ui/table-pagination";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLibrary, BookStatus, BookCopy } from "@/contexts/LibraryContext";
import { useAuth } from "@/contexts/AuthContext";
import { useReadOnlyGuard } from "@/hooks/useReadOnlyGuard";
import {
  Search,
  Filter,
  BookOpen,
  Download,
  FileText,
  BookCopy as BookCopyIcon,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Pencil,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const categories = ["All", "Textbook", "Reference", "Fiction", "Periodical", "Other"];
const statuses: (BookStatus | "All")[] = ["All", "Available", "Issued", "Overdue", "Lost", "Damaged"];

// Statuses that can be set manually (Issued/Overdue are set through loan workflow)
const editableStatuses: BookStatus[] = ["Available", "Damaged", "Lost"];

const getStatusVariant = (status: BookStatus): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case "Available":
      return "default";
    case "Issued":
      return "secondary";
    case "Overdue":
      return "destructive";
    case "Lost":
      return "destructive";
    case "Damaged":
      return "outline";
    default:
      return "secondary";
  }
};

const getStatusIcon = (status: BookStatus) => {
  switch (status) {
    case "Available":
      return <CheckCircle className="h-3 w-3" />;
    case "Issued":
      return <BookCopyIcon className="h-3 w-3" />;
    case "Overdue":
      return <AlertTriangle className="h-3 w-3" />;
    case "Lost":
      return <XCircle className="h-3 w-3" />;
    case "Damaged":
      return <AlertTriangle className="h-3 w-3" />;
    default:
      return null;
  }
};

export default function Catalogue() {
  const { bookCopies, getTotalCopies, getAvailableCopies, getIssuedCopies, getOverdueCopies, updateBookStatus } = useLibrary();
  const { user, canEdit } = useAuth();
  const { isReadOnly, blockAction } = useReadOnlyGuard();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState<BookStatus | "All">("All");
  
  // Edit status dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<BookCopy | null>(null);
  const [newStatus, setNewStatus] = useState<BookStatus>("Available");
  const [remarks, setRemarks] = useState("");

  const canEditLibrary = canEdit("library");

  const filteredData = bookCopies.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.accessionNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.isbn?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesCategory = categoryFilter === "All" || item.category === categoryFilter;
    const matchesStatus = statusFilter === "All" || item.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const lostCount = bookCopies.filter((c) => c.status === "Lost").length;
  const damagedCount = bookCopies.filter((c) => c.status === "Damaged").length;

  const { page, setPage, totalPages, paginatedItems: pagedData, from, to } = usePagination(filteredData);

  const handleEditClick = (book: BookCopy) => {
    if (blockAction("edit book status")) {
      return;
    }
    setSelectedBook(book);
    setNewStatus(book.status);
    setRemarks(book.statusRemarks || "");
    setEditDialogOpen(true);
  };

  const handleSaveStatus = () => {
    if (!selectedBook) return;

    // Validate remarks for Damaged/Lost
    if ((newStatus === "Damaged" || newStatus === "Lost") && !remarks.trim()) {
      toast.error(`Remarks are mandatory when marking a book as ${newStatus}`);
      return;
    }

    const result = updateBookStatus(selectedBook.accessionNo, newStatus, remarks.trim() || undefined);
    
    if (result.success) {
      toast.success(result.message);
      setEditDialogOpen(false);
      setSelectedBook(null);
      setRemarks("");
    } else {
      toast.error(result.message);
    }
  };

  const requiresRemarks = newStatus === "Damaged" || newStatus === "Lost";

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Library Catalogue / Register</h1>
          <p className="text-muted-foreground">
            {canEditLibrary && !isReadOnly
              ? "Manage book statuses and conditions" 
              : "System-generated register of all library holdings (read-only)"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <FileText className="h-3 w-3" />
            Replaces Paper Stock Register
          </Badge>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by accession no., title, author, or ISBN..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as BookStatus | "All")}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <BookOpen className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{getTotalCopies()}</p>
                <p className="text-sm text-muted-foreground">Total Copies</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-chart-2" />
              <div>
                <p className="text-2xl font-bold">{getAvailableCopies()}</p>
                <p className="text-sm text-muted-foreground">Available</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <BookCopyIcon className="h-8 w-8 text-chart-3" />
              <div>
                <p className="text-2xl font-bold">{getIssuedCopies()}</p>
                <p className="text-sm text-muted-foreground">Issued</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-destructive" />
              <div>
                <p className="text-2xl font-bold">{getOverdueCopies()}</p>
                <p className="text-sm text-muted-foreground">Overdue</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <XCircle className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{lostCount}</p>
                <p className="text-sm text-muted-foreground">Lost</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-chart-4" />
              <div>
                <p className="text-2xl font-bold">{damagedCount}</p>
                <p className="text-sm text-muted-foreground">Damaged</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Register Table */}
      <Card>
        <CardHeader>
          <CardTitle>Library Stock Register</CardTitle>
          <CardDescription>
            {filteredData.length} of {bookCopies.length} copies • Each copy has a unique accession number
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Accession No.</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>ISBN</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Date Received</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Borrower</TableHead>
                {canEditLibrary && <TableHead className="w-[80px]">Action</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={canEditLibrary ? 10 : 9} className="text-center py-8 text-muted-foreground">
                    <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No books found matching your criteria</p>
                  </TableCell>
                </TableRow>
              ) : (
                pagedData.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-sm font-medium">
                      {item.accessionNo}
                    </TableCell>
                    <TableCell className="font-medium max-w-[200px] truncate">
                      {item.title}
                    </TableCell>
                    <TableCell>{item.author}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{item.category}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {item.isbn || "-"}
                    </TableCell>
                    <TableCell>{item.location}</TableCell>
                    <TableCell>
                      {format(item.receivedDate, "dd MMM yyyy")}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Badge variant={getStatusVariant(item.status)} className="flex items-center gap-1 w-fit">
                          {getStatusIcon(item.status)}
                          {item.status}
                        </Badge>
                        {item.statusRemarks && (
                          <p className="text-xs text-muted-foreground truncate max-w-[150px]" title={item.statusRemarks}>
                            {item.statusRemarks}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.currentBorrowerName ? (
                        <div>
                          <p className="text-sm">{item.currentBorrowerName}</p>
                          <p className="text-xs text-muted-foreground">
                            Due: {item.dueDate && format(item.dueDate, "dd MMM")}
                          </p>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    {canEditLibrary && (
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditClick(item)}
                          disabled={isReadOnly}
                          title="Edit status"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <TablePagination page={page} totalPages={totalPages} from={from} to={to} total={filteredData.length} onPageChange={setPage} />
        </CardContent>
      </Card>

      {/* Edit Status Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Book Status</DialogTitle>
            <DialogDescription>
              Update the condition or status for this book copy.
            </DialogDescription>
          </DialogHeader>
          
          {selectedBook && (
            <div className="space-y-4 py-4">
              {/* Book Info */}
              <div className="rounded-lg bg-muted p-3 space-y-1">
                <p className="font-mono text-sm font-medium">{selectedBook.accessionNo}</p>
                <p className="font-medium">{selectedBook.title}</p>
                <p className="text-sm text-muted-foreground">{selectedBook.author}</p>
              </div>

              {/* Current Status */}
              <div className="space-y-2">
                <Label>Current Status</Label>
                <Badge variant={getStatusVariant(selectedBook.status)} className="flex items-center gap-1 w-fit">
                  {getStatusIcon(selectedBook.status)}
                  {selectedBook.status}
                </Badge>
              </div>

              {/* New Status */}
              <div className="space-y-2">
                <Label htmlFor="new-status">New Status</Label>
                <Select 
                  value={newStatus} 
                  onValueChange={(v) => setNewStatus(v as BookStatus)}
                  disabled={selectedBook.status === "Issued" || selectedBook.status === "Overdue"}
                >
                  <SelectTrigger id="new-status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {editableStatuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status === "Available" ? "Good (Available)" : status}
                      </SelectItem>
                    ))}
                    {/* Show Lost option even for issued books */}
                    {(selectedBook.status === "Issued" || selectedBook.status === "Overdue") && (
                      <SelectItem value="Lost">Lost</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {(selectedBook.status === "Issued" || selectedBook.status === "Overdue") && (
                  <p className="text-xs text-muted-foreground">
                    This book is currently on loan. Only "Lost" status can be set here.
                  </p>
                )}
              </div>

              {/* Remarks */}
              <div className="space-y-2">
                <Label htmlFor="remarks">
                  Remarks {requiresRemarks && <span className="text-destructive">*</span>}
                </Label>
                <Textarea
                  id="remarks"
                  placeholder={
                    newStatus === "Damaged" 
                      ? "Describe the damage (mandatory)..." 
                      : newStatus === "Lost" 
                        ? "Reason for loss (mandatory)..." 
                        : "Optional notes..."
                  }
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="min-h-[80px]"
                />
                {requiresRemarks && !remarks.trim() && (
                  <p className="text-xs text-destructive">
                    Remarks are mandatory for {newStatus} status
                  </p>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveStatus}
              disabled={requiresRemarks && !remarks.trim()}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
