import React from 'react';
import { ArrowRight, Sparkles, RefreshCw, Smartphone, ShieldCheck, Waves } from 'lucide-react';
import { CertificateCard } from '../components/CertificateCard';
import { soundService } from '../services/soundService';

interface SuccessPageProps {
  participantCode: string;
  krathongType: string;
  nickname: string;
  wishText: string;
  floatedAt: string;
  onNavigate: (path: string) => void;
  onReset: () => void;
}

export const SuccessPage: React.FC<SuccessPageProps> = ({
  participantCode,
  krathongType,
  nickname,
  wishText,
  floatedAt,
  onNavigate,
  onReset,
}) => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      
      {/* Top Congratulatory Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs sm:text-sm font-semibold border border-emerald-500/30">
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>ลอยกระทงดิจิทัลสำเร็จ ๒๕๖๙</span>
        </div>

        <h1 className="font-heading font-extrabold text-2xl sm:text-4xl text-white">
          ส่งคำอธิษฐานสู่สายน้ำตาปีเรียบร้อยแล้ว
        </h1>

        <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto">
          การประปาส่วนภูมิภาคสาขาสุราษฎร์ธานี (ชั้นพิเศษ) ขอขอบพระคุณที่ท่านร่วมสืบสานประเพณีไทยและช่วยรักษาสิ่งแวดล้อม ไม่เพิ่มขยะลงสู่แหล่งน้ำ
        </p>
      </div>

      {/* Certificate Showcase Card */}
      <div className="flex justify-center">
        <CertificateCard
          participantCode={participantCode}
          krathongType={krathongType}
          nickname={nickname}
          wishText={wishText}
          floatedAt={floatedAt}
        />
      </div>

      {/* Online Services Promotion Banner (Main Strategic Objective) */}
      <div className="bg-gradient-to-r from-[#0077B6] via-[#0284C7] to-[#0369A1] rounded-3xl p-6 sm:p-8 border border-cyan-400/50 shadow-2xl text-white relative overflow-hidden">
        {/* Decorative water wave silhouette */}
        <div className="absolute -right-8 -bottom-8 opacity-15 pointer-events-none">
          <Waves className="w-72 h-72 text-white" />
        </div>

        <div className="relative z-10 space-y-4 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-white/20 text-xs font-semibold backdrop-blur-sm">
            <Smartphone className="w-4 h-4 text-amber-300" />
            <span>เป้าหมายหลัก: ขับเคลื่อนบริการดิจิทัล กปภ.</span>
          </div>

          <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-white">
            “ลอยกระทงแล้ว อย่าลืมก้าวสู่บริการออนไลน์กับ กปภ.”
          </h2>

          <p className="text-sm text-sky-100 leading-relaxed font-light">
            สะดวก รวดเร็ว เข้าถึงบริการประปาได้ง่ายขึ้น ไม่ต้องเดินทาง ไม่ต้องรอคิว ผ่านช่องทางออนไลน์ของการประปาส่วนภูมิภาค ทั้งตรวจสอบค่าน้ำ แจ้งท่อแตกรั่ว และชำระค่าน้ำผ่านมือถือ
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              onClick={() => {
                soundService.playWaterDrop();
                onNavigate('/online-services');
              }}
              className="py-3 px-6 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-heading font-bold text-sm shadow-xl transition-all hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <span>ก้าวสู่บริการออนไลน์ กปภ.</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                soundService.playKrathongSelect();
                onReset();
              }}
              className="py-3 px-5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-sm border border-white/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>ลอยกระทงอีกใบ</span>
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};
