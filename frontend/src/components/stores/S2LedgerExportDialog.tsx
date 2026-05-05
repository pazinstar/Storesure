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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileSpreadsheet, Printer } from "lucide-react";

export interface S2ExportFilters {
  store: string;
  storeLabel: string;
  dateFrom: string;
  dateTo: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stores: { value: string; label: string }[];
  onExportPDF: (filters: S2ExportFilters) => void;
  onExportExcel: (filters: S2ExportFilters) => void;
}

export function S2LedgerExportDialog({
  open,
  onOpenChange,
  stores,
  onExportPDF,
  onExportExcel,
}: Props) {
  const [store, setStore] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const rangeOk = dateFrom && dateTo && dateFrom <= dateTo;
  const isValid = !!store && !!rangeOk;

  const filters = (): S2ExportFilters => ({
    store,
    storeLabel: stores.find((s) => s.value === store)?.label || store,
    dateFrom,
    dateTo,
  });

  const handlePDF = () => {
    if (isValid) {
      onExportPDF(filters());
      onOpenChange(false);
    }
  };

  const handleExcel = () => {
    if (isValid) {
      onExportExcel(filters());
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Export S2 — Permanent &amp; Expendable Ledger</DialogTitle>
          <DialogDescription>
            Choose a store and a period, then export to PDF or Excel.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Store Location *</Label>
            <Select value={store} onValueChange={setStore}>
              <SelectTrigger>
                <SelectValue placeholder="Select store" />
              </SelectTrigger>
              <SelectContent>
                {stores.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Date From *</Label>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Date To *</Label>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
          </div>
          {dateFrom && dateTo && !rangeOk && (
            <p className="text-xs text-red-700">Date From must be on or before Date To.</p>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="outline" disabled={!isValid} onClick={handleExcel} className="gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Export Excel
          </Button>
          <Button disabled={!isValid} onClick={handlePDF} className="gap-2">
            <Printer className="h-4 w-4" />
            Export PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
