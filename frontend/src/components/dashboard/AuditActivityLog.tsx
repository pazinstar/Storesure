import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useAudit } from "@/contexts/AuditContext";
import { 
  FileText, 
  Package, 
  Building2, 
  BookOpen, 
  User, 
  Shield,
  Clock,
  Trash2,
  Search,
  Filter,
  Download,
  CalendarIcon,
  X
} from "lucide-react";
import { format, isWithinInterval, parse, startOfDay, endOfDay } from "date-fns";

const MODULES = ["All", "Stores", "Procurement", "Assets", "Library", "System", "Reports"];

const getModuleIcon = (module: string) => {
  switch (module) {
    case "Stores": return <Package className="h-4 w-4" />;
    case "Procurement": return <FileText className="h-4 w-4" />;
    case "Assets": return <Building2 className="h-4 w-4" />;
    case "Library": return <BookOpen className="h-4 w-4" />;
    case "System": return <Shield className="h-4 w-4" />;
    case "Reports": return <FileText className="h-4 w-4" />;
    default: return <User className="h-4 w-4" />;
  }
};

const getModuleColor = (module: string) => {
  switch (module) {
    case "Stores": return "bg-primary/10 text-primary";
    case "Procurement": return "bg-secondary/10 text-secondary";
    case "Assets": return "bg-accent/10 text-accent";
    case "Library": return "bg-warning/10 text-warning";
    case "System": return "bg-muted text-muted-foreground";
    case "Reports": return "bg-success/10 text-success";
    default: return "bg-muted text-muted-foreground";
  }
};

