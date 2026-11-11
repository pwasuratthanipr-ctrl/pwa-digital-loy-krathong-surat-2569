/**
 * ============================================================================
 * ระบบฐานข้อมูลกิจกรรม ลอยกระทงออนไลน์ ๒๕๖๙ (PWA Digital Loy Krathong 2026)
 * การประปาส่วนภูมิภาคสาขาสุราษฎร์ธานี (ชั้นพิเศษ)
 * Google Apps Script Web App API
 * ============================================================================
 * 
 * ชีตใน Google Sheets (สร้างและจัดหัวตารางให้อัตโนมัติ):
 * 1. Sheet "Activities" (บันทึกการลอยกระทง):
 *    A: activity_id   (รหัสกิจกรรม เช่น LK69-MK5X9B-7A2F)
 *    B: created_at    (วันเวลาที่บันทึก ISO String)
 *    C: krathong_type (ประเภทกระทง 5 สไตล์: pwa_blue, eco_banana, lotus_pink, moonlight_gold, tapi_river)
 *    D: wish          (คำอธิษฐาน)
 *    E: status        (สถานะ เช่น SUCCESS)
 * 
 * 2. Sheet "ServiceClicks" (บันทึกสถิติบริการออนไลน์ กปภ. - ไม่เก็บข้อมูลส่วนบุคคล):
 *    A: event_id        (รหัสเหตุการณ์ เช่น EVT-MK5X9B-7A2F)
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
 * 7. Who has access: Anyone (ทุกคน) **สำคัญมาก เพื่อให้ส่งคำขอจากเว็บได้**
 * 8. กด Deploy และคัดลอก Web App URL (ลงท้ายด้วย /exec)
 *    นำไปใส่ใน src/config/appConfig.ts หรือหน้าผู้ดูแลระบบ (/admin)
 */

const SHEET_ACTIVITIES = 'Activities';
const SHEET_SERVICE_CLICKS = 'ServiceClicks';

const HEADERS_ACTIVITIES = ['activity_id', 'created_at', 'krathong_type', 'wish', 'status'];
const HEADERS_SERVICE_CLICKS = ['event_id', 'created_at', 'account_status', 'service_key', 'service_name', 'event_type'];

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
  var str = String(rawType).trim().toLowerCase().replace(/[-\s]/g, '_');
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
 * Handle GET Requests: ดึงสถิติกิจกรรมลอยกระทง และสถิติบริการออนไลน์
 */
function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) || 'getAdminData';

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

        // นับเฉพาะรายการที่ status = success (case-insensitive) ตามข้อกำหนด
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

    // -------------------------------------------------------------
    // ส่วนที่ 2: ดึงและคำนวณข้อมูลสถิติบริการออนไลน์ (ServiceClicks)
    // -------------------------------------------------------------
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

        // รองรับทั้งคีย์ใหม่ (pwa_plus_life, line_official, online_payment) และคีย์เดิม (app, line, web)
        if (serviceKey === 'app') serviceKey = 'pwa_plus_life';
        if (serviceKey === 'line') serviceKey = 'line_official';
        if (serviceKey === 'web') serviceKey = 'online_payment';

        // เงื่อนไขสำคัญ:
        // 1. นับผู้กดเสร็จสิ้นกิจกรรม และนับผู้เลือกสถานะจากเหตุการณ์ complete_registration เพื่อไม่ให้เกิดการนับซ้ำจากการคลิกบริการ
        if (eventType === 'complete_registration') {
          completedRegistrationCount++;
          if (accountStatus === 'no_account') {
            noAccountCount++;
          } else if (accountStatus === 'has_account') {
            hasAccountCount++;
          }
        } else if (eventType === 'service_click') {
          // 2. นับจำนวนคลิกแยกบริการ 3 ช่องทางจากเหตุการณ์ service_click
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

    // เรียงจากเหตุการณ์ล่าสุดไปเก่าสุด (จำกัด 60 รายการล่าสุด)
    recentEvents.reverse();

    const totalServiceClicks = clicksPwaPlusLife + clicksLineOfficial + clicksOnlinePayment;
    const totalEvents = recentEvents.length;

    const serviceStats = {
      success: true,
      totalEvents: totalEvents,
      noAccountCount: noAccountCount,
      hasAccountCount: hasAccountCount,
      clicksPwaPlusLife: clicksPwaPlusLife,
      clicksLineOfficial: clicksLineOfficial,
      clicksOnlinePayment: clicksOnlinePayment,
      totalServiceClicks: totalServiceClicks,
      completedRegistrationCount: completedRegistrationCount,
      lastUpdated: lastServiceEventTime || new Date().toISOString(),
      recentEvents: recentEvents.slice(0, 60),
      // ข้อมูลสำหรับความเข้ากันได้
      totalClicks: totalServiceClicks,
      byService: {
        app: clicksPwaPlusLife,
        line: clicksLineOfficial,
        web: clicksOnlinePayment,
      },
      recentClicks: recentEvents.slice(0, 60),
    };

    // -------------------------------------------------------------
    // คืนค่าผลลัพธ์ตาม Action ที่ส่งมา
    // -------------------------------------------------------------
    const nowIso = new Date().toISOString();

    // กรณีขอเฉพาะสถิติบริการออนไลน์
    if (action === 'getServiceStats') {
      return createJsonResponse(serviceStats);
    }

    // ส่งข้อมูลครบถ้วนทั้งสองระบบ (Activities + ServiceClicks)
    // สำหรับทุกคำขอ ทั้ง getStats, getAdminData, หรือเปิด URL โดยตรง
    return createJsonResponse({
      success: true,
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
 * Handle POST Requests: บันทึกกิจกรรมลอยกระทง หรือ บันทึกเหตุการณ์บริการออนไลน์
 */
function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000); // ป้องกัน Race Condition
  } catch (e) {
    return createJsonResponse({
      success: false,
      error: 'ระบบกำลังประมวลผลคำขออื่นอยู่ กรุณาลองใหม่อีกครั้งในอีกสักครู่',
    });
  }

  try {
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
    // แบบที่ 1: บันทึกเหตุการณ์บริการออนไลน์ กปภ. (Sheet: ServiceClicks)
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

      // ป้องกันการส่งซ้ำ (Idempotency Check ใน 50 รายการล่าสุด)
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

      // บันทึกแถวใหม่ใน Sheet "ServiceClicks"
      // event_id, created_at, account_status, service_key, service_name, event_type
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
    // แบบที่ 2: บันทึกกิจกรรมการลอยกระทง (Sheet: Activities)
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

    // ตรวจสอบการส่งซ้ำ (Idempotency)
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

    // บันทึกแถวใหม่ใน Sheet "Activities"
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
