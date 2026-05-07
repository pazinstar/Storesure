import { useSchool } from "@/contexts/SchoolContext";

export interface LSOPrintData {
  lsoNumber: string;
  date: string;
  requisitionRef?: string;
  procurementMethod?: string;
  quotationRef?: string;
  serviceProviderName?: string;
  providerKraPin?: string;
  providerAddress?: string;
  providerPhone?: string;
  providerEmail?: string;
  serviceDescription?: string;
  serviceLocation?: string;
  startDate?: string;
  completionDate?: string;
  account?: string;
  voteHead?: string;
  items: Array<{
    description: string;
    unit: string;
    quantity: number;
    unitCost: number;
    total: number;
  }>;
  subtotal?: number;
  vat?: number;
  totalCost?: number;
  preparedBy?: string;
  preparedAt?: string;
  authorizedBy?: string;
  principal?: string;
  notes?: string;
}

interface LSOPrintTemplateProps {
  data: LSOPrintData;
}

export default function LSOPrintTemplate({ data }: LSOPrintTemplateProps) {
  const { currentSchool } = useSchool();

  const subtotal = data.subtotal ?? data.items.reduce((s, it) => s + (it.total || (it.quantity * it.unitCost)), 0);
  const vat = data.vat ?? 0;
  const total = data.totalCost ?? subtotal + vat;

  return (
    <div className="print-template bg-white text-black p-8 max-w-4xl mx-auto font-serif">
      <div className="text-center mb-2">
        <h1 className="text-xl font-bold uppercase tracking-wide">{currentSchool?.name || 'School Name'}</h1>
        <h2 className="text-lg font-bold uppercase mt-2">LOCAL SERVICE ORDER (LSO)</h2>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div className="flex"><span className="font-bold w-40">LSO No</span><span className="border-b flex-1 px-2">{data.lsoNumber}</span></div>
        <div className="flex"><span className="font-bold w-40">Date</span><span className="border-b flex-1 px-2">{data.date}</span></div>
        <div className="flex"><span className="font-bold w-40">Requisition No</span><span className="border-b flex-1 px-2">{data.requisitionRef || 'N/A'}</span></div>
        <div className="flex"><span className="font-bold w-40">Procurement Method</span><span className="border-b flex-1 px-2">{data.procurementMethod || 'RFQ / Direct'}</span></div>
        <div className="flex"><span className="font-bold w-40">Quotation Ref</span><span className="border-b flex-1 px-2">{data.quotationRef || ''}</span></div>
      </div>

      <div className="border-2 border-black p-4 mb-4 text-sm">
        <p className="font-bold mb-2">SERVICE PROVIDER DETAILS</p>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex"><span className="font-bold w-36">Provider Name</span><span>{data.serviceProviderName || '__________________'}</span></div>
          <div className="flex"><span className="font-bold w-36">KRA PIN</span><span>{data.providerKraPin || '__________________'}</span></div>
          <div className="flex col-span-2"><span className="font-bold w-36">Address</span><span>{data.providerAddress || '__________________'}</span></div>
          <div className="flex"><span className="font-bold w-36">Phone</span><span>{data.providerPhone || '__________________'}</span></div>
          <div className="flex"><span className="font-bold w-36">Email</span><span>{data.providerEmail || '__________________'}</span></div>
        </div>
      </div>

      <div className="mb-4 text-sm">
        <p className="font-bold mb-2">SERVICE DETAILS</p>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex"><span className="font-bold w-40">Service Description</span><span>{data.serviceDescription || '__________________'}</span></div>
          <div className="flex"><span className="font-bold w-40">Service Location</span><span>{data.serviceLocation || '__________________'}</span></div>
          <div className="flex"><span className="font-bold w-40">Start Date</span><span>{data.startDate || ' __ / __ / ____'}</span></div>
          <div className="flex"><span className="font-bold w-40">Completion Date</span><span>{data.completionDate || ' __ / __ / ____'}</span></div>
        </div>
      </div>

      <div className="mb-4">
        <p className="font-bold mb-2">FINANCIAL CLASSIFICATION</p>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex"><span className="font-bold w-40">Account</span><span className="border-b flex-1 px-2">{data.account || 'Operations / School Fund'}</span></div>
          <div className="flex"><span className="font-bold w-40">Vote Head</span><span className="border-b flex-1 px-2">{data.voteHead || 'Maintenance & Improvements'}</span></div>
        </div>
      </div>

      <div className="mb-4">
        <table className="w-full border-collapse border-2 border-black text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-black px-2 py-1 text-left">Description</th>
              <th className="border border-black px-2 py-1 text-center">Unit</th>
              <th className="border border-black px-2 py-1 text-center">Qty</th>
              <th className="border border-black px-2 py-1 text-right">Unit Cost (KES)</th>
              <th className="border border-black px-2 py-1 text-right">Total (KES)</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((it, idx) => (
              <tr key={idx}>
                <td className="border border-black px-2 py-1">{it.description}</td>
                <td className="border border-black px-2 py-1 text-center">{it.unit}</td>
                <td className="border border-black px-2 py-1 text-center">{it.quantity}</td>
                <td className="border border-black px-2 py-1 text-right">{it.unitCost.toLocaleString('en-KE', {minimumFractionDigits:2})}</td>
                <td className="border border-black px-2 py-1 text-right">{(it.total).toLocaleString('en-KE', {minimumFractionDigits:2})}</td>
              </tr>
            ))}
            <tr className="font-bold bg-gray-100">
              <td colSpan={4} className="border border-black px-2 py-2 text-right">Subtotal</td>
              <td className="border border-black px-2 py-2 text-right">{subtotal.toLocaleString('en-KE', {minimumFractionDigits:2})}</td>
            </tr>
            <tr className="font-bold">
              <td colSpan={4} className="border border-black px-2 py-2 text-right">VAT</td>
              <td className="border border-black px-2 py-2 text-right">{vat.toLocaleString('en-KE', {minimumFractionDigits:2})}</td>
            </tr>
            <tr className="font-bold bg-gray-100">
              <td colSpan={4} className="border border-black px-2 py-2 text-right">Total Cost</td>
              <td className="border border-black px-2 py-2 text-right">{total.toLocaleString('en-KE', {minimumFractionDigits:2})}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mb-6 text-sm">
        <p className="font-bold mb-2">TERMS & CONDITIONS</p>
        <ol className="list-decimal list-inside text-sm">
          <li>Service must be performed as per agreed specifications.</li>
          <li>Work is subject to inspection and acceptance by the school.</li>
          <li>Payment will only be made upon satisfactory completion.</li>
          <li>This LSO must be referenced in all service reports and invoices.</li>
          <li>LSO validity period applies as stated.</li>
        </ol>
      </div>

      <div className="grid grid-cols-3 gap-4 text-sm">
        <div className="border-2 border-black p-3">
          <p className="font-bold mb-4">Prepared By</p>
          <div className="flex"><span className="w-24">Name:</span><span className="border-b flex-1 px-2">{data.preparedBy || ''}</span></div>
          <div className="flex mt-2"><span className="w-24">Signature:</span><span className="border-b flex-1 px-2"></span></div>
          <div className="flex mt-2"><span className="w-24">Date:</span><span className="border-b flex-1 px-2">{data.preparedAt || ''}</span></div>
        </div>
        <div className="border-2 border-black p-3">
          <p className="font-bold mb-4">Authorized By (Bursar)</p>
          <div className="flex"><span className="w-24">Name:</span><span className="border-b flex-1 px-2">{data.authorizedBy || ''}</span></div>
          <div className="flex mt-2"><span className="w-24">Signature:</span><span className="border-b flex-1 px-2"></span></div>
          <div className="flex mt-2"><span className="w-24">Date:</span><span className="border-b flex-1 px-2"></span></div>
        </div>
        <div className="border-2 border-black p-3">
          <p className="font-bold mb-4">Principal</p>
          <div className="flex"><span className="w-24">Name:</span><span className="border-b flex-1 px-2">{data.principal || ''}</span></div>
          <div className="flex mt-2"><span className="w-24">Signature:</span><span className="border-b flex-1 px-2"></span></div>
          <div className="flex mt-2"><span className="w-24">Date:</span><span className="border-b flex-1 px-2"></span></div>
        </div>
      </div>

      <div className="mt-8 pt-4 border-t border-gray-400 text-xs text-gray-600 text-center">
        <p>Generated By StoreSure • Print Date: {new Date().toLocaleString()}</p>
      </div>

      <style>{`
        @media print {
          .print-template { padding: 0; margin: 0; font-size: 10pt; }
          @page { margin: 1.5cm; size: A4; }
        }
      `}</style>
    </div>
  );
}
