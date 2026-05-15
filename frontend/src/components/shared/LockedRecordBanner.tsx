import React from 'react'

export const LockedRecordBanner: React.FC<{ locked?: boolean; locker?: string; when?: string }> = ({ locked, locker, when }) => {
  if (!locked) return null
  return (
    <div className="bg-red-50 border-l-4 border-red-500 p-3 text-sm text-red-800">
      <div className="font-semibold">Record Locked</div>
      <div>Locked by: {locker || 'system'}</div>
      {when && <div className="text-xs text-gray-600">{when}</div>}
    </div>
  )
}

export default LockedRecordBanner
