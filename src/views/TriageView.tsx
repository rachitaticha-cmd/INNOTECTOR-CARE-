import React, { useState } from 'react';
import {
  Thermometer,
  Wind,
  Brain,
  HeartCrack,
  Activity,
  PlusCircle,
  MessageCircle,
  Stethoscope,
  ArrowRight,
  ArrowLeft,
  CalendarCheck,
  Navigation,
  MessageSquare,
  Building2,
  Check,
  CheckCircle2,
  Copy,
  Clock,
  Sparkles,
  MapPin,
} from 'lucide-react';
import { Hospital, QueueTicket, TriageLevel, UserProfile } from '../types';
import { saveTriageAssessment, addQueue, playChime } from '../services/storage';

interface TriageViewProps {
  user: UserProfile;
  hospitals: Hospital[];
  currentDistrict: string;
  onBookingCompleted: (ticket: QueueTicket) => void;
  onConsultDoctor: (triageSummary: string) => void;
  onOpenMap: () => void;
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
  const [step, setStep] = useState<1 | 3>(1);

  // Exact symptoms requested: มีไข้, ไอ, เจ็บคอ, ปวดศีรษะ, ปวดท้อง, มีน้ำมูก, อื่นๆ
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([
    'มีไข้',
    'ไอ',
  ]);

  const [duration, setDuration] = useState<string>('1-2 วัน');
  const [details, setDetails] = useState<string>('');
  const [confirmed, setConfirmed] = useState<boolean>(true);
  const [selectedService, setSelectedService] = useState<'ร้านยา' | 'คลินิก' | 'โรงพยาบาล' | 'ห้องฉุกเฉิน'>('คลินิก');

  // Result state
  const [result, setResult] = useState<{
    level: TriageLevel;
    urgencyText: 'ต่ำ' | 'ปานกลาง' | 'สูง' | 'ฉุกเฉิน';
    color: string;
    bgColor: string;
    advice: string;
    summary: string;
    recommendedHospital: Hospital;
  } | null>(null);

