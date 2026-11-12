/**
 * ============================================================================
 * ระบบฐานข้อมูลและ API กิจกรรม ลอยกระทงออนไลน์ ๒๕๖๙ (PWA Digital Loy Krathong 2026)
 * การประปาส่วนภูมิภาคสาขาสุราษฎร์ธานี (ชั้นพิเศษ)
 * Google Apps Script Web App API (Enterprise Security Edition)
 * ============================================================================
 * 
 * นโยบายความปลอดภัย (Security Policy):
 * 1. ตรวจสอบสิทธิ์ฝั่ง Server (Server-side Authentication):
 *    - ไม่ส่งรหัสผ่านหรือ Secret กลับไปยังผู้ใช้
 *    - แยก Public API (สำหรับประชาชนทั่วไป) ออกจาก Admin API (สำหรับเจ้าหน้าที่)
 *    - ข้อมูลส่วนตัว เหตุการณ์ ServiceClicks และประวัติกิจกรรมฉบับสมบูรณ์ จะเข้าถึงได้เฉพาะผู้มี Session Token ที่ถูกต้องเท่านั้น
 * 2. การจัดการ Session Token:
 *    - เมื่อยืนยันตัวตนสำเร็จ ระบบจะออก Session Token มีอายุจำกัด 2 ชั่วโมง (7200 วินาที)
 *    - สามารถสั่งออกจากระบบ (Logout) เพื่อเพิกถอน Token ได้ทันที
 * 3. การเปลี่ยนรหัสผ่านเจ้าหน้าที่:
 *    - สามารถเปลี่ยนรหัสผ่านได้ในเมนู Apps Script:
 *      Project Settings (การตั้งค่าโครงการ) > Script Properties (คุณสมบัติของสคริปต์)
 *      เพิ่ม Property ชื่อ: "ADMIN_PIN" และกำหนดรหัสผ่านใหม่
 * 
 * ชีตใน Google Sheets:
 * 1. Sheet "Activities" (บันทึกการลอยกระทง):
 *    A: activity_id   (รหัสกิจกรรม)
 *    B: created_at    (วันเวลาที่บันทึก ISO String)
 *    C: krathong_type (ประเภทกระทง 5 สไตล์: pwa_blue, eco_banana, lotus_pink, moonlight_gold, tapi_river)
 *    D: wish          (คำอธิษฐาน)
 *    E: status        (สถานะ เช่น SUCCESS)
 * 
 * 2. Sheet "ServiceClicks" (บันทึกสถิติบริการออนไลน์ กปภ. - Data Minimization):
 *    A: event_id        (รหัสเหตุการณ์)
 *    B: created_at      (วันเวลาที่บันทึก ISO String)
 *    C: account_status  (สถานะบัญชี: no_account หรือ has_account)
 *    D: service_key     (รหัสบริการ: pwa_plus_life, line_official, online_payment หรือ none)
 *    E: service_name    (ชื่อบริการภาษาไทย)
 *    F: event_type      (ประเภทเหตุการณ์: service_click หรือ complete_registration)
 * 
 * คำแนะนำการ Deploy:
 * 1. เปิด Google Sheets
 * 2. ไปที่ Extensions (ส่วนขยาย) > Apps Script
 * 3. วางโค้ดทั้งหมดนี้ลงในไฟล์ Code.gs
 * 4. กด Deploy (ทำให้ใช้งานได้) > New deployment (การทำให้ใช้งานได้รายการใหม่)
 * 5. เลือกประเภท: Web app (เว็บแอป)
 * 6. Execute as: Me (ฉัน)
 * 7. Who has access: Anyone (ทุกคน)
 * 8. กด Deploy และคัดลอก Web App URL (ลงท้ายด้วย /exec) นำไปใส่ในเว็บไซต์
 */

const SHEET_ACTIVITIES = 'Activities';
const SHEET_SERVICE_CLICKS = 'ServiceClicks';

const HEADERS_ACTIVITIES = ['activity_id', 'created_at', 'krathong_type', 'wish', 'status'];
const HEADERS_SERVICE_CLICKS = ['event_id', 'created_at', 'account_status', 'service_key', 'service_name', 'event_type'];

const SESSION_TTL_SECONDS = 7200; // 2 ชั่วโมง

