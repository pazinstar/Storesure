import { useState } from "react";
import { useClientSetup, availableModules, ClientSchool, SchoolModule, SchoolHeadteacher, SCHOOL_CATEGORIES, SchoolCategory } from "@/contexts/ClientSetupContext";
import { useAuditLog } from "@/hooks/useAuditLog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Building2, 
  Users, 
  Settings2, 
  Package,
  Eye,
  UserPlus,
  Shield,
  Calendar,
  Mail,
  Phone,
  Globe,
  MapPin,
  Boxes,
  CheckCircle2,
  XCircle,
} from "lucide-react";

export default function ClientSetup() {
  const { clientSchools, loading, addClientSchool, updateClientSchool, deleteClientSchool, updateSchoolModules, updateSchoolHeadteacher } = useClientSetup();
  const { logSystemAction } = useAuditLog();
  const { toast } = useToast();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isModulesDialogOpen, setIsModulesDialogOpen] = useState(false);
  const [isHeadteacherDialogOpen, setIsHeadteacherDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<ClientSchool | null>(null);
  const [editingModules, setEditingModules] = useState<SchoolModule[]>([]);

  const [formData, setFormData] = useState<{
    name: string;
    code: string;
    address: string;
    email: string;
    phone: string;
    website: string;
    type: 'primary' | 'secondary' | 'tertiary' | 'mixed';
    category: SchoolCategory;
    county: string;
    status: 'active' | 'inactive' | 'suspended';
    subscriptionPlan: 'basic' | 'standard' | 'premium';
    expiryDate: string;
  }>({
    name: "",
    code: "",
    address: "",
    email: "",
    phone: "",
    website: "",
    type: "secondary",
    category: "day",
    county: "",
    status: "active",
    subscriptionPlan: "standard",
    expiryDate: "",
  });

  const [headteacherForm, setHeadteacherForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });

  const resetForm = () => {
    setFormData({
      name: "",
      code: "",
      address: "",
      email: "",
      phone: "",
      website: "",
      type: "secondary",
      category: "day",
      county: "",
      status: "active",
      subscriptionPlan: "standard",
      expiryDate: "",
    });
  };

  const handleAddSchool = async () => {
    if (!formData.name || !formData.code || !formData.email) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const newModules = availableModules.map(m => ({
      ...m,
      enabled: false,
      links: m.links.map(l => ({ ...l, enabled: false }))
    }));

    try {
      await addClientSchool({ ...formData, modules: newModules });
      logSystemAction("School Created", `Created new school: ${formData.name}`);
      toast({ title: "School Created", description: `${formData.name} has been registered successfully` });
      resetForm();
      setIsAddDialogOpen(false);
    } catch {
      toast({ title: "Error", description: "Failed to register school", variant: "destructive" });
    }
  };

  const handleOpenModules = (school: ClientSchool) => {
    setSelectedSchool(school);
    setEditingModules(JSON.parse(JSON.stringify(school.modules)));
    setIsModulesDialogOpen(true);
  };

  const handleToggleModule = (moduleId: string) => {
    setEditingModules(prev => prev.map(m => {
      if (m.id === moduleId) {
        const newEnabled = !m.enabled;
        return {
          ...m,
          enabled: newEnabled,
          links: m.links.map(l => ({ ...l, enabled: newEnabled })),
        };
      }
      return m;
    }));
  };

  const handleToggleLink = (moduleId: string, linkId: string) => {
    setEditingModules(prev => prev.map(m => {
      if (m.id === moduleId) {
        return {
          ...m,
          links: m.links.map(l => 
            l.id === linkId ? { ...l, enabled: !l.enabled } : l
          ),
        };
      }
      return m;
    }));
  };

  const handleSaveModules = async () => {
    if (selectedSchool) {
      try {
        await updateSchoolModules(selectedSchool.id, editingModules);
        logSystemAction("Modules Updated", `Updated modules for: ${selectedSchool.name}`);
        toast({ title: "Modules Updated", description: "School modules have been updated successfully" });
        setIsModulesDialogOpen(false);
      } catch {
        toast({ title: "Error", description: "Failed to update modules", variant: "destructive" });
      }
    }
  };

  const handleOpenHeadteacher = (school: ClientSchool) => {
    setSelectedSchool(school);
    if (school.headteacher) {
      setHeadteacherForm({
        name: school.headteacher.name,
        email: school.headteacher.email,
        phone: school.headteacher.phone,
        password: "",
      });
    } else {
      setHeadteacherForm({ name: "", email: "", phone: "", password: "" });
    }
    setIsHeadteacherDialogOpen(true);
  };

  const handleSaveHeadteacher = async () => {
    if (!headteacherForm.name || !headteacherForm.email) {
      toast({ title: "Validation Error", description: "Please fill in name and email", variant: "destructive" });
      return;
    }

    if (selectedSchool) {
      const headteacher: SchoolHeadteacher = {
        id: selectedSchool.headteacher?.id || selectedSchool.id,
        name: headteacherForm.name,
        email: headteacherForm.email,
        phone: headteacherForm.phone,
        password: headteacherForm.password || undefined,
      };
      try {
        await updateSchoolHeadteacher(selectedSchool.id, headteacher);
        logSystemAction("Headteacher Updated", `Updated headteacher for: ${selectedSchool.name}`);
        toast({ title: "Headteacher Saved", description: `Headteacher for ${selectedSchool.name} has been saved` });
        setIsHeadteacherDialogOpen(false);
      } catch {
        toast({ title: "Error", description: "Failed to save headteacher", variant: "destructive" });
      }
    }
  };

  const handleViewSchool = (school: ClientSchool) => {
    setSelectedSchool(school);
    setIsViewDialogOpen(true);
  };

  const handleDeleteSchool = async (school: ClientSchool) => {
    if (confirm(`Are you sure you want to delete ${school.name}?`)) {
      try {
        await deleteClientSchool(school.id);
        logSystemAction("School Deleted", `Deleted school: ${school.name}`);
        toast({ title: "School Deleted", description: `${school.name} has been removed`, variant: "destructive" });
      } catch {
        toast({ title: "Error", description: "Failed to delete school", variant: "destructive" });
      }
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      active: "default",
      inactive: "secondary",
      suspended: "destructive",
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  const getPlanBadge = (plan: string) => {
    const colors: Record<string, string> = {
      basic: "bg-slate-100 text-slate-700",
      standard: "bg-blue-100 text-blue-700",
      premium: "bg-amber-100 text-amber-700",
    };
    return <Badge className={colors[plan]}>{plan}</Badge>;
  };

  const activeSchools = clientSchools.filter(s => s.status === "active").length;
  const totalModulesAssigned = clientSchools.reduce((acc, s) => 
    acc + s.modules.filter(m => m.enabled).length, 0
  );

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Client Setup</h1>
          <p className="text-muted-foreground">
            Manage schools, modules, and headteachers
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Register New School
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Register New School</DialogTitle>
              <DialogDescription>
                Add a new school to the system and configure its access
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">School Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Greenwood High School"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="code">School Code *</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="e.g., GHS001"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Full address"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">School Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: 'primary' | 'secondary' | 'tertiary' | 'mixed') =>
                      setFormData({ ...formData, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="primary">Primary</SelectItem>
                      <SelectItem value="secondary">Secondary</SelectItem>
                      <SelectItem value="tertiary">Tertiary</SelectItem>
                      <SelectItem value="mixed">Mixed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">School Category (FDSE)</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value: SchoolCategory) =>
                      setFormData({ ...formData, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SCHOOL_CATEGORIES.map(c => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="county">County</Label>
                  <Input
                    id="county"
                    value={formData.county}
                    onChange={(e) => setFormData({ ...formData, county: e.target.value })}
                    placeholder="e.g., Nairobi"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="admin@school.edu"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+254 700 000 000"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="www.school.edu"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: "active" | "inactive" | "suspended") => 
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="plan">Subscription Plan</Label>
                  <Select
                    value={formData.subscriptionPlan}
                    onValueChange={(value: "basic" | "standard" | "premium") => 
                      setFormData({ ...formData, subscriptionPlan: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Basic</SelectItem>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expiry">Subscription Expiry</Label>
                  <Input
                    id="expiry"
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddSchool}>Register School</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Schools</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clientSchools.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Schools</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeSchools}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Modules Assigned</CardTitle>
            <Boxes className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalModulesAssigned}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Available Modules</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{availableModules.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Schools Table */}
      <Card>
        <CardHeader>
          <CardTitle>Registered Schools</CardTitle>
          <CardDescription>
            Manage school subscriptions, modules, and administrators
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>School</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Modules</TableHead>
                <TableHead>Headteacher</TableHead>
                <TableHead>Expiry</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                    Loading schools...
                  </TableCell>
                </TableRow>
              ) : clientSchools.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                    No schools registered yet. Click "Register New School" to get started.
                  </TableCell>
                </TableRow>
              ) : null}
              {clientSchools.map((school) => (
                <TableRow key={school.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{school.name}</div>
                      <div className="text-sm text-muted-foreground">{school.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="text-sm bg-muted px-1.5 py-0.5 rounded">{school.code}</code>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {SCHOOL_CATEGORIES.find(c => c.value === school.category)?.label ?? 'N/A'}
                    </span>
                  </TableCell>
                  <TableCell>{getStatusBadge(school.status)}</TableCell>
                  <TableCell>{getPlanBadge(school.subscriptionPlan)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {school.modules.filter(m => m.enabled).length} / {school.modules.length}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {school.headteacher ? (
                      <div className="text-sm">
                        <div className="font-medium">{school.headteacher.name}</div>
                        <div className="text-muted-foreground">{school.headteacher.email}</div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">Not assigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{school.expiryDate || "N/A"}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleViewSchool(school)}
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenModules(school)}
                        title="Configure Modules"
                      >
                        <Settings2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenHeadteacher(school)}
                        title="Manage Headteacher"
                      >
                        <UserPlus className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteSchool(school)}
                        title="Delete School"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modules Configuration Dialog */}
      <Dialog open={isModulesDialogOpen} onOpenChange={setIsModulesDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Configure Modules - {selectedSchool?.name}</DialogTitle>
            <DialogDescription>
              Enable modules and select which features/links are accessible
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[50vh] pr-4">
            <Accordion type="multiple" className="w-full">
              {editingModules.map((module) => (
                <AccordionItem key={module.id} value={module.id}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={module.enabled}
                        onClick={(e) => e.stopPropagation()}
                        onCheckedChange={() => handleToggleModule(module.id)}
                      />
                      <span className={module.enabled ? "font-semibold" : "text-muted-foreground"}>
                        {module.name}
                      </span>
                      <Badge variant="outline" className="ml-2">
                        {module.links.filter(l => l.enabled).length} / {module.links.length} links
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="pl-12 space-y-2">
                      {module.links.map((link) => (
                        <div 
                          key={link.id} 
                          className="flex items-center gap-3 py-1.5 px-3 rounded-md hover:bg-muted/50"
                        >
                          <Checkbox
                            checked={link.enabled}
                            disabled={!module.enabled}
                            onCheckedChange={() => handleToggleLink(module.id, link.id)}
                          />
                          <span className={!module.enabled || !link.enabled ? "text-muted-foreground" : ""}>
                            {link.name}
                          </span>
                          <span className="text-xs text-muted-foreground ml-auto">
                            {link.href}
                          </span>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModulesDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveModules}>Save Modules</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Headteacher Dialog */}
      <Dialog open={isHeadteacherDialogOpen} onOpenChange={setIsHeadteacherDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedSchool?.headteacher ? "Edit" : "Create"} Headteacher - {selectedSchool?.name}
            </DialogTitle>
            <DialogDescription>
              Configure the headteacher account for this school
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="ht-name">Full Name *</Label>
              <Input
                id="ht-name"
                value={headteacherForm.name}
                onChange={(e) => setHeadteacherForm({ ...headteacherForm, name: e.target.value })}
                placeholder="Dr. Jane Mwangi"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ht-email">Email *</Label>
              <Input
                id="ht-email"
                type="email"
                value={headteacherForm.email}
                onChange={(e) => setHeadteacherForm({ ...headteacherForm, email: e.target.value })}
                placeholder="headteacher@school.edu"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ht-phone">Phone</Label>
              <Input
                id="ht-phone"
                value={headteacherForm.phone}
                onChange={(e) => setHeadteacherForm({ ...headteacherForm, phone: e.target.value })}
                placeholder="+254 700 000 000"
              />
            </div>
            <Separator />
            <div className="space-y-2">
              <Label htmlFor="ht-password">
                {selectedSchool?.headteacher ? "New Password (leave blank to keep current)" : "Initial Password *"}
              </Label>
              <Input
                id="ht-password"
                type="password"
                value={headteacherForm.password}
                onChange={(e) => setHeadteacherForm({ ...headteacherForm, password: e.target.value })}
                placeholder="Enter password"
              />
              <p className="text-xs text-muted-foreground">
                Password must be at least 8 characters
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsHeadteacherDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveHeadteacher}>
              <Shield className="mr-2 h-4 w-4" />
              Save Headteacher
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View School Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedSchool?.name}</DialogTitle>
            <DialogDescription>School details and configuration overview</DialogDescription>
          </DialogHeader>
          {selectedSchool && (
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="modules">Modules</TabsTrigger>
                <TabsTrigger value="admin">Administrator</TabsTrigger>
              </TabsList>
              <TabsContent value="details" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">School Code</Label>
                    <p className="font-medium">{selectedSchool.code}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Status</Label>
                    <p>{getStatusBadge(selectedSchool.status)}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">School Type</Label>
                    <p className="font-medium capitalize">{selectedSchool.type || "N/A"}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Category (FDSE)</Label>
                    <p className="font-medium">
                      {SCHOOL_CATEGORIES.find(c => c.value === selectedSchool.category)?.label ?? 'N/A'}
                    </p>
                  </div>
                  {selectedSchool.county && (
                    <div className="space-y-1">
                      <Label className="text-muted-foreground">County</Label>
                      <p className="font-medium">{selectedSchool.county}</p>
                    </div>
                  )}
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Email</Label>
                    <p className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      {selectedSchool.email}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Phone</Label>
                    <p className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      {selectedSchool.phone || "N/A"}
                    </p>
                  </div>
                  <div className="space-y-1 col-span-2">
                    <Label className="text-muted-foreground">Address</Label>
                    <p className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {selectedSchool.address || "N/A"}
                    </p>
                  </div>
                  {selectedSchool.website && (
                    <div className="space-y-1 col-span-2">
                      <Label className="text-muted-foreground">Website</Label>
                      <p className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        {selectedSchool.website}
                      </p>
                    </div>
                  )}
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Subscription Plan</Label>
                    <p>{getPlanBadge(selectedSchool.subscriptionPlan)}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Expiry Date</Label>
                    <p className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {selectedSchool.expiryDate || "N/A"}
                    </p>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="modules" className="space-y-4">
                <div className="grid gap-2">
                  {selectedSchool.modules.map((module) => (
                    <div 
                      key={module.id} 
                      className={`p-3 rounded-lg border ${module.enabled ? "bg-primary/5 border-primary/20" : "bg-muted/50"}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {module.enabled ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span className={module.enabled ? "font-medium" : "text-muted-foreground"}>
                            {module.name}
                          </span>
                        </div>
                        <Badge variant="outline">
                          {module.links.filter(l => l.enabled).length} links enabled
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="admin" className="space-y-4">
                {selectedSchool.headteacher ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="h-8 w-8 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{selectedSchool.headteacher.name}</h3>
                        <p className="text-muted-foreground">Headteacher</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-muted-foreground">Email</Label>
                        <p className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          {selectedSchool.headteacher.email}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-muted-foreground">Phone</Label>
                        <p className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          {selectedSchool.headteacher.phone || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No headteacher assigned yet</p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => {
                        setIsViewDialogOpen(false);
                        handleOpenHeadteacher(selectedSchool);
                      }}
                    >
                      <UserPlus className="mr-2 h-4 w-4" />
                      Assign Headteacher
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
