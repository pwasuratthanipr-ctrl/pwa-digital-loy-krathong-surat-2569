import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import * as XLSX from 'xlsx';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// In-Memory Database store with Demo data and Production separation
let isDemoMode = true;

// Helper: Sanitize string to prevent XSS and Excel Formula Injection
function sanitizeText(input: string | undefined): string {
  if (!input) return '';
  // Strip HTML tags
  let cleaned = input.replace(/<[^>]*>?/gm, '').trim();
  // Escape Excel formula triggers: =, +, -, @, tab, CR
  if (/^[=+\-@\t\r]/.test(cleaned)) {
    cleaned = `'${cleaned}`;
  }
  return cleaned;
}

// Data Store
let counter = 100;
function getNextParticipantCode(): string {
  counter += 1;
  const numStr = String(counter).padStart(6, '0');
  return `LK69-${numStr}`;
}

let campaignSettings = {
  id: 'cfg-001',
  campaign_name: 'ลอยกระทงออนไลน์ ส่งความสุข ไม่เพิ่มขยะ 2569',
  organization_name: 'การประปาส่วนภูมิภาคสาขาสุราษฎร์ธานี (ชั้นพิเศษ)',
  start_date: '2026-11-20T00:00:00.000+07:00',
  end_date: '2026-11-28T23:59:59.000+07:00',
  target_participants: 200,
  target_new_registrations: 50,
  target_conversion_rate: 25.0,
  official_pwa_app_url: 'https://www.pwa.co.th/contents/service/pwalife',
  official_line_url: 'https://page.line.me/pwathailand',
  official_payment_url: 'https://payment.pwa.co.th',
  active_status: true,
};

// Admin profiles
const adminProfiles = [
  {
    id: 'usr-admin-1',
    token: 'token-admin-69',
    username: 'admin',
    password: 'password123',
    display_name: 'นายอดิศร วิจิตรศิลป์ (ผู้ดูแลระบบ)',
    department: 'งานเทคโนโลยีสารสนเทศ กปภ.สาขาสุราษฎร์ธานี (ชั้นพิเศษ)',
    role: 'ADMIN',
    active_status: true,
  },
  {
    id: 'usr-staff-1',
    token: 'token-staff-69',
    username: 'staff01',
    password: 'password123',
    display_name: 'น.ส.กานดา สุวรรณรัตน์ (เจ้าหน้าที่บริการลูกค้า)',
    department: 'งานบริการลูกค้าและประเมินผล กปภ.สาขาสุราษฎร์ธานี (ชั้นพิเศษ)',
    role: 'STAFF',
    active_status: true,
  },
  {
    id: 'usr-viewer-1',
    token: 'token-viewer-69',
    username: 'executive',
    password: 'password123',
    display_name: 'ผู้จัดการ กปภ.สาขาสุราษฎร์ธานี (ชั้นพิเศษ)',
    department: 'ฝ่ายบริหาร กปภ.สาขาสุราษฎร์ธานี (ชั้นพิเศษ)',
    role: 'VIEWER',
    active_status: true,
  },
];

// Gifts
let gifts = [
  {
    id: 'gift-01',
    gift_name: 'กระบอกน้ำรักษ์โลก กปภ. (PWA Eco Tumbler)',
    description: 'กระบอกน้ำสแตนเลสเก็บอุณหภูมิ ลายเอกลักษณ์ กปภ. และสายน้ำตาปี',
    initial_quantity: 60,
    remaining_quantity: 36,
    alert_threshold: 15,
    eligible_group: 'NEW_VERIFIED', // สมัครใหม่สำเร็จ
    active_status: true,
    created_at: '2026-11-20T08:00:00.000Z',
  },
  {
    id: 'gift-02',
    gift_name: 'กระเป๋าผ้าแคนวาส กปภ. รักษ์สิ่งแวดล้อม',
    description: 'กระเป๋าผ้าแคนวาสหนาพิเศษ ลายลอยกระทงออนไลน์ ไม่เพิ่มขยะ',
    initial_quantity: 100,
    remaining_quantity: 72,
    alert_threshold: 20,
    eligible_group: 'EXISTING_USER', // มีบัญชีอยู่แล้ว หรือสมัครใหม่
    active_status: true,
    created_at: '2026-11-20T08:00:00.000Z',
  },
  {
    id: 'gift-03',
    gift_name: 'ร่มพับยูวีพรีเมียม กปภ. ฟ้าสดใส',
    description: 'ร่มพับ 3 ตอน เคลือบกันรังสียูวี พกพาสะดวก',
    initial_quantity: 50,
    remaining_quantity: 28,
    alert_threshold: 10,
    eligible_group: 'NEW_VERIFIED',
    active_status: true,
    created_at: '2026-11-20T08:00:00.000Z',
  },
];

let giftRedemptions: Array<{
  id: string;
  gift_id: string;
  gift_name: string;
  participant_id: string;
  participant_code: string;
  redeemed_by: string;
  redeemed_by_name: string;
  redeemed_at: string;
}> = [];

// Seed Participants and Registrations
let participants: Array<{
  id: string;
  participant_code: string;
  source_channel: string;
  participation_status: 'COMPLETED' | 'STARTED';
  created_at: string;
  completed_at: string;
}> = [];

