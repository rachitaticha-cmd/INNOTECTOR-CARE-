import React, { useState } from 'react';
import {
  QrCode,
  ArrowRight,
  MapPin,
  Clock,
  Users,
  Compass,
  CalendarDays,
  MessageSquare,
  Activity,
  Stethoscope,
  ChevronRight,
  PhoneCall,
  FileText,
  Building,
  Shield,
  Bell,
  Navigation,
  CheckCircle2,
  User,
} from 'lucide-react';
import { Hospital, QueueTicket, UserProfile } from '../types';
import { BANGKOK_DISTRICTS } from '../data/mockData';
import { ScreenTab } from '../components/BottomNavBar';
import { playChime } from '../services/storage';

interface HomeViewProps {
  user: UserProfile;
  currentDistrict: string;
  onDistrictChange: (district: string) => void;
  hospitals: Hospital[];
  activeQueues: QueueTicket[];
  onNavigate: (tab: ScreenTab) => void;
  onStartTriage: () => void;
  onOpenMap: () => void;
  onOpenQrModal: (ticket?: QueueTicket) => void;
  onOpenHospitalDetail: (hospital: Hospital) => void;
  onOpenDoctorSummary: () => void;
  onOpenHealthcareRights: () => void;
  onOpenInsurancePartners: () => void;
  onCancelQueue: (ticketId: string) => void;
  onOpenNotifications: () => void;
  unreadNotificationsCount?: number;
}

