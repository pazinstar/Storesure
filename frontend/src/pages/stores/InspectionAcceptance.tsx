import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuditLog } from "@/hooks/useAuditLog";
import { useReadOnlyGuard } from "@/hooks/useReadOnlyGuard";
import { useAuth } from "@/contexts/AuthContext";
import { DeliveryRecord, InspectionItem, InspectionDecision } from "@/mock/data";
import { api } from "@/services/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useNotifications } from "@/contexts/NotificationContext";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Search, ClipboardCheck, Package, AlertTriangle, CheckCircle2,
  Clock, UserCheck, FileText, Printer, Download, Bell, X,
  Check, XCircle, AlertCircle
} from "lucide-react";

type FilterType = "pending_my" | "awaiting_others" | "all";

export default function InspectionAcceptance() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryRecord | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmSignDialog, setConfirmSignDialog] = useState(false);

  // Inspection form state
  const [inspectionItems, setInspectionItems] = useState<InspectionItem[]>([]);
  const [overallRemarks, setOverallRemarks] = useState("");
  const [decision, setDecision] = useState<InspectionDecision | "">("");
  const [confirmationChecked, setConfirmationChecked] = useState(false);

  const { logStoresAction } = useAuditLog();
  const { isReadOnly, blockAction } = useReadOnlyGuard();
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const queryClient = useQueryClient();
  const { data: deliveries = [], isLoading } = useQuery({
    queryKey: ['deliveries'],
    queryFn: () => api.getDeliveries()
  });

  // Get user's role for signature matching
  const userRole = useMemo(() => {
    if (user?.role === "storekeeper") return "Storekeeper";
    if (user?.role === "bursar") return "Bursar";
    if (user?.role === "headteacher" || user?.role === "admin") return "Headteacher";
    return "";
  }, [user?.role]);

  // Filter deliveries based on selection
  const filteredDeliveries = useMemo(() => {
    let filtered = deliveries.filter(
      (d) => d.status === "Awaiting Inspection" || d.status === "Under Inspection"
    );

    if (filter === "pending_my") {
      filtered = filtered.filter((d) => {
        const sig = d.signatures.find((s) => s.memberRole === userRole);
        return sig && !sig.signed;
      });
    } else if (filter === "awaiting_others") {
      filtered = filtered.filter((d) => {
        const mySig = d.signatures.find((s) => s.memberRole === userRole);
        return mySig?.signed && d.signatures.some((s) => !s.signed);
      });
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (d) =>
          d.deliveryId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          d.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          d.lpoReference.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [deliveries, filter, searchTerm, userRole]);

  const handleOpenInspection = (delivery: DeliveryRecord) => {
    if (blockAction("inspect deliveries")) return;
    setSelectedDelivery(delivery);
    setInspectionItems(
      delivery.items.map((item) => ({
        ...item,
        qtyAccepted: item.qtyAccepted || item.qtyDelivered,
        qtyRejected: item.qtyRejected || 0,
        remarks: item.remarks || "",
      }))
    );
    setOverallRemarks(delivery.overallRemarks || "");
    setDecision(delivery.decision || "");
    setConfirmationChecked(false);
    setDialogOpen(true);
  };

  const handleItemChange = (
    index: number,
    field: keyof InspectionItem,
    value: string | number
  ) => {
    setInspectionItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;

        const updated = { ...item, [field]: value };

        // Auto-calculate rejected if accepted changes
        if (field === "qtyAccepted") {
          updated.qtyRejected = Math.max(0, item.qtyDelivered - (value as number));
        }

        return updated;
      })
    );
  };

  const handleSaveItems = async () => {
    if (!selectedDelivery) return;

    // Validate remarks for rejected items
    const invalidItems = inspectionItems.filter(
      (item) => item.qtyRejected > 0 && !item.remarks.trim()
    );

    if (invalidItems.length > 0) {
      toast.error("Please provide remarks for all rejected items");
      return;
    }

    try {
      await api.updateInspectionItems(selectedDelivery.id, inspectionItems);
      await queryClient.invalidateQueries({ queryKey: ['deliveries'] });
      toast.success("Inspection items saved");
    } catch (error) {
      toast.error("Failed to save items");
    }
  };

  const handleSubmitDecision = async () => {
    if (!selectedDelivery || !decision) {
      toast.error("Please select a decision");
      return;
    }

    // Validate remarks for rejected items if partial/reject
    if (decision !== "accept_all") {
      const invalidItems = inspectionItems.filter(
        (item) => item.qtyRejected > 0 && !item.remarks.trim()
      );
      if (invalidItems.length > 0) {
        toast.error("Please provide remarks for all rejected items");
        return;
      }
    }

    try {
      await api.updateInspectionItems(selectedDelivery.id, inspectionItems);
      await api.submitInspectionDecision(selectedDelivery.id, decision, overallRemarks);
      await queryClient.invalidateQueries({ queryKey: ['deliveries'] });

      logStoresAction(
        "Inspection Decision",
        `${selectedDelivery.deliveryId}: Decision - ${decision}`
      );
      toast.success("Inspection decision submitted");
      addNotification({ title: "Inspection Decision", message: `${selectedDelivery.deliveryId}: ${decision}`, type: decision === "Accept" ? "success" : "warning", link: "/stores/inspection" });
      setDialogOpen(false);
    } catch (error) {
      toast.error("Failed to submit decision");
    }
  };

  const handleSign = async () => {
    if (!selectedDelivery || !confirmationChecked) {
      toast.error("Please confirm physical inspection");
      return;
    }

    try {
      // Save items first
      await api.updateInspectionItems(selectedDelivery.id, inspectionItems);

      const payload = {
        memberId: user?.id || "",
        memberName: user?.name || "",
        memberRole: userRole
      };

      await api.signInspection(selectedDelivery.id, payload);
      await queryClient.invalidateQueries({ queryKey: ['deliveries'] });

      logStoresAction(
        "Inspection Signed",
        `${selectedDelivery.deliveryId}: Signed by ${user?.name} as ${userRole}`
      );

      toast.success("Inspection signed successfully");
      addNotification({ title: "Inspection Signed", message: `${selectedDelivery.deliveryId} signed by ${user?.name}`, type: "success", link: "/stores/inspection" });
      setConfirmSignDialog(false);
      setConfirmationChecked(false);
      setDialogOpen(false);
    } catch (error) {
      toast.error("Failed to sign inspection");
    }
  };

  const canUserSign = (delivery: DeliveryRecord): boolean => {
    const sig = delivery.signatures.find((s) => s.memberRole === userRole);
    return !!sig && !sig.signed;
  };

  const getSignatureProgress = (delivery: DeliveryRecord) => {
    const signed = delivery.signatures.filter((s) => s.signed).length;
    return { signed, total: 3, percentage: (signed / 3) * 100 };
  };

  const getProgressBadge = (delivery: DeliveryRecord) => {
    const { signed } = getSignatureProgress(delivery);
    if (signed === 0) {
      return <Badge variant="outline" className="bg-muted text-muted-foreground">0/3</Badge>;
    } else if (signed < 3) {
      return <Badge className="bg-warning/10 text-warning border-warning/20">{signed}/3</Badge>;
    }
    return <Badge className="bg-success/10 text-success border-success/20">3/3 ✓</Badge>;
  };

  const calculateTotalValue = () => {
    return inspectionItems.reduce(
      (sum, item) => sum + item.qtyAccepted * item.unitPrice,
      0
    );
  };

  const hasVariances = inspectionItems.some(
    (item) => item.qtyDelivered !== item.qtyOrdered
  );

  return (
    <div className="flex-1 space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Inspection & Acceptance
          </h1>
          <p className="text-muted-foreground mt-1">
            Committee review and approval of deliveries
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-warning/10 flex items-center justify-center">
                <Clock className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending My Signature</p>
                <p className="text-2xl font-bold">
                  {deliveries.filter((d) => {
                    const sig = d.signatures.find((s) => s.memberRole === userRole);
                    return (
                      (d.status === "Awaiting Inspection" || d.status === "Under Inspection") &&
                      sig &&
                      !sig.signed
                    );
                  }).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-info/10 flex items-center justify-center">
                <UserCheck className="h-6 w-6 text-info" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Under Inspection</p>
                <p className="text-2xl font-bold">
                  {deliveries.filter((d) => d.status === "Under Inspection").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completed Today</p>
                <p className="text-2xl font-bold">
                  {deliveries.filter((d) => {
                    if (!d.inspectionCompletedAt) return false;
                    const today = new Date().toDateString();
                    return new Date(d.inspectionCompletedAt).toDateString() === today;
                  }).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-primary" />
              Pending Inspections
            </CardTitle>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Select
                value={filter}
                onValueChange={(v) => setFilter(v as FilterType)}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Pending</SelectItem>
                  <SelectItem value="pending_my">Pending My Signature</SelectItem>
                  <SelectItem value="awaiting_others">Awaiting Others</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search deliveries..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-full sm:w-[250px]"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Delivery ID</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>LPO Reference</TableHead>
                <TableHead>Delivery Date</TableHead>
                <TableHead className="text-center">Signatures</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDeliveries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No pending inspections found
                  </TableCell>
                </TableRow>
              ) : (
                filteredDeliveries.map((delivery) => (
                  <TableRow key={delivery.id}>
                    <TableCell className="font-mono font-medium">
                      {delivery.deliveryId}
                    </TableCell>
                    <TableCell>{delivery.supplierName}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {delivery.lpoReference}
                    </TableCell>
                    <TableCell>
                      {new Date(delivery.dateTime).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell className="text-center">
                      {getProgressBadge(delivery)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        onClick={() => handleOpenInspection(delivery)}
                        disabled={isReadOnly}
                      >
                        <ClipboardCheck className="h-4 w-4 mr-1" />
                        Inspect
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Inspection Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
          {selectedDelivery && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                      <ClipboardCheck className="h-5 w-5 text-primary" />
                      Inspection & Acceptance Certificate
                    </DialogTitle>
                    <DialogDescription className="mt-1">
                      Review delivery items and provide committee signatures
                    </DialogDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {(() => {
                      const { signed, percentage } = getSignatureProgress(selectedDelivery);
                      return (
                        <div className="flex items-center gap-3">
                          <Progress value={percentage} className="w-24 h-2" />
                          <Badge
                            className={
                              signed === 3
                                ? "bg-success/10 text-success border-success/20"
                                : signed > 0
                                  ? "bg-warning/10 text-warning border-warning/20"
                                  : "bg-muted text-muted-foreground"
                            }
                          >
                            {signed}/3 SIGNED
                          </Badge>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </DialogHeader>

              {/* Section A: Header (Read-Only) */}
              <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Section A: Delivery Information
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Delivery ID</Label>
                    <p className="font-mono font-medium">{selectedDelivery.deliveryId}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Delivery Date</Label>
                    <p className="font-medium">
                      {new Date(selectedDelivery.dateTime).toLocaleString("en-GB")}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">LPO Reference</Label>
                    <p className="font-mono font-medium">{selectedDelivery.lpoReference}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Supplier</Label>
                    <p className="font-medium">{selectedDelivery.supplierName}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Received By</Label>
                    <p className="font-medium">{selectedDelivery.receivedBy}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Storage Location</Label>
                    <p className="font-medium">{selectedDelivery.storageLocation}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Packages</Label>
                    <p className="font-medium">{selectedDelivery.packages}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Condition</Label>
                    <p className="font-medium">{selectedDelivery.condition}</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Section B: Items Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                    Section B: Items Verification
                  </h3>
                  {hasVariances && (
                    <Badge className="bg-warning/10 text-warning border-warning/20 gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Quantity Variances Detected
                    </Badge>
                  )}
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="w-[200px]">Item Description</TableHead>
                        <TableHead className="w-[60px]">Unit</TableHead>
                        <TableHead className="text-center w-[80px]">Ordered</TableHead>
                        <TableHead className="text-center w-[80px]">Delivered</TableHead>
                        <TableHead className="text-center w-[100px]">Accepted</TableHead>
                        <TableHead className="text-center w-[100px]">Rejected</TableHead>
                        <TableHead className="text-right w-[100px]">Unit Price</TableHead>
                        <TableHead className="text-right w-[100px]">Total (KES)</TableHead>
                        <TableHead className="w-[150px]">Remarks</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inspectionItems.map((item, index) => {
                        const hasVariance = item.qtyDelivered !== item.qtyOrdered;
                        const hasRejection = item.qtyRejected > 0;

                        return (
                          <TableRow
                            key={item.itemId}
                            className={hasVariance ? "bg-warning/5" : ""}
                          >
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                {hasVariance && (
                                  <AlertCircle className="h-4 w-4 text-warning flex-shrink-0" />
                                )}
                                {item.description}
                              </div>
                            </TableCell>
                            <TableCell>{item.unit}</TableCell>
                            <TableCell className="text-center">{item.qtyOrdered}</TableCell>
                            <TableCell className="text-center">
                              <span className={hasVariance ? "text-warning font-medium" : ""}>
                                {item.qtyDelivered}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min={0}
                                max={item.qtyDelivered}
                                value={item.qtyAccepted}
                                onChange={(e) =>
                                  handleItemChange(
                                    index,
                                    "qtyAccepted",
                                    Math.min(item.qtyDelivered, Math.max(0, parseInt(e.target.value) || 0))
                                  )
                                }
                                className="w-20 text-center"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min={0}
                                value={item.qtyRejected}
                                readOnly
                                className={`w-20 text-center bg-muted ${hasRejection ? "text-destructive font-medium" : ""}`}
                              />
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {item.unitPrice.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right font-mono font-medium">
                              {(item.qtyAccepted * item.unitPrice).toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <Input
                                placeholder={hasRejection ? "Required*" : "Optional"}
                                value={item.remarks}
                                onChange={(e) =>
                                  handleItemChange(index, "remarks", e.target.value)
                                }
                                className={`text-xs ${hasRejection && !item.remarks ? "border-destructive" : ""}`}
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex justify-end">
                  <div className="bg-muted/50 rounded-lg px-4 py-2">
                    <span className="text-sm text-muted-foreground mr-2">Total Accepted Value:</span>
                    <span className="font-bold text-lg">
                      KES {calculateTotalValue().toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Section C: Summary */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Section C: Inspection Summary
                </h3>

                <div className="space-y-2">
                  <Label>Overall Remarks</Label>
                  <Textarea
                    placeholder="Enter overall observations about this delivery..."
                    value={overallRemarks}
                    onChange={(e) => setOverallRemarks(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="space-y-3">
                  <Label>Committee Decision</Label>
                  <RadioGroup
                    value={decision}
                    onValueChange={(v) => setDecision(v as InspectionDecision)}
                    className="flex flex-col gap-3"
                  >
                    <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                      <RadioGroupItem value="accept_all" id="accept_all" />
                      <Label htmlFor="accept_all" className="flex items-center gap-2 cursor-pointer flex-1">
                        <CheckCircle2 className="h-4 w-4 text-success" />
                        <span>Accept all items</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          All items meet specifications and can proceed to GRN
                        </span>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                      <RadioGroupItem value="partial_accept" id="partial_accept" />
                      <Label htmlFor="partial_accept" className="flex items-center gap-2 cursor-pointer flex-1">
                        <AlertTriangle className="h-4 w-4 text-warning" />
                        <span>Partially accept</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          Some items rejected - only accepted items proceed
                        </span>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                      <RadioGroupItem value="reject_all" id="reject_all" />
                      <Label htmlFor="reject_all" className="flex items-center gap-2 cursor-pointer flex-1">
                        <XCircle className="h-4 w-4 text-destructive" />
                        <span>Reject entire delivery</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          Items do not meet requirements - return to supplier
                        </span>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>

              <Separator />

              {/* Committee Signature Panel */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Committee Signatures
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {selectedDelivery.signatures.map((sig, index) => {
                    const isSigned = sig.signed;
                    const isCurrentUserRole = sig.memberRole === userRole;
                    const canSign = isCurrentUserRole && !isSigned;

                    return (
                      <Card
                        key={index}
                        className={`relative ${isSigned
                            ? "border-success/50 bg-success/5"
                            : canSign
                              ? "border-primary/50 bg-primary/5"
                              : "border-muted"
                          }`}
                      >
                        <CardContent className="pt-4 pb-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                                Member {index + 1}
                                {index === 0 && " (Mandatory)"}
                              </p>
                              <p className="font-medium">
                                {isSigned ? sig.memberName : sig.memberRole}
                              </p>
                              <p className="text-sm text-muted-foreground">{sig.memberRole}</p>
                            </div>
                            <div className="h-10 w-10 rounded-full flex items-center justify-center">
                              {isSigned ? (
                                <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center">
                                  <Check className="h-5 w-5 text-success" />
                                </div>
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                                  <Clock className="h-5 w-5 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                          </div>

                          {isSigned ? (
                            <div className="text-xs text-success flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Signed {sig.signedAt && new Date(sig.signedAt).toLocaleString("en-GB")}
                            </div>
                          ) : canSign ? (
                            <Button
                              size="sm"
                              className="w-full"
                              onClick={() => setConfirmSignDialog(true)}
                              disabled={isReadOnly}
                            >
                              <UserCheck className="h-4 w-4 mr-1" />
                              Sign Now
                            </Button>
                          ) : (
                            <Badge variant="outline" className="w-full justify-center">
                              Pending
                            </Badge>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>

              <Separator />

              {/* Action Buttons */}
              <DialogFooter className="flex-col sm:flex-row gap-2">
                {(() => {
                  const { signed } = getSignatureProgress(selectedDelivery);

                  if (signed === 0) {
                    return (
                      <>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button variant="secondary" onClick={handleSaveItems}>
                          Save as Draft
                        </Button>
                        <Button onClick={handleSubmitDecision} disabled={!decision}>
                          Submit for Signatures
                        </Button>
                      </>
                    );
                  } else if (signed < 3) {
                    return (
                      <>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>
                          Close
                        </Button>
                        <Button variant="secondary" onClick={handleSaveItems}>
                          Save Changes
                        </Button>
                        {canUserSign(selectedDelivery) && (
                          <Button onClick={() => setConfirmSignDialog(true)}>
                            <UserCheck className="h-4 w-4 mr-1" />
                            Sign
                          </Button>
                        )}
                        <Button variant="outline">
                          <Bell className="h-4 w-4 mr-1" />
                          Send Reminder
                        </Button>
                      </>
                    );
                  } else {
                    return (
                      <>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>
                          Close
                        </Button>
                        <Button variant="secondary">
                          <Printer className="h-4 w-4 mr-1" />
                          Print Certificate
                        </Button>
                        <Button variant="secondary">
                          <Download className="h-4 w-4 mr-1" />
                          Download PDF
                        </Button>
                        {!selectedDelivery.grnGenerated && (
                          <Button className="bg-success hover:bg-success/90">
                            <FileText className="h-4 w-4 mr-1" />
                            Generate GRN
                          </Button>
                        )}
                      </>
                    );
                  }
                })()}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Sign Confirmation Dialog */}
      <AlertDialog open={confirmSignDialog} onOpenChange={setConfirmSignDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-primary" />
              Confirm Your Signature
            </AlertDialogTitle>
            <AlertDialogDescription>
              You are about to sign off on this inspection as{" "}
              <span className="font-medium text-foreground">{userRole}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="py-4">
            <div className="flex items-start gap-3 p-4 rounded-lg border bg-muted/30">
              <Checkbox
                id="confirm-inspection"
                checked={confirmationChecked}
                onCheckedChange={(checked) => setConfirmationChecked(checked as boolean)}
              />
              <div className="space-y-1">
                <Label htmlFor="confirm-inspection" className="cursor-pointer font-medium">
                  I confirm I physically inspected these items
                </Label>
                <p className="text-xs text-muted-foreground">
                  By checking this box, I certify that I have personally verified the quantity,
                  quality, and condition of the delivered items.
                </p>
              </div>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmationChecked(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSign}
              disabled={!confirmationChecked}
              className="bg-primary"
            >
              <Check className="h-4 w-4 mr-1" />
              Sign & Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
