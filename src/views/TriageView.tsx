import React, { useState } from 'react';
import { useMapsLibrary } from '@vis.gl/react-google-maps';
import {
  Stethoscope,
  ArrowLeft,
  CalendarCheck,
  MessageSquare,
  Building2,
  Check,
  Copy,
  Clock,
  MapPin,
  AlertTriangle,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import { Hospital, QueueTicket, TriageLevel, UserProfile } from '../types';
import { playChime } from '../services/storage';
import {
  createQueueTicketInFirestore,
  createTriageAssessmentInFirestore,
} from '../services/firestoreService';
import {
  detectUserThailandGPS,
  facilityToHospitalBridge,
  fetchRealHealthcareFacilities,
  LivePlaceFacility,
} from '../services/realPlaces';

interface TriageViewProps {
  user: UserProfile;
  hospitals: Hospital[];
  currentDistrict: string;
  onBookingCompleted: (ticket: QueueTicket) => void;
  onConsultDoctor: (triageSummary: string) => void;
  onOpenMap: (focusFacility?: LivePlaceFacility) => void;
  onBackToHome: () => void;
}

export const TriageView: React.FC<TriageViewProps> = ({
  user,
  hospitals,
  currentDistrict,
  onBookingCompleted,
  onConsultDoctor,
  onOpenMap,
  onBackToHome,
}) => {
  const placesLib = useMapsLibrary('places');
  const [step, setStep] = useState<1 | 3>(1);

  // Start with no pre-selected symptoms so user chooses manually
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);

  const [duration, setDuration] = useState<string>('1-2 วัน');
  const [details, setDetails] = useState<string>('');
  const [confirmed, setConfirmed] = useState<boolean>(true);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isBooking, setIsBooking] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Result state
  const [result, setResult] = useState<{
    level: TriageLevel;
    urgencyText: 'ต่ำ' | 'ปานกลาง' | 'สูง' | 'ฉุกเฉิน';
    color: string;
    bgColor: string;
    advice: string;
    clinicalReason: string;
    matchedSigns: string[];
    summary: string;
    recommendedService: 'ร้านยา' | 'คลินิก' | 'โรงพยาบาล' | 'ห้องฉุกเฉิน';
    recommendedHospital: Hospital;
    liveFacility: LivePlaceFacility | null;
    gpsStatusText: string;
    isLiveGps: boolean;
    effectiveSymptoms: string[];
  } | null>(null);

  // Realistic full-color medical symptom icons: มีไข้, ไอ, เจ็บคอ, ปวดศีรษะ, ปวดท้อง, มีน้ำมูก, อื่นๆ
  const OtherSymptomIcon = ({ className = 'w-7 h-7' }: { className?: string }) => (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="8" width="28" height="34" rx="5" fill="#F1F5F9" stroke="#475569" strokeWidth="2.2" />
      <rect x="17" y="4" width="14" height="7" rx="3" fill="#0D9488" stroke="#115E59" strokeWidth="1.8" />
      <circle cx="24" cy="18" r="5" fill="#10B981" fillOpacity="0.18" stroke="#059669" strokeWidth="1.8" />
      <path d="M24 15.5V20.5M21.5 18H26.5" stroke="#059669" strokeWidth="2" strokeLinecap="round" />
      <path d="M16 28H32" stroke="#64748B" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M16 33.5H27" stroke="#94A3B8" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="33" cy="34" r="7" fill="#0F766E" stroke="#FFFFFF" strokeWidth="2" />
      <circle cx="30" cy="34" r="1" fill="#FFFFFF" />
      <circle cx="33" cy="34" r="1" fill="#FFFFFF" />
      <circle cx="36" cy="34" r="1" fill="#FFFFFF" />
    </svg>
  );

  const GRID_SYMPTOMS = [
    {
      id: 'มีไข้',
      label: 'มีไข้',
      icon: (props: { className?: string }) => (
        <svg className={props.className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="feverSkin" x1="12" y1="8" x2="30" y2="38" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FDE2CE" />
              <stop offset="100%" stopColor="#F6BFA0" />
            </linearGradient>
            <linearGradient id="feverMercury" x1="36" y1="10" x2="36" y2="38" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#EF4444" />
              <stop offset="100%" stopColor="#B91C1C" />
            </linearGradient>
          </defs>
          {/* Face */}
          <circle cx="20" cy="25" r="13.5" fill="url(#feverSkin)" stroke="#B45309" strokeWidth="1.8" />
          {/* Cooling patch on forehead */}
          <rect x="13" y="14" width="14" height="5.5" rx="2" fill="#93C5FD" stroke="#2563EB" strokeWidth="1.4" />
          {/* Flushed cheeks */}
          <ellipse cx="13" cy="28" rx="3.2" ry="2" fill="#EF4444" fillOpacity="0.45" />
          <ellipse cx="27" cy="28" rx="3.2" ry="2" fill="#EF4444" fillOpacity="0.45" />
          {/* Tired eyes & wavy fever mouth */}
          <path d="M13 23.5C14 24.5 16 24.5 17 23.5" stroke="#78350F" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M23 23.5C24 24.5 26 24.5 27 23.5" stroke="#78350F" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M16 32.5C17.2 31.5 18.8 33.5 20 32.5C21.2 31.5 22.8 33.5 24 32.5" stroke="#78350F" strokeWidth="1.8" strokeLinecap="round" />
          {/* Sweat drop */}
          <path d="M8.5 18C8.5 18 6 21.2 6 22.8C6 24.2 7.1 25.2 8.5 25.2C9.9 25.2 11 24.2 11 22.8C11 21.2 8.5 18 8.5 18Z" fill="#38BDF8" stroke="#0284C7" strokeWidth="1.3" />
          {/* Clinical thermometer */}
          <rect x="33.5" y="7" width="7" height="24" rx="3.5" fill="#F8FAFC" stroke="#475569" strokeWidth="1.8" />
          <circle cx="37" cy="34.5" r="5.5" fill="#F8FAFC" stroke="#475569" strokeWidth="1.8" />
          <circle cx="37" cy="34.5" r="3.6" fill="url(#feverMercury)" />
          <rect x="35.6" y="13" width="2.8" height="19" rx="1.4" fill="url(#feverMercury)" />
          <path d="M38.5 13H40.5M38.5 17H40.5M38.5 21H40.5" stroke="#64748B" strokeWidth="1.3" strokeLinecap="round" />
          {/* Heat waves */}
          <path d="M16 6.5C15 8 17 9 16 10.5" stroke="#EF4444" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M23 5.5C22 7 24 8 23 9.5" stroke="#EF4444" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      id: 'ไอ',
      label: 'ไอ',
      icon: (props: { className?: string }) => (
        <svg className={props.className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="coughSkin" x1="8" y1="8" x2="26" y2="42" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FDE2CE" />
              <stop offset="100%" stopColor="#F4B998" />
            </linearGradient>
          </defs>
          {/* Head & neck side profile facing right */}
          <path
            d="M8 41V32C8 29 9 27 10 25C8.5 22.5 8 19.5 8.5 16.5C9.5 10.5 14.5 7 20 7.5C25 8 28 11.5 28.5 16L31 20.5C31.5 21.5 31 22.5 29.8 22.8L28.5 23.2V25.5L25 27L28 29.5C27.5 32 25.5 34 22.5 34.5L20 35V41H8Z"
            fill="url(#coughSkin)"
            stroke="#9A3412"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          {/* Hair cap */}
          <path
            d="M8.5 18C8.5 11.5 13.5 7 20 7.5C23.5 7.8 26.2 9.5 27.6 12C24 11.5 21 12.5 19.5 14.5C16.5 14 14 16 13.5 19.5C11.5 19 9.8 18.8 8.5 18Z"
            fill="#334155"
          />
          {/* Eye */}
          <path d="M22.5 17.5C23.5 17 24.8 17 25.5 17.8" stroke="#78350F" strokeWidth="1.8" strokeLinecap="round" />
          {/* Open coughing mouth & throat irritation */}
          <ellipse cx="26.5" cy="27.2" rx="2.8" ry="2.2" fill="#991B1B" />
          {/* Cough airflow bursts */}
          <path d="M31 25.5L39 22" stroke="#EF4444" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M31.5 27.5H41" stroke="#F97316" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M31 29.5L39 33" stroke="#EF4444" strokeWidth="2.2" strokeLinecap="round" />
          {/* Respiratory droplets */}
          <circle cx="37" cy="18.5" r="1.7" fill="#38BDF8" stroke="#0284C7" strokeWidth="1" />
          <circle cx="42.5" cy="24" r="1.5" fill="#38BDF8" stroke="#0284C7" strokeWidth="1" />
          <circle cx="42.5" cy="30.5" r="1.6" fill="#38BDF8" stroke="#0284C7" strokeWidth="1" />
          <circle cx="37.5" cy="36" r="1.4" fill="#38BDF8" stroke="#0284C7" strokeWidth="1" />
        </svg>
      ),
    },
    {
      id: 'เจ็บคอ',
      label: 'เจ็บคอ',
      icon: (props: { className?: string }) => (
        <svg className={props.className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="throatSkin" x1="24" y1="6" x2="24" y2="42" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FDE2CE" />
              <stop offset="100%" stopColor="#F4B998" />
            </linearGradient>
            <radialGradient id="throatPain" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#EF4444" stopOpacity="0.95" />
              <stop offset="65%" stopColor="#F87171" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#FCA5A5" stopOpacity="0" />
            </radialGradient>
          </defs>
          {/* Shoulders & Shirt */}
          <path
            d="M7 42C7.8 35.5 12.5 32.5 18 32H30C35.5 32.5 40.2 35.5 41 42H7Z"
            fill="#CBD5E1"
            stroke="#475569"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          {/* Neck & Lower Jaw/Chin */}
          <path
            d="M17.5 18V33C17.5 35 20.5 37 24 37C27.5 37 30.5 35 30.5 33V18"
            fill="url(#throatSkin)"
            stroke="#9A3412"
            strokeWidth="1.8"
          />
          <path
            d="M13 8C13 15.5 17.5 22.5 24 22.5C30.5 22.5 35 15.5 35 8"
            fill="url(#throatSkin)"
            stroke="#9A3412"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          {/* Pained mouth */}
          <path d="M20 14.5C21.5 13 26.5 13 28 14.5" stroke="#78350F" strokeWidth="1.8" strokeLinecap="round" />
          {/* Inflamed glowing sore throat */}
          <circle cx="24" cy="28" r="6.5" fill="url(#throatPain)" />
          <circle cx="24" cy="28" r="3" fill="#DC2626" stroke="#FFFFFF" strokeWidth="1.2" />
          {/* Pain waves */}
          <path d="M12.5 25.5L15 27M11.5 29.5H14.5M13 33L15.5 31.5" stroke="#DC2626" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M35.5 25.5L33 27M36.5 29.5H33.5M35 33L32.5 31.5" stroke="#DC2626" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      id: 'ปวดศีรษะ',
      label: 'ปวดศีรษะ',
      icon: (props: { className?: string }) => (
        <svg className={props.className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="headSkin" x1="12" y1="10" x2="36" y2="42" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FDE2CE" />
              <stop offset="100%" stopColor="#F3B896" />
            </linearGradient>
          </defs>
          {/* Head shape */}
          <circle cx="24" cy="26" r="14" fill="url(#headSkin)" stroke="#9A3412" strokeWidth="1.8" />
          {/* Hair */}
          <path
            d="M10.5 23C10.5 15.5 16.5 11.5 24 11.5C31.5 11.5 37.5 15.5 37.5 23C34.5 19.5 30 18 24 18C18 18 13.5 19.5 10.5 23Z"
            fill="#334155"
          />
          {/* Furrowed brows & squinted pained eyes */}
          <path d="M15 23L20 25L15.5 26.5" stroke="#78350F" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M33 23L28 25L32.5 26.5" stroke="#78350F" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
          {/* Tense mouth */}
          <path d="M19 33C20.5 31.5 27.5 31.5 29 33" stroke="#78350F" strokeWidth="1.8" strokeLinecap="round" />
          {/* Hands pressing temples */}
          <path d="M8.5 31C7.5 27 8.5 23 11 22" stroke="#9A3412" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M39.5 31C40.5 27 39.5 23 37 22" stroke="#9A3412" strokeWidth="2.2" strokeLinecap="round" />
          {/* Throbbing lightning bolts */}
          <path d="M11 8L8 13H12L9.5 17.5" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M37 8L40 13H36L38.5 17.5" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M24 4L22 8.5H26L24 13" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      id: 'ปวดท้อง',
      label: 'ปวดท้อง',
      icon: (props: { className?: string }) => (
        <svg className={props.className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="torsoBg" x1="24" y1="5" x2="24" y2="43" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FDE2CE" />
              <stop offset="100%" stopColor="#F5C2A3" />
            </linearGradient>
            <linearGradient id="stomachOrgan" x1="18" y1="15" x2="32" y2="33" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FB7185" />
              <stop offset="100%" stopColor="#DC2626" />
            </linearGradient>
          </defs>
          {/* Human Torso / Abdomen Outline */}
          <path
            d="M15 6H33L36 16C37 22 35.5 29 35 37C34.8 40 33 42 30 42H18C15 42 13.2 40 13 37C12.5 29 11 22 12 16L15 6Z"
            fill="url(#torsoBg)"
            stroke="#9A3412"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          {/* Anatomical J-shaped Stomach */}
          <path
            d="M23 11V17C23 18.5 20.5 19.5 19.5 21.5C18 24.5 19 29.5 22.5 31.5C25.5 33.2 30 32.5 31.5 29.5C33 26.5 31.5 22.5 28.5 22C27 21.8 26 20.8 26 19V11"
            fill="url(#stomachOrgan)"
            stroke="#991B1B"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Cramp / Pain lightning */}
          <path d="M26 24.5L23.5 27.5H27L24.5 30.5" stroke="#FEF08A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          {/* Radiating abdominal pain waves */}
          <path d="M8 24C6.5 26 6.5 29 8 31" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" />
          <path d="M40 24C41.5 26 41.5 29 40 31" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      id: 'มีน้ำมูก',
      label: 'มีน้ำมูก',
      icon: (props: { className?: string }) => (
        <svg className={props.className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="noseSkin" x1="16" y1="8" x2="32" y2="30" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FDE2CE" />
              <stop offset="100%" stopColor="#F3B591" />
            </linearGradient>
            <linearGradient id="mucusDrop" x1="28" y1="27" x2="28" y2="42" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#7DD3FC" />
              <stop offset="100%" stopColor="#0284C7" />
            </linearGradient>
          </defs>
          {/* Face background hint */}
          <path
            d="M12 10C12 10 10 22 10 28C10 34 15 38 24 38C33 38 38 34 38 28C38 22 36 10 36 10"
            fill="#FDE8D7"
            stroke="#C2410C"
            strokeWidth="1.4"
            strokeOpacity="0.35"
          />
          {/* Anatomical Nose */}
          <path
            d="M21 9L17.5 22.5C15.5 24 14.5 26 15.5 27.8C16.5 29.5 19.5 29.5 21.5 28.5C23 29.5 25 29.5 26.5 28.5C28.5 29.5 31.5 29.5 32.5 27.8C33.5 26 32.5 24 30.5 22.5L27 9"
            fill="url(#noseSkin)"
            stroke="#9A3412"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Red irritated nose tip */}
          <ellipse cx="24" cy="25.5" rx="4.5" ry="2.5" fill="#EF4444" fillOpacity="0.28" />
          {/* Nostrils */}
          <ellipse cx="19.5" cy="27.2" rx="1.6" ry="1" fill="#7C2D12" />
          <ellipse cx="28.5" cy="27.2" rx="1.6" ry="1" fill="#7C2D12" />
          {/* Glossy runny mucus droplet */}
          <path
            d="M28.5 28C28.5 28 24.5 34 24.5 37C24.5 39.2 26.3 41 28.5 41C30.7 41 32.5 39.2 32.5 37C32.5 34 28.5 28 28.5 28Z"
            fill="url(#mucusDrop)"
            stroke="#0369A1"
            strokeWidth="1.6"
          />
          <circle cx="27.3" cy="36.5" r="1" fill="#FFFFFF" fillOpacity="0.8" />
          {/* Small secondary droplet */}
          <circle cx="19" cy="33.5" r="2" fill="#38BDF8" stroke="#0369A1" strokeWidth="1.3" />
        </svg>
      ),
    },
  ];

  const toggleSymptom = (symId: string) => {
    if (selectedSymptoms.includes(symId)) {
      setSelectedSymptoms(selectedSymptoms.filter((s) => s !== symId));
    } else {
      setSelectedSymptoms([...selectedSymptoms, symId]);
    }
  };

  const hasOnlyOtherWithoutDetails =
    selectedSymptoms.length === 1 &&
    selectedSymptoms[0] === 'อื่นๆ' &&
    details.trim().length < 2;

  const canSubmitAssessment =
    confirmed &&
    !hasOnlyOtherWithoutDetails &&
    (selectedSymptoms.length > 0 || details.trim().length >= 2);

  const calculateTriage = async () => {
    setIsAnalyzing(true);
    try {
      const rawDetails = details.trim();
      // Strip explicit negative symptom phrases so "ไม่มีไข้" does not trigger fever escalation
      const sanitizedDetails = rawDetails
        .replace(
          /(?:ไม่มี|ไม่เป็น|ไม่พบ)\s*(?:อาการ)?\s*(?:ไข้|ตัวร้อน|ไอ|เจ็บคอ|ปวดหัว|ปวดศีรษะ|ปวดท้อง|น้ำมูก|แน่นหน้าอก|เจ็บหน้าอก|เหนื่อยหอบ|หอบ|อาเจียน|ท้องเสีย|ถ่ายเหลว|ผื่น|หนาวสั่น)/gi,
          ' '
        )
        .toLowerCase();

      const activeChips = selectedSymptoms.filter((s) => s !== 'อื่นๆ');
      const combinedText = `${activeChips.join(' ')} ${sanitizedDetails}`.toLowerCase();

      // Parse body temperature if mentioned in fever/temperature context or decimal (e.g. 38.5, 39 องศา, ไข้ 40)
      const tempContextRegex =
        /(?:ไข้|อุณหภูมิ|ตัวร้อน|วัดได้|ปรอท)[^\d]{0,12}(3[7-9](?:\.\d+)?|4[0-2](?:\.\d+)?)|\b(3[7-9](?:\.\d+)?|4[0-2](?:\.\d+)?)\s*(?:°\s*[cC]?|องศา|c\b)|\b(3[7-9]\.\d+|4[0-2]\.\d+)\b/gi;
      const parsedTemps: number[] = [];
      let tMatch: RegExpExecArray | null;
      while ((tMatch = tempContextRegex.exec(rawDetails)) !== null) {
        const val = parseFloat(tMatch[1] || tMatch[2] || tMatch[3]);
        if (!Number.isNaN(val) && val >= 37.0 && val <= 42.9) {
          parsedTemps.push(val);
        }
      }
      const maxTemp = parsedTemps.length > 0 ? Math.max(...parsedTemps) : undefined;

      const RED_FLAG_RULES: { keywords: string[]; label: string }[] = [
        {
          keywords: ['แน่นหน้าอก', 'เจ็บหน้าอก', 'เจ็บร้าว', 'ปวดหน้าอก'],
          label: 'เจ็บ/แน่นหน้าอก',
        },
        {
          keywords: [
            'หายใจไม่ออก',
            'หายใจลำบาก',
            'หายใจหอบ',
            'หายใจเหนื่อยหอบ',
            'หอบเหนื่อย',
            'เหนื่อยหอบ',
            'หายใจติดขัด',
            'หอบหืดกำเริบ',
            'ปากเขียว',
            'สำลัก',
          ],
          label: 'หายใจลำบาก/หอบเหนื่อย',
        },
        {
          keywords: [
            'หมดสติ',
            'ไม่รู้สึกตัว',
            'เป็นลม',
            'ชัก',
            'เกร็ง',
            'อัมพาต',
            'แขนขาอ่อนแรง',
            'ปากเบี้ยว',
            'พูดไม่ชัด',
            'สับสน',
            'ซึมมาก',
          ],
          label: 'สัญญาณอันตรายทางระบบประสาท/หมดสติ',
        },
        {
          keywords: [
            'เลือดออกไม่หยุด',
            'เลือดออกมาก',
            'อาเจียนเป็นเลือด',
            'ถ่ายเป็นเลือด',
            'ถ่ายดำ',
            'ตกเลือด',
          ],
          label: 'ภาวะเสียเลือด/เลือดออกผิดปกติรุนแรง',
        },
        {
          keywords: ['แพ้รุนแรง', 'คอบวม', 'กลืนไม่ได้', 'หน้าบวม', 'ตาบวม', 'กินยาเกินขนาด', 'สารพิษ'],
          label: 'แพ้รุนแรง/ภาวะเป็นพิษเฉียบพลัน',
        },
        {
          keywords: [
            'ปวดท้องรุนแรง',
            'ปวดท้องมาก',
            'ปวดท้องน้อยขวา',
            'ปวดท้องเฉียบพลัน',
            'ปวดศีรษะรุนแรง',
            'ปวดหัวรุนแรง',
            'ปวดหัวมาก',
            'ศีรษะกระแทก',
            'กระดูกหัก',
            'แผลลึก',
            'แผลฉีกขาด',
          ],
          label: 'อาการปวดรุนแรงเฉียบพลัน/บาดเจ็บรุนแรง',
        },
      ];

      const HIGH_URGENCY_KEYWORDS: { keywords: string[]; label: string }[] = [
        { keywords: ['ไข้สูง', 'ไข้ขึ้นสูง', 'ตัวร้อนจัด', 'หนาวสั่น'], label: 'ไข้สูง/หนาวสั่น' },
        {
          keywords: ['อาเจียนไม่หยุด', 'อาเจียนหนัก', 'อาเจียนหลายครั้ง', 'กินไม่ได้', 'ดื่มน้ำไม่ได้', 'ขาดน้ำ'],
          label: 'อาเจียนรุนแรง/เสี่ยงภาวะขาดน้ำ',
        },
        {
          keywords: ['ท้องเสียรุนแรง', 'ถ่ายเหลวหลายครั้ง', 'ถ่ายไม่หยุด', 'ปวดบิด', 'ถ่ายเป็นมูก'],
          label: 'ท้องเสียรุนแรง',
        },
        {
          keywords: ['ปวดมาก', 'ปวดรุนแรง', 'ทรมาน', 'นอนไม่ได้เพราะปวด'],
          label: 'อาการปวดระดับมาก',
        },
        {
          keywords: ['ไข้เลือดออก', 'จุดเลือดออก', 'ตาเหลือง', 'ตัวเหลือง', 'ไอเป็นเลือด', 'ไอปนเลือด', 'ปัสสาวะเป็นเลือด'],
          label: 'อาการจำเพาะที่ต้องตรวจเลือด/เอกซเรย์เร่งด่วน',
        },
        {
          keywords: ['ใจสั่น', 'หน้ามืด', 'ตาพร่า', 'บ้านหมุนรุนแรง', 'มีหนอง', 'บวมแดงร้อน', 'ติดเชื้อ', 'ปวดเอว'],
          label: 'เสี่ยงภาวะแทรกซ้อนหรือการติดเชื้อ',
        },
      ];

      const MODERATE_KEYWORDS: { keywords: string[]; label: string }[] = [
        { keywords: ['คลื่นไส้', 'อาเจียน', 'ท้องเสีย', 'ถ่ายเหลว', 'แสบท้อง', 'กรดไหลย้อน'], label: 'อาการทางเดินอาหาร' },
        { keywords: ['ผื่น', 'ลมพิษ', 'คัน', 'ตาแดง', 'ปวดฟัน', 'เหงือกบวม'], label: 'อาการผิวหนัง/ตา/ช่องปาก' },
        { keywords: ['ปวดหลัง', 'ปวดกล้ามเนื้อ', 'ปวดข้อ', 'เคล็ด', 'ฟกช้ำ', 'แผล'], label: 'อาการปวดกล้ามเนื้อ/บาดเจ็บเล็กน้อย' },
        { keywords: ['เสมหะ', 'เสียงแหบ', 'กลืนเจ็บ', 'ทอนซิล', 'เวียนหัว', 'บ้านหมุน', 'ไมเกรน', 'ปัสสาวะขัด'], label: 'อาการที่ควรให้แพทย์ตรวจประเมิน' },
      ];

      const MILD_KEYWORDS = ['คัดจมูก', 'จาม', 'แพ้อากาศ', 'ระคายคอ', 'เมื่อยล้า', 'เล็กน้อย', 'นิดหน่อย'];

      const matchedRedFlags = RED_FLAG_RULES.filter((rule) =>
        rule.keywords.some((kw) => combinedText.includes(kw))
      ).map((r) => r.label);

      const matchedHighSigns = HIGH_URGENCY_KEYWORDS.filter((rule) =>
        rule.keywords.some((kw) => combinedText.includes(kw))
      ).map((r) => r.label);

      const matchedModerateSigns = MODERATE_KEYWORDS.filter((rule) =>
        rule.keywords.some((kw) => combinedText.includes(kw))
      ).map((r) => r.label);

      const hasFever =
        activeChips.includes('มีไข้') ||
        combinedText.includes('ไข้') ||
        combinedText.includes('ตัวร้อน') ||
        (maxTemp !== undefined && maxTemp >= 37.5);
      const hasHeadache = activeChips.includes('ปวดศีรษะ') || combinedText.includes('ปวดศีรษะ') || combinedText.includes('ปวดหัว');
      const hasStomachPain = activeChips.includes('ปวดท้อง') || combinedText.includes('ปวดท้อง');
      const hasCough = activeChips.includes('ไอ') || combinedText.includes('ไอ');
      const hasSoreThroat = activeChips.includes('เจ็บคอ') || combinedText.includes('เจ็บคอ');

      const isLongDuration = duration === 'มากกว่า 1 สัปดาห์';
      const isExtendedDuration = duration === '3-5 วัน' || isLongDuration;
      const isHighRiskPatient =
        user.age >= 65 ||
        user.chronicDiseases.some((d) => d && d !== 'ไม่มี');

      const detectedSymptomCount =
        activeChips.length +
        (rawDetails && activeChips.length === 0 ? 1 : 0) +
        matchedHighSigns.length +
        matchedModerateSigns.length;

      let urgencyText: 'ต่ำ' | 'ปานกลาง' | 'สูง' | 'ฉุกเฉิน' = 'ต่ำ';
      let level: TriageLevel = 'green';
      let color = '#16a34a';
      let bgColor = 'bg-emerald-600';
      let advice = 'อาการเบื้องต้นไม่รุนแรง สามารถดูแลตนเอง พักผ่อน ดื่มน้ำมาก ๆ และปรึกษาเภสัชกรที่ร้านยาได้';
      let recService: 'ร้านยา' | 'คลินิก' | 'โรงพยาบาล' | 'ห้องฉุกเฉิน' = 'ร้านยา';
      let clinicalReason = 'อาการอยู่ในเกณฑ์ไม่รุนแรง ไม่มีสัญญาณอันตรายเร่งด่วน และระยะเวลาไม่นาน';
      const matchedSigns: string[] = [];

      if (
        matchedRedFlags.length > 0 ||
        (maxTemp !== undefined && maxTemp >= 40.0)
      ) {
        urgencyText = 'ฉุกเฉิน';
        level = 'red';
        color = '#e0503a';
        bgColor = 'bg-rose-600';
        advice = 'พบสัญญาณอันตรายฉุกเฉิน ควรไปห้องฉุกเฉินโรงพยาบาลทันที หรือโทรสายด่วน 1669';
        recService = 'ห้องฉุกเฉิน';
        if (maxTemp !== undefined && maxTemp >= 40.0) {
          matchedSigns.push(`ไข้สูงวิกฤต (${maxTemp}°C)`);
        }
        matchedSigns.push(...matchedRedFlags);
        clinicalReason = `ตรวจพบสัญญาณฉุกเฉินสำคัญ: ${matchedSigns.join(', ')} ต้องได้รับการช่วยเหลือเร่งด่วนทันที`;
      } else if (
        matchedHighSigns.length > 0 ||
        (maxTemp !== undefined && maxTemp >= 38.5) ||
        (hasFever && hasHeadache) ||
        (hasFever && hasStomachPain) ||
        (hasFever && isExtendedDuration) ||
        (hasStomachPain && isLongDuration) ||
        (hasCough && isLongDuration && hasFever) ||
        (detectedSymptomCount >= 3 && (hasFever || hasStomachPain || isExtendedDuration)) ||
        (isHighRiskPatient && (hasFever || detectedSymptomCount >= 2))
      ) {
        urgencyText = 'สูง';
        level = 'orange';
        color = '#ea580c';
        bgColor = 'bg-orange-500';
        advice = 'ควรเข้ารับการตรวจรักษาจากแพทย์ที่โรงพยาบาลภายใน 6-12 ชั่วโมง';
        recService = 'โรงพยาบาล';

        if (maxTemp !== undefined && maxTemp >= 38.5) {
          matchedSigns.push(`ไข้สูง (${maxTemp}°C)`);
        }
        matchedSigns.push(...matchedHighSigns);
        if (hasFever && hasHeadache) matchedSigns.push('มีไข้ร่วมกับปวดศีรษะ');
        if (hasFever && hasStomachPain) matchedSigns.push('มีไข้ร่วมกับปวดท้อง');
        if ((hasFever || hasStomachPain) && isExtendedDuration) matchedSigns.push(`อาการต่อเนื่อง ${duration}`);
        if (detectedSymptomCount >= 3 && matchedSigns.length === 0) {
          matchedSigns.push(`มีอาการหลายระบบร่วมกัน (${detectedSymptomCount} รายการ)`);
        }
        if (isHighRiskPatient && matchedSigns.length === 0) {
          matchedSigns.push('อยู่ในกลุ่มเสี่ยงที่ควรพบแพทย์ใกล้ชิด');
        }
        clinicalReason = `ประเมินระดับสูงเนื่องจาก: ${matchedSigns.join(', ')}`;
      } else if (
        hasFever ||
        hasStomachPain ||
        matchedModerateSigns.length > 0 ||
        isExtendedDuration ||
        activeChips.length >= 2 ||
        (hasHeadache && duration !== 'น้อยกว่า 1 วัน') ||
        (hasCough && hasSoreThroat) ||
        (rawDetails.length > 0 && !MILD_KEYWORDS.some((kw) => combinedText.includes(kw)) && activeChips.length === 0)
      ) {
        urgencyText = 'ปานกลาง';
        level = 'yellow';
        color = '#d97706';
        bgColor = 'bg-amber-500';
        advice = 'ควรเข้ารับการตรวจประเมินกับแพทย์ที่คลินิกหรือศูนย์บริการสาธารณสุขภายใน 24 ชั่วโมง';
        recService = 'คลินิก';

        if (hasFever) matchedSigns.push('มีอาการไข้');
        if (hasStomachPain) matchedSigns.push('มีอาการปวดท้อง');
        matchedSigns.push(...matchedModerateSigns);
        if (isExtendedDuration) matchedSigns.push(`เป็นต่อเนื่อง ${duration}`);
        if (activeChips.length >= 2 && matchedSigns.length === 0) {
          matchedSigns.push(`มีอาการร่วม ${activeChips.length} อาการ`);
        }
        if (matchedSigns.length === 0) {
          matchedSigns.push('ควรให้แพทย์ตรวจประเมินเพื่อรับยาที่เหมาะสม');
        }
        clinicalReason = `ประเมินระดับปานกลางเนื่องจาก: ${matchedSigns.join(', ')}`;
      } else {
        urgencyText = 'ต่ำ';
        level = 'green';
        color = '#16a34a';
        bgColor = 'bg-emerald-600';
        advice = 'พักผ่อน ดื่มน้ำมาก ๆ สังเกตอาการ 1-2 วัน และสามารถปรึกษาเภสัชกรที่ร้านยาได้';
        recService = 'ร้านยา';
        matchedSigns.push('อาการไม่รุนแรงและเพิ่งเริ่มมีอาการ');
        clinicalReason = 'เป็นอาการเบื้องต้นระยะสั้น ไม่มีไข้ ปวดท้อง หรือสัญญาณเตือนอันตราย';
      }

      const effectiveSymptoms =
        activeChips.length > 0
          ? selectedSymptoms
          : [rawDetails ? `อาการที่ระบุ: ${rawDetails}` : 'อาการทั่วไป'];

      // Real GPS detection + Google Places filtering by real opening hours + user healthcare right
      const gpsResult = await detectUserThailandGPS();
      let liveFacility: LivePlaceFacility | null = null;

      if (placesLib) {
        try {
          const liveList = await fetchRealHealthcareFacilities({
            placesLib,
            coords: gpsResult.coords,
            serviceTier: recService,
            user,
            radiusMeters: 6000,
            prioritizeOpenAndRight: true,
          });
          if (liveList.length > 0) {
            liveFacility = liveList[0];
          }
        } catch {
          // Graceful fallback if Places network request fails
        }
      }

      let recommendedHospital: Hospital;
      if (liveFacility) {
        recommendedHospital = facilityToHospitalBridge(liveFacility);
      } else {
        const districtHospitals = hospitals.filter((h) => h.district === currentDistrict);
        const candidateList = districtHospitals.length > 0 ? districtHospitals : hospitals;
        const tierFiltered = candidateList.filter((h) => {
          const fType = h.facilityType || h.type;
          if (recService === 'ห้องฉุกเฉิน' || recService === 'โรงพยาบาล') {
            return fType.includes('รพ.');
          }
          return fType.includes('คลินิก') || fType.includes('สาธารณสุข') || fType.includes('ศบส');
        });
        const pool = tierFiltered.length > 0 ? tierFiltered : candidateList;
        const fallbackFromPool = [...pool].sort((a, b) => a.congestionPct - b.congestionPct)[0];
        recommendedHospital = fallbackFromPool || {
          id: 'nearby-facility',
          name:
            user.assignedHospital && (recService === 'โรงพยาบาล' || recService === 'ห้องฉุกเฉิน')
              ? user.assignedHospital
              : `สถานพยาบาลใกล้ฉัน (${recService})`,
          type: recService,
          facilityType:
            recService === 'โรงพยาบาล' || recService === 'ห้องฉุกเฉิน'
              ? 'รพ.รัฐบาล'
              : 'คลินิกเวชกรรม/คลินิกชุมชนอบอุ่น',
          region: 'กทม./ปริมณฑล',
          district: gpsResult.isLiveGps ? 'พื้นที่รอบตัวคุณ (GPS)' : 'พื้นที่ใกล้ฉัน',
          province: 'ประเทศไทย',
          address: 'ค้นหาและดูเส้นทางบนแผนที่ในแอป',
          distanceKm: 0,
          congestionPct: 0,
          totalWaitingCount: 0,
          estWaitMinutes: 15,
          openHours: recService === 'ห้องฉุกเฉิน' ? 'เปิด 24 ชั่วโมง' : 'ตรวจสอบเวลาทำการบนแผนที่',
          phone: recService === 'ห้องฉุกเฉิน' ? '1669' : '-',
          coordinates: gpsResult.coords,
          departments: [
            {
              id: 'opd-default',
              name: recService === 'ห้องฉุกเฉิน' ? 'แผนกอุบัติเหตุ-ฉุกเฉิน (ER)' : 'แผนกตรวจโรคทั่วไป (OPD)',
              currentServing: '-',
              waitingCount: 0,
              estWaitMinutes: 15,
              status: 'open',
              doctorOnDuty: 'แพทย์/เจ้าหน้าที่ประจำจุดบริการ',
            },
          ],
        };
      }

      const summary = `ผู้ใช้งานมีอาการ: ${effectiveSymptoms.join(', ')} เป็นเวลา ${duration}.${
        rawDetails ? ` รายละเอียดเพิ่มเติม: "${rawDetails}".` : ''
      } ระบบประเมินระดับความรุนแรง: "${urgencyText}" (${clinicalReason}) คำแนะนำ: ${advice} แนะนำเข้ารับบริการที่: ${recommendedHospital.name} (${recService})${
        liveFacility ? ` • ${liveFacility.openStatusLabel} • ${liveFacility.rightMatchReason}` : ''
      }`;

      setResult({
        level,
        urgencyText,
        color,
        bgColor,
        advice,
        clinicalReason,
        matchedSigns,
        summary,
        recommendedService: recService,
        recommendedHospital,
        liveFacility,
        gpsStatusText: gpsResult.statusText,
        isLiveGps: gpsResult.isLiveGps,
        effectiveSymptoms,
      });

      if (user.id) {
        void createTriageAssessmentInFirestore(user.id, {
          duration,
          symptoms: effectiveSymptoms,
          notes: details,
          temperature: maxTemp,
          hasRedFlags: urgencyText === 'ฉุกเฉิน',
          redFlagsList: urgencyText === 'ฉุกเฉิน' ? matchedSigns : [],
          level,
          title: `ระดับความรุนแรง: ${urgencyText}`,
          description: advice,
          clinicalSummary: summary,
          recommendedHospitalId: recommendedHospital.id,
          recommendedHospitalName: recommendedHospital.name,
          recommendedService: recService,
        }).catch(() => {
          // Error already logged by handleFirestoreError
        });
      }

      setStep(3);
      playChime(urgencyText === 'ฉุกเฉิน' ? 'alert' : 'success');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleBooking = async () => {
    if (!result || isBooking || !user.id) return;
    setIsBooking(true);
    try {
      const dept =
        result.urgencyText === 'ฉุกเฉิน'
          ? 'แผนกอุบัติเหตุ-ฉุกเฉิน (ER)'
          : result.recommendedHospital.departments[0]?.name || 'แผนกตรวจโรคทั่วไป (OPD)';

      const prefix = result.urgencyText === 'ฉุกเฉิน' ? 'ER' : result.level === 'orange' ? 'B' : 'A';
      const queueNum = `${prefix}-0${Math.floor(10 + Math.random() * 80)}`;

      const newTicket = await createQueueTicketInFirestore(user.id, {
        hospitalId: result.recommendedHospital.id,
        hospitalName: result.recommendedHospital.name,
        department: dept,
        queueNum,
        triageLevel: result.level,
        triageTitle: `ระดับ ${result.urgencyText} (${result.level.toUpperCase()} Tag)`,
        ahead: result.urgencyText === 'ฉุกเฉิน' ? 0 : 2,
        estWait: result.urgencyText === 'ฉุกเฉิน' ? 'เข้าตรวจทันที' : '~15-20 นาที',
        symptomsSummary: `${result.effectiveSymptoms.join(', ')} • ${duration}`,
      });

      onBookingCompleted(newTicket);
    } finally {
      setIsBooking(false);
    }
  };

  const handleCopySummary = () => {
    if (!result) return;
    const text = `[ใบสรุปอาการ InnoTector]\nผู้ป่วย: ${user.name} (HN: ${user.hn})\nสิทธิรักษา: ${user.medicalRight || '-'}\nอาการ: ${result.effectiveSymptoms.join(', ')}\nระยะเวลา: ${duration}\nระดับความรุนแรง: ${result.urgencyText}\nเหตุผลทางคลินิก: ${result.clinicalReason}\nคำแนะนำ: ${result.advice}\nสถานพยาบาลแนะนำ: ${result.recommendedHospital.name}`;
    void navigator.clipboard?.writeText(text);
    setToastMsg('คัดลอกสรุปข้อมูลทางการแพทย์เรียบร้อยแล้ว');
    setTimeout(() => setToastMsg(null), 2500);
  };

  return (
    <div className="p-3.5 sm:p-4 space-y-4 select-none pb-28">
      {toastMsg && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 bg-emerald-800 text-white rounded-2xl text-xs font-heading font-bold shadow-xl flex items-center gap-1.5">
          <Check className="w-4 h-4 text-emerald-300" />
          <span>{toastMsg}</span>
        </div>
      )}
      {/* ================= STEP 1: ASSESSMENT FORM MATCHING SCREENSHOT 2 ================= */}
      {step === 1 && (
        <div className="space-y-3.5 animate-in fade-in duration-200">
          {/* Top Banner Header with Back Button */}
          <div className="flex items-center justify-between pb-1">
            <button
              onClick={onBackToHome}
              className="w-9 h-9 rounded-full bg-white hover:bg-slate-100 text-slate-800 flex items-center justify-center border border-slate-200 shadow-xs cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h3 className="font-heading font-extrabold text-slate-900 text-sm sm:text-base">
              ประเมินอาการ
            </h3>
            <div className="w-9"></div>
          </div>

          {/* Top Card: Green Banner from Screenshot 2 */}
          <div className="relative overflow-hidden rounded-[26px] bg-gradient-to-br from-[#163d2d] via-[#1c4c39] to-[#0f2e21] text-white p-5 sm:p-6 shadow-lg border border-emerald-900/40">
            <div className="absolute -top-12 -right-12 w-36 h-36 bg-white/5 rounded-full blur-xl pointer-events-none" />
            <div className="absolute bottom-2 right-3 opacity-15 pointer-events-none">
              <Stethoscope className="w-24 h-24 text-emerald-300" strokeWidth={1.5} />
            </div>

            <div className="relative z-10 space-y-2">
              {/* Pill badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/25 backdrop-blur-md border border-white/10 text-[11px] font-semibold text-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Smart Medical AI</span>
              </div>

              {/* Main title */}
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-heading leading-tight pt-1">
                ประเมินอาการเพื่อรับการรักษา
              </h2>

              {/* Subtitle */}
              <p className="text-xs text-[#a9d0bc] font-light leading-relaxed max-w-[92%]">
                เลือกอาการที่คุณพบ AI จะช่วยวิเคราะห์ระดับความเสี่ยงและส่งต่อข้อมูลให้โรงพยาบาล
              </p>
            </div>
          </div>

          {/* Section 1 Card: 1 ระบุอาการของคุณ */}
          <div className="bg-white rounded-[28px] p-4 sm:p-5 card-shadow border border-slate-100">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-3.5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs font-heading">
                  1
                </div>
                <h3 className="font-bold text-sm text-slate-800 font-heading">
                  ระบุอาการของคุณ
                </h3>
              </div>
              <span className="text-[11px] text-slate-400 font-normal">
                *เลือกได้มากกว่า 1 ข้อ
              </span>
            </div>

            {/* 6 Grid Symptom Buttons in 2 columns */}
            <div className="grid grid-cols-2 gap-2.5">
              {GRID_SYMPTOMS.map((item) => {
                const isSelected = selectedSymptoms.includes(item.id);
                const IconComponent = item.icon;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleSymptom(item.id)}
                    className={`relative p-3 rounded-2xl border transition-all duration-150 flex items-center gap-2.5 text-left cursor-pointer active:scale-[0.98] ${
                      isSelected
                        ? 'border-[#2f6b52] bg-[#eaf5ef] text-[#163d2d] shadow-xs'
                        : 'border-slate-200/90 bg-white hover:bg-slate-50/80 text-slate-700'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                        isSelected ? 'bg-white shadow-xs ring-1 ring-[#2f6b52]/25' : 'bg-slate-50 border border-slate-100'
                      }`}
                    >
                      <IconComponent className="w-7 h-7" />
                    </div>

                    <span
                      className={`text-xs font-heading font-semibold leading-tight line-clamp-1 ${
                        isSelected ? 'text-[#163d2d] font-bold' : 'text-slate-800'
                      }`}
                    >
                      {item.label}
                    </span>

                    {isSelected && (
                      <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-[#2f6b52] text-white flex items-center justify-center text-[9px]">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* 7th Symptom: "อื่นๆ" spanning full width matching Screenshot 2 */}
            <div className="mt-2.5">
              <button
                type="button"
                onClick={() => toggleSymptom('อื่นๆ')}
                className={`w-full p-3 rounded-2xl border transition-all duration-150 flex items-center gap-2.5 text-left cursor-pointer active:scale-[0.98] ${
                  selectedSymptoms.includes('อื่นๆ')
                    ? 'border-[#2f6b52] bg-[#eaf5ef] text-[#163d2d] shadow-xs'
                    : 'border-slate-200/90 bg-white hover:bg-slate-50/80 text-slate-700'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    selectedSymptoms.includes('อื่นๆ') ? 'bg-white shadow-xs ring-1 ring-[#2f6b52]/25' : 'bg-slate-50 border border-slate-100'
                  }`}
                >
                  <OtherSymptomIcon className="w-7 h-7" />
                </div>
                <span
                  className={`text-xs font-heading font-semibold ${
                    selectedSymptoms.includes('อื่นๆ') ? 'text-[#163d2d] font-bold' : 'text-slate-800'
                  }`}
                >
                  อื่นๆ
                </span>

                {selectedSymptoms.includes('อื่นๆ') && (
                  <div className="ml-auto w-4 h-4 rounded-full bg-[#2f6b52] text-white flex items-center justify-center text-[9px]">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* Section 2 Card: 2 รายละเอียดอาการ matching Screenshot 2 */}
          <div className="bg-white rounded-[28px] p-4 sm:p-5 card-shadow border border-slate-100 space-y-3.5">
            <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
              <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs font-heading">
                2
              </div>
              <h3 className="font-bold text-sm text-slate-800 font-heading">
                รายละเอียดอาการ
              </h3>
            </div>

            {/* Duration Dropdown */}
            <div>
              <label htmlFor="duration-select" className="block text-xs font-bold text-slate-700 mb-1 font-heading">
                อาการเป็นมานานเท่าใด
              </label>
              <select
                id="duration-select"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full p-3 text-xs rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              >
                <option value="">เลือกระยะเวลา</option>
                <option value="น้อยกว่า 1 วัน">น้อยกว่า 1 วัน</option>
                <option value="1-2 วัน">1-2 วัน</option>
                <option value="3-5 วัน">3-5 วัน</option>
                <option value="มากกว่า 1 สัปดาห์">มากกว่า 1 สัปดาห์</option>
              </select>
            </div>

            {/* Additional details textarea */}
            <div>
              <label htmlFor="details-input" className="block text-xs font-bold text-slate-700 mb-1 font-heading">
                รายละเอียดเพิ่มเติม (ช่วยประเมินระดับความรุนแรงได้แม่นยำขึ้น)
              </label>
              <textarea
                id="details-input"
                rows={3}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="เช่น มีไข้สูง 39 องศา หนาวสั่น แน่นหน้าอก หายใจลำบาก อาเจียนหลายครั้ง ท้องเสียรุนแรง หรืออาการอื่นๆ ที่เป็นอยู่..."
                className="w-full p-3 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
              {hasOnlyOtherWithoutDetails && (
                <p className="text-[11px] text-amber-700 font-medium mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>กรุณาพิมพ์อาการที่เป็นอยู่ในช่องรายละเอียดเพิ่มเติม เพื่อให้ระบบประเมินระดับความรุนแรงได้ตรงตามจริง</span>
                </p>
              )}
            </div>

            {/* Review Box */}
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 text-[11px] space-y-1 text-slate-600 font-mono">
              <div className="flex justify-between gap-2">
                <span className="text-slate-400 shrink-0">อาการหลัก:</span>
                <span className="font-bold text-slate-800 text-right">
                  {selectedSymptoms.length
                    ? selectedSymptoms.join(', ')
                    : details.trim()
                    ? details.trim()
                    : 'ยังไม่ได้ระบุอาการ'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">ระยะเวลา:</span>
                <span className="font-bold text-slate-800">{duration || 'ไม่ระบุ'}</span>
              </div>
            </div>

            {/* Confirmation Checkbox */}
            <label className="flex items-start gap-2 pt-1 cursor-pointer">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="accent-emerald-700 w-4 h-4 rounded mt-0.5"
              />
              <span className="text-[11px] text-slate-500 leading-snug">
                ข้าพเจ้ายืนยันว่าข้อมูลที่ให้ไว้ข้างต้นถูกต้องตามความเป็นจริง
              </span>
            </label>

            {/* Next CTA */}
            <button
              type="button"
              onClick={() => void calculateTriage()}
              disabled={!canSubmitAssessment || isAnalyzing}
              className="w-full bg-[#1c4c39] hover:bg-[#163d2d] active:scale-[0.99] disabled:opacity-40 text-white font-bold py-3.5 px-4 rounded-2xl shadow-md text-xs sm:text-sm font-heading flex items-center justify-center gap-2 cursor-pointer transition"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>กำลังจับพิกัด GPS &amp; คัดกรองสถานพยาบาลที่เปิดตรงสิทธิ...</span>
                </>
              ) : (
                <span>ยืนยันและดูผลการวิเคราะห์ →</span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ================= STEP 3: RESULT SCREEN WITH REAL MAP TRIGGER ================= */}
      {step === 3 && result && (
        <div className="space-y-3.5 animate-in fade-in duration-200">
          {/* Header row with back button */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-emerald-700 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> แก้ไขข้อมูลอาการ
            </button>
            <h3 className="font-heading font-extrabold text-slate-900 text-sm">ผลการวิเคราะห์</h3>
            <div className="w-16"></div>
          </div>

          {/* Urgency Card */}
          <div className="bg-white rounded-[28px] p-5 card-shadow border border-slate-100 text-center space-y-3">
            <div>
              <span className="text-xs font-bold text-slate-400 font-heading uppercase tracking-wider block">
                ระดับความรุนแรงของอาการ
              </span>
              <h2
                className="text-3xl font-black font-heading mt-1"
                style={{ color: result.color }}
              >
                {result.urgencyText}
              </h2>
              <p className="text-xs text-slate-700 font-semibold mt-1">{result.advice}</p>
              <p className="text-[11px] text-slate-500 mt-1.5 bg-slate-50 border border-slate-100 rounded-xl px-3 py-1.5 leading-snug">
                {result.clinicalReason}
              </p>
            </div>

            {/* 4-Scale Bar Indicator */}
            <div className="space-y-1 pt-1">
              <div className="flex h-2.5 rounded-full overflow-hidden gap-1 bg-slate-100 p-0.5">
                <div
                  className={`flex-1 rounded-full transition-all ${
                    result.urgencyText === 'ต่ำ' ? 'bg-emerald-500 ring-2 ring-emerald-300' : 'bg-emerald-200'
                  }`}
                />
                <div
                  className={`flex-1 rounded-full transition-all ${
                    result.urgencyText === 'ปานกลาง' ? 'bg-amber-400 ring-2 ring-amber-300' : 'bg-amber-200'
                  }`}
                />
                <div
                  className={`flex-1 rounded-full transition-all ${
                    result.urgencyText === 'สูง' ? 'bg-orange-500 ring-2 ring-orange-300' : 'bg-orange-200'
                  }`}
                />
                <div
                  className={`flex-1 rounded-full transition-all ${
                    result.urgencyText === 'ฉุกเฉิน' ? 'bg-rose-600 ring-2 ring-rose-400' : 'bg-rose-200'
                  }`}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-heading font-medium px-1">
                <span className={result.urgencyText === 'ต่ำ' ? 'font-bold text-emerald-700 underline' : ''}>ต่ำ</span>
                <span className={result.urgencyText === 'ปานกลาง' ? 'font-bold text-amber-700 underline' : ''}>ปานกลาง</span>
                <span className={result.urgencyText === 'สูง' ? 'font-bold text-orange-700 underline' : ''}>สูง</span>
                <span className={result.urgencyText === 'ฉุกเฉิน' ? 'font-bold text-rose-700 underline' : ''}>ฉุกเฉิน</span>
              </div>
            </div>
          </div>

          {/* Symptoms Detected */}
          <div className="bg-white rounded-2xl p-4 card-shadow border border-slate-100 space-y-2">
            <h4 className="font-heading font-bold text-xs text-slate-800">อาการที่ตรวจพบ</h4>
            <div className="flex flex-wrap gap-1.5">
              {result.effectiveSymptoms.map((s) => {
                const matched = GRID_SYMPTOMS.find((item) => item.id === s);
                const SymIcon = matched ? matched.icon : OtherSymptomIcon;
                return (
                  <span
                    key={s}
                    className="px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200/80 text-xs font-semibold flex items-center gap-1.5"
                  >
                    <SymIcon className="w-4 h-4 shrink-0" />
                    <span>{s}</span>
                  </span>
                );
              })}
            </div>

            {details.trim() && (
              <p className="text-[11px] text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-100">
                รายละเอียดที่ระบุ: <strong className="text-slate-800">{details.trim()}</strong>
              </p>
            )}

            <div className="text-xs pt-2 border-t border-slate-100 text-slate-600">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" /> ระยะเวลา: <strong>{duration || 'ไม่ระบุ'}</strong>
              </span>
            </div>
          </div>

          {/* AI Medical Summary */}
          <div className="bg-white rounded-2xl p-4 card-shadow border border-slate-100 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-heading font-bold text-xs text-slate-800 flex items-center gap-1.5">
                <Stethoscope className="w-4 h-4 text-emerald-700" />
                <span>AI Medical Summary (สรุปคำแนะนำแพทย์)</span>
              </h4>
              <button
                onClick={handleCopySummary}
                className="text-[10px] text-emerald-700 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
              >
                <Copy className="w-3 h-3" /> คัดลอก
              </button>
            </div>
            <p className="bg-[#eaf5ef] p-3 rounded-xl border border-emerald-200/70 text-slate-700 text-xs leading-relaxed font-sans">
              {result.summary}
            </p>
            <p className="text-[10px] text-slate-400">
              ข้อสำคัญ: ไม่ใช่การวินิจฉัยทางการแพทย์ ไม่ได้ใช้แทนการปรึกษาแพทย์
            </p>
          </div>

          {/* Recommended Service Type Grid — Non-interactive, locked to app recommendation */}
          <div className="bg-white rounded-2xl p-4 card-shadow border border-slate-100 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <h4 className="font-heading font-bold text-xs text-slate-800">
                แนะนำการรับบริการ
              </h4>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center text-[11px] select-none pointer-events-none">
              {(['ร้านยา', 'คลินิก', 'โรงพยาบาล', 'ห้องฉุกเฉิน'] as const).map((service) => {
                const isRecommended = result.recommendedService === service;
                return (
                  <div
                    key={service}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition ${
                      isRecommended
                        ? 'border-[#2f6b52] bg-[#eaf5ef] font-bold text-[#163d2d] ring-2 ring-[#2f6b52]/40 shadow-xs'
                        : 'border-slate-100 bg-slate-50/70 text-slate-400 opacity-50'
                    }`}
                  >
                    <span className="text-base">{service === 'ร้านยา' ? '💊' : service === 'คลินิก' ? '🩺' : service === 'โรงพยาบาล' ? '🏥' : '🚑'}</span>
                    <span className="font-heading text-[10px]">{service}</span>
                    {isRecommended && (
                      <span className="text-[8px] bg-[#2f6b52] text-white px-1.5 py-0.2 rounded font-bold">
                        แนะนำ
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recommended Hospital Card — Non-interactive, filtered by GPS + open hours + healthcare right */}
          <div className="bg-white rounded-2xl p-4 card-shadow border border-slate-100 space-y-3">
            <div className="flex items-center justify-between font-heading gap-2">
              <span className="flex items-center gap-1.5 font-bold text-slate-800 text-xs">
                <Building2 className="w-4 h-4 text-emerald-700" />
                <span>สถานพยาบาลแนะนำ</span>
              </span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                {result.liveFacility?.openStatusLabel || 'แนะนำที่สุด'}
              </span>
            </div>

            <div className="p-3 bg-emerald-50/70 rounded-2xl border border-emerald-200 space-y-2.5 select-none pointer-events-none">
              <div className="flex justify-between items-start gap-2">
                <div className="min-w-0">
                  <h5 className="font-bold text-slate-900 text-sm font-heading leading-snug">
                    {result.recommendedHospital.name}
                  </h5>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    {result.liveFacility?.areaSummary || result.recommendedHospital.district} • ห่าง {result.recommendedHospital.distanceKm} กม.
                  </p>
                </div>
                {result.liveFacility?.isOpenNow === true || result.liveFacility?.is24Hours ? (
                  <span className="bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-lg text-[10px] shrink-0">
                    เปิดอยู่ตอนนี้
                  </span>
                ) : result.liveFacility?.isOpenNow === false ? (
                  <span className="bg-amber-600 text-white font-bold px-2 py-0.5 rounded-lg text-[10px] shrink-0">
                    นอกเวลาทำการ
                  </span>
                ) : (
                  <span className="bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-lg text-[10px] shrink-0">
                    พร้อมบริการ
                  </span>
                )}
              </div>

              {result.liveFacility && (
                <div className="space-y-1.5 pt-1 border-t border-emerald-200/80 text-[11px]">
                  <div className="flex items-start gap-1.5 text-slate-700">
                    <Clock className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                    <span>
                      {result.liveFacility.openHoursText || result.liveFacility.openStatusLabel}
                    </span>
                  </div>
                  <div className="flex items-start gap-1.5 text-emerald-900 font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                    <span>{result.liveFacility.rightMatchReason}</span>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    {result.isLiveGps
                      ? 'คัดกรองจากพิกัด GPS ปัจจุบัน + เวลาเปิด-ปิดจริง + สิทธิรักษาของคุณ'
                      : result.gpsStatusText}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-emerald-200 text-[11px]">
                <div>
                  <span className="text-slate-400 block text-[10px]">ระยะทางจริง</span>
                  <strong className="text-slate-800">{result.recommendedHospital.distanceKm} กม.</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">เดินทางโดยประมาณ</span>
                  <strong className="text-emerald-700">~{result.recommendedHospital.estWaitMinutes} นาที</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">ระดับบริการ</span>
                  <strong className="text-emerald-800">{result.recommendedService}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Action CTAs - OPENS INTERACTIVE MAP DIRECTLY */}
          <div className="space-y-2 pt-1">
            <button
              onClick={() => onOpenMap(result.liveFacility || undefined)}
              className="w-full bg-[#1c4c39] hover:bg-[#163d2d] active:scale-[0.99] text-white font-bold py-3.5 px-4 rounded-2xl shadow-md text-xs font-heading flex items-center justify-center gap-2 cursor-pointer transition"
            >
              <MapPin className="w-4 h-4 text-emerald-300" />
              <span>ดูสถานพยาบาลใกล้ฉัน &amp; นำทางบนแผนที่</span>
            </button>

            <button
              onClick={() => void handleBooking()}
              disabled={isBooking}
              className="w-full bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-2xl text-xs font-heading flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
            >
              {isBooking ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CalendarCheck className="w-4 h-4 text-emerald-200" />
              )}
              <span>{isBooking ? 'กำลังบันทึกคิว...' : 'ยืนยันจองคิวตรวจกับสถานพยาบาลนี้'}</span>
            </button>

            <button
              onClick={() => onConsultDoctor(result.summary)}
              className="w-full bg-cyan-800 hover:bg-cyan-900 text-white font-bold py-2.5 px-4 rounded-2xl text-xs font-heading flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5 text-cyan-200" />
              <span>ส่งข้อมูลปรึกษาแพทย์ผ่านแชต</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