let krathongEvents: Array<{
  id: string;
  participant_id: string;
  participant_code: string;
  krathong_type: string;
  nickname: string;
  wish_text: string;
  share_consent: boolean;
  floated_at: string;
  water_coordinates_x: number;
  water_coordinates_y: number;
}> = [];

let onlineRegistrations: Array<{
  id: string;
  participant_id: string;
  participant_code: string;
  service_type: string;
  customer_status: 'NEW_SUCCESS' | 'EXISTING_USER' | 'IN_PROGRESS' | 'NOT_INTERESTED' | 'REGISTRATION_FAILED';
  verification_status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  verified_by?: string;
  verified_by_name?: string;
  notes?: string;
  created_at: string;
  verified_at?: string;
  updated_at: string;
}> = [];

let auditLogs: Array<{
  id: string;
  actor_name: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  safe_metadata?: Record<string, unknown>;
  created_at: string;
}> = [];

// Populate realistic initial data for Surat Thani PWA
function initializeSeedData() {
  const seedDates = [
    '2026-11-20',
    '2026-11-21',
    '2026-11-22',
    '2026-11-23',
    '2026-11-24',
    '2026-11-25',
  ];
  const krathongTypes = ['pwa_blue', 'eco_banana', 'lotus_pink', 'moonlight_gold', 'tapi_river'];
  const sampleWishes = [
    'ขอให้ครอบครัวมีความสุข สุขภาพแข็งแรง สายน้ำตาปีสะอาดตลอดไป',
    'ขอให้การงานราบรื่น ค่าน้ำประปาสะดวก จ่ายง่ายผ่านแอป',
    'ขอขอบคุณ กปภ. สุราษฎร์ธานี ที่จัดกิจกรรมดีๆ ไม่เพิ่มขยะให้แม่น้ำ',
    'ขอให้มีแต่สิ่งดีๆ เข้ามาในชีวิตและบ้านเมืองสงบสุข',
    'ขอให้ปี 2569 เป็นปีแห่งความมั่งคั่งและสุขภาพดี',
    'ช่วยอนุรักษ์แม่น้ำตาปี ลอยออนไลน์ไม่สร้างขยะโฟม',
  ];
  const sampleNames = ['คุณสมชาย', 'น้องแก้ว', 'พี่วิชัย', 'ป้ามาลี', 'คุณอนันต์', 'สุพัตรา', 'ภานุพงศ์', 'วิภาดา'];

  let pCount = 100;
  // Seed 42 participants across the days
  for (let d = 0; d < seedDates.length; d++) {
    const day = seedDates[d];
    const itemsToday = 7;
    for (let i = 0; i < itemsToday; i++) {
      pCount++;
      const pCode = `LK69-${String(pCount).padStart(6, '0')}`;
      const pid = `p-${pCount}`;
      const timeStr = `${day}T${String(10 + i).padStart(2, '0')}:24:00.000+07:00`;
      
      participants.push({
        id: pid,
        participant_code: pCode,
        source_channel: i % 3 === 0 ? 'QR_ONSITE' : i % 3 === 1 ? 'LINE' : 'WEB_DIRECT',
        participation_status: 'COMPLETED',
        created_at: timeStr,
        completed_at: timeStr,
      });

      krathongEvents.push({
        id: `ke-${pCount}`,
        participant_id: pid,
        participant_code: pCode,
        krathong_type: krathongTypes[(i + d) % krathongTypes.length],
        nickname: sampleNames[(i + d) % sampleNames.length],
        wish_text: sampleWishes[(i + d) % sampleWishes.length],
        share_consent: true,
        floated_at: timeStr,
        water_coordinates_x: 20 + ((i * 11) % 60),
        water_coordinates_y: 40 + ((d * 7) % 35),
      });

      // Every few participants, staff records an online registration status
      if (i % 2 === 0) {
        const isNew = i === 0 || i === 4;
        const status = isNew ? 'NEW_SUCCESS' : i === 2 ? 'EXISTING_USER' : 'IN_PROGRESS';
        const vStatus = isNew ? 'VERIFIED' : 'PENDING';
        onlineRegistrations.push({
          id: `reg-${pCount}`,
          participant_id: pid,
          participant_code: pCode,
          service_type: 'PWA_PLUS_LIFE',
          customer_status: status as any,
          verification_status: vStatus as any,
          verified_by: isNew ? 'usr-staff-1' : undefined,
          verified_by_name: isNew ? 'น.ส.กานดา สุวรรณรัตน์' : undefined,
          notes: isNew ? 'สมัครแอป PWA Plus Life ณ บูธกิจกรรม กปภ.สาขาสุราษฎร์ธานี ตรวจสอบแล้ว' : 'ลูกค้าใช้งาน Line PWA เดิมอยู่แล้ว',
          created_at: timeStr,
          verified_at: isNew ? timeStr : undefined,
          updated_at: timeStr,
        });
      }
    }
  }

  counter = pCount;
  
  auditLogs.push({
    id: 'log-init',
    actor_name: 'ระบบเซิร์ฟเวอร์',
    action: 'SYSTEM_BOOT',
    entity_type: 'CAMPAIGN',
    entity_id: 'cfg-001',
    safe_metadata: { message: 'ระบบเริ่มต้นพร้อมข้อมูลจำลองสำหรับทดสอบ (DEMO MODE)' },
    created_at: new Date().toISOString(),
  });
}

