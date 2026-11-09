import React from 'react';
import { KrathongOption, KrathongTypeId } from '../../types';

export const KRATHONG_OPTIONS: KrathongOption[] = [
  {
    id: 'pwa_blue',
    name: 'กระทงสีฟ้า กปภ.',
    nameEn: 'PWA Blue Lotus Krathong',
    description: 'อัตลักษณ์องค์กรการประปาส่วนภูมิภาค โทนสีฟ้า ขาว และเงิน สื่อถึงความสะอาด บริสุทธิ์ และความมุ่งมั่นในการให้บริการน้ำประปาคุณภาพเพื่อประชาชน',
    materials: 'กลีบบัวสีฟ้าประดับดิ้นเงิน, เทียนสีขาวบริสุทธิ์, ดอกแก้วขาว',
    symbolism: 'ความร่มเย็น เป็นสุข และสายน้ำประปาใสสะอาดหล่อเลี้ยงชีวิต',
    dominantColor: '#0077B6',
    badge: 'เอกลักษณ์ กปภ.',
  },
  {
    id: 'eco_banana',
    name: 'กระทงรักษ์โลก',
    nameEn: 'Eco Banana Leaf Krathong',
    description: 'แรงบันดาลใจจากใบตองตานีธรรมชาติและหยวกกล้วย พับจีบแบบไทยโบราณ ไร้โฟม ไร้โลหะเข็มหมุด เป็นมิตรต่อระบบนิเวศน์ทางน้ำ 100%',
    materials: 'ใบตองตานีสดพับกลีบผกา, ดอกดาวเรืองสีเหลืองทอง, เทียนขี้ผึ้งแท้',
    symbolism: 'การอนุรักษ์ธรรมชาติ ความเรียบง่าย และการเคารพแม่คงคา',
    dominantColor: '#2D6A4F',
    badge: 'เป็นมิตรต่อสิ่งแวดล้อม',
  },
  {
    id: 'lotus_pink',
    name: 'กระทงดอกบัว',
    nameEn: 'Royal Pink Lotus Krathong',
    description: 'ดอกบัวหลวงสีชมพูระเรื่อซ้อนกลีบประณีต สื่อถึงจิตใจที่ผ่องใส ความสงบ ความบริสุทธิ์หลุดพ้นจากความทุกข์โศก',
    materials: 'กลีบดอกบัวหลวงสีชมพูอ่อนและชมพูเข้ม, เกสรบัวสีเหลืองทอง, ดอกมะลิหอม',
    symbolism: 'ความสุข ความเบิกบานใจ และสุขภาพแข็งแรงสมบูรณ์',
    dominantColor: '#E05780',
    badge: 'ศิริมงคลสงบสุข',
  },
  {
    id: 'moonlight_gold',
    name: 'กระทงแสงจันทร์',
    nameEn: 'Moonlight Gold Krathong',
    description: 'เปล่งประกายสีขาวมุกและทองคำอร่าม ล้อกับแสงจันทร์วันเพ็ญเดือนสิบสอง สะท้อนระยิบระยับบนผืนน้ำตาปีอย่างงดงาม',
    materials: 'กลีบกนกสีทองคำเปลว, ดอกบัวขาวบริสุทธิ์, เทียนหอมเคลือบทอง',
    symbolism: 'ความเจริญรุ่งเรือง ความก้าวหน้าในหน้าที่การงาน และแสงสว่างแห่งปัญญา',
    dominantColor: '#F4C66A',
    badge: 'มั่งคั่งรุ่งเรือง',
  },
  {
    id: 'tapi_river',
    name: 'กระทงสายน้ำตาปี',
    nameEn: 'Tapi River Heritage Krathong',
    description: 'สื่อถึงเอกลักษณ์จังหวัดสุราษฎร์ธานี ลำน้ำตาปีที่ไหลผ่านเมืองร้อยเกาะ เงาสะท้อนสะพานศรีสุราษฎร์ยามค่ำคืน ผสานลวดลายคลื่นน้ำพริ้วไหว',
    materials: 'กลีบประดับลวดลายคลื่นน้ำตาปี, ดอกลำดวน, ดอกบานไม่รู้โรยสีคราม',
    symbolism: 'ความผูกพันกับสายน้ำตาปี ความอุดมสมบูรณ์ และเมืองคนดี',
    dominantColor: '#00B4D8',
    badge: 'เอกลักษณ์สุราษฎร์ธานี',
  },
];

interface KrathongArtProps {
  type: KrathongTypeId | string;
  size?: number | string;
  className?: string;
  animateFlame?: boolean;
}

