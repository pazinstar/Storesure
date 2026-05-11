import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export type AssetType = "Consumable" | "Expendable" | "Permanent" | "Fixed Asset";

export interface StoreItem {
  code: string;
  description: string;
  unit: string;
  assetType: AssetType;
  unitCost?: number | string;
}

interface ItemComboboxProps {
  items: StoreItem[];
  value: string;
  onSelect: (item: StoreItem) => void;
  placeholder?: string;
  onOpen?: () => void;
}

export function ItemCombobox({
  items,
  value,
  onSelect,
  placeholder = "Select item...",
  onOpen,
}: ItemComboboxProps) {
  const [open, setOpen] = useState(false);

  const handleOpenChange = (val: boolean) => {
    setOpen(val);
    if (val && onOpen) onOpen();
  };

  const selectedItem = items.find((item) => item.code === value);

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          <span className="truncate">
            {selectedItem
              ? `${selectedItem.code} - ${selectedItem.description}`
              : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search by code or description..." />
          <CommandList>
            <CommandEmpty>No item found.</CommandEmpty>
            <CommandGroup>
              {items.map((item) => (
                <CommandItem
                  key={item.code}
                  value={`${item.code} ${item.description}`}
                  onSelect={() => {
                    onSelect(item);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === item.code ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                    <span className="font-medium">{item.code}</span>
                    <span className="text-sm text-muted-foreground">
                      {item.description} ({item.unit})
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