initializeSeedData();

// Auth Middleware
function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'ไม่พบสิทธิ์การเข้าใช้งาน กรุณาเข้าสู่ระบบ' });
    return;
  }

  const user = adminProfiles.find(u => u.token === token && u.active_status);
  if (!user) {
    res.status(403).json({ error: 'Token ไม่ถูกต้องหรือหมดอายุ' });
    return;
  }

  (req as any).user = user;
  next();
}

function requireRole(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user || !allowedRoles.includes(user.role)) {
      res.status(403).json({ error: 'คุณไม่มีสิทธิ์ในการดำเนินการนี้ (จำกัดเฉพาะสิทธิ์: ' + allowedRoles.join(', ') + ')' });
      return;
    }
    next();
  };
}

// -------------------------------------------------------------
// PUBLIC API ENDPOINTS
// -------------------------------------------------------------

// 1. Health check & Mode
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    mode: isDemoMode ? 'DEMO' : 'PRODUCTION',
    campaignName: campaignSettings.campaign_name,
    timestamp: new Date().toISOString(),
  });
});

// 2. Public Campaign Statistics
app.get('/api/campaign/public-stats', (req, res) => {
  res.json({
    totalFloatedKrathongs: krathongEvents.length,
    uniqueParticipants: participants.length,
    campaignStartDate: campaignSettings.start_date,
    campaignEndDate: campaignSettings.end_date,
    organizationName: campaignSettings.organization_name,
    campaignName: campaignSettings.campaign_name,
    isLive: campaignSettings.active_status,
    mode: isDemoMode ? 'DEMO' : 'PRODUCTION',
  });
});

// 3. Public Recent Floating Krathongs (for live river animation)
app.get('/api/krathong/recent', (req, res) => {
  const shared = krathongEvents
    .filter(k => k.share_consent)
    .slice(-25)
    .map(k => ({
      id: k.id,
      nickname: k.nickname || 'ผู้ร่วมอนุรักษ์สายน้ำ',
      krathong_type: k.krathong_type,
      wish_text: k.wish_text,
      floated_at: k.floated_at,
      water_coordinates_x: k.water_coordinates_x,
      water_coordinates_y: k.water_coordinates_y,
    }));
  res.json({ items: shared });
});

// 4. Submit Krathong & Floating Event
app.post('/api/krathong/float', (req, res) => {
  try {
    const { krathong_type, nickname, wish_text, share_consent, source_channel } = req.body;

    if (!krathong_type || !wish_text) {
      res.status(400).json({ error: 'กรุณาเลือกกระทงและระบุคำอธิษฐาน' });
      return;
    }

    const cleanWish = sanitizeText(wish_text);
    if (cleanWish.length > 200) {
      res.status(400).json({ error: 'คำอธิษฐานต้องไม่เกิน 200 ตัวอักษร' });
      return;
    }

    const cleanNickname = sanitizeText(nickname) || 'ผู้ร่วมกิจกรรม กปภ.';
    const participantCode = getNextParticipantCode();
    const nowIso = new Date().toISOString();
    const pid = `p-${Date.now()}`;

    // Create participant
    participants.push({
      id: pid,
      participant_code: participantCode,
      source_channel: source_channel || 'WEB_DIRECT',
      participation_status: 'COMPLETED',
      created_at: nowIso,
      completed_at: nowIso,
    });

    // Create krathong event
    const event = {
      id: `ke-${Date.now()}`,
      participant_id: pid,
      participant_code: participantCode,
      krathong_type,
      nickname: cleanNickname,
      wish_text: cleanWish,
      share_consent: Boolean(share_consent),
      floated_at: nowIso,
      water_coordinates_x: Math.floor(Math.random() * 60) + 20,
      water_coordinates_y: Math.floor(Math.random() * 40) + 35,
    };
    krathongEvents.push(event);

    res.json({
      success: true,
      participantCode,
      participantId: pid,
      floatedAt: nowIso,
      krathong: event,
      message: 'ลอยกระทงออนไลน์สำเร็จ ขอบคุณที่ร่วมรักษาสายน้ำตาปีกับ กปภ.สาขาสุราษฎร์ธานี',
    });
  } catch (err: any) {
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' + err.message });
  }
});

// -------------------------------------------------------------
// AUTH & ADMIN APIS
// -------------------------------------------------------------

// Login
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน' });
    return;
  }

  const user = adminProfiles.find(u => u.username === username && u.password === password);
  if (!user || !user.active_status) {
    res.status(401).json({ error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
    return;
  }

  // Audit log
  auditLogs.push({
    id: `log-${Date.now()}`,
    actor_name: user.display_name,
    action: 'LOGIN',
    entity_type: 'USER',
    entity_id: user.id,
    safe_metadata: { role: user.role, username: user.username },
    created_at: new Date().toISOString(),
  });

  res.json({
    token: user.token,
    user: {
      id: user.id,
      username: user.username,
      display_name: user.display_name,
      department: user.department,
      role: user.role,
    },
  });
});

