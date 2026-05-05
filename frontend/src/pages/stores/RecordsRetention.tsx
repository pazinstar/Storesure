import { useState } from "react";
import { useRecordsRetention, RecordCategory, RecordStatus, AppraisalDecision } from "@/contexts/RecordsRetentionContext";
import { useAuth } from "@/contexts/AuthContext";
import { useAudit } from "@/contexts/AuditContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Archive,
  Calendar,
  Clock,
  Download,
  FileText,
  Plus,
  Search,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Trash2,
  Eye,
  ClipboardCheck,
  BarChart3,
} from "lucide-react";
import { format, differenceInDays } from "date-fns";

const categories: RecordCategory[] = ["Financial", "Procurement", "Personnel", "Academic", "Correspondence", "Legal", "Administrative"];
const statusColors: Record<RecordStatus, string> = {
  Active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  Due_for_Appraisal: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  Pending_Disposal: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  Disposed: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
  Archived: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
};

export default function RecordsRetention() {
  const {
    records,
    appraisals,
    disposals,
    addRecord,
    initiateAppraisal,
    submitAppraisalDecision,
    authorizeAppraisal,
    rejectAppraisal,
    recordDisposal,
    getRecordsDueForAppraisal,
    getOverdueRecords,
    isLoading,
  } = useRecordsRetention();
  const { user } = useAuth();
  const { addLog } = useAudit();

  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showAppraisalDialog, setShowAppraisalDialog] = useState(false);
  const [showDisposalDialog, setShowDisposalDialog] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<string | null>(null);
  const [selectedAppraisal, setSelectedAppraisal] = useState<string | null>(null);

  // Loading states for actions
  const [isAdding, setIsAdding] = useState(false);
  const [isInitiating, setIsInitiating] = useState(false);
  const [isSubmittingDecision, setIsSubmittingDecision] = useState(false);
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isDisposing, setIsDisposing] = useState(false);

  // Form states
  const [newRecord, setNewRecord] = useState({
    title: "",
    category: "" as RecordCategory,
    description: "",
    creationDate: "",
    retentionYears: 6,
    location: "",
    custodian: "",
    notes: "",
  });

  const [appraisalDecision, setAppraisalDecision] = useState({
    decision: "" as AppraisalDecision,
    justification: "",
  });

  const [disposalForm, setDisposalForm] = useState({
    method: "" as "Shredding" | "Burning" | "Digital_Deletion" | "Transfer_to_Archives",
    witnessedBy: "",
    notes: "",
  });

  const dueForAppraisal = getRecordsDueForAppraisal();
  const overdueRecords = getOverdueRecords();

  const filteredRecords = records.filter(record => {
    const matchesSearch = record.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.recordCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || record.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || record.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleAddRecord = async () => {
    if (!newRecord.title || !newRecord.category || !newRecord.creationDate || !newRecord.location || !newRecord.custodian) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setIsAdding(true);
      const record = await addRecord({
        ...newRecord,
        retentionYears: Number(newRecord.retentionYears),
      });

      addLog("Record Added", "Stores", `Added record: ${record.recordCode} - ${record.title}`);
      toast.success(`Record ${record.recordCode} created successfully`);
      setShowAddDialog(false);
      setNewRecord({
        title: "",
        category: "" as RecordCategory,
        description: "",
        creationDate: "",
        retentionYears: 6,
        location: "",
        custodian: "",
        notes: "",
      });
    } catch (error) {
      toast.error("Failed to add record");
      console.error(error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleInitiateAppraisal = async (recordId: string) => {
    try {
      setIsInitiating(true);
      const appraisal = await initiateAppraisal(recordId, user?.name || "Unknown");
      addLog("Appraisal Initiated", "Stores", `Initiated appraisal for record: ${appraisal.recordCode}`);
      toast.success("Appraisal workflow initiated");
    } catch (error) {
      toast.error("Failed to initiate appraisal");
      console.error(error);
    } finally {
      setIsInitiating(false);
    }
  };

  const handleSubmitDecision = async () => {
    if (!selectedAppraisal || !appraisalDecision.decision || !appraisalDecision.justification) {
      toast.error("Please provide decision and justification");
      return;
    }

    try {
      setIsSubmittingDecision(true);
      await submitAppraisalDecision(
        selectedAppraisal,
        appraisalDecision.decision,
        appraisalDecision.justification,
        user?.name || "Unknown"
      );

      addLog("Appraisal Decision", "Stores", `Decision: ${appraisalDecision.decision} for appraisal ${selectedAppraisal}`);
      toast.success("Appraisal decision submitted");
      setShowAppraisalDialog(false);
      setSelectedAppraisal(null);
      setAppraisalDecision({ decision: "" as AppraisalDecision, justification: "" });
    } catch (error) {
      toast.error("Failed to submit appraisal decision");
      console.error(error);
    } finally {
      setIsSubmittingDecision(false);
    }
  };

  const handleAuthorize = async (appraisalId: string) => {
    try {
      setIsAuthorizing(true);
      await authorizeAppraisal(appraisalId, user?.name || "Unknown");
      addLog("Appraisal Authorized", "Stores", `Authorized appraisal: ${appraisalId}`);
      toast.success("Appraisal authorized");
    } catch (error) {
      toast.error("Failed to authorize appraisal");
      console.error(error);
    } finally {
      setIsAuthorizing(false);
    }
  };

  const handleReject = async (appraisalId: string) => {
    try {
      setIsRejecting(true);
      await rejectAppraisal(appraisalId, "Rejected by authorized officer");
      addLog("Appraisal Rejected", "Stores", `Rejected appraisal: ${appraisalId}`);
      toast.info("Appraisal rejected");
    } catch (error) {
      toast.error("Failed to reject appraisal");
      console.error(error);
    } finally {
      setIsRejecting(false);
    }
  };

  const handleRecordDisposal = async () => {
    if (!selectedRecord || !disposalForm.method || !disposalForm.witnessedBy) {
      toast.error("Please fill in all required fields");
      return;
    }

    const record = records.find(r => r.id === selectedRecord);
    const appraisal = appraisals.find(a => a.recordId === selectedRecord && a.status === "Authorized");

    if (!record || !appraisal) {
      toast.error("Record must have authorized appraisal before disposal");
      return;
    }

    try {
      setIsDisposing(true);
      const disposal = await recordDisposal({
        recordId: selectedRecord,
        recordCode: record.recordCode,
        recordTitle: record.title,
        appraisalId: appraisal.id,
        disposalMethod: disposalForm.method,
        disposalDate: new Date().toISOString().split("T")[0],
        disposedBy: user?.name || "Unknown",
        witnessedBy: disposalForm.witnessedBy,
        authorizationReference: appraisal.id,
        notes: disposalForm.notes,
      });

      addLog("Record Disposed", "Stores", `Disposed record: ${record.recordCode}, Certificate: ${disposal.certificateNumber}`);
      toast.success(`Disposal certificate ${disposal.certificateNumber} generated`);
      setShowDisposalDialog(false);
      setSelectedRecord(null);
      setDisposalForm({ method: "" as any, witnessedBy: "", notes: "" });
    } catch (error) {
      toast.error("Failed to process record disposal");
      console.error(error);
    } finally {
      setIsDisposing(false);
    }
  };

  const exportToCSV = () => {
    const headers = ["Record Code", "Title", "Category", "Creation Date", "Retention Years", "Expiry Date", "Status", "Location", "Custodian"];
    const csvContent = [
      headers.join(","),
      ...records.map(r => [
        r.recordCode,
        `"${r.title}"`,
        r.category,
        r.creationDate,
        r.retentionYears,
        r.expiryDate,
        r.status,
        `"${r.location}"`,
        `"${r.custodian}"`,
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `records-retention-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    addLog("Export", "Stores", "Exported records retention register to CSV");
    toast.success("Records exported to CSV");
  };

  const getDaysUntilExpiry = (expiryDate: string) => {
    if (!expiryDate) return 0;
    const date = new Date(expiryDate);
    if (isNaN(date.getTime())) return 0;
    return differenceInDays(date, new Date());
  };

  const safeFormatDate = (dateString: string | undefined | null) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? "-" : format(date, "MMM d, yyyy");
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Records Retention Scheduler</h1>
          <p className="text-muted-foreground">
            6-year tracking, appraisal workflows, and authorized disposal as per Section 45(1) and Cap 19
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportToCSV} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Record
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Record</DialogTitle>
                <DialogDescription>
                  Register a new record for retention tracking
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Record Title *</Label>
                    <Input
                      id="title"
                      value={newRecord.title}
                      onChange={(e) => setNewRecord({ ...newRecord, title: e.target.value })}
                      placeholder="Enter record title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select
                      value={newRecord.category}
                      onValueChange={(value: RecordCategory) => setNewRecord({ ...newRecord, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newRecord.description}
                    onChange={(e) => setNewRecord({ ...newRecord, description: e.target.value })}
                    placeholder="Brief description of the record"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="creationDate">Creation Date *</Label>
                    <Input
                      id="creationDate"
                      type="date"
                      value={newRecord.creationDate}
                      onChange={(e) => setNewRecord({ ...newRecord, creationDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="retentionYears">Retention Period (Years) *</Label>
                    <Select
                      value={String(newRecord.retentionYears)}
                      onValueChange={(value) => setNewRecord({ ...newRecord, retentionYears: Number(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3">3 Years</SelectItem>
                        <SelectItem value="5">5 Years</SelectItem>
                        <SelectItem value="6">6 Years (Default)</SelectItem>
                        <SelectItem value="7">7 Years</SelectItem>
                        <SelectItem value="10">10 Years</SelectItem>
                        <SelectItem value="15">15 Years</SelectItem>
                        <SelectItem value="25">25 Years (Permanent)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="location">Storage Location *</Label>
                    <Input
                      id="location"
                      value={newRecord.location}
                      onChange={(e) => setNewRecord({ ...newRecord, location: e.target.value })}
                      placeholder="e.g., Registry Room A, Shelf 3"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="custodian">Custodian *</Label>
                    <Input
                      id="custodian"
                      value={newRecord.custodian}
                      onChange={(e) => setNewRecord({ ...newRecord, custodian: e.target.value })}
                      placeholder="Name of responsible officer"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={newRecord.notes}
                    onChange={(e) => setNewRecord({ ...newRecord, notes: e.target.value })}
                    placeholder="Additional notes"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
                <Button onClick={handleAddRecord} disabled={isAdding}>
                  {isAdding ? "Adding..." : "Add Record"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Alert Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{records.length}</div>
            <p className="text-xs text-muted-foreground">In retention system</p>
          </CardContent>
        </Card>
        <Card className={overdueRecords.length > 0 ? "border-destructive" : ""}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Overdue Records</CardTitle>
            <AlertTriangle className={`h-4 w-4 ${overdueRecords.length > 0 ? "text-destructive" : "text-muted-foreground"}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${overdueRecords.length > 0 ? "text-destructive" : ""}`}>
              {overdueRecords.length}
            </div>
            <p className="text-xs text-muted-foreground">Past retention period</p>
          </CardContent>
        </Card>
        <Card className={dueForAppraisal.length > 0 ? "border-amber-500" : ""}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Due for Appraisal</CardTitle>
            <Clock className={`h-4 w-4 ${dueForAppraisal.length > 0 ? "text-amber-500" : "text-muted-foreground"}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${dueForAppraisal.length > 0 ? "text-amber-600" : ""}`}>
              {dueForAppraisal.length}
            </div>
            <p className="text-xs text-muted-foreground">Expiring within 6 months</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Disposed Records</CardTitle>
            <Trash2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{disposals.length}</div>
            <p className="text-xs text-muted-foreground">With disposal certificates</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="records" className="space-y-4">
        <TabsList>
          <TabsTrigger value="records" className="flex gap-2">
            <FileText className="h-4 w-4" />
            Records Register
          </TabsTrigger>
          <TabsTrigger value="appraisals" className="flex gap-2">
            <ClipboardCheck className="h-4 w-4" />
            Appraisal Workflows
            {appraisals.filter(a => a.status === "Pending" || a.status === "Appraised").length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {appraisals.filter(a => a.status === "Pending" || a.status === "Appraised").length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="disposals" className="flex gap-2">
            <Trash2 className="h-4 w-4" />
            Disposal History
          </TabsTrigger>
          <TabsTrigger value="statistics" className="flex gap-2">
            <BarChart3 className="h-4 w-4" />
            Statistics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="records" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle>Records Register</CardTitle>
                  <CardDescription>All records tracked for retention compliance</CardDescription>
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search records..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8 w-[200px]"
                    />
                  </div>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Due_for_Appraisal">Due for Appraisal</SelectItem>
                      <SelectItem value="Pending_Disposal">Pending Disposal</SelectItem>
                      <SelectItem value="Disposed">Disposed</SelectItem>
                      <SelectItem value="Archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Record Code</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Creation Date</TableHead>
                    <TableHead>Expiry Date</TableHead>
                    <TableHead>Days Left</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                        No records found. Add your first record to start tracking.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRecords.map((record) => {
                      const daysLeft = getDaysUntilExpiry(record.expiryDate);
                      return (
                        <TableRow key={record.id}>
                          <TableCell className="font-mono text-sm">{record.recordCode}</TableCell>
                          <TableCell className="font-medium">{record.title}</TableCell>
                          <TableCell>{record.category}</TableCell>
                          <TableCell>{safeFormatDate(record.creationDate)}</TableCell>
                          <TableCell>{safeFormatDate(record.expiryDate)}</TableCell>
                          <TableCell>
                            <span className={
                              daysLeft < 0 ? "text-destructive font-medium" :
                                daysLeft < 180 ? "text-amber-600 font-medium" :
                                  "text-muted-foreground"
                            }>
                              {daysLeft < 0 ? `${Math.abs(daysLeft)} days overdue` : `${daysLeft} days`}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge className={statusColors[record.status]}>
                              {record.status.replace(/_/g, " ")}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {record.status === "Active" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleInitiateAppraisal(record.id)}
                                  disabled={isInitiating}
                                >
                                  <ClipboardCheck className="h-3 w-3" />
                                </Button>
                              )}
                              {record.status === "Pending_Disposal" && (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => {
                                    setSelectedRecord(record.id);
                                    setShowDisposalDialog(true);
                                  }}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appraisals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Appraisal Workflows</CardTitle>
              <CardDescription>Track appraisal decisions and authorizations</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Record Code</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Initiated By</TableHead>
                    <TableHead>Initiated Date</TableHead>
                    <TableHead>Decision</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appraisals.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No appraisal workflows yet. Initiate appraisal from the Records Register.
                      </TableCell>
                    </TableRow>
                  ) : (
                    appraisals.map((appraisal) => (
                      <TableRow key={appraisal.id}>
                        <TableCell className="font-mono text-sm">{appraisal.recordCode}</TableCell>
                        <TableCell className="font-medium">{appraisal.recordTitle}</TableCell>
                        <TableCell>{appraisal.initiatedBy}</TableCell>
                        <TableCell>{safeFormatDate(appraisal.initiatedDate)}</TableCell>
                        <TableCell>
                          {appraisal.decision ? (
                            <Badge variant="outline">{appraisal.decision}</Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            appraisal.status === "Completed" ? "default" :
                              appraisal.status === "Rejected" ? "destructive" :
                                appraisal.status === "Authorized" ? "default" :
                                  "secondary"
                          }>
                            {appraisal.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {appraisal.status === "Pending" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedAppraisal(appraisal.id);
                                  setShowAppraisalDialog(true);
                                }}
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                Review
                              </Button>
                            )}
                            {appraisal.status === "Appraised" && (
                              <>
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => handleAuthorize(appraisal.id)}
                                  disabled={isAuthorizing || isRejecting}
                                >
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Authorize
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleReject(appraisal.id)}
                                  disabled={isAuthorizing || isRejecting}
                                >
                                  <XCircle className="h-3 w-3" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="disposals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Disposal History</CardTitle>
              <CardDescription>Records of all authorized disposals with certificates</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Certificate No.</TableHead>
                    <TableHead>Record Code</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Disposal Date</TableHead>
                    <TableHead>Disposed By</TableHead>
                    <TableHead>Witnessed By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {disposals.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No disposal records yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    disposals.map((disposal) => (
                      <TableRow key={disposal.id}>
                        <TableCell className="font-mono text-sm font-medium">{disposal.certificateNumber}</TableCell>
                        <TableCell className="font-mono text-sm">{disposal.recordCode}</TableCell>
                        <TableCell>{disposal.recordTitle}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{disposal.disposalMethod.replace(/_/g, " ")}</Badge>
                        </TableCell>
                        <TableCell>{safeFormatDate(disposal.disposalDate)}</TableCell>
                        <TableCell>{disposal.disposedBy}</TableCell>
                        <TableCell>{disposal.witnessedBy}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="statistics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Records by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {categories.map(cat => {
                    const count = records.filter(r => r.category === cat).length;
                    const percentage = records.length > 0 ? (count / records.length) * 100 : 0;
                    return (
                      <div key={cat} className="flex items-center gap-3">
                        <div className="w-24 text-sm">{cat}</div>
                        <div className="flex-1 bg-muted rounded-full h-2">
                          <div
                            className="bg-primary rounded-full h-2 transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <div className="w-8 text-sm text-right">{count}</div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Records by Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(["Active", "Due_for_Appraisal", "Pending_Disposal", "Archived", "Disposed"] as RecordStatus[]).map(status => {
                    const count = records.filter(r => r.status === status).length;
                    return (
                      <div key={status} className="flex items-center justify-between">
                        <Badge className={statusColors[status]}>{status.replace(/_/g, " ")}</Badge>
                        <span className="font-medium">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Appraisal Decision Dialog */}
      <Dialog open={showAppraisalDialog} onOpenChange={setShowAppraisalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Appraisal Decision</DialogTitle>
            <DialogDescription>
              Review the record and provide your appraisal decision as per Section 45(1)
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Decision *</Label>
              <Select
                value={appraisalDecision.decision}
                onValueChange={(value: AppraisalDecision) => setAppraisalDecision({ ...appraisalDecision, decision: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select decision" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Retain">Retain - Continue storing</SelectItem>
                  <SelectItem value="Dispose">Dispose - Authorize destruction</SelectItem>
                  <SelectItem value="Archive">Archive - Transfer to archives</SelectItem>
                  <SelectItem value="Extend">Extend - Add 2 more years</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Justification *</Label>
              <Textarea
                value={appraisalDecision.justification}
                onChange={(e) => setAppraisalDecision({ ...appraisalDecision, justification: e.target.value })}
                placeholder="Provide justification for your decision..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAppraisalDialog(false)}>Cancel</Button>
            <Button onClick={handleSubmitDecision} disabled={isSubmittingDecision}>
              {isSubmittingDecision ? "Submitting..." : "Submit Decision"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disposal Dialog */}
      <Dialog open={showDisposalDialog} onOpenChange={setShowDisposalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Disposal</DialogTitle>
            <DialogDescription>
              Complete the disposal process and generate disposal certificate
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Disposal Method *</Label>
              <Select
                value={disposalForm.method}
                onValueChange={(value: any) => setDisposalForm({ ...disposalForm, method: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Shredding">Shredding</SelectItem>
                  <SelectItem value="Burning">Burning</SelectItem>
                  <SelectItem value="Digital_Deletion">Digital Deletion</SelectItem>
                  <SelectItem value="Transfer_to_Archives">Transfer to Archives</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Witnessed By *</Label>
              <Input
                value={disposalForm.witnessedBy}
                onChange={(e) => setDisposalForm({ ...disposalForm, witnessedBy: e.target.value })}
                placeholder="Name of witness"
              />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={disposalForm.notes}
                onChange={(e) => setDisposalForm({ ...disposalForm, notes: e.target.value })}
                placeholder="Additional notes..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDisposalDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleRecordDisposal} disabled={isDisposing}>
              {isDisposing ? (
                "Processing..."
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Complete Disposal
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
