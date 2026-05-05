import { useState, useEffect } from "react";
import { useStudents, Student } from "@/contexts/StudentContext";
import { useAdmin } from "@/contexts/AdminContext";
import { useAudit } from "@/contexts/AuditContext";
import { useReadOnlyGuard } from "@/hooks/useReadOnlyGuard";
import { useSchool } from "@/contexts/SchoolContext";
import { studentsService } from "@/services/students.service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";
import { exportStudentRegisterPDF, exportStudentRegisterExcel } from "@/services/studentReports.service";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Users,
  UserCheck,
  UserX,
  GraduationCap,
  Download,
  Filter,
  FileText,
  FileSpreadsheet,
} from "lucide-react";

const CLASS_OPTIONS = ["Grade 10", "Grade 11", "Grade 12", "Form 3", "Form 4"];
const PATHWAY_OPTIONS = ["STEM", "Social Sciences", "Arts and Sports Science"] as const;

function inferNextAdmissionNo(recent: { admission_no: string }[]): string {
  for (const s of recent) {
    const m = s.admission_no.match(/^(.*?)(\d+)$/);
    if (m) {
      const prefix = m[1];
      const num = parseInt(m[2], 10);
      const padLen = m[2].length;
      return `${prefix}${String(num + 1).padStart(padLen, "0")}`;
    }
  }
  return "";
}

const emptyForm = {
  admissionNo: "",
  firstName: "",
  middleName: "",
  lastName: "",
  dateOfBirth: "",
  gender: "male" as "male" | "female",
  nemisNo: "",
  pathway: "" as Student["pathway"] | "",
  class: "",
  stream: "",
  admissionDate: "",
  parentName: "",
  parentPhone: "",
  parentEmail: "",
  address: "",
  status: "active" as Student["status"],
  notes: "",
};

