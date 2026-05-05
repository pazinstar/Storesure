import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import {
  FileText,
  Plus,
  Search,
  Filter,
  Download,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Building2,
  Calendar as CalendarIcon,
  DollarSign,
  Eye,
  CreditCard,
  XCircle,
  Pause,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { ContractType, ContractStatus, Contract, PaymentMilestone } from "@/mock/data";
import { useAudit } from "@/contexts/AuditContext";
import { useAuth } from "@/contexts/AuthContext";
import { useReadOnlyGuard } from "@/hooks/useReadOnlyGuard";
import { toast } from "sonner";
import { useNotifications } from "@/contexts/NotificationContext";
import { format, parseISO, differenceInDays } from "date-fns";

const CONTRACT_TYPES: ContractType[] = ["Works", "Services", "Supplies"];
const CONTRACT_STATUSES: ContractStatus[] = ["Active", "Completed", "Terminated", "On Hold", "Expired"];

const ACCOUNTS = [
  "Development Vote",
  "Recurrent Vote",
  "Capital Expenditure",
  "Maintenance Fund",
  "Special Projects",
  "Donor Funded",
];

export default function ContractRegister() {
  const queryClient = useQueryClient();
  const { data: contracts = [] } = useQuery({
    queryKey: ['contracts'],
    queryFn: () => api.getContracts()
  });

  const { addLog } = useAudit();
  const { user } = useAuth();
  const { isReadOnly, blockAction } = useReadOnlyGuard();
  const { addNotification } = useNotifications();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<{ contractId: string; milestone: PaymentMilestone } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [typeFilter, setTypeFilter] = useState<string>("All");

  // Form state
  const [contractNumber, setContractNumber] = useState("");
  const [contractName, setContractName] = useState("");
  const [contractType, setContractType] = useState<ContractType | "">("");
  const [contractorName, setContractorName] = useState("");
  const [contractorAddress, setContractorAddress] = useState("");
  const [contractorContact, setContractorContact] = useState("");
  const [tenderReference, setTenderReference] = useState("");
  const [awardDate, setAwardDate] = useState<Date>();
  const [commencementDate, setCommencementDate] = useState<Date>();
  const [completionDate, setCompletionDate] = useState<Date>();
  const [totalValue, setTotalValue] = useState("");
  const [accountCharged, setAccountCharged] = useState("");
  const [performanceGuarantee, setPerformanceGuarantee] = useState("");
  const [guaranteeExpiry, setGuaranteeExpiry] = useState<Date>();
  const [remarks, setRemarks] = useState("");

  // Payment milestone form
  const [milestoneDesc, setMilestoneDesc] = useState("");
  const [milestoneAmount, setMilestoneAmount] = useState("");
  const [milestoneDueDate, setMilestoneDueDate] = useState<Date>();

  const getExpiringContracts = (daysAhead: number): Contract[] => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    return contracts.filter((c) => {
      if (c.status !== "Active") return false;
      const completionDate = new Date(c.completionDate);
      return completionDate <= futureDate && completionDate >= new Date();
    });
  };

  const getOverduePayments = (): { contract: Contract; milestone: PaymentMilestone }[] => {
    const overdueList: { contract: Contract; milestone: PaymentMilestone }[] = [];

    contracts.forEach((contract) => {
      contract.paymentMilestones.forEach((milestone) => {
        if (milestone.status === "Pending" && new Date(milestone.dueDate) < new Date()) {
          overdueList.push({ contract, milestone: { ...milestone, status: "Overdue" } });
        } else if (milestone.status === "Overdue") {
          overdueList.push({ contract, milestone });
        }
      });
    });

    return overdueList;
  };

  const expiringContracts = getExpiringContracts(30);
  const overduePayments = getOverduePayments();

  const addMutation = useMutation({
    mutationFn: (data: Parameters<typeof api.createContract>[0]) => api.createContract(data),
    onSuccess: (newContract) => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      addLog(
        "Contract Registered",
        "Procurement",
        `Registered contract ${newContract.contractNumber} - "${newContract.contractName}" with ${newContract.contractorName} for KES ${newContract.totalValue.toLocaleString()}`
      );
      toast.success(`Contract ${newContract.contractNumber} registered successfully`);
      addNotification({ title: "Contract Registered", message: `${newContract.contractNumber} — ${newContract.contractName} with ${newContract.contractorName}`, type: "success", link: "/procurement/contracts" });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error) => toast.error("Failed to register contract: " + error.message)
  });

  const milestoneMutation = useMutation({
    mutationFn: ({ contractId, milestone }: { contractId: string, milestone: Omit<PaymentMilestone, "id"> }) => api.addPaymentMilestone(contractId, milestone),
    onSuccess: (updatedContract) => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      addLog(
        "Payment Milestone Added",
        "Procurement",
        `Added payment milestone to contract ${updatedContract.contractNumber}`
      );
      toast.success("Payment milestone added");
      setMilestoneDesc("");
      setMilestoneAmount("");
      setMilestoneDueDate(undefined);
      setSelectedContract(updatedContract);
    },
    onError: (error) => toast.error("Failed to add milestone: " + error.message)
  });

  const paymentMutation = useMutation({
    mutationFn: ({ contractId, milestoneId, paidDate }: { contractId: string, milestoneId: string, paidDate: string }) => api.updatePaymentStatus(contractId, milestoneId, paidDate),
    onSuccess: (_, { milestoneId }) => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      addLog(
        "Payment Recorded",
        "Procurement",
        `Recorded payment for milestone ${milestoneId}`
      );
      toast.success("Payment recorded successfully");
      setPaymentDialogOpen(false);
      setSelectedMilestone(null);
    },
    onError: (error) => toast.error("Failed to record payment: " + error.message)
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string, updates: Partial<Contract> }) => api.updateContract(id, updates),
    onSuccess: (updatedContract) => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      addLog(
        "Contract Status Updated",
        "Procurement",
        `Updated contract ${updatedContract.contractNumber} status to ${updatedContract.status}`
      );
      toast.success(`Contract status updated to ${updatedContract.status}`);
      addNotification({ title: "Contract Status Updated", message: `${updatedContract.contractNumber} is now ${updatedContract.status}`, type: "info", link: "/procurement/contracts" });
    },
    onError: (error) => toast.error("Failed to update status: " + error.message)
  });

  const clearMutation = useMutation({
    mutationFn: () => api.clearContracts(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      toast.success("Contracts cleared successfully");
    },
    onError: (error) => toast.error("Failed to clear contracts: " + error.message)
  });

  const resetForm = () => {
    setContractNumber("");
    setContractName("");
    setContractType("");
    setContractorName("");
    setContractorAddress("");
    setContractorContact("");
    setTenderReference("");
    setAwardDate(undefined);
    setCommencementDate(undefined);
    setCompletionDate(undefined);
    setTotalValue("");
    setAccountCharged("");
    setPerformanceGuarantee("");
    setGuaranteeExpiry(undefined);
    setRemarks("");
  };

  const handleAddContract = () => {
    if (!contractNumber || !contractName || !contractType || !contractorName || !awardDate || !commencementDate || !completionDate || !totalValue || !accountCharged) {
      toast.error("Please fill in all required fields");
      return;
    }

    addMutation.mutate({
      contractNumber,
      contractName,
      contractType: contractType as ContractType,
      contractorName,
      contractorAddress,
      contractorContact,
      tenderReference,
      awardDate: awardDate.toISOString(),
      commencementDate: commencementDate.toISOString(),
      completionDate: completionDate.toISOString(),
      totalValue: parseFloat(totalValue),
      accountCharged,
      paymentMilestones: [],
      performanceGuarantee,
      guaranteeExpiry: guaranteeExpiry?.toISOString(),
      remarks,
      createdBy: user?.name || "Unknown",
    });
  };

  const handleAddMilestone = () => {
    if (!selectedContract || !milestoneDesc || !milestoneAmount || !milestoneDueDate) {
      toast.error("Please fill in all milestone fields");
      return;
    }

    const existingTotal = selectedContract.paymentMilestones.reduce((sum, m) => sum + m.amount, 0);
    const newAmount = parseFloat(milestoneAmount);

    if (existingTotal + newAmount > selectedContract.totalValue) {
      toast.error("Total milestones cannot exceed contract value");
      return;
    }

    milestoneMutation.mutate({
      contractId: selectedContract.id,
      milestone: {
        description: milestoneDesc,
        amount: newAmount,
        dueDate: milestoneDueDate.toISOString(),
        status: "Pending",
      }
    });
  };

  const handleMarkPaid = () => {
    if (!selectedMilestone) return;

    paymentMutation.mutate({
      contractId: selectedMilestone.contractId,
      milestoneId: selectedMilestone.milestone.id,
      paidDate: new Date().toISOString()
    });
  };

  const handleStatusChange = (id: string, status: ContractStatus) => {
    const contract = contracts.find(c => c.id === id);
    if (!contract) return;

    statusMutation.mutate({
      id,
      updates: {
        status,
        ...(status === "Completed" ? { actualCompletionDate: new Date().toISOString() } : {})
      }
    });
  };

  const exportToCSV = () => {
    const headers = [
      "Contract No",
      "Name",
      "Type",
      "Contractor",
      "Award Date",
      "Commencement",
      "Completion",
      "Value (KES)",
      "Account",
      "Status",
    ];
    const csvContent = [
      headers.join(","),
      ...filteredContracts.map((c) =>
        [
          `"${c.contractNumber}"`,
          `"${c.contractName}"`,
          `"${c.contractType}"`,
          `"${c.contractorName}"`,
          `"${c.awardDate ? format(parseISO(c.awardDate), "yyyy-MM-dd") : ""}"`,
          `"${c.commencementDate ? format(parseISO(c.commencementDate), "yyyy-MM-dd") : ""}"`,
          `"${c.completionDate ? format(parseISO(c.completionDate), "yyyy-MM-dd") : ""}"`,
          `"${c.totalValue}"`,
          `"${c.accountCharged}"`,
          `"${c.status}"`,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `contract_register_${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();

    addLog("Contract Register Exported", "Procurement", `Exported ${filteredContracts.length} contracts to CSV`);
  };

  const filteredContracts = useMemo(() => {
    return contracts.filter((c) => {
      const matchesSearch =
        c.contractNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.contractName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.contractorName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === "All" || c.status === statusFilter;
      const matchesType = typeFilter === "All" || c.contractType === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [contracts, searchQuery, statusFilter, typeFilter]);

  const getStatusBadge = (status: ContractStatus) => {
    switch (status) {
      case "Active":
        return <Badge className="bg-success/10 text-success border-success/20"><CheckCircle2 className="h-3 w-3 mr-1" />Active</Badge>;
      case "Completed":
        return <Badge className="bg-primary/10 text-primary border-primary/20"><CheckCircle2 className="h-3 w-3 mr-1" />Completed</Badge>;
      case "Terminated":
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20"><XCircle className="h-3 w-3 mr-1" />Terminated</Badge>;
      case "On Hold":
        return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20"><Pause className="h-3 w-3 mr-1" />On Hold</Badge>;
      case "Expired":
        return <Badge className="bg-muted text-muted-foreground"><Clock className="h-3 w-3 mr-1" />Expired</Badge>;
    }
  };

  const getDaysRemaining = (completionDate: string | null | undefined) => {
    if (!completionDate) return <span className="text-muted-foreground">-</span>;
    const days = differenceInDays(parseISO(completionDate), new Date());
    if (days < 0) return <span className="text-destructive">{Math.abs(days)} days overdue</span>;
    if (days <= 30) return <span className="text-amber-600">{days} days left</span>;
    return <span className="text-muted-foreground">{days} days left</span>;
  };

  const totalContractValue = contracts.reduce((sum, c) => sum + c.totalValue, 0);
  const activeContractsValue = contracts.filter(c => c.status === "Active").reduce((sum, c) => sum + c.totalValue, 0);

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Contract Register</h1>
          <p className="text-muted-foreground">Track contracts, payments, and completion as per Section 3.6.1</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              disabled={isReadOnly}
              onClick={() => { if (blockAction("create contracts")) return; }}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Contract
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Register New Contract
              </DialogTitle>
              <DialogDescription>
                Enter contract details as per Regulation 34(3) requirements.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Contract Number *</Label>
                  <Input placeholder="e.g., CNT/2024/001" value={contractNumber} onChange={(e) => setContractNumber(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Tender Reference</Label>
                  <Input placeholder="e.g., SCH/Suppls/24/25/00001" value={tenderReference} onChange={(e) => setTenderReference(e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Contract Name *</Label>
                <Input placeholder="e.g., Supply of Laboratory Equipment" value={contractName} onChange={(e) => setContractName(e.target.value)} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Contract Type *</Label>
                  <Select value={contractType} onValueChange={(v) => setContractType(v as ContractType)}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      {CONTRACT_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Account to be Charged *</Label>
                  <Select value={accountCharged} onValueChange={setAccountCharged}>
                    <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
                    <SelectContent>
                      {ACCOUNTS.map((acc) => (
                        <SelectItem key={acc} value={acc}>{acc}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="border-t pt-4 mt-2">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Contractor Details
                </h4>
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label>Contractor Name *</Label>
                    <Input placeholder="Company/Individual name" value={contractorName} onChange={(e) => setContractorName(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Address</Label>
                      <Input placeholder="Contractor address" value={contractorAddress} onChange={(e) => setContractorAddress(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Contact</Label>
                      <Input placeholder="Phone/Email" value={contractorContact} onChange={(e) => setContractorContact(e.target.value)} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4 mt-2">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  Contract Dates
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Award Date *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !awardDate && "text-muted-foreground")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {awardDate ? format(awardDate, "PPP") : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={awardDate} onSelect={setAwardDate} initialFocus className="pointer-events-auto" />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label>Commencement Date *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !commencementDate && "text-muted-foreground")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {commencementDate ? format(commencementDate, "PPP") : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={commencementDate} onSelect={setCommencementDate} initialFocus className="pointer-events-auto" />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label>Completion Date *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !completionDate && "text-muted-foreground")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {completionDate ? format(completionDate, "PPP") : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={completionDate} onSelect={setCompletionDate} initialFocus className="pointer-events-auto" />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4 mt-2">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Financial Details
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Total Contract Value (KES) *</Label>
                    <Input type="number" placeholder="0.00" value={totalValue} onChange={(e) => setTotalValue(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Performance Guarantee</Label>
                    <Input placeholder="Guarantee reference" value={performanceGuarantee} onChange={(e) => setPerformanceGuarantee(e.target.value)} />
                  </div>
                </div>
                {performanceGuarantee && (
                  <div className="mt-4 space-y-2">
                    <Label>Guarantee Expiry Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !guaranteeExpiry && "text-muted-foreground")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {guaranteeExpiry ? format(guaranteeExpiry, "PPP") : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={guaranteeExpiry} onSelect={setGuaranteeExpiry} initialFocus className="pointer-events-auto" />
                      </PopoverContent>
                    </Popover>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Remarks</Label>
                <Textarea placeholder="Additional notes about this contract..." value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={2} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { resetForm(); setIsDialogOpen(false); }}>Cancel</Button>
              <Button onClick={handleAddContract} disabled={addMutation.isPending}>
                <FileText className="h-4 w-4 mr-2" />
                {addMutation.isPending ? "Registering..." : "Register Contract"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Alerts */}
      {(expiringContracts.length > 0 || overduePayments.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {expiringContracts.length > 0 && (
            <Card className="border-amber-500/50 bg-amber-500/5">
              <CardContent className="py-4">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-amber-600" />
                  <div className="flex-1">
                    <p className="font-medium text-amber-600">{expiringContracts.length} Contract(s) Expiring Soon</p>
                    <p className="text-sm text-muted-foreground">Within the next 30 days</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          {overduePayments.length > 0 && (
            <Card className="border-destructive/50 bg-destructive/5">
              <CardContent className="py-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  <div className="flex-1">
                    <p className="font-medium text-destructive">{overduePayments.length} Overdue Payment(s)</p>
                    <p className="text-sm text-muted-foreground">Payments past due date</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Contract Register
          </CardTitle>
          <CardDescription>
            Total: {contracts.length} contracts | Active Value: KES {activeContractsValue.toLocaleString()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="register" className="space-y-4">
            <TabsList>
              <TabsTrigger value="register">Register</TabsTrigger>
              <TabsTrigger value="payments">Payments</TabsTrigger>
              <TabsTrigger value="statistics">Statistics</TabsTrigger>
            </TabsList>

            <TabsContent value="register" className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search contracts..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
                </div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[140px]"><Filter className="h-4 w-4 mr-2" /><SelectValue placeholder="Type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Types</SelectItem>
                    {CONTRACT_TYPES.map((t) => (<SelectItem key={t} value={t}>{t}</SelectItem>))}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Status</SelectItem>
                    {CONTRACT_STATUSES.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={exportToCSV} disabled={filteredContracts.length === 0}>
                  <Download className="h-4 w-4 mr-2" />Export
                </Button>
                {contracts.length > 0 && (
                  <Button variant="outline" onClick={() => clearMutation.mutate()} disabled={clearMutation.isPending}><Trash2 className="h-4 w-4 mr-2" />{clearMutation.isPending ? "Clearing..." : "Clear"}</Button>
                )}
              </div>

              <ScrollArea className="h-[500px]">
                {filteredContracts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                    <FileText className="h-12 w-12 mb-4 opacity-50" />
                    <p className="text-sm">No contracts found.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Contract No.</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Contractor</TableHead>
                        <TableHead>Value (KES)</TableHead>
                        <TableHead>Completion</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredContracts.map((contract) => (
                        <TableRow key={contract.id}>
                          <TableCell className="font-mono font-medium">{contract.contractNumber}</TableCell>
                          <TableCell className="max-w-[200px] truncate" title={contract.contractName}>{contract.contractName}</TableCell>
                          <TableCell>{contract.contractorName}</TableCell>
                          <TableCell className="font-medium">{contract.totalValue.toLocaleString()}</TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-sm">{contract.completionDate ? format(parseISO(contract.completionDate), "MMM d, yyyy") : "-"}</span>
                              <span className="text-xs">{contract.status === "Active" && getDaysRemaining(contract.completionDate)}</span>
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(contract.status)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Sheet>
                                <SheetTrigger asChild>
                                  <Button variant="outline" size="sm" onClick={() => setSelectedContract(contract)}>
                                    <Eye className="h-3 w-3 mr-1" />View
                                  </Button>
                                </SheetTrigger>
                                <SheetContent className="w-[500px] sm:max-w-[500px]">
                                  <SheetHeader>
                                    <SheetTitle>{contract.contractNumber}</SheetTitle>
                                    <SheetDescription>{contract.contractName}</SheetDescription>
                                  </SheetHeader>
                                  <ScrollArea className="h-[calc(100vh-120px)] mt-4 pr-4">
                                    <div className="space-y-6">
                                      <div>
                                        <h4 className="font-medium mb-2">Contract Details</h4>
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                          <div><span className="text-muted-foreground">Type:</span> {contract.contractType}</div>
                                          <div><span className="text-muted-foreground">Status:</span> {getStatusBadge(contract.status)}</div>
                                          <div><span className="text-muted-foreground">Award Date:</span> {contract.awardDate ? format(parseISO(contract.awardDate), "MMM d, yyyy") : "-"}</div>
                                          <div><span className="text-muted-foreground">Commencement:</span> {contract.commencementDate ? format(parseISO(contract.commencementDate), "MMM d, yyyy") : "-"}</div>
                                          <div><span className="text-muted-foreground">Completion:</span> {contract.completionDate ? format(parseISO(contract.completionDate), "MMM d, yyyy") : "-"}</div>
                                          <div><span className="text-muted-foreground">Value:</span> KES {contract.totalValue.toLocaleString()}</div>
                                          <div className="col-span-2"><span className="text-muted-foreground">Account:</span> {contract.accountCharged}</div>
                                        </div>
                                      </div>

                                      <div>
                                        <h4 className="font-medium mb-2">Contractor</h4>
                                        <div className="text-sm space-y-1">
                                          <div><span className="text-muted-foreground">Name:</span> {contract.contractorName}</div>
                                          {contract.contractorAddress && <div><span className="text-muted-foreground">Address:</span> {contract.contractorAddress}</div>}
                                          {contract.contractorContact && <div><span className="text-muted-foreground">Contact:</span> {contract.contractorContact}</div>}
                                        </div>
                                      </div>

                                      <div>
                                        <div className="flex items-center justify-between mb-2">
                                          <h4 className="font-medium">Payment Milestones</h4>
                                        </div>
                                        <div className="space-y-2">
                                          {contract.paymentMilestones.length === 0 ? (
                                            <p className="text-sm text-muted-foreground">No payment milestones defined.</p>
                                          ) : (
                                            contract.paymentMilestones.map((m) => (
                                              <div key={m.id} className="flex items-center justify-between p-3 border rounded-lg">
                                                <div>
                                                  <p className="text-sm font-medium">{m.description}</p>
                                                  <p className="text-xs text-muted-foreground">Due: {format(parseISO(m.dueDate), "MMM d, yyyy")}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                  <span className="text-sm font-medium">KES {m.amount.toLocaleString()}</span>
                                                  {m.status === "Paid" ? (
                                                    <Badge className="bg-success/10 text-success">Paid</Badge>
                                                  ) : m.status === "Overdue" ? (
                                                    <Badge className="bg-destructive/10 text-destructive">Overdue</Badge>
                                                  ) : (
                                                    <Button size="sm" variant="outline" onClick={() => { setSelectedMilestone({ contractId: contract.id, milestone: m }); setPaymentDialogOpen(true); }}>
                                                      <CreditCard className="h-3 w-3 mr-1" />Pay
                                                    </Button>
                                                  )}
                                                </div>
                                              </div>
                                            ))
                                          )}
                                        </div>

                                        <div className="mt-4 p-4 border rounded-lg bg-muted/30">
                                          <h5 className="text-sm font-medium mb-3">Add Milestone</h5>
                                          <div className="space-y-3">
                                            <Input placeholder="Description" value={milestoneDesc} onChange={(e) => setMilestoneDesc(e.target.value)} />
                                            <div className="grid grid-cols-2 gap-2">
                                              <Input type="number" placeholder="Amount (KES)" value={milestoneAmount} onChange={(e) => setMilestoneAmount(e.target.value)} />
                                              <Popover>
                                                <PopoverTrigger asChild>
                                                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !milestoneDueDate && "text-muted-foreground")}>
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {milestoneDueDate ? format(milestoneDueDate, "PP") : "Due date"}
                                                  </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start">
                                                  <Calendar mode="single" selected={milestoneDueDate} onSelect={setMilestoneDueDate} initialFocus className="pointer-events-auto" />
                                                </PopoverContent>
                                              </Popover>
                                            </div>
                                            <Button size="sm" onClick={handleAddMilestone} disabled={!selectedContract}>
                                              <Plus className="h-3 w-3 mr-1" />Add Milestone
                                            </Button>
                                          </div>
                                        </div>
                                      </div>

                                      <div>
                                        <h4 className="font-medium mb-2">Update Status</h4>
                                        <Select value={contract.status} onValueChange={(v) => handleStatusChange(contract.id, v as ContractStatus)}>
                                          <SelectTrigger><SelectValue /></SelectTrigger>
                                          <SelectContent>
                                            {CONTRACT_STATUSES.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    </div>
                                  </ScrollArea>
                                </SheetContent>
                              </Sheet>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="payments" className="space-y-4">
              <ScrollArea className="h-[500px]">
                {contracts.flatMap(c => c.paymentMilestones.map(m => ({ contract: c, milestone: m }))).length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                    <CreditCard className="h-12 w-12 mb-4 opacity-50" />
                    <p className="text-sm">No payment milestones defined.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Contract</TableHead>
                        <TableHead>Milestone</TableHead>
                        <TableHead>Amount (KES)</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Paid Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contracts.flatMap(c => c.paymentMilestones.map(m => ({ contract: c, milestone: m }))).map(({ contract, milestone }) => (
                        <TableRow key={milestone.id} className={milestone.status === "Overdue" ? "bg-destructive/5" : ""}>
                          <TableCell className="font-mono text-sm">{contract.contractNumber}</TableCell>
                          <TableCell>{milestone.description}</TableCell>
                          <TableCell className="font-medium">{milestone.amount.toLocaleString()}</TableCell>
                          <TableCell>{format(parseISO(milestone.dueDate), "MMM d, yyyy")}</TableCell>
                          <TableCell>{milestone.paidDate ? format(parseISO(milestone.paidDate), "MMM d, yyyy") : "-"}</TableCell>
                          <TableCell>
                            {milestone.status === "Paid" ? (
                              <Badge className="bg-success/10 text-success">Paid</Badge>
                            ) : milestone.status === "Overdue" ? (
                              <Badge className="bg-destructive/10 text-destructive">Overdue</Badge>
                            ) : (
                              <Badge className="bg-amber-500/10 text-amber-600">Pending</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {milestone.status !== "Paid" && (
                              <Button size="sm" variant="outline" onClick={() => { setSelectedMilestone({ contractId: contract.id, milestone }); setPaymentDialogOpen(true); }}>
                                <CreditCard className="h-3 w-3 mr-1" />Record Payment
                              </Button>
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
                    <div className="text-2xl font-bold text-primary">{contracts.length}</div>
                    <p className="text-sm text-muted-foreground">Total Contracts</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-success">{contracts.filter(c => c.status === "Active").length}</div>
                    <p className="text-sm text-muted-foreground">Active</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-blue-600">KES {(totalContractValue / 1000000).toFixed(1)}M</div>
                    <p className="text-sm text-muted-foreground">Total Value</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-destructive">{overduePayments.length}</div>
                    <p className="text-sm text-muted-foreground">Overdue Payments</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">By Type</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {CONTRACT_TYPES.map((type) => (
                        <div key={type} className="flex justify-between">
                          <span className="text-sm">{type}</span>
                          <span className="font-medium">{contracts.filter(c => c.contractType === type).length}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">By Status</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {CONTRACT_STATUSES.map((status) => (
                        <div key={status} className="flex justify-between">
                          <span className="text-sm">{status}</span>
                          <span className="font-medium">{contracts.filter(c => c.status === status).length}</span>
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

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-success" />
              Record Payment
            </DialogTitle>
            <DialogDescription>
              Confirm payment for this milestone.
            </DialogDescription>
          </DialogHeader>
          {selectedMilestone && (
            <div className="space-y-4 py-4">
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="font-medium">{selectedMilestone.milestone.description}</p>
                <p className="text-2xl font-bold text-primary mt-2">KES {selectedMilestone.milestone.amount.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground mt-1">Due: {format(parseISO(selectedMilestone.milestone.dueDate), "MMMM d, yyyy")}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleMarkPaid} className="bg-success hover:bg-success/90">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Confirm Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
