import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  X,
  Stethoscope,
  CheckCheck,
  Sparkles,
  Phone,
  ChevronLeft,
  Building,
  MapPin,
  Pill,
  ShieldAlert,
  Search,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { ChatMessage, FacilityChat, UserProfile } from '../types';
import { FACILITY_CHATS } from '../data/mockData';
import {
  getFacilityChatMessages,
  saveFacilityChatMessage,
  playChime,
} from '../services/storage';

interface ChatViewProps {
  user: UserProfile;
  initialSummary?: string;
  onClose: () => void;
}

// Intelligent contextual answer generator per facility type & regional hospital
function generateFacilityReply(query: string, facility: FacilityChat, user: UserProfile): string {
  const q = query.trim().toLowerCase();
  const userName = user.name || 'ผู้ใช้งาน';

  // 1. Emergency 1669
  if (facility.type === 'emergency') {
    return `🚨 [ศูนย์สั่งการกู้ชีพฉุกเฉิน 1669]\nได้รับข้อมูลแจ้งเหตุจากคุณ${userName} เรียบร้อยแล้วครับ!\n\n1. หากมีอาการวิกฤต (หมดสติ ไม่หายใจ แน่นหน้าอกเฉียบพลัน หรือชักเกร็ง) กรุณากดปุ่มโทร 1669 ด้านบน เพื่อโทรออกสายด่วนทันทีฟรี 24 ชม.\n2. เจ้าหน้าที่สั่งการกู้ชีพกำลังเตรียมพร้อมวิทยุประสานรถพยาบาลฉุกเฉินระดับสูง (ALS) ในพื้นที่ใกล้เคียง\n3. ขอให้ผู้ป่วยอยู่ในท่าพัก ห้ามขยับตัวแรง และเปิดประตูบ้าน/ทางเข้าเพื่ออำนวยความสะดวกให้ทีมกู้ชีพครับ`;
  }

  // 2. Pharmacy
  if (facility.type === 'pharmacy') {
    if (q.includes('16') || q.includes('สิทธิ') || q.includes('บัตรทอง') || q.includes('ฟรี')) {
      return `สวัสดีครับคุณ${userName} ทางร้านยาคุณภาพ ฟาสต์แคร์ เข้าร่วมโครงการ สปสช. "บัตรทอง 30 บาท รับยาฟรี 16 กลุ่มอาการ" ครับ!\n\nเพียงยื่นบัตรประชาชนตัวจริงที่ร้านยา เภสัชกรจะซักประวัติและจ่ายยาให้ฟรี 0 บาท เช่น ยาลดไข้ ยาแก้ไอ เจ็บคอ ท้องเสีย ปวดเมื่อย หรือผื่นคันครับ`;
    }
    if (q.includes('แพ้') || q.includes('เพนิซิลลิน') || q.includes('penicillin')) {
      return `เภสัชกรตรวจสอบประวัติของคุณ${userName} ในระบบ: "มีประวัติแพ้ยาเพนิซิลลิน"\n\nคำแนะนำความปลอดภัย:\n- หลีกเลี่ยงยากลุ่ม Penicillin, Amoxicillin, Augmentin\n- สามารถทานยาลดไข้ พาราเซตามอล (Paracetamol) ได้ปลอดภัย\n- หากมีอาการคออักเสบจากเชื้อแบคทีเรีย เภสัชกรจะเลือกใช้ยาปฏิชีวนะกลุ่ม Macrolides (เช่น Azithromycin หรือ Roxithromycin) แทนครับ`;
    }
    return `สวัสดีครับคุณ${userName} เภสัชกรประจำร้านยาได้รับคำถามเรื่อง "${query}" แล้วครับ เบื้องต้นแนะนำทานยาหลังอาหารทันที ดื่มน้ำอุ่นมากๆ พักผ่อนให้เพียงพอ หากมีประวัติแพ้ยาหรือโรคประจำตัว เภสัชกรจะจัดยาที่ปลอดภัยและตรงจุดให้ครับ สามารถแวะมารับคำปรึกษาที่ร้านยาได้ทุกวัน 08:00 - 21:00 น. ครับ`;
  }

  // 3. Primary Health Center (ศบส.)
  if (facility.type === 'clinic') {
    if (q.includes('วัคซีน') || q.includes('ไข้หวัดใหญ่')) {
      return `สวัสดีค่ะคุณ${userName} ศบส. 40 บางแค ให้บริการฉีดวัคซีนไข้หวัดใหญ่ 4 สายพันธุ์ฟรี สำหรับผู้มีสิทธิบัตรทองและกลุ่มเสี่ยง 7 กลุ่มโรคเรื้อรัง ทุกวันจันทร์-ศุกร์ เวลา 08:30 - 15:00 น. ค่ะ นำบัตรประชาชนมาติดต่อที่ห้องบัตรได้เลยนะคะ`;
    }
    if (q.includes('ความดัน') || q.includes('เบาหวาน') || q.includes('ncd')) {
      return `คุณ${userName} สามารถเข้าตรวจคัดกรองความดันโลหิตและเจาะน้ำตาลปลายนิ้วได้ฟรีที่คลินิกโรคเรื้อรัง ศบส. ค่ะ แนะนำงดน้ำและอาหารหลัง 20:00 น. ก่อนวันมารับบริการค่ะ`;
    }
    return `สวัสดีค่ะ จาก ศบส. 40 บางแค ได้รับข้อความเกี่ยวกับ "${query}" เรียบร้อยค่ะ ศูนย์บริการเปิดทำการ จันทร์-ศุกร์ 08:00 - 16:00 น. มีบริการตรวจรักษาโรคทั่วไป ทันตกรรม และส่งต่อ รพ.ราชพิพัฒน์ ค่ะ`;
  }

  // 4. Regional Super-Centers & Nationwide Hospitals
  if (facility.id === 'facility-suandok') {
    return `สวัสดีครับคุณ${userName} ทีมแพทย์ รพ.มหาราชนครเชียงใหม่ (สวนดอก) ได้รับข้อความเรื่อง "${query}" เรียบร้อยครับ\n\nทางโรงพยาบาลรองรับระบบ นโยบาย 30 บาทรักษาทุกที่ และ Telemedicine เชื่อมโยง 8 จังหวัดภาคเหนือ สามารถเข้าพบแพทย์ตามนัดหมาย หรือหากมีอาการเปลี่ยนแปลงสามารถติดต่อหน่วยตรวจเวชศาสตร์ครอบครัวได้ตลอดเวลาทำการครับ`;
  }

  if (facility.id === 'facility-srinagarind') {
    return `สวัสดีค่ะคุณ${userName} ศูนย์บริการข้อมูลผู้ป่วย รพ.ศรีนครินทร์ คณะแพทยศาสตร์ ม.ขอนแก่น ได้รับข้อความ "${query}" แล้วค่ะ\n\nผู้ป่วยสิทธิบัตรทองในภาคอีสานสามารถใช้สิทธิเข้ารับการตรวจรักษาได้ตามนโยบาย สปสช. หากเป็นการตรวจเฉพาะทางแนะนำให้แพทย์ต้นสังกัดส่งข้อมูล E-Referral เข้ามาล่วงหน้านะคะ`;
  }

  if (facility.id === 'facility-korat') {
    return `สวัสดีครับคุณ${userName} จากศูนย์บริการผู้ป่วย รพ.มหาราชนครราชสีมา ได้รับข้อมูล "${query}" เรียบร้อยครับ\n\nโรงพยาบาลศูนย์มหาราชเปิดให้บริการห้องตรวจผู้ป่วยนอก จันทร์-ศุกร์ 08:00 - 16:00 น. และศูนย์อุบัติเหตุฉุกเฉินเปิด 24 ชั่วโมง หากมีอาการฉุกเฉินเร่งด่วนสามารถประสานงานรถพยาบาล 1669 ได้ทันทีครับ`;
  }

  if (facility.id === 'facility-psu') {
    return `สวัสดีค่ะคุณ${userName} โรงพยาบาลสงขลานครินทร์ (มอ.หาดใหญ่) ได้รับคำถามเกี่ยวกับ "${query}" แล้วค่ะ\n\nศูนย์การแพทย์ภาคใต้ของเราพร้อมให้บริการทั้งคลินิกในเวลาและคลินิกพิเศษนอกเวลาราชการ (SMC) แนะนำนำบัตรประชาชนและข้อมูลประวัติในแอป Inotector Care มายื่นที่เคาน์เตอร์เวชระเบียนได้เลยค่ะ`;
  }

  if (facility.id === 'facility-chonburi') {
    return `สวัสดีครับคุณ${userName} รพ.ชลบุรี ได้รับข้อความเรื่อง "${query}" ครับ\n\nเราพร้อมดูแลผู้รับบริการทั้งสิทธิประกันสังคม บัตรทอง 30 บาท และสวัสดิการข้าราชการในเขตพัฒนาพิเศษภาคตะวันออก (EEC) แนะนำปฏิบัติตามคำแนะนำของแพทย์และพักผ่อนให้เพียงพอครับ`;
  }

  if (facility.id === 'facility-siriraj' || q.includes('ใบส่งตัว') || q.includes('ส่งต่อ')) {
    return `เรียนคุณ${userName} ทางระบบ รพ.ศิริราช ได้รับข้อมูลการขอส่งต่อการรักษาแล้วค่ะ หากมีสิทธิบัตรทอง ณ โรงพยาบาลต้นสังกัด (รพ.ราชพิพัฒน์) สามารถให้แพทย์ออกใบส่งตัวระบบออนไลน์ (E-Referral) มายัง รพ.ศิริราช ได้ทันทีโดยไม่ต้องถือเอกสารกระดาษค่ะ`;
  }

  if (q.includes('เตรียม') || q.includes('เอกสาร') || q.includes('บัตรทอง')) {
    return `สำหรับการเข้ารับการตรวจของคุณ${userName} ที่ ${facility.facilityName} ค่ะ:\n\n1. นำบัตรประจำตัวประชาชนตัวจริง (Smart Card)\n2. แสดงหน้าบัตรคิวหรือ QR Code ในแอป Inotector Care ณ จุดคัดกรอง\n3. สิทธิการรักษาของคุณครอบคลุมการตรวจและยาตามเกณฑ์ สปสช. (0 บาท) ค่ะ`;
  }

  // Default Medical Response
  return `สวัสดีค่ะคุณ${userName} ทางทีมแพทย์ ${facility.facilityName} (${facility.province || 'ประเทศไทย'}) ได้รับข้อความเรียบร้อยค่ะ สำหรับ "${query}" ขอแนะนำให้พักผ่อนมากๆ ดื่มน้ำอุ่น และสามารถเดินทางมารับการตรวจตามคิวในแอปได้เลยค่ะ หากมีอาการเปลี่ยนแปลงเฉียบพลัน สามารถติดต่อสอบถามเพิ่มเติมได้ตลอดเวลานะคะ`;
}

