import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSchool } from '@/contexts/SchoolContext';
import { useAuditLog } from '@/hooks/useAuditLog';
import { Upload, Palette, Eye, Save, RotateCcw, Building2 } from 'lucide-react';
import { toast } from 'sonner';

const SchoolBranding = () => {
  const { schools, currentSchool, setCurrentSchool, updateSchool, updateSchoolBranding } = useSchool();
  const { logSystemAction } = useAuditLog();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [schoolName, setSchoolName] = useState(currentSchool?.name || '');
  const [branding, setBranding] = useState({
    logo: currentSchool?.branding.logo || '',
    primaryColor: currentSchool?.branding.primaryColor || '#2563eb',
    secondaryColor: currentSchool?.branding.secondaryColor || '#64748b',
    accentColor: currentSchool?.branding.accentColor || '#f59e0b',
  });

  const handleSchoolChange = (schoolId: string) => {
    setCurrentSchool(schoolId);
    const school = schools.find(s => s.id === schoolId);
    if (school) {
      setSchoolName(school.name);
      setBranding({
        logo: school.branding.logo || '',
        primaryColor: school.branding.primaryColor,
        secondaryColor: school.branding.secondaryColor,
        accentColor: school.branding.accentColor,
      });
    }
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Logo file must be less than 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setBranding(prev => ({ ...prev, logo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (!currentSchool) {
      toast.error('Please select a school first');
      return;
    }

    updateSchool(currentSchool.id, { name: schoolName });
    updateSchoolBranding(currentSchool.id, branding);
    logSystemAction('Updated branding', `Updated branding for: ${schoolName}`);
    toast.success('Branding settings saved successfully');
  };

  const handleReset = () => {
    if (currentSchool) {
      setSchoolName(currentSchool.name);
      setBranding({
        logo: currentSchool.branding.logo || '',
        primaryColor: currentSchool.branding.primaryColor,
        secondaryColor: currentSchool.branding.secondaryColor,
        accentColor: currentSchool.branding.accentColor,
      });
    }
  };

  const colorPresets = [
    { name: 'Blue Theme', primary: '#2563eb', secondary: '#64748b', accent: '#f59e0b' },
    { name: 'Green Theme', primary: '#059669', secondary: '#6b7280', accent: '#8b5cf6' },
    { name: 'Red Theme', primary: '#dc2626', secondary: '#71717a', accent: '#0ea5e9' },
    { name: 'Purple Theme', primary: '#7c3aed', secondary: '#6b7280', accent: '#10b981' },
    { name: 'Teal Theme', primary: '#0d9488', secondary: '#64748b', accent: '#f97316' },
  ];

  const applyPreset = (preset: typeof colorPresets[0]) => {
    setBranding(prev => ({
      ...prev,
      primaryColor: preset.primary,
      secondaryColor: preset.secondary,
      accentColor: preset.accent,
    }));
  };

  return (
    <div className="p-6 overflow-auto">
      <div className="max-w-5xl mx-auto space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground">School Branding</h1>
              <p className="text-muted-foreground mt-1">
                Customize your school's logo, name, and color scheme
              </p>
            </div>

            {/* School Selector */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Select School</CardTitle>
                <CardDescription>Choose which school's branding to customize</CardDescription>
              </CardHeader>
              <CardContent>
                <Select value={currentSchool?.id || ''} onValueChange={handleSchoolChange}>
                  <SelectTrigger className="w-full md:w-96">
                    <SelectValue placeholder="Select a school" />
                  </SelectTrigger>
                  <SelectContent>
                    {schools.map((school) => (
                      <SelectItem key={school.id} value={school.id}>
                        {school.name} ({school.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {currentSchool && (
              <div className="grid gap-6 md:grid-cols-2">
                {/* Logo & Name */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Upload className="h-5 w-5" />
                      Logo & Identity
                    </CardTitle>
                    <CardDescription>Upload your school logo and update the name</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="schoolName">School Name</Label>
                      <Input
                        id="schoolName"
                        value={schoolName}
                        onChange={(e) => setSchoolName(e.target.value)}
                        placeholder="Enter school name"
                      />
                    </div>

                    <div className="space-y-3">
                      <Label>School Logo</Label>
                      <div className="flex items-center gap-4">
                        <div 
                          className="w-24 h-24 border-2 border-dashed border-border rounded-lg flex items-center justify-center bg-muted/50 overflow-hidden"
                        >
                          {branding.logo ? (
                            <img src={branding.logo} alt="School logo" className="w-full h-full object-contain" />
                          ) : (
                            <Building2 className="h-8 w-8 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button 
                            variant="outline" 
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Upload Logo
                          </Button>
                          {branding.logo && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setBranding(prev => ({ ...prev, logo: '' }))}
                            >
                              Remove
                            </Button>
                          )}
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            className="hidden"
                          />
                          <p className="text-xs text-muted-foreground">
                            PNG, JPG up to 2MB. Recommended: 200x200px
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Color Scheme */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Palette className="h-5 w-5" />
                      Color Scheme
                    </CardTitle>
                    <CardDescription>Define your school's brand colors</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="primaryColor">Primary Color</Label>
                        <div className="flex gap-2">
                          <Input
                            id="primaryColor"
                            type="color"
                            value={branding.primaryColor}
                            onChange={(e) => setBranding(prev => ({ ...prev, primaryColor: e.target.value }))}
                            className="w-14 h-10 p-1 cursor-pointer"
                          />
                          <Input
                            value={branding.primaryColor}
                            onChange={(e) => setBranding(prev => ({ ...prev, primaryColor: e.target.value }))}
                            className="flex-1"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="secondaryColor">Secondary Color</Label>
                        <div className="flex gap-2">
                          <Input
                            id="secondaryColor"
                            type="color"
                            value={branding.secondaryColor}
                            onChange={(e) => setBranding(prev => ({ ...prev, secondaryColor: e.target.value }))}
                            className="w-14 h-10 p-1 cursor-pointer"
                          />
                          <Input
                            value={branding.secondaryColor}
                            onChange={(e) => setBranding(prev => ({ ...prev, secondaryColor: e.target.value }))}
                            className="flex-1"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="accentColor">Accent Color</Label>
                        <div className="flex gap-2">
                          <Input
                            id="accentColor"
                            type="color"
                            value={branding.accentColor}
                            onChange={(e) => setBranding(prev => ({ ...prev, accentColor: e.target.value }))}
                            className="w-14 h-10 p-1 cursor-pointer"
                          />
                          <Input
                            value={branding.accentColor}
                            onChange={(e) => setBranding(prev => ({ ...prev, accentColor: e.target.value }))}
                            className="flex-1"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Color Presets</Label>
                      <div className="flex flex-wrap gap-2">
                        {colorPresets.map((preset) => (
                          <Button
                            key={preset.name}
                            variant="outline"
                            size="sm"
                            onClick={() => applyPreset(preset)}
                            className="gap-2"
                          >
                            <div className="flex gap-1">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: preset.primary }}
                              />
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: preset.accent }}
                              />
                            </div>
                            {preset.name}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Preview */}
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="h-5 w-5" />
                      Brand Preview
                    </CardTitle>
                    <CardDescription>See how your branding will appear</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div 
                      className="rounded-lg p-6 border"
                      style={{ backgroundColor: `${branding.primaryColor}10` }}
                    >
                      <div className="flex items-center gap-4 mb-6">
                        <div 
                          className="w-16 h-16 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: branding.primaryColor }}
                        >
                          {branding.logo ? (
                            <img src={branding.logo} alt="Logo" className="w-12 h-12 object-contain" />
                          ) : (
                            <Building2 className="h-8 w-8 text-white" />
                          )}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold" style={{ color: branding.primaryColor }}>
                            {schoolName || 'School Name'}
                          </h3>
                          <p style={{ color: branding.secondaryColor }}>
                            StoreSure Management System
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <Button 
                          style={{ 
                            backgroundColor: branding.primaryColor,
                            color: 'white'
                          }}
                        >
                          Primary Button
                        </Button>
                        <Button 
                          variant="outline"
                          style={{ 
                            borderColor: branding.secondaryColor,
                            color: branding.secondaryColor
                          }}
                        >
                          Secondary Button
                        </Button>
                        <Button 
                          style={{ 
                            backgroundColor: branding.accentColor,
                            color: 'white'
                          }}
                        >
                          Accent Button
                        </Button>
                      </div>

                      <div className="mt-6 flex gap-4">
                        <div className="flex-1 p-4 rounded-lg" style={{ backgroundColor: branding.primaryColor }}>
                          <p className="text-white text-sm font-medium">Primary</p>
                          <p className="text-white/70 text-xs">{branding.primaryColor}</p>
                        </div>
                        <div className="flex-1 p-4 rounded-lg" style={{ backgroundColor: branding.secondaryColor }}>
                          <p className="text-white text-sm font-medium">Secondary</p>
                          <p className="text-white/70 text-xs">{branding.secondaryColor}</p>
                        </div>
                        <div className="flex-1 p-4 rounded-lg" style={{ backgroundColor: branding.accentColor }}>
                          <p className="text-white text-sm font-medium">Accent</p>
                          <p className="text-white/70 text-xs">{branding.accentColor}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Action Buttons */}
            {currentSchool && (
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={handleReset}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset Changes
                </Button>
                <Button onClick={handleSave}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Branding
                </Button>
              </div>
            )}
          </div>
    </div>
  );
};

export default SchoolBranding;
