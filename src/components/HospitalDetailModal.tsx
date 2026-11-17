import React from 'react';
import { X, MapPin, Phone, Clock, ArrowUpRight, CheckCircle, Navigation, Building2 } from 'lucide-react';
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
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Hospital Header */}
        <div className="pr-8">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-md">
              {hospital.type}
            </span>
            {hospital.badge && (
              <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                {hospital.badge}
              </span>
            )}
          </div>
          <h3 className="font-bold text-slate-900 text-lg font-heading leading-tight">{hospital.name}</h3>
          <p className="text-xs text-slate-500 mt-1 flex items-start gap-1">
            <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
            <span>{hospital.address}</span>
          </p>
        </div>

        {/* Real Metrics Grid (no fake congestion %) */}
        <div className="grid grid-cols-2 gap-2 my-4 bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center">
          <div>
            <span className="text-[10px] text-slate-400 block">ระยะทางจากตำแหน่งคุณ</span>
            <span className="font-heading font-bold text-slate-800 text-xs sm:text-sm">
              {hospital.distanceKm} กม.
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block">เดินทางโดยประมาณ</span>
            <span className="font-heading font-bold text-emerald-700 text-xs sm:text-sm">
              ~{hospital.estWaitMinutes} นาที
            </span>
          </div>
        </div>

        {/* Departments / Services */}
        <div className="space-y-2 mb-4">
          <h4 className="font-heading font-bold text-xs text-slate-800 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-emerald-700" />
            <span>จุดบริการที่เปิดรับจองคิวล่วงหน้า</span>
          </h4>

          {hospital.departments.map((dept) => (
            <div
              key={dept.id}
              className="bg-white border border-slate-200/90 hover:border-emerald-300 p-3 rounded-2xl flex items-center justify-between gap-2 transition"
            >
              <div className="min-w-0">
                <h5 className="font-heading font-bold text-xs text-slate-800">{dept.name}</h5>
                <p className="text-[11px] text-slate-500 mt-0.5">{dept.doctorOnDuty}</p>
              </div>
              <button
                onClick={() => onBookQueue(hospital, dept.name)}
                className="bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl shadow-xs flex items-center gap-1 transition cursor-pointer shrink-0"
              >
                <CheckCircle className="w-3 h-3" /> จองคิว
              </button>
            </div>
          ))}
        </div>

        {/* Real Opening Hours & Phone */}
        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-xs space-y-1.5 mb-4 text-slate-600">
          <div className="flex items-start gap-2">
            <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
            <span className="text-[11px]">{hospital.openHours}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            {hospital.phone && hospital.phone !== '-' ? (
              <a href={`tel:${hospital.phone}`} className="text-[11px] text-emerald-700 font-semibold hover:underline">
                โทร: {hospital.phone}
              </a>
            ) : (
              <span className="text-[11px] text-slate-400">ไม่มีข้อมูลเบอร์โทรศัพท์ในระบบแผนที่</span>
            )}
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
            <Navigation className="w-3.5 h-3.5 text-emerald-600" /> เปิด Google Maps
          </a>
          <button
            onClick={() => onBookQueue(hospital, hospital.departments[0]?.name || 'แผนกตรวจโรคทั่วไป (OPD)')}
            className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3 px-3 rounded-2xl text-xs font-heading flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
          >
            <span>จองคิวตรวจ</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
