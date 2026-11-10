import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Download,
  Volume2,
  Volume1,
  VolumeX,
  Play,
  Square,
  Menu,
  X,
  BarChart3,
  ShieldCheck,
} from 'lucide-react';
import { soundService } from '../../services/soundService';
import { APP_CONFIG } from '../../config/appConfig';

interface NavbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPath, onNavigate }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.25);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Sync sound state and volume from soundService
    const unsubscribe = soundService.subscribe((playing, currentVol) => {
      setIsPlaying(playing);
      setVolume(currentVol);
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

  // Play / Stop toggle
  const handleToggleMusic = () => {
    soundService.toggleBgm();
  };

  // Volume slider change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    soundService.setBgmVolume(val);
  };

  const navItems = [
    { label: 'หน้าแรก', path: '/' },
    { label: 'ลอยกระทงออนไลน์', path: '/krathong' },
    { label: 'บริการออนไลน์ กปภ.', path: '/online-services' },
    { label: 'ความเป็นส่วนตัว (PDPA)', path: '/privacy' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-[#073B66]/95 backdrop-blur-md border-b border-cyan-500/20 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          
          {/* Logo & Agency Identity */}
          <div
            onClick={() => onNavigate('/')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            {/* Official PWA Logo */}
            <img
              src={APP_CONFIG.ORGANIZATION.LOGO_PATH}
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

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = currentPath === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => onNavigate(item.path)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
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

          {/* Right Action Controls */}
          <div className="hidden lg:flex items-center gap-3">
            
            {/* Audio Controller: Play/Stop & Volume Slider */}
            <div className="flex items-center bg-slate-900/80 border border-cyan-500/30 rounded-xl p-1 gap-1.5 shadow-inner">
              {/* Play / Stop Button */}
              <button
                onClick={handleToggleMusic}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isPlaying
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow'
                    : 'bg-white/5 text-slate-300 hover:text-white hover:bg-white/10'
                }`}
                title={isPlaying ? 'กดเพื่อหยุดเพลงลอยกระทง' : 'กดเพื่อเริ่มเล่นเพลงลอยกระทง'}
              >
                {isPlaying ? (
                  <>
                    <Square className="w-3 h-3 fill-current" />
                    <span>หยุดเพลง</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3 fill-current" />
                    <span>เปิดเพลง</span>
                  </>
                )}
              </button>

              {/* Volume Button & Popover Slider */}
              <div className="relative flex items-center pr-1.5">
                <button
                  onClick={() => setShowVolumeSlider(!showVolumeSlider)}
                  className="p-1.5 text-slate-300 hover:text-amber-300 transition-colors cursor-pointer"
                  title={`ระดับเสียง: ${Math.round(volume * 100)}%`}
                >
                  {volume === 0 ? (
                    <VolumeX className="w-4 h-4 text-slate-400" />
                  ) : volume < 0.5 ? (
                    <Volume1 className="w-4 h-4 text-cyan-300" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-amber-300" />
                  )}
                </button>

                {/* Inline Slider on Desktop */}
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-18 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-400"
                  title={`ปรับเสียง: ${Math.round(volume * 100)}%`}
                />
              </div>
            </div>

            {/* Admin Stats Button (No Google Forms) */}
            <button
              onClick={() => onNavigate('/admin')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                currentPath === '/admin'
                  ? 'bg-amber-500/25 text-amber-300 border-amber-400/50 shadow-sm'
                  : 'bg-slate-900/80 text-slate-300 hover:text-white hover:bg-slate-800 border-cyan-500/30'
              }`}
              title="ตรวจสอบสถิติผู้เข้าใช้งานและผู้ร่วมกิจกรรมสำหรับผู้ดูแลระบบ"
            >
              <BarChart3 className="w-3.5 h-3.5 text-amber-300" />
              <span>สถิติผู้ดูแลระบบ</span>
            </button>

            {/* Start Float CTA */}
            {currentPath !== '/krathong' && currentPath !== '/wish' && currentPath !== '/float' && (
              <button
                onClick={() => onNavigate('/krathong')}
                className="flex items-center gap-2 px-3.5 py-1.5 bg-gradient-to-r from-[#0077B6] to-[#00B4D8] hover:from-[#0284C7] hover:to-[#38BDF8] text-white text-xs font-semibold rounded-xl shadow-md border border-white/20 transition-all active:scale-95 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>ลอยกระทง</span>
              </button>
            )}
          </div>

          {/* Mobile Action Controls */}
          <div className="flex md:hidden items-center gap-2">
            {/* Mobile Music Play/Stop Toggle */}
            <button
              onClick={handleToggleMusic}
              className={`p-2 rounded-lg border text-xs transition-colors cursor-pointer ${
                isPlaying
                  ? 'bg-amber-400 text-slate-950 border-amber-300 shadow'
                  : 'bg-white/5 text-slate-300 border-white/10'
              }`}
              title={isPlaying ? 'หยุดเพลง' : 'เปิดเพลงลอยกระทง'}
              aria-label="Toggle Loy Krathong Music"
            >
              {isPlaying ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
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
          {navItems.map((item) => (
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

          {/* Mobile Volume Control */}
          <div className="p-3 bg-slate-900/70 rounded-xl border border-cyan-800/60 space-y-1.5 mt-2">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-amber-300" />
                <span>ระดับเสียงเพลงประกอบ:</span>
              </span>
              <span className="font-mono text-amber-300">{Math.round(volume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={handleVolumeChange}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />
          </div>

          {/* Admin Stats Link on Mobile (No Google Forms) */}
          <div className="pt-2">
            <button
              onClick={() => {
                onNavigate('/admin');
                setMobileMenuOpen(false);
              }}
              className="w-full py-2.5 px-3 bg-gradient-to-r from-cyan-950 to-[#052949] border border-amber-400/40 text-amber-300 rounded-xl text-xs font-semibold flex items-center justify-between shadow"
            >
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-amber-300" />
                <span>สถิติสำหรับผู้ดูแลระบบ (Admin Dashboard)</span>
              </div>
              <span className="text-[10px] bg-amber-400/20 px-1.5 py-0.5 rounded border border-amber-400/30">
                รหัส 1662
              </span>
            </button>
          </div>

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
      )}
    </header>
  );
};
