import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Trash, RefreshCw } from 'lucide-react';
import capQueue, { CapQueueEntry } from '@/lib/capQueue';
import { assetsService } from '@/services/assets.service';
import { toast } from 'sonner';

type Props = { inline?: boolean };

function summarizePayload(p: any) {
  if (!p) return '';
  if (p.name) return String(p.name);
  if (p.description) return String(p.description);
  if (p.itemCode) return String(p.itemCode);
  return Object.keys(p).slice(0,3).map(k => `${k}:${String(p[k])}`).join(' | ');
}

export default function CapitalizationQueue({ inline }: Props) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<CapQueueEntry[]>([]);

  useEffect(() => { setItems(capQueue.listQueue()); }, [open]);

  useEffect(() => { if (inline) setItems(capQueue.listQueue()); }, [inline]);

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

  const content = (
    <div>
      {items.length === 0 ? (
        <div className="p-4 text-sm text-muted-foreground">No items queued for capitalization</div>
      ) : (
        <div className="grid gap-3">
          {items.map(it => (
            <div key={it.id} className="flex items-start justify-between gap-4 p-4 bg-card rounded-md border">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold">{it.itemId}</span>
                  <span className="text-xs text-muted-foreground">• {new Date(it.createdAt).toLocaleString()}</span>
                </div>
                <div className="mt-2 text-sm text-muted-foreground">{summarizePayload(it.payload)}</div>
                {it.lastError && <div className="mt-2 text-xs text-destructive">{it.lastError}</div>}
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="text-sm text-muted-foreground">Attempts: {it.attempts}</div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => process(it)}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => { capQueue.removeFromQueue(it.id); reload(); }}>
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (inline) {
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Capitalization Queue</h2>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={reload}><RefreshCw className="h-4 w-4" /></Button>
          </div>
        </div>
        {content}
      </div>
    );
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
          {content}
        </div>
        <DialogFooter>
          <Button onClick={() => setOpen(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
