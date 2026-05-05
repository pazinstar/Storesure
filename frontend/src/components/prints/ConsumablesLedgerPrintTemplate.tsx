import { forwardRef } from "react";
import { format } from "date-fns";

export interface LedgerTransaction {
  date: string;
  fromTo: string;
  rate: number | null;
  grnNo: string | null;
  reqNo: string | null;
  unit: string;
  received: number | null;
  issued: number | null;
  balance: number;
  signature: string;
}

interface ConsumablesLedgerPrintTemplateProps {
  schoolName: string;
  storeName: string;
  itemName: string;
  period: string;
  transactions: LedgerTransaction[];
  totalReceived: number;
  totalIssued: number;
  closingBalance: number;
  auditMode: boolean;
}

export const ConsumablesLedgerPrintTemplate = forwardRef<
  HTMLDivElement,
  ConsumablesLedgerPrintTemplateProps
>(
  (
    {
      schoolName,
      storeName,
      itemName,
      period,
      transactions,
      totalReceived,
      totalIssued,
      closingBalance,
      auditMode,
    },
    ref
  ) => {
    const generatedDate = format(new Date(), "dd-MM-yyyy");

    return (
      <div
        ref={ref}
        className="bg-white text-black p-8 font-sans"
        style={{ width: "210mm", minHeight: "297mm" }}
      >
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold uppercase tracking-wide">
            Receipt and Issues – Consumables Stores Ledger
          </h1>
        </div>

        {/* Report Info */}
        <div className="mb-6 text-sm space-y-1">
          <p>
            <span className="font-semibold">School:</span> {schoolName}
          </p>
          <p>
            <span className="font-semibold">Store:</span> {storeName}
          </p>
          <p>
            <span className="font-semibold">Item (Departmental Description):</span>{" "}
            {itemName}
          </p>
          <p>
            <span className="font-semibold">Period:</span> {period}
          </p>
        </div>

        {/* Table */}
        <table className="w-full border-collapse text-sm mb-6">
          <thead>
            <tr className="bg-blue-900 text-white">
              <th className="border border-gray-400 px-2 py-1.5 text-left font-semibold">
                Date
              </th>
              <th className="border border-gray-400 px-2 py-1.5 text-left font-semibold">
                From / To
              </th>
              <th className="border border-gray-400 px-2 py-1.5 text-center font-semibold">
                Rate
              </th>
              <th className="border border-gray-400 px-2 py-1.5 text-center font-semibold">
                GRN No
              </th>
              <th className="border border-gray-400 px-2 py-1.5 text-center font-semibold">
                Req No
              </th>
              <th className="border border-gray-400 px-2 py-1.5 text-center font-semibold">
                Unit
              </th>
              <th className="border border-gray-400 px-2 py-1.5 text-center font-semibold">
                Received
              </th>
              <th className="border border-gray-400 px-2 py-1.5 text-center font-semibold">
                Issued
              </th>
              <th className="border border-gray-400 px-2 py-1.5 text-center font-semibold">
                Balance
              </th>
              <th className="border border-gray-400 px-2 py-1.5 text-left font-semibold">
                Issue/Signature
              </th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx, idx) => (
              <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                <td className="border border-gray-300 px-2 py-1">{tx.date}</td>
                <td className="border border-gray-300 px-2 py-1">{tx.fromTo}</td>
                <td className="border border-gray-300 px-2 py-1 text-center">
                  {tx.rate ?? "-"}
                </td>
                <td className="border border-gray-300 px-2 py-1 text-center">
                  {tx.grnNo ?? "-"}
                </td>
                <td className="border border-gray-300 px-2 py-1 text-center">
                  {tx.reqNo ?? "-"}
                </td>
                <td className="border border-gray-300 px-2 py-1 text-center">
                  {tx.unit}
                </td>
                <td className="border border-gray-300 px-2 py-1 text-center">
                  {tx.received ?? "-"}
                </td>
                <td className="border border-gray-300 px-2 py-1 text-center">
                  {tx.issued ?? "-"}
                </td>
                <td className="border border-gray-300 px-2 py-1 text-center font-medium">
                  {tx.balance}
                </td>
                <td className="border border-gray-300 px-2 py-1">{tx.signature}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="mb-8 text-sm font-semibold flex gap-6 justify-between border-t-2 border-b-2 border-gray-400 py-3 mt-4">
          <div className="flex gap-8">
            <span>
              <span className="font-bold uppercase">Total Receipts:</span> {totalReceived}
            </span>
            <span>
              <span className="font-bold uppercase">Total Issues:</span> {totalIssued}
            </span>
            <span>
              <span className="font-bold uppercase">Closing Balance:</span> {closingBalance}
            </span>
          </div>
          <div>
            <span className="font-bold uppercase ml-8 text-blue-900 border-b border-gray-400">Carry Forward (C/F) To Folio No:</span> ___________
          </div>
        </div>

        {/* Footer */}
        <div className="text-xs text-gray-600 italic border-t border-gray-300 pt-4">
          <p>
            Generated by StoreSure | Audit Mode: {auditMode ? "ON" : "OFF"} |
            Generated on {generatedDate}
          </p>
        </div>
      </div>
    );
  }
);

ConsumablesLedgerPrintTemplate.displayName = "ConsumablesLedgerPrintTemplate";
