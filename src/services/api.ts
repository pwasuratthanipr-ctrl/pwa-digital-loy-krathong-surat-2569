import {
  AdminProfile,
  CampaignSettings,
  DashboardMetrics,
  Gift,
  GiftRedemption,
  KrathongEvent,
  OnlineRegistration,
  PublicStats,
} from '../types';

const TOKEN_KEY = 'pwa_lk_auth_token';
const USER_KEY = 'pwa_lk_auth_user';

export const AuthService = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },
  setToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
  },
  getUser(): AdminProfile | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },
  setUser(user: AdminProfile) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
};

function getAuthHeaders(): Record<string, string> {
  const token = AuthService.getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const ApiService = {
  // Public
  async getPublicStats(): Promise<PublicStats> {
    const res = await fetch('/api/campaign/public-stats');
    if (!res.ok) throw new Error('ไม่สามารถดึงข้อมูลสถิติกิจกรรมได้');
    return res.json();
  },

  async getRecentKrathongs(): Promise<Array<{
    id: string;
    nickname: string;
    krathong_type: string;
    wish_text: string;
    floated_at: string;
    water_coordinates_x?: number;
    water_coordinates_y?: number;
  }>> {
    const res = await fetch('/api/krathong/recent');
    if (!res.ok) throw new Error('ไม่สามารถดึงกระทงในสายน้ำได้');
    const data = await res.json();
    return data.items || [];
  },

  async floatKrathong(payload: {
    krathong_type: string;
    nickname?: string;
    wish_text: string;
    share_consent: boolean;
    source_channel?: string;
  }): Promise<{
    success: boolean;
    participantCode: string;
    participantId: string;
    floatedAt: string;
    krathong: KrathongEvent;
    message: string;
  }> {
    const res = await fetch('/api/krathong/float', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'เกิดข้อผิดพลาดในการลอยกระทง');
    return data;
  },

  // Auth
  async login(username: string, password: string): Promise<{ token: string; user: AdminProfile }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'เข้าสู่ระบบไม่สำเร็จ');
    AuthService.setToken(data.token);
    AuthService.setUser(data.user);
    return data;
  },

  async checkAuthMe(): Promise<AdminProfile> {
    const res = await fetch('/api/auth/me', {
      headers: { ...getAuthHeaders() },
    });
    if (!res.ok) throw new Error('เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่');
    const data = await res.json();
    AuthService.setUser(data.user);
    return data.user;
  },

  // Admin Dashboard
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const res = await fetch('/api/admin/dashboard', {
      headers: { ...getAuthHeaders() },
    });
    if (!res.ok) throw new Error('ไม่สามารถเรียกข้อมูล Dashboard ได้');
    const data = await res.json();
    return data.metrics;
  },

  // Participants
  async getParticipants(query?: string): Promise<any[]> {
    const url = query ? `/api/admin/participants?q=${encodeURIComponent(query)}` : '/api/admin/participants';
    const res = await fetch(url, {
      headers: { ...getAuthHeaders() },
    });
    if (!res.ok) throw new Error('ไม่สามารถดึงข้อมูลผู้เข้าร่วมได้');
    const data = await res.json();
    return data.items || [];
  },

  // Registrations
  async getRegistrations(status?: string, verification?: string): Promise<OnlineRegistration[]> {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (verification) params.append('verification', verification);
    const res = await fetch(`/api/admin/registrations?${params.toString()}`, {
      headers: { ...getAuthHeaders() },
    });
    if (!res.ok) throw new Error('ไม่สามารถดึงข้อมูลการสมัครได้');
    const data = await res.json();
    return data.items || [];
  },

  async submitRegistration(payload: {
    participant_code: string;
    service_type: string;
    customer_status: string;
    verification_status: string;
    notes?: string;
  }): Promise<{ success: boolean; item: OnlineRegistration; message: string }> {
    const res = await fetch('/api/admin/registrations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'ไม่สามารถบันทึกผลการสมัครได้');
    return data;
  },

  // Gifts
  async getGifts(): Promise<{ gifts: Gift[]; redemptions: GiftRedemption[] }> {
    const res = await fetch('/api/admin/gifts', {
      headers: { ...getAuthHeaders() },
    });
    if (!res.ok) throw new Error('ไม่สามารถดึงข้อมูลของที่ระลึกได้');
    return res.json();
  },

  async redeemGift(participant_code: string, gift_id: string): Promise<{
    success: boolean;
    message: string;
    remainingQuantity: number;
    isLowStock: boolean;
  }> {
    const res = await fetch('/api/admin/gifts/redeem', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ participant_code, gift_id }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'ไม่สามารถมอบของที่ระลึกได้');
    return data;
  },

  // Audit Logs
  async getAuditLogs(): Promise<any[]> {
    const res = await fetch('/api/admin/audit-logs', {
      headers: { ...getAuthHeaders() },
    });
    if (!res.ok) throw new Error('ไม่สามารถดึง Audit Logs ได้');
    const data = await res.json();
    return data.items || [];
  },

  // Settings
  async getSettings(): Promise<CampaignSettings> {
    const res = await fetch('/api/admin/settings', {
      headers: { ...getAuthHeaders() },
    });
    if (!res.ok) throw new Error('ไม่สามารถดึงการตั้งค่ากิจกรรมได้');
    const data = await res.json();
    return data.settings;
  },

  async updateSettings(settings: Partial<CampaignSettings>): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(settings),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'ไม่สามารถบันทึกการตั้งค่าได้');
    return data;
  },

  // Mode Switch
  async switchDataMode(mode: 'DEMO' | 'PRODUCTION', reset?: boolean): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/admin/data/mode', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ mode, reset }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'ไม่สามารถเปลี่ยนโหมดได้');
    return data;
  },

  // Download Excel
  async downloadExcel(): Promise<void> {
    const token = AuthService.getToken();
    const res = await fetch('/api/admin/export-excel', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'ไม่สามารถดาวน์โหลดไฟล์ Excel ได้');
    }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PWA_LoyKrathong2026_Report_${new Date().toISOString().slice(0, 10)}.xlsx`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },
};
