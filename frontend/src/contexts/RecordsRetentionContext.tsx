import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type RecordStatus = "Active" | "Due_for_Appraisal" | "Pending_Disposal" | "Disposed" | "Archived";
export type RecordCategory = "Financial" | "Procurement" | "Personnel" | "Academic" | "Correspondence" | "Legal" | "Administrative";
export type AppraisalDecision = "Retain" | "Dispose" | "Archive" | "Extend";

export interface RetentionRecord {
  id: string;
  recordCode: string;
  title: string;
  category: RecordCategory;
  description: string;
  creationDate: string;
  retentionYears: number;
  expiryDate: string;
  location: string;
  custodian: string;
  status: RecordStatus;
  lastReviewDate?: string;
  nextReviewDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppraisalWorkflow {
  id: string;
  recordId: string;
  recordCode: string;
  recordTitle: string;
  initiatedBy: string;
  initiatedDate: string;
  appraisalDate?: string;
  appraisedBy?: string;
  decision?: AppraisalDecision;
  justification?: string;
  authorizedBy?: string;
  authorizationDate?: string;
  status: "Pending" | "Appraised" | "Authorized" | "Completed" | "Rejected";
  comments?: string;
}

export interface DisposalRecord {
  id: string;
  recordId: string;
  recordCode: string;
  recordTitle: string;
  appraisalId: string;
  disposalMethod: "Shredding" | "Burning" | "Digital_Deletion" | "Transfer_to_Archives";
  disposalDate: string;
  disposedBy: string;
  witnessedBy: string;
  authorizationReference: string;
  certificateNumber: string;
  notes?: string;
}

interface RecordsRetentionContextType {
  records: RetentionRecord[];
  appraisals: AppraisalWorkflow[];
  disposals: DisposalRecord[];
  addRecord: (record: Omit<RetentionRecord, "id" | "recordCode" | "expiryDate" | "status" | "createdAt" | "updatedAt">) => Promise<RetentionRecord>;
  updateRecord: (id: string, updates: Partial<RetentionRecord>) => Promise<void>;
  initiateAppraisal: (recordId: string, initiatedBy: string) => Promise<AppraisalWorkflow>;
  submitAppraisalDecision: (appraisalId: string, decision: AppraisalDecision, justification: string, appraisedBy: string) => Promise<void>;
  authorizeAppraisal: (appraisalId: string, authorizedBy: string) => Promise<void>;
  rejectAppraisal: (appraisalId: string, comments: string) => Promise<void>;
  recordDisposal: (disposal: Omit<DisposalRecord, "id" | "certificateNumber">) => Promise<DisposalRecord>;
  getRecordsDueForAppraisal: () => RetentionRecord[];
  getOverdueRecords: () => RetentionRecord[];
  isLoading: boolean;
}

const RecordsRetentionContext = createContext<RecordsRetentionContextType | undefined>(undefined);

const generateRecordCode = (category: RecordCategory, existingRecords: RetentionRecord[]): string => {
  const categoryPrefix: Record<RecordCategory, string> = {
    Financial: "FIN",
    Procurement: "PROC",
    Personnel: "PER",
    Academic: "ACAD",
    Correspondence: "COR",
    Legal: "LEG",
    Administrative: "ADM",
  };

  const year = new Date().getFullYear().toString().slice(-2);
  const categoryRecords = existingRecords.filter(r => r.category === category);
  const serial = String(categoryRecords.length + 1).padStart(4, "0");

  return `${categoryPrefix[category]}/${year}/${serial}`;
};

const calculateExpiryDate = (creationDate: string, retentionYears: number): string => {
  const date = new Date(creationDate);
  date.setFullYear(date.getFullYear() + retentionYears);
  return date.toISOString().split("T")[0];
};

const generateCertificateNumber = (existingDisposals: DisposalRecord[]): string => {
  const year = new Date().getFullYear();
  const serial = String(existingDisposals.length + 1).padStart(5, "0");
  return `DISP/${year}/${serial}`;
};

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";

export function RecordsRetentionProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const { data: records = [], isLoading: isLoadingRecords } = useQuery({
    queryKey: ["retention-records"],
    queryFn: () => api.getRetentionRecords(),
  });

  const { data: appraisals = [], isLoading: isLoadingAppraisals } = useQuery({
    queryKey: ["retention-appraisals"],
    queryFn: () => api.getAppraisals(),
  });

  const { data: disposals = [], isLoading: isLoadingDisposals } = useQuery({
    queryKey: ["retention-disposals"],
    queryFn: () => api.getDisposals(),
  });