// Current User info
app.get('/api/auth/me', authenticateToken, (req, res) => {
  const user = (req as any).user;
  res.json({
    user: {
      id: user.id,
      username: user.username,
      display_name: user.display_name,
      department: user.department,
      role: user.role,
    },
  });
});

// Admin Dashboard KPI & Analytics
app.get('/api/admin/dashboard', authenticateToken, (req, res) => {
  const totalParticipants = participants.length;
  const totalFloatedKrathongs = krathongEvents.length;
  const totalInterestedRegistrations = onlineRegistrations.length;
  
  // Specific condition: Verified New Registrations
  const verifiedNewRegistrations = onlineRegistrations.filter(
    r => r.customer_status === 'NEW_SUCCESS' && r.verification_status === 'VERIFIED'
  ).length;

  const existingUsers = onlineRegistrations.filter(r => r.customer_status === 'EXISTING_USER').length;
  const failedRegistrations = onlineRegistrations.filter(
    r => r.customer_status === 'REGISTRATION_FAILED' || r.verification_status === 'REJECTED'
  ).length;

  // Conversion Rate = (verified new registrations / unique participants) * 100
  const conversionRate = totalParticipants > 0 
    ? Number(((verifiedNewRegistrations / totalParticipants) * 100).toFixed(2)) 
    : 0;

  const totalGiftsRedeemed = giftRedemptions.length;
  const totalGiftsRemaining = gifts.reduce((acc, g) => acc + g.remaining_quantity, 0);

  // Group daily stats
  const dateMap = new Map<string, { participants: number; newRegistrations: number; existingUsers: number; giftsRedeemed: number }>();
  
  participants.forEach(p => {
    const d = p.created_at.slice(0, 10);
    const curr = dateMap.get(d) || { participants: 0, newRegistrations: 0, existingUsers: 0, giftsRedeemed: 0 };
    curr.participants += 1;
    dateMap.set(d, curr);
  });

  onlineRegistrations.forEach(r => {
    const d = r.created_at.slice(0, 10);
    const curr = dateMap.get(d) || { participants: 0, newRegistrations: 0, existingUsers: 0, giftsRedeemed: 0 };
    if (r.customer_status === 'NEW_SUCCESS' && r.verification_status === 'VERIFIED') {
      curr.newRegistrations += 1;
    } else if (r.customer_status === 'EXISTING_USER') {
      curr.existingUsers += 1;
    }
    dateMap.set(d, curr);
  });

  giftRedemptions.forEach(gr => {
    const d = gr.redeemed_at.slice(0, 10);
    const curr = dateMap.get(d) || { participants: 0, newRegistrations: 0, existingUsers: 0, giftsRedeemed: 0 };
    curr.giftsRedeemed += 1;
    dateMap.set(d, curr);
  });

  const sortedDates = Array.from(dateMap.keys()).sort();
  let cumulative = 0;
  const dailyStats = sortedDates.map(date => {
    const val = dateMap.get(date)!;
    cumulative += val.newRegistrations;
    return {
      date,
      participants: val.participants,
      newRegistrations: val.newRegistrations,
      existingUsers: val.existingUsers,
      cumulativeRegistrations: cumulative,
      giftsRedeemed: val.giftsRedeemed,
    };
  });

  // Customer status breakdown
  const statusCounts = {
    NEW_SUCCESS: onlineRegistrations.filter(r => r.customer_status === 'NEW_SUCCESS').length,
    EXISTING_USER: onlineRegistrations.filter(r => r.customer_status === 'EXISTING_USER').length,
    IN_PROGRESS: onlineRegistrations.filter(r => r.customer_status === 'IN_PROGRESS').length,
    NOT_INTERESTED: onlineRegistrations.filter(r => r.customer_status === 'NOT_INTERESTED').length,
    REGISTRATION_FAILED: onlineRegistrations.filter(r => r.customer_status === 'REGISTRATION_FAILED').length,
  };

  const customerStatusDistribution = [
    { name: '1. สมัครใหม่สำเร็จ', value: statusCounts.NEW_SUCCESS, status: 'NEW_SUCCESS', color: '#10B981' },
    { name: '2. มีบัญชีอยู่แล้ว', value: statusCounts.EXISTING_USER, status: 'EXISTING_USER', color: '#0077B6' },
    { name: '3. อยู่ระหว่างดำเนินการ', value: statusCounts.IN_PROGRESS, status: 'IN_PROGRESS', color: '#F59E0B' },
    { name: '4. ยังไม่ประสงค์สมัคร', value: statusCounts.NOT_INTERESTED, status: 'NOT_INTERESTED', color: '#64748B' },
    { name: '5. สมัครไม่สำเร็จ', value: statusCounts.REGISTRATION_FAILED, status: 'REGISTRATION_FAILED', color: '#EF4444' },
  ];

  // Channel breakdown
  const channels = ['WEB_DIRECT', 'QR_ONSITE', 'LINE', 'FACEBOOK'];
  const channelDistribution = channels.map(c => ({
    channel: c === 'WEB_DIRECT' ? 'เว็บไซต์ตรง' : c === 'QR_ONSITE' ? 'สแกน QR บูธ กปภ.' : c === 'LINE' ? 'LINE กปภ.' : 'สื่อโซเชียล',
    count: participants.filter(p => p.source_channel === c).length,
  }));

  // Krathong type breakdown
  const krathongTypeDistribution = [
    { type: 'กระทงสีฟ้า กปภ.', count: krathongEvents.filter(k => k.krathong_type === 'pwa_blue').length },
    { type: 'กระทงรักษ์โลก', count: krathongEvents.filter(k => k.krathong_type === 'eco_banana').length },
    { type: 'กระทงดอกบัว', count: krathongEvents.filter(k => k.krathong_type === 'lotus_pink').length },
    { type: 'กระทงแสงจันทร์', count: krathongEvents.filter(k => k.krathong_type === 'moonlight_gold').length },
    { type: 'กระทงสายน้ำตาปี', count: krathongEvents.filter(k => k.krathong_type === 'tapi_river').length },
  ];

  res.json({
    metrics: {
      totalVisitors: totalParticipants + 185, // Estimated pageviews
      totalParticipants,
      totalFloatedKrathongs,
      totalInterestedRegistrations,
      totalVerifiedNewRegistrations: verifiedNewRegistrations,
      totalExistingUsers: existingUsers,
      totalFailedRegistrations: failedRegistrations,
      conversionRate,
      totalGiftsRedeemed,
      totalGiftsRemaining,
      targetParticipants: campaignSettings.target_participants,
      targetNewRegistrations: campaignSettings.target_new_registrations,
      targetConversionRate: campaignSettings.target_conversion_rate,
      dailyStats,
      customerStatusDistribution,
      channelDistribution,
      krathongTypeDistribution,
      mode: isDemoMode ? 'DEMO' : 'PRODUCTION',
    },
  });
});

