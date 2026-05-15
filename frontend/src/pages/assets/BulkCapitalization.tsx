import React, { useEffect, useState } from 'react';
import { assetsService } from '@/services/assets.service';
import { inventoryService } from '@/services/inventory.service';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Plus, Upload, Trash2 } from 'lucide-react';
import { ItemCombobox, StoreItem } from '@/components/stores/ItemCombobox';

interface RowItem {
  item_id: string;
  qty: number | '';
  unit_cost: number | '';
}

function parseCsv(text: string) {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length);
  if (!lines.length) return [];
  const first = lines[0];
  const hasHeader = first.includes(',') && /[a-zA-Z]/.test(first.split(',')[0]);
  let headers: string[] = [];
  let start = 0;
  if (hasHeader) {
    headers = first.split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase());
    start = 1;
  }
  const rows: any[] = [];
  for (let i = start; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
    if (hasHeader) {
      const obj: any = {};
      headers.forEach((h, idx) => obj[h] = cols[idx] ?? '');
      rows.push(obj);
    } else {
      // assume item_id,qty,unit_cost
      rows.push({ item_id: cols[0] ?? '', qty: cols[1] ?? '', unit_cost: cols[2] ?? '' });
    }
  }
  return rows;
}

export default function BulkCapitalization() {
  const [items, setItems] = useState<RowItem[]>([{ item_id: '', qty: '', unit_cost: '' }] as RowItem[]);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [createChildren, setCreateChildren] = useState(false);
  const [childTagPrefix, setChildTagPrefix] = useState('');
  const [groupName, setGroupName] = useState('');
  const [storeItems, setStoreItems] = useState<StoreItem[]>([]);
  const [csvPreview, setCsvPreview] = useState<any[] | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[] | null>(null);
  const [csvMapping, setCsvMapping] = useState<{ item_id?: string; qty?: string; unit_cost?: string }>({});
  const [validationIssues, setValidationIssues] = useState<string[] | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const raw = await inventoryService.getStoreItems();
        const mapped: StoreItem[] = (raw || []).map((i: any) => ({ code: String(i.id), description: i.name || i.description || '', unit: i.unit || i.uom || '', assetType: 'Consumable', unitCost: i.unitCost ?? i.unit_cost ?? i.cost ?? undefined }));
        if (mounted) setStoreItems(mapped);
      } catch (e) {
        // ignore
      }
    })();
    return () => { mounted = false };
  }, []);

  const updateRow = (index: number, patch: Partial<RowItem>) => {
    const next = [...items];
    next[index] = { ...next[index], ...patch } as RowItem;
    // autofill unit_cost when item_id corresponds to a known store item
    if (patch.item_id) {
      const found = storeItems.find(s => String(s.code) === String(patch.item_id));
      if (found && (!next[index].unit_cost || next[index].unit_cost === '')) {
        next[index].unit_cost = found.unitCost ?? '';
      }
    }
    setItems(next);
  };

  const addRow = () => setItems([...items, { item_id: '', qty: '', unit_cost: '' }]);
  const removeRow = (index: number) => setItems(items.filter((_, i) => i !== index));

  const normalizedItems = () => items
    .filter(r => r.item_id && r.qty !== '' && r.unit_cost !== '')
    .map(r => ({ item_id: r.item_id, qty: Number(r.qty), unit_cost: Number(r.unit_cost) }));

  const run = async () => {
    setError(null);
    setResult(null);
    // validate rows before submitting
    const issues = validateRows();
    if (issues.length) {
      setValidationIssues(issues);
      return;
    }
    try {
      const payload = normalizedItems();
      if (!payload.length) return setError('Please add at least one valid row');
      const res = await assetsService.bulkClassify(payload);
      setResult(res);
    } catch (e: any) {
      setError(e.message || 'Invalid input');
    }
  };

  const applyCsvMapping = () => {
    if (!csvPreview || !csvPreview.length) return setError('No CSV preview to map');
    const mapping = csvMapping;
    const rows = csvPreview.map(r => ({
      item_id: String(mapping.item_id ? (r[mapping.item_id] ?? '') : (r.item_id ?? r.code ?? r.item ?? '')),
      qty: mapping.qty ? Number(r[mapping.qty] ?? 0) : Number(r.qty ?? 0),
      unit_cost: mapping.unit_cost ? Number(r[mapping.unit_cost] ?? 0) : Number(r.unit_cost ?? r.cost ?? 0),
    }));
    const enriched = rows.map(row => {
      const it = storeItems.find(s => String(s.code) === String(row.item_id));
      return { item_id: row.item_id, qty: row.qty || '', unit_cost: (row.unit_cost || (it?.unitCost ?? '')) };
    });
    setItems(enriched.map(r => ({ item_id: r.item_id, qty: r.qty || '', unit_cost: r.unit_cost || '' })));
    setCsvPreview(null);
    setCsvHeaders(null);
    setCsvMapping({});
    toast.success('CSV mapping applied');
  };

  const inferMapping = (headers: string[]) => {
    const lower = headers.map(h => h.toLowerCase());
    const pick = (cands: string[]) => headers[lower.findIndex(h => cands.includes(h))] ?? headers[0];
    return {
      item_id: headers.find(h => ['item_id','item','code','sku'].includes(h.toLowerCase())) || headers[0],
      qty: headers.find(h => ['qty','quantity','qty.','amount'].includes(h.toLowerCase())) || headers[1] || headers[0],
      unit_cost: headers.find(h => ['unit_cost','unit cost','cost','price','unitprice'].includes(h.toLowerCase())) || headers[2] || headers[1] || headers[0],
    };
  };

  const createBulk = async () => {
    setError(null);
    setResult(null);
    const issues = validateRows();
    if (issues.length) {
      setValidationIssues(issues);
      return;
    }
    try {
      const payload = normalizedItems();
      if (!payload.length) return setError('Please add at least one valid row');
      const res = await assetsService.createBulkPrompts({ items: payload, created_by: 'frontend' });
      setResult(res);
      toast.success('Bulk prompts created');
    } catch (e: any) {
      setError(e.message || 'Failed to create bulk prompts');
    }
  };

  const processBulk = async () => {
    if (!result || !result.bulk_group_ref) return setError('No bulk_group_ref available');
    const issues = validateRows();
    if (issues.length) {
      setValidationIssues(issues);
      return;
    }
    try {
      const payload = { bulk_group_ref: result.bulk_group_ref, approved_by: 'frontend', create_children: createChildren, child_tag_prefix: childTagPrefix, group_name: groupName };
      const res = await assetsService.processBulkPrompts(payload);
      setResult(res);
      toast.success('Bulk processed: assets created');
    } catch (e: any) {
      setError(e.message || 'Failed to process bulk prompts');
    }
  };

  const validateRows = (): string[] => {
    const issues: string[] = [];
    if (!items || items.length === 0) {
      issues.push('No rows present');
      return issues;
    }
    items.forEach((r, idx) => {
      const row = idx + 1;
      if (!r.item_id || String(r.item_id).trim() === '') {
        issues.push(`Row ${row}: missing item code`);
      }
      const qty = Number(r.qty);
      if (r.qty === '' || isNaN(qty) || qty <= 0) {
        issues.push(`Row ${row}: quantity must be greater than 0`);
      }
      const cost = Number(r.unit_cost);
      if (r.unit_cost === '' || isNaN(cost) || cost <= 0) {
        issues.push(`Row ${row}: unit cost must be greater than 0`);
      }
      if (r.item_id && storeItems && !storeItems.find(s => String(s.code) === String(r.item_id))) {
        issues.push(`Row ${row}: unknown item code '${r.item_id}'`);
      }
    });
    return Array.from(new Set(issues));
  };

  return (
    <div>
      <h2 className="text-lg font-medium">Bulk Capitalization</h2>
      <p className="text-sm text-muted-foreground">Add rows for each candidate item to classify and group for capitalization.</p>

      <div className="mt-4 border rounded-md overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-2 text-left">Item Code / ID</th>
              <th className="p-2 text-right">Quantity</th>
              <th className="p-2 text-right">Unit Cost</th>
              <th className="p-2"> </th>
            </tr>
          </thead>
          <tbody>
            {items.map((r, i) => (
              <tr key={i} className="border-t">
                <td className="p-2">
                  <div className="w-full">
                    <ItemCombobox
                      items={storeItems}
                      value={r.item_id}
                      onSelect={(it) => {
                        updateRow(i, { item_id: it.code, unit_cost: it.unitCost ?? '' });
                      }}
                      placeholder="Search item code or name"
                    />
                  </div>
                  {r.item_id && !storeItems.find(s => String(s.code) === String(r.item_id)) && (
                    <div className="text-xs text-destructive mt-1">Unknown item code</div>
                  )}
                </td>
                <td className="p-2 w-32">
                  <input type="number" min={0} value={r.qty as any} onChange={(e) => updateRow(i, { qty: e.target.value === '' ? '' : Number(e.target.value) })} className="w-full p-1 border rounded text-right" />
                </td>
                <td className="p-2 w-40">
                  <input type="number" min={0} step="0.01" value={r.unit_cost as any} onChange={(e) => updateRow(i, { unit_cost: e.target.value === '' ? '' : Number(e.target.value) })} className="w-full p-1 border rounded text-right" />
                </td>
                <td className="p-2 text-center">
                  <Button size="sm" variant="destructive" onClick={() => removeRow(i)} className="flex items-center gap-2">
                    <Trash2 className="h-4 w-4" /> Remove
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex gap-2 items-center">
        <Button onClick={addRow}><Plus className="mr-2 h-4 w-4" />Add Row</Button>
        <Button onClick={run}>Run Bulk Classification</Button>
        <Button variant="secondary" onClick={createBulk}>Create Bulk Prompt</Button>
        <Button variant="outline" onClick={processBulk}>Process Bulk (approve)</Button>
        <label className="ml-2">
          <input type="file" accept="text/csv" onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            try {
              const t = await f.text();
              const parsed = parseCsv(t);
              if (parsed.length === 0) return toast.error('CSV empty');
              // detect headers
              const headers = Object.keys(parsed[0]);
              setCsvPreview(parsed.slice(0, 50));
              setCsvHeaders(headers);
              setCsvMapping(inferMapping(headers));
            } catch (err: any) {
              toast.error('Failed to parse CSV');
            }
            // reset input
            (e.target as HTMLInputElement).value = '';
          }} style={{ display: 'none' }} id="csvfile" />
          <Button asChild>
            <label htmlFor="csvfile" className="flex items-center gap-2 cursor-pointer"><Upload className="h-4 w-4" />Import CSV</label>
          </Button>
        </label>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={createChildren} onChange={(e) => setCreateChildren(e.target.checked)} /> Create children
        </label>
        <input placeholder="Child tag prefix" value={childTagPrefix} onChange={(e) => setChildTagPrefix(e.target.value)} className="p-1 border rounded" />
        <input placeholder="Group name (optional)" value={groupName} onChange={(e) => setGroupName(e.target.value)} className="p-1 border rounded" />
      </div>

      {csvPreview && csvHeaders && (
        <div className="mt-4 p-3 border rounded bg-white">
          <div className="flex items-center justify-between">
            <div className="font-medium">CSV Preview & Column Mapping</div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setCsvPreview(null); setCsvHeaders(null); setCsvMapping({}); }}>Cancel</Button>
              <Button onClick={applyCsvMapping}>Apply Mapping</Button>
            </div>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2">
            <div>
              <div className="text-xs text-muted-foreground">Map Item Code</div>
              <select value={csvMapping.item_id} onChange={(e) => setCsvMapping({ ...csvMapping, item_id: e.target.value })} className="w-full p-1 border rounded">
                {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Map Quantity</div>
              <select value={csvMapping.qty} onChange={(e) => setCsvMapping({ ...csvMapping, qty: e.target.value })} className="w-full p-1 border rounded">
                {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Map Unit Cost</div>
              <select value={csvMapping.unit_cost} onChange={(e) => setCsvMapping({ ...csvMapping, unit_cost: e.target.value })} className="w-full p-1 border rounded">
                {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
          </div>
          <div className="mt-3 overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50"><tr>{csvHeaders.map(h => <th key={h} className="p-2 text-left">{h}</th>)}</tr></thead>
              <tbody>
                {csvPreview.map((r, idx) => (
                  <tr key={idx} className="border-t">
                    {csvHeaders.map(h => <td key={h} className="p-2">{String(r[h] ?? '')}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {error && <div className="mt-2 text-red-600">{error}</div>}

      {validationIssues && validationIssues.length > 0 && (
        <div className="mt-3 p-3 border rounded bg-yellow-50">
          <div className="flex items-center justify-between">
            <div className="font-medium text-sm text-yellow-800">Validation issues ({validationIssues.length})</div>
            <div>
              <Button variant="ghost" size="sm" onClick={() => setValidationIssues(null)}>Dismiss</Button>
            </div>
          </div>
          <ul className="list-disc ml-5 mt-2 text-sm text-yellow-900">
            {validationIssues.slice(0, 50).map((m, i) => <li key={i}>{m}</li>)}
          </ul>
        </div>
      )}

      {result && (
        <div className="mt-4 p-3 border rounded bg-slate-50">
          <div className="font-medium">Result</div>
          {result.bulk_group_ref && <div className="text-sm">Group ref: <span className="font-mono">{result.bulk_group_ref}</span></div>}
          {typeof result.count !== 'undefined' && <div className="text-sm">Matched: {result.count}</div>}
          {result.created_assets && Array.isArray(result.created_assets) && (
            <div className="mt-2">
              <div className="text-sm font-medium">Created assets</div>
              <ul className="list-disc ml-5 text-sm">
                {result.created_assets.slice(0, 20).map((a: any, idx: number) => (
                  <li key={idx}>{a.assetCode || a.id || JSON.stringify(a)}</li>
                ))}
                {result.created_assets.length > 20 && <li className="text-muted-foreground">...and {result.created_assets.length - 20} more</li>}
              </ul>
            </div>
          )}
          {!result.created_assets && <pre className="mt-2 text-sm">{JSON.stringify(result, null, 2)}</pre>}
        </div>
      )}
    </div>
  );
}
