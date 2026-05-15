import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Trash, RefreshCw } from "lucide-react";
import s2Queue, { S2QueueEntry } from "@/lib/s2Queue";
import { inventoryService } from "@/services/inventory.service";
import { toast } from "sonner";

type Props = { inline?: boolean };

function summarizePayload(p: any) {
  if (!p) return '';
  if (p.reference) return String(p.reference);
  if (p.id) return String(p.id);
  if (p.items && Array.isArray(p.items)) return `${p.items.length} item(s)`;
  if (p.itemId) return String(p.itemId);
  return Object.keys(p).slice(0,3).map(k => `${k}:${String(p[k])}`).join(' | ');
}

export default function S2RetryQueue({ inline }: Props) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<S2QueueEntry[]>([]);

  useEffect(() => {
    setItems(s2Queue.listQueue());
  }, [open]);

  // when inline, refresh on mount
  useEffect(() => {
    if (inline) setItems(s2Queue.listQueue());
  }, [inline]);

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

  const content = (
    <div>
      {items.length === 0 ? (
        <div className="p-4 text-sm text-muted-foreground">No failed S2 posts</div>
      ) : (
        <div className="grid gap-3">
          {items.map(it => (
            <div key={it.id} className="flex items-start justify-between gap-4 p-4 bg-card rounded-md border">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold">{it.type}</span>
                  <span className="text-xs text-muted-foreground">• {new Date(it.createdAt).toLocaleString()}</span>
                </div>
                <div className="mt-2 text-sm text-muted-foreground">{summarizePayload(it.payload)}</div>
                {it.lastError && <div className="mt-2 text-xs text-destructive">{it.lastError}</div>}
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="text-sm text-muted-foreground">Attempts: {it.attempts}</div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => retry(it)}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => { s2Queue.removeFromQueue(it.id); reload(); }}>
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
          <h2 className="text-lg font-semibold">Failed S2 Posts</h2>
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
        <Button variant="ghost" size="sm">S2 Queue ({items.length})</Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Failed S2 Posts</DialogTitle>
        </DialogHeader>
        <div className="mt-2">
          {content}
        </div>
        <DialogFooter>
          <Button onClick={() => { setOpen(false); }}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
