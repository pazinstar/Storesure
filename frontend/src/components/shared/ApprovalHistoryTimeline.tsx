import React from 'react'

export type ApprovalItem = { id:string; approver:string; level:number; decision:string; comments?:string; date?:string }

export const ApprovalHistoryTimeline: React.FC<{ items: ApprovalItem[] }> = ({ items }) => {
  if (!items || items.length===0) return <div className="text-sm text-gray-500">No approvals yet.</div>
  return (
    <ol className="border-l ml-2">
      {items.map((it) => (
        <li key={it.id} className="mb-4 ml-4">
          <div className="text-sm text-gray-600">Level {it.level} — {it.date}</div>
          <div className="font-medium">{it.approver} — <span className="capitalize">{it.decision}</span></div>
          {it.comments && <div className="text-sm text-gray-700 mt-1">{it.comments}</div>}
        </li>
      ))}
    </ol>
  )
}

export default ApprovalHistoryTimeline
