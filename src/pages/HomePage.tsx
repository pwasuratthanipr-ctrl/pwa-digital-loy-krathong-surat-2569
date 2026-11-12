import React, { useEffect, useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Leaf,
  Waves,
  CheckCircle2,
  Calendar,
  Users,
  Eye,
  FileText,
  ExternalLink,
  AlertCircle,
  RefreshCw,
  Clock,
  Database,
} from 'lucide-react';
import { TapiRiverCanvas } from '../components/river/TapiRiverCanvas';
import { FloatingItem, StorageService } from '../services/storageService';
import { GoogleSheetsStats } from '../types';
import { soundService } from '../services/soundService';
import { APP_CONFIG } from '../config/appConfig';

interface HomePageProps {
  onNavigate: (path: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const [statsData, setStatsData] = useState<GoogleSheetsStats | null>(null);
  const [recentKrathongs, setRecentKrathongs] = useState<FloatingItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRealData = async (isBackground = false) => {
    if (!isBackground) {
      setLoading(true);
    }
    try {
      const res = await StorageService.getRealStats();
      setStatsData(res);

      const items =
        res.recentKrathongs && res.recentKrathongs.length > 0
          ? res.recentKrathongs
          : (res as any).activities && (res as any).activities.length > 0
          ? (res as any).activities
          : (res as any).allActivities && (res as any).allActivities.length > 0
          ? (res as any).allActivities
          : [];

      if (res.success && items.length > 0) {
        // Map real rows from Google Sheets to River Canvas items
        const mapped: FloatingItem[] = items.map((item: any, idx: number) => ({
          id: item.activity_id || `real-${idx}`,
          nickname: 'ผู้ร่วมอนุรักษ์สายน้ำ',
          krathong_type: item.krathong_type,
          wish_text: item.wish || 'ขอขมาพระแม่คงคาและอธิษฐานจิตรักษ์สายน้ำตาปี',
          floated_at: item.created_at,
          water_coordinates_x: 18 + ((idx * 27) % 64),
          water_coordinates_y: 52 + ((idx * 19) % 32),
        }));
        setRecentKrathongs(mapped);
      } else {
        setRecentKrathongs([]);
      }
    } catch (err) {
      console.warn('Could not load real stats from Google Sheets:', err);
      if (!isBackground) {
        setStatsData({
          success: false,
          totalFloated: 0,
          byType: { pwa_blue: 0, eco_banana: 0, lotus_pink: 0, moonlight_gold: 0, tapi_river: 0 },
          lastUpdated: null,
          recentKrathongs: [],
          error: 'ไม่สามารถโหลดข้อมูลสถิติได้',
        });
        setRecentKrathongs([]);
      }
    } finally {
      if (!isBackground) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadRealData();
    // Auto-refresh in background every 20 seconds without flickering UI
    const timer = setInterval(() => {
      loadRealData(true);
    }, 20000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative pt-6 sm:pt-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header Title & Tagline */}
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-8">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-900/60 border border-cyan-400/30 text-cyan-200 text-xs sm:text-sm font-medium backdrop-blur-sm shadow-inner">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>การประปาส่วนภูมิภาคสาขาสุราษฎร์ธานี (ชั้นพิเศษ)</span>
            </div>

            <h1 className="font-heading font-extrabold text-3xl sm:text-5xl lg:text-6xl text-white tracking-tight leading-tight sm:leading-tight">
              <span className="block">ลอยกระทงออนไลน์</span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-200 to-yellow-400 mt-1 sm:mt-2">
                <span className="block sm:inline">ส่งความสุข</span>
                <span className="hidden sm:inline"> </span>
                <span className="block sm:inline">ไม่เพิ่มขยะ</span>
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-light">
              ร่วมสืบสานประเพณีไทย รักษ์สายน้ำตาปี และก้าวสู่บริการดิจิทัลกับการประปาส่วนภูมิภาค
              ลอยกระทงฟรี ไม่ต้องลงทะเบียนล่วงหน้า บันทึกข้อมูลจริงลง Google Sheets ปลอดภัย ไร้มลพิษ
            </p>

            {/* Main Action CTAs */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-3">
              <button
                onClick={() => {
                  soundService.playKrathongSelect();
                  onNavigate('/krathong');
                }}
                className="flex items-center gap-2.5 py-3.5 px-8 rounded-xl bg-gradient-to-r from-[#0077B6] via-[#0096C7] to-[#00B4D8] hover:from-[#0284C7] hover:to-[#38BDF8] text-white font-heading font-bold text-base shadow-xl shadow-cyan-950/60 border border-white/20 transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Sparkles className="w-5 h-5 text-amber-300" />
                <span>เริ่มลอยกระทงของฉัน</span>
              </button>

              <button
                onClick={() => {
                  soundService.playWaterDrop();
                  onNavigate('/online-services');
                }}
                className="flex items-center gap-2 py-3.5 px-6 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 hover:text-white font-medium text-base border border-cyan-500/30 backdrop-blur-sm transition-all cursor-pointer"
              >
                <span>เรียนรู้บริการออนไลน์ กปภ.</span>
                <ArrowRight className="w-4 h-4 text-cyan-400" />
              </button>
            </div>
          </div>

          {/* Real-time Status / Error Notice if Database is offline */}
          {statsData && !statsData.success && (
            <div className="max-w-2xl mx-auto mb-6 p-3.5 rounded-2xl bg-amber-950/40 border border-amber-400/40 text-amber-200 text-xs flex items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  <strong>สถานะการเชื่อมต่อ:</strong> {statsData.error || 'ไม่สามารถติดต่อ Google Apps Script API ได้'}
                </span>
              </div>
              <button
                onClick={() => loadRealData(false)}
                className="text-[11px] underline hover:text-white shrink-0 cursor-pointer flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>ลองใหม่</span>
              </button>
            </div>
          )}

          {/* Live Tapi River View Showcase */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-3 px-2">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <span className="font-heading font-semibold text-sm text-cyan-100 flex items-center gap-1.5">
                  <span>สายน้ำตาปีจำลองยามค่ำคืน</span>
                  <span className="text-xs text-sky-300 font-normal hidden sm:inline">(คลิกที่กระทงเพื่ออ่านคำอธิษฐานจริง)</span>
                </span>
              </div>
              
              <div className="flex items-center gap-3">
                {statsData?.lastUpdated && (
                  <span className="text-[11px] text-slate-400 flex items-center gap-1 hidden md:flex">
                    <Clock className="w-3 h-3 text-cyan-400" />
                    <span>อัปเดต: {new Date(statsData.lastUpdated).toLocaleTimeString('th-TH')}</span>
                  </span>
                )}
                <span className="text-xs text-amber-300 font-medium">
                  {loading ? (
                    'กำลังโหลด...'
                  ) : statsData?.success ? (
                    `ลอยสำเร็จจริง ${statsData.totalFloated.toLocaleString()} กระทง`
                  ) : (
                    'ไม่สามารถโหลดข้อมูลสถิติได้'
                  )}
                </span>
              </div>
            </div>

            <TapiRiverCanvas
              floatingItems={recentKrathongs}
              onStartFloat={() => {
                soundService.playKrathongSelect();
                onNavigate('/krathong');
              }}
            />
          </div>

          {/* Activity Statistics Cards (100% Real Database from Google Sheets) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            
            {/* Card 1: จำนวนกระทงจริงที่ลอยสำเร็จ */}
            <div className="glass-panel p-5 rounded-2xl text-center space-y-1">
              <div className="w-10 h-10 mx-auto rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-300 mb-2">
                <Waves className="w-5 h-5" />
              </div>
              <div className="font-heading font-bold text-2xl sm:text-3xl text-cyan-300">
                {loading ? (
                  <span className="text-sm font-normal text-slate-400 animate-pulse">กำลังโหลด...</span>
                ) : statsData?.success ? (
                  statsData.totalFloated.toLocaleString()
                ) : (
                  <span className="text-xs text-amber-300 font-normal">ไม่สามารถโหลดข้อมูลสถิติได้</span>
                )}
              </div>
              <div className="text-xs text-slate-300">กระทงดิจิทัลที่ลอยสำเร็จจริง</div>
              {statsData?.success && (
                <div className="text-[10px] text-emerald-400 flex items-center justify-center gap-1 pt-0.5">
                  <Database className="w-2.5 h-2.5" />
                  <span>Google Sheets จริง</span>
                </div>
              )}
            </div>

            {/* Card 2: สถิติแยกตามประเภทกระทงยอดนิยม */}
            <div className="glass-panel p-5 rounded-2xl text-center space-y-1">
              <div className="w-10 h-10 mx-auto rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-300 mb-2">
                <Users className="w-5 h-5" />
              </div>
              <div className="font-heading font-bold text-2xl sm:text-3xl text-amber-300">
                {loading ? (
                  <span className="text-sm font-normal text-slate-400 animate-pulse">กำลังโหลด...</span>
                ) : statsData?.success ? (
                  statsData.totalFloated.toLocaleString()
                ) : (
                  <span className="text-xs text-amber-300 font-normal">ไม่สามารถโหลดข้อมูลสถิติได้</span>
                )}
              </div>
              <div className="text-xs text-slate-300">กิจกรรมที่บันทึกสำเร็จ</div>
              {statsData?.lastUpdated && (
                <div className="text-[10px] text-slate-400 pt-0.5 truncate" title={`อัปเดต: ${new Date(statsData.lastUpdated).toLocaleTimeString('th-TH')}`}>
                  {new Date(statsData.lastUpdated).toLocaleTimeString('th-TH')}
                </div>
              )}
            </div>

            {/* Card 3: อัตราการลดขยะ */}
            <div className="glass-panel p-5 rounded-2xl text-center space-y-1">
              <div className="w-10 h-10 mx-auto rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-300 mb-2">
                <Leaf className="w-5 h-5" />
              </div>
              <div className="font-heading font-bold text-2xl sm:text-3xl text-emerald-300">
                100%
              </div>
              <div className="text-xs text-slate-300">ลดขยะลงสู่แม่น้ำตาปี</div>
              <div className="text-[10px] text-emerald-400/80 pt-0.5">ไร้โฟม ไร้ตะปู</div>
            </div>

            {/* Card 4: ช่วงเทศกาล */}
            <div className="glass-panel p-5 rounded-2xl text-center space-y-1">
              <div className="w-10 h-10 mx-auto rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-300 mb-2">
                <Calendar className="w-5 h-5" />
              </div>
              <div className="font-heading font-bold text-base sm:text-lg text-blue-200 mt-1">
                พ.ย. ๒๕๖๙
              </div>
              <div className="text-xs text-slate-300">ช่วงเทศกาลลอยกระทง</div>
              <div className="text-[10px] text-sky-400/80 pt-0.5">กปภ. สุราษฎร์ธานี</div>
            </div>
          </div>

        </div>
      </section>

      {/* Campaign Mission & Benefits Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-[#073B66]/80 via-[#0a4878]/60 to-[#073B66]/80 rounded-3xl p-6 sm:p-10 border border-cyan-500/30 shadow-2xl backdrop-blur-md">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-emerald-500/20 text-emerald-300 text-xs font-semibold">
                <Leaf className="w-4 h-4" />
                <span>รณรงค์เพื่อสิ่งแวดล้อมที่ยั่งยืน</span>
              </div>
              <h2 className="font-heading font-bold text-2xl sm:text-3xl text-white">
                ทำไมต้องร่วม “ลอยกระทงออนไลน์ ไม่เพิ่มขยะ”?
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                การประปาส่วนภูมิภาคสาขาสุราษฎร์ธานี (ชั้นพิเศษ) ให้ความสำคัญกับการอนุรักษ์แหล่งน้ำดิบ แม่น้ำตาปีคือเส้นเลือดใหญ่ที่หล่อเลี้ยงชาวสุราษฎร์ธานี การลดกระทงจริงช่วยป้องกันน้ำเน่าเสียและรักษาคุณภาพน้ำประปาให้บริสุทธิ์เพื่อทุกคน
              </p>

              <div className="space-y-2.5 pt-2">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-200">
                    <strong>สืบสานประเพณีไทย:</strong> ขอขมาพระแม่คงคาและอธิษฐานจิตด้วยความตั้งใจอันบริสุทธิ์
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-200">
                    <strong>ลดขยะเป็นศูนย์:</strong> ไม่มีตะปู โฟม หรือซากพืชที่ตกค้างในแม่น้ำตาปี
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-200">
                    <strong>ปลอดภัยสูงสุด:</strong> ไม่เสี่ยงอุบัติเหตุทางน้ำ และไม่ต้องจุดประทัดหรือดอกไม้ไฟ
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-200">
                    <strong>ก้าวสู่สังคมดิจิทัล:</strong> เชื่อมต่อบริการประปาออนไลน์ได้ทันทีหลังลอยกระทง
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Step Guide */}
            <div className="bg-slate-950/60 rounded-2xl p-6 border border-cyan-500/20 space-y-4">
              <h3 className="font-heading font-semibold text-lg text-amber-300">
                ขั้นตอนการร่วมกิจกรรมง่ายๆ 3 ขั้นตอน
              </h3>
              
              <div className="space-y-3 text-xs text-slate-300">
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-cyan-500 text-slate-950 font-bold flex items-center justify-center shrink-0">1</span>
                  <div>
                    <strong className="text-white block">เลือกกระทงดิจิทัล 5 สไตล์</strong>
                    <span>เลือกกระทงบัวฟ้า กปภ., รักษ์สายน้ำตาปี, หรือลวดลายมงคล</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 font-bold flex items-center justify-center shrink-0">2</span>
                  <div>
                    <strong className="text-white block">พิมพ์คำอธิษฐานมงคล</strong>
                    <span>ตั้งจิตขอขมาพระแม่คงคา และขอพรเพื่อความเป็นสิริมงคล</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-emerald-400 text-slate-950 font-bold flex items-center justify-center shrink-0">3</span>
                  <div>
                    <strong className="text-white block">ปล่อยกระทงลงสู่สายน้ำตาปี</strong>
                    <span>ระบบบันทึกลง Google Sheets และออกรหัสกิจกรรมเพื่อดาวน์โหลดการ์ดที่ระลึก</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 text-center">
                <button
                  onClick={() => {
                    soundService.playKrathongSelect();
                    onNavigate('/krathong');
                  }}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 text-white font-heading font-semibold text-xs shadow-lg transition-all hover:scale-102 cursor-pointer"
                >
                  เริ่มสร้างกระทงดิจิทัลตอนนี้เลย
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
};
