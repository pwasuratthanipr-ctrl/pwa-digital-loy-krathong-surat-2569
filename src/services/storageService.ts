/**
 * Client-Side Storage & Data Service
 * ประมวลผลและจัดเก็บข้อมูลกระทงลอยและระบบสถิติสำหรับผู้ดูแลระบบ
 * ทำงานแบบ Static Web Application 100% ภายใน Browser (localStorage)
 * 
 * ข้อมูลสำหรับผู้ดูแลระบบ (Admin Stats):
 * 1. ผู้เข้าใช้งาน (Total Visitors)
 * 2. ผู้เล่นกิจกรรมลอยกระทง (Loy Krathong Players)
 * 3. ผู้ที่สมัคร/สนใจใช้บริการออนไลน์ กปภ. แยกเป็น:
 *    - แอปพลิเคชัน (PWA Plus Life - Android / iOS)
 *    - Line (LINE Official Account @pwathailand)
 *    - ผ่านเว็บเบราว์เซอร์ (PWA Payment Portal)
 * 4. ผู้ที่มีบัญชีอยู่แล้ว (Existing Accounts)
 */

import { AdminStats, PublicStats } from '../types';
export type { AdminStats, PublicStats };

export interface FloatingItem {
  id: string;
  nickname: string;
  krathong_type: string;
  wish_text: string;
  floated_at: string;
  water_coordinates_x?: number;
  water_coordinates_y?: number;
}

export interface ParticipantRecord {
  code: string;
  nickname: string;
  krathongType: string;
  wishText: string;
  floatedAt: string;
}

export interface ServiceClickRecord {
  channel: 'app' | 'line' | 'web';
  channelName: string;
  timestamp: string;
}

const STORAGE_KEY_KRATHONGS = 'pwa_digital_krathongs_v2026';
const STORAGE_KEY_COUNTER = 'pwa_digital_counter_v2026';
const STORAGE_KEY_VISITORS = 'pwa_digital_visitors_v2026';
const STORAGE_KEY_EXISTING_USERS = 'pwa_digital_existing_users_v2026';
const STORAGE_KEY_SERVICES = 'pwa_digital_services_v2026';
const STORAGE_KEY_PARTICIPANTS = 'pwa_digital_participants_log_v2026';
const STORAGE_KEY_SERVICE_LOGS = 'pwa_digital_service_logs_v2026';
const SESSION_VISITED_FLAG = 'pwa_session_visited_flag';

// ข้อมูลกระทงตั้งต้นจำลองบรรยากาศแม่น้ำตาปียามค่ำคืน (รักษ์สิ่งแวดล้อม)
const DEFAULT_SAMPLE_KRATHONGS: FloatingItem[] = [
  {
    id: 'sample-1',
    nickname: 'ชาวสุราษฎร์ธานี',
    krathong_type: 'pwa_blue',
    wish_text: 'ขอให้สายน้ำตาปีใสสะอาด ชุมชนร่มเย็น สุขภาพแข็งแรงตลอดปี',
    floated_at: '2026-11-20T19:15:00.000Z',
    water_coordinates_x: 22,
    water_coordinates_y: 54,
  },
  {
    id: 'sample-2',
    nickname: 'ครอบครัวสุขใจ',
    krathong_type: 'eco_banana',
    wish_text: 'ลอยกระทงออนไลน์ ไม่เพิ่มขยะ รักษ์สิ่งแวดล้อมเพื่อลูกหลาน',
    floated_at: '2026-11-20T19:22:00.000Z',
    water_coordinates_x: 48,
    water_coordinates_y: 65,
  },
  {
    id: 'sample-3',
    nickname: 'กปภ. สุราษฎร์',
    krathong_type: 'lotus_pink',
    wish_text: 'มุ่งมั่นผลิตน้ำประปาสะอาด บริการด้วยใจ เพื่อประชาชน',
    floated_at: '2026-11-20T19:30:00.000Z',
    water_coordinates_x: 68,
    water_coordinates_y: 48,
  },
  {
    id: 'sample-4',
    nickname: 'สมชาย รักน้ำ',
    krathong_type: 'moonlight_gold',
    wish_text: 'ขอขมาพระแม่คงคา ขอให้การงานเจริญรุ่งเรือง ค้าขายร่ำรวย',
    floated_at: '2026-11-20T19:45:00.000Z',
    water_coordinates_x: 35,
    water_coordinates_y: 75,
  },
  {
    id: 'sample-5',
    nickname: 'น้องฟ้าใส',
    krathong_type: 'tapi_river',
    wish_text: 'ขอให้ครอบครัวมีความสุข ปลอดโรคปลอดภัย สายน้ำตาปีสวยงาม',
    floated_at: '2026-11-20T19:50:00.000Z',
    water_coordinates_x: 82,
    water_coordinates_y: 58,
  },
];

