import { useCallback } from 'react';
import { useAudit, AuditLog } from '@/contexts/AuditContext';

export function useAuditLog() {
  const { addLog } = useAudit();

  const logStoresAction = useCallback((action: string, description: string) => {
    addLog(action, 'Stores', description);
  }, [addLog]);

  const logProcurementAction = useCallback((action: string, description: string) => {
    addLog(action, 'Procurement', description);
  }, [addLog]);

  const logAssetsAction = useCallback((action: string, description: string) => {
    addLog(action, 'Assets', description);
  }, [addLog]);

  const logLibraryAction = useCallback((action: string, description: string) => {
    addLog(action, 'Library', description);
  }, [addLog]);

  const logSystemAction = useCallback((action: string, description: string) => {
    addLog(action, 'System', description);
  }, [addLog]);

  const logReportAction = useCallback((action: string, description: string) => {
    addLog(action, 'Reports', description);
  }, [addLog]);

  return {
    logStoresAction,
    logProcurementAction,
    logAssetsAction,
    logLibraryAction,
    logSystemAction,
    logReportAction,
  };
}
