/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Music } from 'lucide-react';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { HomePage } from './pages/HomePage';
import { SelectKrathongPage } from './pages/SelectKrathongPage';
import { WishPage } from './pages/WishPage';
import { FloatingAnimationPage } from './pages/FloatingAnimationPage';
import { SuccessPage } from './pages/SuccessPage';
import { OnlineServicesPage } from './pages/OnlineServicesPage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AuthService } from './services/api';
import { soundService } from './services/soundService';
import { AdminProfile, KrathongTypeId } from './types';

export default function App() {
  const [currentPath, setCurrentPath] = useState<string>('/');
  const [selectedKrathong, setSelectedKrathong] = useState<KrathongTypeId>('pwa_blue');
  const [nickname, setNickname] = useState<string>('');
  const [wishText, setWishText] = useState<string>('ขอให้ครอบครัวมีความสุข สุขภาพแข็งแรง และร่วมรักษาสายน้ำตาปี');
  const [shareConsent, setShareConsent] = useState<boolean>(true);
  const [participantCode, setParticipantCode] = useState<string>('');
  const [floatedAt, setFloatedAt] = useState<string>('');
  const [currentUser, setCurrentUser] = useState<AdminProfile | null>(null);
  const [isMusicWaiting, setIsMusicWaiting] = useState<boolean>(false);

  // Initialize and handle back/forward browser history & auto-play background music
  useEffect(() => {
    // Automatically start background music on page load
    soundService.autoStartOnLoad();

    // Subscribe to sound state to know if browser blocked autoplay awaiting user gesture
    const unsub = soundService.subscribe((playing, waiting) => {
      setIsMusicWaiting(waiting && !playing);
    });

    // Check initial user session
    const u = AuthService.getUser();
    if (u) setCurrentUser(u);

    // Initial path from window location pathname
    const pathname = window.location.pathname || '/';
    if (pathname !== currentPath) {
      setCurrentPath(pathname);
    }

    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => {
      unsub();
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const navigateTo = (path: string) => {
    setCurrentPath(path);
    window.history.pushState({}, '', path);
    window.scrollTo(0, 0);
  };

  const handleFloatingCompleted = (data: {
    participantCode: string;
    floatedAt: string;
    nickname: string;
    wishText: string;
  }) => {
    setParticipantCode(data.participantCode);
    setFloatedAt(data.floatedAt);
    navigateTo('/success');
  };

  const handleResetFlow = () => {
    setParticipantCode('');
    setFloatedAt('');
    setSelectedKrathong('pwa_blue');
    setWishText('ขอให้ครอบครัวมีความสุข สุขภาพแข็งแรง และร่วมรักษาสายน้ำตาปี');
    navigateTo('/krathong');
  };

  const handleAdminLogout = () => {
    AuthService.logout();
    setCurrentUser(null);
    navigateTo('/admin/login');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#021124] text-slate-100">
      {/* Universal Top Navigation */}
      <Navbar currentPath={currentPath} onNavigate={navigateTo} />

      {/* Main Page Content Router */}
      <main className="flex-1">
        {currentPath === '/' && (
          <HomePage onNavigate={navigateTo} />
        )}

        {currentPath === '/krathong' && (
          <SelectKrathongPage
            selectedKrathong={selectedKrathong}
            onSelect={setSelectedKrathong}
            onNext={() => navigateTo('/wish')}
            onBack={() => navigateTo('/')}
          />
        )}

        {currentPath === '/wish' && (
          <WishPage
            selectedKrathong={selectedKrathong}
            nickname={nickname}
            wishText={wishText}
            shareConsent={shareConsent}
            onUpdateNickname={setNickname}
            onUpdateWishText={setWishText}
            onUpdateShareConsent={setShareConsent}
            onNext={() => navigateTo('/float')}
            onBack={() => navigateTo('/krathong')}
          />
        )}

        {currentPath === '/float' && (
          <div className="py-8 px-4">
            <FloatingAnimationPage
              selectedKrathong={selectedKrathong}
              nickname={nickname}
              wishText={wishText}
              shareConsent={shareConsent}
              onCompleted={handleFloatingCompleted}
              onCancel={() => navigateTo('/wish')}
            />
          </div>
        )}

        {currentPath === '/success' && (
          <SuccessPage
            participantCode={participantCode || 'LK69-000108'}
            krathongType={selectedKrathong}
            nickname={nickname || 'ผู้ร่วมอนุรักษ์สายน้ำ'}
            wishText={wishText}
            floatedAt={floatedAt || new Date().toISOString()}
            onNavigate={navigateTo}
            onReset={handleResetFlow}
          />
        )}

        {currentPath === '/online-services' && (
          <OnlineServicesPage
            onNavigate={navigateTo}
            participantCode={participantCode}
          />
        )}

        {currentPath === '/privacy' && (
          <PrivacyPolicyPage onNavigate={navigateTo} />
        )}

        {currentPath === '/admin/login' && (
          <AdminLoginPage
            onLoginSuccess={(user) => {
              setCurrentUser(user);
              navigateTo('/admin/dashboard');
            }}
            onBack={() => navigateTo('/')}
          />
        )}

        {currentPath === '/admin/dashboard' && (
          currentUser ? (
            <AdminDashboardPage
              currentUser={currentUser}
              onLogout={handleAdminLogout}
              onNavigateHome={() => navigateTo('/')}
            />
          ) : (
            <AdminLoginPage
              onLoginSuccess={(user) => {
                setCurrentUser(user);
                navigateTo('/admin/dashboard');
              }}
              onBack={() => navigateTo('/')}
            />
          )
        )}
      </main>

      {/* Universal Footer */}
      <Footer onNavigate={navigateTo} />

      {/* Floating Autoplay Activation Pill - appears only if browser autoplay policy delays playback */}
      {isMusicWaiting && (
        <aside
          role="status"
          aria-live="polite"
          onClick={() => {
            soundService.startBgm();
          }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-5 py-3 rounded-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-heading font-extrabold text-xs sm:text-sm shadow-2xl shadow-amber-950/90 border-2 border-white/80 cursor-pointer animate-bounce hover:scale-105 active:scale-95 transition-all"
        >
          <div className="w-6 h-6 rounded-full bg-slate-950/20 flex items-center justify-center">
            <Music className="w-3.5 h-3.5 text-slate-950 animate-pulse" />
          </div>
          <span>แตะที่นี่เพื่อเปิดเพลงลอยกระทง 🎵</span>
        </aside>
      )}
    </div>
  );
}
