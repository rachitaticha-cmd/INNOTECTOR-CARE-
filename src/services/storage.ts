import { Hospital, QueueTicket, TriageAssessment, UserProfile, ChatMessage, Prescription } from '../types';
import { INITIAL_USER, INITIAL_HOSPITALS, DEMO_USERS, SAMPLE_PRESCRIPTIONS, FACILITY_CHATS } from '../data/mockData';

const STORAGE_KEYS = {
  USER: 'innotector_user',
  LOGGED_IN: 'innotector_logged_in',
  QUEUES: 'innotector_queues',
  HOSPITALS: 'innotector_hospitals',
  TRIAGE: 'innotector_triage_history',
  CHAT: 'innotector_chat_messages',
  CURRENT_DISTRICT: 'innotector_current_district',
  SOUND_ENABLED: 'innotector_sound_enabled',
  PRESCRIPTIONS: 'innotector_prescriptions',
};

// Web Audio API chime
export function playChime(type: 'success' | 'alert' | 'tick' = 'success') {
  try {
    const isSound = localStorage.getItem(STORAGE_KEYS.SOUND_ENABLED) !== 'false';
    if (!isSound) return;
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    if (type === 'success') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.1); // E5
      osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.2); // G5
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.start(now);
      osc.stop(now + 0.4);
    } else if (type === 'alert') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(880, now + 0.1);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    }
  } catch {
    // Audio context may be restricted before user interaction
  }
}

// User state
export function getSavedUser(): UserProfile {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.USER);
    if (data) {
      const parsed = JSON.parse(data);
      // If still previous mock hardcoded name, reset to 'ผู้ใช้งาน'
      if (parsed.name === 'คุณสมชาย ใจดี') {
        parsed.name = 'ผู้ใช้งาน';
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(parsed));
      }
      return parsed;
    }
  } catch {
    // fallback
  }
  return INITIAL_USER;
}

export function saveUser(user: UserProfile): void {
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  window.dispatchEvent(new CustomEvent('innotector_user_updated', { detail: user }));
}

export function isUserLoggedIn(): boolean {
  return localStorage.getItem(STORAGE_KEYS.LOGGED_IN) === 'true';
}

export function setLoggedIn(loggedIn: boolean, user?: UserProfile): void {
  localStorage.setItem(STORAGE_KEYS.LOGGED_IN, loggedIn ? 'true' : 'false');
  if (user) {
    saveUser(user);
  }
  window.dispatchEvent(new CustomEvent('innotector_auth_updated', { detail: loggedIn }));
}

export function switchDemoUser(userId: string): UserProfile {
  const found = DEMO_USERS.find((u) => u.id === userId) || INITIAL_USER;
  saveUser(found);
  setLoggedIn(true, found);
  return found;
}

// District state
export function getCurrentDistrict(): string {
  return localStorage.getItem(STORAGE_KEYS.CURRENT_DISTRICT) || 'เขตบางแค';
}

export function setCurrentDistrict(district: string): void {
  localStorage.setItem(STORAGE_KEYS.CURRENT_DISTRICT, district);
  window.dispatchEvent(new CustomEvent('innotector_district_updated', { detail: district }));
}

// Hospitals
export function getHospitals(): Hospital[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.HOSPITALS);
    if (raw) return JSON.parse(raw);
  } catch {
    // fallback
  }
  localStorage.setItem(STORAGE_KEYS.HOSPITALS, JSON.stringify(INITIAL_HOSPITALS));
  return INITIAL_HOSPITALS;
}

export function getHospitalsByDistrict(district: string): Hospital[] {
  const all = getHospitals();
  return all.filter((h) => h.district === district);
}

// Queues
export function getQueues(): QueueTicket[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.QUEUES);
    if (raw) return JSON.parse(raw);
  } catch {
    // fallback
  }
  // Default sample active queue matching attachment
  const defaultQueues: QueueTicket[] = [
    {
      id: 'Q-102',
      userId: INITIAL_USER.id,
      hospitalId: 'hosp-bangkae-1',
      hospitalName: 'โรงพยาบาลราชพิพัฒน์',
      department: 'แผนกตรวจโรคทั่วไป',
      queueNum: 'B-015',
      triageLevel: 'yellow',
      triageTitle: 'ปานกลาง (Yellow Tag)',
      ahead: 2,
      estWait: '~15 นาที',
      createdAt: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
      status: 'waiting',
      symptomsSummary: 'มีไข้ 38.2°C, เจ็บคอ 2 วัน, ปวดศีรษะเล็กน้อย',
      qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=INNOTECTOR-Q102-HN67009412',
    },
  ];
  localStorage.setItem(STORAGE_KEYS.QUEUES, JSON.stringify(defaultQueues));
  return defaultQueues;
}

