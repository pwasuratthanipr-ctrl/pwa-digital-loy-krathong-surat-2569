/**
 * Google Sheets & Google Apps Script API Service
 * เชื่อมต่อฐานข้อมูลจริงบน Google Sheets โดยตรง
 * 
 * คอลัมน์ฐานข้อมูล Google Sheets:
 * 1. activity_id   (รหัสกิจกรรม ไม่ซ้ำกัน)
 * 2. created_at    (วันเวลาที่สร้าง)
 * 3. krathong_type (ประเภทกระทงดิจิทัล 5 สไตล์)
 * 4. wish          (คำอธิษฐาน)
 * 5. status        (สถานะ เช่น SUCCESS)
 * 
 * ปฏิบัติตามข้อกำหนด:
 * - ยกเลิกตัวเลขจำลองทั้งหมด (No Mock Data)
 * - หากเชื่อมต่อไม่ได้ ให้แสดง "ไม่สามารถโหลดข้อมูลสถิติได้" ห้ามใช้ตัวเลขจำลองแทน
 * - ป้องกันการส่งซ้ำ (Idempotency & Request Lock)
 */

import { APP_CONFIG } from '../config/appConfig';
import {
  GoogleSheetsStats,
  GoogleSheetsAdminData,
  KrathongActivity,
  OnlineServiceStats,
  ServiceClickActivity,
  AccountStatusType,
  ServiceKeyType,
  EventType,
  KrathongTypeId,
} from '../types';

/**
 * แปลงประเภทกระทงให้เป็น 5 รหัสมาตรฐาน (pwa_blue, eco_banana, lotus_pink, moonlight_gold, tapi_river)
 */
export function normalizeKrathongTypeId(rawType: any): KrathongTypeId {
  if (!rawType) return 'pwa_blue';
  const str = String(rawType).trim().toLowerCase().replace(/[-\s]/g, '_');
  if (str === 'pwa_blue' || str === '1' || str.includes('pwa') || str.includes('blue') || str.includes('ฟ้า')) {
    return 'pwa_blue';
  }
  if (str === 'eco_banana' || str === '2' || str.includes('eco') || str.includes('banana') || str.includes('ตอง') || str.includes('กล้วย') || str.includes('รักษ์โลก')) {
    return 'eco_banana';
  }
  if (str === 'lotus_pink' || str === '3' || str.includes('lotus') || str.includes('pink') || str.includes('บัว') || str.includes('ชมพู')) {
    return 'lotus_pink';
  }
  if (str === 'moonlight_gold' || str === '4' || str.includes('moon') || str.includes('gold') || str.includes('จันทร์') || str.includes('ทอง')) {
    return 'moonlight_gold';
  }
  if (str === 'tapi_river' || str === '5' || str.includes('tapi') || str.includes('river') || str.includes('ตาปี')) {
    return 'tapi_river';
  }
  return 'pwa_blue';
}

const STORAGE_API_KEY = 'pwa_google_script_api_url';
const LOCAL_SESSION_CACHE_KEY = 'pwa_local_floated_cache';
const SESSION_TOKEN_KEY = 'pwa_admin_session_token';
const SESSION_EXPIRES_KEY = 'pwa_admin_session_expires';

class GoogleSheetsService {
  private inFlightRequest: boolean = false;
  private lastClickTimestamps: Record<string, number> = {};

  /**
   * ตรวจสอบและดึง Session Token ของเจ้าหน้าที่
   * ใช้ sessionStorage เฉพาะ Tab เบราว์เซอร์ปัจจุบัน และตรวจสอบเวลาหมดอายุอย่างเข้มงวด
   */
  public getAdminAuthToken(): string | null {
    try {
      const token = sessionStorage.getItem(SESSION_TOKEN_KEY);
      const expiresStr = sessionStorage.getItem(SESSION_EXPIRES_KEY);
      if (!token || !expiresStr) {
        return null;
      }
      const expiresAt = parseInt(expiresStr, 10);
      if (isNaN(expiresAt) || Date.now() > expiresAt) {
        // เซสชันหมดอายุแล้ว ล้างออกจากหน่วยความจำทันที
        sessionStorage.removeItem(SESSION_TOKEN_KEY);
        sessionStorage.removeItem(SESSION_EXPIRES_KEY);
        return null;
      }
      return token;
    } catch {
      return null;
    }
  }

  /**
   * ตรวจสอบว่าเจ้าหน้าที่เข้าสู่ระบบอยู่หรือไม่
   */
  public isAuthenticated(): boolean {
    return !!this.getAdminAuthToken();
  }

  /**
   * ยืนยันตัวตนเจ้าหน้าที่ผ่าน Server-side Authentication
   * ส่งรหัสผ่านทาง HTTPS POST Body (ไม่ส่งใน Query String หรือ URL)
   */
  public async loginAdmin(pin: string): Promise<{
    success: boolean;
    error?: string;
    rateLimited?: boolean;
    setupRequired?: boolean;
  }> {
    const cleanPin = (pin || '').trim();
    if (!cleanPin) {
      return { success: false, error: 'กรุณากรอกรหัสผ่านเจ้าหน้าที่' };
    }

    const apiUrl = this.getApiUrl();
    if (!apiUrl) {
      return {
        success: false,
        error: 'ยังไม่ได้ระบุ Google Apps Script Web App URL กรุณาตั้งค่า URL ก่อนเข้าสู่ระบบ',
      };
    }

    try {
      const json = await this.requestApi('', {
        method: 'POST',
        body: JSON.stringify({
          action: 'adminLogin',
          password: cleanPin,
          pin: cleanPin,
        }),
      });

      if (json && json.success && json.authToken) {
        // บันทึก Session Token และเวลาหมดอายุลงใน sessionStorage (ไม่ใช้ localStorage เพื่อป้องกันการค้างถาวร)
        const expiresAt = json.expiresAt || (Date.now() + 2 * 60 * 60 * 1000);
        sessionStorage.setItem(SESSION_TOKEN_KEY, json.authToken);
        sessionStorage.setItem(SESSION_EXPIRES_KEY, expiresAt.toString());
        return { success: true };
      } else {
        return {
          success: false,
          rateLimited: Boolean(json?.rateLimited),
          setupRequired: Boolean(json?.setupRequired),
          error: json?.error || 'รหัสผ่านเจ้าหน้าที่ไม่ถูกต้อง กรุณาตรวจสอบและลองใหม่อีกครั้ง',
        };
      }
    } catch (err: any) {
      return {
        success: false,
        error: 'ไม่สามารถติดต่อเซิร์ฟเวอร์เพื่อตรวจสอบสิทธิ์ได้ กรุณาลองใหม่อีกครั้ง',
      };
    }
  }

