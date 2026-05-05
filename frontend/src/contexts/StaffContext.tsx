import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { staffService } from "@/services/staff.service";
import { toast } from "sonner";

export type StaffType = "teaching" | "non-teaching";

export interface Staff {
  id: string;
  tscNumber?: string;
  staffNumber?: string;
  inventoryNumber: string;
  name: string;
  email: string;
  phone: string;
  type: StaffType;
  designation: string;
  department: string;
  dateJoined: Date;
  status: "active" | "inactive" | "on_leave";
  idNumber?: string;
  gender?: "male" | "female";
  subjects?: string[];
  notes?: string;
  userId?: string;  // linked SystemUser id
}

export const DEPARTMENTS = [
  "Administration", "Mathematics", "Sciences", "Languages",
  "Humanities", "Technical", "ICT", "Library",
  "Finance", "Transport", "Kitchen", "Security", "Maintenance",
] as const;

interface StaffContextType {
  staff: Staff[];
  addStaff: (staff: Omit<Staff, "id">) => void;
  updateStaff: (id: string, updates: Partial<Staff>) => void;
  deleteStaff: (id: string) => void;
  getStaffById: (id: string) => Staff | undefined;
  getStaffByType: (type: StaffType) => Staff[];
}

const StaffContext = createContext<StaffContextType | undefined>(undefined);

export function StaffProvider({ children }: { children: ReactNode }) {
  const [staff, setStaff] = useState<Staff[]>([]);

  useEffect(() => {
    staffService.getStaff().then(setStaff).catch(console.error);
  }, []);

  const addStaff = (newStaff: Omit<Staff, "id">) => {
    const tempId = `temp-${Date.now()}`;
    const optimistic: Staff = { ...newStaff, id: tempId };
    setStaff((prev) => [...prev, optimistic]);

    staffService.createStaff(newStaff)
      .then((created) => setStaff((prev) => prev.map((s) => (s.id === tempId ? created : s))))
      .catch((err: Error) => {
        setStaff((prev) => prev.filter((s) => s.id !== tempId));
        toast.error(err.message || "Failed to add staff member");
      });
  };

  const updateStaff = (id: string, updates: Partial<Staff>) => {
    let snapshot: Staff | undefined;
    setStaff((prev) => {
      snapshot = prev.find((s) => s.id === id);
      return prev.map((s) => (s.id === id ? { ...s, ...updates } : s));
    });

    staffService.updateStaff(id, updates)
      .then((updated) => setStaff((prev) => prev.map((s) => (s.id === id ? updated : s))))
      .catch((err: Error) => {
        if (snapshot) setStaff((prev) => prev.map((s) => (s.id === id ? snapshot! : s)));
        toast.error(err.message || "Failed to update staff member");
      });
  };

  const deleteStaff = (id: string) => {
    let snapshot: Staff | undefined;
    setStaff((prev) => {
      snapshot = prev.find((s) => s.id === id);
      return prev.filter((s) => s.id !== id);
    });

    staffService.deleteStaff(id)
      .catch((err: Error) => {
        if (snapshot) setStaff((prev) => [...prev, snapshot!]);
        toast.error(err.message || "Failed to delete staff member");
      });
  };

  const getStaffById = (id: string) => staff.find((s) => s.id === id);
  const getStaffByType = (type: StaffType) => staff.filter((s) => s.type === type);

  return (
    <StaffContext.Provider value={{ staff, addStaff, updateStaff, deleteStaff, getStaffById, getStaffByType }}>
      {children}
    </StaffContext.Provider>
  );
}

export function useStaff() {
  const context = useContext(StaffContext);
  if (!context) throw new Error("useStaff must be used within a StaffProvider");
  return context;
}
