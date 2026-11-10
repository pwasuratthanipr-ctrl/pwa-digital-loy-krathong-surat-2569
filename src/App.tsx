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
import { AdminStatsPage } from './pages/AdminStatsPage';
import { StorageService } from './services/storageService';
import { KrathongTypeId } from './types';

export default function App() {
  const [currentPath, setCurrentPath] = useState<string>('/');
  const [selectedKrathong, setSelectedKrathong] = useState<KrathongTypeId>('pwa_blue');
  const [nickname, setNickname] = useState<string>('');
  const [wishText, setWishText] = useState<string>('ขอให้ครอบครัวมีความสุข สุขภาพแข็งแรง และร่วมรักษาสายน้ำตาปี');
  const [shareConsent, setShareConsent] = useState<boolean>(true);
  const [participantCode, setParticipantCode] = useState<string>('');
  const [floatedAt, setFloatedAt] = useState<string>('');

  // Handle browser routing and record site visit for Admin Stats
  useEffect(() => {
    // Record visit in client storage
    StorageService.recordVisit();

    const normalizePath = () => {
      const hash = window.location.hash.replace(/^#/, '');
      const pathname = window.location.pathname || '/';
      return hash ? `/${hash.replace(/^\//, '')}` : pathname;
    };

    const initial = normalizePath();
    if (initial !== currentPath) {
      setCurrentPath(initial);
    }

    const handleLocationChange = () => {
      setCurrentPath(normalizePath());
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
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

  return (
    <div className="min-h-screen flex flex-col bg-[#021124] text-slate-100">
      {/* Universal Top Navigation with Music Controls & Admin Stats Link */}
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
            participantCode={participantCode || 'LK69-000188'}
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

        {(currentPath === '/admin' || currentPath === '/stats') && (
          <AdminStatsPage onNavigate={navigateTo} />
        )}

        {/* Fallback to Home if unknown route */}
        {currentPath !== '/' &&
          currentPath !== '/krathong' &&
          currentPath !== '/wish' &&
          currentPath !== '/float' &&
          currentPath !== '/success' &&
          currentPath !== '/online-services' &&
          currentPath !== '/privacy' &&
          currentPath !== '/admin' &&
          currentPath !== '/stats' && (
            <HomePage onNavigate={navigateTo} />
          )}
      </main>

      {/* Universal Footer */}
      <Footer onNavigate={navigateTo} />
    </div>
  );
}
