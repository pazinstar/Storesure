import { useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { LPO } from "@/mock/data";
import { useLibrary, SourceType, LibraryReceiptItem } from "@/contexts/LibraryContext";
import { useAdmin } from "@/contexts/AdminContext";
import { useReadOnlyGuard } from "@/hooks/useReadOnlyGuard";
import {
  ArrowDownToLine,
  Plus,
  Trash2,
  BookOpen,
  FileText,
  User,
  Calendar,
  Building2,
  Hash,
  CheckCircle,
} from "lucide-react";
import { format } from "date-fns";

interface BookItem {
  id: string;
  title: string;
  author: string;
  category: string;
  isbn: string;
  quantity: number;
  accessionNumbers: string[];
}

const categories = ["Textbook", "Reference", "Fiction", "Periodical", "Other"];

export default function LibraryReceive() {
  const { user } = useAuth();
  const { addReceipt, receipts } = useLibrary();
  const { libraries } = useAdmin();
  const { data: lpos = [] } = useQuery<LPO[]>({
    queryKey: ['lpos'],
    queryFn: () => api.getLPOs()
  });
  const { isReadOnly, blockAction } = useReadOnlyGuard();

  // Form state
  const [sourceType, setSourceType] = useState<SourceType | "">("");
  const [selectedLPOId, setSelectedLPOId] = useState("");
  const [sourceName, setSourceName] = useState("");
  const [reference, setReference] = useState("");
  const [dateReceived, setDateReceived] = useState(format(new Date(), "yyyy-MM-dd"));
  const [libraryBranch, setLibraryBranch] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<BookItem[]>([]);

  // Signature state
  const [isSigned, setIsSigned] = useState(false);
  const [signatureName, setSignatureName] = useState("");
  const [signatureTimestamp, setSignatureTimestamp] = useState<Date | null>(null);

  const [isGeneratingAccessions, setIsGeneratingAccessions] = useState(false);

  // Dialog state
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    title: "",
    author: "",
    category: "",
    isbn: "",
    quantity: 1,
  });

  // Get LPOs available for selection (Approved, Sent to Supplier, or Partially Delivered)
  const availableLPOs = useMemo(() => {
    return lpos.filter(lpo =>
      lpo.status === "Approved" ||
      lpo.status === "Sent to Supplier" ||
      lpo.status === "Partially Delivered"
    );
  }, [lpos]);

  // Handle LPO selection - autofill supplier name
  const handleLPOSelect = (lpoId: string) => {
    setSelectedLPOId(lpoId);
    const selectedLPO = lpos.find(lpo => lpo.id === lpoId);
    if (selectedLPO) {
      setReference(selectedLPO.lpoNumber);
      setSourceName(selectedLPO.supplierName);
    } else {
      setReference("");
      setSourceName("");
    }
  };

  const handleAddItem = useCallback(async () => {
    if (!newItem.title || !newItem.author || !newItem.category || newItem.quantity < 1) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsGeneratingAccessions(true);
    let accessionNumbers: string[];
    try {
      accessionNumbers = await api.generateAccessions(newItem.quantity);
    } catch {
      toast.error("Failed to generate accession numbers");
      setIsGeneratingAccessions(false);
      return;
    } finally {
      setIsGeneratingAccessions(false);
    }

    const item: BookItem = {
      id: `item-${Date.now()}`,
      title: newItem.title,
      author: newItem.author,
      category: newItem.category,
      isbn: newItem.isbn,
      quantity: newItem.quantity,
      accessionNumbers,
    };

    setItems((prev) => [...prev, item]);
    setNewItem({ title: "", author: "", category: "", isbn: "", quantity: 1 });
    setIsAddItemOpen(false);
    toast.success(`Added ${newItem.quantity} cop${newItem.quantity !== 1 ? "ies" : "y"} with accession numbers`);
  }, [newItem]);

  const handleRemoveItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const handleSign = () => {
    if (!user?.name) {
      toast.error("User not authenticated");
      return;
    }
    setSignatureName(user.name);
    setSignatureTimestamp(new Date());
    setIsSigned(true);
    toast.success("Document signed successfully");
  };

  const handleSubmit = () => {
    if (blockAction("receive books")) return;

    // Validation
    if (!sourceType || !sourceName || !reference || !dateReceived || !libraryBranch) {
      toast.error("Please fill in all source information fields");
      return;
    }
    if (items.length === 0) {
      toast.error("Please add at least one book item");
      return;
    }
    if (!isSigned) {
      toast.error("Please sign the document before submitting");
      return;
    }

    // Convert items to receipt format
    const receiptItems: LibraryReceiptItem[] = items.map((item) => ({
      id: item.id,
      title: item.title,
      author: item.author,
      category: item.category,
      isbn: item.isbn || undefined,
      quantityReceived: item.quantity,
      accessionNumbers: item.accessionNumbers,
    }));

    addReceipt({
      sourceType: sourceType as SourceType,
      sourceName,
      reference,
      dateReceived: new Date(dateReceived),
      libraryBranch,
      items: receiptItems,
      signedBy: signatureName,
      signedAt: signatureTimestamp!,
      notes: notes || undefined,
    });

    toast.success("Books received and added to catalogue successfully");

    // Reset form
    setSourceType("");
    setSourceName("");
    setReference("");
    setDateReceived(format(new Date(), "yyyy-MM-dd"));
    setLibraryBranch("");
    setNotes("");
    setItems([]);
    setIsSigned(false);
    setSignatureName("");
    setSignatureTimestamp(null);
  };

  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Library Receive (Books In)</h1>
          <p className="text-muted-foreground">
            Receive books from suppliers, donors, or transfers into the library
          </p>
        </div>
        <Badge variant="outline" className="flex items-center gap-1 w-fit">
          <FileText className="h-3 w-3" />
          Receipt #{receipts.length + 1}
        </Badge>
      </div>

      {/* Source Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Source Information
          </CardTitle>
          <CardDescription>
            Identify the source of the books being received
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="sourceType">Source Type *</Label>
              <Select
                value={sourceType}
                onValueChange={(v) => {
                  setSourceType(v as SourceType);
                  // Reset LPO selection when source type changes
                  setSelectedLPOId("");
                  setSourceName("");
                  setReference("");
                }}
                disabled={isReadOnly}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select source type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Supplier">Supplier</SelectItem>
                  <SelectItem value="Donor">Donor</SelectItem>
                  <SelectItem value="Transfer">Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {sourceType === "Supplier" ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="lpoReference">LPO Reference *</Label>
                  <Select
                    value={selectedLPOId}
                    onValueChange={handleLPOSelect}
                    disabled={isReadOnly}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select LPO" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableLPOs.length === 0 ? (
                        <SelectItem value="_none" disabled>No LPOs available</SelectItem>
                      ) : (
                        availableLPOs.map((lpo) => (
                          <SelectItem key={lpo.id} value={lpo.id}>
                            {lpo.lpoNumber} - {lpo.supplierName}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sourceName">Supplier Name</Label>
                  <Input
                    id="sourceName"
                    value={sourceName}
                    readOnly
                    className="bg-muted"
                    placeholder="Auto-filled from LPO"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="sourceName">
                    {sourceType === "Donor" ? "Donor Name" :
                      sourceType === "Transfer" ? "Transfer From" : "Source Name"} *
                  </Label>
                  <Input
                    id="sourceName"
                    value={sourceName}
                    onChange={(e) => setSourceName(e.target.value)}
                    placeholder={
                      sourceType === "Donor" ? "Enter donor name" :
                        sourceType === "Transfer" ? "Enter branch name" : "Enter source name"
                    }
                    disabled={isReadOnly || !sourceType}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reference">
                    {sourceType === "Donor" ? "Donation Note Ref" :
                      sourceType === "Transfer" ? "Transfer Reference" : "Reference"} *
                  </Label>
                  <Input
                    id="reference"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder={
                      sourceType === "Donor" ? "e.g., DON/2024/001" :
                        sourceType === "Transfer" ? "e.g., TRF/2024/001" : "Enter reference"
                    }
                    disabled={isReadOnly || !sourceType}
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="dateReceived">Date Received *</Label>
              <Input
                id="dateReceived"
                type="date"
                value={dateReceived}
                onChange={(e) => setDateReceived(e.target.value)}
                disabled={isReadOnly}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="libraryBranch">Library Branch *</Label>
              <Select
                value={libraryBranch}
                onValueChange={setLibraryBranch}
                disabled={isReadOnly}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select library branch" />
                </SelectTrigger>
                <SelectContent>
                  {libraries.filter(l => l.status === "active").map((lib) => (
                    <SelectItem key={lib.id} value={lib.name}>
                      {lib.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Input
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional notes"
                disabled={isReadOnly}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Book Items */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Book Details
              </CardTitle>
              <CardDescription>
                Add books being received - accession numbers will be auto-generated
              </CardDescription>
            </div>
            <Button
              onClick={() => { if (!blockAction("add books")) setIsAddItemOpen(true); }}
              disabled={isReadOnly}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Book
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No books added yet. Click "Add Book" to begin.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>ISBN</TableHead>
                  <TableHead className="text-center">Qty</TableHead>
                  <TableHead>Accession Numbers</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.title}</TableCell>
                    <TableCell>{item.author}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{item.category}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {item.isbn || "-"}
                    </TableCell>
                    <TableCell className="text-center">{item.quantity}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {item.accessionNumbers.slice(0, 3).map((acc) => (
                          <Badge key={acc} variant="outline" className="text-xs font-mono">
                            {acc}
                          </Badge>
                        ))}
                        {item.accessionNumbers.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{item.accessionNumbers.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveItem(item.id)}
                        disabled={isReadOnly}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {items.length > 0 && (
            <div className="mt-4 flex justify-end">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total Items</p>
                <p className="text-2xl font-bold">{totalQuantity} copies</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Signature Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Digital Signature
          </CardTitle>
          <CardDescription>
            Librarian or Storekeeper must sign to confirm receipt
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isSigned ? (
            <div className="flex items-center gap-4">
              <Button
                onClick={handleSign}
                variant="outline"
                disabled={isReadOnly || items.length === 0}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Sign as {user?.name}
              </Button>
              <p className="text-sm text-muted-foreground">
                Click to digitally sign this receipt
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-4 p-4 bg-accent rounded-lg border border-border">
              <CheckCircle className="h-6 w-6 text-primary" />
              <div>
                <p className="font-medium text-foreground">
                  Signed by: {signatureName}
                </p>
                <p className="text-sm text-muted-foreground">
                  {signatureTimestamp && format(signatureTimestamp, "PPpp")}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex justify-end gap-4">
        <Button variant="outline" disabled={isReadOnly}>
          Save as Draft
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isReadOnly || !isSigned || items.length === 0}
        >
          <ArrowDownToLine className="mr-2 h-4 w-4" />
          Receive Books
        </Button>
      </div>

      {/* Add Book Dialog */}
      <Dialog open={isAddItemOpen} onOpenChange={setIsAddItemOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Book</DialogTitle>
            <DialogDescription>
              Enter book details - accession numbers will be generated automatically
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="bookTitle">Title *</Label>
              <Input
                id="bookTitle"
                value={newItem.title}
                onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                placeholder="Enter book title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bookAuthor">Author *</Label>
              <Input
                id="bookAuthor"
                value={newItem.author}
                onChange={(e) => setNewItem({ ...newItem, author: e.target.value })}
                placeholder="Enter author name"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bookCategory">Category *</Label>
                <Select
                  value={newItem.category}
                  onValueChange={(v) => setNewItem({ ...newItem, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bookIsbn">ISBN (Optional)</Label>
                <Input
                  id="bookIsbn"
                  value={newItem.isbn}
                  onChange={(e) => setNewItem({ ...newItem, isbn: e.target.value })}
                  placeholder="e.g., 978-0-123-45678-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bookQuantity">Quantity Received *</Label>
              <Input
                id="bookQuantity"
                type="number"
                min="1"
                value={newItem.quantity}
                onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 })}
              />
              <p className="text-xs text-muted-foreground">
                {newItem.quantity} unique accession number(s) will be generated
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddItemOpen(false)} disabled={isGeneratingAccessions}>
              Cancel
            </Button>
            <Button onClick={handleAddItem} disabled={isGeneratingAccessions}>
              <Plus className="mr-2 h-4 w-4" />
              {isGeneratingAccessions ? "Generating..." : "Add Book"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