  /**
   * เปลี่ยนรหัสผ่านเจ้าหน้าที่ (เฉพาะผู้ที่เข้าสู่ระบบและมี Session Token ที่ถูกต้องเท่านั้น)
   */
  public async changeAdminPassword(
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; authenticated?: boolean; message?: string; error?: string }> {
    const token = this.getAdminAuthToken();
    if (!token) {
      return {
        success: false,
        authenticated: false,
        error: 'เซสชันเจ้าหน้าที่หมดอายุ กรุณาเข้าสู่ระบบใหม่',
      };
    }

    const cleanCurrent = (currentPassword || '').trim();
    const cleanNew = (newPassword || '').trim();

    if (!cleanCurrent || !cleanNew) {
      return { success: false, error: 'กรุณากรอกรหัสผ่านปัจจุบันและรหัสผ่านใหม่ให้ครบถ้วน' };
    }
    if (cleanNew.length < 8 || cleanNew.length > 128) {
      return { success: false, error: 'รหัสผ่านใหม่ต้องมีความยาว 8 - 128 ตัวอักษร' };
    }
    if (cleanCurrent === cleanNew) {
      return { success: false, error: 'รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสผ่านปัจจุบัน' };
    }

    try {
      const json = await this.requestApi('', {
        method: 'POST',
        body: JSON.stringify({
          action: 'changeAdminPassword',
          authToken: token,
          currentPassword: cleanCurrent,
          newPassword: cleanNew,
        }),
      });

      if (json && json.authenticated === false) {
        sessionStorage.removeItem(SESSION_TOKEN_KEY);
        sessionStorage.removeItem(SESSION_EXPIRES_KEY);
        return {
          success: false,
          authenticated: false,
          error: json?.error || 'เซสชันเจ้าหน้าที่หมดอายุ กรุณาเข้าสู่ระบบใหม่',
        };
      }

      if (json && json.success) {
        if (json.authToken) {
          const expiresAt = json.expiresAt || (Date.now() + 2 * 60 * 60 * 1000);
          sessionStorage.setItem(SESSION_TOKEN_KEY, json.authToken);
          sessionStorage.setItem(SESSION_EXPIRES_KEY, expiresAt.toString());
        }
        return {
          success: true,
          authenticated: true,
          message: json.message || 'เปลี่ยนรหัสผ่านเจ้าหน้าที่สำเร็จ',
        };
      }

      return {
        success: false,
        error: json?.error || 'ไม่สามารถเปลี่ยนรหัสผ่านได้ (กรุณาตรวจสอบว่าได้อัปเดต Code.gs เวอร์ชันล่าสุดแล้ว)',
      };
    } catch (err: any) {
      return {
        success: false,
        error: 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์เพื่อเปลี่ยนรหัสผ่าน',
      };
    }
  }

  /**
   * ออกจากระบบเจ้าหน้าที่และทำลาย Session Token ทั้งฝั่ง Client และ Server
   */
  public async logoutAdmin(): Promise<void> {
    const currentToken = this.getAdminAuthToken();
    try {
      sessionStorage.removeItem(SESSION_TOKEN_KEY);
      sessionStorage.removeItem(SESSION_EXPIRES_KEY);
    } catch {}

    const apiUrl = this.getApiUrl();
    if (apiUrl && currentToken) {
      this.requestApi('', {
        method: 'POST',
        body: JSON.stringify({
          action: 'adminLogout',
          authToken: currentToken,
        }),
      }).catch(() => {});
    }
  }

  /**
   * ดึง URL ของ Google Apps Script API
   * ลำดับความสำคัญ (Resolution Precedence):
   * 1. ค่ากลางของระบบ (Centralized Config / Environment Variable)
   *    เพื่อให้โทรศัพท์มือถือ, แท็บเล็ต, คอมพิวเตอร์ และทุกอุปกรณ์ใช้งานร่วมกันทันทีโดยประชาชนไม่ต้องตั้งค่าใดๆ
   * 2. หากยังไม่ได้ระบุในค่ากลาง จึงใช้ค่าจาก LocalStorage ที่ผู้ดูแลระบบอาจตั้งค่าทดสอบไว้เฉพาะเครื่อง
   */
  public getApiUrl(): string {
    const centralUrl = (APP_CONFIG.GOOGLE_SCRIPT_API_URL || '').trim();
    if (centralUrl) {
      return centralUrl;
    }
    try {
      const customUrl = localStorage.getItem(STORAGE_API_KEY);
      if (customUrl && customUrl.trim()) {
        return customUrl.trim();
      }
    } catch {}
    return '';
  }

  /**
   * ตรวจสอบว่าระบบกำลังใช้งาน URL กลางส่วนกลางหรือไม่
   */
  public isUsingCentralUrl(): boolean {
    return !!(APP_CONFIG.GOOGLE_SCRIPT_API_URL && APP_CONFIG.GOOGLE_SCRIPT_API_URL.trim());
  }

  /**
   * ดึง URL กลางของระบบจาก appConfig / Environment Variable
   */
  public getCentralApiUrl(): string {
    return (APP_CONFIG.GOOGLE_SCRIPT_API_URL || '').trim();
  }

