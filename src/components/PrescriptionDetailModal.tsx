import React, { useState } from 'react';
import {
  X,
  FileText,
  Building,
  User,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Download,
  Share2,
  Bell,
  CheckCircle2,
  Calendar,
  Pill,
} from 'lucide-react';
import { Prescription, UserProfile } from '../types';
import { playChime } from '../services/storage';

interface PrescriptionDetailModalProps {
  prescription: Prescription | null;
  user: UserProfile;
  isOpen: boolean;
  onClose: () => void;
}

export const PrescriptionDetailModal: React.FC<PrescriptionDetailModalProps> = ({
  prescription,
  user,
  isOpen,
  onClose,
}) => {
  const [reminderSet, setReminderSet] = useState<boolean>(false);

  if (!isOpen || !prescription) return null;

  const handleSetReminder = () => {
    setReminderSet(true);
    playChime('success');
    setTimeout(() => {
      setReminderSet(false);
    }, 3000);
  };

  const handleDownload = () => {
    playChime('tick');
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(prescription, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${prescription.prescriptionNumber}_e-prescription.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-t-[32px] sm:rounded-[32px] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#1c4c39] to-[#123627] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
              <FileText className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="font-heading font-extrabold text-sm sm:text-base">
                ใบสั่งยาอิเล็กทรอนิกส์ (E-Prescription)
              </h3>
              <p className="text-[11px] text-emerald-200 font-mono">
                {prescription.prescriptionNumber}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs select-none">
          {reminderSet && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>ตั้งการแจ้งเตือนเวลารับประทานยาสำหรับรายการยาชุดนี้เรียบร้อยแล้ว!</span>
            </div>
          )}

          {/* Patient & Hospital Info */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-2">
            <div className="flex justify-between items-start pb-2 border-b border-slate-200">
              <div>
                <span className="text-[10px] text-slate-400 block">สถานพยาบาลที่สั่งจ่าย</span>
                <strong className="text-slate-900 font-heading text-xs">{prescription.hospitalName}</strong>
              </div>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                {prescription.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
              <div>
                <span className="text-slate-400 block text-[10px]">ผู้ป่วย</span>
                <strong className="text-slate-800">{user.name}</strong> (HN: {user.hn})
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">แพทย์ผู้สั่งจ่าย</span>
                <strong className="text-slate-800">{prescription.doctorName}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">วันที่สั่งยา</span>
                <span className="text-slate-800 font-medium">{prescription.date}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">สิทธิการรักษา</span>
                <span className="text-emerald-700 font-bold">{prescription.coverageStatus}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200">
              <span className="text-[10px] text-slate-400 block">การวินิจฉัยโรค (Diagnosis)</span>
              <p className="text-slate-800 font-bold text-xs">{prescription.diagnosis}</p>
            </div>
          </div>

          {/* Medicines List */}
          <div>
            <h4 className="font-heading font-bold text-xs text-slate-900 mb-2.5 flex items-center gap-1.5">
              <Pill className="w-4 h-4 text-emerald-700" />
              <span>รายการยาและคำแนะนำการรับประทาน ({prescription.medicines.length} รายการ)</span>
            </h4>

            <div className="space-y-3">
              {prescription.medicines.map((med, idx) => (
                <div
                  key={med.id || idx}
                  className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{med.icon || '💊'}</span>
                      <div>
                        <h5 className="font-heading font-bold text-slate-900 text-xs sm:text-sm">
                          {med.name}
                        </h5>
                        <p className="text-[10px] text-slate-500 font-mono">{med.genericName}</p>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg shrink-0">
                      {med.quantity}
                    </span>
                  </div>

                  {/* Dosage schedule badge */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px]">
                    <span className="bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-md">
                      {med.mealTiming}
                    </span>
                    <span className="bg-slate-100 text-slate-700 font-medium px-2 py-0.5 rounded-md">
                      {med.frequency}
                    </span>
                  </div>

                  {/* Instructions */}
                  <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100 font-medium leading-relaxed">
                    👉 <strong>วิธีใช้:</strong> {med.instructions}
                  </p>

                  {/* Warnings */}
                  {med.warnings && (
                    <p className="text-[11px] text-amber-800 bg-amber-50/80 p-2 rounded-xl border border-amber-200 flex items-start gap-1.5 leading-snug">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <span>{med.warnings}</span>
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2 shrink-0">
          <button
            onClick={handleSetReminder}
            className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2.5 px-3 rounded-xl text-xs font-heading flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
          >
            <Bell className="w-3.5 h-3.5" />
            <span>ตั้งเตือนเวลาทานยา</span>
          </button>

          <button
            onClick={handleDownload}
            className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold py-2.5 px-3 rounded-xl text-xs font-heading flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>ดาวน์โหลด</span>
          </button>
        </div>
      </div>
    </div>
  );
};
