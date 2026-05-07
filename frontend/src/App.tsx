import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { AuditModeBanner } from "@/components/AuditModeBanner";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { HeaderActions } from "@/components/HeaderActions";
import S2RetryQueue from "@/components/S2RetryQueue";
import CapitalizationQueue from "@/components/CapitalizationQueue";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { MessageProvider } from "@/contexts/MessageContext";
import { AuditProvider } from "@/contexts/AuditContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { SchoolNameDisplay } from "@/components/SchoolNameDisplay";
import { UserLocationDisplay } from "@/components/UserLocationDisplay";

// Auth pages
import Login from "./pages/Login";
import Unauthorized from "./pages/Unauthorized";

// Main pages
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import AddItem from "./pages/AddItem";
import Reports from "./pages/Reports";
import NotFound from "./pages/NotFound";
// Procurement module pages
import ProcurementDashboard from "./pages/procurement/ProcurementDashboard";
import Requisitions from "./pages/procurement/Requisitions";
import Tenders from "./pages/procurement/Tenders";
import LPOManagement from "./pages/procurement/LPOManagement";
import ProcurementReports from "./pages/procurement/ProcurementReports";
import ReferenceGenerator from "./pages/procurement/ReferenceGenerator";
import ContractRegister from "./pages/procurement/ContractRegister";
import SuppliersRegister from "./pages/procurement/SuppliersRegister";

// Stores module pages
import StoreDashboard from "./pages/stores/StoreDashboard";
import ItemMaster from "./pages/stores/ItemMaster";
import ReceiveStock from "./pages/stores/ReceiveStock";
import IssueStock from "./pages/stores/IssueStock";
import IssueDetail from "./pages/stores/IssueDetail";
import StockBalances from "./pages/stores/StockBalances";
import Adjustments from "./pages/stores/Adjustments";
import StoreTransfers from "./pages/stores/StoreTransfers";
import StoreReports from "./pages/stores/StoreReports";
import Ledgers from "./pages/stores/Ledgers";
import SRIV from "./pages/stores/SRIV";
import FileMovementRegister from "./pages/stores/FileMovementRegister";
import RecordsRetention from "./pages/stores/RecordsRetention";
import S12Requisition from "./pages/stores/S12Requisition";
import StoresLPOManagement from "./pages/stores/LPOManagement";
import DeliveryLogging from "./pages/stores/DeliveryLogging";
import InspectionAcceptance from "./pages/stores/InspectionAcceptance";
import { FileMovementProvider } from "./contexts/FileMovementContext";
import { DeliveryProvider } from "./contexts/DeliveryContext";
import { RecordsRetentionProvider } from "./contexts/RecordsRetentionContext";
import { S12Provider } from "./contexts/S12Context";
import { RIAProvider } from "./contexts/RIAContext";
import RIAList from "./pages/stores/ria/RIAList";
import RIACreate from "./pages/stores/ria/RIACreate";
import RIADetails from "./pages/stores/ria/RIADetails";

// Admin pages
import UserManagement from "./pages/admin/UserManagement";
import AdminControlPanel from "./pages/admin/AdminControlPanel";
import SchoolBranding from "./pages/admin/SchoolBranding";
import ClientSetup from "./pages/admin/ClientSetup";
import RoleManagement from "./pages/admin/RoleManagement";
import { AdminProvider } from "./contexts/AdminContext";
import { SchoolProvider } from "./contexts/SchoolContext";
import { ClientSetupProvider } from "./contexts/ClientSetupContext";

// Assets module pages
import AssetRegister from "./pages/assets/AssetRegister";
import AssetDetail from "./pages/assets/AssetDetail";
import AssetMovement from "./pages/assets/AssetMovement";
import BoardOfSurvey from "./pages/assets/BoardOfSurvey";
import Disposal from "./pages/assets/Disposal";
import AssetReports from "./pages/assets/AssetReports";
import FixedAssetRegister from "./pages/assets/FixedAssetRegister";
import BulkCapitalization from "./pages/assets/BulkCapitalization";
import BulkPrompts from "./pages/assets/BulkPrompts";
import PromptDetail from "./pages/assets/PromptDetail";
import CapitalizationSettings from "./pages/assets/CapitalizationSettings";
import SingleClassify from "./pages/assets/SingleClassify";

