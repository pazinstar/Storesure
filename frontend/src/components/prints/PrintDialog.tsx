import { useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, X } from "lucide-react";

interface PrintDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
}

export default function PrintDialog({ open, onOpenChange, title, children }: PrintDialogProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (printRef.current) {
      const printContent = printRef.current.innerHTML;
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${title}</title>
              <style>
                * {
                  margin: 0;
                  padding: 0;
                  box-sizing: border-box;
                }
                body {
                  font-family: Arial, Helvetica, sans-serif;
                  line-height: 1.4;
                  color: #000;
                  background: #fff;
                  font-size: 12px;
                }
                .print-template, [class*="bg-white"] {
                  max-width: 210mm;
                  margin: 0 auto;
                  padding: 10mm;
                  background: #fff !important;
                }
                h1 {
                  font-size: 16px;
                  font-weight: bold;
                  text-align: center;
                  margin-bottom: 15px;
                  text-transform: uppercase;
                }
                p {
                  margin: 3px 0;
                }
                table {
                  border-collapse: collapse;
                  width: 100%;
                  margin: 15px 0;
                  font-size: 11px;
                }
                th, td {
                  border: 1px solid #333 !important;
                  padding: 6px 8px !important;
                  text-align: left;
                }
                th {
                  background-color: #1e3a5f !important;
                  color: #fff !important;
                  font-weight: 600;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
                thead tr {
                  background-color: #1e3a5f !important;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
                tbody tr:nth-child(even) {
                  background-color: #f5f5f5 !important;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
                .text-center, [class*="text-center"] {
                  text-align: center !important;
                }
                .text-right, [class*="text-right"] {
                  text-align: right !important;
                }
                .font-bold, .font-semibold, [class*="font-bold"], [class*="font-semibold"] {
                  font-weight: 600 !important;
                }
                .italic, [class*="italic"] {
                  font-style: italic;
                }
                .text-xs, [class*="text-xs"] {
                  font-size: 10px;
                }
                .text-sm, [class*="text-sm"] {
                  font-size: 11px;
                }
                .mb-6, [class*="mb-6"] {
                  margin-bottom: 15px;
                }
                .mb-8, [class*="mb-8"] {
                  margin-bottom: 20px;
                }
                .space-y-1 > * + * {
                  margin-top: 4px;
                }
                .gap-8, [class*="gap-8"] {
                  gap: 20px;
                }
                .flex, [class*="flex"] {
                  display: flex;
                }
                .border-t, [class*="border-t"] {
                  border-top: 1px solid #ccc;
                  padding-top: 10px;
                  margin-top: 10px;
                }
                @media print {
                  body { 
                    -webkit-print-color-adjust: exact !important; 
                    print-color-adjust: exact !important; 
                  }
                  @page { 
                    margin: 10mm; 
                    size: A4; 
                  }
                  th {
                    background-color: #1e3a5f !important;
                    color: #fff !important;
                  }
                }
              </style>
            </head>
            <body>
              ${printContent}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 250);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5" />
            Print Preview: {title}
          </DialogTitle>
        </DialogHeader>
        
        <div 
          ref={printRef} 
          className="bg-white border rounded-lg shadow-inner overflow-auto"
          style={{ maxHeight: "60vh" }}
        >
          {children}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4 mr-2" />
            Close
          </Button>
          <Button onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print Document
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
