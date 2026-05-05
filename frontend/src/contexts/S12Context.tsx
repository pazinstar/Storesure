import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { S12Status, S12Item, S12Requisition } from "@/mock/data";

export type { S12Status, S12Item, S12Requisition };

interface S12ContextType {
  requisitions: S12Requisition[];
  createRequisition: (data: Omit<S12Requisition, "id" | "s12Number" | "status" | "createdAt" | "updatedAt" | "receiverSignature" | "issuerSignature">) => S12Requisition;
  updateRequisition: (id: string, data: Partial<S12Requisition>) => void;
  submitForApproval: (id: string) => void;
  approveRequisition: (id: string, approvedBy: string, remarks?: string, approvedQuantities?: Record<string, number>) => void;
  rejectRequisition: (id: string, approvedBy: string, remarks: string) => void;
  issueItems: (id: string, issuedBy: string, issuedQuantities: Record<string, number>) => void;
  confirmReceipt: (id: string, receivedBy: string) => void;
  cancelRequisition: (id: string) => void;
  getRequisitionById: (id: string) => S12Requisition | undefined;
  getPendingApprovals: () => S12Requisition[];
  getPendingIssues: () => S12Requisition[];
  clearRequisitions: () => void;
}

const S12Context = createContext<S12ContextType | undefined>(undefined);

export function S12Provider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const { data: requisitions = [] } = useQuery({
    queryKey: ['s12-requisitions'],
    queryFn: () => api.getS12Requisitions(),
  });

  const createRequisitionMut = useMutation({
    mutationFn: (data: Omit<S12Requisition, "id" | "s12Number" | "status" | "createdAt" | "updatedAt" | "receiverSignature" | "issuerSignature">) => api.createS12Requisition(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['s12-requisitions'] })
  });

  const updateRequisitionMut = useMutation({
    mutationFn: ({ id, data }: { id: string, data: Partial<S12Requisition> }) => api.updateS12Requisition(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['s12-requisitions'] })
  });

  const createRequisition = (
    data: Omit<S12Requisition, "id" | "s12Number" | "status" | "createdAt" | "updatedAt" | "receiverSignature" | "issuerSignature">
  ): S12Requisition => {
    const fakeId = crypto.randomUUID(); // optimistic return
    createRequisitionMut.mutate(data);
    return { ...data, id: fakeId } as S12Requisition;
  };

  const updateRequisition = (id: string, data: Partial<S12Requisition>) => {
    updateRequisitionMut.mutate({ id, data });
  };

  const submitForApproval = (id: string) => {
    updateRequisition(id, { status: "Pending Approval" });
  };

  const approveRequisition = (
    id: string,
    approvedBy: string,
    remarks?: string,
    approvedQuantities?: Record<string, number>
  ) => {
    const req = requisitions.find((r) => r.id === id);
    if (!req) return;

    const updatedItems = approvedQuantities ? req.items.map((item) => ({
      ...item, quantityApproved: approvedQuantities[item.id] ?? item.quantityRequested
    })) : req.items.map(i => ({ ...i, quantityApproved: i.quantityRequested }));

    updateRequisition(id, {
      items: updatedItems,
      status: "Approved",
      approvedBy,
      approvalDate: new Date().toISOString(),
      approvalRemarks: remarks
    });
  };

  const rejectRequisition = (id: string, approvedBy: string, remarks: string) => {
    updateRequisition(id, {
      status: "Rejected",
      approvedBy,
      approvalDate: new Date().toISOString(),
      approvalRemarks: remarks,
    });
  };

  const issueItems = (id: string, issuedBy: string, issuedQuantities: Record<string, number>) => {
    const req = requisitions.find((r) => r.id === id);
    if (!req) return;

    const updatedItems = req.items.map((item) => ({
      ...item,
      quantityIssued: (item.quantityIssued || 0) + (issuedQuantities[item.id] || 0),
    }));

    const allFullyIssued = updatedItems.every(
      (item) => item.quantityIssued >= item.quantityApproved
    );
    const anyIssued = updatedItems.some((item) => item.quantityIssued > 0);

    updateRequisition(id, {
      items: updatedItems,
      status: allFullyIssued ? "Fully Issued" : anyIssued ? "Partially Issued" : req.status,
      issuedBy,
      issueDate: new Date().toISOString(),
      issuerSignature: true
    });
  };

  const confirmReceipt = (id: string, receivedBy: string) => {
    updateRequisition(id, {
      receivedBy,
      receiverSignature: true,
    });
  };

  const cancelRequisition = (id: string) => {
    updateRequisition(id, { status: "Cancelled" });
  };

  const getRequisitionById = (id: string): S12Requisition | undefined => {
    return requisitions.find((r) => r.id === id);
  };

  const getPendingApprovals = (): S12Requisition[] => {
    return requisitions.filter((r) => r.status === "Pending Approval");
  };

  const getPendingIssues = (): S12Requisition[] => {
    return requisitions.filter(
      (r) => r.status === "Approved" || r.status === "Partially Issued"
    );
  };

  const clearRequisitions = () => {
    // Only locally useful, maybe a no-op for API
  };

  return (
    <S12Context.Provider
      value={{
        requisitions,
        createRequisition,
        updateRequisition,
        submitForApproval,
        approveRequisition,
        rejectRequisition,
        issueItems,
        confirmReceipt,
        cancelRequisition,
        getRequisitionById,
        getPendingApprovals,
        getPendingIssues,
        clearRequisitions,
      }}
    >
      {children}
    </S12Context.Provider>
  );
}

export function useS12() {
  const context = useContext(S12Context);
  if (context === undefined) {
    throw new Error("useS12 must be used within an S12Provider");
  }
  return context;
}


