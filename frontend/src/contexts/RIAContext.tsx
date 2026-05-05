import { createContext, useContext, useMemo, ReactNode } from "react";
import { isAfter, isBefore } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { useAuth } from "./AuthContext";
import { RIARecord, RIAStatus, RIAItem } from "@/mock/data";
export type { RIAStatus, RIAItem, RIARecord };

interface RIAContextType {
  rias: RIARecord[];
  createDraft: (data: Partial<RIARecord>) => Promise<RIARecord>;
  submitForApproval: (id: string) => void;
  approve: (id: string, approver: "bursar" | "headteacher") => void;
  reject: (id: string) => void;
  addUsage: (id: string, itemCode: string, qty: number) => void; // Uses ID instead of number to match updateRIA lookup
  getPendingCount: () => number;
  isLoading: boolean;
}

const RIAContext = createContext<RIAContextType | null>(null);

export function RIAProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: rias = [], isLoading } = useQuery({
    queryKey: ["rias"],
    queryFn: () => api.getRIAs(),
  });

  const normalized = useMemo(() => {
    return rias || [];
  }, [rias]);

  const createMutation = useMutation({
    mutationFn: (data: Partial<RIARecord>) => api.createRIA(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["rias"] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<RIARecord> }) => api.updateRIA(id, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["rias"] }),
  });

  const createDraft = async (data: Partial<RIARecord>) => {
    return await createMutation.mutateAsync({ ...data, status: "draft" });
  };

  const submitForApproval = (id: string) => {
    updateMutation.mutate({ id, updates: { status: "pending" } });
  };

  const approve = (id: string, _approver: "bursar" | "headteacher") => {
    updateMutation.mutate({ id, updates: { status: "active" } });
  };

  const reject = (id: string) => {
    updateMutation.mutate({ id, updates: { status: "cancelled" } });
  };

  const addUsage = (id: string, itemCode: string, qty: number) => {
    const r = normalized.find(x => x.id === id);
    if (!r) return;
    const updatedItems = r.items.map((it) =>
      it.itemCode === itemCode ? { ...it, usedQty: Math.min(it.approvedQty, it.usedQty + qty) } : it
    );
    updateMutation.mutate({ id, updates: { items: updatedItems } });
  };

  const getPendingCount = () => normalized.filter((r) => r.status === "pending").length;

  const value: RIAContextType = {
    rias: normalized,
    createDraft,
    submitForApproval,
    approve,
    reject,
    addUsage,
    getPendingCount,
    isLoading
  };

  return <RIAContext.Provider value={value}>{children}</RIAContext.Provider>;
}

export const useRIA = () => {
  const ctx = useContext(RIAContext);
  if (!ctx) throw new Error("useRIA must be used within RIAProvider");
  return ctx;
};
