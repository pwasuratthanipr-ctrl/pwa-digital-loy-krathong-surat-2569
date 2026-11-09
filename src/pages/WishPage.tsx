import React, { useState } from 'react';
import { Sparkles, ArrowLeft, ArrowRight, ShieldCheck, Heart, AlertCircle } from 'lucide-react';
import { KRATHONG_OPTIONS, KrathongArt } from '../components/krathongs/KrathongArt';
import { KrathongTypeId } from '../types';
import { soundService } from '../services/soundService';

interface WishPageProps {
  selectedKrathong: KrathongTypeId;
  nickname: string;
  wishText: string;
  shareConsent: boolean;
  onUpdateNickname: (val: string) => void;
  onUpdateWishText: (val: string) => void;
  onUpdateShareConsent: (val: boolean) => void;
  onNext: () => void;
  onBack: () => void;
}

const PRESET_WISHES = [
  'ขอให้ครอบครัวมีความสุขและสุขภาพแข็งแรง',
  'ขอให้การงานราบรื่น ประสบความสำเร็จ',
  'ขอให้มีแต่สิ่งดี ๆ เข้ามาในชีวิต',
  'ขอให้สายน้ำสะอาดและธรรมชาติอุดมสมบูรณ์',
  'ขอให้ปีนี้เป็นปีแห่งความสุขและความโชคดี',
  'ขอขมาพระแม่คงคา ร่วมอนุรักษ์แม่น้ำตาปีกับ กปภ.',
];

