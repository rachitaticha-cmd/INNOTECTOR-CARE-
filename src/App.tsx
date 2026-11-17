/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';
import { onAuthStateChanged, signOut, type User as FirebaseUser } from 'firebase/auth';
import { Loader2 } from 'lucide-react';
import { auth } from './firebase';
import {
  cancelQueueTicketInFirestore,
  createNotificationInFirestore,
  createQueueTicketInFirestore,
  ensureUserProfile,
  markNotificationReadInFirestore,
  saveUserProfileToFirestore,
  subscribeUserNotifications,
  subscribeUserProfile,
  subscribeUserQueues,
  subscribeUserTriages,
} from './services/firestoreService';
import { createEmptyUserProfile, getCurrentDistrict } from './services/storage';
import { detectUserThailandGPS, LivePlaceFacility } from './services/realPlaces';
import {
  Hospital,
  NotificationItem,
  QueueTicket,
  TriageAssessment,
  UserProfile,
} from './types';
import { HeaderStatusBar } from './components/HeaderStatusBar';
import { BottomNavBar, ScreenTab } from './components/BottomNavBar';
import { QrCodeModal } from './components/QrCodeModal';
import { HospitalDetailModal } from './components/HospitalDetailModal';
import { DoctorSummaryModal } from './components/DoctorSummaryModal';
import { HealthcareRightsModal } from './components/HealthcareRightsModal';
import { InsuranceNetworkModal } from './components/InsuranceNetworkModal';
import { NotificationSheet } from './components/NotificationSheet';
import { LoginView } from './views/LoginView';
import { HomeView } from './views/HomeView';
import { TriageView } from './views/TriageView';
import { ChatView } from './views/ChatView';
import { HistoryView } from './views/HistoryView';
import { ProfileView } from './views/ProfileView';
import { NearbyHospitalsMapView } from './views/NearbyHospitalsMapView';
import { InotectorLogo } from './components/InotectorLogo';