export function AuditActivityLog() {
  const { logs, clearLogs } = useAudit();
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedModule, setSelectedModule] = useState("All");
  const [selectedUser, setSelectedUser] = useState("All");
  const [selectedAction, setSelectedAction] = useState("All");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);

  // Get unique users and actions for filter dropdowns
  const uniqueUsers = useMemo(() => {
    const users = new Set(logs.map(log => log.user));
    return ["All", ...Array.from(users)];
  }, [logs]);

  const uniqueActions = useMemo(() => {
    const actions = new Set(logs.map(log => log.action));
    return ["All", ...Array.from(actions)];
  }, [logs]);

  // Filter logs
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      // Search query filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          log.action.toLowerCase().includes(query) ||
          log.description.toLowerCase().includes(query) ||
          log.user.toLowerCase().includes(query) ||
          log.module.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Module filter
      if (selectedModule !== "All" && log.module !== selectedModule) return false;

      // User filter
      if (selectedUser !== "All" && log.user !== selectedUser) return false;

      // Action filter
      if (selectedAction !== "All" && log.action !== selectedAction) return false;

      // Date range filter
      if (dateFrom || dateTo) {
        try {
          const logDate = parse(log.timestamp, "MMM d, yyyy h:mm a", new Date());
          if (dateFrom && dateTo) {
            if (!isWithinInterval(logDate, { start: startOfDay(dateFrom), end: endOfDay(dateTo) })) {
              return false;
            }
          } else if (dateFrom && logDate < startOfDay(dateFrom)) {
            return false;
          } else if (dateTo && logDate > endOfDay(dateTo)) {
            return false;
          }
        } catch {
          // If date parsing fails, include the log
        }
      }

      return true;
    });
  }, [logs, searchQuery, selectedModule, selectedUser, selectedAction, dateFrom, dateTo]);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedModule("All");
    setSelectedUser("All");
    setSelectedAction("All");
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  const hasActiveFilters = searchQuery || selectedModule !== "All" || selectedUser !== "All" || 
    selectedAction !== "All" || dateFrom || dateTo;

  // Export functions
  const exportToCSV = () => {
    const headers = ["Timestamp", "Module", "Action", "Description", "User", "IP Address"];
    const csvContent = [
      headers.join(","),
      ...filteredLogs.map(log => [
        `"${log.timestamp}"`,
        `"${log.module}"`,
        `"${log.action}"`,
        `"${log.description}"`,
        `"${log.user}"`,
        `"${log.ipAddress}"`
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `audit_log_${format(new Date(), "yyyy-MM-dd_HH-mm")}.csv`;
    link.click();
  };

  const exportToPDF = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Audit Trail Report - ${format(new Date(), "MMM d, yyyy")}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
            h1 { color: #1a1a1a; border-bottom: 2px solid #333; padding-bottom: 10px; }
            .header-info { margin-bottom: 20px; color: #666; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
            th { background-color: #f5f5f5; padding: 12px 8px; text-align: left; border: 1px solid #ddd; font-weight: bold; }
            td { padding: 10px 8px; border: 1px solid #ddd; vertical-align: top; }
            tr:nth-child(even) { background-color: #fafafa; }
            .footer { margin-top: 30px; font-size: 11px; color: #888; border-top: 1px solid #ddd; padding-top: 10px; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <h1>Audit Trail Report</h1>
          <div class="header-info">
            <p><strong>Generated:</strong> ${format(new Date(), "MMMM d, yyyy 'at' h:mm a")}</p>
            <p><strong>Total Records:</strong> ${filteredLogs.length}</p>
            ${hasActiveFilters ? `<p><strong>Filters Applied:</strong> ${[
              selectedModule !== "All" ? `Module: ${selectedModule}` : "",
              selectedUser !== "All" ? `User: ${selectedUser}` : "",
              selectedAction !== "All" ? `Action: ${selectedAction}` : "",
              dateFrom ? `From: ${format(dateFrom, "MMM d, yyyy")}` : "",
              dateTo ? `To: ${format(dateTo, "MMM d, yyyy")}` : "",
              searchQuery ? `Search: "${searchQuery}"` : ""
            ].filter(Boolean).join(", ")}</p>` : ""}
          </div>
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Module</th>
                <th>Action</th>
                <th>Description</th>
                <th>User</th>
                <th>IP Address</th>
              </tr>
            </thead>
            <tbody>
              ${filteredLogs.map(log => `
                <tr>
                  <td>${log.timestamp}</td>
                  <td>${log.module}</td>
                  <td>${log.action}</td>
                  <td>${log.description}</td>
                  <td>${log.user}</td>
                  <td>${log.ipAddress}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
          <div class="footer">
            <p>This is an official audit trail document generated for compliance reporting.</p>
            <p>Auditor-General Compliant Record</p>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <Card>
      <CardHeader className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Audit Trail & Activity Log
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={exportToCSV} disabled={filteredLogs.length === 0}>
              <Download className="h-4 w-4 mr-1" />
              CSV
            </Button>
            <Button variant="outline" size="sm" onClick={exportToPDF} disabled={filteredLogs.length === 0}>
              <Download className="h-4 w-4 mr-1" />
              PDF
            </Button>
            {logs.length > 0 && (
              <Button variant="outline" size="sm" onClick={clearLogs}>
                <Trash2 className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filters</span>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-6 px-2 text-xs">
                <X className="h-3 w-3 mr-1" />
                Clear all
              </Button>
            )}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
            {/* Search */}
            <div className="relative xl:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Module filter */}
            <Select value={selectedModule} onValueChange={setSelectedModule}>
              <SelectTrigger>
                <SelectValue placeholder="Module" />
              </SelectTrigger>
              <SelectContent>
                {MODULES.map(module => (
                  <SelectItem key={module} value={module}>{module}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* User filter */}
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger>
                <SelectValue placeholder="User" />
              </SelectTrigger>
              <SelectContent>
                {uniqueUsers.map(user => (
                  <SelectItem key={user} value={user}>{user}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Action filter */}
            <Select value={selectedAction} onValueChange={setSelectedAction}>
              <SelectTrigger>
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                {uniqueActions.map(action => (
                  <SelectItem key={action} value={action}>{action}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Date range */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateFrom && dateTo
                    ? `${format(dateFrom, "MMM d")} - ${format(dateTo, "MMM d")}`
                    : dateFrom
                    ? `From ${format(dateFrom, "MMM d")}`
                    : dateTo
                    ? `To ${format(dateTo, "MMM d")}`
                    : "Date range"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <div className="p-3 border-b">
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => { setDateFrom(undefined); setDateTo(undefined); }}
                    >
                      Clear
                    </Button>
                  </div>
                </div>
                <div className="flex">
                  <div className="p-3 border-r">
                    <p className="text-sm font-medium mb-2">From</p>
                    <Calendar
                      mode="single"
                      selected={dateFrom}
                      onSelect={setDateFrom}
                      initialFocus
                    />
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-medium mb-2">To</p>
                    <Calendar
                      mode="single"
                      selected={dateTo}
                      onSelect={setDateTo}
                    />
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Results count */}
          <div className="text-sm text-muted-foreground">
            Showing {filteredLogs.length} of {logs.length} records
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Clock className="h-12 w-12 mb-4 opacity-50" />
              {logs.length === 0 ? (
                <>
                  <p className="text-sm">No audit logs recorded yet.</p>
                  <p className="text-xs mt-1">Actions will be tracked as you use the system.</p>
                </>
              ) : (
                <>
                  <p className="text-sm">No logs match your filters.</p>
                  <Button variant="link" size="sm" onClick={clearFilters} className="mt-2">
                    Clear filters
                  </Button>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredLogs.map((log) => (
                <div 
                  key={log.id} 
                  className="rounded-lg border border-border p-4 transition-colors hover:bg-muted/30"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 rounded-full p-2 ${getModuleColor(log.module)}`}>
                        {getModuleIcon(log.module)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground">{log.action}</p>
                          <Badge variant="outline" className="text-xs">
                            {log.module}
                          </Badge>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{log.description}</p>
                        <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {log.user}
                          </span>
                          <span>IP: {log.ipAddress}</span>
                        </div>
                      </div>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">{log.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
