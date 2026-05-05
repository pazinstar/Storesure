import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
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
import { Search, Plus, ArrowLeftRight, Eye, ArrowRight, Truck, MapPin, CheckCircle } from "lucide-react";



export default function AssetMovement() {
  const { data: movements = [] } = useQuery({
    queryKey: ['assetMovements'],
    queryFn: () => api.getAssetMovements()
  });

  const { data: locations = [] } = useQuery({
    queryKey: ['assetLocations'],
    queryFn: () => api.getAssetLocations()
  });

  const { data: movementTypes = [] } = useQuery({
    queryKey: ['assetMovementTypes'],
    queryFn: () => api.getAssetMovementTypes()
  });

  const [searchTerm, setSearchTerm] = useState("");

  const filteredMovements = movements.filter((mov) =>
    mov.asset.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mov.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Completed":
        return <Badge className="bg-success/10 text-success border-success/20">Completed</Badge>;
      case "In Transit":
        return <Badge className="bg-info/10 text-info border-info/20">In Transit</Badge>;
      case "Pending Return":
        return <Badge className="bg-warning/10 text-warning border-warning/20">Pending Return</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "Transfer":
        return <Badge variant="outline"><ArrowLeftRight className="h-3 w-3 mr-1" />Transfer</Badge>;
      case "Issue":
        return <Badge variant="outline" className="text-success"><ArrowRight className="h-3 w-3 mr-1" />Issue</Badge>;
      case "Return":
        return <Badge variant="outline" className="text-info"><ArrowRight className="h-3 w-3 mr-1 rotate-180" />Return</Badge>;
      case "Temporary":
        return <Badge variant="outline" className="text-warning"><Truck className="h-3 w-3 mr-1" />Temporary</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  return (
    <div className="flex-1 space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Asset Movement</h1>
          <p className="text-muted-foreground mt-1">
            Track and record asset transfers between locations
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Movement
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Record Asset Movement</DialogTitle>
              <DialogDescription>
                Transfer or move an asset to a new location
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="mov-number">Movement No.</Label>
                  <Input id="mov-number" value="MOV-2024-006" readOnly className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mov-date">Date</Label>
                  <Input id="mov-date" type="date" defaultValue="2024-01-16" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="asset">Asset</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select asset" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ast-001">AST-001 - Dell Laptop Latitude 5520</SelectItem>
                    <SelectItem value="ast-002">AST-002 - HP LaserJet Pro</SelectItem>
                    <SelectItem value="ast-003">AST-003 - Science Lab Microscope</SelectItem>
                    <SelectItem value="ast-006">AST-006 - Projector Epson EB-X51</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="mov-type">Movement Type</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {movementTypes.map((type) => (
                      <SelectItem key={type} value={type.toLowerCase()}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="from-loc">From Location</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select source location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((loc) => (
                      <SelectItem key={loc} value={loc.toLowerCase().replace(/\s+/g, "-")}>
                        {loc}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-center">
                <ArrowRight className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="to-loc">To Location</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select destination" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((loc) => (
                      <SelectItem key={loc} value={loc.toLowerCase().replace(/\s+/g, "-")}>
                        {loc}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reason">Reason/Notes</Label>
                <Textarea id="reason" placeholder="Enter reason for movement..." />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline">Cancel</Button>
              <Button>Record Movement</Button>
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
                <p className="text-2xl font-bold text-foreground">45</p>
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
                <p className="text-2xl font-bold text-foreground">38</p>
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
                <p className="text-2xl font-bold text-foreground">4</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning/10">
                <MapPin className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Return</p>
                <p className="text-2xl font-bold text-foreground">3</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Movement History</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search movements..."
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
                  <TableHead>Movement No.</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Asset</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead></TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMovements.map((mov) => (
                  <TableRow key={mov.id}>
                    <TableCell className="font-mono text-sm font-medium">{mov.id}</TableCell>
                    <TableCell>{mov.date}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{mov.asset}</p>
                        <p className="text-xs text-muted-foreground">{mov.assetId}</p>
                      </div>
                    </TableCell>
                    <TableCell>{getTypeBadge(mov.type)}</TableCell>
                    <TableCell>{mov.from}</TableCell>
                    <TableCell>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </TableCell>
                    <TableCell>{mov.to}</TableCell>
                    <TableCell>{getStatusBadge(mov.status)}</TableCell>
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
