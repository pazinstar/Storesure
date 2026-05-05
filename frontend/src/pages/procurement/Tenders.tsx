import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useReadOnlyGuard } from "@/hooks/useReadOnlyGuard";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Filter, FileText, Eye, Calendar, Users, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { Progress } from "@/components/ui/progress";



const getStatusBadge = (status: string) => {
  switch (status) {
    case "open":
      return <Badge className="bg-primary flex items-center gap-1"><Clock className="h-3 w-3" />Open</Badge>;
    case "evaluation":
      return <Badge variant="secondary" className="flex items-center gap-1"><Users className="h-3 w-3" />Evaluation</Badge>;
    case "awarded":
      return <Badge className="bg-chart-2 flex items-center gap-1"><CheckCircle className="h-3 w-3" />Awarded</Badge>;
    case "closed":
      return <Badge variant="outline" className="flex items-center gap-1">Closed</Badge>;
    case "pending_review":
      return <Badge variant="secondary" className="flex items-center gap-1"><Clock className="h-3 w-3" />Pending Review</Badge>;
    case "approved":
      return <Badge className="bg-primary flex items-center gap-1"><CheckCircle className="h-3 w-3" />Approved</Badge>;
    case "rejected":
      return <Badge variant="destructive">Rejected</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const Tenders = () => {
  const { data: tenders = [] } = useQuery({
    queryKey: ['tenders'],
    queryFn: () => api.getTenders()
  });

  const { data: quotations = [] } = useQuery({
    queryKey: ['quotations'],
    queryFn: () => api.getQuotations()
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { isReadOnly, blockAction } = useReadOnlyGuard();
  const queryClient = useQueryClient();

  const [newTender, setNewTender] = useState({
    title: "",
    method: "",
    category: "",
    description: "",
    budget: "",
    closingDate: "",
  });

  const createTenderMutation = useMutation({
    mutationFn: (data: Parameters<typeof api.createTender>[0]) => api.createTender(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenders'] });
      setIsDialogOpen(false);
      setNewTender({ title: "", method: "", category: "", description: "", budget: "", closingDate: "" });
    }
  });

  const handlePublishTender = () => {
    createTenderMutation.mutate({
      title: newTender.title,
      method: newTender.method,
      category: newTender.category,
      budget: `KES ${parseInt(newTender.budget || "0").toLocaleString()}`,
      closingDate: newTender.closingDate,
      // Default to "None" if description is blank
      description: newTender.description || "None",
    } as any); // Ignoring strict typing for description since mock backend mostly needs struct fields
  };

  const activeTendersContent = tenders.filter(t => t.status === "open").length;
  const evaluationTendersContent = tenders.filter(t => t.status === "evaluation").length;
  const pendingQuotationsContent = quotations.filter(q => q.status === "pending_review").length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Quotations & Tenders</h1>
          <p className="text-muted-foreground">PPADA 2015 compliant procurement methods</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              disabled={isReadOnly}
              onClick={() => { if (blockAction("create tenders")) return; }}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Tender
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Tender</DialogTitle>
              <DialogDescription>
                Initiate a new tender process as per PPADA 2015 Section 91-103
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Tender Title</Label>
                <Input id="title" placeholder="Enter tender title" value={newTender.title} onChange={e => setNewTender({ ...newTender, title: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="method">Procurement Method</Label>
                  <Select value={newTender.method} onValueChange={v => setNewTender({ ...newTender, method: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open Tender (Section 91)</SelectItem>
                      <SelectItem value="restricted">Restricted Tender (Section 92)</SelectItem>
                      <SelectItem value="direct">Direct Procurement (Section 103)</SelectItem>
                      <SelectItem value="rfq">Request for Quotation (Section 100)</SelectItem>
                      <SelectItem value="rfp">Request for Proposal (Section 99)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={newTender.category} onValueChange={v => setNewTender({ ...newTender, category: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="goods">Goods</SelectItem>
                      <SelectItem value="works">Works</SelectItem>
                      <SelectItem value="services">Services</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description & Specifications</Label>
                <Textarea id="description" placeholder="Detailed description and technical specifications..." rows={3} value={newTender.description} onChange={e => setNewTender({ ...newTender, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="budget">Estimated Budget (KES)</Label>
                  <Input id="budget" type="number" placeholder="0.00" value={newTender.budget} onChange={e => setNewTender({ ...newTender, budget: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="closing">Closing Date</Label>
                  <Input id="closing" type="date" value={newTender.closingDate} onChange={e => setNewTender({ ...newTender, closingDate: e.target.value })} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Save Draft</Button>
              <Button onClick={handlePublishTender} disabled={createTenderMutation.isPending}>
                <FileText className="h-4 w-4 mr-2" />
                {createTenderMutation.isPending ? "Publishing..." : "Publish Tender"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Tenders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{activeTendersContent}</div>
            <p className="text-xs text-muted-foreground">Currently open</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Under Evaluation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary">{evaluationTendersContent}</div>
            <p className="text-xs text-muted-foreground">Bids being reviewed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Quotations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{pendingQuotationsContent}</div>
            <p className="text-xs text-muted-foreground">Awaiting response</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KES 12.9M</div>
            <p className="text-xs text-muted-foreground">Active procurement</p>
          </CardContent>
        </Card>
      </div>
      <Tabs defaultValue="tenders" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tenders">Tenders</TabsTrigger>
          <TabsTrigger value="quotations">Quotations (RFQ)</TabsTrigger>
        </TabsList>

        <TabsContent value="tenders">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Active Tenders</CardTitle>
                  <CardDescription>Manage ongoing tender processes</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search tenders..."
                      className="pl-8 w-[250px]"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tender ID</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Closing Date</TableHead>
                    <TableHead>Budget</TableHead>
                    <TableHead>Bids</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tenders.map((tender) => (
                    <TableRow key={tender.id}>
                      <TableCell className="font-medium">{tender.id}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{tender.title}</p>
                          {tender.daysLeft > 0 && tender.daysLeft <= 7 && (
                            <p className="text-xs text-destructive flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              {tender.daysLeft} days left
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{tender.method}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{tender.category}</Badge>
                      </TableCell>
                      <TableCell className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {tender.closingDate}
                      </TableCell>
                      <TableCell>{tender.budget}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          {tender.bids}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(tender.status)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quotations">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Request for Quotations</CardTitle>
                  <CardDescription>Manage RFQ submissions per PPADA Section 100</CardDescription>
                </div>
                <Button variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  New RFQ
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>RFQ ID</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Valid Until</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quotations.map((quote) => (
                    <TableRow key={quote.id}>
                      <TableCell className="font-medium">{quote.id}</TableCell>
                      <TableCell>{quote.title}</TableCell>
                      <TableCell>{quote.vendor}</TableCell>
                      <TableCell>{quote.submittedDate}</TableCell>
                      <TableCell className="font-semibold">{quote.value}</TableCell>
                      <TableCell>{quote.validUntil}</TableCell>
                      <TableCell>{getStatusBadge(quote.status)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div >
  );
};

export default Tenders;
