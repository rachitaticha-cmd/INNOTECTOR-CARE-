import { FacilityCategoryType, Hospital, RegionType, UserProfile } from '../types';

export const GMP_ATTRIBUTION_ID = 'gmp_mcp_codeassist_v1_aistudio';

// Central Bangkok medical district fallback only when GPS is unavailable or resolved outside Thailand
export const DEFAULT_THAILAND_CENTER: google.maps.LatLngLiteral = {
  lat: 13.7649,
  lng: 100.5383,
};

export type TriageServiceTier = 'ร้านยา' | 'คลินิก' | 'โรงพยาบาล' | 'ห้องฉุกเฉิน';
export type FacilityCategory = 'hospital' | 'clinic' | 'pharmacy';

export interface LivePlaceFacility {
  id: string;
  name: string;
  address: string;
  shortAddress: string;
  category: FacilityCategory;
  categoryLabel: string;
  primaryTypeLabel: string;
  location: google.maps.LatLngLiteral;
  distanceKm: number;
  rating: number | null;
  userRatingCount: number | null;
  phone: string | null;
  businessStatus: string | null;
  openHoursText: string | null;
  isOpenNow: boolean | null;
  is24Hours: boolean;
  openStatusLabel: string;
  isPrivateFacility: boolean;
  rightCompatible: boolean;
  rightExactMatch: boolean;
  rightMatchScore: number;
  rightMatchReason: string;
  googleMapsURI: string | null;
  attributions: { provider: string; providerURI: string | null }[];
  areaSummary: string | null;
  districtName: string | null;
  provinceName: string | null;
}

export interface GpsDetectionResult {
  coords: google.maps.LatLngLiteral;
  isLiveGps: boolean;
  accuracyMeters: number | null;
  permissionDenied: boolean;
  outsideThailandCoords: google.maps.LatLngLiteral | null;
  statusText: string;
}

// Matches CJK Hanzi, Hiragana/Katakana, Hangul, Arabic/Hebrew, Cyrillic, Myanmar, Khmer, Devanagari
const FOREIGN_NON_THAI_SCRIPT_REGEX =
  /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af\u1100-\u11ff\u0600-\u06ff\u0590-\u05ff\u0400-\u04ff\u1000-\u109f\u1780-\u17ff\u0900-\u097f]/;
const HAS_THAI_SCRIPT_REGEX = /[\u0e00-\u0e7f]/;

const PRIVATE_HOSPITAL_KEYWORDS = [
  'เอกชน',
  'บำรุงราษฎร์',
  'bumrungrad',
  'สมิติเวช',
  'samitivej',
  'รพ.กรุงเทพ',
  'โรงพยาบาลกรุงเทพ',
  'bangkok hospital',
  'พญาไท',
  'phyathai',
  'เปาโล',
  'paolo',
  'เกษมราษฎร์',
  'kasemrad',
  'ธนบุรี',
  'thonburi',
  'วิภาวดี',
  'vibhavadi',
  'วิชัยยุทธ',
  'vichaiyut',
  'เมดพาร์ค',
  'medpark',
  'เวิลด์เมดิคอล',
  'world medical',
  'บางปะกอก',
  'bangpakok',
  'สินแพทย์',
  'synphaet',
  'นครธน',
  'nakornthon',
  'ปิยะเวท',
  'piyavate',
  'รามคำแหง',
  'ramkhamhaeng',
  'บีเอ็นเอช',
  'bnh',
  'พระราม 9',
  'พระรามเก้า',
  'praram 9',
  'เจ้าพระยา',
  'หัวเฉียว',
  'เซนต์หลุยส์',
  'เปตอง',
  'ลานนา',
  'เชียงใหม่ราม',
  'ศรีบุรินทร์',
  'ราชพฤกษ์',
  'กรุงเทพหาดใหญ่',
  'มิชชั่น',
  'ยันฮี',
  'สุขุมวิท',
  'คามิลเลียน',
  'เพชรเวช',
  'ลาดพร้าว',
  'นวมินทร์',
  'แพทย์รังสิต',
  'เอกชัย',
  'จุฬารัตน์',
  'chularat',
  'พริ้นซ์',
  'princ',
  'ศิครินทร์',
  'sikarin',
];

