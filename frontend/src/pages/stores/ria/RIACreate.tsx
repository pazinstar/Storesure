import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { useRIA } from "@/contexts/RIAContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useNotifications } from "@/contexts/NotificationContext";
import { ItemCombobox, StoreItem } from "@/components/stores/ItemCombobox";

export default function RIACreate() {
  const { createDraft, submitForApproval } = useRIA();
  const { addNotification } = useNotifications();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    department: "",
    costCenter: "",
    officer: "",
    startDate: "",
    endDate: "",
    notes: "",
  });
  const [items, setItems] = useState<Array<{ itemCode: string; itemName: string; unit: string; approvedQty: number }>>(
    []
  );

  const { data: settings } = useQuery({ queryKey: ["inventory-settings"], queryFn: api.getInventorySettings });
  const { data: inventoryItems = [] } = useQuery({ queryKey: ["inventory"], queryFn: () => api.getInventory() });

  const receivingUnits = settings?.departmentLocations || [
    "Kitchen", "Science Lab", "Boarding", "Administration", "Sports", "Library", "Sanitation"
  ];
  const comboboxItems: StoreItem[] = inventoryItems.map(i => ({ code: String(i.id), description: i.name, unit: i.unit, assetType: "Consumable" as const }));

  const addItem = () => setItems(prev => [...prev, { itemCode: "", itemName: "", unit: "Unit", approvedQty: 0 }]);
  const removeItem = (idx: number) => setItems(prev => prev.filter((_, i) => i !== idx));
  const handleItemSelect = (idx: number, selected: StoreItem) => {
    setItems(prev => prev.map((p, i) => i === idx ? { ...p, itemCode: selected.code, itemName: selected.description, unit: selected.unit } : p));
  };

  const buildPayload = () => ({
    department: form.department || "Department",
    costCenter: form.costCenter || "COST-XX",
    responsibleOfficer: form.officer || "Officer",
    startDate: form.startDate || new Date().toISOString().slice(0, 10),
    endDate: form.endDate || new Date().toISOString().slice(0, 10),
    notes: form.notes,
    items: items.map((it) => ({ itemCode: it.itemCode, itemName: it.itemName, unit: it.unit, approvedQty: it.approvedQty, usedQty: 0 })),
  });

  const saveDraft = async () => {
    const draft = await createDraft(buildPayload());
    toast.success(`Draft created: ${draft.number}`);
    addNotification({ title: "RIA Draft Created", message: `${draft.number} for ${form.department}`, type: "info", link: `/stores/ria/view/${draft.id}` });
    navigate(`/stores/ria/view/${draft.id}`);
  };

  const submit = async () => {
    if (!form.department || items.length === 0) {
      toast.error("Fill required fields and add at least one item");
      return;
    }
    const draft = await createDraft(buildPayload());
    submitForApproval(draft.id);
    toast.success(`${draft.number} submitted for approval`);
    addNotification({ title: "RIA Submitted", message: `${draft.number} for ${form.department} submitted for approval`, type: "info", link: `/stores/ria/view/${draft.id}` });
    navigate(`/stores/ria/view/${draft.id}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Create RIA</h1>
          <p className="text-muted-foreground mt-1">Define period and approved items</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/stores/ria")}>
            Cancel
          </Button>
          <Button variant="secondary" onClick={saveDraft}>
            Save as Draft
          </Button>
          <Button onClick={submit}>Submit for Approval</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Basic Info</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Label>Period Start *</Label>
            <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Period End *</Label>
            <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Receiving Unit *</Label>
            <Select value={form.department} onValueChange={(v) => setForm({ ...form, department: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Select unit" />
              </SelectTrigger>
              <SelectContent>
                {receivingUnits.map((u) => (
                  <SelectItem key={u} value={u}>{u}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Cost Center</Label>
            <Input placeholder="e.g., BOARDING" value={form.costCenter} onChange={(e) => setForm({ ...form, costCenter: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Responsible Officer *</Label>
            <Input placeholder="Officer name" value={form.officer} onChange={(e) => setForm({ ...form, officer: e.target.value })} />
          </div>
          <div className="space-y-2 sm:col-span-2 lg:col-span-3">
            <Label>Notes</Label>
            <Textarea rows={3} placeholder="Additional details…" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Items</CardTitle>
            <Button size="sm" className="gap-2" onClick={addItem}>
              <Plus className="h-4 w-4" /> Add Item
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {items.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">Item</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Approved Qty</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((it, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <ItemCombobox
                        items={comboboxItems}
                        value={it.itemCode}
                        onSelect={(selected) => handleItemSelect(idx, selected)}
                        placeholder="Search item..."
                      />
                    </TableCell>
                    <TableCell>
                      <Input value={it.unit} readOnly className="w-20 bg-muted" />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        value={it.approvedQty}
                        onChange={(e) =>
                          setItems(prev => prev.map((p, i) => (i === idx ? { ...p, approvedQty: Number(e.target.value) } : p)))
                        }
                        className="w-24"
                      />
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => removeItem(idx)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="rounded-md border p-8 text-center text-muted-foreground">
              No items added yet — click "Add Item" to start
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
