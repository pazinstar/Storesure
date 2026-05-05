import React, { createContext, useContext, ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import {
  DeliveryStatus,
  InspectionDecision,
  InspectionItem,
  CommitteeSignature,
  DeliveryRecord,
  MOCK_DELIVERIES
} from "@/mock/data";

interface DeliveryContextType {
  deliveries: DeliveryRecord[];
  addDelivery: (data: Omit<DeliveryRecord, "id" | "status" | "signatures" | "items" | "createdAt" | "updatedAt">) => DeliveryRecord;
  updateDelivery: (id: string, data: Partial<DeliveryRecord>) => void;
  deleteDelivery: (id: string) => void;
  getDeliveryById: (id: string) => DeliveryRecord | undefined;
  getDeliveryByDeliveryId: (deliveryId: string) => DeliveryRecord | undefined;
  getPendingInspections: () => DeliveryRecord[];
  getAcceptedDeliveries: () => DeliveryRecord[];
  signInspection: (deliveryId: string, memberId: string, memberName: string, memberRole: string) => void;
  updateInspectionItems: (deliveryId: string, items: InspectionItem[]) => void;
  submitInspectionDecision: (deliveryId: string, decision: InspectionDecision, overallRemarks: string) => void;
  getSignatureCount: (deliveryId: string) => { signed: number; total: number };
  markGRNGenerated: (deliveryId: string, grnId: string) => void;
}

const DeliveryContext = createContext<DeliveryContextType | undefined>(undefined);

const STORAGE_KEY = "delivery-register";

// Generate delivery ID based on year
export const generateDeliveryId = (): string => {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(Math.random() * 900) + 100;
  return `DEL/${year}/${randomNum.toString().padStart(3, "0")}`;
};

export function DeliveryProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  // Fetch Deliveries from Backend
  const { data: deliveries = [], isLoading } = useQuery<DeliveryRecord[]>({
    queryKey: ['deliveries'],
    queryFn: () => api.getProcurementDeliveries()
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: Parameters<typeof api.createProcurementDelivery>[0]) => api.createProcurementDelivery(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['deliveries'] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<DeliveryRecord> }) =>
      api.updateProcurementDelivery(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['deliveries'] }),
  });

  // Derived Actions
  const addDelivery = (
    data: Omit<DeliveryRecord, "id" | "status" | "signatures" | "items" | "createdAt" | "updatedAt">
  ): DeliveryRecord => {
    // Generate optimistic shell for immediate return
    const newDelivery = {
      ...data,
      id: crypto.randomUUID(),
      status: "Awaiting Inspection" as DeliveryStatus,
      items: [],
      signatures: [
        { memberId: "", memberName: "", memberRole: "Storekeeper", signed: false, confirmed: false },
        { memberId: "", memberName: "", memberRole: "Bursar", signed: false, confirmed: false },
        { memberId: "", memberName: "", memberRole: "Headteacher", signed: false, confirmed: false },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    createMutation.mutate({
      ...data,
      status: "Awaiting Inspection",
      items: [],
      signatures: newDelivery.signatures
    } as any);

    return newDelivery;
  };

  const updateDelivery = (id: string, data: Partial<DeliveryRecord>) => {
    updateMutation.mutate({ id, data });
  };

  const deleteDelivery = (id: string) => {
    // Placeholder - assuming backend drops it. In a robust app, you'd have a deleteProcurementDelivery endpoint
    console.warn("Delete endpoint not explicitly requested in mock, but function signature remained.");
  };

  const getDeliveryById = (id: string): DeliveryRecord | undefined => {
    return deliveries.find((del) => del.id === id);
  };

  const getDeliveryByDeliveryId = (deliveryId: string): DeliveryRecord | undefined => {
    return deliveries.find((del) => del.deliveryId === deliveryId);
  };

  const getPendingInspections = (): DeliveryRecord[] => {
    return deliveries.filter(
      (del) => del.status === "Awaiting Inspection" || del.status === "Under Inspection"
    );
  };

  const getAcceptedDeliveries = (): DeliveryRecord[] => {
    return deliveries.filter(
      (del) => del.status === "Accepted" || del.status === "Partially Accepted"
    );
  };

  const signInspection = (
    deliveryId: string,
    memberId: string,
    memberName: string,
    memberRole: string
  ) => {
    const del = deliveries.find(d => d.id === deliveryId);
    if (!del) return;

    const updatedSignatures = del.signatures.map((sig) => {
      if (sig.memberRole === memberRole && !sig.signed) {
        return {
          ...sig,
          memberId,
          memberName,
          signed: true,
          signedAt: new Date().toISOString(),
          confirmed: true,
        };
      }
      return sig;
    });

    const signedCount = updatedSignatures.filter((s) => s.signed).length;
    let newStatus: DeliveryStatus = del.status;

    if (signedCount > 0 && signedCount < 3) {
      newStatus = "Under Inspection";
    } else if (signedCount === 3 && del.decision) {
      newStatus = del.decision === "accept_all"
        ? "Accepted"
        : del.decision === "partial_accept"
          ? "Partially Accepted"
          : "Rejected";
    }

    updateDelivery(deliveryId, {
      signatures: updatedSignatures,
      status: newStatus,
      inspectionCompletedAt: signedCount === 3 ? new Date().toISOString() : del.inspectionCompletedAt,
    });
  };

  const updateInspectionItems = (deliveryId: string, items: InspectionItem[]) => {
    updateDelivery(deliveryId, { items });
  };

  const submitInspectionDecision = (
    deliveryId: string,
    decision: InspectionDecision,
    overallRemarks: string
  ) => {
    const del = deliveries.find(d => d.id === deliveryId);
    if (!del) return;

    const signedCount = del.signatures.filter((s) => s.signed).length;
    let newStatus: DeliveryStatus = del.status;

    if (signedCount === 3) {
      newStatus = decision === "accept_all"
        ? "Accepted"
        : decision === "partial_accept"
          ? "Partially Accepted"
          : "Rejected";
    }

    updateDelivery(deliveryId, {
      decision,
      overallRemarks,
      status: newStatus,
    });
  };

  const getSignatureCount = (deliveryId: string): { signed: number; total: number } => {
    const delivery = deliveries.find((del) => del.id === deliveryId);
    if (!delivery) return { signed: 0, total: 3 };
    const signed = delivery.signatures.filter((s) => s.signed).length;
    return { signed, total: 3 };
  };

  const markGRNGenerated = (deliveryId: string, grnId: string) => {
    updateDelivery(deliveryId, { grnGenerated: true, grnId });
  };

  return (
    <DeliveryContext.Provider
      value={{
        deliveries,
        addDelivery,
        updateDelivery,
        deleteDelivery,
        getDeliveryById,
        getDeliveryByDeliveryId,
        getPendingInspections,
        getAcceptedDeliveries,
        signInspection,
        updateInspectionItems,
        submitInspectionDecision,
        getSignatureCount,
        markGRNGenerated,
      }}
    >
      {children}
    </DeliveryContext.Provider>
  );
}

export function useDelivery() {
  const context = useContext(DeliveryContext);
  if (context === undefined) {
    throw new Error("useDelivery must be used within a DeliveryProvider");
  }
  return context;
}
