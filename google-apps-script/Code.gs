/**
 * ============================================================================
 * ระบบฐานข้อมูลและ API กิจกรรม ลอยกระทงออนไลน์ ๒๕๖๙ (PWA Digital Loy Krathong 2026)
 * การประปาส่วนภูมิภาคสาขาสุราษฎร์ธานี (ชั้นพิเศษ)
 * Google Apps Script Web App API (Enterprise Security Edition)
 * ============================================================================
 * 
 * นโยบายความปลอดภัย (Security Policy):
 * 1. ตรวจสอบสิทธิ์ฝั่ง Server (Server-side Authentication):
 *    - ไม่มีรหัสผ่านเริ่มต้นแบบ Hardcode ในโค้ด
 *    - จัดเก็บรหัสผ่านในรูปแบบ Salted Stretched SHA-256 Hash ภายใน Script Properties เท่านั้น
 *    - ไม่ส่งรหัสผ่าน, Hash, Salt หรือ Secret กลับไปยังผู้ใช้ และไม่บันทึกลงใน Log
 *    - แยก Public API (สำหรับประชาชนทั่วไป) ออกจาก Admin API (สำหรับเจ้าหน้าที่)
 * 2. การจัดการ Session Token และป้องกัน Brute-force:
 *    - เมื่อยืนยันตัวตนสำเร็จ ระบบจะออก Session Token มีอายุจำกัด 2 ชั่วโมง (7200 วินาที)
 *    - มี Rate Limiting ล็อกชั่วคราว 5 นาที หากกรอกรหัสผ่านผิดติดต่อกัน 5 ครั้ง
 *    - สามารถสั่งออกจากระบบ (Logout) หรือเปลี่ยนรหัสผ่านเพื่อเพิกถอน Token เก่าทั้งหมดได้ทันที
 * 3. การตั้งรหัสผ่านครั้งแรกหรือกรณีลืมรหัสผ่าน (เฉพาะเจ้าของโครงการที่มีสิทธิ์เข้าถึง Google Account):
 *    - วิธีที่ 1: เปิด Google Sheets > เมนู "🔐 ผู้ดูแลระบบ (Admin)" > "ตั้งรหัสผ่านเจ้าหน้าที่ใหม่"
 *    - วิธีที่ 2: ใน Apps Script Editor > Project Settings > Script Properties >
 *      เพิ่ม Property ชื่อ "ADMIN_RESET_PASSWORD" พร้อมรหัสผ่านใหม่ (อย่างน้อย 8 ตัวอักษร)
 *      ระบบจะแปลงเป็น Hash ที่ปลอดภัยและลบ Property ข้อความปกติทิ้งอัตโนมัติทันทีที่เรียกใช้งาน
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
const MAX_FAILED_LOGIN_ATTEMPTS = 5;
const LOGIN_ATTEMPT_WINDOW_MS = 15 * 60 * 1000; // 15 นาที
const LOGIN_LOCKOUT_MS = 5 * 60 * 1000; // ล็อก 5 นาทีเมื่อผิดเกินกำหนด
const HASH_ITERATIONS = 1000;

const PROP_PASSWORD_HASH = 'ADMIN_PASSWORD_HASH';
const PROP_PASSWORD_SALT = 'ADMIN_PASSWORD_SALT';
const PROP_SESSION_EPOCH = 'ADMIN_SESSION_EPOCH';
const PROP_ACTIVE_SESSIONS = 'ADMIN_ACTIVE_SESSIONS';
const PROP_OWNER_RESET_TEMP = 'ADMIN_RESET_PASSWORD';
const PROP_LEGACY_PIN_TEMP = 'ADMIN_PIN';
const PROP_LOGIN_FAIL_STATE = 'ADMIN_LOGIN_FAIL_STATE';

/**
 * เพิ่มเมนูสำหรับเจ้าของ Google Sheets เพื่อตั้งรหัสผ่าน Admin ได้โดยไม่ต้องแก้ไขโค้ด
 */
function onOpen() {
  try {
    SpreadsheetApp.getUi()
      .createMenu('🔐 ผู้ดูแลระบบ (Admin)')
      .addItem('ตั้งรหัสผ่านเจ้าหน้าที่ใหม่', 'promptOwnerSetAdminPassword')
      .addItem('เพิกถอน Session ทั้งหมด', 'ownerRevokeAllSessionsMenu')
      .addToUi();
  } catch (e) {}
}

