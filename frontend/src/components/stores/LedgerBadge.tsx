import { Badge } from "@/components/ui/badge";
import type { AssetType } from "@/components/stores/ItemCombobox";

// Map item Asset Type → ledger that postings land in
export type LedgerCode = "S1" | "S2";

export function getLedgerForAssetType(assetType: AssetType | string | undefined | null): LedgerCode {
  if (assetType === "Permanent" || assetType === "Expendable" || assetType === "Fixed Asset") return "S2";
  return "S1";
}

const STYLES: Record<LedgerCode, string> = {
  S1: "bg-sky-100 text-sky-800 border-sky-200",
  S2: "bg-violet-100 text-violet-800 border-violet-200",
};

const LABELS: Record<LedgerCode, string> = {
  S1: "S1 — Consumables",
  S2: "S2 — Permanent / Expendable",
};

export function LedgerBadge({ assetType, className = "" }: { assetType: AssetType | string | undefined | null; className?: string }) {
  const ledger = getLedgerForAssetType(assetType);
  return (
    <Badge variant="outline" className={`${STYLES[ledger]} text-xs ${className}`}>
      Posts to {LABELS[ledger]}
    </Badge>
  );
}
