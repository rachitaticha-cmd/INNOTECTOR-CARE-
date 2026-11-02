import React, { useState } from 'react';
import {
  X,
  Shield,
  Search,
  Phone,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { INSURANCE_PARTNERS } from '../data/mockData';
import { InsurancePartner, UserProfile } from '../types';

// Realistic branded vector logo badge for Thai insurance partners
const InsuranceLogoBadge: React.FC<{ partner: InsurancePartner }> = ({ partner }) => {
  const code = partner.code.toUpperCase();

  if (code === 'AIA') {
    return (
      <div className="w-11 h-11 rounded-2xl bg-[#d31145] text-white flex flex-col items-center justify-center font-black shadow-xs shrink-0 p-1 border border-red-700/30">
        <div className="flex items-center justify-center leading-none">
          <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
            <path d="M12 2L2 22h5l2.5-5.5h5L17 22h5L12 2zm0 6l1.8 4h-3.6L12 8z" />
          </svg>
        </div>
        <span className="text-[8px] font-black tracking-wider leading-none mt-0.5">AIA</span>
      </div>
    );
  }

  if (code === 'MTL') {
    return (
      <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#d81b60] to-[#ea1d75] text-white flex flex-col items-center justify-center font-black shadow-xs shrink-0 p-1 border border-pink-700/30">
        <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2a4 4 0 0 1 4 4c0 2-4 6-4 6s-4-4-4-6a4 4 0 0 1 4-4zm0 20a4 4 0 0 1-4-4c0-2 4-6 4-6s4 4 4 6a4 4 0 0 1-4 4zm10-10a4 4 0 0 1-4 4c-2 0-6-4-6-4s4-4 6-4a4 4 0 0 1 4 4zM2 12a4 4 0 0 1 4-4c2 0 6 4 6 4s-4 4-6 4a4 4 0 0 1-4-4z" opacity="0.85" />
        </svg>
        <span className="text-[7.5px] font-black tracking-tighter leading-none mt-0.5">เมืองไทย</span>
      </div>
    );
  }

  if (code === 'FWD') {
    return (
      <div className="w-11 h-11 rounded-2xl bg-[#f26522] text-white flex flex-col items-center justify-center font-black shadow-xs shrink-0 p-1 border border-orange-700/30">
        <span className="text-xs font-black tracking-tight leading-none">FWD</span>
        <span className="text-[7px] font-bold text-orange-100 tracking-tighter leading-none mt-0.5">INSURANCE</span>
      </div>
    );
  }

  if (code === 'BLA') {
    return (
      <div className="w-11 h-11 rounded-2xl bg-[#002f6c] text-white flex flex-col items-center justify-center font-black shadow-xs shrink-0 p-1 border border-blue-900/30">
        <svg className="w-5 h-5 fill-amber-300" viewBox="0 0 24 24">
          <path d="M12 2l8 4v6c0 5.25-3.5 10-8 11-4.5-1-8-5.75-8-11V6l8-4zm0 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" />
        </svg>
        <span className="text-[7.5px] font-bold text-blue-100 tracking-tight leading-none mt-0.5">กรุงเทพ</span>
      </div>
    );
  }

  if (code === 'TLI') {
    return (
      <div className="w-11 h-11 rounded-2xl bg-[#0054a6] text-white flex flex-col items-center justify-center font-black shadow-xs shrink-0 p-1 border border-blue-800/30">
        <svg className="w-5 h-5 fill-amber-300" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="5" />
          <path d="M12 2v2m0 16v2M2 12h2m16 0h2m-3.05-6.95l-1.41 1.41M6.46 17.54l-1.41 1.41M18.95 18.95l-1.41-1.41M6.46 6.46L5.05 5.05" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <span className="text-[7.5px] font-bold text-blue-100 tracking-tight leading-none mt-0.5">ไทยประกัน</span>
      </div>
    );
  }

  // Fallback branded tile
  return (
    <div
      className="w-11 h-11 rounded-2xl flex flex-col items-center justify-center font-black shadow-xs shrink-0 p-1 text-white border"
      style={{ backgroundColor: partner.color, borderColor: partner.color }}
    >
      <span className="text-xs font-black tracking-tight leading-none">{partner.code}</span>
      <span className="text-[7px] font-bold opacity-90 leading-none mt-0.5">CLAIM</span>
    </div>
  );
};

interface InsuranceNetworkModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
}