// Library module pages
import LibraryDashboard from "./pages/library/LibraryDashboard";
import Catalogue from "./pages/library/Catalogue";
import BookCopies from "./pages/library/BookCopies";
import IssueReturn from "./pages/library/IssueReturn";
import BulkIssue from "./pages/library/BulkIssue";
import BranchTransfers from "./pages/library/BranchTransfers";
import LibraryReports from "./pages/library/LibraryReports";
import LibraryReceive from "./pages/library/LibraryReceive";
import { LibraryProvider } from "./contexts/LibraryContext";

// Students module pages
import StudentRegister from "./pages/students/StudentRegister";
import StudentDistribution from "./pages/students/StudentDistribution";
import DistributionReports from "./pages/students/DistributionReports";
import { StudentProvider } from "./contexts/StudentContext";

// Staff module pages
import StaffRegister from "./pages/staff/StaffRegister";
import { StaffProvider } from "./contexts/StaffContext";

// Finance module pages — Setup
import FinancePage from "./pages/finance/FinancePage";
import FinSetupChartOfAccounts from "./pages/finance/setup/ChartOfAccounts";
import FinSetupAccountsMaster from "./pages/finance/setup/AccountsMaster";
import FinSetupYearPeriodControl from "./pages/finance/setup/YearPeriodControl";
import FinSetupBudgetMaster from "./pages/finance/setup/BudgetMaster";
// Finance module pages — Receipts
import FinReceiptsReceiptEntry from "./pages/finance/receipts/ReceiptEntry";
import FinReceiptsPaymentVouchers from "./pages/finance/receipts/PaymentVouchers";
import FinReceiptsJournalVouchers from "./pages/finance/receipts/JournalVouchers";
import FinReceiptsContraVouchers from "./pages/finance/receipts/ContraVouchers";
// Finance module pages — Creditors
import FinCreditorsSupplierInvoices from "./pages/finance/creditors/SupplierInvoices";
import FinCreditorsCreditDebitNotes from "./pages/finance/creditors/CreditDebitNotes";
import FinCreditorsCreditorAgeing from "./pages/finance/creditors/CreditorAgeing";
// Finance module pages — Inventory
import FinInventoryItemMaster from "./pages/finance/inventory/ItemMaster";
import FinInventoryGRN from "./pages/finance/inventory/GRN";
import FinInventoryIssues from "./pages/finance/inventory/Issues";
import FinInventoryStockAdjustments from "./pages/finance/inventory/StockAdjustments";
// Finance module pages — Fixed Assets
import FinAssetsAssetRegister from "./pages/finance/assets/AssetRegister";
import FinAssetsAdditions from "./pages/finance/assets/Additions";
import FinAssetsDepreciationRun from "./pages/finance/assets/DepreciationRun";
import FinAssetsDisposals from "./pages/finance/assets/Disposals";
// Finance module pages — GL & Cash
import FinGLCashGeneralLedger from "./pages/finance/gl-cash/GeneralLedger";
import FinGLCashCashBank from "./pages/finance/gl-cash/CashBank";
import FinGLCashBankReconciliation from "./pages/finance/gl-cash/BankReconciliation";
// Finance module pages — Reports
import FinReportsFinancialStatements from "./pages/finance/reports/FinancialStatements";
import FinReportsReports from "./pages/finance/reports/Reports";
import FinReportsPeriodClose from "./pages/finance/reports/PeriodClose";
// Finance module pages — Students (Fees, Billing, Statements, Bursaries)
import FinStudentsFeeStructures from "./pages/finance/students/FeeStructures";
import FinStudentsTermBilling from "./pages/finance/students/TermBilling";
import FinStudentsStatements from "./pages/finance/students/StudentStatements";
import FinStudentsBursaries from "./pages/finance/students/Bursaries";

const queryClient = new QueryClient();

