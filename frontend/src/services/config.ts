export interface ApiConfig {
    useMockData: boolean;
    baseUrl?: string;
    storekeeperRoute?: string;
    procurementRoute?: string;
    adminRoute?: string;
}

// Configuration
export const apiConfig: ApiConfig = {
    useMockData: false,
    baseUrl: "/api/v1",
    storekeeperRoute: "/storekeeper/stores",
    procurementRoute: "/procurement/stores",
    adminRoute: "/admin/stores",
};

export const SIMULATE_DELAY = 500;
export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
