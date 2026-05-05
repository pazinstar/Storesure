import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useAuditLog } from "@/hooks/useAuditLog";
import { useReadOnlyGuard } from "@/hooks/useReadOnlyGuard";
import { useAuth } from "@/contexts/AuthContext";
import { LPO } from "@/mock/data";
import { useDelivery, generateDeliveryId } from "@/contexts/DeliveryContext";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { DeliveryStatus } from "@/mock/data";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Search, Plus, Truck, Package, MapPin, Eye, Clock,
  CheckCircle, ClipboardCheck, ArrowRight, PenLine
} from "lucide-react";

export default function DeliveryLogging() {
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form state
  const [deliveryId] = useState(() => generateDeliveryId());
  const [deliveryDateTime, setDeliveryDateTime] = useState(() => {
    const now = new Date();
    return now.toISOString().slice(0, 16);
  });
  const [selectedLpo, setSelectedLpo] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [deliveryPerson, setDeliveryPerson] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [deliveryNoteNumber, setDeliveryNoteNumber] = useState("");
  const [numberOfPackages, setNumberOfPackages] = useState("");
  const [apparentCondition, setApparentCondition] = useState("Sealed, intact");
  const [storageLocation, setStorageLocation] = useState("Receiving Area A");
  const [signatureConfirmed, setSignatureConfirmed] = useState(false);
  const [remarks, setRemarks] = useState("");

  const { logStoresAction } = useAuditLog();
  const { isReadOnly, blockAction } = useReadOnlyGuard();
  const { user } = useAuth();

  const { data: lpos = [] } = useQuery({
    queryKey: ['lpos'],
    queryFn: () => api.getLPOs()
  });

  const getPendingDeliveryLPOs = () => {
    return lpos.filter((lpo: LPO) =>
      lpo.status === "Approved" ||
      lpo.status === "Sent to Supplier" ||
      lpo.status === "Partially Delivered"
    );
  };

  const getLPOByNumber = (lpoNumber: string) => {
    return lpos.find((lpo: LPO) => lpo.lpoNumber === lpoNumber);
  };

  const { deliveries, addDelivery } = useDelivery();

  const { data: settings } = useQuery({
    queryKey: ['inventory-settings'],
    queryFn: () => api.getInventorySettings()
  });

  const availableLPOs = getPendingDeliveryLPOs() || [];

  const handleLpoSelect = (lpoNumber: string) => {
    setSelectedLpo(lpoNumber);
    if (lpoNumber === "none") {
      setSupplierName("");
      return;
    }
    const lpo = getLPOByNumber(lpoNumber);
    if (lpo) {
      setSupplierName(lpo.supplierName);
    }
  };

  const resetForm = () => {
    setDialogOpen(false);
    setSelectedLpo("");
    setSupplierName("");
    setDeliveryPerson("");
    setVehicleNumber("");
    setDeliveryNoteNumber("");
    setNumberOfPackages("");
    setApparentCondition("Sealed, intact");
    setStorageLocation("Receiving Area A");
    setSignatureConfirmed(false);
    setRemarks("");
  };

  const handleLogDelivery = () => {
    if (!selectedLpo || selectedLpo === "none") {
      toast.error("Please select an LPO reference");
      return;
    }
    if (!deliveryPerson.trim()) {
      toast.error("Please enter delivery person details");
      return;
    }
    if (!numberOfPackages.trim()) {
      toast.error("Please enter number of packages");
      return;
    }
    if (!signatureConfirmed) {
      toast.error("Please confirm your digital signature");
      return;
    }

    const lpo = getLPOByNumber(selectedLpo);

    addDelivery({
      deliveryId,
      dateTime: deliveryDateTime,
      supplierName,
      supplierId: lpo?.supplierId,
      lpoId: lpo?.id,
      lpoReference: selectedLpo,
      deliveryPerson,
      vehicleNumber,
      deliveryNote: deliveryNoteNumber,
      packages: numberOfPackages,
      condition: apparentCondition,
      receivedBy: user?.name || "Storekeeper",
      receivedAt: new Date().toISOString(),
      storageLocation,
      remarks,
    });

    logStoresAction("Delivery Logged", `${deliveryId}: ${supplierName} - ${numberOfPackages} received`);
    toast.success("Delivery Logged Successfully", {
      description: `${deliveryId} is now awaiting inspection`,
    });
    resetForm();
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { icon: React.ReactNode; className: string }> = {
      "Awaiting Inspection": {
        icon: <Clock className="h-3 w-3" />,
        className: "bg-warning/10 text-warning border-warning/20"
      },
      "Under Inspection": {
        icon: <ClipboardCheck className="h-3 w-3" />,
        className: "bg-info/10 text-info border-info/20"
      },
      "Accepted": {
        icon: <CheckCircle className="h-3 w-3" />,
        className: "bg-success/10 text-success border-success/20"
      },
      "Partially Accepted": {
        icon: <CheckCircle className="h-3 w-3" />,
        className: "bg-warning/10 text-warning border-warning/20"
      },
      "Rejected": {
        icon: <PenLine className="h-3 w-3" />,
        className: "bg-destructive/10 text-destructive border-destructive/20"
      },
    };

    const badgeConfig = config[status] || {
      icon: <Clock className="h-3 w-3" />,
      className: "bg-secondary/10 text-secondary-foreground border-secondary/20"
    };

    const { icon, className } = badgeConfig;
    return (
      <Badge className={`${className} gap-1`}>
        {icon}
        {status}
      </Badge>
    );
  };

  const filteredDeliveries = (deliveries || []).filter(d =>
    d.deliveryId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.lpoReference.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const awaitingCount = (deliveries || []).filter(d => d.status === "Awaiting Inspection").length;
  const underInspectionCount = (deliveries || []).filter(d => d.status === "Under Inspection").length;
  const acceptedCount = (deliveries || []).filter(d => d.status === "Accepted" || d.status === "Partially Accepted").length;

  return (
    <div className="flex-1 space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Delivery Logging</h1>
          <p className="text-muted-foreground mt-1">
            Record incoming deliveries before inspection
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="gap-2"
              disabled={isReadOnly}
              onClick={() => { if (blockAction("log deliveries")) return; }}
            >
              <Plus className="h-4 w-4" />
              Log Delivery
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-primary" />
                Log New Delivery
              </DialogTitle>
              <DialogDescription>
                Record delivery details before sending to Inspection & Acceptance Committee
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              {/* Delivery ID and Date/Time */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="delivery-id">Delivery ID</Label>
                  <Input
                    id="delivery-id"
                    value={deliveryId}
                    readOnly
                    className="bg-muted font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="delivery-datetime">Date & Time</Label>
                  <Input
                    id="delivery-datetime"
                    type="datetime-local"
                    value={deliveryDateTime}
                    onChange={(e) => setDeliveryDateTime(e.target.value)}
                  />
                </div>
              </div>

              <Separator />

              {/* LPO & Supplier */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>LPO Reference *</Label>
                  <Select value={selectedLpo} onValueChange={handleLpoSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select LPO" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">-- Select LPO --</SelectItem>
                      {availableLPOs.map(lpo => (
                        <SelectItem key={lpo.id} value={lpo.lpoNumber}>
                          {lpo.lpoNumber} - {lpo.supplierName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Supplier</Label>
                  <Input
                    value={supplierName || "Auto-filled from LPO"}
                    readOnly
                    className="bg-muted"
                  />
                </div>
              </div>

              <Separator />

              {/* Delivery Person & Vehicle */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="delivery-person">Delivery Person *</Label>
                  <Input
                    id="delivery-person"
                    placeholder="e.g., John Kamau (Driver)"
                    value={deliveryPerson}
                    onChange={(e) => setDeliveryPerson(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vehicle-number">Vehicle Registration</Label>
                  <Input
                    id="vehicle-number"
                    placeholder="e.g., KCA 123X"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                  />
                </div>
              </div>

              {/* Delivery Note & Packages */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="delivery-note-number">Delivery Note Number</Label>
                  <Input
                    id="delivery-note-number"
                    placeholder="e.g., DN-2025-789"
                    value={deliveryNoteNumber}
                    onChange={(e) => setDeliveryNoteNumber(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="packages">Number of Packages *</Label>
                  <Input
                    id="packages"
                    placeholder="e.g., 5 boxes"
                    value={numberOfPackages}
                    onChange={(e) => setNumberOfPackages(e.target.value)}
                  />
                </div>
              </div>

              {/* Condition & Storage */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Apparent Condition</Label>
                  <Select value={apparentCondition} onValueChange={setApparentCondition}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sealed, intact">Sealed, intact</SelectItem>
                      <SelectItem value="Good condition">Good condition</SelectItem>
                      <SelectItem value="Minor damage observed">Minor damage observed</SelectItem>
                      <SelectItem value="Damaged - requires inspection">Damaged - requires inspection</SelectItem>
                      <SelectItem value="Wet/damp packaging">Wet/damp packaging</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Storage Location</Label>
                  <div className="flex gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-2.5" />
                    <Select value={storageLocation} onValueChange={setStorageLocation}>
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(settings?.storeLocations || [
                          "Receiving Area A",
                          "Receiving Area B",
                          "Loading Bay",
                          "Quarantine Zone",
                          "Direct to Store"
                        ]).map((loc: string) => (
                          <SelectItem key={loc} value={loc}>
                            {loc}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Remarks */}
              <div className="space-y-2">
                <Label htmlFor="remarks">Remarks / Initial Observations</Label>
                <Textarea
                  id="remarks"
                  placeholder="Any observations about the delivery..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows={2}
                />
              </div>

              {/* Signature Confirmation */}
              <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="signature"
                    checked={signatureConfirmed}
                    onCheckedChange={(checked) => setSignatureConfirmed(checked as boolean)}
                  />
                  <div className="space-y-1">
                    <Label htmlFor="signature" className="cursor-pointer">
                      Digital Signature Confirmation
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      I, <span className="font-medium">{user?.name || "Storekeeper"}</span>, confirm that I have
                      received this delivery and the details above are accurate. This delivery will be forwarded
                      to the Inspection & Acceptance Committee.
                    </p>
                  </div>
                </div>
                {signatureConfirmed && (
                  <div className="flex items-center gap-2 text-xs text-success pl-7">
                    <CheckCircle className="h-3 w-3" />
                    Signed by {user?.name} at {new Date().toLocaleString()}
                  </div>
                )}
              </div>

              {/* Status Preview */}
              <div className="rounded-md border bg-warning/5 border-warning/20 p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-warning" />
                    <span className="font-medium">After logging:</span>
                  </div>
                  <Badge className="bg-warning/10 text-warning border-warning/20">
                    <Clock className="h-3 w-3 mr-1" />
                    AWAITING INSPECTION
                  </Badge>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={resetForm}>Cancel</Button>
              <Button onClick={handleLogDelivery} disabled={!signatureConfirmed}>
                <Truck className="h-4 w-4 mr-2" />
                Log Delivery
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Truck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Today</p>
                <p className="text-2xl font-bold text-foreground">{(deliveries || []).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning/10">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Awaiting Inspection</p>
                <p className="text-2xl font-bold text-foreground">{awaitingCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-info/10">
                <ClipboardCheck className="h-5 w-5 text-info" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Under Inspection</p>
                <p className="text-2xl font-bold text-foreground">{underInspectionCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10">
                <CheckCircle className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Accepted</p>
                <p className="text-2xl font-bold text-foreground">{acceptedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Deliveries Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Delivery Log</CardTitle>
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
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Delivery ID</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>LPO Ref</TableHead>
                  <TableHead>Packages</TableHead>
                  <TableHead>Condition</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Received By</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDeliveries.map((delivery) => (
                  <TableRow key={delivery.id}>
                    <TableCell className="font-mono text-sm font-medium">
                      {delivery.deliveryId}
                    </TableCell>
                    <TableCell>
                      {new Date(delivery.dateTime).toLocaleString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </TableCell>
                    <TableCell>{delivery.supplierName}</TableCell>
                    <TableCell className="font-mono text-sm">{delivery.lpoReference}</TableCell>
                    <TableCell>{delivery.packages}</TableCell>
                    <TableCell>
                      <span className={delivery.condition.includes("damage") ? "text-destructive" : ""}>
                        {delivery.condition}
                      </span>
                    </TableCell>
                    <TableCell>{delivery.storageLocation}</TableCell>
                    <TableCell>{delivery.receivedBy}</TableCell>
                    <TableCell>{getStatusBadge(delivery.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {delivery.status === "Awaiting Inspection" && (
                          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                            <ArrowRight className="h-3 w-3" /> To Inspection
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
