import React, { useState, useEffect } from 'react';
import {
  Waves,
  Download,
  RefreshCw,
  ArrowLeft,
  Lock,
  Unlock,
  ShieldCheck,
  FileSpreadsheet,
  Calendar,
  Sparkles,
  Clock,
  KeyRound,
  Database,
  CheckCircle2,
  AlertCircle,
  Search,
  ExternalLink,
  Settings,
  Filter,
  Smartphone,
  MessageCircle,
  CreditCard,
  MousePointerClick,
  UserPlus,
  UserCheck,
  Award,
} from 'lucide-react';
import { googleSheetsService } from '../services/googleSheetsService';
import { StorageService } from '../services/storageService';
import { KrathongActivity, GoogleSheetsAdminData } from '../types';
import { soundService } from '../services/soundService';
import { APP_CONFIG } from '../config/appConfig';
import { KRATHONG_OPTIONS } from '../components/krathongs/KrathongArt';

interface AdminStatsPageProps {
  onNavigate: (path: string) => void;
}

export const AdminStatsPage: React.FC<AdminStatsPageProps> = ({ onNavigate }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');
  
  // Real data state from Google Sheets
  const [adminData, setAdminData] = useState<GoogleSheetsAdminData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('ALL');

  // Google Apps Script API URL configuration state
  const [apiUrlInput, setApiUrlInput] = useState<string>('');
  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success?: boolean; message?: string } | null>(null);
  const [testingConnection, setTestingConnection] = useState<boolean>(false);

  const loadRealAdminData = async () => {
    setLoading(true);
    try {
      const data = await StorageService.getAdminActivities();
      setAdminData(data);
    } catch (err: any) {
      setAdminData({
        success: false,
        totalFloated: 0,
        byType: {},
        lastUpdated: null,
        allActivities: [],
        error: 'ไม่สามารถโหลดข้อมูลสถิติได้',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check if previously unlocked in this session
    const isUnlocked = sessionStorage.getItem('pwa_admin_unlocked') === 'true';
    if (isUnlocked) {
      setIsAuthenticated(true);
      setApiUrlInput(googleSheetsService.getApiUrl());
      loadRealAdminData();
    }
  }, []);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.trim() === APP_CONFIG.ADMIN_SETTINGS.DEFAULT_PIN) {
      soundService.playCelebration();
      setIsAuthenticated(true);
      sessionStorage.setItem('pwa_admin_unlocked', 'true');
      setPinError('');
      setApiUrlInput(googleSheetsService.getApiUrl());
      loadRealAdminData();
    } else {
      soundService.playWaterDrop();
      setPinError(`รหัสผ่านไม่ถูกต้อง (คำใบ้: สายด่วน กปภ. ${APP_CONFIG.ADMIN_SETTINGS.HOTLINE})`);
    }
  };

  const handleSaveApiUrl = async () => {
    setTestingConnection(true);
    setTestResult(null);
    try {
      const res = await googleSheetsService.testConnection(apiUrlInput.trim());
      setTestResult(res);
      if (res.success) {
        googleSheetsService.setApiUrl(apiUrlInput.trim());
        soundService.playCelebration();
        loadRealAdminData();
      }
    } catch (err: any) {
      setTestResult({ success: false, message: 'ไม่สามารถทดสอบการเชื่อมต่อได้: ' + err.message });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleExportCSV = () => {
    if (!adminData || adminData.allActivities.length === 0) {
      alert('ไม่มีข้อมูลกิจกรรมสำหรับส่งออก');
      return;
    }
    soundService.playCapture();
    googleSheetsService.exportActivitiesToCSV(filteredActivities);
  };

  const handleExportServiceClicksCSV = () => {
    const events =
      adminData?.serviceStats?.recentEvents ||
      adminData?.serviceStats?.recentClicks ||
      [];
    if (events.length === 0) {
      alert('ไม่มีข้อมูลการคลิกหรือบริการออนไลน์สำหรับส่งออก');
      return;
    }
    soundService.playCapture();
    googleSheetsService.exportServiceClicksToCSV(events);
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
              เชื่อมต่อฐานข้อมูลจริงบน Google Sheets โดยตรง
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

  // Filter activities by search, date, and type
  const allActivities = adminData?.allActivities || [];
  const filteredActivities = allActivities.filter((item) => {
    // 1. Search Query
    const matchQuery =
      searchQuery.trim() === '' ||
      item.activity_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.wish.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.krathong_type.toLowerCase().includes(searchQuery.toLowerCase());

    // 2. Date Filter
    let matchDate = true;
    if (dateFilter) {
      const itemDateStr = item.created_at ? item.created_at.split('T')[0] : '';
      matchDate = itemDateStr === dateFilter;
    }

    // 3. Krathong Type Filter
    let matchType = true;
    if (selectedTypeFilter !== 'ALL') {
      matchType = item.krathong_type === selectedTypeFilter;
    }

    return matchQuery && matchDate && matchType;
  });

  const getKrathongName = (typeId: string): string => {
    const opt = KRATHONG_OPTIONS.find((k) => k.id === typeId);
    return opt ? opt.name : typeId;
  };

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
            <span className="inline-flex items-center gap-1 text-xs font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded">
              <Database className="w-3 h-3" />
              <span>Google Sheets Database</span>
            </span>
          </div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-white">
            รายงานสถิติกิจกรรมจริง (ฐานข้อมูล Google Sheets)
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            ข้อมูลอ้างอิงจาก Google Sheets โดยตรง ปลอดภัย ไม่ใช้ข้อมูลจำลอง
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowConfigModal(!showConfigModal)}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-sky-200 border border-cyan-500/40 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            title="ตั้งค่าและตรวจสอบการเชื่อมต่อ Google Apps Script API"
          >
            <Settings className="w-3.5 h-3.5 text-amber-300" />
            <span>ตั้งค่า API</span>
          </button>

          <button
            onClick={loadRealAdminData}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-cyan-500/30 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
            title="รีเฟรชข้อมูลล่าสุดจาก Google Sheets"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${loading ? 'animate-spin' : ''}`} />
            <span>รีเฟรชข้อมูล</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-emerald-950/40 border border-emerald-400/40 transition-all hover:scale-102 cursor-pointer"
            title="ดาวน์โหลดไฟล์ข้อมูลจริงจาก Google Sheets เป็น Excel (CSV พร้อม UTF-8 BOM)"
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

      {/* Google Apps Script API Configuration Panel (Toggleable) */}
      {showConfigModal && (
        <div className="bg-gradient-to-r from-slate-900 via-cyan-950 to-slate-900 p-6 rounded-3xl border-2 border-amber-400/40 shadow-2xl space-y-4 animate-in fade-in duration-200">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h3 className="font-heading font-bold text-base text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-amber-300" />
                <span>การตั้งค่า Google Apps Script Web App URL</span>
              </h3>
              <p className="text-xs text-slate-300">
                นำ Web App URL ที่ได้จากการ Deploy Google Apps Script ใน Google Sheets มาใส่ที่นี่ เพื่อให้ระบบเชื่อมต่อไปยังฐานข้อมูลจริง
              </p>
            </div>
            <button
              onClick={() => setShowConfigModal(false)}
              className="text-xs text-slate-400 hover:text-white p-1"
            >
              ✕
            </button>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-300 block">
              Google Apps Script Web App URL:
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="url"
                value={apiUrlInput}
                onChange={(e) => setApiUrlInput(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="flex-1 py-2.5 px-3.5 rounded-xl bg-slate-950 border border-cyan-500/40 text-xs font-mono text-cyan-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              />
              <button
                onClick={handleSaveApiUrl}
                disabled={testingConnection}
                className="py-2.5 px-5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-heading font-bold rounded-xl shadow transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {testingConnection ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>กำลังทดสอบ...</span>
                  </>
                ) : (
                  <span>บันทึก & ทดสอบ</span>
                )}
              </button>
            </div>
          </div>

          {/* Test connection feedback */}
          {testResult && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                testResult.success
                  ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-200'
                  : 'bg-rose-950/60 border border-rose-500/40 text-rose-200'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>{testResult.message}</span>
            </div>
          )}

          <div className="text-[11px] text-slate-400 pt-1 flex items-center justify-between">
            <span>📖 ดูคำแนะนำและโค้ดตัวอย่างในไฟล์ <strong>google-apps-script/Code.gs</strong></span>
            {googleSheetsService.getApiUrl() && (
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>กำหนดค่าแล้ว</span>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Real Statistics Error Warning */}
      {adminData && !adminData.success && (
        <div className="p-4 rounded-2xl bg-amber-950/50 border border-amber-500/40 text-amber-200 text-xs flex items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
            <span>
              <strong>ไม่สามารถโหลดข้อมูลสถิติได้:</strong> กรุณาตรวจสอบการตั้งค่า URL ของ Google Apps Script หรือสิทธิ์การเข้าถึง (ต้องตั้งเป็น Anyone)
            </span>
          </div>
          <button
            onClick={() => setShowConfigModal(true)}
            className="py-1.5 px-3 rounded-lg bg-amber-500 text-slate-950 text-xs font-bold shrink-0 cursor-pointer hover:bg-amber-400"
          >
            ตั้งค่า URL
          </button>
        </div>
      )}

      {/* Informative Notice: เมื่อ API ส่งยอดรวมมาแล้ว แต่ยังไม่มี activities / countsByType */}
      {adminData?.success && adminData.totalFloated > 0 && adminData.allActivities.length === 0 && (
        <div className="p-4 rounded-2xl bg-sky-950/70 border border-sky-400/40 text-sky-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg animate-in fade-in duration-200">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="text-white text-sm block">
                ตรวจพบยอดกิจกรรมจริง {adminData.totalFloated.toLocaleString()} รายการจาก Google Sheets
              </strong>
              <p className="text-sky-300/90 leading-relaxed">
                ขณะนี้ Google Apps Script API ส่งเฉพาะยอดรวม (total: {adminData.totalFloated}) หากต้องการให้ตารางกิจกรรมและสถิติ 5 ประเภทแสดงรายละเอียดเพิ่มเติม กรุณาปรับฟังก์ชัน <code className="bg-slate-900 px-1.5 py-0.5 rounded text-amber-300 font-mono">doGet()</code> ใน Google Apps Script ให้ส่งคีย์ <code className="bg-slate-900 px-1.5 py-0.5 rounded text-amber-300 font-mono">countsByType</code> และ <code className="bg-slate-900 px-1.5 py-0.5 rounded text-amber-300 font-mono">activities</code> เพิ่มเติม (ระบบปฏิบัติตามมาตรฐาน ไม่สร้างข้อมูลจำลองมาทดแทน)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Primary KPI Overview: Real Counts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        
        {/* KPI 1: จำนวนกิจกรรมจริงทั้งหมด */}
        <div className="rounded-3xl bg-gradient-to-b from-[#073B66]/90 to-[#042440]/90 border border-cyan-500/30 p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-sky-200">จำนวนกิจกรรมจริงทั้งหมด</span>
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center border border-cyan-400/30">
              <Waves className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="font-heading font-extrabold text-3xl sm:text-4xl text-cyan-300 font-mono tracking-tight">
              {loading ? (
                <span className="text-sm font-normal text-slate-400 animate-pulse">กำลังโหลด...</span>
              ) : adminData?.success ? (
                adminData.totalFloated.toLocaleString()
              ) : (
                <span className="text-sm text-amber-300 font-normal">ไม่สามารถโหลดข้อมูลสถิติได้</span>
              )}
            </div>
            <p className="text-xs text-slate-300 mt-1">
              นับจากแถวข้อมูลจริงใน Google Sheets
            </p>
          </div>
          <div className="text-[11px] text-cyan-200/80 bg-cyan-950/60 px-2.5 py-1 rounded-lg border border-cyan-500/20 flex items-center justify-between">
            <span>ฐานข้อมูล: Google Sheets</span>
            <span className="font-mono text-emerald-300">100% Real Data</span>
          </div>
        </div>

        {/* KPI 2: เวลาอัปเดตข้อมูลล่าสุด */}
        <div className="rounded-3xl bg-gradient-to-b from-[#073B66]/90 to-[#042440]/90 border border-amber-400/40 p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-200">เวลาอัปเดตข้อมูลล่าสุด</span>
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center border border-amber-400/30">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="font-heading font-bold text-xl sm:text-2xl text-amber-300 font-mono tracking-tight">
              {adminData?.lastUpdated ? (
                new Date(adminData.lastUpdated).toLocaleTimeString('th-TH')
              ) : (
                <span className="text-sm text-slate-400 font-normal">ไม่มีข้อมูล</span>
              )}
            </div>
            <p className="text-xs text-slate-300 mt-1">
              {adminData?.lastUpdated ? new Date(adminData.lastUpdated).toLocaleDateString('th-TH', { dateStyle: 'long' }) : '-'}
            </p>
          </div>
          <div className="text-[11px] text-amber-200/80 bg-amber-950/60 px-2.5 py-1 rounded-lg border border-amber-400/20 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-300" />
            <span>ซิงค์ตรงกับเวลาของ Google Sheets</span>
          </div>
        </div>

        {/* KPI 3: สถานะความปลอดภัยและการจัดเก็บ */}
        <div className="rounded-3xl bg-gradient-to-b from-[#073B66]/90 to-[#042440]/90 border border-emerald-400/40 p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-200">ความปลอดภัยของระบบ</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center border border-emerald-400/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="font-heading font-bold text-lg text-emerald-300">
              Data Minimization
            </div>
            <p className="text-xs text-slate-300 mt-1">
              ไม่บันทึก IP, ไม่บันทึกรหัสผ่าน และไม่เปิดเผย Secret
            </p>
          </div>
          <div className="text-[11px] text-emerald-200/80 bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-400/20 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-300" />
            <span>ผ่านการตรวจสอบสิทธิ์ด้วย PIN 1662</span>
          </div>
        </div>

      </div>

      {/* Breakdown Section: สถิติจำนวนกระทงแยกตามประเภท (Real Calculation from Google Sheets) */}
      <div className="bg-gradient-to-b from-[#073B66]/80 via-[#052949]/80 to-[#031d34]/90 rounded-3xl p-6 sm:p-7 border border-cyan-500/30 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-cyan-800/60 pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-bold border border-cyan-400/30">
              <Waves className="w-3.5 h-3.5" />
              <span>คำนวณจากฐานข้อมูลจริง</span>
            </div>
            <h2 className="font-heading font-bold text-xl sm:text-2xl text-white">
              สถิติจำนวนกระทงแยกตามประเภท (5 สไตล์)
            </h2>
            <p className="text-xs text-slate-300">
              คำนวณจากรายการทั้งหมดที่บันทึกใน Google Sheets โดยไม่มีการจำลองตัวเลข
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-400">ยอดรวม:</span>
            <div className="font-heading font-extrabold text-2xl text-amber-300 font-mono">
              {adminData?.success ? `${adminData.totalFloated.toLocaleString()} กระทง` : '—'}
            </div>
          </div>
        </div>

        {/* 5 Types Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {KRATHONG_OPTIONS.map((opt) => {
            const count = adminData?.success
              ? (adminData.countsByType?.[opt.id] ?? adminData.byType?.[opt.id] ?? 0)
              : 0;
            const total = adminData?.totalFloated || 1;
            const percent = adminData?.success && adminData.totalFloated > 0 ? Math.round((count / total) * 100) : 0;

            return (
              <div
                key={opt.id}
                onClick={() => setSelectedTypeFilter(selectedTypeFilter === opt.id ? 'ALL' : opt.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  selectedTypeFilter === opt.id
                    ? 'bg-gradient-to-b from-cyan-900 to-blue-950 border-amber-400 ring-2 ring-amber-400/40 shadow-lg'
                    : 'bg-slate-900/80 hover:bg-slate-900 border-cyan-500/20'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-amber-300 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/30">
                    {opt.badge}
                  </span>
                  <span className="font-mono text-xs font-bold text-cyan-300">
                    {adminData?.success ? `${percent}%` : '—'}
                  </span>
                </div>

                <div className="font-heading font-bold text-sm text-white truncate" title={opt.name}>
                  {opt.name}
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  {opt.id}
                </div>

                <div className="font-mono font-extrabold text-2xl text-cyan-300 mt-2">
                  {loading ? (
                    <span className="text-xs text-slate-500">...</span>
                  ) : adminData?.success ? (
                    count.toLocaleString()
                  ) : (
                    '—'
                  )}
                  <span className="text-xs font-sans text-slate-400 font-normal ml-1">กระทง</span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
                  <div
                    className="bg-cyan-400 h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.max(percent, 2)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter and Real Activities Table */}
      <div className="bg-slate-900/90 rounded-3xl border border-cyan-500/30 p-6 space-y-5 shadow-xl">
        
        {/* Table Filter Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <h3 className="font-heading font-bold text-base text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-cyan-400" />
              <span>รายการกิจกรรมทั้งหมด ({filteredActivities.length} รายการ)</span>
            </h3>
            {selectedTypeFilter !== 'ALL' && (
              <span className="text-xs bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-400/30 flex items-center gap-1">
                <span>กรอง: {getKrathongName(selectedTypeFilter)}</span>
                <button onClick={() => setSelectedTypeFilter('ALL')} className="hover:text-white cursor-pointer">✕</button>
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Date Filter */}
            <div className="flex items-center gap-1.5 bg-slate-950 border border-cyan-500/30 rounded-xl px-2.5 py-1.5 text-xs text-slate-300">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              <label htmlFor="dateFilterInput" className="text-slate-400">วันที่:</label>
              <input
                id="dateFilterInput"
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="bg-transparent text-white text-xs focus:outline-none cursor-pointer"
              />
              {dateFilter && (
                <button onClick={() => setDateFilter('')} className="text-slate-400 hover:text-white ml-1">✕</button>
              )}
            </div>

            {/* Krathong Type Dropdown Filter */}
            <select
              value={selectedTypeFilter}
              onChange={(e) => setSelectedTypeFilter(e.target.value)}
              className="py-1.5 px-3 rounded-xl bg-slate-950 border border-cyan-500/30 text-xs text-white focus:outline-none cursor-pointer"
            >
              <option value="ALL">ทุกประเภทกระทง</option>
              {KRATHONG_OPTIONS.map((k) => (
                <option key={k.id} value={k.id}>{k.name}</option>
              ))}
            </select>

            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="ค้นหารหัส, คำอธิษฐาน..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-56 py-1.5 pl-3 pr-8 rounded-xl bg-slate-950 border border-cyan-500/30 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Activities Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-200">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">activity_id</th>
                <th className="py-3 px-4">created_at (วันเวลา)</th>
                <th className="py-3 px-4">krathong_type</th>
                <th className="py-3 px-4">wish (คำอธิษฐาน)</th>
                <th className="py-3 px-4 text-center">status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-cyan-400 mb-2" />
                    <span>กำลังโหลดข้อมูลจาก Google Sheets...</span>
                  </td>
                </tr>
              ) : adminData && !adminData.success ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-amber-300">
                    <AlertCircle className="w-6 h-6 mx-auto mb-2 text-amber-400" />
                    <span>ไม่สามารถโหลดข้อมูลสถิติได้ (กรุณาตรวจสอบการเชื่อมต่อ Google Sheets)</span>
                  </td>
                </tr>
              ) : filteredActivities.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-300">
                    {adminData && adminData.totalFloated > 0 ? (
                      <div className="max-w-md mx-auto space-y-2 py-4">
                        <AlertCircle className="w-6 h-6 text-sky-400 mx-auto" />
                        <p className="font-heading font-semibold text-white text-sm">
                          ตรวจพบยอดรวม {adminData.totalFloated.toLocaleString()} รายการจาก Google Sheets
                        </p>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          แต่ API ยังไม่ได้ส่งข้อมูลแถวรายการ (activities) กรุณาปรับฟังก์ชัน <code className="text-amber-300 font-mono">doGet()</code> ใน Google Apps Script ให้ส่งคีย์ <code className="text-amber-300 font-mono">activities</code> เพิ่มเติม เพื่อให้ตารางนี้แสดงรหัสกิจกรรม วันที่ ประเภทกระทง และคำอธิษฐานจริง
                        </p>
                      </div>
                    ) : (
                      <span>ไม่พบข้อมูลกิจกรรมใน Google Sheets (ยังไม่มีผู้ร่วมกิจกรรมหรือตรงตามเงื่อนไขที่ค้นหา)</span>
                    )}
                  </td>
                </tr>
              ) : (
                filteredActivities.map((act, idx) => (
                  <tr key={idx} className="hover:bg-cyan-950/20 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-amber-300">
                      {act.activity_id}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300 text-[11px]">
                      {act.created_at ? new Date(act.created_at).toLocaleString('th-TH') : '-'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/20 text-[10px]">
                        {getKrathongName(act.krathong_type)}
                      </span>
                    </td>
                    <td className="py-3 px-4 max-w-sm truncate text-slate-200" title={act.wish}>
                      {act.wish}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-bold">
                        {act.status || 'SUCCESS'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* ===================================================================== */}
      {/* SECTION 2: สถิติการเลือกบริการออนไลน์ กปภ. (Google Sheets: ServiceClicks) */}
      {/* ===================================================================== */}
      <div className="bg-gradient-to-b from-[#073B66]/80 via-[#052949]/80 to-[#031d34]/90 rounded-3xl p-6 sm:p-7 border border-cyan-500/30 shadow-2xl space-y-6">
        
        {/* Section Header & Export Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-cyan-800/60 pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-bold border border-cyan-400/30">
              <MousePointerClick className="w-3.5 h-3.5 text-amber-300" />
              <span>ฐานข้อมูลจริง: Google Sheets (ServiceClicks)</span>
            </div>
            <h2 className="font-heading font-bold text-xl sm:text-2xl text-white flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-cyan-400" />
              <span>สถิติการเลือกบริการออนไลน์ กปภ.</span>
            </h2>
            <p className="text-xs text-slate-300">
              บันทึกเหตุการณ์คลิกจริงผ่าน Google Apps Script ไม่บันทึกชื่อ เบอร์โทรศัพท์ เลขบัตรประชาชน หรือ IP (Data Minimization)
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleExportServiceClicksCSV}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-700 hover:from-teal-500 hover:to-emerald-600 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg border border-teal-400/40 transition-all cursor-pointer"
              title="ส่งออกประวัติการคลิกบริการออนไลน์เป็น Excel (CSV พร้อม UTF-8 BOM)"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
              <span>ส่งออกคลิกบริการ (CSV)</span>
            </button>
          </div>
        </div>

        {/* Warning if Service Stats Error */}
        {adminData?.serviceStats && !adminData.serviceStats.success && (
          <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-400/40 text-amber-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>สถานะบริการออนไลน์:</strong> ไม่สามารถโหลดข้อมูลสถิติบริการออนไลน์ได้ (กรุณาตรวจสอบการตั้งค่า Sheet: ServiceClicks)
            </span>
          </div>
        )}

        {/* Online Services KPI Cards (6 Distinct Metrics from Google Sheets) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
          
          {/* Metric 1: ผู้เลือกสถานะยังไม่มีบัญชี */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-cyan-500/30 space-y-2 flex flex-col justify-between shadow-lg">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/30">
                  เส้นทางที่ 1
                </span>
                <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-300 flex items-center justify-center">
                  <UserPlus className="w-3.5 h-3.5" />
                </div>
              </div>
              <h4 className="text-xs font-semibold text-slate-300 leading-tight">
                ยังไม่มีบัญชี / สมัครออนไลน์
              </h4>
            </div>
            <div>
              <div className="font-heading font-extrabold text-2xl text-cyan-300 font-mono">
                {loading ? (
                  <span className="text-xs text-slate-500">...</span>
                ) : (
                  (adminData?.serviceStats?.noAccountCount ?? 0).toLocaleString()
                )}
                <span className="text-xs font-sans text-slate-400 font-normal ml-1">คน</span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">no_account</p>
            </div>
          </div>

          {/* Metric 2: ผู้เลือกสถานะมีบัญชีแล้ว */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-amber-400/30 space-y-2 flex flex-col justify-between shadow-lg">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-400/30">
                  เส้นทางที่ 2
                </span>
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center">
                  <UserCheck className="w-3.5 h-3.5" />
                </div>
              </div>
              <h4 className="text-xs font-semibold text-slate-300 leading-tight">
                มีบัญชีออนไลน์อยู่แล้ว
              </h4>
            </div>
            <div>
              <div className="font-heading font-extrabold text-2xl text-amber-300 font-mono">
                {loading ? (
                  <span className="text-xs text-slate-500">...</span>
                ) : (
                  (adminData?.serviceStats?.hasAccountCount ?? 0).toLocaleString()
                )}
                <span className="text-xs font-sans text-slate-400 font-normal ml-1">คน</span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">has_account</p>
            </div>
          </div>

          {/* Metric 3: คลิกแอป PWA Plus Life */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-blue-500/30 space-y-2 flex flex-col justify-between shadow-lg">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold text-sky-300 bg-blue-950/80 px-2 py-0.5 rounded border border-blue-500/30">
                  Android / iOS
                </span>
                <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-sky-300 flex items-center justify-center">
                  <Smartphone className="w-3.5 h-3.5" />
                </div>
              </div>
              <h4 className="text-xs font-semibold text-slate-300 leading-tight">
                คลิกแอป PWA Plus Life
              </h4>
            </div>
            <div>
              <div className="font-heading font-extrabold text-2xl text-sky-300 font-mono">
                {loading ? (
                  <span className="text-xs text-slate-500">...</span>
                ) : (
                  (adminData?.serviceStats?.clicksPwaPlusLife ?? adminData?.serviceStats?.byService?.app ?? 0).toLocaleString()
                )}
                <span className="text-xs font-sans text-slate-400 font-normal ml-1">ครั้ง</span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">pwa_plus_life</p>
            </div>
          </div>

          {/* Metric 4: คลิก LINE Official กปภ. */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-emerald-500/30 space-y-2 flex flex-col justify-between shadow-lg">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                  @pwathailand
                </span>
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center">
                  <MessageCircle className="w-3.5 h-3.5" />
                </div>
              </div>
              <h4 className="text-xs font-semibold text-slate-300 leading-tight">
                คลิก LINE Official กปภ.
              </h4>
            </div>
            <div>
              <div className="font-heading font-extrabold text-2xl text-emerald-300 font-mono">
                {loading ? (
                  <span className="text-xs text-slate-500">...</span>
                ) : (
                  (adminData?.serviceStats?.clicksLineOfficial ?? adminData?.serviceStats?.byService?.line ?? 0).toLocaleString()
                )}
                <span className="text-xs font-sans text-slate-400 font-normal ml-1">ครั้ง</span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">line_official</p>
            </div>
          </div>

          {/* Metric 5: คลิกชำระค่าน้ำออนไลน์ */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-amber-500/30 space-y-2 flex flex-col justify-between shadow-lg">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/30">
                  Payment Portal
                </span>
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center">
                  <CreditCard className="w-3.5 h-3.5" />
                </div>
              </div>
              <h4 className="text-xs font-semibold text-slate-300 leading-tight">
                คลิกชำระค่าน้ำออนไลน์
              </h4>
            </div>
            <div>
              <div className="font-heading font-extrabold text-2xl text-amber-300 font-mono">
                {loading ? (
                  <span className="text-xs text-slate-500">...</span>
                ) : (
                  (adminData?.serviceStats?.clicksOnlinePayment ?? adminData?.serviceStats?.byService?.web ?? 0).toLocaleString()
                )}
                <span className="text-xs font-sans text-slate-400 font-normal ml-1">ครั้ง</span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">online_payment</p>
            </div>
          </div>

          {/* Metric 6: จำนวนผู้กดเสร็จสิ้นกิจกรรม */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-teal-400/40 space-y-2 flex flex-col justify-between shadow-lg">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold text-teal-300 bg-teal-950/80 px-2 py-0.5 rounded border border-teal-400/30">
                  สมบูรณ์
                </span>
                <div className="w-7 h-7 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center">
                  <Award className="w-3.5 h-3.5" />
                </div>
              </div>
              <h4 className="text-xs font-semibold text-slate-300 leading-tight">
                ผู้กดเสร็จสิ้นกิจกรรม
              </h4>
            </div>
            <div>
              <div className="font-heading font-extrabold text-2xl text-teal-300 font-mono">
                {loading ? (
                  <span className="text-xs text-slate-500">...</span>
                ) : (
                  (adminData?.serviceStats?.completedRegistrationCount ?? 0).toLocaleString()
                )}
                <span className="text-xs font-sans text-slate-400 font-normal ml-1">คน</span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">complete_registration</p>
            </div>
          </div>

        </div>

        {/* Summary and Timestamp Notice */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-400 px-1 pt-1 border-t border-slate-800/60">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>
                เวลาบันทึกล่าสุด:{' '}
                <strong className="text-amber-300 font-mono font-normal">
                  {adminData?.serviceStats?.lastUpdated
                    ? new Date(adminData.serviceStats.lastUpdated).toLocaleString('th-TH')
                    : 'ยังไม่มีข้อมูล'}
                </strong>
              </span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 text-[11px] text-slate-300">
              ยอดคลิกบริการรวม: <strong className="font-mono text-cyan-300">{((adminData?.serviceStats?.clicksPwaPlusLife ?? 0) + (adminData?.serviceStats?.clicksLineOfficial ?? 0) + (adminData?.serviceStats?.clicksOnlinePayment ?? 0)).toLocaleString()}</strong> ครั้ง
            </span>
            <span className="bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 text-[11px] text-slate-300">
              ยอดเหตุการณ์ทั้งหมด: <strong className="font-mono text-amber-300">{(adminData?.serviceStats?.totalEvents ?? 0).toLocaleString()}</strong> รายการ
            </span>
          </div>
        </div>

        {/* Recent Service Clicks & Registration Events Table */}
        <div className="bg-slate-950/80 rounded-2xl border border-cyan-500/20 overflow-hidden">
          <div className="p-3.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              <span>ประวัติเหตุการณ์บริการออนไลน์ (Google Sheets: ServiceClicks)</span>
            </span>
            <span className="text-[11px] font-mono text-cyan-300">
              {(adminData?.serviceStats?.recentEvents?.length ?? adminData?.serviceStats?.recentClicks?.length ?? 0)} รายการล่าสุด
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-200">
              <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[11px] border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-4">event_id</th>
                  <th className="py-2.5 px-4">created_at</th>
                  <th className="py-2.5 px-4">account_status</th>
                  <th className="py-2.5 px-4">service_key</th>
                  <th className="py-2.5 px-4">service_name</th>
                  <th className="py-2.5 px-4 text-center">event_type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400">
                      กำลังโหลดข้อมูล...
                    </td>
                  </tr>
                ) : (!adminData?.serviceStats?.recentEvents || adminData.serviceStats.recentEvents.length === 0) &&
                   (!adminData?.serviceStats?.recentClicks || adminData.serviceStats.recentClicks.length === 0) ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400">
                      <span>ยังไม่มีประวัติการคลิกเลือกบริการออนไลน์ใน Google Sheets (เมื่อประชาชนคลิกเลือกบริการ ข้อมูลจะปรากฏที่นี่)</span>
                    </td>
                  </tr>
                ) : (
                  (adminData?.serviceStats?.recentEvents || (adminData?.serviceStats?.recentClicks as any) || [])
                    .slice(0, 20)
                    .map((evt: any, idx: number) => {
                      const eventId = evt.event_id || evt.click_id || `EVT-${idx}`;
                      const accountStatus = evt.account_status || 'no_account';
                      const serviceKey = evt.service_key || 'none';
                      const eventType = evt.event_type || 'service_click';

                      return (
                        <tr key={idx} className="hover:bg-cyan-950/20 transition-colors">
                          <td className="py-2.5 px-4 font-mono text-amber-300 text-[11px]">
                            {eventId}
                          </td>
                          <td className="py-2.5 px-4 font-mono text-slate-300 text-[11px]">
                            {evt.created_at ? new Date(evt.created_at).toLocaleString('th-TH') : '-'}
                          </td>
                          <td className="py-2.5 px-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              accountStatus === 'has_account'
                                ? 'bg-amber-950/70 text-amber-300 border border-amber-400/30'
                                : 'bg-cyan-950/70 text-cyan-300 border border-cyan-400/30'
                            }`}>
                              {accountStatus === 'has_account' ? 'มีบัญชีแล้ว' : 'ยังไม่มีบัญชี'}
                            </span>
                          </td>
                          <td className="py-2.5 px-4">
                            <span className={`px-2 py-0.5 rounded font-mono text-[10px] uppercase ${
                              serviceKey === 'pwa_plus_life' || serviceKey === 'app'
                                ? 'bg-blue-900/60 text-sky-200 border border-blue-400/30'
                                : serviceKey === 'line_official' || serviceKey === 'line'
                                ? 'bg-emerald-900/60 text-emerald-200 border border-emerald-400/30'
                                : serviceKey === 'online_payment' || serviceKey === 'web'
                                ? 'bg-amber-900/60 text-amber-200 border border-amber-400/30'
                                : 'bg-slate-800 text-slate-300'
                            }`}>
                              {serviceKey}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-slate-300">
                            {evt.service_name || '-'}
                          </td>
                          <td className="py-2.5 px-4 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                              eventType === 'complete_registration'
                                ? 'bg-teal-500/20 text-teal-300 border border-teal-400/30'
                                : 'bg-sky-500/20 text-sky-300 border border-sky-400/30'
                            }`}>
                              {eventType === 'complete_registration' ? 'เสร็จสิ้นกิจกรรม' : 'คลิกบริการ'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
};
