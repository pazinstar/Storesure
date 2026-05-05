import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useAuditLog } from "@/hooks/useAuditLog";
import { useReadOnlyGuard } from "@/hooks/useReadOnlyGuard";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
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
import {
  Search, Plus, Package, Users, BookOpen, PenLine,
  CheckCircle, Clock, Send, FileCheck, Lock
} from "lucide-react";

type DistributionStatus = "Draft" | "Submitted" | "Approved" | "Distributed" | "Locked";

interface DistributionRecord {
  id: string;
  date: string;
  class: string;
  stream: string;
  itemType: string;
  itemName: string;
  quantityIssued: number;
  studentsCount: number;
  issuedBy: string;
  receivedBy: string;
  status: DistributionStatus;
}



const classes = ["Grade 10", "Grade 11", "Grade 12", "Form 3", "Form 4"];
const streams = ["East", "West", "North", "South"];
const itemTypes = ["Exercise Books", "Writing Materials"];
const exerciseBooks = [
  "Counter Book 96 Pages",
  "Counter Book 200 Pages",
  "Graph Book A4",
  "Science Practical Book",
  "Drawing Book A3",
  "Ruled Exercise Book 48 Pages",
  "Ruled Exercise Book 96 Pages",
];
const writingMaterials = [
  "Ball Pens (Blue)",
  "Ball Pens (Black)",
  "Pencils HB",
  "Pencils 2B",
  "Mathematical Set",
  "Ruler 30cm",
  "Eraser",
  "Sharpener",
];

