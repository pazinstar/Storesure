import React from 'react'

export interface AuditEntry { id: string; actor?: string; action?: string; timestamp?: string; details?: any }

export const AuditTrailViewer: React.FC<{ entries: AuditEntry[] }> = ({ entries }) => {
  if (!entries || entries.length === 0) return <div className="text-sm text-gray-500">No audit history available.</div>
  return (
    <div className="space-y-2">
      {entries.map(e => (
        <div key={e.id} className="p-2 border rounded bg-white shadow-sm">
          <div className="text-xs text-gray-400">{e.timestamp}</div>
          <div className="font-medium">{e.action || 'Action'}</div>
          <div className="text-sm text-gray-700">By: {e.actor || 'system'}</div>
          {e.details && <pre className="mt-2 text-xs text-gray-600">{JSON.stringify(e.details, null, 2)}</pre>}
        </div>
      ))}
    </div>
  )
}

export default AuditTrailViewer
