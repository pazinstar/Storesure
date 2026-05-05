import { apiConfig, delay, SIMULATE_DELAY } from "./config";
import {
    RetentionRecord, AppraisalWorkflow, DisposalRecord,
    MOCK_RETENTION_RECORDS, MOCK_APPRAISALS, MOCK_DISPOSALS,
    FileMovement, MOCK_FILE_MOVEMENTS, MOCK_FILE_MOVEMENTS_SETTINGS
} from "../mock/data";

export const recordsService = {
    // Retention
    async getRetentionRecords(): Promise<RetentionRecord[]> {
        if (apiConfig.useMockData) {
            await delay(SIMULATE_DELAY);
            return [...MOCK_RETENTION_RECORDS];
        }
        const response = await fetch(`${apiConfig.baseUrl}${apiConfig.storekeeperRoute}/records/retention`);
        if (!response.ok) throw new Error("Failed");
        const data = await response.json();
        return Array.isArray(data) ? data : (data?.results || []);
    },

    async createRetentionRecord(data: Omit<RetentionRecord, "id">): Promise<RetentionRecord> {
        if (apiConfig.useMockData) {
            await delay(SIMULATE_DELAY);
            return {
                ...data,
                id: `RET${String(MOCK_RETENTION_RECORDS.length + 1).padStart(3, "0")}`,
            };
        }
        const response = await fetch(`${apiConfig.baseUrl}${apiConfig.storekeeperRoute}/records/retention/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error("Failed");
        return response.json();
    },

    async updateRetentionRecord(id: string, updates: Partial<RetentionRecord>): Promise<RetentionRecord> {
        if (apiConfig.useMockData) {
            await delay(SIMULATE_DELAY);
            const record = MOCK_RETENTION_RECORDS.find(r => r.id === id);
            if (!record) throw new Error("Not found");
            return { ...record, ...updates };
        }
        const response = await fetch(`${apiConfig.baseUrl}${apiConfig.storekeeperRoute}/records/retention/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updates)
        });
        if (!response.ok) throw new Error("Failed");
        return response.json();
    },

    async deleteRetentionRecord(id: string): Promise<boolean> {
        if (apiConfig.useMockData) {
            await delay(SIMULATE_DELAY);
            return true;
        }
        const response = await fetch(`${apiConfig.baseUrl}${apiConfig.storekeeperRoute}/records/retention/${id}`, { method: "DELETE" });
        if (!response.ok) throw new Error("Failed");
        return true;
    },

    // Appraisals
    async getAppraisals(): Promise<AppraisalWorkflow[]> {
        if (apiConfig.useMockData) {
            await delay(SIMULATE_DELAY);
            return [...MOCK_APPRAISALS];
        }
        const response = await fetch(`${apiConfig.baseUrl}${apiConfig.storekeeperRoute}/records/retention/appraisals`);
        if (!response.ok) throw new Error("Failed");
        const data = await response.json();
        return Array.isArray(data) ? data : (data?.results || []);
    },

    async createAppraisal(data: Omit<AppraisalWorkflow, "id">): Promise<AppraisalWorkflow> {
        if (apiConfig.useMockData) {
            await delay(SIMULATE_DELAY);
            return {
                ...data,
                id: `APR${String(MOCK_APPRAISALS.length + 1).padStart(3, "0")}`,
            };
        }
        const response = await fetch(`${apiConfig.baseUrl}${apiConfig.storekeeperRoute}/records/retention/appraisals/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error("Failed");
        return response.json();
    },

    async updateAppraisal(id: string, updates: Partial<AppraisalWorkflow>): Promise<AppraisalWorkflow> {
        if (apiConfig.useMockData) {
            await delay(SIMULATE_DELAY);
            const appraisal = MOCK_APPRAISALS.find(a => a.id === id);
            if (!appraisal) throw new Error("Not found");
            return { ...appraisal, ...updates };
        }
        const response = await fetch(`${apiConfig.baseUrl}${apiConfig.storekeeperRoute}/records/retention/appraisals/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updates)
        });
        if (!response.ok) throw new Error("Failed");
        return response.json();
    },

    // Disposals
    async getDisposals(): Promise<DisposalRecord[]> {
        if (apiConfig.useMockData) {
            await delay(SIMULATE_DELAY);
            return [...MOCK_DISPOSALS];
        }
        const response = await fetch(`${apiConfig.baseUrl}${apiConfig.storekeeperRoute}/records/retention/disposals`);
        if (!response.ok) throw new Error("Failed");
        const data = await response.json();
        return Array.isArray(data) ? data : (data?.results || []);
    },

    async createDisposal(data: Omit<DisposalRecord, "id">): Promise<DisposalRecord> {
        if (apiConfig.useMockData) {
            await delay(SIMULATE_DELAY);
            return {
                ...data,
                id: `DSP${String(MOCK_DISPOSALS.length + 1).padStart(3, "0")}`,
            };
        }
        const response = await fetch(`${apiConfig.baseUrl}${apiConfig.storekeeperRoute}/records/retention/disposals/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error("Failed");
        return response.json();
    },

    // File Movements
    async getFileMovementSettings(): Promise<typeof MOCK_FILE_MOVEMENTS_SETTINGS> {
        if (apiConfig.useMockData) {
            await delay(SIMULATE_DELAY);
            return MOCK_FILE_MOVEMENTS_SETTINGS;
        }
        const response = await fetch(`${apiConfig.baseUrl}${apiConfig.storekeeperRoute}/records/movements/settings`);
        if (!response.ok) throw new Error("Failed connecting to settings");
        return response.json();
    },

    async getFileMovements(): Promise<FileMovement[]> {
        if (apiConfig.useMockData) {
            await delay(SIMULATE_DELAY);
            return [...MOCK_FILE_MOVEMENTS];
        }
        const response = await fetch(`${apiConfig.baseUrl}${apiConfig.storekeeperRoute}/records/movements/`);
        if (!response.ok) throw new Error("Failed");
        const data = await response.json();
        return Array.isArray(data) ? data : (data?.results || []);
    },

    async createFileMovement(data: Partial<FileMovement>): Promise<FileMovement> {
        if (apiConfig.useMockData) {
            await delay(SIMULATE_DELAY);
            const newMovement = {
                ...data,
                id: crypto.randomUUID(),
                status: "Checked Out",
                returnSignature: false,
            } as FileMovement;
            MOCK_FILE_MOVEMENTS.unshift(newMovement);
            return newMovement;
        }
        const response = await fetch(`${apiConfig.baseUrl}${apiConfig.storekeeperRoute}/records/movements/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error("Failed to create file movement");
        return response.json();
    },

    async updateFileMovement(id: string, updates: Partial<FileMovement>): Promise<FileMovement> {
        if (apiConfig.useMockData) {
            await delay(SIMULATE_DELAY);
            const index = MOCK_FILE_MOVEMENTS.findIndex(m => m.id === id);
            if (index !== -1) {
                MOCK_FILE_MOVEMENTS[index] = { ...MOCK_FILE_MOVEMENTS[index], ...updates };
                return MOCK_FILE_MOVEMENTS[index];
            }
            throw new Error("Movement not found");
        }
        const response = await fetch(`${apiConfig.baseUrl}${apiConfig.storekeeperRoute}/records/movements/${id}/`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updates)
        });
        if (!response.ok) throw new Error("Failed to update file movement");
        return response.json();
    }
};
