import React from 'react';
import { X, MapPin, Phone, Clock, Users, ArrowUpRight, CheckCircle, Navigation } from 'lucide-react';
import { Hospital } from '../types';

interface HospitalDetailModalProps {
  hospital: Hospital | null;
  isOpen: boolean;
  onClose: () => void;
  onBookQueue: (hospital: Hospital, departmentName: string) => void;
}

export const HospitalDetailModal: React.FC<HospitalDetailModalProps> = ({
  hospital,
  isOpen,
  onClose,
  onBookQueue,
}) => {
  if (!isOpen || !hospital) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[32px] p-5 max-w-md w-full shadow-2xl relative border border-slate-100 max-h-[90vh] overflow-y-auto no-scrollbar">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Hospital Header */}
        <div className="pr-8">
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-md">
              {hospital.type}
            </span>
            <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
              {hospital.badge || 'เปิดบริการ'}
            </span>
          </div>
          <h3 className="font-bold text-slate-900 text-lg font-heading leading-tight">{hospital.name}</h3>
          <p className="text-xs text-slate-500 mt-1 flex items-start gap-1">
            <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
            <span>{hospital.address}</span>
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2 my-4 bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center">
          <div>
            <span className="text-[10px] text-slate-400 block">ระยะทาง</span>
            <span className="font-heading font-bold text-slate-800 text-xs sm:text-sm">
              {hospital.distanceKm} กม.
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block">ผู้รอตรวจรวม</span>
            <span className="font-heading font-bold text-slate-800 text-xs sm:text-sm">
              {hospital.totalWaitingCount} คิว
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block">เวลารอเฉลี่ย</span>
            <span className="font-heading font-bold text-emerald-600 text-xs sm:text-sm">
              ~{hospital.estWaitMinutes} นาที
            </span>
          </div>
        </div>

        {/* Congestion Level Bar */}
        <div className="mb-4">
          <div className="flex justify-between items-center text-xs mb-1.5 font-heading">
            <span className="text-slate-600 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-emerald-600" /> ระดับความหนาแน่นผู้ป่วย
            </span>
            <span className="font-mono font-bold text-emerald-700">{hospital.congestionPct}%</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                hospital.congestionPct > 70
                  ? 'bg-rose-500'
                  : hospital.congestionPct > 45
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${hospital.congestionPct}%` }}
            />
          </div>
        </div>

        {/* Departments List & Real-time Queues */}
        <div className="space-y-2 mb-4">
          <h4 className="font-heading font-bold text-xs text-slate-800 flex items-center justify-between">
            <span>แผนกตรวจและคิวปัจจุบัน</span>
            <span className="text-[10px] text-slate-400 font-normal">อัปเดตแบบเรียลไทม์</span>
          </h4>

          {hospital.departments.map((dept) => (
            <div
              key={dept.id}
              className="bg-white border border-slate-200/90 hover:border-emerald-300 p-3 rounded-2xl flex flex-col justify-between gap-2 transition"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h5 className="font-heading font-bold text-xs text-slate-800">{dept.name}</h5>
                  <p className="text-[11px] text-slate-500 mt-0.5">{dept.doctorOnDuty}</p>
                </div>
                <div className="text-right">
                  <span className="text-[9px] text-slate-400 block">กำลังตรวจคิว</span>
                  <span className="font-mono font-bold text-sm text-emerald-600">{dept.currentServing}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
                <span className="text-slate-600">
                  รอ <strong>{dept.waitingCount} คิว</strong> (~{dept.estWaitMinutes} นาที)
                </span>
                <button
                  onClick={() => onBookQueue(hospital, dept.name)}
                  className="bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl shadow-xs flex items-center gap-1 transition"
                >
                  <CheckCircle className="w-3 h-3" /> จองคิวแผนกนี้
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Info & Hotline Links */}
        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-xs space-y-1.5 mb-4 text-slate-600">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-[11px]">{hospital.openHours}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="w-3.5 h-3.5 text-emerald-600" />
            <a href={`tel:${hospital.phone}`} className="text-[11px] text-emerald-700 font-semibold hover:underline">
              โทร: {hospital.phone}
            </a>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hospital.name + ' ' + hospital.address)}`}
            target="_blank"
            rel="noreferrer"
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-3 rounded-2xl text-xs font-heading flex items-center justify-center gap-1.5 border border-slate-200 transition"
          >
            <Navigation className="w-3.5 h-3.5 text-emerald-600" /> แผนที่นำทาง
          </a>
          <button
            onClick={() => onBookQueue(hospital, hospital.departments[0]?.name || 'แผนกตรวจโรคทั่วไป')}
            className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3 px-3 rounded-2xl text-xs font-heading flex items-center justify-center gap-1.5 shadow-sm transition"
          >
            <span>จองคิวตรวจ</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
