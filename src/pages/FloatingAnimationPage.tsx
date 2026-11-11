import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { FastForward, Sparkles, Waves, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { KrathongArt } from '../components/krathongs/KrathongArt';
import { StorageService } from '../services/storageService';
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resultData, setResultData] = useState<any>(null);
  const timerRef = useRef<any>(null);
  const requestFiredRef = useRef(false);

  // Trigger floating and save directly to Google Sheets database via StorageService
  const startFloating = async () => {
    if (stage !== 'READY' || submitting || requestFiredRef.current) return;
    
    // Prevent double submission
    requestFiredRef.current = true;
    setSubmitting(true);
    setErrorMessage(null);

    try {
      // 1. Send data to Google Apps Script Web API via StorageService (Real Database in Google Sheets)
      const res = await StorageService.recordKrathongActivity({
        krathong_type: selectedKrathong,
        wish: wishText.trim(),
        nickname: nickname.trim(),
      });

      if (!res.success) {
        throw new Error('ไม่สามารถบันทึกลง Google Sheets ได้');
      }

      setResultData(res);
      setStage('FLOATING');
      soundService.playWishRelease();

      // 2. Animate floating progress smoothly over 6 seconds
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
      console.error('Failed to float krathong:', err);
      // Requirement: หากบันทึกไม่สำเร็จ ต้องแจ้งผู้ใช้และไม่แสดงว่าลอยสำเร็จ
      setErrorMessage(err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล Google Sheets');
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
        participantCode: data.activity_id || data.participantCode,
        floatedAt: data.created_at || data.floatedAt,
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
  const translateY = stage === 'FLOATING' ? -(progress * 3.2) : 0;
  const scale = stage === 'FLOATING' ? 1 - (progress * 0.0055) : 1;
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
          <path
            d="M0,80 Q300,40 600,40 T1200,80 L1200,120 L0,120 Z"
            fill="#052949"
          />
          <line x1="200" y1="40" x2="200" y2="120" stroke="#0077B6" strokeWidth="2" opacity="0.4" />
          <line x1="400" y1="40" x2="400" y2="120" stroke="#0077B6" strokeWidth="2" opacity="0.4" />
          <line x1="600" y1="40" x2="600" y2="120" stroke="#0077B6" strokeWidth="2" opacity="0.4" />
          <line x1="800" y1="40" x2="800" y2="120" stroke="#0077B6" strokeWidth="2" opacity="0.4" />
          <line x1="1000" y1="40" x2="1000" y2="120" stroke="#0077B6" strokeWidth="2" opacity="0.4" />
        </svg>
      </div>

      {/* Water Waves and Tapi River Surface */}
      <div className="absolute inset-0 top-[45%] pointer-events-none overflow-hidden">
        {/* Animated wave layers */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#004e89]/20 to-[#001d3d]/90" />
        
        {/* Soft floating river reflections */}
        <div className="absolute top-10 left-1/4 w-72 h-1 bg-cyan-400/20 rounded-full blur-sm animate-pulse" />
        <div className="absolute top-24 left-1/2 w-96 h-1 bg-amber-300/15 rounded-full blur-sm animate-pulse duration-1000" />
        <div className="absolute top-36 left-1/6 w-64 h-1.5 bg-cyan-300/20 rounded-full blur-sm" />
      </div>

      {/* Skip Button during floating animation */}
      {stage === 'FLOATING' && (
        <button
          onClick={handleSkip}
          className="absolute top-5 right-5 z-30 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-xs text-sky-200 border border-cyan-500/30 backdrop-blur-md flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <span>ข้ามแอนิเมชัน</span>
          <FastForward className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Central Interactive Floating Area */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[440px] px-4 pt-12 pb-6">
        
        {/* Floating Krathong Container with dynamic CSS Transform */}
        <div
          style={{
            transform: `translateY(${translateY}px) scale(${scale})`,
            opacity: opacity,
            transition: stage === 'FLOATING' ? 'transform 0.1s linear, opacity 0.1s linear' : 'all 0.5s ease-out',
          }}
          className="flex flex-col items-center select-none"
        >
          {/* Candle Flame Glow Halo */}
          <div className="relative">
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-14 h-14 bg-amber-400/30 rounded-full blur-lg animate-pulse" />
            <div className="w-48 h-48 sm:w-56 sm:h-56 filter drop-shadow-[0_15px_25px_rgba(0,180,216,0.4)]">
              <KrathongArt type={selectedKrathong} size="lg" />
            </div>
          </div>

          {/* Water Ripples directly beneath the krathong */}
          <div className="w-44 h-5 rounded-full bg-cyan-400/15 blur-sm -mt-2 animate-pulse" />

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
        
        {/* Error Notification Banner if saving to Google Sheets failed */}
        {errorMessage && stage === 'READY' && (
          <div className="mb-4 max-w-md w-full p-3.5 rounded-2xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs text-left flex items-start gap-2.5 shadow-xl animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="block text-white">บันทึกข้อมูลไม่สำเร็จ:</strong>
              <p>{errorMessage}</p>
            </div>
          </div>
        )}

        {stage === 'READY' && (
          <div className="space-y-4 max-w-md w-full">
            <p className="text-sm text-slate-200">
              แตะปุ่มด้านล่างเพื่อบันทึกและปล่อยกระทงลงสู่แม่น้ำตาปี ระบบจะส่งคำอธิษฐานบันทึกลง Google Sheets จริง
            </p>
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={onCancel}
                disabled={submitting}
                className="py-3 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-sm font-medium border border-slate-700 disabled:opacity-50 cursor-pointer"
              >
                แก้ไขคำอธิษฐาน
              </button>
              <button
                onClick={startFloating}
                disabled={submitting}
                className="flex-1 py-3.5 px-8 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-heading font-extrabold text-base shadow-xl shadow-amber-950/50 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                    <span>กำลังบันทึกลง Google Sheets...</span>
                  </>
                ) : (
                  <span>🌊 ลอยกระทงของฉัน</span>
                )}
              </button>
            </div>
          </div>
        )}

        {stage === 'FLOATING' && (
          <div className="space-y-2 max-w-md w-full">
            <div className="flex items-center justify-between text-xs text-sky-200">
              <span>กำลังบันทึกและเคลื่อนสู่สายน้ำตาปี...</span>
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
              <span>บันทึกลง Google Sheets และลอยกระทงสำเร็จ</span>
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