  const createRecordMutation = useMutation({
    mutationFn: (data: Omit<RetentionRecord, "id">) => api.createRetentionRecord(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["retention-records"] }),
  });

  const updateRecordMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<RetentionRecord> }) => api.updateRetentionRecord(id, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["retention-records"] }),
  });

  const createAppraisalMutation = useMutation({
    mutationFn: (data: Omit<AppraisalWorkflow, "id">) => api.createAppraisal(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["retention-appraisals"] }),
  });

  const updateAppraisalMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<AppraisalWorkflow> }) => api.updateAppraisal(id, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["retention-appraisals"] }),
  });

  const createDisposalMutation = useMutation({
    mutationFn: (data: Omit<DisposalRecord, "id">) => api.createDisposal(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["retention-disposals"] });
      queryClient.invalidateQueries({ queryKey: ["retention-appraisals"] });
    },
  });

  const addRecord = async (record: Omit<RetentionRecord, "id" | "recordCode" | "expiryDate" | "status" | "createdAt" | "updatedAt">): Promise<RetentionRecord> => {
    const payload = {
      ...record,
      recordCode: generateRecordCode(record.category, records),
      expiryDate: calculateExpiryDate(record.creationDate, record.retentionYears),
      status: "Active" as RecordStatus,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    return createRecordMutation.mutateAsync(payload as Omit<RetentionRecord, "id">);
  };

  const updateRecord = async (id: string, updates: Partial<RetentionRecord>) => {
    await updateRecordMutation.mutateAsync({ id, updates });
  };

  const initiateAppraisal = async (recordId: string, initiatedBy: string): Promise<AppraisalWorkflow> => {
    const record = records.find(r => r.id === recordId);
    if (!record) throw new Error("Record not found");

    const payload: Omit<AppraisalWorkflow, "id"> = {
      recordId,
      recordCode: record.recordCode,
      recordTitle: record.title,
      initiatedBy,
      initiatedDate: new Date().toISOString().split("T")[0],
      status: "Pending",
    };

    const newAppraisal = await createAppraisalMutation.mutateAsync(payload);
    await updateRecord(recordId, { status: "Due_for_Appraisal" });
    return newAppraisal;
  };

  const submitAppraisalDecision = async (
    appraisalId: string,
    decision: AppraisalDecision,
    justification: string,
    appraisedBy: string
  ) => {
    await updateAppraisalMutation.mutateAsync({
      id: appraisalId,
      updates: {
        decision,
        justification,
        appraisedBy,
        appraisalDate: new Date().toISOString().split("T")[0],
        status: "Appraised",
      }
    });
  };

  const authorizeAppraisal = async (appraisalId: string, authorizedBy: string) => {
    const appraisal = appraisals.find(a => a.id === appraisalId);
    if (!appraisal) return;

    await updateAppraisalMutation.mutateAsync({
      id: appraisalId,
      updates: {
        authorizedBy,
        authorizationDate: new Date().toISOString().split("T")[0],
        status: "Authorized",
      }
    });

    if (appraisal.decision === "Dispose") {
      await updateRecord(appraisal.recordId, { status: "Pending_Disposal" });
    } else if (appraisal.decision === "Archive") {
      await updateRecord(appraisal.recordId, { status: "Archived" });
    } else if (appraisal.decision === "Extend") {
      const record = records.find(r => r.id === appraisal.recordId);
      if (record) {
        const newExpiry = calculateExpiryDate(record.expiryDate, 2);
        await updateRecord(appraisal.recordId, {
          status: "Active",
          expiryDate: newExpiry,
          lastReviewDate: new Date().toISOString().split("T")[0],
        });
      }
    } else {
      await updateRecord(appraisal.recordId, {
        status: "Active",
        lastReviewDate: new Date().toISOString().split("T")[0],
      });
    }
  };

  const rejectAppraisal = async (appraisalId: string, comments: string) => {
    const appraisal = appraisals.find(a => a.id === appraisalId);
    if (!appraisal) return;

    await updateAppraisalMutation.mutateAsync({
      id: appraisalId,
      updates: { comments, status: "Rejected" },
    });
    await updateRecord(appraisal.recordId, { status: "Active" });
  };

  const recordDisposal = async (disposal: Omit<DisposalRecord, "id" | "certificateNumber">): Promise<DisposalRecord> => {
    const payload = {
      ...disposal,
      certificateNumber: generateCertificateNumber(disposals),
    };

    const newDisposal = await createDisposalMutation.mutateAsync(payload);
    await updateRecord(disposal.recordId, { status: "Disposed" });

    await updateAppraisalMutation.mutateAsync({
      id: disposal.appraisalId,
      updates: { status: "Completed" }
    });

    return newDisposal;
  };

  const getRecordsDueForAppraisal = (): RetentionRecord[] => {
    const today = new Date();
    const sixMonthsFromNow = new Date();
    sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);

    return records.filter(r => {
      if (r.status !== "Active") return false;
      const expiry = new Date(r.expiryDate);
      return expiry <= sixMonthsFromNow && expiry >= today;
    });
  };

  const getOverdueRecords = (): RetentionRecord[] => {
    const today = new Date();
    return records.filter(r => {
      if (r.status !== "Active") return false;
      const expiry = new Date(r.expiryDate);
      return expiry < today;
    });
  };

  return (
    <RecordsRetentionContext.Provider value={{
      records,
      appraisals,
      disposals,
      addRecord,
      updateRecord,
      initiateAppraisal,
      submitAppraisalDecision,
      authorizeAppraisal,
      rejectAppraisal,
      recordDisposal,
      getRecordsDueForAppraisal,
      getOverdueRecords,
      isLoading: isLoadingRecords || isLoadingAppraisals || isLoadingDisposals,
    }}>
      {children}
    </RecordsRetentionContext.Provider>
  );
}

export function useRecordsRetention() {
  const context = useContext(RecordsRetentionContext);
  if (!context) {
    throw new Error("useRecordsRetention must be used within a RecordsRetentionProvider");
  }
  return context;
}
