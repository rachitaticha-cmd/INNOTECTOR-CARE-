import React, { useState, useRef } from 'react';
import {
  User,
  HeartPulse,
  AlertCircle,
  Save,
  Activity,
  Building,
  Shield,
  FileText,
  Check,
  ChevronRight,
  Bell,
  HelpCircle,
  X,
  Sparkles,
  Camera,
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
import { playChime } from '../services/storage';
import { CARTOON_AVATARS } from '../data/mockData';

interface ProfileViewProps {
  user: UserProfile;
  onUpdateUser: (updated: UserProfile) => Promise<void> | void;
  onLogout: () => void;
  onOpenQrModal: () => void;
  onOpenDoctorSummary: () => void;
  onOpenHealthcareRights: () => void;
  onOpenInsurancePartners: () => void;
  onOpenNotifications: () => void;
  unreadNotificationsCount?: number;
}

function resizeImageToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('ไม่สามารถอ่านไฟล์รูปภาพได้'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('รูปแบบรูปภาพไม่ถูกต้อง'));
      img.onload = () => {
        const size = 128;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('ไม่สามารถประมวลผลรูปภาพได้'));
          return;
        }
        const minDim = Math.min(img.width, img.height);
        const sx = (img.width - minDim) / 2;
        const sy = (img.height - minDim) / 2;
        ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);

        let dataUrl = canvas.toDataURL('image/jpeg', 0.72);
        if (dataUrl.length > 45000) {
          dataUrl = canvas.toDataURL('image/jpeg', 0.45);
        }
        resolve(dataUrl);
      };
      img.src = String(reader.result || '');
    };
    reader.readAsDataURL(file);
  });
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  onUpdateUser,
  onLogout,
  onOpenDoctorSummary,
  onOpenHealthcareRights,
  onOpenInsurancePartners,
  onOpenNotifications,
  unreadNotificationsCount = 0,
}) => {
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isHealthInfoOpen, setIsHealthInfoOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [confirmPdpaDelete, setConfirmPdpaDelete] = useState(false);

  const [policySubView, setPolicySubView] = useState<'privacy' | 'terms' | 'cookie' | null>(null);

  const [privacyToggles, setPrivacyToggles] = useState({
    shareWithDoctor: true,
    locationGps: true,
    anonymousResearch: true,
    marketingNotifications: false,
  });

  const [formData, setFormData] = useState<UserProfile>(user);
  const [savedToast, setSavedToast] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newWeight, setNewWeight] = useState('');
  const [newAllergy, setNewAllergy] = useState('');
  const [newChronic, setNewChronic] = useState('');

  React.useEffect(() => {
    setFormData(user);
  }, [user]);

  const weightLogs: WeightLogEntry[] = formData.weightLog || [];

  const hMeter = (formData.heightCm || 170) / 100;
  const minIdealWeight = Math.round(18.5 * hMeter * hMeter);
  const maxIdealWeight = Math.round(22.9 * hMeter * hMeter);
  const bmiVal = formData.bmi || Number(((formData.weightKg || 65) / (hMeter * hMeter)).toFixed(1));

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

  const showToast = (msg: string) => {
    setSavedToast(msg);
    setTimeout(() => setSavedToast(null), 3000);
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const updatedBmi = Number(((formData.weightKg || 65) / (hMeter * hMeter)).toFixed(1));
      const updated: UserProfile = {
        ...formData,
        bmi: updatedBmi,
        weightLog: weightLogs,
      };
      await onUpdateUser(updated);
      setIsEditProfileOpen(false);
      showToast('บันทึกข้อมูลโปรไฟล์และสิทธิรักษาลงฐานข้อมูลเรียบร้อยแล้ว');
      playChime('success');
    } catch {
      showToast('เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectAvatar = (url: string) => {
    setFormData((prev) => ({ ...prev, avatarUrl: url }));
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const resized = await resizeImageToDataUrl(file);
      if (resized.length > 48000) {
        showToast('ขนาดไฟล์รูปภาพใหญ่เกินไป กรุณาเลือกรูปอื่น');
        return;
      }
      handleSelectAvatar(resized);
      showToast('ย่อขนาดและเตรียมอัปโหลดรูปภาพเรียบร้อยแล้ว กด "บันทึกการแก้ไข" เพื่อยืนยัน');
      playChime('success');
    } catch {
      showToast('ไม่สามารถอัปโหลดรูปภาพได้');
    }
  };

  const handleAddWeight = async () => {
    const w = parseFloat(newWeight);
    if (isNaN(w) || w <= 0 || w > 500) return;

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
    const updated: UserProfile = {
      ...formData,
      weightKg: w,
      bmi: updatedBmi,
      weightLog: newLogs,
    };

    setFormData(updated);
    setNewWeight('');
    await onUpdateUser(updated);
    playChime('success');
  };

  const handleAddAllergy = async () => {
    if (!newAllergy.trim()) return;
    const current = formData.drugAllergies.filter((a) => a !== 'ไม่มีประวัติแพ้ยา');
    const updated: UserProfile = {
      ...formData,
      drugAllergies: [...current, newAllergy.trim()],
    };
    setFormData(updated);
    setNewAllergy('');
    await onUpdateUser(updated);
  };

  const handleRemoveAllergy = async (idx: number) => {
    const next = formData.drugAllergies.filter((_, i) => i !== idx);
    const updated: UserProfile = {
      ...formData,
      drugAllergies: next.length ? next : ['ไม่มีประวัติแพ้ยา'],
    };
    setFormData(updated);
    await onUpdateUser(updated);
  };

  const handleAddChronic = async () => {
    if (!newChronic.trim()) return;
    const current = formData.chronicDiseases.filter((c) => c !== 'ไม่มี');
    const updated: UserProfile = {
      ...formData,
      chronicDiseases: [...current, newChronic.trim()],
    };
    setFormData(updated);
    setNewChronic('');
    await onUpdateUser(updated);
  };

  const handleRemoveChronic = async (idx: number) => {
    const next = formData.chronicDiseases.filter((_, i) => i !== idx);
    const updated: UserProfile = {
      ...formData,
      chronicDiseases: next.length ? next : ['ไม่มี'],
    };
    setFormData(updated);
    await onUpdateUser(updated);
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
      {savedToast && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 p-3 bg-emerald-700 text-white rounded-2xl text-xs font-heading font-bold flex items-center gap-2 shadow-xl animate-in slide-in-from-top duration-200 max-w-[90vw]">
          <Check className="w-4 h-4 text-emerald-200 shrink-0 stroke-[3]" />
          <span>{savedToast}</span>
        </div>
      )}

      {/* Top Header Bar */}
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
        {/* Dark Green User Info Card */}
        <div className="bg-[#163d2d] text-white p-4.5 rounded-[26px] shadow-md flex items-center gap-4 relative overflow-hidden border border-emerald-900/40">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border border-white/20 bg-white/10 flex items-center justify-center overflow-hidden shadow-inner shrink-0">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-full border border-white/40 bg-emerald-950/40 flex items-center justify-center shadow-inner">
                  <User className="w-6 h-6 text-white stroke-[1.8]" />
                </div>
              )}
            </div>
            <button
              onClick={() => setIsEditProfileOpen(true)}
              className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#f7b73d] text-slate-900 flex items-center justify-center shadow-xs cursor-pointer hover:scale-110 transition"
              title="แก้ไขรูปภาพหรือข้อมูลส่วนตัว"
            >
              <Camera className="w-3 h-3 text-slate-900" />
            </button>
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="font-heading font-extrabold text-lg text-white truncate">
              {user.name}
            </h3>
            <p className="text-xs text-[#a3cbb5] font-light truncate mt-0.5">
              {user.email || '-'}
            </p>
            <p className="text-xs text-[#a3cbb5] font-mono font-light mt-0.5 truncate">
              {user.emergencyContact?.phone || 'ยังไม่ได้ระบุเบอร์โทร'}
            </p>
          </div>
        </div>

        {/* Menu Card */}
        <div className="bg-white rounded-[26px] border border-slate-100 card-shadow overflow-hidden divide-y divide-slate-100 text-xs">
          <div
            onClick={() => setIsEditProfileOpen(true)}
            className="p-4 flex items-center justify-between hover:bg-slate-50 transition cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">✏️</span>
              <div>
                <span className="font-heading font-bold text-slate-800 text-sm group-hover:text-emerald-700 transition block">
                  แก้ไขโปรไฟล์ &amp; สิทธิการรักษา
                </span>
                <span className="text-[10px] text-slate-400">ชื่อ, รูปภาพ, สิทธิบัตรทอง/ประกันสังคม, ประกันสุขภาพ</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </div>

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

        {/* Logout Card */}
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
            <span className="text-[10px] text-slate-400 truncate block">
              {user.assignedHospital || 'ตรวจสอบหน่วยบริการประจำ'}
            </span>
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
      </div>

      {/* ================= MODAL 1: แก้ไขโปรไฟล์ & สิทธิรักษา ================= */}
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
                แก้ไขข้อมูลโปรไฟล์ &amp; สิทธิรักษา
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                ข้อมูลสิทธิรักษาและ รพ.ประจำสิทธิ ใช้ในการคัดกรองสถานพยาบาลจริงในหน้าประเมินอาการและแผนที่
              </p>
            </div>

            {/* Photo Upload Section */}
            <div className="mb-4 bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-200 space-y-2.5">
              <span className="font-heading font-bold text-xs text-emerald-900 block flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-emerald-700" />
                <span>รูปภาพโปรไฟล์ผู้ใช้งาน</span>
              </span>

              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full border-2 border-emerald-500 overflow-hidden bg-slate-100 flex items-center justify-center shrink-0 shadow-xs">
                  {formData.avatarUrl ? (
                    <img src={formData.avatarUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-7 h-7 text-slate-400" />
                  )}
                </div>

                <div className="flex-1 space-y-1.5">
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
                      <span>รีเซ็ตเป็นไอคอนค่าเริ่มต้น</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Cartoon Avatar Picker */}
            <div className="mb-5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              <span className="font-heading font-bold text-xs text-slate-800 block mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>หรือเลือกอวตารแนะนำ</span>
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
                  ชื่อ - นามสกุล
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="ชื่อ-นามสกุลของคุณ"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">อีเมล</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="example@email.com"
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

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">เพศ</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as UserProfile['gender'] })}
                    className="w-full px-2.5 py-2 text-xs rounded-xl border border-slate-300 bg-white"
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
                    className="w-full px-2.5 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">ส่วนสูง (ซม.)</label>
                  <input
                    type="number"
                    value={formData.heightCm}
                    onChange={(e) => setFormData({ ...formData, heightCm: Number(e.target.value) })}
                    className="w-full px-2.5 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                  />
                </div>
              </div>

              {/* Healthcare Rights Configuration */}
              <div className="pt-2 border-t border-slate-200 space-y-2.5">
                <span className="font-heading font-bold text-emerald-900 block">
                  ข้อมูลสิทธิรักษาพยาบาลและประกันสุขภาพ
                </span>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">สิทธิการรักษาหลัก</label>
                  <select
                    value={formData.medicalRight || 'สิทธิหลักประกันสุขภาพถ้วนหน้า (บัตรทอง)'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        medicalRight: e.target.value as UserProfile['medicalRight'],
                      })
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-semibold"
                  >
                    <option value="สิทธิหลักประกันสุขภาพถ้วนหน้า (บัตรทอง)">
                      สิทธิหลักประกันสุขภาพถ้วนหน้า (บัตรทอง 30 บาท)
                    </option>
                    <option value="ประกันสังคม">สิทธิประกันสังคม</option>
                    <option value="สวัสดิการข้าราชการ/รัฐวิสาหกิจ">
                      สิทธิสวัสดิการข้าราชการ/รัฐวิสาหกิจ
                    </option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    โรงพยาบาลประจำสิทธิหลัก
                  </label>
                  <input
                    type="text"
                    value={formData.assignedHospital || ''}
                    onChange={(e) => setFormData({ ...formData, assignedHospital: e.target.value })}
                    placeholder="เช่น โรงพยาบาลราชพิพัฒน์, โรงพยาบาลศิริราช"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    โรงพยาบาลรับส่งต่อ (ถ้ามี)
                  </label>
                  <input
                    type="text"
                    value={formData.secondaryHospital || ''}
                    onChange={(e) => setFormData({ ...formData, secondaryHospital: e.target.value })}
                    placeholder="เช่น โรงพยาบาลรามาธิบดี"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">ประกันสุขภาพส่วนตัว</label>
                    <input
                      type="text"
                      value={formData.insuranceCompany || ''}
                      onChange={(e) => setFormData({ ...formData, insuranceCompany: e.target.value })}
                      placeholder="ไม่มี หรือ AIA / FWD"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">เลขที่กรมธรรม์</label>
                    <input
                      type="text"
                      value={formData.insurancePolicyNumber || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, insurancePolicyNumber: e.target.value })
                      }
                      placeholder="เลขกรมธรรม์ (ถ้ามี)"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setIsEditProfileOpen(false)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-4 rounded-2xl text-xs font-heading transition cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => void handleSaveProfile()}
                disabled={isSaving}
                className="flex-1 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white font-bold py-3 px-4 rounded-2xl text-xs font-heading transition cursor-pointer shadow-md flex items-center justify-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}</span>
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
                <span>Health Metrics &amp; Records</span>
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

            {/* Health Metrics Grid + Quick Weight Log */}
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

            <div className="flex gap-1.5 text-xs">
              <input
                type="number"
                placeholder="อัปเดตน้ำหนักล่าสุด (กก.)..."
                value={newWeight}
                onChange={(e) => setNewWeight(e.target.value)}
                className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50"
              />
              <button
                onClick={() => void handleAddWeight()}
                className="bg-emerald-700 hover:bg-emerald-800 text-white px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer"
              >
                บันทึกน้ำหนัก
              </button>
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
                        <button onClick={() => void handleRemoveAllergy(i)} className="hover:text-rose-950 ml-0.5 cursor-pointer">
                          ×
                        </button>
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
                  <button
                    onClick={() => void handleAddAllergy()}
                    className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer"
                  >
                    +
                  </button>
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
                        <button onClick={() => void handleRemoveChronic(i)} className="hover:text-emerald-950 ml-0.5 cursor-pointer">
                          ×
                        </button>
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
                  <button
                    onClick={() => void handleAddChronic()}
                    className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

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

      {/* ================= MODAL 3: ความเป็นส่วนตัว ================= */}
      {isPrivacyOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[36px] max-w-md w-full shadow-2xl relative border border-slate-100 max-h-[92vh] overflow-y-auto no-scrollbar flex flex-col">
            <div className="p-4 border-b border-slate-100 flex items-center gap-3 sticky top-0 bg-white/95 backdrop-blur-xs z-10">
              <button
                onClick={() => {
                  setIsPrivacyOpen(false);
                  setConfirmPdpaDelete(false);
                }}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h3 className="font-heading font-extrabold text-base text-slate-900">
                ความเป็นส่วนตัว
              </h3>
            </div>

            <div className="p-4 space-y-4 text-xs">
              <div>
                <h4 className="font-heading font-bold text-xs text-slate-800 mb-2 px-1">
                  การแชร์ข้อมูล
                </h4>

                <div className="bg-white rounded-2xl border border-slate-200 card-shadow divide-y divide-slate-100 overflow-hidden">
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

                  <div className="p-3.5 flex items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                        <TrendingUp className="w-4.5 h-4.5 text-emerald-600" />
                      </div>
                      <div>
                        <h5 className="font-heading font-bold text-xs text-slate-900 leading-snug">
                          ข้อมูลเพื่อการพัฒนาการคัดกรอง
                        </h5>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                          แบบไม่ระบุตัวตนตามมาตรฐาน PDPA
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
                </div>
              </div>

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
                </div>
              </div>

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
                    <span>ดาวน์โหลดสำเนาข้อมูลสุขภาพ (JSON)</span>
                  </button>

                  {!confirmPdpaDelete ? (
                    <button
                      onClick={() => setConfirmPdpaDelete(true)}
                      className="w-full py-2.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] flex items-center justify-center gap-1.5 transition cursor-pointer font-heading"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                      <span>ขอลบประวัติและข้อมูลส่วนบุคคลตามสิทธิ PDPA</span>
                    </button>
                  ) : (
                    <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 space-y-2">
                      <p className="text-[11px] text-rose-900 font-semibold">
                        ยืนยันการส่งคำร้องขอลบข้อมูลส่วนบุคคลตามสิทธิ PDPA?
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setConfirmPdpaDelete(false)}
                          className="flex-1 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] font-bold text-slate-600 cursor-pointer"
                        >
                          ยกเลิก
                        </button>
                        <button
                          onClick={() => {
                            setConfirmPdpaDelete(false);
                            showToast('บันทึกคำร้องขอลบข้อมูลตามสิทธิ PDPA เรียบร้อยแล้ว');
                            playChime('alert');
                          }}
                          className="flex-1 py-1.5 bg-rose-600 text-white rounded-lg text-[11px] font-bold cursor-pointer"
                        >
                          ยืนยันส่งคำร้อง
                        </button>
                      </div>
                    </div>
                  )}
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
                'Inotector Care ปฏิบัติตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA) ข้อมูลของคุณถูกผูกกับบัญชีผู้ใช้ที่ยืนยันตัวตนแล้วเท่านั้น'}
              {policySubView === 'terms' &&
                'การประเมินอาการเบื้องต้นเป็นเครื่องมือช่วยคัดกรองความเร่งด่วน มิใช่การวินิจฉัยโรคขั้นสุดท้าย ในกรณีฉุกเฉินวิกฤตกรุณาโทร 1669 หรือไปห้องฉุกเฉินทันที'}
              {policySubView === 'cookie' &&
                'เราใช้หน่วยความจำในอุปกรณ์เพื่อจดจำการตั้งค่าเสียงและการใช้งานบนแผนที่ของคุณ'}
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
                ศูนย์ช่วยเหลือ &amp; สายด่วนฉุกเฉิน
              </h3>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <h4 className="font-bold text-slate-800 font-heading">Q: ระบบแนะนำสถานพยาบาลคัดกรองจากอะไร?</h4>
                <p className="text-slate-500 text-[11px] mt-1">
                  คัดกรองจากระดับความรุนแรงของอาการ ตำแหน่ง GPS ปัจจุบัน เวลาเปิด-ปิดทำการจริง และสิทธิรักษาพยาบาลที่บันทึกไว้ในโปรไฟล์ของคุณ
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
