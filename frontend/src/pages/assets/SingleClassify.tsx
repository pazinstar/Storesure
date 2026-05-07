import React, { useState } from 'react';
import { assetsService } from '@/services/assets.service';

export default function SingleClassify() {
  const [itemId, setItemId] = useState('');
  const [qty, setQty] = useState(1);
  const [unitCost, setUnitCost] = useState('0');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const payload = { item_id: itemId, qty, unit_cost: unitCost };
      const res = await assetsService.classifyItem(payload);
      setResult(res);
    } catch (e: any) {
      setError(e.message || 'Failed to classify');
    }
    setLoading(false);
  };

  return (
    <div>
      <h2 className="text-lg font-medium">Classify Single Item</h2>
      <div className="grid grid-cols-3 gap-4 mt-4">
        <label>
          <div className="text-sm">Item ID</div>
          <input className="w-full mt-1 p-2 border" value={itemId} onChange={(e) => setItemId(e.target.value)} />
        </label>
        <label>
          <div className="text-sm">Quantity</div>
          <input type="number" className="w-full mt-1 p-2 border" value={qty} onChange={(e) => setQty(parseInt(e.target.value || '1'))} />
        </label>
        <label>
          <div className="text-sm">Unit Cost</div>
          <input className="w-full mt-1 p-2 border" value={unitCost} onChange={(e) => setUnitCost(e.target.value)} />
        </label>
      </div>
      <div className="mt-4">
        <button className="btn btn-primary" onClick={run} disabled={loading}>{loading ? 'Running...' : 'Run Classification'}</button>
      </div>
      {error && <div className="mt-2 text-red-600">{error}</div>}
      {result && (
        <pre className="mt-2 bg-slate-50 p-2 border">{JSON.stringify(result, null, 2)}</pre>
      )}
    </div>
  );
}