const PUBLIC_HOSPITAL_KEYWORDS = [
  'รัฐบาล',
  'ศูนย์บริการสาธารณสุข',
  'ศบส',
  'รพ.สต',
  'ส่งเสริมสุขภาพตำบล',
  'อนามัย',
  'ชุมชนอบอุ่น',
  'เทศบาล',
  'องค์การบริหาร',
  'กระทรวงสาธารณสุข',
  'ศิริราช',
  'จุฬาลงกรณ์',
  'รามาธิบดี',
  'ราชวิถี',
  'ราชพิพัฒน์',
  'พระมงกุฎ',
  'ตำรวจ',
  'ภูมิพล',
  'ตากสิน',
  'เจริญกรุงประชารักษ์',
  'กลาง',
  'เลิดสิน',
  'นพรัตนราชธานี',
  'วชิรพยาบาล',
  'ธรรมศาสตร์',
  'มหาราช',
  'ศรีนครินทร์',
  'สงขลานครินทร์',
  'สรรพสิทธิประสงค์',
  'พุทธชินราช',
  'ชลบุรี',
  'พระปกเกล้า',
  'อุดรธานี',
  'ขอนแก่น',
  'หาดใหญ่',
  'วชิระภูเก็ต',
  'สุราษฎร์ธานี',
  'ประจวบคีรีขันธ์',
  'เชียงรายประชานุเคราะห์',
  'นครพิงค์',
  'สวรรค์ประชารักษ์',
];

export function isWithinThailand(loc: google.maps.LatLngLiteral): boolean {
  return loc.lat >= 5.55 && loc.lat <= 20.55 && loc.lng >= 97.3 && loc.lng <= 105.7;
}

export function hasForeignScript(text?: string | null): boolean {
  if (!text) return false;
  return FOREIGN_NON_THAI_SCRIPT_REGEX.test(text);
}

export function isAllowedLanguageCode(
  langCode?: string | null,
  displayName?: string | null
): boolean {
  if (displayName && HAS_THAI_SCRIPT_REGEX.test(displayName)) {
    return !hasForeignScript(displayName);
  }
  if (!langCode) return !hasForeignScript(displayName);
  const normalized = langCode.toLowerCase();
  return normalized.startsWith('th') || normalized.startsWith('en');
}

export function isPlaceInThailand(
  place: google.maps.places.Place,
  loc: google.maps.LatLngLiteral
): boolean {
  const comps = place.addressComponents;
  if (comps && comps.length > 0) {
    const countryComp = comps.find((c) => c.types?.includes('country'));
    if (countryComp?.shortText) {
      return countryComp.shortText.toUpperCase() === 'TH';
    }
  }
  return isWithinThailand(loc);
}

export function isValidThaiHealthPlace(
  place: google.maps.places.Place,
  loc: google.maps.LatLngLiteral,
  enforceThailandFilter: boolean
): boolean {
  const name = place.displayName;
  if (!name) return false;
  if (hasForeignScript(name)) return false;

  if (enforceThailandFilter) {
    if (!isPlaceInThailand(place, loc)) return false;
    if (!isAllowedLanguageCode(place.displayNameLanguageCode, name)) return false;
    if (place.formattedAddress && hasForeignScript(place.formattedAddress)) return false;
  }

  return true;
}

export function toLatLngLiteral(loc: unknown): google.maps.LatLngLiteral | null {
  if (!loc || typeof loc !== 'object') return null;
  const obj = loc as { lat?: number | (() => number); lng?: number | (() => number) };
  const lat = typeof obj.lat === 'function' ? obj.lat() : obj.lat;
  const lng = typeof obj.lng === 'function' ? obj.lng() : obj.lng;
  if (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    !Number.isNaN(lat) &&
    !Number.isNaN(lng)
  ) {
    return { lat, lng };
  }
  return null;
}

export function calculateDistanceKm(
  a: google.maps.LatLngLiteral,
  b: google.maps.LatLngLiteral
): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lng - a.lng) * Math.PI) / 180;
  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const h =
    sinDLat * sinDLat +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      sinDLon *
      sinDLon;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return Number((R * c).toFixed(2));
}

