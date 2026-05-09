import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Building2,
  Phone,
  Mail,
  MapPin,
  FileText,
  Download,
  Printer,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { procurementService } from "@/services/procurement.service";
import ReusableTable, { Column } from "@/components/ui/reusable-table";
import { TablePagination } from "@/components/ui/table-pagination";
import { Supplier, ProcurementCategory, SupplierStatus } from "@/mock/procurement.mock";
import { useAudit } from "@/contexts/AuditContext";
import { useReadOnlyGuard } from "@/hooks/useReadOnlyGuard";
import { toast } from "sonner";
import { useNotifications } from "@/contexts/NotificationContext";
import { useAuth } from "@/contexts/AuthContext";
import { useSchool } from "@/contexts/SchoolContext";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const PROCUREMENT_CATEGORIES: ProcurementCategory[] = ["Works", "Services", "Supplies"];
const SUPPLIER_STATUSES: SupplierStatus[] = ["Active", "Inactive", "Blacklisted"];

const KENYAN_COUNTIES = [
  "Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret", "Machakos", "Meru", "Nyeri",
  "Kiambu", "Kajiado", "Kilifi", "Kwale", "Garissa", "Wajir", "Mandera", "Marsabit",
  "Isiolo", "Tana River", "Lamu", "Taita Taveta", "Makueni", "Kitui", "Embu", "Tharaka Nithi",
  "Kirinyaga", "Murang'a", "Nyandarua", "Laikipia", "Samburu", "Trans Nzoia", "Uasin Gishu",
  "Elgeyo Marakwet", "Nandi", "Baringo", "West Pokot", "Turkana", "Kakamega", "Vihiga",
  "Bungoma", "Busia", "Siaya", "Kisii", "Nyamira", "Migori", "Homa Bay", "Bomet", "Kericho",
  "Narok",
];

interface SupplierFormData {
  name: string;
  tradingName: string;
  taxPin: string;
  registrationNumber: string;
  category: ProcurementCategory[];
  contactPerson: string;
  phone: string;
  email: string;
  physicalAddress: string;
  postalAddress: string;
  county: string;
  bankName: string;
  bankBranch: string;
  bankAccountNumber: string;
  status: SupplierStatus;
  notes: string;
}

const initialFormData: SupplierFormData = {
  name: "",
  tradingName: "",
  taxPin: "",
  registrationNumber: "",
  category: [],
  contactPerson: "",
  phone: "",
  email: "",
  physicalAddress: "",
  postalAddress: "",
  county: "",
  bankName: "",
  bankBranch: "",
  bankAccountNumber: "",
  status: "Active",
  notes: "",
};

