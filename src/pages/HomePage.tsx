import React, { useEffect, useState } from 'react';
import { Sparkles, ArrowRight, ShieldCheck, Leaf, Waves, CheckCircle2, Calendar, Users, Eye, FileText, ExternalLink } from 'lucide-react';
import { TapiRiverCanvas } from '../components/river/TapiRiverCanvas';
import { StorageService, PublicStats, FloatingItem } from '../services/storageService';
import { soundService } from '../services/soundService';
import { APP_CONFIG } from '../config/appConfig';

interface HomePageProps {
  onNavigate: (path: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [recentKrathongs, setRecentKrathongs] = useState<FloatingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Client-side local data loading (Instant, zero backend latency)
    try {
      const statsData = StorageService.getPublicStats();
      const krathongsData = StorageService.getRecentKrathongs();
      setStats(statsData);
      setRecentKrathongs(krathongsData);
    } catch (err) {
      console.error('Failed to load local data:', err);
    } finally {
      setLoading(false);
    }
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
              ลอยกระทงฟรี ไม่ต้องลงทะเบียนล่วงหน้า ปลอดภัย ไร้มลพิษ
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

          {/* Live Tapi River View Showcase */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-3 px-2">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <span className="font-heading font-semibold text-sm text-cyan-100">
                  สายน้ำตาปีจำลองยามค่ำคืน (คลิกที่กระทงเพื่ออ่านคำอธิษฐาน)
                </span>
              </div>
              <span className="text-xs text-slate-400 hidden sm:inline">
                สถิติลอยสำเร็จ {stats?.totalFloatedKrathongs || 0} กระทง
              </span>
            </div>

            <TapiRiverCanvas floatingItems={recentKrathongs} />
          </div>

          {/* Activity Statistics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <div className="glass-panel p-5 rounded-2xl text-center space-y-1">
              <div className="w-10 h-10 mx-auto rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-300 mb-2">
                <Waves className="w-5 h-5" />
              </div>
              <div className="font-heading font-bold text-2xl sm:text-3xl text-cyan-300">
                {stats ? stats.totalFloatedKrathongs.toLocaleString() : '...'}
              </div>
              <div className="text-xs text-slate-300">กระทงดิจิทัลที่ลอยสำเร็จ</div>
            </div>

            <div className="glass-panel p-5 rounded-2xl text-center space-y-1">
              <div className="w-10 h-10 mx-auto rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-300 mb-2">
                <Users className="w-5 h-5" />
              </div>
              <div className="font-heading font-bold text-2xl sm:text-3xl text-amber-300">
                {stats ? stats.uniqueParticipants.toLocaleString() : '...'}
              </div>
              <div className="text-xs text-slate-300">ผู้เข้าร่วมกิจกรรมไม่ซ้ำ</div>
            </div>

            <div className="glass-panel p-5 rounded-2xl text-center space-y-1">
              <div className="w-10 h-10 mx-auto rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-300 mb-2">
                <Leaf className="w-5 h-5" />
              </div>
              <div className="font-heading font-bold text-2xl sm:text-3xl text-emerald-300">
                100%
              </div>
              <div className="text-xs text-slate-300">ลดขยะลงสู่แม่น้ำตาปี</div>
            </div>

            <div className="glass-panel p-5 rounded-2xl text-center space-y-1">
              <div className="w-10 h-10 mx-auto rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-300 mb-2">
                <Calendar className="w-5 h-5" />
              </div>
              <div className="font-heading font-bold text-base sm:text-lg text-blue-200 mt-1">
                พ.ย. ๒๕๖๙
              </div>
              <div className="text-xs text-slate-300">ช่วงเทศกาลลอยกระทง</div>
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
              
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/5">
                  <div className="w-8 h-8 rounded-full bg-cyan-600 text-white font-bold text-sm flex items-center justify-center shrink-0">
                    1
                  </div>
                  <div>
                    <div className="font-semibold text-white text-sm">เลือกกระทงดิจิทัล 5 สไตล์</div>
                    <div className="text-xs text-slate-400">กระทง กปภ., รักษ์โลก, ดอกบัว, แสงจันทร์ หรือสายน้ำตาปี</div>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/5">
                  <div className="w-8 h-8 rounded-full bg-cyan-600 text-white font-bold text-sm flex items-center justify-center shrink-0">
                    2
                  </div>
                  <div>
                    <div className="font-semibold text-white text-sm">พิมพ์คำอธิษฐานความสุข</div>
                    <div className="text-xs text-slate-400">เลือกคำอวยพรมงคลสำเร็จรูป หรือพิมพ์คำอธิษฐานในใจ</div>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/5">
                  <div className="w-8 h-8 rounded-full bg-cyan-600 text-white font-bold text-sm flex items-center justify-center shrink-0">
                    3
                  </div>
                  <div>
                    <div className="font-semibold text-white text-sm">ลอยสู่แม่น้ำตาปี & รับรหัสกิจกรรม</div>
                    <div className="text-xs text-slate-400">บันทึกบัตรลอยกระทง แชร์ให้เพื่อน และก้าวสู่บริการออนไลน์ กปภ.</div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  soundService.playKrathongSelect();
                  onNavigate('/krathong');
                }}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-heading font-bold text-sm rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
              >
                ร่วมลอยกระทงออนไลน์เลย
              </button>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
};
