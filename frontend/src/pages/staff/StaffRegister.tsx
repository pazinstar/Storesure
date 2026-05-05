import { useState } from "react";
import { useStaff, Staff, StaffType, DEPARTMENTS } from "@/contexts/StaffContext";

// ─── Types ────────────────────────────────────────────────────────────────────

type FormData = {
  tscNumber: string;
  staffNumber: string;
  inventoryNumber: string;
  name: string;
  email: string;
  phone: string;
  type: StaffType;
  designation: string;
  department: string;
  dateJoined: string;
  status: Staff["status"];
  idNumber: string;
  gender: "male" | "female" | "";
  subjects: string;
  notes: string;
};
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Plus, Search, Pencil, Trash2, Users, GraduationCap, Wrench } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useReadOnlyGuard } from "@/hooks/useReadOnlyGuard";

// ─── StaffForm (module-level — must NOT be defined inside StaffRegister) ─────

function StaffForm({
  formData,
  setFormData,
  onSubmit,
  submitLabel,
  onCancel,
}: {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  onSubmit: () => void;
  submitLabel: string;
  onCancel: () => void;
}) {
  return (
    <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="type">Staff Type *</Label>
          <Select
            value={formData.type}
            onValueChange={(value: StaffType) => setFormData((prev) => ({ ...prev, type: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="teaching">Teaching</SelectItem>
              <SelectItem value="non-teaching">Non-Teaching</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="inventoryNumber">Inventory Number *</Label>
          <Input
            id="inventoryNumber"
            value={formData.inventoryNumber}
            onChange={(e) => setFormData((prev) => ({ ...prev, inventoryNumber: e.target.value }))}
            placeholder="e.g., INV001"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {formData.type === "teaching" ? (
          <div className="space-y-2">
            <Label htmlFor="tscNumber">TSC Number *</Label>
            <Input
              id="tscNumber"
              value={formData.tscNumber}
              onChange={(e) => setFormData((prev) => ({ ...prev, tscNumber: e.target.value }))}
              placeholder="e.g., TSC001234"
            />
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="staffNumber">Staff Number *</Label>
            <Input
              id="staffNumber"
              value={formData.staffNumber}
              onChange={(e) => setFormData((prev) => ({ ...prev, staffNumber: e.target.value }))}
              placeholder="e.g., NTS001"
            />
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="name">Full Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="Enter full name"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
            placeholder="email@school.ac.ke"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
            placeholder="0722000000"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="idNumber">ID Number</Label>
          <Input
            id="idNumber"
            value={formData.idNumber}
            onChange={(e) => setFormData((prev) => ({ ...prev, idNumber: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="gender">Gender</Label>
          <Select
            value={formData.gender}
            onValueChange={(value: "male" | "female") => setFormData((prev) => ({ ...prev, gender: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="designation">Designation *</Label>
          <Input
            id="designation"
            value={formData.designation}
            onChange={(e) => setFormData((prev) => ({ ...prev, designation: e.target.value }))}
            placeholder="e.g., Senior Teacher"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="department">Department</Label>
          <Select
            value={formData.department || "none"}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, department: value === "none" ? "" : value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">-- Select --</SelectItem>
              {DEPARTMENTS.map((dept) => (
                <SelectItem key={dept} value={dept}>
                  {dept}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="dateJoined">Date Joined</Label>
          <Input
            id="dateJoined"
            type="date"
            value={formData.dateJoined}
            onChange={(e) => setFormData((prev) => ({ ...prev, dateJoined: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={formData.status}
            onValueChange={(value: Staff["status"]) => setFormData((prev) => ({ ...prev, status: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="on_leave">On Leave</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {formData.type === "teaching" && (
        <div className="space-y-2">
          <Label htmlFor="subjects">Subjects (comma-separated)</Label>
          <Input
            id="subjects"
            value={formData.subjects}
            onChange={(e) => setFormData((prev) => ({ ...prev, subjects: e.target.value }))}
            placeholder="e.g., Mathematics, Physics"
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
          placeholder="Additional notes..."
          rows={2}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={onSubmit}>{submitLabel}</Button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StaffRegister() {
  const { isReadOnly, blockAction } = useReadOnlyGuard();
  const { staff, addStaff, updateStaff, deleteStaff, getStaffByType } = useStaff();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | StaffType>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);

  // Form state
  const [formData, setFormData] = useState<FormData>({
    tscNumber: "",
    staffNumber: "",
    inventoryNumber: "",
    name: "",
    email: "",
    phone: "",
    type: "teaching",
    designation: "",
    department: "",
    dateJoined: "",
    status: "active",
    idNumber: "",
    gender: "",
    subjects: "",
    notes: "",
  });

  const resetForm = () => {
    setFormData({
      tscNumber: "",
      staffNumber: "",
      inventoryNumber: "",
      name: "",
      email: "",
      phone: "",
      type: "teaching",
      designation: "",
      department: "",
      dateJoined: "",
      status: "active",
      idNumber: "",
      gender: "",
      subjects: "",
      notes: "",
    });
  };

  const handleAddStaff = () => {
    const isTeaching = formData.type === "teaching";
    const idField = isTeaching ? formData.tscNumber : formData.staffNumber;
    
    if (!idField || !formData.inventoryNumber || !formData.name || !formData.designation) {
      toast.error("Please fill in all required fields");
      return;
    }

    addStaff({
      tscNumber: isTeaching ? formData.tscNumber : undefined,
      staffNumber: !isTeaching ? formData.staffNumber : undefined,
      inventoryNumber: formData.inventoryNumber,
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      type: formData.type,
      designation: formData.designation,
      department: formData.department,
      dateJoined: formData.dateJoined ? new Date(formData.dateJoined) : new Date(),
      status: formData.status,
      idNumber: formData.idNumber || undefined,
      gender: formData.gender || undefined,
      subjects: formData.subjects ? formData.subjects.split(",").map((s) => s.trim()) : undefined,
      notes: formData.notes || undefined,
    });

    toast.success("Staff member added. System user created with default password: 1234");
    setIsAddDialogOpen(false);
    resetForm();
  };

  const handleEditStaff = () => {
    if (!selectedStaff) return;
    const isTeaching = formData.type === "teaching";

    updateStaff(selectedStaff.id, {
      tscNumber: isTeaching ? formData.tscNumber : undefined,
      staffNumber: !isTeaching ? formData.staffNumber : undefined,
      inventoryNumber: formData.inventoryNumber,
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      type: formData.type,
      designation: formData.designation,
      department: formData.department,
      dateJoined: formData.dateJoined ? new Date(formData.dateJoined) : selectedStaff.dateJoined,
      status: formData.status,
      idNumber: formData.idNumber || undefined,
      gender: formData.gender || undefined,
      subjects: formData.subjects ? formData.subjects.split(",").map((s) => s.trim()) : undefined,
      notes: formData.notes || undefined,
    });

    toast.success("Staff member updated successfully");
    setIsEditDialogOpen(false);
    setSelectedStaff(null);
    resetForm();
  };

  const openEditDialog = (staffMember: Staff) => {
    setSelectedStaff(staffMember);
    setFormData({
      tscNumber: staffMember.tscNumber || "",
      staffNumber: staffMember.staffNumber || "",
      inventoryNumber: staffMember.inventoryNumber,
      name: staffMember.name,
      email: staffMember.email,
      phone: staffMember.phone,
      type: staffMember.type,
      designation: staffMember.designation,
      department: staffMember.department,
      dateJoined: format(staffMember.dateJoined, "yyyy-MM-dd"),
      status: staffMember.status,
      idNumber: staffMember.idNumber || "",
      gender: staffMember.gender || "",
      subjects: staffMember.subjects?.join(", ") || "",
      notes: staffMember.notes || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteStaff = () => {
    if (!selectedStaff) return;
    deleteStaff(selectedStaff.id);
    toast.success("Staff member deleted successfully");
    setDeleteDialogOpen(false);
    setSelectedStaff(null);
  };

  const getStaffIdentifier = (s: Staff) => {
    return s.type === "teaching" ? s.tscNumber : s.staffNumber;
  };

  const getFilteredStaff = () => {
    let filtered = activeTab === "all" ? staff : getStaffByType(activeTab);
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(term) ||
          s.inventoryNumber.toLowerCase().includes(term) ||
          (s.tscNumber?.toLowerCase().includes(term)) ||
          (s.staffNumber?.toLowerCase().includes(term)) ||
          s.department.toLowerCase().includes(term) ||
          s.designation.toLowerCase().includes(term)
      );
    }
    return filtered;
  };

  const filteredStaff = getFilteredStaff();
  const teachingCount = getStaffByType("teaching").length;
  const nonTeachingCount = getStaffByType("non-teaching").length;

  const getStatusBadge = (status: Staff["status"]) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800">Active</Badge>;
      case "inactive":
        return <Badge variant="secondary">Inactive</Badge>;
      case "on_leave":
        return <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800">On Leave</Badge>;
    }
  };

  const handleCancel = () => {
    setIsAddDialogOpen(false);
    setIsEditDialogOpen(false);
    resetForm();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Staff Management</h1>
          <p className="text-muted-foreground">Manage teaching and non-teaching staff</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => {
                if (blockAction("add staff")) return;
                resetForm();
              }}
              disabled={isReadOnly}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Staff
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Staff Member</DialogTitle>
            </DialogHeader>
            <StaffForm
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleAddStaff}
              submitLabel="Add Staff"
              onCancel={handleCancel}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Staff</p>
                <p className="text-2xl font-bold">{staff.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <GraduationCap className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Teaching Staff</p>
                <p className="text-2xl font-bold">{teachingCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                <Wrench className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Non-Teaching Staff</p>
                <p className="text-2xl font-bold">{nonTeachingCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Staff List */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>Staff Directory</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search staff..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
            <TabsList>
              <TabsTrigger value="all">All ({staff.length})</TabsTrigger>
              <TabsTrigger value="teaching">Teaching ({teachingCount})</TabsTrigger>
              <TabsTrigger value="non-teaching">Non-Teaching ({nonTeachingCount})</TabsTrigger>
            </TabsList>
            <TabsContent value={activeTab} className="mt-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>TSC/Staff No.</TableHead>
                      <TableHead>Inv. No.</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Designation</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-20 text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStaff.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                          No staff members found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredStaff.map((s) => (
                        <TableRow key={s.id}>
                          <TableCell className="font-medium">{getStaffIdentifier(s)}</TableCell>
                          <TableCell className="text-muted-foreground">{s.inventoryNumber}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{s.name}</p>
                              <p className="text-xs text-muted-foreground">{s.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {s.type.replace("-", " ")}
                            </Badge>
                          </TableCell>
                          <TableCell>{s.designation}</TableCell>
                          <TableCell>{s.department}</TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              {getStatusBadge(s.status)}
                              {s.userId && (
                                <Badge variant="secondary" className="text-xs w-fit">
                                  System User
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-1">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => {
                                      if (blockAction("edit staff")) return;
                                      openEditDialog(s);
                                    }}
                                    disabled={isReadOnly}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Edit</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                    onClick={() => {
                                      if (blockAction("delete staff")) return;
                                      setSelectedStaff(s);
                                      setDeleteDialogOpen(true);
                                    }}
                                    disabled={isReadOnly}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Delete</TooltipContent>
                              </Tooltip>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Staff Member</DialogTitle>
          </DialogHeader>
          <StaffForm
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleEditStaff}
              submitLabel="Save Changes"
              onCancel={handleCancel}
            />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Staff Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedStaff?.name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteStaff} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
