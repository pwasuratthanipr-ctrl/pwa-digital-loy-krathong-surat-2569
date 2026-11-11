/**
 * PWA Digital Loy Krathong 2026 - Type Definitions
 * Static Web Application
 */

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

export interface KrathongEvent {
  id: string;
  participant_code: string;
  krathong_type: KrathongTypeId;
  nickname?: string;
  wish_text: string;
  share_consent: boolean;
  floated_at: string;
  water_coordinates_x?: number;
  water_coordinates_y?: number;
}

export interface PublicStats {
  totalFloatedKrathongs: number;
  uniqueParticipants: number;
  totalOnlineRegistrations: number;
  totalGiftsRedeemed: number;
  remainingGiftStock: number;
  wasteReductionRate: number;
}

export interface KrathongActivity {
  activity_id: string;
  created_at: string;
  krathong_type: string;
  wish: string;
  status: string;
}

export type AccountStatusType = 'no_account' | 'has_account';
export type ServiceKeyType = 'pwa_plus_life' | 'line_official' | 'online_payment' | 'none';
export type EventType = 'service_click' | 'complete_registration';

export interface ServiceClickActivity {
  event_id: string;
  created_at: string;
  account_status: AccountStatusType;
  service_key: ServiceKeyType;
  service_name: string;
  event_type: EventType;
}

export interface OnlineServiceStats {
  success: boolean;
  totalEvents: number;
  noAccountCount: number;
  hasAccountCount: number;
  clicksPwaPlusLife: number;
  clicksLineOfficial: number;
  clicksOnlinePayment: number;
  totalServiceClicks: number;
  completedRegistrationCount: number;
  lastUpdated: string | null;
  recentEvents: ServiceClickActivity[];
  error?: string;
  // Backward compatibility aliases
  totalClicks?: number;
  byService?: {
    app: number;
    line: number;
    web: number;
  };
  recentClicks?: ServiceClickActivity[];
}

export interface GoogleSheetsStats {
  success: boolean;
  totalFloated: number;
  byType: {
    pwa_blue: number;
    eco_banana: number;
    lotus_pink: number;
    moonlight_gold: number;
    tapi_river: number;
    [key: string]: number;
  };
  countsByType?: {
    pwa_blue: number;
    eco_banana: number;
    lotus_pink: number;
    moonlight_gold: number;
    tapi_river: number;
    [key: string]: number;
  };
  lastUpdated: string | null;
  recentKrathongs: KrathongActivity[];
  error?: string;
}

export interface GoogleSheetsAdminData {
  success: boolean;
  totalFloated: number;
  byType: Record<string, number>;
  countsByType?: Record<string, number>;
  lastUpdated: string | null;
  allActivities: KrathongActivity[];
  serviceStats?: OnlineServiceStats;
  error?: string;
}


