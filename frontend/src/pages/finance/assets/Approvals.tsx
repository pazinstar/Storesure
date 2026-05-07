import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { attachmentsService } from '@/services/attachments.service';

export default function FinAssetsApprovals() {
  const [prompts, setPrompts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/storekeeper/stores/capitalization/prompts/pending/');
      const json = await res.json();
      setPrompts(json.results || []);
    } catch (e: any) {
      console.error(e); toast.error('Failed to load prompts');
    } finally { setLoading(false); }
  }

  async function handleUpload(promptId: string) {
    if (!selectedFile) return toast.error('Select a file first');
    setUploading(true);
    try {
      await attachmentsService.uploadAttachment('capitalization_prompt', promptId, selectedFile, 'approval');
      toast.success('Attachment uploaded');
      setSelectedFile(null);
      await load();
    } catch (e: any) {
      toast.error(String(e.message || e));
    } finally { setUploading(false); }
  }

  async function approve(promptId: string) {
    try {
      const payload = { approval_status: 'approved', approved_by: 'frontend_user' };
      const res = await fetch(`/api/storekeeper/stores/capitalization/prompts/${promptId}/approve/`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || body?.detail || 'Approval failed');
      }
      toast.success('Approved');
      load();
    } catch (e: any) {
      toast.error(String(e.message || e));
    }
  }

  return (
    <div>
      <h2 className="text-lg font-medium">Capitalization Approvals</h2>
      <p className="text-sm text-muted-foreground">Review and approve pending capitalization override requests.</p>
      {loading ? <div>Loading...</div> : (
        <div className="mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Prompt</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Decision</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {prompts.map(p => (
                <TableRow key={p.id}>
                  <TableCell>{p.id}</TableCell>
                  <TableCell>{p.item_name}</TableCell>
                  <TableCell>{p.override_decision || p.suggested_action}</TableCell>
                  <TableCell>{p.quantity}</TableCell>
                  <TableCell>{p.total_value}</TableCell>
                  <TableCell>
                    <div className="flex gap-2 items-center">
                      <input type="file" onChange={(e)=>setSelectedFile(e.target.files?.[0]||null)} />
                      <Button onClick={() => handleUpload(p.id)} disabled={uploading}>{uploading? 'Uploading...' : 'Upload'}</Button>
                      <Button onClick={() => approve(p.id)}>Approve</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
