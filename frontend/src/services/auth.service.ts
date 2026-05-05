import { apiConfig, delay, SIMULATE_DELAY } from "./config";
import { User, MOCK_USERS } from "../mock/data";

export const authService = {
    /**
     * Login user
     */
    async login(email: string, password: string): Promise<{ user: User; token: string }> {
        if (apiConfig.useMockData) {
            await delay(SIMULATE_DELAY);
            const mockUserEntry = MOCK_USERS[email.toLowerCase()];

            if (mockUserEntry && mockUserEntry.password === password) {
                // Simulate returning a token
                return { user: mockUserEntry.user, token: "mock-jwt-token-12345" };
            }
            throw new Error("Invalid credentials");
        } else {
            const response = await fetch(`${apiConfig.baseUrl}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });
            if (!response.ok) throw new Error("Login failed");
            return response.json();
        }
    },

    /**
     * Logout user
     */
    async logout(): Promise<void> {
        if (apiConfig.useMockData) {
            await delay(SIMULATE_DELAY / 2);
            return;
        } else {
            // Optional: Call server to invalidate session
            try {
                await fetch(`${apiConfig.baseUrl}/auth/logout`, { method: "POST" });
            } catch (e) {
                console.warn("Logout failed on server", e);
            }
        }
    }
};
