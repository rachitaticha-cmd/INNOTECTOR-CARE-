import React, { useState } from 'react';
import {
  CalendarCheck,
  QrCode,
  Clock,
  Ban,
  CheckCircle2,
  Stethoscope,
  Building2,
} from 'lucide-react';
import { QueueTicket, TriageAssessment, UserProfile } from '../types';

interface HistoryViewProps {
  queues: QueueTicket[];
  triages: TriageAssessment[];
  user: UserProfile;
  onOpenQrModal: (ticket: QueueTicket) => void;
  onCancelQueue: (ticketId: string) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  queues,
  triages,
  onOpenQrModal,
  onCancelQueue,
}) => {
  const [mainTab, setMainTab] = useState<'queues' | 'triages'>('queues');
  const [filter, setFilter] = useState<'all' | 'active' | 'history'>('all');

  const filteredQueues = queues.filter((q) => {
    if (filter === 'active') return q.status === 'waiting' || q.status === 'called';
    if (filter === 'history') return q.status === 'completed' || q.status === 'cancelled';
    return true;
  });

  const activeCount = queues.filter((q) => q.status === 'waiting' || q.status === 'called').length;

  return (
    <div className="p-4 space-y-3.5 select-none pb-24">
      {/* Main Mode Toggle: Queues vs Triage History */}
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
          onClick={() => setMainTab('triages')}
          className={`flex-1 py-2 rounded-xl text-center font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
            mainTab === 'triages'
              ? 'bg-white text-emerald-800 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Stethoscope className="w-4 h-4 text-emerald-700" />
          <span>ประวัติประเมินอาการ ({triages.length})</span>
        </button>
      </div>

      {/* ================= TAB 1: QUEUE TICKETS ================= */}
      {mainTab === 'queues' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-800 font-heading">
              รายการบัตรคิวตรวจของคุณ
            </h3>
            <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 rounded-full font-bold">
              {activeCount} คิวรอดำเนินการ
            </span>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-heading">
            <button
              onClick={() => setFilter('all')}
              className={`flex-1 py-1.5 rounded-lg text-center font-semibold transition cursor-pointer ${
                filter === 'all' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              ทั้งหมด ({queues.length})
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`flex-1 py-1.5 rounded-lg text-center font-semibold transition cursor-pointer ${
                filter === 'active' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              กำลังรอตรวจ ({activeCount})
            </button>
            <button
              onClick={() => setFilter('history')}
              className={`flex-1 py-1.5 rounded-lg text-center font-semibold transition cursor-pointer ${
                filter === 'history' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              เสร็จสิ้น/ยกเลิก
            </button>
          </div>

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
                if (q.triageLevel === 'orange') badgeBg = 'bg-orange-100 text-orange-800 border-orange-200';
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
                              : q.status === 'cancelled'
                              ? 'bg-rose-50 text-rose-600'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {q.status === 'waiting'
                            ? 'กำลังรอเรียก'
                            : q.status === 'called'
                            ? 'ถึงคิวแล้ว'
                            : q.status === 'cancelled'
                            ? 'ยกเลิกแล้ว'
                            : 'เสร็จสิ้น'}
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

      {/* ================= TAB 2: REAL TRIAGE ASSESSMENTS ================= */}
      {mainTab === 'triages' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-800 font-heading">
                ประวัติการประเมินอาการของคุณ
              </h3>
              <p className="text-[11px] text-slate-500">
                บันทึกจริงในฐานข้อมูลพร้อมสถานพยาบาลที่ระบบแนะนำ
              </p>
            </div>
            <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 rounded-full font-bold">
              {triages.length} รายการ
            </span>
          </div>

          {triages.length === 0 ? (
            <div className="bg-white p-8 rounded-3xl border border-slate-100 card-shadow text-center space-y-2">
              <Stethoscope className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="font-heading font-bold text-slate-700 text-sm">ยังไม่มีประวัติการประเมินอาการ</h3>
              <p className="text-xs text-slate-400">
                เริ่มประเมินอาการจากหน้าหลักเพื่อเก็บประวัติและคำแนะนำทางการแพทย์จริงที่นี่
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {triages.map((item) => {
                const badgeClass =
                  item.level === 'red'
                    ? 'bg-rose-100 text-rose-800 border-rose-200'
                    : item.level === 'orange'
                    ? 'bg-orange-100 text-orange-800 border-orange-200'
                    : item.level === 'yellow'
                    ? 'bg-amber-100 text-amber-800 border-amber-200'
                    : 'bg-emerald-100 text-emerald-800 border-emerald-200';

                return (
                  <div
                    key={item.id}
                    className="bg-white p-4 rounded-[24px] border border-slate-100 card-shadow text-xs space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold font-heading ${badgeClass}`}>
                        {item.title}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">{item.createdAt}</span>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {item.symptoms.map((sym, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-semibold text-[11px]"
                        >
                          {sym}
                        </span>
                      ))}
                      {item.duration && (
                        <span className="px-2 py-0.5 rounded-lg bg-slate-50 text-slate-500 text-[11px]">
                          ระยะเวลา: {item.duration}
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      {item.description}
                    </p>

                    <div className="flex items-center justify-between pt-1 text-[11px] text-emerald-800 font-semibold">
                      <span className="flex items-center gap-1.5 truncate">
                        <Building2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                        <span className="truncate">{item.recommendedHospitalName}</span>
                      </span>
                      {item.recommendedService && (
                        <span className="text-[10px] bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded shrink-0 ml-2">
                          {item.recommendedService}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
