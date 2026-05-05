import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface SchoolBranding {
  logo?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
}

export interface School {
  id: string;
  name: string;
  code: string;
  address: string;
  email: string;
  phone: string;
  website?: string;
  principal: string;
  status: 'active' | 'inactive' | 'suspended';
  branding: SchoolBranding;
  createdAt: string;
  studentCount?: number;
  staffCount?: number;
}

interface SchoolContextType {
  schools: School[];
  currentSchool: School | null;
  addSchool: (school: Omit<School, 'id' | 'createdAt'>) => void;
  updateSchool: (id: string, updates: Partial<School>) => void;
  deleteSchool: (id: string) => void;
  setCurrentSchool: (id: string) => void;
  updateSchoolBranding: (id: string, branding: Partial<SchoolBranding>) => void;
}

const SchoolContext = createContext<SchoolContextType | undefined>(undefined);

const defaultBranding: SchoolBranding = {
  primaryColor: '#2563eb',
  secondaryColor: '#64748b',
  accentColor: '#f59e0b',
};

const initialSchools: School[] = [
  {
    id: '1',
    name: 'Greenwood High School',
    code: 'GHS001',
    address: '123 Education Lane, Academic City',
    email: 'admin@greenwood.edu',
    phone: '+1 234 567 8900',
    website: 'www.greenwood.edu',
    principal: 'Dr. Sarah Johnson',
    status: 'active',
    branding: { ...defaultBranding },
    createdAt: '2024-01-15',
    studentCount: 1250,
    staffCount: 85,
  },
  {
    id: '2',
    name: 'Riverside Academy',
    code: 'RSA002',
    address: '456 River Road, Riverside District',
    email: 'info@riverside.edu',
    phone: '+1 234 567 8901',
    principal: 'Mr. James Wilson',
    status: 'active',
    branding: { 
      primaryColor: '#059669',
      secondaryColor: '#6b7280',
      accentColor: '#8b5cf6',
    },
    createdAt: '2024-02-20',
    studentCount: 980,
    staffCount: 62,
  },
  {
    id: '3',
    name: 'Mountain View School',
    code: 'MVS003',
    address: '789 Highland Ave, Mountain Town',
    email: 'contact@mountainview.edu',
    phone: '+1 234 567 8902',
    principal: 'Ms. Emily Chen',
    status: 'inactive',
    branding: { ...defaultBranding, primaryColor: '#dc2626' },
    createdAt: '2024-03-10',
    studentCount: 650,
    staffCount: 45,
  },
];

export function SchoolProvider({ children }: { children: ReactNode }) {
  const [schools, setSchools] = useState<School[]>(initialSchools);
  const [currentSchool, setCurrentSchoolState] = useState<School | null>(initialSchools[0]);

  const addSchool = (school: Omit<School, 'id' | 'createdAt'>) => {
    const newSchool: School = {
      ...school,
      id: Date.now().toString(),
      createdAt: new Date().toISOString().split('T')[0],
    };
    setSchools(prev => [...prev, newSchool]);
  };

  const updateSchool = (id: string, updates: Partial<School>) => {
    setSchools(prev => prev.map(school => 
      school.id === id ? { ...school, ...updates } : school
    ));
    if (currentSchool?.id === id) {
      setCurrentSchoolState(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  const deleteSchool = (id: string) => {
    setSchools(prev => prev.filter(school => school.id !== id));
    if (currentSchool?.id === id) {
      setCurrentSchoolState(null);
    }
  };

  const setCurrentSchool = (id: string) => {
    const school = schools.find(s => s.id === id);
    setCurrentSchoolState(school || null);
  };

  const updateSchoolBranding = (id: string, branding: Partial<SchoolBranding>) => {
    setSchools(prev => prev.map(school => 
      school.id === id 
        ? { ...school, branding: { ...school.branding, ...branding } } 
        : school
    ));
    if (currentSchool?.id === id) {
      setCurrentSchoolState(prev => 
        prev ? { ...prev, branding: { ...prev.branding, ...branding } } : null
      );
    }
  };

  return (
    <SchoolContext.Provider value={{
      schools,
      currentSchool,
      addSchool,
      updateSchool,
      deleteSchool,
      setCurrentSchool,
      updateSchoolBranding,
    }}>
      {children}
    </SchoolContext.Provider>
  );
}

export function useSchool() {
  const context = useContext(SchoolContext);
  if (!context) {
    throw new Error('useSchool must be used within a SchoolProvider');
  }
  return context;
}