export default function StudentRegister() {
  const { students, addStudent, updateStudent, deleteStudent } = useStudents();
  const { streams } = useAdmin();
  const { addLog } = useAudit();
  const { isReadOnly, blockAction } = useReadOnlyGuard();
  const { school } = useSchool();
  const activeStreams = streams.filter((s) => s.status === "active");
  const [searchTerm, setSearchTerm] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [formData, setFormData] = useState({ ...emptyForm });

  const resetForm = () => setFormData({ ...emptyForm });

  // Auto-generate admission number when add dialog opens
  useEffect(() => {
    if (!isAddDialogOpen) return;
    studentsService.getLastThreeStudents()
      .then((recent) => {
        const suggested = inferNextAdmissionNo(recent);
        if (suggested) setFormData((prev) => ({ ...prev, admissionNo: suggested }));
      })
      .catch(() => {/* silently ignore — field stays empty */});
  }, [isAddDialogOpen]);

  const filteredStudents = students.filter(student => {
    const matchesSearch =
      student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.admissionNo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = classFilter === "all" || student.class === classFilter;
    const matchesStatus = statusFilter === "all" || student.status === statusFilter;
    return matchesSearch && matchesClass && matchesStatus;
  });

  const activeStudents = students.filter(s => s.status === "active").length;
  const transferredStudents = students.filter(s => s.status === "transferred").length;
  const graduatedStudents = students.filter(s => s.status === "graduated").length;

  const handleAddStudent = () => {
    if (!formData.admissionNo || !formData.firstName || !formData.lastName || !formData.class) {
      toast({ title: "Validation Error", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    const payload = { ...formData, pathway: formData.pathway || undefined };
    addStudent(payload);
    addLog("Student added", "System", `Added student ${formData.firstName} ${formData.lastName} (${formData.admissionNo})`);
    toast({ title: "Student Added", description: `${formData.firstName} ${formData.lastName} has been registered successfully.` });
    resetForm();
    setIsAddDialogOpen(false);
  };

  const handleEditStudent = () => {
    if (!selectedStudent) return;
    const payload = { ...formData, pathway: formData.pathway || undefined };
    updateStudent(selectedStudent.id, payload);
    addLog("Student updated", "System", `Updated student ${formData.firstName} ${formData.lastName}`);
    toast({ title: "Student Updated", description: "Student information has been updated successfully." });
    setIsEditDialogOpen(false);
    setSelectedStudent(null);
  };

  const handleDeleteStudent = () => {
    if (!selectedStudent) return;
    deleteStudent(selectedStudent.id);
    addLog("Student deleted", "System", `Deleted student ${selectedStudent.firstName} ${selectedStudent.lastName}`);
    toast({ title: "Student Deleted", description: "Student record has been removed.", variant: "destructive" });
    setIsDeleteDialogOpen(false);
    setSelectedStudent(null);
  };

  const openEditDialog = (student: Student) => {
    setSelectedStudent(student);
    setFormData({
      admissionNo: student.admissionNo,
      firstName: student.firstName,
      middleName: student.middleName || "",
      lastName: student.lastName,
      dateOfBirth: student.dateOfBirth,
      gender: student.gender,
      nemisNo: student.nemisNo || "",
      pathway: student.pathway || "",
      class: student.class,
      stream: student.stream || "",
      admissionDate: student.admissionDate,
      parentName: student.parentName,
      parentPhone: student.parentPhone,
      parentEmail: student.parentEmail || "",
      address: student.address,
      status: student.status,
      notes: student.notes || "",
    });
    setIsEditDialogOpen(true);
  };

  const openViewDialog = (student: Student) => { setSelectedStudent(student); setIsViewDialogOpen(true); };
  const openDeleteDialog = (student: Student) => { setSelectedStudent(student); setIsDeleteDialogOpen(true); };

  const getStatusBadge = (status: Student["status"]) => {
    const colors: Record<Student["status"], string> = {
      active:      "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
      inactive:    "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800/50 dark:text-gray-400 dark:border-gray-700",
      transferred: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
      graduated:   "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
    };
    return (
      <Badge variant="outline" className={colors[status]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  // Shared form fields JSX (used by both Add and Edit dialogs)
  const renderFormFields = (idPrefix: string) => (
    <div className="grid gap-4 py-4">
      {/* Row 1: Admission No + Admission Date */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-admissionNo`}>Admission No *</Label>
          <Input
            id={`${idPrefix}-admissionNo`}
            value={formData.admissionNo}
            onChange={(e) => setFormData({ ...formData, admissionNo: e.target.value })}
            placeholder="e.g. ADM-2024-001"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-admissionDate`}>Admission Date *</Label>
          <Input
            id={`${idPrefix}-admissionDate`}
            type="date"
            value={formData.admissionDate}
            onChange={(e) => setFormData({ ...formData, admissionDate: e.target.value })}
          />
        </div>
      </div>

      {/* Row 2: First Name + Middle Name */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-firstName`}>First Name *</Label>
          <Input
            id={`${idPrefix}-firstName`}
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-middleName`}>Middle Name</Label>
          <Input
            id={`${idPrefix}-middleName`}
            value={formData.middleName}
            onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
            placeholder="Optional"
          />
        </div>
      </div>

      {/* Row 3: Last Name + Date of Birth */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-lastName`}>Last Name *</Label>
          <Input
            id={`${idPrefix}-lastName`}
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-dateOfBirth`}>Date of Birth</Label>
          <Input
            id={`${idPrefix}-dateOfBirth`}
            type="date"
            value={formData.dateOfBirth}
            onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
          />
        </div>
      </div>

      {/* Row 4: Gender + NEMIS/KEMIS No */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-gender`}>Gender *</Label>
          <Select value={formData.gender} onValueChange={(v) => setFormData({ ...formData, gender: v as "male" | "female" })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-nemisNo`}>NEMIS/KEMIS No</Label>
          <Input
            id={`${idPrefix}-nemisNo`}
            value={formData.nemisNo}
            onChange={(e) => setFormData({ ...formData, nemisNo: e.target.value })}
            placeholder="Unique ID"
          />
        </div>
      </div>

      {/* Row 5: Class/Grade + Stream */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-class`}>Class/Grade *</Label>
          <Select value={formData.class} onValueChange={(v) => setFormData({ ...formData, class: v })}>
            <SelectTrigger><SelectValue placeholder="Select class/grade" /></SelectTrigger>
            <SelectContent>
              {CLASS_OPTIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-stream`}>Stream</Label>
          <Select value={formData.stream} onValueChange={(v) => setFormData({ ...formData, stream: v })}>
            <SelectTrigger><SelectValue placeholder="Select stream" /></SelectTrigger>
            <SelectContent>
              {activeStreams.map(s => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Row 6: Pathway (full width) */}
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-pathway`}>Pathway</Label>
        <Select value={formData.pathway} onValueChange={(v) => setFormData({ ...formData, pathway: v as Student["pathway"] })}>
          <SelectTrigger><SelectValue placeholder="Select pathway" /></SelectTrigger>
          <SelectContent>
            {PATHWAY_OPTIONS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Row 7: Parent Name */}
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-parentName`}>Parent/Guardian Name *</Label>
        <Input
          id={`${idPrefix}-parentName`}
          value={formData.parentName}
          onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
        />
      </div>

      {/* Row 8: Parent Phone + Email */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-parentPhone`}>Parent Phone *</Label>
          <Input
            id={`${idPrefix}-parentPhone`}
            value={formData.parentPhone}
            onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
            placeholder="+254 7XX XXX XXX"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-parentEmail`}>Parent Email</Label>
          <Input
            id={`${idPrefix}-parentEmail`}
            type="email"
            value={formData.parentEmail}
            onChange={(e) => setFormData({ ...formData, parentEmail: e.target.value })}
          />
        </div>
      </div>

      {/* Row 9: Address */}
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-address`}>Address</Label>
        <Textarea
          id={`${idPrefix}-address`}
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
        />
      </div>

      {/* Row 10: Notes */}
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-notes`}>Notes</Label>
        <Textarea
          id={`${idPrefix}-notes`}
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Any additional information..."
        />
      </div>
    </div>
  );

  return (
    <div className="flex-1 space-y-6 p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground lg:text-3xl">Student Register</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage student admissions, profiles, and records
          </p>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => exportStudentRegisterPDF(students, school)}>
                <FileText className="mr-2 h-4 w-4 text-red-500" />
                Export PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportStudentRegisterExcel(students, school)}>
                <FileSpreadsheet className="mr-2 h-4 w-4 text-green-600" />
                Export Excel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
            if (!open) resetForm();
            setIsAddDialogOpen(open);
          }}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                onClick={() => { if (blockAction("add students")) return; }}
                disabled={isReadOnly}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Student
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Register New Student</DialogTitle>
                <DialogDescription>Enter student details to add a new record</DialogDescription>
              </DialogHeader>
              {renderFormFields("add")}
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleAddStudent}>Register Student</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{activeStudents}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Transferred</CardTitle>
            <UserX className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{transferredStudents}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Graduated</CardTitle>
            <GraduationCap className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{graduatedStudents}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name or admission number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={classFilter} onValueChange={setClassFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {CLASS_OPTIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="transferred">Transferred</SelectItem>
                <SelectItem value="graduated">Graduated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Students Table */}
      <Card>
        <CardHeader>
          <CardTitle>Student Records</CardTitle>
          <CardDescription>
            Showing {filteredStudents.length} of {students.length} students
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Adm. No</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Class/Grade</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>Pathway</TableHead>
                <TableHead>Parent/Guardian</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    No students found matching your criteria
                  </TableCell>
                </TableRow>
              ) : (
                filteredStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.admissionNo}</TableCell>
                    <TableCell>
                      {student.firstName} {student.middleName ? `${student.middleName} ` : ""}{student.lastName}
                    </TableCell>
                    <TableCell>{student.class} {student.stream && `(${student.stream})`}</TableCell>
                    <TableCell className="capitalize">{student.gender}</TableCell>
                    <TableCell>{student.pathway || <span className="text-muted-foreground">—</span>}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{student.parentName}</div>
                        <div className="text-muted-foreground">{student.parentPhone}</div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(student.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openViewDialog(student)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => { if (!blockAction("edit students")) openEditDialog(student); }}
                          disabled={isReadOnly}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => { if (!blockAction("delete students")) openDeleteDialog(student); }}
                          disabled={isReadOnly}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Student Details</DialogTitle>
          </DialogHeader>
          {selectedStudent && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Admission No</Label>
                  <p className="font-medium">{selectedStudent.admissionNo}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedStudent.status)}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Full Name</Label>
                  <p className="font-medium">
                    {selectedStudent.firstName}{selectedStudent.middleName ? ` ${selectedStudent.middleName}` : ""} {selectedStudent.lastName}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Date of Birth</Label>
                  <p className="font-medium">{selectedStudent.dateOfBirth || "Not provided"}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Gender</Label>
                  <p className="font-medium capitalize">{selectedStudent.gender}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">NEMIS/KEMIS No</Label>
                  <p className="font-medium">{selectedStudent.nemisNo || "Not provided"}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Class/Grade</Label>
                  <p className="font-medium">{selectedStudent.class} {selectedStudent.stream && `(${selectedStudent.stream})`}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Pathway</Label>
                  <p className="font-medium">{selectedStudent.pathway || "Not assigned"}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Admission Date</Label>
                  <p className="font-medium">{selectedStudent.admissionDate}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Parent/Guardian</Label>
                  <p className="font-medium">{selectedStudent.parentName}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Parent Phone</Label>
                  <p className="font-medium">{selectedStudent.parentPhone}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Parent Email</Label>
                  <p className="font-medium">{selectedStudent.parentEmail || "Not provided"}</p>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Address</Label>
                <p className="font-medium">{selectedStudent.address || "Not provided"}</p>
              </div>
              {selectedStudent.notes && (
                <div>
                  <Label className="text-muted-foreground">Notes</Label>
                  <p className="font-medium">{selectedStudent.notes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>Close</Button>
            <Button
              onClick={() => { if (!blockAction("edit students")) { setIsViewDialogOpen(false); if (selectedStudent) openEditDialog(selectedStudent); } }}
              disabled={isReadOnly}
            >
              Edit Student
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Student</DialogTitle>
            <DialogDescription>Update student information</DialogDescription>
          </DialogHeader>
          {/* Status field only in edit */}
          <div className="pt-4 px-0">
            <div className="space-y-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v as Student["status"] })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="transferred">Transferred</SelectItem>
                  <SelectItem value="graduated">Graduated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {renderFormFields("edit")}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleEditStudent}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Student</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedStudent?.firstName} {selectedStudent?.lastName}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteStudent}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
