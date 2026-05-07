import React, { useState } from 'react';
import { assetsService } from '@/services/assets.service';

export default function BulkCapitalization() {
  const [jsonText, setJsonText] = useState('');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setError(null);
    setResult(null);
    try {
      const items = JSON.parse(jsonText);
      const res = await assetsService.bulkClassify(items);
      setResult(res);
    } catch (e: any) {
      setError(e.message || 'Invalid input');
    }
  };

  return (
    <div>
      <h2 className="text-lg font-medium">Bulk Capitalization</h2>
      <p className="text-sm text-muted-foreground">Paste a JSON array of items: {"[{\"item_id\":\"id\",\"qty\":1,\"unit_cost\":100}]"}</p>
      <textarea value={jsonText} onChange={(e) => setJsonText(e.target.value)} className="w-full h-48 p-2 border mt-2" />
      <div className="mt-2 flex gap-2">
        <button className="btn btn-primary" onClick={run}>Run Bulk Classification</button>
      </div>
      {error && <div className="mt-2 text-red-600">{error}</div>}
      {result && (
        <pre className="mt-2 bg-slate-50 p-2 border">{JSON.stringify(result, null, 2)}</pre>
      )}
    </div>
  );
}
