import React, { useState, useRef } from 'react';
import {
  User,
  HeartPulse,
  AlertCircle,
  Phone,
  LogOut,
  Save,
  Activity,
  Building,
  Shield,
  FileText,
  Check,
  ChevronRight,
  Bell,
  Lock,
  HelpCircle,
  X,
  Sparkles,
  Camera,
  CheckCircle2,
  ArrowLeft,
  FileDown,
  Trash2,
  FileCheck,
  MapPin,
  TrendingUp,
  Image as ImageIcon,
  RotateCcw,
} from 'lucide-react';
import { UserProfile, WeightLogEntry } from '../types';
import { saveUser, playChime } from '../services/storage';
import { CARTOON_AVATARS } from '../data/mockData';

interface ProfileViewProps {
  user: UserProfile;
  onUpdateUser: (updated: UserProfile) => void;
  onLogout: () => void;
  onOpenQrModal: () => void;
  onOpenDoctorSummary: () => void;
  onOpenHealthcareRights: () => void;
  onOpenInsurancePartners: () => void;
  onOpenNotifications: () => void;
  unreadNotificationsCount?: number;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  onUpdateUser,
  onLogout,
  onOpenQrModal,
  onOpenDoctorSummary,
  onOpenHealthcareRights,
  onOpenInsurancePartners,
  onOpenNotifications,
  unreadNotificationsCount = 2,
}) => {
  // Modal states
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isHealthInfoOpen, setIsHealthInfoOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Policy view submodal
  const [policySubView, setPolicySubView] = useState<'privacy' | 'terms' | 'cookie' | null>(null);

  // Privacy toggles matching Screenshot 154214
  const [privacyToggles, setPrivacyToggles] = useState({
    shareWithDoctor: true,
    locationGps: true,
    anonymousResearch: true,
    marketingNotifications: false,
  });

  // Form data for editing
  const [formData, setFormData] = useState<UserProfile>(user);
  const [savedToast, setSavedToast] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Health info weights & inputs
  const [newWeight, setNewWeight] = useState('');
  const [newAllergy, setNewAllergy] = useState('');
  const [newChronic, setNewChronic] = useState('');

  React.useEffect(() => {
    setFormData(user);
  }, [user]);

  const weightLogs: WeightLogEntry[] = formData.weightLog || [
    { day: '15', mon: 'ส.ค.', weight: 68 },
    { day: '01', mon: 'ก.ค.', weight: 68.5 },
    { day: '10', mon: 'มิ.ย.', weight: 67 },
  ];

  const hMeter = (formData.heightCm || 170) / 100;
  const minIdealWeight = Math.round(18.5 * hMeter * hMeter);
  const maxIdealWeight = Math.round(22.9 * hMeter * hMeter);
  const bmiVal = formData.bmi || Number((formData.weightKg / (hMeter * hMeter)).toFixed(1));

  let bmiCategory = 'ปกติ';
  let bmiBadgeBg = 'bg-emerald-100 text-emerald-800';
  let markerPercent = 45;

  if (bmiVal < 18.5) {
    bmiCategory = 'ผอม / น้ำหนักน้อย';
    bmiBadgeBg = 'bg-blue-100 text-blue-800';
    markerPercent = Math.max(5, ((bmiVal - 12) / 6.5) * 25);
  } else if (bmiVal < 23) {
    bmiCategory = 'ปกติ (สมส่วน)';
    bmiBadgeBg = 'bg-emerald-100 text-emerald-800';
    markerPercent = 25 + ((bmiVal - 18.5) / 4.5) * 25;
  } else if (bmiVal < 25) {
    bmiCategory = 'ท้วม / น้ำหนักเกิน';
    bmiBadgeBg = 'bg-amber-100 text-amber-800';
    markerPercent = 50 + ((bmiVal - 23) / 2) * 25;
  } else {
    bmiCategory = 'อ้วน / เสี่ยงสูง';
    bmiBadgeBg = 'bg-rose-100 text-rose-800';
    markerPercent = Math.min(95, 75 + ((bmiVal - 25) / 10) * 25);
  }

  const handleSaveProfile = () => {
    const updatedBmi = Number((formData.weightKg / (hMeter * hMeter)).toFixed(1));
    const updated: UserProfile = {
      ...formData,
      bmi: updatedBmi,
      weightLog: weightLogs,
    };
    saveUser(updated);
    onUpdateUser(updated);
    setIsEditProfileOpen(false);
    setSavedToast('บันทึกข้อมูลโปรไฟล์และรูปภาพเรียบร้อยแล้ว');
    playChime('success');
    setTimeout(() => setSavedToast(null), 3000);
  };

  const handleSelectAvatar = (url: string) => {
    setFormData((prev) => ({ ...prev, avatarUrl: url }));
  };

  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          handleSelectAvatar(reader.result);
          setSavedToast('อัปโหลดรูปภาพจากแกลเลอรีสำเร็จ');
          playChime('success');
          setTimeout(() => setSavedToast(null), 2500);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddWeight = () => {
    const w = parseFloat(newWeight);
    if (isNaN(w) || w <= 0) return;

    const today = new Date();
    const thaiMonths = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
    const newEntry: WeightLogEntry = {
      day: String(today.getDate()).padStart(2, '0'),
      mon: thaiMonths[today.getMonth()],
      weight: w,
      dateStr: today.toLocaleDateString('th-TH'),
    };

    const newLogs = [newEntry, ...weightLogs];
    const updatedBmi = Number((w / (hMeter * hMeter)).toFixed(1));
    const updated = {
      ...formData,
      weightKg: w,
      bmi: updatedBmi,
      weightLog: newLogs,
    };

    setFormData(updated);
    saveUser(updated);
    onUpdateUser(updated);
    setNewWeight('');
    playChime('success');
  };

  const handleAddAllergy = () => {
    if (!newAllergy.trim()) return;
    const current = formData.drugAllergies.filter((a) => a !== 'ไม่มีประวัติแพ้ยา');
    const updated = {
      ...formData,
      drugAllergies: [...current, newAllergy.trim()],
    };
    setFormData(updated);
    saveUser(updated);
    onUpdateUser(updated);
    setNewAllergy('');
  };

  const handleRemoveAllergy = (idx: number) => {
    const next = formData.drugAllergies.filter((_, i) => i !== idx);
    const updated = {
      ...formData,
      drugAllergies: next.length ? next : ['ไม่มีประวัติแพ้ยา'],
    };
    setFormData(updated);
    saveUser(updated);
    onUpdateUser(updated);
  };

  const handleAddChronic = () => {
    if (!newChronic.trim()) return;
    const current = formData.chronicDiseases.filter((c) => c !== 'ไม่มี');
    const updated = {
      ...formData,
      chronicDiseases: [...current, newChronic.trim()],
    };
    setFormData(updated);
    saveUser(updated);
    onUpdateUser(updated);
    setNewChronic('');
  };

  const handleRemoveChronic = (idx: number) => {
    const next = formData.chronicDiseases.filter((_, i) => i !== idx);
    const updated = {
      ...formData,
      chronicDiseases: next.length ? next : ['ไม่มี'],
    };
    setFormData(updated);
    saveUser(updated);
    onUpdateUser(updated);
  };

  const exportHealthSummary = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(user, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `InnoTector_HealthRecord_${user.hn}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="select-none min-h-full pb-36 bg-[#f8fafc]">
      {/* Toast Notification */}
      {savedToast && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 p-3 bg-emerald-700 text-white rounded-2xl text-xs font-heading font-bold flex items-center gap-2 shadow-xl animate-in slide-in-from-top duration-200">
          <Check className="w-4 h-4 text-emerald-200 shrink-0 stroke-[3]" />
          <span>{savedToast}</span>
        </div>
      )}

      {/* Top Header Bar matching AISelect_20261101_150556_Chrome_a4410680.jpg */}
      <div className="bg-[#163d2d] text-white pt-4 pb-4 px-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-600/60 border border-emerald-400/40 flex items-center justify-center text-white font-bold text-base shadow-xs">
              +
            </div>
            <h1 className="font-heading font-extrabold text-base tracking-tight text-white">
              Inotector Care
            </h1>
          </div>

          <button
            onClick={onOpenNotifications}
            title="เปิดการแจ้งเตือน"
            className="relative w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center transition cursor-pointer border border-white/10 shadow-xs"
          >
            <Bell className="w-4 h-4 text-emerald-100" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-[#163d2d]" />
            )}
          </button>
        </div>
      </div>

      <div className="p-4 space-y-3.5">
        {/* Dark Green User Info Card matching AISelect_20261101_150556_Chrome_a4410680.jpg & AISelect_20261101_154449 */}
        <div className="bg-[#163d2d] text-white p-4.5 rounded-[26px] shadow-md flex items-center gap-4 relative overflow-hidden border border-emerald-900/40">
          <div className="relative">
            {/* User profile icon: authentic default silhouette or custom photo */}
            <div className="w-16 h-16 rounded-full border border-white/20 bg-white/10 flex items-center justify-center overflow-hidden shadow-inner shrink-0">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-full border border-white/40 bg-emerald-950/40 flex items-center justify-center shadow-inner">
                  <User className="w-6 h-6 text-white stroke-[1.8]" />
                </div>
              )}
            </div>
            {/* Quick avatar change trigger */}
            <button
              onClick={() => setIsEditProfileOpen(true)}
              className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#f7b73d] text-slate-900 flex items-center justify-center shadow-xs cursor-pointer hover:scale-110 transition"
              title="แก้ไขรูปภาพหรือเลือกรูปจากเครื่อง"
            >
              <Camera className="w-3 h-3 text-slate-900" />
            </button>
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="font-heading font-extrabold text-lg text-white truncate">
              {user.name}
            </h3>
            <p className="text-xs text-[#a3cbb5] font-light truncate mt-0.5">
              {user.email || 'user@email.com'}
            </p>
            <p className="text-xs text-[#a3cbb5] font-mono font-light mt-0.5">
              {user.emergencyContact?.phone || '08X-XXX-XXXX'}
            </p>
          </div>
        </div>

        {/* 
          White Menu Card matching AISelect_20261101_150556_Chrome_a4410680.jpg
          1. แก้ไขโปรไฟล์
          2. ข้อมูลสุขภาพส่วนตัว
          3. การแจ้งเตือน
          4. ความเป็นส่วนตัว
          5. ช่วยเหลือ
        */}
        <div className="bg-white rounded-[26px] border border-slate-100 card-shadow overflow-hidden divide-y divide-slate-100 text-xs">
          {/* 1. แก้ไขโปรไฟล์ */}
          <div
            onClick={() => setIsEditProfileOpen(true)}
            className="p-4 flex items-center justify-between hover:bg-slate-50 transition cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">✏️</span>
              <span className="font-heading font-bold text-slate-800 text-sm group-hover:text-emerald-700 transition">
                แก้ไขโปรไฟล์
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </div>

          {/* 2. ข้อมูลสุขภาพส่วนตัว */}
          <div
            onClick={() => setIsHealthInfoOpen(true)}
            className="p-4 flex items-center justify-between hover:bg-slate-50 transition cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">🩺</span>
              <div>
                <span className="font-heading font-bold text-slate-800 text-sm group-hover:text-emerald-700 transition block">
                  ข้อมูลสุขภาพส่วนตัว
                </span>
                <span className="text-[10px] text-slate-400">BMI, ประวัติแพ้ยา, โรคประจำตัว</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </div>

          {/* 3. การแจ้งเตือน */}
          <div
            onClick={onOpenNotifications}
            className="p-4 flex items-center justify-between hover:bg-slate-50 transition cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">🔔</span>
              <div className="flex items-center gap-2">
                <span className="font-heading font-bold text-slate-800 text-sm group-hover:text-emerald-700 transition">
                  การแจ้งเตือน
                </span>
                {unreadNotificationsCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {unreadNotificationsCount}
                  </span>
                )}
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </div>

          {/* 4. ความเป็นส่วนตัว matching Screenshot 154214 */}
          <div
            onClick={() => setIsPrivacyOpen(true)}
            className="p-4 flex items-center justify-between hover:bg-slate-50 transition cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">🔒</span>
              <span className="font-heading font-bold text-slate-800 text-sm group-hover:text-emerald-700 transition">
                ความเป็นส่วนตัว
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </div>

          {/* 5. ช่วยเหลือ */}
          <div
            onClick={() => setIsHelpOpen(true)}
            className="p-4 flex items-center justify-between hover:bg-slate-50 transition cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">❓</span>
              <span className="font-heading font-bold text-slate-800 text-sm group-hover:text-emerald-700 transition">
                ช่วยเหลือ
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* Separate Logout Card matching AISelect_20261101_150556_Chrome_a4410680.jpg */}
        <div
          onClick={onLogout}
          className="bg-white rounded-[26px] border border-slate-100 card-shadow p-4 flex items-center gap-3 hover:bg-rose-50/50 transition cursor-pointer group"
        >
          <span className="text-lg">🚪</span>
          <span className="font-heading font-bold text-rose-500 text-sm group-hover:text-rose-600 transition">
            ออกจากระบบ
          </span>
        </div>

        {/* Quick Links: สิทธิรักษา & ประกันสุขภาพ */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={onOpenHealthcareRights}
            className="p-3 bg-white hover:bg-emerald-50/40 rounded-2xl border border-slate-200 card-shadow text-left transition cursor-pointer"
          >
            <Building className="w-4 h-4 text-emerald-700 mb-1" />
            <span className="font-heading font-bold text-slate-800 text-[11px] block">
              สิทธิบัตรทอง / ประกันสังคม
            </span>
            <span className="text-[10px] text-slate-400">ตรวจสอบหน่วยบริการประจำ</span>
          </button>

          <button
            onClick={onOpenInsurancePartners}
            className="p-3 bg-white hover:bg-sky-50/40 rounded-2xl border border-slate-200 card-shadow text-left transition cursor-pointer"
          >
            <Shield className="w-4 h-4 text-sky-700 mb-1" />
            <span className="font-heading font-bold text-slate-800 text-[11px] block">
              เครือข่ายบริษัทประกัน
            </span>
            <span className="text-[10px] text-slate-400">เช็กสิทธิ Fax Claim</span>
          </button>
        </div>

        {/* Project Source Code Download Box */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-4 border border-slate-700/80 card-shadow space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base">💻</span>
                <h4 className="font-heading font-bold text-xs text-white">
                  ไฟล์โค้ดสำหรับนำไปทำต่อใน VS Code (HTML / Code)
                </h4>
              </div>
              <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                ส่งออกเป็นไฟล์ <span className="text-emerald-400 font-semibold">index.html</span> หรือแพ็กเกจ ZIP สามารถเปิดเขียนโค้ดต่อใน VS Code ได้ทันที
              </p>
            </div>
            <span className="text-[10px] bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 px-2 py-0.5 rounded-full shrink-0 font-mono">
              Ready
            </span>
          </div>

          {/* Option 1: Standalone HTML for VS Code */}
          <div className="bg-slate-800/70 rounded-xl p-3 border border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-300 flex items-center gap-1">
                <span>📄</span> โค้ด HTML เดี่ยว (สำหรับโค้ช / Live Server)
              </span>
              <span className="text-[9px] text-slate-400 font-mono">index.html (~216 KB)</span>
            </div>
            <p className="text-[10px] text-slate-300 leading-snug">
              เปิดใน VS Code ดับเบิลคลิกเปิดผ่านเว็บ หรือคลิกขวาเลือก "Open with Live Server" ได้ทันที ไม่ต้องติดตั้งโปรแกรมเสริม
            </p>
            <div className="flex gap-2 pt-0.5">
              <a
                href="/innotector-care.html"
                download="index.html"
                className="flex-1 py-1.5 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs text-center"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>โหลด index.html</span>
              </a>
              <a
                href="/innotector-care-vscode-html.zip"
                download="innotector-care-vscode-html.zip"
                className="flex-1 py-1.5 px-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 active:scale-95 text-slate-100 font-bold text-[11px] flex items-center justify-center gap-1.5 transition cursor-pointer border border-slate-600 text-center"
              >
                <FileDown className="w-3.5 h-3.5 text-emerald-400" />
                <span>โหลด ZIP (HTML)</span>
              </a>
            </div>
          </div>

          {/* Option 2: Full React Source */}
          <div className="pt-1 flex items-center justify-between text-[11px]">
            <span className="text-slate-400 text-[10px]">ต้องการตัวเต็ม React+TS:</span>
            <a
              href="/innotector-care-source.zip"
              download="innotector-care-source.zip"
              className="text-emerald-400 hover:text-emerald-300 underline font-medium text-[11px] flex items-center gap-1"
            >
              <FileDown className="w-3 h-3" /> ดาวน์โหลด React ZIP (~2.6 MB)
            </a>
          </div>

          <div className="bg-slate-950/60 rounded-xl p-2.5 border border-slate-800 text-[10px] font-mono text-slate-400 space-y-1">
            <p className="text-emerald-400 font-sans font-medium text-[10px]">วิธีเปิดทำต่อใน VS Code:</p>
            <p>1. ดาวน์โหลดไฟล์ <code className="text-amber-300">index.html</code> หรือแตกไฟล์ ZIP</p>
            <p>2. เปิด VS Code &gt; ลากไฟล์ <code className="text-amber-300">index.html</code> เข้ามา</p>
            <p>3. คลิกขวาเลือก <code className="text-amber-300">Open with Live Server</code> หรือดับเบิลคลิกเปิดดูใน Chrome</p>
          </div>
        </div>
      </div>

      {/* ================= MODAL 1: แก้ไขโปรไฟล์ & อัปโหลดรูปจากเครื่อง / ตัวการ์ตูน ================= */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] p-5 max-w-md w-full shadow-2xl relative border border-slate-100 max-h-[92vh] overflow-y-auto no-scrollbar">
            <button
              onClick={() => setIsEditProfileOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="mb-4">
              <h3 className="font-heading font-extrabold text-base sm:text-lg text-slate-900">
                แก้ไขข้อมูลโปรไฟล์
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                เลือกรูปภาพจากเครื่องโทรศัพท์ หรือตัวการ์ตูนประจำตัว
              </p>
            </div>

            {/* Photo Upload Section */}
            <div className="mb-4 bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-200 space-y-2.5">
              <span className="font-heading font-bold text-xs text-emerald-900 block flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-emerald-700" />
                <span>รูปภาพโปรไฟล์ผู้ใช้งาน</span>
              </span>

              {/* Current Preview */}
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full border-2 border-emerald-500 overflow-hidden bg-slate-100 flex items-center justify-center shrink-0 shadow-xs">
                  {formData.avatarUrl ? (
                    <img src={formData.avatarUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-7 h-7 text-slate-400" />
                  )}
                </div>

                <div className="flex-1 space-y-1.5">
                  {/* Native File Upload Input */}
                  <label className="flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-[11px] font-bold font-heading cursor-pointer shadow-xs transition">
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>เลือกรูปจากแกลเลอรีในเครื่อง</span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleGalleryUpload}
                      className="hidden"
                    />
                  </label>

                  {formData.avatarUrl && (
                    <button
                      type="button"
                      onClick={() => handleSelectAvatar('')}
                      className="w-full text-[10px] text-slate-600 hover:text-slate-900 flex items-center justify-center gap-1 py-1 font-medium transition cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3 text-slate-400" />
                      <span>รีเซ็ตเป็นไอคอนค่าเริ่มต้น (เงาสีขาว)</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Cartoon Avatar Picker */}
            <div className="mb-5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              <span className="font-heading font-bold text-xs text-slate-800 block mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>หรือเลือกตัวการ์ตูนน่ารัก (Cartoon Avatars)</span>
              </span>

              <div className="grid grid-cols-4 gap-2">
                {CARTOON_AVATARS.map((av) => {
                  const isSelected = formData.avatarUrl === av.url;
                  return (
                    <div
                      key={av.id}
                      onClick={() => handleSelectAvatar(av.url)}
                      className={`flex flex-col items-center p-2 rounded-xl border cursor-pointer transition ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/30 shadow-xs'
                          : 'border-slate-200 bg-white hover:bg-slate-100'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center mb-1">
                        {av.url ? (
                          <img src={av.url} alt={av.name} className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                      <span className="text-[9px] text-center font-bold text-slate-700 leading-tight truncate w-full">
                        {av.name.split(' ')[0]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Form Inputs */}
            <div className="space-y-3 text-xs mb-5">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  ชื่อ - นามสกุล (จะแสดงในหน้าหลักและระบบทั้งหมด)
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="เช่น ผู้ใช้งาน หรือชื่อของคุณ"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">อีเมล</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="user@email.com"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">เบอร์โทรศัพท์ติดต่อ</label>
                <input
                  type="text"
                  value={formData.emergencyContact?.phone || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      emergencyContact: {
                        ...formData.emergencyContact,
                        phone: e.target.value,
                      },
                    })
                  }
                  placeholder="08X-XXX-XXXX"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-mono font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  เลขบัตรประจำตัวประชาชน (13 หลัก)
                </label>
                <input
                  type="text"
                  value={formData.nationalId}
                  onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
                  placeholder="1-xxxx-xxxxx-xx-x"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-mono font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">เพศ</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as UserProfile['gender'] })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="ชาย">ชาย</option>
                    <option value="หญิง">หญิง</option>
                    <option value="อื่นๆ">อื่นๆ</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">อายุ (ปี)</label>
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Save Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setIsEditProfileOpen(false)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-4 rounded-2xl text-xs font-heading transition cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSaveProfile}
                className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3 px-4 rounded-2xl text-xs font-heading transition cursor-pointer shadow-md flex items-center justify-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>บันทึกการแก้ไข</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: ข้อมูลสุขภาพส่วนตัว & BMI ================= */}
      {isHealthInfoOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] p-5 max-w-lg w-full shadow-2xl relative border border-slate-100 max-h-[92vh] overflow-y-auto no-scrollbar space-y-4">
            <button
              onClick={() => setIsHealthInfoOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold font-heading mb-1.5">
                <HeartPulse className="w-3.5 h-3.5 text-emerald-700" />
                <span>Health Metrics & Records</span>
              </div>
              <h3 className="font-heading font-extrabold text-slate-900 text-base sm:text-lg">
                ข้อมูลสุขภาพส่วนตัว
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                HN: {user.hn} • เลขบัตรประชาชน: {user.nationalId}
              </p>
            </div>

            {/* BMI Visual Gauge */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2.5">
              <div className="flex justify-between items-center">
                <div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-black font-heading text-slate-900">{bmiVal}</span>
                    <span className="text-xs text-slate-400 font-mono">kg/m²</span>
                  </div>
                  <span className="text-[10px] text-slate-500">ดัชนีมวลกาย (BMI)</span>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${bmiBadgeBg}`}>
                  {bmiCategory}
                </span>
              </div>

              <div className="space-y-1">
                <div className="relative h-2.5 rounded-full overflow-hidden flex bg-slate-200">
                  <div className="flex-1 bg-blue-300" />
                  <div className="flex-1 bg-emerald-400" />
                  <div className="flex-1 bg-amber-400" />
                  <div className="flex-1 bg-rose-400" />
                  <div
                    className="absolute top-0 bottom-0 w-1.5 bg-slate-900 rounded-full shadow-md transition-all duration-300 -translate-x-1/2"
                    style={{ left: `${markerPercent}%` }}
                  />
                </div>
                <div className="flex justify-between text-[9px] text-slate-400 font-medium px-0.5">
                  <span>ผอม (&lt;18.5)</span>
                  <span>ปกติ (18.5-22.9)</span>
                  <span>ท้วม (23-24.9)</span>
                  <span>อ้วน (&gt;25)</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-600 bg-white p-2 rounded-xl border border-slate-200">
                💡 น้ำหนักที่เหมาะสม: <strong>{minIdealWeight} - {maxIdealWeight} กก.</strong> (ส่วนสูง {user.heightCm} ซม.)
              </p>
            </div>

            {/* Health Metrics Grid */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-emerald-50/70 p-3 rounded-2xl border border-emerald-200">
                <span className="text-slate-500 text-[10px] block">ส่วนสูง</span>
                <p className="font-bold text-slate-900 font-heading text-sm mt-0.5">{user.heightCm} ซม.</p>
              </div>
              <div className="bg-emerald-50/70 p-3 rounded-2xl border border-emerald-200">
                <span className="text-slate-500 text-[10px] block">น้ำหนัก</span>
                <p className="font-bold text-slate-900 font-heading text-sm mt-0.5">{user.weightKg} กก.</p>
              </div>
              <div className="bg-emerald-50/70 p-3 rounded-2xl border border-emerald-200">
                <span className="text-slate-500 text-[10px] block">หมู่เลือด</span>
                <p className="font-bold text-emerald-800 font-heading text-sm mt-0.5">{user.bloodType}</p>
              </div>
            </div>

            {/* Allergies & Chronic Diseases */}
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-white rounded-2xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-500" /> ประวัติแพ้ยา
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {formData.drugAllergies.map((allergy, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-800 border border-rose-200 text-[11px] font-semibold flex items-center gap-1"
                    >
                      <span>{allergy}</span>
                      {allergy !== 'ไม่มีประวัติแพ้ยา' && (
                        <button onClick={() => handleRemoveAllergy(i)} className="hover:text-rose-950 ml-0.5">×</button>
                      )}
                    </span>
                  ))}
                </div>
                <div className="flex gap-1.5 pt-1">
                  <input
                    type="text"
                    placeholder="เพิ่มยาที่แพ้..."
                    value={newAllergy}
                    onChange={(e) => setNewAllergy(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50"
                  />
                  <button onClick={handleAddAllergy} className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-3 py-1.5 rounded-lg text-xs font-bold">+</button>
                </div>
              </div>

              <div className="p-3 bg-white rounded-2xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-emerald-600" /> โรคประจำตัว
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {formData.chronicDiseases.map((chronic, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-semibold flex items-center gap-1"
                    >
                      <span>{chronic}</span>
                      {chronic !== 'ไม่มี' && (
                        <button onClick={() => handleRemoveChronic(i)} className="hover:text-emerald-950 ml-0.5">×</button>
                      )}
                    </span>
                  ))}
                </div>
                <div className="flex gap-1.5 pt-1">
                  <input
                    type="text"
                    placeholder="เพิ่มโรคประจำตัว เช่น ความดัน..."
                    value={newChronic}
                    onChange={(e) => setNewChronic(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50"
                  />
                  <button onClick={handleAddChronic} className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-3 py-1.5 rounded-lg text-xs font-bold">+</button>
                </div>
              </div>
            </div>

            {/* Actions: Export / Doctor Summary */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={onOpenDoctorSummary}
                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold py-2.5 px-3 rounded-xl border border-emerald-200 text-xs flex items-center justify-center gap-1.5 cursor-pointer font-heading"
              >
                <FileText className="w-3.5 h-3.5" /> สรุปข้อมูลส่งแพทย์
              </button>
              <button
                onClick={exportHealthSummary}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-3 rounded-xl border border-slate-200 text-xs flex items-center justify-center gap-1.5 cursor-pointer font-heading"
              >
                <FileDown className="w-3.5 h-3.5" /> ส่งออกเวชระเบียน
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 3: ความเป็นส่วนตัว MATCHING EXACT SCREENSHOT 154214 ================= */}
      {isPrivacyOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[36px] max-w-md w-full shadow-2xl relative border border-slate-100 max-h-[92vh] overflow-y-auto no-scrollbar flex flex-col">
            {/* Top Navigation Bar: ← ความเป็นส่วนตัว matching Screenshot */}
            <div className="p-4 border-b border-slate-100 flex items-center gap-3 sticky top-0 bg-white/95 backdrop-blur-xs z-10">
              <button
                onClick={() => setIsPrivacyOpen(false)}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h3 className="font-heading font-extrabold text-base text-slate-900">
                ความเป็นส่วนตัว
              </h3>
            </div>

            <div className="p-4 space-y-4 text-xs">
              {/* Section 1: การแชร์ข้อมูล */}
              <div>
                <h4 className="font-heading font-bold text-xs text-slate-800 mb-2 px-1">
                  การแชร์ข้อมูล
                </h4>

                <div className="bg-white rounded-2xl border border-slate-200 card-shadow divide-y divide-slate-100 overflow-hidden">
                  {/* Item 1: แชร์ข้อมูลสุขภาพกับแพทย์ */}
                  <div className="p-3.5 flex items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                        <FileCheck className="w-4.5 h-4.5 text-emerald-600" />
                      </div>
                      <div>
                        <h5 className="font-heading font-bold text-xs text-slate-900 leading-snug">
                          แชร์ข้อมูลสุขภาพกับแพทย์
                        </h5>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                          อนุญาตให้แพทย์ที่ดูแลเห็นประวัติสุขภาพของคุณ
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() =>
                        setPrivacyToggles((prev) => ({ ...prev, shareWithDoctor: !prev.shareWithDoctor }))
                      }
                      className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                        privacyToggles.shareWithDoctor ? 'bg-emerald-600' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform shadow-xs ${
                          privacyToggles.shareWithDoctor ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Item 2: การเข้าถึงตำแหน่ง (GPS) */}
                  <div className="p-3.5 flex items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                        <MapPin className="w-4.5 h-4.5 text-emerald-600" />
                      </div>
                      <div>
                        <h5 className="font-heading font-bold text-xs text-slate-900 leading-snug">
                          การเข้าถึงตำแหน่ง (GPS)
                        </h5>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                          ใช้ค้นหาโรงพยาบาลใกล้คุณและคำนวณระยะทางจริง
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() =>
                        setPrivacyToggles((prev) => ({ ...prev, locationGps: !prev.locationGps }))
                      }
                      className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                        privacyToggles.locationGps ? 'bg-emerald-600' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform shadow-xs ${
                          privacyToggles.locationGps ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Item 3: ข้อมูลเพื่อการวิจัยแบบไม่ระบุตัวตน */}
                  <div className="p-3.5 flex items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                        <TrendingUp className="w-4.5 h-4.5 text-emerald-600" />
                      </div>
                      <div>
                        <h5 className="font-heading font-bold text-xs text-slate-900 leading-snug">
                          ข้อมูลเพื่อการวิจัยแบบไม่ระบุตัวตน
                        </h5>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                          ช่วยพัฒนาความแม่นยำของระบบประเมินอาการ AI
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() =>
                        setPrivacyToggles((prev) => ({
                          ...prev,
                          anonymousResearch: !prev.anonymousResearch,
                        }))
                      }
                      className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                        privacyToggles.anonymousResearch ? 'bg-emerald-600' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform shadow-xs ${
                          privacyToggles.anonymousResearch ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Item 4: การแจ้งเตือนทางการตลาด */}
                  <div className="p-3.5 flex items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                        <Bell className="w-4.5 h-4.5 text-emerald-600" />
                      </div>
                      <div>
                        <h5 className="font-heading font-bold text-xs text-slate-900 leading-snug">
                          การแจ้งเตือนทางการตลาด
                        </h5>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                          ข่าวสาร โปรโมชั่น และเคล็ดลับสุขภาพจากทีมงาน
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() =>
                        setPrivacyToggles((prev) => ({
                          ...prev,
                          marketingNotifications: !prev.marketingNotifications,
                        }))
                      }
                      className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                        privacyToggles.marketingNotifications ? 'bg-emerald-600' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform shadow-xs ${
                          privacyToggles.marketingNotifications ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Section 2: เอกสารและนโยบาย matching Screenshot */}
              <div>
                <h4 className="font-heading font-bold text-xs text-slate-800 mb-2 px-1">
                  เอกสารและนโยบาย
                </h4>

                <div className="bg-white rounded-2xl border border-slate-200 card-shadow divide-y divide-slate-100 overflow-hidden">
                  <div
                    onClick={() => setPolicySubView('privacy')}
                    className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-base">📄</span>
                      <span className="font-heading font-bold text-xs text-slate-800">
                        นโยบายความเป็นส่วนตัว
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>

                  <div
                    onClick={() => setPolicySubView('terms')}
                    className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-base">📋</span>
                      <span className="font-heading font-bold text-xs text-slate-800">
                        ข้อกำหนดการใช้งาน
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>

                  <div
                    onClick={() => setPolicySubView('cookie')}
                    className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-base">🍪</span>
                      <span className="font-heading font-bold text-xs text-slate-800">
                        นโยบายคุกกี้
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              </div>

              {/* Section 3: การจัดการข้อมูลของฉัน */}
              <div>
                <h4 className="font-heading font-bold text-xs text-slate-800 mb-2 px-1">
                  การจัดการข้อมูลของฉัน
                </h4>

                <div className="bg-white rounded-2xl border border-slate-200 card-shadow p-3 space-y-2">
                  <button
                    onClick={exportHealthSummary}
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-[11px] flex items-center justify-center gap-1.5 transition cursor-pointer font-heading"
                  >
                    <FileDown className="w-3.5 h-3.5 text-emerald-600" />
                    <span>ดาวน์โหลดสำเนาข้อมูลสุขภาพ (Data Portability)</span>
                  </button>

                  <button
                    onClick={() => {
                      if (confirm('คุณต้องการขอลบประวัติการประเมินอาการและข้อมูลส่วนบุคคลตามสิทธิ PDPA หรือไม่?')) {
                        setSavedToast('ส่งคำร้องขอลบข้อมูลตามสิทธิ PDPA เรียบร้อยแล้ว');
                        playChime('alert');
                      }
                    }}
                    className="w-full py-2.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] flex items-center justify-center gap-1.5 transition cursor-pointer font-heading"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    <span>ขอลบประวัติและข้อมูลส่วนบุคคลตามสิทธิ PDPA</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Policy Sub-view Modal */}
      {policySubView && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[28px] p-5 max-w-sm w-full space-y-3">
            <h4 className="font-heading font-bold text-sm text-slate-900">
              {policySubView === 'privacy' && '📄 นโยบายความเป็นส่วนตัว'}
              {policySubView === 'terms' && '📋 ข้อกำหนดการใช้งาน'}
              {policySubView === 'cookie' && '🍪 นโยบายคุกกี้'}
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              {policySubView === 'privacy' &&
                'Inotector Care ปฏิบัติตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA) อย่างเคร่งครัด ข้อมูลประวัติการรักษาทั้งหมดจะถูกจัดเก็บด้วยการเข้ารหัสความปลอดภัยระดับโรงพยาบาล'}
              {policySubView === 'terms' &&
                'การประเมินอาการเบื้องต้นโดย AI เป็นเครื่องมือช่วยคัดกรองความเร่งด่วนเบื้องต้น มิใช่การวินิจฉัยโรคขั้นสุดท้าย ในกรณีฉุกเฉินวิกฤตกรุณาโทร 1669 หรือไปห้องฉุกเฉินทันที'}
              {policySubView === 'cookie' &&
                'เราใช้คุกกี้และหน่วยความจำในอุปกรณ์เพื่อจดจำการตั้งค่า เซสชันการเข้าสู่ระบบ และการปรับแต่งสิทธิประโยชน์ของผู้ใช้งาน'}
            </p>
            <button
              onClick={() => setPolicySubView(null)}
              className="w-full bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs font-heading cursor-pointer"
            >
              เข้าใจแล้ว
            </button>
          </div>
        </div>
      )}

      {/* ================= MODAL 4: ช่วยเหลือ & FAQ ================= */}
      {isHelpOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] p-5 max-w-md w-full shadow-2xl relative border border-slate-100 space-y-4 max-h-[85vh] overflow-y-auto no-scrollbar">
            <button
              onClick={() => setIsHelpOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <div className="w-10 h-10 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center mb-2">
                <HelpCircle className="w-5 h-5" />
              </div>
              <h3 className="font-heading font-extrabold text-base text-slate-900">
                ศูนย์ช่วยเหลือ & ติดต่อสถานพยาบาล
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                คำถามที่พบบ่อยและช่องทางติดต่อสายด่วนทางการแพทย์
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <h4 className="font-bold text-slate-800 font-heading">Q: จองคิวแล้วต้องไปถึงโรงพยาบาลก่อนกี่นาที?</h4>
                <p className="text-slate-500 text-[11px] mt-1">
                  แนะนำไปถึงก่อนเวลานัด 15-20 นาที เพื่อยื่นสแกน QR Code ณ ตู้คีออสค์หรือจุดคัดกรอง
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <h4 className="font-bold text-slate-800 font-heading">Q: สิทธิบัตรทอง 30 บาท รักษาทุกที่คืออะไร?</h4>
                <p className="text-slate-500 text-[11px] mt-1">
                  สามารถเข้ารับการรักษาในระดับปฐมภูมิ เช่น ศบส. และคลินิกชุมชนอบอุ่น หรือร้านยาที่เข้าร่วมได้ฟรี 0 บาท
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900">
                <h4 className="font-bold font-heading">สายด่วนช่วยเหลือฉุกเฉิน</h4>
                <p className="text-[11px] mt-1">
                  • กู้ชีพฉุกเฉิน: <a href="tel:1669" className="font-bold underline">1669</a> (ฟรี 24 ชม.)<br />
                  • สายด่วน สปสช. (บัตรทอง): <a href="tel:1330" className="font-bold underline">1330</a><br />
                  • สายด่วนประกันสังคม: <a href="tel:1506" className="font-bold underline">1506</a>
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsHelpOpen(false)}
              className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3 px-4 rounded-2xl text-xs font-heading transition cursor-pointer"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
