import React from 'react';
import { useSearchParams } from 'react-router-dom';
import S2RetryQueue from '@/components/S2RetryQueue';
import CapitalizationQueue from '@/components/CapitalizationQueue';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export default function Queues() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 's2';

  const setTab = (v: string) => setSearchParams({ tab: v });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Queues</h1>

      <div className="bg-card rounded-md border p-4">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="s2" className="gap-2">S2 Retry</TabsTrigger>
            <TabsTrigger value="capitalization" className="gap-2">Capitalization</TabsTrigger>
          </TabsList>

          <TabsContent value="s2">
            <S2RetryQueue inline />
          </TabsContent>

          <TabsContent value="capitalization">
            <CapitalizationQueue inline />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