/**
 * ดึงรหัสผ่านเจ้าหน้าที่จาก Script Properties ฝั่ง Server
 * (ไม่เปิดเผยใน Source Code ฝั่ง Client)
 */
function getAdminSecretPin() {
  try {
    const props = PropertiesService.getScriptProperties();
    const customPin = props.getProperty('ADMIN_PIN');
    if (customPin && customPin.trim()) {
      return customPin.trim();
    }
  } catch (e) {
    // Fallback if properties service is unavailable
  }
  return '1662'; // ค่าเริ่มต้นปลอดภัยฝั่งเซิร์ฟเวอร์ (สามารถเปลี่ยนได้ใน Script Properties)
}

/**
 * สร้างและบันทึก Session Token ฝั่ง Server
 */
function generateSessionToken() {
  const randomPart = Utilities.getUuid().replace(/-/g, '');
  const timePart = Date.now().toString(36);
  return 'AUTH_' + randomPart + '_' + timePart;
}

function registerSessionToken(token) {
  if (!token) return;
  try {
    const cache = CacheService.getScriptCache();
    cache.put(token, 'valid', SESSION_TTL_SECONDS);
  } catch (e) {}

  try {
    const userProps = PropertiesService.getUserProperties();
    userProps.setProperty('SESS_' + token, Date.now().toString());
  } catch (e) {}
}

function verifySessionToken(token) {
  if (!token || typeof token !== 'string') return false;
  const cleanToken = token.trim();
  if (!cleanToken.startsWith('AUTH_')) return false;

  try {
    const cache = CacheService.getScriptCache();
    const status = cache.get(cleanToken);
    if (status === 'valid') {
      return true;
    }
  } catch (e) {}

  try {
    const userProps = PropertiesService.getUserProperties();
    const storedTime = userProps.getProperty('SESS_' + cleanToken);
    if (storedTime) {
      const createdTime = parseInt(storedTime, 10);
      const maxAgeMs = SESSION_TTL_SECONDS * 1000;
      if (Date.now() - createdTime < maxAgeMs) {
        return true;
      } else {
        userProps.deleteProperty('SESS_' + cleanToken);
      }
    }
  } catch (e) {}

  return false;
}

function revokeSessionToken(token) {
  if (!token) return;
  const cleanToken = String(token).trim();
  try {
    const cache = CacheService.getScriptCache();
    cache.remove(cleanToken);
  } catch (e) {}

  try {
    const userProps = PropertiesService.getUserProperties();
    userProps.deleteProperty('SESS_' + cleanToken);
  } catch (e) {}
}

/**
 * ฟังก์ชันสร้างและจัดรูปแบบ Sheet "Activities" อัตโนมัติหากยังไม่มี
 */
function getOrCreateActivitiesSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_ACTIVITIES);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_ACTIVITIES);
    sheet.appendRow(HEADERS_ACTIVITIES);
    const headerRange = sheet.getRange(1, 1, 1, HEADERS_ACTIVITIES.length);
    headerRange.setBackground('#073B66');
    headerRange.setFontColor('#FFFFFF');
    headerRange.setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/**
 * ฟังก์ชันสร้างและจัดรูปแบบ Sheet "ServiceClicks" อัตโนมัติหากยังไม่มี
 */
function getOrCreateServiceClicksSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_SERVICE_CLICKS);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_SERVICE_CLICKS);
    sheet.appendRow(HEADERS_SERVICE_CLICKS);
    const headerRange = sheet.getRange(1, 1, 1, HEADERS_SERVICE_CLICKS.length);
    headerRange.setBackground('#0077B6');
    headerRange.setFontColor('#FFFFFF');
    headerRange.setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/**
 * Helper แปลงผลลัพธ์เป็น JSON Response พร้อม CORS
 */
function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Helper จัดกลุ่มและแปลงประเภทกระทงเป็น 5 รหัสมาตรฐาน (pwa_blue, eco_banana, lotus_pink, moonlight_gold, tapi_river)
 */
