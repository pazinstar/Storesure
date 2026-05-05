
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { useSchool } from "@/contexts/SchoolContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
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
  exportDistributionRegisterPDF,
  exportDistributionRegisterExcel,
  exportNotCollectedPDF,
  exportNotCollectedExcel,
  exportReplacementHistoryPDF,
  exportReplacementHistoryExcel,
} from "@/services/studentReports.service";
import {
  Search, Download, FileText, Users, AlertTriangle,
  RefreshCw, Filter, Printer
} from "lucide-react";



export default function DistributionReports() {
  const { school } = useSchool();

  const { data: distributionRegister = [] } = useQuery({
    queryKey: ['distributionRegister'],
    queryFn: () => api.getDistributionRegister()
  });

  const { data: notCollectedList = [] } = useQuery({
    queryKey: ['notCollectedList'],
    queryFn: () => api.getNotCollectedList()
  });

  const { data: replacementHistory = [] } = useQuery({
    queryKey: ['replacementHistory'],
    queryFn: () => api.getReplacementHistory()
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState("all");
  const [selectedTerm, setSelectedTerm] = useState("term1");

  return (
    <div className="flex-1 space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Distribution Reports</h1>
          <p className="text-muted-foreground mt-1">
            Distribution register, not-collected list, and replacement history
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Distributions</p>
                <p className="text-2xl font-bold text-foreground">{distributionRegister.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning/10">
                <AlertTriangle className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Not Collected</p>
                <p className="text-2xl font-bold text-foreground">{notCollectedList.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-info/10">
                <RefreshCw className="h-5 w-5 text-info" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Replacements</p>
                <p className="text-2xl font-bold text-foreground">{replacementHistory.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10">
                <Users className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Coverage Rate</p>
                <p className="text-2xl font-bold text-foreground">99.3%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filters:</span>
            </div>
            <Select value={selectedTerm} onValueChange={setSelectedTerm}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Select term" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="term1">Term 1</SelectItem>
                <SelectItem value="term2">Term 2</SelectItem>
                <SelectItem value="term3">Term 3</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Select class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                <SelectItem value="Grade 10">Grade 10</SelectItem>
                <SelectItem value="Grade 11">Grade 11</SelectItem>
                <SelectItem value="Grade 12">Grade 12</SelectItem>
                <SelectItem value="Form 3">Form 3</SelectItem>
                <SelectItem value="Form 4">Form 4</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Tabs */}
      <Tabs defaultValue="register" className="space-y-4">
        <TabsList>
          <TabsTrigger value="register" className="gap-2">
            <FileText className="h-4 w-4" />
            Distribution Register
          </TabsTrigger>
          <TabsTrigger value="not-collected" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            Not Collected
          </TabsTrigger>
          <TabsTrigger value="replacements" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Replacement History
          </TabsTrigger>
        </TabsList>

        {/* Distribution Register Tab */}
        <TabsContent value="register">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Distribution Register</CardTitle>
                  <CardDescription>Complete record of all material distributions</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => exportDistributionRegisterPDF(distributionRegister, school)}>
                    <Printer className="h-4 w-4 mr-2" />
                    PDF
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => exportDistributionRegisterExcel(distributionRegister, school)}>
                    <Download className="h-4 w-4 mr-2" />
                    Excel
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Dist. ID</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead>Receiving Teacher</TableHead>
                      <TableHead className="text-center">Signature</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {distributionRegister.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-mono text-sm">{record.id}</TableCell>
                        <TableCell>{record.date}</TableCell>
                        <TableCell>{record.class}</TableCell>
                        <TableCell>{record.item}</TableCell>
                        <TableCell className="text-right font-medium">{record.qty}</TableCell>
                        <TableCell>{record.teacher}</TableCell>
                        <TableCell className="text-center text-success">{record.signature}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Not Collected Tab */}
        <TabsContent value="not-collected">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Not Collected List</CardTitle>
                  <CardDescription>Students who have not collected their allocated materials</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => exportNotCollectedPDF(notCollectedList, school)}>
                    <Printer className="h-4 w-4 mr-2" />
                    PDF
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => exportNotCollectedExcel(notCollectedList, school)}>
                    <Download className="h-4 w-4 mr-2" />
                    Excel
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Adm No.</TableHead>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead className="text-right">Days Overdue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {notCollectedList.map((record) => (
                      <TableRow key={record.admNo}>
                        <TableCell className="font-mono text-sm">{record.admNo}</TableCell>
                        <TableCell className="font-medium">{record.name}</TableCell>
                        <TableCell>{record.class}</TableCell>
                        <TableCell>{record.item}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                            {record.reason}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={record.daysOverdue > 5 ? "text-destructive font-medium" : ""}>
                            {record.daysOverdue} days
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Replacement History Tab */}
        <TabsContent value="replacements">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Replacement History</CardTitle>
                  <CardDescription>Records of lost, damaged, or replaced materials</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => exportReplacementHistoryPDF(replacementHistory, school)}>
                    <Printer className="h-4 w-4 mr-2" />
                    PDF
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => exportReplacementHistoryExcel(replacementHistory, school)}>
                    <Download className="h-4 w-4 mr-2" />
                    Excel
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ref. ID</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Adm No.</TableHead>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Approved By</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {replacementHistory.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-mono text-sm">{record.id}</TableCell>
                        <TableCell>{record.date}</TableCell>
                        <TableCell className="font-mono text-sm">{record.admNo}</TableCell>
                        <TableCell className="font-medium">{record.name}</TableCell>
                        <TableCell>{record.class}</TableCell>
                        <TableCell>{record.item}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{record.reason}</Badge>
                        </TableCell>
                        <TableCell>{record.approvedBy}</TableCell>
                        <TableCell>
                          <Badge className={
                            record.status === "Issued" ? "bg-success/10 text-success border-success/20" :
                              record.status === "Pending" ? "bg-warning/10 text-warning border-warning/20" :
                                "bg-destructive/10 text-destructive border-destructive/20"
                          }>
                            {record.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}