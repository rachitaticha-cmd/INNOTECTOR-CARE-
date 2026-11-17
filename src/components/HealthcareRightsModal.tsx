import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  Building2,
  RefreshCw,
  CreditCard,
} from 'lucide-react';
import { HealthcareRightDetails, UserProfile } from '../types';

interface HealthcareRightsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
}

export const HealthcareRightsModal: React.FC<HealthcareRightsModalProps> = ({
  isOpen,
  onClose,
  user,
}) => {
  const [nationalIdInput, setNationalIdInput] = useState(
    user.nationalId && user.nationalId !== '-' ? user.nationalId : ''
  );
  const [isChecking, setIsChecking] = useState(false);

  const buildRightDetails = (uidValue: string): HealthcareRightDetails => ({
    schemeName: user.medicalRight || 'สิทธิหลักประกันสุขภาพถ้วนหน้า (บัตรทอง)',
    nationalId: uidValue || user.nationalId || '-',
    insuredName: user.name || 'ผู้ใช้งาน',
    mainHospital: user.assignedHospital || 'ยังไม่ได้ระบุโรงพยาบาลหลัก (ตั้งค่าได้ในโปรไฟล์)',
    secondaryHospital: user.secondaryHospital || undefined,
    status: 'มีสิทธิ (Active)',
    checkDate: new Date().toLocaleDateString('th-TH'),
    coverageList: [
      {
        category: 'การตรวจรักษาโรคทั่วไป (OPD)',
        details: 'ครอบคลุมค่าตรวจ ค่าเวชภัณฑ์ และค่ายาตามบัญชียาหลักแห่งชาติ ณ หน่วยบริการตามสิทธิ',
        copay: 'ตามเกณฑ์สิทธิรักษา',
      },
      {
        category: 'การรักษาผู้ป่วยใน (IPD)',
        details: 'ครอบคลุมค่าห้องสามัญ ค่าอาหาร ค่าผ่าตัด และหัตถการตามดุลยพินิจแพทย์',
        copay: 'ตามเกณฑ์สิทธิรักษา',
      },
      {
        category: 'อุบัติเหตุและฉุกเฉินวิกฤต (UCEP)',
        details: 'เข้ารับการรักษาได้ทุกโรงพยาบาลทั้งรัฐและเอกชนภายใน 72 ชม. แรก',
        copay: 'ฟรี (0 บาท)',
      },
    ],
  });

  const [rightData, setRightData] = useState<HealthcareRightDetails>(() =>
    buildRightDetails(user.nationalId || '-')
  );

  useEffect(() => {
    setNationalIdInput(user.nationalId && user.nationalId !== '-' ? user.nationalId : '');
    setRightData(buildRightDetails(user.nationalId || '-'));
  }, [user]);

  if (!isOpen) return null;

  const handleCheckRights = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nationalIdInput.trim()) return;
    setIsChecking(true);
    setTimeout(() => {
      setIsChecking(false);
      setRightData(buildRightDetails(nationalIdInput.trim()));
    }, 350);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[32px] p-5 max-w-md w-full shadow-2xl relative border border-slate-100 max-h-[92vh] overflow-y-auto no-scrollbar">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="pr-8 mb-4">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold font-heading mb-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>สิทธิรักษาพยาบาล</span>
          </div>
          <h3 className="font-heading font-extrabold text-slate-900 text-lg leading-tight">
            ข้อมูลสิทธิรักษาพยาบาลของคุณ
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            ใช้ประกอบการคัดกรองสถานพยาบาลในหน้าประเมินอาการและแผนที่ (แก้ไขได้ในหน้าแก้ไขโปรไฟล์)
          </p>
        </div>

        <form onSubmit={handleCheckRights} className="mb-4">
          <label htmlFor="national-id-input" className="block text-[11px] font-bold text-slate-700 mb-1 font-heading">
            เลขประจำตัวประชาชน 13 หลัก
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                id="national-id-input"
                type="text"
                value={nationalIdInput}
                onChange={(e) => setNationalIdInput(e.target.value)}
                placeholder="X-XXXX-XXXXX-XX-X"
                className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>
            <button
              type="submit"
              disabled={isChecking}
              className="bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white px-3.5 py-2.5 rounded-xl text-xs font-bold font-heading transition flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
              <span>{isChecking ? 'กำลังอัปเดต...' : 'อัปเดต'}</span>
            </button>
          </div>
        </form>

        <div className="bg-gradient-to-br from-[#163d2d] to-[#0f2e21] text-white p-4 rounded-2xl shadow-md space-y-2.5 mb-4">
          <div className="flex justify-between items-start gap-2">
            <div>
              <span className="text-[10px] text-emerald-200/90 font-medium block">
                สิทธิการรักษาที่บันทึกไว้
              </span>
              <h4 className="font-heading font-extrabold text-sm sm:text-base text-white mt-0.5">
                {rightData.schemeName}
              </h4>
            </div>
            <span className="bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
              {rightData.status}
            </span>
          </div>

          <div className="pt-2 border-t border-white/10 grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <span className="text-emerald-200/70 text-[10px] block">ชื่อผู้มีสิทธิ</span>
              <strong className="text-white">{rightData.insuredName}</strong>
            </div>
            <div>
              <span className="text-emerald-200/70 text-[10px] block">เลขบัตรประชาชน</span>
              <strong className="font-mono text-emerald-200">{rightData.nationalId}</strong>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 card-shadow space-y-2.5 mb-4 text-xs">
          <div className="flex items-center gap-1.5 font-heading font-bold text-slate-800 text-xs">
            <Building2 className="w-4 h-4 text-emerald-700" />
            <span>หน่วยบริการประจำตัวตามสิทธิ</span>
          </div>

          <div className="space-y-2 pt-1">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] text-slate-400 block font-semibold">
                  หน่วยบริการประจำ (Primary Hospital)
                </span>
                <strong className="font-heading text-slate-900 text-xs mt-0.5 block">
                  {rightData.mainHospital}
                </strong>
              </div>
              <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded shrink-0">
                รพ.หลัก
              </span>
            </div>

            {rightData.secondaryHospital && (
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">
                    โรงพยาบาลรับส่งต่อ (Referral Hospital)
                  </span>
                  <strong className="font-heading text-slate-900 text-xs mt-0.5 block">
                    {rightData.secondaryHospital}
                  </strong>
                </div>
                <span className="text-[9px] bg-slate-200 text-slate-700 font-bold px-1.5 py-0.5 rounded shrink-0">
                  รับส่งต่อ
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 card-shadow space-y-2.5 mb-4 text-xs">
          <h5 className="font-heading font-bold text-slate-800 text-xs">
            สิทธิประโยชน์พื้นฐาน
          </h5>
          <div className="space-y-2">
            {rightData.coverageList.map((cov, i) => (
              <div key={i} className="p-2 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <div className="flex justify-between items-center gap-2">
                  <span className="font-bold text-slate-800 text-xs font-heading">
                    {cov.category}
                  </span>
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.2 rounded-full font-bold shrink-0">
                    {cov.copay}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">{cov.details}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-[11px] space-y-1.5 mb-4 text-slate-600">
          <div className="flex items-center justify-between">
            <span>สายด่วน สปสช. (บัตรทอง):</span>
            <a href="tel:1330" className="font-bold text-emerald-700 hover:underline">
              โทร 1330 (24 ชม.)
            </a>
          </div>
          <div className="flex items-center justify-between">
            <span>สายด่วน ประกันสังคม:</span>
            <a href="tel:1506" className="font-bold text-emerald-700 hover:underline">
              โทร 1506 (24 ชม.)
            </a>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white font-bold py-3 px-4 rounded-2xl text-xs font-heading transition cursor-pointer shadow-xs"
        >
          ปิดหน้าต่าง
        </button>
      </div>
    </div>
  );
};
