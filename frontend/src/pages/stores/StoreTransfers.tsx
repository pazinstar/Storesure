import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Search, Plus, ArrowLeftRight, Eye, ArrowRight, CheckCircle, Clock, Truck } from "lucide-react";
import { api } from "@/services/api";
import { StoreTransfer } from "@/mock/data";

export default function StoreTransfers() {
  const queryClient = useQueryClient();
  const { data: initialTransfers = [] } = useQuery({
    queryKey: ['store-transfers'],
    queryFn: () => api.getStoreTransfers()
  });
  const { data: settings } = useQuery({
    queryKey: ['inventory-settings'],
    queryFn: () => api.getInventorySettings()
  });

  const stores = settings?.storeLocations || [];

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    fromStore: '',
    toStore: '',
    reason: ''
  });

  const createMutation = useMutation({
    mutationFn: (newTransfer: Partial<StoreTransfer>) => api.createStoreTransfer(newTransfer),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-transfers'] });
      toast.success("Store transfer created successfully");
      setIsDialogOpen(false);
      setFormData({ fromStore: '', toStore: '', reason: '' });
    },
    onError: () => {
      toast.error("Failed to create store transfer.");
    }
  });

  const handleSubmit = () => {
    if (!formData.fromStore || !formData.toStore || !formData.reason) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (formData.fromStore === formData.toStore) {
      toast.error("Source and destination stores cannot be the same");
      return;
    }

    createMutation.mutate({
      date: new Date().toISOString().split('T')[0],
      from: formData.fromStore,
      to: formData.toStore,
      items: 0,
      status: 'Pending Approval'
    });
  };

  const [transfers, setTransfers] = useState<StoreTransfer[]>([]);
  useEffect(() => {
    if (initialTransfers.length > 0 && transfers.length === 0) {
      setTransfers(initialTransfers);
    }
  }, [initialTransfers]);

  const [searchTerm, setSearchTerm] = useState("");

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Completed":
        return (
          <Badge className="bg-success/10 text-success border-success/20">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case "In Transit":
        return (
          <Badge className="bg-info/10 text-info border-info/20">
            <Truck className="h-3 w-3 mr-1" />
            In Transit
          </Badge>
        );
      case "Pending Approval":
        return (
          <Badge className="bg-warning/10 text-warning border-warning/20">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="flex-1 space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Store Transfers</h1>
          <p className="text-muted-foreground mt-1">
            Transfer stock between stores, locations, and departments. Department-to-department moves of <span className="font-mono">Permanent / Expendable</span> items post to the S2 ledger; <span className="font-mono">Consumable</span> transfers post to S1.
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              New Transfer
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Store Transfer</DialogTitle>
              <DialogDescription>
                Transfer stock items between stores
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="trf-number">Transfer No.</Label>
                  <Input id="trf-number" placeholder="Auto-generated" readOnly className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="trf-date">Date</Label>
                  <Input id="trf-date" type="date" defaultValue={new Date().toISOString().split('T')[0]} readOnly className="bg-muted" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="from-store">From Store</Label>
                <Select value={formData.fromStore} onValueChange={(val) => setFormData(p => ({ ...p, fromStore: val }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select source store" />
                  </SelectTrigger>
                  <SelectContent>
                    {stores.map((store) => (
                      <SelectItem key={store} value={store}>
                        {store}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-center">
                <ArrowRight className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="to-store">To Store</Label>
                <Select value={formData.toStore} onValueChange={(val) => setFormData(p => ({ ...p, toStore: val }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select destination store" />
                  </SelectTrigger>
                  <SelectContent>
                    {stores.map((store) => (
                      <SelectItem key={store} value={store}>
                        {store}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reason">Reason for Transfer</Label>
                <Textarea id="reason" placeholder="Enter reason for the transfer..." value={formData.reason} onChange={(e) => setFormData(p => ({ ...p, reason: e.target.value }))} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Create transfer"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <ArrowLeftRight className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold text-foreground">18</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10">
                <CheckCircle className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-foreground">15</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-info/10">
                <Truck className="h-5 w-5 text-info" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">In Transit</p>
                <p className="text-2xl font-bold text-foreground">2</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning/10">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-foreground">1</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Transfer History</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search transfers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-full sm:w-[250px]"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transfer No.</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead></TableHead>
                  <TableHead>To</TableHead>
                  <TableHead className="text-right">Items</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transfers.map((transfer) => (
                  <TableRow key={transfer.id}>
                    <TableCell className="font-mono text-sm font-medium">{transfer.id}</TableCell>
                    <TableCell>{transfer.date}</TableCell>
                    <TableCell className="font-medium">{transfer.from}</TableCell>
                    <TableCell>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </TableCell>
                    <TableCell className="font-medium">{transfer.to}</TableCell>
                    <TableCell className="text-right">{transfer.items}</TableCell>
                    <TableCell>{getStatusBadge(transfer.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
