import { StatCard } from "@/components/StatCard";
import { 
  Package, 
  FileText, 
  Building2, 
  BookOpen, 
  TrendingUp, 
  AlertTriangle,
  Users,
  DollarSign,
  ClipboardCheck,
  BookCheck,
  Warehouse,
  ShoppingCart
} from "lucide-react";

interface KPICardsProps {
  role?: string;
}

export function KPICards({ role = "admin" }: KPICardsProps) {
  // Storekeeper-specific KPIs (max 3 primary)
  if (role === "storekeeper") {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Below Minimum Stock"
          value="23"
          icon={AlertTriangle}
          href="/stores/balances"
        />
        <StatCard
          title="Awaiting Inspection"
          value="5"
          icon={ClipboardCheck}
          href="/stores/inspection"
        />
        <StatCard
          title="Pending Issues (S13)"
          value="12"
          icon={ClipboardCheck}
          href="/stores/issue"
        />
      </div>
    );
  }

  // Librarian-specific KPIs (max 3 primary)
  if (role === "librarian") {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Below Minimum Stock"
          value="9"
          icon={AlertTriangle}
          href="/library/catalogue"
        />
        <StatCard
          title="At Reorder Level"
          value="6"
          icon={ShoppingCart}
          href="/library/catalogue"
        />
        <StatCard
          title="Issues Made Today"
          value="18"
          icon={ClipboardCheck}
          href="/library/circulation"
        />
      </div>
    );
  }

  // Procurement Officer-specific KPIs (max 3 primary)
  if (role === "procurement_officer") {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Requisitions Awaiting Approval"
          value="12"
          icon={FileText}
          href="/stores/s12"
        />
        <StatCard
          title="Awaiting Inspection"
          value="5"
          icon={ClipboardCheck}
          href="/stores/inspection"
        />
        <StatCard
          title="Inspections Overdue"
          value="3"
          icon={AlertTriangle}
          href="/stores/inspection"
        />
      </div>
    );
  }

  // Bursar-specific KPIs (max 3 primary)
  if (role === "bursar") {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Requisitions Awaiting Approval"
          value="8"
          icon={FileText}
          href="/stores/s12"
        />
        <StatCard
          title="At Reorder Level"
          value="17"
          icon={ShoppingCart}
          href="/stores/items"
        />
        <StatCard
          title="Inspections Awaiting Signatures"
          value="6"
          icon={ClipboardCheck}
          href="/stores/inspection"
        />
      </div>
    );
  }

  // Auditor-specific KPIs (max 3 primary)
  if (role === "auditor") {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Inspections Overdue"
          value="3"
          icon={AlertTriangle}
          href="/stores/inspection"
        />
        <StatCard
          title="Reorder Alerts Unacted"
          value="11"
          icon={AlertTriangle}
          href="/stores/items"
        />
        <StatCard
          title="Month Not Closed"
          value="No"
          icon={AlertTriangle}
          href="/stores/reports"
        />
      </div>
    );
  }

  // Headteacher - Governance & Risk (max 3 primary)
  if (role === "headteacher") {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Pending Approvals" value="12" icon={FileText} href="/stores/s12" />
        <StatCard title="Inspections Awaiting Signatures" value="6" icon={ClipboardCheck} href="/stores/inspection" />
        <StatCard title="Stock Risk (Reorder)" value="17" icon={ShoppingCart} href="/stores/items" />
      </div>
    );
  }

  // Admin - Configuration & Oversight (max 3 primary)
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <StatCard title="Pending Approvals" value="12" icon={FileText} href="/stores/s12" />
      <StatCard title="Awaiting Inspection" value="5" icon={ClipboardCheck} href="/stores/inspection" />
      <StatCard title="Month Not Closed" value="No" icon={AlertTriangle} href="/stores/reports" />
    </div>
  );
}
