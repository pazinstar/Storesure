import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';

export interface AuditLog {
  id: string;
  action: string;
  module: 'Stores' | 'Procurement' | 'Assets' | 'Library' | 'System' | 'Reports' | 'Admin';
  description: string;
  user: string;
  userRole: string;
  timestamp: string;
  ipAddress: string;
}

interface AuditContextType {
  logs: AuditLog[];
  addLog: (action: string, module: AuditLog['module'], description: string) => void;
  clearLogs: () => void;
}

const AuditContext = createContext<AuditContextType | undefined>(undefined);

const generateId = () => Math.random().toString(36).substring(2, 15);
const getTimestamp = () => new Date().toISOString().replace('T', ' ').substring(0, 19);
const getMockIP = () => `192.168.1.${Math.floor(Math.random() * 100) + 10}`;

export function AuditProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>(() => {
    const stored = localStorage.getItem('auditLogs');
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    localStorage.setItem('auditLogs', JSON.stringify(logs.slice(0, 500))); // Keep last 500 logs
  }, [logs]);

  const addLog = (action: string, module: AuditLog['module'], description: string) => {
    if (!user) return;
    
    const newLog: AuditLog = {
      id: generateId(),
      action,
      module,
      description,
      user: `${user.name} (${user.role.charAt(0).toUpperCase() + user.role.slice(1)})`,
      userRole: user.role,
      timestamp: getTimestamp(),
      ipAddress: getMockIP(),
    };

    setLogs(prev => [newLog, ...prev]);
  };

  const clearLogs = () => {
    setLogs([]);
    localStorage.removeItem('auditLogs');
  };

  return (
    <AuditContext.Provider value={{ logs, addLog, clearLogs }}>
      {children}
    </AuditContext.Provider>
  );
}

export function useAudit() {
  const context = useContext(AuditContext);
  if (context === undefined) {
    throw new Error('useAudit must be used within an AuditProvider');
  }
  return context;
}
