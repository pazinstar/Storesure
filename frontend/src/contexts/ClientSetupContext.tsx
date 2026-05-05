import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { clientSetupService } from '@/services/clientSetup.service';
import { toast } from 'sonner';

export interface ModuleLink {
  id: string;
  name: string;
  href: string;
  enabled: boolean;
}

export interface SchoolModule {
  id: string;
  name: string;
  icon: string;
  enabled: boolean;
  links: ModuleLink[];
}

export interface SchoolHeadteacher {
  id: string;
  name: string;
  email: string;
  phone: string;
  password?: string;
}

export type SchoolCategory = 'day' | 'boarding_a' | 'boarding_b' | 'special_needs';

export const SCHOOL_CATEGORIES: { value: SchoolCategory; label: string }[] = [
  { value: 'day', label: 'Day School' },
  { value: 'boarding_a', label: 'Boarding Category A*' },
  { value: 'boarding_b', label: 'Boarding Category B*' },
  { value: 'special_needs', label: 'Special Needs Boarding' },
];

export interface ClientSchool {
  id: string;
  name: string;
  code: string;
  address: string;
  email: string;
  phone: string;
  website?: string;
  type?: 'primary' | 'secondary' | 'tertiary' | 'mixed';
  category?: SchoolCategory;
  county?: string;
  status: 'active' | 'inactive' | 'suspended';
  modules: SchoolModule[];
  headteacher?: SchoolHeadteacher;
  createdAt: string;
  subscriptionPlan: 'basic' | 'standard' | 'premium';
  expiryDate: string;
}

// Available modules with their links
export const availableModules: Omit<SchoolModule, 'enabled'>[] = [
  {
    id: 'procurement',
    name: 'Procurement',
    icon: 'ShoppingCart',
    links: [
      { id: 'proc-dashboard', name: 'Procurement Dashboard', href: '/procurement', enabled: true },
      { id: 'proc-refs', name: 'Reference Generator', href: '/procurement/references', enabled: true },
      { id: 'proc-reqs', name: 'Requisitions', href: '/procurement/requisitions', enabled: true },
      { id: 'proc-tenders', name: 'Quotations/Tenders', href: '/procurement/tenders', enabled: true },
      { id: 'proc-lpo', name: 'LPO Management', href: '/procurement/lpo', enabled: true },
      { id: 'proc-contracts', name: 'Contract Register', href: '/procurement/contracts', enabled: true },
      { id: 'proc-reports', name: 'Procurement Reports', href: '/procurement/reports', enabled: true },
    ],
  },
  {
    id: 'stores',
    name: 'Stores',
    icon: 'Warehouse',
    links: [
      { id: 'store-dashboard', name: 'Store Dashboard', href: '/stores', enabled: true },
      { id: 'store-suppliers', name: 'Suppliers Register', href: '/procurement/suppliers', enabled: true },
      { id: 'store-items', name: 'Item Master', href: '/stores/items', enabled: true },
      { id: 'store-s12', name: 'Requisition', href: '/stores/s12', enabled: true },
      { id: 'store-lpo', name: 'Purchase Orders (LPO)', href: '/stores/lpo', enabled: true },
      { id: 'store-delivery', name: 'Delivery Logging', href: '/stores/delivery', enabled: true },
      { id: 'store-inspection', name: 'Inspection & Acceptance', href: '/stores/inspection', enabled: true },
      { id: 'store-receive', name: 'Receive Stock (GRN)', href: '/stores/receive', enabled: true },
      { id: 'store-issue', name: 'Issue Stock', href: '/stores/issue', enabled: true },
      { id: 'store-ria', name: 'Routine Issue Authorities', href: '/stores/ria', enabled: true },
      { id: 'store-sriv', name: 'SRIV', href: '/stores/sriv', enabled: true },
      { id: 'store-ledger', name: 'Ledgers', href: '/stores/ledger', enabled: true },
      { id: 'store-reports', name: 'Store Reports', href: '/stores/reports', enabled: true },
    ],
  },
  {
    id: 'assets',
    name: 'Assets',
    icon: 'Building2',
    links: [
      { id: 'asset-register', name: 'Asset Register', href: '/assets', enabled: true },
      { id: 'asset-movement', name: 'Asset Movement', href: '/assets/movement', enabled: true },
      { id: 'asset-survey', name: 'Board of Survey', href: '/assets/survey', enabled: true },
      { id: 'asset-disposal', name: 'Disposal', href: '/assets/disposal', enabled: true },
      { id: 'asset-reports', name: 'Asset Reports', href: '/assets/reports', enabled: true },
    ],
  },
  {
    id: 'library',
    name: 'Library',
    icon: 'BookOpen',
    links: [
      { id: 'lib-dashboard', name: 'Library Dashboard', href: '/library', enabled: true },
      { id: 'lib-receive', name: 'Receive (Books In)', href: '/library/receive', enabled: true },
      { id: 'lib-catalogue', name: 'Catalogue / Register', href: '/library/catalogue', enabled: true },
      { id: 'lib-circulation', name: 'Issue/Return', href: '/library/circulation', enabled: true },
      { id: 'lib-reports', name: 'Library Reports', href: '/library/reports', enabled: true },
    ],
  },
  {
    id: 'students',
    name: 'Students',
    icon: 'GraduationCap',
    links: [
      { id: 'stu-register', name: 'Student Register', href: '/students', enabled: true },
      { id: 'stu-distribution', name: 'Student Distribution', href: '/students/distribution', enabled: true },
      { id: 'stu-reports', name: 'Distribution Reports', href: '/students/distribution-reports', enabled: true },
    ],
  },
  {
    id: 'staff',
    name: 'Staff',
    icon: 'UserCog',
    links: [
      { id: 'staff-register', name: 'Staff Register', href: '/staff', enabled: true },
    ],
  },
  {
    id: 'finance',
    name: 'Finance',
    icon: 'DollarSign',
    links: [
      { id: 'fin-accounts', name: 'Chart of Accounts', href: '/finance/chart-of-accounts', enabled: true },
      { id: 'fin-budgeting', name: 'Budgeting', href: '/finance/budgeting', enabled: true },
      { id: 'fin-plan', name: 'Procurement Plan', href: '/finance/procurement-plan', enabled: true },
      { id: 'fin-receipting', name: 'Receipting', href: '/finance/receipting', enabled: true },
      { id: 'fin-cashbook', name: 'Cash Book', href: '/finance/cash-book', enabled: true },
      { id: 'fin-payments', name: 'Payments', href: '/finance/payments', enabled: true },
      { id: 'fin-reports', name: 'Reports', href: '/finance/reports', enabled: true },
    ],
  },
  {
    id: 'administration',
    name: 'Administration',
    icon: 'Settings',
    links: [
      { id: 'admin-setup', name: 'Setup', href: '/admin/control-panel', enabled: true },
      { id: 'admin-schools', name: 'Schools Management', href: '/admin/client-setup', enabled: true },
      { id: 'admin-branding', name: 'School Branding', href: '/admin/branding', enabled: true },
      { id: 'admin-users', name: 'User Management', href: '/admin/users', enabled: true },
      { id: 'admin-roles', name: 'Role Management', href: '/admin/roles', enabled: true },
    ],
  },
];