export function addQueue(ticket: Omit<QueueTicket, 'id' | 'createdAt' | 'status' | 'qrCodeUrl'>): QueueTicket {
  const queues = getQueues();
  const id = `Q-${Math.floor(100 + Math.random() * 900)}`;
  const fullTicket: QueueTicket = {
    ...ticket,
    id,
    createdAt: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
    status: 'waiting',
    qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=INNOTECTOR-${id}-HN67009412`,
  };

  const updated = [fullTicket, ...queues];
  localStorage.setItem(STORAGE_KEYS.QUEUES, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent('innotector_queues_updated', { detail: updated }));
  playChime('success');
  return fullTicket;
}

export function cancelQueue(ticketId: string): void {
  const queues = getQueues();
  const updated = queues.map((q) => (q.id === ticketId ? { ...q, status: 'cancelled' as const } : q));
  localStorage.setItem(STORAGE_KEYS.QUEUES, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent('innotector_queues_updated', { detail: updated }));
}

export function advanceQueue(ticketId: string): void {
  const queues = getQueues();
  const updated = queues.map((q) => {
    if (q.id === ticketId && q.status === 'waiting') {
      const nextAhead = Math.max(0, q.ahead - 1);
      return {
        ...q,
        ahead: nextAhead,
        status: nextAhead === 0 ? ('called' as const) : ('waiting' as const),
        estWait: nextAhead === 0 ? 'ถึงคิวตรวจแล้ว!' : `~${nextAhead * 7} นาที`,
      };
    }
    return q;
  });
  localStorage.setItem(STORAGE_KEYS.QUEUES, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent('innotector_queues_updated', { detail: updated }));
  playChime('alert');
}

// Triage assessments
export function getTriageHistory(): TriageAssessment[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TRIAGE);
    if (raw) return JSON.parse(raw);
  } catch {
    // fallback
  }
  return [];
}

export function saveTriageAssessment(assessment: Omit<TriageAssessment, 'id' | 'createdAt'>): TriageAssessment {
  const history = getTriageHistory();
  const id = `TRIAGE-${Date.now()}`;
  const full: TriageAssessment = {
    ...assessment,
    id,
    createdAt: new Date().toLocaleString('th-TH'),
  };
  const updated = [full, ...history];
  localStorage.setItem(STORAGE_KEYS.TRIAGE, JSON.stringify(updated));
  return full;
}

// Chat messages
export function getChatMessages(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CHAT);
    if (raw) return JSON.parse(raw);
  } catch {
    // fallback
  }
  const initialMessages: ChatMessage[] = [
    {
      id: 'msg-1',
      sender: 'doctor',
      doctorName: 'พญ. ณิชาภัทร วรากรณ์',
      doctorSpecialty: 'แพทย์เวชปฏิบัติทั่วไป',
      text: 'สวัสดีค่ะคุณสมชาย จากผลประเมินอาการ AI Triage เบื้องต้น มีอาการไข้และเจ็บคอ สามารถพิมพ์ปรึกษาอาการเพิ่มเติมได้เลยนะคะ คุณหมอพร้อมให้คำแนะนำค่ะ',
      timestamp: '09:42',
    },
  ];
  localStorage.setItem(STORAGE_KEYS.CHAT, JSON.stringify(initialMessages));
  return initialMessages;
}

export function saveChatMessage(message: Omit<ChatMessage, 'id' | 'timestamp'>): ChatMessage {
  const messages = getChatMessages();
  const full: ChatMessage = {
    ...message,
    id: `msg-${Date.now()}`,
    timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
  };
  const updated = [...messages, full];
  localStorage.setItem(STORAGE_KEYS.CHAT, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent('innotector_chat_updated', { detail: updated }));
  return full;
}

// Prescription & Medication History
export function getPrescriptions(): Prescription[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.PRESCRIPTIONS);
    if (data) return JSON.parse(data);
  } catch {
    // fallback
  }
  localStorage.setItem(STORAGE_KEYS.PRESCRIPTIONS, JSON.stringify(SAMPLE_PRESCRIPTIONS));
  return SAMPLE_PRESCRIPTIONS;
}

export function savePrescriptions(prescriptions: Prescription[]): void {
  localStorage.setItem(STORAGE_KEYS.PRESCRIPTIONS, JSON.stringify(prescriptions));
  window.dispatchEvent(new CustomEvent('innotector_prescriptions_updated', { detail: prescriptions }));
}

// Notifications Storage
import { NotificationItem } from '../types';
import { INITIAL_NOTIFICATIONS } from '../data/mockData';

const NOTIFICATIONS_KEY = 'innotector_notifications';

export function getNotifications(): NotificationItem[] {
  try {
    const data = localStorage.getItem(NOTIFICATIONS_KEY);
    if (data) return JSON.parse(data);
  } catch {
    // fallback
  }
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(INITIAL_NOTIFICATIONS));
  return INITIAL_NOTIFICATIONS;
}

export function saveNotifications(items: NotificationItem[]): void {
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent('innotector_notifications_updated', { detail: items }));
}

export function markNotificationRead(id: string): void {
  const current = getNotifications();
  const updated = current.map((n) => (n.id === id ? { ...n, read: true } : n));
  saveNotifications(updated);
}

export function addNotification(item: Omit<NotificationItem, 'id' | 'read'>): NotificationItem {
  const current = getNotifications();
  const full: NotificationItem = {
    ...item,
    id: `notif-${Date.now()}`,
    read: false,
  };
  saveNotifications([full, ...current]);
  playChime('alert');
  return full;
}

// Multi-Facility Chat Storage
export function getFacilityChatMessages(facilityId: string): ChatMessage[] {
  try {
    const key = `innotector_chat_${facilityId}`;
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch {
    // fallback
  }

  // Initial welcome message per facility
  let welcomeMsg = 'สวัสดีค่ะ สามารถพิมพ์ปรึกษาอาการเบื้องต้น หรือสอบถามข้อมูลได้เลยนะคะ';
  let doctorName = 'เจ้าหน้าที่ประจำจุดบริการ';
  let specialty = 'บริการทางการแพทย์';

  const foundFacility = FACILITY_CHATS.find((f) => f.id === facilityId);
  if (foundFacility) {
    welcomeMsg = foundFacility.lastMessage || `สวัสดีค่ะ/ครับ จาก ${foundFacility.facilityName} ยินดีให้บริการคำปรึกษาทางการแพทย์และข้อมูลการตรวจรักษาค่ะ`;
    doctorName = foundFacility.name;
    specialty = foundFacility.role;
  }

  if (facilityId === 'facility-ratchapiphat') {
    welcomeMsg = 'สวัสดีค่ะคุณผู้ใช้งาน จากแผนกผู้ป่วยนอก รพ.ราชพิพัฒน์ พร้อมให้คำปรึกษาและประสานงานตรวจค่ะ';
    doctorName = 'พญ. ณิชาภัทร วรากรณ์';
    specialty = 'แพทย์เวชปฏิบัติทั่วไป (ว.58412)';
  } else if (facilityId === 'facility-siriraj') {
    welcomeMsg = 'สวัสดีครับ จากแผนกรับส่งต่อและอายุรกรรม รพ.ศิริราช ยินดีให้คำแนะนำการเตรียมตัวตรวจครับ';
    doctorName = 'นพ. วีรชัย กิตติโสภณ';
    specialty = 'แพทย์อายุรกรรม (ว.49210)';
  } else if (facilityId === 'facility-er1669') {
    welcomeMsg = '🚨 ศูนย์เอราวัณ 1669 กรุงเทพมหานคร หากมีเหตุฉุกเฉินวิกฤต สามารถกดปุ่มโทร 1669 หรือแจ้งอาการทันที';
    doctorName = 'ทีมกู้ชีพฉุกเฉิน กทม.';
    specialty = 'ศูนย์บริการการแพทย์ฉุกเฉิน';
  }

  const initial: ChatMessage[] = [
    {
      id: `msg-init-${facilityId}`,
      sender: 'doctor',
      doctorName,
      doctorSpecialty: specialty,
      text: welcomeMsg,
      timestamp: '09:00',
    },
  ];

  localStorage.setItem(`innotector_chat_${facilityId}`, JSON.stringify(initial));
  return initial;
}

export function saveFacilityChatMessage(
  facilityId: string,
  message: Omit<ChatMessage, 'id' | 'timestamp'>
): ChatMessage {
  const key = `innotector_chat_${facilityId}`;
  const list = getFacilityChatMessages(facilityId);
  const full: ChatMessage = {
    ...message,
    id: `msg-${Date.now()}`,
    timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
  };
  const updated = [...list, full];
  localStorage.setItem(key, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent(`innotector_chat_updated_${facilityId}`, { detail: updated }));
  return full;
}
