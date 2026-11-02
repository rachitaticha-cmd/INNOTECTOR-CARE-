export type TriageLevel = 'green' | 'yellow' | 'orange' | 'red';

export interface WeightLogEntry {
  day: string;
  mon: string;
  weight: number;
  dateStr?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  hn: string;
  nationalId: string; // 13-digit Thai national ID card number
  age: number;
  gender: 'ชาย' | 'หญิง' | 'อื่นๆ';
  bloodType: 'A' | 'B' | 'AB' | 'O';
  heightCm: number;
  weightKg: number;
  bmi: number;
  drugAllergies: string[];
  chronicDiseases: string[];
  vaccines?: { name: string; date: string }[];
  medicalRight?: 'สิทธิหลักประกันสุขภาพถ้วนหน้า (บัตรทอง)' | 'ประกันสังคม' | 'สวัสดิการข้าราชการ/รัฐวิสาหกิจ';
  assignedHospital?: string;
  secondaryHospital?: string;
  insuranceCompany?: string;
  insurancePolicyNumber?: string;
  weightLog?: WeightLogEntry[];
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  avatarUrl: string;
}

export interface InsurancePartner {
  id: string;
  name: string;
  nameEn: string;
  code: string;
  logo: string;
  color: string;
  callCenter: string;
  claimType: 'แฟกซ์เคลมไม่ต้องสำรองจ่าย (Direct Billing)' | 'สำรองจ่ายเบิกคืน (Reimbursement)' | 'ทั้งสองระบบ (OPD/IPD Fax Claim)';
  opdCovered: boolean;
  ipdCovered: boolean;
  dentalCovered: boolean;
  requiredDocuments: string[];
  notes: string;
  popularPlans: string[];
}

export interface HealthcareRightDetails {
  schemeName: string;
  nationalId: string;
  insuredName: string;
  mainHospital: string;
  secondaryHospital?: string;
  subDistrictUnit?: string;
  status: 'มีสิทธิ (Active)' | 'รอเปลี่ยนสถานพยาบาล' | 'หมดอายุ';
  checkDate: string;
  expiryDate?: string;
  coverageList: {
    category: string;
    details: string;
    copay: string;
  }[];
}

export interface DepartmentQueue {
  id: string;
  name: string;
  currentServing: string;
  waitingCount: number;
  estWaitMinutes: number;
  status: 'open' | 'busy' | 'full';
  doctorOnDuty: string;
}

export type FacilityCategoryType = 'รพ.รัฐบาล' | 'รพ.เอกชน' | 'ศบส./ศูนย์สาธารณสุข' | 'คลินิกเวชกรรม/คลินิกชุมชนอบอุ่น';
export type RegionType = 'กทม./ปริมณฑล' | 'ภาคเหนือ' | 'ภาคอีสาน' | 'ภาคใต้' | 'ภาคกลาง/ตะวันออก';

export interface Hospital {
  id: string;
  name: string;
  type: string;
  facilityType: FacilityCategoryType;
  region: RegionType;
  district: string;
  province: string;
  address: string;
  distanceKm: number;
  congestionPct: number; // 0-100%
  totalWaitingCount: number;
  estWaitMinutes: number;
  openHours: string;
  phone: string;
  departments: DepartmentQueue[];
  coordinates: {
    lat: number;
    lng: number;
  };
  badge?: 'คิวน้อย' | 'ปานกลาง' | 'หนาแน่น' | 'แนะนำที่สุด';
}

export interface QueueTicket {
  id: string;
  userId: string;
  hospitalId: string;
  hospitalName: string;
  department: string;
  queueNum: string;
  triageLevel: TriageLevel;
  triageTitle: string;
  ahead: number;
  estWait: string;
  createdAt: string;
  appointmentTime?: string;
  status: 'waiting' | 'called' | 'completed' | 'cancelled';
  symptomsSummary: string;
  qrCodeUrl?: string;
}

export interface TriageAssessment {
  id: string;
  userId: string;
  duration: string;
  symptoms: string[];
  notes: string;
  temperature?: number;
  hasRedFlags: boolean;
  redFlagsList: string[];
  level: TriageLevel;
  title: string;
  description: string;
  clinicalSummary: string;
  recommendedHospitalId: string;
  recommendedHospitalName: string;
  recommendedService?: 'ร้านยา' | 'คลินิก' | 'โรงพยาบาล' | 'ห้องฉุกเฉิน';
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'doctor' | 'system';
  doctorName?: string;
  doctorSpecialty?: string;
  text: string;
  timestamp: string;
  isSummary?: boolean;
}

export interface MedicineItem {
  id: string;
  name: string;
  genericName: string;
  dosage: string;
  instructions: string;
  mealTiming: 'ก่อนอาหาร' | 'หลังอาหาร' | 'พร้อมอาหาร' | 'ก่อนนอน';
  frequency: string;
  quantity: string;
  warnings?: string;
  icon?: string;
}

export interface Prescription {
  id: string;
  prescriptionNumber: string;
  date: string;
  hospitalName: string;
  doctorName: string;
  diagnosis: string;
  status: 'รับยาแล้ว' | 'กำลังจัดยา' | 'จัดส่งถึงบ้าน';
  coverageStatus: string;
  medicines: MedicineItem[];
}

export interface NotificationItem {
  id: string;
  title: string;
  subtitle: string;
  time: string;
  color: 'amber' | 'emerald' | 'slate' | 'sky' | 'rose';
  read: boolean;
  linkTab?: 'home' | 'history' | 'messages' | 'account';
}

export interface FacilityChat {
  id: string;
  name: string;
  role: string;
  facilityName: string;
  type: 'hospital' | 'clinic' | 'pharmacy' | 'emergency';
  badge: string;
  avatarText: string;
  avatarBg: string;
  phone: string;
  unreadCount: number;
  lastMessage: string;
  lastTime: string;
  online: boolean;
  quickChips: string[];
  region?: 'กทม./ปริมณฑล' | 'ภาคเหนือ' | 'ภาคอีสาน' | 'ภาคใต้' | 'ภาคกลาง/ตะวันออก';
  province?: string;
}