/**
 * Dialog สำหรับเจ้าของ Sheet ตั้งรหัสผ่านใหม่ (เข้าถึงได้เฉพาะผู้มีสิทธิ์แก้ไข Google Sheet)
 */
function promptOwnerSetAdminPassword() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.prompt(
    'ตั้งค่ารหัสผ่านผู้ดูแลระบบ (/admin)',
    'กรุณากำหนดรหัสผ่านเจ้าหน้าที่ใหม่ (แนะนำอย่างน้อย 8 ตัวอักษร):\n* รหัสผ่านจะถูกแปลงเป็น Salted SHA-256 Hash ฝั่งเซิร์ฟเวอร์ทันที',
    ui.ButtonSet.OK_CANCEL
  );

  if (response.getSelectedButton() !== ui.Button.OK) {
    return;
  }

  const newPassword = String(response.getResponseText() || '').trim();
  if (newPassword.length < 6) {
    ui.alert('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร (แนะนำ 8 ตัวอักษรขึ้นไป)');
    return;
  }

  setAdminPasswordInternal(newPassword);
  ui.alert('บันทึกรหัสผ่านผู้ดูแลระบบใหม่สำเร็จ (จัดเก็บแบบเข้ารหัส Hash และเพิกถอน Session เดิมทั้งหมดแล้ว)');
}

function ownerRevokeAllSessionsMenu() {
  incrementSessionEpoch();
  SpreadsheetApp.getUi().alert('เพิกถอน Session เจ้าหน้าที่ทั้งหมดเรียบร้อยแล้ว');
}

/**
 * ฟังก์ชันสำหรับเจ้าของ Apps Script เรียกตั้งรหัสผ่านจาก Editor (ถ้าต้องการ)
 * หมายเหตุ: ห้ามใส่รหัสผ่านค้างไว้ในโค้ดหลังรันเสร็จ
 */
function setAdminPassword(newPassword) {
  const clean = String(newPassword || '').trim();
  if (clean.length < 6) {
    throw new Error('Password must be at least 6 characters.');
  }
  setAdminPasswordInternal(clean);
  return 'Admin password updated securely.';
}

/**
 * แปลง Byte Array เป็น Hex String
 */
function bytesToHex(bytes) {
  return bytes
    .map(function (b) {
      const v = (b < 0 ? b + 256 : b).toString(16);
      return v.length === 1 ? '0' + v : v;
    })
    .join('');
}

/**
 * คำนวณ Salted Stretched SHA-256 Hash
 */
function computePasswordHash(password, salt) {
  let digestBytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    salt + ':' + password,
    Utilities.Charset.UTF_8
  );
  let hex = bytesToHex(digestBytes);

  for (let i = 0; i < HASH_ITERATIONS; i++) {
    digestBytes = Utilities.computeDigest(
      Utilities.DigestAlgorithm.SHA_256,
      salt + ':' + hex + ':' + password,
      Utilities.Charset.UTF_8
    );
    hex = bytesToHex(digestBytes);
  }
  return hex;
}

/**
 * เปรียบเทียบข้อความแบบ Constant-Time ป้องกัน Timing Attack
 */
function constantTimeEquals(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length || a.length === 0) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

function getSessionEpoch() {
  try {
    const props = PropertiesService.getScriptProperties();
    const raw = props.getProperty(PROP_SESSION_EPOCH);
    const num = parseInt(raw || '1', 10);
    return isNaN(num) || num < 1 ? 1 : num;
  } catch (e) {
    return 1;
  }
}

function incrementSessionEpoch() {
  try {
    const props = PropertiesService.getScriptProperties();
    const nextEpoch = getSessionEpoch() + 1;
    props.setProperty(PROP_SESSION_EPOCH, String(nextEpoch));
    props.deleteProperty(PROP_ACTIVE_SESSIONS);
    return nextEpoch;
  } catch (e) {
    return 1;
  }
}

/**
 * บันทึกรหัสผ่านใหม่แบบ Salted SHA-256 Hash และเพิกถอน Session เดิมทั้งหมด
 */
