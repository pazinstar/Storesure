import { apiConfig, delay, SIMULATE_DELAY } from "./config";
import { RIARecord, MOCK_RIAS, RIAStatus } from "../mock/data";

export const riaService = {
    // Routine Issue Authorities (RIA)
    async getRIAs(): Promise<RIARecord[]> {
        if (apiConfig.useMockData) {
            await delay(SIMULATE_DELAY);
            return [...MOCK_RIAS];
        }
        const response = await fetch(`${apiConfig.baseUrl}${apiConfig.storekeeperRoute}/ria/`);
        if (!response.ok) {
            console.warn("RIA API failed, returning empty array:", response.status);
            return [];
        }
        const data = await response.json();
        return Array.isArray(data) ? data : (data?.results || []);
    },

    async createRIA(data: Partial<RIARecord>): Promise<RIARecord> {
        if (apiConfig.useMockData) {
            await delay(SIMULATE_DELAY);
            const draft: RIARecord = {
                id: crypto.randomUUID(),
                number: `RIA/${new Date().getFullYear()}/${String(MOCK_RIAS.length + 1).padStart(3, "0")}`,
                department: data.department || "Department",
                costCenter: data.costCenter || "COST-XX",
                responsibleOfficer: data.responsibleOfficer || "Officer",
                startDate: data.startDate || new Date().toISOString().slice(0, 10),
                endDate: data.endDate || new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().slice(0, 10),
                notes: data.notes || "",
                status: (data.status as RIAStatus) || "draft",
                items: data.items || [],
                createdAt: new Date().toISOString(),
            };
            MOCK_RIAS.unshift(draft);
            return draft;
        }
        const response = await fetch(`${apiConfig.baseUrl}${apiConfig.storekeeperRoute}/ria/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error("Failed to create RIA");
        return response.json();
    },

    async updateRIA(id: string, updates: Partial<RIARecord>): Promise<RIARecord> {
        if (apiConfig.useMockData) {
            await delay(SIMULATE_DELAY);
            const index = MOCK_RIAS.findIndex(r => r.id === id);
            if (index === -1) throw new Error("Not found");
            const updated = { ...MOCK_RIAS[index], ...updates };
            MOCK_RIAS[index] = updated;
            return updated;
        }
        const response = await fetch(`${apiConfig.baseUrl}${apiConfig.storekeeperRoute}/ria/${id}/`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updates),
        });
        if (!response.ok) throw new Error("Failed to update RIA");
        return response.json();
    },

    async deleteRIA(id: string): Promise<boolean> {
        if (apiConfig.useMockData) {
            await delay(SIMULATE_DELAY);
            return true;
        }
        const response = await fetch(`${apiConfig.baseUrl}${apiConfig.storekeeperRoute}/ria/${id}/`, {
            method: "DELETE",
        });
        if (!response.ok) throw new Error("Failed to delete RIA");
        return true;
    }
};