// Admin: Participant Search & List
app.get('/api/admin/participants', authenticateToken, (req, res) => {
  const { q } = req.query;
  let items = [...participants].reverse();

  if (q && typeof q === 'string') {
    const query = q.trim().toUpperCase();
    items = items.filter(p => p.participant_code.toUpperCase().includes(query));
  }

  // Join with registration and gift status
  const enriched = items.map(p => {
    const ke = krathongEvents.find(k => k.participant_id === p.id);
    const reg = onlineRegistrations.find(r => r.participant_code === p.participant_code);
    const gr = giftRedemptions.find(g => g.participant_code === p.participant_code);
    return {
      ...p,
      nickname: ke?.nickname || '-',
      krathong_type: ke?.krathong_type || '-',
      registration_status: reg?.customer_status || 'NOT_RECORDED',
      verification_status: reg?.verification_status || 'NONE',
      gift_redeemed: !!gr,
      gift_name: gr?.gift_name,
    };
  });

  res.json({ items: enriched });
});

// Admin: Online Registrations List
app.get('/api/admin/registrations', authenticateToken, (req, res) => {
  const { status, verification } = req.query;
  let items = [...onlineRegistrations].reverse();

  if (status && typeof status === 'string') {
    items = items.filter(r => r.customer_status === status);
  }
  if (verification && typeof verification === 'string') {
    items = items.filter(r => r.verification_status === verification);
  }

  res.json({ items });
});

// Staff/Admin: Record or Verify Registration
app.post('/api/admin/registrations', authenticateToken, requireRole(['ADMIN', 'STAFF']), (req, res) => {
  const user = (req as any).user;
  const { participant_code, service_type, customer_status, verification_status, notes } = req.body;

  if (!participant_code || !customer_status) {
    res.status(400).json({ error: 'กรุณากรอกรหัสกิจกรรมและสถานะลูกค้า' });
    return;
  }

  // Verify participant code exists
  const participant = participants.find(p => p.participant_code === participant_code.trim());
  if (!participant) {
    res.status(404).json({ error: `ไม่พบรหัสกิจกรรม ${participant_code} ในระบบ` });
    return;
  }

  // Check if duplicate registration
  const existing = onlineRegistrations.find(r => r.participant_code === participant_code.trim());
  const nowIso = new Date().toISOString();

  if (existing) {
    // Update existing record
    existing.customer_status = customer_status;
    existing.verification_status = verification_status || existing.verification_status;
    existing.service_type = service_type || existing.service_type;
    existing.notes = sanitizeText(notes) || existing.notes;
    existing.updated_at = nowIso;
    if (verification_status === 'VERIFIED') {
      existing.verified_by = user.id;
      existing.verified_by_name = user.display_name;
      existing.verified_at = nowIso;
    }

    auditLogs.push({
      id: `log-${Date.now()}`,
      actor_name: user.display_name,
      action: 'UPDATE_REGISTRATION',
      entity_type: 'ONLINE_REGISTRATION',
      entity_id: existing.id,
      safe_metadata: { participant_code, customer_status, verification_status },
      created_at: nowIso,
    });

    res.json({ success: true, item: existing, message: 'อัปเดตข้อมูลการตรวจสอบเรียบร้อยแล้ว' });
    return;
  }

  // Create new registration record
  const newReg = {
    id: `reg-${Date.now()}`,
    participant_id: participant.id,
    participant_code: participant.participant_code,
    service_type: service_type || 'PWA_PLUS_LIFE',
    customer_status,
    verification_status: verification_status || 'PENDING',
    verified_by: verification_status === 'VERIFIED' ? user.id : undefined,
    verified_by_name: verification_status === 'VERIFIED' ? user.display_name : undefined,
    notes: sanitizeText(notes),
    created_at: nowIso,
    verified_at: verification_status === 'VERIFIED' ? nowIso : undefined,
    updated_at: nowIso,
  };

  onlineRegistrations.push(newReg);

  auditLogs.push({
    id: `log-${Date.now()}`,
    actor_name: user.display_name,
    action: 'CREATE_REGISTRATION',
    entity_type: 'ONLINE_REGISTRATION',
    entity_id: newReg.id,
    safe_metadata: { participant_code, customer_status, verification_status },
    created_at: nowIso,
  });

  res.json({ success: true, item: newReg, message: 'บันทึกผลการสมัครบริการออนไลน์เรียบร้อยแล้ว' });
});