export default function StudentDistribution() {
  const { data: recentDistributions = [] } = useQuery({
    queryKey: ['recentDistributions'],
    queryFn: () => api.getRecentDistributions()
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedStream, setSelectedStream] = useState("");
  const [selectedItemType, setSelectedItemType] = useState("");
  const [selectedItem, setSelectedItem] = useState("");
  const [quantity, setQuantity] = useState("");
  const [receivingTeacher, setReceivingTeacher] = useState("");
  const [signatureConfirmed, setSignatureConfirmed] = useState(false);
  const { isReadOnly, blockAction } = useReadOnlyGuard();
  const { user } = useAuth();

  const availableItems = selectedItemType === "Exercise Books" ? exerciseBooks :
    selectedItemType === "Writing Materials" ? writingMaterials : [];

  const resetForm = () => {
    setDialogOpen(false);
    setSelectedClass("");
    setSelectedStream("");
    setSelectedItemType("");
    setSelectedItem("");
    setQuantity("");
    setReceivingTeacher("");
    setSignatureConfirmed(false);
  };

  const handleSaveDraft = () => {
    if (!selectedClass || !selectedItem) {
      toast.error("Please select class and item");
      return;
    }
    toast.success("Draft Saved", { description: "Distribution record saved as draft" });
    resetForm();
  };

  const handleSubmit = () => {
    if (!selectedClass || !selectedItem || !quantity) {
      toast.error("Please fill all required fields");
      return;
    }
    if (!signatureConfirmed) {
      toast.error("Please confirm your signature");
      return;
    }
    toast.success("Distribution Submitted", {
      description: `${quantity} ${selectedItem} issued to ${selectedClass} ${selectedStream}`
    });
    resetForm();
  };

  const getStatusBadge = (status: DistributionStatus) => {
    const statusConfig: Record<DistributionStatus, { icon: React.ReactNode; className: string }> = {
      "Draft": { icon: <PenLine className="h-3 w-3" />, className: "bg-muted text-muted-foreground" },
      "Submitted": { icon: <Send className="h-3 w-3" />, className: "bg-info/10 text-info border-info/20" },
      "Approved": { icon: <CheckCircle className="h-3 w-3" />, className: "bg-success/10 text-success border-success/20" },
      "Distributed": { icon: <FileCheck className="h-3 w-3" />, className: "bg-primary/10 text-primary border-primary/20" },
      "Locked": { icon: <Lock className="h-3 w-3" />, className: "bg-destructive/10 text-destructive border-destructive/20" },
    };

    const config = statusConfig[status];
    return (
      <Badge className={`${config.className} gap-1`}>
        {config.icon}
        {status}
      </Badge>
    );
  };

  const filteredRecords = recentDistributions.filter(record =>
    record.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.class.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.itemName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Student Distribution</h1>
          <p className="text-muted-foreground mt-1">
            Issue exercise books and writing materials to classes
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="gap-2"
              disabled={isReadOnly}
              onClick={() => { if (blockAction("create distribution records")) return; }}
            >
              <Plus className="h-4 w-4" />
              New Distribution
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Issue Materials to Class</DialogTitle>
              <DialogDescription>
                Record distribution of exercise books or writing materials to a class
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {/* Distribution Header */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Distribution ID</Label>
                  <Input value="DIST-2024-006" readOnly className="bg-muted font-mono" />
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input type="date" defaultValue={new Date().toISOString().split('T')[0]} />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <div className="flex items-center h-10 px-3 rounded-md border bg-muted">
                    <Badge variant="secondary" className="gap-1">
                      <PenLine className="h-3 w-3" />
                      Draft
                    </Badge>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Class Selection */}
              <div className="space-y-4">
                <h4 className="font-medium text-sm text-muted-foreground">RECIPIENT CLASS</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Class</Label>
                    <Select value={selectedClass} onValueChange={setSelectedClass}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select class" />
                      </SelectTrigger>
                      <SelectContent>
                        {classes.map(c => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Stream</Label>
                    <Select value={selectedStream} onValueChange={setSelectedStream}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select stream" />
                      </SelectTrigger>
                      <SelectContent>
                        {streams.map(s => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Receiving Teacher / Class Teacher</Label>
                  <Input
                    placeholder="Enter teacher name"
                    value={receivingTeacher}
                    onChange={(e) => setReceivingTeacher(e.target.value)}
                  />
                </div>
              </div>

              <Separator />

              {/* Item Selection */}
              <div className="space-y-4">
                <h4 className="font-medium text-sm text-muted-foreground">ITEM DETAILS</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Item Type</Label>
                    <Select value={selectedItemType} onValueChange={(v) => { setSelectedItemType(v); setSelectedItem(""); }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {itemTypes.map(t => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Item</Label>
                    <Select value={selectedItem} onValueChange={setSelectedItem} disabled={!selectedItemType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select item" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableItems.map(item => (
                          <SelectItem key={item} value={item}>{item}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Quantity to Issue</Label>
                    <Input
                      type="number"
                      min="1"
                      placeholder="Enter quantity"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Students in Class</Label>
                    <Input value="45" readOnly className="bg-muted" />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Authorization */}
              <div className="space-y-4">
                <h4 className="font-medium text-sm text-muted-foreground">AUTHORIZATION</h4>
                <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="signature"
                      checked={signatureConfirmed}
                      onCheckedChange={(checked) => setSignatureConfirmed(checked as boolean)}
                    />
                    <div className="space-y-1">
                      <Label htmlFor="signature" className="cursor-pointer">
                        Storekeeper Signature
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        I, <span className="font-medium">{user?.name || "Storekeeper"}</span>, confirm that I have
                        issued the above materials for distribution to the specified class.
                      </p>
                    </div>
                  </div>
                  {signatureConfirmed && (
                    <div className="flex items-center gap-2 text-xs text-success pl-7">
                      <CheckCircle className="h-3 w-3" />
                      Signed by {user?.name} at {new Date().toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={resetForm}>Cancel</Button>
              <Button variant="secondary" onClick={handleSaveDraft}>
                <PenLine className="h-4 w-4 mr-2" />
                Save as Draft
              </Button>
              <Button onClick={handleSubmit} disabled={!signatureConfirmed}>
                <Send className="h-4 w-4 mr-2" />
                Submit Distribution
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">This Term</p>
                <p className="text-2xl font-bold text-foreground">156</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10">
                <BookOpen className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Exercise Books</p>
                <p className="text-2xl font-bold text-foreground">2,450</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-info/10">
                <PenLine className="h-5 w-5 text-info" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Writing Materials</p>
                <p className="text-2xl font-bold text-foreground">1,890</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning/10">
                <Users className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Students Served</p>
                <p className="text-2xl font-bold text-foreground">720</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Distributions Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Recent Distributions</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search distributions..."
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
                  <TableHead>ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead>Issued By</TableHead>
                  <TableHead>Received By</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-mono text-sm">{record.id}</TableCell>
                    <TableCell>{record.date}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{record.class}</div>
                        <div className="text-xs text-muted-foreground">{record.stream}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div>{record.itemName}</div>
                        <div className="text-xs text-muted-foreground">{record.itemType}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">{record.quantityIssued}</TableCell>
                    <TableCell>{record.issuedBy}</TableCell>
                    <TableCell>
                      {record.receivedBy || <span className="text-muted-foreground italic">Pending</span>}
                    </TableCell>
                    <TableCell>{getStatusBadge(record.status)}</TableCell>
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