interface ClientSetupContextType {
  clientSchools: ClientSchool[];
  loading: boolean;
  addClientSchool: (school: Omit<ClientSchool, 'id' | 'createdAt'>) => Promise<void>;
  updateClientSchool: (id: string, updates: Partial<ClientSchool>) => Promise<void>;
  deleteClientSchool: (id: string) => Promise<void>;
  updateSchoolModules: (schoolId: string, modules: SchoolModule[]) => Promise<void>;
  updateSchoolHeadteacher: (schoolId: string, headteacher: SchoolHeadteacher) => Promise<void>;
  getSchoolById: (id: string) => ClientSchool | undefined;
  refresh: () => Promise<void>;
}

const ClientSetupContext = createContext<ClientSetupContextType | undefined>(undefined);

export function ClientSetupProvider({ children }: { children: ReactNode }) {
  const [clientSchools, setClientSchools] = useState<ClientSchool[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSchools = async () => {
    try {
      setLoading(true);
      const data = await clientSetupService.getSchools();
      setClientSchools(data);
    } catch (err) {
      toast.error('Failed to load schools');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchools();
  }, []);

  const addClientSchool = async (school: Omit<ClientSchool, 'id' | 'createdAt'>) => {
    const created = await clientSetupService.createSchool(school);
    setClientSchools(prev => [...prev, created]);
  };

  const updateClientSchool = async (id: string, updates: Partial<ClientSchool>) => {
    const updated = await clientSetupService.updateSchool(id, updates);
    setClientSchools(prev => prev.map(s => s.id === id ? { ...s, ...updated } : s));
  };

  const deleteClientSchool = async (id: string) => {
    await clientSetupService.deleteSchool(id);
    setClientSchools(prev => prev.filter(s => s.id !== id));
  };

  const updateSchoolModules = async (schoolId: string, modules: SchoolModule[]) => {
    await clientSetupService.updateModules(schoolId, modules);
    setClientSchools(prev => prev.map(s => s.id === schoolId ? { ...s, modules } : s));
  };

  const updateSchoolHeadteacher = async (schoolId: string, headteacher: SchoolHeadteacher) => {
    await clientSetupService.updateHeadteacher(schoolId, headteacher);
    setClientSchools(prev => prev.map(s => s.id === schoolId ? { ...s, headteacher } : s));
  };

  const getSchoolById = (id: string) => clientSchools.find(s => s.id === id);

  return (
    <ClientSetupContext.Provider value={{
      clientSchools,
      loading,
      addClientSchool,
      updateClientSchool,
      deleteClientSchool,
      updateSchoolModules,
      updateSchoolHeadteacher,
      getSchoolById,
      refresh: fetchSchools,
    }}>
      {children}
    </ClientSetupContext.Provider>
  );
}

export function useClientSetup() {
  const context = useContext(ClientSetupContext);
  if (!context) {
    throw new Error('useClientSetup must be used within a ClientSetupProvider');
  }
  return context;
}
