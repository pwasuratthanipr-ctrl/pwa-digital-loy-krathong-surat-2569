import React, { useState, useEffect } from 'react';
import {
  Users,
  Waves,
  Smartphone,
  CheckCircle2,
  TrendingUp,
  Gift,
  Download,
  AlertTriangle,
  RefreshCw,
  LogOut,
  Sliders,
  FileSpreadsheet,
  Activity,
  Layers,
  Database,
  Target,
  Sparkles,
} from 'lucide-react';
import { ApiService, AuthService } from '../../services/api';
import { AdminProfile, DashboardMetrics } from '../../types';
import { StaffRegistrationPage } from './StaffRegistrationPage';
import { AuditLogsPage } from './AuditLogsPage';
import { CampaignSettingsPage } from './CampaignSettingsPage';
import { ParticipantsListPage } from './ParticipantsListPage';

interface AdminDashboardPageProps {
  currentUser: AdminProfile;
  onLogout: () => void;
  onNavigateHome: () => void;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({
  currentUser,
  onLogout,
  onNavigateHome,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'registrations' | 'participants' | 'audit' | 'settings'>('overview');
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [mode, setMode] = useState<'DEMO' | 'PRODUCTION'>('DEMO');
  const [notification, setNotification] = useState<string | null>(null);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const data = await ApiService.getDashboardMetrics();
      setMetrics(data);
      if ((data as any).mode) {
        setMode((data as any).mode);
      }
    } catch (err: any) {
      console.error('Failed to fetch metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      await ApiService.downloadExcel();
      showToast('ส่งออกรายงาน Excel เรียบร้อยแล้ว');
    } catch (err: any) {
      alert('ไม่สามารถส่งออก Excel ได้: ' + err.message);
    } finally {
      setExporting(false);
    }
  };

  const handleToggleMode = async () => {
    const nextMode = mode === 'DEMO' ? 'PRODUCTION' : 'DEMO';
    const confirmSwitch = window.confirm(
      `คุณต้องการสลับเป็น ${nextMode === 'PRODUCTION' ? 'PRODUCTION MODE (ข้อมูลจริง)' : 'DEMO MODE (ข้อมูลจำลองสำหรับทดสอบ)'} หรือไม่?`
    );
    if (!confirmSwitch) return;

    try {
      const res = await ApiService.switchDataMode(nextMode, false);
      setMode(nextMode);
      showToast(res.message);
      fetchMetrics();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Top Header & Role Information */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/90 border border-cyan-500/30 p-5 rounded-2xl shadow-xl backdrop-blur-md">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-heading font-bold text-xl text-white">
              ระบบแดชบอร์ดและการจัดการ กปภ.
            </span>
            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
              mode === 'DEMO'
                ? 'bg-amber-500/20 text-amber-300 border-amber-400/40'
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
            }`}>
              {mode === 'DEMO' ? '● โหมดทดสอบ (DEMO DATA)' : '● โหมดใช้งานจริง (PRODUCTION)'}
            </span>
          </div>
          <p className="text-xs text-slate-300">
            {currentUser.display_name} • ตำแหน่ง: <strong className="text-cyan-300">{currentUser.department}</strong> (สิทธิ์: {currentUser.role})
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {currentUser.role === 'ADMIN' && (
            <button
              onClick={handleToggleMode}
              className="text-xs py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1.5 transition-colors"
              title="สลับโหมดข้อมูลจำลอง / ข้อมูลจริง"
            >
              <Database className="w-3.5 h-3.5 text-amber-400" />
              <span>สลับโหมด ({mode})</span>
            </button>
          )}

          <button
            onClick={handleExportExcel}
            disabled={exporting}
            className="text-xs py-2 px-3.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1.5 shadow transition-all disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{exporting ? 'กำลังสร้างไฟล์...' : 'Export Excel (.xlsx)'}</span>
          </button>

          <button
            onClick={fetchMetrics}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            title="รีเฟรชข้อมูล"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={onLogout}
            className="text-xs py-2 px-3 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-500/40 text-rose-300 flex items-center gap-1.5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>ออกจากระบบ</span>
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {notification && (
        <div className="p-3 bg-emerald-900/80 border border-emerald-400 text-emerald-200 text-xs rounded-xl shadow-lg flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-cyan-800/60 overflow-x-auto gap-2 pb-1">
        <button
          onClick={() => setActiveTab('overview')}
          className={`py-2.5 px-4 rounded-xl text-xs sm:text-sm font-heading font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
            activeTab === 'overview'
              ? 'bg-cyan-600 text-white shadow-md'
              : 'text-slate-300 hover:bg-slate-900'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>แดชบอร์ดภาพรวม (10 KPIs)</span>
        </button>

        <button
          onClick={() => setActiveTab('registrations')}
          className={`py-2.5 px-4 rounded-xl text-xs sm:text-sm font-heading font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
            activeTab === 'registrations'
              ? 'bg-cyan-600 text-white shadow-md'
              : 'text-slate-300 hover:bg-slate-900'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>ตรวจสอบและบันทึกผลการสมัคร (Staff)</span>
        </button>

        <button
          onClick={() => setActiveTab('participants')}
          className={`py-2.5 px-4 rounded-xl text-xs sm:text-sm font-heading font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
            activeTab === 'participants'
              ? 'bg-cyan-600 text-white shadow-md'
              : 'text-slate-300 hover:bg-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>รายชื่อผู้เข้าร่วมทั้งหมด</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`py-2.5 px-4 rounded-xl text-xs sm:text-sm font-heading font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
            activeTab === 'audit'
              ? 'bg-cyan-600 text-white shadow-md'
              : 'text-slate-300 hover:bg-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Audit Logs</span>
        </button>

        {currentUser.role === 'ADMIN' && (
          <button
            onClick={() => setActiveTab('settings')}
            className={`py-2.5 px-4 rounded-xl text-xs sm:text-sm font-heading font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
              activeTab === 'settings'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-300 hover:bg-slate-900'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>ตั้งค่ากิจกรรม</span>
          </button>
        )}
      </div>

      {/* TAB 1: OVERVIEW & 10 KPIS */}
      {activeTab === 'overview' && metrics && (
        <div className="space-y-8 animate-in fade-in duration-200">
          
          {/* Target Progress Bar Callout */}
          <div className="bg-gradient-to-r from-[#073B66] via-[#052949] to-[#073B66] border border-amber-400/40 p-6 rounded-3xl shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <span className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                  <Target className="w-4 h-4" />
                  <span>ความคืบหน้าเทียบเป้าหมายกิจกรรมประจำปี ๒๕๖๙</span>
                </span>
                <h3 className="font-heading font-bold text-xl text-white mt-1">
                  ยอดสมัครบริการออนไลน์รายใหม่ที่ตรวจสอบสำเร็จ
                </h3>
              </div>
              <div className="text-right">
                <span className="font-heading font-extrabold text-3xl text-amber-300">
                  {metrics.totalVerifiedNewRegistrations}
                </span>
                <span className="text-slate-300 text-sm"> / {metrics.targetNewRegistrations} คน</span>
                <span className="block text-xs text-emerald-400 font-semibold">
                  ({((metrics.totalVerifiedNewRegistrations / (metrics.targetNewRegistrations || 1)) * 100).toFixed(1)}% ของเป้าหมาย)
                </span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full h-3 rounded-full bg-slate-950 overflow-hidden border border-slate-700">
              <div
                style={{
                  width: `${Math.min(100, (metrics.totalVerifiedNewRegistrations / (metrics.targetNewRegistrations || 1)) * 100)}%`,
                }}
                className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-amber-400 transition-all duration-500"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4 pt-3 border-t border-cyan-800/60 text-xs">
              <div>
                <span className="text-slate-400">เป้าหมายผู้เข้าร่วม:</span>
                <span className="ml-1 text-white font-semibold">{metrics.targetParticipants} คน</span>
                <span className="ml-1 text-cyan-300">({metrics.totalParticipants} คนจริง)</span>
              </div>
              <div>
                <span className="text-slate-400">เป้าหมาย Conversion Rate:</span>
                <span className="ml-1 text-white font-semibold">{metrics.targetConversionRate}%</span>
                <span className={`ml-1 font-semibold ${metrics.conversionRate >= metrics.targetConversionRate ? 'text-emerald-400' : 'text-amber-400'}`}>
                  (ปัจจุบัน {metrics.conversionRate}%)
                </span>
              </div>
              <div>
                <span className="text-slate-400">รูปแบบกิจกรรม:</span>
                <span className="ml-1 text-white font-semibold">ลอยกระทงออนไลน์ ส่งความสุข ไม่เพิ่มขยะ</span>
              </div>
            </div>
          </div>

          {/* 10 Required KPI Cards */}
          <div>
            <h3 className="font-heading font-bold text-lg text-white mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-cyan-400" />
              <span>ตัวชี้วัดหลัก 10 ด้าน (Mandatory KPIs)</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              
              {/* 1. จำนวนผู้เข้าชมเว็บไซต์ */}
              <div className="glass-panel p-4 rounded-2xl space-y-1">
                <span className="text-[11px] text-slate-400 block">1. ผู้เข้าชมเว็บไซต์</span>
                <div className="font-heading font-bold text-2xl text-white">
                  {metrics.totalVisitors.toLocaleString()}
                </div>
                <span className="text-[10px] text-slate-400">ครั้ง (โดยประมาณ)</span>
              </div>

              {/* 2. จำนวนผู้ร่วมกิจกรรม */}
              <div className="glass-panel p-4 rounded-2xl space-y-1 border-t-2 border-t-cyan-400">
                <span className="text-[11px] text-cyan-300 block">2. ผู้ร่วมกิจกรรมไม่ซ้ำ</span>
                <div className="font-heading font-bold text-2xl text-cyan-300">
                  {metrics.totalParticipants.toLocaleString()}
                </div>
                <span className="text-[10px] text-slate-400">คน</span>
              </div>

              {/* 3. จำนวนกระทงที่ลอยสำเร็จ */}
              <div className="glass-panel p-4 rounded-2xl space-y-1">
                <span className="text-[11px] text-slate-400 block">3. กระทงที่ลอยสำเร็จ</span>
                <div className="font-heading font-bold text-2xl text-blue-300">
                  {metrics.totalFloatedKrathongs.toLocaleString()}
                </div>
                <span className="text-[10px] text-slate-400">กระทง</span>
              </div>

              {/* 4. ผู้สนใจสมัครบริการออนไลน์ */}
              <div className="glass-panel p-4 rounded-2xl space-y-1">
                <span className="text-[11px] text-slate-400 block">4. สนใจบริการออนไลน์</span>
                <div className="font-heading font-bold text-2xl text-amber-300">
                  {metrics.totalInterestedRegistrations.toLocaleString()}
                </div>
                <span className="text-[10px] text-slate-400">รายการบันทึก</span>
              </div>

              {/* 5. สมัครใหม่ที่ตรวจสอบสำเร็จ (KEY) */}
              <div className="glass-panel-gold p-4 rounded-2xl space-y-1 border-2 border-emerald-400/60 shadow-lg">
                <span className="text-[11px] font-semibold text-emerald-300 block">5. สมัครใหม่สำเร็จ (ตรวจแล้ว)</span>
                <div className="font-heading font-extrabold text-2xl text-emerald-400">
                  {metrics.totalVerifiedNewRegistrations.toLocaleString()}
                </div>
                <span className="text-[10px] text-emerald-200">คน (นับเป็นยอดสำเร็จ)</span>
              </div>

              {/* 6. ผู้ใช้บริการออนไลน์เดิม */}
              <div className="glass-panel p-4 rounded-2xl space-y-1">
                <span className="text-[11px] text-slate-400 block">6. ผู้ใช้บริการเดิม</span>
                <div className="font-heading font-bold text-2xl text-sky-200">
                  {metrics.totalExistingUsers.toLocaleString()}
                </div>
                <span className="text-[10px] text-slate-400">คน (มีบัญชีแล้ว)</span>
              </div>

              {/* 7. สมัครไม่สำเร็จ */}
              <div className="glass-panel p-4 rounded-2xl space-y-1">
                <span className="text-[11px] text-slate-400 block">7. สมัครไม่สำเร็จ / ไม่ผ่าน</span>
                <div className="font-heading font-bold text-2xl text-rose-400">
                  {metrics.totalFailedRegistrations.toLocaleString()}
                </div>
                <span className="text-[10px] text-slate-400">คน</span>
              </div>

              {/* 8. Conversion Rate */}
              <div className="glass-panel p-4 rounded-2xl space-y-1 border-t-2 border-t-amber-400">
                <span className="text-[11px] text-amber-300 block">8. Conversion Rate</span>
                <div className="font-heading font-extrabold text-2xl text-amber-400">
                  {metrics.conversionRate}%
                </div>
                <span className="text-[10px] text-slate-400">(สมัครใหม่ ÷ ผู้ร่วมงาน)</span>
              </div>

              {/* 9. ผู้เข้าร่วมจากเว็บตรง */}
              <div className="glass-panel p-4 rounded-2xl space-y-1">
                <span className="text-[11px] text-slate-400 block">9. เข้าร่วมผ่านเว็บไซต์ตรง</span>
                <div className="font-heading font-bold text-2xl text-purple-300">
                  {(metrics.channelDistribution.find(c => c.channel === 'เว็บไซต์ตรง')?.count || 0).toLocaleString()}
                </div>
                <span className="text-[10px] text-slate-400">คน</span>
              </div>

              {/* 10. ผู้เข้าร่วมผ่าน LINE & บูธ กปภ. */}
              <div className="glass-panel p-4 rounded-2xl space-y-1">
                <span className="text-[11px] text-slate-400 block">10. ผ่าน LINE & สแกน QR</span>
                <div className="font-heading font-bold text-2xl text-cyan-300">
                  {((metrics.channelDistribution.find(c => c.channel === 'สแกน QR บูธ กปภ.')?.count || 0) + (metrics.channelDistribution.find(c => c.channel === 'LINE กปภ.')?.count || 0)).toLocaleString()}
                </div>
                <span className="text-[10px] text-slate-400">คน</span>
              </div>

            </div>
          </div>

          {/* Charts & Analytical Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Daily Trend Chart (Visual Bar Representation) */}
            <div className="bg-slate-900/90 border border-cyan-500/30 p-6 rounded-3xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-heading font-semibold text-base text-white">
                    แนวโน้มผู้ร่วมกิจกรรมและยอดสมัครใหม่รายวัน
                  </h4>
                  <p className="text-xs text-slate-400">เปรียบเทียบผู้เข้าร่วม vs สมัครบริการสำเร็จ</p>
                </div>
                <TrendingUp className="w-5 h-5 text-cyan-400" />
              </div>

              <div className="space-y-3 pt-2">
                {metrics.dailyStats.map(d => {
                  const maxVal = Math.max(...metrics.dailyStats.map(s => s.participants), 10);
                  const pWidth = (d.participants / maxVal) * 100;
                  const rWidth = (d.newRegistrations / maxVal) * 100;

                  return (
                    <div key={d.date} className="space-y-1 text-xs">
                      <div className="flex justify-between text-slate-300 font-mono text-[11px]">
                        <span>{d.date}</span>
                        <span>
                          ผู้ร่วม {d.participants} คน | สมัครใหม่ {d.newRegistrations} คน (สะสม {d.cumulativeRegistrations})
                        </span>
                      </div>
                      <div className="w-full h-4 bg-slate-950 rounded-lg overflow-hidden flex gap-1 p-0.5 border border-slate-800">
                        <div
                          style={{ width: `${pWidth}%` }}
                          className="h-full bg-cyan-600 rounded-sm"
                          title={`ผู้เข้าร่วม: ${d.participants}`}
                        />
                        <div
                          style={{ width: `${rWidth}%` }}
                          className="h-full bg-emerald-500 rounded-sm"
                          title={`สมัครใหม่สำเร็จ: ${d.newRegistrations}`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-400 pt-2 border-t border-slate-800">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 bg-cyan-600 rounded-sm" />
                  <span>ผู้เข้าร่วมกิจกรรม</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 bg-emerald-500 rounded-sm" />
                  <span>ผู้สมัครใหม่สำเร็จ</span>
                </div>
              </div>
            </div>

            {/* Customer Status Breakdown */}
            <div className="bg-slate-900/90 border border-cyan-500/30 p-6 rounded-3xl space-y-4">
              <div>
                <h4 className="font-heading font-semibold text-base text-white">
                  สัดส่วนสถานะการสมัครบริการออนไลน์ กปภ.
                </h4>
                <p className="text-xs text-slate-400">การจัดกลุ่มลูกค้า 5 สถานะตามข้อกำหนด</p>
              </div>

              <div className="space-y-3 pt-2">
                {metrics.customerStatusDistribution.map(item => {
                  const total = metrics.customerStatusDistribution.reduce((acc, c) => acc + c.value, 0) || 1;
                  const pct = ((item.value / total) * 100).toFixed(1);

                  return (
                    <div key={item.name} className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-200 font-medium">{item.name}</span>
                        <span className="text-slate-300 font-mono">
                          {item.value} คน ({pct}%)
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                        <div
                          style={{ width: `${pct}%`, backgroundColor: item.color }}
                          className="h-full rounded-full transition-all"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Channels & Krathong Popularity mini stats */}
              <div className="pt-4 border-t border-slate-800 grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block mb-1 font-semibold">ช่องทางเข้าร่วม:</span>
                  {metrics.channelDistribution.map(ch => (
                    <div key={ch.channel} className="flex justify-between text-slate-300 py-0.5">
                      <span>{ch.channel}</span>
                      <span className="font-mono">{ch.count}</span>
                    </div>
                  ))}
                </div>

                <div>
                  <span className="text-slate-400 block mb-1 font-semibold">กระทงยอดนิยม:</span>
                  {metrics.krathongTypeDistribution.map(kr => (
                    <div key={kr.type} className="flex justify-between text-slate-300 py-0.5">
                      <span className="truncate">{kr.type}</span>
                      <span className="font-mono">{kr.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* TAB 2: STAFF REGISTRATION VERIFICATION */}
      {activeTab === 'registrations' && (
        <StaffRegistrationPage
          currentUser={currentUser}
          onSuccess={() => {
            fetchMetrics();
            showToast('บันทึกผลการตรวจสอบเรียบร้อยแล้ว');
          }}
        />
      )}

      {/* TAB 3: PARTICIPANTS LIST */}
      {activeTab === 'participants' && (
        <ParticipantsListPage />
      )}

      {/* TAB 5: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <AuditLogsPage />
      )}

      {/* TAB 6: SETTINGS */}
      {activeTab === 'settings' && (
        <CampaignSettingsPage
          onSuccess={() => {
            fetchMetrics();
            showToast('บันทึกการตั้งค่ากิจกรรมสำเร็จ');
          }}
        />
      )}

    </div>
  );
};
