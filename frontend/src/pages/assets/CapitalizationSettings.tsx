import React, { useEffect, useState } from 'react';
import { assetsService } from '@/services/assets.service';

export default function CapitalizationSettings() {
  const [settings, setSettings] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const s = await assetsService.getCapitalizationSettings();
        setSettings(s);
      } catch (e: any) {
        setError(e.message || 'Failed to load settings');
      }
    })();
  }, []);

  const onChange = (field: string, value: any) => {
    setSettings((prev: any) => ({ ...prev, [field]: value }));
  };

  const save = async () => {
    setError(null);
    setSaving(true);
    try {
      const res = await assetsService.updateCapitalizationSettings(settings);
      setSettings(res);
    } catch (e: any) {
      setError(e.message || 'Failed to save');
    }
    setSaving(false);
  };

  if (error) return <div className="text-red-600">{error}</div>;
  if (!settings) return <div>Loading...</div>;

  return (
    <div>
      <h2 className="text-lg font-medium">Capitalization Settings</h2>
      <div className="grid grid-cols-2 gap-4 mt-4">
        <label className="block">
          <div className="text-sm">Capitalization Threshold (KES)</div>
          <input className="w-full mt-1 p-2 border" value={settings.threshold} onChange={(e) => onChange('threshold', e.target.value)} />
        </label>
        <label className="block">
          <div className="text-sm">Bulk Materiality (KES)</div>
          <input className="w-full mt-1 p-2 border" value={settings.bulk_materiality} onChange={(e) => onChange('bulk_materiality', e.target.value)} />
        </label>
        <label className="block">
          <div className="text-sm">Minimum Useful Life (months)</div>
          <input className="w-full mt-1 p-2 border" value={settings.min_useful_life} onChange={(e) => onChange('min_useful_life', e.target.value)} />
        </label>
        <label className="block">
          <div className="text-sm">Default Residual (%)</div>
          <input className="w-full mt-1 p-2 border" value={settings.default_residual_pct} onChange={(e) => onChange('default_residual_pct', e.target.value)} />
        </label>
      </div>

      <div className="mt-4">
        <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save Settings'}</button>
      </div>

      <div className="mt-4">
        <h3 className="text-md font-semibold">Raw asset_classes</h3>
        <textarea className="w-full h-40 p-2 border mt-2" value={JSON.stringify(settings.asset_classes || [], null, 2)} onChange={(e) => onChange('asset_classes', JSON.parse(e.target.value || '[]'))} />
      </div>
    </div>
  );
}
