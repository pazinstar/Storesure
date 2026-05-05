import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KPICards } from "@/components/dashboard/KPICards";
import { ProcurementAnalytics } from "@/components/dashboard/ProcurementAnalytics";
import { StoresInsights } from "@/components/dashboard/StoresInsights";
import { AssetAnalytics } from "@/components/dashboard/AssetAnalytics";
import { LibraryAnalytics } from "@/components/dashboard/LibraryAnalytics";
import { AuditActivityLog } from "@/components/dashboard/AuditActivityLog";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { 
  LayoutDashboard, 
  FileText, 
  Package, 
  Building2, 
  BookOpen,
  Shield,
  User
} from "lucide-react";

const roleLabels: Record<string, string> = {
  admin: "System Administrator",
  headteacher: "Headteacher",
  bursar: "Bursar",
  storekeeper: "Storekeeper",
  librarian: "Librarian",
  auditor: "Auditor",
  procurement_officer: "Procurement Officer",
};

export default function Dashboard() {
  const { user, canView } = useAuth();
  const currentRole = user?.role || "storekeeper";

  const roleConfig: Record<string, string[]> = {
    admin: [],
    headteacher: [],
    bursar: [],
    storekeeper: [],
    librarian: [],
    procurement_officer: [],
    auditor: [],
  };
  const availableTabs = ["overview"];
  const canViewProcurement = canView("procurement");
  const canViewStores = canView("stores");
  const canViewAssets = canView("assets");
  const canViewLibrary = canView("library");
  const canViewAudit = false;

  const getDefaultTab = () => {
    if (availableTabs.length > 0) return availableTabs[0];
    return "overview";
  };

  const getWelcomeMessage = () => {
    switch (currentRole) {
      case "storekeeper":
        return "Inventory & Stock Management";
      case "librarian":
        return "Library Operations & Circulation";
      case "procurement_officer":
        return "Procurement & Requisitions Management";
      case "bursar":
        return "Finance, Procurement & Asset Oversight";
      case "headteacher":
        return "Executive Overview — All Modules";
      case "auditor":
        return "Audit Review — Read-Only Access";
      case "admin":
        return "System Administration — Full Access";
      default:
        return "School Management Dashboard";
    }
  };

  return (
    <div className="flex-1 space-y-6 p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground lg:text-3xl">
            {getWelcomeMessage()}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground lg:text-base">
            StoreSure — MoE & PPADA 2015 Compliant Management System
          </p>
        </div>
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Logged in as:</span>
          <Badge variant="outline" className="font-medium">
            {roleLabels[currentRole] || currentRole}
          </Badge>
        </div>
      </div>

      {/* KPI Cards - Role-specific */}
      <section>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
          <LayoutDashboard className="h-5 w-5 text-primary" />
          Status & Exceptions
        </h2>
        <KPICards role={currentRole} />
      </section>

      {/* Tabbed Analytics Sections */}
      {availableTabs.length > 0 && (
        <Tabs defaultValue={getDefaultTab()} className="space-y-6">
          <TabsList className="flex flex-wrap gap-2">
            {availableTabs.includes("overview") && (
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <LayoutDashboard className="h-4 w-4" />
                <span className="hidden sm:inline">Overview</span>
              </TabsTrigger>
            )}
            {availableTabs.includes("procurement") && (
              <TabsTrigger value="procurement" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Procurement</span>
              </TabsTrigger>
            )}
            {availableTabs.includes("stores") && (
              <TabsTrigger value="stores" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                <span className="hidden sm:inline">Stores</span>
              </TabsTrigger>
            )}
            {availableTabs.includes("assets") && (
              <TabsTrigger value="assets" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                <span className="hidden sm:inline">Assets</span>
              </TabsTrigger>
            )}
            {availableTabs.includes("library") && (
              <TabsTrigger value="library" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                <span className="hidden sm:inline">Library</span>
              </TabsTrigger>
            )}
          </TabsList>

        {/* Overview Tab - Shows highlights from all accessible modules */}
          {availableTabs.includes("overview") && (
            <TabsContent value="overview" className="space-y-6">
              {canViewProcurement && (
                <section>
                  <Collapsible>
                    <div className="mb-2 flex items-center gap-3">
                      <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                        <FileText className="h-5 w-5 text-secondary" />
                        Procurement Analytics
                      </h2>
                      <CollapsibleTrigger asChild>
                        <Button variant="outline" size="sm" aria-label="View procurement analytics">View Analytics (Optional)</Button>
                      </CollapsibleTrigger>
                    </div>
                    <CollapsibleContent>
                      <ProcurementAnalytics />
                    </CollapsibleContent>
                  </Collapsible>
                </section>
              )}
              {canViewStores && (
                <section>
                  <Collapsible>
                    <div className="mb-2 flex items-center gap-3">
                      <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                        <Package className="h-5 w-5 text-primary" />
                        Stores Inventory Analytics
                      </h2>
                      <CollapsibleTrigger asChild>
                        <Button variant="outline" size="sm" aria-label="View stores analytics">View Analytics (Optional)</Button>
                      </CollapsibleTrigger>
                    </div>
                    <CollapsibleContent>
                      <StoresInsights />
                    </CollapsibleContent>
                  </Collapsible>
                </section>
              )}
              {canViewAssets && (
                <section>
                  <Collapsible>
                    <div className="mb-2 flex items-center gap-3">
                      <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                        <Building2 className="h-5 w-5 text-accent" />
                        Asset Analytics
                      </h2>
                      <CollapsibleTrigger asChild>
                        <Button variant="outline" size="sm" aria-label="View asset analytics">View Analytics (Optional)</Button>
                      </CollapsibleTrigger>
                    </div>
                    <CollapsibleContent>
                      <AssetAnalytics />
                    </CollapsibleContent>
                  </Collapsible>
                </section>
              )}
              {canViewLibrary && (
                <section>
                  <Collapsible>
                    <div className="mb-2 flex items-center gap-3">
                      <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                        <BookOpen className="h-5 w-5 text-warning" />
                        Library Analytics
                      </h2>
                      <CollapsibleTrigger asChild>
                        <Button variant="outline" size="sm" aria-label="View library analytics">View Analytics (Optional)</Button>
                      </CollapsibleTrigger>
                    </div>
                    <CollapsibleContent>
                      <LibraryAnalytics />
                    </CollapsibleContent>
                  </Collapsible>
                </section>
              )}
            </TabsContent>
          )}

        {/* Individual Module Tabs */}
          {canViewProcurement && (
            <TabsContent value="procurement" className="space-y-6">
              <section>
                <Collapsible>
                  <div className="mb-2 flex items-center gap-3">
                    <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                      <FileText className="h-5 w-5 text-secondary" />
                      Procurement Analytics (PPADA 2015)
                    </h2>
                    <CollapsibleTrigger asChild>
                      <Button variant="outline" size="sm" aria-label="View procurement analytics">View Analytics (Optional)</Button>
                    </CollapsibleTrigger>
                  </div>
                  <CollapsibleContent>
                    <ProcurementAnalytics />
                  </CollapsibleContent>
                </Collapsible>
              </section>
            </TabsContent>
          )}

          {canViewStores && (
            <TabsContent value="stores" className="space-y-6">
              <section>
                <Collapsible>
                  <div className="mb-2 flex items-center gap-3">
                    <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                      <Package className="h-5 w-5 text-primary" />
                      Stores Inventory Insights
                    </h2>
                    <CollapsibleTrigger asChild>
                      <Button variant="outline" size="sm" aria-label="View stores analytics">View Analytics (Optional)</Button>
                    </CollapsibleTrigger>
                  </div>
                  <CollapsibleContent>
                    <StoresInsights />
                  </CollapsibleContent>
                </Collapsible>
              </section>
            </TabsContent>
          )}

          {canViewAssets && (
            <TabsContent value="assets" className="space-y-6">
              <section>
                <Collapsible>
                  <div className="mb-2 flex items-center gap-3">
                    <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                      <Building2 className="h-5 w-5 text-accent" />
                      Asset Lifecycle & Depreciation
                    </h2>
                    <CollapsibleTrigger asChild>
                      <Button variant="outline" size="sm" aria-label="View asset analytics">View Analytics (Optional)</Button>
                    </CollapsibleTrigger>
                  </div>
                  <CollapsibleContent>
                    <AssetAnalytics />
                  </CollapsibleContent>
                </Collapsible>
              </section>
            </TabsContent>
          )}

          {canViewLibrary && (
            <TabsContent value="library" className="space-y-6">
              <section>
                <Collapsible>
                  <div className="mb-2 flex items-center gap-3">
                    <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                      <BookOpen className="h-5 w-5 text-warning" />
                      Library Usage & Circulation
                    </h2>
                    <CollapsibleTrigger asChild>
                      <Button variant="outline" size="sm" aria-label="View library analytics">View Analytics (Optional)</Button>
                    </CollapsibleTrigger>
                  </div>
                  <CollapsibleContent>
                    <LibraryAnalytics />
                  </CollapsibleContent>
                </Collapsible>
              </section>
            </TabsContent>
          )}
        </Tabs>
      )}

      {/* Audit Activity Log - Only for Auditors */}
      {canViewAudit && (
        <section>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
            <Shield className="h-5 w-5 text-muted-foreground" />
            Audit Trail & Activity Log
          </h2>
          <AuditActivityLog />
        </section>
      )}
    </div>
  );
}
