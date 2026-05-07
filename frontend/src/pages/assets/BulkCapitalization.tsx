import React, { useState } from 'react';
import { assetsService } from '@/services/assets.service';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function BulkCapitalization() {
  const [jsonText, setJsonText] = useState('');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [createChildren, setCreateChildren] = useState(false);
  const [childTagPrefix, setChildTagPrefix] = useState('');
  const [groupName, setGroupName] = useState('');

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

  const createBulk = async () => {
    setError(null);
    setResult(null);
    try {
      const items = JSON.parse(jsonText);
      const res = await assetsService.createBulkPrompts({ items, created_by: 'frontend' });
      setResult(res);
      toast.success('Bulk prompts created');
    } catch (e: any) {
      setError(e.message || 'Failed to create bulk prompts');
    }
  };

  const processBulk = async () => {
    if (!result || !result.bulk_group_ref) return setError('No bulk_group_ref available');
    try {
      const payload = { bulk_group_ref: result.bulk_group_ref, approved_by: 'frontend', create_children: createChildren, child_tag_prefix: childTagPrefix, group_name: groupName };
      const res = await assetsService.processBulkPrompts(payload);
      setResult(res);
      toast.success('Bulk processed: assets created');
    } catch (e: any) {
      setError(e.message || 'Failed to process bulk prompts');
    }
  };

  return (
    <div>
      <h2 className="text-lg font-medium">Bulk Capitalization</h2>
      <p className="text-sm text-muted-foreground">Paste a JSON array of items: {"[{\"item_id\":\"id\",\"qty\":1,\"unit_cost\":100}]"}</p>
      <textarea value={jsonText} onChange={(e) => setJsonText(e.target.value)} className="w-full h-48 p-2 border mt-2" />
      <div className="mt-2 flex gap-2 items-center">
        <Button onClick={run}>Run Bulk Classification</Button>
        <Button variant="secondary" onClick={createBulk}>Create Bulk Prompt</Button>
        <Button variant="outline" onClick={processBulk}>Process Bulk (approve)</Button>
        <label className="ml-4 flex items-center gap-2">
          <input type="checkbox" checked={createChildren} onChange={(e) => setCreateChildren(e.target.checked)} /> Create children
        </label>
        <input placeholder="Child tag prefix" value={childTagPrefix} onChange={(e) => setChildTagPrefix(e.target.value)} className="ml-2 p-1 border" />
        <input placeholder="Group name (optional)" value={groupName} onChange={(e) => setGroupName(e.target.value)} className="ml-2 p-1 border" />
      </div>
      {error && <div className="mt-2 text-red-600">{error}</div>}
      {result && (
        <pre className="mt-2 bg-slate-50 p-2 border">{JSON.stringify(result, null, 2)}</pre>
      )}
    </div>
  );
}
