import { apiConfig } from "./config";

export const attachmentsService = {
    async uploadAttachment(entityType: string, entityId: string, file: File, docType?: string) {
        if (!file) throw new Error("No file provided");
        const fd = new FormData();
        fd.append('entity_type', entityType);
        fd.append('entity_id', entityId);
        if (docType) fd.append('doc_type', docType);
        fd.append('file', file);

        const response = await fetch(`${apiConfig.baseUrl}/messages/attachments/`, {
            method: 'POST',
            body: fd,
        });

        if (!response.ok) {
            let body: any = {}
            try { body = await response.json(); } catch (e) { }
            const msg = body?.error || body?.detail || response.statusText;
            throw new Error(msg);
        }

        return response.json();
    }
}

export async function listAttachments(entityType: string, entityId: string, page = 1, page_size = 25) {
    const params = new URLSearchParams();
    params.set('entity_type', entityType);
    params.set('entity_id', entityId);
    params.set('page', String(page));
    params.set('page_size', String(page_size));
    const res = await fetch(`/api/v1/messages/attachments/?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to list attachments');
    return res.json();
}
