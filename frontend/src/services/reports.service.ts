import { apiConfig, delay, SIMULATE_DELAY } from "./config";
import { KPICardData, ReportItem, ReportStat, MOCK_KPIS, MOCK_REPORTS, MOCK_QUICK_STATS, STORE_REPORTS_MOCK } from "../mock/data";

export const reportsService = {
    async getKPIs(role: string = "admin"): Promise<KPICardData[]> {
        if (apiConfig.useMockData) {
            await delay(SIMULATE_DELAY);
            return (MOCK_KPIS as any)[role] || MOCK_KPIS.admin;
        } else {
            const response = await fetch(`${apiConfig.baseUrl}/kpis?role=${role}`);
            if (!response.ok) throw new Error("Failed");
            return response.json();
        }
    },

    /**
     * Fetch Reports List
     */
    async getReports(): Promise<ReportItem[]> {
        if (apiConfig.useMockData) {
            await delay(SIMULATE_DELAY);
            return [...MOCK_REPORTS];
        } else {
            const response = await fetch(`${apiConfig.baseUrl}/reports`);
            if (!response.ok) throw new Error("Failed");
            return response.json();
        }
    },

    /**
     * Fetch Quick Stats for Reports Page
     */
    async getReportStats(): Promise<ReportStat[]> {
        if (apiConfig.useMockData) {
            await delay(SIMULATE_DELAY);
            return [...MOCK_QUICK_STATS];
        } else {
            const response = await fetch(`${apiConfig.baseUrl}/reports/stats`);
            if (!response.ok) throw new Error("Failed");
            return response.json();
        }
    },

    /**
     * Fetch Store Reports List
     */
    async getStoreReports() {
        if (apiConfig.useMockData) {
            await delay(SIMULATE_DELAY);
            return [...STORE_REPORTS_MOCK];
        } else {
            const response = await fetch(`${apiConfig.baseUrl}${apiConfig.storekeeperRoute}/reports`);
            if (!response.ok) throw new Error("Failed");
            const data = await response.json();
            return Array.isArray(data) ? data : (data?.results || []);
        }
    },

    /**
     * Export a specific report
     */
    async exportReport(reportId: number, params: any) {
        if (apiConfig.useMockData) {
            await delay(SIMULATE_DELAY);
            // Simulate blob return
            console.log(`Mock exporting report ${reportId} with params:`, params);
            return new Blob(["Mock CSV data"], { type: "text/csv" });
        } else {
            const queryParams = new URLSearchParams(params).toString();
            const response = await fetch(`${apiConfig.baseUrl}${apiConfig.storekeeperRoute}/reports/${reportId}/export?${queryParams}`, {
                method: "GET",
            });
            if (!response.ok) throw new Error("Failed to export report");
            return response.blob();
        }
    }
};
