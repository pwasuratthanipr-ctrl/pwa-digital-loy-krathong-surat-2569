/**
 * การประปาส่วนภูมิภาคสาขาสุราษฎร์ธานี (ชั้นพิเศษ)
 * PWA Digital Loy Krathong 2026 - Configuration File
 * 
 * ไฟล์ตั้งค่าหลักสำหรับ Static Web Application
 * สามารถแก้ไขข้อมูลองค์กรและช่องทางบริการออนไลน์ได้ที่นี่โดยตรง
 */

export const APP_CONFIG = {
  // -------------------------------------------------------------
  // 1. การตั้งค่าระบบผู้ดูแลระบบ (Admin Dashboard Settings)
  // -------------------------------------------------------------
  ADMIN_SETTINGS: {
    DEFAULT_PIN: '1662', // รหัสผ่านผู้ดูแลระบบ (สายด่วน กปภ. 1662)
    HOTLINE: '1662',
  },

  // -------------------------------------------------------------
  // 2. ข้อมูลกิจกรรมและหน่วยงาน (Identity & Branding)
  // -------------------------------------------------------------
  ORGANIZATION: {
    NAME_TH: 'การประปาส่วนภูมิภาคสาขาสุราษฎร์ธานี (ชั้นพิเศษ)',
    CAMPAIGN_NAME: 'ลอยกระทงออนไลน์ ส่งความสุข ไม่เพิ่มขยะ ประจำปี ๒๕๖๙',
    CAMPAIGN_NAME_EN: 'PWA Digital Loy Krathong 2026',
    YEAR_BE: '๒๕๖๙',
    YEAR_AD: 2026,
    RIVER_NAME: 'แม่น้ำตาปี จังหวัดสุราษฎร์ธานี',
    ADDRESS: 'เลขที่ 86/2 หมู่ที่ 2 ถนนศรีวิชัย ตำบลมะขามเตี้ย อำเภอเมือง จังหวัดสุราษฎร์ธานี 84000',
    CALL_CENTER: '1662 หรือ 077-272-683',
    FACEBOOK_URL: 'https://www.facebook.com/pwa.suratthani?locale=th_TH',
    LOGO_PATH: '/assets/aistudio/logo_PWA_4b69b17d.jpg',
  },

  // -------------------------------------------------------------
  // 3. ช่องทางบริการออนไลน์ทางการของการประปาส่วนภูมิภาค
  // -------------------------------------------------------------
  ONLINE_SERVICES: {
    // 🔔 แอปพลิเคชัน PWA Plus Life
    ANDROID_APP_URL: 'https://play.google.com/store/apps/details?id=th.co.pwa.pwamobile&hl=th&gl=US',
    IOS_APP_URL: 'https://apps.apple.com/th/app/pwa-plus-life/id1479653708?l=th',

    // 💬 LINE Official Account กปภ.
    LINE_OFFICIAL_URL: 'https://page.line.me/pwathailand',

    // 💳 ระบบชำระค่าน้ำประปาออนไลน์ (PWA Payment Portal)
    PAYMENT_PORTAL_URL: 'https://payment.pwa.co.th',
  },
};
