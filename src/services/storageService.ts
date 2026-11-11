/**
 * Client-Side Storage & Data Service
 * บันทึกสถานะการใช้งานเฉพาะที่จำเป็นในเบราว์เซอร์ (localStorage)
 * 
 * นโยบายข้อมูล:
 * - ยกเลิกตัวเลขจำลองทั้งหมด (No Mock Data)
 * - เริ่มต้นนับจาก 0 ตามการใช้งานจริง
 * - สถิติหลักของการลอยกระทงอ้างอิงจากฐานข้อมูล Google Sheets ผ่าน googleSheetsService
 */

import {
  PublicStats,
  GoogleSheetsStats,
  GoogleSheetsAdminData,
  OnlineServiceStats,
  AccountStatusType,
  ServiceKeyType,
  EventType,
  ServiceClickActivity,
} from '../types';
import { googleSheetsService } from './googleSheetsService';
export type {
  PublicStats,
  GoogleSheetsStats,
  GoogleSheetsAdminData,
  OnlineServiceStats,
  AccountStatusType,
  ServiceKeyType,
  EventType,
  ServiceClickActivity,
};

export interface FloatingItem {
  id: string;
  nickname: string;
  krathong_type: string;
  wish_text: string;
  floated_at: string;
  water_coordinates_x?: number;
  water_coordinates_y?: number;
}

export interface ServiceClickRecord {
  channel: 'app' | 'line' | 'web';
  channelName: string;
  timestamp: string;
}

const STORAGE_KEY_KRATHONGS = 'pwa_digital_krathongs_v2026';
const STORAGE_KEY_VISITORS = 'pwa_digital_visitors_v2026';
const STORAGE_KEY_EXISTING_USERS = 'pwa_digital_existing_users_v2026';
const STORAGE_KEY_SERVICES = 'pwa_digital_services_v2026';
const STORAGE_KEY_SERVICE_LOGS = 'pwa_digital_service_logs_v2026';
const SESSION_VISITED_FLAG = 'pwa_session_visited_flag';

