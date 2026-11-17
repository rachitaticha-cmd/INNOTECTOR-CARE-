import React, { useState, useEffect, useCallback } from 'react';
import { useMapsLibrary } from '@vis.gl/react-google-maps';
import {
  QrCode,
  ArrowRight,
  MapPin,
  Clock,
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
  RefreshCw,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import { Hospital, QueueTicket, TriageAssessment, UserProfile } from '../types';
import { ScreenTab } from '../components/BottomNavBar';
import { playChime } from '../services/storage';
import { InotectorLogo } from '../components/InotectorLogo';
import {
  detectUserThailandGPS,
  facilityToHospitalBridge,
  fetchRealHealthcareFacilities,
  LivePlaceFacility,
} from '../services/realPlaces';

interface HomeViewProps {
  user: UserProfile;
  activeQueues: QueueTicket[];
  latestTriage: TriageAssessment | null;
  onNavigate: (tab: ScreenTab) => void;
  onStartTriage: () => void;
  onOpenMap: (focusFacility?: LivePlaceFacility) => void;
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
  activeQueues,
  latestTriage,
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
  unreadNotificationsCount = 0,
}) => {
  const placesLib = useMapsLibrary('places');
  const primaryActiveQueue = activeQueues.find((q) => q.status === 'waiting' || q.status === 'called');

  const [nearbyFacilities, setNearbyFacilities] = useState<LivePlaceFacility[]>([]);
  const [isLoadingNearby, setIsLoadingNearby] = useState<boolean>(false);
  const [gpsStatusText, setGpsStatusText] = useState<string>('กำลังเตรียมระบบค้นหาพิกัด GPS...');

  const loadLiveNearbyFacilities = useCallback(
    async (withChime = false) => {
      if (!placesLib) return;
      setIsLoadingNearby(true);
      try {
        const gps = await detectUserThailandGPS();
        setGpsStatusText(gps.statusText);
        const list = await fetchRealHealthcareFacilities({
          placesLib,
          coords: gps.coords,
          user,
          radiusMeters: 6000,
          prioritizeOpenAndRight: true,
        });
        setNearbyFacilities(list);
        if (withChime) {
          playChime('success');
        }
      } catch {
        setGpsStatusText('ไม่สามารถดึงข้อมูลสถานพยาบาลใกล้เคียงได้ในขณะนี้');
      } finally {
        setIsLoadingNearby(false);
      }
    },
    [placesLib, user]
  );

  useEffect(() => {
    void loadLiveNearbyFacilities(false);
  }, [loadLiveNearbyFacilities]);

  const topRecommended = nearbyFacilities[0] || null;
  const displayFacilities = nearbyFacilities.slice(0, 6);

  const urgencyBadgeLabel =
    latestTriage?.level === 'red'
      ? 'ฉุกเฉิน'
      : latestTriage?.level === 'orange'
      ? 'สูง'
      : latestTriage?.level === 'yellow'
      ? 'ปานกลาง'
      : 'ต่ำ';

  const urgencyBadgeStyle =
    latestTriage?.level === 'red'
      ? 'bg-rose-100 text-rose-800'
      : latestTriage?.level === 'orange'
      ? 'bg-orange-100 text-orange-800'
      : latestTriage?.level === 'yellow'
      ? 'bg-amber-100 text-amber-800'
      : 'bg-emerald-100 text-emerald-800';

  return (
    <div className="select-none min-h-full pb-36 bg-[#f8fafc]">
      {/* Top Seamless Dark Green Header */}
      <div className="bg-[#163d2d] text-white pt-4 pb-6 px-4 rounded-b-[32px] shadow-md relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between mb-4 relative z-10">
          <InotectorLogo size="md" textColor="white" />

          <div className="flex items-center gap-2">
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

            <button
              onClick={() => onOpenQrModal()}
              title="เปิด QR Code ประจำตัวผู้ป่วย"
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center transition cursor-pointer border border-white/10 shadow-xs"
            >
              <QrCode className="w-4 h-4 text-emerald-100" />
            </button>
          </div>
        </div>

        <div className="space-y-1.5 relative z-10 mb-4">
          <h2 className="text-xl font-extrabold font-heading text-white">
            สวัสดี {user.name}
          </h2>
          <p className="text-xs text-[#bcd9c9] leading-relaxed font-light">
            ประเมินอาการเบื้องต้น วิเคราะห์ความเสี่ยง พร้อมค้นหาสถานพยาบาลที่เปิดอยู่และตรงสิทธิของคุณ
          </p>
        </div>

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
        {/* Live Recommended Hospital Quick Tip Banner */}
        {topRecommended && (
          <div
            onClick={() => onOpenHospitalDetail(facilityToHospitalBridge(topRecommended))}
            className="bg-gradient-to-r from-[#fef3e2] to-[#fce9c9] border border-amber-200/80 rounded-2xl p-3.5 flex items-center justify-between gap-2.5 cursor-pointer hover:shadow-xs transition"
          >
            <div className="text-[11px] text-[#7a4a10] font-semibold leading-relaxed min-w-0">
              <div className="truncate">
                💡 แนะนำใกล้คุณ: <strong>{topRecommended.name}</strong>
              </div>
              <span className="block text-[10px] text-amber-900/85 mt-0.5 truncate">
                {topRecommended.openStatusLabel} • ห่าง {topRecommended.distanceKm} กม. • {topRecommended.rightMatchReason}
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
              <span className="text-[10px] text-emerald-800 font-medium block truncate">
                {user.medicalRight?.includes('ประกันสังคม')
                  ? 'ประกันสังคม'
                  : user.medicalRight?.includes('ข้าราชการ')
                  ? 'ข้าราชการ/รัฐวิสาหกิจ'
                  : 'บัตรทอง 30 บาท'}
              </span>
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
              <span className="text-[10px] text-sky-800 font-medium block truncate">
                {user.insuranceCompany && user.insuranceCompany !== 'ไม่มี'
                  ? user.insuranceCompany
                  : 'เช็ก Fax Claim'}
              </span>
            </div>
          </div>
        </div>

        {/* Summary Row: Real Latest Triage + Doctor Summary */}
        <div className="grid grid-cols-2 gap-2.5">
          <div
            onClick={() => (latestTriage ? onNavigate('history') : onStartTriage())}
            className="bg-white p-3.5 rounded-2xl border border-slate-100 card-shadow hover:border-emerald-300 transition cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold text-slate-700 font-heading flex items-center gap-1">
                  <Clock className="w-3 h-3 text-emerald-600" /> สรุปประเมินล่าสุด
                </span>
                {latestTriage && (
                  <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${urgencyBadgeStyle}`}>
                    {urgencyBadgeLabel}
                  </span>
                )}
              </div>
              {latestTriage ? (
                <>
                  <p className="font-bold text-slate-900 text-xs font-heading line-clamp-2">
                    {latestTriage.symptoms.join(', ')}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                    ระยะเวลา {latestTriage.duration}
                  </p>
                </>
              ) : (
                <>
                  <p className="font-bold text-slate-700 text-xs font-heading">
                    ยังไม่มีประวัติการประเมิน
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    กดเพื่อเริ่มประเมินอาการ
                  </p>
                </>
              )}
            </div>
            <span className="text-[10px] text-emerald-700 font-bold mt-2 hover:underline flex items-center gap-0.5">
              {latestTriage ? 'ดูประวัติทั้งหมด' : 'เริ่มประเมินเลย'} <ChevronRight className="w-3 h-3" />
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
            <span className="text-[10px] text-slate-400 mt-0.5">เวชระเบียน &amp; QR ผู้ป่วย ›</span>
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
                กด &quot;เริ่มประเมินอาการ&quot; เพื่อรับคำแนะนำและจองคิวตรวจทันที
              </p>
            </div>
          )}
        </div>

        {/* Real GPS + Open Hours + Healthcare Right Nearby Facilities */}
        <div>
          <div className="flex justify-between items-center mb-2 px-1">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5 font-heading">
              <Compass className="w-4 h-4 text-emerald-600" /> สถานพยาบาลจริงใกล้ตำแหน่งของคุณ
            </h3>
            <button
              onClick={() => void loadLiveNearbyFacilities(true)}
              disabled={isLoadingNearby}
              className="text-[11px] bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 font-heading transition cursor-pointer disabled:opacity-60"
            >
              <RefreshCw className={`w-3 h-3 ${isLoadingNearby ? 'animate-spin' : ''}`} />
              <span>อัปเดต GPS</span>
            </button>
          </div>

          {/* Live Google Maps Real Navigation Launcher */}
          <button
            onClick={() => onOpenMap(topRecommended || undefined)}
            className="w-full mb-3 bg-gradient-to-r from-[#163d2d] to-[#1f553f] hover:brightness-105 active:scale-[0.99] text-white p-3.5 rounded-2xl shadow-sm flex items-center justify-between gap-3 transition cursor-pointer text-left"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-emerald-400/20 border border-emerald-300/30 flex items-center justify-center shrink-0">
                <Navigation className="w-5 h-5 text-emerald-300" />
              </div>
              <div className="min-w-0">
                <h4 className="font-heading font-bold text-xs sm:text-sm text-white leading-tight">
                  เปิดแผนที่สถานพยาบาลจริง &amp; นำทางในแอป
                </h4>
                <p className="text-[10.5px] text-emerald-100/90 mt-0.5 truncate">
                  {gpsStatusText}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-emerald-200 shrink-0" />
          </button>

          {isLoadingNearby && displayFacilities.length === 0 ? (
            <div className="bg-white p-6 rounded-2xl border border-slate-100 card-shadow flex items-center justify-center gap-2 text-xs text-slate-600">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />
              <span>กำลังค้นหาสถานพยาบาลที่เปิดอยู่ใกล้พิกัดของคุณ...</span>
            </div>
          ) : displayFacilities.length === 0 ? (
            <div className="bg-white p-5 rounded-2xl border border-slate-100 card-shadow text-center space-y-2">
              <p className="text-xs font-bold text-slate-700 font-heading">
                ยังไม่มีรายชื่อสถานพยาบาลในระยะใกล้เคียง
              </p>
              <button
                onClick={() => onOpenMap()}
                className="text-xs bg-emerald-700 text-white font-bold px-3.5 py-2 rounded-xl cursor-pointer"
              >
                ค้นหาบนแผนที่เต็มจอ
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {displayFacilities.map((facility) => {
                const isOpen = facility.isOpenNow === true || facility.is24Hours;
                const isClosed = facility.isOpenNow === false && !facility.is24Hours;

                return (
                  <div
                    key={facility.id}
                    onClick={() => onOpenHospitalDetail(facilityToHospitalBridge(facility))}
                    className="bg-white p-3.5 rounded-2xl border border-slate-100 card-shadow hover:border-emerald-300 transition cursor-pointer group"
                  >
                    <div className="flex justify-between items-start gap-2 mb-1.5">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-bold text-slate-900 text-xs font-heading group-hover:text-emerald-700 transition">
                            {facility.name}
                          </h4>
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-md border bg-slate-50 text-slate-700 border-slate-200">
                            {facility.categoryLabel}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span className="truncate">{facility.areaSummary || facility.shortAddress}</span>
                        </p>
                      </div>

                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-md shrink-0 ${
                          isOpen
                            ? 'bg-emerald-600 text-white'
                            : isClosed
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {facility.is24Hours
                          ? '24 ชม.'
                          : isOpen
                          ? 'เปิดอยู่'
                          : isClosed
                          ? 'นอกเวลา'
                          : 'เปิดทำการ'}
                      </span>
                    </div>

                    <div className="bg-slate-50 p-2 rounded-xl flex justify-between items-center text-[10px] my-1.5 text-slate-600 border border-slate-100/80 gap-2">
                      <span className="flex items-center gap-1 shrink-0 font-bold text-slate-800">
                        <Compass className="w-3 h-3 text-emerald-600" /> {facility.distanceKm} กม.
                      </span>
                      <span className="truncate text-slate-500">
                        {facility.openHoursText || facility.openStatusLabel}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-800">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                      <span className="truncate">{facility.rightMatchReason}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
              <span className="font-semibold text-slate-700 text-[11px] font-heading">ประวัติ &amp; คิว</span>
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