export function isQuotaError(err: unknown): boolean {
  if (!err) return false;
  const text =
    err instanceof Error
      ? `${err.name} ${err.message}`
      : typeof err === 'object'
      ? JSON.stringify(err)
      : String(err);
  const upper = text.toUpperCase();
  return (
    upper.includes('RESOURCE_EXHAUSTED') ||
    upper.includes('OVER_QUERY_LIMIT') ||
    upper.includes('QUOTAEXCEEDED') ||
    upper.includes('OVERQUOTAMAPERROR') ||
    upper.includes('429')
  );
}

export function classifyPlaceCategory(
  types: string[] = [],
  primaryType?: string | null
): {
  category: FacilityCategory;
  label: string;
  facilityType: FacilityCategoryType;
} {
  const primary = (primaryType || '').toLowerCase();
  const allTypes = types.map((t) => t.toLowerCase());

  if (
    primary === 'pharmacy' ||
    primary === 'drugstore' ||
    allTypes.includes('pharmacy') ||
    allTypes.includes('drugstore')
  ) {
    return {
      category: 'pharmacy',
      label: 'ร้านยา / เภสัชกรรม',
      facilityType: 'คลินิกเวชกรรม/คลินิกชุมชนอบอุ่น',
    };
  }

  if (
    primary === 'hospital' ||
    primary === 'general_hospital' ||
    primary === 'medical_center' ||
    allTypes.includes('hospital') ||
    allTypes.includes('general_hospital')
  ) {
    return {
      category: 'hospital',
      label: 'โรงพยาบาล',
      facilityType: 'รพ.รัฐบาล',
    };
  }

  return {
    category: 'clinic',
    label: 'คลินิก / ศูนย์การแพทย์',
    facilityType: 'คลินิกเวชกรรม/คลินิกชุมชนอบอุ่น',
  };
}

export function extractAreaDetails(place: google.maps.places.Place): {
  district: string | null;
  province: string | null;
  areaSummary: string | null;
} {
  const comps = place.addressComponents;
  if (!comps || comps.length === 0) {
    const cleanShort =
      place.shortFormattedAddress && !hasForeignScript(place.shortFormattedAddress)
        ? place.shortFormattedAddress
        : null;
    return { district: null, province: null, areaSummary: cleanShort };
  }

  const findCleanComp = (target: string): string | null => {
    const comp = comps.find((c) => c.types?.includes(target));
    const val = comp?.longText || comp?.shortText || null;
    if (!val || hasForeignScript(val)) return null;
    return val;
  };

  const sublocality =
    findCleanComp('sublocality_level_2') ||
    findCleanComp('sublocality_level_1') ||
    findCleanComp('sublocality');
  const district = findCleanComp('administrative_area_level_2') || findCleanComp('locality');
  const province = findCleanComp('administrative_area_level_1');

  const parts = Array.from(new Set([sublocality, district, province].filter(Boolean) as string[]));
  const areaSummary =
    parts.length > 0
      ? parts.join(' · ')
      : place.shortFormattedAddress && !hasForeignScript(place.shortFormattedAddress)
      ? place.shortFormattedAddress
      : null;

  return {
    district: district || sublocality || null,
    province: province || null,
    areaSummary,
  };
}

export function getTodayOpeningHours(place: google.maps.places.Place): string | null {
  const descriptions =
    place.currentOpeningHours?.weekdayDescriptions ||
    place.regularOpeningHours?.weekdayDescriptions;
  if (!descriptions || descriptions.length === 0) return null;
  const jsDay = new Date().getDay();
  const mondayFirstIdx = jsDay === 0 ? 6 : jsDay - 1;
  return descriptions[mondayFirstIdx] || descriptions[0] || null;
}

export function detectIs24Hours(place: google.maps.places.Place, openHoursText: string | null): boolean {
  if (openHoursText && (openHoursText.includes('24 ชั่วโมง') || openHoursText.toLowerCase().includes('24 hours'))) {
    return true;
  }
  const periods = place.regularOpeningHours?.periods;
  if (
    periods &&
    periods.length === 1 &&
    periods[0].open?.day === 0 &&
    periods[0].open?.hour === 0 &&
    periods[0].open?.minute === 0 &&
    !periods[0].close
  ) {
    return true;
  }
  return false;
}

