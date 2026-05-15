import React from 'react'

export const BudgetWarningAlert: React.FC<{ balance:number; thresholdPercent?:number }> = ({ balance, thresholdPercent=10 }) => {
  const low = balance <= 0
  const warn = balance > 0 && balance <= (thresholdPercent/100)*1000
  if (low) return <div className="p-2 bg-red-50 border-l-4 border-red-500 text-red-800">Budget exceeded or zero balance</div>
  if (warn) return <div className="p-2 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800">Budget low: {balance}</div>
  return null
}

export default BudgetWarningAlert