function normalizeKrathongType(rawType) {
  if (!rawType) return 'pwa_blue';
  const str = String(rawType).trim().toLowerCase().replace(/[-\s]/g, '_');
  if (str === 'pwa_blue' || str === '1' || str.indexOf('pwa') !== -1 || str.indexOf('blue') !== -1 || str.indexOf('ฟ้า') !== -1) {
    return 'pwa_blue';
  }
  if (str === 'eco_banana' || str === '2' || str.indexOf('eco') !== -1 || str.indexOf('banana') !== -1 || str.indexOf('ตอง') !== -1 || str.indexOf('กล้วย') !== -1 || str.indexOf('รักษ์โลก') !== -1) {
    return 'eco_banana';
  }
  if (str === 'lotus_pink' || str === '3' || str.indexOf('lotus') !== -1 || str.indexOf('pink') !== -1 || str.indexOf('บัว') !== -1 || str.indexOf('ชมพู') !== -1) {
    return 'lotus_pink';
  }
  if (str === 'moonlight_gold' || str === '4' || str.indexOf('moon') !== -1 || str.indexOf('gold') !== -1 || str.indexOf('จันทร์') !== -1 || str.indexOf('ทอง') !== -1) {
    return 'moonlight_gold';
  }
  if (str === 'tapi_river' || str === '5' || str.indexOf('tapi') !== -1 || str.indexOf('river') !== -1 || str.indexOf('ตาปี') !== -1) {
    return 'tapi_river';
  }
  return 'pwa_blue';
}

/**
 * Handle GET Requests:
 * - Public API: getStats (สำหรับประชาชนทั่วไป - ส่งเฉพาะผลรวมและคำอธิษฐานกระทงสาธารณะ)
 * - Admin API: getAdminData, getServiceStats (สำหรับเจ้าหน้าที่เท่านั้น - ต้องมี Token ที่ถูกต้อง)
 */
