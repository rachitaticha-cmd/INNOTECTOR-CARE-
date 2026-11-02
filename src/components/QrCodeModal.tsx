import React from 'react';
import { X, QrCode, CheckCircle2, ShieldCheck, Printer } from 'lucide-react';
import { QueueTicket, UserProfile } from '../types';

interface QrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: QueueTicket | null;
  user: UserProfile;
}

export const QrCodeModal: React.FC<QrCodeModalProps> = ({
  isOpen,
  onClose,
  ticket,
  user,
}) => {
  if (!isOpen) return null;

  const qrData = ticket
    ? `INNOTECTOR-TICKET:${ticket.id}|HN:${user.hn}|QUEUE:${ticket.queueNum}|HOSP:${encodeURIComponent(ticket.hospitalName)}`
    : `INNOTECTOR-PATIENT-HN:${user.hn}|NAME:${encodeURIComponent(user.name)}`;

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(qrData)}`;

  return (
    <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[32px] p-6 text-center max-w-sm w-full shadow-2xl relative border border-slate-100">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center justify-center gap-1.5 mb-1 text-emerald-600">
          <QrCode className="w-5 h-5" />
          <h3 className="font-bold text-slate-900 text-base font-heading">
            {ticket ? 'บัตรคิวอิเล็กทรอนิกส์ (E-Queue)' : 'My Health QR Code'}
          </h3>
        </div>

        <p className="text-xs text-slate-500 mb-4 px-2">
          {ticket
            ? 'แสดง QR Code หรือหมายเลขคิวนี้ต่อตู้คิวดิจิทัล หรือเจ้าหน้าที่พยาบาลหน้าห้องตรวจ'
            : 'แสดง QR Code นี้ให้เจ้าหน้าที่สแกนเพื่อดึงประวัติการรักษาทันที'}
        </p>

        {ticket && (
          <div className="bg-emerald-50/80 border border-emerald-200 p-3 rounded-2xl mb-4 text-left">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[11px] text-emerald-800 font-semibold">{ticket.hospitalName}</span>
              <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-bold">
                {ticket.department}
              </span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-slate-500">หมายเลขคิวของคุณ</span>
              <span className="font-mono font-extrabold text-2xl text-emerald-700 tracking-wider">
                {ticket.queueNum}
              </span>
            </div>
          </div>
        )}

        {/* QR Code Container */}
        <div className="bg-slate-50 p-4 rounded-3xl inline-block border border-slate-200 shadow-inner">
          <img
            src={qrUrl}
            alt="Medical QR Code"
            className="w-44 h-44 mx-auto rounded-xl shadow-xs"
          />
        </div>

        {/* HN and Patient Identity */}
        <div className="mt-3">
          <p className="font-mono font-bold text-sm text-emerald-700 tracking-wider">
            HN: {user.hn}
          </p>
          <p className="text-xs font-semibold text-slate-700 mt-0.5">{user.name}</p>
        </div>

        {/* Verified Badge */}
        <div className="flex items-center justify-center gap-1.5 mt-3 text-[11px] text-emerald-700 bg-emerald-50 py-1.5 px-3 rounded-xl">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>ระบบคัดกรอง AI ผ่านการรับรองความปลอดภัย</span>
        </div>

        {/* Action Button */}
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => {
              window.print();
            }}
            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-3 rounded-2xl text-xs font-heading flex items-center justify-center gap-1.5 transition"
          >
            <Printer className="w-3.5 h-3.5" /> พิมพ์บัตร
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2.5 px-3 rounded-2xl text-xs font-heading flex items-center justify-center gap-1.5 shadow-sm transition"
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> รับทราบ
          </button>
        </div>
      </div>
    </div>
  );
};
