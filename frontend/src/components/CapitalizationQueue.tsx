import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash, RefreshCw } from 'lucide-react';
import capQueue, { CapQueueEntry } from '@/lib/capQueue';
import { assetsService } from '@/services/assets.service';
import { toast } from 'sonner';

export default function CapitalizationQueue() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<CapQueueEntry[]>([]);

  useEffect(() => { setItems(capQueue.listQueue()); }, [open]);

  const reload = () => setItems(capQueue.listQueue());

  async function process(entry: CapQueueEntry) {
    try {
      const payload = entry.payload;
      const res = await assetsService.createAsset(payload);
      capQueue.removeFromQueue(entry.id);
      toast.success('Asset created');
      reload();
      return res;
    } catch (e: any) {
      const msg = e?.message || String(e);
      capQueue.updateEntry(entry.id, { attempts: entry.attempts + 1, lastError: msg });
      toast.error(`Create failed: ${msg}`);
      reload();
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">Capitalization ({items.length})</Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Capitalization Queue</DialogTitle>
        </DialogHeader>
        <div className="mt-2">
          {items.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground">No items queued for capitalization</div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Payload</TableHead>
                    <TableHead>Attempts</TableHead>
                    <TableHead>Last Error</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map(it => (
                    <TableRow key={it.id}>
                      <TableCell className="font-mono">{it.itemId}</TableCell>
                      <TableCell style={{maxWidth:420}}>
                        <pre className="text-xs truncate">{JSON.stringify(it.payload)}</pre>
                      </TableCell>
                      <TableCell>{it.attempts}</TableCell>
                      <TableCell className="text-xs text-destructive">{it.lastError}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => process(it)}>
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => { capQueue.removeFromQueue(it.id); reload(); }}>
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
          <Button onClick={() => setOpen(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