export const KrathongArt: React.FC<KrathongArtProps> = ({
  type,
  size = 200,
  className = '',
  animateFlame = true,
}) => {
  const flameClass = animateFlame ? 'animate-shimmer' : '';

  switch (type) {
    case 'pwa_blue':
      return (
        <svg
          viewBox="0 0 300 240"
          width={size}
          height={size}
          className={`drop-shadow-xl ${className}`}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <radialGradient id="pwaWaterGlow" cx="50%" cy="85%" r="60%">
              <stop offset="0%" stopColor="#00B4D8" stopOpacity="0.8" />
              <stop offset="60%" stopColor="#0077B6" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#073B66" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="pwaBluePetal1" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#E0F2FE" />
              <stop offset="50%" stopColor="#38BDF8" />
              <stop offset="100%" stopColor="#0284C7" />
            </linearGradient>
            <linearGradient id="pwaBluePetal2" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="70%" stopColor="#7DD3FC" />
              <stop offset="100%" stopColor="#0369A1" />
            </linearGradient>
            <linearGradient id="pwaBaseGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0369A1" />
              <stop offset="50%" stopColor="#0284C7" />
              <stop offset="100%" stopColor="#0369A1" />
            </linearGradient>
            <linearGradient id="silverTrim" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#94A3B8" />
              <stop offset="50%" stopColor="#F8FAFC" />
              <stop offset="100%" stopColor="#94A3B8" />
            </linearGradient>
          </defs>

          {/* Water reflection glow */}
          <ellipse cx="150" cy="205" rx="110" ry="24" fill="url(#pwaWaterGlow)" />
          
          {/* Water ripple arcs */}
          <path d="M 60 215 Q 150 230 240 215" stroke="#7DD3FC" strokeWidth="2.5" fill="none" opacity="0.6" />
          <path d="M 85 222 Q 150 233 215 222" stroke="#38BDF8" strokeWidth="1.5" fill="none" opacity="0.4" />

          {/* Base Rim */}
          <ellipse cx="150" cy="180" rx="95" ry="28" fill="#075985" />
          <ellipse cx="150" cy="176" rx="92" ry="24" fill="url(#pwaBaseGrad)" />
          <ellipse cx="150" cy="173" rx="88" ry="20" fill="url(#silverTrim)" opacity="0.4" />

          {/* Outer Layer Petals (Left to Right) */}
          <path d="M 65 170 Q 40 125 80 120 Q 95 155 85 172 Z" fill="url(#pwaBluePetal1)" />
          <path d="M 235 170 Q 260 125 220 120 Q 205 155 215 172 Z" fill="url(#pwaBluePetal1)" />
          <path d="M 90 174 Q 80 110 118 112 Q 125 155 108 175 Z" fill="url(#pwaBluePetal2)" />
          <path d="M 210 174 Q 220 110 182 112 Q 175 155 192 175 Z" fill="url(#pwaBluePetal2)" />
          
          {/* Front Center Petals */}
          <path d="M 120 176 Q 120 95 150 95 Q 150 150 132 178 Z" fill="url(#pwaBluePetal1)" />
          <path d="M 180 176 Q 180 95 150 95 Q 150 150 168 178 Z" fill="url(#pwaBluePetal2)" />
          <path d="M 135 180 Q 150 115 165 180 Q 150 190 135 180 Z" fill="#E0F2FE" />

          {/* Incense Sticks */}
          <line x1="140" y1="120" x2="132" y2="45" stroke="#B45309" strokeWidth="2.5" />
          <line x1="160" y1="120" x2="168" y2="45" stroke="#B45309" strokeWidth="2.5" />
          <line x1="150" y1="115" x2="150" y2="40" stroke="#78350F" strokeWidth="2.5" />
          <circle cx="132" cy="45" r="2.5" fill="#EF4444" opacity="0.9" />
          <circle cx="168" cy="45" r="2.5" fill="#EF4444" opacity="0.9" />
          <circle cx="150" cy="40" r="2.5" fill="#F59E0B" opacity="0.9" />

          {/* Candle */}
          <rect x="144" y="65" width="12" height="65" rx="3" fill="#F8FAFC" />
          <rect x="146" y="65" width="4" height="65" fill="#E2E8F0" />
          <line x1="150" y1="65" x2="150" y2="52" stroke="#475569" strokeWidth="2" />

          {/* Candle Flame & Halo */}
          <circle cx="150" cy="38" r="22" fill="#FDE047" opacity="0.25" className={flameClass} />
          <circle cx="150" cy="38" r="14" fill="#F59E0B" opacity="0.35" className={flameClass} />
          <path d="M 150 14 Q 140 38 150 52 Q 160 38 150 14 Z" fill="#F59E0B" className={flameClass} />
          <path d="M 150 24 Q 144 38 150 49 Q 156 38 150 24 Z" fill="#FEF08A" className={flameClass} />
          <circle cx="150" cy="42" r="3.5" fill="#FFFFFF" />

          {/* PWA Emblem hint on center */}
          <circle cx="150" cy="162" r="13" fill="#0077B6" stroke="#93C5FD" strokeWidth="1.5" />
          <path d="M 150 153 C 146 158 144 163 147 167 C 150 171 156 169 156 165 C 156 161 150 153 150 153 Z" fill="#FFFFFF" />
        </svg>
      );

    case 'eco_banana':
      return (
        <svg
          viewBox="0 0 300 240"
          width={size}
          height={size}
          className={`drop-shadow-xl ${className}`}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <radialGradient id="ecoWaterGlow" cx="50%" cy="85%" r="60%">
              <stop offset="0%" stopColor="#40916C" stopOpacity="0.7" />
              <stop offset="60%" stopColor="#1B4332" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#081C15" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="bananaLeaf1" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#74C69D" />
              <stop offset="60%" stopColor="#40916C" />
              <stop offset="100%" stopColor="#1B4332" />
            </linearGradient>
            <linearGradient id="bananaLeaf2" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#95D5B2" />
              <stop offset="60%" stopColor="#52B788" />
              <stop offset="100%" stopColor="#2D6A4F" />
            </linearGradient>
            <linearGradient id="marigoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FDE047" />
              <stop offset="50%" stopColor="#EAB308" />
              <stop offset="100%" stopColor="#CA8A04" />
            </linearGradient>
          </defs>

          {/* Water reflection */}
          <ellipse cx="150" cy="205" rx="115" ry="24" fill="url(#ecoWaterGlow)" />
          <path d="M 60 215 Q 150 230 240 215" stroke="#74C69D" strokeWidth="2.5" fill="none" opacity="0.6" />

          {/* Banana Trunk Base */}
          <ellipse cx="150" cy="182" rx="98" ry="30" fill="#1B4332" />
          <ellipse cx="150" cy="177" rx="94" ry="26" fill="#2D6A4F" />
          <ellipse cx="150" cy="172" rx="88" ry="22" fill="#52B788" opacity="0.6" />

          {/* Folded Banana Leaf Petals (Kleep Phaka) */}
          {/* Back row */}
          <polygon points="50,170 80,110 100,165" fill="url(#bananaLeaf1)" />
          <polygon points="250,170 220,110 200,165" fill="url(#bananaLeaf1)" />
          <polygon points="85,172 120,100 135,168" fill="url(#bananaLeaf2)" />
          <polygon points="215,172 180,100 165,168" fill="url(#bananaLeaf2)" />
          <polygon points="120,175 150,90 180,175" fill="url(#bananaLeaf1)" />

          {/* Front row folded triangular petals */}
          <polygon points="65,180 100,135 125,182" fill="url(#bananaLeaf2)" />
          <polygon points="235,180 200,135 175,182" fill="url(#bananaLeaf2)" />
          <polygon points="110,184 150,125 190,184" fill="url(#bananaLeaf2)" />

          {/* Fresh Yellow Marigolds (Dok Dao Ruang) */}
          <circle cx="105" cy="165" r="14" fill="url(#marigoldGrad)" />
          <circle cx="195" cy="165" r="14" fill="url(#marigoldGrad)" />
          <circle cx="150" cy="168" r="16" fill="url(#marigoldGrad)" />
          <circle cx="150" cy="168" r="7" fill="#FEF08A" />

          {/* Natural Beeswax Candle */}
          <rect x="144" y="70" width="12" height="60" rx="3" fill="#FEF08A" />
          <line x1="150" y1="70" x2="150" y2="56" stroke="#422006" strokeWidth="2" />
          
          {/* Incense Sticks */}
          <line x1="138" y1="120" x2="130" y2="48" stroke="#713F12" strokeWidth="2.5" />
          <line x1="162" y1="120" x2="170" y2="48" stroke="#713F12" strokeWidth="2.5" />
          <circle cx="130" cy="48" r="2.5" fill="#EF4444" />
          <circle cx="170" cy="48" r="2.5" fill="#EF4444" />

          {/* Flame */}
          <circle cx="150" cy="40" r="20" fill="#FBBF24" opacity="0.3" className={flameClass} />
          <path d="M 150 18 Q 140 40 150 56 Q 160 40 150 18 Z" fill="#F59E0B" className={flameClass} />
          <path d="M 150 28 Q 144 42 150 52 Q 156 42 150 28 Z" fill="#FFFBEB" className={flameClass} />
        </svg>
      );

    case 'lotus_pink':
      return (
        <svg
          viewBox="0 0 300 240"
          width={size}
          height={size}
          className={`drop-shadow-xl ${className}`}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <radialGradient id="pinkWaterGlow" cx="50%" cy="85%" r="60%">
              <stop offset="0%" stopColor="#F472B6" stopOpacity="0.7" />
              <stop offset="60%" stopColor="#BE185D" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#500724" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="pinkPetalOuter" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FCE7F3" />
              <stop offset="50%" stopColor="#F472B6" />
              <stop offset="100%" stopColor="#DB2777" />
            </linearGradient>
            <linearGradient id="pinkPetalInner" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="40%" stopColor="#FBCFE8" />
              <stop offset="100%" stopColor="#EC4899" />
            </linearGradient>
          </defs>

          {/* Water reflection */}
          <ellipse cx="150" cy="205" rx="110" ry="24" fill="url(#pinkWaterGlow)" />
          <path d="M 60 215 Q 150 230 240 215" stroke="#F472B6" strokeWidth="2" fill="none" opacity="0.6" />

          {/* Lotus Pod Base */}
          <ellipse cx="150" cy="180" rx="90" ry="26" fill="#15803D" />
          <ellipse cx="150" cy="176" rx="86" ry="22" fill="#22C55E" />

          {/* Outer Layer Pink Petals */}
          <path d="M 55 168 Q 30 115 85 110 Q 100 150 85 172 Z" fill="url(#pinkPetalOuter)" />
          <path d="M 245 168 Q 270 115 215 110 Q 200 150 215 172 Z" fill="url(#pinkPetalOuter)" />
          <path d="M 85 172 Q 70 95 118 95 Q 130 145 110 176 Z" fill="url(#pinkPetalInner)" />
          <path d="M 215 172 Q 230 95 182 95 Q 170 145 190 176 Z" fill="url(#pinkPetalInner)" />
          <path d="M 120 175 Q 115 78 150 78 Q 185 78 180 175 Z" fill="url(#pinkPetalInner)" />

          {/* Front Layer Petals */}
          <path d="M 90 180 Q 120 130 150 180 Z" fill="url(#pinkPetalOuter)" opacity="0.9" />
          <path d="M 150 180 Q 180 130 210 180 Z" fill="url(#pinkPetalOuter)" opacity="0.9" />
          <path d="M 125 184 Q 150 140 175 184 Z" fill="url(#pinkPetalInner)" />

          {/* Yellow Pollen / Jasmine wreath */}
          <circle cx="150" cy="158" r="18" fill="#FACC15" />
          <circle cx="138" cy="156" r="4" fill="#FFFFFF" />
          <circle cx="162" cy="156" r="4" fill="#FFFFFF" />
          <circle cx="150" cy="164" r="4" fill="#FFFFFF" />

          {/* Candle */}
          <rect x="145" y="65" width="10" height="65" rx="3" fill="#FFF1F2" />
          <line x1="150" y1="65" x2="150" y2="50" stroke="#475569" strokeWidth="2" />
          <line x1="138" y1="110" x2="132" y2="42" stroke="#B45309" strokeWidth="2.5" />
          <line x1="162" y1="110" x2="168" y2="42" stroke="#B45309" strokeWidth="2.5" />

          {/* Flame */}
          <circle cx="150" cy="36" r="22" fill="#F472B6" opacity="0.25" className={flameClass} />
          <path d="M 150 12 Q 138 36 150 50 Q 162 36 150 12 Z" fill="#F59E0B" className={flameClass} />
          <path d="M 150 22 Q 143 38 150 47 Q 157 38 150 22 Z" fill="#FFFBEB" className={flameClass} />
        </svg>
      );

    case 'moonlight_gold':
      return (
        <svg
          viewBox="0 0 300 240"
          width={size}
          height={size}
          className={`drop-shadow-xl ${className}`}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <radialGradient id="goldWaterGlow" cx="50%" cy="85%" r="60%">
              <stop offset="0%" stopColor="#FACC15" stopOpacity="0.8" />
              <stop offset="60%" stopColor="#CA8A04" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#451A03" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="goldPetal1" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FEF08A" />
              <stop offset="40%" stopColor="#FACC15" />
              <stop offset="100%" stopColor="#CA8A04" />
            </linearGradient>
            <linearGradient id="whiteGoldPetal" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="60%" stopColor="#FEF9C3" />
              <stop offset="100%" stopColor="#EAB308" />
            </linearGradient>
          </defs>

          {/* Water reflection */}
          <ellipse cx="150" cy="205" rx="115" ry="24" fill="url(#goldWaterGlow)" />
          <path d="M 60 215 Q 150 230 240 215" stroke="#FDE047" strokeWidth="2.5" fill="none" opacity="0.6" />

          {/* Golden Base */}
          <ellipse cx="150" cy="180" rx="95" ry="28" fill="#854D0E" />
          <ellipse cx="150" cy="176" rx="92" ry="24" fill="url(#goldPetal1)" />

          {/* Kanok & Petals */}
          <path d="M 60 170 Q 30 110 75 110 Q 95 150 85 172 Z" fill="url(#whiteGoldPetal)" />
          <path d="M 240 170 Q 270 110 225 110 Q 205 150 215 172 Z" fill="url(#whiteGoldPetal)" />
          <path d="M 85 172 Q 70 85 118 85 Q 130 140 110 175 Z" fill="url(#goldPetal1)" />
          <path d="M 215 172 Q 230 85 182 85 Q 170 140 190 175 Z" fill="url(#goldPetal1)" />
          <path d="M 120 175 Q 115 65 150 65 Q 185 65 180 175 Z" fill="url(#whiteGoldPetal)" />

          {/* Front Golden Petals */}
          <polygon points="90,180 120,130 140,182" fill="url(#goldPetal1)" />
          <polygon points="210,180 180,130 160,182" fill="url(#goldPetal1)" />
          <polygon points="120,184 150,120 180,184" fill="url(#whiteGoldPetal)" />

          {/* Candle */}
          <rect x="145" y="55" width="10" height="75" rx="3" fill="#FFFBEB" />
          <line x1="150" y1="55" x2="150" y2="40" stroke="#78350F" strokeWidth="2" />
          
          {/* Flame with strong golden halo */}
          <circle cx="150" cy="30" r="28" fill="#FEF08A" opacity="0.3" className={flameClass} />
          <circle cx="150" cy="30" r="16" fill="#F59E0B" opacity="0.4" className={flameClass} />
          <path d="M 150 6 Q 138 28 150 42 Q 162 28 150 6 Z" fill="#F59E0B" className={flameClass} />
          <path d="M 150 14 Q 143 28 150 38 Q 157 28 150 14 Z" fill="#FFFFFF" className={flameClass} />
        </svg>
      );

    case 'tapi_river':
    default:
      return (
        <svg
          viewBox="0 0 300 240"
          width={size}
          height={size}
          className={`drop-shadow-xl ${className}`}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <radialGradient id="tapiWaterGlow" cx="50%" cy="85%" r="60%">
              <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.8" />
              <stop offset="60%" stopColor="#0284C7" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#082F49" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="tapiBlue1" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#BAE6FD" />
              <stop offset="50%" stopColor="#0EA5E9" />
              <stop offset="100%" stopColor="#0369A1" />
            </linearGradient>
            <linearGradient id="tapiWave" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="50%" stopColor="#F0F9FF" />
              <stop offset="100%" stopColor="#0284C7" />
            </linearGradient>
          </defs>

          {/* Water reflection */}
          <ellipse cx="150" cy="205" rx="115" ry="24" fill="url(#tapiWaterGlow)" />
          <path d="M 50 215 Q 150 232 250 215" stroke="#38BDF8" strokeWidth="2.5" fill="none" opacity="0.6" />
          <path d="M 80 222 Q 150 236 220 222" stroke="#7DD3FC" strokeWidth="1.5" fill="none" opacity="0.4" />

          {/* Tapi River Wave Base */}
          <ellipse cx="150" cy="180" rx="98" ry="28" fill="#0369A1" />
          <ellipse cx="150" cy="176" rx="94" ry="24" fill="url(#tapiWave)" />

          {/* Surat Thani Water Wave Petals */}
          <path d="M 55 170 Q 25 115 75 110 C 95 130 90 155 85 172 Z" fill="url(#tapiBlue1)" />
          <path d="M 245 170 Q 275 115 225 110 C 205 130 210 155 215 172 Z" fill="url(#tapiBlue1)" />
          <path d="M 85 172 Q 70 85 118 90 C 130 120 120 150 110 175 Z" fill="#E0F2FE" />
          <path d="M 215 172 Q 230 85 182 90 C 170 120 180 150 190 175 Z" fill="#E0F2FE" />
          <path d="M 120 175 Q 110 75 150 75 Q 190 75 180 175 Z" fill="url(#tapiBlue1)" />

          {/* Wave crest ribbons */}
          <path d="M 90 182 Q 120 145 150 182 Q 180 145 210 182" fill="none" stroke="#F0F9FF" strokeWidth="3" />
          
          {/* Candle */}
          <rect x="145" y="60" width="10" height="70" rx="3" fill="#F8FAFC" />
          <line x1="150" y1="60" x2="150" y2="45" stroke="#334155" strokeWidth="2" />
          <line x1="136" y1="115" x2="128" y2="42" stroke="#B45309" strokeWidth="2.5" />
          <line x1="164" y1="115" x2="172" y2="42" stroke="#B45309" strokeWidth="2.5" />

          {/* Flame */}
          <circle cx="150" cy="30" r="24" fill="#38BDF8" opacity="0.3" className={flameClass} />
          <path d="M 150 10 Q 138 32 150 45 Q 162 32 150 10 Z" fill="#F59E0B" className={flameClass} />
          <path d="M 150 18 Q 143 32 150 42 Q 157 32 150 18 Z" fill="#FEF08A" className={flameClass} />
          <circle cx="150" cy="38" r="3.5" fill="#FFFFFF" />
        </svg>
      );
  }
};

