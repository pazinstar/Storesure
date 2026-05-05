import { useState } from "react";
import { format } from "date-fns";
import {
  FileText,
  Plus,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Package,
  Send,
  Download,
  Eye,
  Trash2,
  ClipboardCheck,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useS12, S12Requisition as S12RequisitionType, S12Item, S12Status } from "@/contexts/S12Context";
import { useAuditLog } from "@/hooks/useAuditLog";
import { useReadOnlyGuard } from "@/hooks/useReadOnlyGuard";
import { toast } from "sonner";
import { ItemCombobox, StoreItem } from "@/components/stores/ItemCombobox";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/contexts/NotificationContext";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";

const departments = [
  "Administration",
  "Academic",
  "Finance",
  "Procurement",
  "Maintenance",
  "Library",
  "Laboratory",
  "Sports",
  "Kitchen",
];

export default function S12Requisition() {
  const {
    requisitions,
    createRequisition,
    submitForApproval,
    approveRequisition,
    rejectRequisition,
    issueItems,
    confirmReceipt,
    cancelRequisition,
  } = useS12();
  const { logStoresAction } = useAuditLog();
  const { isReadOnly, blockAction } = useReadOnlyGuard();
  const { user } = useAuth();
  const { addNotification } = useNotifications();

  const { data: inventoryItems = [] } = useQuery({
    queryKey: ['inventory'],
    queryFn: () => api.getInventory()
  });

  const storeItems: StoreItem[] = inventoryItems.map(item => ({
    code: String(item.id),
    description: item.name,
    unit: item.unit,
    assetType: "Consumable"
  }));

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [issueDialogOpen, setIssueDialogOpen] = useState(false);
  const [selectedRequisition, setSelectedRequisition] = useState<S12RequisitionType | null>(null);
  const [confirmSubmitOpen, setConfirmSubmitOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    requestingDepartment: "",
    requestedBy: "",
    purpose: "",
  });
  const [formItems, setFormItems] = useState<Omit<S12Item, "id" | "quantityApproved" | "quantityIssued">[]>([]);
  const [approvalRemarks, setApprovalRemarks] = useState("");
  const [approvedQuantities, setApprovedQuantities] = useState<Record<string, number>>({});
  const [issuedQuantities, setIssuedQuantities] = useState<Record<string, number>>({});

  const getStatusBadge = (status: S12Status) => {
    const variants: Record<S12Status, "default" | "secondary" | "destructive" | "outline"> = {
      Draft: "outline",
      "Pending Approval": "secondary",
      Approved: "default",
      "Partially Issued": "secondary",
      "Fully Issued": "default",
      Rejected: "destructive",
      Cancelled: "destructive",
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const handleCreateRequisition = () => {
    if (!formData.requestingDepartment || !formData.requestedBy || !formData.purpose) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (formItems.length === 0) {
      toast.error("Please add at least one item");
      return;
    }

    const itemsWithIds: S12Item[] = formItems.map((item) => ({
      ...item,
      id: crypto.randomUUID(),
      quantityApproved: 0,
      quantityIssued: 0,
      unitPrice: 0,
    }));

    const newRequisition = createRequisition({
      ...formData,
      requestDate: new Date().toISOString(),
      items: itemsWithIds,
    });

    logStoresAction("CREATE", `Created S12 requisition ${newRequisition.s12Number}`);

    toast.success(`Requisition ${newRequisition.s12Number} created`);
    addNotification({ title: "S12 Requisition Created", message: `${newRequisition.s12Number} created by ${formData.requestedBy} for ${formData.requestingDepartment}`, type: "info", link: "/stores/s12" });
    setCreateDialogOpen(false);
    resetForm();
  };

  const handleSubmitForApproval = (requisition: S12RequisitionType) => {
    submitForApproval(requisition.id);
    logStoresAction("UPDATE", `Submitted S12 ${requisition.s12Number} for approval`);
    toast.success("Requisition submitted for approval");
    addNotification({ title: "S12 Submitted for Approval", message: `${requisition.s12Number} submitted by ${requisition.requestedBy}`, type: "info", link: "/stores/s12" });
  };

  const handleApprove = () => {
    if (!selectedRequisition) return;

    const quantities: Record<string, number> = {};
    selectedRequisition.items.forEach((item) => {
      quantities[item.id] = approvedQuantities[item.id] ?? item.quantityRequested;
    });

    approveRequisition(
      selectedRequisition.id,
      "Current User",
      approvalRemarks,
      quantities
    );

    logStoresAction("UPDATE", `Approved S12 ${selectedRequisition.s12Number}`);

    toast.success("Requisition approved");
    addNotification({ title: "S12 Requisition Approved", message: `${selectedRequisition.s12Number} approved for ${selectedRequisition.requestingDepartment}`, type: "success", link: "/stores/s12" });
    setApproveDialogOpen(false);
    setApprovalRemarks("");
    setApprovedQuantities({});
  };

  const handleReject = () => {
    if (!selectedRequisition || !approvalRemarks) {
      toast.error("Please provide rejection remarks");
      return;
    }

    rejectRequisition(selectedRequisition.id, "Current User", approvalRemarks);

    logStoresAction("UPDATE", `Rejected S12 ${selectedRequisition.s12Number}`);

    toast.success("Requisition rejected");
    addNotification({ title: "S12 Requisition Rejected", message: `${selectedRequisition.s12Number} rejected — ${approvalRemarks}`, type: "error", link: "/stores/s12" });
    setApproveDialogOpen(false);
    setApprovalRemarks("");
  };

  const handleIssue = () => {
    if (!selectedRequisition) return;

    const hasQuantities = Object.values(issuedQuantities).some((q) => q > 0);
    if (!hasQuantities) {
      toast.error("Please enter quantities to issue");
      return;
    }

    issueItems(selectedRequisition.id, "Storekeeper", issuedQuantities);

    logStoresAction("UPDATE", `Issued items for S12 ${selectedRequisition.s12Number}`);

    toast.success("Items issued successfully");
    addNotification({ title: "Stock Issued", message: `Items issued for ${selectedRequisition.s12Number}`, type: "success", link: "/stores/s12" });
    setIssueDialogOpen(false);
    setIssuedQuantities({});
  };

  const handleConfirmReceipt = (requisition: S12RequisitionType) => {
    confirmReceipt(requisition.id, "Receiver Name");
    logStoresAction("UPDATE", `Confirmed receipt for S12 ${requisition.s12Number}`);
    toast.success("Receipt confirmed");
    addNotification({ title: "Receipt Confirmed", message: `${requisition.s12Number} receipt confirmed`, type: "success", link: "/stores/s12" });
  };

  const addItem = () => {
    setFormItems([
      ...formItems,
      {
        itemCode: "",
        description: "",
        unit: "",
        quantityRequested: 1,
        unitPrice: 0,
      },
    ]);
  };

  const updateItem = (index: number, field: string, value: string | number) => {
    const updated = [...formItems];
    updated[index] = { ...updated[index], [field]: value };
    setFormItems(updated);
  };

  const handleItemSelect = (index: number, item: StoreItem) => {
    const updated = [...formItems];
    updated[index] = {
      ...updated[index],
      itemCode: item.code,
      description: item.description,
      unit: item.unit,
    };
    setFormItems(updated);
  };

  const removeItem = (index: number) => {
    setFormItems(formItems.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setFormData({
      requestingDepartment: "",
      requestedBy: "",
      purpose: "",
    });
    setFormItems([]);
  };

  const exportToCSV = () => {
    const headers = [
      "S12 Number",
      "Request Date",
      "Department",
      "Requested By",
      "Purpose",
      "Status",
      "Total Value",
    ];
    const rows = filteredRequisitions.map((r) => [
      r.s12Number,
      format(new Date(r.requestDate), "yyyy-MM-dd"),
      r.requestingDepartment,
      r.requestedBy,
      r.purpose,
      r.status,
      r.items.reduce((sum, item) => sum + item.quantityRequested * item.unitPrice, 0),
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `s12-requisitions-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  const filteredRequisitions = requisitions.filter((r) => {
    const matchesSearch =
      r.s12Number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.requestingDepartment.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.requestedBy.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingApprovals = requisitions.filter((r) => r.status === "Pending Approval").length;
  const pendingIssues = requisitions.filter(
    (r) => r.status === "Approved" || r.status === "Partially Issued"
  ).length;
  const thisMonthCount = requisitions.filter(
    (r) =>
      new Date(r.requestDate).getMonth() === new Date().getMonth() &&
      new Date(r.requestDate).getFullYear() === new Date().getFullYear()
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">S12 - Stores Requisition & Issue Voucher</h1>
          <p className="text-muted-foreground">
            Manage stock requisitions, approvals, and issues
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          {user?.role !== "headteacher" && (
            <Button
              onClick={() => { if (!blockAction("create requisitions")) setCreateDialogOpen(true); }}
              disabled={isReadOnly}
            >
              <Plus className="mr-2 h-4 w-4" />
              New Requisition
            </Button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{thisMonthCount}</div>
            <p className="text-xs text-muted-foreground">Requisitions created</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingApprovals}</div>
            <p className="text-xs text-muted-foreground">Awaiting authorization</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ready to Issue</CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingIssues}</div>
            <p className="text-xs text-muted-foreground">Approved for issue</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {requisitions.filter((r) => r.status === "Fully Issued").length}
            </div>
            <p className="text-xs text-muted-foreground">Fully issued</p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {pendingApprovals > 0 && (
        <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
          <CardContent className="flex items-center gap-4 py-4">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <div>
              <p className="font-medium text-yellow-800 dark:text-yellow-200">
                {pendingApprovals} requisition(s) pending approval
              </p>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Review and approve pending requisitions to enable stock issuance
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Requisitions Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Requisitions</CardTitle>
            <div className="flex gap-2">
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search requisitions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Pending Approval">Pending Approval</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Partially Issued">Partially Issued</SelectItem>
                  <SelectItem value="Fully Issued">Fully Issued</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>S12 Number</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Requested By</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Value (KES)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequisitions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No requisitions found
                  </TableCell>
                </TableRow>
              ) : (
                filteredRequisitions.map((requisition) => (
                  <TableRow key={requisition.id}>
                    <TableCell className="font-medium">{requisition.s12Number}</TableCell>
                    <TableCell>
                      {format(new Date(requisition.requestDate), "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell>{requisition.requestingDepartment}</TableCell>
                    <TableCell>{requisition.requestedBy}</TableCell>
                    <TableCell>{requisition.items.length} items</TableCell>
                    <TableCell>
                      {requisition.items
                        .reduce((sum, item) => sum + item.quantityRequested * item.unitPrice, 0)
                        .toLocaleString()}
                    </TableCell>
                    <TableCell>{getStatusBadge(requisition.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedRequisition(requisition);
                            setViewDialogOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        {requisition.status === "Draft" && user?.role === "bursar" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={() => {
                              setSelectedRequisition(requisition);
                              setConfirmSubmitOpen(true);
                            }}
                          >
                            <Send className="h-4 w-4" />
                            Submit
                          </Button>
                        )}
                        {requisition.status === "Pending Approval" && user?.role === "headteacher" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2 bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:text-green-800 hover:border-green-300 dark:bg-green-950 dark:text-green-200 dark:border-green-800 hover:dark:bg-green-900 hover:dark:text-green-100"
                            onClick={() => {
                              setSelectedRequisition(requisition);
                              setApproveDialogOpen(true);
                            }}
                          >
                            <ClipboardCheck className="h-4 w-4" />
                            Review
                          </Button>
                        )}
                        {/* Issue action removed: dedicated Issue Stock page handles issuance */}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Confirm Submit Dialog */}
      <Dialog open={confirmSubmitOpen} onOpenChange={setConfirmSubmitOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Submit Requisition for Approval?</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-muted-foreground">
            This will send the S12 to the Headteacher for approval. You will not be able to edit it until a decision is made.
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmSubmitOpen(false)}>Cancel</Button>
            <Button
              onClick={() => {
                if (selectedRequisition) {
                  handleSubmitForApproval(selectedRequisition);
                }
                setConfirmSubmitOpen(false);
              }}
            >
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New S12 - Stores Requisition</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Requesting Department *</Label>
                <Select
                  value={formData.requestingDepartment}
                  onValueChange={(value) =>
                    setFormData({ ...formData, requestingDepartment: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Requested By *</Label>
                <Input
                  value={formData.requestedBy}
                  onChange={(e) =>
                    setFormData({ ...formData, requestedBy: e.target.value })
                  }
                  placeholder="Enter name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Purpose *</Label>
              <Textarea
                value={formData.purpose}
                onChange={(e) =>
                  setFormData({ ...formData, purpose: e.target.value })
                }
                placeholder="Describe the purpose of this requisition"
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Items</Label>
                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Item
                </Button>
              </div>

              {formItems.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[300px]">Item</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {formItems.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <ItemCombobox
                            items={storeItems}
                            value={item.itemCode}
                            onSelect={(selected) => handleItemSelect(index, selected)}
                            placeholder="Search item..."
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={item.unit}
                            readOnly
                            className="w-20 bg-muted"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantityRequested}
                            onChange={(e) =>
                              updateItem(index, "quantityRequested", parseInt(e.target.value) || 1)
                            }
                            className="w-24"
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItem(index)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateRequisition}>Create Requisition</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Requisition Details - {selectedRequisition?.s12Number}</DialogTitle>
          </DialogHeader>
          {selectedRequisition && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Department</Label>
                  <p className="font-medium">{selectedRequisition.requestingDepartment}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Requested By</Label>
                  <p className="font-medium">{selectedRequisition.requestedBy}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Request Date</Label>
                  <p className="font-medium">
                    {format(new Date(selectedRequisition.requestDate), "dd/MM/yyyy")}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <p>{getStatusBadge(selectedRequisition.status)}</p>
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground">Purpose</Label>
                <p className="font-medium">{selectedRequisition.purpose}</p>
              </div>

              {selectedRequisition.approvedBy && (
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <Label className="text-muted-foreground">Approved By</Label>
                    <p className="font-medium">{selectedRequisition.approvedBy}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Approval Date</Label>
                    <p className="font-medium">
                      {selectedRequisition.approvalDate &&
                        format(new Date(selectedRequisition.approvalDate), "dd/MM/yyyy")}
                    </p>
                  </div>
                  {selectedRequisition.approvalRemarks && (
                    <div className="col-span-2">
                      <Label className="text-muted-foreground">Approval Remarks</Label>
                      <p className="font-medium">{selectedRequisition.approvalRemarks}</p>
                    </div>
                  )}
                </div>
              )}

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Requested</TableHead>
                    <TableHead>Approved</TableHead>
                    <TableHead>Issued</TableHead>
                    <TableHead>Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedRequisition.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.description}</p>
                          <p className="text-sm text-muted-foreground">{item.itemCode}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {item.quantityRequested} {item.unit}
                      </TableCell>
                      <TableCell>
                        {item.quantityApproved} {item.unit}
                      </TableCell>
                      <TableCell>
                        {item.quantityIssued} {item.unit}
                      </TableCell>
                      <TableCell>
                        {item.quantityApproved - item.quantityIssued} {item.unit}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex gap-4 pt-4 border-t">
                <div className="flex items-center gap-2">
                  {selectedRequisition.issuerSignature ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="text-sm">Issuer Signature</span>
                </div>
                <div className="flex items-center gap-2">
                  {selectedRequisition.receiverSignature ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="text-sm">Receiver Signature</span>
                </div>
              </div>

              {selectedRequisition.status === "Fully Issued" &&
                !selectedRequisition.receiverSignature && (
                  <Button
                    className="w-full"
                    onClick={() => {
                      handleConfirmReceipt(selectedRequisition);
                      setViewDialogOpen(false);
                    }}
                  >
                    Confirm Receipt
                  </Button>
                )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Approve Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Review Requisition - {selectedRequisition?.s12Number}</DialogTitle>
          </DialogHeader>
          {selectedRequisition && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Department</Label>
                  <p className="font-medium">{selectedRequisition.requestingDepartment}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Requested By</Label>
                  <p className="font-medium">{selectedRequisition.requestedBy}</p>
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground">Purpose</Label>
                <p>{selectedRequisition.purpose}</p>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Requested</TableHead>
                    <TableHead>Approve Qty</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedRequisition.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.description}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.itemCode} • {item.unit}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{item.quantityRequested}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          max={item.quantityRequested}
                          value={approvedQuantities[item.id] ?? item.quantityRequested}
                          onChange={(e) =>
                            setApprovedQuantities({
                              ...approvedQuantities,
                              [item.id]: parseInt(e.target.value) || 0,
                            })
                          }
                          className="w-24"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="space-y-2">
                <Label>Remarks</Label>
                <Textarea
                  value={approvalRemarks}
                  onChange={(e) => setApprovalRemarks(e.target.value)}
                  placeholder="Enter approval/rejection remarks"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="destructive" onClick={handleReject}>
              <XCircle className="mr-2 h-4 w-4" />
              Reject
            </Button>
            <Button onClick={handleApprove}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Issue Dialog */}
      <Dialog open={issueDialogOpen} onOpenChange={setIssueDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Issue Items - {selectedRequisition?.s12Number}</DialogTitle>
          </DialogHeader>
          {selectedRequisition && (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Approved</TableHead>
                    <TableHead>Already Issued</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Issue Now</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedRequisition.items.map((item) => {
                    const balance = item.quantityApproved - item.quantityIssued;
                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{item.description}</p>
                            <p className="text-sm text-muted-foreground">
                              {item.itemCode} • {item.unit}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{item.quantityApproved}</TableCell>
                        <TableCell>{item.quantityIssued}</TableCell>
                        <TableCell>{balance}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            max={balance}
                            value={issuedQuantities[item.id] || ""}
                            onChange={(e) =>
                              setIssuedQuantities({
                                ...issuedQuantities,
                                [item.id]: parseInt(e.target.value) || 0,
                              })
                            }
                            className="w-24"
                            disabled={balance === 0}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIssueDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleIssue}>
              <Package className="mr-2 h-4 w-4" />
              Issue Items
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
