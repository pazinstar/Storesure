import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import BulkCapitalization from './BulkCapitalization';
import CapitalizationSettings from './CapitalizationSettings';

export default function Capitalization() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const initialTab = params.get('tab') === 'settings' ? 'settings' : 'prompts';
  const [activeTab, setActiveTab] = useState<string>(initialTab);

  useEffect(() => {
    const p = new URLSearchParams(location.search);
    const t = p.get('tab') === 'settings' ? 'settings' : 'prompts';
    setActiveTab(t);
  }, [location.search]);

  const onTabChange = (val: string) => {
    setActiveTab(val);
    const p = new URLSearchParams(location.search);
    if (val === 'settings') p.set('tab', 'settings'); else p.delete('tab');
    navigate({ pathname: location.pathname, search: p.toString() }, { replace: true });
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">Capitalization</h1>
          <p className="text-sm text-muted-foreground">Manage capitalization prompts and grouping</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={onTabChange}>
        <TabsList>
          <TabsTrigger value="prompts">Capitalization</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="prompts" className="mt-4">
          <BulkCapitalization />
        </TabsContent>

        <TabsContent value="settings" className="mt-4">
          <CapitalizationSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
