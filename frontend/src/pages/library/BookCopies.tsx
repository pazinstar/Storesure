import { useState } from "react";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/ui/table-pagination";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Search, Plus, BookCopy, QrCode, Barcode } from "lucide-react";

const bookCopies = [
  {
    accessionNo: "ACC-2024-001",
    isbn: "ISBN-001",
    title: "Mathematics Form 3",
    condition: "Good",
    status: "Available",
    branch: "Main Library",
    shelf: "A-12",
    dateAdded: "2024-01-15",
    lastIssued: "2024-11-20",
  },
  {
    accessionNo: "ACC-2024-002",
    isbn: "ISBN-001",
    title: "Mathematics Form 3",
    condition: "Good",
    status: "On Loan",
    branch: "Main Library",
    shelf: "A-12",
    dateAdded: "2024-01-15",
    lastIssued: "2024-11-28",
    borrower: "John Kamau (Form 3A)",
  },
  {
    accessionNo: "ACC-2024-003",
    isbn: "ISBN-002",
    title: "Biology for Secondary Schools",
    condition: "Fair",
    status: "Available",
    branch: "Science Wing",
    shelf: "B-05",
    dateAdded: "2024-02-10",
    lastIssued: "2024-11-15",
  },
  {
    accessionNo: "ACC-2024-004",
    isbn: "ISBN-003",
    title: "A History of Kenya",
    condition: "Good",
    status: "Reserved",
    branch: "Main Library",
    shelf: "C-08",
    dateAdded: "2024-01-20",
    lastIssued: "2024-10-30",
    reservedBy: "Mary Wanjiku (Form 4B)",
  },
  {
    accessionNo: "ACC-2024-005",
    isbn: "ISBN-006",
    title: "Things Fall Apart",
    condition: "Poor",
    status: "Under Repair",
    branch: "Main Library",
    shelf: "D-15",
    dateAdded: "2023-06-12",
    lastIssued: "2024-09-20",
  },
  {
    accessionNo: "ACC-2024-006",
    isbn: "ISBN-004",
    title: "Kiswahili Fasihi",
    condition: "New",
    status: "Available",
    branch: "Junior Section",
    shelf: "E-03",
    dateAdded: "2024-11-01",
    lastIssued: null,
  },
];

const statusColors: Record<string, string> = {
  Available: "bg-green-100 text-green-800",
  "On Loan": "bg-blue-100 text-blue-800",
  Reserved: "bg-yellow-100 text-yellow-800",
  "Under Repair": "bg-orange-100 text-orange-800",
  Lost: "bg-red-100 text-red-800",
  Disposed: "bg-gray-100 text-gray-800",
};

const conditionColors: Record<string, string> = {
  New: "bg-emerald-100 text-emerald-800",
  Good: "bg-green-100 text-green-800",
  Fair: "bg-yellow-100 text-yellow-800",
  Poor: "bg-orange-100 text-orange-800",
  Damaged: "bg-red-100 text-red-800",
};

export default function BookCopies() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const filteredCopies = bookCopies.filter((copy) => {
    const matchesSearch =
      copy.accessionNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      copy.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      copy.isbn.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "All" || copy.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const { page, setPage, totalPages, paginatedItems: pagedCopies, from, to } = usePagination(filteredCopies);

  const statusCounts = {
    Available: bookCopies.filter((c) => c.status === "Available").length,
    "On Loan": bookCopies.filter((c) => c.status === "On Loan").length,
    Reserved: bookCopies.filter((c) => c.status === "Reserved").length,
    "Under Repair": bookCopies.filter((c) => c.status === "Under Repair").length,
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Book Copies</h1>
          <p className="text-muted-foreground">
            Manage individual book copies with accession numbers
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Barcode className="mr-2 h-4 w-4" />
            Print Barcodes
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Copies
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Book Copies</DialogTitle>
                <DialogDescription>
                  Add new copies to an existing title in the catalogue
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title-select">Select Title</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Search and select title" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="isbn-001">Mathematics Form 3</SelectItem>
                      <SelectItem value="isbn-002">Biology for Secondary Schools</SelectItem>
                      <SelectItem value="isbn-003">A History of Kenya</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Number of Copies</Label>
                    <Input id="quantity" type="number" placeholder="1" defaultValue={1} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="condition">Condition</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="good">Good</SelectItem>
                        <SelectItem value="fair">Fair</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="branch">Branch</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select branch" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="main">Main Library</SelectItem>
                        <SelectItem value="science">Science Wing</SelectItem>
                        <SelectItem value="junior">Junior Section</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="shelf">Shelf Location</Label>
                    <Input id="shelf" placeholder="e.g., A-12" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="source">Source/Donor</Label>
                  <Input id="source" placeholder="e.g., MoE Textbook Fund" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setIsAddDialogOpen(false)}>Add Copies</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Status Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {Object.entries(statusCounts).map(([status, count]) => (
          <Card
            key={status}
            className={`cursor-pointer transition-all ${
              statusFilter === status ? "ring-2 ring-primary" : ""
            }`}
            onClick={() => setStatusFilter(statusFilter === status ? "All" : status)}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-sm text-muted-foreground">{status}</p>
                </div>
                <BookCopy className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by accession number, title, or ISBN..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Status</SelectItem>
                <SelectItem value="Available">Available</SelectItem>
                <SelectItem value="On Loan">On Loan</SelectItem>
                <SelectItem value="Reserved">Reserved</SelectItem>
                <SelectItem value="Under Repair">Under Repair</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Copies Table */}
      <Card>
        <CardHeader>
          <CardTitle>Book Copies Register</CardTitle>
          <CardDescription>
            {filteredCopies.length} copies
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Accession No.</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Condition</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Shelf</TableHead>
                <TableHead>Last Issued</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedCopies.map((copy) => (
                <TableRow key={copy.accessionNo}>
                  <TableCell className="font-mono text-sm">
                    <div className="flex items-center gap-2">
                      <QrCode className="h-4 w-4 text-muted-foreground" />
                      {copy.accessionNo}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{copy.title}</p>
                      <p className="text-xs text-muted-foreground">{copy.isbn}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={conditionColors[copy.condition]}>
                      {copy.condition}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <Badge className={statusColors[copy.status]}>{copy.status}</Badge>
                      {copy.borrower && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {copy.borrower}
                        </p>
                      )}
                      {copy.reservedBy && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {copy.reservedBy}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{copy.branch}</TableCell>
                  <TableCell>{copy.shelf}</TableCell>
                  <TableCell>
                    {copy.lastIssued ? (
                      new Date(copy.lastIssued).toLocaleDateString()
                    ) : (
                      <span className="text-muted-foreground">Never</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm">
                      {copy.status === "Available" ? "Issue" : "View"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination page={page} totalPages={totalPages} from={from} to={to} total={filteredCopies.length} onPageChange={setPage} />
        </CardContent>
      </Card>
    </div>
  );
}