function setAdminPasswordInternal(plainPassword) {
  const props = PropertiesService.getScriptProperties();
  const salt = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '').substring(0, 16);
  const hash = computePasswordHash(plainPassword, salt);

  props.setProperties({
    [PROP_PASSWORD_SALT]: salt,
    [PROP_PASSWORD_HASH]: hash,
  });

  // ล้าง Property ชั่วคราวที่เป็น Plaintext หากมี
  props.deleteProperty(PROP_OWNER_RESET_TEMP);
  props.deleteProperty(PROP_LEGACY_PIN_TEMP);

  // เพิกถอน Session เก่าทั้งหมดและรีเซ็ตตัวนับการล็อก
  incrementSessionEpoch();
  clearLoginRateLimit();
}

/**
 * ตรวจสอบหากเจ้าของโครงการกำหนดรหัสผ่านใหม่ผ่าน Script Properties (ADMIN_RESET_PASSWORD หรือ ADMIN_PIN)
 * จะทำการ Hash และลบรหัส Plaintext ออกจาก Script Properties ทันที
 */
function syncPendingOwnerPasswordSetup() {
  try {
    const props = PropertiesService.getScriptProperties();
    const pendingReset = props.getProperty(PROP_OWNER_RESET_TEMP);
    const legacyPin = props.getProperty(PROP_LEGACY_PIN_TEMP);
    const candidate = (pendingReset && pendingReset.trim()) || (legacyPin && legacyPin.trim()) || '';

    if (candidate) {
      setAdminPasswordInternal(candidate);
    }
  } catch (e) {}
}

/**
 * ตรวจสอบความถูกต้องของรหัสผ่านฝั่ง Server (ไม่มี Hardcoded Fallback)
 */
function verifyAdminPassword(inputPassword) {
  syncPendingOwnerPasswordSetup();

  try {
    const props = PropertiesService.getScriptProperties();
    const storedHash = props.getProperty(PROP_PASSWORD_HASH);
    const storedSalt = props.getProperty(PROP_PASSWORD_SALT);

    if (!storedHash || !storedSalt) {
      return { valid: false, configured: false };
    }

    const candidateHash = computePasswordHash(inputPassword, storedSalt);
    return {
      valid: constantTimeEquals(candidateHash, storedHash),
      configured: true,
    };
  } catch (e) {
    return { valid: false, configured: false };
  }
}

/**
 * ระบบป้องกัน Brute-force / Rate Limiting ฝั่ง Server
 */
