import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Shield, Plus, SlidersHorizontal, Lock, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
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
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { adminService, Role, RoleModulePermission } from "@/services/admin.service";
import { useAuth } from "@/contexts/AuthContext";

// ─── Permissions Dialog ───────────────────────────────────────────────────────

interface SchoolModuleConfig {
  id: string;
  enabled: boolean;
  links: { href: string; enabled: boolean }[];
}

interface PermissionsDialogProps {
  role: Role;
  open: boolean;
  onClose: () => void;
  onSave: (roleId: string, permissions: RoleModulePermission[]) => void;
  isSaving: boolean;
  /** School-level module config — acts as ceiling for role permissions */
  schoolModules: SchoolModuleConfig[];
}

function PermissionsDialog({ role, open, onClose, onSave, isSaving, schoolModules }: PermissionsDialogProps) {
  // Build a lookup: moduleId → school config
  const schoolModMap = Object.fromEntries(schoolModules.map((m) => [m.id, m]));
  const [permissions, setPermissions] = useState<RoleModulePermission[]>(
    role.permissions.map((p) => ({
      ...p,
      links: p.links.map((l) => ({ ...l })),
    }))
  );
  const [openModules, setOpenModules] = useState<Set<string>>(new Set());

  const isModuleLockedBySchool = (moduleId: string): boolean => {
    if (!schoolModules.length) return false; // super-admin: no school, no ceiling
    const schoolMod = schoolModMap[moduleId];
    return schoolMod !== undefined && !schoolMod.enabled;
  };

  const isLinkLockedBySchool = (moduleId: string, href: string): boolean => {
    if (!schoolModules.length) return false;
    const schoolMod = schoolModMap[moduleId];
    if (!schoolMod) return false;
    const schoolLink = schoolMod.links.find((l) => l.href === href);
    return schoolLink !== undefined && !schoolLink.enabled;
  };

  const toggleModule = (moduleId: string, enabled: boolean) => {
    if (isModuleLockedBySchool(moduleId)) return; // school ceiling — cannot enable
    setPermissions((prev) =>
      prev.map((p) =>
        p.id === moduleId
          ? { ...p, enabled, links: p.links.map((l) => ({ ...l, enabled: enabled ? l.enabled : false })) }
          : p
      )
    );
    if (enabled) setOpenModules((s) => new Set([...s, moduleId]));
  };

  const toggleCrud = (moduleId: string, key: keyof RoleModulePermission["crud"], value: boolean) => {
    setPermissions((prev) =>
      prev.map((p) =>
        p.id === moduleId ? { ...p, crud: { ...p.crud, [key]: value } } : p
      )
    );
  };

  const toggleLink = (moduleId: string, href: string, enabled: boolean) => {
    setPermissions((prev) =>
      prev.map((p) =>
        p.id === moduleId
          ? { ...p, links: p.links.map((l) => (l.href === href ? { ...l, enabled } : l)) }
          : p
      )
    );
  };

  const allowAllLinks = (moduleId: string) => {
    setPermissions((prev) =>
      prev.map((p) =>
        p.id === moduleId
          ? { ...p, links: p.links.map((l) => ({ ...l, enabled: isLinkLockedBySchool(moduleId, l.href) ? false : true })) }
          : p
      )
    );
  };

  const toggleModuleOpen = (moduleId: string) => {
    setOpenModules((s) => {
      const next = new Set(s);
      if (next.has(moduleId)) next.delete(moduleId);
      else next.add(moduleId);
      return next;
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col gap-0 p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <DialogTitle>Permissions — {role.name}</DialogTitle>
          </div>
          <DialogDescription>
            Toggle module access and set CRUD + link-level permissions.
            {schoolModules.length > 0 && (
              <span className="block mt-1 text-xs text-amber-600 dark:text-amber-400">
                Modules and links disabled at school level are locked and cannot be assigned.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-1">
          {permissions.map((mod) => {
            const isOpen = openModules.has(mod.id);
            const lockedBySchool = isModuleLockedBySchool(mod.id);
            return (
              <div key={mod.id} className={cn("border rounded-lg overflow-hidden", lockedBySchool && "opacity-60")}>
                {/* Module header row */}
                <div
                  className="flex items-center gap-3 px-4 py-3 bg-background cursor-pointer select-none"
                  onClick={() => !lockedBySchool && toggleModuleOpen(mod.id)}
                >
                  <Switch
                    checked={mod.enabled && !lockedBySchool}
                    onCheckedChange={(v) => toggleModule(mod.id, v)}
                    onClick={(e) => e.stopPropagation()}
                    disabled={lockedBySchool}
                  />
                  <span className="flex-1 font-medium text-sm">{mod.name}</span>
                  {lockedBySchool ? (
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Lock className="h-3 w-3" />
                      Disabled by school
                    </span>
                  ) : (
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 text-muted-foreground transition-transform duration-200",
                        isOpen && "rotate-180"
                      )}
                    />
                  )}
                </div>

                {/* Expanded content */}
                {isOpen && !lockedBySchool && (
                  <div className="border-t bg-muted/30 px-4 py-3 space-y-3">
                    {/* CRUD */}
                    <div className="flex items-center gap-4 flex-wrap">
                      {(["view", "create", "edit", "delete"] as const).map((key) => (
                        <label key={key} className="flex items-center gap-1.5 text-sm cursor-pointer">
                          <Checkbox
                            checked={mod.crud[key]}
                            onCheckedChange={(v) => toggleCrud(mod.id, key, Boolean(v))}
                            disabled={!mod.enabled}
                          />
                          <span className="capitalize">{key}</span>
                        </label>
                      ))}
                    </div>

                    {/* Links */}
                    {mod.links.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                            Accessible Links
                          </span>
                          <button
                            type="button"
                            onClick={() => allowAllLinks(mod.id)}
                            disabled={!mod.enabled}
                            className="text-[11px] text-primary underline-offset-2 hover:underline disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            Allow all
                          </button>
                        </div>
                        {mod.links.map((link) => {
                          const linkLocked = isLinkLockedBySchool(mod.id, link.href);
                          return (
                            <label key={link.href} className={cn("flex items-center gap-2 text-sm", linkLocked ? "cursor-not-allowed" : "cursor-pointer")}>
                              <Checkbox
                                checked={link.enabled && !linkLocked}
                                onCheckedChange={(v) => !linkLocked && toggleLink(mod.id, link.href, Boolean(v))}
                                disabled={!mod.enabled || linkLocked}
                              />
                              <span className={cn((!mod.enabled || linkLocked) && "text-muted-foreground")}>
                                {link.name}
                              </span>
                              {linkLocked && (
                                <Lock className="h-3 w-3 text-muted-foreground shrink-0" />
                              )}
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <DialogFooter className="px-6 py-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={() => onSave(role.id, permissions)} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Permissions
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function RoleManagement() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [permissionsOpen, setPermissionsOpen] = useState(false);

  // School-level module ceiling (empty for super-admin with no school)
  const schoolModules: SchoolModuleConfig[] = (user?.allowedModules ?? []).map((m: any) => ({
    id: m.id,
    enabled: m.enabled ?? true,
    links: (m.links ?? []).map((l: any) => ({ href: l.href, enabled: l.enabled ?? true })),
  }));

  // ── Fetch roles ─────────────────────────────────────────────────────────────
  const { data: roles = [], isLoading, isError } = useQuery({
    queryKey: ["admin-roles"],
    queryFn: () => adminService.getRoles(),
  });

  // ── Save permissions mutation ────────────────────────────────────────────────
  const { mutate: savePermissions, isPending: isSaving } = useMutation({
    mutationFn: ({ id, permissions }: { id: string; permissions: RoleModulePermission[] }) =>
      adminService.updateRole(id, { permissions }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-roles"] });
      toast.success("Permissions saved successfully");
      setPermissionsOpen(false);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to save permissions");
    },
  });

  const openPermissions = (role: Role) => {
    setSelectedRole(role);
    setPermissionsOpen(true);
  };

  const handleSave = (roleId: string, permissions: RoleModulePermission[]) => {
    savePermissions({ id: roleId, permissions });
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Role Management</h1>
          <p className="text-muted-foreground mt-1">
            Define roles and configure their module permissions
          </p>
        </div>
        <Button className="gap-2" disabled>
          <Plus className="h-4 w-4" />
          New Role
        </Button>
      </div>

      {/* Roles table */}
      <div className="rounded-lg border bg-card">
        <div className="px-6 py-4 border-b">
          <h2 className="font-semibold">Roles</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {roles.length} roles — system roles cannot be deleted
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading roles…
          </div>
        ) : isError ? (
          <div className="flex items-center justify-center py-16 text-destructive text-sm">
            Failed to load roles. Check your connection and try again.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Modules</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell className="font-semibold">{role.name}</TableCell>
                  <TableCell>
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                      {role.id}
                    </code>
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-xs truncate">
                    {role.description}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {role.module_count ?? role.permissions.filter((p) => p.enabled).length} modules
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {role.type === "system" ? (
                      <Badge variant="outline" className="gap-1 text-blue-600 border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-400">
                        <Lock className="h-3 w-3" />
                        System
                      </Badge>
                    ) : (
                      <Badge variant="outline">Custom</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openPermissions(role)}
                      title="Configure permissions"
                    >
                      <SlidersHorizontal className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Permissions dialog */}
      {selectedRole && (
        <PermissionsDialog
          role={selectedRole}
          open={permissionsOpen}
          onClose={() => setPermissionsOpen(false)}
          onSave={handleSave}
          isSaving={isSaving}
          schoolModules={schoolModules}
        />
      )}
    </div>
  );
}