function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="min-w-0 overflow-hidden">
        <AuditModeBanner />
        <header className="flex h-14 items-center border-b border-border px-4 lg:px-6">
          <SidebarTrigger className="-ml-2" />
          <div className="ml-4 flex-1">
            <SchoolNameDisplay />
          </div>
            <div className="flex items-center gap-3">
            <UserLocationDisplay />
            <ThemeToggle />
            <HeaderActions />
              <S2RetryQueue />
              <CapitalizationQueue />
          </div>
        </header>
        <main className="flex-1 min-w-0 overflow-auto p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="light" storageKey="school-ims-theme">
      <AuthProvider>
        <NotificationProvider>
          <MessageProvider>
            <AuditProvider>
              <FileMovementProvider>
                <RecordsRetentionProvider>
                  <S12Provider>
                    <DeliveryProvider>
                      <AdminProvider>
                        <SchoolProvider>
                          <ClientSetupProvider>
                            <StudentProvider>
                              <StaffProvider>
                                <LibraryProvider>
                                  <RIAProvider>
                                    <TooltipProvider>
                                      <Toaster />
                                      <Sonner />
                                      <BrowserRouter>
                                        <Routes>
                                          {/* Public routes */}
                                          <Route path="/login" element={<Login />} />
                                          <Route path="/unauthorized" element={<Unauthorized />} />

                                          {/* Protected routes */}
                                          <Route
                                            path="/"
                                            element={
                                              <ProtectedRoute>
                                                <AuthenticatedLayout>
                                                  <Dashboard />
                                                </AuthenticatedLayout>
                                              </ProtectedRoute>
                                            }
                                          />
                                          <Route
                                            path="/inventory"
                                            element={
                                              <ProtectedRoute>
                                                <AuthenticatedLayout>
                                                  <Inventory />
                                                </AuthenticatedLayout>
                                              </ProtectedRoute>
                                            }
                                          />
                                          <Route
                                            path="/add-item"
                                            element={
                                              <ProtectedRoute>
                                                <AuthenticatedLayout>
                                                  <AddItem />
                                                </AuthenticatedLayout>
                                              </ProtectedRoute>
                                            }
                                          />
                                          <Route
                                            path="/reports"
                                            element={
                                              <ProtectedRoute>
                                                <AuthenticatedLayout>
                                                  <Reports />
                                                </AuthenticatedLayout>
                                              </ProtectedRoute>
                                            }
                                          />
                                          <Route
                                            path="/admin/users"
                                            element={
                                              <ProtectedRoute>
                                                <AuthenticatedLayout>
                                                  <UserManagement />
                                                </AuthenticatedLayout>
                                              </ProtectedRoute>
                                            }
                                          />
                                          <Route
                                            path="/admin/control-panel"
                                            element={
                                              <ProtectedRoute>
                                                <AuthenticatedLayout>
                                                  <AdminControlPanel />
                                                </AuthenticatedLayout>
                                              </ProtectedRoute>
                                            }
                                          />
                                          <Route
                                            path="/admin/branding"
                                            element={
                                              <ProtectedRoute>
                                                <AuthenticatedLayout>
                                                  <SchoolBranding />
                                                </AuthenticatedLayout>
                                              </ProtectedRoute>
                                            }
                                          />
                                          <Route
                                            path="/admin/client-setup"
                                            element={
                                              <ProtectedRoute>
                                                <AuthenticatedLayout>
                                                  <ClientSetup />
                                                </AuthenticatedLayout>
                                              </ProtectedRoute>
                                            }
                                          />
                                          <Route
                                            path="/admin/roles"
                                            element={
                                              <ProtectedRoute>
                                                <AuthenticatedLayout>
                                                  <RoleManagement />
                                                </AuthenticatedLayout>
                                              </ProtectedRoute>
                                            }
                                          />
                                          {/* Procurement module routes */}
                                          <Route
                                            path="/procurement"
                                            element={
                                              <ProtectedRoute>
                                                <AuthenticatedLayout>
                                                  <ProcurementDashboard />
                                                </AuthenticatedLayout>
                                              </ProtectedRoute>
                                            }
                                          />
                                          <Route
                                            path="/procurement/requisitions"
                                            element={
                                              <ProtectedRoute>
                                                <AuthenticatedLayout>
                                                  <Requisitions />
                                                </AuthenticatedLayout>
                                              </ProtectedRoute>
                                            }
                                          />
                                          <Route
                                            path="/procurement/tenders"
                                            element={
                                              <ProtectedRoute>
                                                <AuthenticatedLayout>
                                                  <Tenders />
                                                </AuthenticatedLayout>
                                              </ProtectedRoute>
                                            }
                                          />
                                          <Route
                                            path="/procurement/lpo"
                                            element={
                                              <ProtectedRoute>
                                                <AuthenticatedLayout>
                                                  <LPOManagement />
                                                </AuthenticatedLayout>
                                              </ProtectedRoute>
                                            }
                                          />
                                          <Route
                                            path="/procurement/reports"
                                            element={
                                              <ProtectedRoute>
                                                <AuthenticatedLayout>
                                                  <ProcurementReports />
                                                </AuthenticatedLayout>
                                              </ProtectedRoute>
                                            }
                                          />
                                          <Route
                                            path="/procurement/references"
                                            element={
                                              <ProtectedRoute>
                                                <AuthenticatedLayout>
                                                  <ReferenceGenerator />
                                                </AuthenticatedLayout>
                                              </ProtectedRoute>
                                            }
                                          />
                                          <Route
                                            path="/procurement/contracts"
                                            element={
                                              <ProtectedRoute>
                                                <AuthenticatedLayout>
                                                  <ContractRegister />
                                                </AuthenticatedLayout>
                                              </ProtectedRoute>
                                            }
                                          />
                                          <Route
                                            path="/procurement/suppliers"
                                            element={
                                              <ProtectedRoute>
                                                <AuthenticatedLayout>
                                                  <SuppliersRegister />
                                                </AuthenticatedLayout>
                                              </ProtectedRoute>
                                            }
                                          />

                                          {/* Stores module routes */}
                                          <Route
                                            path="/stores"
                                            element={
                                              <ProtectedRoute>
                                                <AuthenticatedLayout>
                                                  <StoreDashboard />
                                                </AuthenticatedLayout>
                                              </ProtectedRoute>
                                            }
                                          />
                                          <Route
                                            path="/stores/ria"
                                            element={
                                              <ProtectedRoute>
                                                <AuthenticatedLayout>
                                                  <RIAList />
                                                </AuthenticatedLayout>
                                              </ProtectedRoute>
                                            }
                                          />
                                          <Route
                                            path="/stores/ria/create"
                                            element={
                                              <ProtectedRoute>
                                                <AuthenticatedLayout>
                                                  <RIACreate />
                                                </AuthenticatedLayout>
                                              </ProtectedRoute>
                                            }
                                          />
                                          <Route
                                            path="/stores/ria/view/:id"
                                            element={
                                              <ProtectedRoute>
                                                <AuthenticatedLayout>
                                                  <RIADetails />
                                                </AuthenticatedLayout>
                                              </ProtectedRoute>
                                            }
                                          />
                                          <Route
                                            path="/stores/items"
                                            element={
                                              <ProtectedRoute>
                                                <AuthenticatedLayout>
                                                  <ItemMaster />
                                                </AuthenticatedLayout>
                                              </ProtectedRoute>
                                            }
                                          />
                                          <Route
                                            path="/stores/receive"
                                            element={
                                              <ProtectedRoute>
                                                <AuthenticatedLayout>
                                                  <ReceiveStock />
                                                </AuthenticatedLayout>
                                              </ProtectedRoute>
                                            }
                                          />
                                          <Route
                                            path="/stores/issue"
                                            element={
                                              <ProtectedRoute>
                                                <AuthenticatedLayout>
                                                  <IssueStock />
                                                </AuthenticatedLayout>
                                              </ProtectedRoute>
                                            }
                                          />
                                          <Route
                                            path="/stores/issue/:id"
                                            element={
                                              <ProtectedRoute>
                                                <AuthenticatedLayout>
                                                  <IssueDetail />
                                                </AuthenticatedLayout>
                                              </ProtectedRoute>
                                            }
                                          />
                                          <Route
                                            path="/stores/balances"
                                            element={
                                              <ProtectedRoute>
                                                <AuthenticatedLayout>
                                                  <StockBalances />
                                                </AuthenticatedLayout>
                                              </ProtectedRoute>
                                            }
                                          />
                                          <Route
                                            path="/stores/adjustments"
                                            element={
                                              <ProtectedRoute>
                                                <AuthenticatedLayout>
                                                  <Adjustments />
                                                </AuthenticatedLayout>
                                              </ProtectedRoute>
                                            }
                                          />
                                          <Route
                                            path="/stores/transfers"
                                            element={
                                              <ProtectedRoute>
                                                <AuthenticatedLayout>
                                                  <StoreTransfers />
                                                </AuthenticatedLayout>
                                              </ProtectedRoute>
                                            }
                                          />
                                          <Route
                                            path="/stores/reports"
                                            element={
                                              <ProtectedRoute>
                                                <AuthenticatedLayout>
                                                  <StoreReports />
                                                </AuthenticatedLayout>
                                              </ProtectedRoute>
                                            }
                                          />
                                          <Route
                                            path="/stores/ledger"
                                            element={
                                              <ProtectedRoute>
                                                <AuthenticatedLayout>
                                                  <Ledgers />
                                                </AuthenticatedLayout>
                                              </ProtectedRoute>
                                            }
                                          />
                                          <Route
                                            path="/stores/sriv"
                                            element={
                                              <ProtectedRoute>
                                                <AuthenticatedLayout>
                                                  <SRIV />
                                                </AuthenticatedLayout>
                                              </ProtectedRoute>
                                            }
                                          />
                                          <Route
                                            path="/stores/file-register"
                                            element={
                                              <ProtectedRoute>
                                                <AuthenticatedLayout>
                                                  <FileMovementRegister />
                                                </AuthenticatedLayout>
                                              </ProtectedRoute>
                                            }
                                          />
                                          <Route
                                            path="/stores/records-retention"
                                            element={
                                              <ProtectedRoute>
                                                <AuthenticatedLayout>
                                                  <RecordsRetention />
                                                </AuthenticatedLayout>
                                              </ProtectedRoute>
                                            }
                                          />
                                          <Route
                                            path="/stores/lpo"
                                            element={
                                              <ProtectedRoute>
                                                <AuthenticatedLayout>
                                                  <StoresLPOManagement />
                                                </AuthenticatedLayout>
                                              </ProtectedRoute>
                                            }
                                          />
                                          <Route
                                            path="/stores/s12"
                                            element={
                                              <ProtectedRoute>
                                                <AuthenticatedLayout>
                                                  <S12Requisition />
                                                </AuthenticatedLayout>
                                              </ProtectedRoute>
                                            }
                                          />
                                          <Route
                                            path="/stores/delivery"
                                            element={
                                              <ProtectedRoute>
                                                <AuthenticatedLayout>
                                                  <DeliveryLogging />
                                                </AuthenticatedLayout>
                                              </ProtectedRoute>
                                            }
                                          />
                                          <Route
                                            path="/stores/inspection"
                                            element={
                                              <ProtectedRoute>
                                                <AuthenticatedLayout>
                                                  <InspectionAcceptance />
                                                </AuthenticatedLayout>
                                              </ProtectedRoute>
                                            }
                                          />

                                          {/* Assets module routes */}
                                          <Route
                                            path="/assets"
                                            element={
                                              <ProtectedRoute>
                                                <AuthenticatedLayout>
                                                  <AssetRegister />
                                                </AuthenticatedLayout>
                                              </ProtectedRoute>
                                            }
                                          />
                                          <Route
                                            path="/assets/:id"
                                            element={
                                              <ProtectedRoute>
                                                <AuthenticatedLayout>
                                                  <AssetDetail />
                                                </AuthenticatedLayout>
                                              </ProtectedRoute>
                                            }
                                          />
                                          <Route
                                            path="/assets/movement"
                                            element={
                                              <ProtectedRoute>
                                                <AuthenticatedLayout>
                                                  <AssetMovement />
                                                </AuthenticatedLayout>
                                              </ProtectedRoute>
                                            }
                                          />
                                          <Route
                                            path="/assets/survey"
                                            element={
                                              <ProtectedRoute>
                                                <AuthenticatedLayout>
                                                  <BoardOfSurvey />
                                                </AuthenticatedLayout>
                                              </ProtectedRoute>
                                            }
                                          />
                                          <Route
                                            path="/assets/disposal"
                                            element={
                                              <ProtectedRoute>
                                                <AuthenticatedLayout>
                                                  <Disposal />
                                                </AuthenticatedLayout>
                                              </ProtectedRoute>
                                            }
                                          />
                                          <Route
                                            path="/assets/bulk-capitalize"
                                            element={
                                              <ProtectedRoute>
                                                <AuthenticatedLayout>
                                                  <BulkCapitalization />
                                                </AuthenticatedLayout>
                                              </ProtectedRoute>
                                            }
                                          />
                                          <Route
                                            path="/assets/capitalization-settings"
                                            element={
                                              <ProtectedRoute>
                                                <AuthenticatedLayout>
                                                  <CapitalizationSettings />
                                                </AuthenticatedLayout>
                                              </ProtectedRoute>
                                            }
                                          />
                                          <Route
                                            path="/assets/bulk-prompts"
                                            element={
                                              <ProtectedRoute>
                                                <AuthenticatedLayout>
                                                  <BulkPrompts />
                                                </AuthenticatedLayout>
                                              </ProtectedRoute>
                                            }
                                          />
                                          <Route
                                            path="/assets/prompt/:id"
                                            element={
                                              <ProtectedRoute>
                                                <AuthenticatedLayout>
                                                  <PromptDetail />
                                                </AuthenticatedLayout>
                                              </ProtectedRoute>
                                            }
                                          />
                                          <Route
                                            path="/assets/classify"
                                            element={
                                              <ProtectedRoute>
                                                <AuthenticatedLayout>
                                                  <SingleClassify />
                                                </AuthenticatedLayout>
                                              </ProtectedRoute>
                                            }
                                          />
                                          <Route
                                            path="/assets/reports"
                                            element={
                                              <ProtectedRoute>
                                                <AuthenticatedLayout>
                                                  <AssetReports />
                                                </AuthenticatedLayout>
                                              </ProtectedRoute>
                                            }
                                          />
                                          <Route
                                            path="/assets/reports/fixed-register"
                                            element={
                                              <ProtectedRoute>
                                                <AuthenticatedLayout>
                                                  <FixedAssetRegister />
                                                </AuthenticatedLayout>
                                              </ProtectedRoute>
                                            }
                                          />

                                          {/* Library module routes */}
                                          <Route
                                            path="/library"
                                            element={
                                              <ProtectedRoute>
                                                <AuthenticatedLayout>
                                                  <LibraryDashboard />
                                                </AuthenticatedLayout>
                                              </ProtectedRoute>
                                            }
                                          />
                                          <Route
                                            path="/library/receive"
                                            element={
                                              <ProtectedRoute>
                                                <AuthenticatedLayout>
                                                  <LibraryReceive />
                                                </AuthenticatedLayout>
                                              </ProtectedRoute>
                                            }
                                          />
                                          <Route
                                            path="/library/catalogue"
                                            element={
                                              <ProtectedRoute>
                                                <AuthenticatedLayout>
                                                  <Catalogue />
                                                </AuthenticatedLayout>
                                              </ProtectedRoute>
                                            }
                                          />
                                          <Route
                                            path="/library/copies"
                                            element={
                                              <ProtectedRoute>
                                                <AuthenticatedLayout>
                                                  <BookCopies />
                                                </AuthenticatedLayout>
                                              </ProtectedRoute>
                                            }
                                          />
                                          <Route
                                            path="/library/circulation"
                                            element={
                                              <ProtectedRoute>
                                                <AuthenticatedLayout>
                                                  <IssueReturn />
                                                </AuthenticatedLayout>
                                              </ProtectedRoute>
                                            }
                                          />
                                          <Route
                                            path="/library/bulk-issue"
                                            element={
                                              <ProtectedRoute>
                                                <AuthenticatedLayout>
                                                  <BulkIssue />
                                                </AuthenticatedLayout>
                                              </ProtectedRoute>
                                            }
                                          />
                                          <Route
                                            path="/library/transfers"
                                            element={
                                              <ProtectedRoute>
                                                <AuthenticatedLayout>
                                                  <BranchTransfers />
                                                </AuthenticatedLayout>
                                              </ProtectedRoute>
                                            }
                                          />
                                          <Route
                                            path="/library/reports"
                                            element={
                                              <ProtectedRoute>
                                                <AuthenticatedLayout>
                                                  <LibraryReports />
                                                </AuthenticatedLayout>
                                              </ProtectedRoute>
                                            }
                                          />
                                          {/* Students module routes */}
                                          <Route
                                            path="/students"
                                            element={
                                              <ProtectedRoute>
                                                <AuthenticatedLayout>
                                                  <StudentRegister />
                                                </AuthenticatedLayout>
                                              </ProtectedRoute>
                                            }
                                          />
                                          <Route
                                            path="/students/distribution"
                                            element={
                                              <ProtectedRoute>
                                                <AuthenticatedLayout>
                                                  <StudentDistribution />
                                                </AuthenticatedLayout>
                                              </ProtectedRoute>
                                            }
                                          />
                                          <Route
                                            path="/students/distribution-reports"
                                            element={
                                              <ProtectedRoute>
                                                <AuthenticatedLayout>
                                                  <DistributionReports />
                                                </AuthenticatedLayout>
                                              </ProtectedRoute>
                                            }
                                          />

                                          {/* Staff module routes */}
                                          <Route
                                            path="/staff"
                                            element={
                                              <ProtectedRoute>
                                                <AuthenticatedLayout>
                                                  <StaffRegister />
                                                </AuthenticatedLayout>
                                              </ProtectedRoute>
                                            }
                                          />

                                          {/* Finance tabbed hub */}
                                          <Route path="/finance" element={<ProtectedRoute><AuthenticatedLayout><FinancePage /></AuthenticatedLayout></ProtectedRoute>} />
                                          {/* Finance module routes — Setup */}
                                          <Route path="/finance/setup/chart-of-accounts" element={<ProtectedRoute><AuthenticatedLayout><FinSetupChartOfAccounts /></AuthenticatedLayout></ProtectedRoute>} />
                                          <Route path="/finance/setup/accounts-master" element={<ProtectedRoute><AuthenticatedLayout><FinSetupAccountsMaster /></AuthenticatedLayout></ProtectedRoute>} />
                                          <Route path="/finance/setup/year-period-control" element={<ProtectedRoute><AuthenticatedLayout><FinSetupYearPeriodControl /></AuthenticatedLayout></ProtectedRoute>} />
                                          <Route path="/finance/setup/budget-master" element={<ProtectedRoute><AuthenticatedLayout><FinSetupBudgetMaster /></AuthenticatedLayout></ProtectedRoute>} />
                                          {/* Finance module routes — Receipts */}
                                          <Route path="/finance/receipts/receipt-entry" element={<ProtectedRoute><AuthenticatedLayout><FinReceiptsReceiptEntry /></AuthenticatedLayout></ProtectedRoute>} />
                                          <Route path="/finance/receipts/payment-vouchers" element={<ProtectedRoute><AuthenticatedLayout><FinReceiptsPaymentVouchers /></AuthenticatedLayout></ProtectedRoute>} />
                                          <Route path="/finance/receipts/journal-vouchers" element={<ProtectedRoute><AuthenticatedLayout><FinReceiptsJournalVouchers /></AuthenticatedLayout></ProtectedRoute>} />
                                          <Route path="/finance/receipts/contra-vouchers" element={<ProtectedRoute><AuthenticatedLayout><FinReceiptsContraVouchers /></AuthenticatedLayout></ProtectedRoute>} />
                                          {/* Finance module routes — Creditors */}
                                          <Route path="/finance/creditors/supplier-invoices" element={<ProtectedRoute><AuthenticatedLayout><FinCreditorsSupplierInvoices /></AuthenticatedLayout></ProtectedRoute>} />
                                          <Route path="/finance/creditors/credit-debit-notes" element={<ProtectedRoute><AuthenticatedLayout><FinCreditorsCreditDebitNotes /></AuthenticatedLayout></ProtectedRoute>} />
                                          <Route path="/finance/creditors/creditor-ageing" element={<ProtectedRoute><AuthenticatedLayout><FinCreditorsCreditorAgeing /></AuthenticatedLayout></ProtectedRoute>} />
                                          {/* Finance module routes — Inventory */}
                                          <Route path="/finance/inventory/item-master" element={<ProtectedRoute><AuthenticatedLayout><FinInventoryItemMaster /></AuthenticatedLayout></ProtectedRoute>} />
                                          <Route path="/finance/inventory/grn" element={<ProtectedRoute><AuthenticatedLayout><FinInventoryGRN /></AuthenticatedLayout></ProtectedRoute>} />
                                          <Route path="/finance/inventory/issues" element={<ProtectedRoute><AuthenticatedLayout><FinInventoryIssues /></AuthenticatedLayout></ProtectedRoute>} />
                                          <Route path="/finance/inventory/stock-adjustments" element={<ProtectedRoute><AuthenticatedLayout><FinInventoryStockAdjustments /></AuthenticatedLayout></ProtectedRoute>} />
                                          {/* Finance module routes — Fixed Assets */}
                                          <Route path="/finance/assets/asset-register" element={<ProtectedRoute><AuthenticatedLayout><FinAssetsAssetRegister /></AuthenticatedLayout></ProtectedRoute>} />
                                          <Route path="/finance/assets/additions" element={<ProtectedRoute><AuthenticatedLayout><FinAssetsAdditions /></AuthenticatedLayout></ProtectedRoute>} />
                                          <Route path="/finance/assets/depreciation-run" element={<ProtectedRoute><AuthenticatedLayout><FinAssetsDepreciationRun /></AuthenticatedLayout></ProtectedRoute>} />
                                          <Route path="/finance/assets/disposals" element={<ProtectedRoute><AuthenticatedLayout><FinAssetsDisposals /></AuthenticatedLayout></ProtectedRoute>} />
                                          {/* Finance module routes — GL & Cash */}
                                          <Route path="/finance/gl-cash/general-ledger" element={<ProtectedRoute><AuthenticatedLayout><FinGLCashGeneralLedger /></AuthenticatedLayout></ProtectedRoute>} />
                                          <Route path="/finance/gl-cash/cash-bank" element={<ProtectedRoute><AuthenticatedLayout><FinGLCashCashBank /></AuthenticatedLayout></ProtectedRoute>} />
                                          <Route path="/finance/gl-cash/bank-reconciliation" element={<ProtectedRoute><AuthenticatedLayout><FinGLCashBankReconciliation /></AuthenticatedLayout></ProtectedRoute>} />
                                          {/* Finance module routes — Reports */}
                                          <Route path="/finance/reports/financial-statements" element={<ProtectedRoute><AuthenticatedLayout><FinReportsFinancialStatements /></AuthenticatedLayout></ProtectedRoute>} />
                                          <Route path="/finance/reports/reports" element={<ProtectedRoute><AuthenticatedLayout><FinReportsReports /></AuthenticatedLayout></ProtectedRoute>} />
                                          <Route path="/finance/reports/period-close" element={<ProtectedRoute><AuthenticatedLayout><FinReportsPeriodClose /></AuthenticatedLayout></ProtectedRoute>} />
                                          {/* Finance module routes — Students */}
                                          <Route path="/finance/students/fee-structures" element={<ProtectedRoute><AuthenticatedLayout><FinStudentsFeeStructures /></AuthenticatedLayout></ProtectedRoute>} />
                                          <Route path="/finance/students/term-billing" element={<ProtectedRoute><AuthenticatedLayout><FinStudentsTermBilling /></AuthenticatedLayout></ProtectedRoute>} />
                                          <Route path="/finance/students/student-statements" element={<ProtectedRoute><AuthenticatedLayout><FinStudentsStatements /></AuthenticatedLayout></ProtectedRoute>} />
                                          <Route path="/finance/students/bursaries" element={<ProtectedRoute><AuthenticatedLayout><FinStudentsBursaries /></AuthenticatedLayout></ProtectedRoute>} />

                                          {/* Catch-all */}
                                          <Route path="*" element={<NotFound />} />
                                        </Routes>
                                      </BrowserRouter>
                                    </TooltipProvider>
                                  </RIAProvider>
                                </LibraryProvider>
                              </StaffProvider>
                            </StudentProvider>
                          </ClientSetupProvider>
                        </SchoolProvider>
                      </AdminProvider>
                    </DeliveryProvider>
                  </S12Provider>
                </RecordsRetentionProvider>
              </FileMovementProvider>
            </AuditProvider>
          </MessageProvider>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider >
);

export default App;