export const HomeView: React.FC<HomeViewProps> = ({
  user,
  currentDistrict,
  onDistrictChange,
  hospitals,
  activeQueues,
  onNavigate,
  onStartTriage,
  onOpenMap,
  onOpenQrModal,
  onOpenHospitalDetail,
  onOpenDoctorSummary,
  onOpenHealthcareRights,
  onOpenInsurancePartners,
  onCancelQueue,
  onOpenNotifications,
  unreadNotificationsCount = 2,
}) => {
  const primaryActiveQueue = activeQueues.find((q) => q.status === 'waiting' || q.status === 'called');
  const recommendedHospital = hospitals[0] || null;

  // Live GPS tracking state
  const [gpsStatus, setGpsStatus] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [liveCoords, setLiveCoords] = useState<{ lat: number; lng: number } | null>(null);

  const handleAcquireGps = () => {
    setIsLocating(true);
    setGpsStatus('กำลังค้นหาสัญญาณดาวเทียม GPS...');

    if (!('geolocation' in navigator)) {
      setGpsStatus('อุปกรณ์ไม่รองรับระบบ Geolocation (ใช้พิกัดเขตบางแค)');
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(4));
        const lng = Number(pos.coords.longitude.toFixed(4));
        setLiveCoords({ lat, lng });
        setGpsStatus(`จับพิกัดสดสำเร็จ: ${lat}, ${lng} (รัศมีความแม่นยำ ~${Math.round(pos.coords.accuracy)} ม.)`);
        setIsLocating(false);
        playChime('success');
      },
      (err) => {
        // Fallback simulate Bangkok GPS lock
        setTimeout(() => {
          setLiveCoords({ lat: 13.7224, lng: 100.3802 });
          setGpsStatus('จับพิกัดพื้นที่ปัจจุบัน: เขตบางแค กรุงเทพฯ (13.7224, 100.3802)');
          setIsLocating(false);
          playChime('success');
        }, 800);
      },
      { timeout: 7000, enableHighAccuracy: true }
    );
  };

  return (
    <div className="select-none min-h-full pb-36 bg-[#f8fafc]">
      {/* 
        Top Seamless Dark Green Header matching Screenshot_20261101_151321_Chrome_a8db1b6e.jpg
        Extends to top with Inotector Care branding and Bell notification icon
      */}
      <div className="bg-[#163d2d] text-white pt-4 pb-6 px-4 rounded-b-[32px] shadow-md relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Top Header Bar: + Inotector Care on Left, Notification Bell on Right */}
        <div className="flex items-center justify-between mb-4 relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-600/60 border border-emerald-400/40 flex items-center justify-center text-white font-bold text-base shadow-xs">
              +
            </div>
            <h1 className="font-heading font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
              <span>Inotector Care</span>
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {/* Notification Bell Button with Red Badge Dot matching Screenshot */}
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

            {/* Patient QR Shortcut */}
            <button
              onClick={() => onOpenQrModal()}
              title="เปิด QR Code ประจำตัวผู้ป่วย"
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center transition cursor-pointer border border-white/10 shadow-xs"
            >
              <QrCode className="w-4 h-4 text-emerald-100" />
            </button>
          </div>
        </div>

        {/* Hero Greeting: NO HAND EMOJI as requested, profile picture removed from home screen */}
        <div className="space-y-1.5 relative z-10 mb-4">
          <h2 className="text-xl font-extrabold font-heading text-white">
            สวัสดี {user.name}
          </h2>
          <p className="text-xs text-[#bcd9c9] leading-relaxed font-light">
            ประเมินอาการเบื้องต้น วิเคราะห์ความเสี่ยง พร้อมแนะนำโรงพยาบาลใกล้เคียง
          </p>
        </div>

        {/* Golden / Amber CTA Button: เริ่มประเมินอาการ */}
        <div className="relative z-10">
          <button
            onClick={onStartTriage}
            className="w-full bg-gradient-to-r from-[#f7b73d] to-[#e2960f] hover:brightness-105 active:scale-[0.98] text-[#3a2a05] font-extrabold text-sm py-3 px-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 font-heading transition cursor-pointer"
          >
            <Stethoscope className="w-4.5 h-4.5 text-[#3a2a05]" />
            <span>เริ่มประเมินอาการ</span>
            <ArrowRight className="w-4 h-4 text-[#3a2a05]" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-4 space-y-4">
        {/* SOS Emergency Call Banner matching AISelect_20261101_161736_Chrome.jpg */}
        <div className="bg-[#fff1f2] border border-rose-200/90 rounded-2xl p-3 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-[#dc2626] text-white flex items-center justify-center shrink-0 shadow-xs">
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1 .4-1 1v9c0 .6.4 1 1 1h2" />
                <circle cx="7" cy="17" r="2" />
                <path d="M9 17h6" />
                <circle cx="17" cy="17" r="2" />
                <path d="M10 8v4" />
                <path d="M8 10h4" />
              </svg>
            </div>
            <div className="min-w-0">
              <h4 className="font-heading font-extrabold text-xs sm:text-sm text-[#7f1d1d] truncate">
                แจ้งเหตุฉุกเฉินวิกฤต (SOS 1669)
              </h4>
              <p className="text-[10.5px] text-[#991b1b]/80 truncate mt-0.5">
                หมดสติ แน่นหน้าอก ช็อก เรียกรถพยาบาลทันที
              </p>
            </div>
          </div>
          <a
            href="tel:1669"
            className="bg-[#dc2626] hover:bg-[#b91c1c] active:scale-95 text-white font-heading font-extrabold text-xs px-3.5 py-2 rounded-full shadow-xs shrink-0 transition"
          >
            โทร 1669
          </a>
        </div>

        {/* Recommended Hospital Quick Tip Banner */}
        {recommendedHospital && (
          <div
            onClick={() => onOpenHospitalDetail(recommendedHospital)}
            className="bg-gradient-to-r from-[#fef3e2] to-[#fce9c9] border border-amber-200/80 rounded-2xl p-3.5 flex items-center justify-between gap-2.5 cursor-pointer hover:shadow-xs transition"
          >
            <div className="text-[11px] text-[#7a4a10] font-semibold leading-relaxed">
              💡 แนะนำเข้ารับบริการ: <strong>{recommendedHospital.name}</strong> ({recommendedHospital.type})
              <span className="block text-[10px] text-amber-900/80 mt-0.5">
                ใกล้ที่สุด {recommendedHospital.distanceKm} กม. • เวลารอประมาณ {recommendedHospital.estWaitMinutes} นาที
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-[#7a4a10] shrink-0" />
          </div>
        )}

        {/* Dual Healthcare Rights & Insurance Partners Quick Entry Banners */}
        <div className="grid grid-cols-2 gap-2.5">
          <div
            onClick={onOpenHealthcareRights}
            className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/80 flex items-center gap-2.5 cursor-pointer hover:shadow-xs transition group"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition">
              <Building className="w-4.5 h-4.5" />
            </div>
            <div className="min-w-0">
              <span className="font-heading font-bold text-xs text-slate-900 block truncate group-hover:text-emerald-700">
                สิทธิรักษาพยาบาล
              </span>
              <span className="text-[10px] text-emerald-800 font-medium">บัตรทอง / ประกันสังคม</span>
            </div>
          </div>

          <div
            onClick={onOpenInsurancePartners}
            className="p-3.5 rounded-2xl bg-gradient-to-br from-sky-50 to-indigo-50 border border-sky-200/80 flex items-center gap-2.5 cursor-pointer hover:shadow-xs transition group"
          >
            <div className="w-9 h-9 rounded-xl bg-sky-700 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition">
              <Shield className="w-4.5 h-4.5" />
            </div>
            <div className="min-w-0">
              <span className="font-heading font-bold text-xs text-slate-900 block truncate group-hover:text-sky-700">
                บริษัทประกันคู่สัญญา
              </span>
              <span className="text-[10px] text-sky-800 font-medium">เช็ก Fax Claim 8+ ค่าย</span>
            </div>
          </div>
        </div>

        {/* Summary Row: สรุปการประเมินล่าสุด + สรุปอาการส่งแพทย์ */}
        <div className="grid grid-cols-2 gap-2.5">
          <div
            onClick={() => onNavigate('history')}
            className="bg-white p-3.5 rounded-2xl border border-slate-100 card-shadow hover:border-emerald-300 transition cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold text-slate-700 font-heading flex items-center gap-1">
                  <Clock className="w-3 h-3 text-emerald-600" /> สรุปประเมินล่าสุด
                </span>
                <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded">
                  ปานกลาง
                </span>
              </div>
              <p className="font-bold text-slate-900 text-xs font-heading">
                {primaryActiveQueue?.symptomsSummary || 'มีไข้ตัวร้อน, ไอ / เจ็บคอ'}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">อาการ 1-2 วัน</p>
            </div>
            <span className="text-[10px] text-emerald-700 font-bold mt-2 hover:underline flex items-center gap-0.5">
              ดูทั้งหมด <ChevronRight className="w-3 h-3" />
            </span>
          </div>

          <div
            onClick={onOpenDoctorSummary}
            className="bg-white p-3.5 rounded-2xl border border-slate-100 card-shadow hover:border-emerald-300 transition cursor-pointer flex flex-col items-center justify-center text-center group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-1 group-hover:scale-105 transition">
              <FileText className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="font-heading font-bold text-xs text-slate-800">สรุปอาการส่งแพทย์</span>
            <span className="text-[10px] text-slate-400 mt-0.5">เวชระเบียน & ประเมิน AI ›</span>
          </div>
        </div>

        {/* Active Queue Status Card */}
        <div>
          <div className="flex justify-between items-center mb-2 px-1">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5 font-heading">
              <Activity className="w-4 h-4 text-emerald-600" /> คิวและนัดหมายปัจจุบันของฉัน
            </h3>
            <button
              onClick={() => onNavigate('history')}
              className="text-xs text-emerald-700 font-semibold hover:underline font-heading flex items-center gap-0.5 cursor-pointer"
            >
              ดูทั้งหมด ({activeQueues.length})
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {primaryActiveQueue ? (
            <div className="bg-white p-4 rounded-[24px] border border-slate-100 card-shadow text-xs space-y-3 relative overflow-hidden">
              {primaryActiveQueue.status === 'called' && (
                <div className="bg-rose-500 text-white text-[11px] font-bold py-1 px-3 -mx-4 -mt-4 mb-2 text-center animate-pulse">
                  🔔 ถึงคิวตรวจของคุณแล้ว กรุณาเข้าห้องตรวจทันที!
                </div>
              )}

              <div className="flex justify-between items-start">
                <div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full border text-[10px] font-semibold font-heading inline-block ${
                      primaryActiveQueue.triageLevel === 'red'
                        ? 'bg-rose-100 text-rose-800 border-rose-300'
                        : primaryActiveQueue.triageLevel === 'orange'
                        ? 'bg-orange-100 text-orange-800 border-orange-300'
                        : primaryActiveQueue.triageLevel === 'yellow'
                        ? 'bg-amber-100 text-amber-800 border-amber-300'
                        : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    }`}
                  >
                    {primaryActiveQueue.triageTitle}
                  </span>
                  <h4 className="font-bold text-slate-900 text-sm sm:text-base mt-1.5 font-heading">
                    {primaryActiveQueue.hospitalName}
                  </h4>
                  <p className="text-slate-500 text-[11px]">{primaryActiveQueue.department}</p>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block font-medium">หมายเลขคิวของคุณ</span>
                  <p className="font-mono font-extrabold text-2xl text-emerald-700 leading-none mt-1">
                    {primaryActiveQueue.queueNum}
                  </p>
                </div>
              </div>

              {/* Metrics */}
              <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100 grid grid-cols-2 gap-2 text-center">
                <div>
                  <span className="text-slate-400 text-[11px] block">คิวก่อนหน้า</span>
                  <p className="font-bold text-slate-800 text-sm mt-0.5">
                    {primaryActiveQueue.ahead} คิว
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">เวลารอโดยประมาณ</span>
                  <p className="font-bold text-emerald-700 text-sm mt-0.5">
                    {primaryActiveQueue.estWait}
                  </p>
                </div>
              </div>

              {/* Card Actions */}
              <div className="flex justify-between items-center pt-1 text-xs">
                <button
                  onClick={() => onOpenQrModal(primaryActiveQueue)}
                  className="text-emerald-700 font-bold hover:underline flex items-center gap-1.5 cursor-pointer"
                >
                  <QrCode className="w-3.5 h-3.5" /> แสดง QR สแกนคิว
                </button>
                <button
                  onClick={() => onCancelQueue(primaryActiveQueue.id)}
                  className="text-slate-400 hover:text-rose-600 transition text-[11px] cursor-pointer"
                >
                  ยกเลิกคิว
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white p-4.5 rounded-[24px] border border-slate-100 card-shadow text-center">
              <p className="text-xs text-slate-600 font-medium">ขณะนี้คุณยังไม่มีคิวที่รอดำเนินการ</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                กด &quot;เริ่มประเมินอาการ&quot; เพื่อรับคิวตรวจและจัดลำดับความเร่งด่วนทันที
              </p>
            </div>
          )}
        </div>

        {/* Hospital Traffic Realtime Section with Area Filter */}
        <div>
          <div className="flex justify-between items-center mb-2 px-1">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5 font-heading">
              <Compass className="w-4 h-4 text-emerald-600" /> Hospital Traffic & คิวรอคอยตามพื้นที่
            </h3>
            <span className="text-[10px] bg-emerald-100 text-emerald-700 font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 font-heading">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Live Traffic
            </span>
          </div>

          {/* Area District Selector & Open Map Button */}
          <div className="bg-slate-100/90 p-2.5 rounded-2xl mb-3 flex items-center justify-between text-xs font-heading gap-2 flex-wrap sm:flex-nowrap">
            <div className="flex items-center gap-1.5 text-slate-700 pl-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-[11px] font-medium">เลือกจับพื้นที่:</span>
            </div>

            <div className="flex items-center gap-1.5 ml-auto">
              <select
                value={currentDistrict}
                onChange={(e) => onDistrictChange(e.target.value)}
                className="bg-white border border-slate-200 text-slate-800 text-[11px] rounded-xl px-2.5 py-1.5 font-bold shadow-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none cursor-pointer"
              >
                {BANGKOK_DISTRICTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>

              <button
                onClick={onOpenMap}
                className="bg-[#1c4c39] hover:bg-[#163d2d] text-white text-[10px] font-bold px-2.5 py-1.5 rounded-xl shadow-xs flex items-center gap-1 cursor-pointer transition shrink-0"
                title="ดูแผนที่ตำแหน่งสถานพยาบาลใกล้ฉัน"
              >
                <Compass className="w-3 h-3 text-emerald-300" />
                <span>ดูบนแผนที่</span>
              </button>
            </div>
          </div>

          {/* Hospital Cards List */}
          <div className="space-y-2.5">
            {hospitals.map((hospital) => (
              <div
                key={hospital.id}
                onClick={() => onOpenHospitalDetail(hospital)}
                className="bg-white p-3.5 rounded-2xl border border-slate-100 card-shadow hover:border-emerald-300 transition cursor-pointer group"
              >
                <div className="flex justify-between items-start mb-1.5">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="font-bold text-slate-900 text-xs font-heading group-hover:text-emerald-700 transition">
                        {hospital.name}
                      </h4>
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-md border ${
                          (hospital.facilityType || hospital.type).includes('เอกชน')
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : (hospital.facilityType || hospital.type).includes('สาธารณสุข') || (hospital.facilityType || hospital.type).includes('ศบส')
                            ? 'bg-teal-50 text-teal-700 border-teal-200'
                            : (hospital.facilityType || hospital.type).includes('คลินิก')
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}
                      >
                        [{hospital.facilityType || hospital.type}]
                      </span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                          hospital.congestionPct < 40
                            ? 'bg-emerald-500 text-white'
                            : hospital.congestionPct < 70
                            ? 'bg-amber-500 text-white'
                            : 'bg-rose-500 text-white'
                        }`}
                      >
                        {hospital.badge || 'เปิดตรวจ'}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-emerald-600" />
                      <span>{hospital.district}</span>
                    </p>
                  </div>

                  <span className="font-mono text-emerald-700 font-bold text-xs bg-emerald-50 px-2 py-1 rounded-lg">
                    {hospital.congestionPct}%
                  </span>
                </div>

                {/* Real-time Queue Status Badges */}
                <div className="bg-slate-50 p-2 rounded-xl flex justify-between items-center text-[10px] my-2 text-slate-600 border border-slate-100/80">
                  <span className="flex items-center gap-1">
                    <Compass className="w-3 h-3 text-emerald-600" /> ห่าง {hospital.distanceKm} กม.
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3 text-emerald-600" /> รอ {hospital.totalWaitingCount} คิว
                  </span>
                  <span className="font-bold text-emerald-700 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-emerald-600" /> รอ ~{hospital.estWaitMinutes} นาที
                  </span>
                </div>

                {/* Congestion Bar */}
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      hospital.congestionPct > 70
                        ? 'bg-rose-500'
                        : hospital.congestionPct > 40
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${hospital.congestionPct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Services Navigation */}
        <div>
          <h3 className="font-bold text-sm text-slate-800 mb-2.5 px-1 font-heading">
            บริการทางการแพทย์
          </h3>
          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            <div
              onClick={onStartTriage}
              className="p-3 bg-white rounded-2xl border border-slate-100 card-shadow flex flex-col items-center justify-center cursor-pointer hover:bg-emerald-50/50 transition group"
            >
              <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-1.5 group-hover:scale-105 transition">
                <Stethoscope className="w-5 h-5" />
              </div>
              <span className="font-semibold text-slate-700 text-[11px] font-heading">ประเมิน AI</span>
            </div>

            <div
              onClick={() => onNavigate('history')}
              className="p-3 bg-white rounded-2xl border border-slate-100 card-shadow flex flex-col items-center justify-center cursor-pointer hover:bg-teal-50/50 transition group"
            >
              <div className="w-11 h-11 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center mb-1.5 group-hover:scale-105 transition">
                <CalendarDays className="w-5 h-5" />
              </div>
              <span className="font-semibold text-slate-700 text-[11px] font-heading">นัดหมาย & ยา</span>
            </div>

            <div
              onClick={() => onNavigate('messages')}
              className="p-3 bg-white rounded-2xl border border-slate-100 card-shadow flex flex-col items-center justify-center cursor-pointer hover:bg-cyan-50/50 transition group"
            >
              <div className="w-11 h-11 rounded-2xl bg-cyan-100 text-cyan-700 flex items-center justify-center mb-1.5 group-hover:scale-105 transition">
                <MessageSquare className="w-5 h-5" />
              </div>
              <span className="font-semibold text-slate-700 text-[11px] font-heading">แชท รพ./ยา</span>
            </div>

            <div
              onClick={() => onNavigate('account')}
              className="p-3 bg-white rounded-2xl border border-slate-100 card-shadow flex flex-col items-center justify-center cursor-pointer hover:bg-amber-50/50 transition group"
            >
              <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mb-1.5 group-hover:scale-105 transition">
                <Activity className="w-5 h-5" />
              </div>
              <span className="font-semibold text-slate-700 text-[11px] font-heading">โปรไฟล์</span>
            </div>
          </div>
        </div>

        {/* Emergency Hotline 1669 Call Card */}
        <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-2xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0">
              <PhoneCall className="w-4 h-4 animate-bounce" />
            </div>
            <div>
              <h5 className="font-heading font-bold text-rose-900 text-xs">กรณีเหตุฉุกเฉินวิกฤต</h5>
              <p className="text-[11px] text-rose-700">โทรเรียกรถพยาบาลกู้ชีพ 1669 ทันที ฟรี 24 ชม.</p>
            </div>
          </div>
          <a
            href="tel:1669"
            className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-3 py-1.5 rounded-xl text-[11px] shrink-0 shadow-xs"
          >
            โทร 1669
          </a>
        </div>
      </div>
    </div>
  );
};
