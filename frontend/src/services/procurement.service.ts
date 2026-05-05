import { apiConfig, delay, SIMULATE_DELAY } from "./config";
import { Supplier, S12Requisition, LPO, DeliveryRecord, ProcurementDashboardData, PurchaseRequisition, Tender, Quotation, ProcurementReportMonthlySpend, ProcurementCategoryBreakdown, VendorPerformance, StandardReport, ProcurementType, ProcurementReference, Contract, ContractStatus, ContractType, PaymentMilestone, MOCK_SUPPLIERS, MOCK_REQUISITIONS, MOCK_LPOS, MOCK_DELIVERIES, MOCK_PROCUREMENT_KPIS, MOCK_MONTHLY_PROCUREMENT, MOCK_WORKFLOW_STATUS, MOCK_PENDING_APPROVALS, MOCK_PURCHASE_REQUISITIONS, MOCK_TENDERS, MOCK_QUOTATIONS, MOCK_REPORTS_MONTHLY_SPEND, MOCK_REPORTS_CATEGORY_BREAKDOWN, MOCK_REPORTS_VENDOR_PERFORMANCE, MOCK_REPORTS_STANDARD, MOCK_REPORTS_KPI, MOCK_PROCUREMENT_REFERENCES, MOCK_CONTRACTS } from "../mock/data";

