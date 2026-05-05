import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ManagedUser } from "@/mock/admin.mock";
import { usersService } from "@/services/users.service";
import { adminService } from "@/services/admin.service";
import { useAudit } from "@/contexts/AuditContext";
import { UserRole, useAuth } from "@/contexts/AuthContext";
import { useReadOnlyGuard } from "@/hooks/useReadOnlyGuard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Users, Plus, Pencil, Trash2, Shield, Search, UserCheck, UserX, Warehouse } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const allRoles: { value: UserRole; label: string }[] = [
  { value: "admin", label: "Administrator" },
  { value: "headteacher", label: "Headteacher" },
  { value: "bursar", label: "Bursar" },
  { value: "storekeeper", label: "Storekeeper" },
  { value: "librarian", label: "Librarian" },
  { value: "auditor", label: "Auditor" },
  { value: "procurement_officer", label: "Procurement Officer" },
];

// Roles hidden from non-superAdmin users
const restrictedRoles: UserRole[] = ["admin", "auditor"];

const departments = [
  "Administration",
  "Finance",
  "Stores",
  "Library",
  "Audit",
  "Procurement",
  "Academic",
];

export default function UserManagement() {
  const queryClient = useQueryClient();
  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => usersService.getUsers(),
  });

  const { data: stores = [] } = useQuery({
    queryKey: ["stores"],
    queryFn: () => adminService.getStores(),
  });

  const createMutation = useMutation({
    mutationFn: (data: Parameters<typeof usersService.createUser>[0]) => usersService.createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User created successfully");
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (error: Error) => toast.error(`Failed to create user: ${error.message}`)
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string, updates: Partial<ManagedUser> }) => usersService.updateUser(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User updated successfully");
      setIsEditOpen(false);
      setEditingUser(null);
      resetForm();
    },
    onError: (error: Error) => toast.error(`Failed to update user: ${error.message}`)
  });

  const statusMutation = useMutation({
    mutationFn: (id: string) => usersService.toggleUserStatus(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
    onError: (error: Error) => toast.error(`Failed to toggle user status: ${error.message}`)
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => usersService.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User deleted successfully");
    },
    onError: (error: Error) => toast.error(`Failed to delete user: ${error.message}`)
  });

  const { addLog } = useAudit();
  const { user: currentUser } = useAuth();
  const { isReadOnly, blockAction } = useReadOnlyGuard();
  const [searchTerm, setSearchTerm] = useState("");

  // Only admin role can see/manage admin/auditor users
  const isSuperAdmin = currentUser?.role === "admin";
  const roles = isSuperAdmin
    ? allRoles
    : allRoles.filter(r => !restrictedRoles.includes(r.value));

  // Filter out restricted role users for non-superAdmins
  const visibleUsers = isSuperAdmin
    ? users
    : users.filter(u => !restrictedRoles.includes(u.role));
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "storekeeper" as UserRole,
    department: "",
    password: "",
    assignedStores: [] as string[],
  });

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      role: "storekeeper",
      department: "",
      password: "",
      assignedStores: [],
    });
  };

  const handleStoreToggle = (storeId: string) => {
    setFormData((prev) => ({
      ...prev,
      assignedStores: prev.assignedStores.includes(storeId)
        ? prev.assignedStores.filter((id) => id !== storeId)
        : [...prev.assignedStores, storeId],
    }));
  };

  const handleCreate = () => {
    if (blockAction("create users")) return;
    if (!formData.name || !formData.email || !formData.password) {
      toast.error("Please fill in all required fields");
      return;
    }

    createMutation.mutate({
      name: formData.name,
      email: formData.email,
      role: formData.role,
      department: formData.department,
      status: "active",
      assignedStores: formData.assignedStores,
    });

    addLog("User Created", "System", `New user ${formData.name} (${formData.email}) created with role ${formData.role}`);
    toast.success("User created successfully");
    setIsCreateOpen(false);
    resetForm();
  };

  const handleEdit = () => {
    if (blockAction("edit users")) return;
    if (!editingUser) return;

    updateMutation.mutate({
      id: editingUser.id,
      updates: {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        department: formData.department,
        assignedStores: formData.assignedStores,
      }
    });

    addLog("User Updated", "System", `User ${formData.name} updated`);
    toast.success("User updated successfully");
    setIsEditOpen(false);
    setEditingUser(null);
    resetForm();
  };

  const handleToggleStatus = (user: ManagedUser) => {
    if (blockAction("change user status")) return;
    statusMutation.mutate(user.id);
    const newStatus = user.status === "active" ? "deactivated" : "activated";
    addLog("User Status Changed", "System", `User ${user.name} ${newStatus}`);
    toast.success(`User ${newStatus} successfully`);
  };

  const handleDelete = (user: ManagedUser) => {
    if (blockAction("delete users")) return;
    deleteMutation.mutate(user.id);
    addLog("User Deleted", "System", `User ${user.name} (${user.email}) deleted`);
  };

  const openEditDialog = (user: ManagedUser) => {
    if (blockAction("edit users")) return;
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department || "",
      password: "",
      assignedStores: user.assignedStores || [],
    });
    setIsEditOpen(true);
  };

  const filteredUsers = visibleUsers.filter((user) => {
    const searchLow = searchTerm.toLowerCase();
    const nameMatch = user.name?.toLowerCase().includes(searchLow) ?? false;
    const emailMatch = user.email?.toLowerCase().includes(searchLow) ?? false;
    const matchesSearch = nameMatch || emailMatch;
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesStatus = statusFilter === "all" || user.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const activeUsers = visibleUsers.filter((u) => u.status === "active").length;
  const inactiveUsers = visibleUsers.filter((u) => u.status === "inactive").length;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            User Management
          </h1>
          <p className="text-muted-foreground">Manage user accounts, roles, and permissions</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button disabled={isReadOnly}>
              <Plus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
              <DialogDescription>Add a new user to the system</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter full name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter email address"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter password"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role">Role *</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value as UserRole })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="department">Department</Label>
                <Select
                  value={formData.department || "none"}
                  onValueChange={(value) => setFormData({ ...formData, department: value === "none" ? "" : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No department</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label className="flex items-center gap-2">
                  <Warehouse className="h-4 w-4" />
                  Assigned Stores
                </Label>
                <div className="border rounded-md p-3 max-h-32 overflow-y-auto space-y-2">
                  {stores.filter(s => s.status === "active").length === 0 ? (
                    <p className="text-sm text-muted-foreground">No stores available</p>
                  ) : (
                    stores.filter(s => s.status === "active").map((store) => (
                      <div key={store.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`create-store-${store.id}`}
                          checked={formData.assignedStores.includes(store.id)}
                          onCheckedChange={() => handleStoreToggle(store.id)}
                        />
                        <label
                          htmlFor={`create-store-${store.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {store.name} ({store.code})
                        </label>
                      </div>
                    ))
                  )}
                </div>
                {formData.assignedStores.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {formData.assignedStores.length} store(s) selected
                  </p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate}>Create User</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{visibleUsers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeUsers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive Users</CardTitle>
            <UserX className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{inactiveUsers}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>User Directory</CardTitle>
          <CardDescription>View and manage all system users</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {roles.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Assigned Stores</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name || "Unnamed User"}</TableCell>
                      <TableCell>{user.email || "-"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {user.role?.replace("_", " ") || "No Role"}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.department || "-"}</TableCell>
                      <TableCell>
                        {user.assignedStores && user.assignedStores.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {user.assignedStores.slice(0, 2).map((storeId) => {
                              const store = stores.find((s) => s.id === storeId);
                              return store ? (
                                <Badge key={storeId} variant="secondary" className="text-xs">
                                  {store.code}
                                </Badge>
                              ) : null;
                            })}
                            {user.assignedStores.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{user.assignedStores.length - 2}
                              </Badge>
                            )}
                          </div>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={user.status === "active"}
                            onCheckedChange={() => handleToggleStatus(user)}
                            disabled={user.email === "admin@shools.ac.ke" || isReadOnly}
                          />
                          <Badge variant={user.status === "active" ? "default" : "secondary"}>
                            {user.status || "inactive"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.lastLogin ? format(new Date(user.lastLogin), "MMM d, yyyy") : "Never"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(user)}
                            disabled={user.email === "admin@shools.ac.ke" || isReadOnly}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive"
                                disabled={user.email === "admin@shools.ac.ke" || isReadOnly}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete User</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete {user.name || "this user"}? This action cannot be
                                  undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(user)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user information</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Full Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-role">Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value as UserRole })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-department">Department</Label>
              <Select
                value={formData.department || "none"}
                onValueChange={(value) => setFormData({ ...formData, department: value === "none" ? "" : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No department</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label className="flex items-center gap-2">
                <Warehouse className="h-4 w-4" />
                Assigned Stores
              </Label>
              <div className="border rounded-md p-3 max-h-32 overflow-y-auto space-y-2">
                {stores.filter(s => s.status === "active").length === 0 ? (
                  <p className="text-sm text-muted-foreground">No stores available</p>
                ) : (
                  stores.filter(s => s.status === "active").map((store) => (
                    <div key={store.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`edit-store-${store.id}`}
                        checked={formData.assignedStores.includes(store.id)}
                        onCheckedChange={() => handleStoreToggle(store.id)}
                      />
                      <label
                        htmlFor={`edit-store-${store.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {store.name} ({store.code})
                      </label>
                    </div>
                  ))
                )}
              </div>
              {formData.assignedStores.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {formData.assignedStores.length} store(s) selected
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
