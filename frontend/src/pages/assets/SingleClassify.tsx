import React, { useState, useRef } from 'react';
import { assetsService } from '@/services/assets.service';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Play, RefreshCw, Clipboard } from 'lucide-react';
import { ItemCombobox, StoreItem } from '@/components/stores/ItemCombobox';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';

export default function SingleClassify() {
  const [itemId, setItemId] = useState('');
  const [qty, setQty] = useState<number>(1);
  const [unitCost, setUnitCost] = useState<string>('0');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setError(null);
    setResult(null);
    // basic validation
    if (!itemId.trim()) {
      setError('Enter an Item ID');
      return;
    }
    if (qty <= 0) {
      setError('Quantity must be at least 1');
      return;
    }
    const unitCostNum = parseFloat(unitCost || '0');
    if (isNaN(unitCostNum) || unitCostNum < 0) {
      setError('Enter a valid unit cost');
      return;
    }

    setLoading(true);
    try {
      const payload = { item_id: itemId.trim(), qty, unit_cost: unitCostNum };
      const res = await assetsService.classifyItem(payload);
      setResult(res);
      toast.success('Classification completed');
    } catch (e: any) {
      setError(e?.message || 'Failed to classify');
    }
    setLoading(false);
  };

  const reset = () => {
    setItemId('');
    setQty(1);
    setUnitCost('0');
    setResult(null);
    setError(null);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between w-full">
          <div>
            <CardTitle>Classify Single Item</CardTitle>
            <p className="text-sm text-muted-foreground">Quickly determine asset classification for a single item</p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={reset} title="Reset">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button onClick={run} disabled={loading}>
              <Play className="h-4 w-4 mr-2" />
              {loading ? 'Running...' : 'Run Classification'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
              <Label>Item</Label>
              {
                /* Fetch store items and pass to combobox */
              }
              {
                (() => {
                  const { data: storeItems = [], isLoading, refetch } = useQuery({ queryKey: ['store-items'], queryFn: api.getStoreItems, enabled: false });
                  const fetchedOnceRef = useRef(false);
                  const comboboxItems: StoreItem[] = (storeItems || []).map((i: any) => ({ code: String(i.id), description: i.name || i.description || i.label || '', unit: i.unit || i.uom || '', assetType: 'Consumable', unitCost: i.unitCost ?? i.unit_cost ?? i.cost ?? undefined }));
                  return (
                    <ItemCombobox
                      items={comboboxItems}
                      value={itemId}
                      onOpen={() => { if (!fetchedOnceRef.current) { refetch(); fetchedOnceRef.current = true; } }}
                      onSelect={(it: StoreItem) => {
                        setItemId(it.code);
                        if (it.unitCost !== undefined && it.unitCost !== null) {
                          setUnitCost(String(it.unitCost));
                        }
                      }}
                      placeholder={isLoading ? 'Loading items...' : 'Select item...'}
                    />
                  );
                })()
              }

              <Label>Quantity</Label>
              <Input type="number" min={1} value={qty} onChange={(e: any) => setQty(Math.max(1, parseInt(e.target.value || '1')))} />

              <Label>Unit Cost (KES)</Label>
              <Input value={unitCost} onChange={(e: any) => setUnitCost(e.target.value)} />
            </div>

          <div className="md:col-span-2">
            <Label>Result</Label>
            <div className="min-h-[160px] rounded border bg-white p-3">
              {error && <div className="text-destructive mb-2">{error}</div>}
              {!result && !error && <div className="text-muted-foreground">No result yet. Run classification to see output.</div>}
              {result && (
                <ResultView result={result} onCopy={() => {
                  // Create a friendly summary instead of raw JSON
                  const classification = result?.classification || result?.data || result;
                  const lines: string[] = [];
                  lines.push(`Status: ${result?.status || classification?.status || '-'} `);
                  lines.push(`Suggested Action: ${classification?.suggested_action || classification?.action || '-'} `);
                  lines.push(`Asset Class: ${classification?.category || classification?.asset_class || '-'} `);
                  lines.push(`Capitalizable: ${classification?.capitalizable == null ? '-' : classification?.capitalizable ? 'Yes' : 'No'}`);
                  lines.push(`Useful Life (months): ${classification?.useful_life || classification?.estimated_useful_life || '-'} `);
                  lines.push(`Confidence: ${classification?.confidence != null ? `${(classification.confidence * 100).toFixed(0)}%` : '-'}`);
                  navigator.clipboard?.writeText(lines.join('\n'));
                  toast.success('Summary copied to clipboard');
                }} />
              )}
            </div>
          </div>
        </div>

        <Separator className="my-4" />

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => { setResult(null); setError(null); }}>
            Clear Output
          </Button>
          <Button onClick={run} disabled={loading}>
            <Play className="h-4 w-4 mr-2" />Run
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function FieldRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="text-sm text-muted-foreground w-36">{label}</div>
      <div className="text-sm font-medium">{value ?? '-'}</div>
    </div>
  );
}

function ResultView({ result, onCopy }: { result: any; onCopy?: () => void }) {
  const classification = result?.classification || result?.data || result;
  const status = result?.status || result?.classification?.status || null;
  const suggested = classification?.suggested_action || classification?.action || classification?.recommendation || null;
  const category = classification?.category || classification?.asset_class || classification?.recommended_asset_class || null;
  const capitalizable = classification?.capitalizable ?? classification?.is_capitalizable ?? null;
  const usefulLife = classification?.useful_life || classification?.estimated_useful_life || null;
  const residual = classification?.residual_value_pct ?? classification?.residual_pct ?? null;
  const confidence = classification?.confidence ?? null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="font-medium">Classification Result</div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => { onCopy?.(); }}>
            <Clipboard className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <FieldRow label="Status" value={status ?? '—'} />
        <FieldRow label="Suggested Action" value={suggested ?? '—'} />
        <FieldRow label="Asset Class" value={category ?? '—'} />
        <FieldRow label="Capitalizable" value={capitalizable == null ? '—' : capitalizable ? 'Yes' : 'No'} />
        <FieldRow label="Useful Life (months)" value={usefulLife ?? '—'} />
        <FieldRow label="Residual %" value={residual != null ? `${residual}%` : '—'} />
        <FieldRow label="Confidence" value={confidence != null ? `${(confidence * 100).toFixed(0)}%` : '—'} />
      </div>

      {/* Raw JSON removed to present friendly fields by default */}
    </div>
  );
}
