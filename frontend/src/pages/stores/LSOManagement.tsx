import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useS12 } from "@/contexts/S12Context";
import { toast } from "sonner";

export default function LSOManagement() {
  const queryClient = useQueryClient();
  const { data: lsos = [], isLoading } = useQuery({ queryKey: ['lsos'], queryFn: () => api.getLSOs() });
  const { requisitions = [] } = useS12();

  const createMutation = useMutation({
    mutationFn: (data: any) => api.createLSO(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lsos'] }),
    onError: (err: any) => toast.error('Failed to create LSO: ' + (err?.message || ''))
  });

  const approvedRequisitions = (requisitions || []).filter(r => r.status === 'Approved' || r.status === 'Partially Issued');

  const [open, setOpen] = useState(false);
  const [supplierName, setSupplierName] = useState('');
  const [description, setDescription] = useState('');
  const [totalValue, setTotalValue] = useState<number | ''>('');
  const [requisitionRef, setRequisitionRef] = useState('');

  const handleCreate = () => {
    if (!supplierName || !description) {
      toast.error('Please fill supplier and description');
      return;
    }
    const payload = {
      supplierName,
      description,
      totalValue: Number(totalValue) || 0,
      requisition: requisitionRef || undefined,
      status: 'Draft'
    };
    createMutation.mutate(payload);
    setOpen(false);
    setSupplierName(''); setDescription(''); setTotalValue(''); setRequisitionRef('');
    toast.success('LSO created');
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">Local Service Orders (LSO)</h1>
          <p className="text-muted-foreground">Create and manage local service orders</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setOpen(true)}>Create LSO</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create LSO</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3 py-4">
              <Input placeholder="Supplier Name" value={supplierName} onChange={(e) => setSupplierName(e.target.value)} />
              <Textarea placeholder="Service description" value={description} onChange={(e) => setDescription(e.target.value)} />
              <Input type="number" placeholder="Total Value" value={totalValue as any} onChange={(e) => setTotalValue(Number(e.target.value) || '')} />
              <Select value={requisitionRef} onValueChange={(v) => setRequisitionRef(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Link to requisition (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">-- None --</SelectItem>
                  {approvedRequisitions.map(r => (
                    <SelectItem key={r.id} value={r.id}>{r.s12Number} - {r.requestingDepartment}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate}>Create LSO</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {lsos.map((l: any) => (
          <Card key={l.id}>
            <CardHeader>
              <CardTitle>{l.lsoNumber || l.id}</CardTitle>
              <CardDescription>{l.supplierName}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm mb-2">{l.description}</div>
              <div className="text-sm font-semibold">KES {Number(l.totalValue || 0).toLocaleString()}</div>
              <div className="mt-2 text-xs text-muted-foreground">Status: {l.status}</div>
              <div className="mt-2">
                <Button variant="ghost" size="sm" onClick={() => window.open(`/api/v1/storekeeper/stores/lsos/${l.id}/print-html/`, '_blank')}>Print HTML</Button>
                <Button variant="ghost" size="sm" onClick={() => window.open(`/api/v1/storekeeper/stores/lsos/${l.id}/print-pdf/`, '_blank')}>Download PDF</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
