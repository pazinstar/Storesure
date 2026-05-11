import React, { useEffect, useState } from 'react';
import { assetsService } from '@/services/assets.service';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Save, X } from 'lucide-react';

export default function CapitalizationSettings() {
  const [settings, setSettings] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [assetClassesText, setAssetClassesText] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const s = await assetsService.getCapitalizationSettings();
        setSettings(s);
        setAssetClassesText(JSON.stringify(s?.asset_classes || [], null, 2));
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
    if (jsonError) {
      setError('Please fix asset classes JSON before saving');
      return;
    }
    setSaving(true);
    try {
      const payload = { ...settings };
      try {
        payload.asset_classes = JSON.parse(assetClassesText || '[]');
      } catch {
        payload.asset_classes = settings.asset_classes || [];
      }
      const res = await assetsService.updateCapitalizationSettings(payload);
      setSettings(res);
      setAssetClassesText(JSON.stringify(res?.asset_classes || [], null, 2));
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
            <Label>Asset Classes (JSON)</Label>
            <Textarea value={assetClassesText} onChange={(e: any) => onAssetClassesChange(e.target.value)} className="font-mono text-sm" />
            {jsonError ? (
              <div className="text-destructive text-sm">JSON error: {jsonError}</div>
            ) : (
              <div className="text-muted-foreground text-sm">Provide asset classes as a JSON array. Example: {'[{"code":"IT","name":"IT Equipment"}]'}</div>
            )}
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
