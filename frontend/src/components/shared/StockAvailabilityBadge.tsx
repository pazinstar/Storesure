import React from 'react'

export const StockAvailabilityBadge: React.FC<{ inStock?: number; available?: number }> = ({ inStock=0, available=0 }) => {
  const low = available <= 0
  return (
    <div className="inline-flex items-center gap-2">
      <span className={`px-2 py-0.5 rounded text-xs ${low ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
        Available: {available}
      </span>
      <span className="text-xs text-gray-500">In stock: {inStock}</span>
    </div>
  )
}

export default StockAvailabilityBadge
