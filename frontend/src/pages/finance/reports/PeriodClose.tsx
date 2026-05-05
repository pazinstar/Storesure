import { useState } from "react";
import { CheckCircle2, Circle, XCircle, AlertTriangle, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface CheckItem { id: string; label: string; description: string; group: string; status: "OK" | "WARN" | "FAIL" | "PENDING"; }

const INIT_CHECKS: CheckItem[] = [
  // Receipts
  { id: "C01", label: "All receipt vouchers posted", description: "No DRAFT receipt vouchers remain for the period", group: "Receipts", status: "OK" },
  { id: "C02", label: "All payment vouchers posted", description: "No DRAFT payment vouchers remain for the period", group: "Receipts", status: "OK" },
  { id: "C03", label: "All journal vouchers posted", description: "No DRAFT journal or contra vouchers remain", group: "Receipts", status: "OK" },
  // Students
  { id: "C04", label: "Term billing run posted", description: "At least one billing run is POSTED for the period", group: "Students", status: "OK" },
  { id: "C05", label: "Fee receipts reconciled", description: "Total receipts match billing + adjustments", group: "Students", status: "OK" },
  // Inventory
  { id: "C06", label: "GRNs posted", description: "All Goods Received Notes for the period are POSTED", group: "Inventory", status: "OK" },
  { id: "C07", label: "Stock issues posted", description: "All stock issue vouchers are POSTED", group: "Inventory", status: "WARN" },
  { id: "C08", label: "Stock adjustments approved", description: "No pending stock adjustment DRAFTS", group: "Inventory", status: "WARN" },
  // Assets
  { id: "C09", label: "Depreciation run posted", description: "Monthly depreciation run has been POSTED for the period", group: "Fixed Assets", status: "OK" },
  { id: "C10", label: "Asset additions posted", description: "No DRAFT asset addition vouchers remain", group: "Fixed Assets", status: "OK" },
  // Bank
  { id: "C11", label: "Bank reconciliation completed", description: "All bank accounts reconciled — difference = NIL", group: "GL & Cash", status: "FAIL" },
  { id: "C12", label: "Trial balance balanced", description: "Total debits equal total credits — TB balanced", group: "GL & Cash", status: "OK" },
];

const STATUS_ICON = {
  OK: <CheckCircle2 className="h-5 w-5 text-green-600" />,
  WARN: <AlertTriangle className="h-5 w-5 text-amber-500" />,
  FAIL: <XCircle className="h-5 w-5 text-red-500" />,
  PENDING: <Circle className="h-5 w-5 text-gray-400" />,
};

const STATUS_BADGE = {
  OK: "bg-green-100 text-green-800",
  WARN: "bg-amber-100 text-amber-700",
  FAIL: "bg-red-100 text-red-700",
  PENDING: "bg-gray-100 text-gray-500",
};

const GROUPS = ["Receipts", "Students", "Inventory", "Fixed Assets", "GL & Cash"];
const PERIODS = ["P01 Jan-25", "P02 Feb-25"];

export default function PeriodClose() {
  const { toast } = useToast();
  const [period, setPeriod] = useState("P01 Jan-25");
  const [checks, setChecks] = useState<CheckItem[]>(INIT_CHECKS);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [closed, setClosed] = useState(false);

  const okCount = checks.filter(c => c.status === "OK").length;
  const failCount = checks.filter(c => c.status === "FAIL").length;
  const warnCount = checks.filter(c => c.status === "WARN").length;
  const progress = Math.round((okCount / checks.length) * 100);
  const canClose = failCount === 0;

  const runChecks = () => {
    setChecks(p => p.map(c => ({ ...c, status: c.status === "PENDING" ? "OK" : c.status })));
    toast({ title: "Pre-close checks refreshed" });
  };

  const closePeriod = () => {
    setClosed(true);
    setConfirmOpen(false);
    toast({ title: `${period} is now CLOSED — no further postings allowed`, description: warnCount > 0 ? `${warnCount} warning(s) acknowledged` : undefined });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Period Close</h1>
          <p className="text-muted-foreground">Complete pre-close checklist then lock the accounting period</p>
        </div>
        <div className="flex gap-2 items-end">
          <div className="space-y-1">
            <Label className="text-xs">Period to Close</Label>
            <Select value={period} onValueChange={p => { setPeriod(p); setClosed(false); }}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>{PERIODS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Button variant="outline" onClick={runChecks}>Refresh Checks</Button>
          <Button
            disabled={!canClose || closed}
            className={closed ? "bg-gray-400" : "bg-red-600 hover:bg-red-700"}
            onClick={() => setConfirmOpen(true)}
          >
            <Lock className="mr-2 h-4 w-4" />
            {closed ? "Period Closed" : "Close Period"}
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{checks.length}</div>
            <div className="text-sm text-muted-foreground">Total Checks</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-700">{okCount}</div>
            <div className="text-sm text-muted-foreground">Passed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-amber-600">{warnCount}</div>
            <div className="text-sm text-muted-foreground">Warnings</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-red-600">{failCount}</div>
            <div className="text-sm text-muted-foreground">Failed (blocking)</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Close Readiness — {period}</CardTitle>
            {closed
              ? <Badge className="bg-red-100 text-red-800 text-sm px-3 py-1"><Lock className="h-3 w-3 mr-1 inline" />CLOSED</Badge>
              : canClose
                ? <Badge className="bg-green-100 text-green-800 text-sm px-3 py-1">READY TO CLOSE</Badge>
                : <Badge className="bg-red-100 text-red-700 text-sm px-3 py-1">BLOCKED — {failCount} issue(s)</Badge>
            }
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">Pre-close checks</span>
              <span className="font-medium">{okCount} / {checks.length} passed</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <div className="space-y-6">
            {GROUPS.map(group => {
              const groupChecks = checks.filter(c => c.group === group);
              return (
                <div key={group}>
                  <div className="font-semibold text-sm mb-2">{group}</div>
                  <div className="space-y-2">
                    {groupChecks.map(c => (
                      <div key={c.id} className={`flex items-start gap-3 p-3 rounded-lg border ${c.status === "FAIL" ? "border-red-200 bg-red-50" : c.status === "WARN" ? "border-amber-200 bg-amber-50" : "border-gray-100 bg-gray-50"}`}>
                        <div className="shrink-0 mt-0.5">{STATUS_ICON[c.status]}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{c.label}</span>
                            <Badge className={`text-xs ${STATUS_BADGE[c.status]}`}>{c.status}</Badge>
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">{c.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Separator className="mt-4" />
                </div>
              );
            })}
          </div>

          {failCount > 0 && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-sm text-red-700">
              <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span><strong>{failCount} blocking issue(s)</strong> must be resolved before this period can be closed. Resolve the failed checks above and refresh.</span>
            </div>
          )}
          {canClose && !closed && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2 text-sm text-green-700">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
              <span>All blocking checks passed. You may close {period}. {warnCount > 0 && `(${warnCount} warning(s) will be acknowledged on close.)`}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Confirm Period Close</DialogTitle></DialogHeader>
          <div className="py-4 space-y-3">
            <div className="text-sm">You are about to <strong>close period {period}</strong>.</div>
            <div className="text-sm text-muted-foreground">Once closed, no further postings will be allowed in this period. This action should only be reversed by the System Administrator.</div>
            {warnCount > 0 && (
              <div className="flex items-center gap-2 text-amber-700 bg-amber-50 rounded p-2 text-sm">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{warnCount} warning(s) will be acknowledged and the period will be closed anyway.</span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancel</Button>
            <Button className="bg-red-600 hover:bg-red-700" onClick={closePeriod}><Lock className="mr-2 h-4 w-4" />Confirm Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
