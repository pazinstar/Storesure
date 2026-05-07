import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import LSOPrintTemplate, { LSOPrintData } from "@/components/prints/LSOPrintTemplate";
import { api } from "@/services/api";
import PrintDialog from "@/components/prints/PrintDialog";

export default function LsoPrintPage() {
  const { id } = useParams();
  const [data, setData] = useState<LSOPrintData | null>(null);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await fetch(`/api/v1/storekeeper/stores/lsos/${id}/`);
        if (!res.ok) throw new Error('Not found');
        const json = await res.json();
        // Map minimal fields into LSOPrintData
        const mapped: LSOPrintData = {
          lsoNumber: json.lsoNumber || json.id,
          date: json.createdAt ? new Date(json.createdAt).toLocaleDateString() : '',
          requisitionRef: '',
          items: [],
          subtotal: json.totalValue || 0,
          vat: 0,
          totalCost: json.totalValue || 0,
          serviceProviderName: json.supplierName || '',
          description: json.description || '',
        } as unknown as LSOPrintData;
        setData(mapped);
      } catch (err) {
        setData(null);
      }
    })();
  }, [id]);

  if (!data) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6">
      <PrintDialog open={open} onOpenChange={setOpen} title={`LSO: ${data.lsoNumber}`}>
        <LSOPrintTemplate data={data} />
      </PrintDialog>
    </div>
  );
}
