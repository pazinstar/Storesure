import React, { useEffect, useState } from 'react';
import { assetsService } from '@/services/assets.service';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Save, X, Plus } from 'lucide-react';

export default function CapitalizationSettings() {
  const [settings, setSettings] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [assetClassesText, setAssetClassesText] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [assetClasses, setAssetClasses] = useState<{ code: string; name: string }[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const s = await assetsService.getCapitalizationSettings();
        setSettings(s);
        setAssetClassesText(JSON.stringify(s?.asset_classes || [], null, 2));
        setAssetClasses((s?.asset_classes || []).map((c: any) => ({ code: c.code || '', name: c.name || '' })));
      } catch (e: any) {
        setError(e.message || 'Failed to load settings');
      }
    })();
  }, []);

  const onChange = (field: string, value: any) => {
    setSettings((prev: any) => ({ ...prev, [field]: value }));
  };

  const onAssetClassesChange = (text: string) => {
    setAssetClassesText(text);
    try {
      JSON.parse(text || '[]');
      setJsonError(null);
    } catch (e: any) {
      setJsonError(e.message || 'Invalid JSON');
    }
  };

  const save = async () => {
    setError(null);
    setSaving(true);
    try {
      const payload = { ...settings };
      if (assetClasses && assetClasses.length) {
        payload.asset_classes = assetClasses.map(a => ({ code: a.code, name: a.name }));
      } else {
        if (jsonError) {
          setError('Please fix asset classes JSON before saving');
          setSaving(false);
          return;
        }
        try {
          payload.asset_classes = JSON.parse(assetClassesText || '[]');
        } catch {
          payload.asset_classes = settings.asset_classes || [];
        }
      }
      const res = await assetsService.updateCapitalizationSettings(payload);
      setSettings(res);
      setAssetClassesText(JSON.stringify(res?.asset_classes || [], null, 2));
      setAssetClasses((res?.asset_classes || []).map((c: any) => ({ code: c.code || '', name: c.name || '' })));
      toast.success('Settings saved');
    } catch (e: any) {
      setError(e.message || 'Failed to save');
      toast.error(e.message || 'Failed to save');
    }
    setSaving(false);
  };

  if (error) return <div className="text-destructive">{error}</div>;
  if (!settings) return <div>Loading...</div>;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between w-full">
          <div>
            <CardTitle>Capitalization Settings</CardTitle>
            <p className="text-sm text-muted-foreground">Configure asset capitalization thresholds and defaults</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => { setSettings(null); /* reload */ window.location.reload(); }}>
              <X className="h-4 w-4" />
            </Button>
            <Button onClick={save} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <Label>Capitalization Threshold (KES)</Label>
            <Input type="number" value={settings.threshold ?? ''} onChange={(e: any) => onChange('threshold', Number(e.target.value))} />

            <Label>Bulk Materiality (KES)</Label>
            <Input type="number" value={settings.bulk_materiality ?? ''} onChange={(e: any) => onChange('bulk_materiality', Number(e.target.value))} />

            <Label>Minimum Useful Life (months)</Label>
            <Input type="number" value={settings.min_useful_life ?? ''} onChange={(e: any) => onChange('min_useful_life', Number(e.target.value))} />

            <Label>Default Residual (%)</Label>
            <Input type="number" step="0.1" value={settings.default_residual_pct ?? ''} onChange={(e: any) => onChange('default_residual_pct', Number(e.target.value))} />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Asset Classes</Label>
              <div>
                <Button size="sm" onClick={() => setAssetClasses([...assetClasses, { code: '', name: '' }])} className="flex items-center gap-2"><Plus className="h-4 w-4" />Add Class</Button>
              </div>
            </div>

            <div className="border rounded-md overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="p-2 text-left">Code</th>
                    <th className="p-2 text-left">Name</th>
                    <th className="p-2"> </th>
                  </tr>
                </thead>
                <tbody>
                  {assetClasses.map((c, i) => (
                    <tr key={i} className="border-t">
                      <td className="p-2 w-36">
                        <Input value={c.code} onChange={(e: any) => setAssetClasses(assetClasses.map((ac, idx) => idx === i ? { ...ac, code: e.target.value } : ac))} />
                      </td>
                      <td className="p-2">
                        <Input value={c.name} onChange={(e: any) => setAssetClasses(assetClasses.map((ac, idx) => idx === i ? { ...ac, name: e.target.value } : ac))} />
                      </td>
                      <td className="p-2 text-center">
                        <Button size="sm" variant="destructive" onClick={() => setAssetClasses(assetClasses.filter((_, idx) => idx !== i))}>
                          <X className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {assetClasses.length === 0 && <div className="text-muted-foreground text-sm">No asset classes defined.</div>}
          </div>
        </div>

        <Separator className="my-4" />

        <div className="flex justify-end">
          <Button variant="outline" className="mr-2" onClick={() => { setAssetClassesText(JSON.stringify(settings.asset_classes || [], null, 2)); setError(null); setJsonError(null); }}>
            Reset
          </Button>
          <Button onClick={save} disabled={saving || !!jsonError}>
            <Save className="h-4 w-4 mr-2" />{saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
