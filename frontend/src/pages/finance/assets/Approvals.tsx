import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { attachmentsService } from '@/services/attachments.service';

export default function FinAssetsApprovals() {
  const [prompts, setPrompts] = useState<any[]>([]);
  const [attachmentsMap, setAttachmentsMap] = useState<Record<string, any[]>>({});
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
      // fetch attachments for each prompt
      const map: Record<string, any[]> = {};
      await Promise.all((json.results || []).map(async (p: any) => {
        try {
          const aRes = await fetch(`/api/v1/messages/attachments/?entity_type=capitalization_prompt&entity_id=${p.id}`);
          if (!aRes.ok) return;
          const aj = await aRes.json();
          map[p.id] = aj.results || [];
        } catch (e) { map[p.id] = []; }
      }));
      setAttachmentsMap(map);
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
      // refresh attachments for this prompt
      const aRes = await fetch(`/api/v1/messages/attachments/?entity_type=capitalization_prompt&entity_id=${promptId}`);
      if (aRes.ok) {
        const aj = await aRes.json();
        setAttachmentsMap((m) => ({ ...m, [promptId]: aj.results || [] }));
      }
    } catch (e: any) {
      toast.error(String(e.message || e));
    } finally { setUploading(false); }
  }

  async function approve(promptId: string) {
    try {
      const payload = { approval_status: 'approved', approved_by: 'frontend_user' };
      const res = await fetch(`/api/v1/storekeeper/stores/capitalization/prompts/${promptId}/approve/`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || body?.detail || 'Approval failed');
      }
      toast.success('Approved');
      // mark prompt locally as approved
      setPrompts((ps) => ps.map((p:any)=>p.id===promptId?{...p, approval_status:'approved'}:p));
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
                  <TableCell>
                    <div className="flex flex-col">
                      <button className="text-blue-600 underline" onClick={() => setSelectedPrompt(p)}>{p.id}</button>
                      <small className="text-sm text-muted-foreground">{(attachmentsMap[p.id]||[]).length} attachments</small>
                    </div>
                  </TableCell>
                  <TableCell>{p.item_name}</TableCell>
                  <TableCell>{p.override_decision || p.suggested_action}</TableCell>
                  <TableCell>{p.quantity}</TableCell>
                  <TableCell>{p.total_value}</TableCell>
                  <TableCell>
                    <div className="flex gap-2 items-center">
                      <input type="file" onChange={(e)=>setSelectedFile(e.target.files?.[0]||null)} />
                      <Button onClick={() => handleUpload(p.id)} disabled={uploading}>{uploading? 'Uploading...' : 'Upload'}</Button>
                      <Button onClick={() => approve(p.id)} disabled={((attachmentsMap[p.id]||[]).length===0) || p.approval_status==='approved'}>Approve</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {selectedPrompt && (
            <div className="mt-4 p-3 border rounded">
              <h3 className="font-semibold">Prompt: {selectedPrompt.id}</h3>
              <p>Item: {selectedPrompt.item_name}</p>
              <p>Decision: {selectedPrompt.override_decision || selectedPrompt.suggested_action}</p>
              <p>Override by: {selectedPrompt.override_by || '-'}</p>
              <p>Override reason: {selectedPrompt.override_reason || '-'}</p>
              <p>Approval status: {selectedPrompt.approval_status}</p>
              <p>Approved by: {selectedPrompt.approved_by || '-'}</p>
              <p>Approved at: {selectedPrompt.approved_at || '-'}</p>
              <div className="mt-2">
                <h4 className="font-medium">Attachments</h4>
                <ul>
                  {(attachmentsMap[selectedPrompt.id]||[]).map((a:any)=> (
                        <li key={a.id} className="mb-2">
                          {a.url && (a.url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) ? (
                            <div className="flex items-center gap-2">
                              <img src={a.url} alt={a.file_path} className="h-20 w-auto border" />
                              <div>
                                <a className="text-blue-600 underline" href={a.url} target="_blank" rel="noreferrer">Preview</a>
                                {' — '}
                                <a className="text-blue-600 underline" href={a.url} download>Download</a>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <a className="text-blue-600 underline" href={a.url || `/media/${a.file_path}`} target="_blank" rel="noreferrer">{a.file_path}</a>
                              {' — '}{a.doc_type}
                            </div>
                          )}
                        </li>
                      ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