export const InsuranceNetworkModal: React.FC<InsuranceNetworkModalProps> = ({
  isOpen,
  onClose,
  user,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'direct' | 'opd'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Policy check simulation state
  const [checkPolicyNumber, setCheckPolicyNumber] = useState(user.insurancePolicyNumber || '');
  const [policyChecked, setPolicyChecked] = useState(false);

  if (!isOpen) return null;

  const filteredPartners = INSURANCE_PARTNERS.filter((partner) => {
    const matchesSearch =
      partner.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      partner.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      partner.code.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (selectedFilter === 'direct') return partner.claimType.includes('ไม่ต้องสำรองจ่าย');
    if (selectedFilter === 'opd') return partner.opdCovered;
    return true;
  });

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleCheckPolicy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkPolicyNumber.trim()) return;
    setPolicyChecked(true);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[32px] p-5 max-w-lg w-full shadow-2xl relative border border-slate-100 max-h-[92vh] overflow-y-auto no-scrollbar">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="pr-8 mb-4">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold font-heading mb-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-700" />
            <span>Hospital Insurance Network</span>
          </div>
          <h3 className="font-heading font-extrabold text-slate-900 text-lg leading-tight">
            รายชื่อบริษัทประกันคู่สัญญา (Insurance Partners)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            โรงพยาบาลรองรับระบบ Fax Claim ไม่ต้องสำรองจ่าย สำหรับผู้ถือกรมธรรม์ประกันสุขภาพ
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="space-y-2 mb-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="ค้นหาบริษัทประกัน เช่น AIA, เมืองไทย, FWD..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600"
            />
          </div>

          <div className="flex gap-1.5 text-xs font-heading">
            <button
              onClick={() => setSelectedFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                selectedFilter === 'all'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              ทั้งหมด ({INSURANCE_PARTNERS.length})
            </button>
            <button
              onClick={() => setSelectedFilter('direct')}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                selectedFilter === 'direct'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              แฟกซ์เคลมไม่ต้องสำรองจ่าย
            </button>
            <button
              onClick={() => setSelectedFilter('opd')}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                selectedFilter === 'opd'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              คุ้มครองผู้ป่วยนอก (OPD)
            </button>
          </div>
        </div>

        {/* Quick Policy Verification Box */}
        <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-3.5 mb-4 text-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-heading font-bold text-emerald-900 text-xs flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
              <span>ตรวจสอบสิทธิเลขที่กรมธรรม์</span>
            </span>
            <span className="text-[10px] text-emerald-700 font-medium">เชื่อมต่อกับระบบเครือข่าย</span>
          </div>

          <form onSubmit={handleCheckPolicy} className="flex gap-1.5">
            <input
              type="text"
              placeholder="กรอกเลขที่กรมธรรม์ของคุณ..."
              value={checkPolicyNumber}
              onChange={(e) => {
                setCheckPolicyNumber(e.target.value);
                setPolicyChecked(false);
              }}
              className="flex-1 px-3 py-2 text-xs rounded-xl border border-emerald-300 bg-white font-mono text-slate-800"
            />
            <button
              type="submit"
              className="bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white px-3 py-2 rounded-xl text-xs font-bold font-heading transition cursor-pointer"
            >
              ตรวจสอบ
            </button>
          </form>

          {policyChecked && (
            <div className="mt-2.5 p-2 rounded-xl bg-white border border-emerald-300 text-[11px] text-slate-700 space-y-1 animate-in fade-in">
              <div className="flex justify-between items-center">
                <span className="font-bold text-emerald-800">✓ พบข้อมูลกรมธรรม์ในระบบ</span>
                <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-2 py-0.2 rounded">
                  พร้อมใช้งาน Fax Claim
                </span>
              </div>
              <p className="text-[10px] text-slate-500">
                เลขกรมธรรม์ {checkPolicyNumber} • เลขบัตรประชาชน {user.nationalId}
              </p>
              <p className="text-[10px] text-emerald-700 font-semibold">
                สามารถแสดงบัตรประชาชนตัวจริง หรือ E-Card ในแอปประกันที่เคาน์เตอร์การเงินของ รพ. เพื่อเปิดสิทธิ Fax Claim ได้ทันที
              </p>
            </div>
          )}
        </div>

        {/* List of Insurance Partners */}
        <div className="space-y-3 mb-4">
          {filteredPartners.map((partner) => {
            const isExpanded = expandedId === partner.id;

            return (
              <div
                key={partner.id}
                className="bg-white rounded-2xl border border-slate-200 card-shadow overflow-hidden transition"
              >
                {/* Header row */}
                <div
                  onClick={() => toggleExpand(partner.id)}
                  className="p-3.5 flex items-start justify-between cursor-pointer hover:bg-slate-50/80 transition"
                >
                  <div className="flex items-start gap-3">
                    <InsuranceLogoBadge partner={partner} />
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="font-heading font-bold text-slate-900 text-xs sm:text-sm">
                          {partner.name}
                        </h4>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-mono">
                          {partner.code}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">{partner.nameEn}</p>
                      <span className="inline-block mt-1 text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-semibold">
                        {partner.claimType}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={`tel:${partner.callCenter}`}
                      onClick={(e) => e.stopPropagation()}
                      className="w-8 h-8 rounded-full bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 flex items-center justify-center transition"
                      title={`โทร Call Center ${partner.callCenter}`}
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </a>
                    <button className="text-slate-400 hover:text-slate-600">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-3.5 pb-3.5 pt-2 border-t border-slate-100 bg-slate-50/60 text-xs space-y-2.5 animate-in fade-in duration-150">
                    {/* Coverage Tags */}
                    <div>
                      <span className="text-[10px] text-slate-400 block font-heading mb-1">
                        ขอบเขตความคุ้มครองที่โรงพยาบาลรองรับ
                      </span>
                      <div className="flex gap-1.5 flex-wrap">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            partner.opdCovered
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-400'
                          }`}
                        >
                          {partner.opdCovered ? '✓ ผู้ป่วยนอก (OPD)' : '✗ ไม่คุ้มครอง OPD'}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            partner.ipdCovered
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-400'
                          }`}
                        >
                          {partner.ipdCovered ? '✓ ผู้ป่วยใน (IPD)' : '✗ ไม่คุ้มครอง IPD'}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            partner.dentalCovered
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-400'
                          }`}
                        >
                          {partner.dentalCovered ? '✓ ทันตกรรม' : '✗ ไม่ครอบคลุมทันตกรรม'}
                        </span>
                      </div>
                    </div>

                    {/* Required Documents */}
                    <div>
                      <span className="text-[10px] text-slate-400 block font-heading mb-0.5">
                        เอกสารที่ต้องใช้ในการยื่นเคลมหน้าเคาน์เตอร์
                      </span>
                      <ul className="text-[11px] text-slate-700 space-y-0.5 pl-3 list-disc">
                        {partner.requiredDocuments.map((doc, idx) => (
                          <li key={idx}>{doc}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Popular plans */}
                    <div>
                      <span className="text-[10px] text-slate-400 block font-heading mb-0.5">
                        แผนประกันยอดนิยม
                      </span>
                      <div className="flex gap-1 flex-wrap">
                        {partner.popularPlans.map((plan, idx) => (
                          <span
                            key={idx}
                            className="bg-white border border-slate-200 text-slate-700 text-[10px] px-2 py-0.5 rounded-md"
                          >
                            {plan}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Notes & Call */}
                    <div className="pt-1 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">
                        Call Center: <strong className="text-slate-800">{partner.callCenter}</strong> (24 ชม.)
                      </span>
                      <a
                        href={`tel:${partner.callCenter}`}
                        className="text-emerald-700 font-bold hover:underline flex items-center gap-1"
                      >
                        <Phone className="w-3 h-3" /> โทรสอบถามสิทธิ
                      </a>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Action Button */}
        <button
          onClick={onClose}
          className="w-full bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white font-bold py-3 px-4 rounded-2xl text-xs font-heading transition cursor-pointer shadow-xs"
        >
          ปิดหน้ารายชื่อบริษัทประกัน
        </button>
      </div>
    </div>
  );
};