export const WishPage: React.FC<WishPageProps> = ({
  selectedKrathong,
  nickname,
  wishText,
  shareConsent,
  onUpdateNickname,
  onUpdateWishText,
  onUpdateShareConsent,
  onNext,
  onBack,
}) => {
  const [error, setError] = useState('');
  const currentOption = KRATHONG_OPTIONS.find(k => k.id === selectedKrathong) || KRATHONG_OPTIONS[0];

  const handleWishChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    if (val.length <= 200) {
      onUpdateWishText(val);
      if (error) setError('');
    }
  };

  const handleSelectPreset = (preset: string) => {
    soundService.playWaterDrop();
    onUpdateWishText(preset);
    if (error) setError('');
  };

  const handleSubmit = () => {
    if (!wishText.trim()) {
      setError('กรุณากรอกคำอธิษฐาน หรือเลือกคำอธิษฐานมงคลสำเร็จรูปด้านล่าง');
      return;
    }
    soundService.playWishRelease();
    onNext();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-2 text-xs font-semibold">
        <span className="w-6 h-6 rounded-full bg-cyan-900 text-cyan-300 flex items-center justify-center">✓</span>
        <span className="text-slate-400">เลือกกระทง</span>
        <span className="text-slate-600">———</span>
        <span className="w-6 h-6 rounded-full bg-cyan-500 text-white flex items-center justify-center">2</span>
        <span className="text-cyan-300">เขียนคำอธิษฐาน</span>
        <span className="text-slate-600">———</span>
        <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center">3</span>
        <span className="text-slate-400">ลอยสู่แม่น้ำตาปี</span>
      </div>

      {/* Main Container */}
      <div className="bg-gradient-to-b from-[#073B66]/90 via-[#052949]/90 to-[#031d34]/95 rounded-3xl p-6 sm:p-8 border border-cyan-500/30 shadow-2xl backdrop-blur-md">
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Krathong Preview */}
          <div className="md:col-span-4 flex flex-col items-center text-center p-4 rounded-2xl bg-slate-950/40 border border-cyan-500/20">
            <span className="text-xs text-amber-300 font-semibold mb-2">กระทงที่เลือก</span>
            <div className="w-40 h-40 flex items-center justify-center animate-float-gentle">
              <KrathongArt type={selectedKrathong} size={150} />
            </div>
            <h3 className="font-heading font-bold text-base text-white mt-2">
              {currentOption.name}
            </h3>
            <p className="text-xs text-cyan-200 mt-1">{currentOption.symbolism}</p>
            <button
              onClick={onBack}
              className="mt-4 text-xs text-slate-400 hover:text-cyan-300 underline transition-colors"
            >
              เปลี่ยนรูปแบบกระทง
            </button>
          </div>

          {/* Right Column: Wish Form */}
          <div className="md:col-span-8 space-y-5">
            <div>
              <h2 className="font-heading font-bold text-2xl text-white">
                เขียนคำอธิษฐานของคุณ
              </h2>
              <p className="text-xs text-slate-300 mt-1">
                ส่งความสุข ขอขมาพระแม่คงคา และตั้งจิตอธิษฐานเพื่อความเป็นสิริมงคล
              </p>
            </div>

            {/* Nickname input */}
            <div className="space-y-1.5">
              <label htmlFor="nickname" className="block text-xs font-semibold text-slate-300">
                ชื่อหรือนามสมมติ <span className="text-slate-500 font-normal">(ไม่บังคับ)</span>
              </label>
              <input
                id="nickname"
                type="text"
                maxLength={40}
                value={nickname}
                onChange={e => onUpdateNickname(e.target.value)}
                placeholder="เช่น สมชาย, ครอบครัวใจดี, ชาวสุราษฎร์ฯ"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950/70 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
              />
            </div>

            {/* Wish Textarea */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="wish" className="block text-xs font-semibold text-slate-300">
                  คำอธิษฐาน <span className="text-rose-400">*</span>
                </label>
                <span className={`text-xs ${wishText.length >= 190 ? 'text-amber-400 font-bold' : 'text-slate-400'}`}>
                  {wishText.length}/200 ตัวอักษร
                </span>
              </div>
              <textarea
                id="wish"
                rows={4}
                value={wishText}
                onChange={handleWishChange}
                placeholder="พิมพ์คำอธิษฐานของคุณที่นี่ หรือกดเลือกคำอธิษฐานสำเร็จรูปด้านล่าง..."
                className="w-full px-4 py-3 rounded-xl bg-slate-950/70 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all resize-none leading-relaxed"
              />
              {error && (
                <div className="flex items-center gap-1.5 text-xs text-rose-400 font-medium pt-0.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            {/* Quick Preset Wish Buttons */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-amber-300 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>คำอธิษฐานมงคลสำเร็จรูป (แตะเพื่อเลือก):</span>
              </span>
              <div className="flex flex-wrap gap-2">
                {PRESET_WISHES.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className="text-xs py-1.5 px-3 rounded-lg bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-500/30 text-cyan-200 hover:text-white transition-all text-left"
                  >
                    + {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Consent & Privacy Notice Checkbox */}
            <div className="p-3.5 rounded-xl bg-slate-950/50 border border-cyan-500/20 space-y-2">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={shareConsent}
                  onChange={e => onUpdateShareConsent(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-slate-700 text-cyan-600 focus:ring-cyan-500 bg-slate-900"
                />
                <span className="text-xs text-slate-300 leading-relaxed">
                  ยินยอมให้แสดงคำอธิษฐานและชื่อเล่นของฉันในสายน้ำตาปีจำลอง (แบบไม่เปิดเผยข้อมูลส่วนบุคคลที่ระบุตัวตน)
                </span>
              </label>

              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>กปภ. เคารพสิทธิความเป็นส่วนตัว (PDPA) ไม่จัดเก็บข้อมูลระบุตัวตนโดยไม่จำเป็น</span>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center gap-4 pt-3">
              <button
                type="button"
                onClick={onBack}
                className="py-3 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-medium text-sm flex items-center gap-2 border border-slate-700 transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>ย้อนกลับ</span>
              </button>

              <button
                type="button"
                onClick={handleSubmit}
                className="flex-1 py-3 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-heading font-bold text-base flex items-center justify-center gap-2 shadow-xl shadow-amber-950/40 transition-all hover:scale-102 active:scale-98"
              >
                <span>พร้อมลอยกระทง</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
