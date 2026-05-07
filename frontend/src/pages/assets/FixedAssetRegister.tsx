import React from 'react'
import { Button } from '@/components/ui/button'

export default function FixedAssetRegister() {
  const base = '/api/v1/storekeeper/stores/assets/reports/register/'
  return (
    <div>
      <h2 className="text-lg font-medium">Fixed Asset Register</h2>
      <p className="mt-2">Download the Fixed Asset Register in your preferred format.</p>
      <div className="mt-4 flex gap-3">
        <a href={`${base}?format=csv`}><Button>Download CSV</Button></a>
        <a href={`${base}?format=excel`}><Button>Download Excel</Button></a>
        <a href={`${base}?format=pdf`}><Button>Download PDF</Button></a>
      </div>
    </div>
  )
}