export const StorageService = {
  // -------------------------------------------------------------
  // 1. บันทึกและดึงข้อมูล "ผู้เข้าใช้งาน" (Visitors - เริ่มต้นจาก 0)
  // -------------------------------------------------------------
  recordVisit(): number {
    let count = 0;
    try {
      const stored = localStorage.getItem(STORAGE_KEY_VISITORS);
      if (stored) {
        count = parseInt(stored, 10) || 0;
      }
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
        return parseInt(stored, 10) || 0;
      }
    } catch {}
    return 0;
  },

  // -------------------------------------------------------------
  // 2. ดึงรายการกระทงที่เพิ่งลอยใน Session
  // -------------------------------------------------------------
  getRecentKrathongs(): FloatingItem[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_KRATHONGS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch {}
    return [];
  },

  addRecentKrathong(item: FloatingItem): void {
    try {
      const current = this.getRecentKrathongs();
      const updated = [item, ...current.filter((i) => i.id !== item.id)].slice(0, 30);
      localStorage.setItem(STORAGE_KEY_KRATHONGS, JSON.stringify(updated));
    } catch {}
  },

  // -------------------------------------------------------------
  // 3. บันทึกและดึงข้อมูล "ผู้สนใจบริการออนไลน์ กปภ."
  // -------------------------------------------------------------
  recordOnlineServiceInterest(
    channel: ServiceKeyType | 'app' | 'line' | 'web',
    customName?: string,
    accountStatus: AccountStatusType = 'no_account'
  ): void {
    const channelNames: Record<string, string> = {
      pwa_plus_life: 'แอปพลิเคชัน PWA Plus Life (iOS / Android)',
      app: 'แอปพลิเคชัน PWA Plus Life (iOS / Android)',
      line_official: 'LINE Official Account (@pwathailand)',
      line: 'LINE Official Account (@pwathailand)',
      online_payment: 'ระบบชำระค่าน้ำออนไลน์ผ่านเว็บเบราว์เซอร์',
      web: 'ระบบชำระค่าน้ำออนไลน์ผ่านเว็บเบราว์เซอร์',
      none: 'บริการออนไลน์ กปภ.',
    };

    const serviceName = customName || channelNames[channel] || 'บริการออนไลน์ กปภ.';
    let normalizedChannel: 'app' | 'line' | 'web' = 'app';
    if (channel === 'pwa_plus_life' || channel === 'app') normalizedChannel = 'app';
    else if (channel === 'line_official' || channel === 'line') normalizedChannel = 'line';
    else if (channel === 'online_payment' || channel === 'web') normalizedChannel = 'web';

    try {
      // 1. ส่งข้อมูลไปยัง Google Apps Script (บันทึกใน Sheet: "ServiceClicks")
      // event_id, created_at, account_status, service_key, service_name, event_type
      googleSheetsService.recordServiceClick(channel, serviceName, accountStatus);

      // 2. บันทึกสำรองในเครื่องสำหรับใช้งาน
      const current = this.getOnlineServicesBreakdown();
      current[normalizedChannel] = (current[normalizedChannel] || 0) + 1;
      localStorage.setItem(STORAGE_KEY_SERVICES, JSON.stringify(current));

      const logs = this.getServiceClicksLog();
      const newLog: ServiceClickRecord = {
        channel: normalizedChannel,
        channelName: serviceName,
        timestamp: new Date().toISOString(),
      };
      const updatedLogs = [newLog, ...logs].slice(0, 100);
      localStorage.setItem(STORAGE_KEY_SERVICE_LOGS, JSON.stringify(updatedLogs));
    } catch {}
  },

  /**
   * บันทึกการกด "เสร็จสิ้นกิจกรรม" ในระบบบริการออนไลน์
   * event_type: complete_registration
   * account_status: 'no_account' | 'has_account'
   */
  recordRegistrationCompletion(accountStatus: AccountStatusType, serviceName?: string): void {
    try {
      googleSheetsService.recordRegistrationCompletion(accountStatus, serviceName);
    } catch {}
  },

  /**
   * บันทึกเหตุการณ์บริการออนไลน์แบบกำหนดเอง
   */
  recordServiceEvent(payload: {
    account_status: AccountStatusType;
    service_key: ServiceKeyType;
    service_name: string;
    event_type: EventType;
  }): void {
    try {
      googleSheetsService.recordServiceEvent(payload);
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
    return { app: 0, line: 0, web: 0 };
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
    return [];
  },

  // -------------------------------------------------------------
  // 4. บันทึกและดึงข้อมูล "ผู้ที่มีบัญชีอยู่แล้ว"
  // -------------------------------------------------------------
  recordExistingUser(): number {
    let count = 0;
    try {
      const stored = localStorage.getItem(STORAGE_KEY_EXISTING_USERS);
      if (stored) {
        count = parseInt(stored, 10) || 0;
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
        return parseInt(stored, 10) || 0;
      }
    } catch {}
    return 0;
  },

  // -------------------------------------------------------------
  // 5. บันทึกกิจกรรมลอยกระทงไปยัง Google Sheets ผ่าน Google Apps Script API
  // -------------------------------------------------------------
  async recordKrathongActivity(payload: {
    krathong_type: string;
    wish: string;
    nickname?: string;
  }) {
    // ส่งข้อมูลไปยัง Google Apps Script Web App API
    const result = await googleSheetsService.floatKrathong({
      krathong_type: payload.krathong_type,
      wish: payload.wish,
    });

    // หากบันทึกสำเร็จ นำมาใส่รายการล่าสุดเพื่อให้ปรากฏในแม่น้ำทันที
    if (result.success) {
      this.addRecentKrathong({
        id: result.activity_id,
        nickname: payload.nickname || 'ผู้ร่วมอนุรักษ์สายน้ำ',
        krathong_type: payload.krathong_type,
        wish_text: payload.wish,
        floated_at: result.created_at,
      });
    }

    return result;
  },

  // -------------------------------------------------------------
  // 6. ดึงข้อมูลสถิติจริงจาก Google Sheets API
  // -------------------------------------------------------------
  async getRealStats(): Promise<GoogleSheetsStats> {
    return await googleSheetsService.getStats();
  },

  // -------------------------------------------------------------
  // 7. ดึงข้อมูลกิจกรรมทั้งหมดสำหรับหน้าผู้ดูแลระบบ (Admin Dashboard)
  // -------------------------------------------------------------
  async getAdminActivities(): Promise<GoogleSheetsAdminData> {
    return await googleSheetsService.getAdminActivities();
  },

  // -------------------------------------------------------------
  // 8. ดึงข้อมูลสถิติการคลิกบริการออนไลน์ กปภ. จาก Google Sheets
  // -------------------------------------------------------------
  async getOnlineServiceStats(): Promise<OnlineServiceStats> {
    return await googleSheetsService.getServiceStats();
  },
};


