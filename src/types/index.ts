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

export interface AdminStats {
  totalVisitors: number;
  totalKrathongPlayers: number;
  onlineServiceRegistrations: {
    total: number;
    app: number;
    line: number;
    web: number;
  };
  existingUsersCount: number;
  participantsLog: Array<{
    code: string;
    nickname: string;
    krathongType: string;
    wishText: string;
    floatedAt: string;
  }>;
  serviceClicksLog: Array<{
    channel: 'app' | 'line' | 'web';
    channelName: string;
    timestamp: string;
  }>;
}