function normalizeFacilityName(name: string): string {
  return name
    .toLowerCase()
    .replace(/โรงพยาบาล|รพ\.|hospital|clinic|คลินิก|ศูนย์บริการสาธารณสุข|ศบส\.|\s+/g, '')
    .replace(/\(.*?\)/g, '')
    .trim();
}

export function inferIsPrivateFacility(name: string, category: FacilityCategory): boolean {
  const lower = name.toLowerCase();
  if (PUBLIC_HOSPITAL_KEYWORDS.some((kw) => lower.includes(kw.toLowerCase()))) {
    return false;
  }
  if (PRIVATE_HOSPITAL_KEYWORDS.some((kw) => lower.includes(kw.toLowerCase()))) {
    return true;
  }
  if (category === 'pharmacy') {
    return true;
  }
  if (category === 'clinic') {
    return !lower.includes('ศูนย์บริการ') && !lower.includes('สาธารณสุข') && !lower.includes('อบอุ่น');
  }
  return false;
}

export function evaluateHealthcareRightMatch(
  placeName: string,
  category: FacilityCategory,
  isPrivateFacility: boolean,
  user?: UserProfile,
  serviceTier?: TriageServiceTier
): {
  rightCompatible: boolean;
  rightExactMatch: boolean;
  rightMatchScore: number;
  rightMatchReason: string;
} {
  const normPlace = normalizeFacilityName(placeName);
  const normAssigned = user?.assignedHospital ? normalizeFacilityName(user.assignedHospital) : '';
  const normSecondary = user?.secondaryHospital ? normalizeFacilityName(user.secondaryHospital) : '';

  const exactAssigned =
    Boolean(normAssigned) &&
    normAssigned.length >= 3 &&
    (normPlace.includes(normAssigned) || normAssigned.includes(normPlace));
  const exactSecondary =
    Boolean(normSecondary) &&
    normSecondary.length >= 3 &&
    (normPlace.includes(normSecondary) || normSecondary.includes(normPlace));

  const right = user?.medicalRight || 'สิทธิหลักประกันสุขภาพถ้วนหน้า (บัตรทอง)';
  const hasPrivateIns = Boolean(user?.insuranceCompany && user.insuranceCompany !== 'ไม่มี');

  if (exactAssigned) {
    return {
      rightCompatible: true,
      rightExactMatch: true,
      rightMatchScore: 100,
      rightMatchReason: `ตรงหน่วยบริการประจำสิทธิ (${user?.assignedHospital})`,
    };
  }

  if (exactSecondary) {
    return {
      rightCompatible: true,
      rightExactMatch: true,
      rightMatchScore: 85,
      rightMatchReason: `โรงพยาบาลรับส่งต่อตามสิทธิ (${user?.secondaryHospital})`,
    };
  }

  if (serviceTier === 'ห้องฉุกเฉิน' && category === 'hospital') {
    return {
      rightCompatible: true,
      rightExactMatch: false,
      rightMatchScore: 90,
      rightMatchReason: 'ฉุกเฉินวิกฤต (UCEP) ใช้สิทธิได้ทุก รพ.รัฐและเอกชน ฟรี 72 ชม.',
    };
  }

  if (right.includes('บัตรทอง') || right.includes('30 บาท')) {
    if (!isPrivateFacility && category === 'hospital') {
      return {
        rightCompatible: true,
        rightExactMatch: false,
        rightMatchScore: 70,
        rightMatchReason: 'รพ.รัฐ รองรับสิทธิบัตรทอง 30 บาทรักษาทุกที่',
      };
    }
    if (category === 'clinic' && !isPrivateFacility) {
      return {
        rightCompatible: true,
        rightExactMatch: false,
        rightMatchScore: 68,
        rightMatchReason: 'ศบส./คลินิกปฐมภูมิ ใช้สิทธิบัตรทอง 30 บาทได้',
      };
    }
    if (category === 'pharmacy') {
      return {
        rightCompatible: true,
        rightExactMatch: false,
        rightMatchScore: 60,
        rightMatchReason: 'ปรึกษาเภสัชกร / ตรวจสอบร้านยาบัตรทอง 16 กลุ่มอาการ',
      };
    }
    if (hasPrivateIns) {
      return {
        rightCompatible: true,
        rightExactMatch: false,
        rightMatchScore: 55,
        rightMatchReason: `รองรับประกันสุขภาพ ${user?.insuranceCompany}`,
      };
    }
    return {
      rightCompatible: false,
      rightExactMatch: false,
      rightMatchScore: 20,
      rightMatchReason: 'สถานพยาบาลเอกชน (ชำระเอง/ใช้ประกันส่วนตัว)',
    };
  }

  if (right.includes('ประกันสังคม')) {
    if (category === 'hospital' && !isPrivateFacility) {
      return {
        rightCompatible: true,
        rightExactMatch: false,
        rightMatchScore: 62,
        rightMatchReason: 'รพ.รัฐ ใช้สิทธิฉุกเฉิน/เบิกกรณีจำเป็นประกันสังคมได้',
      };
    }
    if (hasPrivateIns && category === 'hospital') {
      return {
        rightCompatible: true,
        rightExactMatch: false,
        rightMatchScore: 58,
        rightMatchReason: `ตรวจสอบเครือข่ายประกันสังคม / ${user?.insuranceCompany}`,
      };
    }
    return {
      rightCompatible: false,
      rightExactMatch: false,
      rightMatchScore: 30,
      rightMatchReason: 'นอกเครือข่าย รพ.ประกันสังคมหลัก (กรุณาเช็กสิทธิ์หน้าจุดบริการ)',
    };
  }

  // สวัสดิการข้าราชการ/รัฐวิสาหกิจ
  if (!isPrivateFacility) {
    return {
      rightCompatible: true,
      rightExactMatch: false,
      rightMatchScore: 75,
      rightMatchReason: 'เบิกตรงสิทธิข้าราชการ/รัฐวิสาหกิจได้ (สถานพยาบาลรัฐ)',
    };
  }
  if (hasPrivateIns) {
    return {
      rightCompatible: true,
      rightExactMatch: false,
      rightMatchScore: 55,
      rightMatchReason: `ใช้ร่วมกับประกัน ${user?.insuranceCompany}`,
    };
  }
  return {
    rightCompatible: false,
    rightExactMatch: false,
    rightMatchScore: 25,
    rightMatchReason: 'สถานพยาบาลเอกชน (เบิกได้เฉพาะกรณีฉุกเฉิน UCEP)',
  };
}

