/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  getSavedUser,
  saveUser,
  isUserLoggedIn,
  setLoggedIn,
  switchDemoUser,
  getCurrentDistrict,
  setCurrentDistrict,
  getHospitals,
  getHospitalsByDistrict,
  getQueues,
  cancelQueue,
  advanceQueue,
  addQueue,
  getNotifications,
  addNotification,
} from './services/storage';
import { Hospital, QueueTicket, UserProfile, NotificationItem } from './types';
import { DeviceFrameToggle } from './components/DeviceFrameToggle';
import { HeaderStatusBar } from './components/HeaderStatusBar';
import { BottomNavBar, ScreenTab } from './components/BottomNavBar';
import { QrCodeModal } from './components/QrCodeModal';
import { HospitalDetailModal } from './components/HospitalDetailModal';
import { DoctorSummaryModal } from './components/DoctorSummaryModal';
import { HealthcareRightsModal } from './components/HealthcareRightsModal';
import { InsuranceNetworkModal } from './components/InsuranceNetworkModal';
import { NotificationSheet } from './components/NotificationSheet';
import { CodeExplorerModal } from './components/CodeExplorerModal';
import { LoginView } from './views/LoginView';
import { HomeView } from './views/HomeView';
import { TriageView } from './views/TriageView';
import { ChatView } from './views/ChatView';
import { HistoryView } from './views/HistoryView';
import { ProfileView } from './views/ProfileView';
import { NearbyHospitalsMapView } from './views/NearbyHospitalsMapView';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile>(getSavedUser());
  const [loggedIn, setLoggedInState] = useState<boolean>(() => {
    // Default to true for instant preview, unless explicitly logged out
    const stored = localStorage.getItem('innotector_logged_in');
    return stored === null ? true : stored === 'true';
  });

  const [currentTab, setCurrentTab] = useState<ScreenTab>('home');
  const [isTriageActive, setIsTriageActive] = useState<boolean>(false);
  const [isMapActive, setIsMapActive] = useState<boolean>(false);
  const [currentDistrict, setDistrictState] = useState<string>(getCurrentDistrict());
  const [hospitals, setHospitals] = useState<Hospital[]>(() => getHospitalsByDistrict(currentDistrict));
  const [queues, setQueues] = useState<QueueTicket[]>(() => getQueues());
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => getNotifications());
  const [isNotificationOpen, setIsNotificationOpen] = useState<boolean>(false);

  // Layout & frame state
  const [isMobileFrame, setIsMobileFrame] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem('innotector_sound_enabled') !== 'false';
  });

  // Modals state
  const [isQrModalOpen, setIsQrModalOpen] = useState<boolean>(false);
  const [isDoctorSummaryOpen, setIsDoctorSummaryOpen] = useState<boolean>(false);
  const [isHealthcareRightsOpen, setIsHealthcareRightsOpen] = useState<boolean>(false);
  const [isInsuranceNetworkOpen, setIsInsuranceNetworkOpen] = useState<boolean>(false);
  const [isCodeExplorerOpen, setIsCodeExplorerOpen] = useState<boolean>(false);
  const [qrModalTicket, setQrModalTicket] = useState<QueueTicket | null>(null);
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);

  // Triage to doctor chat forward
  const [forwardedTriageSummary, setForwardedTriageSummary] = useState<string | undefined>(undefined);

  // Listeners for multi-component storage updates
  useEffect(() => {
    const onUserUpdate = (e: Event) => {
      const custom = e as CustomEvent<UserProfile>;
      if (custom.detail) setCurrentUser(custom.detail);
    };

    const onQueueUpdate = (e: Event) => {
      const custom = e as CustomEvent<QueueTicket[]>;
      if (custom.detail) setQueues(custom.detail);
    };

    const onDistrictUpdate = (e: Event) => {
      const custom = e as CustomEvent<string>;
      if (custom.detail) {
        setDistrictState(custom.detail);
        setHospitals(getHospitalsByDistrict(custom.detail));
      }
    };

    const onNotifUpdate = (e: Event) => {
      const custom = e as CustomEvent<NotificationItem[]>;
      if (custom.detail) setNotifications(custom.detail);
    };

    window.addEventListener('innotector_user_updated', onUserUpdate);
    window.addEventListener('innotector_queues_updated', onQueueUpdate);
    window.addEventListener('innotector_district_updated', onDistrictUpdate);
    window.addEventListener('innotector_notifications_updated', onNotifUpdate);

    return () => {
      window.removeEventListener('innotector_user_updated', onUserUpdate);
      window.removeEventListener('innotector_queues_updated', onQueueUpdate);
      window.removeEventListener('innotector_district_updated', onDistrictUpdate);
      window.removeEventListener('innotector_notifications_updated', onNotifUpdate);
    };
  }, []);

  const handleTriggerGpsCheck = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude.toFixed(4);
          const lng = pos.coords.longitude.toFixed(4);
          addNotification({
            title: 'ระบบจับพิกัดสดของคุณสำเร็จ',
            subtitle: `พิกัดปัจจุบัน: ${lat}, ${lng} ในพื้นที่ ${currentDistrict}`,
            time: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
            color: 'sky',
            linkTab: 'home',
          });
        },
        () => {
          addNotification({
            title: 'ระบบระบุตำแหน่งพื้นที่ปัจจุบัน',
            subtitle: `พิกัดอ้างอิง: 13.7224, 100.3802 (${currentDistrict})`,
            time: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
            color: 'sky',
            linkTab: 'home',
          });
        }
      );
    }
  };

  // Periodic subtle queue advancement for realism
  useEffect(() => {
    const interval = setInterval(() => {
      setHospitals((prev) =>
        prev.map((h) => {
          // randomly tweak waiting count by +-1 to give live feel
          const delta = Math.random() > 0.6 ? (Math.random() > 0.5 ? 1 : -1) : 0;
          const nextCount = Math.max(1, h.totalWaitingCount + delta);
          return {
            ...h,
            totalWaitingCount: nextCount,
          };
        })
      );
    }, 20000);

    return () => clearInterval(interval);
  }, []);

  const handleDistrictChange = (district: string) => {
    setDistrictState(district);
    setCurrentDistrict(district);
    setHospitals(getHospitalsByDistrict(district));
  };

  const handleSwitchUser = (userId: string) => {
    const updated = switchDemoUser(userId);
    setCurrentUser(updated);
  };

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem('innotector_sound_enabled', next ? 'true' : 'false');
  };

  const handleOpenQrModal = (ticket?: QueueTicket) => {
    setQrModalTicket(ticket || null);
    setIsQrModalOpen(true);
  };

  const handleCancelQueue = (ticketId: string) => {
    cancelQueue(ticketId);
    setQueues(getQueues());
  };

  const handleAdvanceActiveQueue = () => {
    const active = queues.find((q) => q.status === 'waiting');
    if (active) {
      advanceQueue(active.id);
      setQueues(getQueues());
    }
  };

  const handleTabChange = (tab: ScreenTab) => {
    setIsTriageActive(false);
    setIsMapActive(false);
    setCurrentTab(tab);
  };

  const handleBookingCompleted = (ticket: QueueTicket) => {
    setIsTriageActive(false);
    setIsMapActive(false);
    setQueues(getQueues());
    setQrModalTicket(ticket);
    setIsQrModalOpen(true);
    setCurrentTab('history');
  };

  const handleConsultDoctor = (summary: string) => {
    setForwardedTriageSummary(summary);
    setIsTriageActive(false);
    setIsMapActive(false);
    setCurrentTab('messages');
  };

  const handleBookFromHospitalModal = (hospital: Hospital, departmentName: string) => {
    const prefix = departmentName.includes('ฉุกเฉิน') ? 'ER' : 'A';
    const queueNum = `${prefix}-0${Math.floor(10 + Math.random() * 80)}`;

    const newTicket = addQueue({
      userId: currentUser.id,
      hospitalId: hospital.id,
      hospitalName: hospital.name,
      department: departmentName,
      queueNum,
      triageLevel: 'green',
      triageTitle: 'ตรวจตามนัดหมายปกติ (Green Tag)',
      ahead: Math.max(1, hospital.totalWaitingCount),
      estWait: `~${hospital.estWaitMinutes} นาที`,
      symptomsSummary: 'นัดหมายตรวจ ณ จุดบริการห้องตรวจ',
    });

    setSelectedHospital(null);
    handleBookingCompleted(newTicket);
  };

  const activeQueuesList = queues.filter((q) => q.status === 'waiting' || q.status === 'called');

  return (
    <div className="min-h-screen bg-[#0b1329] text-slate-900 flex flex-col items-center">
      {/* Top Device Simulator Controller Bar */}
      <DeviceFrameToggle
        isMobileFrame={isMobileFrame}
        onToggleFrame={() => setIsMobileFrame(!isMobileFrame)}
        currentUser={currentUser}
        onSwitchUser={handleSwitchUser}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        onAdvanceActiveQueue={handleAdvanceActiveQueue}
        hasActiveQueue={activeQueuesList.length > 0}
        onOpenCodeExplorer={() => setIsCodeExplorerOpen(true)}
      />

      {/* Main Container: Mobile Frame vs Wide Frame */}
      <div className="flex-1 w-full flex items-center justify-center p-0 sm:p-4 md:p-6 overflow-hidden">
        <main
          className={`relative bg-[#f8fafc] overflow-hidden flex flex-col transition-all duration-300 ${
            isMobileFrame
              ? 'w-full max-w-[420px] h-[100dvh] sm:h-[880px] sm:rounded-[46px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7),0_0_0_12px_#1e293b]'
              : 'w-full max-w-4xl h-[100dvh] sm:h-[880px] sm:rounded-[36px] shadow-2xl border border-slate-700/60'
          }`}
        >
          {/* Top Status Bar (Only if user is logged in or inside mobile view) */}
          <HeaderStatusBar />

          {/* Screen Content Viewport */}
          <div className="flex-1 overflow-y-auto no-scrollbar relative bg-[#f8fafc]">
            {!loggedIn ? (
              <LoginView
                onLoginSuccess={(user) => {
                  setCurrentUser(user);
                  setLoggedInState(true);
                  setLoggedIn(true, user);
                }}
              />
            ) : isMapActive ? (
              <NearbyHospitalsMapView
                hospitals={hospitals}
                onBack={() => setIsMapActive(false)}
                onSelectHospital={(h) => setSelectedHospital(h)}
              />
            ) : isTriageActive ? (
              <TriageView
                user={currentUser}
                hospitals={getHospitals()}
                currentDistrict={currentDistrict}
                onBookingCompleted={handleBookingCompleted}
                onConsultDoctor={handleConsultDoctor}
                onOpenMap={() => setIsMapActive(true)}
                onBackToHome={() => setIsTriageActive(false)}
              />
            ) : (
              <>
                {currentTab === 'home' && (
                  <HomeView
                    user={currentUser}
                    currentDistrict={currentDistrict}
                    onDistrictChange={handleDistrictChange}
                    hospitals={hospitals}
                    activeQueues={queues}
                    onNavigate={handleTabChange}
                    onStartTriage={() => setIsTriageActive(true)}
                    onOpenMap={() => setIsMapActive(true)}
                    onOpenQrModal={handleOpenQrModal}
                    onOpenHospitalDetail={(h) => setSelectedHospital(h)}
                    onOpenDoctorSummary={() => setIsDoctorSummaryOpen(true)}
                    onOpenHealthcareRights={() => setIsHealthcareRightsOpen(true)}
                    onOpenInsurancePartners={() => setIsInsuranceNetworkOpen(true)}
                    onCancelQueue={handleCancelQueue}
                    onOpenNotifications={() => setIsNotificationOpen(true)}
                    unreadNotificationsCount={notifications.filter((n) => !n.read).length}
                  />
                )}

                {currentTab === 'history' && (
                  <HistoryView
                    queues={queues}
                    user={currentUser}
                    onOpenQrModal={handleOpenQrModal}
                    onCancelQueue={handleCancelQueue}
                  />
                )}

                {currentTab === 'messages' && (
                  <ChatView
                    user={currentUser}
                    initialSummary={forwardedTriageSummary}
                    onClose={() => setCurrentTab('home')}
                  />
                )}

                {currentTab === 'account' && (
                  <ProfileView
                    user={currentUser}
                    onUpdateUser={(u) => setCurrentUser(u)}
                    onLogout={() => {
                      setLoggedInState(false);
                      setLoggedIn(false);
                      setIsTriageActive(false);
                      setIsMapActive(false);
                      setCurrentTab('home');
                    }}
                    onOpenQrModal={() => handleOpenQrModal()}
                    onOpenDoctorSummary={() => setIsDoctorSummaryOpen(true)}
                    onOpenHealthcareRights={() => setIsHealthcareRightsOpen(true)}
                    onOpenInsurancePartners={() => setIsInsuranceNetworkOpen(true)}
                    onOpenNotifications={() => setIsNotificationOpen(true)}
                    unreadNotificationsCount={notifications.filter((n) => !n.read).length}
                    onOpenCodeExplorer={() => setIsCodeExplorerOpen(true)}
                  />
                )}
              </>
            )}
          </div>

          {/* Bottom Navigation Bar */}
          {loggedIn && (
            <BottomNavBar
              currentTab={currentTab}
              onTabChange={handleTabChange}
              activeQueueCount={activeQueuesList.length}
            />
          )}

          {/* Modals */}
          <QrCodeModal
            isOpen={isQrModalOpen}
            onClose={() => setIsQrModalOpen(false)}
            ticket={qrModalTicket}
            user={currentUser}
          />

          <HospitalDetailModal
            hospital={selectedHospital}
            isOpen={selectedHospital !== null}
            onClose={() => setSelectedHospital(null)}
            onBookQueue={handleBookFromHospitalModal}
          />

          <DoctorSummaryModal
            isOpen={isDoctorSummaryOpen}
            onClose={() => setIsDoctorSummaryOpen(false)}
            user={currentUser}
            latestQueue={queues[0] || null}
          />

          <HealthcareRightsModal
            isOpen={isHealthcareRightsOpen}
            onClose={() => setIsHealthcareRightsOpen(false)}
            user={currentUser}
          />

          <InsuranceNetworkModal
            isOpen={isInsuranceNetworkOpen}
            onClose={() => setIsInsuranceNetworkOpen(false)}
            user={currentUser}
          />

          <NotificationSheet
            isOpen={isNotificationOpen}
            onClose={() => setIsNotificationOpen(false)}
            notifications={notifications}
            onUpdateNotifications={(items) => setNotifications(items)}
            onNavigateTab={(tab) => handleTabChange(tab)}
            onTriggerGpsCheck={handleTriggerGpsCheck}
          />

          <CodeExplorerModal
            isOpen={isCodeExplorerOpen}
            onClose={() => setIsCodeExplorerOpen(false)}
          />
        </main>
      </div>
    </div>
  );
}
