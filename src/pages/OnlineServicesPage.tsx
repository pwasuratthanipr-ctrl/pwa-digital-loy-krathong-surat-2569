import React, { useState, useRef } from 'react';
import {
  Smartphone,
  ExternalLink,
  CheckCircle2,
  CreditCard,
  Droplets,
  BellRing,
  ArrowLeft,
  Check,
  MessageCircle,
  Sparkles,
  Download,
  Heart,
  Home,
  RefreshCw,
  Waves,
  Award,
} from 'lucide-react';
import { soundService } from '../services/soundService';
import { StorageService } from '../services/storageService';
import { APP_CONFIG } from '../config/appConfig';

interface OnlineServicesPageProps {
  onNavigate: (path: string) => void;
  participantCode?: string;
}

export const OnlineServicesPage: React.FC<OnlineServicesPageProps> = ({
  onNavigate,
  participantCode,
}) => {
  const [activeChoice, setActiveChoice] = useState<'REGISTER' | 'EXISTING'>('REGISTER');
  const [showThankYou, setShowThankYou] = useState<boolean>(false);
  const detailSectionRef = useRef<HTMLDivElement>(null);

  const handleChooseOption = (type: 'REGISTER' | 'EXISTING') => {
    soundService.playWaterDrop();
    setActiveChoice(type);
    if (type === 'EXISTING') {
      StorageService.recordExistingUser();
    }
    // Auto jump smoothly down to the selected section without user having to scroll
    setTimeout(() => {
      detailSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
  };

  // If user completed and clicked to view the Thank You page
  if (showThankYou) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-in fade-in duration-300">
        
        {/* Thank You Card Container */}
        <div className="relative bg-gradient-to-b from-[#073B66] via-[#042440] to-[#021425] rounded-3xl p-6 sm:p-10 border-2 border-amber-400/60 shadow-2xl overflow-hidden text-center space-y-6">
          {/* Decorative background glows */}
          <div className="absolute top-0 right-0 w-60 h-60 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-60 h-60 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Corner star motifs */}
          <div className="absolute top-3 left-3 text-amber-300/60 text-lg">✦</div>
          <div className="absolute top-3 right-3 text-amber-300/60 text-lg">✦</div>
          <div className="absolute bottom-3 left-3 text-amber-300/60 text-lg">✦</div>
          <div className="absolute bottom-3 right-3 text-amber-300/60 text-lg">✦</div>

          {/* Official Agency Logo & Header */}
          <div className="flex flex-col items-center justify-center gap-3">
            <img
              src="/assets/aistudio/logo_PWA_4b69b17d.jpg"
              alt="โลโก้ การประปาส่วนภูมิภาค"
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-contain bg-white/10 p-1 border border-white/20 shadow-lg shadow-cyan-950/60"
            />
            <div className="space-y-1">
              <span className="text-xs sm:text-sm font-semibold tracking-wide text-sky-200">
                การประปาส่วนภูมิภาคสาขาสุราษฎร์ธานี (ชั้นพิเศษ)
              </span>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-400/30">
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span>เสร็จสิ้นกิจกรรมเรียบร้อยแล้ว</span>
              </div>
            </div>
          </div>

          {/* Main Title */}
          <div className="space-y-2">
            <h1 className="font-heading font-extrabold text-2xl sm:text-4xl text-amber-300 leading-tight">
              ขอขอบพระคุณที่ร่วมกิจกรรม
            </h1>
            <p className="font-heading font-bold text-base sm:text-xl text-white">
              “ลอยกระทงออนไลน์ ส่งความสุข ไม่เพิ่มขยะ ประจำปี ๒๕๖๙”
            </p>
            <p className="text-xs sm:text-sm text-sky-200/90 max-w-xl mx-auto leading-relaxed">
              ร่วมสืบสานประเพณีไทย ขอขมาพระแม่คงคา รักษาสายน้ำตาปี และร่วมเป็นส่วนหนึ่งในการขับเคลื่อนการบริการดิจิทัลของการประปาส่วนภูมิภาค
            </p>
          </div>

          {/* Participant & Activity Summary Box */}
          <div className="bg-slate-900/80 border border-cyan-500/40 rounded-2xl p-5 text-left space-y-3.5 shadow-inner">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-cyan-900/60 pb-3">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-300" />
                <span className="text-xs text-slate-300">รหัสกิจกรรมของคุณ:</span>
              </div>
              <span className="font-mono font-bold text-amber-300 text-base sm:text-lg bg-cyan-950/80 px-3 py-1 rounded-lg border border-amber-400/40">
                {participantCode || 'LK69-000108'}
              </span>
            </div>

            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex items-start gap-2">
                <Smartphone className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-white">ช่องทางบริการที่เลือก:</strong>{' '}
                  {activeChoice === 'REGISTER'
                    ? 'สมัครบริการออนไลน์ กปภ. (PWA Plus Life / LINE @pwathailand / ระบบชำระค่าน้ำออนไลน์)'
                    : 'ยืนยันมีบัญชีบริการออนไลน์ กปภ. เรียบร้อยแล้ว'}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Waves className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-white">การอนุรักษ์สิ่งแวดล้อม:</strong>{' '}
                  ช่วยลดขยะกระทงลงสู่แม่น้ำตาปี 100% ไร้โฟมและตะปู ปกป้องแหล่งน้ำดิบผลิตน้ำประปาคุณภาพเพื่อทุกคน
                </span>
              </div>
            </div>
          </div>

          {/* Formal Gratitude Message */}
          <div className="bg-cyan-950/40 border border-cyan-500/25 rounded-2xl p-4 text-xs text-slate-200 leading-relaxed text-center sm:text-left flex items-start gap-3">
            <Heart className="w-5 h-5 text-rose-400 fill-rose-400 shrink-0 mt-0.5 hidden sm:block" />
            <p>
              การประปาส่วนภูมิภาคสาขาสุราษฎร์ธานี (ชั้นพิเศษ) ขอขอบพระคุณท่านและครอบครัวเป็นอย่างยิ่งที่ร่วมกิจกรรมเพื่อสังคมและสิ่งแวดล้อม ขอให้ท่านมีความสุข สุขภาพแข็งแรง มีน้ำประปาใสสะอาดใช้ตลอดปี และได้รับความสะดวกรวดเร็วจากบริการดิจิทัลของ กปภ.
            </p>
          </div>

          {/* Action Navigation Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => {
                soundService.playWaterDrop();
                onNavigate('/');
              }}
              className="flex-1 min-w-[180px] py-3.5 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-heading font-bold text-sm shadow-xl shadow-amber-950/40 flex items-center justify-center gap-2 transition-all hover:scale-102 active:scale-98 cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span>กลับสู่หน้าแรก</span>
            </button>

            <button
              onClick={() => {
                soundService.playWaterDrop();
                onNavigate('/krathong');
              }}
              className="flex-1 min-w-[180px] py-3.5 px-6 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 text-white font-heading font-semibold text-sm shadow-xl shadow-cyan-950/40 border border-cyan-400/30 flex items-center justify-center gap-2 transition-all hover:scale-102 active:scale-98 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>ลอยกระทงอีกใบ</span>
            </button>
          </div>

          <div className="pt-2">
            <button
              onClick={() => {
                soundService.playWaterDrop();
                setShowThankYou(false);
              }}
              className="text-xs text-sky-300 hover:text-white transition-colors underline decoration-cyan-400/50 cursor-pointer"
            >
              ← ย้อนกลับไปดูช่องทางบริการออนไลน์ กปภ.
            </button>
          </div>

        </div>

      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header Banner */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-900/60 border border-cyan-400/30 text-cyan-200 text-xs sm:text-sm font-semibold">
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>การประปาส่วนภูมิภาคสาขาสุราษฎร์ธานี (ชั้นพิเศษ)</span>
        </div>

        <h1 className="font-heading font-extrabold text-2xl sm:text-4xl text-white leading-tight">
          ก้าวสู่บริการออนไลน์กับ กปภ.
        </h1>

        <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-light">
          สะดวก รวดเร็ว เข้าถึงบริการประปาได้ง่ายขึ้นทุกที่ทุกเวลา ผ่านช่องทางออนไลน์ทางการของการประปาส่วนภูมิภาค
          (กิจกรรมลอยกระทงออนไลน์ ส่งความสุข ไม่เพิ่มขยะ ๒๕๖๙)
        </p>

        {participantCode && (
          <div className="inline-flex items-center gap-2 bg-[#073B66] border border-cyan-400/40 px-4 py-1.5 rounded-xl text-xs text-sky-200">
            <span>รหัสกิจกรรมของคุณ: <strong className="font-mono text-amber-300 text-sm">{participantCode}</strong></span>
          </div>
        )}
      </div>

      {/* 2 Main Choices: 1. สมัครออนไลน์ | 2. ฉันมีบัญชีออนไลน์อยู่แล้ว */}
      <div className="space-y-2">
        <div className="text-xs text-amber-300 text-center sm:text-left font-medium">
          ✨ กดเลือกตัวเลือกด้านล่าง ระบบจะเด้งไปที่ข้อมูลที่เลือกทันทีโดยไม่ต้องเลื่อนหา:
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Choice 1: สมัครออนไลน์ */}
          <button
            onClick={() => handleChooseOption('REGISTER')}
            className={`p-5 rounded-2xl text-left border transition-all flex flex-col justify-between cursor-pointer group hover:scale-[1.01] active:scale-99 ${
              activeChoice === 'REGISTER'
                ? 'bg-gradient-to-br from-[#0077B6] to-[#0284C7] border-amber-400 shadow-xl shadow-cyan-950/50 ring-2 ring-amber-400/40 text-white'
                : 'bg-slate-900/80 hover:bg-slate-900 border-cyan-500/20 text-slate-300'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                  activeChoice === 'REGISTER' ? 'bg-amber-400 text-slate-950' : 'bg-cyan-950 text-cyan-300'
                }`}>
                  1. สมัครออนไลน์
                </span>
                {activeChoice === 'REGISTER' && <Check className="w-5 h-5 text-amber-300" />}
              </div>
              <h3 className="font-heading font-bold text-lg text-white">
                ยังไม่มีบัญชี / สมัครออนไลน์
              </h3>
              <p className="text-xs text-sky-100 mt-1 leading-relaxed">
                เลือกโหลดแอป PWA Plus Life, เพิ่มเพื่อนใน LINE หรือใช้ระบบชำระค่าน้ำออนไลน์
              </p>
            </div>
            <span className="text-xs font-semibold mt-4 text-amber-200 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              <span>{activeChoice === 'REGISTER' ? 'กำลังแสดงช่องทางสมัครด้านล่าง ↓' : 'เลือกดูช่องทางสมัคร →'}</span>
            </span>
          </button>

          {/* Choice 2: ฉันมีบัญชีออนไลน์อยู่แล้ว */}
          <button
            onClick={() => handleChooseOption('EXISTING')}
            className={`p-5 rounded-2xl text-left border transition-all flex flex-col justify-between cursor-pointer group hover:scale-[1.01] active:scale-99 ${
              activeChoice === 'EXISTING'
                ? 'bg-gradient-to-br from-[#073B66] to-[#0a4878] border-amber-400 shadow-xl shadow-cyan-950/50 ring-2 ring-amber-400/40 text-white'
                : 'bg-slate-900/80 hover:bg-slate-900 border-cyan-500/20 text-slate-300'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                  activeChoice === 'EXISTING' ? 'bg-amber-400 text-slate-950' : 'bg-cyan-950 text-cyan-300'
                }`}>
                  2. ฉันมีบัญชีแล้ว
                </span>
                {activeChoice === 'EXISTING' && <Check className="w-5 h-5 text-amber-300" />}
              </div>
              <h3 className="font-heading font-bold text-lg text-white">
                ฉันมีบัญชีออนไลน์อยู่แล้ว
              </h3>
              <p className="text-xs text-sky-100 mt-1 leading-relaxed">
                ใช้งานแอป PWA Plus Life หรือ LINE @pwathailand ของ กปภ. อยู่แล้ว
              </p>
            </div>
            <span className="text-xs font-semibold mt-4 text-amber-200 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              <span>{activeChoice === 'EXISTING' ? 'กำลังแสดงข้อมูลยืนยันด้านล่าง ↓' : 'ยืนยันสถานะผู้ใช้บริการ →'}</span>
            </span>
          </button>
        </div>
      </div>

      {/* Anchor Ref for Auto-Scroll */}
      <div ref={detailSectionRef} className="scroll-mt-6" />

      {/* VIEW 1: สมัครออนไลน์ (3 ช่องทางหลักทางการของการประปาส่วนภูมิภาค) */}
      {activeChoice === 'REGISTER' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          <div className="text-center sm:text-left border-b border-cyan-900/60 pb-3">
            <h2 className="font-heading font-bold text-xl text-white flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-cyan-400" />
              <span>เลือกช่องทางบริการออนไลน์ที่ท่านสนใจใช้งาน:</span>
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              กดเลือกลิงก์ด้านล่างเพื่อดาวน์โหลดแอปทางการ, เพิ่มเพื่อน LINE หรือเข้าสู่ระบบชำระค่าน้ำออนไลน์
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            
            {/* 1. โหลดแอป PWA Plus Life พร้อมลิงก์ตรง iOS & Android */}
            <div className="bg-slate-900/95 border-2 border-cyan-500/40 rounded-3xl p-6 flex flex-col justify-between shadow-xl space-y-4">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-cyan-600/20 border border-cyan-400/40 text-cyan-300 flex items-center justify-center">
                  <Smartphone className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/30">
                    🔔 ดาวน์โหลดฟรี!
                  </span>
                  <h3 className="font-heading font-bold text-lg text-white mt-1.5">
                    แอป PWA Plus Life
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    ตรวจยอดค่าน้ำ ชำระเงิน แจ้งท่อแตกรั่ว และบริการครบวงจรบนมือถือ
                  </p>
                </div>
              </div>

              {/* Direct Store Download Links */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <a
                  href="https://play.google.com/store/apps/details?id=th.co.pwa.pwamobile&hl=th&gl=US"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    soundService.playWaterDrop();
                    StorageService.recordOnlineServiceInterest('app');
                  }}
                  className="w-full py-2.5 px-3.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white rounded-xl text-xs font-semibold flex items-center justify-between shadow transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Download className="w-4 h-4 text-emerald-200" />
                    <span>ระบบ Android (Google Play)</span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                </a>

                <a
                  href="https://apps.apple.com/th/app/pwa-plus-life/id1479653708?l=th"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    soundService.playWaterDrop();
                    StorageService.recordOnlineServiceInterest('app');
                  }}
                  className="w-full py-2.5 px-3.5 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white rounded-xl text-xs font-semibold flex items-center justify-between shadow transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Download className="w-4 h-4 text-sky-200" />
                    <span>ระบบ iOS (App Store)</span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                </a>
              </div>
            </div>

            {/* 2. เพิ่มเพื่อนใน LINE Official */}
            <div className="bg-slate-900/95 border-2 border-emerald-500/40 rounded-3xl p-6 flex flex-col justify-between shadow-xl space-y-4">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 border border-emerald-400/40 text-emerald-300 flex items-center justify-center">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-emerald-300 bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-400/30">
                    ไม่ต้องติดตั้งแอปเพิ่ม
                  </span>
                  <h3 className="font-heading font-bold text-lg text-white mt-1.5">
                    LINE Official กปภ.
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    เพิ่มเพื่อน @pwathailand รับการแจ้งเตือนค่าน้ำผ่านไลน์ และสอบถามข้อมูลสะดวกรวดเร็ว
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800">
                <a
                  href="https://page.line.me/pwathailand"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    soundService.playWaterDrop();
                    StorageService.recordOnlineServiceInterest('line');
                  }}
                  className="w-full py-2.5 px-3.5 bg-[#06C755] hover:bg-[#05b34c] text-white rounded-xl text-xs font-semibold flex items-center justify-between shadow transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4" />
                    <span>เพิ่มเพื่อน @pwathailand</span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                </a>
              </div>
            </div>

            {/* 3. ระบบชำระค่าน้ำออนไลน์ */}
            <div className="bg-slate-900/95 border-2 border-cyan-500/40 rounded-3xl p-6 flex flex-col justify-between shadow-xl space-y-4">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-cyan-600/20 border border-cyan-400/40 text-cyan-300 flex items-center justify-center">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-cyan-300 bg-cyan-400/10 px-2 py-0.5 rounded border border-cyan-400/30">
                    ใช้งานผ่านเว็บเบราว์เซอร์
                  </span>
                  <h3 className="font-heading font-bold text-lg text-white mt-1.5">
                    ชำระค่าน้ำออนไลน์
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    ระบบ PWA Payment Portal ตรวจสอบยอดและชำระค่าน้ำประปาออนไลน์ได้ทันที
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800">
                <a
                  href="https://payment.pwa.co.th"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    soundService.playWaterDrop();
                    StorageService.recordOnlineServiceInterest('web');
                  }}
                  className="w-full py-2.5 px-3.5 bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 text-white rounded-xl text-xs font-semibold flex items-center justify-between shadow transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    <span>เข้าสู่เว็บชำระค่าน้ำ กปภ.</span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                </a>
              </div>
            </div>

          </div>

          {/* Prominent Completion CTA at the bottom of register section */}
          <div className="p-6 bg-gradient-to-r from-[#073B66]/80 via-[#0a4878]/60 to-[#073B66]/80 rounded-3xl border-2 border-emerald-400/50 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <span className="text-xs font-bold text-emerald-300 flex items-center justify-center sm:justify-start gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span>บันทึกการเข้าร่วมและเลือกบริการออนไลน์เรียบร้อย</span>
              </span>
              <h4 className="font-heading font-bold text-lg text-white">
                พร้อมสิ้นสุดกิจกรรมแล้วใช่หรือไม่?
              </h4>
              <p className="text-xs text-sky-200">
                กดปุ่มเสร็จสิ้นกิจกรรม
              </p>
            </div>

            <button
              onClick={() => {
                soundService.playCelebration();
                setShowThankYou(true);
                window.scrollTo(0, 0);
              }}
              className="w-full sm:w-auto py-3.5 px-8 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-heading font-extrabold text-sm shadow-xl shadow-emerald-950/50 flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0"
            >
              <CheckCircle2 className="w-5 h-5 text-slate-950" />
              <span>เสร็จสิ้นกิจกรรม</span>
            </button>
          </div>

        </div>
      )}

      {/* VIEW 2: ฉันมีบัญชีออนไลน์อยู่แล้ว */}
      {activeChoice === 'EXISTING' && (
        <div className="bg-gradient-to-b from-[#073B66]/90 via-[#052949]/90 to-[#031d34]/95 rounded-3xl p-6 sm:p-8 border border-cyan-500/40 shadow-2xl space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center gap-3 border-b border-cyan-800/60 pb-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center border border-emerald-400/30 shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-xl text-white">
                ขอขอบพระคุณที่ท่านใช้บริการออนไลน์ของ กปภ. อยู่แล้ว
              </h2>
              <p className="text-xs text-sky-200 mt-0.5">
                การประปาส่วนภูมิภาคสาขาสุราษฎร์ธานี (ชั้นพิเศษ) ยินดีเป็นอย่างยิ่งที่ท่านร่วมเป็นส่วนหนึ่งของสังคมดิจิทัล
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-300">
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
              <Droplets className="w-4 h-4 text-cyan-400 mb-1" />
              <strong className="text-white block">ติดตามการใช้น้ำ</strong>
              <p className="text-[11px] text-slate-400">ตรวจสอบประวัติการใช้น้ำย้อนหลังและเปรียบเทียบในแต่ละเดือน</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
              <CreditCard className="w-4 h-4 text-amber-400 mb-1" />
              <strong className="text-white block">ชำระเงินสะดวก</strong>
              <p className="text-[11px] text-slate-400">ชำระค่าน้ำได้ทุกที่ทุกเวลา ปลอดภัย ไร้กังวล</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
              <BellRing className="w-4 h-4 text-emerald-400 mb-1" />
              <strong className="text-white block">แจ้งเตือนอัตโนมัติ</strong>
              <p className="text-[11px] text-slate-400">รับแจ้งเตือนทันทีเมื่อใบแจ้งค่าน้ำออก และประกาศซ่อมท่อ</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/20 text-xs text-sky-200/90 leading-relaxed">
            🌿 กิจกรรมนี้เป็นเพียง <strong>“ลอยกระทงออนไลน์ ส่งความสุข ไม่เพิ่มขยะ”</strong> เพื่อร่วมสืบสานประเพณีไทยและรักษาสายน้ำตาปี จังหวัดสุราษฎร์ธานี ไม่มีการแจกหรือรับของที่ระลึกใดๆ ขอให้ท่านและครอบครัวมีความสุข สุขภาพแข็งแรงตลอดไป
          </div>

          {/* Prominent Completion CTA for existing users */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-cyan-800/60">
            <div className="text-xs text-slate-300 text-center sm:text-left">
              บันทึกสถานะผู้ใช้บริการออนไลน์เดิมของท่านเรียบร้อยแล้ว
            </div>

            <button
              onClick={() => {
                soundService.playCelebration();
                setShowThankYou(true);
                window.scrollTo(0, 0);
              }}
              className="w-full sm:w-auto py-3.5 px-8 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-heading font-extrabold text-sm shadow-xl shadow-emerald-950/50 flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0"
            >
              <CheckCircle2 className="w-5 h-5 text-slate-950" />
              <span>เสร็จสิ้นกิจกรรม</span>
            </button>
          </div>

        </div>
      )}

      {/* Return to Home / Krathong button */}
      <div className="flex justify-center pt-2">
        <button
          onClick={() => {
            soundService.playWaterDrop();
            onNavigate('/');
          }}
          className="py-3 px-6 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white text-sm font-medium border border-cyan-500/30 flex items-center gap-2 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>กลับสู่หน้าแรกกิจกรรม</span>
        </button>
      </div>

    </div>
  );
};
