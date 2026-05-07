import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import capQueue from '@/lib/capQueue';
import { assetsService } from '@/services/assets.service';
import { toast } from 'sonner';
import { Check, PlusCircle } from 'lucide-react';

type Suggestion = {
  item_id: string;
  description?: string;
  qty?: number;
  unit_cost?: number | string;
  classification?: any;
};

export default function CapitalizationSummaryDialog({
  open,
  onClose,
  items,
}: {
  open: boolean;
  onClose: () => void;
  items: Suggestion[];
}) {
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Capitalization Suggestions</DialogTitle>
        </DialogHeader>

        <div className="mt-2">
          {items.length === 0 ? (
            <div>No suggestions</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Unit Cost</TableHead>
                  <TableHead>Suggested Action</TableHead>
                  <TableHead>Rule</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((s) => (
                  <TableRow key={s.item_id}>
                    <TableCell>
                      <div className="flex items-center justify-between gap-4">
                        <div>{s.description || s.item_id}</div>
                      </div>
                    </TableCell>
                    <TableCell>{s.qty ?? ''}</TableCell>
                    <TableCell>{s.unit_cost ?? ''}</TableCell>
                    <TableCell>{s.classification?.suggested_action ?? s.classification?.suggestedAction ?? ''}</TableCell>
                    <TableCell>{s.classification?.rule_label ?? s.classification?.ruleLabel ?? s.classification?.applied_rule ?? ''}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <Button size="sm" variant="ghost" onClick={async () => {
                          try {
                            const payload = { description: s.description || s.item_id, cost: s.unit_cost || 0, quantity: s.qty || 1 };
                            await assetsService.createAsset(payload);
                            toast.success('Asset created');
                          } catch (e: any) {
                            toast.error(String(e?.message || e));
                          }
                        }}>
                          <PlusCircle className="h-4 w-4 mr-1" /> Create
                        </Button>
                        <Button size="sm" onClick={() => {
                          capQueue.enqueue({ itemId: s.item_id, payload: { description: s.description || s.item_id, cost: s.unit_cost || 0, quantity: s.qty || 1 } });
                          toast.success('Queued for capitalization');
                        }}>
                          <Check className="h-4 w-4 mr-1" /> Queue
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <DialogFooter className="mt-4 flex items-center gap-2">
          <Button variant="secondary" onClick={onClose}>Close</Button>
          <Link to="/assets/bulk-capitalize">
            <Button>Open Bulk Capitalization</Button>
          </Link>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
