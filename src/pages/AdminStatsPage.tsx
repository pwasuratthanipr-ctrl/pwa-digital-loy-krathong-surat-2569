import React, { useState, useEffect } from 'react';
import {
  Users,
  Waves,
  Smartphone,
  CheckCircle2,
  Download,
  RefreshCw,
  ArrowLeft,
  Lock,
  Unlock,
  ShieldCheck,
  TrendingUp,
  MessageCircle,
  Globe,
  FileSpreadsheet,
  Calendar,
  Sparkles,
  BarChart3,
  Clock,
  Eye,
  KeyRound,
} from 'lucide-react';
import { StorageService } from '../services/storageService';
import { AdminStats } from '../types';
import { soundService } from '../services/soundService';
import { APP_CONFIG } from '../config/appConfig';

interface AdminStatsPageProps {
  onNavigate: (path: string) => void;
}

export const AdminStatsPage: React.FC<AdminStatsPageProps> = ({ onNavigate }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'PARTICIPANTS' | 'SERVICES'>('OVERVIEW');
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const loadStats = () => {
    setRefreshing(true);
    const data = StorageService.getAdminStats();
    setStats(data);
    setTimeout(() => setRefreshing(false), 300);
  };

  useEffect(() => {
    // Check if previously unlocked in this session
    const isUnlocked = sessionStorage.getItem('pwa_admin_unlocked') === 'true';
    if (isUnlocked) {
      setIsAuthenticated(true);
      loadStats();
    }
  }, []);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.trim() === APP_CONFIG.ADMIN_SETTINGS.DEFAULT_PIN) {
      soundService.playCelebration();
      setIsAuthenticated(true);
      sessionStorage.setItem('pwa_admin_unlocked', 'true');
      setPinError('');
      loadStats();
    } else {
      soundService.playWaterDrop();
      setPinError(`รหัสผ่านไม่ถูกต้อง (คำใบ้: สายด่วน กปภ. ${APP_CONFIG.ADMIN_SETTINGS.HOTLINE})`);
    }
  };

  const handleExportCSV = () => {
    soundService.playCapture();
    StorageService.exportStatsToCSV();
  };

  // Lock Screen for Staff PIN
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 sm:py-24">
        <div className="bg-gradient-to-b from-[#073B66] via-[#052949] to-[#031d34] rounded-3xl p-6 sm:p-8 border border-cyan-500/30 shadow-2xl space-y-6 text-center">
          
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-950/60">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-cyan-300 tracking-wide uppercase">
              {APP_CONFIG.ORGANIZATION.NAME_TH}
            </span>
            <h1 className="font-heading font-extrabold text-2xl text-white">
              ระบบตรวจสอบสถิติผู้ดูแลระบบ
            </h1>
            <p className="text-xs text-slate-300">
              กรุณากรอกรหัสผ่านเจ้าหน้าที่เพื่อเข้าสู่หน้าแดชบอร์ดสรุปผล
            </p>
          </div>

          <form onSubmit={handleUnlock} className="space-y-4">
            <div className="space-y-1 text-left">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-amber-300" />
                <span>รหัสผ่านเจ้าหน้าที่ (PIN Code):</span>
              </label>
              <input
                type="password"
                maxLength={6}
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  if (pinError) setPinError('');
                }}
                placeholder="กรอกรหัส 4 หลัก"
                className="w-full text-center tracking-widest text-xl font-mono py-3 px-4 rounded-xl bg-slate-900 border border-cyan-500/40 text-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder:text-slate-600 placeholder:text-sm placeholder:tracking-normal"
                autoFocus
              />
              {pinError && (
                <p className="text-xs text-rose-400 mt-1">{pinError}</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-heading font-bold text-sm shadow-xl shadow-amber-950/50 flex items-center justify-center gap-2 transition-all hover:scale-102 active:scale-98 cursor-pointer"
            >
              <Unlock className="w-4 h-4" />
              <span>เข้าสู่แดชบอร์ด</span>
            </button>
          </form>

          <div className="pt-2 border-t border-cyan-900/60 text-center">
            <p className="text-[11px] text-slate-400">
              💡 เจ้าหน้าที่ กปภ. สามารถใช้รหัสสายด่วน <strong className="text-amber-300">{APP_CONFIG.ADMIN_SETTINGS.HOTLINE}</strong> ในการเข้าสู่ระบบ
            </p>
          </div>

          <div>
            <button
              onClick={() => onNavigate('/')}
              className="text-xs text-sky-300 hover:text-white flex items-center justify-center gap-1.5 mx-auto transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>กลับสู่หน้าแรกกิจกรรม</span>
            </button>
          </div>

        </div>
      </div>
    );
  }

  const filteredParticipants = (stats?.participantsLog || []).filter(
    (p) =>
      p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.nickname.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.wishText.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalServices = stats?.onlineServiceRegistrations.total || 1;
  const appPercent = Math.round(((stats?.onlineServiceRegistrations.app || 0) / totalServices) * 100);
  const linePercent = Math.round(((stats?.onlineServiceRegistrations.line || 0) / totalServices) * 100);
  const webPercent = Math.round(((stats?.onlineServiceRegistrations.web || 0) / totalServices) * 100);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-200">
      
      {/* Top Header & Actions Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-cyan-500/20">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-cyan-900/60 text-cyan-200 text-xs font-semibold border border-cyan-400/30">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
              <span>{APP_CONFIG.ORGANIZATION.NAME_TH}</span>
            </span>
            <span className="text-xs font-mono bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded">
              แดชบอร์ดผู้ดูแลระบบ
            </span>
          </div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-white">
            รายงานสถิติกิจกรรมลอยกระทงออนไลน์ ๒๕๖๙
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            สรุปข้อมูลผู้เข้าใช้งาน ผู้ร่วมลอยกระทง ผู้สมัครบริการออนไลน์แยกตามช่องทาง และผู้มีบัญชีเดิม
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={loadStats}
            disabled={refreshing}
            className="px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-cyan-500/30 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
            title="รีเฟรชข้อมูลล่าสุด"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${refreshing ? 'animate-spin' : ''}`} />
            <span>รีเฟรช</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-emerald-950/40 border border-emerald-400/40 transition-all hover:scale-102 cursor-pointer"
            title="ดาวน์โหลดไฟล์สถิติสรุปและรายชื่อผู้ร่วมกิจกรรมเพื่อเปิดใน Microsoft Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
            <span>ส่งออก Excel (CSV)</span>
          </button>

          <button
            onClick={() => onNavigate('/')}
            className="px-3.5 py-2 rounded-xl bg-cyan-900/40 hover:bg-cyan-900/60 text-sky-200 border border-cyan-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>กลับหน้าแรก</span>
          </button>
        </div>
      </div>

      {/* 4 Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        
        {/* KPI 1: ผู้เข้าใช้งาน (Total Visitors) */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#073B66]/90 to-[#042440]/90 border border-cyan-500/30 p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-sky-200">1. ผู้เข้าใช้งานทั้งหมด</span>
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center border border-cyan-400/30">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="font-heading font-extrabold text-3xl sm:text-4xl text-cyan-300 font-mono tracking-tight">
              {stats?.totalVisitors.toLocaleString() || 0}
            </div>
            <p className="text-xs text-slate-300 mt-1">
              จำนวนครั้งการเข้าชมเว็บไซต์กิจกรรม
            </p>
          </div>
          <div className="text-[11px] text-cyan-200/80 bg-cyan-950/60 px-2.5 py-1 rounded-lg border border-cyan-500/20 flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-cyan-300" />
            <span>นับยอดตาม Session จริงในเบราว์เซอร์</span>
          </div>
        </div>

        {/* KPI 2: ผู้เล่นกิจกรรมลอยกระทง (Loy Krathong Players) */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#073B66]/90 to-[#042440]/90 border border-amber-400/40 p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-200">2. ผู้เล่นกิจกรรมลอยกระทง</span>
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center border border-amber-400/30">
              <Waves className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="font-heading font-extrabold text-3xl sm:text-4xl text-amber-300 font-mono tracking-tight">
              {stats?.totalKrathongPlayers.toLocaleString() || 0}
            </div>
            <p className="text-xs text-slate-300 mt-1">
              กระทงดิจิทัลที่ปล่อยสู่สายน้ำตาปี
            </p>
          </div>
          <div className="text-[11px] text-amber-200/80 bg-amber-950/60 px-2.5 py-1 rounded-lg border border-amber-400/20 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-300" />
            <span>ออกรหัส LK69 สำเร็จ 100%</span>
          </div>
        </div>

        {/* KPI 3: ผู้สมัครใช้บริการออนไลน์ กปภ. (Online Registrations - Total) */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#073B66]/90 to-[#042440]/90 border border-emerald-400/40 p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-200">3. ผู้สมัครบริการออนไลน์</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center border border-emerald-400/30">
              <Smartphone className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="font-heading font-extrabold text-3xl sm:text-4xl text-emerald-300 font-mono tracking-tight">
              {stats?.onlineServiceRegistrations.total.toLocaleString() || 0}
            </div>
            <p className="text-xs text-slate-300 mt-1">
              ยอดผู้สนใจสมัครบริการออนไลน์ (รวม 3 ช่องทาง)
            </p>
          </div>
          <div className="text-[11px] text-emerald-200/80 bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-400/20 flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-emerald-300" />
            <span>จำแนกเป็น 3 ช่องทางหลักด้านล่าง</span>
          </div>
        </div>

        {/* KPI 4: ผู้ที่มีบัญชีอยู่แล้ว (Existing Users) */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#073B66]/90 to-[#042440]/90 border border-cyan-500/30 p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-sky-200">4. ผู้ที่มีบัญชีอยู่แล้ว</span>
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center border border-blue-400/30">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="font-heading font-extrabold text-3xl sm:text-4xl text-blue-200 font-mono tracking-tight">
              {stats?.existingUsersCount.toLocaleString() || 0}
            </div>
            <p className="text-xs text-slate-300 mt-1">
              ลูกค้ายืนยันว่าใช้งานแอป/LINE กปภ. แล้ว
            </p>
          </div>
          <div className="text-[11px] text-blue-200/80 bg-blue-950/60 px-2.5 py-1 rounded-lg border border-blue-500/20 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-blue-300" />
            <span>ผู้ใช้บริการเดิมที่ร่วมกิจกรรม</span>
          </div>
        </div>

      </div>

      {/* Breakdown Section: ข้อ 3. ผู้สมัครบริการออนไลน์ แยกเป็น แอป / LINE / เว็บเบราว์เซอร์ */}
      <div className="bg-gradient-to-b from-[#073B66]/80 via-[#052949]/80 to-[#031d34]/90 rounded-3xl p-6 sm:p-7 border border-cyan-500/30 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-cyan-800/60 pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-400/30">
              <Smartphone className="w-3.5 h-3.5" />
              <span>รายละเอียดหัวข้อที่ 3</span>
            </div>
            <h2 className="font-heading font-bold text-xl sm:text-2xl text-white">
              สถิติผู้สมัครใช้บริการออนไลน์ กปภ. แยกตามช่องทาง (3 ช่องทาง)
            </h2>
            <p className="text-xs text-slate-300">
              สัดส่วนความสนใจของประชาชนต่อแต่ละแพลตฟอร์มดิจิทัลของการประปาส่วนภูมิภาค
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-400">รวมทั้งหมด:</span>
            <div className="font-heading font-extrabold text-2xl text-emerald-300 font-mono">
              {stats?.onlineServiceRegistrations.total || 0} ครั้ง
            </div>
          </div>
        </div>

        {/* 3 Channels Comparison Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          
          {/* ช่องทาง 1: แอปพลิเคชัน (PWA Plus Life) */}
          <div className="bg-slate-900/80 rounded-2xl p-5 border-2 border-cyan-400/40 space-y-3 shadow-inner">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center border border-cyan-400/30">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-sm text-white">แอปพลิเคชัน</h3>
                  <span className="text-[11px] text-cyan-300">PWA Plus Life</span>
                </div>
              </div>
              <span className="font-mono text-xs font-bold text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-500/30">
                {appPercent}%
              </span>
            </div>

            <div>
              <div className="font-mono font-extrabold text-3xl text-cyan-300">
                {stats?.onlineServiceRegistrations.app.toLocaleString() || 0}
                <span className="text-xs font-sans text-slate-400 font-normal ml-1.5">ครั้ง</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                คลิกดาวน์โหลดผ่าน Google Play และ App Store
              </p>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.max(appPercent, 4)}%` }}
              />
            </div>
          </div>

          {/* ช่องทาง 2: LINE Official Account */}
          <div className="bg-slate-900/80 rounded-2xl p-5 border-2 border-emerald-400/40 space-y-3 shadow-inner">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center border border-emerald-400/30">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-sm text-white">LINE Official</h3>
                  <span className="text-[11px] text-emerald-300">@pwathailand</span>
                </div>
              </div>
              <span className="font-mono text-xs font-bold text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/30">
                {linePercent}%
              </span>
            </div>

            <div>
              <div className="font-mono font-extrabold text-3xl text-emerald-300">
                {stats?.onlineServiceRegistrations.line.toLocaleString() || 0}
                <span className="text-xs font-sans text-slate-400 font-normal ml-1.5">ครั้ง</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                คลิกเพิ่มเพื่อน LINE Official กปภ. เพื่อรับบริการ
              </p>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.max(linePercent, 4)}%` }}
              />
            </div>
          </div>

          {/* ช่องทาง 3: ผ่านเว็บเบราว์เซอร์ */}
          <div className="bg-slate-900/80 rounded-2xl p-5 border-2 border-amber-400/40 space-y-3 shadow-inner">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center border border-amber-400/30">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-sm text-white">ผ่านเว็บเบราว์เซอร์</h3>
                  <span className="text-[11px] text-amber-300">payment.pwa.co.th</span>
                </div>
              </div>
              <span className="font-mono text-xs font-bold text-amber-300 bg-amber-950 px-2 py-0.5 rounded border border-amber-500/30">
                {webPercent}%
              </span>
            </div>

            <div>
              <div className="font-mono font-extrabold text-3xl text-amber-300">
                {stats?.onlineServiceRegistrations.web.toLocaleString() || 0}
                <span className="text-xs font-sans text-slate-400 font-normal ml-1.5">ครั้ง</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                คลิกเข้าสู่ระบบชำระค่าน้ำออนไลน์ผ่านเบราว์เซอร์
              </p>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-amber-500 to-yellow-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.max(webPercent, 4)}%` }}
              />
            </div>
          </div>

        </div>
      </div>

      {/* Tabs & Table: รายการผู้ร่วมกิจกรรม และ Log การใช้งาน */}
      <div className="bg-slate-900/90 rounded-3xl border border-cyan-500/30 p-6 space-y-5 shadow-xl">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('OVERVIEW')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'OVERVIEW'
                  ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              รายชื่อผู้ลอยกระทง ({stats?.participantsLog.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('SERVICES')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'SERVICES'
                  ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ประวัติการกดบริการ ({stats?.serviceClicksLog.length || 0})
            </button>
          </div>

          {/* Search box */}
          {activeTab === 'OVERVIEW' && (
            <div className="relative">
              <input
                type="text"
                placeholder="ค้นหาตามรหัส, ชื่อ, คำอธิษฐาน..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-64 py-2 pl-3 pr-8 rounded-xl bg-slate-950 border border-cyan-500/30 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          )}
        </div>

        {/* Tab 1: Participants Table */}
        {activeTab === 'OVERVIEW' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-200">
              <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[11px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">รหัสกิจกรรม</th>
                  <th className="py-3 px-4">ชื่อ/นามแฝง</th>
                  <th className="py-3 px-4">ประเภทกระทง</th>
                  <th className="py-3 px-4">คำอธิษฐาน</th>
                  <th className="py-3 px-4 text-right">เวลาที่ลอย</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {filteredParticipants.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      ไม่พบข้อมูลผู้ร่วมกิจกรรมที่ค้นหา
                    </td>
                  </tr>
                ) : (
                  filteredParticipants.map((p, idx) => (
                    <tr key={idx} className="hover:bg-cyan-950/20 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-amber-300">
                        {p.code}
                      </td>
                      <td className="py-3 px-4 font-medium text-white">
                        {p.nickname}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/20 text-[10px]">
                          {p.krathongType}
                        </span>
                      </td>
                      <td className="py-3 px-4 max-w-xs truncate text-slate-300" title={p.wishText}>
                        {p.wishText}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-400 font-mono text-[11px]">
                        {new Date(p.floatedAt).toLocaleString('th-TH')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Service Clicks Log */}
        {activeTab === 'SERVICES' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-200">
              <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[11px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">ช่องทาง</th>
                  <th className="py-3 px-4">รายละเอียดบริการ</th>
                  <th className="py-3 px-4 text-right">วันเวลาที่กดใช้งาน</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {(stats?.serviceClicksLog || []).map((log, idx) => (
                  <tr key={idx} className="hover:bg-cyan-950/20 transition-colors">
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                        log.channel === 'app'
                          ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/30'
                          : log.channel === 'line'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                          : 'bg-amber-950 text-amber-300 border border-amber-500/30'
                      }`}>
                        {log.channel.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-white">
                      {log.channelName}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-400 font-mono text-[11px]">
                      {new Date(log.timestamp).toLocaleString('th-TH')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

    </div>
  );
};
