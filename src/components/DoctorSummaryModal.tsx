import React from 'react';
import { X, User, HeartPulse, ShieldAlert, FileText, Share2, Copy, Stethoscope, CheckCircle2 } from 'lucide-react';
import { UserProfile, QueueTicket } from '../types';

interface DoctorSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  latestQueue: QueueTicket | null;
}

export const DoctorSummaryModal: React.FC<DoctorSummaryModalProps> = ({
  isOpen,
  onClose,
  user,
  latestQueue,
}) => {
  if (!isOpen) return null;

  const rightsLabel = user.medicalRight || 'สิทธิหลักประกันสุขภาพถ้วนหน้า (บัตรทอง)';
  const hospitalName = latestQueue?.hospitalName || user.assignedHospital || 'โรงพยาบาลราชพิพัฒน์';

  const fullText = `สรุปข้อมูลผู้ป่วยส่งแพทย์ (InnoTector Care AI)
— ข้อมูลผู้ป่วย —
ชื่อ-สกุล: ${user.name}
HN: ${user.hn}
อายุ: ${user.age} ปี | หมู่เลือด: ${user.bloodType}
น้ำหนัก: ${user.weightKg} กก. | ส่วนสูง: ${user.heightCm} ซม. | BMI: ${user.bmi}
ประวัติแพ้ยา: ${user.drugAllergies.join(', ')}
โรคประจำตัว: ${user.chronicDiseases.join(', ')}
สิทธิการรักษา: ${rightsLabel} (${hospitalName})
เบอร์ติดต่อฉุกเฉิน: ${user.emergencyContact.phone} (${user.emergencyContact.relationship})

— ข้อมูลการประเมินอาการล่าสุด —
สถานพยาบาล: ${hospitalName}
แผนก: ${latestQueue?.department || 'แผนกตรวจโรคทั่วไป'}
หมายเลขคิว: ${latestQueue?.queueNum || 'A-012'}
ระดับความเร่งด่วน: ${latestQueue?.triageTitle || 'ปานกลาง (Yellow Tag)'}
อาการที่ระบุ: ${latestQueue?.symptomsSummary || 'มีไข้ตัวร้อน, ไอ/เจ็บคอ (1-2 วัน)'}`;

  const handleCopy = () => {
    navigator.clipboard?.writeText(fullText);
    alert('คัดลอกข้อมูลสรุปสำหรับส่งแพทย์เรียบร้อยแล้ว');
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'สรุปข้อมูลผู้ป่วยส่งแพทย์ - InnoTector Care',
          text: fullText,
        });
      } catch {
        // Share cancelled or unavailable
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[32px] p-5 max-w-md w-full shadow-2xl relative border border-slate-100 max-h-[90vh] overflow-y-auto no-scrollbar">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center transition"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 text-emerald-800 mb-3">
          <Stethoscope className="w-5 h-5 text-emerald-600" />
          <h3 className="font-heading font-bold text-base text-slate-900">
            สรุปข้อมูลผู้ป่วยส่งแพทย์
          </h3>
        </div>

        {/* Patient Profile Card */}
        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-full bg-emerald-100 border-2 border-emerald-500 overflow-hidden shrink-0">
            <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
          </div>
          <div className="min-w-0">
            <h4 className="font-heading font-bold text-sm text-slate-900">{user.name}</h4>
            <p className="text-[11px] text-slate-500">
              HN: <strong className="text-emerald-700 font-mono">{user.hn}</strong> • อายุ {user.age} ปี • หมู่เลือด {user.bloodType}
            </p>
            <p className="text-[10px] text-slate-400">
              น้ำหนัก {user.weightKg} กก. • สูง {user.heightCm} ซม. (BMI {user.bmi})
            </p>
          </div>
        </div>

        {/* Allergy Alert */}
        <div className="bg-rose-50 border border-rose-200 p-3 rounded-2xl mb-3 text-xs flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-heading font-bold text-rose-900 block">ประวัติแพ้ยา / สารก่อภูมิแพ้</span>
            <span className="text-rose-800 font-semibold">{user.drugAllergies.join(', ')}</span>
          </div>
        </div>

        {/* Medical History Details */}
        <div className="space-y-2 mb-4 text-xs">
          <div className="bg-white p-3 rounded-xl border border-slate-200">
            <span className="text-slate-400 text-[10px] block font-heading">โรคประจำตัว</span>
            <span className="font-bold text-slate-800">{user.chronicDiseases.join(', ')}</span>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200">
            <span className="text-slate-400 text-[10px] block font-heading">สิทธิการรักษา & สถานพยาบาลตามสิทธิ</span>
            <span className="font-bold text-slate-800">{rightsLabel}</span>
            <span className="text-emerald-700 font-semibold block text-[11px] mt-0.5">{hospitalName}</span>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200">
            <span className="text-slate-400 text-[10px] block font-heading">ผลประเมินอาการล่าสุด</span>
            <div className="flex justify-between items-center mt-1">
              <span className="font-bold text-slate-800 text-[11px]">
                {latestQueue?.symptomsSummary || 'มีไข้ตัวร้อน, ไอ / เจ็บคอ (1-2 วัน)'}
              </span>
              <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full text-[10px] font-bold">
                {latestQueue?.triageTitle || 'ปานกลาง (Yellow Tag)'}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={handleCopy}
            className="w-full bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-bold py-3 px-3 rounded-2xl text-xs font-heading flex items-center justify-center gap-1.5 border border-slate-200 transition"
          >
            <Copy className="w-3.5 h-3.5" /> คัดลอกข้อมูล
          </button>
          <button
            onClick={handleShare}
            className="w-full bg-[#1c4c39] hover:bg-[#163d2d] active:scale-95 text-white font-bold py-3 px-3 rounded-2xl text-xs font-heading flex items-center justify-center gap-1.5 shadow-sm transition"
          >
            <Share2 className="w-3.5 h-3.5 text-emerald-300" /> ส่งต่อให้แพทย์
          </button>
        </div>
      </div>
    </div>
  );
};
