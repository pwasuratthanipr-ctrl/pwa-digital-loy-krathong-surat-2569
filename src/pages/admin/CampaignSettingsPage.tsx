import React, { useState, useEffect } from 'react';
import { Sliders, CheckCircle2, AlertCircle, Save } from 'lucide-react';
import { ApiService } from '../../services/api';
import { CampaignSettings } from '../../types';

interface CampaignSettingsPageProps {
  onSuccess: () => void;
}

export const CampaignSettingsPage: React.FC<CampaignSettingsPageProps> = ({ onSuccess }) => {
  const [settings, setSettings] = useState<CampaignSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const s = await ApiService.getSettings();
        setSettings(s);
      } catch (err: any) {
        setError(err.message);
      }
    }
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    setError('');
    setMessage('');

    try {
      const res = await ApiService.updateSettings(settings);
      setMessage(res.message);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'บันทึกไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  if (!settings) {
    return <div className="text-slate-400 text-xs py-8 text-center">กำลังโหลดการตั้งค่า...</div>;
  }

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-heading font-semibold text-lg text-white flex items-center gap-2">
            <Sliders className="w-5 h-5 text-cyan-400" />
            <span>ตั้งค่ากิจกรรมและเป้าหมายองค์กร (Admin Configuration)</span>
          </h4>
          <p className="text-xs text-slate-400">
            ปรับแต่งเป้าหมายกิจกรรม ช่วงเวลา และลิงก์เชื่อมต่อบริการทางการ
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-950/70 border border-rose-500/40 text-rose-300 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {message && (
        <div className="p-3 bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">ชื่อกิจกรรม</label>
            <input
              type="text"
              value={settings.campaign_name}
              onChange={e => setSettings({ ...settings, campaign_name: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">หน่วยงานจัดกิจกรรม</label>
            <input
              type="text"
              value={settings.organization_name}
              onChange={e => setSettings({ ...settings, organization_name: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">วันที่เริ่มต้นกิจกรรม</label>
            <input
              type="datetime-local"
              value={settings.start_date.slice(0, 16)}
              onChange={e => setSettings({ ...settings, start_date: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">วันที่สิ้นสุดกิจกรรม</label>
            <input
              type="datetime-local"
              value={settings.end_date.slice(0, 16)}
              onChange={e => setSettings({ ...settings, end_date: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">เป้าหมายผู้เข้าร่วม (คน)</label>
            <input
              type="number"
              value={settings.target_participants}
              onChange={e => setSettings({ ...settings, target_participants: Number(e.target.value) })}
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">เป้าหมายผู้สมัครใหม่สำเร็จ (คน)</label>
            <input
              type="number"
              value={settings.target_new_registrations}
              onChange={e => setSettings({ ...settings, target_new_registrations: Number(e.target.value) })}
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs"
            />
          </div>

          <div className="space-y-1 sm:col-span-2">
            <label className="text-xs font-semibold text-slate-300">เป้าหมาย Conversion Rate (%)</label>
            <input
              type="number"
              step="0.1"
              value={settings.target_conversion_rate}
              onChange={e => setSettings({ ...settings, target_conversion_rate: Number(e.target.value) })}
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs"
            />
          </div>

          <div className="space-y-1 sm:col-span-2">
            <label className="text-xs font-semibold text-slate-300">URL ทางการแอปพลิเคชัน PWA Plus Life</label>
            <input
              type="url"
              value={settings.official_pwa_app_url}
              onChange={e => setSettings({ ...settings, official_pwa_app_url: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-mono"
            />
          </div>

          <div className="space-y-1 sm:col-span-2">
            <label className="text-xs font-semibold text-slate-300">URL ทางการ LINE Official Account</label>
            <input
              type="url"
              value={settings.official_line_url}
              onChange={e => setSettings({ ...settings, official_line_url: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-mono"
            />
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-200">
            <input
              type="checkbox"
              checked={settings.active_status}
              onChange={e => setSettings({ ...settings, active_status: e.target.checked })}
              className="w-4 h-4 rounded text-cyan-600"
            />
            <span>เปิดรับการร่วมกิจกรรม (Campaign Active Status)</span>
          </label>

          <button
            type="submit"
            disabled={saving}
            className="py-2.5 px-6 bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 text-white font-semibold text-xs rounded-xl shadow flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
