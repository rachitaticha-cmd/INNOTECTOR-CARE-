import React, { useState } from 'react';
import {
  CalendarCheck,
  QrCode,
  Navigation,
  Clock,
  Ban,
  CheckCircle2,
  Pill,
  FileText,
  AlertTriangle,
  ChevronRight,
  Eye,
  Bell,
  Building,
} from 'lucide-react';
import { QueueTicket, UserProfile, Prescription } from '../types';
import { getPrescriptions, getSavedUser, playChime } from '../services/storage';
import { PrescriptionDetailModal } from '../components/PrescriptionDetailModal';

interface HistoryViewProps {
  queues: QueueTicket[];
  user?: UserProfile;
  onOpenQrModal: (ticket: QueueTicket) => void;
  onCancelQueue: (ticketId: string) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  queues,
  user,
  onOpenQrModal,
  onCancelQueue,
}) => {
  const currentUser = user || getSavedUser();
  const [mainTab, setMainTab] = useState<'queues' | 'prescriptions'>('queues');
  const [filter, setFilter] = useState<'all' | 'active' | 'history'>('all');

  // Prescriptions state
  const [prescriptions, setPrescriptions] = useState<Prescription[]>(() => getPrescriptions());
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const filteredQueues = queues.filter((q) => {
    if (filter === 'active') return q.status === 'waiting' || q.status === 'called';
    if (filter === 'history') return q.status === 'completed' || q.status === 'cancelled';
    return true;
  });

  const activeCount = queues.filter((q) => q.status === 'waiting' || q.status === 'called').length;

  const handleOpenPrescription = (rx: Prescription) => {
    setSelectedPrescription(rx);
    setIsPrescriptionModalOpen(true);
    playChime('tick');
  };

  const handleQuickReminder = (rx: Prescription) => {
    playChime('success');
    setToastMsg(`ตั้งเตือนรับประทานยาชุด ${rx.prescriptionNumber} เรียบร้อยแล้ว`);
    setTimeout(() => setToastMsg(null), 3000);
  };

  return (
    <div className="p-4 space-y-3.5 select-none pb-24">
      {/* Toast alert */}
      {toastMsg && (
        <div className="p-3 bg-emerald-700 text-white rounded-2xl text-xs flex items-center gap-2 shadow-lg animate-in slide-in-from-top duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Main Mode Toggle: Queues vs Prescriptions */}
      <div className="flex bg-slate-200/80 p-1 rounded-2xl text-xs font-heading">
        <button
          onClick={() => setMainTab('queues')}
          className={`flex-1 py-2 rounded-xl text-center font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
            mainTab === 'queues'
              ? 'bg-white text-emerald-800 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <CalendarCheck className="w-4 h-4 text-emerald-700" />
          <span>คิวตรวจ ({queues.length})</span>
        </button>

        <button
          onClick={() => setMainTab('prescriptions')}
          className={`flex-1 py-2 rounded-xl text-center font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
            mainTab === 'prescriptions'
              ? 'bg-white text-emerald-800 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Pill className="w-4 h-4 text-emerald-700" />
          <span>ประวัติการจ่ายยา ({prescriptions.length})</span>
        </button>
      </div>

      {/* ================= TAB 1: QUEUE TICKETS ================= */}
      {mainTab === 'queues' && (
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-800 font-heading">
              รายการบัตรคิวตรวจของคุณ
            </h3>
            <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 rounded-full font-bold">
              {activeCount} คิวรอดำเนินการ
            </span>
          </div>

          {/* Filter Sub-Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-heading">
            <button
              onClick={() => setFilter('all')}
              className={`flex-1 py-1.5 rounded-lg text-center font-semibold transition ${
                filter === 'all' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              ทั้งหมด ({queues.length})
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`flex-1 py-1.5 rounded-lg text-center font-semibold transition ${
                filter === 'active' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              กำลังรอตรวจ ({activeCount})
            </button>
            <button
              onClick={() => setFilter('history')}
              className={`flex-1 py-1.5 rounded-lg text-center font-semibold transition ${
                filter === 'history' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              เสร็จสิ้น/ยกเลิก
            </button>
          </div>

          {/* Queue List */}
          {filteredQueues.length === 0 ? (
            <div className="bg-white p-8 rounded-3xl border border-slate-100 card-shadow text-center space-y-2">
              <Clock className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="font-heading font-bold text-slate-700 text-sm">ไม่พบรายการคิว</h3>
              <p className="text-xs text-slate-400">
                คุณสามารถประเมินอาการในเมนู &quot;เริ่มประเมินอาการ&quot; เพื่อรับบัตรคิวตรวจได้ทันที
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredQueues.map((q) => {
                const isActive = q.status === 'waiting' || q.status === 'called';
                const isCalled = q.status === 'called';

                let badgeBg = 'bg-emerald-100 text-emerald-800 border-emerald-200';
                if (q.triageLevel === 'red') badgeBg = 'bg-rose-100 text-rose-800 border-rose-200';
                if (q.triageLevel === 'yellow') badgeBg = 'bg-amber-100 text-amber-800 border-amber-200';

                return (
                  <div
                    key={q.id}
                    className={`bg-white p-4.5 rounded-[24px] border card-shadow text-xs space-y-3 transition ${
                      isCalled ? 'border-emerald-500 ring-2 ring-emerald-400/30' : 'border-slate-100'
                    }`}
                  >
                    {isCalled && (
                      <div className="bg-emerald-600 text-white text-[11px] font-bold py-1 px-3 -mx-4.5 -mt-4.5 mb-2 text-center flex items-center justify-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> ถึงคิวตรวจของคุณแล้ว กรุณาเข้าห้องตรวจ
                      </div>
                    )}

                    <div className="flex justify-between items-start">
                      <div>
                        <span className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold font-heading ${badgeBg}`}>
                          {q.triageTitle}
                        </span>
                        <h4 className="font-bold text-sm text-slate-900 mt-1 font-heading">{q.hospitalName}</h4>
                        <p className="text-slate-500 text-[11px]">{q.department}</p>
                      </div>

                      <div className="text-right">
                        <span className="font-mono text-2xl font-black text-emerald-700 block leading-tight">
                          {q.queueNum}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            q.status === 'waiting'
                              ? 'bg-amber-100 text-amber-800'
                              : q.status === 'called'
                              ? 'bg-emerald-600 text-white animate-pulse'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {q.status === 'waiting' ? 'กำลังรอเรียก' : q.status === 'called' ? 'ถึงคิวแล้ว' : 'เสร็จสิ้น'}
                        </span>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex justify-between items-center text-[11px] text-slate-600">
                      <div>
                        <span>จำนวนคิวก่อนหน้า: </span>
                        <strong className="text-emerald-700 font-bold">{q.ahead} คิว</strong>
                      </div>
                      <div>
                        <span>เวลารอโดยประมาณ: </span>
                        <strong className="text-emerald-700 font-bold">{q.estWait}</strong>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-[11px] pt-1">
                      <span className="text-slate-400">จองเมื่อ: {q.createdAt}</span>

                      <div className="flex gap-2">
                        {isActive && (
                          <button
                            onClick={() => onCancelQueue(q.id)}
                            className="text-rose-600 hover:text-rose-700 font-semibold px-2.5 py-1 rounded-lg hover:bg-rose-50 flex items-center gap-1 transition cursor-pointer"
                          >
                            <Ban className="w-3.5 h-3.5" />
                            <span>ยกเลิก</span>
                          </button>
                        )}
                        <button
                          onClick={() => onOpenQrModal(q)}
                          className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-xs transition cursor-pointer"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>QR บัตรคิว</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 2: PRESCRIPTIONS & MEDICATION HISTORY ================= */}
      {mainTab === 'prescriptions' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-800 font-heading">
                ประวัติการจ่ายยาโดยแพทย์
              </h3>
              <p className="text-[11px] text-slate-500">
                ประวัติยาที่แพทย์สั่งจ่ายพร้อมวิธีรับประทาน
              </p>
            </div>
            <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 rounded-full font-bold">
              {prescriptions.length} ใบสั่งยา
            </span>
          </div>

          <div className="space-y-3.5">
            {prescriptions.map((rx) => (
              <div
                key={rx.id}
                className="bg-white p-4.5 rounded-[24px] border border-slate-100 card-shadow text-xs space-y-3 hover:border-emerald-300 transition"
              >
                {/* Header row */}
                <div className="flex items-start justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                      <Pill className="w-5 h-5 text-emerald-700" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs sm:text-sm font-heading">
                        {rx.hospitalName}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-mono">
                        เลขที่: {rx.prescriptionNumber} · วันที่: {rx.date}
                      </p>
                    </div>
                  </div>

                  <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full text-[10px]">
                    {rx.status}
                  </span>
                </div>

                {/* Doctor & Diagnosis */}
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-500">แพทย์ผู้สั่งยา:</span>
                    <strong className="text-slate-800">{rx.doctorName}</strong>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-500">การวินิจฉัย:</span>
                    <strong className="text-emerald-800">{rx.diagnosis}</strong>
                  </div>
                  <div className="flex justify-between text-[11px] pt-0.5 border-t border-slate-200/60">
                    <span className="text-slate-500">สิทธิการรักษา:</span>
                    <span className="text-emerald-700 font-bold">{rx.coverageStatus}</span>
                  </div>
                </div>

                {/* Medicines List Preview */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-700 font-heading block">
                    รายการยาที่ได้รับ ({rx.medicines.length} รายการ):
                  </span>
                  <div className="space-y-1.5">
                    {rx.medicines.map((med) => (
                      <div
                        key={med.id}
                        className="p-2.5 rounded-xl bg-emerald-50/50 border border-emerald-100 flex items-center justify-between text-[11px]"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-slate-800 font-heading">
                            {med.name} ({med.dosage})
                          </p>
                          <p className="text-[10px] text-slate-500 leading-tight">
                            👉 {med.instructions}
                          </p>
                        </div>
                        <span className="bg-white border border-emerald-200 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px] shrink-0 ml-2">
                          {med.quantity}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={() => handleQuickReminder(rx)}
                    className="text-xs text-slate-600 hover:text-emerald-700 flex items-center gap-1 font-medium cursor-pointer"
                  >
                    <Bell className="w-3.5 h-3.5 text-emerald-600" />
                    <span>ตั้งเตือนทานยา</span>
                  </button>

                  <button
                    onClick={() => handleOpenPrescription(rx)}
                    className="bg-[#1c4c39] hover:bg-[#153c2c] text-white font-bold px-3 py-1.5 rounded-xl text-xs font-heading flex items-center gap-1 transition cursor-pointer shadow-xs"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>ดูใบสั่งยาและฉลาก</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Prescription Detail Modal */}
      <PrescriptionDetailModal
        isOpen={isPrescriptionModalOpen}
        onClose={() => setIsPrescriptionModalOpen(false)}
        prescription={selectedPrescription}
        user={currentUser}
      />
    </div>
  );
};
