import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usersService } from "@/services/users.service";
import { adminService } from "@/services/admin.service";
import type { CommitteeMemberPayload } from "@/services/admin.service";
import { useAudit } from "@/contexts/AuditContext";
import { useReadOnlyGuard } from "@/hooks/useReadOnlyGuard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

const MAX_MEMBERS = 3;

export function InspectionCommitteeSetup() {
  const queryClient = useQueryClient();
  const { addLog } = useAudit();
  const { isReadOnly } = useReadOnlyGuard();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");

  // ── Data ───────────────────────────────────────────────────────────────────
  const { data: committee, isLoading } = useQuery({
    queryKey: ["admin-committee"],
    queryFn: () => adminService.getCommittee(),
  });

  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => usersService.getUsers(),
  });

  // ── Mutations ──────────────────────────────────────────────────────────────
  const { mutate: persist, isPending: isSaving } = useMutation({
    mutationFn: (payload: { members: CommitteeMemberPayload[]; is_active: boolean }) =>
      adminService.saveCommittee(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-committee"] }),
    onError: (err: Error) => toast.error(err.message || "Failed to update committee"),
  });

  // ── Derived state ──────────────────────────────────────────────────────────
  const currentMembers: CommitteeMemberPayload[] = committee?.members ?? [];
  const isActive = committee?.is_active ?? false;
  const canAdd = currentMembers.length < MAX_MEMBERS;

  const activeUsers = users.filter((u) => u.status === "active" || u.status === "Active");
  const assignedIds = new Set(currentMembers.map((m) => m.user_id));
  const availableUsers = activeUsers.filter((u) => !assignedIds.has(u.id));

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleAdd = () => {
    if (!selectedUserId || !canAdd) return;
    const user = users.find((u) => u.id === selectedUserId);
    if (!user) return;

    const designation = String(user.role ?? "")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());

    const updated = [
      ...currentMembers,
      { user_id: user.id, user_name: user.name, designation, order: currentMembers.length + 1 },
    ];
    persist({ members: updated, is_active: isActive });
    addLog("Committee Member Added", "Admin", `Added ${user.name}`);
    toast.success(`${user.name} added to committee`);
    setSelectedUserId("");
    setDialogOpen(false);
  };

  const handleRemove = (userId: string) => {
    const removed = currentMembers.find((m) => m.user_id === userId);
    const updated = currentMembers
      .filter((m) => m.user_id !== userId)
      .map((m, i) => ({ ...m, order: i + 1 }));
    persist({ members: updated, is_active: isActive });
    if (removed) {
      addLog("Committee Member Removed", "Admin", `Removed ${removed.user_name}`);
      toast.success(`${removed.user_name} removed`);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Inspection &amp; Acceptance Committee</CardTitle>
          <CardDescription>
            Configure the committee that reviews and approves all deliveries
            {currentMembers.length > 0 && (
              <span className="ml-2">
                — {currentMembers.length} of {MAX_MEMBERS} members
              </span>
            )}
          </CardDescription>
        </div>

        <Button
          disabled={isReadOnly || !canAdd || isLoading}
          onClick={() => { setSelectedUserId(""); setDialogOpen(true); }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Member
        </Button>
      </CardHeader>

      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Member</TableHead>
                <TableHead>Designation</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                    Loading…
                  </TableCell>
                </TableRow>
              ) : currentMembers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    No members assigned. Click <strong>Add Member</strong> to get started.
                  </TableCell>
                </TableRow>
              ) : (
                currentMembers.map((member) => (
                  <TableRow key={member.user_id}>
                    <TableCell className="font-medium text-muted-foreground">
                      {member.order}
                    </TableCell>
                    <TableCell className="font-medium">{member.user_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{member.designation}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            disabled={isSaving || isReadOnly}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove Member</AlertDialogTitle>
                            <AlertDialogDescription>
                              Remove <strong>{member.user_name}</strong> from the committee?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleRemove(member.user_id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Remove
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* Add Member Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setSelectedUserId(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Committee Member</DialogTitle>
            <DialogDescription>
              Select a user to add to the inspection committee.
              {MAX_MEMBERS - currentMembers.length} slot{MAX_MEMBERS - currentMembers.length !== 1 ? "s" : ""} remaining.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a user…" />
              </SelectTrigger>
              <SelectContent>
                {availableUsers.length === 0 ? (
                  <div className="px-3 py-4 text-sm text-muted-foreground text-center">
                    No available users
                  </div>
                ) : (
                  availableUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      <span className="font-medium">{user.name}</span>
                      <span className="ml-2 text-xs text-muted-foreground capitalize">
                        · {String(user.role ?? "").replace(/_/g, " ")}
                      </span>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={!selectedUserId || isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