function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) || 'getStats';
    const authToken = (e && e.parameter && (e.parameter.authToken || e.parameter.token)) || '';

    // -------------------------------------------------------------
    // ส่วนที่ 1: ดึงและคำนวณข้อมูลการลอยกระทง (Activities)
    // -------------------------------------------------------------
    const actSheet = getOrCreateActivitiesSheet();
    const actLastRow = actSheet.getLastRow();

    let total = 0;
    const countsByType = {
      pwa_blue: 0,
      eco_banana: 0,
      lotus_pink: 0,
      moonlight_gold: 0,
      tapi_river: 0,
    };
    const activities = [];

    if (actLastRow > 1) {
      const actData = actSheet.getRange(2, 1, actLastRow - 1, 5).getValues();
      for (let i = 0; i < actData.length; i++) {
        const row = actData[i];
        const activityId = String(row[0] || '').trim();
        const createdAt = row[1] ? new Date(row[1]).toISOString() : new Date().toISOString();
        const krathongType = normalizeKrathongType(row[2]);
        const wish = String(row[3] || '').trim();
        const status = String(row[4] || 'SUCCESS').trim();

        // นับเฉพาะรายการที่ status = success (case-insensitive)
        if (activityId && (status.toLowerCase() === 'success' || status.toLowerCase() === 'completed' || status === '')) {
          total++;
          countsByType[krathongType] = (countsByType[krathongType] || 0) + 1;

          activities.push({
            activity_id: activityId,
            created_at: createdAt,
            krathong_type: krathongType,
            wish: wish,
            status: 'SUCCESS',
          });
        }
      }
    }

    // เรียงจากกิจกรรมล่าสุดไปเก่าสุด
    activities.reverse();
    const recentKrathongs = activities.slice(0, 30);
    const nowIso = new Date().toISOString();

    // -------------------------------------------------------------
    // กรณีที่ 1: Public API สำหรับประชาชนทั่วไป (getStats)
    // คืนเฉพาะสถิติภาพรวมและกระทงที่ลอยในสายน้ำตาปี
    // ห้ามส่งข้อมูลภายใน, ตารางกิจกรรมเต็ม หรือ ServiceClicks
    // -------------------------------------------------------------
    if (action === 'getStats' || !action) {
      return createJsonResponse({
        success: true,
        total: total,
        totalFloated: total,
        countsByType: countsByType,
        byType: countsByType,
        lastUpdated: nowIso,
        recentKrathongs: recentKrathongs,
      });
    }

    // -------------------------------------------------------------
    // กรณีที่ 2: Admin API สำหรับเจ้าหน้าที่ (getAdminData หรือ getServiceStats)
    // ตรวจสอบสิทธิ์ด้วย Session Token ฝั่ง Server อย่างเข้มงวด
    // -------------------------------------------------------------
    const isAuthenticated = verifySessionToken(authToken);

    if (!isAuthenticated) {
      return createJsonResponse({
        success: false,
        authenticated: false,
        error: 'Unauthorized: จำเป็นต้องยืนยันตัวตนเจ้าหน้าที่ก่อนเข้าถึงข้อมูลภายใน',
        total: 0,
        totalFloated: 0,
        countsByType: { pwa_blue: 0, eco_banana: 0, lotus_pink: 0, moonlight_gold: 0, tapi_river: 0 },
        byType: { pwa_blue: 0, eco_banana: 0, lotus_pink: 0, moonlight_gold: 0, tapi_river: 0 },
        activities: [],
        allActivities: [],
        recentKrathongs: [],
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
          error: 'Unauthorized',
        },
      });
    }

    // เมื่อผ่านการยืนยันตัวตนเจ้าหน้าที่: ดึงและคำนวณสถิติบริการออนไลน์ (ServiceClicks)
    const svcSheet = getOrCreateServiceClicksSheet();
    const svcLastRow = svcSheet.getLastRow();

    let noAccountCount = 0;
    let hasAccountCount = 0;
    let clicksPwaPlusLife = 0;
    let clicksLineOfficial = 0;
    let clicksOnlinePayment = 0;
    let completedRegistrationCount = 0;
    const recentEvents = [];
    let lastServiceEventTime = null;

    if (svcLastRow > 1) {
      const numCols = Math.min(svcSheet.getLastColumn(), 6);
      const svcData = svcSheet.getRange(2, 1, svcLastRow - 1, numCols).getValues();

      for (let j = 0; j < svcData.length; j++) {
        const sRow = svcData[j];
        const eventId = String(sRow[0] || '').trim();
        const createdAt = sRow[1] ? new Date(sRow[1]).toISOString() : new Date().toISOString();
        const accountStatus = (String(sRow[2] || 'no_account').trim().toLowerCase() === 'has_account') ? 'has_account' : 'no_account';
        let serviceKey = String(sRow[3] || 'none').trim().toLowerCase();
        const serviceName = String(sRow[4] || '').trim();
        const eventType = (String(sRow[5] || 'service_click').trim().toLowerCase() === 'complete_registration')
          ? 'complete_registration'
          : 'service_click';

        if (serviceKey === 'app') serviceKey = 'pwa_plus_life';
        if (serviceKey === 'line') serviceKey = 'line_official';
        if (serviceKey === 'web') serviceKey = 'online_payment';

        if (eventType === 'complete_registration') {
          completedRegistrationCount++;
          if (accountStatus === 'no_account') {
            noAccountCount++;
          } else if (accountStatus === 'has_account') {
            hasAccountCount++;
          }
        } else if (eventType === 'service_click') {
          if (serviceKey === 'pwa_plus_life') clicksPwaPlusLife++;
          else if (serviceKey === 'line_official') clicksLineOfficial++;
          else if (serviceKey === 'online_payment') clicksOnlinePayment++;
        }

        recentEvents.push({
          event_id: eventId,
          created_at: createdAt,
          account_status: accountStatus,
          service_key: serviceKey,
          service_name: serviceName,
          event_type: eventType,
        });
      }

      if (recentEvents.length > 0) {
        lastServiceEventTime = recentEvents[recentEvents.length - 1].created_at;
      }
    }

    recentEvents.reverse();
    const totalServiceClicks = clicksPwaPlusLife + clicksLineOfficial + clicksOnlinePayment;
    const totalEvents = recentEvents.length;

    const serviceStats = {
      success: true,
      authenticated: true,
      totalEvents: totalEvents,
      noAccountCount: noAccountCount,
      hasAccountCount: hasAccountCount,
      clicksPwaPlusLife: clicksPwaPlusLife,
      clicksLineOfficial: clicksLineOfficial,
      clicksOnlinePayment: clicksOnlinePayment,
      totalServiceClicks: totalServiceClicks,
      completedRegistrationCount: completedRegistrationCount,
      lastUpdated: lastServiceEventTime || nowIso,
      recentEvents: recentEvents.slice(0, 100),
      totalClicks: totalServiceClicks,
      byService: {
        app: clicksPwaPlusLife,
        line: clicksLineOfficial,
        web: clicksOnlinePayment,
      },
      recentClicks: recentEvents.slice(0, 100),
    };

    if (action === 'getServiceStats') {
      return createJsonResponse(serviceStats);
    }

    return createJsonResponse({
      success: true,
      authenticated: true,
      total: total,
      totalFloated: total,
      countsByType: countsByType,
      byType: countsByType,
      lastUpdated: nowIso,
      activities: activities,
      allActivities: activities,
      recentKrathongs: recentKrathongs,
      serviceStats: serviceStats,
    });

  } catch (error) {
    return createJsonResponse({
      success: false,
      total: 0,
      totalFloated: 0,
      countsByType: { pwa_blue: 0, eco_banana: 0, lotus_pink: 0, moonlight_gold: 0, tapi_river: 0 },
      byType: { pwa_blue: 0, eco_banana: 0, lotus_pink: 0, moonlight_gold: 0, tapi_river: 0 },
      activities: [],
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
        error: error.message,
      },
      error: 'เกิดข้อผิดพลาดในการดึงข้อมูลจาก Google Sheets: ' + error.message,
    });
  }
}

