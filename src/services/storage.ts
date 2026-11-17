import { ChatMessage, UserProfile } from '../types';

const STORAGE_KEYS = {
  CURRENT_DISTRICT: 'innotector_current_district',
  SOUND_ENABLED: 'innotector_sound_enabled',
};

export function createEmptyUserProfile(uid = ''): UserProfile {
  return {
    id: uid,
    name: 'ผู้ใช้งาน',
    email: '',
    hn: '-',
    nationalId: '-',
    age: 30,
    gender: 'อื่นๆ',
    bloodType: 'O',
    heightCm: 170,
    weightKg: 65,
    bmi: 22.5,
    drugAllergies: ['ไม่มีประวัติแพ้ยา'],
    chronicDiseases: ['ไม่มี'],
    medicalRight: 'สิทธิหลักประกันสุขภาพถ้วนหน้า (บัตรทอง)',
    assignedHospital: '',
    secondaryHospital: '',
    insuranceCompany: 'ไม่มี',
    insurancePolicyNumber: '',
    emergencyContact: {
      name: '',
      relationship: 'ครอบครัว',
      phone: '',
    },
    avatarUrl: '',
    weightLog: [],
  };
}

// Web Audio API chime
export function playChime(type: 'success' | 'alert' | 'tick' = 'success') {
  try {
    const isSound = localStorage.getItem(STORAGE_KEYS.SOUND_ENABLED) !== 'false';
    if (!isSound) return;
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    if (type === 'success') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.1);
      osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.2);
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

export function getCurrentDistrict(): string {
  return localStorage.getItem(STORAGE_KEYS.CURRENT_DISTRICT) || 'ตำแหน่งปัจจุบัน (GPS)';
}

export function setCurrentDistrict(district: string): void {
  localStorage.setItem(STORAGE_KEYS.CURRENT_DISTRICT, district);
  window.dispatchEvent(new CustomEvent('innotector_district_updated', { detail: district }));
}

export function getFacilityChatMessages(facilityId: string, uid = 'guest'): ChatMessage[] {
  try {
    const key = `innotector_chat_${uid}_${facilityId}`;
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore storage read errors
  }

  const initial: ChatMessage[] = [
    {
      id: `msg-init-${facilityId}`,
      sender: 'doctor',
      doctorName: 'เจ้าหน้าที่ประจำจุดบริการ',
      doctorSpecialty: 'บริการทางการแพทย์',
      text: 'สวัสดีค่ะ สามารถพิมพ์สอบถามข้อมูลการตรวจหรือส่งผลประเมินอาการได้เลยนะคะ',
      timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
    },
  ];
  return initial;
}

export function saveFacilityChatMessage(
  facilityId: string,
  message: Omit<ChatMessage, 'id' | 'timestamp'>,
  uid = 'guest'
): ChatMessage {
  const key = `innotector_chat_${uid}_${facilityId}`;
  const list = getFacilityChatMessages(facilityId, uid);
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