// Admin: Gifts List & Redemptions
app.get('/api/admin/gifts', authenticateToken, (req, res) => {
  const redemptionsList = [...giftRedemptions].reverse();
  res.json({
    gifts,
    redemptions: redemptionsList,
  });
});

// Staff/Admin: Redeem Gift for participant code
app.post('/api/admin/gifts/redeem', authenticateToken, requireRole(['ADMIN', 'STAFF']), (req, res) => {
  const user = (req as any).user;
  const { participant_code, gift_id } = req.body;

  if (!participant_code || !gift_id) {
    res.status(400).json({ error: 'กรุณาระบุรหัสกิจกรรมและของที่ระลึก' });
    return;
  }

  const pCode = participant_code.trim();
  const participant = participants.find(p => p.participant_code === pCode);
  if (!participant) {
    res.status(404).json({ error: `ไม่พบรหัสกิจกรรม ${pCode}` });
    return;
  }

  const gift = gifts.find(g => g.id === gift_id);
  if (!gift || !gift.active_status) {
    res.status(404).json({ error: 'ไม่พบของที่ระลึก หรือของที่ระลึกไม่ได้เปิดใช้งาน' });
    return;
  }

  if (gift.remaining_quantity <= 0) {
    res.status(400).json({ error: `ของที่ระลึก '${gift.gift_name}' หมดแล้ว ไม่สามารถมอบเพิ่มได้` });
    return;
  }

  // Anti-double-redemption: check if already redeemed this gift or any gift
  const alreadyRedeemed = giftRedemptions.find(gr => gr.participant_code === pCode);
  if (alreadyRedeemed) {
    res.status(400).json({
      error: `รหัสกิจกรรม ${pCode} ได้รับของที่ระลึกไปแล้ว (${alreadyRedeemed.gift_name}) เมื่อ ${alreadyRedeemed.redeemed_at} ไม่สามารถรับซ้ำได้`,
    });
    return;
  }

  // Deduct stock
  gift.remaining_quantity -= 1;
  const nowIso = new Date().toISOString();

  const redemption = {
    id: `gr-${Date.now()}`,
    gift_id: gift.id,
    gift_name: gift.gift_name,
    participant_id: participant.id,
    participant_code: pCode,
    redeemed_by: user.id,
    redeemed_by_name: user.display_name,
    redeemed_at: nowIso,
  };

  giftRedemptions.push(redemption);

  auditLogs.push({
    id: `log-${Date.now()}`,
    actor_name: user.display_name,
    action: 'REDEEM_GIFT',
    entity_type: 'GIFT_REDEMPTION',
    entity_id: redemption.id,
    safe_metadata: {
      participant_code: pCode,
      gift_id: gift.id,
      gift_name: gift.gift_name,
      remaining_quantity: gift.remaining_quantity,
    },
    created_at: nowIso,
  });

  res.json({
    success: true,
    message: `มอบของที่ระลึกสำเร็จ: ${gift.gift_name} ให้แก่รหัส ${pCode}`,
    redemption,
    remainingQuantity: gift.remaining_quantity,
    isLowStock: gift.remaining_quantity <= gift.alert_threshold,
  });
});

// Admin: Audit Logs
app.get('/api/admin/audit-logs', authenticateToken, (req, res) => {
  res.json({ items: [...auditLogs].reverse() });
});

// Admin: Campaign Settings
app.get('/api/admin/settings', authenticateToken, (req, res) => {
  res.json({ settings: campaignSettings });
});