/**
 * Handle POST Requests:
 * - action: adminLogin (เข้าสู่ระบบเจ้าหน้าที่ด้วย PIN ฝั่ง Server)
 * - action: adminLogout (ออกจากระบบและทำลาย Token)
 * - action: serviceClick (บันทึกการเลือกบริการออนไลน์)
 * - floatKrathong (บันทึกกิจกรรมการลอยกระทง)
 */
function doPost(e) {
  let payload = {};
  if (e && e.postData && e.postData.contents) {
    try {
      payload = JSON.parse(e.postData.contents);
    } catch (err) {
      payload = e.parameter || {};
    }
  } else if (e && e.parameter) {
    payload = e.parameter;
  }

  // -------------------------------------------------------------
  // ระบบที่ 1: การยืนยันตัวตนเจ้าหน้าที่ (Staff Authentication)
  // -------------------------------------------------------------
  if (payload.action === 'adminLogin') {
    const inputPin = String(payload.pin || '').trim();
    const correctPin = getAdminSecretPin();

    if (inputPin && inputPin === correctPin) {
      const token = generateSessionToken();
      registerSessionToken(token);

      return createJsonResponse({
        success: true,
        authenticated: true,
        authToken: token,
        expiresAt: Date.now() + (SESSION_TTL_SECONDS * 1000),
        message: 'ยืนยันตัวตนเจ้าหน้าที่สำเร็จ',
      });
    } else {
      Utilities.sleep(600); // ป้องกัน Brute-force Timing Attacks
      return createJsonResponse({
        success: false,
        authenticated: false,
        error: 'รหัสผ่านเจ้าหน้าที่ไม่ถูกต้อง กรุณาตรวจสอบและลองใหม่อีกครั้ง',
      });
    }
  }

  // -------------------------------------------------------------
  // ระบบที่ 2: การออกจากระบบเจ้าหน้าที่ (Staff Logout)
  // -------------------------------------------------------------
  if (payload.action === 'adminLogout') {
    const tokenToRevoke = String(payload.authToken || payload.token || '').trim();
    if (tokenToRevoke) {
      revokeSessionToken(tokenToRevoke);
    }
    return createJsonResponse({
      success: true,
      message: 'ออกจากระบบสำเร็จ',
    });
  }

  // สำหรับการเขียนข้อมูลลง Google Sheets: ใช้ LockService ป้องกัน Race Condition
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
  } catch (e) {
    return createJsonResponse({
      success: false,
      error: 'ระบบกำลังประมวลผลคำขออื่นอยู่ กรุณาลองใหม่อีกครั้งในอีกสักครู่',
    });
  }

  try {
    // -------------------------------------------------------------
    // ระบบที่ 3: บันทึกเหตุการณ์บริการออนไลน์ กปภ. (Sheet: ServiceClicks)
    // -------------------------------------------------------------
    if (
      payload.action === 'serviceClick' ||
      payload.account_status ||
      payload.service_key ||
      payload.event_type
    ) {
      const eventId = String(
        payload.event_id ||
        payload.click_id ||
        ('EVT-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase())
      ).trim();
      const createdAt = payload.created_at ? new Date(payload.created_at).toISOString() : new Date().toISOString();
      const accountStatus = (String(payload.account_status || 'no_account').trim() === 'has_account') ? 'has_account' : 'no_account';

      let serviceKey = String(payload.service_key || 'none').trim();
      if (!['pwa_plus_life', 'line_official', 'online_payment', 'none'].includes(serviceKey)) {
        if (serviceKey === 'app') serviceKey = 'pwa_plus_life';
        else if (serviceKey === 'line') serviceKey = 'line_official';
        else if (serviceKey === 'web') serviceKey = 'online_payment';
        else serviceKey = 'none';
      }

      const serviceName = String(payload.service_name || 'บริการออนไลน์ กปภ.').trim();
      const eventType = (String(payload.event_type || 'service_click').trim() === 'complete_registration')
        ? 'complete_registration'
        : 'service_click';

      const svcSheet = getOrCreateServiceClicksSheet();
      const svcLastRow = svcSheet.getLastRow();

      // ป้องกันการส่งซ้ำ (Idempotency Check)
      if (svcLastRow > 1) {
        const checkRange = Math.min(50, svcLastRow - 1);
        const existingIds = svcSheet.getRange(svcLastRow - checkRange + 1, 1, checkRange, 1).getValues();
        for (let k = 0; k < existingIds.length; k++) {
          if (String(existingIds[k][0]).trim() === eventId) {
            return createJsonResponse({
              success: true,
              duplicated: true,
              event_id: eventId,
              message: 'เหตุการณ์นี้ได้รับการบันทึกแล้ว (ป้องกันส่งซ้ำ)',
            });
          }
        }
      }

      svcSheet.appendRow([eventId, createdAt, accountStatus, serviceKey, serviceName, eventType]);

      return createJsonResponse({
        success: true,
        event_id: eventId,
        created_at: createdAt,
        account_status: accountStatus,
        service_key: serviceKey,
        service_name: serviceName,
        event_type: eventType,
        message: 'บันทึกข้อมูลบริการออนไลน์ลงใน Google Sheets สำเร็จ',
      });
    }

    // -------------------------------------------------------------
    // ระบบที่ 4: บันทึกกิจกรรมการลอยกระทง (Sheet: Activities)
    // -------------------------------------------------------------
    const activityId = String(payload.activity_id || '').trim();
    const krathongType = String(payload.krathong_type || '').trim();
    const wish = String(payload.wish || '').trim();
    const status = String(payload.status || 'SUCCESS').trim();
    const createdAt = payload.created_at ? new Date(payload.created_at).toISOString() : new Date().toISOString();

    if (!activityId) {
      return createJsonResponse({ success: false, error: 'ไม่พบรหัสกิจกรรม (activity_id)' });
    }
    if (!krathongType) {
      return createJsonResponse({ success: false, error: 'ไม่พบประเภทกระทง (krathong_type)' });
    }
    if (!wish) {
      return createJsonResponse({ success: false, error: 'กรุณากรอกคำอธิษฐาน (wish)' });
    }

    const actSheet = getOrCreateActivitiesSheet();
    const actLastRow = actSheet.getLastRow();

    // ตรวจสอบการส่งซ้ำ (Idempotency Check)
    if (actLastRow > 1) {
      const existingIds = actSheet.getRange(2, 1, actLastRow - 1, 1).getValues();
      for (let i = 0; i < existingIds.length; i++) {
        if (String(existingIds[i][0]).trim() === activityId) {
          return createJsonResponse({
            success: true,
            duplicated: true,
            activity_id: activityId,
            message: 'กิจกรรมนี้ถูกบันทึกเรียบร้อยแล้ว (ไม่บันทึกซ้ำ)',
          });
        }
      }
    }

    actSheet.appendRow([activityId, createdAt, krathongType, wish, status]);

    return createJsonResponse({
      success: true,
      activity_id: activityId,
      created_at: createdAt,
      message: 'บันทึกกิจกรรมลอยกระทงลงใน Google Sheets สำเร็จ',
    });

  } catch (error) {
    return createJsonResponse({
      success: false,
      error: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' + error.message,
    });
  } finally {
    lock.releaseLock();
  }
}