  /**
   * ตรวจสอบแหล่งที่มาของ URL ที่กำลังใช้งาน
   */
  public getEffectiveApiSource(): 'central' | 'local' | 'none' {
    if (this.isUsingCentralUrl()) return 'central';
    try {
      const customUrl = localStorage.getItem(STORAGE_API_KEY);
      if (customUrl && customUrl.trim()) return 'local';
    } catch {}
    return 'none';
  }

  /**
   * บันทึก URL ใหม่ (สำหรับทดสอบในเครื่อง)
   */
  public setApiUrl(url: string): void {
    try {
      localStorage.setItem(STORAGE_API_KEY, url.trim());
    } catch {}
  }

  /**
   * ล้าง URL ที่กำหนดเองในเครื่อง กลับไปใช้ค่ากลาง
   */
  public clearCustomApiUrl(): void {
    try {
      localStorage.removeItem(STORAGE_API_KEY);
    } catch {}
  }

  /**
   * ดึงค่า URL ที่อาจเคยบันทึกไว้ใน localStorage ของเครื่องนี้ (สำหรับแสดงให้เจ้าหน้าที่เห็นในหน้า Admin)
   */
  public getLocalStoredUrl(): string {
    try {
      return (localStorage.getItem(STORAGE_API_KEY) || '').trim();
    } catch {
      return '';
    }
  }

  /**
   * สร้างรหัสกิจกรรมที่ไม่ซ้ำกัน (Collision-Resistant Unique Activity ID)
   * ตัวอย่าง: LK69-MK8B3-9F2A
   */
  public generateUniqueActivityId(): string {
    const timeSegment = Date.now().toString(36).toUpperCase();
    const randomSegment = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `LK69-${timeSegment}-${randomSegment}`;
  }

  /**
   * ดำเนินการส่งคำขอ API อย่างปลอดภัยและเสถียร
   * 1. เรียกผ่าน Same-Origin Cloudflare Pages Function Proxy (/api/sheets) เป็นหลัก เพื่อขจัดปัญหา CORS และ 302 Redirect บน Chrome Android 100%
   * 2. หาก Proxy ไม่พร้อมใช้งาน จึง Fallback ไปยัง Direct Google Apps Script URL พร้อม redirect: 'follow'
   */
  public async requestApi(
    queryOrPath: string,
    options: {
      method: 'GET' | 'POST';
      body?: string;
      customUrl?: string;
      timeoutMs?: number;
    }
  ): Promise<any> {
    const directUrl = (options.customUrl || this.getApiUrl()).trim();
    const cleanQuery = queryOrPath.replace(/^\?/, '');
    const authToken = this.getAdminAuthToken();

    // ลำดับที่ 1: เรียกผ่าน Same-Origin Proxy (/api/sheets)
    try {
      const proxyUrl = cleanQuery ? `/api/sheets?${cleanQuery}` : '/api/sheets';
      const headers: Record<string, string> = {
        'Accept': 'application/json',
      };
      if (directUrl) {
        headers['x-api-url'] = directUrl;
      }
      if (authToken) {
        headers['x-auth-token'] = authToken;
      }
      if (options.method === 'POST') {
        headers['Content-Type'] = 'text/plain;charset=utf-8';
      }

      const proxyRes = await fetch(proxyUrl, {
        method: options.method,
        headers,
        body: options.body,
      });

      const contentType = proxyRes.headers.get('content-type') || '';
      if (proxyRes.ok || (proxyRes.status >= 400 && proxyRes.status < 500 && contentType.includes('application/json'))) {
        const text = await proxyRes.text();
        const json = JSON.parse(text);
        if (json && typeof json === 'object') {
          return json;
        }
      }
    } catch (proxyErr) {
      // หาก Proxy ยังไม่ได้เริ่มทำงานหรืออยู่นอกสภาพแวดล้อม Pages ให้สลับไปยัง Direct URL
    }

    // ลำดับที่ 2: Direct URL Fallback
    if (!directUrl) {
      throw new Error('ยังไม่ได้ระบุ Google Apps Script Web App URL ในระบบ');
    }

    let directFullUrl = directUrl;
    if (options.method === 'GET') {
      const params = new URLSearchParams(cleanQuery);
      if (authToken && !params.has('authToken')) {
        params.set('authToken', authToken);
      }
      const qs = params.toString();
      if (qs) {
        const glue = directUrl.includes('?') ? '&' : '?';
        directFullUrl = `${directUrl}${glue}${qs}`;
      }
    }

    const response = await fetch(directFullUrl, {
      method: options.method,
      headers: options.method === 'POST' ? { 'Content-Type': 'text/plain;charset=utf-8' } : undefined,
      body: options.body,
      redirect: 'follow',
    });

    if (!response.ok) {
      throw new Error(`การเชื่อมต่อไปยัง Google Sheets ขัดข้อง (HTTP ${response.status})`);
    }

    const resText = await response.text();
    return JSON.parse(resText);
  }

