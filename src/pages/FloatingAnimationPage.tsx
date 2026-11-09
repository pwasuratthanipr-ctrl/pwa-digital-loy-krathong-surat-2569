import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { FastForward, Sparkles, Waves, CheckCircle2 } from 'lucide-react';
import { KrathongArt } from '../components/krathongs/KrathongArt';
import { ApiService } from '../services/api';
import { KrathongTypeId } from '../types';
import { soundService } from '../services/soundService';

interface FloatingAnimationPageProps {
  selectedKrathong: KrathongTypeId;
  nickname: string;
  wishText: string;
  shareConsent: boolean;
  onCompleted: (data: {
    participantCode: string;
    floatedAt: string;
    nickname: string;
    wishText: string;
  }) => void;
  onCancel: () => void;
}

export const FloatingAnimationPage: React.FC<FloatingAnimationPageProps> = ({
  selectedKrathong,
  nickname,
  wishText,
  shareConsent,
  onCompleted,
  onCancel,
}) => {
  const [stage, setStage] = useState<'READY' | 'FLOATING' | 'SUCCESS'>('READY');
  const [progress, setProgress] = useState(0); // 0 to 100
  const [submitting, setSubmitting] = useState(false);
  const [resultData, setResultData] = useState<any>(null);
  const timerRef = useRef<any>(null);
  const requestFiredRef = useRef(false);

  // Trigger floating
  const startFloating = async () => {
    if (stage !== 'READY' || submitting || requestFiredRef.current) return;
    requestFiredRef.current = true;
    setSubmitting(true);
    setStage('FLOATING');
    soundService.playWishRelease();

    try {
      // Server submission creates participant record and returns unique code LK69-XXXXXX
      const res = await ApiService.floatKrathong({
        krathong_type: selectedKrathong,
        nickname: nickname.trim() || undefined,
        wish_text: wishText.trim(),
        share_consent: shareConsent,
        source_channel: 'WEB_DIRECT',
      });

      setResultData(res);

      // Animate progress smoothly over 6 seconds
      const startTime = Date.now();
      const duration = 6000;

      timerRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const p = Math.min(100, Math.floor((elapsed / duration) * 100));
        setProgress(p);

        if (elapsed >= duration) {
          clearInterval(timerRef.current);
          handleFinish(res);
        }
      }, 50);
    } catch (err: any) {
      alert('เกิดข้อผิดพลาดในการบันทึก: ' + err.message);
      setStage('READY');
      setSubmitting(false);
      requestFiredRef.current = false;
    }
  };

  const handleSkip = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (resultData) {
      handleFinish(resultData);
    } else {
      // If server request not returned yet, accelerate
      setProgress(100);
    }
  };

  const handleFinish = (data: any) => {
    setStage('SUCCESS');
    soundService.playCelebration();
    
    // Confetti celebration
    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.65 },
        colors: ['#00B4D8', '#F4C66A', '#F6B8D2', '#FFFFFF'],
      });
    } catch (e) {
      // Confetti fallback
    }

    setTimeout(() => {
      onCompleted({
        participantCode: data.participantCode,
        floatedAt: data.floatedAt,
        nickname: nickname.trim() || 'ผู้ร่วมอนุรักษ์สายน้ำ',
        wishText: wishText.trim(),
      });
    }, 1800);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Motion calculations based on progress
  const translateY = stage === 'FLOATING' ? -(progress * 3.2) : 0; // Moves upward towards distance
  const scale = stage === 'FLOATING' ? 1 - (progress * 0.0055) : 1; // Shrinks slightly with perspective
  const opacity = stage === 'FLOATING' ? Math.max(0.4, 1 - (progress * 0.005)) : 1;

  return (
    <div className="relative min-h-[580px] w-full max-w-5xl mx-auto rounded-3xl overflow-hidden shadow-2xl border border-cyan-500/30">
      
      {/* Sky & River Night Atmosphere */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#021124] via-[#073B66] to-[#011425]" />

      {/* Full Moon */}
      <div className="absolute top-8 right-12 pointer-events-none">
        <div className="absolute -inset-4 rounded-full bg-amber-200/20 blur-xl animate-pulse" />
        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-200 to-white shadow-[0_0_35px_rgba(254,240,138,0.6)]" />
      </div>

      {/* Sri Surat Bridge & River Horizon */}
      <div className="absolute top-[28%] left-0 right-0 h-28 pointer-events-none opacity-30">
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-full">
          <path d="M0,90 Q300,70 600,85 T1200,90 L1200,120 L0,120 Z" fill="#031A33" />
          <path d="M 680,90 L 760,30 L 840,90 Z" stroke="#00B4D8" strokeWidth="2" fill="none" />
          <line x1="760" y1="30" x2="760" y2="90" stroke="#00B4D8" strokeWidth="3" />
          <line x1="500" y1="90" x2="1000" y2="90" stroke="#0077B6" strokeWidth="4" />
        </svg>
      </div>

      {/* Moon Reflection on River */}
      <div className="absolute top-[32%] right-16 w-20 h-72 bg-gradient-to-b from-amber-200/20 via-amber-300/10 to-transparent blur-md pointer-events-none" />

      {/* Animated River Ripples */}
      <div className="absolute inset-x-0 bottom-0 h-[65%] pointer-events-none overflow-hidden">
        <svg viewBox="0 0 1000 400" preserveAspectRatio="none" className="w-full h-full opacity-40">
          <path d="M 0,60 Q 250,35 500,60 T 1000,60" stroke="#90E0EF" strokeWidth="1.5" fill="none" />
          <path d="M 0,130 Q 250,105 500,130 T 1000,130" stroke="#CAF0F8" strokeWidth="2" fill="none" />
          <path d="M 0,210 Q 250,180 500,210 T 1000,210" stroke="#00B4D8" strokeWidth="2.5" fill="none" />
          <path d="M 0,310 Q 250,280 500,310 T 1000,310" stroke="#0077B6" strokeWidth="3" fill="none" />
        </svg>
      </div>

      {/* Header Info Banner */}
      <div className="relative z-20 p-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Waves className="w-5 h-5 text-cyan-400" />
          <span className="text-xs sm:text-sm font-semibold text-sky-200">
            แม่น้ำตาปี • กปภ.สาขาสุราษฎร์ธานี (ชั้นพิเศษ)
          </span>
        </div>

        {stage === 'FLOATING' && (
          <button
            onClick={handleSkip}
            className="flex items-center gap-1.5 py-1.5 px-3.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-xs font-semibold text-cyan-300 border border-cyan-500/30 shadow backdrop-blur-sm transition-all"
          >
            <span>ข้าม Animation</span>
            <FastForward className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Floating Canvas Center */}
      <div className="relative z-10 w-full h-[400px] flex items-center justify-center">
        
        {/* Animated Krathong Vessel */}
        <div
          style={{
            transform: `translateY(${translateY}px) scale(${scale})`,
            opacity,
            transition: 'transform 0.1s linear, opacity 0.1s linear',
          }}
          className="relative flex flex-col items-center"
        >
          {/* Dynamic Ripple around Krathong */}
          {stage === 'FLOATING' && (
            <div className="absolute -bottom-4 w-44 h-12 bg-cyan-400/20 rounded-full blur-md animate-ping" />
          )}

          <div className="animate-float-gentle">
            <KrathongArt type={selectedKrathong} size={220} animateFlame={true} />
          </div>

          {/* Nickname and floating badge */}
          <div className="mt-3 text-center">
            <span className="px-3 py-1 bg-slate-950/80 text-amber-300 font-medium text-xs rounded-full border border-amber-400/40 shadow">
              {nickname || 'ผู้ร่วมอนุรักษ์สายน้ำ'}
            </span>
          </div>
        </div>

      </div>

      {/* Bottom Controls / Status Bar */}
      <div className="relative z-20 p-6 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent flex flex-col items-center text-center">
        
        {stage === 'READY' && (
          <div className="space-y-4 max-w-md w-full">
            <p className="text-sm text-slate-200">
              แตะปุ่มด้านล่างเพื่อปล่อยกระทงลงสู่แม่น้ำตาปี พร้อมส่งคำอธิษฐานของคุณล่องลอยไปกับสายน้ำ
            </p>
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={onCancel}
                className="py-3 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-sm font-medium border border-slate-700"
              >
                แก้ไขคำอธิษฐาน
              </button>
              <button
                onClick={startFloating}
                disabled={submitting}
                className="flex-1 py-3.5 px-8 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-heading font-extrabold text-base shadow-xl shadow-amber-950/50 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
              >
                {submitting ? 'กำลังนำส่งสู่แม่น้ำ...' : '🌊 ลอยกระทงของฉัน'}
              </button>
            </div>
          </div>
        )}

        {stage === 'FLOATING' && (
          <div className="space-y-2 max-w-md w-full">
            <div className="flex items-center justify-between text-xs text-sky-200">
              <span>กำลังเคลื่อนสู่สายน้ำตาปี...</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden border border-cyan-500/20">
              <div
                style={{ width: `${progress}%` }}
                className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-amber-400 transition-all duration-75"
              />
            </div>
            <p className="text-xs text-slate-400 italic pt-1">
              “ขอบคุณที่ร่วมสืบสานประเพณีไทย และช่วยรักษาสายน้ำให้สะอาดไปด้วยกัน”
            </p>
          </div>
        )}

        {stage === 'SUCCESS' && (
          <div className="space-y-2 animate-in fade-in zoom-in duration-300">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 text-sm font-semibold border border-emerald-500/40">
              <CheckCircle2 className="w-4 h-4" />
              <span>ลอยกระทงสำเร็จเรียบร้อยแล้ว</span>
            </div>
            <p className="text-xs text-slate-300">
              กำลังนำท่านไปยังหน้ารับบัตรลอยกระทงดิจิทัล...
            </p>
          </div>
        )}

      </div>

    </div>
  );
};