function getLoginFailState() {
  try {
    const cache = CacheService.getScriptCache();
    const cached = cache.get(PROP_LOGIN_FAIL_STATE);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (e) {}

  try {
    const props = PropertiesService.getScriptProperties();
    const raw = props.getProperty(PROP_LOGIN_FAIL_STATE);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {}

  return { count: 0, firstAttemptAt: 0, lockUntil: 0 };
}

function saveLoginFailState(state) {
  const serialized = JSON.stringify(state);
  try {
    const cache = CacheService.getScriptCache();
    cache.put(PROP_LOGIN_FAIL_STATE, serialized, 900);
  } catch (e) {}
  try {
    const props = PropertiesService.getScriptProperties();
    props.setProperty(PROP_LOGIN_FAIL_STATE, serialized);
  } catch (e) {}
}

function checkLoginRateLimit() {
  const now = Date.now();
  const state = getLoginFailState();

  if (state.lockUntil && now < state.lockUntil) {
    const remainingSec = Math.ceil((state.lockUntil - now) / 1000);
    return { allowed: false, retryAfterSeconds: remainingSec };
  }

  if (state.lockUntil && now >= state.lockUntil) {
    clearLoginRateLimit();
  }

  return { allowed: true, retryAfterSeconds: 0 };
}

function recordFailedLoginAttempt() {
  const now = Date.now();
  let state = getLoginFailState();

  if (!state.firstAttemptAt || (now - state.firstAttemptAt) > LOGIN_ATTEMPT_WINDOW_MS) {
    state = { count: 1, firstAttemptAt: now, lockUntil: 0 };
  } else {
    state.count = (state.count || 0) + 1;
    if (state.count >= MAX_FAILED_LOGIN_ATTEMPTS) {
      state.lockUntil = now + LOGIN_LOCKOUT_MS;
    }
  }

  saveLoginFailState(state);
  Utilities.sleep(800); // ชะลอความเร็วในการสุ่มรหัสผ่าน
  return state;
}

function clearLoginRateLimit() {
  try {
    CacheService.getScriptCache().remove(PROP_LOGIN_FAIL_STATE);
  } catch (e) {}
  try {
    PropertiesService.getScriptProperties().deleteProperty(PROP_LOGIN_FAIL_STATE);
  } catch (e) {}
}

/**
 * สร้างและบันทึก Session Token ฝั่ง Server (ผูกกับ Session Epoch และจำกัดอายุ 2 ชั่วโมง)
 */
function generateSessionToken() {
  const part1 = Utilities.getUuid().replace(/-/g, '');
  const part2 = Utilities.getUuid().replace(/-/g, '').substring(0, 16);
  return 'AUTH_' + part1 + '_' + part2;
}

function registerSessionToken(token) {
  if (!token) return;
  const now = Date.now();
  const expiresAt = now + (SESSION_TTL_SECONDS * 1000);
  const epoch = getSessionEpoch();

  try {
    const cache = CacheService.getScriptCache();
    cache.put('SESS_' + token, String(epoch) + ':' + String(expiresAt), SESSION_TTL_SECONDS);
  } catch (e) {}

  try {
    const props = PropertiesService.getScriptProperties();
    const raw = props.getProperty(PROP_ACTIVE_SESSIONS);
    let sessions = raw ? JSON.parse(raw) : {};
    if (!sessions || typeof sessions !== 'object') sessions = {};

    // ล้าง Session ที่หมดอายุหรือคนละ Epoch ออก
    const pruned = {};
    const keys = Object.keys(sessions);
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      const rec = sessions[k];
      if (rec && rec.expiresAt > now && rec.epoch === epoch) {
        pruned[k] = rec;
      }
    }

    pruned[token] = { epoch: epoch, expiresAt: expiresAt };

    // จำกัดจำนวน Session สูงสุดเพื่อไม่ให้ ScriptProperties เกินโควตา
    const prunedKeys = Object.keys(pruned);
    if (prunedKeys.length > 25) {
      prunedKeys.sort(function (a, b) {
        return (pruned[a].expiresAt || 0) - (pruned[b].expiresAt || 0);
      });
      for (let j = 0; j < prunedKeys.length - 25; j++) {
        delete pruned[prunedKeys[j]];
      }
    }

    props.setProperty(PROP_ACTIVE_SESSIONS, JSON.stringify(pruned));
  } catch (e) {}
}

function verifySessionToken(token) {
  if (!token || typeof token !== 'string') return false;
  const cleanToken = token.trim();
  if (!cleanToken.startsWith('AUTH_') || cleanToken.length < 24) return false;

  const now = Date.now();
  const currentEpoch = getSessionEpoch();

  try {
    const cache = CacheService.getScriptCache();
    const cachedVal = cache.get('SESS_' + cleanToken);
    if (cachedVal) {
      const parts = cachedVal.split(':');
      const tokenEpoch = parseInt(parts[0], 10);
      const tokenExpires = parseInt(parts[1], 10);
      if (tokenEpoch === currentEpoch && tokenExpires > now) {
        return true;
      } else {
        cache.remove('SESS_' + cleanToken);
      }
    }
  } catch (e) {}

  try {
    const props = PropertiesService.getScriptProperties();
    const raw = props.getProperty(PROP_ACTIVE_SESSIONS);
    if (raw) {
      const sessions = JSON.parse(raw);
      const rec = sessions && sessions[cleanToken];
      if (rec && rec.epoch === currentEpoch && rec.expiresAt > now) {
        return true;
      }
    }
  } catch (e) {}

  return false;
}

function revokeSessionToken(token) {
  if (!token) return;
  const cleanToken = String(token).trim();
  try {
    CacheService.getScriptCache().remove('SESS_' + cleanToken);
  } catch (e) {}

  try {
    const props = PropertiesService.getScriptProperties();
    const raw = props.getProperty(PROP_ACTIVE_SESSIONS);
    if (raw) {
      const sessions = JSON.parse(raw);
      if (sessions && sessions[cleanToken]) {
        delete sessions[cleanToken];
        props.setProperty(PROP_ACTIVE_SESSIONS, JSON.stringify(sessions));
      }
    }
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
 * - action: adminLogin (เข้าสู่ระบบเจ้าหน้าที่ฝั่ง Server พร้อม Rate Limit)
 * - action: changeAdminPassword (เปลี่ยนรหัสผ่านโดยเจ้าหน้าที่ที่ยืนยันตัวตนแล้ว)
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
    const rateCheck = checkLoginRateLimit();
    if (!rateCheck.allowed) {
      return createJsonResponse({
        success: false,
        authenticated: false,
        rateLimited: true,
        retryAfterSeconds: rateCheck.retryAfterSeconds,
        error: 'มีการพยายามเข้าสู่ระบบไม่ถูกต้องหลายครั้ง กรุณารอ ' + Math.ceil(rateCheck.retryAfterSeconds / 60) + ' นาทีแล้วลองใหม่อีกครั้ง',
      });
    }

    const inputPassword = String(payload.password || payload.pin || '').trim();
    if (!inputPassword) {
      return createJsonResponse({
        success: false,
        authenticated: false,
        error: 'กรุณากรอกรหัสผ่านเจ้าหน้าที่',
      });
    }

    const checkResult = verifyAdminPassword(inputPassword);
    if (!checkResult.configured) {
      return createJsonResponse({
        success: false,
        authenticated: false,
        setupRequired: true,
        error: 'ระบบยังไม่ได้ตั้งค่ารหัสผ่านผู้ดูแลระบบ กรุณาให้เจ้าของโครงการกำหนดรหัสผ่านฝั่งเซิร์ฟเวอร์ก่อนเข้าใช้งาน',
      });
    }

    if (checkResult.valid) {
      clearLoginRateLimit();
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
      const failState = recordFailedLoginAttempt();
      const remainingAttempts = Math.max(0, MAX_FAILED_LOGIN_ATTEMPTS - (failState.count || 0));
      return createJsonResponse({
        success: false,
        authenticated: false,
        rateLimited: remainingAttempts === 0,
        error: remainingAttempts === 0
          ? 'กรอกรหัสผ่านไม่ถูกต้องเกินจำนวนที่กำหนด ระบบระงับการเข้าสู่ระบบชั่วคราว 5 นาที'
          : 'รหัสผ่านเจ้าหน้าที่ไม่ถูกต้อง กรุณาตรวจสอบและลองใหม่อีกครั้ง',
      });
    }
  }

  // -------------------------------------------------------------
  // ระบบที่ 1.5: เปลี่ยนรหัสผ่านโดยเจ้าหน้าที่ที่ยืนยันตัวตนแล้ว
  // -------------------------------------------------------------
  if (payload.action === 'changeAdminPassword') {
    const authToken = String(payload.authToken || payload.token || '').trim();
    if (!verifySessionToken(authToken)) {
      return createJsonResponse({
        success: false,
        authenticated: false,
        error: 'เซสชันเจ้าหน้าที่หมดอายุหรือไม่ถูกต้อง กรุณาเข้าสู่ระบบใหม่',
      });
    }

    const currentPassword = String(payload.currentPassword || '').trim();
    const newPassword = String(payload.newPassword || '').trim();

    if (!currentPassword || !newPassword) {
      return createJsonResponse({
        success: false,
        error: 'กรุณากรอกรหัสผ่านปัจจุบันและรหัสผ่านใหม่ให้ครบถ้วน',
      });
    }

    if (newPassword.length < 8 || newPassword.length > 128) {
      return createJsonResponse({
        success: false,
        error: 'รหัสผ่านใหม่ต้องมีความยาว 8 - 128 ตัวอักษร',
      });
    }

    if (currentPassword === newPassword) {
      return createJsonResponse({
        success: false,
        error: 'รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสผ่านปัจจุบัน',
      });
    }

    const verifyCurrent = verifyAdminPassword(currentPassword);
    if (!verifyCurrent.configured || !verifyCurrent.valid) {
      Utilities.sleep(600);
      return createJsonResponse({
        success: false,
        error: 'รหัสผ่านปัจจุบันไม่ถูกต้อง',
      });
    }

    setAdminPasswordInternal(newPassword);
    const newToken = generateSessionToken();
    registerSessionToken(newToken);

    return createJsonResponse({
      success: true,
      authenticated: true,
      authToken: newToken,
      expiresAt: Date.now() + (SESSION_TTL_SECONDS * 1000),
      message: 'เปลี่ยนรหัสผ่านเจ้าหน้าที่เรียบร้อยแล้ว (Session เดิมทั้งหมดถูกเพิกถอน)',
    });
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
