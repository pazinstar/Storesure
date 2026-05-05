import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FinSetupChartOfAccounts from "./setup/ChartOfAccounts";
import FinSetupAccountsMaster from "./setup/AccountsMaster";
import FinSetupYearPeriodControl from "./setup/YearPeriodControl";
import FinSetupBudgetMaster from "./setup/BudgetMaster";
import FinReceiptsReceiptEntry from "./receipts/ReceiptEntry";
import FinReceiptsPaymentVouchers from "./receipts/PaymentVouchers";
import FinReceiptsJournalVouchers from "./receipts/JournalVouchers";
import FinReceiptsContraVouchers from "./receipts/ContraVouchers";
import FinCreditorsSupplierInvoices from "./creditors/SupplierInvoices";
import FinCreditorsCreditDebitNotes from "./creditors/CreditDebitNotes";
import FinCreditorsCreditorAgeing from "./creditors/CreditorAgeing";
import FinInventoryItemMaster from "./inventory/ItemMaster";
import FinInventoryGRN from "./inventory/GRN";
import FinInventoryIssues from "./inventory/Issues";
import FinInventoryStockAdjustments from "./inventory/StockAdjustments";
import FinAssetsAssetRegister from "./assets/AssetRegister";
import FinAssetsAdditions from "./assets/Additions";
import FinAssetsDepreciationRun from "./assets/DepreciationRun";
import FinAssetsDisposals from "./assets/Disposals";
import FinGLCashGeneralLedger from "./gl-cash/GeneralLedger";
import FinGLCashCashBank from "./gl-cash/CashBank";
import FinGLCashBankReconciliation from "./gl-cash/BankReconciliation";
import FinReportsFinancialStatements from "./reports/FinancialStatements";
import FinReportsReports from "./reports/Reports";
import FinReportsPeriodClose from "./reports/PeriodClose";
import FinReportsCashBook from "./reports/CashBook";
import FinStudentsFeeStructures from "./students/FeeStructures";
import FinStudentsTermBilling from "./students/TermBilling";
import FinStudentsStatements from "./students/StudentStatements";
import FinStudentsBursaries from "./students/Bursaries";

const sections: Record<string, { label: string; tabs: { value: string; label: string; content: React.ReactNode }[] }> = {
  setup: {
    label: "Setup",
    tabs: [
      { value: "chart-of-accounts", label: "Chart of Accounts", content: <FinSetupChartOfAccounts /> },
      { value: "accounts-master", label: "Accounts Master", content: <FinSetupAccountsMaster /> },
      { value: "year-period-control", label: "Year & Period Control", content: <FinSetupYearPeriodControl /> },
      { value: "budget-master", label: "Budget Master", content: <FinSetupBudgetMaster /> },
    ],
  },
  students: {
    label: "Student Billing",
    tabs: [
      { value: "fee-structures", label: "Fee Structures", content: <FinStudentsFeeStructures /> },
      { value: "term-billing", label: "Term Billing", content: <FinStudentsTermBilling /> },
      { value: "student-statements", label: "Student Statements", content: <FinStudentsStatements /> },
      { value: "bursaries", label: "Bursaries", content: <FinStudentsBursaries /> },
    ],
  },
  receipts: {
    label: "Receipts & Payments",
    tabs: [
      { value: "receipt-entry", label: "Receipt Entry", content: <FinReceiptsReceiptEntry /> },
      { value: "payment-vouchers", label: "Payment Vouchers", content: <FinReceiptsPaymentVouchers /> },
      { value: "journal-vouchers", label: "Journal Vouchers", content: <FinReceiptsJournalVouchers /> },
      { value: "contra-vouchers", label: "Contra Vouchers", content: <FinReceiptsContraVouchers /> },
    ],
  },
  creditors: {
    label: "Receivables & Payables",
    tabs: [
      { value: "supplier-invoices", label: "Supplier Invoices", content: <FinCreditorsSupplierInvoices /> },
      { value: "credit-debit-notes", label: "Credit/Debit Notes", content: <FinCreditorsCreditDebitNotes /> },
      { value: "creditor-ageing", label: "Creditor Ageing", content: <FinCreditorsCreditorAgeing /> },
    ],
  },
  inventory: {
    label: "Inventory",
    tabs: [
      { value: "item-master", label: "Item Master", content: <FinInventoryItemMaster /> },
      { value: "grn", label: "GRN", content: <FinInventoryGRN /> },
      { value: "issues", label: "Issues", content: <FinInventoryIssues /> },
      { value: "stock-adjustments", label: "Stock Adjustments", content: <FinInventoryStockAdjustments /> },
    ],
  },
  assets: {
    label: "Fixed Assets",
    tabs: [
      { value: "asset-register", label: "Asset Register", content: <FinAssetsAssetRegister /> },
      { value: "additions", label: "Additions", content: <FinAssetsAdditions /> },
      { value: "depreciation-run", label: "Depreciation Run", content: <FinAssetsDepreciationRun /> },
      { value: "disposals", label: "Disposals", content: <FinAssetsDisposals /> },
    ],
  },
  "gl-cash": {
    label: "GL & Cash",
    tabs: [
      { value: "general-ledger", label: "General Ledger", content: <FinGLCashGeneralLedger /> },
      { value: "cash-bank", label: "Cash & Bank", content: <FinGLCashCashBank /> },
      { value: "bank-reconciliation", label: "Bank Reconciliation", content: <FinGLCashBankReconciliation /> },
    ],
  },
  reports: {
    label: "Reports",
    tabs: [
      { value: "cash-book", label: "Cash Book", content: <FinReportsCashBook /> },
      { value: "financial-statements", label: "Financial Statements", content: <FinReportsFinancialStatements /> },
      { value: "reports", label: "Reports", content: <FinReportsReports /> },
      { value: "period-close", label: "Period Close", content: <FinReportsPeriodClose /> },
    ],
  },
};

export default function FinancePage() {
  const [searchParams] = useSearchParams();
  const sectionKey = searchParams.get("tab") ?? "setup";
  const section = sections[sectionKey] ?? sections.setup;

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <h1 className="text-2xl font-semibold">{section.label}</h1>

      <Tabs defaultValue={section.tabs[0].value} key={sectionKey} className="w-full min-w-0">
        <TabsList className="flex flex-wrap h-auto gap-1 mb-2">
          {section.tabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {section.tabs.map((tab) => (
          <TabsContent key={tab.value} value={tab.value}>
            {tab.content}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
