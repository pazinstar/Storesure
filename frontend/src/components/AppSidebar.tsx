import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useAudit } from "@/contexts/AuditContext";
import {
  LayoutDashboard,
  Package,
  Warehouse,
  ChevronDown,
  ClipboardList,
  ArrowDownToLine,
  ArrowUpFromLine,
  Scale,
  RefreshCw,
  ArrowLeftRight,
  FileText,
  Building2,
  BookOpen,
  Settings,
  Landmark,
  Truck,
  ClipboardCheck as ClipboardCheckIcon,
  ClipboardSignature,
  FileSpreadsheet,
  Users,
  ShoppingCart,
  Gavel,
  Receipt,
  LogOut,
  Hash,
  FolderOpen,
  ScrollText,
  FileInput,
  Palette,
  GraduationCap,
  UserCog,
  Clock,
  Shield,
  DollarSign,
  BookMarked,
  Calculator,
  CreditCard,
  BarChart3,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { useMemo } from "react";
import { useRIA } from "@/contexts/RIAContext";

const modules = [
  {
    name: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
    items: [],
    roles: ["headteacher", "bursar", "storekeeper", "librarian", "auditor", "procurement_officer", "admin"],
  },
  // Procurement module hidden for pilot phase - Suppliers Register moved to Stores
  // {
  //   name: "Procurement",
  //   icon: ShoppingCart,
  //   roles: ["headteacher", "bursar", "procurement_officer", "admin"],
  //   items: [
  //     { name: "Suppliers Register", href: "/procurement/suppliers", icon: Building2 },
  //   ],
  // },
  {
    name: "Stores",
    icon: Warehouse,
    roles: ["headteacher", "bursar", "storekeeper", "admin"],
    items: [
      { name: "Store Dashboard", href: "/stores", icon: LayoutDashboard },
      { name: "Suppliers Register", href: "/procurement/suppliers", icon: Building2 },
      { name: "Item Master", href: "/stores/items", icon: Package },
      { name: "Requisition", href: "/stores/s12", icon: ClipboardList },
      { name: "Purchase Orders (LPO)", href: "/stores/lpo", icon: FileInput },
      { name: "Delivery Logging", href: "/stores/delivery", icon: Truck },
      { name: "Inspection & Acceptance", href: "/stores/inspection", icon: ClipboardCheckIcon },
      { name: "Receive Stock (GRN)", href: "/stores/receive", icon: ArrowDownToLine },
      { name: "Issue Stock", href: "/stores/issue", icon: ArrowUpFromLine },
      { name: "Routine Issue Authorities", href: "/stores/ria", icon: Clock },
      { name: "SRIV", href: "/stores/sriv", icon: Receipt },
      { name: "Ledgers", href: "/stores/ledger", icon: ScrollText },
      // { name: "Stock Balances", href: "/stores/balances", icon: Scale }, // Hidden for pilot
      // { name: "Stock Adjustments", href: "/stores/adjustments", icon: RefreshCw }, // Hidden for pilot
      // { name: "Stock Transfers", href: "/stores/transfers", icon: ArrowLeftRight }, // Hidden for pilot
      { name: "Store Reports", href: "/stores/reports", icon: FileText },
    ],
  },
  // Assets module hidden for pilot phase
  // {
  //   name: "Assets",
  //   icon: Building2,
  //   roles: ["headteacher", "bursar", "storekeeper", "auditor", "admin"],
  //   items: [
  //     { name: "Asset Register", href: "/assets", icon: ClipboardList },
  //     { name: "Asset Movement", href: "/assets/movement", icon: Truck },
  //     { name: "Board of Survey", href: "/assets/survey", icon: ClipboardCheck },
  //     { name: "Disposal", href: "/assets/disposal", icon: FileSpreadsheet },
  //     { name: "Asset Reports", href: "/assets/reports", icon: FileText },
  //   ],
  // },
  {
    name: "Library",
    icon: BookOpen,
    roles: ["headteacher", "librarian", "admin"],
    items: [
      { name: "Library Dashboard", href: "/library", icon: LayoutDashboard },
      { name: "Receive (Books In)", href: "/library/receive", icon: ArrowDownToLine },
      { name: "Catalogue / Register", href: "/library/catalogue", icon: ClipboardList },
      { name: "Issue/Return", href: "/library/circulation", icon: ArrowLeftRight },
      { name: "Library Reports", href: "/library/reports", icon: FileText },
    ],
  },
  {
    name: "Students",
    icon: GraduationCap,
    roles: ["headteacher", "bursar", "storekeeper", "librarian", "admin"],
    items: [
      { name: "Student Register", href: "/students", icon: Users },
      { name: "Student Distribution", href: "/students/distribution", icon: Package },
      { name: "Distribution Reports", href: "/students/distribution-reports", icon: FileText },
    ],
  },
  {
    name: "Staff",
    icon: UserCog,
    roles: ["headteacher", "bursar", "admin"],
    items: [
      { name: "Staff Register", href: "/staff", icon: Users },
    ],
  },
  {
    name: "Finance",
    icon: DollarSign,
    roles: ["bursar", "headteacher", "auditor", "admin"],
    // Section-level items — each links to FinancePage with the relevant tab active.
    // The deep sub-page hrefs are kept in permItems for permissions filtering only.
    items: [
      { name: "Setup", href: "/finance?tab=setup", icon: Settings },
      { name: "Student Billing", href: "/finance?tab=students", icon: GraduationCap },
      { name: "Receipts & Payments", href: "/finance?tab=receipts", icon: Receipt },
      { name: "Receivables & Payables", href: "/finance?tab=creditors", icon: Building2 },
      { name: "Inventory", href: "/finance?tab=inventory", icon: Package },
      { name: "Fixed Assets", href: "/finance?tab=assets", icon: Landmark },
      { name: "GL & Cash", href: "/finance?tab=gl-cash", icon: BookOpen },
      { name: "Reports", href: "/finance?tab=reports", icon: BarChart3 },
    ],
    // permItems used only by the permissions filter (not rendered in sidebar)
    permItems: [
      { name: "Chart of Accounts", href: "/finance/setup/chart-of-accounts" },
      { name: "Accounts Master", href: "/finance/setup/accounts-master" },
      { name: "Year & Period Control", href: "/finance/setup/year-period-control" },
      { name: "Budget Master", href: "/finance/setup/budget-master" },
      { name: "Fee Structures", href: "/finance/students/fee-structures" },
      { name: "Term Billing", href: "/finance/students/term-billing" },
      { name: "Student Statements", href: "/finance/students/student-statements" },
      { name: "Bursaries", href: "/finance/students/bursaries" },
      { name: "Receipt Entry", href: "/finance/receipts/receipt-entry" },
      { name: "Payment Vouchers", href: "/finance/receipts/payment-vouchers" },
      { name: "Journal Vouchers", href: "/finance/receipts/journal-vouchers" },
      { name: "Contra Vouchers", href: "/finance/receipts/contra-vouchers" },
      { name: "Supplier Invoices", href: "/finance/creditors/supplier-invoices" },
      { name: "Credit/Debit Notes", href: "/finance/creditors/credit-debit-notes" },
      { name: "Creditor Ageing", href: "/finance/creditors/creditor-ageing" },
      { name: "Item Master", href: "/finance/inventory/item-master" },
      { name: "GRN", href: "/finance/inventory/grn" },
      { name: "Issues", href: "/finance/inventory/issues" },
      { name: "Stock Adjustments", href: "/finance/inventory/stock-adjustments" },
      { name: "Asset Register", href: "/finance/assets/asset-register" },
      { name: "Additions", href: "/finance/assets/additions" },
      { name: "Depreciation Run", href: "/finance/assets/depreciation-run" },
      { name: "Disposals", href: "/finance/assets/disposals" },
      { name: "General Ledger", href: "/finance/gl-cash/general-ledger" },
      { name: "Cash & Bank", href: "/finance/gl-cash/cash-bank" },
      { name: "Bank Reconciliation", href: "/finance/gl-cash/bank-reconciliation" },
      { name: "Financial Statements", href: "/finance/reports/financial-statements" },
      { name: "Reports", href: "/finance/reports/reports" },
      { name: "Period Close", href: "/finance/reports/period-close" },
    ],
  },
  {
    name: "Administration",
    icon: Settings,
    roles: ["admin", "headteacher"],
    items: [
      { name: "Setup", href: "/admin/control-panel", icon: Settings },
      { name: "Schools Management", href: "/admin/client-setup", icon: Building2 },
      { name: "School Branding", href: "/admin/branding", icon: Palette },
      { name: "User Management", href: "/admin/users", icon: Users },
      { name: "Role Management", href: "/admin/roles", icon: Shield },
    ],
  },
];

// Map module names to their IDs in ClientSetup
const moduleNameToId: Record<string, string> = {
  "Stores": "stores",
  "Library": "library",
  "Students": "students",
  "Staff": "staff",
  "Administration": "administration",
  "Finance": "finance",
};

export function AppSidebar() {
  const location = useLocation();
  const { state } = useSidebar();
  const { user, logout } = useAuth();
  const { addLog } = useAudit();
  const isCollapsed = state === "collapsed";
  const ria = (() => {
    try {
      return useRIA();
    } catch {
      return null;
    }
  })();
  const pendingRIAs = ria?.getPendingCount?.() ?? 0;

  const handleLogout = () => {
    addLog("User Logout", "System", "User logged out of the system");
    logout();
  };

  const isActive = (href: string) => {
    const [path, query] = href.split("?");
    if (query) {
      const params = new URLSearchParams(query);
      const tab = params.get("tab");
      return location.pathname === path && new URLSearchParams(location.search).get("tab") === tab;
    }
    return location.pathname === path;
  };
  const isModuleActive = (items: { href: string }[]) =>
    items.some((item) => {
      const path = item.href.split("?")[0];
      return location.pathname.startsWith(path.split("/").slice(0, 2).join("/"));
    });

  // Filter modules using backend-returned permissions.
  // Backend already intersects role permissions with school-level config on login,
  // so user.permissions is the single source of truth — no separate school filter needed.
  const visibleModules = useMemo(() => {
    if (!user) return [];

    // Super admin with no school: sees all modules
    if (user.role === "admin" && !user.school?.id) {
      return modules;
    }

    const perms = user.permissions ?? [];

    return modules
      .map(module => {
        const moduleId = moduleNameToId[module.name];

        // Dashboard and other non-module pages always show
        if (!moduleId) return module;

        // Must have canView for this module (already school-intersected by backend)
        const perm = perms.find(p => p.moduleId === moduleId);
        if (!perm?.canView) return null;

        // Filter links to only those the role (and school) allow.
        // For modules that use permItems (e.g. Finance), filter against permItems
        // so the section-level sidebar items are not incorrectly hidden.
        const permLinks = perm.links ?? [];
        const moduleAny = module as any;
        const itemsToFilter: { href: string }[] = moduleAny.permItems ?? module.items;
        const filteredPermItems = itemsToFilter.filter(item => {
          if (!permLinks.length) return true;
          // Backend only returns enabled links — presence in the list means access granted.
          return permLinks.some((l: { href: string }) => item.href === l.href);
        });

        if (filteredPermItems.length === 0 && itemsToFilter.length > 0) return null;

        // For Finance (permItems pattern): keep all section-level items; the permission
        // check above just gates whether the module is visible at all.
        if (moduleAny.permItems) {
          return { ...module, permItems: filteredPermItems };
        }

        const filteredItems = module.items.filter(item =>
          filteredPermItems.some(p => p.href === item.href)
        );

        return { ...module, items: filteredItems };
      })
      .filter(Boolean) as typeof modules;
  }, [modules, user]);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex h-12 items-center gap-2 px-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Landmark className="h-4 w-4 text-primary-foreground" />
          </div>
          {!isCollapsed && (
            <span className="font-semibold text-sidebar-foreground">
              StoreSure
            </span>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarMenu>
            {visibleModules.map((module) => {
              const moduleAny = module as any;
              // Simple link (e.g. Dashboard — no items)
              if (module.items.length === 0) {
                return (
                  <SidebarMenuItem key={module.name}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(module.href!)}
                      tooltip={module.name}
                    >
                      <Link to={module.href!}>
                        <module.icon className="h-4 w-4" />
                        <span>{module.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              }

              // Module with nested sub-groups
              if (moduleAny.subGroups?.length > 0) {
                return (
                  <Collapsible
                    key={module.name}
                    asChild
                    defaultOpen={isModuleActive(module.items)}
                    className="group/collapsible"
                  >
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                          tooltip={module.name}
                          isActive={isModuleActive(module.items)}
                        >
                          <module.icon className="h-4 w-4" />
                          <span>{module.name}</span>
                          <ChevronDown className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {moduleAny.subGroups.map((group: any) => (
                            <Collapsible
                              key={group.name}
                              defaultOpen={group.items.some((i: any) => isActive(i.href))}
                              className="group/subgroup"
                            >
                              <SidebarMenuSubItem>
                                <CollapsibleTrigger asChild>
                                  <SidebarMenuSubButton className="font-medium text-sidebar-foreground/80">
                                    <group.icon className="h-3.5 w-3.5 shrink-0" />
                                    <span className="flex-1 truncate">{group.name}</span>
                                    <ChevronDown className="ml-auto h-3 w-3 transition-transform duration-200 group-data-[state=open]/subgroup:rotate-180" />
                                  </SidebarMenuSubButton>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                  <div className="ml-3 border-l border-sidebar-border pl-2 py-0.5">
                                    {group.items.map((item: any) => (
                                      <SidebarMenuSubItem key={item.name}>
                                        <SidebarMenuSubButton
                                          asChild
                                          isActive={isActive(item.href)}
                                          className="w-full"
                                        >
                                          <Link to={item.href} className="flex w-full items-center gap-2">
                                            <item.icon className="h-3 w-3 shrink-0" />
                                            <span className="min-w-0 flex-1 truncate text-xs">{item.name}</span>
                                          </Link>
                                        </SidebarMenuSubButton>
                                      </SidebarMenuSubItem>
                                    ))}
                                  </div>
                                </CollapsibleContent>
                              </SidebarMenuSubItem>
                            </Collapsible>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                );
              }

              // Regular collapsible module (flat items)
              return (
                <Collapsible
                  key={module.name}
                  asChild
                  defaultOpen={isModuleActive(module.items)}
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        tooltip={module.name}
                        isActive={isModuleActive(module.items)}
                      >
                        <module.icon className="h-4 w-4" />
                        <span>{module.name}</span>
                        <ChevronDown className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {module.items.map((item) => {
                          const HIGHLIGHT = new Set([
                            "Delivery Logging",
                            "Inspection & Acceptance",
                            "Receive Stock (GRN)",
                            "Issue Stock",
                          ]);
                          const isHighlight = HIGHLIGHT.has(item.name);
                          const pending = item.name === "Routine Issue Authorities" ? pendingRIAs : 0;
                          const showPending =
                            item.name === "Routine Issue Authorities" &&
                            (user?.role === "bursar" || user?.role === "headteacher") &&
                            pending > 0;
                          return (
                            <SidebarMenuSubItem key={item.name}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={isActive(item.href)}
                                className={cn(
                                  "w-full",
                                  isHighlight ? "font-semibold" : ""
                                )}
                              >
                                <Link
                                  to={item.href}
                                  className={cn(
                                    "flex w-full items-center gap-2 rounded-md px-2 py-1.5",
                                    isHighlight ? "border-l-2 border-primary bg-primary/10 text-primary" : ""
                                  )}
                                >
                                  <item.icon
                                    className={cn(
                                      "h-3.5 w-3.5 shrink-0",
                                      isHighlight ? "text-primary" : ""
                                    )}
                                  />
                                  <span className={cn("min-w-0 flex-1 truncate")}>{item.name}</span>
                                  {showPending && !isCollapsed && (
                                    <span className="ml-auto mr-1 rounded-md bg-warning/10 px-1.5 py-0.5 text-[10px] text-warning">
                                      {pending}
                                    </span>
                                  )}
                                  {isHighlight &&
                                    (!isCollapsed ? (
                                      <span className="ml-auto shrink-0 rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary">
                                        Action
                                      </span>
                                    ) : (
                                      <span className="sr-only">Action</span>
                                    ))}
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          );
                        })}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      {/* User block removed from sidebar per brief */}
    </Sidebar>
  );
}