export const ChatView: React.FC<ChatViewProps> = ({ user, initialSummary, onClose }) => {
  // Navigation: Inbox List vs Active Chat Room
  const [activeFacility, setActiveFacility] = useState<FacilityChat | null>(null);
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<'all' | 'hospital' | 'clinic' | 'pharmacy' | 'emergency'>('all');
  const [selectedRegionFilter, setSelectedRegionFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Active chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // If forwarded triage summary, automatically open default hospital (Ratchapiphat)
  useEffect(() => {
    if (initialSummary && !activeFacility) {
      const defaultFacility = FACILITY_CHATS[0]; // Ratchapiphat
      setActiveFacility(defaultFacility);
    }
  }, [initialSummary, activeFacility]);

  // Load facility messages when active facility changes
  useEffect(() => {
    if (activeFacility) {
      const list = getFacilityChatMessages(activeFacility.id, user.id);
      setMessages(list);

      // Listen for updates
      const onChatUpdate = (e: Event) => {
        const custom = e as CustomEvent<ChatMessage[]>;
        if (custom.detail) setMessages(custom.detail);
      };

      window.addEventListener(`innotector_chat_updated_${activeFacility.id}`, onChatUpdate);
      return () => {
        window.removeEventListener(`innotector_chat_updated_${activeFacility.id}`, onChatUpdate);
      };
    }
  }, [activeFacility, user.id]);

  // Forward initial summary into the active chat if present
  useEffect(() => {
    if (initialSummary && activeFacility) {
      const alreadySent = messages.some((m) => m.text.includes(initialSummary.slice(0, 30)));
      if (!alreadySent) {
        saveFacilityChatMessage(
          activeFacility.id,
          {
            sender: 'user',
            text: `[ส่งสรุปผลการประเมินอาการ AI Triage ให้แพทย์ตรวจ]\n${initialSummary}`,
            isSummary: true,
          },
          user.id
        );

        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
          saveFacilityChatMessage(
            activeFacility.id,
            {
              sender: 'doctor',
              doctorName: activeFacility.name,
              doctorSpecialty: activeFacility.role,
              text: `สวัสดีค่ะคุณ${user.name} แพทย์ได้รับผลสรุป AI Triage เรียบร้อยแล้วค่ะ แนะนำให้พักผ่อนมากๆ ดื่มน้ำอุ่น และสามารถเดินทางมารับการตรวจตามคิวที่จองไว้ได้เลยนะคะ`,
            },
            user.id
          );
          playChime('success');
        }, 1000);
      }
    }
  }, [initialSummary, activeFacility, user.name, user.id, messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = (textToSend?: string) => {
    if (!activeFacility) return;
    const text = (textToSend || inputText).trim();
    if (!text) return;

    saveFacilityChatMessage(
      activeFacility.id,
      {
        sender: 'user',
        text,
      },
      user.id
    );
    setInputText('');

    // Trigger realistic facility auto-response
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const replyText = generateFacilityReply(text, activeFacility, user);

      saveFacilityChatMessage(
        activeFacility.id,
        {
          sender: 'doctor',
          doctorName: activeFacility.name,
          doctorSpecialty: activeFacility.role,
          text: replyText,
        },
        user.id
      );
      playChime('success');
    }, 900);
  };

  const handleSendGps = () => {
    if (!activeFacility || !('geolocation' in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(4);
        const lng = pos.coords.longitude.toFixed(4);
        const acc = Math.round(pos.coords.accuracy || 0);
        const text = `📍 [ส่งตำแหน่งพิกัด GPS สดของฉัน]\nพิกัด: ${lat}, ${lng}\nความแม่นยำ: ~${acc} เมตร`;
        handleSend(text);
      },
      () => {
        const text = '📍 ไม่สามารถดึงพิกัด GPS จากอุปกรณ์ได้ในขณะนี้ กรุณาตรวจสอบสิทธิ์การเข้าถึงตำแหน่ง';
        handleSend(text);
      },
      { enableHighAccuracy: true, timeout: 7000 }
    );
  };

  const filteredFacilities = FACILITY_CHATS.filter((f) => {
    const matchesType = selectedTypeFilter === 'all' || f.type === selectedTypeFilter;
    const matchesRegion =
      selectedRegionFilter === 'all' ||
      f.region === selectedRegionFilter ||
      (selectedRegionFilter === 'กทม./ปริมณฑล' && f.province?.includes('กรุงเทพ')) ||
      (f.province && f.province.includes(selectedRegionFilter));
    const matchesSearch =
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.facilityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.badge.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.province && f.province.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (f.region && f.region.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesType && matchesRegion && matchesSearch;
  });

  const regionsList = [
    { id: 'all', label: 'ทั่วประเทศ' },
    { id: 'กทม./ปริมณฑล', label: 'กทม. & ปริมณฑล' },
    { id: 'ภาคเหนือ', label: 'ภาคเหนือ' },
    { id: 'ภาคอีสาน', label: 'ภาคอีสาน' },
    { id: 'ภาคใต้', label: 'ภาคใต้' },
    { id: 'ภาคกลาง/ตะวันออก', label: 'กลาง / ตะวันออก' },
  ];

  // ================= VIEW A: INBOX / CONVERSATIONS LIST =================
  if (!activeFacility) {
    return (
      <div className="flex flex-col h-[calc(100vh-140px)] max-h-[740px] bg-[#f8fafc] select-none">
        {/* Top Header */}
        <div className="bg-[#163d2d] text-white p-4 shadow-sm shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-heading font-extrabold text-base sm:text-lg text-white">
                กล่องข้อความ & ปรึกษาแพทย์
              </h2>
              <p className="text-xs text-[#bcd9c9] mt-0.5">
                ติดต่อโรงพยาบาล คลินิก ร้านยาคุณภาพ และสายด่วน 1669
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-emerald-300 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="ค้นหาชื่อ รพ., คลินิก, ร้านยา..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#204a37] text-white placeholder-emerald-200/60 pl-8 pr-3 py-1.5 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400"
            />
          </div>
        </div>

        {/* Category Tabs */}
        <div className="bg-white border-b border-slate-200 px-3 py-2 flex gap-1.5 overflow-x-auto no-scrollbar shrink-0 text-xs font-heading font-bold">
          <button
            onClick={() => setSelectedTypeFilter('all')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition cursor-pointer ${
              selectedTypeFilter === 'all'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            ทั้งหมด ({FACILITY_CHATS.length})
          </button>
          <button
            onClick={() => setSelectedTypeFilter('hospital')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition cursor-pointer ${
              selectedTypeFilter === 'hospital'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            🏥 โรงพยาบาล
          </button>
          <button
            onClick={() => setSelectedTypeFilter('clinic')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition cursor-pointer ${
              selectedTypeFilter === 'clinic'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            🩺 ศูนย์สาธารณสุข
          </button>
          <button
            onClick={() => setSelectedTypeFilter('pharmacy')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition cursor-pointer ${
              selectedTypeFilter === 'pharmacy'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            💊 ร้านยาคุณภาพ
          </button>
          <button
            onClick={() => setSelectedTypeFilter('emergency')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition cursor-pointer ${
              selectedTypeFilter === 'emergency'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            🚑 สายด่วน 1669
          </button>
        </div>

        {/* Region Filter Pills (Nationwide coverage) */}
        <div className="bg-slate-50 border-b border-slate-200/80 px-3 py-1.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0 text-[11px]">
          <span className="text-[10px] text-slate-400 font-bold whitespace-nowrap flex items-center gap-0.5">
            <MapPin className="w-2.5 h-2.5 text-emerald-600" />
            พื้นที่:
          </span>
          {regionsList.map((reg) => (
            <button
              key={reg.id}
              onClick={() => setSelectedRegionFilter(reg.id)}
              className={`px-2.5 py-0.8 rounded-full whitespace-nowrap font-medium transition cursor-pointer text-[10.5px] ${
                selectedRegionFilter === reg.id
                  ? 'bg-emerald-800 text-white font-bold shadow-2xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {reg.label}
            </button>
          ))}
        </div>

        {/* Facilities Conversations List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1.5 no-scrollbar">
          {filteredFacilities.length === 0 ? (
            <div className="text-center py-12 px-4">
              <Building className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-600 font-heading">ไม่พบสถานพยาบาลในเงื่อนไขที่เลือก</p>
              <p className="text-[11px] text-slate-400 mt-1">ลองเปลี่ยนตัวกรองพื้นที่ หรือค้นหาด้วยชื่อโรงพยาบาล</p>
              <button
                onClick={() => {
                  setSelectedTypeFilter('all');
                  setSelectedRegionFilter('all');
                  setSearchQuery('');
                }}
                className="mt-3 px-3 py-1 text-xs bg-emerald-700 text-white rounded-lg font-bold"
              >
                ดูสถานพยาบาลทั้งหมดทั่วประเทศ
              </button>
            </div>
          ) : (
            filteredFacilities.map((facility) => (
              <div
                key={facility.id}
                onClick={() => setActiveFacility(facility)}
                className="p-3 rounded-2xl bg-white border border-slate-100 card-shadow hover:border-emerald-300 hover:bg-slate-50/70 transition cursor-pointer flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Facility Avatar */}
                  <div className="relative shrink-0">
                    <div
                      className={`w-12 h-12 rounded-2xl font-bold flex items-center justify-center text-xs font-heading shadow-xs ${facility.avatarBg}`}
                    >
                      {facility.avatarText}
                    </div>
                    {facility.online && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="font-heading font-bold text-slate-900 text-xs sm:text-sm group-hover:text-emerald-700 transition truncate">
                        {facility.facilityName}
                      </h4>
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                        {facility.badge}
                      </span>
                      {facility.province && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                          📍 {facility.province}
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {facility.name} • {facility.role}
                    </p>

                    <p className="text-[11px] text-slate-600 truncate mt-1 text-slate-400">
                      {facility.lastMessage}
                    </p>
                  </div>
                </div>

                {/* Time & Unread Badge */}
                <div className="text-right shrink-0 flex flex-col items-end justify-between self-stretch">
                  <span className="text-[10px] text-slate-400 font-mono">{facility.lastTime}</span>
                  {facility.unreadCount > 0 ? (
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                      {facility.unreadCount}
                    </span>
                  ) : (
                    <ChevronLeft className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 rotate-180 transition" />
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // ================= VIEW B: ACTIVE CHAT ROOM =================
  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-h-[740px] bg-slate-50 select-none">
      {/* Top Provider Header Bar */}
      <div className="bg-white p-3 border-b border-slate-200 flex items-center justify-between shadow-xs z-10 shrink-0">
        <div className="flex items-center gap-2">
          {/* Back to Inbox Button as requested: "มันกดออกละมีหลายๆเเชทได้" */}
          <button
            onClick={() => setActiveFacility(null)}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition cursor-pointer"
            title="กลับสู่กล่องข้อความทั้งหมด"
          >
            <ChevronLeft className="w-5 h-5 text-slate-700" />
          </button>

          <div className="relative">
            <div
              className={`w-9 h-9 rounded-xl font-bold flex items-center justify-center text-[11px] font-heading ${activeFacility.avatarBg}`}
            >
              {activeFacility.avatarText}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-bold text-slate-900 text-xs sm:text-sm font-heading truncate">
                {activeFacility.name}
              </h3>
              <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">
                {activeFacility.badge}
              </span>
              {activeFacility.province && (
                <span className="text-[9px] bg-slate-100 text-slate-700 font-bold px-1.5 py-0.2 rounded">
                  📍 {activeFacility.province}
                </span>
              )}
            </div>
            <p className="text-[10px] text-emerald-600 font-medium truncate">
              {activeFacility.facilityName} • ออนไลน์พร้อมตอบ
            </p>
          </div>
        </div>

        {/* Call Hotline & Close Button */}
        <div className="flex items-center gap-1">
          <a
            href={`tel:${activeFacility.phone}`}
            className="w-8 h-8 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 flex items-center justify-center transition"
            title={`โทรติดต่อ ${activeFacility.phone}`}
          >
            <Phone className="w-4 h-4" />
          </a>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick Action Bar inside Chat */}
      <div className="bg-emerald-50/70 border-b border-emerald-100 px-3 py-1.5 flex items-center justify-between text-xs gap-2 shrink-0">
        <button
          onClick={handleSendGps}
          className="text-[10px] font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-emerald-200 cursor-pointer shadow-2xs"
        >
          <MapPin className="w-3 h-3 text-emerald-600" />
          <span>ส่งพิกัด GPS ของฉัน</span>
        </button>

        <a
          href={`tel:${activeFacility.phone}`}
          className="text-[10px] font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-emerald-200 shadow-2xs"
        >
          <Phone className="w-3 h-3 text-emerald-600" />
          <span>โทร: {activeFacility.phone}</span>
        </a>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-3.5 overflow-y-auto space-y-3 text-xs no-scrollbar">
        {messages.map((m) => {
          const isUser = m.sender === 'user';
          return (
            <div
              key={m.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1`}
            >
              {!isUser && (
                <div className="flex items-center gap-1 text-[10px] text-slate-500 px-1">
                  <Stethoscope className="w-3 h-3 text-emerald-600" />
                  <span className="font-bold">{m.doctorName || activeFacility.name}</span>
                  <span>· {m.timestamp}</span>
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 leading-relaxed whitespace-pre-line text-xs ${
                  isUser
                    ? 'bg-[#1c4c39] text-white rounded-tr-xs shadow-xs'
                    : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-xs shadow-xs'
                }`}
              >
                {m.text}
              </div>

              {isUser && (
                <div className="flex items-center gap-1 text-[9px] text-slate-400 px-1">
                  <span>{m.timestamp}</span>
                  <CheckCheck className="w-3 h-3 text-emerald-600" />
                </div>
              )}
            </div>
          );
        })}

        {isTyping && (
          <div className="flex items-center gap-2 text-slate-400 text-xs px-2 py-1">
            <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[9px] font-bold">
              {activeFacility.avatarText}
            </div>
            <div className="flex gap-1 items-center bg-white border border-slate-200 px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
              <span className="text-[10px] text-slate-500 ml-1">กำลังพิมพ์ตอบ...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Suggestion Chips */}
      <div className="px-3 py-2 bg-white border-t border-slate-100 overflow-x-auto no-scrollbar flex gap-1.5 shrink-0">
        {activeFacility.quickChips.map((chip, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(chip)}
            className="text-[11px] whitespace-nowrap bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-full font-medium transition cursor-pointer shrink-0"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Input Field Bar */}
      <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSend();
          }}
          placeholder={`พิมพ์ข้อความถึง ${activeFacility.name}...`}
          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:bg-white"
        />

        <button
          onClick={() => handleSend()}
          disabled={!inputText.trim()}
          className="w-10 h-10 rounded-xl bg-[#1c4c39] hover:bg-[#153c2c] text-white flex items-center justify-center transition disabled:opacity-40 cursor-pointer shadow-xs shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