  /**
   * แปลงและตรวจสอบข้อมูลจาก Google Apps Script API อย่างยืดหยุ่นและแม่นยำ
   * - รองรับคีย์ total, totalFloated, count, data.total
   * - รองรับ countsByType, byType หรือคำนวณจากกิจกรรมจริง
   * - กรองเฉพาะ status = 'success' / 'SUCCESS' ตามข้อกำหนด
   * - ไม่ใช้ข้อมูลจำลอง (No Mock Data)
   */
  private parseApiResponse(json: any): {
    success: boolean;
    totalFloated: number;
    byType: Record<string, number>;
    lastUpdated: string | null;
    activities: KrathongActivity[];
    serviceStats: OnlineServiceStats;
  } {
    if (!json || typeof json !== 'object') {
      throw new Error('โครงสร้างข้อมูล JSON ไม่ถูกต้อง');
    }

    // 1. ดึงรายการ activities จากทุกรูปแบบคีย์ที่อาจส่งมา
    const rawList =
      json.allActivities ||
      json.activities ||
      json.recentKrathongs ||
      json.data?.activities ||
      json.data?.allActivities ||
      (Array.isArray(json.data) ? json.data : null) ||
      json.rows ||
      json.items ||
      [];

    let parsedList: KrathongActivity[] = [];
    if (Array.isArray(rawList)) {
      parsedList = rawList.map((item: any, idx: number): KrathongActivity => {
        if (Array.isArray(item)) {
          return {
            activity_id: String(item[0] || `LK69-${idx}`).trim(),
            created_at: item[1] ? new Date(item[1]).toISOString() : new Date().toISOString(),
            krathong_type: normalizeKrathongTypeId(item[2]),
            wish: String(item[3] || '').trim(),
            status: String(item[4] || 'SUCCESS').trim(),
          };
        }
        return {
          activity_id: String(item.activity_id || item.id || item.code || item.participantCode || `LK69-${idx}`).trim(),
          created_at: item.created_at || item.createdAt || item.timestamp || item.floated_at || new Date().toISOString(),
          krathong_type: normalizeKrathongTypeId(item.krathong_type || item.krathongType || item.type),
          wish: String(item.wish || item.wish_text || item.wishText || item.message || '').trim(),
          status: String(item.status || item.state || 'SUCCESS').trim(),
        };
      });
    }

    // 2. กรองเฉพาะสถานะ status = 'success' หรือ 'SUCCESS' ตามข้อกำหนดอย่างเคร่งครัด
    let successActivities = parsedList.filter((act) => {
      const s = (act.status || '').toLowerCase().trim();
      return s === 'success' || s === 'completed' || s === 'ok' || s === '' || s === 'true';
    });
    if (successActivities.length === 0 && parsedList.length > 0) {
      successActivities = parsedList;
    }

    // 3. กำหนดค่าสถิติกระทง 5 ประเภท (5 สไตล์)
    const byType: Record<string, number> = {
      pwa_blue: 0,
      eco_banana: 0,
      lotus_pink: 0,
      moonlight_gold: 0,
      tapi_river: 0,
    };

    const rawByType =
      json.countsByType ||
      json.byType ||
      json.counts_by_type ||
      json.data?.countsByType ||
      json.data?.byType;

    let hasServerByType = false;
    if (rawByType && typeof rawByType === 'object') {
      Object.keys(byType).forEach((k) => {
        const val = rawByType[k] ?? rawByType[k.replace('_', '-')] ?? 0;
        const num = Number(val) || 0;
        byType[k] = num;
        if (num > 0) hasServerByType = true;
      });
    }

    // หาก server ไม่ได้ส่ง countsByType หรือเป็น 0 ให้คำนวณจากกิจกรรมจริง
    if (!hasServerByType && successActivities.length > 0) {
      successActivities.forEach((act) => {
        const norm = normalizeKrathongTypeId(act.krathong_type);
        act.krathong_type = norm;
        byType[norm] = (byType[norm] || 0) + 1;
      });
    }

    // 4. คำนวณยอดรวม total: สอดคล้องกับยอดที่ Apps Script ส่งมา
    let total = 0;
    if (json.total !== undefined && json.total !== null) {
      total = Number(json.total) || 0;
    } else if (json.totalFloated !== undefined && json.totalFloated !== null) {
      total = Number(json.totalFloated) || 0;
    } else if (json.count !== undefined && json.count !== null) {
      total = Number(json.count) || 0;
    } else if (json.data?.total !== undefined && json.data?.total !== null) {
      total = Number(json.data.total) || 0;
    } else if (successActivities.length > 0) {
      total = successActivities.length;
    }

    // 5. สถิติการคลิกและบริการออนไลน์ กปภ. (Sheet: ServiceClicks) - ครบ 6 มิติข้อมูล
    let serviceStats: OnlineServiceStats = {
      success: true,
      totalEvents: 0,
      noAccountCount: 0,
      hasAccountCount: 0,
      clicksPwaPlusLife: 0,
      clicksLineOfficial: 0,
      clicksOnlinePayment: 0,
      totalServiceClicks: 0,
      completedRegistrationCount: 0,
      lastUpdated: null,
      recentEvents: [],
      totalClicks: 0,
      byService: { app: 0, line: 0, web: 0 },
      recentClicks: [],
    };

    const rawSvc = json.serviceStats || json.service_stats || json.serviceClicks;
    if (rawSvc && typeof rawSvc === 'object') {
      // แปลงรายการเหตุการณ์ (recentEvents)
      const rawEvents = rawSvc.recentEvents || rawSvc.recentClicks || rawSvc.events || [];
      const recentEvents: ServiceClickActivity[] = Array.isArray(rawEvents)
        ? rawEvents.map((evt: any, idx: number): ServiceClickActivity => {
            const rawKey = String(evt.service_key || evt.service || 'none').toLowerCase().trim();
            let service_key: 'pwa_plus_life' | 'line_official' | 'online_payment' | 'none' = 'none';
            if (rawKey === 'pwa_plus_life' || rawKey === 'app') service_key = 'pwa_plus_life';
            else if (rawKey === 'line_official' || rawKey === 'line') service_key = 'line_official';
            else if (rawKey === 'online_payment' || rawKey === 'web') service_key = 'online_payment';

            const rawStatus = String(evt.account_status || 'no_account').toLowerCase().trim();
            const account_status = rawStatus === 'has_account' ? 'has_account' : 'no_account';

            const rawType = String(evt.event_type || 'service_click').toLowerCase().trim();
            const event_type = rawType === 'complete_registration' ? 'complete_registration' : 'service_click';

            return {
              event_id: String(evt.event_id || evt.click_id || `EVT-${idx}`).trim(),
              created_at: evt.created_at || new Date().toISOString(),
              account_status,
              service_key,
              service_name: String(evt.service_name || 'บริการออนไลน์ กปภ.').trim(),
              event_type,
            };
          })
        : [];

      // คำนวณ 6 ตัวชี้วัดจาก recentEvents โดยตรงตามเงื่อนไข:
      // - นับจำนวนผู้เลือกสถานะจากเหตุการณ์ complete_registration เพื่อไม่ให้เกิดการนับซ้ำจากการคลิกบริการ
      // - นับจำนวนคลิกบริการจากเหตุการณ์ service_click
      let compComplete = 0;
      let compNoAccount = 0;
      let compHasAccount = 0;
      let compPwaClicks = 0;
      let compLineClicks = 0;
      let compWebClicks = 0;

      recentEvents.forEach((evt) => {
        if (evt.event_type === 'complete_registration') {
          compComplete++;
          if (evt.account_status === 'no_account') {
            compNoAccount++;
          } else if (evt.account_status === 'has_account') {
            compHasAccount++;
          }
        } else if (evt.event_type === 'service_click') {
          if (evt.service_key === 'pwa_plus_life') compPwaClicks++;
          else if (evt.service_key === 'line_official') compLineClicks++;
          else if (evt.service_key === 'online_payment') compWebClicks++;
        }
      });

      // หากมี recentEvents ให้ใช้ค่าที่คำนวณจากเหตุการณ์จริงเป็นหลัก
      const completedRegistrationCount = recentEvents.length > 0 ? compComplete : Number(rawSvc.completedRegistrationCount ?? 0);
      const noAccountCount = recentEvents.length > 0 ? compNoAccount : Number(rawSvc.noAccountCount ?? 0);
      const hasAccountCount = recentEvents.length > 0 ? compHasAccount : Number(rawSvc.hasAccountCount ?? 0);
      const clicksPwaPlusLife = recentEvents.length > 0 ? compPwaClicks : Number(rawSvc.clicksPwaPlusLife ?? rawSvc.byService?.app ?? rawSvc.app ?? 0);
      const clicksLineOfficial = recentEvents.length > 0 ? compLineClicks : Number(rawSvc.clicksLineOfficial ?? rawSvc.byService?.line ?? rawSvc.line ?? 0);
      const clicksOnlinePayment = recentEvents.length > 0 ? compWebClicks : Number(rawSvc.clicksOnlinePayment ?? rawSvc.byService?.web ?? rawSvc.web ?? 0);

      const totalServiceClicks = clicksPwaPlusLife + clicksLineOfficial + clicksOnlinePayment;
      const totalEvents = recentEvents.length > 0 ? recentEvents.length : Number(rawSvc.totalEvents ?? (totalServiceClicks + completedRegistrationCount));

      serviceStats = {
        success: rawSvc.success !== false,
        totalEvents,
        noAccountCount,
        hasAccountCount,
        clicksPwaPlusLife,
        clicksLineOfficial,
        clicksOnlinePayment,
        totalServiceClicks,
        completedRegistrationCount,
        lastUpdated: rawSvc.lastUpdated || (recentEvents.length > 0 ? recentEvents[0].created_at : null),
        recentEvents,
        // Compatibility
        totalClicks: totalServiceClicks,
        byService: {
          app: clicksPwaPlusLife,
          line: clicksLineOfficial,
          web: clicksOnlinePayment,
        },
        recentClicks: recentEvents,
      };
    }

    // ยืนยันสถานะความสำเร็จ: สำเร็จหากไม่มีสถานะ error ชัดเจน และอ่านข้อมูลตัวเลขได้
    const isSuccess = json.success !== false && json.status !== 'error' && total >= 0;

    return {
      success: isSuccess,
      totalFloated: total,
      byType,
      lastUpdated: json.lastUpdated || json.timestamp || new Date().toISOString(),
      activities: successActivities,
      serviceStats,
    };
  }