export default function SuppliersRegister() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { school } = useSchool();
  const { addLog } = useAudit();
  const { isReadOnly, blockAction } = useReadOnlyGuard();
  const { addNotification } = useNotifications();

  const [page, setPage] = useState(1);
  const { data: suppliersResp, isLoading } = useQuery({
    queryKey: ["suppliers", page],
    queryFn: () => procurementService.getSuppliers(page),
    keepPreviousData: true,
  });
  const suppliers = suppliersResp?.results || [];
  const totalCount = suppliersResp?.count || 0;
  const pageSize = suppliers.length || 10;
  const totalPages = Math.max(1, Math.ceil(totalCount / (pageSize || 10)));

  const { data: supplierStats } = useQuery({
    queryKey: ['supplier-stats'],
    queryFn: () => procurementService.getSupplierStats(),
  });

  const addMutation = useMutation({
    mutationFn: (data: Omit<Supplier, "id" | "createdAt" | "updatedAt">) => procurementService.createSupplier(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success("Supplier added successfully");
      addNotification({ title: "Supplier Added", message: `New supplier registered`, type: "success", link: "/procurement/suppliers" });
      handleCloseDialog();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Omit<Supplier, "id" | "createdAt" | "updatedAt">> }) =>
      procurementService.updateSupplier(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success("Supplier updated successfully");
      addNotification({ title: "Supplier Updated", message: `Supplier details updated`, type: "info", link: "/procurement/suppliers" });
      handleCloseDialog();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => procurementService.deleteSupplier(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success("Supplier deleted successfully");
      addNotification({ title: "Supplier Removed", message: `Supplier deleted from register`, type: "warning", link: "/procurement/suppliers" });
      setIsDeleteDialogOpen(false);
      setSupplierToDelete(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState<SupplierFormData>(initialFormData);

  const filteredSuppliers = suppliers.filter((supplier) => {
    const matchesSearch =
      supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.taxPin.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.contactPerson.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || supplier.status === statusFilter;
    const matchesCategory =
      categoryFilter === "all" ||
      supplier.category.includes(categoryFilter as ProcurementCategory);

    return matchesSearch && matchesStatus && matchesCategory;
  });


  const handleOpenDialog = (supplier?: Supplier) => {
    if (blockAction("add or edit suppliers")) return;

    if (supplier) {
      setEditingSupplier(supplier);
      setFormData({
        name: supplier.name,
        tradingName: supplier.tradingName || "",
        taxPin: supplier.taxPin,
        registrationNumber: supplier.registrationNumber || "",
        category: supplier.category,
        contactPerson: supplier.contactPerson,
        phone: supplier.phone,
        email: supplier.email,
        physicalAddress: supplier.physicalAddress,
        postalAddress: supplier.postalAddress || "",
        county: supplier.county,
        bankName: supplier.bankName || "",
        bankBranch: supplier.bankBranch || "",
        bankAccountNumber: supplier.bankAccountNumber || "",
        status: supplier.status,
        notes: supplier.notes || "",
      });
    } else {
      setEditingSupplier(null);
      setFormData(initialFormData);
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingSupplier(null);
    setFormData(initialFormData);
  };

  const handleCategoryToggle = (category: ProcurementCategory) => {
    setFormData((prev) => ({
      ...prev,
      category: prev.category.includes(category)
        ? prev.category.filter((c) => c !== category)
        : [...prev.category, category],
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      toast.error("Supplier name is required");
      return false;
    }
    if (!formData.taxPin.trim()) {
      toast.error("KRA PIN is required");
      return false;
    }
    if (!/^[AP]\d{9}[A-Z]$/.test(formData.taxPin.toUpperCase())) {
      toast.error("Invalid KRA PIN format (e.g., P051234567A)");
      return false;
    }
    if (formData.category.length === 0) {
      toast.error("Select at least one procurement category");
      return false;
    }
    if (!formData.contactPerson.trim()) {
      toast.error("Contact person is required");
      return false;
    }
    if (!formData.phone.trim()) {
      toast.error("Phone number is required");
      return false;
    }
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error("Valid email is required");
      return false;
    }
    if (!formData.physicalAddress.trim()) {
      toast.error("Physical address is required");
      return false;
    }
    if (!formData.county) {
      toast.error("County is required");
      return false;
    }
    return true;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    const supplierData: Omit<Supplier, "id" | "createdAt" | "updatedAt"> = {
      name: formData.name.trim(),
      tradingName: formData.tradingName.trim() || undefined,
      taxPin: formData.taxPin.toUpperCase().trim(),
      registrationNumber: formData.registrationNumber.trim() || undefined,
      category: formData.category,
      contactPerson: formData.contactPerson.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim().toLowerCase(),
      physicalAddress: formData.physicalAddress.trim(),
      postalAddress: formData.postalAddress.trim() || undefined,
      county: formData.county,
      bankName: formData.bankName.trim() || undefined,
      bankBranch: formData.bankBranch.trim() || undefined,
      bankAccountNumber: formData.bankAccountNumber.trim() || undefined,
      status: formData.status,
      notes: formData.notes.trim() || undefined,
    };

    if (editingSupplier) {
      updateMutation.mutate({ id: editingSupplier.id, updates: supplierData });
      addLog("Supplier Updated", "Procurement", `Updated supplier: ${supplierData.name}`);
    } else {
      addMutation.mutate(supplierData);
      addLog("Supplier Created", "Procurement", `Created new supplier: ${supplierData.name}`);
    }
  };

  const handleDeleteClick = (supplier: Supplier) => {
    if (blockAction("delete suppliers")) return;
    setSupplierToDelete(supplier);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (supplierToDelete) {
      deleteMutation.mutate(supplierToDelete.id);
      addLog("Supplier Deleted", "Procurement", `Deleted supplier: ${supplierToDelete.name}`);
    }
  };

  const getStatusBadgeVariant = (status: SupplierStatus) => {
    switch (status) {
      case "Active":
        return "default";
      case "Inactive":
        return "secondary";
      case "Blacklisted":
        return "destructive";
    }
  };

  const getCategoryBadgeVariant = (category: ProcurementCategory) => {
    switch (category) {
      case "Works":
        return "outline";
      case "Services":
        return "secondary";
      case "Supplies":
        return "default";
    }
  };

  const printPDF = () => {
    const doc = new jsPDF({ orientation: "landscape", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    let y = 14;

    doc.setFontSize(14); doc.setFont("helvetica", "bold");
    doc.text(school?.name ?? "School", pageW / 2, y, { align: "center" }); y += 7;
    doc.setFontSize(11); doc.setFont("helvetica", "normal");
    doc.text("Suppliers Register", pageW / 2, y, { align: "center" }); y += 5;
    doc.setFontSize(8);
    doc.text(`Printed: ${new Date().toLocaleDateString("en-KE")}`, pageW / 2, y, { align: "center" }); y += 6;

    const head = [["#", "Supplier Name", "Trading Name", "KRA PIN", "Categories", "Contact Person", "Phone", "Email", "County", "Status"]];
    const body = filteredSuppliers.map((s, i) => [
      i + 1,
      s.name,
      s.tradingName || "—",
      s.taxPin,
      s.category.join(", "),
      s.contactPerson,
      s.phone,
      s.email,
      s.county,
      s.status,
    ]);

    autoTable(doc, {
      startY: y,
      head,
      body,
      styles: { fontSize: 7, cellPadding: 2 },
      headStyles: { fillColor: [30, 80, 160], fontSize: 7, fontStyle: "bold" },
      columnStyles: {
        0: { cellWidth: 10 },
        3: { fontStyle: "bold", cellWidth: 28 },
      },
      didParseCell: (data) => {
        if (data.section === "body" && data.column.index === 9) {
          const val = data.cell.raw as string;
          if (val === "Active") { data.cell.styles.textColor = [22, 163, 74]; data.cell.styles.fontStyle = "bold"; }
          else if (val === "Blacklisted") { data.cell.styles.textColor = [220, 38, 38]; data.cell.styles.fontStyle = "bold"; }
          else if (val === "Inactive") { data.cell.styles.textColor = [156, 163, 175]; }
        }
      },
    });

    doc.save("Suppliers_Register.pdf");
    toast.success("PDF downloaded");
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Suppliers Register</h1>
          <p className="text-muted-foreground mt-1">
            Manage approved suppliers for procurement
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={printPDF}>
            <Printer className="h-4 w-4" />
            Print PDF
          </Button>
          <Button className="gap-2" onClick={() => handleOpenDialog()} disabled={isReadOnly}>
            <Plus className="h-4 w-4" />
            Add Supplier
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Suppliers</p>
                <p className="text-2xl font-bold">{supplierStats?.total ?? totalCount ?? suppliers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                <Building2 className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold">
                  {supplierStats?.active ?? suppliers.filter((s) => s.status === "Active").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
                <Building2 className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Inactive</p>
                <p className="text-2xl font-bold">
                  {supplierStats?.inactive ?? suppliers.filter((s) => s.status === "Inactive").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                <Building2 className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Blacklisted</p>
                <p className="text-2xl font-bold">
                  {supplierStats?.blacklisted ?? suppliers.filter((s) => s.status === "Blacklisted").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, KRA PIN, or contact..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {SUPPLIER_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {PROCUREMENT_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Suppliers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Registered Suppliers</CardTitle>
          <CardDescription>
            {filteredSuppliers.length} supplier{filteredSuppliers.length !== 1 ? "s" : ""} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {(() => {
            const columns: Column<any>[] = [
              { key: 'name', title: 'Supplier Name', render: (r) => (
                <div>
                  <p className="font-medium">{r.name}</p>
                  {r.tradingName && <p className="text-xs text-muted-foreground">t/a {r.tradingName}</p>}
                </div>
              )},
              { key: 'taxPin', title: 'KRA PIN', width: '140px', render: (r) => <span className="font-mono text-sm">{r.taxPin}</span> },
              { key: 'categories', title: 'Categories', render: (r) => (
                <div className="flex flex-wrap gap-1">{r.category.map((cat: string) => <Badge key={cat} variant={getCategoryBadgeVariant(cat)} className="text-xs">{cat}</Badge>)}</div>
              )},
              { key: 'contact', title: 'Contact Person', render: (r) => r.contactPerson },
              { key: 'phone', title: 'Phone / Email', render: (r) => (
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-1 text-sm"><Phone className="h-3 w-3 text-muted-foreground" />{r.phone}</div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground"><Mail className="h-3 w-3" />{r.email}</div>
                </div>
              )},
              { key: 'county', title: 'County', render: (r) => r.county },
              { key: 'status', title: 'Status', render: (r) => <Badge variant={getStatusBadgeVariant(r.status)}>{r.status}</Badge> },
              { key: 'actions', title: '', width: '50px', render: (r) => (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleOpenDialog(r)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDeleteClick(r)} className="text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )},
            ];

            return (
              <ReusableTable
                columns={columns}
                data={filteredSuppliers}
                rowKey={(r: any) => r.id}
                emptyMessage={filteredSuppliers.length === 0 ? (isReadOnly ? 'No suppliers found' : 'No suppliers found') : ''}
              />
            );
          })()}
        </CardContent>
      </Card>
      
      {/* Pagination controls */}
      <div className="py-4">
        <TablePagination
          page={page}
          totalPages={totalPages}
          from={(page - 1) * pageSize + 1}
          to={Math.min(totalCount, page * pageSize)}
          total={totalCount}
          onPageChange={(p) => setPage(p)}
        />
        
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSupplier ? "Edit Supplier" : "Add New Supplier"}
            </DialogTitle>
            <DialogDescription>
              {editingSupplier
                ? "Update supplier details"
                : "Register a new supplier for procurement"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            {/* Basic Information */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">Basic Information</h4>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Registered Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter registered business name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tradingName">Trading Name (if different)</Label>
                  <Input
                    id="tradingName"
                    value={formData.tradingName}
                    onChange={(e) => setFormData({ ...formData, tradingName: e.target.value })}
                    placeholder="Enter trading name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taxPin">KRA PIN *</Label>
                  <Input
                    id="taxPin"
                    value={formData.taxPin}
                    onChange={(e) => setFormData({ ...formData, taxPin: e.target.value.toUpperCase() })}
                    placeholder="e.g., P051234567A"
                    className="uppercase"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="registrationNumber">Registration Number</Label>
                  <Input
                    id="registrationNumber"
                    value={formData.registrationNumber}
                    onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                    placeholder="Business registration number"
                  />
                </div>
              </div>
            </div>

            {/* Procurement Categories */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">Procurement Categories *</h4>
              <div className="flex flex-wrap gap-4">
                {PROCUREMENT_CATEGORIES.map((category) => (
                  <div key={category} className="flex items-center space-x-2">
                    <Checkbox
                      id={`category-${category}`}
                      checked={formData.category.includes(category)}
                      onCheckedChange={() => handleCategoryToggle(category)}
                    />
                    <Label htmlFor={`category-${category}`} className="cursor-pointer">
                      {category}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">Contact Information</h4>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="contactPerson">Contact Person *</Label>
                  <Input
                    id="contactPerson"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    placeholder="Primary contact name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+254 7XX XXX XXX"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="supplier@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="county">County *</Label>
                  <Select
                    value={formData.county}
                    onValueChange={(value) => setFormData({ ...formData, county: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select county" />
                    </SelectTrigger>
                    <SelectContent>
                      {KENYAN_COUNTIES.sort().map((county) => (
                        <SelectItem key={county} value={county}>
                          {county}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="physicalAddress">Physical Address *</Label>
                  <Textarea
                    id="physicalAddress"
                    value={formData.physicalAddress}
                    onChange={(e) => setFormData({ ...formData, physicalAddress: e.target.value })}
                    placeholder="Street address, building, floor"
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postalAddress">Postal Address</Label>
                  <Textarea
                    id="postalAddress"
                    value={formData.postalAddress}
                    onChange={(e) => setFormData({ ...formData, postalAddress: e.target.value })}
                    placeholder="P.O. Box XXX - XXXXX, City"
                    rows={2}
                  />
                </div>
              </div>
            </div>

            {/* Banking Details */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">Banking Details (Optional)</h4>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="bankName">Bank Name</Label>
                  <Input
                    id="bankName"
                    value={formData.bankName}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    placeholder="Enter bank name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bankBranch">Branch</Label>
                  <Input
                    id="bankBranch"
                    value={formData.bankBranch}
                    onChange={(e) => setFormData({ ...formData, bankBranch: e.target.value })}
                    placeholder="Branch name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bankAccountNumber">Account Number</Label>
                  <Input
                    id="bankAccountNumber"
                    value={formData.bankAccountNumber}
                    onChange={(e) => setFormData({ ...formData, bankAccountNumber: e.target.value })}
                    placeholder="Account number"
                  />
                </div>
              </div>
            </div>

            {/* Status & Notes */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">Status & Notes</h4>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="status">Status *</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: SupplierStatus) =>
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {SUPPLIER_STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Any additional notes about this supplier..."
                  rows={3}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editingSupplier ? "Update Supplier" : "Add Supplier"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Supplier?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{supplierToDelete?.name}"? This action cannot be
              undone and may affect existing procurement records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
