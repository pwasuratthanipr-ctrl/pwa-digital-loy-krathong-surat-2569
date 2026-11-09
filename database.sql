-- ====================================================================
-- PWA Digital Loy Krathong 2026 - PostgreSQL Database Schema & Migration
-- การประปาส่วนภูมิภาคสาขาสุราษฎร์ธานี (ชั้นพิเศษ)
-- กิจกรรม: "ลอยกระทงออนไลน์ ส่งความสุข ไม่เพิ่มขยะ" ประจำปี 2569
-- ====================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. CAMPAIGN SETTINGS TABLE
CREATE TABLE IF NOT EXISTS campaign_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_name VARCHAR(255) NOT NULL DEFAULT 'ลอยกระทงออนไลน์ ส่งความสุข ไม่เพิ่มขยะ 2569',
    organization_name VARCHAR(255) NOT NULL DEFAULT 'การประปาส่วนภูมิภาคสาขาสุราษฎร์ธานี (ชั้นพิเศษ)',
    start_date TIMESTAMPTZ NOT NULL DEFAULT '2026-11-20 00:00:00+07',
    end_date TIMESTAMPTZ NOT NULL DEFAULT '2026-11-28 23:59:59+07',
    target_participants INTEGER NOT NULL DEFAULT 200,
    target_new_registrations INTEGER NOT NULL DEFAULT 50,
    target_conversion_rate NUMERIC(5,2) NOT NULL DEFAULT 25.00,
    official_pwa_app_url VARCHAR(500) DEFAULT 'https://www.pwa.co.th',
    official_line_url VARCHAR(500) DEFAULT 'https://page.line.me/pwathailand',
    official_payment_url VARCHAR(500) DEFAULT 'https://payment.pwa.co.th',
    active_status BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. ADMIN PROFILES & ROLES TABLE
CREATE TABLE IF NOT EXISTS admin_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id VARCHAR(100) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(150) NOT NULL,
    department VARCHAR(150) DEFAULT 'กปภ.สาขาสุราษฎร์ธานี (ชั้นพิเศษ)',
    role VARCHAR(50) NOT NULL CHECK (role IN ('ADMIN', 'STAFF', 'VIEWER')),
    active_status BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. PARTICIPANTS TABLE
CREATE TABLE IF NOT EXISTS participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participant_code VARCHAR(50) UNIQUE NOT NULL, -- e.g. LK69-000001
    source_channel VARCHAR(50) NOT NULL DEFAULT 'WEB_DIRECT', -- 'WEB_DIRECT', 'QR_ONSITE', 'LINE', 'FACEBOOK'
    ip_hash VARCHAR(64), -- Hashed for rate limiting & uniqueness without storing plain IP (Data Minimization)
    user_agent_snippet VARCHAR(255),
    participation_status VARCHAR(50) NOT NULL DEFAULT 'COMPLETED', -- 'STARTED', 'COMPLETED', 'ABANDONED'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_participants_code ON participants(participant_code);
CREATE INDEX IF NOT EXISTS idx_participants_created ON participants(created_at);

-- 4. KRATHONG EVENTS TABLE
CREATE TABLE IF NOT EXISTS krathong_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
    krathong_type VARCHAR(100) NOT NULL, -- 'pwa_blue', 'eco_banana', 'lotus_pink', 'moonlight_gold', 'tapi_river'
    nickname VARCHAR(100), -- Optional sanitized nickname
    wish_text TEXT NOT NULL,
    share_consent BOOLEAN NOT NULL DEFAULT FALSE,
    floated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    water_coordinates_x NUMERIC(5,2) DEFAULT 50.0,
    water_coordinates_y NUMERIC(5,2) DEFAULT 60.0
);

CREATE INDEX IF NOT EXISTS idx_krathong_participant ON krathong_events(participant_id);
CREATE INDEX IF NOT EXISTS idx_krathong_type ON krathong_events(krathong_type);

-- 5. ONLINE REGISTRATIONS TABLE (Staff Verification)
CREATE TABLE IF NOT EXISTS online_registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
    participant_code VARCHAR(50) NOT NULL,
    service_type VARCHAR(100) NOT NULL DEFAULT 'PWA_PLUS_LIFE', -- 'PWA_PLUS_LIFE', 'LINE_PWA', 'PWA_WEB_PAY'
    customer_status VARCHAR(100) NOT NULL CHECK (customer_status IN (
        'NEW_SUCCESS',       -- 1. สมัครใหม่สำเร็จในกิจกรรม
        'EXISTING_USER',     -- 2. มีบัญชีอยู่แล้ว
        'IN_PROGRESS',       -- 3. อยู่ระหว่างดำเนินการสมัคร
        'NOT_INTERESTED',    -- 4. ยังไม่ประสงค์สมัคร
        'REGISTRATION_FAILED'-- 5. สมัครไม่สำเร็จ
    )),
    verification_status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (verification_status IN (
        'PENDING',           -- รอตรวจสอบ
        'VERIFIED',          -- ตรวจสอบสำเร็จ
        'REJECTED'           -- ตรวจสอบไม่ผ่าน
    )),
    verified_by UUID REFERENCES admin_profiles(id),
    verified_by_name VARCHAR(150),
    notes TEXT, -- Non-sensitive notes only
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    verified_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_participant_registration UNIQUE (participant_id)
);