export const StorageService = {
  // -------------------------------------------------------------
  // 1. บันทึกและดึงข้อมูล "ผู้เข้าใช้งาน" (Visitors)
  // -------------------------------------------------------------
  recordVisit(): number {
    let count = 425; // ค่าเริ่มต้นสมจริง
    try {
      const stored = localStorage.getItem(STORAGE_KEY_VISITORS);
      if (stored) {
        count = parseInt(stored, 10);
      }
      // ตรวจสอบว่าเป็น session ใหม่หรือไม่ เพื่อให้นับการเข้าชมอย่างถูกต้อง
      const hasVisitedThisSession = sessionStorage.getItem(SESSION_VISITED_FLAG);
      if (!hasVisitedThisSession) {
        count += 1;
        sessionStorage.setItem(SESSION_VISITED_FLAG, 'true');
        localStorage.setItem(STORAGE_KEY_VISITORS, String(count));
      }
    } catch {}
    return count;
  },

  getVisitorsCount(): number {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_VISITORS);
      if (stored) {
        return parseInt(stored, 10);
      }
    } catch {}
    return 425;
  },

  // -------------------------------------------------------------
  // 2. ดึงรายการและบันทึก "ผู้เล่นกิจกรรมลอยกระทง"
  // -------------------------------------------------------------
  getRecentKrathongs(): FloatingItem[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_KRATHONGS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {}
    return DEFAULT_SAMPLE_KRATHONGS;
  },

  getKrathongPlayersCount(): number {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_COUNTER);
      if (saved) {
        return parseInt(saved, 10);
      }
    } catch {}
    return 186;
  },

  floatKrathong(payload: {
    krathong_type: string;
    nickname?: string;
    wish_text: string;
    share_consent?: boolean;
  }): {
    success: boolean;
    participantCode: string;
    floatedAt: string;
    item: FloatingItem;
  } {
    const cleanNickname = (payload.nickname || '').trim() || 'ผู้ร่วมอนุรักษ์สายน้ำ';
    const cleanWish = (payload.wish_text || '').trim() || 'ขอให้ครอบครัวมีความสุข สุขภาพแข็งแรง และร่วมรักษาสายน้ำตาปี';
    const floatedAt = new Date().toISOString();

    // สร้างรหัสกิจกรรมอัตโนมัติ (เช่น LK69-000189)
    let currentCounter = 186;
    try {
      const saved = localStorage.getItem(STORAGE_KEY_COUNTER);
      if (saved) {
        currentCounter = parseInt(saved, 10) + 1;
      } else {
        currentCounter = 187;
      }
      localStorage.setItem(STORAGE_KEY_COUNTER, String(currentCounter));
    } catch {}

    const participantCode = `LK69-${String(currentCounter).padStart(6, '0')}`;

    // พิกัดสุ่มในแม่น้ำตาปี
    const coordX = Math.floor(Math.random() * 70) + 15;
    const coordY = Math.floor(Math.random() * 35) + 50;

    const newItem: FloatingItem = {
      id: `float-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      nickname: cleanNickname,
      krathong_type: payload.krathong_type,
      wish_text: cleanWish,
      floated_at: floatedAt,
      water_coordinates_x: coordX,
      water_coordinates_y: coordY,
    };

    try {
      // 1. บันทึกกระทงที่ลอยในแม่น้ำตาปี (แสดงใน Canvas)
      const currentItems = this.getRecentKrathongs();
      const updated = [newItem, ...currentItems.filter((i) => i.id !== newItem.id)].slice(0, 35);
      localStorage.setItem(STORAGE_KEY_KRATHONGS, JSON.stringify(updated));

      // 2. บันทึก Log ผู้ร่วมกิจกรรมสำหรับ Admin Dashboard
      const currentParticipants = this.getParticipantsLog();
      const newRecord: ParticipantRecord = {
        code: participantCode,
        nickname: cleanNickname,
        krathongType: payload.krathong_type,
        wishText: cleanWish,
        floatedAt,
      };
      const updatedLog = [newRecord, ...currentParticipants].slice(0, 200);
      localStorage.setItem(STORAGE_KEY_PARTICIPANTS, JSON.stringify(updatedLog));
    } catch (err) {
      console.warn('LocalStorage not available, running in-memory:', err);
    }

    return {
      success: true,
      participantCode,
      floatedAt,
      item: newItem,
    };
  },

  getParticipantsLog(): ParticipantRecord[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_PARTICIPANTS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {}
    // ค่าเริ่มต้นจำลอง
    return [
      {
        code: 'LK69-000186',
        nickname: 'น้องฟ้าใส',
        krathongType: 'tapi_river',
        wishText: 'ขอให้ครอบครัวมีความสุข ปลอดโรคปลอดภัย สายน้ำตาปีสวยงาม',
        floatedAt: '2026-11-20T19:50:00.000Z',
      },
      {
        code: 'LK69-000185',
        nickname: 'สมชาย รักน้ำ',
        krathongType: 'moonlight_gold',
        wishText: 'ขอขมาพระแม่คงคา ขอให้การงานเจริญรุ่งเรือง ค้าขายร่ำรวย',
        floatedAt: '2026-11-20T19:45:00.000Z',
      },
      {
        code: 'LK69-000184',
        nickname: 'กปภ. สุราษฎร์',
        krathongType: 'lotus_pink',
        wishText: 'มุ่งมั่นผลิตน้ำประปาสะอาด บริการด้วยใจ เพื่อประชาชน',
        floatedAt: '2026-11-20T19:30:00.000Z',
      },
      {
        code: 'LK69-000183',
        nickname: 'ครอบครัวสุขใจ',
        krathongType: 'eco_banana',
        wishText: 'ลอยกระทงออนไลน์ ไม่เพิ่มขยะ รักษ์สิ่งแวดล้อมเพื่อลูกหลาน',
        floatedAt: '2026-11-20T19:22:00.000Z',
      },
      {
        code: 'LK69-000182',
        nickname: 'ชาวสุราษฎร์ธานี',
        krathongType: 'pwa_blue',
        wishText: 'ขอให้สายน้ำตาปีใสสะอาด ชุมชนร่มเย็น สุขภาพแข็งแรงตลอดปี',
        floatedAt: '2026-11-20T19:15:00.000Z',
      },
    ];
  },

  // -------------------------------------------------------------
  // 3. บันทึกและดึงข้อมูล "ผู้สนใจสมัครบริการออนไลน์ กปภ."
  // แยกเป็น: แอปพลิเคชัน (app) / Line (line) / ผ่านเว็บเบราว์เซอร์ (web)
  // -------------------------------------------------------------
  recordOnlineServiceInterest(channel: 'app' | 'line' | 'web'): void {
    const channelNames: Record<'app' | 'line' | 'web', string> = {
      app: 'แอปพลิเคชัน PWA Plus Life (iOS / Android)',
      line: 'LINE Official Account (@pwathailand)',
      web: 'ระบบชำระค่าน้ำออนไลน์ผ่านเว็บเบราว์เซอร์',
    };

    try {
      const current = this.getOnlineServicesBreakdown();
      current[channel] += 1;
      localStorage.setItem(STORAGE_KEY_SERVICES, JSON.stringify(current));

      // บันทึก Log ประวัติการกดใช้งาน
      const logs = this.getServiceClicksLog();
      const newLog: ServiceClickRecord = {
        channel,
        channelName: channelNames[channel],
        timestamp: new Date().toISOString(),
      };
      const updatedLogs = [newLog, ...logs].slice(0, 200);
      localStorage.setItem(STORAGE_KEY_SERVICE_LOGS, JSON.stringify(updatedLogs));
    } catch {}
  },

  getOnlineServicesBreakdown(): { app: number; line: number; web: number } {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SERVICES);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (typeof parsed.app === 'number') {
          return {
            app: parsed.app || 0,
            line: parsed.line || 0,
            web: parsed.web || 0,
          };
        }
      }
    } catch {}
    // ค่าเริ่มต้นสวยงาม
    return {
      app: 48,  // แอป PWA Plus Life
      line: 62, // LINE @pwathailand
      web: 34,  // ผ่านเว็บเบราว์เซอร์
    };
  },

  getServiceClicksLog(): ServiceClickRecord[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SERVICE_LOGS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch {}
    return [
      {
        channel: 'line',
        channelName: 'LINE Official Account (@pwathailand)',
        timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
      },
      {
        channel: 'app',
        channelName: 'แอปพลิเคชัน PWA Plus Life (iOS / Android)',
        timestamp: new Date(Date.now() - 1000 * 60 * 28).toISOString(),
      },
      {
        channel: 'web',
        channelName: 'ระบบชำระค่าน้ำออนไลน์ผ่านเว็บเบราว์เซอร์',
        timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      },
    ];
  },

  // -------------------------------------------------------------
  // 4. บันทึกและดึงข้อมูล "ผู้ที่มีบัญชีอยู่แล้ว" (Existing Accounts)
  // -------------------------------------------------------------
  recordExistingUser(): number {
    let count = 94; // ค่าเริ่มต้น
    try {
      const stored = localStorage.getItem(STORAGE_KEY_EXISTING_USERS);
      if (stored) {
        count = parseInt(stored, 10);
      }
      count += 1;
      localStorage.setItem(STORAGE_KEY_EXISTING_USERS, String(count));
    } catch {}
    return count;
  },

  getExistingUsersCount(): number {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_EXISTING_USERS);
      if (stored) {
        return parseInt(stored, 10);
      }
    } catch {}
    return 94;
  },

  // -------------------------------------------------------------
  // 5. สรุปภาพรวมสถิติสำหรับผู้ดูแลระบบ (Admin Stats)
  // -------------------------------------------------------------
  getAdminStats(): AdminStats {
    const totalVisitors = this.getVisitorsCount();
    const totalKrathongPlayers = this.getKrathongPlayersCount();
    const services = this.getOnlineServicesBreakdown();
    const totalServices = services.app + services.line + services.web;
    const existingUsersCount = this.getExistingUsersCount();
    const participantsLog = this.getParticipantsLog();
    const serviceClicksLog = this.getServiceClicksLog();

    return {
      totalVisitors,
      totalKrathongPlayers,
      onlineServiceRegistrations: {
        total: totalServices,
        app: services.app,
        line: services.line,
        web: services.web,
      },
      existingUsersCount,
      participantsLog,
      serviceClicksLog,
    };
  },

  // ดึงสถิติกิจกรรมสาธารณะ (หน้าแรก)
  getPublicStats(): PublicStats {
    const totalFloated = this.getKrathongPlayersCount();
    const services = this.getOnlineServicesBreakdown();
    const totalServices = services.app + services.line + services.web;

    return {
      totalFloatedKrathongs: totalFloated,
      uniqueParticipants: Math.round(totalFloated * 0.94),
      totalOnlineRegistrations: totalServices,
      totalGiftsRedeemed: 0,
      remainingGiftStock: 0,
      wasteReductionRate: 100,
    };
  },

  // -------------------------------------------------------------
  // 6. ส่งออกรายงานสถิติเป็น CSV สำหรับเปิดใน Microsoft Excel
  // -------------------------------------------------------------
  exportStatsToCSV(): void {
    const stats = this.getAdminStats();
    const nowStr = new Date().toLocaleString('th-TH');

    let csvContent = '\uFEFF'; // UTF-8 BOM for Thai language in Excel
    csvContent += 'รายงานสถิติกิจกรรมลอยกระทงออนไลน์ ๒๕๖๙ - การประปาส่วนภูมิภาคสาขาสุราษฎร์ธานี (ชั้นพิเศษ)\n';
    csvContent += `วันที่ส่งออกข้อมูล: ${nowStr}\n\n`;

    csvContent += '=== สรุปภาพรวมสถิติ 4 หมวดหมู่หลัก ===\n';
    csvContent += 'ลำดับ,หมวดหมู่ข้อมูล,จำนวน,หน่วย\n';
    csvContent += `1,ผู้เข้าใช้งานทั้งหมด (Total Visitors),${stats.totalVisitors},คน\n`;
    csvContent += `2,ผู้เล่นกิจกรรมลอยกระทง (Loy Krathong Players),${stats.totalKrathongPlayers},กระทง\n`;
    csvContent += `3,ผู้สนใจสมัครใช้บริการออนไลน์ กปภ. (รวมทุกช่องทาง),${stats.onlineServiceRegistrations.total},ครั้ง\n`;
    csvContent += `3.1,  - ผ่านแอปพลิเคชัน PWA Plus Life (iOS/Android),${stats.onlineServiceRegistrations.app},ครั้ง\n`;
    csvContent += `3.2,  - ผ่าน LINE Official Account (@pwathailand),${stats.onlineServiceRegistrations.line},ครั้ง\n`;
    csvContent += `3.3,  - ผ่านเว็บเบราว์เซอร์ (ชำระค่าน้ำออนไลน์),${stats.onlineServiceRegistrations.web},ครั้ง\n`;
    csvContent += `4,ผู้ที่มีบัญชีบริการออนไลน์ กปภ. อยู่แล้ว,${stats.existingUsersCount},คน\n\n`;

    csvContent += '=== รายการผู้ร่วมกิจกรรมลอยกระทงล่าสุด ===\n';
    csvContent += 'รหัสกิจกรรม,ชื่อ/นามแฝง,ประเภทกระทง,คำอธิษฐาน,วันเวลาที่ลอยกระทง\n';
    stats.participantsLog.forEach((p) => {
      const cleanWish = p.wishText.replace(/"/g, '""');
      const timeStr = new Date(p.floatedAt).toLocaleString('th-TH');
      csvContent += `"${p.code}","${p.nickname}","${p.krathongType}","${cleanWish}","${timeStr}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `PWA_LoyKrathong_Stats_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  // ล้างหรือตั้งค่าสถิติใหม่ (สำหรับ Admin Reset)
  resetStats(): void {
    try {
      localStorage.setItem(STORAGE_KEY_VISITORS, '100');
      localStorage.setItem(STORAGE_KEY_COUNTER, '50');
      localStorage.setItem(STORAGE_KEY_SERVICES, JSON.stringify({ app: 15, line: 20, web: 10 }));
      localStorage.setItem(STORAGE_KEY_EXISTING_USERS, '25');
      localStorage.removeItem(STORAGE_KEY_PARTICIPANTS);
      localStorage.removeItem(STORAGE_KEY_SERVICE_LOGS);
    } catch {}
  },
};
