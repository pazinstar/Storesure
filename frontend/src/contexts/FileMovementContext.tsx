import React, { createContext, useContext, ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { FileMovement, FileStatus, FileCategory, MAX_BORROW_DAYS } from "@/mock/records.mock";
export type { FileStatus, FileCategory, FileMovement };

interface FileMovementContextType {
  movements: FileMovement[];
  borrowFile: (data: Omit<FileMovement, "id" | "status" | "returnSignature" | "actualReturnDate">) => Promise<FileMovement>;
  returnFile: (id: string, notes?: string) => Promise<FileMovement>;
  markAsLost: (id: string, notes: string) => Promise<FileMovement>;
  getOverdueFiles: () => FileMovement[];
  getFileHistory: (fileReference: string) => FileMovement[];
  clearMovements: () => void;
  isLoading: boolean;
}

const FileMovementContext = createContext<FileMovementContextType | undefined>(undefined);

export function FileMovementProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const { data: movements = [], isLoading } = useQuery({
    queryKey: ['file-movements'],
    queryFn: () => api.getFileMovements(),
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<FileMovement>) => api.createFileMovement(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['file-movements'] });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string, updates: Partial<FileMovement> }) => api.updateFileMovement(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['file-movements'] });
    }
  });

  const borrowFile = async (data: Omit<FileMovement, "id" | "status" | "returnSignature" | "actualReturnDate">) => {
    return await createMutation.mutateAsync({
      ...data,
      status: "Checked Out",
      returnSignature: false
    });
  };

  const returnFile = async (id: string, notes?: string) => {
    return await updateMutation.mutateAsync({
      id,
      updates: {
        status: "Returned",
        actualReturnDate: new Date().toISOString(),
        returnSignature: true,
        notes
      }
    });
  };

  const markAsLost = async (id: string, notes: string) => {
    return await updateMutation.mutateAsync({
      id,
      updates: {
        status: "Lost",
        notes
      }
    });
  };

  const getOverdueFiles = (): FileMovement[] => {
    return movements.filter((m) => {
      if (m.status === "Checked Out" && new Date(m.expectedReturnDate) < new Date()) {
        return true;
      }
      return m.status === "Overdue";
    });
  };

  const getFileHistory = (fileReference: string): FileMovement[] => {
    return movements.filter((m) => m.fileReference === fileReference);
  };

  const clearMovements = () => {
    // Unsupported natively on backend arrays usually, handled structurally via delete ops
  };

  return (
    <FileMovementContext.Provider
      value={{
        movements,
        borrowFile,
        returnFile,
        markAsLost,
        getOverdueFiles,
        getFileHistory,
        clearMovements,
        isLoading
      }}
    >
      {children}
    </FileMovementContext.Provider>
  );
}

export function useFileMovement() {
  const context = useContext(FileMovementContext);
  if (context === undefined) {
    throw new Error("useFileMovement must be used within a FileMovementProvider");
  }
  return context;
}

export { MAX_BORROW_DAYS };
