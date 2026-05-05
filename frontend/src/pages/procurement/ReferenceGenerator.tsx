import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Hash,
  Plus,
  Copy,
  Check,
  FileText,
  Download,
  Search,
  Filter,
  Trash2,
  AlertCircle,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { ProcurementType, ProcurementReference } from "@/mock/data";
import { useAudit } from "@/contexts/AuditContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";

const ENTITY_CODES = [
  { code: "MOE", name: "Ministry of Education" },
  { code: "MOH", name: "Ministry of Health" },
  { code: "MOF", name: "Ministry of Finance" },
  { code: "MOICT", name: "Ministry of ICT" },
  { code: "SCH", name: "School" },
  { code: "HOSP", name: "Hospital" },
  { code: "PPOA", name: "Public Procurement Oversight Authority" },
];

const DEPARTMENTS = [
  "Administration",
  "Finance",
  "Procurement",
  "ICT",
  "Human Resources",
  "Stores",
  "Library",
  "Maintenance",
];

export default function ReferenceGenerator() {
  const queryClient = useQueryClient();
  const { data: references = [] } = useQuery({
    queryKey: ['procurementReferences'],
    queryFn: () => api.getProcurementReferences()
  });

  const { addLog } = useAudit();
  const { user } = useAuth();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [typeFilter, setTypeFilter] = useState<string>("All");

  // Form state
  const [entityCode, setEntityCode] = useState("");
  const [procurementType, setProcurementType] = useState<ProcurementType | "">("");
  const [description, setDescription] = useState("");
  const [department, setDepartment] = useState("");

  const generateMutation = useMutation({
    mutationFn: (data: Parameters<typeof api.generateProcurementReference>[0]) => api.generateProcurementReference(data),
    onSuccess: (newRef) => {
      queryClient.invalidateQueries({ queryKey: ['procurementReferences'] });
      addLog(
        "Reference Generated",
        "Procurement",
        `Generated procurement reference: ${newRef.referenceNumber} for ${description}`
      );
      toast.success(`Reference generated: ${newRef.referenceNumber}`);

      // Reset form
      setEntityCode("");
      setProcurementType("");
      setDescription("");
      setDepartment("");
      setIsDialogOpen(false);
    },
    onError: (error) => toast.error("Failed to generate reference: " + error.message)
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string, status: ProcurementReference["status"] }) => api.updateProcurementReferenceStatus(id, status),
    onSuccess: (updatedRef) => {
      queryClient.invalidateQueries({ queryKey: ['procurementReferences'] });
      addLog(
        "Reference Status Updated",
        "Procurement",
        `Updated reference ${updatedRef.referenceNumber} status to ${updatedRef.status}`
      );
      toast.success(`Status updated to ${updatedRef.status}`);
    },
    onError: (error) => toast.error("Failed to update status: " + error.message)
  });

  const clearMutation = useMutation({
    mutationFn: () => api.clearProcurementReferences(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['procurementReferences'] });
      toast.success("References cleared successfully");
    },
    onError: (error) => toast.error("Failed to clear references: " + error.message)
  });

  const handleGenerate = () => {
    if (!entityCode || !procurementType || !description || !department) {
      toast.error("Please fill in all required fields");
      return;
    }

    generateMutation.mutate({
      entityCode,
      procurementType: procurementType as ProcurementType,
      description,
      department,
      requestedBy: user?.name || "Unknown",
    });
  };

  const handleCopy = (refNumber: string, id: string) => {
    navigator.clipboard.writeText(refNumber);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success("Reference number copied to clipboard");
  };

  const handleStatusChange = (id: string, status: ProcurementReference["status"]) => {
    statusMutation.mutate({ id, status });
  };

  const exportToCSV = () => {
    const headers = ["Reference Number", "Type", "Description", "Department", "Requested By", "Issue Date", "Status"];
    const csvContent = [
      headers.join(","),
      ...filteredReferences.map((ref) => [
        `"${ref.referenceNumber}"`,
        `"${ref.procurementType}"`,
        `"${ref.description}"`,
        `"${ref.department}"`,
        `"${ref.requestedBy}"`,
        `"${format(new Date(ref.issuedDate), "MMM d, yyyy")}"`,
        `"${ref.status}"`,
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `procurement_references_${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();

    addLog(
      "References Exported",
      "Procurement",
      `Exported ${filteredReferences.length} procurement references to CSV`
    );
  };

  const filteredReferences = references.filter((ref) => {
    const matchesSearch =
      ref.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ref.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ref.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ref.requestedBy.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "All" || ref.status === statusFilter;
    const matchesType = typeFilter === "All" || ref.procurementType === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusBadge = (status: ProcurementReference["status"]) => {
    switch (status) {
      case "Active":
        return <Badge className="bg-success/10 text-success border-success/20">Active</Badge>;
      case "Completed":
        return <Badge className="bg-primary/10 text-primary border-primary/20">Completed</Badge>;
      case "Cancelled":
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20">Cancelled</Badge>;
    }
  };

  const getTypeBadge = (type: ProcurementType) => {
    switch (type) {
      case "Works":
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20">Works</Badge>;
      case "Services":
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20">Services</Badge>;
      case "Supplies":
        return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Supplies</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Procurement Reference Generator</h1>
          <p className="text-muted-foreground">
            Generate and track compliant reference numbers as per Regulation 34(3)
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Generate Reference
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Hash className="h-5 w-5 text-primary" />
                Generate Procurement Reference
              </DialogTitle>
              <DialogDescription>
                Create a new procurement reference number in the format: Entity/Type/Year/Serial
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="entityCode">Procuring Entity *</Label>
                <Select value={entityCode} onValueChange={setEntityCode}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select entity" />
                  </SelectTrigger>
                  <SelectContent>
                    {ENTITY_CODES.map((entity) => (
                      <SelectItem key={entity.code} value={entity.code}>
                        {entity.code} - {entity.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="procurementType">Procurement Type *</Label>
                <Select value={procurementType} onValueChange={(v) => setProcurementType(v as ProcurementType)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Works">Works (Wrks)</SelectItem>
                    <SelectItem value="Services">Services (Srvcs)</SelectItem>
                    <SelectItem value="Supplies">Supplies (Suppls)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Department *</Label>
                <Select value={department} onValueChange={setDepartment}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map((dept) => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Procurement Description *</Label>
                <Input
                  id="description"
                  placeholder="e.g., Supply of office computers"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="bg-muted/50 rounded-lg p-4 border">
                <p className="text-sm text-muted-foreground">
                  <AlertCircle className="h-4 w-4 inline mr-1" />
                  The reference number will be auto-generated based on the current budget year and the next available serial number.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleGenerate} disabled={generateMutation.isPending}>
                  <Hash className="h-4 w-4 mr-2" />
                  {generateMutation.isPending ? "Generating..." : "Generate"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Reference Number Register
          </CardTitle>
          <CardDescription>
            Track all issued procurement reference numbers - Total: {references.length}
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
                    placeholder="Search references..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[150px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Types</SelectItem>
                    <SelectItem value="Works">Works</SelectItem>
                    <SelectItem value="Services">Services</SelectItem>
                    <SelectItem value="Supplies">Supplies</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Status</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={exportToCSV} disabled={filteredReferences.length === 0}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                {references.length > 0 && (
                  <Button variant="outline" onClick={() => clearMutation.mutate()} disabled={clearMutation.isPending}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    {clearMutation.isPending ? "Clearing..." : "Clear"}
                  </Button>
                )}
              </div>

              <div className="text-sm text-muted-foreground">
                Showing {filteredReferences.length} of {references.length} references
              </div>

              <ScrollArea className="h-[500px]">
                {filteredReferences.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                    <Hash className="h-12 w-12 mb-4 opacity-50" />
                    <p className="text-sm">No reference numbers found.</p>
                    <p className="text-xs mt-1">Generate a new reference to get started.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Reference Number</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Requested By</TableHead>
                        <TableHead>Issue Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredReferences.map((ref) => (
                        <TableRow key={ref.id}>
                          <TableCell className="font-mono font-medium">
                            <div className="flex items-center gap-2">
                              {ref.referenceNumber}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => handleCopy(ref.referenceNumber, ref.id)}
                              >
                                {copiedId === ref.id ? (
                                  <Check className="h-3 w-3 text-success" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>{getTypeBadge(ref.procurementType)}</TableCell>
                          <TableCell className="max-w-[200px] truncate" title={ref.description}>
                            {ref.description}
                          </TableCell>
                          <TableCell>{ref.department}</TableCell>
                          <TableCell>{ref.requestedBy}</TableCell>
                          <TableCell>{format(new Date(ref.issuedDate), "MMM d, yyyy")}</TableCell>
                          <TableCell>{getStatusBadge(ref.status)}</TableCell>
                          <TableCell className="text-right">
                            <Select
                              value={ref.status}
                              onValueChange={(v) => handleStatusChange(ref.id, v as ProcurementReference["status"])}
                            >
                              <SelectTrigger className="w-[110px] h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Active">Active</SelectItem>
                                <SelectItem value="Completed">Completed</SelectItem>
                                <SelectItem value="Cancelled">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="statistics">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-primary">{references.length}</div>
                    <p className="text-sm text-muted-foreground">Total References</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-success">
                      {references.filter((r) => r.status === "Active").length}
                    </div>
                    <p className="text-sm text-muted-foreground">Active</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-blue-600">
                      {references.filter((r) => r.status === "Completed").length}
                    </div>
                    <p className="text-sm text-muted-foreground">Completed</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">By Type</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Works</span>
                        <span className="font-medium">{references.filter((r) => r.procurementType === "Works").length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Services</span>
                        <span className="font-medium">{references.filter((r) => r.procurementType === "Services").length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Supplies</span>
                        <span className="font-medium">{references.filter((r) => r.procurementType === "Supplies").length}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="md:col-span-2">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Reference Format</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-muted/50 rounded-lg p-4 font-mono text-sm">
                      <div className="flex flex-wrap gap-2 items-center">
                        <Badge variant="outline">Entity Code</Badge>
                        <span>/</span>
                        <Badge variant="outline">Type (Wrks/Srvcs/Suppls)</Badge>
                        <span>/</span>
                        <Badge variant="outline">Budget Year</Badge>
                        <span>/</span>
                        <Badge variant="outline">5-digit Serial</Badge>
                      </div>
                      <p className="mt-3 text-muted-foreground text-xs">
                        Example: SCH/Suppls/24/25/00001 - School, Supplies, FY 2024/25, First reference
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
