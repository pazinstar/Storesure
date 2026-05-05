import { useState } from "react";
import { useAdmin } from "@/contexts/AdminContext";
import { useQuery } from "@tanstack/react-query";
import { usersService } from "@/services/users.service";
import { useAudit } from "@/contexts/AuditContext";
import { useReadOnlyGuard } from "@/hooks/useReadOnlyGuard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Warehouse,
  BookOpen,
  Building2,
  Plus,
  Pencil,
  Trash2,
  Search,
  Settings2,
  ClipboardCheck,
  Users,
  Layers,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Store, Library, Department, Stream } from "@/contexts/AdminContext";
import { InspectionCommitteeSetup } from "@/components/admin/InspectionCommitteeSetup";

export default function AdminControlPanel() {
  const {
    stores,
    addStore,
    updateStore,
    deleteStore,
    libraries,
    addLibrary,
    updateLibrary,
    deleteLibrary,
    departments,
    addDepartment,
    updateDepartment,
    deleteDepartment,
    streams,
    addStream,
    updateStream,
    deleteStream,
  } = useAdmin();
  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => usersService.getUsers(),
  });
  const { addLog } = useAudit();
  const { isReadOnly, blockAction } = useReadOnlyGuard();

  const [activeTab, setActiveTab] = useState("stores");
  const [searchTerm, setSearchTerm] = useState("");

  // Store form state
  const [storeDialogOpen, setStoreDialogOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [storeForm, setStoreForm] = useState({
    name: "",
    code: "",
    location: "",
    managerId: "",
    description: "",
    status: "active" as "active" | "inactive",
  });

  // Library form state
  const [libraryDialogOpen, setLibraryDialogOpen] = useState(false);
  const [editingLibrary, setEditingLibrary] = useState<Library | null>(null);
  const [libraryForm, setLibraryForm] = useState({
    name: "",
    code: "",
    location: "",
    managerId: "",
    capacity: "",
    description: "",
    status: "active" as "active" | "inactive",
  });

  // Department form state
  const [deptDialogOpen, setDeptDialogOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [deptForm, setDeptForm] = useState({
    name: "",
    code: "",
    headId: "",
    description: "",
    status: "active" as "active" | "inactive",
  });

  // Stream form state
  const [streamDialogOpen, setStreamDialogOpen] = useState(false);
  const [editingStream, setEditingStream] = useState<Stream | null>(null);
  const [streamForm, setStreamForm] = useState({
    name: "",
    code: "",
    description: "",
    status: "active" as "active" | "inactive",
  });

  const resetStoreForm = () => {
    setStoreForm({ name: "", code: "", location: "", managerId: "", description: "", status: "active" });
    setEditingStore(null);
  };

  const resetLibraryForm = () => {
    setLibraryForm({ name: "", code: "", location: "", managerId: "", capacity: "", description: "", status: "active" });
    setEditingLibrary(null);
  };

  const resetDeptForm = () => {
    setDeptForm({ name: "", code: "", headId: "", description: "", status: "active" });
    setEditingDept(null);
  };

  const resetStreamForm = () => {
    setStreamForm({ name: "", code: "", description: "", status: "active" });
    setEditingStream(null);
  };

  // Store handlers
  const handleSaveStore = () => {
    if (blockAction("manage stores")) return;
    if (!storeForm.name || !storeForm.code) {
      toast.error("Name and code are required");
      return;
    }

    const manager = users.find((u) => u.id === storeForm.managerId);

    if (editingStore) {
      updateStore(editingStore.id, {
        ...storeForm,
        managerName: manager?.name,
      });
      addLog("Store Updated", "Admin", `Store ${storeForm.name} updated`);
      toast.success("Store updated successfully");
    } else {
      addStore({
        ...storeForm,
        managerName: manager?.name,
      });
      addLog("Store Created", "Admin", `Store ${storeForm.name} created`);
      toast.success("Store created successfully");
    }
    setStoreDialogOpen(false);
    resetStoreForm();
  };

  const openEditStore = (store: Store) => {
    if (blockAction("edit stores")) return;
    setEditingStore(store);
    setStoreForm({
      name: store.name,
      code: store.code,
      location: store.location,
      managerId: store.managerId || "",
      description: store.description || "",
      status: store.status,
    });
    setStoreDialogOpen(true);
  };

  const handleDeleteStore = (store: Store) => {
    if (blockAction("delete stores")) return;
    deleteStore(store.id);
    addLog("Store Deleted", "Admin", `Store ${store.name} deleted`);
    toast.success("Store deleted successfully");
  };

  // Library handlers
  const handleSaveLibrary = () => {
    if (blockAction("manage libraries")) return;
    if (!libraryForm.name || !libraryForm.code) {
      toast.error("Name and code are required");
      return;
    }

    const manager = users.find((u) => u.id === libraryForm.managerId);

    if (editingLibrary) {
      updateLibrary(editingLibrary.id, {
        ...libraryForm,
        capacity: libraryForm.capacity ? parseInt(libraryForm.capacity) : undefined,
        managerName: manager?.name,
      });
      addLog("Library Updated", "Admin", `Library ${libraryForm.name} updated`);
      toast.success("Library updated successfully");
    } else {
      addLibrary({
        ...libraryForm,
        capacity: libraryForm.capacity ? parseInt(libraryForm.capacity) : undefined,
        managerName: manager?.name,
      });
      addLog("Library Created", "Admin", `Library ${libraryForm.name} created`);
      toast.success("Library created successfully");
    }
    setLibraryDialogOpen(false);
    resetLibraryForm();
  };

  const openEditLibrary = (library: Library) => {
    if (blockAction("edit libraries")) return;
    setEditingLibrary(library);
    setLibraryForm({
      name: library.name,
      code: library.code,
      location: library.location,
      managerId: library.managerId || "",
      capacity: library.capacity?.toString() || "",
      description: library.description || "",
      status: library.status,
    });
    setLibraryDialogOpen(true);
  };

  const handleDeleteLibrary = (library: Library) => {
    if (blockAction("delete libraries")) return;
    deleteLibrary(library.id);
    addLog("Library Deleted", "Admin", `Library ${library.name} deleted`);
    toast.success("Library deleted successfully");
  };

  // Department handlers
  const handleSaveDepartment = () => {
    if (blockAction("manage departments")) return;
    if (!deptForm.name || !deptForm.code) {
      toast.error("Name and code are required");
      return;
    }

    const head = users.find((u) => u.id === deptForm.headId);

    if (editingDept) {
      updateDepartment(editingDept.id, {
        ...deptForm,
        headName: head?.name,
      });
      addLog("Department Updated", "Admin", `Department ${deptForm.name} updated`);
      toast.success("Department updated successfully");
    } else {
      addDepartment({
        ...deptForm,
        headName: head?.name,
      });
      addLog("Department Created", "Admin", `Department ${deptForm.name} created`);
      toast.success("Department created successfully");
    }
    setDeptDialogOpen(false);
    resetDeptForm();
  };

  const openEditDepartment = (dept: Department) => {
    if (blockAction("edit departments")) return;
    setEditingDept(dept);
    setDeptForm({
      name: dept.name,
      code: dept.code,
      headId: dept.headId || "",
      description: dept.description || "",
      status: dept.status,
    });
    setDeptDialogOpen(true);
  };

  const handleDeleteDepartment = (dept: Department) => {
    if (blockAction("delete departments")) return;
    deleteDepartment(dept.id);
    addLog("Department Deleted", "Admin", `Department ${dept.name} deleted`);
    toast.success("Department deleted successfully");
  };

  // Stream handlers
  const handleSaveStream = () => {
    if (blockAction("manage streams")) return;
    if (!streamForm.name || !streamForm.code) {
      toast.error("Name and code are required");
      return;
    }

    if (editingStream) {
      updateStream(editingStream.id, streamForm);
      addLog("Stream Updated", "Admin", `Stream ${streamForm.name} updated`);
      toast.success("Stream updated successfully");
    } else {
      addStream(streamForm);
      addLog("Stream Created", "Admin", `Stream ${streamForm.name} created`);
      toast.success("Stream created successfully");
    }
    setStreamDialogOpen(false);
    resetStreamForm();
  };

  const openEditStream = (stream: Stream) => {
    if (blockAction("edit streams")) return;
    setEditingStream(stream);
    setStreamForm({
      name: stream.name,
      code: stream.code,
      description: stream.description || "",
      status: stream.status,
    });
    setStreamDialogOpen(true);
  };

  const handleDeleteStream = (stream: Stream) => {
    if (blockAction("delete streams")) return;
    deleteStream(stream.id);
    addLog("Stream Deleted", "Admin", `Stream ${stream.name} deleted`);
    toast.success("Stream deleted successfully");
  };

  // Filter functions
  const filteredStores = stores.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredLibraries = libraries.filter(
    (l) =>
      l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredDepartments = departments.filter(
    (d) =>
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredStreams = streams.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeManagers = users.filter((u) => u.status === "active");

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Settings2 className="h-8 w-8 text-primary" />
            Admin Control Panel
          </h1>
          <p className="text-muted-foreground">
            Manage stores, libraries, departments, streams, and inspection committee
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Stores</CardTitle>
            <Warehouse className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stores.length}</div>
            <p className="text-xs text-muted-foreground">
              {stores.filter((s) => s.status === "active").length} active
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Libraries</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{libraries.length}</div>
            <p className="text-xs text-muted-foreground">
              {libraries.filter((l) => l.status === "active").length} active
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Departments</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{departments.length}</div>
            <p className="text-xs text-muted-foreground">
              {departments.filter((d) => d.status === "active").length} active
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.filter((u) => u.status === "Active").length}</div>
            <p className="text-xs text-muted-foreground">{users.length} total users</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="stores" className="flex items-center gap-2">
            <Warehouse className="h-4 w-4" />
            Stores
          </TabsTrigger>
          <TabsTrigger value="libraries" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Libraries
          </TabsTrigger>
          <TabsTrigger value="departments" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Departments
          </TabsTrigger>
          <TabsTrigger value="streams" className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Streams
          </TabsTrigger>
          <TabsTrigger value="inspection" className="flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4" />
            Inspection Committee
          </TabsTrigger>
        </TabsList>

        {/* Stores Tab */}
        <TabsContent value="stores">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Store Management</CardTitle>
                <CardDescription>Create and manage store locations</CardDescription>
              </div>
              <Dialog open={storeDialogOpen} onOpenChange={(open) => {
                setStoreDialogOpen(open);
                if (!open) resetStoreForm();
              }}>
                <DialogTrigger asChild>
                  <Button disabled={isReadOnly}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Store
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingStore ? "Edit Store" : "Create New Store"}</DialogTitle>
                    <DialogDescription>
                      {editingStore ? "Update store information" : "Add a new store to the system"}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="store-name">Store Name *</Label>
                        <Input
                          id="store-name"
                          value={storeForm.name}
                          onChange={(e) => setStoreForm({ ...storeForm, name: e.target.value })}
                          placeholder="e.g., Main Store"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="store-code">Store Code *</Label>
                        <Input
                          id="store-code"
                          value={storeForm.code}
                          onChange={(e) => setStoreForm({ ...storeForm, code: e.target.value.toUpperCase() })}
                          placeholder="e.g., MS001"
                        />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="store-location">Location</Label>
                      <Input
                        id="store-location"
                        value={storeForm.location}
                        onChange={(e) => setStoreForm({ ...storeForm, location: e.target.value })}
                        placeholder="e.g., Administration Block, Ground Floor"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="store-manager">Store Manager</Label>
                      <Select
                        value={storeForm.managerId || "none"}
                        onValueChange={(value) => setStoreForm({ ...storeForm, managerId: value === "none" ? "" : value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select manager" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No manager assigned</SelectItem>
                          {activeManagers.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.name || "Unnamed"} ({user.role?.replace("_", " ") || "No Role"})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="store-description">Description</Label>
                      <Textarea
                        id="store-description"
                        value={storeForm.description}
                        onChange={(e) => setStoreForm({ ...storeForm, description: e.target.value })}
                        placeholder="Brief description of the store"
                        rows={2}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="store-status"
                        checked={storeForm.status === "active"}
                        onCheckedChange={(checked) =>
                          setStoreForm({ ...storeForm, status: checked ? "active" : "inactive" })
                        }
                      />
                      <Label htmlFor="store-status">Active</Label>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setStoreDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSaveStore}>
                      {editingStore ? "Save Changes" : "Create Store"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search stores..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Manager</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStores.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No stores found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredStores.map((store) => (
                        <TableRow key={store.id}>
                          <TableCell className="font-medium">{store.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{store.code}</Badge>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">{store.location}</TableCell>
                          <TableCell>{store.managerName || "-"}</TableCell>
                          <TableCell>
                            <Badge variant={store.status === "active" ? "default" : "secondary"}>
                              {store.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{format(store.createdAt, "MMM d, yyyy")}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="icon" onClick={() => openEditStore(store)} disabled={isReadOnly}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="text-destructive" disabled={isReadOnly}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Store</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete "{store.name}"? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteStore(store)}
                                      className="bg-destructive text-destructive-foreground"
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
        </TabsContent>

        {/* Libraries Tab */}
        <TabsContent value="libraries">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Library Management</CardTitle>
                <CardDescription>Create and manage library branches</CardDescription>
              </div>
              <Dialog open={libraryDialogOpen} onOpenChange={(open) => {
                setLibraryDialogOpen(open);
                if (!open) resetLibraryForm();
              }}>
                <DialogTrigger asChild>
                  <Button disabled={isReadOnly}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Library
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingLibrary ? "Edit Library" : "Create New Library"}</DialogTitle>
                    <DialogDescription>
                      {editingLibrary ? "Update library information" : "Add a new library branch"}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="lib-name">Library Name *</Label>
                        <Input
                          id="lib-name"
                          value={libraryForm.name}
                          onChange={(e) => setLibraryForm({ ...libraryForm, name: e.target.value })}
                          placeholder="e.g., Main Library"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="lib-code">Library Code *</Label>
                        <Input
                          id="lib-code"
                          value={libraryForm.code}
                          onChange={(e) => setLibraryForm({ ...libraryForm, code: e.target.value.toUpperCase() })}
                          placeholder="e.g., ML001"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="lib-location">Location</Label>
                        <Input
                          id="lib-location"
                          value={libraryForm.location}
                          onChange={(e) => setLibraryForm({ ...libraryForm, location: e.target.value })}
                          placeholder="e.g., Library Block"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="lib-capacity">Capacity</Label>
                        <Input
                          id="lib-capacity"
                          type="number"
                          value={libraryForm.capacity}
                          onChange={(e) => setLibraryForm({ ...libraryForm, capacity: e.target.value })}
                          placeholder="e.g., 500"
                        />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="lib-manager">Librarian</Label>
                      <Select
                        value={libraryForm.managerId || "none"}
                        onValueChange={(value) => setLibraryForm({ ...libraryForm, managerId: value === "none" ? "" : value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select librarian" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No librarian assigned</SelectItem>
                          {activeManagers.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.name} ({user.role.replace("_", " ")})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="lib-description">Description</Label>
                      <Textarea
                        id="lib-description"
                        value={libraryForm.description}
                        onChange={(e) => setLibraryForm({ ...libraryForm, description: e.target.value })}
                        placeholder="Brief description of the library"
                        rows={2}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="lib-status"
                        checked={libraryForm.status === "active"}
                        onCheckedChange={(checked) =>
                          setLibraryForm({ ...libraryForm, status: checked ? "active" : "inactive" })
                        }
                      />
                      <Label htmlFor="lib-status">Active</Label>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setLibraryDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSaveLibrary}>
                      {editingLibrary ? "Save Changes" : "Create Library"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search libraries..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Librarian</TableHead>
                      <TableHead>Capacity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLibraries.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No libraries found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredLibraries.map((library) => (
                        <TableRow key={library.id}>
                          <TableCell className="font-medium">{library.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{library.code}</Badge>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">{library.location}</TableCell>
                          <TableCell>{library.managerName || "-"}</TableCell>
                          <TableCell>{library.capacity || "-"}</TableCell>
                          <TableCell>
                            <Badge variant={library.status === "active" ? "default" : "secondary"}>
                              {library.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="icon" onClick={() => openEditLibrary(library)} disabled={isReadOnly}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="text-destructive" disabled={isReadOnly}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Library</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete "{library.name}"? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteLibrary(library)}
                                      className="bg-destructive text-destructive-foreground"
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
        </TabsContent>

        {/* Departments Tab */}
        <TabsContent value="departments">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Department Management</CardTitle>
                <CardDescription>Create and manage school departments</CardDescription>
              </div>
              <Dialog open={deptDialogOpen} onOpenChange={(open) => {
                setDeptDialogOpen(open);
                if (!open) resetDeptForm();
              }}>
                <DialogTrigger asChild>
                  <Button disabled={isReadOnly}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Department
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingDept ? "Edit Department" : "Create New Department"}</DialogTitle>
                    <DialogDescription>
                      {editingDept ? "Update department information" : "Add a new department"}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="dept-name">Department Name *</Label>
                        <Input
                          id="dept-name"
                          value={deptForm.name}
                          onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                          placeholder="e.g., Finance"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="dept-code">Department Code *</Label>
                        <Input
                          id="dept-code"
                          value={deptForm.code}
                          onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value.toUpperCase() })}
                          placeholder="e.g., FIN"
                        />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="dept-head">Department Head</Label>
                      <Select
                        value={deptForm.headId || "none"}
                        onValueChange={(value) => setDeptForm({ ...deptForm, headId: value === "none" ? "" : value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select department head" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No head assigned</SelectItem>
                          {activeManagers.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.name} ({user.role.replace("_", " ")})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="dept-description">Description</Label>
                      <Textarea
                        id="dept-description"
                        value={deptForm.description}
                        onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })}
                        placeholder="Brief description of the department"
                        rows={2}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="dept-status"
                        checked={deptForm.status === "active"}
                        onCheckedChange={(checked) =>
                          setDeptForm({ ...deptForm, status: checked ? "active" : "inactive" })
                        }
                      />
                      <Label htmlFor="dept-status">Active</Label>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDeptDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSaveDepartment}>
                      {editingDept ? "Save Changes" : "Create Department"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search departments..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Head</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDepartments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No departments found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredDepartments.map((dept) => (
                        <TableRow key={dept.id}>
                          <TableCell className="font-medium">{dept.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{dept.code}</Badge>
                          </TableCell>
                          <TableCell>{dept.headName || "-"}</TableCell>
                          <TableCell className="max-w-[200px] truncate">{dept.description || "-"}</TableCell>
                          <TableCell>
                            <Badge variant={dept.status === "active" ? "default" : "secondary"}>
                              {dept.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{format(dept.createdAt, "MMM d, yyyy")}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="icon" onClick={() => openEditDepartment(dept)} disabled={isReadOnly}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="text-destructive" disabled={isReadOnly}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Department</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete "{dept.name}"? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteDepartment(dept)}
                                      className="bg-destructive text-destructive-foreground"
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
        </TabsContent>

        {/* Streams Tab */}
        <TabsContent value="streams">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Stream Management</CardTitle>
                <CardDescription>Create and manage class streams</CardDescription>
              </div>
              <Dialog open={streamDialogOpen} onOpenChange={(open) => {
                setStreamDialogOpen(open);
                if (!open) resetStreamForm();
              }}>
                <DialogTrigger asChild>
                  <Button disabled={isReadOnly}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Stream
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingStream ? "Edit Stream" : "Create New Stream"}</DialogTitle>
                    <DialogDescription>
                      {editingStream ? "Update stream information" : "Add a new stream"}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="stream-name">Stream Name *</Label>
                        <Input
                          id="stream-name"
                          value={streamForm.name}
                          onChange={(e) => setStreamForm({ ...streamForm, name: e.target.value })}
                          placeholder="e.g., East"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="stream-code">Stream Code *</Label>
                        <Input
                          id="stream-code"
                          value={streamForm.code}
                          onChange={(e) => setStreamForm({ ...streamForm, code: e.target.value.toUpperCase() })}
                          placeholder="e.g., E"
                        />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="stream-description">Description</Label>
                      <Textarea
                        id="stream-description"
                        value={streamForm.description}
                        onChange={(e) => setStreamForm({ ...streamForm, description: e.target.value })}
                        placeholder="Brief description of the stream"
                        rows={2}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="stream-status"
                        checked={streamForm.status === "active"}
                        onCheckedChange={(checked) =>
                          setStreamForm({ ...streamForm, status: checked ? "active" : "inactive" })
                        }
                      />
                      <Label htmlFor="stream-status">Active</Label>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setStreamDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSaveStream}>
                      {editingStream ? "Save Changes" : "Create Stream"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search streams..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStreams.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No streams found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredStreams.map((stream) => (
                        <TableRow key={stream.id}>
                          <TableCell className="font-medium">{stream.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{stream.code}</Badge>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">{stream.description || "-"}</TableCell>
                          <TableCell>
                            <Badge variant={stream.status === "active" ? "default" : "secondary"}>
                              {stream.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{format(stream.createdAt, "MMM d, yyyy")}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="icon" onClick={() => openEditStream(stream)} disabled={isReadOnly}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="text-destructive" disabled={isReadOnly}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Stream</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete "{stream.name}"? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteStream(stream)}
                                      className="bg-destructive text-destructive-foreground"
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
        </TabsContent>

        {/* Inspection Committee Tab */}
        <TabsContent value="inspection">
          <InspectionCommitteeSetup />
        </TabsContent>

      </Tabs>
    </div>
  );
}
