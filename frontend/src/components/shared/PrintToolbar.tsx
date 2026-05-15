import React from 'react'

export const PrintToolbar: React.FC<{ onPrint?: ()=>void; onPdf?: ()=>void }> = ({ onPrint, onPdf }) => {
  return (
    <div className="flex gap-2 items-center">
      <button onClick={() => (onPrint ? onPrint() : window.print())} className="px-3 py-1 bg-gray-800 text-white rounded">Print</button>
      <button onClick={onPdf} className="px-3 py-1 border rounded">Export PDF</button>
    </div>
  )
}

export default PrintToolbar
