export type KrathongTypeId = 
  | 'pwa_blue' 
  | 'eco_banana' 
  | 'lotus_pink' 
  | 'moonlight_gold' 
  | 'tapi_river';

export interface KrathongOption {
  id: KrathongTypeId;
  name: string;
  nameEn: string;
  description: string;
  materials: string;
  symbolism: string;
  dominantColor: string;
  badge: string;
}

export type CustomerStatus =
  | 'NEW_SUCCESS'        // 1. สมัครใหม่สำเร็จในกิจกรรม
  | 'EXISTING_USER'      // 2. มีบัญชีอยู่แล้ว
  | 'IN_PROGRESS'        // 3. อยู่ระหว่างดำเนินการสมัคร
  | 'NOT_INTERESTED'     // 4. ยังไม่ประสงค์สมัคร
  | 'REGISTRATION_FAILED'; // 5. สมัครไม่สำเร็จ

export type VerificationStatus =
  | 'PENDING'   // รอตรวจสอบ
  | 'VERIFIED'  // ตรวจสอบสำเร็จ
  | 'REJECTED'; // ตรวจสอบไม่ผ่าน

export type AdminRole = 'ADMIN' | 'STAFF' | 'VIEWER';

export interface Participant {
  id: string;
  participant_code: string;
  source_channel: string;
  created_at: string;
  completed_at?: string;
  participation_status: 'STARTED' | 'COMPLETED' | 'ABANDONED';
}

export interface KrathongEvent {
  id: string;
  participant_id: string;
  participant_code?: string;
  krathong_type: KrathongTypeId;
  nickname?: string;
  wish_text: string;
  share_consent: boolean;
  floated_at: string;
  water_coordinates_x?: number;
  water_coordinates_y?: number;
}

export interface OnlineRegistration {
  id: string;
  participant_id: string;
  participant_code: string;
  service_type: string;
  customer_status: CustomerStatus;
  verification_status: VerificationStatus;
  verified_by?: string;
  verified_by_name?: string;
  notes?: string;
  created_at: string;
  verified_at?: string;
  updated_at: string;
}

export interface Gift {
  id: string;
  gift_name: string;
  description?: string;
  initial_quantity: number;
  remaining_quantity: number;
  alert_threshold: number;
  eligible_group: 'NEW_VERIFIED' | 'EXISTING_USER' | 'ALL_PARTICIPANTS';
  active_status: boolean;
  created_at: string;
}

export interface GiftRedemption {
  id: string;
  gift_id: string;
  gift_name?: string;
  participant_id: string;
  participant_code: string;
  redeemed_by: string;
  redeemed_by_name: string;
  redeemed_at: string;
}

export interface AdminProfile {
  id: string;
  username: string;
  display_name: string;
  department: string;
  role: AdminRole;
  active_status: boolean;
}

export interface CampaignSettings {
  id: string;
  campaign_name: string;
  organization_name: string;
  start_date: string;
  end_date: string;
  target_participants: number;
  target_new_registrations: number;
  target_conversion_rate: number;
  official_pwa_app_url: string;
  official_line_url: string;
  official_payment_url: string;
  active_status: boolean;
}

export interface AuditLog {
  id: string;
  actor_name: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  safe_metadata?: Record<string, unknown>;
  created_at: string;
}

export interface PublicStats {
  totalFloatedKrathongs: number;
  uniqueParticipants: number;
  campaignStartDate: string;
  campaignEndDate: string;
  organizationName: string;
  campaignName: string;
  isLive: boolean;
}

export interface DashboardMetrics {
  totalVisitors: number;
  totalParticipants: number;
  totalFloatedKrathongs: number;
  totalInterestedRegistrations: number;
  totalVerifiedNewRegistrations: number;
  totalExistingUsers: number;
  totalFailedRegistrations: number;
  conversionRate: number;
  totalGiftsRedeemed: number;
  totalGiftsRemaining: number;
  
  // Targets
  targetParticipants: number;
  targetNewRegistrations: number;
  targetConversionRate: number;
  
  // Analytics
  dailyStats: {
    date: string;
    participants: number;
    newRegistrations: number;
    existingUsers: number;
    cumulativeRegistrations: number;
    giftsRedeemed: number;
  }[];
  
  customerStatusDistribution: {
    name: string;
    value: number;
    status: CustomerStatus;
    color: string;
  }[];
  
  channelDistribution: {
    channel: string;
    count: number;
  }[];

  krathongTypeDistribution: {
    type: string;
    count: number;
  }[];
}
