import React, { useState, useEffect } from 'react';
import { Waves, Sparkles, Shield, User, Download, Volume2, VolumeX, Menu, X, ArrowRight, Music } from 'lucide-react';
import { AuthService } from '../../services/api';
import { soundService } from '../../services/soundService';
import { AdminProfile } from '../../types';

interface NavbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPath, onNavigate }) => {
  const [user, setUser] = useState<AdminProfile | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setUser(AuthService.getUser());

    // Sync sound state from soundService
    const unsubscribe = soundService.subscribe((playing) => {
      setSoundEnabled(playing);
    });

    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      unsubscribe();
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, [currentPath]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  // Toggle soft Loy Krathong background melody
  const handleToggleMusic = () => {
    soundService.toggleBgm();
  };

  const navItems = [
    { label: 'หน้าแรก', path: '/' },
    { label: 'ลอยกระทงออนไลน์', path: '/krathong' },
    { label: 'บริการออนไลน์ กปภ.', path: '/online-services' },
    { label: 'ความเป็นส่วนตัว (PDPA)', path: '/privacy' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-[#073B66]/90 backdrop-blur-md border-b border-cyan-500/20 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          
          {/* Logo & Agency Identity */}
          <div
            onClick={() => onNavigate('/')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            {/* Official PWA Logo */}
            <img
              src="/assets/aistudio/logo_PWA_4b69b17d.jpg"
              alt="โลโก้ การประปาส่วนภูมิภาค"
              className="w-11 h-11 rounded-xl object-contain bg-white/10 p-0.5 border border-white/20 shadow-md shadow-cyan-950/50 group-hover:scale-105 transition-transform"
            />

            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-heading font-bold text-white text-base sm:text-lg tracking-tight">
                  กปภ.สาขาสุราษฎร์ธานี (ชั้นพิเศษ)
                </span>
                <span className="text-[10px] font-semibold text-amber-300 bg-amber-500/20 border border-amber-400/30 px-1.5 py-0.5 rounded">
                  ๒๕๖๙
                </span>
              </div>
              <span className="text-xs text-sky-200/90 hidden sm:inline">
                ลอยกระทงออนไลน์ ส่งความสุข ไม่เพิ่มขยะ • PWA Digital Loy Krathong
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(item => {
              const isActive = currentPath === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => onNavigate(item.path)}
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/40 shadow-sm'
                      : 'text-slate-200 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden lg:flex items-center gap-3">
            {/* Loy Krathong Background Music Toggle */}
            <button
              onClick={handleToggleMusic}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all shadow-sm cursor-pointer ${
                soundEnabled
                  ? 'bg-amber-400/20 text-amber-300 border-amber-400/50 shadow-amber-950/40 ring-1 ring-amber-400/30'
                  : 'bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 border-cyan-500/20'
              }`}
              title={soundEnabled ? 'กดเพื่อปิดเพลงลอยกระทง' : 'กดเพื่อเปิดเพลงลอยกระทง (ดนตรีไทยบรรเลงเบาๆ)'}
            >
              <Music className={`w-3.5 h-3.5 ${soundEnabled ? 'text-amber-300 animate-bounce' : 'text-slate-400'}`} />
              <span>{soundEnabled ? '🎵 เพลงลอยกระทง (เปิด)' : 'เปิดเพลงลอยกระทง'}</span>
            </button>

            {/* PWA Install Button (if available) */}
            {deferredPrompt && (
              <button
                onClick={handleInstallClick}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-700/60 hover:bg-cyan-600 text-white text-xs font-medium rounded-lg border border-cyan-400/30 shadow transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>ติดตั้ง PWA</span>
              </button>
            )}

            {/* Staff / Admin Portal Link */}
            {user ? (
              <button
                onClick={() => onNavigate('/admin/dashboard')}
                className="flex items-center gap-2 px-3.5 py-1.5 bg-gradient-to-r from-amber-500/20 to-amber-600/20 border border-amber-400/40 text-amber-200 hover:text-white hover:border-amber-400 rounded-lg text-xs font-medium transition-all shadow"
              >
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                <span>แดชบอร์ด ({user.role})</span>
              </button>
            ) : (
              <button
                onClick={() => onNavigate('/admin/login')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-sky-200 hover:text-white hover:bg-white/10 rounded-lg border border-cyan-400/20 transition-all"
              >
                <User className="w-3.5 h-3.5" />
                <span>เจ้าหน้าที่ กปภ.</span>
              </button>
            )}

            {/* Start Float CTA */}
            {currentPath !== '/krathong' && currentPath !== '/wish' && currentPath !== '/float' && (
              <button
                onClick={() => onNavigate('/krathong')}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#0077B6] to-[#00B4D8] hover:from-[#0284C7] hover:to-[#38BDF8] text-white text-sm font-semibold rounded-lg shadow-md shadow-cyan-950/40 border border-white/20 transition-all active:scale-95 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>เริ่มลอยกระทง</span>
              </button>
            )}
          </div>

          {/* Mobile Action Controls */}
          <div className="flex md:hidden items-center gap-2">
            {/* Mobile Music Toggle */}
            <button
              onClick={handleToggleMusic}
              className={`p-2 rounded-lg border text-xs transition-colors cursor-pointer ${
                soundEnabled ? 'bg-amber-400/20 text-amber-300 border-amber-400/50 shadow' : 'bg-white/5 text-slate-300 border-white/10'
              }`}
              title={soundEnabled ? 'ปิดเพลงลอยกระทง' : 'เปิดเพลงลอยกระทง'}
              aria-label="Toggle Loy Krathong Music"
            >
              <Music className={`w-4 h-4 ${soundEnabled ? 'text-amber-300 animate-pulse' : 'text-slate-300'}`} />
            </button>

            <button
              onClick={() => onNavigate('/krathong')}
              className="px-2.5 py-1.5 bg-gradient-to-r from-[#0077B6] to-[#00B4D8] text-white text-xs font-semibold rounded-lg shadow cursor-pointer"
            >
              ลอยกระทง
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-200 hover:text-white rounded-lg hover:bg-white/10"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#073B66] border-b border-cyan-500/30 px-4 pt-2 pb-5 space-y-2">
          {navItems.map(item => (
            <button
              key={item.path}
              onClick={() => {
                onNavigate(item.path);
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium ${
                currentPath === item.path
                  ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/30'
                  : 'text-slate-200 hover:bg-white/5'
              }`}
            >
              {item.label}
            </button>
          ))}

          <div className="pt-2 border-t border-cyan-900/60 flex flex-col gap-2">
            {user ? (
              <button
                onClick={() => {
                  onNavigate('/admin/dashboard');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm text-amber-300 bg-amber-500/10 border border-amber-400/30 flex items-center justify-between"
              >
                <span>เข้าสู่ระบบแดชบอร์ด ({user.role})</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => {
                  onNavigate('/admin/login');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm text-sky-200 hover:bg-white/5 flex items-center gap-2"
              >
                <User className="w-4 h-4" />
                <span>เข้าสู่ระบบสำหรับเจ้าหน้าที่ กปภ.</span>
              </button>
            )}

            {deferredPrompt && (
              <button
                onClick={handleInstallClick}
                className="w-full text-left px-3 py-2 rounded-lg text-sm text-cyan-200 bg-cyan-900/40 border border-cyan-500/30 flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>ติดตั้ง PWA ลงหน้าจอมือถือ</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