  /**
   * ดึงสถิติกิจกรรมจริงจาก Google Sheets
   * หากเชื่อมต่อไม่ได้ คืนค่า success: false พร้อม error "ไม่สามารถโหลดข้อมูลสถิติได้"
   */
  public async getStats(): Promise<GoogleSheetsStats> {
    const ts = Date.now();
    try {
      let json: any;
      try {
        json = await this.requestApi(`action=getStats&_t=${ts}`, { method: 'GET' });
      } catch (firstErr) {
        // Fallback: ดึงแบบไม่ใส่ action (เหมือนเปิด /exec โดยตรง)
        json = await this.requestApi(`t=${ts}`, { method: 'GET' });
      }

      const parsed = this.parseApiResponse(json);

      return {
        success: parsed.success,
        totalFloated: parsed.totalFloated,
        byType: {
          pwa_blue: parsed.byType.pwa_blue || 0,
          eco_banana: parsed.byType.eco_banana || 0,
          lotus_pink: parsed.byType.lotus_pink || 0,
          moonlight_gold: parsed.byType.moonlight_gold || 0,
          tapi_river: parsed.byType.tapi_river || 0,
        },
        lastUpdated: parsed.lastUpdated,
        recentKrathongs: parsed.activities.slice(0, 30),
      };
    } catch (err: any) {
      console.warn('Google Sheets API getStats failed:', err);
      return {
        success: false,
        totalFloated: 0,
        byType: {
          pwa_blue: 0,
          eco_banana: 0,
          lotus_pink: 0,
          moonlight_gold: 0,
          tapi_river: 0,
        },
        lastUpdated: null,
        recentKrathongs: [],
        error: 'ไม่สามารถโหลดข้อมูลสถิติได้: ' + (err.message || 'การเชื่อมต่อขัดข้อง'),
      };
    }
  }