export function getKrathongSvgMarkup(type: string): string {
  switch (type) {
    case 'pwa_blue':
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 240" width="300" height="240">
        <defs>
          <radialGradient id="pwaWaterGlow" cx="50%" cy="85%" r="60%">
            <stop offset="0%" stop-color="#00B4D8" stop-opacity="0.8" />
            <stop offset="60%" stop-color="#0077B6" stop-opacity="0.3" />
            <stop offset="100%" stop-color="#073B66" stop-opacity="0" />
          </radialGradient>
          <linearGradient id="pwaBluePetal1" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#E0F2FE" />
            <stop offset="50%" stop-color="#38BDF8" />
            <stop offset="100%" stop-color="#0284C7" />
          </linearGradient>
          <linearGradient id="pwaBluePetal2" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#FFFFFF" />
            <stop offset="70%" stop-color="#7DD3FC" />
            <stop offset="100%" stop-color="#0369A1" />
          </linearGradient>
          <linearGradient id="pwaBaseGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#0369A1" />
            <stop offset="50%" stop-color="#0284C7" />
            <stop offset="100%" stop-color="#0369A1" />
          </linearGradient>
          <linearGradient id="silverTrim" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#94A3B8" />
            <stop offset="50%" stop-color="#F8FAFC" />
            <stop offset="100%" stop-color="#94A3B8" />
          </linearGradient>
        </defs>
        <ellipse cx="150" cy="205" rx="110" ry="24" fill="url(#pwaWaterGlow)" />
        <path d="M 60 215 Q 150 230 240 215" stroke="#7DD3FC" stroke-width="2.5" fill="none" opacity="0.6" />
        <path d="M 85 222 Q 150 233 215 222" stroke="#38BDF8" stroke-width="1.5" fill="none" opacity="0.4" />
        <ellipse cx="150" cy="180" rx="95" ry="28" fill="#075985" />
        <ellipse cx="150" cy="176" rx="92" ry="24" fill="url(#pwaBaseGrad)" />
        <ellipse cx="150" cy="173" rx="88" ry="20" fill="url(#silverTrim)" opacity="0.4" />
        <path d="M 65 170 Q 40 125 80 120 Q 95 155 85 172 Z" fill="url(#pwaBluePetal1)" />
        <path d="M 235 170 Q 260 125 220 120 Q 205 155 215 172 Z" fill="url(#pwaBluePetal1)" />
        <path d="M 90 174 Q 80 110 118 112 Q 125 155 108 175 Z" fill="url(#pwaBluePetal2)" />
        <path d="M 210 174 Q 220 110 182 112 Q 175 155 192 175 Z" fill="url(#pwaBluePetal2)" />
        <path d="M 120 176 Q 120 95 150 95 Q 150 150 132 178 Z" fill="url(#pwaBluePetal1)" />
        <path d="M 180 176 Q 180 95 150 95 Q 150 150 168 178 Z" fill="url(#pwaBluePetal2)" />
        <path d="M 135 180 Q 150 115 165 180 Q 150 190 135 180 Z" fill="#E0F2FE" />
        <line x1="140" y1="120" x2="132" y2="45" stroke="#B45309" stroke-width="2.5" />
        <line x1="160" y1="120" x2="168" y2="45" stroke="#B45309" stroke-width="2.5" />
        <line x1="150" y1="115" x2="150" y2="40" stroke="#78350F" stroke-width="2.5" />
        <circle cx="132" cy="45" r="2.5" fill="#EF4444" opacity="0.9" />
        <circle cx="168" cy="45" r="2.5" fill="#EF4444" opacity="0.9" />
        <circle cx="150" cy="40" r="2.5" fill="#F59E0B" opacity="0.9" />
        <rect x="144" y="65" width="12" height="65" rx="3" fill="#F8FAFC" />
        <rect x="146" y="65" width="4" height="65" fill="#E2E8F0" />
        <line x1="150" y1="65" x2="150" y2="52" stroke="#475569" stroke-width="2" />
        <circle cx="150" cy="38" r="22" fill="#FDE047" opacity="0.25" />
        <circle cx="150" cy="38" r="14" fill="#F59E0B" opacity="0.35" />
        <path d="M 150 14 Q 140 38 150 52 Q 160 38 150 14 Z" fill="#F59E0B" />
        <path d="M 150 24 Q 144 38 150 49 Q 156 38 150 24 Z" fill="#FEF08A" />
        <circle cx="150" cy="42" r="3.5" fill="#FFFFFF" />
        <circle cx="150" cy="162" r="13" fill="#0077B6" stroke="#93C5FD" stroke-width="1.5" />
        <path d="M 150 153 C 146 158 144 163 147 167 C 150 171 156 169 156 165 C 156 161 150 153 150 153 Z" fill="#FFFFFF" />
      </svg>`;

    case 'eco_banana':
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 240" width="300" height="240">
        <defs>
          <radialGradient id="ecoWaterGlow" cx="50%" cy="85%" r="60%">
            <stop offset="0%" stop-color="#40916C" stop-opacity="0.7" />
            <stop offset="60%" stop-color="#1B4332" stop-opacity="0.3" />
            <stop offset="100%" stop-color="#081C15" stop-opacity="0" />
          </radialGradient>
          <linearGradient id="bananaLeaf1" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#74C69D" />
            <stop offset="60%" stop-color="#40916C" />
            <stop offset="100%" stop-color="#1B4332" />
          </linearGradient>
          <linearGradient id="bananaLeaf2" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#95D5B2" />
            <stop offset="60%" stop-color="#52B788" />
            <stop offset="100%" stop-color="#2D6A4F" />
          </linearGradient>
          <linearGradient id="marigoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#FDE047" />
            <stop offset="50%" stop-color="#EAB308" />
            <stop offset="100%" stop-color="#CA8A04" />
          </linearGradient>
        </defs>
        <ellipse cx="150" cy="205" rx="115" ry="24" fill="url(#ecoWaterGlow)" />
        <path d="M 60 215 Q 150 230 240 215" stroke="#74C69D" stroke-width="2.5" fill="none" opacity="0.6" />
        <ellipse cx="150" cy="182" rx="98" ry="30" fill="#1B4332" />
        <ellipse cx="150" cy="177" rx="94" ry="26" fill="#2D6A4F" />
        <ellipse cx="150" cy="172" rx="88" ry="22" fill="#52B788" opacity="0.6" />
        <polygon points="50,170 80,110 100,165" fill="url(#bananaLeaf1)" />
        <polygon points="250,170 220,110 200,165" fill="url(#bananaLeaf1)" />
        <polygon points="85,172 120,100 135,168" fill="url(#bananaLeaf2)" />
        <polygon points="215,172 180,100 165,168" fill="url(#bananaLeaf2)" />
        <polygon points="120,175 150,90 180,175" fill="url(#bananaLeaf1)" />
        <polygon points="65,180 100,135 125,182" fill="url(#bananaLeaf2)" />
        <polygon points="235,180 200,135 175,182" fill="url(#bananaLeaf2)" />
        <polygon points="110,184 150,125 190,184" fill="url(#bananaLeaf2)" />
        <circle cx="105" cy="165" r="14" fill="url(#marigoldGrad)" />
        <circle cx="195" cy="165" r="14" fill="url(#marigoldGrad)" />
        <circle cx="150" cy="168" r="16" fill="url(#marigoldGrad)" />
        <circle cx="150" cy="168" r="7" fill="#FEF08A" />
        <rect x="144" y="70" width="12" height="60" rx="3" fill="#FEF08A" />
        <line x1="150" y1="70" x2="150" y2="56" stroke="#422006" stroke-width="2" />
        <line x1="138" y1="120" x2="130" y2="48" stroke="#713F12" stroke-width="2.5" />
        <line x1="162" y1="120" x2="170" y2="48" stroke="#713F12" stroke-width="2.5" />
        <circle cx="130" cy="48" r="2.5" fill="#EF4444" />
        <circle cx="170" cy="48" r="2.5" fill="#EF4444" />
        <circle cx="150" cy="40" r="20" fill="#FBBF24" opacity="0.3" />
        <path d="M 150 18 Q 140 40 150 56 Q 160 40 150 18 Z" fill="#F59E0B" />
        <path d="M 150 28 Q 144 42 150 52 Q 156 42 150 28 Z" fill="#FFFBEB" />
      </svg>`;

    case 'lotus_pink':
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 240" width="300" height="240">
        <defs>
          <radialGradient id="pinkWaterGlow" cx="50%" cy="85%" r="60%">
            <stop offset="0%" stop-color="#F472B6" stop-opacity="0.7" />
            <stop offset="60%" stop-color="#BE185D" stop-opacity="0.3" />
            <stop offset="100%" stop-color="#500724" stop-opacity="0" />
          </radialGradient>
          <linearGradient id="pinkPetalOuter" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#FCE7F3" />
            <stop offset="50%" stop-color="#F472B6" />
            <stop offset="100%" stop-color="#DB2777" />
          </linearGradient>
          <linearGradient id="pinkPetalInner" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#FFFFFF" />
            <stop offset="40%" stop-color="#FBCFE8" />
            <stop offset="100%" stop-color="#EC4899" />
          </linearGradient>
        </defs>
        <ellipse cx="150" cy="205" rx="110" ry="24" fill="url(#pinkWaterGlow)" />
        <path d="M 60 215 Q 150 230 240 215" stroke="#F472B6" stroke-width="2" fill="none" opacity="0.6" />
        <ellipse cx="150" cy="180" rx="90" ry="26" fill="#15803D" />
        <ellipse cx="150" cy="176" rx="86" ry="22" fill="#22C55E" />
        <path d="M 55 168 Q 30 115 85 110 Q 100 150 85 172 Z" fill="url(#pinkPetalOuter)" />
        <path d="M 245 168 Q 270 115 215 110 Q 200 150 215 172 Z" fill="url(#pinkPetalOuter)" />
        <path d="M 85 172 Q 70 95 118 95 Q 130 145 110 176 Z" fill="url(#pinkPetalInner)" />
        <path d="M 215 172 Q 230 95 182 95 Q 170 145 190 176 Z" fill="url(#pinkPetalInner)" />
        <path d="M 120 175 Q 115 78 150 78 Q 185 78 180 175 Z" fill="url(#pinkPetalInner)" />
        <path d="M 90 180 Q 120 130 150 180 Z" fill="url(#pinkPetalOuter)" opacity="0.9" />
        <path d="M 150 180 Q 180 130 210 180 Z" fill="url(#pinkPetalOuter)" opacity="0.9" />
        <path d="M 125 184 Q 150 140 175 184 Z" fill="url(#pinkPetalInner)" />
        <circle cx="150" cy="158" r="18" fill="#FACC15" />
        <circle cx="138" cy="156" r="4" fill="#FFFFFF" />
        <circle cx="162" cy="156" r="4" fill="#FFFFFF" />
        <circle cx="150" cy="164" r="4" fill="#FFFFFF" />
        <rect x="145" y="65" width="10" height="65" rx="3" fill="#FFF1F2" />
        <line x1="150" y1="65" x2="150" y2="50" stroke="#475569" stroke-width="2" />
        <line x1="138" y1="110" x2="132" y2="42" stroke="#B45309" stroke-width="2.5" />
        <line x1="162" y1="110" x2="168" y2="42" stroke="#B45309" stroke-width="2.5" />
        <circle cx="150" cy="36" r="22" fill="#F472B6" opacity="0.25" />
        <path d="M 150 12 Q 138 36 150 50 Q 162 36 150 12 Z" fill="#F59E0B" />
        <path d="M 150 22 Q 143 38 150 47 Q 157 38 150 22 Z" fill="#FFFBEB" />
      </svg>`;

    case 'moonlight_gold':
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 240" width="300" height="240">
        <defs>
          <radialGradient id="goldWaterGlow" cx="50%" cy="85%" r="60%">
            <stop offset="0%" stop-color="#FACC15" stop-opacity="0.8" />
            <stop offset="60%" stop-color="#CA8A04" stop-opacity="0.3" />
            <stop offset="100%" stop-color="#451A03" stop-opacity="0" />
          </radialGradient>
          <linearGradient id="goldPetal1" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#FEF08A" />
            <stop offset="40%" stop-color="#FACC15" />
            <stop offset="100%" stop-color="#CA8A04" />
          </linearGradient>
          <linearGradient id="whiteGoldPetal" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#FFFFFF" />
            <stop offset="60%" stop-color="#FEF9C3" />
            <stop offset="100%" stop-color="#EAB308" />
          </linearGradient>
        </defs>
        <ellipse cx="150" cy="205" rx="115" ry="24" fill="url(#goldWaterGlow)" />
        <path d="M 60 215 Q 150 230 240 215" stroke="#FDE047" stroke-width="2.5" fill="none" opacity="0.6" />
        <ellipse cx="150" cy="180" rx="95" ry="28" fill="#854D0E" />
        <ellipse cx="150" cy="176" rx="92" ry="24" fill="url(#goldPetal1)" />
        <path d="M 60 170 Q 30 110 75 110 Q 95 150 85 172 Z" fill="url(#whiteGoldPetal)" />
        <path d="M 240 170 Q 270 110 225 110 Q 205 150 215 172 Z" fill="url(#whiteGoldPetal)" />
        <path d="M 85 172 Q 70 85 118 85 Q 130 140 110 175 Z" fill="url(#goldPetal1)" />
        <path d="M 215 172 Q 230 85 182 85 Q 170 140 190 175 Z" fill="url(#goldPetal1)" />
        <path d="M 120 175 Q 115 65 150 65 Q 185 65 180 175 Z" fill="url(#whiteGoldPetal)" />
        <polygon points="90,180 120,130 140,182" fill="url(#goldPetal1)" />
        <polygon points="210,180 180,130 160,182" fill="url(#goldPetal1)" />
        <polygon points="120,184 150,120 180,184" fill="url(#whiteGoldPetal)" />
        <rect x="145" y="55" width="10" height="75" rx="3" fill="#FFFBEB" />
        <line x1="150" y1="55" x2="150" y2="40" stroke="#78350F" stroke-width="2" />
        <circle cx="150" cy="30" r="28" fill="#FEF08A" opacity="0.3" />
        <circle cx="150" cy="30" r="16" fill="#F59E0B" opacity="0.4" />
        <path d="M 150 6 Q 138 28 150 42 Q 162 28 150 6 Z" fill="#F59E0B" />
        <path d="M 150 14 Q 143 28 150 38 Q 157 28 150 14 Z" fill="#FFFFFF" />
      </svg>`;

    case 'tapi_river':
    default:
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 240" width="300" height="240">
        <defs>
          <radialGradient id="tapiWaterGlow" cx="50%" cy="85%" r="60%">
            <stop offset="0%" stop-color="#38BDF8" stop-opacity="0.8" />
            <stop offset="60%" stop-color="#0284C7" stop-opacity="0.3" />
            <stop offset="100%" stop-color="#082F49" stop-opacity="0" />
          </radialGradient>
          <linearGradient id="tapiBlue1" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#BAE6FD" />
            <stop offset="50%" stop-color="#0EA5E9" />
            <stop offset="100%" stop-color="#0369A1" />
          </linearGradient>
          <linearGradient id="tapiWave" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#38BDF8" />
            <stop offset="50%" stop-color="#F0F9FF" />
            <stop offset="100%" stop-color="#0284C7" />
          </linearGradient>
        </defs>
        <ellipse cx="150" cy="205" rx="115" ry="24" fill="url(#tapiWaterGlow)" />
        <path d="M 50 215 Q 150 232 250 215" stroke="#38BDF8" stroke-width="2.5" fill="none" opacity="0.6" />
        <path d="M 80 222 Q 150 236 220 222" stroke="#7DD3FC" stroke-width="1.5" fill="none" opacity="0.4" />
        <ellipse cx="150" cy="180" rx="98" ry="28" fill="#0369A1" />
        <ellipse cx="150" cy="176" rx="94" ry="24" fill="url(#tapiWave)" />
        <path d="M 55 170 Q 25 115 75 110 C 95 130 90 155 85 172 Z" fill="url(#tapiBlue1)" />
        <path d="M 245 170 Q 275 115 225 110 C 205 130 210 155 215 172 Z" fill="url(#tapiBlue1)" />
        <path d="M 85 172 Q 70 85 118 90 C 130 120 120 150 110 175 Z" fill="#E0F2FE" />
        <path d="M 215 172 Q 230 85 182 90 C 170 120 180 150 190 175 Z" fill="#E0F2FE" />
        <path d="M 120 175 Q 110 75 150 75 Q 190 75 180 175 Z" fill="url(#tapiBlue1)" />
        <path d="M 90 182 Q 120 145 150 182 Q 180 145 210 182" fill="none" stroke="#F0F9FF" stroke-width="3" />
        <rect x="145" y="60" width="10" height="70" rx="3" fill="#F8FAFC" />
        <line x1="150" y1="60" x2="150" y2="45" stroke="#334155" stroke-width="2" />
        <line x1="136" y1="115" x2="128" y2="42" stroke="#B45309" stroke-width="2.5" />
        <line x1="164" y1="115" x2="172" y2="42" stroke="#B45309" stroke-width="2.5" />
        <circle cx="150" cy="30" r="24" fill="#38BDF8" opacity="0.3" />
        <path d="M 150 10 Q 138 32 150 45 Q 162 32 150 10 Z" fill="#F59E0B" />
        <path d="M 150 18 Q 143 32 150 42 Q 157 32 150 18 Z" fill="#FEF08A" />
        <circle cx="150" cy="38" r="3.5" fill="#FFFFFF" />
      </svg>`;
  }
}

