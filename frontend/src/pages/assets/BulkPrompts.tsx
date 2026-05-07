import React, { useEffect, useState } from 'react';
import { assetsService } from '@/services/assets.service';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';

export default function BulkPrompts() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [createChildren, setCreateChildren] = useState(false);
  const [childTagPrefix, setChildTagPrefix] = useState('');
  const [groupName, setGroupName] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/storekeeper/stores/capitalization/prompts/pending/');
      const json = await res.json();
      // group by bulk_group_ref
      const groups: Record<string, any[]> = {};
      (json.results || []).forEach((p: any) => {
        const key = p.bulk_group_ref || 'NO-GROUP';
        groups[key] = groups[key] || [];
        groups[key].push(p);
      });
      const arr = Object.keys(groups).map(k => ({ group: k, items: groups[k], count: groups[k].length, total: groups[k].reduce((s:any,i:any)=>s+(i.total_value||0),0) }));
      setData(arr);
    } catch (e: any) {
      console.error(e);
    } finally { setLoading(false); }
  }

  async function approve(group: string) {
    try {
      const payload = { bulk_group_ref: group, approved_by: 'frontend', create_children: createChildren, child_tag_prefix: childTagPrefix, group_name: groupName };
      const res = await assetsService.processBulkPrompts(payload);
      toast.success('Bulk processed');
      load();
    } catch (e: any) {
      toast.error(String(e.message || e));
    }
  }

  return (
    <div>
      <h2 className="text-lg font-medium">Bulk Prompts</h2>
      <p className="text-sm text-muted-foreground">Review pending bulk capitalization prompts grouped by `bulk_group_ref`.</p>
      {loading ? <div>Loading...</div> : (
        <div className="mt-4">
          <div className="mb-2 flex items-center gap-2">
            <label className="flex items-center gap-2"><input type="checkbox" checked={createChildren} onChange={(e)=>setCreateChildren(e.target.checked)} /> Create children</label>
            <input placeholder="Child tag prefix" value={childTagPrefix} onChange={(e)=>setChildTagPrefix(e.target.value)} className="p-1 border" />
            <input placeholder="Group name" value={groupName} onChange={(e)=>setGroupName(e.target.value)} className="p-1 border" />
            <Button onClick={load}>Refresh</Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Group</TableHead>
                <TableHead>Count</TableHead>
                <TableHead>Total Value</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map(g => (
                <TableRow key={g.group}>
                  <TableCell>{g.group}</TableCell>
                  <TableCell>{g.count}</TableCell>
                  <TableCell>{g.total}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button onClick={() => approve(g.group)}>Approve & Create</Button>
                      <Button variant="ghost" onClick={() => setSelectedGroup(g.group)}>View</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {selectedGroup && (
            <div className="mt-4">
              <h3>Group: {selectedGroup}</h3>
              <pre className="p-2 border mt-2">Details can be viewed in the Prompts list.</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
