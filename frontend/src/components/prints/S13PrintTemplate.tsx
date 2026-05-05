import { useSchool } from "@/contexts/SchoolContext";

export interface S13PrintData {
  id: string;
  date: string;
  department: string;
  requestedBy: string;
  requisitionRef?: string;
  purpose?: string;
  items: Array<{
    description: string;
    unit: string;
    requestedQty: number;
    issuedQty: number;
    unitPrice: number;
  }>;
  issuedBy: string;
  issuedBySignature?: string;
  issuedAt?: string;
  status: string;
}

interface S13PrintTemplateProps {
  data: S13PrintData;
}

export default function S13PrintTemplate({ data }: S13PrintTemplateProps) {
  const { currentSchool } = useSchool();

  const totalValue = data.items.reduce(
    (sum, item) => sum + item.issuedQty * item.unitPrice,
    0
  );

  return (
    <div className="print-template bg-white text-black p-8 max-w-4xl mx-auto font-serif">
      {/* Header */}
      <div className="text-center border-b-2 border-black pb-4 mb-6">
        {currentSchool?.branding?.logo && (
          <img
            src={currentSchool.branding.logo}
            alt="School Logo"
            className="h-16 mx-auto mb-2"
          />
        )}
        <h1 className="text-xl font-bold uppercase tracking-wide">
          {currentSchool?.name || "Institution Name"}
        </h1>
        <p className="text-sm">{currentSchool?.address}</p>
        <p className="text-sm">
          Tel: {currentSchool?.phone} | Email: {currentSchool?.email}
        </p>
      </div>

      {/* Document Title */}
      <div className="text-center mb-6">
        <h2 className="text-lg font-bold uppercase border-2 border-black inline-block px-8 py-2">
          STORES ISSUE VOUCHER (S13)
        </h2>
        <p className="text-sm mt-1 text-gray-600">Stock Issue Note</p>
      </div>

      {/* Document Info */}
      <div className="grid grid-cols-2 gap-x-8 gap-y-2 mb-6 text-sm">
        <div className="flex">
          <span className="font-bold w-32">Document No:</span>
          <span className="border-b border-black flex-1 px-2">{data.id}</span>
        </div>
        <div className="flex">
          <span className="font-bold w-32">Date Issued:</span>
          <span className="border-b border-black flex-1 px-2">{data.date}</span>
        </div>
        <div className="flex">
          <span className="font-bold w-32">Department:</span>
          <span className="border-b border-black flex-1 px-2">{data.department}</span>
        </div>
        <div className="flex">
          <span className="font-bold w-32">Requested By:</span>
          <span className="border-b border-black flex-1 px-2">{data.requestedBy}</span>
        </div>
        <div className="flex">
          <span className="font-bold w-32">Requisition Ref:</span>
          <span className="border-b border-black flex-1 px-2">{data.requisitionRef || "N/A"}</span>
        </div>
        <div className="flex col-span-2">
          <span className="font-bold w-32">Purpose:</span>
          <span className="border-b border-black flex-1 px-2">{data.purpose || "General Use"}</span>
        </div>
      </div>

      {/* Items Table */}
      <div className="mb-6">
        <table className="w-full border-collapse border-2 border-black text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-black px-2 py-1 text-left w-8">No.</th>
              <th className="border border-black px-2 py-1 text-left">Description of Item</th>
              <th className="border border-black px-2 py-1 text-center w-16">Unit</th>
              <th className="border border-black px-2 py-1 text-center w-20">Requested</th>
              <th className="border border-black px-2 py-1 text-center w-20">Issued</th>
              <th className="border border-black px-2 py-1 text-right w-24">Unit Price</th>
              <th className="border border-black px-2 py-1 text-right w-28">Total Value</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item, index) => (
              <tr key={index}>
                <td className="border border-black px-2 py-1">{index + 1}</td>
                <td className="border border-black px-2 py-1">{item.description}</td>
                <td className="border border-black px-2 py-1 text-center">{item.unit}</td>
                <td className="border border-black px-2 py-1 text-center">{item.requestedQty}</td>
                <td className="border border-black px-2 py-1 text-center">{item.issuedQty}</td>
                <td className="border border-black px-2 py-1 text-right">
                  {item.unitPrice.toLocaleString("en-KE", { minimumFractionDigits: 2 })}
                </td>
                <td className="border border-black px-2 py-1 text-right">
                  {(item.issuedQty * item.unitPrice).toLocaleString("en-KE", {
                    minimumFractionDigits: 2,
                  })}
                </td>
              </tr>
            ))}
            {/* Empty rows for manual additions */}
            {[...Array(Math.max(0, 5 - data.items.length))].map((_, i) => (
              <tr key={`empty-${i}`}>
                <td className="border border-black px-2 py-3">&nbsp;</td>
                <td className="border border-black px-2 py-3"></td>
                <td className="border border-black px-2 py-3"></td>
                <td className="border border-black px-2 py-3"></td>
                <td className="border border-black px-2 py-3"></td>
                <td className="border border-black px-2 py-3"></td>
                <td className="border border-black px-2 py-3"></td>
              </tr>
            ))}
            {/* Total Row */}
            <tr className="bg-gray-100 font-bold">
              <td colSpan={6} className="border border-black px-2 py-1 text-right">
                TOTAL VALUE (KES):
              </td>
              <td className="border border-black px-2 py-1 text-right">
                {totalValue.toLocaleString("en-KE", { minimumFractionDigits: 2 })}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Signature Section - 3 columns */}
      <div className="grid grid-cols-3 gap-4 text-sm mb-6">
        <div className="border-2 border-black p-3">
          <p className="font-bold mb-6 text-center">ISSUED BY:</p>
          <p className="text-xs mb-1">(Storekeeper)</p>
          <div className="flex mb-2">
            <span className="w-16 text-xs">Name:</span>
            <span className="border-b border-black flex-1 px-1 text-xs">{data.issuedBy}</span>
          </div>
          <div className="flex mb-2">
            <span className="w-16 text-xs">Sign:</span>
            <span className="border-b border-black flex-1 px-1 text-xs italic">
              {data.issuedBySignature || ""}
            </span>
          </div>
          <div className="flex">
            <span className="w-16 text-xs">Date:</span>
            <span className="border-b border-black flex-1 px-1 text-xs">{data.issuedAt || ""}</span>
          </div>
        </div>

        <div className="border-2 border-black p-3">
          <p className="font-bold mb-6 text-center">RECEIVED BY:</p>
          <p className="text-xs mb-1">(Recipient/HOD)</p>
          <div className="flex mb-2">
            <span className="w-16 text-xs">Name:</span>
            <span className="border-b border-black flex-1 px-1 text-xs">{data.requestedBy}</span>
          </div>
          <div className="flex mb-2">
            <span className="w-16 text-xs">Sign:</span>
            <span className="border-b border-black flex-1 px-1"></span>
          </div>
          <div className="flex">
            <span className="w-16 text-xs">Date:</span>
            <span className="border-b border-black flex-1 px-1"></span>
          </div>
        </div>

        <div className="border-2 border-black p-3">
          <p className="font-bold mb-6 text-center">APPROVED BY:</p>
          <p className="text-xs mb-1">(Stores Officer/Bursar)</p>
          <div className="flex mb-2">
            <span className="w-16 text-xs">Name:</span>
            <span className="border-b border-black flex-1 px-1"></span>
          </div>
          <div className="flex mb-2">
            <span className="w-16 text-xs">Sign:</span>
            <span className="border-b border-black flex-1 px-1"></span>
          </div>
          <div className="flex">
            <span className="w-16 text-xs">Date:</span>
            <span className="border-b border-black flex-1 px-1"></span>
          </div>
        </div>
      </div>

      {/* Acknowledgement */}
      <div className="border-2 border-black p-4 mb-6">
        <p className="font-bold mb-2 text-sm">ACKNOWLEDGEMENT OF RECEIPT:</p>
        <p className="text-sm">
          I acknowledge receipt of the items listed above in good condition and correct quantities.
        </p>
        <div className="grid grid-cols-2 gap-8 mt-4 text-sm">
          <div className="flex">
            <span className="w-20">Signature:</span>
            <span className="border-b border-black flex-1 px-2"></span>
          </div>
          <div className="flex">
            <span className="w-20">Date:</span>
            <span className="border-b border-black flex-1 px-2"></span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-gray-400 text-xs text-gray-600 text-center">
        <p>Document Status: {data.status} | Generated on: {new Date().toLocaleString()}</p>
        <p className="mt-1">This is a computer-generated document. Original signature required for official records.</p>
        <p className="mt-1">Original: Accounts | Duplicate: Stores | Triplicate: Department</p>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          .print-template {
            padding: 0;
            margin: 0;
            font-size: 10pt;
          }
          @page {
            margin: 1.5cm;
            size: A4;
          }
        }
      `}</style>
    </div>
  );
}