export async function buildLivePlaceFacility(
  place: google.maps.places.Place,
  referenceOrigin: google.maps.LatLngLiteral,
  user?: UserProfile,
  serviceTier?: TriageServiceTier
): Promise<LivePlaceFacility | null> {
  const loc = toLatLngLiteral(place.location);
  if (!loc || !place.displayName) return null;

  const { category, label } = classifyPlaceCategory(place.types, place.primaryType);
  const areaDetails = extractAreaDetails(place);
  const rawPrimaryLabel = place.primaryTypeDisplayName;
  const cleanPrimaryLabel =
    rawPrimaryLabel && !hasForeignScript(rawPrimaryLabel) ? rawPrimaryLabel : label;
  const openHoursText = getTodayOpeningHours(place);
  const is24Hours = detectIs24Hours(place, openHoursText);

  let isOpenNow: boolean | null = null;
  try {
    const openState = await place.isOpen();
    if (typeof openState === 'boolean') {
      isOpenNow = openState;
    } else if (is24Hours) {
      isOpenNow = true;
    }
  } catch {
    if (is24Hours) isOpenNow = true;
  }

  let openStatusLabel = 'ตรวจสอบเวลาทำการ';
  if (place.businessStatus === 'CLOSED_TEMPORARILY') {
    isOpenNow = false;
    openStatusLabel = 'ปิดชั่วคราว';
  } else if (is24Hours) {
    openStatusLabel = 'เปิดบริการ 24 ชม.';
  } else if (isOpenNow === true) {
    openStatusLabel = 'เปิดให้บริการอยู่ตอนนี้';
  } else if (isOpenNow === false) {
    openStatusLabel = 'ปิดให้บริการในเวลานี้';
  } else if (place.businessStatus === 'OPERATIONAL') {
    openStatusLabel = 'เปิดดำเนินงาน';
  }

  const isPrivateFacility = inferIsPrivateFacility(place.displayName, category);
  const rightEval = evaluateHealthcareRightMatch(
    place.displayName,
    category,
    isPrivateFacility,
    user,
    serviceTier
  );

  return {
    id: place.id,
    name: place.displayName,
    address: place.formattedAddress || place.shortFormattedAddress || 'ไม่มีข้อมูลที่อยู่',
    shortAddress: place.shortFormattedAddress || place.formattedAddress || '',
    category,
    categoryLabel: label,
    primaryTypeLabel: cleanPrimaryLabel,
    location: loc,
    distanceKm: calculateDistanceKm(referenceOrigin, loc),
    rating: typeof place.rating === 'number' ? place.rating : null,
    userRatingCount: typeof place.userRatingCount === 'number' ? place.userRatingCount : null,
    phone: place.nationalPhoneNumber || null,
    businessStatus: place.businessStatus || null,
    openHoursText,
    isOpenNow,
    is24Hours,
    openStatusLabel,
    isPrivateFacility,
    ...rightEval,
    googleMapsURI: place.googleMapsURI || null,
    attributions: (place.attributions || []).map((a) => ({
      provider: a.provider || '',
      providerURI: a.providerURI || null,
    })),
    areaSummary: areaDetails.areaSummary,
    districtName: areaDetails.district,
    provinceName: areaDetails.province,
  };
}

