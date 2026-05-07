import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash, RefreshCw } from "lucide-react";
import s2Queue, { S2QueueEntry } from "@/lib/s2Queue";
import { inventoryService } from "@/services/inventory.service";
import { toast } from "sonner";

export default function S2RetryQueue() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<S2QueueEntry[]>([]);

  useEffect(() => {
    setItems(s2Queue.listQueue());
  }, [open]);

  const reload = () => setItems(s2Queue.listQueue());

  async function retry(entry: S2QueueEntry) {
    try {
      let res: any;
      switch (entry.type) {
        case 'RECEIPT': res = await inventoryService.createS2Receipt(entry.payload); break;
        case 'ISSUE': res = await inventoryService.createS2Issue(entry.payload); break;
        case 'TRANSFER': res = await inventoryService.createS2Transfer(entry.payload); break;
        case 'RETURN': res = await inventoryService.createS2Return(entry.payload); break;
        case 'DAMAGE': res = await inventoryService.createS2Damage(entry.payload); break;
        case 'REVERSE': res = await inventoryService.reverseS2Transaction(entry.payload.id, entry.payload); break;
        default: throw new Error('Unknown S2 op');
      }
      s2Queue.removeFromQueue(entry.id);
      toast.success(`S2 ${entry.type} posted`);
      reload();
      return res;
    } catch (e: any) {
      const msg = e?.message || String(e);
      s2Queue.updateEntry(entry.id, { attempts: entry.attempts + 1, lastError: msg });
      toast.error(`Retry failed: ${msg}`);
      reload();
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">S2 Queue ({items.length})</Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Failed S2 Posts</DialogTitle>
        </DialogHeader>
        <div className="mt-2">
          {items.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground">No failed S2 posts</div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Payload</TableHead>
                    <TableHead>Attempts</TableHead>
                    <TableHead>Last Error</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map(it => (
                    <TableRow key={it.id}>
                      <TableCell className="font-mono">{it.type}</TableCell>
                      <TableCell style={{maxWidth: 420}}>
                        <pre className="text-xs truncate">{JSON.stringify(it.payload)}</pre>
                      </TableCell>
                      <TableCell>{it.attempts}</TableCell>
                      <TableCell className="text-xs text-destructive">{it.lastError}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => retry(it)}>
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => { s2Queue.removeFromQueue(it.id); reload(); }}>
                          <Trash className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={() => { setOpen(false); }}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