  // Exact symptoms requested: มีไข้, ไอ, เจ็บคอ, ปวดศีรษะ, ปวดท้อง, มีน้ำมูก, อื่นๆ
  const GRID_SYMPTOMS = [
    {
      id: 'มีไข้',
      label: 'มีไข้',
      icon: (props: { className?: string }) => (
        <svg className={props.className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {/* Clinical thermometer with mercury bulb and level */}
          <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
          <path d="M12 9v4" />
          <path d="M10 6h2M10 8h1.5M10 10h2" />
        </svg>
      ),
    },
    {
      id: 'ไอ',
      label: 'ไอ',
      icon: (props: { className?: string }) => (
        <svg className={props.className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {/* Profile head coughing with droplet mist */}
          <path d="M11 4a5 5 0 0 0-5 5v3a5 5 0 0 0 3 4.58V20h5v-3.5" />
          <path d="M6 11h2.5" />
          <circle cx="15.5" cy="11.5" r="1" fill="currentColor" />
          <circle cx="18.5" cy="9.5" r="1.2" fill="currentColor" />
          <circle cx="19.5" cy="13.5" r="1" fill="currentColor" />
          <circle cx="17.5" cy="15.5" r="0.8" fill="currentColor" />
        </svg>
      ),
    },
    {
      id: 'เจ็บคอ',
      label: 'เจ็บคอ',
      icon: (props: { className?: string }) => (
        <svg className={props.className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {/* Anatomical neck with sore throat focus ring */}
          <path d="M7 3v4c0 2 1.5 3.5 3 4.5l-1 8.5h6l-1-8.5c1.5-1 3-2.5 3-4.5V3" />
          <circle cx="12" cy="10" r="2.2" strokeWidth="2" />
          <path d="M12 9v2M11 10h2" />
        </svg>
      ),
    },
    {
      id: 'ปวดศีรษะ',
      label: 'ปวดศีรษะ',
      icon: (props: { className?: string }) => (
        <svg className={props.className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {/* Cranial silhouette with migraine pulse waves */}
          <path d="M12 21a7 7 0 0 0 7-7c0-2-1-3.5-2-4.5V7a5 5 0 0 0-10 0v2.5C6 10.5 5 12 5 14a7 7 0 0 0 7 7z" />
          <path d="M9.5 7.5l2.5 3 2.5-3" strokeWidth="2" />
          <path d="M3 8c1-1 2-1 3 0M18 8c1-1 2-1 3 0" />
        </svg>
      ),
    },
    {
      id: 'ปวดท้อง',
      label: 'ปวดท้อง',
      icon: (props: { className?: string }) => (
        <svg className={props.className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {/* Abdominal torso with targeted stomach cramp indicator */}
          <path d="M6 4c2 3 2 7 1 14h10c-1-7-1-11 1-14" />
          <path d="M9 11c1-1 2-1 3 0s2 1 3 0" />
          <path d="M9 14c1-1 2-1 3 0s2 1 3 0" />
          <circle cx="12" cy="12.5" r="1" fill="currentColor" />
        </svg>
      ),
    },
    {
      id: 'มีน้ำมูก',
      label: 'มีน้ำมูก',
      icon: (props: { className?: string }) => (
        <svg className={props.className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {/* Nose profile with nasal drop indicator */}
          <path d="M10 3v9a3 3 0 0 0 3 3h1a2 2 0 0 0 2-2v-1" />
          <path d="M9 17.5a2 2 0 0 0 2.5 1.9c1.1-.3 1.5-1.2 1.5-1.9 0-1-1.5-2.5-1.5-2.5S9 16.5 9 17.5z" fill="currentColor" fillOpacity="0.4" />
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

  const calculateTriage = () => {
    const hasEmergencySymptom =
      selectedSymptoms.includes('แน่นหน้าอก') ||
      selectedSymptoms.includes('หายใจเหนื่อยหอบ');

    let urgencyText: 'ต่ำ' | 'ปานกลาง' | 'สูง' | 'ฉุกเฉิน' = 'ปานกลาง';
    let level: TriageLevel = 'yellow';
    let color = '#d6a716';
    let bgColor = 'bg-amber-500';
    let advice = 'ควรพบแพทย์หรือคลินิกเพื่อรับการตรวจประเมินภายใน 24 ชั่วโมง';
    let recService: 'ร้านยา' | 'คลินิก' | 'โรงพยาบาล' | 'ห้องฉุกเฉิน' = 'คลินิก';

    if (hasEmergencySymptom) {
      urgencyText = 'ฉุกเฉิน';
      level = 'red';
      color = '#e0503a';
      bgColor = 'bg-rose-600';
      advice = 'ควรไปห้องฉุกเฉินโรงพยาบาลทันที หรือติดต่อสายด่วน 1669';
      recService = 'ห้องฉุกเฉิน';
    } else if (
      (selectedSymptoms.includes('ปวดศีรษะ') && (selectedSymptoms.includes('มีไข้') || selectedSymptoms.includes('ไข้'))) ||
      (selectedSymptoms.includes('ปวดท้อง') && (selectedSymptoms.includes('มีไข้') || selectedSymptoms.includes('ไข้'))) ||
      selectedSymptoms.length >= 3
    ) {
      urgencyText = 'สูง';
      level = 'orange';
      color = '#e0684a';
      bgColor = 'bg-orange-500';
      advice = 'ควรได้รับการตรวจรักษาที่โรงพยาบาลภายใน 6-12 ชั่วโมง';
      recService = 'โรงพยาบาล';
    } else if (
      selectedSymptoms.includes('มีไข้') ||
      selectedSymptoms.includes('ไข้') ||
      selectedSymptoms.includes('ปวดท้อง') ||
      selectedSymptoms.length >= 2
    ) {
      urgencyText = 'ปานกลาง';
      level = 'yellow';
      color = '#d6a716';
      bgColor = 'bg-amber-500';
      advice = 'ควรเข้ารับการตรวจที่คลินิกหรือศูนย์บริการสาธารณสุขใกล้บ้าน';
      recService = 'คลินิก';
    } else {
      urgencyText = 'ต่ำ';
      level = 'green';
      color = '#22a06b';
      bgColor = 'bg-emerald-600';
      advice = 'พักผ่อน ดื่มน้ำมากๆ สังเกตอาการ 2-3 วัน สามารถปรึกษาเภสัชกรที่ร้านยาได้';
      recService = 'ร้านยา';
    }

    setSelectedService(recService);

    // Pick best hospital in the active district
    const districtHospitals = hospitals.filter((h) => h.district === currentDistrict);
    const candidateList = districtHospitals.length > 0 ? districtHospitals : hospitals;
    const sorted = [...candidateList].sort((a, b) => a.congestionPct - b.congestionPct);
    const recommendedHospital = sorted[0] || hospitals[0];

    const summary = `ผู้ใช้งานมีอาการ: ${selectedSymptoms.join(', ')} เป็นเวลา ${duration}.${
      details ? ` รายละเอียดเพิ่มเติม: "${details}".` : ''
    } ระบบ AI ประเมินอาการดังกล่าวอยู่ในระดับความเร่งด่วน: ${urgencyText} (${advice}) แนะนำเข้ารับบริการ: ${recService}`;

    setResult({
      level,
      urgencyText,
      color,
      bgColor,
      advice,
      summary,
      recommendedHospital,
    });

    saveTriageAssessment({
      userId: user.id,
      duration,
      symptoms: selectedSymptoms,
      notes: details,
      temperature: undefined,
      hasRedFlags: hasEmergencySymptom,
      redFlagsList: hasEmergencySymptom ? ['พบสัญญาณเร่งด่วนทางระบบหายใจ/หัวใจ'] : [],
      level,
      title: `ระดับความเร่งด่วน: ${urgencyText}`,
      description: advice,
      clinicalSummary: summary,
      recommendedHospitalId: recommendedHospital.id,
      recommendedHospitalName: recommendedHospital.name,
      recommendedService: recService,
    });

    setStep(3);
    playChime(urgencyText === 'ฉุกเฉิน' ? 'alert' : 'success');
  };

  const handleBooking = () => {
    if (!result) return;
    const dept =
      result.urgencyText === 'ฉุกเฉิน'
        ? 'แผนกอุบัติเหตุ-ฉุกเฉิน (ER)'
        : result.recommendedHospital.departments[0]?.name || 'แผนกตรวจโรคทั่วไป (OPD)';

    const prefix = result.urgencyText === 'ฉุกเฉิน' ? 'ER' : result.level === 'orange' ? 'B' : 'A';
    const queueNum = `${prefix}-0${Math.floor(10 + Math.random() * 80)}`;

    const newTicket = addQueue({
      userId: user.id,
      hospitalId: result.recommendedHospital.id,
      hospitalName: result.recommendedHospital.name,
      department: dept,
      queueNum,
      triageLevel: result.level,
      triageTitle: `ระดับ ${result.urgencyText} (${result.level.toUpperCase()} Tag)`,
      ahead: result.urgencyText === 'ฉุกเฉิน' ? 0 : 2,
      estWait: result.urgencyText === 'ฉุกเฉิน' ? 'เข้าตรวจทันที' : '~15-20 นาที',
      symptomsSummary: `${selectedSymptoms.join(', ')} • ${duration}`,
    });

    onBookingCompleted(newTicket);
  };

  const handleCopySummary = () => {
    if (!result) return;
    const text = `[ใบสรุปอาการ InnoTector AI]\nผู้ป่วย: ${user.name} (HN: ${user.hn})\nอาการ: ${selectedSymptoms.join(', ')}\nระยะเวลา: ${duration}\nระดับความเร่งด่วน: ${result.urgencyText}\nคำแนะนำ: ${result.advice}`;
    navigator.clipboard?.writeText(text);
    alert('คัดลอกสรุปข้อมูลทางการแพทย์เรียบร้อยแล้ว');
  };

  return (
    <div className="p-3.5 sm:p-4 space-y-4 select-none pb-28">
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
                    className={`relative p-3.5 rounded-2xl border transition-all duration-150 flex items-center gap-2.5 text-left cursor-pointer active:scale-[0.98] ${
                      isSelected
                        ? 'border-[#2f6b52] bg-[#eaf5ef] text-[#163d2d] shadow-xs'
                        : 'border-slate-200/90 bg-white hover:bg-slate-50/80 text-slate-700'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                        isSelected ? 'bg-[#2f6b52] text-white shadow-xs' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <IconComponent className="w-4 h-4 stroke-[2.2]" />
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
                className={`w-full p-3.5 rounded-2xl border transition-all duration-150 flex items-center gap-2.5 text-left cursor-pointer active:scale-[0.98] ${
                  selectedSymptoms.includes('อื่นๆ')
                    ? 'border-[#2f6b52] bg-[#eaf5ef] text-[#163d2d] shadow-xs'
                    : 'border-slate-200/90 bg-white hover:bg-slate-50/80 text-slate-700'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    selectedSymptoms.includes('อื่นๆ') ? 'bg-[#2f6b52] text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <MessageCircle className="w-4 h-4 stroke-[2.2]" />
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
                รายละเอียดเพิ่มเติม
              </label>
              <textarea
                id="details-input"
                rows={3}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="เช่น มีไข้สูง ปวดศีรษะ แน่นหน้าอก มีเสมหะ หรืออธิบายอาการเพิ่มเติม..."
                className="w-full p-3 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>

            {/* Review Box */}
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 text-[11px] space-y-1 text-slate-600 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">อาการหลัก:</span>
                <span className="font-bold text-slate-800">
                  {selectedSymptoms.length ? selectedSymptoms.join(', ') : 'ยังไม่ได้เลือกอาการ'}
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
              onClick={calculateTriage}
              disabled={!confirmed || selectedSymptoms.length === 0}
              className="w-full bg-[#1c4c39] hover:bg-[#163d2d] active:scale-[0.99] disabled:opacity-40 text-white font-bold py-3.5 px-4 rounded-2xl shadow-md text-xs sm:text-sm font-heading flex items-center justify-center gap-2 cursor-pointer transition"
            >
              <span>ยืนยันและดูผลการวิเคราะห์ →</span>
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
                ระดับความเร่งด่วน
              </span>
              <h2
                className="text-3xl font-black font-heading mt-1"
                style={{ color: result.color }}
              >
                {result.urgencyText}
              </h2>
              <p className="text-xs text-slate-600 font-semibold mt-1">{result.advice}</p>
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
              {selectedSymptoms.map((s) => (
                <span
                  key={s}
                  className="px-3 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200/80 text-xs font-semibold flex items-center gap-1.5"
                >
                  <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                  <span>{s}</span>
                </span>
              ))}
            </div>

            <div className="text-xs pt-2 border-t border-slate-100 text-slate-600">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" /> ระยะเวลา: <strong>{duration}</strong>
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

          {/* Recommended Service Type Grid (Locked by AI Recommendation - cannot be selected) */}
          <div className="bg-white rounded-2xl p-4 card-shadow border border-slate-100 space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="font-heading font-bold text-xs text-slate-800">
                แนะนำการรับบริการ
              </h4>
              <span className="text-[10px] text-emerald-800 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                🔒 ล็อกการแนะนำตาม AI
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center text-[11px]">
              {(['ร้านยา', 'คลินิก', 'โรงพยาบาล', 'ห้องฉุกเฉิน'] as const).map((service) => {
                const isRecommended = selectedService === service;
                return (
                  <div
                    key={service}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition select-none ${
                      isRecommended
                        ? 'border-[#2f6b52] bg-[#eaf5ef] font-bold text-[#163d2d] ring-2 ring-[#2f6b52]/40 shadow-xs'
                        : 'border-slate-100 bg-slate-50/60 text-slate-400 opacity-60'
                    }`}
                  >
                    <span className="text-base">{service === 'ร้านยา' ? '💊' : service === 'คลินิก' ? '🩺' : service === 'โรงพยาบาล' ? '🏥' : '🚑'}</span>
                    <span className="font-heading text-[10px]">{service}</span>
                    {isRecommended && (
                      <span className="text-[8px] bg-[#2f6b52] text-white px-1.5 py-0.2 rounded font-bold">
                        AI แนะนำ
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="text-[10px] text-slate-400 text-center">
              * ระบบ AI แนะนำประเภทบริการนี้ตามการประเมินความเสี่ยงทางการแพทย์ (ไม่สามารถกดเปลี่ยนได้)
            </p>
          </div>

          {/* Recommended Hospital Card in Area - CLICK OPENS MAP as requested */}
          <div className="bg-white rounded-2xl p-4 card-shadow border border-slate-100 space-y-3">
            <div className="flex items-center justify-between font-heading">
              <span className="flex items-center gap-1.5 font-bold text-slate-800 text-xs">
                <Building2 className="w-4 h-4 text-emerald-700" />
                <span>สถานพยาบาลแนะนำ (คิวน้อยสุดในพื้นที่)</span>
              </span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                แนะนำที่สุด
              </span>
            </div>

            <div
              onClick={onOpenMap}
              className="p-3 bg-emerald-50/70 hover:bg-emerald-100/70 transition rounded-2xl border border-emerald-200 space-y-2 cursor-pointer group"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h5 className="font-bold text-slate-900 text-sm font-heading group-hover:text-emerald-800 transition">
                    {result.recommendedHospital.name}
                  </h5>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    {result.recommendedHospital.district} • ห่าง {result.recommendedHospital.distanceKm} กม.
                  </p>
                </div>
                <span className="bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-lg text-[10px]">
                  ความหนาแน่น {result.recommendedHospital.congestionPct}%
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-emerald-200 text-[11px]">
                <div>
                  <span className="text-slate-400 block text-[10px]">รอคิว</span>
                  <strong className="text-slate-800">{result.recommendedHospital.totalWaitingCount} คิว</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">เวลารอ</span>
                  <strong className="text-emerald-700">~{result.recommendedHospital.estWaitMinutes} นาที</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">ดูบนแผนที่</span>
                  <strong className="text-emerald-700 flex items-center justify-center gap-0.5">
                    เปิดแผนที่ →
                  </strong>
                </div>
              </div>
            </div>
          </div>

          {/* Action CTAs - OPENS INTERACTIVE MAP DIRECTLY AS REQUESTED */}
          <div className="space-y-2 pt-1">
            <button
              onClick={onOpenMap}
              className="w-full bg-[#1c4c39] hover:bg-[#163d2d] active:scale-[0.99] text-white font-bold py-3.5 px-4 rounded-2xl shadow-md text-xs font-heading flex items-center justify-center gap-2 cursor-pointer transition"
            >
              <MapPin className="w-4 h-4 text-emerald-300" />
              <span>ดูสถานพยาบาลใกล้ฉัน & นำทางบนแผนที่</span>
            </button>

            <button
              onClick={handleBooking}
              className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3 px-4 rounded-2xl text-xs font-heading flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
            >
              <CalendarCheck className="w-4 h-4 text-emerald-200" />
              <span>ยืนยันจองคิวตรวจกับสถานพยาบาลนี้</span>
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
