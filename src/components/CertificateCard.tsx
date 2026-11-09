import React, { useRef, useState } from 'react';
import { Download, Share2, Check, Sparkles, Waves, Award } from 'lucide-react';
import { KrathongArt, KRATHONG_OPTIONS, getKrathongSvgMarkup } from './krathongs/KrathongArt';
import { soundService } from '../services/soundService';

interface CertificateCardProps {
  participantCode: string;
  krathongType: string;
  nickname: string;
  wishText: string;
  floatedAt: string;
}

// Helper to draw rounded rectangle on Canvas safely
function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  if (typeof ctx.roundRect === 'function') {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
  } else {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
}

// Helper to wrap Thai and English text on Canvas
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  let tokens: string[] = [];
  if (typeof Intl !== 'undefined' && (Intl as any).Segmenter) {
    try {
      const segmenter = new (Intl as any).Segmenter('th', { granularity: 'word' });
      tokens = Array.from(segmenter.segment(text)).map((s: any) => s.segment);
    } catch {
      tokens = text.split('');
    }
  } else {
    tokens = text.includes(' ') ? text.split(' ') : text.split('');
  }

  const lines: string[] = [];
  let currentLine = '';

  for (const token of tokens) {
    const testLine = currentLine + token;
    const testWidth = ctx.measureText(testLine).width;
    if (testWidth > maxWidth && currentLine !== '') {
      lines.push(currentLine);
      currentLine = token;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines;
}

export const CertificateCard: React.FC<CertificateCardProps> = ({
  participantCode,
  krathongType,
  nickname,
  wishText,
  floatedAt,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  const krathongDetail = KRATHONG_OPTIONS.find((k) => k.id === krathongType) || KRATHONG_OPTIONS[0];

  const formattedDate = new Date(floatedAt).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Client-side HTML Canvas image generation with real Krathong artwork
  const handleDownloadImage = async () => {
    soundService.playCapture();
    setDownloading(true);
    try {
      const W = 1080;
      const H = 1440;
      const canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // 1. Deep Midnight Blue & River Water Gradient Background
      const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
      bgGrad.addColorStop(0, '#020C1B');
      bgGrad.addColorStop(0.25, '#041D38');
      bgGrad.addColorStop(0.65, '#073B66');
      bgGrad.addColorStop(1, '#011224');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      // 2. Full Moon & Golden Moonlight Glow (Top-Right)
      const moonGlow = ctx.createRadialGradient(900, 190, 20, 900, 190, 220);
      moonGlow.addColorStop(0, 'rgba(254, 240, 138, 0.45)');
      moonGlow.addColorStop(0.5, 'rgba(250, 204, 21, 0.15)');
      moonGlow.addColorStop(1, 'rgba(250, 204, 21, 0)');
      ctx.fillStyle = moonGlow;
      ctx.beginPath();
      ctx.arc(900, 190, 220, 0, Math.PI * 2);
      ctx.fill();

      // Moon Disc
      const moonGrad = ctx.createRadialGradient(880, 175, 10, 900, 190, 70);
      moonGrad.addColorStop(0, '#FFFDF0');
      moonGrad.addColorStop(0.7, '#FEF08A');
      moonGrad.addColorStop(1, '#FACC15');
      ctx.fillStyle = moonGrad;
      ctx.beginPath();
      ctx.arc(900, 190, 70, 0, Math.PI * 2);
      ctx.fill();

      // Soft clouds/mist across the moon
      ctx.fillStyle = 'rgba(7, 59, 102, 0.4)';
      ctx.beginPath();
      ctx.ellipse(870, 220, 90, 18, -0.15, 0, Math.PI * 2);
      ctx.fill();

      // 3. Starlight / Sparkles in the night sky
      const stars = [
        { x: 120, y: 140, r: 2.5, alpha: 0.8 },
        { x: 220, y: 90, r: 1.8, alpha: 0.6 },
        { x: 340, y: 160, r: 2.2, alpha: 0.7 },
        { x: 480, y: 100, r: 3, alpha: 0.9 },
        { x: 620, y: 150, r: 2, alpha: 0.6 },
        { x: 740, y: 90, r: 2.8, alpha: 0.8 },
        { x: 160, y: 260, r: 2.2, alpha: 0.6 },
        { x: 970, y: 340, r: 2.5, alpha: 0.7 },
      ];
      stars.forEach((st) => {
        ctx.fillStyle = `rgba(255, 255, 255, ${st.alpha})`;
        ctx.beginPath();
        ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
        ctx.fill();
        // 4-point sparkle cross
        ctx.strokeStyle = `rgba(254, 240, 138, ${st.alpha * 0.7})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(st.x - st.r * 3, st.y);
        ctx.lineTo(st.x + st.r * 3, st.y);
        ctx.moveTo(st.x, st.y - st.r * 3);
        ctx.lineTo(st.x, st.y + st.r * 3);
        ctx.stroke();
      });

      // 4. Modern Glass Card Outer & Inner Borders
      const margin = 44;
      const cardW = W - margin * 2;
      const cardH = H - margin * 2;

      // Outer Gold Foil Border
      ctx.strokeStyle = '#F4C66A';
      ctx.lineWidth = 4;
      drawRoundRect(ctx, margin, margin, cardW, cardH, 36);
      ctx.stroke();

      // Inner Cyan Glow Border
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
      ctx.lineWidth = 1.5;
      drawRoundRect(ctx, margin + 12, margin + 12, cardW - 24, cardH - 24, 28);
      ctx.stroke();

      // Ornate Corner Accents (Gold Diamonds & Petals)
      const corners = [
        { x: margin + 28, y: margin + 28 },
        { x: W - margin - 28, y: margin + 28 },
        { x: margin + 28, y: H - margin - 28 },
        { x: W - margin - 28, y: H - margin - 28 },
      ];
      corners.forEach((c) => {
        ctx.fillStyle = '#F4C66A';
        ctx.beginPath();
        ctx.arc(c.x, c.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(244, 198, 106, 0.7)';
        ctx.lineWidth = 2;
        ctx.strokeRect(c.x - 8, c.y - 8, 16, 16);
      });

      // 5. Agency Header Banner with Official PWA Logo
      ctx.textAlign = 'center';

      // Load official PWA Logo image for Canvas
      try {
        const logoImg = new Image();
        logoImg.crossOrigin = 'anonymous';
        await new Promise<void>((resolve) => {
          logoImg.onload = () => resolve();
          logoImg.onerror = () => resolve();
          logoImg.src = '/assets/aistudio/logo_PWA_4b69b17d.jpg';
        });

        // Draw centered logo with rounded border
        const logoSize = 64;
        const logoX = (W - logoSize) / 2;
        const logoY = 68;
        ctx.save();
        drawRoundRect(ctx, logoX, logoY, logoSize, logoSize, 14);
        ctx.clip();
        ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);
        ctx.restore();

        ctx.strokeStyle = '#F4C66A';
        ctx.lineWidth = 1.5;
        drawRoundRect(ctx, logoX, logoY, logoSize, logoSize, 14);
        ctx.stroke();
      } catch {
        // Fallback gracefully if image load fails
      }

      // Agency Name
      ctx.fillStyle = '#90E0EF';
      ctx.font = 'bold 24px "Sarabun", "Prompt", sans-serif';
      ctx.fillText('การประปาส่วนภูมิภาคสาขาสุราษฎร์ธานี (ชั้นพิเศษ)', W / 2, 160);

      // Main Event Title (Golden Gradient Look)
      ctx.fillStyle = '#FDE047';
      ctx.font = 'bold 42px "Sarabun", "Prompt", sans-serif';
      ctx.fillText('บัตรบันทึกการลอยกระทงดิจิทัล', W / 2, 215);

      // Slogan
      ctx.fillStyle = '#E0F2FE';
      ctx.font = '22px "Sarabun", "Prompt", sans-serif';
      ctx.fillText('“ลอยกระทงออนไลน์ ส่งความสุข ไม่เพิ่มขยะ ประจำปี ๒๕๖๙”', W / 2, 255);

      // 6. Participant Code Badge
      const badgeW = 380;
      const badgeH = 54;
      const badgeX = (W - badgeW) / 2;
      const badgeY = 275;

      const badgeGrad = ctx.createLinearGradient(badgeX, badgeY, badgeX + badgeW, badgeY + badgeH);
      badgeGrad.addColorStop(0, '#0284C7');
      badgeGrad.addColorStop(1, '#0369A1');
      ctx.fillStyle = badgeGrad;
      drawRoundRect(ctx, badgeX, badgeY, badgeW, badgeH, 27);
      ctx.fill();

      ctx.strokeStyle = '#F4C66A';
      ctx.lineWidth = 2;
      drawRoundRect(ctx, badgeX, badgeY, badgeW, badgeH, 27);
      ctx.stroke();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 24px "Sarabun", "Prompt", monospace, sans-serif';
      ctx.fillText(`รหัสกิจกรรม: ${participantCode}`, W / 2, badgeY + 36);

      // 7. Load and Render the Real Selected Krathong SVG Artwork
      const krathongSvg = getKrathongSvgMarkup(krathongType);
      const blob = new Blob([krathongSvg], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const krathongImg = new Image();

      await new Promise<void>((resolve) => {
        krathongImg.onload = () => resolve();
        krathongImg.onerror = () => resolve();
        krathongImg.src = url;
      });

      // Water Pond / Aura behind Krathong
      const pondGlow = ctx.createRadialGradient(W / 2, 540, 40, W / 2, 540, 220);
      pondGlow.addColorStop(0, 'rgba(56, 189, 248, 0.45)');
      pondGlow.addColorStop(0.6, 'rgba(14, 116, 144, 0.2)');
      pondGlow.addColorStop(1, 'rgba(7, 59, 102, 0)');
      ctx.fillStyle = pondGlow;
      ctx.beginPath();
      ctx.arc(W / 2, 540, 220, 0, Math.PI * 2);
      ctx.fill();

      // Gentle Water Ripples beneath Krathong
      ctx.strokeStyle = 'rgba(125, 211, 252, 0.5)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(W / 2, 630, 220, 24, 0, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(W / 2, 650, 160, 18, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Draw the Krathong SVG Image
      const kTargetW = 390;
      const kTargetH = 312; // 300x240 ratio
      const kX = (W - kTargetW) / 2;
      const kY = 370;
      try {
        ctx.drawImage(krathongImg, kX, kY, kTargetW, kTargetH);
      } catch (err) {
        console.error('Failed drawing Krathong image:', err);
      }
      URL.revokeObjectURL(url);

      // Krathong Name Label Pill
      const kLabelW = 260;
      const kLabelH = 40;
      const kLabelX = (W - kLabelW) / 2;
      const kLabelY = 675;

      ctx.fillStyle = 'rgba(4, 29, 56, 0.85)';
      drawRoundRect(ctx, kLabelX, kLabelY, kLabelW, kLabelH, 20);
      ctx.fill();
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 1.5;
      drawRoundRect(ctx, kLabelX, kLabelY, kLabelW, kLabelH, 20);
      ctx.stroke();

      ctx.fillStyle = '#BAE6FD';
      ctx.font = 'bold 20px "Sarabun", "Prompt", sans-serif';
      ctx.fillText(krathongDetail.name, W / 2, kLabelY + 27);

      // 8. Participant Name
      ctx.fillStyle = '#94A3B8';
      ctx.font = '20px "Sarabun", "Prompt", sans-serif';
      ctx.fillText('ผู้ร่วมอนุรักษ์สายน้ำ', W / 2, 755);

      ctx.fillStyle = '#FDE047';
      ctx.font = 'bold 40px "Sarabun", "Prompt", sans-serif';
      ctx.fillText(nickname || 'ผู้ร่วมอนุรักษ์สายน้ำ', W / 2, 805);

      // 9. Wish Container (Frosted Modern Glass Box)
      const wishBoxW = 860;
      const wishBoxH = 220;
      const wishBoxX = (W - wishBoxW) / 2;
      const wishBoxY = 840;

      // Box shadow / fill
      ctx.fillStyle = 'rgba(2, 20, 37, 0.75)';
      drawRoundRect(ctx, wishBoxX, wishBoxY, wishBoxW, wishBoxH, 24);
      ctx.fill();

      // Border with subtle cyan-to-gold gradient
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.lineWidth = 2;
      drawRoundRect(ctx, wishBoxX, wishBoxY, wishBoxW, wishBoxH, 24);
      ctx.stroke();

      // Wish Box Header
      ctx.fillStyle = '#38BDF8';
      ctx.font = 'bold 22px "Sarabun", "Prompt", sans-serif';
      ctx.fillText('✦ คำอธิษฐานประจำปี ๒๕๖๙ ✦', W / 2, wishBoxY + 45);

      // Wrap and draw wish text
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'italic 26px "Sarabun", "Prompt", sans-serif';
      const cleanWish = wishText.trim() ? `“${wishText.trim()}”` : '“ขอให้ชีวิตราบรื่น มีความสุข สุขภาพแข็งแรง สายน้ำสดใส”';
      const wishLines = wrapText(ctx, cleanWish, wishBoxW - 80);

      // Center lines vertically
      const lineHeight = 38;
      const totalTextH = wishLines.length * lineHeight;
      const startWishY = wishBoxY + 95 + Math.max(0, (wishBoxH - 120 - totalTextH) / 2);

      wishLines.slice(0, 3).forEach((line, idx) => {
        ctx.fillText(line, W / 2, startWishY + idx * lineHeight);
      });

      // 10. River & Timestamp Details
      ctx.fillStyle = '#7DD3FC';
      ctx.font = '22px "Sarabun", "Prompt", sans-serif';
      ctx.fillText(`สายน้ำตาปี จังหวัดสุราษฎร์ธานี • ${formattedDate}`, W / 2, 1120);

      // 11. Decorative Divider
      ctx.strokeStyle = 'rgba(244, 198, 106, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(W / 2 - 200, 1160);
      ctx.lineTo(W / 2 + 200, 1160);
      ctx.stroke();

      ctx.fillStyle = '#F4C66A';
      ctx.fillRect(W / 2 - 5, 1155, 10, 10);

      // 12. Footer Endorsement & Gratitude Statement
      ctx.fillStyle = '#CBD5E1';
      ctx.font = '20px "Sarabun", "Prompt", sans-serif';
      ctx.fillText('ขอขอบคุณที่ร่วมสืบสานประเพณีไทย และช่วยรักษาสายน้ำให้สะอาดไปด้วยกัน', W / 2, 1220);

      ctx.fillStyle = '#F4C66A';
      ctx.font = 'bold 22px "Sarabun", "Prompt", sans-serif';
      ctx.fillText('การประปาส่วนภูมิภาคสาขาสุราษฎร์ธานี (ชั้นพิเศษ)', W / 2, 1265);

      ctx.fillStyle = '#38BDF8';
      ctx.font = '18px "Sarabun", "Prompt", sans-serif';
      ctx.fillText('PWA Digital Loy Krathong 2026 • รักษ์น้ำ รักษ์โลก ปราศจากขยะ', W / 2, 1305);

      // Trigger download
      const dataUrl = canvas.toDataURL('image/png', 1.0);
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `PWA_LoyKrathong_2026_${participantCode}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error generating card image:', err);
    } finally {
      setDownloading(false);
    }
  };

  // Web Share or Clipboard
  const handleShare = async () => {
    soundService.playWaterDrop();
    const shareText = `ฉันได้ร่วมลอยกระทงออนไลน์ “ส่งความสุข ไม่เพิ่มขยะ ๒๕๖๙” กับ การประปาส่วนภูมิภาคสาขาสุราษฎร์ธานี (ชั้นพิเศษ) เลือก${krathongDetail.name} รหัสกิจกรรม: ${participantCode}`;
    const shareUrl = window.location.origin;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'ลอยกระทงออนไลน์ กปภ.สาขาสุราษฎร์ธานี (ชั้นพิเศษ) ๒๕๖๙',
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch (err) {
        // Fallback to clipboard
      }
    }

    // Fallback: Copy to clipboard
    try {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Ignored
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-lg mx-auto">
      {/* Certificate UI Container */}
      <div
        ref={cardRef}
        className="relative w-full bg-gradient-to-b from-[#073B66] via-[#042440] to-[#021425] rounded-3xl p-6 sm:p-8 border-2 border-amber-400/60 shadow-2xl overflow-hidden text-center"
      >
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-44 h-44 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-44 h-44 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Decorative corner motifs */}
        <div className="absolute top-3 left-3 text-amber-300/60 text-base">✦</div>
        <div className="absolute top-3 right-3 text-amber-300/60 text-base">✦</div>
        <div className="absolute bottom-3 left-3 text-amber-300/60 text-base">✦</div>
        <div className="absolute bottom-3 right-3 text-amber-300/60 text-base">✦</div>

        {/* Agency Header with Official Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-2">
          <img
            src="/assets/aistudio/logo_PWA_4b69b17d.jpg"
            alt="โลโก้ การประปาส่วนภูมิภาค"
            className="w-7 h-7 rounded-lg object-contain bg-white/10 p-0.5 border border-white/20 shadow-sm"
          />
          <span className="text-xs sm:text-sm font-semibold tracking-wide text-sky-200">
            การประปาส่วนภูมิภาคสาขาสุราษฎร์ธานี (ชั้นพิเศษ)
          </span>
        </div>

        <h3 className="font-heading font-bold text-xl sm:text-2xl text-amber-300 mb-1">
          บัตรบันทึกการลอยกระทงดิจิทัล
        </h3>
        <p className="text-xs text-sky-100/80 mb-5">
          “ลอยกระทงออนไลน์ ส่งความสุข ไม่เพิ่มขยะ ประจำปี ๒๕๖๙”
        </p>

        {/* Participant Code Badge */}
        <div className="inline-flex items-center gap-2 bg-[#0077B6]/80 border border-amber-400/60 px-4 py-1.5 rounded-full shadow-inner mb-4">
          <Award className="w-4 h-4 text-amber-300" />
          <span className="font-mono font-bold text-amber-200 text-sm tracking-wider">
            {participantCode}
          </span>
        </div>

        {/* Krathong Illustration Showcase */}
        <div className="relative w-44 h-44 mx-auto my-2 flex items-center justify-center">
          <div className="absolute inset-0 bg-cyan-500/15 rounded-full blur-xl" />
          <div className="animate-float-gentle">
            <KrathongArt type={krathongType} size={165} />
          </div>
        </div>

        {/* Krathong Name Badge */}
        <div className="inline-block px-3 py-1 bg-slate-900/60 border border-cyan-400/40 rounded-full text-xs font-semibold text-cyan-200 mb-3">
          {krathongDetail.name}
        </div>

        {/* Participant Name */}
        <div className="text-xs text-slate-300">ผู้ร่วมอนุรักษ์สายน้ำ</div>
        <h4 className="font-heading font-bold text-xl text-amber-300 mt-0.5 mb-2">
          {nickname || 'ผู้ร่วมอนุรักษ์สายน้ำ'}
        </h4>

        {/* Wish Quotation */}
        <div className="mt-2 bg-slate-900/70 border border-cyan-500/30 rounded-2xl p-4 text-slate-100 text-sm italic leading-relaxed shadow-inner">
          "{wishText || 'ขอให้ชีวิตราบรื่น มีความสุข สุขภาพแข็งแรง สายน้ำสดใส'}"
        </div>

        {/* Details & Timestamp */}
        <div className="mt-4 text-[11px] text-sky-200/80 space-y-0.5">
          <p>สายน้ำตาปี จังหวัดสุราษฎร์ธานี</p>
          <p>{formattedDate}</p>
        </div>

        {/* Gratitude Statement */}
        <div className="mt-4 pt-3 border-t border-cyan-800/60 text-xs text-slate-300">
          “ขอบคุณที่ร่วมสืบสานประเพณีไทย และช่วยรักษาสายน้ำให้สะอาดไปด้วยกัน”
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-3 mt-6 w-full">
        <button
          onClick={handleDownloadImage}
          disabled={downloading}
          className="flex-1 min-w-[180px] flex items-center justify-center gap-2 py-3.5 px-5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-amber-950/40 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>{downloading ? 'กำลังสร้างการ์ดสวยงาม...' : 'บันทึกภาพบัตรลอยกระทง'}</span>
        </button>

        <button
          onClick={handleShare}
          className="flex-1 min-w-[160px] flex items-center justify-center gap-2 py-3.5 px-5 bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 text-white font-semibold text-sm rounded-xl shadow-lg shadow-cyan-950/40 border border-cyan-400/30 transition-all active:scale-95 cursor-pointer"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Share2 className="w-4 h-4" />}
          <span>{copied ? 'คัดลอกข้อความแล้ว' : 'แชร์กิจกรรมนี้'}</span>
        </button>
      </div>

      <p className="text-[11px] text-slate-400 mt-2 text-center">
        * ภาพการ์ดที่บันทึกจะประกอบด้วยกระทงที่คุณเลือก, ชื่อของคุณ, คำอธิษฐาน และรหัสกิจกรรมในรูปแบบความละเอียดสูง (1080×1440)
      </p>
    </div>
  );
};