app.put('/api/admin/settings', authenticateToken, requireRole(['ADMIN']), (req, res) => {
  const user = (req as any).user;
  const {
    campaign_name,
    organization_name,
    start_date,
    end_date,
    target_participants,
    target_new_registrations,
    target_conversion_rate,
    official_pwa_app_url,
    official_line_url,
    official_payment_url,
    active_status,
  } = req.body;

  campaignSettings = {
    ...campaignSettings,
    campaign_name: sanitizeText(campaign_name) || campaignSettings.campaign_name,
    organization_name: sanitizeText(organization_name) || campaignSettings.organization_name,
    start_date: start_date || campaignSettings.start_date,
    end_date: end_date || campaignSettings.end_date,
    target_participants: Number(target_participants) || campaignSettings.target_participants,
    target_new_registrations: Number(target_new_registrations) || campaignSettings.target_new_registrations,
    target_conversion_rate: Number(target_conversion_rate) || campaignSettings.target_conversion_rate,
    official_pwa_app_url: official_pwa_app_url || campaignSettings.official_pwa_app_url,
    official_line_url: official_line_url || campaignSettings.official_line_url,
    official_payment_url: official_payment_url || campaignSettings.official_payment_url,
    active_status: active_status !== undefined ? Boolean(active_status) : campaignSettings.active_status,
  };

  auditLogs.push({
    id: `log-${Date.now()}`,
    actor_name: user.display_name,
    action: 'UPDATE_CAMPAIGN_SETTINGS',
    entity_type: 'CAMPAIGN_SETTINGS',
    entity_id: campaignSettings.id,
    safe_metadata: { updatedBy: user.username },
    created_at: new Date().toISOString(),
  });

  res.json({ success: true, settings: campaignSettings, message: 'บันทึกการตั้งค่ากิจกรรมสำเร็จ' });
});

// Admin: Switch Mode or Reset Database
app.post('/api/admin/data/mode', authenticateToken, requireRole(['ADMIN']), (req, res) => {
  const { mode, reset } = req.body;
  if (mode === 'PRODUCTION') {
    isDemoMode = false;
  } else if (mode === 'DEMO') {
    isDemoMode = true;
  }

  if (reset) {
    participants = [];
    krathongEvents = [];
    onlineRegistrations = [];
    giftRedemptions = [];
    counter = 100;
    if (isDemoMode) {
      initializeSeedData();
    }
  }

  res.json({
    success: true,
    mode: isDemoMode ? 'DEMO' : 'PRODUCTION',
    totalParticipants: participants.length,
    message: isDemoMode ? 'สลับเป็นโหมดทดสอบ (DEMO MODE)' : 'สลับเป็นโหมดใช้งานจริง (PRODUCTION MODE)',
  });
});

