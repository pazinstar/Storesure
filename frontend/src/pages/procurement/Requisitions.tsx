import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { PurchaseRequisition, PurchaseRequisitionStatus } from "@/mock/data";
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Plus,
  Search,
  Filter,
  FileText,
  Eye,
  Edit,
  Send,
  CheckCircle,
  Clock,
  XCircle,
  ArrowRight,
  Package,
  ThumbsUp,
  ThumbsDown,
  AlertCircle,
  History,
  Printer,
  Download,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAudit } from "@/contexts/AuditContext";
import { useNotifications } from "@/contexts/NotificationContext";
import { useReadOnlyGuard } from "@/hooks/useReadOnlyGuard";
import { useSchool } from "@/contexts/SchoolContext";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

const workflowSteps = [
  { status: "draft", label: "Draft", icon: Edit, description: "Requisition created" },
  { status: "pending_approval", label: "Pending Approval", icon: Clock, description: "Awaiting HOD/Headteacher approval" },
  { status: "approved", label: "Approved", icon: CheckCircle, description: "Ready for processing" },
  { status: "processed", label: "Processed", icon: Package, description: "Items received/issued" },
];

const getStatusBadge = (status: PurchaseRequisitionStatus) => {
  switch (status) {
    case "draft":
      return <Badge variant="outline" className="flex items-center gap-1"><Edit className="h-3 w-3" />Draft</Badge>;
    case "pending_approval":
      return <Badge variant="secondary" className="flex items-center gap-1"><Clock className="h-3 w-3" />Pending Approval</Badge>;
    case "approved":
      return <Badge className="flex items-center gap-1 bg-primary"><CheckCircle className="h-3 w-3" />Approved</Badge>;
    case "processed":
      return <Badge className="flex items-center gap-1 bg-chart-2"><Package className="h-3 w-3" />Processed</Badge>;
    case "rejected":
      return <Badge variant="destructive" className="flex items-center gap-1"><XCircle className="h-3 w-3" />Rejected</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const getPriorityBadge = (priority: string) => {
  switch (priority) {
    case "high":
      return <Badge variant="destructive">High</Badge>;
    case "medium":
      return <Badge variant="secondary">Medium</Badge>;
    case "low":
      return <Badge variant="outline">Low</Badge>;
    default:
      return <Badge variant="outline">{priority}</Badge>;
  }
};

const getStatusIndex = (status: PurchaseRequisitionStatus): number => {
  const index = workflowSteps.findIndex(s => s.status === status);
  return index >= 0 ? index : -1;
};

const Requisitions = () => {
  const { data: requisitions = [], isLoading } = useQuery({
    queryKey: ['purchase-requisitions'],
    queryFn: () => api.getPurchaseRequisitions()
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [selectedRequisition, setSelectedRequisition] = useState<PurchaseRequisition | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { user } = useAuth();
  const { school } = useSchool();
  const { addLog } = useAudit();
  const { addNotification } = useNotifications();
  const { isReadOnly, blockAction } = useReadOnlyGuard();

  // Form state for new requisition
  const [newReq, setNewReq] = useState({
    department: "",
    priority: "",
    title: "",
    justification: "",
    budgetCode: "",
    estimate: "",
    requiredBy: "",
    account: "",
    voteHead: "",
    approvalLevel: 1,
  });

  const filteredRequisitions = requisitions.filter((req) => {
    const matchesSearch =
      req.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.requestedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.title?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || req.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: requisitions.length,
    draft: requisitions.filter(r => r.status === "draft").length,
    pending: requisitions.filter(r => r.status === "pending_approval").length,
    approved: requisitions.filter(r => r.status === "approved").length,
    processed: requisitions.filter(r => r.status === "processed").length,
  };

  const createMutation = useMutation({
    mutationFn: (data: Omit<PurchaseRequisition, "id">) => api.createPurchaseRequisition(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['purchase-requisitions'] })
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string, updates: Partial<PurchaseRequisition> }) => api.updatePurchaseRequisition(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-requisitions'] });
      // Update selected requisition if it's currently open
      if (selectedRequisition) {
        setIsDetailOpen(false);
      }
    }
  });

  const handleCreateRequisition = (asDraft: boolean) => {
    const newRequisition: Omit<PurchaseRequisition, "id"> = {
      date: new Date().toISOString().split('T')[0],
      department: newReq.department,
      requestedBy: user?.name || "Current User",
      items: 1,
      estimatedValue: `KES ${parseInt(newReq.estimate || "0").toLocaleString()}`,
      status: asDraft ? "draft" : "pending_approval",
      priority: newReq.priority,
      title: newReq.title,
      justification: newReq.justification,
      budgetCode: newReq.budgetCode,
      requiredBy: newReq.requiredBy,
      account: newReq.account,
      voteHead: newReq.voteHead,
      approvalLevel: newReq.approvalLevel,
    };

    createMutation.mutate(newRequisition, {
      onSuccess: (data) => {
        addLog(
          asDraft ? "Requisition Saved as Draft" : "Requisition Submitted",
          "Procurement",
          `${data.id} - ${data.title}`
        );

        if (!asDraft) {
          addNotification({
            title: "Requisition Submitted",
            message: `${data.id} - ${data.title} submitted by ${user?.name || "User"} awaiting approval`,
            type: "info",
            link: "/procurement/requisitions",
          });
        }

        toast.success(asDraft ? "Requisition saved as draft" : "Requisition submitted for approval");
        setIsDialogOpen(false);
        setNewReq({ department: "", priority: "", title: "", justification: "", budgetCode: "", estimate: "", requiredBy: "", account: "", voteHead: "", approvalLevel: 1 });
      },
      onError: () => toast.error("Failed to create requisition")
    });
  };

  const handleSubmitForApproval = (req: PurchaseRequisition) => {
    updateMutation.mutate({
      id: req.id,
      updates: { status: "pending_approval" as PurchaseRequisitionStatus }
    }, {
      onSuccess: () => {
        addLog("Requisition Submitted for Approval", "Procurement", `${req.id} - ${req.title}`);
        addNotification({
          title: "Requisition Pending Approval",
          message: `${req.id} - ${req.title} from ${req.department} requires approval`,
          type: "info",
          link: "/procurement/requisitions",
        });
        toast.success("Requisition submitted for approval");
      },
      onError: () => toast.error("Failed to submit requisition")
    });
  };

  const handleApprove = (req: PurchaseRequisition) => {
    updateMutation.mutate({
      id: req.id,
      updates: {
        status: "approved" as PurchaseRequisitionStatus,
        approvedBy: user?.name || "Approver",
        approvedDate: new Date().toISOString().split('T')[0]
      }
    }, {
      onSuccess: () => {
        addLog("Requisition Approved", "Procurement", `${req.id} - ${req.title}`);
        addNotification({
          title: "Requisition Approved",
          message: `${req.id} - ${req.title} has been approved by ${user?.name || "Approver"}`,
          type: "success",
          link: "/procurement/requisitions",
        });
        toast.success("Requisition approved successfully");
      },
      onError: () => toast.error("Failed to approve requisition")
    });
  };

  const handleReject = () => {
    if (!selectedRequisition) return;

    updateMutation.mutate({
      id: selectedRequisition.id,
      updates: {
        status: "rejected" as PurchaseRequisitionStatus,
        rejectionReason
      }
    }, {
      onSuccess: () => {
        addLog("Requisition Rejected", "Procurement", `${selectedRequisition.id} - ${selectedRequisition.title}: ${rejectionReason}`);
        addNotification({
          title: "Requisition Rejected",
          message: `${selectedRequisition.id} - ${selectedRequisition.title} was rejected: ${rejectionReason}`,
          type: "error",
          link: "/procurement/requisitions",
        });
        toast.error("Requisition rejected");
        setIsRejectDialogOpen(false);
        setRejectionReason("");
      },
      onError: () => toast.error("Failed to reject requisition")
    });
  };

  const handleProcess = (req: PurchaseRequisition) => {
    updateMutation.mutate({
      id: req.id,
      updates: {
        status: "processed" as PurchaseRequisitionStatus,
        processedBy: user?.name || "Processor",
        processedDate: new Date().toISOString().split('T')[0]
      }
    }, {
      onSuccess: () => {
        addLog("Requisition Processed", "Procurement", `${req.id} - ${req.title}`);
        addNotification({
          title: "Requisition Processed",
          message: `${req.id} - ${req.title} has been processed and items received/issued`,
          type: "success",
          link: "/procurement/requisitions",
        });
        toast.success("Requisition marked as processed");
      },
      onError: () => toast.error("Failed to process requisition")
    });
  };

  const openDetail = (req: PurchaseRequisition) => {
    setSelectedRequisition(req);
    setIsDetailOpen(true);
  };

  const canApprove = user?.role === "headteacher" || user?.role === "admin" || user?.role === "bursar";
  const canProcess = user?.role === "storekeeper" || user?.role === "admin" || user?.role === "bursar";

  const exportPDF = () => {
    const doc = new jsPDF({ orientation: "landscape", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    let y = 14;

    doc.setFontSize(14); doc.setFont("helvetica", "bold");
    doc.text(school?.name ?? "School", pageW / 2, y, { align: "center" }); y += 7;
    doc.setFontSize(11); doc.setFont("helvetica", "normal");
    doc.text("Purchase Requisitions Register", pageW / 2, y, { align: "center" }); y += 5;
    doc.setFontSize(8);
    doc.text(`Printed: ${new Date().toLocaleDateString("en-KE")}  |  Filter: ${statusFilter === "all" ? "All" : statusFilter}`, pageW / 2, y, { align: "center" }); y += 6;

    const head = [["#", "Requisition ID", "Date", "Title", "Department", "Requested By", "Est. Value", "Priority", "Status"]];
    const body = filteredRequisitions.map((r, i) => [
      i + 1,
      r.id,
      r.date,
      r.title || "—",
      r.department,
      r.requestedBy,
      r.estimatedValue,
      r.priority,
      r.status.replace("_", " "),
    ]);

    autoTable(doc, {
      startY: y,
      head,
      body,
      styles: { fontSize: 7, cellPadding: 2 },
      headStyles: { fillColor: [30, 80, 160], fontSize: 7, fontStyle: "bold" },
      columnStyles: { 0: { cellWidth: 10 } },
      didParseCell: (data) => {
        if (data.section === "body" && data.column.index === 8) {
          const val = (data.cell.raw as string).toLowerCase();
          if (val === "approved") { data.cell.styles.textColor = [22, 163, 74]; data.cell.styles.fontStyle = "bold"; }
          else if (val === "rejected") { data.cell.styles.textColor = [220, 38, 38]; data.cell.styles.fontStyle = "bold"; }
          else if (val.includes("pending")) { data.cell.styles.textColor = [202, 138, 4]; }
          else if (val === "processed") { data.cell.styles.textColor = [37, 99, 235]; data.cell.styles.fontStyle = "bold"; }
        }
        if (data.section === "body" && data.column.index === 7) {
          const val = (data.cell.raw as string).toLowerCase();
          if (val === "high") { data.cell.styles.textColor = [220, 38, 38]; data.cell.styles.fontStyle = "bold"; }
        }
      },
    });

    doc.save("Requisitions_Register.pdf");
    toast.success("PDF downloaded");
  };

  const exportExcel = () => {
    const headers = ["#", "Requisition ID", "Date", "Title", "Department", "Requested By", "Est. Value", "Priority", "Status", "Budget Code", "Justification"];
    const rows = filteredRequisitions.map((r, i) => [
      i + 1,
      r.id,
      r.date,
      r.title || "",
      r.department,
      r.requestedBy,
      r.estimatedValue,
      r.priority,
      r.status.replace("_", " "),
      r.budgetCode || "",
      r.justification || "",
    ]);

    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Requisitions");
    XLSX.writeFile(wb, "Requisitions_Register.xlsx");
    toast.success("Excel downloaded");
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Requisitions</h1>
          <p className="text-muted-foreground">Manage purchase requisitions with approval workflow</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportPDF}>
            <Printer className="h-4 w-4 mr-2" />PDF
          </Button>
          <Button variant="outline" size="sm" onClick={exportExcel}>
            <Download className="h-4 w-4 mr-2" />Excel
          </Button>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              disabled={isReadOnly}
              onClick={() => { if (blockAction("create requisitions")) return; }}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Requisition
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Requisition</DialogTitle>
              <DialogDescription>
                Submit a purchase requisition. All requisitions require proper justification and budget allocation.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Select value={newReq.department} onValueChange={(v) => setNewReq({ ...newReq, department: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Science Dept">Science Department</SelectItem>
                      <SelectItem value="Administration">Administration</SelectItem>
                      <SelectItem value="Library">Library</SelectItem>
                      <SelectItem value="ICT Department">ICT Department</SelectItem>
                      <SelectItem value="PE Department">PE Department</SelectItem>
                      <SelectItem value="Home Science">Home Science</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={newReq.priority} onValueChange={(v) => setNewReq({ ...newReq, priority: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Requisition Title</Label>
                <Input
                  id="title"
                  placeholder="Enter requisition title"
                  value={newReq.title}
                  onChange={(e) => setNewReq({ ...newReq, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="justification">Justification</Label>
                <Textarea
                  id="justification"
                  placeholder="Provide detailed justification for this requisition..."
                  rows={3}
                  value={newReq.justification}
                  onChange={(e) => setNewReq({ ...newReq, justification: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="budget">Budget Code</Label>
                  <Input
                    id="budget"
                    placeholder="e.g., EDU-2024-SCI-001"
                    value={newReq.budgetCode}
                    onChange={(e) => setNewReq({ ...newReq, budgetCode: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estimate">Estimated Value (KES)</Label>
                  <Input
                    id="estimate"
                    type="number"
                    placeholder="0"
                    value={newReq.estimate}
                    onChange={(e) => setNewReq({ ...newReq, estimate: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="requiredBy">Required By</Label>
                  <Input
                    id="requiredBy"
                    type="date"
                    value={newReq.requiredBy}
                    onChange={(e) => setNewReq({ ...newReq, requiredBy: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="account">Account Code</Label>
                  <Input
                    id="account"
                    placeholder="e.g., 4100-EDU"
                    value={newReq.account}
                    onChange={(e) => setNewReq({ ...newReq, account: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="voteHead">Vote Head</Label>
                  <Input
                    id="voteHead"
                    placeholder="e.g., SCI-01"
                    value={newReq.voteHead}
                    onChange={(e) => setNewReq({ ...newReq, voteHead: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="approvalLevel">Approval Level</Label>
                  <Input
                    id="approvalLevel"
                    type="number"
                    min={1}
                    value={newReq.approvalLevel}
                    onChange={(e) => setNewReq({ ...newReq, approvalLevel: parseInt(e.target.value || '1') })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => handleCreateRequisition(true)}>
                Save as Draft
              </Button>
              <Button onClick={() => handleCreateRequisition(false)}>
                <Send className="h-4 w-4 mr-2" />
                Submit for Approval
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Workflow Overview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <History className="h-4 w-4 text-primary" />
            Approval Workflow
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            {workflowSteps.map((step, index) => (
              <div key={step.status} className="flex items-center flex-1">
                <div className="flex flex-col items-center text-center flex-1">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center mb-2 ${index === 0 ? 'bg-muted' :
                    index === 1 ? 'bg-secondary/20' :
                      index === 2 ? 'bg-primary/20' :
                        'bg-chart-2/20'
                    }`}>
                    <step.icon className={`h-5 w-5 ${index === 0 ? 'text-muted-foreground' :
                      index === 1 ? 'text-secondary' :
                        index === 2 ? 'text-primary' :
                          'text-chart-2'
                      }`} />
                  </div>
                  <span className="text-sm font-medium">{step.label}</span>
                  <span className="text-xs text-muted-foreground">{step.description}</span>
                </div>
                {index < workflowSteps.length - 1 && (
                  <ArrowRight className="h-5 w-5 text-muted-foreground mx-2 flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Status Tabs & Stats */}
      <Tabs defaultValue="all" onValueChange={setStatusFilter}>
        <TabsList>
          <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
          <TabsTrigger value="draft">Draft ({stats.draft})</TabsTrigger>
          <TabsTrigger value="pending_approval">Pending ({stats.pending})</TabsTrigger>
          <TabsTrigger value="approved">Approved ({stats.approved})</TabsTrigger>
          <TabsTrigger value="processed">Processed ({stats.processed})</TabsTrigger>
        </TabsList>

        <TabsContent value={statusFilter} className="mt-4">
          {/* Requisitions Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Requisitions</CardTitle>
                  <CardDescription>View and manage purchase requisitions</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search requisitions..."
                      className="pl-8 w-[250px]"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Requisition ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Requested By</TableHead>
                    <TableHead>Est. Value</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequisitions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        No requisitions found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRequisitions.map((req) => (
                      <TableRow key={req.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openDetail(req)}>
                        <TableCell className="font-medium">{req.id}</TableCell>
                        <TableCell>{req.date}</TableCell>
                        <TableCell>{req.title || "-"}</TableCell>
                        <TableCell>{req.department}</TableCell>
                        <TableCell>{req.requestedBy}</TableCell>
                        <TableCell>{req.estimatedValue}</TableCell>
                        <TableCell>{getPriorityBadge(req.priority)}</TableCell>
                        <TableCell>{getStatusBadge(req.status)}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); openDetail(req); }}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Requisition Detail Sheet */}
      <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <SheetContent className="sm:max-w-xl overflow-y-auto">
          {selectedRequisition && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  {selectedRequisition.id}
                  {getStatusBadge(selectedRequisition.status)}
                </SheetTitle>
                <SheetDescription>
                  {selectedRequisition.title}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Workflow Progress */}
                <div>
                  <h4 className="text-sm font-medium mb-3">Workflow Progress</h4>
                  <div className="flex items-center gap-1">
                    {workflowSteps.map((step, index) => {
                      const currentIndex = getStatusIndex(selectedRequisition.status);
                      const isCompleted = selectedRequisition.status !== "rejected" && index <= currentIndex;
                      const isCurrent = index === currentIndex;

                      return (
                        <div key={step.status} className="flex items-center flex-1">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs ${isCompleted ? 'bg-primary text-primary-foreground' :
                            'bg-muted text-muted-foreground'
                            } ${isCurrent ? 'ring-2 ring-primary ring-offset-2' : ''}`}>
                            {isCompleted ? <CheckCircle className="h-4 w-4" /> : index + 1}
                          </div>
                          {index < workflowSteps.length - 1 && (
                            <div className={`h-1 flex-1 mx-1 rounded ${isCompleted && index < currentIndex ? 'bg-primary' : 'bg-muted'
                              }`} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {selectedRequisition.status === "rejected" && (
                    <div className="mt-3 p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-destructive">Rejected</p>
                          <p className="text-sm text-muted-foreground">{selectedRequisition.rejectionReason}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Details */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Department</span>
                    <p className="font-medium">{selectedRequisition.department}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Requested By</span>
                    <p className="font-medium">{selectedRequisition.requestedBy}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Date</span>
                    <p className="font-medium">{selectedRequisition.date}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Priority</span>
                    <p>{getPriorityBadge(selectedRequisition.priority)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Estimated Value</span>
                    <p className="font-medium">{selectedRequisition.estimatedValue}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Items</span>
                    <p className="font-medium">{selectedRequisition.items}</p>
                  </div>
                </div>

                {selectedRequisition.justification && (
                  <div>
                    <span className="text-sm text-muted-foreground">Justification</span>
                    <p className="text-sm mt-1 p-3 bg-muted rounded-lg">{selectedRequisition.justification}</p>
                  </div>
                )}

                {/* Approval Trail */}
                {(selectedRequisition.approvedBy || selectedRequisition.processedBy) && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="text-sm font-medium mb-3">Approval Trail</h4>
                      <div className="space-y-2 text-sm">
                        {selectedRequisition.approvedBy && (
                          <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                            <span>Approved by {selectedRequisition.approvedBy}</span>
                            <span className="text-muted-foreground">{selectedRequisition.approvedDate}</span>
                          </div>
                        )}
                        {selectedRequisition.processedBy && (
                          <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                            <span>Processed by {selectedRequisition.processedBy}</span>
                            <span className="text-muted-foreground">{selectedRequisition.processedDate}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                <Separator />

                {/* Action Buttons based on status */}
                <div className="flex gap-2">
                  {selectedRequisition.status === "draft" && (
                    <Button className="flex-1" onClick={() => handleSubmitForApproval(selectedRequisition)}>
                      <Send className="h-4 w-4 mr-2" />
                      Submit for Approval
                    </Button>
                  )}

                  {selectedRequisition.status === "pending_approval" && canApprove && (
                    <>
                      <Button className="flex-1" onClick={() => handleApprove(selectedRequisition)}>
                        <ThumbsUp className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        variant="destructive"
                        className="flex-1"
                        onClick={() => setIsRejectDialogOpen(true)}
                      >
                        <ThumbsDown className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    </>
                  )}

                  {selectedRequisition.status === "approved" && canProcess && (
                    <Button className="flex-1" onClick={() => handleProcess(selectedRequisition)}>
                      <Package className="h-4 w-4 mr-2" />
                      Mark as Processed
                    </Button>
                  )}

                  {selectedRequisition.status === "processed" && (
                    <div className="flex-1 text-center py-3 bg-chart-2/10 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-chart-2 mx-auto mb-1" />
                      <p className="text-sm font-medium text-chart-2">Workflow Complete</p>
                    </div>
                  )}

                  {selectedRequisition.status === "rejected" && (
                    <div className="flex-1 text-center py-3 bg-destructive/10 rounded-lg">
                      <XCircle className="h-5 w-5 text-destructive mx-auto mb-1" />
                      <p className="text-sm font-medium text-destructive">Requisition Rejected</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Rejection Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Requisition</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this requisition.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="rejection-reason">Rejection Reason</Label>
            <Textarea
              id="rejection-reason"
              placeholder="Enter reason for rejection..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={3}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject} disabled={!rejectionReason.trim()}>
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Requisitions;