export const procurementService = {
    // Suppliers
    async getSuppliers(): Promise<Supplier[]> {
        if (apiConfig.useMockData) {
            await delay(SIMULATE_DELAY);
            return [...MOCK_SUPPLIERS];
        }
        const response = await fetch(`${apiConfig.baseUrl}/procurement/suppliers/`);
        if (!response.ok) throw new Error("Failed to fetch suppliers");
        const data = await response.json();
        return Array.isArray(data) ? data : (data?.results || []);
    },

    async createSupplier(data: Omit<Supplier, "id" | "createdAt" | "updatedAt">): Promise<Supplier> {
        if (apiConfig.useMockData) {
            await delay(SIMULATE_DELAY);
            const now = new Date().toISOString();
            const newSupplier: Supplier = {
                ...data,
                id: `SUP${String(MOCK_SUPPLIERS.length + 1).padStart(3, "0")}`,
                createdAt: now,
                updatedAt: now,
            };
            MOCK_SUPPLIERS.unshift(newSupplier);
            return newSupplier;
        }
        const response = await fetch(`${apiConfig.baseUrl}/procurement/suppliers/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error("Failed to create supplier");
        return response.json();
    },

    async updateSupplier(id: string, updates: Partial<Omit<Supplier, "id" | "createdAt" | "updatedAt">>): Promise<Supplier> {
        if (apiConfig.useMockData) {
            await delay(SIMULATE_DELAY);
            const index = MOCK_SUPPLIERS.findIndex(s => s.id === id);
            if (index === -1) throw new Error("Supplier not found");
            const updated = { ...MOCK_SUPPLIERS[index], ...updates, updatedAt: new Date().toISOString() };
            MOCK_SUPPLIERS[index] = updated;
            return updated;
        }
        const response = await fetch(`${apiConfig.baseUrl}/procurement/suppliers/${id}/`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updates)
        });
        if (!response.ok) throw new Error("Failed to update supplier");
        return response.json();
    },

    async deleteSupplier(id: string): Promise<boolean> {
        if (apiConfig.useMockData) {
            await delay(SIMULATE_DELAY);
            const index = MOCK_SUPPLIERS.findIndex(s => s.id === id);
            if (index > -1) MOCK_SUPPLIERS.splice(index, 1);
            return true;
        }
        const response = await fetch(`${apiConfig.baseUrl}/procurement/suppliers/${id}/`, { method: "DELETE" });
        if (!response.ok) throw new Error("Failed to delete supplier");
        return true;
    },

    // Requisitions
    async getRequisitions(): Promise<S12Requisition[]> {
        if (apiConfig.useMockData) {
            await delay(SIMULATE_DELAY);
            return [...MOCK_REQUISITIONS];
        }
        const response = await fetch(`${apiConfig.baseUrl}/requisitions`);
        if (!response.ok) throw new Error("Failed");
        const data = await response.json();
        return Array.isArray(data) ? data : (data?.results || []);
    },

    async createRequisition(data: Omit<S12Requisition, "id">): Promise<S12Requisition> {
        if (apiConfig.useMockData) {
            await delay(SIMULATE_DELAY);
            return {
                ...data,
                id: `RQ${String(MOCK_REQUISITIONS.length + 1).padStart(3, "0")}`,
            };
        }
        const response = await fetch(`${apiConfig.baseUrl}/requisitions`, { method: "POST", body: JSON.stringify(data) });
        if (!response.ok) throw new Error("Failed");
        return response.json();
    },

    async updateRequisition(id: string, updates: Partial<S12Requisition>): Promise<S12Requisition> {
        if (apiConfig.useMockData) {
            await delay(SIMULATE_DELAY);
            const requisition = MOCK_REQUISITIONS.find(r => r.id === id);
            if (!requisition) throw new Error("Not found");
            return { ...requisition, ...updates };
        }
        const response = await fetch(`${apiConfig.baseUrl}/requisitions/${id}`, { method: "PATCH", body: JSON.stringify(updates) });
        if (!response.ok) throw new Error("Failed");
        return response.json();
    },

    async deleteRequisition(id: string): Promise<boolean> {
        if (apiConfig.useMockData) {
            await delay(SIMULATE_DELAY);
            return true;
        }
        const response = await fetch(`${apiConfig.baseUrl}/requisitions/${id}`, { method: "DELETE" });
        if (!response.ok) throw new Error("Failed");
        return true;
    },

    // Purchase Requisitions
    async getPurchaseRequisitions(): Promise<PurchaseRequisition[]> {
        if (apiConfig.useMockData) {
            await delay(SIMULATE_DELAY);
            return [...MOCK_PURCHASE_REQUISITIONS];
        }
        const response = await fetch(`${apiConfig.baseUrl}/procurement/purchase-requisitions/`);
        if (!response.ok) throw new Error("Failed");
        const data = await response.json();
        return Array.isArray(data) ? data : (data?.results || []);
    },

    async createPurchaseRequisition(data: Omit<PurchaseRequisition, "id">): Promise<PurchaseRequisition> {
        if (apiConfig.useMockData) {
            await delay(SIMULATE_DELAY);
            return {
                ...data,
                id: `REQ-2024-${String(MOCK_PURCHASE_REQUISITIONS.length + 1).padStart(3, "0")}`,
            };
        }
        const response = await fetch(`${apiConfig.baseUrl}/procurement/purchase-requisitions/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error("Failed");
        return response.json();
    },

    async updatePurchaseRequisition(id: string, updates: Partial<PurchaseRequisition>): Promise<PurchaseRequisition> {
        if (apiConfig.useMockData) {
            await delay(SIMULATE_DELAY);
            const req = MOCK_PURCHASE_REQUISITIONS.find(r => r.id === id);
            if (!req) throw new Error("Not found");
            return { ...req, ...updates };
        }
        const response = await fetch(`${apiConfig.baseUrl}/procurement/purchase-requisitions/${id}/`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updates)
        });
        if (!response.ok) throw new Error("Failed");
        return response.json();
    },

    // LPOs
    async getLPOs(): Promise<LPO[]> {
        if (apiConfig.useMockData) {
            await delay(SIMULATE_DELAY);
            return [...MOCK_LPOS];
        }
        const response = await fetch(`${apiConfig.baseUrl}/procurement/lpos/`);
        if (!response.ok) throw new Error("Failed");
        const data = await response.json();
        return Array.isArray(data) ? data : (data?.results || []);
    },

    async createLPO(data: Omit<LPO, "id">): Promise<LPO> {
        if (apiConfig.useMockData) {
            await delay(SIMULATE_DELAY);
            return {
                ...data,
                id: `LPO${String(MOCK_LPOS.length + 1).padStart(3, "0")}`,
            };
        }
        const response = await fetch(`${apiConfig.baseUrl}/procurement/lpos/`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
        if (!response.ok) throw new Error("Failed");
        return response.json();
    },

    async updateLPO(id: string, updates: Partial<LPO>): Promise<LPO> {
        if (apiConfig.useMockData) {
            await delay(SIMULATE_DELAY);
            const lpo = MOCK_LPOS.find(l => l.id === id);
            if (!lpo) throw new Error("Not found");
            return { ...lpo, ...updates };
        }
        const response = await fetch(`${apiConfig.baseUrl}/procurement/lpos/${id}/`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updates) });
        if (!response.ok) throw new Error("Failed");
        return response.json();
    },

    async deleteLPO(id: string): Promise<boolean> {
        if (apiConfig.useMockData) {
            await delay(SIMULATE_DELAY);
            return true;
        }
        const response = await fetch(`${apiConfig.baseUrl}/procurement/lpos/${id}/`, { method: "DELETE" });
        if (!response.ok) throw new Error("Failed");
        return true;
    },

    async getLPOStats(): Promise<{ total: number, pendingDelivery: number, pendingPayment: number, totalValue: number }> {
        if (apiConfig.useMockData) {
            await delay(SIMULATE_DELAY);
            return {
                total: MOCK_LPOS.length,
                pendingDelivery: MOCK_LPOS.filter(l => ["Approved", "Sent to Supplier", "Partially Delivered"].includes(l.status)).length,
                pendingPayment: MOCK_LPOS.filter(l => l.paymentStatus === "Pending" && l.status !== "Cancelled").length,
                totalValue: MOCK_LPOS.filter(l => l.status !== "Cancelled").reduce((sum, l) => sum + l.totalValue, 0),
            };
        }
        const response = await fetch(`${apiConfig.baseUrl}/procurement/lpos/stats/`);
        if (!response.ok) throw new Error("Failed");
        const data = await response.json();
        return data.results ? data.results : data;
    },

    // Deliveries

    async getProcurementDeliveries(): Promise<DeliveryRecord[]> {
        if (apiConfig.useMockData) {
            await delay(SIMULATE_DELAY);
            return [...MOCK_DELIVERIES];
        }
        const response = await fetch(`${apiConfig.baseUrl}${apiConfig.storekeeperRoute}/deliveries/`);
        if (!response.ok) {
            console.warn("Deliveries API failed, returning empty array:", response.status);
            return [];
        }
        const data = await response.json();
        return Array.isArray(data) ? data : (data?.results || []);
    },

    async createProcurementDelivery(data: Omit<DeliveryRecord, "id">): Promise<DeliveryRecord> {
        if (apiConfig.useMockData) {
            await delay(SIMULATE_DELAY);
            return {
                ...data,
                id: `DEL${String(MOCK_DELIVERIES.length + 1).padStart(3, "0")}`,
            };
        }
        const response = await fetch(`${apiConfig.baseUrl}${apiConfig.storekeeperRoute}/deliveries/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error("Failed to create delivery");
        return response.json();
    },

    async updateProcurementDelivery(id: string, updates: Partial<DeliveryRecord>): Promise<DeliveryRecord> {
        if (apiConfig.useMockData) {
            await delay(SIMULATE_DELAY);
            const delivery = MOCK_DELIVERIES.find(d => d.id === id);
            if (!delivery) throw new Error("Not found");
            return { ...delivery, ...updates };
        }
        const response = await fetch(`${apiConfig.baseUrl}${apiConfig.storekeeperRoute}/deliveries/${id}/`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updates)
        });
        if (!response.ok) throw new Error("Failed to update delivery");
        return response.json();
    },

    async deleteProcurementDelivery(id: string): Promise<boolean> {
        if (apiConfig.useMockData) {
            await delay(SIMULATE_DELAY);
            return true;
        }
        const response = await fetch(`${apiConfig.baseUrl}/deliveries/${id}`, { method: "DELETE" });
        if (!response.ok) throw new Error("Failed");
        return true;
    },

    // Dashboard
    async getDashboardData(): Promise<ProcurementDashboardData> {
        if (apiConfig.useMockData) {
            await delay(SIMULATE_DELAY);
            return {
                kpis: [...MOCK_PROCUREMENT_KPIS],
                monthlyProcurement: [...MOCK_MONTHLY_PROCUREMENT],
                workflowStatus: [...MOCK_WORKFLOW_STATUS],
                pendingApprovals: [...MOCK_PENDING_APPROVALS]
            };
        }
        const response = await fetch(`${apiConfig.baseUrl}/procurement/dashboard/`);
        if (!response.ok) throw new Error("Failed");
        return response.json();
    },

    // Tenders
    async getTenders(): Promise<Tender[]> {
        if (apiConfig.useMockData) {
            await delay(SIMULATE_DELAY);
            return [...MOCK_TENDERS];
        }
        const response = await fetch(`${apiConfig.baseUrl}/procurement/tenders/`);
        if (!response.ok) throw new Error("Failed");
        const data = await response.json();
        return Array.isArray(data) ? data : (data?.results || []);
    },

    async createTender(data: Omit<Tender, "id" | "bids" | "daysLeft" | "status">): Promise<Tender> {
        if (apiConfig.useMockData) {
            await delay(SIMULATE_DELAY);
            return {
                ...data,
                id: `TND-2024-${String(MOCK_TENDERS.length + 1).padStart(3, "0")}`,
                bids: 0,
                daysLeft: 14,
                status: "open"
            };
        }
        const response = await fetch(`${apiConfig.baseUrl}/procurement/tenders/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error("Failed");
        return response.json();
    },

    // Quotations
    async getQuotations(): Promise<Quotation[]> {
        if (apiConfig.useMockData) {
            await delay(SIMULATE_DELAY);
            return [...MOCK_QUOTATIONS];
        }
        const response = await fetch(`${apiConfig.baseUrl}/procurement/quotations/`);
        if (!response.ok) throw new Error("Failed");
        const data = await response.json();
        return Array.isArray(data) ? data : (data?.results || []);
    },

    async createQuotation(data: Omit<Quotation, "id" | "status">): Promise<Quotation> {
        if (apiConfig.useMockData) {
            await delay(SIMULATE_DELAY);
            return {
                ...data,
                id: `RFQ-2024-${String(MOCK_QUOTATIONS.length + 101).padStart(3, "0")}`,
                status: "pending_review"
            };
        }
        const response = await fetch(`${apiConfig.baseUrl}/procurement/quotations/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error("Failed");
        return response.json();
    },

    // Reports
    async getReportsKPIs(): Promise<any> {
        if (apiConfig.useMockData) {
            await delay(SIMULATE_DELAY);
            return MOCK_REPORTS_KPI;
        }
        const response = await fetch(`${apiConfig.baseUrl}/procurement/reports/kpis`);
        if (!response.ok) throw new Error("Failed");
        return response.json();
    },

    async getReportsMonthlySpend(): Promise<ProcurementReportMonthlySpend[]> {
        if (apiConfig.useMockData) {
            await delay(SIMULATE_DELAY);
            return [...MOCK_REPORTS_MONTHLY_SPEND];
        }
        const response = await fetch(`${apiConfig.baseUrl}/procurement/reports/monthly-spend`);
        if (!response.ok) throw new Error("Failed");
        const data = await response.json();
        return Array.isArray(data) ? data : (data?.results || []);
    },

    async getReportsCategoryBreakdown(): Promise<ProcurementCategoryBreakdown[]> {
        if (apiConfig.useMockData) {
            await delay(SIMULATE_DELAY);
            return [...MOCK_REPORTS_CATEGORY_BREAKDOWN];
        }
        const response = await fetch(`${apiConfig.baseUrl}/procurement/reports/category-breakdown`);
        if (!response.ok) throw new Error("Failed");
        const data = await response.json();
        return Array.isArray(data) ? data : (data?.results || []);
    },

    async getReportsVendorPerformance(): Promise<VendorPerformance[]> {
        if (apiConfig.useMockData) {
            await delay(SIMULATE_DELAY);
            return [...MOCK_REPORTS_VENDOR_PERFORMANCE];
        }
        const response = await fetch(`${apiConfig.baseUrl}/procurement/reports/vendor-performance`);
        if (!response.ok) throw new Error("Failed");
        const data = await response.json();
        return Array.isArray(data) ? data : (data?.results || []);
    },

    async getReportsStandard(): Promise<StandardReport[]> {
        if (apiConfig.useMockData) {
            await delay(SIMULATE_DELAY);
            return [...MOCK_REPORTS_STANDARD];
        }
        const response = await fetch(`${apiConfig.baseUrl}/procurement/reports/standard-reports`);
        if (!response.ok) throw new Error("Failed");
        const data = await response.json();
        return Array.isArray(data) ? data : (data?.results || []);
    },

    async generateReport(type: string, dateRange: string, format: string): Promise<{ url: string }> {
        if (apiConfig.useMockData) {
            await delay(SIMULATE_DELAY);
            return { url: `/downloads/report_${type}_${dateRange}.${format === 'excel' ? 'xlsx' : format}` };
        }

        const params = new URLSearchParams({ type, dateRange, format });
        const response = await fetch(`${apiConfig.baseUrl}/procurement/reports/generate?${params.toString()}`, { method: "POST" });
        if (!response.ok) throw new Error("Failed to generate report");
        return response.json();
    },

    // Procurement References
    async getProcurementReferences(): Promise<ProcurementReference[]> {
        if (apiConfig.useMockData) {
            await delay(SIMULATE_DELAY);
            return [...MOCK_PROCUREMENT_REFERENCES];
        }
        const response = await fetch(`${apiConfig.baseUrl}/procurement/references`);
        if (!response.ok) throw new Error("Failed");
        const data = await response.json();
        return Array.isArray(data) ? data : (data?.results || []);
    },

    async generateProcurementReference(data: {
        entityCode: string;
        procurementType: ProcurementType;
        description: string;
        department: string;
        requestedBy: string;
    }): Promise<ProcurementReference> {
        if (apiConfig.useMockData) {
            await delay(SIMULATE_DELAY);

            // Logic for getting budget year
            const now = new Date();
            const year = now.getFullYear();
            const month = now.getMonth();
            let budgetYear = "";
            if (month >= 6) {
                budgetYear = `${year.toString().slice(-2)}/${(year + 1).toString().slice(-2)}`;
            } else {
                budgetYear = `${(year - 1).toString().slice(-2)}/${year.toString().slice(-2)}`;
            }

            // Logic for serial number
            const matchingRefs = MOCK_PROCUREMENT_REFERENCES.filter(
                (ref) =>
                    ref.entityCode === data.entityCode &&
                    ref.procurementType === data.procurementType &&
                    ref.budgetYear === budgetYear
            );
            const serialNumber = matchingRefs.length === 0 ? 1 : Math.max(...matchingRefs.map((ref) => ref.serialNumber)) + 1;

            const getTypeAbbreviation = (type: ProcurementType): string => {
                switch (type) {
                    case "Works": return "Wrks";
                    case "Services": return "Srvcs";
                    case "Supplies": return "Suppls";
                }
            };
            const typeAbbr = getTypeAbbreviation(data.procurementType);
            const serialFormatted = serialNumber.toString().padStart(5, "0");

            const referenceNumber = `${data.entityCode}/${typeAbbr}/${budgetYear}/${serialFormatted}`;

            const newReference: ProcurementReference = {
                id: crypto.randomUUID(),
                referenceNumber,
                entityCode: data.entityCode,
                procurementType: data.procurementType,
                budgetYear,
                serialNumber,
                description: data.description,
                department: data.department,
                requestedBy: data.requestedBy,
                issuedDate: new Date().toISOString(),
                status: "Active",
            };
            MOCK_PROCUREMENT_REFERENCES.unshift(newReference);
            return newReference;
        }

        const response = await fetch(`${apiConfig.baseUrl}/procurement/references`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error("Failed to generate reference");
        return response.json();
    },

    async updateProcurementReferenceStatus(id: string, status: ProcurementReference["status"]): Promise<ProcurementReference> {
        if (apiConfig.useMockData) {
            await delay(SIMULATE_DELAY);
            const refIndex = MOCK_PROCUREMENT_REFERENCES.findIndex(r => r.id === id);
            if (refIndex === -1) throw new Error("Reference not found");
            MOCK_PROCUREMENT_REFERENCES[refIndex] = { ...MOCK_PROCUREMENT_REFERENCES[refIndex], status };
            return MOCK_PROCUREMENT_REFERENCES[refIndex];
        }
        const response = await fetch(`${apiConfig.baseUrl}/procurement/references/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status })
        });
        if (!response.ok) throw new Error("Failed to update status");
        return response.json();
    },

    async clearProcurementReferences(): Promise<boolean> {
        if (apiConfig.useMockData) {
            await delay(SIMULATE_DELAY);
            MOCK_PROCUREMENT_REFERENCES.length = 0; // Clear the array
            return true;
        }
        const response = await fetch(`${apiConfig.baseUrl}/procurement/references/clear`, { method: "DELETE" });
        if (!response.ok) throw new Error("Failed to clear references");
        return true;
    },

    // Contracts
    async getContracts(): Promise<Contract[]> {
        if (apiConfig.useMockData) {
            await delay(SIMULATE_DELAY);
            // Auto update payment milestone status on load for mocks
            const updated = MOCK_CONTRACTS.map((contract) => ({
                ...contract,
                paymentMilestones: contract.paymentMilestones.map((m) => {
                    if (m.status === "Pending" && new Date(m.dueDate) < new Date() && !m.paidDate) {
                        return { ...m, status: "Overdue" as const };
                    }
                    return m;
                })
            }));
            return updated;
        }
        const response = await fetch(`${apiConfig.baseUrl}/procurement/contracts`);
        if (!response.ok) throw new Error("Failed");
        const data = await response.json();
        return Array.isArray(data) ? data : (data?.results || []);
    },

    async createContract(data: Omit<Contract, "id" | "createdAt" | "status">): Promise<Contract> {
        if (apiConfig.useMockData) {
            await delay(SIMULATE_DELAY);
            const newContract: Contract = {
                ...data,
                id: crypto.randomUUID(),
                createdAt: new Date().toISOString(),
                status: "Active",
            };
            MOCK_CONTRACTS.unshift(newContract);
            return newContract;
        }
        const response = await fetch(`${apiConfig.baseUrl}/procurement/contracts/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error("Failed to create contract");
        return response.json();
    },

    async updateContract(id: string, updates: Partial<Contract>): Promise<Contract> {
        if (apiConfig.useMockData) {
            await delay(SIMULATE_DELAY);
            const index = MOCK_CONTRACTS.findIndex(c => c.id === id);
            if (index === -1) throw new Error("Contract not found");
            MOCK_CONTRACTS[index] = { ...MOCK_CONTRACTS[index], ...updates };
            return MOCK_CONTRACTS[index];
        }
        const response = await fetch(`${apiConfig.baseUrl}/procurement/contracts/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updates)
        });
        if (!response.ok) throw new Error("Failed to update contract");
        return response.json();
    },

    async deleteContract(id: string): Promise<boolean> {
        if (apiConfig.useMockData) {
            await delay(SIMULATE_DELAY);
            const index = MOCK_CONTRACTS.findIndex(c => c.id === id);
            if (index > -1) MOCK_CONTRACTS.splice(index, 1);
            return true;
        }
        const response = await fetch(`${apiConfig.baseUrl}/procurement/contracts/${id}`, { method: "DELETE" });
        if (!response.ok) throw new Error("Failed to delete contract");
        return true;
    },

    async addPaymentMilestone(contractId: string, milestone: Omit<PaymentMilestone, "id">): Promise<Contract> {
        if (apiConfig.useMockData) {
            await delay(SIMULATE_DELAY);
            const index = MOCK_CONTRACTS.findIndex(c => c.id === contractId);
            if (index === -1) throw new Error("Contract not found");
            const newMilestone = { ...milestone, id: crypto.randomUUID() };
            MOCK_CONTRACTS[index].paymentMilestones.push(newMilestone);
            return MOCK_CONTRACTS[index];
        }
        const response = await fetch(`${apiConfig.baseUrl}/procurement/contracts/${contractId}/milestones`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(milestone)
        });
        if (!response.ok) throw new Error("Failed to add milestone");
        return response.json();
    },

    async updatePaymentStatus(contractId: string, milestoneId: string, paidDate: string): Promise<Contract> {
        if (apiConfig.useMockData) {
            await delay(SIMULATE_DELAY);
            const index = MOCK_CONTRACTS.findIndex(c => c.id === contractId);
            if (index === -1) throw new Error("Contract not found");
            const milestoneIndex = MOCK_CONTRACTS[index].paymentMilestones.findIndex(m => m.id === milestoneId);
            if (milestoneIndex > -1) {
                MOCK_CONTRACTS[index].paymentMilestones[milestoneIndex] = {
                    ...MOCK_CONTRACTS[index].paymentMilestones[milestoneIndex],
                    paidDate,
                    status: "Paid",
                };
            }
            return MOCK_CONTRACTS[index];
        }
        const response = await fetch(`${apiConfig.baseUrl}/procurement/contracts/${contractId}/milestones/${milestoneId}/pay`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paidDate })
        });
        if (!response.ok) throw new Error("Failed to update payment status");
        return response.json();
    },

    async clearContracts(): Promise<boolean> {
        if (apiConfig.useMockData) {
            await delay(SIMULATE_DELAY);
            MOCK_CONTRACTS.length = 0;
            return true;
        }
        const response = await fetch(`${apiConfig.baseUrl}/procurement/contracts/clear`, { method: "DELETE" });
        if (!response.ok) throw new Error("Failed to clear contracts");
        return true;
    }
};
