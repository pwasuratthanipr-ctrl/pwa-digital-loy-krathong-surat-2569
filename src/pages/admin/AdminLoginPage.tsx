import React, { useState } from 'react';
import { Shield, Lock, User, ArrowRight, AlertCircle, ArrowLeft, KeyRound } from 'lucide-react';
import { ApiService } from '../../services/api';
import { AdminProfile } from '../../types';

interface AdminLoginPageProps {
  onLoginSuccess: (user: AdminProfile) => void;
  onBack: () => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({
  onLoginSuccess,
  onBack,
}) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await ApiService.login(username, password);
      onLoginSuccess(res.user);
    } catch (err: any) {
      setError(err.message || 'เข้าสู่ระบบไม่สำเร็จ กรุณาตรวจสอบข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setError('');
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12 space-y-6">
      
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>กลับหน้าเว็บไซต์หลัก</span>
      </button>

      {/* Main Login Card */}
      <div className="bg-slate-900/90 border border-cyan-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md space-y-6">
        
        <div className="text-center space-y-2">
          <img
            src="/assets/aistudio/logo_PWA_4b69b17d.jpg"
            alt="โลโก้ การประปาส่วนภูมิภาค"
            className="w-16 h-16 mx-auto rounded-2xl object-contain bg-white/10 p-1 border border-cyan-400/40 shadow-lg"
          />
          <h1 className="font-heading font-bold text-2xl text-white">
            เข้าสู่ระบบเจ้าหน้าที่ กปภ.
          </h1>
          <p className="text-xs text-slate-300">
            ระบบจัดการกิจกรรมและสถิติ กปภ.สาขาสุราษฎร์ธานี (ชั้นพิเศษ)
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300 block">
              ชื่อผู้ใช้งาน (Username)
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="กรอกชื่อผู้ใช้..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:border-cyan-400 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300 block">
              รหัสผ่าน (Password)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="กรอกรหัสผ่าน..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:border-cyan-400 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 text-white font-heading font-bold text-sm rounded-xl shadow-lg shadow-cyan-950/50 transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
          >
            <span>{loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Demo Roles Quick Selection */}
        <div className="pt-4 border-t border-slate-800 space-y-2">
          <div className="flex items-center gap-1.5 text-xs text-amber-300 font-semibold">
            <KeyRound className="w-3.5 h-3.5" />
            <span>บัญชีทดสอบตามบทบาท (คลิกเพื่อเลือก):</span>
          </div>

          <div className="space-y-1.5 text-xs">
            <button
              type="button"
              onClick={() => handleQuickFill('admin', 'password123')}
              className="w-full p-2.5 rounded-lg bg-slate-950/60 hover:bg-slate-950 border border-slate-800 hover:border-amber-400/40 text-left flex items-center justify-between transition-colors"
            >
              <div>
                <span className="font-semibold text-amber-300">Admin (ผู้ดูแลระบบ)</span>
                <span className="text-[11px] text-slate-400 block">จัดการกิจกรรม, ตั้งค่า, ส่งออก Excel</span>
              </div>
              <span className="text-[11px] font-mono text-cyan-400">admin</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickFill('staff01', 'password123')}
              className="w-full p-2.5 rounded-lg bg-slate-950/60 hover:bg-slate-950 border border-slate-800 hover:border-cyan-400/40 text-left flex items-center justify-between transition-colors"
            >
              <div>
                <span className="font-semibold text-cyan-300">Staff (เจ้าหน้าที่บริการลูกค้า)</span>
                <span className="text-[11px] text-slate-400 block">ตรวจสอบการสมัคร, บันทึกการมอบของที่ระลึก</span>
              </div>
              <span className="text-[11px] font-mono text-cyan-400">staff01</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickFill('executive', 'password123')}
              className="w-full p-2.5 rounded-lg bg-slate-950/60 hover:bg-slate-950 border border-slate-800 hover:border-purple-400/40 text-left flex items-center justify-between transition-colors"
            >
              <div>
                <span className="font-semibold text-purple-300">Viewer (ผู้บริหาร)</span>
                <span className="text-[11px] text-slate-400 block">ดู Dashboard สถิติและรายงานสรุป</span>
              </div>
              <span className="text-[11px] font-mono text-cyan-400">executive</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
