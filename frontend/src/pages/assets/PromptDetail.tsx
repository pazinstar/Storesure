import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { listAttachments } from '@/services/attachments.service';

export default function PromptDetail() {
  const { id } = useParams();
  const [prompt, setPrompt] = useState<any | null>(null);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [attachmentsPage, setAttachmentsPage] = useState(1);
  const [attachmentsPageSize] = useState(10);
  const [attachmentsCount, setAttachmentsCount] = useState(0);
  const [audit, setAudit] = useState<any[]>([]);
  const [auditPage, setAuditPage] = useState(1);
  const [auditPageSize] = useState(10);
  const [auditCount, setAuditCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (id) load(); }, [id]);
  useEffect(() => { if (id) loadAttachments(); }, [id, attachmentsPage]);
  useEffect(() => { if (id) loadAudit(); }, [id, auditPage]);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/storekeeper/stores/capitalization/prompts/${id}/`);
      if (res.ok) {
        const j = await res.json(); setPrompt(j);
      }
      await loadAttachments();
      await loadAudit();
    } catch (e) {
      console.error(e);
    } finally { setLoading(false); }
  }

  async function loadAttachments() {
    try {
      const a = await listAttachments('capitalization_prompt', id || '', attachmentsPage, attachmentsPageSize);
      setAttachments(a.results || []);
      setAttachmentsCount(a.count || 0);
    } catch (e) { setAttachments([]); setAttachmentsCount(0); }
  }

  async function loadAudit() {
    try {
      const params = new URLSearchParams();
      params.set('entity', 'capitalization_prompt');
      params.set('entity_id', id || '');
      params.set('page', String(auditPage));
      params.set('page_size', String(auditPageSize));
      const ar = await fetch(`/api/v1/messages/audit/?${params.toString()}`);
      if (ar.ok) {
        const aj = await ar.json();
        setAudit(aj.results || []);
        setAuditCount(aj.count || 0);
      } else {
        setAudit([]); setAuditCount(0);
      }
    } catch (e) { setAudit([]); setAuditCount(0); }
  }

  if (!id) return <div>Prompt id missing</div>;
  return (
    <div>
      <h2 className="text-lg font-medium">Prompt Detail</h2>
      {loading && <div>Loading...</div>}
      {prompt && (
        <div className="mt-4 p-4 border rounded">
          <h3 className="font-semibold">{prompt.id} — {prompt.item_name}</h3>
          <p>Suggested action: {prompt.suggested_action}</p>
          <p>Suggested category: {prompt.suggested_category_type}</p>
          <p>Override decision: {prompt.override_decision || '-'}</p>
          <p>Override reason: {prompt.override_reason || '-'}</p>
          <p>Override by: {prompt.override_by || '-'}</p>
          <p>Approval status: {prompt.approval_status}</p>
          <p>Approved by: {prompt.approved_by || '-'}</p>
          <p>Approved at: {prompt.approved_at || '-'}</p>

          <div className="mt-4">
            <h4 className="font-medium">Attachments</h4>
            <div className="text-sm text-muted">{attachmentsCount} total</div>
            <ul>
              {attachments.map(a => (
                <li key={a.id} className="mb-2">
                  {a.url && (
                    (a.url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) ? (
                      <div className="flex items-center gap-2">
                        <img src={a.url} alt={a.file_path} className="h-24 w-auto border" />
                        <div>
                          <a className="text-blue-600 underline" href={a.url} target="_blank" rel="noreferrer">Preview</a>
                          {' — '}
                          <a className="text-blue-600 underline" href={a.url} download>Download</a>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <a className="text-blue-600 underline" href={a.url} target="_blank" rel="noreferrer">{a.file_path}</a>
                        {' — '}{a.doc_type}
                      </div>
                    )
                  )}
                  {!a.url && (
                    <div>
                      <a className="text-blue-600 underline" href={`/media/${a.file_path}`}>{a.file_path}</a>
                    </div>
                  )}
                </li>
              ))}
            </ul>

            <div className="flex items-center gap-2 mt-2">
              <Button disabled={attachmentsPage <= 1} onClick={() => setAttachmentsPage(p => Math.max(1, p - 1))}>Previous</Button>
              <div>Page {attachmentsPage} / {Math.max(1, Math.ceil(attachmentsCount / attachmentsPageSize))}</div>
              <Button disabled={attachmentsPage * attachmentsPageSize >= attachmentsCount} onClick={() => setAttachmentsPage(p => p + 1)}>Next</Button>
            </div>
          </div>

          <div className="mt-4">
            <h4 className="font-medium">Audit History</h4>
            <div className="text-sm text-muted">{auditCount} total</div>
            <ul>
              {audit.map(a => (
                <li key={a.id} className="mb-2">{a.timestamp} — {a.action} by {a.user_id} — {JSON.stringify(a.new_values)}</li>
              ))}
            </ul>

            <div className="flex items-center gap-2 mt-2">
              <Button disabled={auditPage <= 1} onClick={() => setAuditPage(p => Math.max(1, p - 1))}>Previous</Button>
              <div>Page {auditPage} / {Math.max(1, Math.ceil(auditCount / auditPageSize))}</div>
              <Button disabled={auditPage * auditPageSize >= auditCount} onClick={() => setAuditPage(p => p + 1)}>Next</Button>
            </div>
          </div>
        </div>
      )}
      <div className="mt-4">
        <Button onClick={load}>Refresh</Button>
      </div>
    </div>
  );
}
