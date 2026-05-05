import { useSchool } from "@/contexts/SchoolContext";

export interface LPOPrintData {
  lpoNumber: string;
  date: string;
  supplierName: string;
  supplierAddress?: string;
  supplierPhone?: string;
  supplierEmail?: string;
  supplierTaxPin?: string;
  storeLocation: string;
  expectedDeliveryDate: string;
  paymentTerms: string;
  requisitionRef?: string;
  items: Array<{
    description: string;
    unit: string;
    quantity: number;
    unitPrice: number;
  }>;
  preparedBy: string;
  preparedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  notes?: string;
  copyType: "original" | "duplicate";
}

interface LPOPrintTemplateProps {
  data: LPOPrintData;
}

export default function LPOPrintTemplate({ data }: LPOPrintTemplateProps) {
  const { currentSchool } = useSchool();

  const totalValue = data.items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );

  const copyLabel = data.copyType === "original" ? "ORIGINAL - TO SUPPLIER" : "DUPLICATE - FOR PAYMENT VOUCHER";

  return (
    <div className="print-template bg-white text-black p-8 max-w-4xl mx-auto font-serif">
      {/* Copy Type Watermark */}
      <div className="text-center mb-2">
        <span className={`inline-block px-4 py-1 text-sm font-bold border-2 ${
          data.copyType === "original" 
            ? "border-blue-600 text-blue-600" 
            : "border-gray-600 text-gray-600"
        }`}>
          {copyLabel}
        </span>
      </div>

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
          LOCAL PURCHASE ORDER (LPO)
        </h2>
        <p className="text-sm mt-1 text-gray-600">Per PPADA 2015 Section 135</p>
      </div>

      {/* LPO Info */}
      <div className="grid grid-cols-2 gap-x-8 gap-y-2 mb-6 text-sm">
        <div className="flex">
          <span className="font-bold w-32">LPO No:</span>
          <span className="border-b border-black flex-1 px-2 font-mono">{data.lpoNumber}</span>
        </div>
        <div className="flex">
          <span className="font-bold w-32">Date:</span>
          <span className="border-b border-black flex-1 px-2">{data.date}</span>
        </div>
        <div className="flex">
          <span className="font-bold w-32">Requisition Ref:</span>
          <span className="border-b border-black flex-1 px-2">{data.requisitionRef || "N/A"}</span>
        </div>
        <div className="flex">
          <span className="font-bold w-32">Delivery Store:</span>
          <span className="border-b border-black flex-1 px-2">{data.storeLocation}</span>
        </div>
      </div>

      {/* Supplier Details */}
      <div className="border-2 border-black p-4 mb-6">
        <p className="font-bold mb-2 text-sm uppercase">SUPPLIER DETAILS:</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <div className="flex">
            <span className="font-bold w-24">Name:</span>
            <span>{data.supplierName}</span>
          </div>
          <div className="flex">
            <span className="font-bold w-24">KRA PIN:</span>
            <span>{data.supplierTaxPin || "N/A"}</span>
          </div>
          <div className="flex col-span-2">
            <span className="font-bold w-24">Address:</span>
            <span>{data.supplierAddress || "N/A"}</span>
          </div>
          <div className="flex">
            <span className="font-bold w-24">Phone:</span>
            <span>{data.supplierPhone || "N/A"}</span>
          </div>
          <div className="flex">
            <span className="font-bold w-24">Email:</span>
            <span>{data.supplierEmail || "N/A"}</span>
          </div>
        </div>
      </div>

      {/* Delivery & Payment Terms */}
      <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
        <div className="flex">
          <span className="font-bold w-36">Expected Delivery:</span>
          <span className="border-b border-black flex-1 px-2">{data.expectedDeliveryDate}</span>
        </div>
        <div className="flex">
          <span className="font-bold w-36">Payment Terms:</span>
          <span className="border-b border-black flex-1 px-2">{data.paymentTerms}</span>
        </div>
      </div>

      {/* Items Table */}
      <div className="mb-6">
        <table className="w-full border-collapse border-2 border-black text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-black px-2 py-1 text-left w-8">No.</th>
              <th className="border border-black px-2 py-1 text-left">Description of Goods/Services</th>
              <th className="border border-black px-2 py-1 text-center w-16">Unit</th>
              <th className="border border-black px-2 py-1 text-center w-16">Qty</th>
              <th className="border border-black px-2 py-1 text-right w-28">Unit Price (KES)</th>
              <th className="border border-black px-2 py-1 text-right w-32">Total (KES)</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item, index) => (
              <tr key={index}>
                <td className="border border-black px-2 py-1">{index + 1}</td>
                <td className="border border-black px-2 py-1">{item.description}</td>
                <td className="border border-black px-2 py-1 text-center">{item.unit}</td>
                <td className="border border-black px-2 py-1 text-center">{item.quantity}</td>
                <td className="border border-black px-2 py-1 text-right">
                  {item.unitPrice.toLocaleString("en-KE", { minimumFractionDigits: 2 })}
                </td>
                <td className="border border-black px-2 py-1 text-right">
                  {(item.quantity * item.unitPrice).toLocaleString("en-KE", {
                    minimumFractionDigits: 2,
                  })}
                </td>
              </tr>
            ))}
            {/* Empty rows for manual additions */}
            {[...Array(Math.max(0, 6 - data.items.length))].map((_, i) => (
              <tr key={`empty-${i}`}>
                <td className="border border-black px-2 py-3">&nbsp;</td>
                <td className="border border-black px-2 py-3"></td>
                <td className="border border-black px-2 py-3"></td>
                <td className="border border-black px-2 py-3"></td>
                <td className="border border-black px-2 py-3"></td>
                <td className="border border-black px-2 py-3"></td>
              </tr>
            ))}
            {/* Total Row */}
            <tr className="bg-gray-100 font-bold">
              <td colSpan={5} className="border border-black px-2 py-2 text-right">
                TOTAL VALUE (KES):
              </td>
              <td className="border border-black px-2 py-2 text-right">
                {totalValue.toLocaleString("en-KE", { minimumFractionDigits: 2 })}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Notes */}
      {data.notes && (
        <div className="border border-black p-3 mb-6 text-sm">
          <p className="font-bold mb-1">Special Instructions / Notes:</p>
          <p>{data.notes}</p>
        </div>
      )}

      {/* Terms & Conditions */}
      <div className="border border-black p-3 mb-6 text-xs">
        <p className="font-bold mb-1">TERMS & CONDITIONS:</p>
        <ol className="list-decimal list-inside space-y-0.5">
          <li>Delivery must be made to the specified store location.</li>
          <li>All goods must be accompanied by a delivery note referencing this LPO number.</li>
          <li>Goods will be inspected before acceptance per PPADA 2015.</li>
          <li>Payment will be processed upon satisfactory delivery and verification.</li>
          <li>This order is valid for 30 days from date of issue.</li>
        </ol>
      </div>

      {/* Signature Section */}
      <div className="grid grid-cols-2 gap-8 text-sm">
        <div className="border-2 border-black p-4">
          <p className="font-bold mb-8">PREPARED BY:</p>
          <div className="flex mb-2">
            <span className="w-20">Name:</span>
            <span className="border-b border-black flex-1 px-2">{data.preparedBy}</span>
          </div>
          <div className="flex mb-2">
            <span className="w-20">Signature:</span>
            <span className="border-b border-black flex-1 px-2"></span>
          </div>
          <div className="flex">
            <span className="w-20">Date:</span>
            <span className="border-b border-black flex-1 px-2">{data.preparedAt}</span>
          </div>
        </div>

        <div className="border-2 border-black p-4">
          <p className="font-bold mb-8">AUTHORIZED BY (Accounting Officer):</p>
          <div className="flex mb-2">
            <span className="w-20">Name:</span>
            <span className="border-b border-black flex-1 px-2">{data.approvedBy || ""}</span>
          </div>
          <div className="flex mb-2">
            <span className="w-20">Signature:</span>
            <span className="border-b border-black flex-1 px-2"></span>
          </div>
          <div className="flex">
            <span className="w-20">Date:</span>
            <span className="border-b border-black flex-1 px-2">{data.approvedAt || ""}</span>
          </div>
        </div>
      </div>

      {/* Supplier Acknowledgement */}
      {data.copyType === "original" && (
        <div className="border-2 border-black p-4 mt-6 text-sm">
          <p className="font-bold mb-4">SUPPLIER ACKNOWLEDGEMENT:</p>
          <p className="mb-4">
            I hereby acknowledge receipt of this Local Purchase Order and agree to deliver the 
            goods/services as specified above within the agreed timeframe.
          </p>
          <div className="grid grid-cols-3 gap-4">
            <div className="flex">
              <span className="w-16">Name:</span>
              <span className="border-b border-black flex-1"></span>
            </div>
            <div className="flex">
              <span className="w-20">Signature:</span>
              <span className="border-b border-black flex-1"></span>
            </div>
            <div className="flex">
              <span className="w-12">Date:</span>
              <span className="border-b border-black flex-1"></span>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-8 pt-4 border-t border-gray-400 text-xs text-gray-600 text-center">
        <p>Document: {data.lpoNumber} | Generated: {new Date().toLocaleString()}</p>
        <p className="mt-1">This is a computer-generated document. Original signatures required for official records.</p>
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
