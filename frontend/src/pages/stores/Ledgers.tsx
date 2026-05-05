import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ConsumablesLedger from "./ConsumablesLedger";
import PermanentExpendableLedger from "./PermanentExpendableLedger";

export default function Ledgers() {
  return (
    <div className="space-y-4">
      <Tabs defaultValue="s1" className="w-full">
        <TabsList className="grid w-full max-w-2xl grid-cols-2">
          <TabsTrigger value="s1">S1 — Consumables Stores Ledger</TabsTrigger>
          <TabsTrigger value="s2">S2 — Permanent &amp; Expendable Stores Ledger</TabsTrigger>
        </TabsList>
        <TabsContent value="s1" className="mt-4">
          <ConsumablesLedger />
        </TabsContent>
        <TabsContent value="s2" className="mt-4">
          <PermanentExpendableLedger />
        </TabsContent>
      </Tabs>
    </div>
  );
}
