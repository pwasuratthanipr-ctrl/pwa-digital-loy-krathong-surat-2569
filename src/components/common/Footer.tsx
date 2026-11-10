import React from 'react';
import { Phone, MapPin, ExternalLink, ShieldCheck, Heart } from 'lucide-react';

interface FooterProps {
  onNavigate: (path: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-[#041D33] border-t border-cyan-900/60 text-slate-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Col 1: About Organization */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <img
                src="/assets/aistudio/logo_PWA_4b69b17d.jpg"
                alt="โลโก้ การประปาส่วนภูมิภาค"
                className="w-10 h-10 rounded-xl object-contain bg-white/10 p-0.5 border border-white/20 shadow-md"
              />
              <span className="font-heading font-bold text-white text-base">
                กปภ.สาขาสุราษฎร์ธานี (ชั้นพิเศษ)
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              การประปาส่วนภูมิภาคสาขาสุราษฎร์ธานี (ชั้นพิเศษ) มุ่งมั่นผลิตและส่งจ่ายน้ำประปาสะอาดได้มาตรฐานสากล พร้อมขับเคลื่อนนวัตกรรมดิจิทัลเพื่อประชาชน
            </p>
            <div className="text-xs text-amber-300/90 flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
              <span>โครงการ “ลอยกระทงออนไลน์ ส่งความสุข ไม่เพิ่มขยะ ๒๕๖๙”</span>
            </div>
          </div>

          {/* Col 2: Online Services Links */}
          <div className="space-y-3">
            <h4 className="font-heading font-semibold text-white text-sm tracking-wide">
              บริการออนไลน์ กปภ.
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <a
                  href="https://play.google.com/store/apps/details?id=th.co.pwa.pwamobile&hl=th&gl=US"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-cyan-300 transition-colors flex items-center gap-1.5"
                >
                  <span className="text-emerald-400">●</span>
                  <span>ระบบ Android (Google Play)</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://apps.apple.com/th/app/pwa-plus-life/id1479653708?l=th"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-cyan-300 transition-colors flex items-center gap-1.5"
                >
                  <span className="text-sky-400">●</span>
                  <span>ระบบ iOS (App Store)</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://page.line.me/pwathailand"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-cyan-300 transition-colors flex items-center gap-1.5"
                >
                  <span className="text-[#06C755]">●</span>
                  <span>LINE Official @pwathailand</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://payment.pwa.co.th"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-cyan-300 transition-colors flex items-center gap-1.5"
                >
                  <span className="text-cyan-400">●</span>
                  <span>ระบบชำระค่าน้ำออนไลน์</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li className="pt-1">
                <button
                  onClick={() => onNavigate('/online-services')}
                  className="text-cyan-400 hover:text-cyan-300 transition-colors font-medium text-left"
                >
                  → ดูช่องทางและวิธีสมัครทั้งหมด
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Contact & Location */}
          <div className="space-y-3">
            <h4 className="font-heading font-semibold text-white text-sm tracking-wide">
              ติดต่อ กปภ.สาขาสุราษฎร์ธานี (ชั้นพิเศษ)
            </h4>
            <div className="space-y-2.5 text-xs text-slate-400">
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  เลขที่ 86/2 หมู่ที่ 2 ถนนศรีวิชัย ตำบลมะขามเตี้ย อำเภอเมือง จังหวัดสุราษฎร์ธานี 84000
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>PWA Contact Center 1662 หรือ 077-272-683</span>
              </div>
              <div className="flex items-start gap-2">
                <ExternalLink className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                <a
                  href="https://www.facebook.com/pwa.suratthani?locale=th_TH"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-cyan-300 transition-colors leading-relaxed"
                >
                  Facebook Page การประปาส่วนภูมิภาคสาขาสุราษฎร์ธานี
                </a>
              </div>
            </div>
          </div>

          {/* Col 4: PDPA & Legal */}
          <div className="space-y-3">
            <h4 className="font-heading font-semibold text-white text-sm tracking-wide">
              การคุ้มครองข้อมูลส่วนบุคคล
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              ระบบนี้ปฏิบัติตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA) ด้วยหลัก Data Minimization ไม่จัดเก็บรหัสผ่านหรือข้อมูลการเงินใดๆ
            </p>
            <div className="pt-1">
              <button
                onClick={() => onNavigate('/privacy')}
                className="inline-flex items-center gap-1.5 text-xs text-amber-300 hover:text-amber-200 transition-colors border-b border-amber-400/40 pb-0.5"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>อ่านประกาศความเป็นส่วนตัวฉบับเต็ม</span>
              </button>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="mt-10 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            สงวนลิขสิทธิ์ พ.ศ. ๒๕๖๙ การประปาส่วนภูมิภาคสาขาสุราษฎร์ธานี (ชั้นพิเศษ)
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => onNavigate('/')} className="hover:text-slate-300 cursor-pointer">หน้าแรก</button>
            <button onClick={() => onNavigate('/privacy')} className="hover:text-slate-300 cursor-pointer">นโยบายความเป็นส่วนตัว</button>
            <button
              onClick={() => onNavigate('/admin')}
              className="hover:text-amber-300 text-amber-400/80 flex items-center gap-1 cursor-pointer"
              title="สำหรับเจ้าหน้าที่ตรวจสอบสถิติและดาวน์โหลดรายงาน"
            >
              <span>สำหรับผู้ดูแลระบบ (สถิติกิจกรรม)</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