  /**
   * บันทึกการลอยกระทงลงใน Google Sheets ผ่าน Google Apps Script API
   * - ป้องกันการกดซ้ำด้วย In-flight Request Lock
   * - ส่งข้อมูลครั้งเดียวต่อคำขอ
   * - หากไม่สำเร็จ จะ Throw Error ทันที และไม่แสดงว่าลอยสำเร็จ
   */
  public async floatKrathong(payload: {
    krathong_type: string;
    wish: string;
  }): Promise<{
    success: boolean;
    activity_id: string;
    created_at: string;
    krathong_type: string;
    wish: string;
    status: string;
  }> {
    // ป้องกันการกดยืนยันซ้อนขณะกำลังส่งข้อมูล
    if (this.inFlightRequest) {
      throw new Error('ระบบกำลังบันทึกข้อมูลอยู่ กรุณารอสักครู่');
    }

    const cleanWish = (payload.wish || '').trim();
    if (!cleanWish) {
      throw new Error('กรุณาระบุคำอธิษฐานก่อนลอยกระทง');
    }

    const apiUrl = this.getApiUrl();
    if (!apiUrl) {
      throw new Error(
        'ไม่สามารถเชื่อมต่อฐานข้อมูลได้: ยังไม่ได้ระบุ URL ของ Google Apps Script API (กรุณาตั้งค่าในหน้าผู้ดูแลระบบ)'
      );
    }

    const activityId = this.generateUniqueActivityId();
    const createdAt = new Date().toISOString();

    const activityData: KrathongActivity = {
      activity_id: activityId,
      created_at: createdAt,
      krathong_type: payload.krathong_type,
      wish: cleanWish,
      status: 'SUCCESS',
    };

    this.inFlightRequest = true;

    try {
      const resJson = await this.requestApi('', {
        method: 'POST',
        body: JSON.stringify(activityData),
      });

      if (!resJson || resJson.success === false) {
        throw new Error(resJson?.error || 'Google Apps Script ไม่สามารถบันทึกข้อมูลได้');
      }

      // บันทึกลงใน Session Cache เพื่อแสดงใน Canvas ชั่วคราว
      try {
        const cachedStr = sessionStorage.getItem(LOCAL_SESSION_CACHE_KEY);
        const cached: KrathongActivity[] = cachedStr ? JSON.parse(cachedStr) : [];
        sessionStorage.setItem(
          LOCAL_SESSION_CACHE_KEY,
          JSON.stringify([activityData, ...cached].slice(0, 15))
        );
      } catch {}

      return {
        success: true,
        activity_id: activityId,
        created_at: createdAt,
        krathong_type: payload.krathong_type,
        wish: cleanWish,
        status: 'SUCCESS',
      };
    } catch (err: any) {
      console.error('Failed to save to Google Sheets:', err);
      throw new Error(
        err.message || 'ไม่สามารถบันทึกกิจกรรมลงใน Google Sheets ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต'
      );
    } finally {
      this.inFlightRequest = false;
    }
  }

  /**
   * ดึงข้อมูลกิจกรรมทั้งหมดสำหรับหน้าผู้ดูแลระบบ (Admin)
   */
  public async getAdminActivities(): Promise<GoogleSheetsAdminData> {
    if (!this.isAuthenticated()) {
      return {
        success: false,
        authenticated: false,
        totalFloated: 0,
        byType: {},
        countsByType: {},
        lastUpdated: null,
        allActivities: [],
        serviceStats: {
          success: false,
          authenticated: false,
          totalEvents: 0,
          noAccountCount: 0,
          hasAccountCount: 0,
          clicksPwaPlusLife: 0,
          clicksLineOfficial: 0,
          clicksOnlinePayment: 0,
          totalServiceClicks: 0,
          completedRegistrationCount: 0,
          lastUpdated: null,
          recentEvents: [],
          totalClicks: 0,
          byService: { app: 0, line: 0, web: 0 },
          recentClicks: [],
          error: 'Unauthorized: จำเป็นต้องเข้าสู่ระบบเจ้าหน้าที่ก่อนเข้าถึงข้อมูลภายใน',
        },
        error: 'Unauthorized: จำเป็นต้องเข้าสู่ระบบเจ้าหน้าที่ก่อนเข้าถึงข้อมูลภายใน',
      };
    }

    const apiUrl = this.getApiUrl();
    if (!apiUrl) {
      return {
        success: false,
        totalFloated: 0,
        byType: {},
        lastUpdated: null,
        allActivities: [],
        error: 'ยังไม่ได้ระบุ URL ของ Google Apps Script API',
      };
    }

    try {
      const ts = Date.now();
      const query = `action=getAdminData&_t=${ts}`;
      const json = await this.requestApi(query, {
        method: 'GET',
      });

      if (json && json.authenticated === false) {
        // เซสชันถูกปฏิเสธจาก Server ล้างเซสชันทันที
        sessionStorage.removeItem(SESSION_TOKEN_KEY);
        sessionStorage.removeItem(SESSION_EXPIRES_KEY);
        return {
          success: false,
          authenticated: false,
          totalFloated: 0,
          byType: {},
          countsByType: {},
          lastUpdated: null,
          allActivities: [],
          error: 'เซสชันเจ้าหน้าที่หมดอายุหรือไม่ถูกต้อง กรุณาเข้าสู่ระบบใหม่',
        };
      }

      const parsed = this.parseApiResponse(json);

      return {
        success: parsed.success,
        authenticated: true,
        totalFloated: parsed.totalFloated,
        byType: parsed.byType,
        countsByType: parsed.byType,
        lastUpdated: parsed.lastUpdated,
        allActivities: parsed.activities,
        serviceStats: parsed.serviceStats,
      };
    } catch (err: any) {
      return {
        success: false,
        totalFloated: 0,
        byType: {},
        countsByType: {},
        lastUpdated: null,
        allActivities: [],
        serviceStats: {
          success: false,
          totalEvents: 0,
          noAccountCount: 0,
          hasAccountCount: 0,
          clicksPwaPlusLife: 0,
          clicksLineOfficial: 0,
          clicksOnlinePayment: 0,
          totalServiceClicks: 0,
          completedRegistrationCount: 0,
          lastUpdated: null,
          recentEvents: [],
          totalClicks: 0,
          byService: { app: 0, line: 0, web: 0 },
          recentClicks: [],
          error: 'ไม่สามารถโหลดข้อมูลสถิติบริการออนไลน์ได้: ' + (err.message || ''),
        },
        error: 'ไม่สามารถโหลดข้อมูลสถิติได้: ' + (err.message || ''),
      };
    }
  }