// -------------------------------------------------------------
// EXCEL EXPORT (5 Multi-worksheets with Formula Injection Protection)
// -------------------------------------------------------------
app.get('/api/admin/export-excel', authenticateToken, (req, res) => {
  try {
    const user = (req as any).user;

    // Create workbook
    const wb = XLSX.utils.book_new();

    // 1. Sheet 1: Executive Summary
    const totalP = participants.length;
    const verifiedNew = onlineRegistrations.filter(r => r.customer_status === 'NEW_SUCCESS' && r.verification_status === 'VERIFIED').length;
    const existingU = onlineRegistrations.filter(r => r.customer_status === 'EXISTING_USER').length;
    const cRate = totalP > 0 ? ((verifiedNew / totalP) * 100).toFixed(2) + '%' : '0.00%';

    const summaryData = [
      ['รายงานสรุปผลการดำเนินงานกิจกรรมลอยกระทงออนไลน์ ประจำปี 2569'],
      ['หน่วยงาน:', campaignSettings.organization_name],
      ['ชื่อกิจกรรม:', campaignSettings.campaign_name],
      ['ช่วงเวลาจัดกิจกรรม:', `${campaignSettings.start_date.slice(0, 10)} ถึง ${campaignSettings.end_date.slice(0, 10)}`],
      ['วันที่ส่งออกข้อมูล:', new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })],
      ['ผู้ส่งออกรายงาน:', user.display_name],
      ['สถานะข้อมูล:', isDemoMode ? 'ข้อมูลจำลองสำหรับทดสอบ (DEMO MODE)' : 'ข้อมูลจริง (PRODUCTION)'],
      [],
      ['ตัวชี้วัดหลัก (KPIs)', 'ค่าที่ทำได้จริง', 'เป้าหมายที่ตั้งไว้', 'ผลการประเมิน'],
      ['จำนวนผู้เข้าร่วมกิจกรรมไม่ซ้ำ (คน)', totalP, campaignSettings.target_participants, totalP >= campaignSettings.target_participants ? 'บรรลุเป้าหมาย' : 'กำลังดำเนินการ'],
      ['จำนวนผู้สมัครบริการออนไลน์รายใหม่ที่ตรวจสอบสำเร็จ (คน)', verifiedNew, campaignSettings.target_new_registrations, verifiedNew >= campaignSettings.target_new_registrations ? 'บรรลุเป้าหมาย' : 'กำลังดำเนินการ'],
      ['จำนวนผู้ใช้บริการเดิมที่ร่วมกิจกรรม (คน)', existingU, '-', '-'],
      ['อัตรา Conversion Rate (%)', cRate, `${campaignSettings.target_conversion_rate}%`, parseFloat(cRate) >= campaignSettings.target_conversion_rate ? 'บรรลุเป้าหมาย' : 'กำลังดำเนินการ'],
      ['จำนวนกระทงดิจิทัลที่ลอยสำเร็จ (กระทง)', krathongEvents.length, '-', '-'],
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Executive Summary');

    // 2. Sheet 2: Participation
    const participationHeaders = ['รหัสกิจกรรม', 'วันที่และเวลา (พ.ศ.)', 'ช่องทางเข้าร่วม', 'ประเภทกระทง', 'ชื่อเล่น/นามสมมติ', 'สถานะการลอย'];
    const participationRows = participants.map(p => {
      const ke = krathongEvents.find(k => k.participant_id === p.id);
      const krathongNameMap: Record<string, string> = {
        pwa_blue: 'กระทงสีฟ้า กปภ.',
        eco_banana: 'กระทงรักษ์โลก',
        lotus_pink: 'กระทงดอกบัว',
        moonlight_gold: 'กระทงแสงจันทร์',
        tapi_river: 'กระทงสายน้ำตาปี',
      };
      return [
        p.participant_code,
        p.created_at,
        p.source_channel === 'WEB_DIRECT' ? 'เว็บไซต์ตรง' : p.source_channel === 'QR_ONSITE' ? 'สแกน QR บูธ กปภ.' : 'LINE กปภ.',
        ke ? krathongNameMap[ke.krathong_type] || ke.krathong_type : '-',
        ke ? sanitizeText(ke.nickname) : '-',
        p.participation_status === 'COMPLETED' ? 'ลอยสำเร็จ' : 'กำลังทำรายการ',
      ];
    });
    const wsParticipation = XLSX.utils.aoa_to_sheet([participationHeaders, ...participationRows]);
    XLSX.utils.book_append_sheet(wb, wsParticipation, 'Participation');

    // 3. Sheet 3: Online Registration
    const registrationHeaders = ['รหัสกิจกรรม', 'วันที่บันทึก', 'ประเภทบริการออนไลน์', 'สถานะลูกค้า', 'สถานะการตรวจสอบ', 'เจ้าหน้าที่ผู้ตรวจสอบ', 'หมายเหตุ'];
    const statusMap: Record<string, string> = {
      NEW_SUCCESS: '1. สมัครใหม่สำเร็จในกิจกรรม',
      EXISTING_USER: '2. มีบัญชีอยู่แล้ว',
      IN_PROGRESS: '3. อยู่ระหว่างดำเนินการสมัคร',
      NOT_INTERESTED: '4. ยังไม่ประสงค์สมัคร',
      REGISTRATION_FAILED: '5. สมัครไม่สำเร็จ',
    };
    const vStatusMap: Record<string, string> = {
      PENDING: 'รอตรวจสอบ',
      VERIFIED: 'ตรวจสอบสำเร็จ',
      REJECTED: 'ตรวจสอบไม่ผ่าน',
    };
    const registrationRows = onlineRegistrations.map(r => [
      r.participant_code,
      r.created_at,
      r.service_type === 'PWA_PLUS_LIFE' ? 'แอปพลิเคชัน PWA Plus Life' : 'LINE Official @pwathailand',
      statusMap[r.customer_status] || r.customer_status,
      vStatusMap[r.verification_status] || r.verification_status,
      r.verified_by_name || '-',
      sanitizeText(r.notes) || '-',
    ]);
    const wsRegistration = XLSX.utils.aoa_to_sheet([registrationHeaders, ...registrationRows]);
    XLSX.utils.book_append_sheet(wb, wsRegistration, 'Online Registration');

    // 4. Sheet 4: Daily Statistics
    const dailyHeaders = ['วันที่', 'จำนวนผู้เข้าร่วม (คน)', 'ยอดสมัครใหม่สำเร็จ (คน)', 'ผู้ใช้บริการเดิม (คน)'];
    // Group
    const dMap = new Map<string, { participants: number; newR: number; existR: number }>();
    participants.forEach(p => {
      const d = p.created_at.slice(0, 10);
      const c = dMap.get(d) || { participants: 0, newR: 0, existR: 0 };
      c.participants += 1;
      dMap.set(d, c);
    });
    onlineRegistrations.forEach(r => {
      const d = r.created_at.slice(0, 10);
      const c = dMap.get(d) || { participants: 0, newR: 0, existR: 0 };
      if (r.customer_status === 'NEW_SUCCESS' && r.verification_status === 'VERIFIED') c.newR += 1;
      if (r.customer_status === 'EXISTING_USER') c.existR += 1;
      dMap.set(d, c);
    });
    const dailyRows = Array.from(dMap.keys()).sort().map(d => {
      const val = dMap.get(d)!;
      return [d, val.participants, val.newR, val.existR];
    });
    const wsDaily = XLSX.utils.aoa_to_sheet([dailyHeaders, ...dailyRows]);
    XLSX.utils.book_append_sheet(wb, wsDaily, 'Daily Statistics');

    // Write to buffer
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    auditLogs.push({
      id: `log-${Date.now()}`,
      actor_name: user.display_name,
      action: 'EXPORT_EXCEL',
      entity_type: 'REPORT',
      safe_metadata: { timestamp: new Date().toISOString() },
      created_at: new Date().toISOString(),
    });

    const filename = `PWA_LoyKrathong2026_Report_${new Date().toISOString().slice(0, 10)}.xlsx`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (err: any) {
    res.status(500).json({ error: 'ไม่สามารถสร้างไฟล์ Excel ได้: ' + err.message });
  }
});

// Vite Middleware for Full-stack Dev & Prod Serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT} (${isDemoMode ? 'DEMO MODE' : 'PRODUCTION'})`);
  });
}

startServer();
