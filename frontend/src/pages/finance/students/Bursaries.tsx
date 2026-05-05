import { useState, useEffect } from "react";
import { Plus, Search, Pencil, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/ui/table-pagination";
import { studentsService } from "@/services/students.service";
import type { Student } from "@/contexts/StudentContext";

const fmt = (n: number) => new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(n);

interface Bursary {
  id: string;
  bursary_ref: string;
  bursary_type: string;
  sponsor: string;
  student: string;
  student_name: string;
  admission_no: string;
  acknowledged_amount: number;
  paid_to_student: number;
  received_as_fees: number;
  status: string;
  narration: string;
  date: string;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-gray-100 text-gray-700",
  acknowledged: "bg-blue-100 text-blue-800",
  paid_to_student: "bg-yellow-100 text-yellow-800",
  received_as_fees: "bg-green-100 text-green-800",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  acknowledged: "Acknowledged",
  paid_to_student: "Paid to Student",
  received_as_fees: "Received as Fees",
};

const EMPTY_FORM = {
  bursary_ref: "",
  bursary_type: "external",
  sponsor: "",
  student: "",
  acknowledged_amount: "0",
  paid_to_student: "0",
  received_as_fees: "0",
  status: "pending",
  narration: "",
  date: new Date().toISOString().split("T")[0],
};

export default function Bursaries() {
  const { toast } = useToast();
  const [bursaries, setBursaries] = useState<Bursary[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<typeof EMPTY_FORM>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [bData, sData] = await Promise.all([
        studentsService.getBursaries(),
        studentsService.getStudents(),
      ]);
      setBursaries(bData);
      setStudents(sData);
    } catch (e: any) {
      toast({ title: "Failed to load bursaries", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const filtered = bursaries.filter(b =>
    (typeFilter === "ALL" || b.bursary_type === typeFilter) &&
    (statusFilter === "ALL" || b.status === statusFilter) &&
    (b.sponsor.toLowerCase().includes(search.toLowerCase()) ||
     b.student_name.toLowerCase().includes(search.toLowerCase()) ||
     b.admission_no.toLowerCase().includes(search.toLowerCase()) ||
     (b.bursary_ref || "").toLowerCase().includes(search.toLowerCase()))
  );

  const { page, setPage, paginatedItems, totalPages, from, to, total: totalRows } = usePagination(filtered);

  const totalAcknowledged = bursaries.reduce((s, b) => s + Number(b.acknowledged_amount), 0);
  const totalPaidToStudent = bursaries.reduce((s, b) => s + Number(b.paid_to_student), 0);
  const totalReceivedAsFees = bursaries.reduce((s, b) => s + Number(b.received_as_fees), 0);

  const openNew = () => {
    setForm(EMPTY_FORM);
    setEditId(null);
    setDialogOpen(true);
  };

  const openEdit = (b: Bursary) => {
    setForm({
      bursary_ref: b.bursary_ref,
      bursary_type: b.bursary_type,
      sponsor: b.sponsor,
      student: b.student,
      acknowledged_amount: String(b.acknowledged_amount),
      paid_to_student: String(b.paid_to_student),
      received_as_fees: String(b.received_as_fees),
      status: b.status,
      narration: b.narration,
      date: b.date,
    });
    setEditId(b.id);
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.sponsor || !form.student || !form.date) {
      toast({ title: "Required fields missing", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        bursary_ref: form.bursary_ref,
        bursary_type: form.bursary_type,
        sponsor: form.sponsor,
        student: form.student,
        acknowledged_amount: form.acknowledged_amount,
        paid_to_student: form.paid_to_student,
        received_as_fees: form.received_as_fees,
        status: form.status,
        narration: form.narration,
        date: form.date,
      };
      if (editId) {
        await studentsService.updateBursary(editId, payload);
        toast({ title: "Bursary updated" });
      } else {
        await studentsService.createBursary(payload);
        toast({ title: "Bursary created" });
      }
      setDialogOpen(false);
      loadData();
    } catch (e: any) {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    try {
      await studentsService.deleteBursary(id);
      toast({ title: "Bursary deleted" });
      loadData();
    } catch (e: any) {
      toast({ title: "Delete failed", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bursaries</h1>
          <p className="text-muted-foreground">Track school-based and external bursaries for students</p>
        </div>
        <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" />New Bursary</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card><CardContent className="pt-4"><div className="text-2xl font-bold">{bursaries.length}</div><div className="text-sm text-muted-foreground">Total Bursaries</div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="text-2xl font-bold text-blue-700">{fmt(totalAcknowledged)}</div><div className="text-sm text-muted-foreground">Acknowledged</div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="text-2xl font-bold text-yellow-600">{fmt(totalPaidToStudent)}</div><div className="text-sm text-muted-foreground">Paid to Students</div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="text-2xl font-bold text-green-700">{fmt(totalReceivedAsFees)}</div><div className="text-sm text-muted-foreground">Received as Fees</div></CardContent></Card>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search sponsor, student, ref..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-44"><SelectValue placeholder="All Types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Types</SelectItem>
            <SelectItem value="school_based">School-Based</SelectItem>
            <SelectItem value="external">External</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="acknowledged">Acknowledged</SelectItem>
            <SelectItem value="paid_to_student">Paid to Student</SelectItem>
            <SelectItem value="received_as_fees">Received as Fees</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ref</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Sponsor</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead className="text-right">Acknowledged</TableHead>
                  <TableHead className="text-right">Paid to Student</TableHead>
                  <TableHead className="text-right">Received as Fees</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedItems.length === 0 ? (
                  <TableRow><TableCell colSpan={10} className="py-8 text-center text-muted-foreground">No bursaries found.</TableCell></TableRow>
                ) : null}
                {paginatedItems.map(b => (
                  <TableRow key={b.id}>
                    <TableCell className="font-mono text-sm">{b.bursary_ref || b.id}</TableCell>
                    <TableCell className="text-sm">{b.date}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{b.bursary_type === "school_based" ? "School" : "External"}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{b.sponsor}</TableCell>
                    <TableCell>
                      <div>{b.student_name}</div>
                      <div className="text-xs text-muted-foreground">{b.admission_no}</div>
                    </TableCell>
                    <TableCell className="text-right">{fmt(Number(b.acknowledged_amount))}</TableCell>
                    <TableCell className="text-right">{fmt(Number(b.paid_to_student))}</TableCell>
                    <TableCell className="text-right text-green-700">{fmt(Number(b.received_as_fees))}</TableCell>
                    <TableCell>
                      <Badge className={STATUS_COLORS[b.status] || "bg-gray-100 text-gray-700"}>
                        {STATUS_LABELS[b.status] || b.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(b)}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500" onClick={() => remove(b.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <TablePagination page={page} totalPages={totalPages} from={from} to={to} total={totalRows} onPageChange={setPage} />
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editId ? "Edit Bursary" : "New Bursary"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-1">
              <Label>Bursary Ref</Label>
              <Input value={form.bursary_ref} onChange={e => setForm(p => ({ ...p, bursary_ref: e.target.value }))} placeholder="e.g. BUR-2025-001" />
            </div>
            <div className="space-y-1">
              <Label>Date *</Label>
              <Input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Type</Label>
              <Select value={form.bursary_type} onValueChange={v => setForm(p => ({ ...p, bursary_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="school_based">School-Based</SelectItem>
                  <SelectItem value="external">External</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Sponsor *</Label>
              <Input value={form.sponsor} onChange={e => setForm(p => ({ ...p, sponsor: e.target.value }))} placeholder="e.g. CDF, NGO name" />
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Student *</Label>
              <Select value={form.student} onValueChange={v => setForm(p => ({ ...p, student: v }))}>
                <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                <SelectContent>
                  {students.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.admissionNo} — {s.firstName} {s.lastName} ({s.class})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Acknowledged Amount</Label>
              <Input type="number" value={form.acknowledged_amount} onChange={e => setForm(p => ({ ...p, acknowledged_amount: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Paid to Student</Label>
              <Input type="number" value={form.paid_to_student} onChange={e => setForm(p => ({ ...p, paid_to_student: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Received as Fees</Label>
              <Input type="number" value={form.received_as_fees} onChange={e => setForm(p => ({ ...p, received_as_fees: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="acknowledged">Acknowledged</SelectItem>
                  <SelectItem value="paid_to_student">Paid to Student</SelectItem>
                  <SelectItem value="received_as_fees">Received as Fees</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Narration</Label>
              <Textarea value={form.narration} onChange={e => setForm(p => ({ ...p, narration: e.target.value }))} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editId ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
