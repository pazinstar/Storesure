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
