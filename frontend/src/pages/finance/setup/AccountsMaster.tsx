import { useState } from "react";
import { Plus, Pencil, Building2, Wallet, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/ui/table-pagination";

interface BankAccount {
  id: number;
  accountName: string;
  bankName: string;
  accountNumber: string;
  branch: string;
  currency: string;
  glCode: string;
  active: boolean;
}

interface CashPoint {
  id: number;
  name: string;
  location: string;
  custodian: string;
  glCode: string;
  limit: number;
  active: boolean;
}

interface ControlAccount {
  id: number;
  name: string;
  type: string;
  glCode: string;
  linkedModule: string;
  description: string;
  active: boolean;
}

const INIT_BANKS: BankAccount[] = [
  { id: 1, accountName: "School Main Account",    bankName: "Stanbic Bank",  accountNumber: "9030012345678", branch: "Kampala Main",    currency: "UGX", glCode: "1100", active: true  },
  { id: 2, accountName: "Fees Collection Account",bankName: "Centenary Bank",accountNumber: "2140098765432", branch: "Entebbe Road",     currency: "UGX", glCode: "1101", active: true  },
  { id: 3, accountName: "Capitation Grant Account",bankName: "DFCU Bank",    accountNumber: "0100055566677", branch: "Jinja Road",      currency: "UGX", glCode: "1102", active: false },
];

const INIT_CASH: CashPoint[] = [
  { id: 1, name: "Bursar's Office Petty Cash", location: "Admin Block",    custodian: "Sarah Nakato",   glCode: "1000", limit: 500000,  active: true  },
  { id: 2, name: "Tuck Shop Float",            location: "Canteen",        custodian: "James Ochieng", glCode: "1001", limit: 200000,  active: true  },
  { id: 3, name: "Sports Department Cash",     location: "Sports Office",  custodian: "Paul Ssali",    glCode: "1002", limit: 150000,  active: false },
];

const INIT_CONTROL: ControlAccount[] = [
  { id: 1, name: "Student Fees Receivable",   type: "Receivable",  glCode: "1200", linkedModule: "Fee Management",    description: "Tracks outstanding student fee balances",   active: true  },
  { id: 2, name: "Supplier Payables Control", type: "Payable",     glCode: "2000", linkedModule: "Procurement",       description: "Aggregates all amounts owed to suppliers",  active: true  },
  { id: 3, name: "Payroll Clearing",          type: "Clearing",    glCode: "2100", linkedModule: "Payroll",           description: "Salary processing transit account",         active: true  },
  { id: 4, name: "Tax Withholding Control",   type: "Tax",         glCode: "2150", linkedModule: "Payroll",           description: "PAYE and LST withheld from staff",          active: false },
];

export default function AccountsMaster() {
  const { toast } = useToast();

  const [banks, setBanks] = useState<BankAccount[]>(INIT_BANKS);
  const [cashPoints, setCashPoints] = useState<CashPoint[]>(INIT_CASH);
  const [controlAccounts, setControlAccounts] = useState<ControlAccount[]>(INIT_CONTROL);

  const [bankDialog, setBankDialog] = useState(false);
  const [cashDialog, setCashDialog] = useState(false);
  const [controlDialog, setControlDialog] = useState(false);

  const [editBankId, setEditBankId] = useState<number | null>(null);
  const [editCashId, setEditCashId] = useState<number | null>(null);
  const [editControlId, setEditControlId] = useState<number | null>(null);

  const [bankForm, setBankForm] = useState({ accountName: "", bankName: "", accountNumber: "", branch: "", currency: "UGX", glCode: "" });
  const [cashForm, setCashForm] = useState({ name: "", location: "", custodian: "", glCode: "", limit: "" });
  const [controlForm, setControlForm] = useState({ name: "", type: "", glCode: "", linkedModule: "", description: "" });

  const bankPag = usePagination(banks);
  const cashPag = usePagination(cashPoints);
  const ctrlPag = usePagination(controlAccounts);

  // Bank actions
  function openNewBank() { setEditBankId(null); setBankForm({ accountName: "", bankName: "", accountNumber: "", branch: "", currency: "UGX", glCode: "" }); setBankDialog(true); }
  function openEditBank(b: BankAccount) { setEditBankId(b.id); setBankForm({ accountName: b.accountName, bankName: b.bankName, accountNumber: b.accountNumber, branch: b.branch, currency: b.currency, glCode: b.glCode }); setBankDialog(true); }
  function saveBank() {
    if (!bankForm.accountName || !bankForm.bankName || !bankForm.accountNumber) {
      toast({ title: "Required fields missing", variant: "destructive" }); return;
    }
    if (editBankId) {
      setBanks((p) => p.map((b) => b.id === editBankId ? { ...b, ...bankForm } : b));
      toast({ title: "Bank Account Updated" });
    } else {
      setBanks((p) => [...p, { id: Date.now(), ...bankForm, active: true }]);
      toast({ title: "Bank Account Added" });
    }
    setBankDialog(false);
  }

  // Cash actions
  function openNewCash() { setEditCashId(null); setCashForm({ name: "", location: "", custodian: "", glCode: "", limit: "" }); setCashDialog(true); }
  function openEditCash(c: CashPoint) { setEditCashId(c.id); setCashForm({ name: c.name, location: c.location, custodian: c.custodian, glCode: c.glCode, limit: String(c.limit) }); setCashDialog(true); }
  function saveCash() {
    if (!cashForm.name || !cashForm.custodian) {
      toast({ title: "Required fields missing", variant: "destructive" }); return;
    }
    const entry = { ...cashForm, limit: Number(cashForm.limit) || 0 };
    if (editCashId) {
      setCashPoints((p) => p.map((c) => c.id === editCashId ? { ...c, ...entry } : c));
      toast({ title: "Cash Point Updated" });
    } else {
      setCashPoints((p) => [...p, { id: Date.now(), ...entry, active: true }]);
      toast({ title: "Cash Point Added" });
    }
    setCashDialog(false);
  }

  // Control actions
  function openNewControl() { setEditControlId(null); setControlForm({ name: "", type: "", glCode: "", linkedModule: "", description: "" }); setControlDialog(true); }
  function openEditControl(c: ControlAccount) { setEditControlId(c.id); setControlForm({ name: c.name, type: c.type, glCode: c.glCode, linkedModule: c.linkedModule, description: c.description }); setControlDialog(true); }
  function saveControl() {
    if (!controlForm.name || !controlForm.glCode) {
      toast({ title: "Required fields missing", variant: "destructive" }); return;
    }
    if (editControlId) {
      setControlAccounts((p) => p.map((c) => c.id === editControlId ? { ...c, ...controlForm } : c));
      toast({ title: "Control Account Updated" });
    } else {
      setControlAccounts((p) => [...p, { id: Date.now(), ...controlForm, active: true }]);
      toast({ title: "Control Account Added" });
    }
    setControlDialog(false);
  }

  const statusBadge = (active: boolean) => (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"}`}>
      {active ? "Active" : "Inactive"}
    </span>
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Accounts Master</h1>
        <p className="text-sm text-gray-500 mt-1">Configure bank accounts, cash points, and control accounts</p>
      </div>

      <Tabs defaultValue="bank">
        <TabsList className="mb-4">
          <TabsTrigger value="bank" className="gap-2"><Building2 className="h-4 w-4" />Bank Accounts</TabsTrigger>
          <TabsTrigger value="cash" className="gap-2"><Wallet className="h-4 w-4" />Cash Points</TabsTrigger>
          <TabsTrigger value="control" className="gap-2"><Settings className="h-4 w-4" />Control Accounts</TabsTrigger>
        </TabsList>

        {/* BANK ACCOUNTS */}
        <TabsContent value="bank">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3 flex-wrap gap-2">
              <div className="flex items-center gap-4">
                <CardTitle className="text-base">Bank Accounts</CardTitle>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground whitespace-nowrap">Show</span>
                  <Select value={String(bankPag.pageSize)} onValueChange={(v) => bankPag.setPageSize(Number(v))}>
                    <SelectTrigger className="w-20 h-8"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-sm text-muted-foreground">entries</span>
                </div>
              </div>
              <Button size="sm" onClick={openNewBank} className="gap-2"><Plus className="h-4 w-4" />New Bank Account</Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account Name</TableHead>
                    <TableHead>Bank</TableHead>
                    <TableHead>Account Number</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead>Currency</TableHead>
                    <TableHead>GL Code</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bankPag.paginatedItems.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell className="font-medium">{b.accountName}</TableCell>
                      <TableCell>{b.bankName}</TableCell>
                      <TableCell className="font-mono text-sm">{b.accountNumber}</TableCell>
                      <TableCell className="text-sm text-gray-600">{b.branch}</TableCell>
                      <TableCell><Badge variant="outline">{b.currency}</Badge></TableCell>
                      <TableCell className="font-mono text-sm">{b.glCode}</TableCell>
                      <TableCell>{statusBadge(b.active)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => openEditBank(b)}><Pencil className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <TablePagination page={bankPag.page} totalPages={bankPag.totalPages} from={bankPag.from} to={bankPag.to} total={bankPag.total} onPageChange={bankPag.setPage} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* CASH POINTS */}
        <TabsContent value="cash">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3 flex-wrap gap-2">
              <div className="flex items-center gap-4">
                <CardTitle className="text-base">Cash Points</CardTitle>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground whitespace-nowrap">Show</span>
                  <Select value={String(cashPag.pageSize)} onValueChange={(v) => cashPag.setPageSize(Number(v))}>
                    <SelectTrigger className="w-20 h-8"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-sm text-muted-foreground">entries</span>
                </div>
              </div>
              <Button size="sm" onClick={openNewCash} className="gap-2"><Plus className="h-4 w-4" />New Cash Point</Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cash Point Name</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Custodian</TableHead>
                    <TableHead>GL Code</TableHead>
                    <TableHead>Float Limit (UGX)</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cashPag.paginatedItems.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell>{c.location}</TableCell>
                      <TableCell>{c.custodian}</TableCell>
                      <TableCell className="font-mono text-sm">{c.glCode}</TableCell>
                      <TableCell>{c.limit.toLocaleString()}</TableCell>
                      <TableCell>{statusBadge(c.active)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => openEditCash(c)}><Pencil className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <TablePagination page={cashPag.page} totalPages={cashPag.totalPages} from={cashPag.from} to={cashPag.to} total={cashPag.total} onPageChange={cashPag.setPage} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* CONTROL ACCOUNTS */}
        <TabsContent value="control">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3 flex-wrap gap-2">
              <div className="flex items-center gap-4">
                <CardTitle className="text-base">Control Accounts</CardTitle>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground whitespace-nowrap">Show</span>
                  <Select value={String(ctrlPag.pageSize)} onValueChange={(v) => ctrlPag.setPageSize(Number(v))}>
                    <SelectTrigger className="w-20 h-8"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-sm text-muted-foreground">entries</span>
                </div>
              </div>
              <Button size="sm" onClick={openNewControl} className="gap-2"><Plus className="h-4 w-4" />New Control Account</Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>GL Code</TableHead>
                    <TableHead>Linked Module</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ctrlPag.paginatedItems.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell><Badge variant="outline">{c.type}</Badge></TableCell>
                      <TableCell className="font-mono text-sm">{c.glCode}</TableCell>
                      <TableCell className="text-sm">{c.linkedModule}</TableCell>
                      <TableCell className="text-sm text-gray-500 max-w-xs truncate">{c.description}</TableCell>
                      <TableCell>{statusBadge(c.active)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => openEditControl(c)}><Pencil className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <TablePagination page={ctrlPag.page} totalPages={ctrlPag.totalPages} from={ctrlPag.from} to={ctrlPag.to} total={ctrlPag.total} onPageChange={ctrlPag.setPage} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Bank Dialog */}
      <Dialog open={bankDialog} onOpenChange={setBankDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editBankId ? "Edit Bank Account" : "New Bank Account"}</DialogTitle></DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="space-y-1"><Label>Account Name *</Label><Input value={bankForm.accountName} onChange={(e) => setBankForm({ ...bankForm, accountName: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Bank Name *</Label><Input value={bankForm.bankName} onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })} /></div>
              <div className="space-y-1"><Label>Branch</Label><Input value={bankForm.branch} onChange={(e) => setBankForm({ ...bankForm, branch: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Account Number *</Label><Input value={bankForm.accountNumber} onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })} /></div>
              <div className="space-y-1"><Label>GL Code</Label><Input value={bankForm.glCode} onChange={(e) => setBankForm({ ...bankForm, glCode: e.target.value })} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBankDialog(false)}>Cancel</Button>
            <Button onClick={saveBank}>{editBankId ? "Save Changes" : "Add Account"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cash Dialog */}
      <Dialog open={cashDialog} onOpenChange={setCashDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editCashId ? "Edit Cash Point" : "New Cash Point"}</DialogTitle></DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="space-y-1"><Label>Cash Point Name *</Label><Input value={cashForm.name} onChange={(e) => setCashForm({ ...cashForm, name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Location</Label><Input value={cashForm.location} onChange={(e) => setCashForm({ ...cashForm, location: e.target.value })} /></div>
              <div className="space-y-1"><Label>Custodian *</Label><Input value={cashForm.custodian} onChange={(e) => setCashForm({ ...cashForm, custodian: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>GL Code</Label><Input value={cashForm.glCode} onChange={(e) => setCashForm({ ...cashForm, glCode: e.target.value })} /></div>
              <div className="space-y-1"><Label>Float Limit (UGX)</Label><Input type="number" value={cashForm.limit} onChange={(e) => setCashForm({ ...cashForm, limit: e.target.value })} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCashDialog(false)}>Cancel</Button>
            <Button onClick={saveCash}>{editCashId ? "Save Changes" : "Add Cash Point"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Control Dialog */}
      <Dialog open={controlDialog} onOpenChange={setControlDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editControlId ? "Edit Control Account" : "New Control Account"}</DialogTitle></DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="space-y-1"><Label>Account Name *</Label><Input value={controlForm.name} onChange={(e) => setControlForm({ ...controlForm, name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Type</Label><Input value={controlForm.type} onChange={(e) => setControlForm({ ...controlForm, type: e.target.value })} placeholder="e.g. Receivable" /></div>
              <div className="space-y-1"><Label>GL Code *</Label><Input value={controlForm.glCode} onChange={(e) => setControlForm({ ...controlForm, glCode: e.target.value })} /></div>
            </div>
            <div className="space-y-1"><Label>Linked Module</Label><Input value={controlForm.linkedModule} onChange={(e) => setControlForm({ ...controlForm, linkedModule: e.target.value })} /></div>
            <div className="space-y-1"><Label>Description</Label><Input value={controlForm.description} onChange={(e) => setControlForm({ ...controlForm, description: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setControlDialog(false)}>Cancel</Button>
            <Button onClick={saveControl}>{editControlId ? "Save Changes" : "Add Account"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
