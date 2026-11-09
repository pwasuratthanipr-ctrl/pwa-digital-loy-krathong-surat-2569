/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
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

  // Initialize and handle back/forward browser history
  useEffect(() => {
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
    return () => window.removeEventListener('popstate', handlePopState);
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
    </div>
  );
}