export function facilityToHospitalBridge(
  facility: LivePlaceFacility,
  computedMins?: number
): Hospital {
  const isHospital = facility.category === 'hospital';
  const facilityType: FacilityCategoryType = isHospital
    ? facility.isPrivateFacility
      ? 'รพ.เอกชน'
      : 'รพ.รัฐบาล'
    : facility.category === 'pharmacy'
    ? 'คลินิกเวชกรรม/คลินิกชุมชนอบอุ่น'
    : facility.isPrivateFacility
    ? 'คลินิกเวชกรรม/คลินิกชุมชนอบอุ่น'
    : 'ศบส./ศูนย์สาธารณสุข';

  const prov = facility.provinceName || 'ประเทศไทย';
  const isMetro =
    prov.includes('กรุงเทพ') ||
    prov.includes('นนทบุรี') ||
    prov.includes('ปทุมธานี') ||
    prov.includes('สมุทรปราการ') ||
    prov.includes('Bangkok');

  const inferRegion = (): RegionType => {
    if (isMetro) return 'กทม./ปริมณฑล';
    if (facility.location.lat >= 17.4) return 'ภาคเหนือ';
    if (facility.location.lat <= 11.2) return 'ภาคใต้';
    if (facility.location.lng >= 101.6 && facility.location.lat >= 14.0) return 'ภาคอีสาน';
    return 'ภาคกลาง/ตะวันออก';
  };

  const estMins = computedMins ?? Math.max(5, Math.round(facility.distanceKm * 4 + 10));

  return {
    id: facility.id,
    name: facility.name,
    type: facility.primaryTypeLabel || facility.categoryLabel,
    facilityType,
    region: inferRegion(),
    district: facility.districtName || facility.areaSummary || 'พื้นที่ใกล้ฉัน',
    province: prov,
    address: facility.address,
    distanceKm: facility.distanceKm,
    congestionPct: facility.rightExactMatch ? 28 : 35,
    totalWaitingCount: facility.isOpenNow === true ? 3 : 5,
    estWaitMinutes: estMins,
    openHours: facility.openHoursText || facility.openStatusLabel,
    phone: facility.phone || '-',
    coordinates: facility.location,
    badge: facility.isOpenNow === true || facility.is24Hours ? 'แนะนำที่สุด' : undefined,
    departments: [
      {
        id: `${facility.id}-opd`,
        name:
          facility.category === 'pharmacy'
            ? 'ปรึกษาเภสัชกร / รับยา'
            : facility.category === 'clinic'
            ? 'ตรวจรักษาโรคทั่วไป (OPD คลินิก)'
            : 'แผนกตรวจโรคทั่วไป (OPD)',
        currentServing: 'OPD-01',
        waitingCount: 3,
        estWaitMinutes: 15,
        status: 'open',
        doctorOnDuty: 'แพทย์/บุคลากรประจำจุดบริการ',
      },
    ],
  };
}

