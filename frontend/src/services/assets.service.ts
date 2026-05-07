import { apiConfig, delay, SIMULATE_DELAY } from "./config";
import { Asset, AssetMovementRecord, AssetDetailData, MaintenanceRecord, SurveyRecord, AssetDisposalRecord, MOCK_ASSETS, MOCK_ASSET_CATEGORIES, MOCK_ASSET_STATUSES, MOCK_ASSET_MOVEMENTS, MOCK_ASSET_LOCATIONS, MOCK_ASSET_MOVEMENT_TYPES, MOCK_ASSET_DETAIL, MOCK_MAINTENANCE_HISTORY, MOCK_SURVEYS, MOCK_SURVEY_TYPES, MOCK_ASSET_DISPOSALS, MOCK_ASSET_DISPOSAL_METHODS, MOCK_ASSET_DISPOSAL_REASONS } from "../mock/data";

export const assetsService = {
    async getAssets(): Promise<Asset[]> {
        if (apiConfig.useMockData) {
            await delay(SIMULATE_DELAY);
            return [...MOCK_ASSETS];
        }
        const response = await fetch(`${apiConfig.baseUrl}/assets`);
        if (!response.ok) throw new Error("Failed");
        return response.json();
    },

    async getAssetCategories(): Promise<string[]> {
        if (apiConfig.useMockData) {
            await delay(SIMULATE_DELAY);
            return [...MOCK_ASSET_CATEGORIES];
        }
        const response = await fetch(`${apiConfig.baseUrl}/assets/categories`);
        if (!response.ok) throw new Error("Failed");
        return response.json();
    },

    async getAssetStatuses(): Promise<string[]> {
        if (apiConfig.useMockData) {
            await delay(SIMULATE_DELAY);
            return [...MOCK_ASSET_STATUSES];
        }
        const response = await fetch(`${apiConfig.baseUrl}/assets/statuses`);
        if (!response.ok) throw new Error("Failed");
        return response.json();
    },

    async getAssetMovements(): Promise<AssetMovementRecord[]> {
        if (apiConfig.useMockData) {
            await delay(SIMULATE_DELAY);
            return [...MOCK_ASSET_MOVEMENTS];
        }
        const response = await fetch(`${apiConfig.baseUrl}/assets/movements`);
        if (!response.ok) throw new Error("Failed");
        return response.json();
    },

    async getAssetLocations(): Promise<string[]> {
        if (apiConfig.useMockData) {
            await delay(SIMULATE_DELAY);
            return [...MOCK_ASSET_LOCATIONS];
        }
        const response = await fetch(`${apiConfig.baseUrl}/assets/locations`);
        if (!response.ok) throw new Error("Failed");
        return response.json();
    },

    async getAssetMovementTypes(): Promise<string[]> {
        if (apiConfig.useMockData) {
            await delay(SIMULATE_DELAY);
            return [...MOCK_ASSET_MOVEMENT_TYPES];
        }
        const response = await fetch(`${apiConfig.baseUrl}/assets/movement-types`);
        if (!response.ok) throw new Error("Failed");
        return response.json();
    },

    async getAssetDetail(id: string): Promise<AssetDetailData> {
        if (apiConfig.useMockData) {
            await delay(SIMULATE_DELAY);
            return { ...MOCK_ASSET_DETAIL, id };
        }
        const response = await fetch(`${apiConfig.baseUrl}/assets/${id}`);
        if (!response.ok) throw new Error("Failed");
        return response.json();
    },

    async getAssetMaintenanceHistory(id: string): Promise<MaintenanceRecord[]> {
        if (apiConfig.useMockData) {
            await delay(SIMULATE_DELAY);
            return [...MOCK_MAINTENANCE_HISTORY];
        }
        const response = await fetch(`${apiConfig.baseUrl}/assets/${id}/maintenance`);
        if (!response.ok) throw new Error("Failed");
        return response.json();
    },

    async getAssetMovementHistory(id: string): Promise<AssetMovementRecord[]> {
        if (apiConfig.useMockData) {
            await delay(SIMULATE_DELAY);
            return [...MOCK_ASSET_MOVEMENTS.slice(0, 4)];
        }
        const response = await fetch(`${apiConfig.baseUrl}/assets/${id}/movements`);
        if (!response.ok) throw new Error("Failed");
        return response.json();
    },

    async getBoardsOfSurvey(): Promise<SurveyRecord[]> {
        if (apiConfig.useMockData) {
            await delay(SIMULATE_DELAY);
            return [...MOCK_SURVEYS];
        }
        const response = await fetch(`${apiConfig.baseUrl}/assets/surveys`);
        if (!response.ok) throw new Error("Failed");
        return response.json();
    },

    async getSurveyTypes(): Promise<string[]> {
        if (apiConfig.useMockData) {
            await delay(SIMULATE_DELAY);
            return [...MOCK_SURVEY_TYPES];
        }
        const response = await fetch(`${apiConfig.baseUrl}/assets/surveys/types`);
        if (!response.ok) throw new Error("Failed");
        return response.json();
    },

    async getAssetDisposals(): Promise<AssetDisposalRecord[]> {
        if (apiConfig.useMockData) {
            await delay(SIMULATE_DELAY);
            return [...MOCK_ASSET_DISPOSALS];
        }
        const response = await fetch(`${apiConfig.baseUrl}/assets/disposals`);
        if (!response.ok) throw new Error("Failed");
        return response.json();
    },

    async getAssetDisposalMethods(): Promise<string[]> {
        if (apiConfig.useMockData) {
            await delay(SIMULATE_DELAY);
            return [...MOCK_ASSET_DISPOSAL_METHODS];
        }
        const response = await fetch(`${apiConfig.baseUrl}/assets/disposals/methods`);
        if (!response.ok) throw new Error("Failed");
        return response.json();
    },

    async getAssetDisposalReasons(): Promise<string[]> {
        if (apiConfig.useMockData) {
            await delay(SIMULATE_DELAY);
            return [...MOCK_ASSET_DISPOSAL_REASONS];
        }
        const response = await fetch(`${apiConfig.baseUrl}/assets/disposals/reasons`);
        if (!response.ok) throw new Error("Failed");
        return response.json();
    }

,

    async bulkClassify(items: Array<any>): Promise<any> {
        if (apiConfig.useMockData) {
            await delay(SIMULATE_DELAY);
            return { status: 'mocked', count: items.length };
        }
        const response = await fetch(`${apiConfig.baseUrl}${apiConfig.storekeeperRoute}/capitalization/classify/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(items),
        });
        if (!response.ok) throw new Error('Failed to run bulk classification');
        return response.json();
    }
};
