import { apiConfig, delay, SIMULATE_DELAY } from "./config";
import { Item, S13Record, S11Record, StoreTransfer, StockBalanceItem, StoreItem, AdjustmentRecord, MOCK_INVENTORY, MOCK_S13_RECORDS, MOCK_S11_RECORDS, MOCK_INVENTORY_SETTINGS, MOCK_STORE_TRANSFERS, MOCK_STOCK_BALANCES, MOCK_STORE_ITEMS, MOCK_ADJUSTMENTS, generateLedgerData, ConsumableLedgerItem, S2LedgerEntry, DeliveryRecord, InspectionItem, InspectionDecision, MOCK_DELIVERIES, DashboardTransaction, DashboardLowStockItem, MOCK_DASHBOARD_TRANSACTIONS, MOCK_LOW_STOCK_ITEMS, DashboardStats, MOCK_DASHBOARD_STATS, S12Requisition, getDemoRequisitions, generateS12Number } from "../mock/data";

export const inventoryService = {
    async getInventorySettings(): Promise<typeof MOCK_INVENTORY_SETTINGS> {
        if (apiConfig.useMockData) {
            await delay(SIMULATE_DELAY);
            return MOCK_INVENTORY_SETTINGS;
        } else {
            const response = await fetch(`${apiConfig.baseUrl}${apiConfig.storekeeperRoute}/settings`);
            if (!response.ok) throw new Error("Failed");
            return response.json();
        }
    },

    async getStoreTransfers(): Promise<StoreTransfer[]> {
        if (apiConfig.useMockData) {
            await delay(SIMULATE_DELAY);
            return [...MOCK_STORE_TRANSFERS];
        } else {
            const response = await fetch(`${apiConfig.baseUrl}${apiConfig.storekeeperRoute}/transfers`);
            if (!response.ok) throw new Error("Failed");
            const data = await response.json();
            return Array.isArray(data) ? data : (data?.results || []);
        }
    },

    async createStoreTransfer(data: Partial<StoreTransfer>): Promise<StoreTransfer> {
        if (apiConfig.useMockData) {
            await delay(SIMULATE_DELAY);
            return {
                ...data,
                id: `TRF-${new Date().getFullYear()}-${String(MOCK_STORE_TRANSFERS.length + 1).padStart(3, '0')}`,
                status: "Pending Approval",
            } as StoreTransfer;
        } else {
            const response = await fetch(`${apiConfig.baseUrl}${apiConfig.storekeeperRoute}/transfers/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!response.ok) throw new Error("Failed");
            return response.json();
        }
    },

    async getStockBalances(): Promise<StockBalanceItem[]> {
        if (apiConfig.useMockData) {
            await delay(SIMULATE_DELAY);
            return [...MOCK_STOCK_BALANCES];
        } else {
            const response = await fetch(`${apiConfig.baseUrl}${apiConfig.storekeeperRoute}/stock-balances`);
            if (!response.ok) throw new Error("Failed");
            const data = await response.json();
            return Array.isArray(data) ? data : (data?.results || []);
        }
    },

    async exportStockBalances(params?: any): Promise<Blob> {
        if (apiConfig.useMockData) {
            await delay(SIMULATE_DELAY);
            console.log("Mock exporting stock balances with params:", params);
            return new Blob(["Mock CSV data"], { type: "text/csv" });
        } else {
            const queryParams = params ? new URLSearchParams(params).toString() : '';
            const url = queryParams
                ? `${apiConfig.baseUrl}${apiConfig.storekeeperRoute}/stock-balances/export?${queryParams}`
                : `${apiConfig.baseUrl}${apiConfig.storekeeperRoute}/stock-balances/export`;

            const response = await fetch(url, { method: "GET" });
            if (!response.ok) throw new Error("Failed to export stock balances");
            return response.blob();
        }
    },

    async getInventory(): Promise<Item[]> {
        if (apiConfig.useMockData) {
            await delay(SIMULATE_DELAY);
            console.log("Inventory data loading...");
            return [...MOCK_INVENTORY];
        } else {
            const response = await fetch(`${apiConfig.baseUrl}${apiConfig.storekeeperRoute}/inventory`);
            if (!response.ok) throw new Error("Failed");
            const data = await response.json();
            // Handle paginated response (DRF style) or direct array
            return data.results ? data.results : data;
        }
    },

    async getItem(id: string): Promise<Item | undefined> {
        if (apiConfig.useMockData) {
            await delay(SIMULATE_DELAY);
            return MOCK_INVENTORY.find((item) => item.id === id);
        } else {
            const response = await fetch(`${apiConfig.baseUrl}${apiConfig.storekeeperRoute}/inventory/${id}`);
            if (!response.ok) throw new Error("Failed");
            return response.json();
        }
    },

    async createItem(item: Omit<Item, "id">): Promise<Item> {
        if (apiConfig.useMockData) {
            await delay(SIMULATE_DELAY);
            return { ...item, id: `ITM${String(MOCK_INVENTORY.length + 1).padStart(3, "0")}` };
        } else {
            const response = await fetch(`${apiConfig.baseUrl}${apiConfig.storekeeperRoute}/inventory/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(item),
            });
            if (!response.ok) throw new Error("Failed");
            return response.json();
        }
    },

    async updateItem(id: string, updates: Partial<Item>): Promise<Item> {
        if (apiConfig.useMockData) {
            await delay(SIMULATE_DELAY);
            const item = MOCK_INVENTORY.find((i) => i.id === id);
            if (!item) throw new Error("Not found");
            return { ...item, ...updates };
        } else {
            const response = await fetch(`${apiConfig.baseUrl}${apiConfig.storekeeperRoute}/inventory/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updates),
            });
            if (!response.ok) throw new Error("Failed");
            return response.json();
        }
    },

    async deleteItem(id: string): Promise<boolean> {
        if (apiConfig.useMockData) {
            await delay(SIMULATE_DELAY);
            return true;
        } else {
            const response = await fetch(`${apiConfig.baseUrl}${apiConfig.storekeeperRoute}/inventory/${id}`, { method: "DELETE" });
            if (!response.ok) throw new Error("Failed");
            return true;
        }
    },

    async exportInventory(): Promise<Blob> {
        if (apiConfig.useMockData) {
            await delay(SIMULATE_DELAY);
            const csvContent = "Item Code,Item Name,Category,Asset Type,Unit,Min Level,Reorder Level,Current Bal.,Status\n" +
                MOCK_INVENTORY.map(i => `${i.id},"${i.name}",${i.category},${i.assetType},${i.unit},${i.minimumStockLevel},${i.reorderLevel},${i.openingBalance},${i.status}`).join("\n");
            return new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        } else {
            const response = await fetch(`${apiConfig.baseUrl}${apiConfig.storekeeperRoute}/inventory/export`);
            if (!response.ok) throw new Error("Export failed");
            return response.blob();
        }
    },

    async getConsumablesLedger(month: string, store: string): Promise<ConsumableLedgerItem[]> {
        if (apiConfig.useMockData) {
            await delay(SIMULATE_DELAY);
            return generateLedgerData(month, store);
        } else {
            const response = await fetch(`${apiConfig.baseUrl}${apiConfig.storekeeperRoute}/ledger/consumables?month=${month}&store=${store}`);
            if (!response.ok) throw new Error("Failed");
            const data = await response.json();
            return data.results ? data.results : data;
        }
    },

    async getS2Ledger(params?: { item?: string; type?: string }): Promise<S2LedgerEntry[]> {
        const qs = new URLSearchParams();
        if (params?.item && params.item !== "ALL") qs.set("item", params.item);
        if (params?.type && params.type !== "ALL") qs.set("type", params.type);
        const suffix = qs.toString() ? `?${qs.toString()}` : "";
        const response = await fetch(`${apiConfig.baseUrl}${apiConfig.storekeeperRoute}/ledger/permanent-expendable/${suffix}`);
        if (!response.ok) throw new Error("Failed to load S2 ledger");
        const data = await response.json();
        return data.results ? data.results : data;
    },

    /**
     * Fetch S13 Issue Records
     */
    async getS13Records(): Promise<S13Record[]> {
        if (apiConfig.useMockData) {
            await delay(SIMULATE_DELAY);
            return [...MOCK_S13_RECORDS];
        } else {
            const response = await fetch(`${apiConfig.baseUrl}${apiConfig.storekeeperRoute}/issue`);
            if (!response.ok) throw new Error("Failed");
            const data = await response.json();
            return data.results ? data.results : data;
        }
    },

    async createS13Record(record: Omit<S13Record, "id">): Promise<S13Record> {
        if (apiConfig.useMockData) {
            await delay(SIMULATE_DELAY);
            return { ...record, id: `S13-API-${Date.now()}` };
        } else {
            const response = await fetch(`${apiConfig.baseUrl}${apiConfig.storekeeperRoute}/issue/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(record),
            });
            if (!response.ok) throw new Error("Failed");
            return response.json();
        }
    },

    /**
     * Fetch S11 Receive Records
     */
    async getS11Records(): Promise<S11Record[]> {
        if (apiConfig.useMockData) {
            await delay(SIMULATE_DELAY);
            return [...MOCK_S11_RECORDS];
        } else {
            const response = await fetch(`${apiConfig.baseUrl}${apiConfig.storekeeperRoute}/receive`);
            if (!response.ok) throw new Error("Failed");
            // return response.json();
            const data = await response.json();
            // Handle paginated response (DRF style) or direct array
            return data.results ? data.results : data;
        }
    },

    async createS11Record(record: Omit<S11Record, "id">): Promise<S11Record> {
        if (apiConfig.useMockData) {
            await delay(SIMULATE_DELAY);
            return { ...record, id: `S11-API-${Date.now()}` };
        } else {
            const response = await fetch(`${apiConfig.baseUrl}${apiConfig.storekeeperRoute}/receive/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(record),
            });
            if (!response.ok) throw new Error("Failed");
            return response.json();
        }
    },

    async updateS11Record(id: string, updates: Partial<S11Record>): Promise<S11Record> {
        if (apiConfig.useMockData) {
            await delay(SIMULATE_DELAY);
            const record = MOCK_S11_RECORDS.find(r => r.id === id);
            if (!record) throw new Error("Record not found");
            return { ...record, ...updates };
        } else {
            const response = await fetch(`${apiConfig.baseUrl}${apiConfig.storekeeperRoute}/receive/${id}/`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updates),
            });
            if (!response.ok) throw new Error("Failed to update S11 Record");
            return response.json();
        }
    },

    async getStoreItems(): Promise<StoreItem[]> {
        if (apiConfig.useMockData) {
            await delay(SIMULATE_DELAY);
            return [...MOCK_STORE_ITEMS];
        } else {
            const response = await fetch(`${apiConfig.baseUrl}${apiConfig.storekeeperRoute}/store-items`);
            if (!response.ok) {
                console.warn("Store items API failed, returning empty array:", response.status);
                return [];
            }
            const data = await response.json();
            return Array.isArray(data) ? data : (data?.results || []);
        }
    },

    async getAdjustments(): Promise<AdjustmentRecord[]> {
        if (apiConfig.useMockData) {
            await delay(SIMULATE_DELAY);
            return [...MOCK_ADJUSTMENTS];
        } else {
            const response = await fetch(`${apiConfig.baseUrl}${apiConfig.storekeeperRoute}/adjustments`);
            if (!response.ok) throw new Error("Failed");
            const data = await response.json();
            return Array.isArray(data) ? data : (data?.results || []);
        }
    },

    async createAdjustment(data: Partial<AdjustmentRecord>): Promise<AdjustmentRecord> {
        if (apiConfig.useMockData) {
            await delay(SIMULATE_DELAY);
            return {
                ...data,
                id: `ADJ-${new Date().getFullYear()}-${String(MOCK_ADJUSTMENTS.length + 1).padStart(3, '0')}`,
                status: "Pending",
            } as AdjustmentRecord;
        } else {
            const response = await fetch(`${apiConfig.baseUrl}${apiConfig.storekeeperRoute}/adjustments/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!response.ok) throw new Error("Failed");
            return response.json();
        }
    },

    async getDeliveries(): Promise<DeliveryRecord[]> {
        if (apiConfig.useMockData) {
            await delay(SIMULATE_DELAY);
            return [...MOCK_DELIVERIES];
        } else {
            const response = await fetch(`${apiConfig.baseUrl}${apiConfig.storekeeperRoute}/deliveries`);
            if (!response.ok) throw new Error("Failed");
            const data = await response.json();
            return data.results ? data.results : data;
        }
    },

    async updateInspectionItems(deliveryId: string, items: InspectionItem[]): Promise<DeliveryRecord> {
        if (apiConfig.useMockData) {
            await delay(SIMULATE_DELAY);
            const delivery = MOCK_DELIVERIES.find(d => d.id === deliveryId);
            if (!delivery) throw new Error("Delivery not found");
            return { ...delivery, items };
        } else {
            const response = await fetch(`${apiConfig.baseUrl}${apiConfig.storekeeperRoute}/deliveries/${deliveryId}/items/`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ items }),
            });
            if (!response.ok) throw new Error("Failed");
            return response.json();
        }
    },

    async submitInspectionDecision(deliveryId: string, decision: InspectionDecision, overallRemarks: string): Promise<DeliveryRecord> {
        if (apiConfig.useMockData) {
            await delay(SIMULATE_DELAY);
            const delivery = MOCK_DELIVERIES.find(d => d.id === deliveryId);
            if (!delivery) throw new Error("Delivery not found");
            return { ...delivery, decision, overallRemarks };
        } else {
            const response = await fetch(`${apiConfig.baseUrl}${apiConfig.storekeeperRoute}/deliveries/${deliveryId}/decision/`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ decision, overallRemarks }),
            });
            if (!response.ok) throw new Error("Failed");
            return response.json();
        }
    },

    async signInspection(deliveryId: string, payload: { memberId: string, memberName: string, memberRole: string }): Promise<DeliveryRecord> {
        if (apiConfig.useMockData) {
            await delay(SIMULATE_DELAY);
            const delivery = MOCK_DELIVERIES.find(d => d.id === deliveryId);
            if (!delivery) throw new Error("Delivery not found");
            return delivery;
        } else {
            const response = await fetch(`${apiConfig.baseUrl}${apiConfig.storekeeperRoute}/deliveries/${deliveryId}/sign/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!response.ok) throw new Error("Failed");
            return response.json();
        }
    },

    async getDashboardTransactions(): Promise<DashboardTransaction[]> {
        if (apiConfig.useMockData) {
            await delay(SIMULATE_DELAY);
            return [...MOCK_DASHBOARD_TRANSACTIONS];
        } else {
            const response = await fetch(`${apiConfig.baseUrl}${apiConfig.storekeeperRoute}/dashboard/transactions`);
            if (!response.ok) throw new Error("Failed");
            const data = await response.json();
            return data.results ? data.results : data;
        }
    },

    async getDashboardLowStock(): Promise<DashboardLowStockItem[]> {
        if (apiConfig.useMockData) {
            await delay(SIMULATE_DELAY);
            return [...MOCK_LOW_STOCK_ITEMS];
        } else {
            const response = await fetch(`${apiConfig.baseUrl}${apiConfig.storekeeperRoute}/dashboard/low-stock`);
            if (!response.ok) throw new Error("Failed");
            const data = await response.json();
            return data.results ? data.results : data;
        }
    },

    async getDashboardStats(): Promise<DashboardStats> {
        if (apiConfig.useMockData) {
            await delay(SIMULATE_DELAY);
            return MOCK_DASHBOARD_STATS;
        } else {
            const response = await fetch(`${apiConfig.baseUrl}${apiConfig.storekeeperRoute}/dashboard/stats`);
            if (!response.ok) throw new Error("Failed");
            return response.json();
        }
    },

    async getS12Requisitions(): Promise<S12Requisition[]> {
        if (apiConfig.useMockData) {
            await delay(SIMULATE_DELAY);
            return getDemoRequisitions();
        } else {
            const response = await fetch(`${apiConfig.baseUrl}${apiConfig.storekeeperRoute}/s12-requisitions/`);
            if (!response.ok) throw new Error("Failed");
            const data = await response.json();
            return data.results ? data.results : data;
        }
    },

    async createS12Requisition(data: Omit<S12Requisition, "id" | "s12Number" | "status" | "createdAt" | "updatedAt" | "receiverSignature" | "issuerSignature">): Promise<S12Requisition> {
        if (apiConfig.useMockData) {
            await delay(SIMULATE_DELAY);
            const now = new Date().toISOString();
            return {
                ...data,
                id: crypto.randomUUID(),
                s12Number: generateS12Number(),
                status: "Pending Approval",
                receiverSignature: false,
                issuerSignature: false,
                createdAt: now,
                updatedAt: now,
            } as S12Requisition;
        } else {
            const payload = {
                ...data,
                status: "Pending Approval"
            };

            const response = await fetch(`${apiConfig.baseUrl}${apiConfig.storekeeperRoute}/s12-requisitions/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!response.ok) throw new Error("Failed");
            return response.json();
        }
    },

    async updateS12Requisition(id: string, data: Partial<S12Requisition>): Promise<S12Requisition> {
        if (apiConfig.useMockData) {
            await delay(SIMULATE_DELAY);
            const req = getDemoRequisitions().find(r => r.id === id);
            if (!req) throw new Error("Not found");
            return { ...req, ...data, updatedAt: new Date().toISOString() };
        } else {
            const response = await fetch(`${apiConfig.baseUrl}${apiConfig.storekeeperRoute}/s12-requisitions/${id}/`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!response.ok) throw new Error("Failed");
            return response.json();
        }
    }
};