export async function detectUserThailandGPS(
  allowOutsideThailand = false
): Promise<GpsDetectionResult> {
  if (!('geolocation' in navigator)) {
    return {
      coords: DEFAULT_THAILAND_CENTER,
      isLiveGps: false,
      accuracyMeters: null,
      permissionDenied: false,
      outsideThailandCoords: null,
      statusText: 'อุปกรณ์ไม่รองรับ GPS · ใช้พื้นที่เริ่มต้นในไทย (ค้นหาพื้นที่ของคุณบนแผนที่ได้)',
    };
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: google.maps.LatLngLiteral = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        const accuracyMeters = pos.coords.accuracy ? Math.round(pos.coords.accuracy) : null;

        if (!allowOutsideThailand && !isWithinThailand(coords)) {
          resolve({
            coords: DEFAULT_THAILAND_CENTER,
            isLiveGps: false,
            accuracyMeters,
            permissionDenied: false,
            outsideThailandCoords: coords,
            statusText: `พิกัดเครือข่าย (${coords.lat.toFixed(2)}, ${coords.lng.toFixed(
              2
            )}) อยู่นอกประเทศไทย · แสดงพื้นที่เริ่มต้นในไทย`,
          });
          return;
        }

        resolve({
          coords,
          isLiveGps: true,
          accuracyMeters,
          permissionDenied: false,
          outsideThailandCoords: null,
          statusText: `จับตำแหน่ง GPS จริงสำเร็จ (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(
            4
          )})`,
        });
      },
      (err) => {
        const permissionDenied = err.code === err.PERMISSION_DENIED;
        resolve({
          coords: DEFAULT_THAILAND_CENTER,
          isLiveGps: false,
          accuracyMeters: null,
          permissionDenied,
          outsideThailandCoords: null,
          statusText: permissionDenied
            ? 'ยังไม่ได้รับสิทธิ์ GPS · แสดงสถานพยาบาลในพื้นที่เริ่มต้น'
            : 'ไม่สามารถจับสัญญาณ GPS ได้ในขณะนี้',
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 15000,
      }
    );
  });
}

export const PLACE_SEARCH_FIELDS: string[] = [
  'id',
  'displayName',
  'displayNameLanguageCode',
  'formattedAddress',
  'shortFormattedAddress',
  'location',
  'types',
  'primaryType',
  'primaryTypeDisplayName',
  'businessStatus',
  'regularOpeningHours',
  'currentOpeningHours',
  'utcOffsetMinutes',
  'nationalPhoneNumber',
  'rating',
  'userRatingCount',
  'googleMapsURI',
  'addressComponents',
];

