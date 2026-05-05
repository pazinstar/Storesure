import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Plus, Search, Filter, Download, Trash2, AlertTriangle, CheckCircle2, Clock, MapPin, User, Calendar, RotateCcw, XCircle, Pen } from "lucide-react";
import { useFileMovement, FileCategory, FileMovement, MAX_BORROW_DAYS } from "@/contexts/FileMovementContext";
import { useAudit } from "@/contexts/AuditContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format, addDays, differenceInDays, parseISO } from "date-fns";
import { api } from "@/services/api";
import { useQuery } from "@tanstack/react-query";

export default function FileMovementRegister() {
  const { movements, borrowFile, returnFile, markAsLost, getOverdueFiles, clearMovements } = useFileMovement();
  const { addLog } = useAudit();
  const { user } = useAuth();

  const { data: settings } = useQuery({
    queryKey: ['file-movement-settings'],
    queryFn: () => api.getFileMovementSettings()
  });

  const CATEGORIES = settings?.categories || [];
  const DEPARTMENTS = settings?.departments || [];
  const LOCATIONS = settings?.locations || [];

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [returnDialogId, setReturnDialogId] = useState<string | null>(null);
  const [returnNotes, setReturnNotes] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");

  // Form state
  const [fileReference, setFileReference] = useState("");
  const [fileTitle, setFileTitle] = useState("");
  const [category, setCategory] = useState<FileCategory | "">("");
  const [location, setLocation] = useState("");
  const [borrowedBy, setBorrowedBy] = useState("");
  const [borrowerDepartment, setBorrowerDepartment] = useState("");
  const [purpose, setPurpose] = useState("");
  const [borrowerSignature, setBorrowerSignature] = useState(false);
  const [isIssuing, setIsIssuing] = useState(false);
  const [isReturning, setIsReturning] = useState(false);
  const [isMarkingLost, setIsMarkingLost] = useState(false);

  const overdueFiles = getOverdueFiles();

  const handleBorrow = async () => {
    if (!fileReference || !fileTitle || !category || !location || !borrowedBy || !borrowerDepartment || !purpose) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!borrowerSignature) {
      toast.error("Borrower signature is required");
      return;
    }

    const borrowDate = new Date().toISOString();
    const expectedReturnDate = addDays(new Date(), MAX_BORROW_DAYS).toISOString();

    setIsIssuing(true);
    try {
      await borrowFile({
        fileReference,
        fileTitle,
        category: category as FileCategory,
        location,
        borrowedBy,
        borrowerDepartment,
        borrowDate,
        expectedReturnDate,
        purpose,
        borrowerSignature: true,
      });

      addLog(
        "File Borrowed",
        "System",
        `File ${fileReference} - "${fileTitle}" borrowed by ${borrowedBy} from ${location}`
      );

      toast.success(`File issued to ${borrowedBy}. Due: ${format(parseISO(expectedReturnDate), "MMM d, yyyy")}`);

      // Reset form
      setFileReference("");
      setFileTitle("");
      setCategory("");
      setLocation("");
      setBorrowedBy("");
      setBorrowerDepartment("");
      setPurpose("");
      setBorrowerSignature(false);
      setIsDialogOpen(false);
    } catch (error) {
      toast.error("Failed to issue file");
    } finally {
      setIsIssuing(false);
    }
  };

  const handleReturn = async () => {
    if (!returnDialogId) return;

    const movement = movements.find((m) => m.id === returnDialogId);
    if (!movement) return;

    setIsReturning(true);
    try {
      await returnFile(returnDialogId, returnNotes);

      addLog(
        "File Returned",
        "System",
        `File ${movement.fileReference} - "${movement.fileTitle}" returned by ${movement.borrowedBy}`
      );

      toast.success("File returned successfully");
      setReturnDialogId(null);
      setReturnNotes("");
    } catch (error) {
      toast.error("Failed to return file");
    } finally {
      setIsReturning(false);
    }
  };

  const handleMarkLost = async (id: string, notes: string) => {
    const movement = movements.find((m) => m.id === id);
    if (!movement) return;

    setIsMarkingLost(true);
    try {
      await markAsLost(id, notes);

      addLog(
        "File Marked Lost",
        "System",
        `File ${movement.fileReference} - "${movement.fileTitle}" marked as LOST. Notes: ${notes}`
      );

      toast.error("File marked as lost");
    } catch (error) {
      toast.error("Failed to mark file as lost");
    } finally {
      setIsMarkingLost(false);
    }
  };

  const exportToCSV = () => {
    const headers = [
      "File Reference",
      "Title",
      "Category",
      "Borrowed By",
      "Department",
      "Borrow Date",
      "Expected Return",
      "Actual Return",
      "Status",
      "Purpose",
    ];
    const csvContent = [
      headers.join(","),
      ...filteredMovements.map((m) =>
        [
          `"${m.fileReference}"`,
          `"${m.fileTitle}"`,
          `"${m.category}"`,
          `"${m.borrowedBy}"`,
          `"${m.borrowerDepartment}"`,
          `"${format(parseISO(m.borrowDate), "MMM d, yyyy")}"`,
          `"${format(parseISO(m.expectedReturnDate), "MMM d, yyyy")}"`,
          `"${m.actualReturnDate ? format(parseISO(m.actualReturnDate), "MMM d, yyyy") : "-"}"`,
          `"${m.status}"`,
          `"${m.purpose}"`,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `file_movement_register_${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();

    addLog("File Register Exported", "System", `Exported ${filteredMovements.length} file movement records to CSV`);
  };

  const filteredMovements = useMemo(() => {
    return movements.filter((m) => {
      const matchesSearch =
        m.fileReference.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.fileTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.borrowedBy.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.borrowerDepartment.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === "All" || m.status === statusFilter;
      const matchesCategory = categoryFilter === "All" || m.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [movements, searchQuery, statusFilter, categoryFilter]);

  const getStatusBadge = (status: FileMovement["status"]) => {
    switch (status) {
      case "Checked Out":
        return (
          <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">
            <Clock className="h-3 w-3 mr-1" />
            Checked Out
          </Badge>
        );
      case "Returned":
        return (
          <Badge className="bg-success/10 text-success border-success/20">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Returned
          </Badge>
        );
      case "Overdue":
        return (
          <Badge className="bg-destructive/10 text-destructive border-destructive/20">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Overdue
          </Badge>
        );
      case "Lost":
        return (
          <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">
            <XCircle className="h-3 w-3 mr-1" />
            Lost
          </Badge>
        );
    }
  };

  const getDaysInfo = (movement: FileMovement) => {
    if (movement.status === "Returned" && movement.actualReturnDate) {
      const days = differenceInDays(parseISO(movement.actualReturnDate), parseISO(movement.borrowDate));
      return <span className="text-muted-foreground">{days} days</span>;
    }
    if (movement.status === "Checked Out" || movement.status === "Overdue") {
      const daysOut = differenceInDays(new Date(), parseISO(movement.borrowDate));
      const daysOverdue = differenceInDays(new Date(), parseISO(movement.expectedReturnDate));
      if (daysOverdue > 0) {
        return <span className="text-destructive font-medium">{daysOverdue} days overdue</span>;
      }
      return <span className="text-muted-foreground">{daysOut} days out</span>;
    }
    return "-";
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">File Movement Register</h1>
          <p className="text-muted-foreground">Track document borrowing, returns, and locations as per Section 2.3.3</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Issue File
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Issue File to Officer
              </DialogTitle>
              <DialogDescription>
                Record file borrowing with officer details. Files must be returned within {MAX_BORROW_DAYS} days.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fileReference">File Reference *</Label>
                  <Input
                    id="fileReference"
                    placeholder="e.g., PPOA/4/3/1"
                    value={fileReference}
                    onChange={(e) => setFileReference(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select value={category} onValueChange={(v) => setCategory(v as FileCategory)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fileTitle">File Title *</Label>
                <Input
                  id="fileTitle"
                  placeholder="e.g., Tender for Supply of Computers"
                  value={fileTitle}
                  onChange={(e) => setFileTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Current Location *</Label>
                <Select value={location} onValueChange={setLocation}>
                  <SelectTrigger>
                    <SelectValue placeholder="Where is the file being taken from?" />
                  </SelectTrigger>
                  <SelectContent>
                    {LOCATIONS.map((loc) => (
                      <SelectItem key={loc} value={loc}>
                        {loc}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="borrowedBy">Borrowing Officer *</Label>
                  <Input
                    id="borrowedBy"
                    placeholder="Officer name"
                    value={borrowedBy}
                    onChange={(e) => setBorrowedBy(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="borrowerDepartment">Department *</Label>
                  <Select value={borrowerDepartment} onValueChange={setBorrowerDepartment}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {DEPARTMENTS.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="purpose">Purpose *</Label>
                <Textarea
                  id="purpose"
                  placeholder="Reason for borrowing the file"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="flex items-center space-x-2 p-4 border rounded-lg bg-muted/30">
                <Checkbox
                  id="signature"
                  checked={borrowerSignature}
                  onCheckedChange={(checked) => setBorrowerSignature(checked === true)}
                />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="signature" className="flex items-center gap-2">
                    <Pen className="h-4 w-4" />
                    Borrower Signature Confirmation *
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    By checking this, you confirm the borrower has signed the physical register.
                  </p>
                </div>
              </div>

              <div className="bg-warning/10 border border-warning/20 rounded-lg p-3">
                <p className="text-sm text-warning flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Files must be returned within {MAX_BORROW_DAYS} days. Expected return:{" "}
                  {format(addDays(new Date(), MAX_BORROW_DAYS), "MMM d, yyyy")}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleBorrow} disabled={isIssuing}>
                <FileText className="h-4 w-4 mr-2" />
                {isIssuing ? "Issuing..." : "Issue File"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Overdue Alert Banner */}
      {overdueFiles.length > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <div className="flex-1">
                <p className="font-medium text-destructive">
                  {overdueFiles.length} Overdue File{overdueFiles.length > 1 ? "s" : ""}
                </p>
                <p className="text-sm text-muted-foreground">
                  {overdueFiles.map((f) => f.fileReference).join(", ")} - Please follow up for return.
                </p>
              </div>
              <Button variant="destructive" size="sm" onClick={() => setStatusFilter("Overdue")}>
                View Overdue
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Movement Register
          </CardTitle>
          <CardDescription>
            Total records: {movements.length} | Active: {movements.filter((m) => m.status === "Checked Out").length} |
            Overdue: {overdueFiles.length}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="register" className="space-y-4">
            <TabsList>
              <TabsTrigger value="register">Register</TabsTrigger>
              <TabsTrigger value="statistics">Statistics</TabsTrigger>
            </TabsList>

            <TabsContent value="register" className="space-y-4">
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search files..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[150px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Categories</SelectItem>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Status</SelectItem>
                    <SelectItem value="Checked Out">Checked Out</SelectItem>
                    <SelectItem value="Returned">Returned</SelectItem>
                    <SelectItem value="Overdue">Overdue</SelectItem>
                    <SelectItem value="Lost">Lost</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={exportToCSV} disabled={filteredMovements.length === 0}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                {movements.length > 0 && (
                  <Button variant="outline" onClick={clearMovements}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear
                  </Button>
                )}
              </div>

              <div className="text-sm text-muted-foreground">
                Showing {filteredMovements.length} of {movements.length} records
              </div>

              <ScrollArea className="h-[500px]">
                {filteredMovements.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                    <FileText className="h-12 w-12 mb-4 opacity-50" />
                    <p className="text-sm">No file movements found.</p>
                    <p className="text-xs mt-1">Issue a file to get started.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>File Reference</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Borrowed By</TableHead>
                        <TableHead>From</TableHead>
                        <TableHead>Date Out</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMovements.map((movement) => (
                        <TableRow key={movement.id} className={movement.status === "Overdue" ? "bg-destructive/5" : ""}>
                          <TableCell className="font-mono font-medium">{movement.fileReference}</TableCell>
                          <TableCell className="max-w-[150px] truncate" title={movement.fileTitle}>
                            {movement.fileTitle}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="h-3 w-3 text-muted-foreground" />
                              <div>
                                <p className="text-sm">{movement.borrowedBy}</p>
                                <p className="text-xs text-muted-foreground">{movement.borrowerDepartment}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm">
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              {movement.location}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm">
                              <Calendar className="h-3 w-3 text-muted-foreground" />
                              {format(parseISO(movement.borrowDate), "MMM d, yyyy")}
                            </div>
                          </TableCell>
                          <TableCell>{getDaysInfo(movement)}</TableCell>
                          <TableCell>{getStatusBadge(movement.status)}</TableCell>
                          <TableCell className="text-right">
                            {(movement.status === "Checked Out" || movement.status === "Overdue") && (
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setReturnDialogId(movement.id)}
                                >
                                  <RotateCcw className="h-3 w-3 mr-1" />
                                  Return
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="sm" className="text-destructive">
                                      <XCircle className="h-3 w-3" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Mark File as Lost?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This will mark file "{movement.fileReference}" as lost. This action should
                                        trigger an investigation.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        className="bg-destructive text-destructive-foreground"
                                        onClick={() => handleMarkLost(movement.id, "File reported missing")}
                                        disabled={isMarkingLost}
                                      >
                                        {isMarkingLost ? "Marking Lost..." : "Mark as Lost"}
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="statistics">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-primary">{movements.length}</div>
                    <p className="text-sm text-muted-foreground">Total Movements</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-blue-600">
                      {movements.filter((m) => m.status === "Checked Out").length}
                    </div>
                    <p className="text-sm text-muted-foreground">Currently Out</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-destructive">{overdueFiles.length}</div>
                    <p className="text-sm text-muted-foreground">Overdue</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-success">
                      {movements.filter((m) => m.status === "Returned").length}
                    </div>
                    <p className="text-sm text-muted-foreground">Returned</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">By Category</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {CATEGORIES.map((cat) => (
                        <div key={cat} className="flex justify-between">
                          <span className="text-sm">{cat}</span>
                          <span className="font-medium">{movements.filter((m) => m.category === cat).length}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">By Department</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {DEPARTMENTS.slice(0, 5).map((dept) => (
                        <div key={dept} className="flex justify-between">
                          <span className="text-sm">{dept}</span>
                          <span className="font-medium">
                            {movements.filter((m) => m.borrowerDepartment === dept).length}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Return Dialog */}
      <Dialog open={returnDialogId !== null} onOpenChange={() => setReturnDialogId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-success" />
              Return File
            </DialogTitle>
            <DialogDescription>
              Confirm the file has been returned to the registry.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Return Notes (Optional)</Label>
              <Textarea
                placeholder="Any observations about the file condition..."
                value={returnNotes}
                onChange={(e) => setReturnNotes(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex items-center space-x-2 p-4 border rounded-lg bg-muted/30">
              <Checkbox id="returnSignature" checked />
              <div className="grid gap-1.5 leading-none">
                <Label htmlFor="returnSignature" className="flex items-center gap-2">
                  <Pen className="h-4 w-4" />
                  Registry Officer Signature
                </Label>
                <p className="text-sm text-muted-foreground">
                  Confirms the file has been received back in good condition.
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReturnDialogId(null)}>
              Cancel
            </Button>
            <Button onClick={handleReturn} className="bg-success hover:bg-success/90" disabled={isReturning}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              {isReturning ? "Confirming..." : "Confirm Return"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