export default function App() {
  const [authReady, setAuthReady] = useState<boolean>(false);
  const [loggedIn, setLoggedIn] = useState<boolean>(false);
  const [pendingVerificationUser, setPendingVerificationUser] = useState<FirebaseUser | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authRefreshTick, setAuthRefreshTick] = useState<number>(0);
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => createEmptyUserProfile());

  const [currentTab, setCurrentTab] = useState<ScreenTab>('home');
  const [isTriageActive, setIsTriageActive] = useState<boolean>(false);
  const [isMapActive, setIsMapActive] = useState<boolean>(false);
  const [mapFocusFacility, setMapFocusFacility] = useState<LivePlaceFacility | null>(null);

  const [queues, setQueues] = useState<QueueTicket[]>([]);
  const [triages, setTriages] = useState<TriageAssessment[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isNotificationOpen, setIsNotificationOpen] = useState<boolean>(false);

  // Modals state
  const [isQrModalOpen, setIsQrModalOpen] = useState<boolean>(false);
  const [isDoctorSummaryOpen, setIsDoctorSummaryOpen] = useState<boolean>(false);
  const [isHealthcareRightsOpen, setIsHealthcareRightsOpen] = useState<boolean>(false);
  const [isInsuranceNetworkOpen, setIsInsuranceNetworkOpen] = useState<boolean>(false);
  const [qrModalTicket, setQrModalTicket] = useState<QueueTicket | null>(null);
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);

  const [forwardedTriageSummary, setForwardedTriageSummary] = useState<string | undefined>(undefined);
  const [isGmpQuotaExceeded, setIsGmpQuotaExceeded] = useState<boolean>(false);

  useEffect(() => {
    const onQuotaExceeded = () => setIsGmpQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', onQuotaExceeded);
    return () => window.removeEventListener('gmp-quota-exceeded', onQuotaExceeded);
  }, []);

  // Firebase Auth listener + real Firestore subscriptions
  useEffect(() => {
    let unsubProfile: (() => void) | null = null;
    let unsubQueues: (() => void) | null = null;
    let unsubTriages: (() => void) | null = null;
    let unsubNotifs: (() => void) | null = null;

    const cleanupSubscriptions = () => {
      unsubProfile?.();
      unsubQueues?.();
      unsubTriages?.();
      unsubNotifs?.();
      unsubProfile = null;
      unsubQueues = null;
      unsubTriages = null;
      unsubNotifs = null;
    };

    const hydrateVerifiedUser = async (fbUser: FirebaseUser) => {
      const profile = await ensureUserProfile(fbUser);
      setCurrentUser(profile);
      setPendingVerificationUser(null);
      setAuthError(null);
      setLoggedIn(true);

      unsubProfile = subscribeUserProfile(fbUser.uid, (p) => setCurrentUser(p));
      unsubQueues = subscribeUserQueues(fbUser.uid, (qList) => setQueues(qList));
      unsubTriages = subscribeUserTriages(fbUser.uid, (tList) => setTriages(tList));
      unsubNotifs = subscribeUserNotifications(fbUser.uid, (nList) => setNotifications(nList));
    };

    const unsubAuth = onAuthStateChanged(auth, async (fbUser) => {
      cleanupSubscriptions();

      if (!fbUser) {
        setLoggedIn(false);
        setPendingVerificationUser(null);
        setCurrentUser(createEmptyUserProfile());
        setQueues([]);
        setTriages([]);
        setNotifications([]);
        setIsTriageActive(false);
        setIsMapActive(false);
        setAuthReady(true);
        return;
      }

      if (!fbUser.emailVerified) {
        setLoggedIn(false);
        if (!fbUser.email) {
          setPendingVerificationUser(null);
          setAuthError('บัญชีโซเชียลนี้ไม่ได้แชร์อีเมลที่ยืนยันแล้ว กรุณาเข้าสู่ระบบด้วย Google หรืออีเมล');
        } else {
          setPendingVerificationUser(fbUser);
        }
        setAuthReady(true);
        return;
      }

      try {
        await hydrateVerifiedUser(fbUser);
      } catch {
        setAuthError('ไม่สามารถเชื่อมต่อข้อมูลผู้ใช้กับฐานข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
        setLoggedIn(false);
      } finally {
        setAuthReady(true);
      }
    });

    return () => {
      cleanupSubscriptions();
      unsubAuth();
    };
  }, [authRefreshTick]);

  const handleTriggerGpsCheck = async () => {
    if (!currentUser.id) return;
    const gps = await detectUserThailandGPS();
    await createNotificationInFirestore(currentUser.id, {
      title: gps.isLiveGps ? 'จับพิกัด GPS สดของคุณสำเร็จ' : 'สถานะการตรวจจับพิกัด GPS',
      subtitle: gps.statusText,
      time: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
      color: gps.isLiveGps ? 'sky' : 'amber',
      linkTab: 'home',
    });
  };

  const handleOpenQrModal = (ticket?: QueueTicket) => {
    setQrModalTicket(ticket || null);
    setIsQrModalOpen(true);
  };

  const handleCancelQueue = async (ticketId: string) => {
    if (!currentUser.id) return;
    await cancelQueueTicketInFirestore(currentUser.id, ticketId);
  };

  const handleUpdateUser = async (updated: UserProfile) => {
    if (!currentUser.id) return;
    const saved = await saveUserProfileToFirestore(currentUser.id, updated);
    setCurrentUser(saved);
  };

  const handleMarkNotificationRead = async (notifId: string) => {
    if (!currentUser.id) return;
    await markNotificationReadInFirestore(currentUser.id, notifId);
  };

  const handleMarkAllNotificationsRead = async () => {
    if (!currentUser.id) return;
    const unread = notifications.filter((n) => !n.read);
    await Promise.all(unread.map((n) => markNotificationReadInFirestore(currentUser.id, n.id)));
  };

  const handleTabChange = (tab: ScreenTab) => {
    setIsTriageActive(false);
    setIsMapActive(false);
    setMapFocusFacility(null);
    setCurrentTab(tab);
  };

  const handleOpenMap = (focusFacility?: LivePlaceFacility) => {
    setMapFocusFacility(focusFacility || null);
    setIsTriageActive(false);
    setIsMapActive(true);
  };

  const handleBookingCompleted = async (ticket: QueueTicket) => {
    setIsTriageActive(false);
    setIsMapActive(false);
    setQrModalTicket(ticket);
    setIsQrModalOpen(true);
    setCurrentTab('history');

    if (currentUser.id) {
      await createNotificationInFirestore(currentUser.id, {
        title: `จองคิว ${ticket.queueNum} สำเร็จ`,
        subtitle: `${ticket.hospitalName} • ${ticket.department}`,
        time: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
        color: 'emerald',
        linkTab: 'history',
      });
    }
  };

  const handleConsultDoctor = (summary: string) => {
    setForwardedTriageSummary(summary);
    setIsTriageActive(false);
    setIsMapActive(false);
    setCurrentTab('messages');
  };

  const handleBookFromHospitalModal = async (hospital: Hospital, departmentName: string) => {
    if (!currentUser.id) return;
    const prefix = departmentName.includes('ฉุกเฉิน') ? 'ER' : 'A';
    const queueNum = `${prefix}-0${Math.floor(10 + Math.random() * 80)}`;

    const newTicket = await createQueueTicketInFirestore(currentUser.id, {
      hospitalId: hospital.id,
      hospitalName: hospital.name,
      department: departmentName,
      queueNum,
      triageLevel: 'green',
      triageTitle: 'ตรวจตามนัดหมายปกติ (Green Tag)',
      ahead: Math.max(0, hospital.totalWaitingCount || 1),
      estWait: `~${hospital.estWaitMinutes} นาที`,
      symptomsSummary: 'นัดหมายตรวจ ณ จุดบริการห้องตรวจ',
    });

    setSelectedHospital(null);
    await handleBookingCompleted(newTicket);
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  const activeQueuesList = queues.filter((q) => q.status === 'waiting' || q.status === 'called');
  const mapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  return (
    <APIProvider
      apiKey={mapsApiKey}
      language="th"
      region="TH"
      libraries={['places', 'routes', 'marker']}
    >
      <div className="min-h-screen bg-[#0b1329] text-slate-900 flex flex-col items-center">
        {isGmpQuotaExceeded && (
          <div className="w-full bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
            <span>
              Google Maps Platform quota reached. If you are the app owner, visit{' '}
              <a
                href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-semibold text-amber-950 hover:text-amber-800"
              >
                maps developer site
              </a>{' '}
              for instructions to update your account.
            </span>
          </div>
        )}

        <div className="flex-1 w-full flex items-center justify-center p-0 sm:p-4 md:p-6 overflow-hidden">
          <main className="relative bg-[#f8fafc] overflow-hidden flex flex-col w-full max-w-[420px] h-[100dvh] sm:h-[880px] sm:rounded-[46px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7),0_0_0_12px_#1e293b]">
            <HeaderStatusBar />

            <div className="flex-1 overflow-y-auto no-scrollbar relative bg-[#f8fafc]">
              {!authReady ? (
                <div className="min-h-full bg-[#163d2d] text-white flex flex-col items-center justify-center p-6 gap-4">
                  <InotectorLogo size="lg" textColor="white" />
                  <div className="flex items-center gap-2 text-xs text-emerald-100">
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-300" />
                    <span>กำลังตรวจสอบสถานะบัญชีผู้ใช้งาน...</span>
                  </div>
                </div>
              ) : !loggedIn ? (
                <LoginView
                  externalError={authError}
                  pendingVerificationUser={pendingVerificationUser}
                  onVerificationConfirmed={async () => {
                    await auth.currentUser?.getIdToken(true);
                    setAuthRefreshTick((t) => t + 1);
                  }}
                />
              ) : isMapActive ? (
                <NearbyHospitalsMapView
                  user={currentUser}
                  initialFocusFacility={mapFocusFacility}
                  onBack={() => {
                    setIsMapActive(false);
                    setMapFocusFacility(null);
                  }}
                  onSelectHospital={(h) => setSelectedHospital(h)}
                />
              ) : isTriageActive ? (
                <TriageView
                  user={currentUser}
                  hospitals={[]}
                  currentDistrict={getCurrentDistrict()}
                  onBookingCompleted={(t) => void handleBookingCompleted(t)}
                  onConsultDoctor={handleConsultDoctor}
                  onOpenMap={handleOpenMap}
                  onBackToHome={() => setIsTriageActive(false)}
                />
              ) : (
                <>
                  {currentTab === 'home' && (
                    <HomeView
                      user={currentUser}
                      activeQueues={queues}
                      latestTriage={triages[0] || null}
                      onNavigate={handleTabChange}
                      onStartTriage={() => setIsTriageActive(true)}
                      onOpenMap={handleOpenMap}
                      onOpenQrModal={handleOpenQrModal}
                      onOpenHospitalDetail={(h) => setSelectedHospital(h)}
                      onOpenDoctorSummary={() => setIsDoctorSummaryOpen(true)}
                      onOpenHealthcareRights={() => setIsHealthcareRightsOpen(true)}
                      onOpenInsurancePartners={() => setIsInsuranceNetworkOpen(true)}
                      onCancelQueue={(id) => void handleCancelQueue(id)}
                      onOpenNotifications={() => setIsNotificationOpen(true)}
                      unreadNotificationsCount={notifications.filter((n) => !n.read).length}
                    />
                  )}

                  {currentTab === 'history' && (
                    <HistoryView
                      queues={queues}
                      triages={triages}
                      user={currentUser}
                      onOpenQrModal={handleOpenQrModal}
                      onCancelQueue={(id) => void handleCancelQueue(id)}
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
                      onUpdateUser={handleUpdateUser}
                      onLogout={() => void handleLogout()}
                      onOpenQrModal={() => handleOpenQrModal()}
                      onOpenDoctorSummary={() => setIsDoctorSummaryOpen(true)}
                      onOpenHealthcareRights={() => setIsHealthcareRightsOpen(true)}
                      onOpenInsurancePartners={() => setIsInsuranceNetworkOpen(true)}
                      onOpenNotifications={() => setIsNotificationOpen(true)}
                      unreadNotificationsCount={notifications.filter((n) => !n.read).length}
                    />
                  )}
                </>
              )}
            </div>

            {authReady && loggedIn && (
              <BottomNavBar
                currentTab={currentTab}
                onTabChange={handleTabChange}
                activeQueueCount={activeQueuesList.length}
              />
            )}

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
              onBookQueue={(h, dept) => void handleBookFromHospitalModal(h, dept)}
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
              onMarkRead={(id) => void handleMarkNotificationRead(id)}
              onMarkAllRead={() => void handleMarkAllNotificationsRead()}
              onNavigateTab={(tab) => handleTabChange(tab)}
              onTriggerGpsCheck={() => void handleTriggerGpsCheck()}
            />
          </main>
        </div>
      </div>
    </APIProvider>
  );
}
