import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Alert,
  AlertDescription,
} from "@/components/ui/alert";
import { Search, Plus, Filter, Download, Edit, Eye, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useReadOnlyGuard } from "@/hooks/useReadOnlyGuard";

// Asset classification types
type AssetType = "Consumable" | "Expendable" | "Permanent" | "Fixed Asset";

interface Item {
  id: string;
  name: string;
  category: string;
  assetType: AssetType;
  unit: string;
  minimumStockLevel: number;
  reorderLevel: number;
  openingBalance: number;
  expiryDate?: string;
  hasBeenUsed: boolean; // Track if item has been issued/received
  status: string;
  description?: string;
  locationType?: string;
  location?: string;
}

import { api } from "@/services/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function ItemMaster() {
  const { isReadOnly, blockAction } = useReadOnlyGuard();
  const queryClient = useQueryClient();

  const { data: initialItems = [] } = useQuery({
    queryKey: ['inventory-items'],
    queryFn: () => api.getInventory()
  });

  const { data: settings } = useQuery({
    queryKey: ['inventory-settings'],
    queryFn: () => api.getInventorySettings()
  });

  // Local state for UI mutations
  const [items, setItems] = useState<Item[]>([]);
  // Sync items when api fetches
  useEffect(() => {
    if (initialItems.length > 0 && items.length === 0) {
      setItems(initialItems);
    }
  }, [initialItems]);

  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");

  const categories = settings?.categories || ["All Categories"];
  const units = settings?.units || [];
  const locationTypes = settings?.locationTypes || [];
  const storeLocations = settings?.storeLocations || [];
  const libraryLocations = settings?.libraryLocations || [];
  const departmentLocations = settings?.departmentLocations || [];
  const assetTypes = settings?.assetTypes || [];

  // Dialog states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<"add" | "edit" | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    assetType: "" as AssetType | "",
    unit: "",
    minimumStockLevel: "",
    reorderLevel: "",
    openingBalance: "",
    expiryDate: "",
    description: "",
    locationType: "",
    location: "",
  });

  const getLocationOptions = (locationType: string): string[] => {
    switch (locationType) {
      case "Stores":
        return storeLocations;
      case "Library":
        return libraryLocations;
      case "Department":
        return departmentLocations;
      default:
        return [];
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      category: "",
      assetType: "",
      unit: "",
      minimumStockLevel: "",
      reorderLevel: "",
      openingBalance: "",
      expiryDate: "",
      description: "",
      locationType: "",
      location: "",
    });
  };

  const calculateStatus = (openingBalance: number, reorderLevel: number): string => {
    if (openingBalance <= reorderLevel * 0.3) return "Critical";
    if (openingBalance <= reorderLevel) return "Low Stock";
    return "In Stock";
  };

  const validateStockLevels = (): boolean => {
    const minLevel = parseInt(formData.minimumStockLevel) || 0;
    const reorderLevel = parseInt(formData.reorderLevel) || 0;

    if (minLevel >= reorderLevel && reorderLevel > 0) {
      toast.error("Minimum Stock Level must be less than Reorder Level");
      return false;
    }
    return true;
  };

  const handleAddClick = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();

    if (!formData.name || !formData.category || !formData.unit || !formData.assetType) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!validateStockLevels()) return;

    setPendingAction("add");
    setShowConfirmDialog(true);
  };

  const createItemMutation = useMutation({
    mutationFn: (newItem: Omit<Item, "id">) => api.createItem(newItem),
    onSuccess: (savedItem) => {
      setItems([savedItem, ...items]);
      queryClient.setQueryData(['inventory-items'], (oldData: any) => [savedItem, ...(oldData || [])]);
      toast.success("Item added successfully");
      setIsAddOpen(false);
      setShowConfirmDialog(false);
      setPendingAction(null);
      resetForm();
    },
    onError: () => {
      toast.error("Failed to add item. Check connection.");
      setShowConfirmDialog(false);
      setPendingAction(null);
    }
  });

  const handleAdd = () => {
    const openingBalance = parseInt(formData.openingBalance) || 0;
    const reorderLevel = parseInt(formData.reorderLevel) || 0;
    const minimumStockLevel = parseInt(formData.minimumStockLevel) || 0;

    const newItemPayload: Omit<Item, "id"> = {
      name: formData.name,
      category: formData.category,
      assetType: formData.assetType as AssetType,
      unit: formData.unit,
      minimumStockLevel: minimumStockLevel,
      reorderLevel: reorderLevel,
      openingBalance: openingBalance,
      expiryDate: formData.expiryDate || undefined,
      hasBeenUsed: false,
      status: calculateStatus(openingBalance, reorderLevel),
      description: formData.description,
      location: formData.location,
    };

    createItemMutation.mutate(newItemPayload);
  };

  const handleExport = async () => {
    try {
      toast.loading("Exporting inventory data...", { id: "export-inventory" });
      const blob = await api.exportInventory();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `inventory_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Export downloaded successfully", { id: "export-inventory" });
    } catch (error) {
      toast.error("Failed to export data", { id: "export-inventory" });
    }
  };

  const handleEditClick = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();

    if (!selectedItem) return;
    if (!formData.name || !formData.category || !formData.unit || !formData.assetType) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!validateStockLevels()) return;

    setPendingAction("edit");
    setShowConfirmDialog(true);
  };

  const handleEdit = () => {
    if (!selectedItem) return;

    const openingBalance = parseInt(formData.openingBalance) || 0;
    const reorderLevel = parseInt(formData.reorderLevel) || 0;
    const minimumStockLevel = parseInt(formData.minimumStockLevel) || 0;

    setItems(items.map(item =>
      item.id === selectedItem.id
        ? {
          ...item,
          name: formData.name,
          category: formData.category,
          assetType: formData.assetType as AssetType,
          unit: formData.unit,
          minimumStockLevel: minimumStockLevel,
          reorderLevel: reorderLevel,
          openingBalance: selectedItem.hasBeenUsed ? item.openingBalance : openingBalance,
          expiryDate: formData.expiryDate || undefined,
          status: calculateStatus(selectedItem.hasBeenUsed ? item.openingBalance : openingBalance, reorderLevel),
          description: formData.description,
          location: formData.location,
        }
        : item
    ));

    toast.success("Item updated successfully");
    setIsEditOpen(false);
    setShowConfirmDialog(false);
    setPendingAction(null);
    setSelectedItem(null);
    resetForm();
  };

  const openViewDialog = (item: Item) => {
    setSelectedItem(item);
    setIsViewOpen(true);
  };

  const openEditDialog = (item: Item) => {
    setSelectedItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      assetType: item.assetType,
      unit: item.unit,
      minimumStockLevel: String(item.minimumStockLevel),
      reorderLevel: String(item.reorderLevel),
      openingBalance: String(item.openingBalance),
      expiryDate: item.expiryDate || "",
      description: item.description || "",
      locationType: item.locationType || "",
      location: item.location || "",
    });
    setIsEditOpen(true);
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "All Categories" || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "In Stock":
        return <Badge className="bg-success/10 text-success border-success/20">In Stock</Badge>;
      case "Low Stock":
        return <Badge className="bg-warning/10 text-warning border-warning/20">Low Stock</Badge>;
      case "Critical":
        return <Badge variant="destructive">Critical</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getAssetTypeBadge = (assetType: AssetType) => {
    switch (assetType) {
      case "Consumable":
        return <Badge variant="outline" className="bg-info/10 text-info border-info/20">Consumable</Badge>;
      case "Permanent":
        return <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">Permanent</Badge>;
      case "Fixed Asset":
        return <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">Fixed Asset</Badge>;
      default:
        return <Badge variant="outline">{assetType}</Badge>;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="flex-1 space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Item Master</h1>
          <p className="text-muted-foreground mt-1">
            Manage all inventory items and their details
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={handleExport}>
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button
            className="gap-2"
            onClick={() => {
              if (blockAction("add items")) return;
              resetForm();
              setIsAddOpen(true);
            }}
            disabled={isReadOnly}
          >
            <Plus className="h-4 w-4" />
            Add Item
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Item Register</CardTitle>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-full sm:w-[250px]"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item Code</TableHead>
                  <TableHead>Item Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead className="text-right">Min Level</TableHead>
                  <TableHead className="text-right">Reorder Level</TableHead>
                  <TableHead className="text-right">Current Bal.</TableHead>
                  <TableHead>Expiry</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                      No items found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-sm">{item.id}</TableCell>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{getAssetTypeBadge(item.assetType)}</TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell>{item.unit}</TableCell>
                      <TableCell className="text-right">{item.minimumStockLevel}</TableCell>
                      <TableCell className="text-right">{item.reorderLevel}</TableCell>
                      <TableCell className="text-right font-semibold">{item.openingBalance}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(item.expiryDate)}</TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openViewDialog(item)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              if (blockAction("edit items")) return;
                              openEditDialog(item);
                            }}
                            disabled={isReadOnly}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
            <p>Showing {filteredItems.length} of {items.length} items</p>
          </div>
        </CardContent>
      </Card>

      {/* Add Item Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Item</DialogTitle>
            <DialogDescription>Add a new item to the inventory</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Item Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter item name"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category || "none"}
                  onValueChange={(value) => setFormData({ ...formData, category: value === "none" ? "" : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select category</SelectItem>
                    {categories.filter(c => c !== "All Categories").map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="assetType">Asset Type *</Label>
                <Select
                  value={formData.assetType || "none"}
                  onValueChange={(value) => setFormData({ ...formData, assetType: value === "none" ? "" : value as AssetType })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select type</SelectItem>
                    {assetTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="unit">Unit *</Label>
                <Select
                  value={formData.unit || "none"}
                  onValueChange={(value) => setFormData({ ...formData, unit: value === "none" ? "" : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select unit</SelectItem>
                    {units.map((unit) => (
                      <SelectItem key={unit} value={unit}>
                        {unit}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="openingBalance">Opening Balance</Label>
                <Input
                  id="openingBalance"
                  type="number"
                  value={formData.openingBalance}
                  onChange={(e) => setFormData({ ...formData, openingBalance: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="minimumStockLevel">Minimum Stock Level</Label>
                <Input
                  id="minimumStockLevel"
                  type="number"
                  value={formData.minimumStockLevel}
                  onChange={(e) => setFormData({ ...formData, minimumStockLevel: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="reorderLevel">Reorder Level</Label>
                <Input
                  id="reorderLevel"
                  type="number"
                  value={formData.reorderLevel}
                  onChange={(e) => setFormData({ ...formData, reorderLevel: e.target.value })}
                  placeholder="0"
                />
                {parseInt(formData.minimumStockLevel) >= parseInt(formData.reorderLevel) && parseInt(formData.reorderLevel) > 0 && (
                  <p className="text-xs text-destructive">Must be greater than minimum level</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="expiryDate">Expiry Date (Optional)</Label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="locationType">Location Type</Label>
                <Select
                  value={formData.locationType || "none"}
                  onValueChange={(value) => setFormData({ ...formData, locationType: value === "none" ? "" : value, location: "" })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select type</SelectItem>
                    {locationTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="location">Storage Location</Label>
                <Select
                  value={formData.location || "none"}
                  onValueChange={(value) => setFormData({ ...formData, location: value === "none" ? "" : value })}
                  disabled={!formData.locationType}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={formData.locationType ? "Select location" : "Select type first"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select location</SelectItem>
                    {getLocationOptions(formData.locationType).map((loc) => (
                      <SelectItem key={loc} value={loc}>
                        {loc}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the item"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={(e) => handleAddClick(e)}>Add Item</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Item Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Item Details</DialogTitle>
            <DialogDescription>View item information</DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Item Code</Label>
                  <p className="font-mono font-medium">{selectedItem.id}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedItem.status)}</div>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Item Name</Label>
                <p className="font-medium">{selectedItem.name}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Category</Label>
                  <p>{selectedItem.category}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Asset Type</Label>
                  <div className="mt-1">{getAssetTypeBadge(selectedItem.assetType)}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Unit</Label>
                  <p>{selectedItem.unit}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Opening Balance</Label>
                  <p className="font-semibold text-lg">{selectedItem.openingBalance}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Minimum Stock Level</Label>
                  <p>{selectedItem.minimumStockLevel}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Reorder Level</Label>
                  <p>{selectedItem.reorderLevel}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Expiry Date</Label>
                  <p>{formatDate(selectedItem.expiryDate)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Usage Status</Label>
                  <p>{selectedItem.hasBeenUsed ? "Has transactions" : "No transactions yet"}</p>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Storage Location</Label>
                <p>{selectedItem.location || "-"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Description</Label>
                <p>{selectedItem.description || "-"}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewOpen(false)}>
              Close
            </Button>
            <Button onClick={() => {
              setIsViewOpen(false);
              if (selectedItem) openEditDialog(selectedItem);
            }}>
              Edit Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Item Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Item</DialogTitle>
            <DialogDescription>Update item information</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {selectedItem?.hasBeenUsed && (
              <Alert className="border-warning/50 bg-warning/10">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <AlertDescription className="text-warning">
                  This item has transactions. Opening Balance cannot be modified.
                </AlertDescription>
              </Alert>
            )}
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Item Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-category">Category *</Label>
                <Select
                  value={formData.category || "none"}
                  onValueChange={(value) => setFormData({ ...formData, category: value === "none" ? "" : value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select category</SelectItem>
                    {categories.filter(c => c !== "All Categories").map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-assetType">Asset Type *</Label>
                <Select
                  value={formData.assetType || "none"}
                  onValueChange={(value) => setFormData({ ...formData, assetType: value === "none" ? "" : value as AssetType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select type</SelectItem>
                    {assetTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-unit">Unit *</Label>
                <Select
                  value={formData.unit || "none"}
                  onValueChange={(value) => setFormData({ ...formData, unit: value === "none" ? "" : value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select unit</SelectItem>
                    {units.map((unit) => (
                      <SelectItem key={unit} value={unit}>
                        {unit}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-openingBalance">Opening Balance</Label>
                <Input
                  id="edit-openingBalance"
                  type="number"
                  value={formData.openingBalance}
                  onChange={(e) => setFormData({ ...formData, openingBalance: e.target.value })}
                  disabled={selectedItem?.hasBeenUsed}
                  className={selectedItem?.hasBeenUsed ? "bg-muted cursor-not-allowed" : ""}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-minimumStockLevel">Minimum Stock Level</Label>
                <Input
                  id="edit-minimumStockLevel"
                  type="number"
                  value={formData.minimumStockLevel}
                  onChange={(e) => setFormData({ ...formData, minimumStockLevel: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-reorderLevel">Reorder Level</Label>
                <Input
                  id="edit-reorderLevel"
                  type="number"
                  value={formData.reorderLevel}
                  onChange={(e) => setFormData({ ...formData, reorderLevel: e.target.value })}
                />
                {parseInt(formData.minimumStockLevel) >= parseInt(formData.reorderLevel) && parseInt(formData.reorderLevel) > 0 && (
                  <p className="text-xs text-destructive">Must be greater than minimum level</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-expiryDate">Expiry Date (Optional)</Label>
                <Input
                  id="edit-expiryDate"
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-locationType">Location Type</Label>
                <Select
                  value={formData.locationType || "none"}
                  onValueChange={(value) => setFormData({ ...formData, locationType: value === "none" ? "" : value, location: "" })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select type</SelectItem>
                    {locationTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-location">Storage Location</Label>
                <Select
                  value={formData.location || "none"}
                  onValueChange={(value) => setFormData({ ...formData, location: value === "none" ? "" : value })}
                  disabled={!formData.locationType}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={formData.locationType ? "Select location" : "Select type first"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select location</SelectItem>
                    {getLocationOptions(formData.locationType).map((loc) => (
                      <SelectItem key={loc} value={loc}>
                        {loc}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={(e) => handleEditClick(e)}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog
        open={showConfirmDialog}
        onOpenChange={(open) => {
          if (!open) {
            // User closed without confirming - just close confirmation dialog
            setShowConfirmDialog(false);
            setPendingAction(null);
          }
        }}
      >
        <DialogContent className="max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Important Notice
            </DialogTitle>
            <DialogDescription>
              Please read before proceeding
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Alert className="border-warning/50 bg-warning/10">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <AlertDescription className="text-foreground">
                <strong>Opening Balance Lock:</strong> Once this item has been used in any transaction
                (received via GRN or issued via S13), the Opening Balance cannot be edited again.
                Please ensure the Opening Balance is correct before proceeding.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowConfirmDialog(false);
                setPendingAction(null);
              }}
            >
              Go Back
            </Button>
            <Button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (pendingAction === "add") {
                  handleAdd();
                } else if (pendingAction === "edit") {
                  handleEdit();
                }
              }}
            >
              I Understand, Proceed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
