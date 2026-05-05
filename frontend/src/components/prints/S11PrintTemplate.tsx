import { useSchool } from "@/contexts/SchoolContext";

export interface S11PrintData {
  id: string;
  date: string;
  sourceType: "Supplier" | "Internal Store";
  supplier: string;
  storeLocation: string;
  lpoReference?: string;
  deliveryNote?: string;
  items: Array<{
    description: string;
    unit: string;
    lpoQty: number;
    receivedQty: number;
    unitPrice: number;
  }>;
  storekeeperName: string;
  storekeeperSignature?: string;
  signedAt?: string;
  status: string;
}

interface S11PrintTemplateProps {
  data: S11PrintData;
}

export default function S11PrintTemplate({ data }: S11PrintTemplateProps) {
  const { currentSchool } = useSchool();

  const totalValue = data.items.reduce(
    (sum, item) => sum + item.receivedQty * item.unitPrice,
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
          STORES LEDGER RECEIPT VOUCHER (S11)
        </h2>
        <p className="text-sm mt-1 text-gray-600">Goods Received Note (GRN)</p>
      </div>

      {/* Document Info */}
      <div className="grid grid-cols-2 gap-x-8 gap-y-2 mb-6 text-sm">
        <div className="flex">
          <span className="font-bold w-32">Document No:</span>
          <span className="border-b border-black flex-1 px-2">{data.id}</span>
        </div>
        <div className="flex">
          <span className="font-bold w-32">Date Received:</span>
          <span className="border-b border-black flex-1 px-2">{data.date}</span>
        </div>
        <div className="flex">
          <span className="font-bold w-32">Source Type:</span>
          <span className="border-b border-black flex-1 px-2">{data.sourceType}</span>
        </div>
        <div className="flex">
          <span className="font-bold w-32">
            {data.sourceType === "Supplier" ? "Supplier:" : "Source Store:"}
          </span>
          <span className="border-b border-black flex-1 px-2">{data.supplier}</span>
        </div>
        <div className="flex">
          <span className="font-bold w-32">Store Location:</span>
          <span className="border-b border-black flex-1 px-2">{data.storeLocation}</span>
        </div>
        <div className="flex">
          <span className="font-bold w-32">LPO Reference:</span>
          <span className="border-b border-black flex-1 px-2">{data.lpoReference || "N/A"}</span>
        </div>
        <div className="flex col-span-2">
          <span className="font-bold w-32">Delivery Note:</span>
          <span className="border-b border-black flex-1 px-2">{data.deliveryNote || "N/A"}</span>
        </div>
      </div>

      {/* Items Table */}
      <div className="mb-6">
        <table className="w-full border-collapse border-2 border-black text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-black px-2 py-1 text-left w-8">No.</th>
              <th className="border border-black px-2 py-1 text-left">Description of Goods</th>
              <th className="border border-black px-2 py-1 text-center w-16">Unit</th>
              <th className="border border-black px-2 py-1 text-center w-20">LPO Qty</th>
              <th className="border border-black px-2 py-1 text-center w-20">Received</th>
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
                <td className="border border-black px-2 py-1 text-center">{item.lpoQty}</td>
                <td className="border border-black px-2 py-1 text-center">{item.receivedQty}</td>
                <td className="border border-black px-2 py-1 text-right">
                  {item.unitPrice.toLocaleString("en-KE", { minimumFractionDigits: 2 })}
                </td>
                <td className="border border-black px-2 py-1 text-right">
                  {(item.receivedQty * item.unitPrice).toLocaleString("en-KE", {
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

      {/* Certification Section */}
      <div className="border-2 border-black p-4 mb-6">
        <p className="font-bold mb-3 text-sm">CERTIFICATION:</p>
        <p className="text-sm mb-4">
          I certify that the above goods have been received, inspected, and found to be in
          accordance with the specifications and quantities stated.
        </p>
      </div>

      {/* Signature Section */}
      <div className="grid grid-cols-2 gap-8 text-sm">
        <div className="border-2 border-black p-4">
          <p className="font-bold mb-8">RECEIVED BY (Storekeeper):</p>
          <div className="flex mb-2">
            <span className="w-20">Name:</span>
            <span className="border-b border-black flex-1 px-2">{data.storekeeperName}</span>
          </div>
          <div className="flex mb-2">
            <span className="w-20">Signature:</span>
            <span className="border-b border-black flex-1 px-2 italic">
              {data.storekeeperSignature || ""}
            </span>
          </div>
          <div className="flex">
            <span className="w-20">Date/Time:</span>
            <span className="border-b border-black flex-1 px-2">{data.signedAt || ""}</span>
          </div>
        </div>

        <div className="border-2 border-black p-4">
          <p className="font-bold mb-8">VERIFIED BY (Stores Officer/HOD):</p>
          <div className="flex mb-2">
            <span className="w-20">Name:</span>
            <span className="border-b border-black flex-1 px-2"></span>
          </div>
          <div className="flex mb-2">
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
      <div className="mt-8 pt-4 border-t border-gray-400 text-xs text-gray-600 text-center">
        <p>Document Status: {data.status} | Generated on: {new Date().toLocaleString()}</p>
        <p className="mt-1">This is a computer-generated document. Original signature required for official records.</p>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          .print-template {
            padding: 0;
            margin: 0;
            font-size: 11pt;
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
