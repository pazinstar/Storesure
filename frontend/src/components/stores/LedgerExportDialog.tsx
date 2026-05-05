import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileSpreadsheet, Printer } from "lucide-react";

export interface LedgerExportFilters {
  store: string;
  storeLabel: string;
  item: string;
  itemLabel: string;
  month: string;
  monthLabel: string;
}

interface LedgerExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stores: { value: string; label: string }[];
  items: { code: string; name: string }[];
  months: { value: string; label: string }[];
  onExportPDF: (filters: LedgerExportFilters) => void;
  onExportExcel: (filters: LedgerExportFilters) => void;
}

export function LedgerExportDialog({
  open,
  onOpenChange,
  stores,
  items,
  months,
  onExportPDF,
  onExportExcel,
}: LedgerExportDialogProps) {
  const [selectedStore, setSelectedStore] = useState("");
  const [selectedItem, setSelectedItem] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");

  const getFilters = (): LedgerExportFilters => ({
    store: selectedStore,
    storeLabel: stores.find((s) => s.value === selectedStore)?.label || "",
    item: selectedItem,
    itemLabel: items.find((i) => i.code === selectedItem)?.name || "",
    month: selectedMonth,
    monthLabel: months.find((m) => m.value === selectedMonth)?.label || "",
  });

  const isValid = selectedStore && selectedItem && selectedMonth;

  const handleExportPDF = () => {
    if (isValid) {
      onExportPDF(getFilters());
      onOpenChange(false);
    }
  };

  const handleExportExcel = () => {
    if (isValid) {
      onExportExcel(getFilters());
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Export Consumables Ledger</DialogTitle>
          <DialogDescription>
            Select parameters to generate the Receipt and Issues report
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Store Location *</Label>
            <Select value={selectedStore} onValueChange={setSelectedStore}>
              <SelectTrigger>
                <SelectValue placeholder="Select store" />
              </SelectTrigger>
              <SelectContent>
                {stores.map((store) => (
                  <SelectItem key={store.value} value={store.value}>
                    {store.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Item (Departmental Description) *</Label>
            <Select value={selectedItem} onValueChange={setSelectedItem}>
              <SelectTrigger>
                <SelectValue placeholder="Select item" />
              </SelectTrigger>
              <SelectContent>
                {items.map((item) => (
                  <SelectItem key={item.code} value={item.code}>
                    {item.name} ({item.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Period (Month) *</Label>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger>
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                {months.map((month) => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={handleExportExcel}
            disabled={!isValid}
            className="gap-2"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Export Excel
          </Button>
          <Button onClick={handleExportPDF} disabled={!isValid} className="gap-2">
            <Printer className="h-4 w-4" />
            Print / PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
