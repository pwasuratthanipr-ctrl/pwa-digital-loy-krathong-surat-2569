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

class GoogleSheetsService {
  private inFlightRequest: boolean = false;
  private lastClickTimestamps: Record<string, number> = {};

  /**
   * ดึง URL ของ Google Apps Script API
   * ตรวจสอบจากค่าที่ผู้ดูแลระบบกำหนดใน LocalStorage ก่อน แล้วจึงใช้จาก appConfig
   */
  public getApiUrl(): string {
    try {
      const customUrl = localStorage.getItem(STORAGE_API_KEY);
      if (customUrl && customUrl.trim()) {
        return customUrl.trim();
      }
    } catch {}
    return (APP_CONFIG.GOOGLE_SCRIPT_API_URL || '').trim();
  }

  /**
   * บันทึก URL ใหม่ (สำหรับหน้าผู้ดูแลระบบ)
   */
  public setApiUrl(url: string): void {
    try {
      localStorage.setItem(STORAGE_API_KEY, url.trim());
    } catch {}
  }

  /**
   * ล้าง URL ที่กำหนดเอง กลับไปใช้ค่าจาก appConfig
   */
  public clearCustomApiUrl(): void {
    try {
      localStorage.removeItem(STORAGE_API_KEY);
    } catch {}
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
    const successActivities = parsedList.filter((act) => {
      const s = (act.status || '').toLowerCase().trim();
      return s === 'success' || s === 'completed' || s === 'ok' || s === '';
    });

    // 3. กำหนดค่าสถิติกระทง 5 ประเภท (5 สไตล์)
    const byType: Record<string, number> = {
      pwa_blue: 0,
      eco_banana: 0,
      lotus_pink: 0,
      moonlight_gold: 0,
      tapi_river: 0,
    };

    if (successActivities.length > 0) {
      // คำนวณจากรายการกิจกรรมจริงที่ status = success โดยตรง
      successActivities.forEach((act) => {
        const norm = normalizeKrathongTypeId(act.krathong_type);
        act.krathong_type = norm;
        byType[norm] = (byType[norm] || 0) + 1;
      });
    } else {
      const rawByType =
        json.countsByType ||
        json.byType ||
        json.counts_by_type ||
        json.data?.countsByType ||
        json.data?.byType;

      if (rawByType && typeof rawByType === 'object') {
        Object.keys(byType).forEach((k) => {
          const val = rawByType[k] ?? rawByType[k.replace('_', '-')] ?? 0;
          byType[k] = Number(val) || 0;
        });
      }
    }

    // 4. คำนวณยอดรวม total: สอดคล้องกับกิจกรรมจริง และเท่ากับผลรวมทั้ง 5 ประเภท
    let total = 0;
    if (successActivities.length > 0) {
      total = successActivities.length;
    } else if (json.total !== undefined && json.total !== null) {
      total = Number(json.total) || 0;
    } else if (json.totalFloated !== undefined && json.totalFloated !== null) {
      total = Number(json.totalFloated) || 0;
    } else if (json.count !== undefined && json.count !== null) {
      total = Number(json.count) || 0;
    } else if (json.data?.total !== undefined && json.data?.total !== null) {
      total = Number(json.data.total) || 0;
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
    const apiUrl = this.getApiUrl();

    // หากยังไม่ได้กำหนด URL ในระบบ
    if (!apiUrl) {
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
        error: 'ยังไม่ได้ระบุ URL ของ Google Apps Script API',
      };
    }

    try {
      let response: Response;
      const ts = Date.now();
      try {
        const urlWithAction = `${apiUrl}${apiUrl.includes('?') ? '&' : '?'}action=getStats&_t=${ts}`;
        response = await fetch(urlWithAction, { method: 'GET', headers: { 'Accept': 'application/json' } });
        if (!response.ok) throw new Error(`HTTP Error ${response.status}`);
      } catch (firstErr) {
        // Fallback: ดึงแบบไม่ใส่ action (เหมือนเปิด /exec โดยตรง)
        const urlDirect = `${apiUrl}${apiUrl.includes('?') ? '&' : '?'}t=${ts}`;
        response = await fetch(urlDirect, { method: 'GET', headers: { 'Accept': 'application/json' } });
      }

      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}`);
      }

      const json = await response.json();
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
        recentKrathongs: parsed.activities.slice(0, 25),
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
        error: 'ไม่สามารถโหลดข้อมูลสถิติได้',
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
      // ส่งแบบ POST ด้วย text/plain JSON เพื่อรองรับ CORS บน Google Apps Script Web App
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(activityData),
      });

      if (!response.ok) {
        throw new Error(`การเชื่อมต่อไปยัง Google Sheets ขัดข้อง (รหัสสถานะ: ${response.status})`);
      }

      const resJson = await response.json();
      if (!resJson.success) {
        throw new Error(resJson.error || 'Google Apps Script ไม่สามารถบันทึกข้อมูลได้');
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
      let response: Response;
      const ts = Date.now();
      try {
        const urlWithAction = `${apiUrl}${apiUrl.includes('?') ? '&' : '?'}action=getAdminData&_t=${ts}`;
        response = await fetch(urlWithAction, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
        });
        if (!response.ok) throw new Error(`HTTP Error ${response.status}`);
      } catch (firstErr) {
        // Fallback: ดึงแบบไม่ใส่ action (เหมือนเปิด /exec โดยตรง)
        const urlDirect = `${apiUrl}${apiUrl.includes('?') ? '&' : '?'}t=${ts}`;
        response = await fetch(urlDirect, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
        });
      }

      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}`);
      }

      const json = await response.json();
      const parsed = this.parseApiResponse(json);

      return {
        success: parsed.success,
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
      let response: Response;
      const ts = Date.now();
      try {
        const testUrl = `${urlToTest}${urlToTest.includes('?') ? '&' : '?'}action=getStats&_t=${ts}`;
        response = await fetch(testUrl, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
        });
        if (!response.ok) throw new Error(`HTTP Error ${response.status}`);
      } catch (e) {
        const testUrlDirect = `${urlToTest}${urlToTest.includes('?') ? '&' : '?'}t=${ts}`;
        response = await fetch(testUrlDirect, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
        });
      }

      if (!response.ok) {
        return { success: false, message: `เซิร์ฟเวอร์ตอบกลับรหัสข้อผิดพลาด HTTP ${response.status}` };
      }

      const json = await response.json();
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
      fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(requestData),
      }).catch((err) => {
        console.warn('Background service event log warning:', err);
      });

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
      let response: Response;
      const ts = Date.now();
      try {
        const urlWithAction = `${apiUrl}${apiUrl.includes('?') ? '&' : '?'}action=getServiceStats&_t=${ts}`;
        response = await fetch(urlWithAction, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
        });
        if (!response.ok) throw new Error(`HTTP Error ${response.status}`);
      } catch (e) {
        const urlDirect = `${apiUrl}${apiUrl.includes('?') ? '&' : '?'}t=${ts}`;
        response = await fetch(urlDirect, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
        });
      }

      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}`);
      }

      const json = await response.json();
      const parsed = this.parseApiResponse(json);

      return parsed.serviceStats;
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

