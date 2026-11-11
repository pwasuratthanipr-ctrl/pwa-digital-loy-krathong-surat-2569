import React, { useState } from 'react';
import { KrathongArt } from '../krathongs/KrathongArt';
import { soundService } from '../../services/soundService';
import { normalizeKrathongTypeId } from '../../services/googleSheetsService';
import { Sparkles } from 'lucide-react';

interface FloatingKrathongItem {
  id: string;
  nickname: string;
  krathong_type: string;
  wish_text: string;
  floated_at?: string;
  water_coordinates_x?: number;
  water_coordinates_y?: number;
}

interface TapiRiverCanvasProps {
  floatingItems?: FloatingKrathongItem[];
  highlightCode?: string;
  className?: string;
  onStartFloat?: () => void;
  activeItem?: {
    type: string;
    nickname?: string;
    wish?: string;
  };
}

export const TapiRiverCanvas: React.FC<TapiRiverCanvasProps> = ({
  floatingItems = [],
  highlightCode,
  className = '',
  onStartFloat,
  activeItem,
}) => {
  const [selectedWish, setSelectedWish] = useState<FloatingKrathongItem | null>(null);

  return (
    <div className={`relative w-full overflow-hidden rounded-2xl select-none shadow-2xl border border-cyan-900/40 ${className}`}>
      {/* Sky & River Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#021124] via-[#073B66] to-[#011425]" />

      {/* Stars Background */}
      <div className="absolute inset-0 pointer-events-none opacity-80">
        <div className="absolute top-[8%] left-[12%] w-1.5 h-1.5 bg-white rounded-full animate-ping opacity-75" />
        <div className="absolute top-[14%] left-[28%] w-1 h-1 bg-amber-100 rounded-full animate-pulse opacity-90" />
        <div className="absolute top-[6%] left-[65%] w-2 h-2 bg-blue-100 rounded-full opacity-60" />
        <div className="absolute top-[22%] left-[82%] w-1.5 h-1.5 bg-yellow-200 rounded-full animate-pulse opacity-80" />
        <div className="absolute top-[18%] left-[45%] w-1 h-1 bg-white rounded-full opacity-70" />
        <div className="absolute top-[11%] left-[90%] w-1.5 h-1.5 bg-amber-200 rounded-full animate-ping opacity-60" />
        <div className="absolute top-[25%] left-[15%] w-1 h-1 bg-cyan-200 rounded-full opacity-80" />
      </div>

      {/* Full Moon with Golden Glow */}
      <div className="absolute top-6 right-8 sm:right-16 pointer-events-none">
        {/* Glow halo */}
        <div className="absolute -inset-6 rounded-full bg-amber-300/20 blur-xl animate-pulse" />
        <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-amber-200 via-amber-100 to-white shadow-[0_0_40px_rgba(254,240,138,0.7)] flex items-center justify-center">
          {/* Subtle moon surface crater details */}
          <div className="w-3 h-3 rounded-full bg-amber-200/50 absolute top-3 left-4 blur-[1px]" />
          <div className="w-5 h-4 rounded-full bg-amber-200/40 absolute bottom-4 right-4 blur-[1px]" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-300/30 absolute top-8 right-6 blur-[1px]" />
        </div>
      </div>

      {/* Sri Surat Bridge & Tapi Riverside Silhouette */}
      <div className="absolute bottom-[44%] left-0 right-0 h-24 pointer-events-none opacity-40">
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-full">
          {/* Distant mountains / tree line */}
          <path d="M0,90 Q200,60 400,85 T800,70 T1200,90 L1200,120 L0,120 Z" fill="#031A33" />
          
          {/* Sri Surat Bridge Arch & Cable Stayed silhouette */}
          <path d="M 650,90 L 750,25 L 850,90 Z" stroke="#00B4D8" strokeWidth="2" fill="none" opacity="0.6" />
          <line x1="750" y1="25" x2="750" y2="90" stroke="#00B4D8" strokeWidth="3" />
          <line x1="750" y1="35" x2="680" y2="90" stroke="#00B4D8" strokeWidth="1" opacity="0.4" />
          <line x1="750" y1="45" x2="710" y2="90" stroke="#00B4D8" strokeWidth="1" opacity="0.4" />
          <line x1="750" y1="35" x2="820" y2="90" stroke="#00B4D8" strokeWidth="1" opacity="0.4" />
          <line x1="750" y1="45" x2="790" y2="90" stroke="#00B4D8" strokeWidth="1" opacity="0.4" />
          
          {/* Bridge deck */}
          <line x1="500" y1="90" x2="1000" y2="90" stroke="#0077B6" strokeWidth="4" />
          
          {/* Lamphu Island Palm silhouettes */}
          <path d="M 150,95 Q 160,70 170,95 M 160,70 Q 140,65 130,75 M 160,70 Q 180,65 190,75 M 160,70 Q 160,50 160,50" stroke="#021124" strokeWidth="2.5" fill="none" />
          <path d="M 220,98 Q 230,75 240,98 M 230,75 Q 210,70 200,80 M 230,75 Q 250,70 260,80" stroke="#021124" strokeWidth="2.5" fill="none" />
        </svg>
      </div>

      {/* Moon reflection column on Tapi River water */}
      <div className="absolute top-[48%] right-10 sm:right-20 w-16 sm:w-24 h-48 bg-gradient-to-b from-amber-200/25 via-amber-300/10 to-transparent blur-md pointer-events-none transform -skew-x-12" />

      {/* Animated River Waves Layers */}
      <div className="absolute bottom-0 left-0 right-0 h-[52%] pointer-events-none overflow-hidden">
        {/* Wave layer 1 */}
        <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-[#0077B6]/30 to-transparent animate-wave" />
        
        {/* River Ripples SVG */}
        <svg viewBox="0 0 1000 300" preserveAspectRatio="none" className="w-full h-full opacity-35">
          <path d="M 0,40 Q 250,15 500,40 T 1000,40" stroke="#90E0EF" strokeWidth="1.5" fill="none" />
          <path d="M 0,90 Q 250,65 500,90 T 1000,90" stroke="#CAF0F8" strokeWidth="1.5" fill="none" />
          <path d="M 0,150 Q 250,120 500,150 T 1000,150" stroke="#90E0EF" strokeWidth="2" fill="none" />
          <path d="M 0,220 Q 250,190 500,220 T 1000,220" stroke="#00B4D8" strokeWidth="2.5" fill="none" />
        </svg>
      </div>

      {/* Floating Krathongs on the River */}
      <div className="relative w-full h-[380px] sm:h-[460px] z-10">
        {/* Floating Items from public */}
        {floatingItems.slice(0, 16).map((item, index) => {
          // Deterministic coordinates based on index and item id
          const posX = item.water_coordinates_x || (12 + (index * 19) % 76);
          const posY = item.water_coordinates_y || (48 + (index * 11) % 40);
          const scale = 0.55 + (posY / 100) * 0.45; // Depth perspective: lower is closer and larger
          const normalizedType = normalizeKrathongTypeId(item.krathong_type);

          return (
            <div
              key={item.id || index}
              onClick={() => {
                soundService.playWaterDrop();
                setSelectedWish(item);
              }}
              style={{
                left: `${posX}%`,
                top: `${posY}%`,
                transform: `scale(${scale})`,
              }}
              className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform hover:scale-110 hover:z-30 group"
              title={`กระทงของ: ${item.nickname}`}
            >
              <div className="animate-river-drift" style={{ animationDelay: `${index * 0.6}s` }}>
                <KrathongArt type={normalizedType} size={90} />
                
                {/* Floating Nickname Tag */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-900/90 text-amber-300 text-xs px-2 py-0.5 rounded border border-amber-400/40 pointer-events-none shadow-lg">
                  {item.nickname}
                </div>
              </div>
            </div>
          );
        })}

        {/* Empty State Overlay when no krathongs are floating yet */}
        {floatingItems.length === 0 && !activeItem && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-20 px-4 text-center">
            <div className="bg-slate-950/80 backdrop-blur-md px-6 py-5 rounded-2xl border border-cyan-500/40 max-w-sm sm:max-w-md shadow-2xl pointer-events-auto space-y-2 animate-in fade-in zoom-in-95 duration-200">
              <div className="w-10 h-10 mx-auto rounded-full bg-cyan-500/20 text-amber-300 flex items-center justify-center border border-cyan-400/30">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <h4 className="text-sm sm:text-base font-heading font-semibold text-amber-300">
                ยังไม่มีกระทงในสายน้ำตาปี
              </h4>
              <p className="text-xs text-sky-200 leading-relaxed">
                ร่วมเป็นคนแรกที่ปล่อยกระทงดิจิทัล ส่งความสุข ไม่เพิ่มขยะ คืนนี้
              </p>
              {onStartFloat && (
                <button
                  onClick={() => {
                    soundService.playKrathongSelect();
                    onStartFloat();
                  }}
                  className="mt-2 py-2 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-heading font-bold shadow-lg transition-all hover:scale-105 active:scale-95 cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>เริ่มลอยกระทงของคุณ</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* User Active/Preview Floating Krathong (if launched) */}
        {activeItem && (
          <div className="absolute left-1/2 bottom-12 -translate-x-1/2 z-20 flex flex-col items-center">
            <div className="animate-float-gentle">
              <KrathongArt type={normalizeKrathongTypeId(activeItem.type)} size={160} />
            </div>
            {activeItem.nickname && (
              <span className="mt-2 text-xs font-medium text-amber-200 bg-slate-950/80 px-3 py-1 rounded-full border border-amber-400/30">
                กระทงของคุณ: {activeItem.nickname}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Tapi River Label overlay */}
      <div className="absolute bottom-3 left-4 z-20 flex items-center gap-2 text-xs text-sky-200/80 bg-slate-950/50 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-cyan-500/20">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span>บรรยากาศแม่น้ำตาปี จ.สุราษฎร์ธานี • คืนวันเพ็ญเดือนสิบสอง ๒๕๖๙</span>
      </div>

      {/* Clicked Wish Modal Popup */}
      {selectedWish && (
        <div
          onClick={() => setSelectedWish(null)}
          className="absolute inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-slate-900/95 border border-amber-400/50 rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="w-16 h-16 mx-auto -mt-2 mb-2 flex items-center justify-center">
              <KrathongArt type={normalizeKrathongTypeId(selectedWish.krathong_type)} size={70} />
            </div>
            <h4 className="text-amber-300 font-heading font-semibold text-lg">
              คำอธิษฐานของ {selectedWish.nickname}
            </h4>
            <p className="mt-3 text-slate-200 text-sm leading-relaxed italic bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              "{selectedWish.wish_text}"
            </p>
            <p className="mt-3 text-xs text-slate-400">
              ลอยสู่แม่น้ำตาปี • ร่วมส่งความสุข ไม่เพิ่มขยะ
            </p>
            <button
              onClick={() => {
                soundService.playWaterDrop();
                setSelectedWish(null);
              }}
              className="mt-5 w-full py-2 bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