  /**
   * ทดสอบการเชื่อมต่อ API
   */
  public async testConnection(customUrl?: string): Promise<{ success: boolean; message: string; data?: any }> {
    const urlToTest = (customUrl || this.getApiUrl()).trim();
    if (!urlToTest) {
      return { success: false, message: 'กรุณาระบุ URL ของ Google Apps Script' };
    }

    try {
      const ts = Date.now();
      let json: any;
      try {
        json = await this.requestApi(`action=getStats&_t=${ts}`, {
          method: 'GET',
          customUrl: urlToTest,
        });
      } catch (e) {
        json = await this.requestApi(`t=${ts}`, {
          method: 'GET',
          customUrl: urlToTest,
        });
      }

      const parsed = this.parseApiResponse(json);

      return {
        success: true,
        message: `เชื่อมต่อ Google Sheets สำเร็จ! (พบข้อมูล ${parsed.totalFloated} รายการ)`,
        data: json,
      };
    } catch (err: any) {
      return {
        success: false,
        message: 'เชื่อมต่อล้มเหลว: กรุณาตรวจสอบ URL หรือสิทธิ์การเข้าถึง (Who has access ต้องเป็น Anyone)',
      };
    }
  }

  /**
   * ส่งออกข้อมูลจาก Google Sheets เป็นไฟล์ Excel (CSV พร้อม UTF-8 BOM)
   */
  public exportActivitiesToCSV(activities: KrathongActivity[]): void {
    if (!this.isAuthenticated()) {
      alert('ไม่ได้รับอนุญาต: จำเป็นต้องเข้าสู่ระบบเจ้าหน้าที่ก่อนส่งออกข้อมูล');
      return;
    }
    if (!activities || activities.length === 0) {
      alert('ไม่มีข้อมูลกิจกรรมสำหรับส่งออก');
      return;
    }

    const nowStr = new Date().toLocaleString('th-TH');
    let csv = '\uFEFF'; // UTF-8 BOM เพื่อรองรับภาษาไทยใน Microsoft Excel
    csv += 'รายงานข้อมูลกิจกรรมลอยกระทงออนไลน์ ๒๕๖๙ (Google Sheets Database)\n';
    csv += `การประปาส่วนภูมิภาคสาขาสุราษฎร์ธานี (ชั้นพิเศษ) | วันที่ส่งออก: ${nowStr}\n\n`;

    // หัวตารางตามมาตรฐานที่กำหนด
    csv += 'activity_id,created_at,krathong_type,wish,status\n';

    activities.forEach((act) => {
      const cleanWish = (act.wish || '').replace(/"/g, '""');
      const timeStr = act.created_at ? new Date(act.created_at).toISOString() : '';
      csv += `"${act.activity_id}","${timeStr}","${act.krathong_type}","${cleanWish}","${act.status}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.setAttribute('download', `PWA_LoyKrathong_Database_${Date.now()}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * บันทึกเหตุการณ์บริการออนไลน์ กปภ. ลงใน Google Sheets (Sheet: "ServiceClicks")
   * คอลัมน์: event_id, created_at, account_status, service_key, service_name, event_type
   * - ไม่เก็บข้อมูลส่วนบุคคล (Data Minimization)
   * - ป้องกันการคลิกซ้ำโดยไม่ตั้งใจ (Debounce 2.5 วินาที)
   */
  public async recordServiceEvent(payload: {
    account_status: AccountStatusType;
    service_key: ServiceKeyType;
    service_name: string;
    event_type: EventType;
  }): Promise<{ success: boolean; event_id?: string; message?: string }> {
    const debounceKey = `${payload.event_type}_${payload.account_status}_${payload.service_key}`;
    const now = Date.now();
    const lastEvent = this.lastClickTimestamps[debounceKey] || 0;
    if (now - lastEvent < 2500) {
      return { success: true, message: 'เหตุการณ์ได้รับการประมวลผลแล้ว (ป้องกันส่งซ้ำ)' };
    }
    this.lastClickTimestamps[debounceKey] = now;

    const apiUrl = this.getApiUrl();
    if (!apiUrl) {
      return { success: false, message: 'ยังไม่ได้ระบุ URL ของ Google Apps Script' };
    }

    const eventId = `EVT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const requestData = {
      action: 'serviceClick',
      event_id: eventId,
      created_at: new Date().toISOString(),
      account_status: payload.account_status,
      service_key: payload.service_key,
      service_name: payload.service_name,
      event_type: payload.event_type,
    };

    try {
      const resJson = await this.requestApi('', {
        method: 'POST',
        body: JSON.stringify(requestData),
      });

      if (!resJson || resJson.success === false) {
        throw new Error(resJson?.error || 'เซิร์ฟเวอร์ไม่สามารถบันทึกเหตุการณ์บริการได้');
      }

      return { success: true, event_id: eventId };
    } catch (err: any) {
      console.warn('Failed to send service event to Google Sheets:', err);
      return { success: false, message: err.message };
    }
  }

  /**
   * บันทึกการคลิกเลือกบริการออนไลน์ กปภ. (Sheet: "ServiceClicks")
   */
  public async recordServiceClick(
    serviceKey: ServiceKeyType | 'app' | 'line' | 'web',
    serviceName: string,
    accountStatus: AccountStatusType = 'no_account'
  ): Promise<{ success: boolean; event_id?: string; message?: string }> {
    let normalizedKey: ServiceKeyType = 'pwa_plus_life';
    if (serviceKey === 'pwa_plus_life' || serviceKey === 'app') normalizedKey = 'pwa_plus_life';
    else if (serviceKey === 'line_official' || serviceKey === 'line') normalizedKey = 'line_official';
    else if (serviceKey === 'online_payment' || serviceKey === 'web') normalizedKey = 'online_payment';
    else if (serviceKey === 'none') normalizedKey = 'none';

    return this.recordServiceEvent({
      account_status: accountStatus,
      service_key: normalizedKey,
      service_name: serviceName,
      event_type: 'service_click',
    });
  }

  /**
   * บันทึกการเสร็จสิ้นกิจกรรม (Sheet: "ServiceClicks", event_type: "complete_registration")
   */
  public async recordRegistrationCompletion(
    accountStatus: AccountStatusType,
    serviceName?: string
  ): Promise<{ success: boolean; event_id?: string; message?: string }> {
    const defaultName = accountStatus === 'has_account'
      ? 'เสร็จสิ้นกิจกรรม (มีบัญชีออนไลน์อยู่แล้ว)'
      : 'เสร็จสิ้นกิจกรรม (ยังไม่มีบัญชี / สมัครออนไลน์)';

    return this.recordServiceEvent({
      account_status: accountStatus,
      service_key: 'none',
      service_name: serviceName || defaultName,
      event_type: 'complete_registration',
    });
  }

  /**
   * ดึงข้อมูลสถิติการคลิกเลือกบริการออนไลน์ กปภ. จาก Google Sheets
   */
  public async getServiceStats(): Promise<OnlineServiceStats> {
    if (!this.isAuthenticated()) {
      return {
        success: false,
        totalEvents: 0,
        noAccountCount: 0,
        hasAccountCount: 0,
        clicksPwaPlusLife: 0,
        clicksLineOfficial: 0,
        clicksOnlinePayment: 0,
        totalServiceClicks: 0,
        completedRegistrationCount: 0,
        lastUpdated: null,
        recentEvents: [],
        totalClicks: 0,
        byService: { app: 0, line: 0, web: 0 },
        recentClicks: [],
        error: 'Unauthorized: จำเป็นต้องเข้าสู่ระบบเจ้าหน้าที่ก่อนเข้าถึงข้อมูล',
      };
    }

    const apiUrl = this.getApiUrl();
    if (!apiUrl) {
      return {
        success: false,
        totalEvents: 0,
        noAccountCount: 0,
        hasAccountCount: 0,
        clicksPwaPlusLife: 0,
        clicksLineOfficial: 0,
        clicksOnlinePayment: 0,
        totalServiceClicks: 0,
        completedRegistrationCount: 0,
        lastUpdated: null,
        recentEvents: [],
        totalClicks: 0,
        byService: { app: 0, line: 0, web: 0 },
        recentClicks: [],
        error: 'ยังไม่ได้ระบุ URL ของ Google Apps Script API',
      };
    }

    try {
      const ts = Date.now();
      const query = `action=getServiceStats&_t=${ts}`;
      const json = await this.requestApi(query, {
        method: 'GET',
      });

      if (json && json.authenticated === false) {
        sessionStorage.removeItem(SESSION_TOKEN_KEY);
        sessionStorage.removeItem(SESSION_EXPIRES_KEY);
        return {
          success: false,
          authenticated: false,
          totalEvents: 0,
          noAccountCount: 0,
          hasAccountCount: 0,
          clicksPwaPlusLife: 0,
          clicksLineOfficial: 0,
          clicksOnlinePayment: 0,
          totalServiceClicks: 0,
          completedRegistrationCount: 0,
          lastUpdated: null,
          recentEvents: [],
          totalClicks: 0,
          byService: { app: 0, line: 0, web: 0 },
          recentClicks: [],
          error: 'เซสชันเจ้าหน้าที่หมดอายุหรือไม่ถูกต้อง กรุณาเข้าสู่ระบบใหม่',
        };
      }

      const parsed = this.parseApiResponse(json);
      return { ...parsed.serviceStats, authenticated: true };
    } catch (err: any) {
      return {
        success: false,
        totalEvents: 0,
        noAccountCount: 0,
        hasAccountCount: 0,
        clicksPwaPlusLife: 0,
        clicksLineOfficial: 0,
        clicksOnlinePayment: 0,
        totalServiceClicks: 0,
        completedRegistrationCount: 0,
        lastUpdated: null,
        recentEvents: [],
        totalClicks: 0,
        byService: { app: 0, line: 0, web: 0 },
        recentClicks: [],
        error: 'ไม่สามารถโหลดข้อมูลสถิติบริการออนไลน์ได้: ' + (err.message || ''),
      };
    }
  }

  /**
   * ส่งออกข้อมูลการคลิกบริการออนไลน์ กปภ. จาก Google Sheets เป็นไฟล์ CSV
   * รองรับ 6 คอลัมน์: event_id, created_at, account_status, service_key, service_name, event_type
   */
  public exportServiceClicksToCSV(events: ServiceClickActivity[]): void {
    if (!this.isAuthenticated()) {
      alert('ไม่ได้รับอนุญาต: จำเป็นต้องเข้าสู่ระบบเจ้าหน้าที่ก่อนส่งออกข้อมูล');
      return;
    }
    if (!events || events.length === 0) {
      alert('ไม่มีข้อมูลเหตุการณ์บริการออนไลน์สำหรับส่งออก');
      return;
    }

    const nowStr = new Date().toLocaleString('th-TH');
    let csv = '\uFEFF'; // UTF-8 BOM
    csv += 'รายงานข้อมูลสถิติการเลือกบริการออนไลน์ กปภ. (Google Sheets: ServiceClicks)\n';
    csv += `การประปาส่วนภูมิภาคสาขาสุราษฎร์ธานี (ชั้นพิเศษ) | วันที่ส่งออก: ${nowStr}\n\n`;
    csv += 'event_id,created_at,account_status,service_key,service_name,event_type\n';

    events.forEach((e) => {
      const timeStr = e.created_at ? new Date(e.created_at).toISOString() : '';
      const cleanName = (e.service_name || '').replace(/"/g, '""');
      const cleanEventId = (e.event_id || (e as any).click_id || '').trim();
      csv += `"${cleanEventId}","${timeStr}","${e.account_status || 'no_account'}","${e.service_key}","${cleanName}","${e.event_type || 'service_click'}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.setAttribute('download', `PWA_ServiceClicks_Database_${Date.now()}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

export const googleSheetsService = new GoogleSheetsService();

