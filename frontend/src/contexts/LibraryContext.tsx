import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from "react";
import { libraryService } from "@/services/library.service";
import { toast } from "sonner";

export type BookStatus = "Available" | "Issued" | "Overdue" | "Lost" | "Damaged";
export type SourceType = "Supplier" | "Donor" | "Transfer";
export type BorrowerType = "Student" | "Staff";

export interface BookCopy {
  id: string;
  accessionNo: string;
  titleId: string;
  title: string;
  author: string;
  category: string;
  isbn?: string;
  status: BookStatus;
  location: string;
  receivedDate: Date;
  receiptId: string;
  currentBorrowerId?: string;
  currentBorrowerName?: string;
  currentBorrowerType?: BorrowerType;
  currentBorrowerClass?: string;
  issueDate?: Date;
  dueDate?: Date;
  statusRemarks?: string;
}

export interface LibraryReceipt {
  id: string;
  receiptNo: string;
  sourceType: SourceType;
  sourceName: string;
  reference: string;
  dateReceived: Date;
  libraryBranch: string;
  items: LibraryReceiptItem[];
  signedBy: string;
  signedAt: Date;
  notes?: string;
}

export interface LibraryReceiptItem {
  id: string;
  title: string;
  author: string;
  category: string;
  isbn?: string;
  quantityReceived: number;
  accessionNumbers: string[];
}

export interface BookTitle {
  id: string;
  title: string;
  author: string;
  category: string;
  isbn?: string;
  publisher?: string;
  subject?: string;
  year?: number;
}

export interface LoanTransaction {
  id: string;
  transactionNo: string;
  accessionNo: string;
  bookTitle: string;
  bookAuthor: string;
  bookCategory: string;
  borrowerId: string;
  borrowerName: string;
  borrowerType: BorrowerType;
  borrowerClass?: string;
  issueDate: Date;
  dueDate: Date;
  returnDate?: Date;
  returnCondition?: "Good" | "Fair" | "Poor" | "Damaged";
  lateDays: number;
  status: "Active" | "Returned" | "Overdue";
  notes?: string;
}

interface LibraryContextType {
  bookCopies: BookCopy[];
  getBookCopyByAccession: (accessionNo: string) => BookCopy | undefined;
  getAvailableBooks: () => BookCopy[];
  updateBookStatus: (accessionNo: string, newStatus: BookStatus, remarks?: string) => { success: boolean; message: string };

  loanTransactions: LoanTransaction[];
  issueBook: (data: {
    accessionNo: string;
    borrowerId: string;
    borrowerName: string;
    borrowerType: BorrowerType;
    borrowerClass?: string;
    issueDate: Date;
    dueDate: Date;
  }) => { success: boolean; message: string; transactionNo?: string };
  returnBook: (data: {
    accessionNo: string;
    returnCondition: "Good" | "Fair" | "Poor" | "Damaged";
    notes?: string;
  }) => { success: boolean; message: string };
  markAsLost: (accessionNo: string) => void;
  getActiveLoans: () => LoanTransaction[];
  getOverdueLoans: () => LoanTransaction[];
  getRecentReturns: (days?: number) => LoanTransaction[];
  getBorrowerHistory: (borrowerId: string) => LoanTransaction[];
  getLostBooks: () => BookCopy[];
  getDamagedBooks: () => BookCopy[];

  receipts: LibraryReceipt[];
  addReceipt: (receipt: Omit<LibraryReceipt, "id" | "receiptNo">) => void;
  getReceiptById: (id: string) => LibraryReceipt | undefined;

  generateAccessionNumbers: (count: number) => string[];
  getNextAccessionNumber: () => string;

  bookTitles: BookTitle[];
  addBookTitle: (title: Omit<BookTitle, "id">) => void;

  getTotalCopies: () => number;
  getAvailableCopies: () => number;
  getIssuedCopies: () => number;
  getOverdueCopies: () => number;

  isLoading: boolean;
  reload: () => void;
}

const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

// ─── Accession counter fallback (used only in mock mode) ─────────────────────
let _accessionCounter = 100;
let _txnCounter = 10;

