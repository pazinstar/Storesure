import { useState } from "react";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/ui/table-pagination";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Users, BookOpen, CheckCircle, AlertCircle, Search } from "lucide-react";



export default function BulkIssue() {
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedBook, setSelectedBook] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: classStudents = [] } = useQuery({
    queryKey: ['classStudents', selectedClass],
    queryFn: () => api.getClassStudents(selectedClass || 'all')
  });

  const { data: textbooks = [] } = useQuery({
    queryKey: ['bulkIssueTextbooks'],
    queryFn: () => api.getBulkIssueTextbooks()
  });

  const { data: recentBulkIssues = [] } = useQuery({
    queryKey: ['recentBulkIssues'],
    queryFn: () => api.getRecentBulkIssues()
  });

  const filteredStudents = classStudents.filter(
    (student) =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.admNo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const studentsWithoutBook = classStudents.filter((s) => !s.hasBook);

  const studentsPage = usePagination(filteredStudents);
  const issuesPage = usePagination(recentBulkIssues);
  const coveragePercent = Math.round(
    ((classStudents.length - studentsWithoutBook.length) / classStudents.length) * 100
  );

  const toggleStudent = (admNo: string) => {
    setSelectedStudents((prev) =>
      prev.includes(admNo) ? prev.filter((id) => id !== admNo) : [...prev, admNo]
    );
  };

  const selectAllWithoutBook = () => {
    setSelectedStudents(studentsWithoutBook.map((s) => s.admNo));
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Bulk Issue to Class</h1>
          <p className="text-muted-foreground">
            Issue textbooks to entire classes efficiently (MoE Textbook Policy)
          </p>
        </div>
      </div>

      {/* Selection Panel */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Issue Configuration</CardTitle>
            <CardDescription>Select class and textbook for bulk issue</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Select Class</Label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="form1a">Form 1A</SelectItem>
                    <SelectItem value="form1b">Form 1B</SelectItem>
                    <SelectItem value="form2a">Form 2A</SelectItem>
                    <SelectItem value="form2b">Form 2B</SelectItem>
                    <SelectItem value="form3a">Form 3A</SelectItem>
                    <SelectItem value="form3b">Form 3B</SelectItem>
                    <SelectItem value="form4a">Form 4A</SelectItem>
                    <SelectItem value="form4b">Form 4B</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Select Textbook</Label>
                <Select value={selectedBook} onValueChange={setSelectedBook}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose textbook" />
                  </SelectTrigger>
                  <SelectContent>
                    {textbooks.map((book) => (
                      <SelectItem key={book.id} value={book.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{book.title}</span>
                          <Badge
                            variant={book.available >= book.required ? "default" : "destructive"}
                            className="ml-2"
                          >
                            {book.available} avail.
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selectedClass && selectedBook && (
              <div className="p-4 rounded-lg bg-muted/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Class Coverage Status</span>
                  <span className="text-sm text-muted-foreground">
                    {classStudents.length - studentsWithoutBook.length}/{classStudents.length}{" "}
                    students have this book
                  </span>
                </div>
                <Progress value={coveragePercent} className="h-2" />
                <div className="flex items-center gap-4">
                  {coveragePercent === 100 ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm">100% coverage achieved</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-orange-500">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm">
                        {studentsWithoutBook.length} students need this textbook
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Issue Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <span className="text-sm">Students Selected</span>
              </div>
              <Badge variant="secondary">{selectedStudents.length}</Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                <span className="text-sm">Copies Required</span>
              </div>
              <Badge variant="secondary">{selectedStudents.length}</Badge>
            </div>
            <Button className="w-full" disabled={selectedStudents.length === 0}>
              Issue {selectedStudents.length} Books
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Student Selection Table */}
      {selectedClass && selectedBook && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Select Students</CardTitle>
                <CardDescription>
                  Choose students to receive the textbook
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search students..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Button variant="outline" size="sm" onClick={selectAllWithoutBook}>
                  Select All Without Book
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={
                        selectedStudents.length === studentsWithoutBook.length &&
                        studentsWithoutBook.length > 0
                      }
                      onCheckedChange={(checked) => {
                        if (checked) {
                          selectAllWithoutBook();
                        } else {
                          setSelectedStudents([]);
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead>Adm. No.</TableHead>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Gender</TableHead>
                  <TableHead>Current Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {studentsPage.paginatedItems.map((student) => (
                  <TableRow
                    key={student.admNo}
                    className={student.hasBook ? "opacity-50" : ""}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedStudents.includes(student.admNo)}
                        onCheckedChange={() => toggleStudent(student.admNo)}
                        disabled={student.hasBook}
                      />
                    </TableCell>
                    <TableCell className="font-mono">{student.admNo}</TableCell>
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell>{student.gender}</TableCell>
                    <TableCell>
                      {student.hasBook ? (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          Has Book
                        </Badge>
                      ) : (
                        <Badge variant="outline">Needs Book</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePagination page={studentsPage.page} totalPages={studentsPage.totalPages} from={studentsPage.from} to={studentsPage.to} total={filteredStudents.length} onPageChange={studentsPage.setPage} />
          </CardContent>
        </Card>
      )}

      {/* Recent Bulk Issues */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Bulk Issues</CardTitle>
          <CardDescription>Previous bulk issue transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction ID</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Textbook</TableHead>
                <TableHead>Copies Issued</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Issued By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {issuesPage.paginatedItems.map((issue) => (
                <TableRow key={issue.id}>
                  <TableCell className="font-mono text-sm">{issue.id}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{issue.class}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">{issue.book}</TableCell>
                  <TableCell>{issue.copies}</TableCell>
                  <TableCell>{new Date(issue.date).toLocaleDateString()}</TableCell>
                  <TableCell>{issue.issuedBy}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination page={issuesPage.page} totalPages={issuesPage.totalPages} from={issuesPage.from} to={issuesPage.to} total={recentBulkIssues.length} onPageChange={issuesPage.setPage} />
        </CardContent>
      </Card>
    </div>
  );
}