CREATE INDEX IF NOT EXISTS idx_registrations_code ON online_registrations(participant_code);
CREATE INDEX IF NOT EXISTS idx_registrations_status ON online_registrations(customer_status, verification_status);

-- 6. GIFTS TABLE (Inventory)
CREATE TABLE IF NOT EXISTS gifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gift_name VARCHAR(200) NOT NULL,
    description TEXT,
    initial_quantity INTEGER NOT NULL DEFAULT 100,
    remaining_quantity INTEGER NOT NULL DEFAULT 100,
    alert_threshold INTEGER NOT NULL DEFAULT 10,
    eligible_group VARCHAR(100) NOT NULL DEFAULT 'NEW_VERIFIED', -- 'NEW_VERIFIED', 'EXISTING_USER', 'ALL_PARTICIPANTS'
    active_status BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. GIFT REDEMPTIONS TABLE
CREATE TABLE IF NOT EXISTS gift_redemptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gift_id UUID NOT NULL REFERENCES gifts(id),
    participant_id UUID NOT NULL REFERENCES participants(id),
    participant_code VARCHAR(50) NOT NULL,
    redeemed_by UUID NOT NULL REFERENCES admin_profiles(id),
    redeemed_by_name VARCHAR(150) NOT NULL,
    redeemed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_gift_participant UNIQUE (gift_id, participant_id) -- Prevent double redemption
);

CREATE INDEX IF NOT EXISTS idx_redemptions_participant ON gift_redemptions(participant_code);

-- 8. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID REFERENCES admin_profiles(id),
    actor_name VARCHAR(150) NOT NULL,
    action VARCHAR(100) NOT NULL, -- e.g. 'LOGIN', 'VERIFY_REGISTRATION', 'REDEEM_GIFT', 'UPDATE_SETTINGS', 'EXPORT_EXCEL'
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100),
    safe_metadata JSONB DEFAULT '{}'::jsonb,
    ip_hash VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);

-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE campaign_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE krathong_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE online_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE gifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Public read access to active campaign settings
CREATE POLICY "Public read active campaign" ON campaign_settings
    FOR SELECT USING (active_status = TRUE);

-- Public can insert new participant
CREATE POLICY "Public insert participant" ON participants
    FOR INSERT WITH CHECK (TRUE);

-- Public can insert their own krathong event
CREATE POLICY "Public insert krathong" ON krathong_events
    FOR INSERT WITH CHECK (TRUE);

-- Public can view recent krathongs that have share consent
CREATE POLICY "Public view shared krathongs" ON krathong_events
    FOR SELECT USING (share_consent = TRUE);

-- SEED INITIAL DATA (Campaign and Staff demo accounts)
INSERT INTO campaign_settings (
    campaign_name, organization_name, target_participants, target_new_registrations, target_conversion_rate
) VALUES (
    'ลอยกระทงออนไลน์ ส่งความสุข ไม่เพิ่มขยะ 2569',
    'การประปาส่วนภูมิภาคสาขาสุราษฎร์ธานี (ชั้นพิเศษ)',
    200, 50, 25.00
) ON CONFLICT DO NOTHING;

INSERT INTO gifts (gift_name, description, initial_quantity, remaining_quantity, alert_threshold, eligible_group) VALUES
('กระบอกน้ำรักษ์โลก กปภ. (PWA Eco Bottle)', 'กระบอกน้ำเก็บอุณหภูมิสเตนเลส ลายมาสคอต กปภ. รักษ์น้ำรักษ์สิ่งแวดล้อม', 50, 38, 10, 'NEW_VERIFIED'),
('กระเป๋าผ้าแคนวาส กปภ. สุราษฎร์ธานี', 'กระเป๋าผ้าพิมพ์ลายอัตลักษณ์แม่น้ำตาปีและดอกบัว', 100, 75, 15, 'EXISTING_USER'),
('ร่มพับยูวีกันแดด-ฝน กปภ.', 'ร่มพับพกพาโทนสีฟ้า กปภ. สะท้อนแสง UV คุณภาพสูง', 60, 42, 10, 'NEW_VERIFIED')
ON CONFLICT DO NOTHING;
