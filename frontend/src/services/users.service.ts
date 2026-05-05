import { apiConfig, delay, SIMULATE_DELAY } from "./config";
import { ManagedUser, ADMIN_USERS } from "../mock/data";
import { apiFetch } from "@/contexts/AuthContext";

let mockUsers = [...ADMIN_USERS];

export const usersService = {
    async getUsers(): Promise<ManagedUser[]> {
        if (apiConfig.useMockData) {
            await delay(SIMULATE_DELAY);
            return [...mockUsers];
        }
        const response = await apiFetch(`${apiConfig.baseUrl}/admin/users/`);
        if (!response.ok) throw new Error("Failed to fetch users");
        const data = await response.json();
        return Array.isArray(data) ? data : (data.results || []);
    },

    async createUser(user: Omit<ManagedUser, "id" | "createdAt">): Promise<ManagedUser> {
        if (apiConfig.useMockData) {
            await delay(SIMULATE_DELAY);
            const newUser: ManagedUser = {
                ...user,
                id: `user-${Date.now()}`,
                createdAt: new Date().toISOString(),
            };
            mockUsers = [...mockUsers, newUser];
            return newUser;
        }
        const response = await apiFetch(`${apiConfig.baseUrl}/admin/users/`, {
            method: "POST",
            body: JSON.stringify(user),
        });
        if (!response.ok) throw new Error("Failed to create user");
        return await response.json();
    },

    async updateUser(id: string, updates: Partial<ManagedUser>): Promise<ManagedUser> {
        if (apiConfig.useMockData) {
            await delay(SIMULATE_DELAY);
            const index = mockUsers.findIndex(u => u.id === id);
            if (index === -1) throw new Error("User not found");
            const updatedUser = { ...mockUsers[index], ...updates };
            mockUsers = mockUsers.map(u => u.id === id ? updatedUser : u);
            return updatedUser;
        }
        const response = await apiFetch(`${apiConfig.baseUrl}/admin/users/${id}/`, {
            method: "PATCH",
            body: JSON.stringify(updates),
        });
        if (!response.ok) throw new Error("Failed to update user");
        return await response.json();
    },

    async deleteUser(id: string): Promise<void> {
        if (apiConfig.useMockData) {
            await delay(SIMULATE_DELAY);
            mockUsers = mockUsers.filter(u => u.id !== id);
            return;
        }
        const response = await apiFetch(`${apiConfig.baseUrl}/admin/users/${id}/`, { method: "DELETE" });
        if (!response.ok) throw new Error("Failed to delete user");
    },

    async toggleUserStatus(id: string): Promise<ManagedUser> {
        if (apiConfig.useMockData) {
            await delay(SIMULATE_DELAY);
            const index = mockUsers.findIndex(u => u.id === id);
            if (index === -1) throw new Error("User not found");
            const updatedUser = {
                ...mockUsers[index],
                status: mockUsers[index].status === "active" ? ("inactive" as const) : ("active" as const)
            };
            mockUsers = mockUsers.map(u => u.id === id ? updatedUser : u);
            return updatedUser;
        }
        const user = mockUsers.find(u => u.id === id);
        const newStatus = user?.status === "active" ? "inactive" : "active";
        return this.updateUser(id, { status: newStatus as any });
    }
};
