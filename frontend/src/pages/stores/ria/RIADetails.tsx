import { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useRIA } from "@/contexts/RIAContext";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableHead, TableRow, TableCell, TableBody } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Check, X, ArrowUpFromLine, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function RIADetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { rias, approve, reject } = useRIA();
  const { user } = useAuth();
  const ria = useMemo(() => rias.find((r) => r.id === id), [rias, id]);

  if (!ria) {
    return <p className="text-muted-foreground">RIA not found</p>;
  }

  const total = ria.items.reduce((s, it) => s + it.approvedQty, 0);
  const used = ria.items.reduce((s, it) => s + it.usedQty, 0);
  const pct = total > 0 ? Math.round((used / total) * 100) : 0;

  const canApprove = (user?.role === "bursar" || user?.role === "headteacher") && ria.status === "pending";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="px-2" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{ria.number}</h1>
            <p className="text-muted-foreground mt-1">
              {ria.department} • {ria.startDate} to {ria.endDate}
            </p>
          </div>
        </div>
        {canApprove ? (
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={() => { approve(ria.id, user!.role as any); toast.success("RIA approved"); }}>
              <Check className="h-4 w-4" /> Approve
            </Button>
            <Button variant="destructive" className="gap-2" onClick={() => { reject(ria.id); toast.success("RIA rejected"); }}>
              <X className="h-4 w-4" /> Reject
            </Button>
          </div>
        ) : (
          <Button variant="outline" className="gap-2" disabled>
            <ArrowUpFromLine className="h-4 w-4" /> Issue Stock from RIA
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Status</span>
            {ria.status === "active" ? (
              <Badge className="bg-success/10 text-success border-success/20">Active</Badge>
            ) : ria.status === "pending" ? (
              <Badge className="bg-warning/10 text-warning border-warning/20">Pending</Badge>
            ) : ria.status === "expired" ? (
              <Badge variant="destructive">Expired</Badge>
            ) : (
              <Badge variant="secondary" className="capitalize">{ria.status}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Usage</span>
            <span className={pct >= 90 ? "text-destructive" : pct >= 80 ? "text-warning" : "text-muted-foreground"}>{pct}%</span>
          </div>
          <Progress value={pct} />
          <p className="text-xs text-muted-foreground">Responsible Officer: {ria.responsibleOfficer}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Approved Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Approved</TableHead>
                  <TableHead>Used</TableHead>
                  <TableHead>Remaining</TableHead>
                  <TableHead>Usage %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ria.items.map((it) => {
                  const remaining = it.approvedQty - it.usedQty;
                  const p = it.approvedQty > 0 ? Math.round((it.usedQty / it.approvedQty) * 100) : 0;
                  const color = p >= 90 ? "text-destructive" : p >= 80 ? "text-warning" : "text-success";
                  return (
                    <TableRow key={it.itemCode}>
                      <TableCell className="font-medium">{it.itemName}</TableCell>
                      <TableCell>{it.approvedQty} {it.unit}</TableCell>
                      <TableCell>{it.usedQty} {it.unit}</TableCell>
                      <TableCell>{remaining} {it.unit}</TableCell>
                      <TableCell className={color}>{p}%</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