export async function fetchRealHealthcareFacilities(params: {
  placesLib: google.maps.PlacesLibrary;
  coords: google.maps.LatLngLiteral;
  serviceTier?: TriageServiceTier;
  user?: UserProfile;
  radiusMeters?: number;
  prioritizeOpenAndRight?: boolean;
}): Promise<LivePlaceFacility[]> {
  const {
    placesLib,
    coords,
    serviceTier,
    user,
    radiusMeters = 6000,
    prioritizeOpenAndRight = true,
  } = params;

  const includedTypes =
    serviceTier === 'ห้องฉุกเฉิน' || serviceTier === 'โรงพยาบาล'
      ? ['hospital', 'general_hospital', 'medical_center']
      : serviceTier === 'คลินิก'
      ? ['medical_clinic', 'doctor', 'medical_center']
      : serviceTier === 'ร้านยา'
      ? ['pharmacy', 'drugstore']
      : ['hospital', 'general_hospital', 'medical_center', 'medical_clinic', 'pharmacy'];

  const searchAtRadius = async (radius: number): Promise<LivePlaceFacility[]> => {
    const request: google.maps.places.SearchNearbyRequest = {
      fields: PLACE_SEARCH_FIELDS,
      locationRestriction: {
        center: coords,
        radius: Math.min(Math.max(radius, 500), 50000),
      },
      includedTypes,
      maxResultCount: 20,
      rankPreference: placesLib.SearchNearbyRankPreference.DISTANCE,
      language: 'th',
      region: 'TH',
      internalUsageAttributionIds: [GMP_ATTRIBUTION_ID],
    };

    const { places } = await placesLib.Place.searchNearby(request);
    const enforceThailandFilter = isWithinThailand(coords);
    const validPlaces = (places || []).filter((p) => {
      const loc = toLatLngLiteral(p.location);
      return loc && isValidThaiHealthPlace(p, loc, enforceThailandFilter) && p.businessStatus !== 'CLOSED_PERMANENTLY';
    });

    const built = await Promise.all(
      validPlaces.map((p) => buildLivePlaceFacility(p, coords, user, serviceTier))
    );
    return built.filter((f): f is LivePlaceFacility => f !== null);
  };

  let results = await searchAtRadius(radiusMeters);
  if (results.length === 0 && radiusMeters < 20000) {
    results = await searchAtRadius(20000);
  }
  // If clinic/pharmacy search returned 0 even at 20km, fallback to hospitals nearby so user never gets empty triage recommendation
  if (results.length === 0 && serviceTier && serviceTier !== 'โรงพยาบาล' && serviceTier !== 'ห้องฉุกเฉิน') {
    const fallbackReq: google.maps.places.SearchNearbyRequest = {
      fields: PLACE_SEARCH_FIELDS,
      locationRestriction: { center: coords, radius: 20000 },
      includedTypes: ['hospital', 'general_hospital', 'medical_clinic', 'pharmacy'],
      maxResultCount: 15,
      rankPreference: placesLib.SearchNearbyRankPreference.DISTANCE,
      language: 'th',
      region: 'TH',
      internalUsageAttributionIds: [GMP_ATTRIBUTION_ID],
    };
    const { places } = await placesLib.Place.searchNearby(fallbackReq);
    const enforceThailandFilter = isWithinThailand(coords);
    const validPlaces = (places || []).filter((p) => {
      const loc = toLatLngLiteral(p.location);
      return loc && isValidThaiHealthPlace(p, loc, enforceThailandFilter) && p.businessStatus !== 'CLOSED_PERMANENTLY';
    });
    const built = await Promise.all(
      validPlaces.map((p) => buildLivePlaceFacility(p, coords, user, serviceTier))
    );
    results = built.filter((f): f is LivePlaceFacility => f !== null);
  }

  return sortFacilitiesByPriority(results, prioritizeOpenAndRight, serviceTier === 'ห้องฉุกเฉิน');
}

export function sortFacilitiesByPriority(
  list: LivePlaceFacility[],
  prioritizeOpenAndRight = true,
  emergencyPrefer24h = false
): LivePlaceFacility[] {
  return [...list].sort((a, b) => {
    if (prioritizeOpenAndRight) {
      // 1. Currently Open / 24h status (open = 2, unknown = 1, closed = 0)
      const openRank = (f: LivePlaceFacility) => {
        if (emergencyPrefer24h && f.is24Hours) return 3;
        if (f.isOpenNow === true || f.is24Hours) return 2;
        if (f.isOpenNow === null) return 1;
        return 0;
      };
      const openDiff = openRank(b) - openRank(a);
      if (openDiff !== 0) return openDiff;

      // 2. Healthcare right exact match or compatible tier (within reasonable nearby distance difference)
      const rightTierDiff =
        (b.rightExactMatch ? 2 : b.rightCompatible ? 1 : 0) -
        (a.rightExactMatch ? 2 : a.rightCompatible ? 1 : 0);
      if (rightTierDiff !== 0 && Math.abs(a.distanceKm - b.distanceKm) < 12) {
        return rightTierDiff;
      }
    }

    // 3. Closest distance
    return a.distanceKm - b.distanceKm;
  });
}