export function LibraryProvider({ children }: { children: ReactNode }) {
  const [bookCopies, setBookCopies] = useState<BookCopy[]>([]);
  const [loanTransactions, setLoanTransactions] = useState<LoanTransaction[]>([]);
  const [receipts, setReceipts] = useState<LibraryReceipt[]>([]);
  const [bookTitles, setBookTitles] = useState<BookTitle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reloadTick, setReloadTick] = useState(0);

  const reload = useCallback(() => setReloadTick((t) => t + 1), []);

  // ── Initial fetch ───────────────────────────────────────────────────────────
  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      libraryService.getBookCopies(),
      libraryService.getLoans(),
      libraryService.getReceipts(),
      libraryService.getBookTitles(),
    ])
      .then(([copies, loans, rcpts, titles]) => {
        setBookCopies(copies);
        setLoanTransactions(loans);
        setReceipts(rcpts);
        setBookTitles(titles);
      })
      .catch((err) => {
        console.error("Library fetch error:", err);
        toast.error("Failed to load library data");
      })
      .finally(() => setIsLoading(false));
  }, [reloadTick]);

  // ── Read helpers ────────────────────────────────────────────────────────────
  const getBookCopyByAccession = (accessionNo: string) =>
    bookCopies.find((c) => c.accessionNo === accessionNo);

  const getAvailableBooks = () => bookCopies.filter((c) => c.status === "Available");
  const getActiveLoans = () => loanTransactions.filter((t) => t.status === "Active" || t.status === "Overdue");
  const getOverdueLoans = () => loanTransactions.filter((t) => t.status === "Overdue");
  const getLostBooks = () => bookCopies.filter((c) => c.status === "Lost");
  const getDamagedBooks = () => bookCopies.filter((c) => c.status === "Damaged");
  const getReceiptById = (id: string) => receipts.find((r) => r.id === id);
  const getBorrowerHistory = (borrowerId: string) =>
    loanTransactions.filter((t) => t.borrowerId === borrowerId);

  const getRecentReturns = (days = 7) => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return loanTransactions.filter(
      (t) => t.status === "Returned" && t.returnDate && t.returnDate >= cutoff
    );
  };

  const getTotalCopies = () => bookCopies.length;
  const getAvailableCopies = () => bookCopies.filter((c) => c.status === "Available").length;
  const getIssuedCopies = () => bookCopies.filter((c) => c.status === "Issued").length;
  const getOverdueCopies = () => bookCopies.filter((c) => c.status === "Overdue").length;

  // ── Accession helpers ───────────────────────────────────────────────────────
  const getNextAccessionNumber = () => {
    const year = new Date().getFullYear();
    const num = (_accessionCounter++).toString().padStart(4, "0");
    return `ACC/${year}/${num}`;
  };

  const generateAccessionNumbers = (count: number): string[] => {
    const year = new Date().getFullYear();
    return Array.from({ length: count }, () => {
      const num = (_accessionCounter++).toString().padStart(4, "0");
      return `ACC/${year}/${num}`;
    });
  };

  // ── Mutations ───────────────────────────────────────────────────────────────

  const updateBookStatus = (
    accessionNo: string,
    newStatus: BookStatus,
    remarks?: string
  ): { success: boolean; message: string } => {
    const copy = getBookCopyByAccession(accessionNo);
    if (!copy) return { success: false, message: "Book not found" };

    if ((copy.status === "Issued" || copy.status === "Overdue") && newStatus !== "Lost") {
      return { success: false, message: "Cannot change status of issued books. Use the Return function." };
    }
    if ((newStatus === "Damaged" || newStatus === "Lost") && !remarks?.trim()) {
      return { success: false, message: `Remarks are mandatory when marking a book as ${newStatus}` };
    }

    // Optimistic update
    setBookCopies((prev) =>
      prev.map((c) =>
        c.accessionNo === accessionNo
          ? {
              ...c, status: newStatus, statusRemarks: remarks,
              ...(newStatus === "Lost" && {
                currentBorrowerId: undefined, currentBorrowerName: undefined,
                currentBorrowerType: undefined, currentBorrowerClass: undefined,
                issueDate: undefined, dueDate: undefined,
              }),
            }
          : c
      )
    );

    libraryService.updateBookCopyStatus(copy.id, newStatus, remarks)
      .then((updated) => {
        setBookCopies((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      })
      .catch((err: Error) => {
        setBookCopies((prev) => prev.map((c) => (c.accessionNo === accessionNo ? copy : c)));
        toast.error(err.message || "Failed to update book status");
      });

    if (newStatus === "Lost") {
      setLoanTransactions((prev) =>
        prev.map((t) =>
          t.accessionNo === accessionNo && (t.status === "Active" || t.status === "Overdue")
            ? { ...t, status: "Returned" as const, notes: remarks || "Marked as lost" }
            : t
        )
      );
    }

    return { success: true, message: `Book status updated to ${newStatus}` };
  };

  const issueBook = (data: {
    accessionNo: string;
    borrowerId: string;
    borrowerName: string;
    borrowerType: BorrowerType;
    borrowerClass?: string;
    issueDate: Date;
    dueDate: Date;
  }): { success: boolean; message: string; transactionNo?: string } => {
    const copy = getBookCopyByAccession(data.accessionNo);
    if (!copy) return { success: false, message: "Book not found with this accession number" };
    if (copy.status !== "Available") {
      return { success: false, message: `Book is not available (Current status: ${copy.status})` };
    }

    const year = new Date().getFullYear();
    const tempTxnNo = `TXN/${year}/${(_txnCounter++).toString().padStart(4, "0")}`;

    // Optimistic update
    const tempTxn: LoanTransaction = {
      id: `temp-${Date.now()}`,
      transactionNo: tempTxnNo,
      accessionNo: data.accessionNo,
      bookTitle: copy.title,
      bookAuthor: copy.author,
      bookCategory: copy.category,
      borrowerId: data.borrowerId,
      borrowerName: data.borrowerName,
      borrowerType: data.borrowerType,
      borrowerClass: data.borrowerClass,
      issueDate: data.issueDate,
      dueDate: data.dueDate,
      lateDays: 0,
      status: "Active",
    };

    setLoanTransactions((prev) => [...prev, tempTxn]);
    setBookCopies((prev) =>
      prev.map((c) =>
        c.accessionNo === data.accessionNo
          ? {
              ...c, status: "Issued" as BookStatus,
              currentBorrowerId: data.borrowerId,
              currentBorrowerName: data.borrowerName,
              currentBorrowerType: data.borrowerType,
              currentBorrowerClass: data.borrowerClass,
              issueDate: data.issueDate,
              dueDate: data.dueDate,
            }
          : c
      )
    );

    const toIso = (d: Date) => d.toISOString().split("T")[0];
    libraryService.issueBook({
      accession_no: data.accessionNo,
      borrower_id: data.borrowerId,
      borrower_name: data.borrowerName,
      borrower_type: data.borrowerType,
      borrower_class: data.borrowerClass,
      issue_date: toIso(data.issueDate),
      due_date: toIso(data.dueDate),
    })
      .then(({ transaction, copy: updatedCopy }) => {
        setLoanTransactions((prev) =>
          prev.map((t) => (t.id === tempTxn.id ? transaction : t))
        );
        setBookCopies((prev) => prev.map((c) => (c.id === updatedCopy.id ? updatedCopy : c)));
      })
      .catch((err: Error) => {
        setLoanTransactions((prev) => prev.filter((t) => t.id !== tempTxn.id));
        setBookCopies((prev) => prev.map((c) => (c.accessionNo === data.accessionNo ? copy : c)));
        toast.error(err.message || "Failed to issue book");
      });

    return { success: true, message: "Book issued successfully", transactionNo: tempTxnNo };
  };

  const returnBook = (data: {
    accessionNo: string;
    returnCondition: "Good" | "Fair" | "Poor" | "Damaged";
    notes?: string;
  }): { success: boolean; message: string } => {
    const copy = getBookCopyByAccession(data.accessionNo);
    if (!copy) return { success: false, message: "Book not found" };
    if (copy.status !== "Issued" && copy.status !== "Overdue") {
      return { success: false, message: `Book is not currently on loan (Status: ${copy.status})` };
    }

    const activeTxn = loanTransactions.find(
      (t) => t.accessionNo === data.accessionNo && (t.status === "Active" || t.status === "Overdue")
    );
    if (!activeTxn) return { success: false, message: "No active loan found for this book" };

    const today = new Date();
    const lateDays = Math.max(0, Math.ceil((today.getTime() - copy.dueDate!.getTime()) / 86400000));
    const newCopyStatus: BookStatus = data.returnCondition === "Damaged" ? "Damaged" : "Available";

    // Optimistic update
    setLoanTransactions((prev) =>
      prev.map((t) =>
        t.id === activeTxn.id
          ? { ...t, returnDate: today, returnCondition: data.returnCondition, lateDays, status: "Returned" as const, notes: data.notes }
          : t
      )
    );
    setBookCopies((prev) =>
      prev.map((c) =>
        c.accessionNo === data.accessionNo
          ? {
              ...c, status: newCopyStatus,
              currentBorrowerId: undefined, currentBorrowerName: undefined,
              currentBorrowerType: undefined, currentBorrowerClass: undefined,
              issueDate: undefined, dueDate: undefined,
            }
          : c
      )
    );

    libraryService.returnBook(activeTxn.id, {
      return_condition: data.returnCondition,
      notes: data.notes,
    })
      .then((updated) => {
        setLoanTransactions((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      })
      .catch((err: Error) => {
        // Revert
        setLoanTransactions((prev) => prev.map((t) => (t.id === activeTxn.id ? activeTxn : t)));
        setBookCopies((prev) => prev.map((c) => (c.accessionNo === data.accessionNo ? copy : c)));
        toast.error(err.message || "Failed to return book");
      });

    return { success: true, message: "Book returned successfully" };
  };

  const markAsLost = (accessionNo: string) => {
    updateBookStatus(accessionNo, "Lost", "Marked as lost");
  };

  const addReceipt = (receipt: Omit<LibraryReceipt, "id" | "receiptNo">) => {
    const year = new Date().getFullYear();
    const tempReceipt: LibraryReceipt = {
      ...receipt,
      id: `temp-${Date.now()}`,
      receiptNo: `LRN/${year}/${(receipts.length + 1).toString().padStart(4, "0")}`,
    };

    // Create new copies from receipt items
    const newCopies: BookCopy[] = [];
    receipt.items.forEach((item) => {
      item.accessionNumbers.forEach((accNo) => {
        newCopies.push({
          id: `temp-copy-${Date.now()}-${accNo}`,
          accessionNo: accNo,
          titleId: "",
          title: item.title,
          author: item.author,
          category: item.category,
          isbn: item.isbn,
          status: "Available",
          location: receipt.libraryBranch,
          receivedDate: receipt.dateReceived,
          receiptId: tempReceipt.id,
        });
      });
    });

    setReceipts((prev) => [...prev, tempReceipt]);
    setBookCopies((prev) => [...prev, ...newCopies]);

    // Persist to backend
    const payload = {
      source_type: receipt.sourceType,
      source_name: receipt.sourceName,
      reference: receipt.reference,
      date_received: receipt.dateReceived.toISOString().split("T")[0],
      library_branch: receipt.libraryBranch,
      signed_by: receipt.signedBy,
      signed_at: receipt.signedAt.toISOString(),
      notes: receipt.notes,
      items: receipt.items.map((i) => ({
        title: i.title, author: i.author, category: i.category,
        isbn: i.isbn, quantity_received: i.quantityReceived,
        accession_numbers: i.accessionNumbers,
      })),
    };

    libraryService.createReceipt(payload)
      .then((created) => {
        setReceipts((prev) => prev.map((r) => (r.id === tempReceipt.id ? created : r)));
        // Reload copies to get server-generated IDs
        libraryService.getBookCopies().then(setBookCopies);
      })
      .catch((err: Error) => {
        setReceipts((prev) => prev.filter((r) => r.id !== tempReceipt.id));
        setBookCopies((prev) => prev.filter((c) => !newCopies.some((nc) => nc.id === c.id)));
        toast.error(err.message || "Failed to save receipt");
      });
  };

  const addBookTitle = (titleData: Omit<BookTitle, "id">) => {
    libraryService.createBookTitle(titleData)
      .then((created) => setBookTitles((prev) => [...prev, created]))
      .catch((err: Error) => toast.error(err.message || "Failed to add title"));
  };

  return (
    <LibraryContext.Provider
      value={{
        bookCopies, getBookCopyByAccession, getAvailableBooks, updateBookStatus,
        loanTransactions, issueBook, returnBook, markAsLost,
        getActiveLoans, getOverdueLoans, getRecentReturns,
        getBorrowerHistory, getLostBooks, getDamagedBooks,
        receipts, addReceipt, getReceiptById,
        generateAccessionNumbers, getNextAccessionNumber,
        bookTitles, addBookTitle,
        getTotalCopies, getAvailableCopies, getIssuedCopies, getOverdueCopies,
        isLoading, reload,
      }}
    >
      {children}
    </LibraryContext.Provider>
  );
}

export function useLibrary() {
  const context = useContext(LibraryContext);
  if (!context) throw new Error("useLibrary must be used within a LibraryProvider");
  return context;
}
