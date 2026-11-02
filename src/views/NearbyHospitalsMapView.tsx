import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  ArrowLeft,
  Navigation,
  Send,
  Building2,
  Compass,
  MapPin,
  Clock,
  Users,
  RefreshCw,
  LocateFixed,
  Filter,
  Check,
} from 'lucide-react';
import L from 'leaflet';
import { Hospital, FacilityCategoryType, RegionType } from '../types';
import { THAILAND_REGIONS_DATA } from '../data/mockData';

interface NearbyHospitalsMapViewProps {
  hospitals: Hospital[];
  onBack: () => void;
  onSelectHospital: (hospital: Hospital) => void;
}

// Haversine formula to compute distance in km
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
}

export const NearbyHospitalsMapView: React.FC<NearbyHospitalsMapViewProps> = ({
  hospitals,
  onBack,
  onSelectHospital,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const routeLineRef = useRef<L.Polyline | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  const [activeHospitalIndex, setActiveHospitalIndex] = useState<number | null>(0);
  const [navigatingHospitalName, setNavigatingHospitalName] = useState<string | null>(null);
  const [routeInfo, setRouteInfo] = useState<{ km: string; mins: number } | null>(null);

  // Live GPS state
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number }>({
    lat: 13.7224,
    lng: 100.3802,
  });
  const [isGpsLive, setIsGpsLive] = useState<boolean>(false);
  const [gpsStatusText, setGpsStatusText] = useState<string>('กำลังจับพิกัด GPS จริงของคุณ...');
  const [isLocating, setIsLocating] = useState<boolean>(false);

  // Filter states
  const [selectedRegion, setSelectedRegion] = useState<string>('ทั้งหมด');
  const [selectedProvince, setSelectedProvince] = useState<string>('ทั้งหมด');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('ทั้งหมด');
  const [selectedFacilityType, setSelectedFacilityType] = useState<string>('ทั้งหมด');

  // Dynamic hospital list with live recalculated distances
  const [dynamicHospitals, setDynamicHospitals] = useState<Hospital[]>(hospitals);

  // Derived available provinces and districts based on selected region
  const availableProvinces = useMemo(() => {
    if (selectedRegion === 'ทั้งหมด') {
      const all: string[] = [];
      THAILAND_REGIONS_DATA.forEach((r) => {
        r.provinces.forEach((p) => {
          if (!all.includes(p.name)) all.push(p.name);
        });
      });
      return all;
    }
    const regionObj = THAILAND_REGIONS_DATA.find((r) => r.region === selectedRegion);
    return regionObj ? regionObj.provinces.map((p) => p.name) : [];
  }, [selectedRegion]);

  const availableDistricts = useMemo(() => {
    if (selectedProvince === 'ทั้งหมด') {
      return [];
    }
    for (const r of THAILAND_REGIONS_DATA) {
      const p = r.provinces.find((prov) => prov.name === selectedProvince);
      if (p) return p.districts;
    }
    return [];
  }, [selectedProvince]);

  // Recalculate and sort hospitals based on GPS location
  const updateHospitalsDistance = (lat: number, lng: number) => {
    setDynamicHospitals((prev) => {
      const updated = prev.map((h) => {
        const dist = calculateDistanceKm(lat, lng, h.coordinates.lat, h.coordinates.lng);
        return {
          ...h,
          distanceKm: dist,
          estWaitMinutes: Math.max(5, Math.round(dist * 2.5 + h.totalWaitingCount * 5)),
        };
      });
      return updated.sort((a, b) => a.distanceKm - b.distanceKm);
    });
  };

  // Function to request real browser GPS location
  const requestLiveGPS = () => {
    if (!navigator.geolocation) {
      setGpsStatusText('เบราว์เซอร์ไม่รองรับ GPS (ใช้พิกัดมาตรฐาน)');
      return;
    }

    setIsLocating(true);
    setGpsStatusText('กำลังค้นหาสัญญาณดาวเทียม GPS สด...');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        const liveCoords = { lat: latitude, lng: longitude };
        setUserLoc(liveCoords);
        setIsGpsLive(true);
        setIsLocating(false);
        setGpsStatusText(`พิกัดจริง GPS สำเร็จ: ±${Math.round(accuracy || 10)}ม. (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`);

        // Update Leaflet user marker
        if (userMarkerRef.current) {
          userMarkerRef.current.setLatLng([latitude, longitude]);
        }
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([latitude, longitude], 14, { duration: 1.2 });
        }

        updateHospitalsDistance(latitude, longitude);
      },
      (err) => {
        setIsLocating(false);
        // Fallback default coordinate (Bangkok Bang Khae)
        const fallback = { lat: 13.7224, lng: 100.3802 };
        setUserLoc(fallback);
        setIsGpsLive(false);
        setGpsStatusText('ใช้พิกัดอ้างอิงศูนย์กลาง (13.7224, 100.3802)');
        updateHospitalsDistance(fallback.lat, fallback.lng);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
      }
    );
  };

  // Trigger GPS on mount
  useEffect(() => {
    requestLiveGPS();
  }, []);

  // Filtered hospital list
  const filteredHospitals = useMemo(() => {
    return dynamicHospitals.filter((h) => {
      const matchRegion = selectedRegion === 'ทั้งหมด' || h.region === selectedRegion;
      const matchProvince = selectedProvince === 'ทั้งหมด' || h.province === selectedProvince;
      const matchDistrict = selectedDistrict === 'ทั้งหมด' || h.district === selectedDistrict;
      const matchType =
        selectedFacilityType === 'ทั้งหมด' ||
        h.facilityType === selectedFacilityType ||
        (selectedFacilityType === 'รพ.รัฐบาล' && (h.type.includes('รัฐ') || h.type.includes('มหาวิทยาลัย'))) ||
        (selectedFacilityType === 'รพ.เอกชน' && h.type.includes('เอกชน')) ||
        (selectedFacilityType === 'ศบส./ศูนย์สาธารณสุข' && (h.type.includes('สาธารณสุข') || h.type.includes('ศบส'))) ||
        (selectedFacilityType === 'คลินิกเวชกรรม/คลินิกชุมชนอบอุ่น' && h.type.includes('คลินิก'));

      return matchRegion && matchProvince && matchDistrict && matchType;
    });
  }, [dynamicHospitals, selectedRegion, selectedProvince, selectedDistrict, selectedFacilityType]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    try {
      const initialMap = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false,
      }).setView([userLoc.lat, userLoc.lng], 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(initialMap);

      // User location marker with pulsing radar effect
      const userIcon = L.divIcon({
        className: 'user-marker-icon',
        html: `
          <div style="position:relative; width:26px; height:26px; display:flex; align-items:center; justify-content:center;">
            <div style="position:absolute; inset:-8px; background:rgba(16,185,129,0.35); border-radius:50%; animation:ping 2s cubic-bezier(0,0,0.2,1) infinite;"></div>
            <div style="position:absolute; inset:-4px; background:rgba(16,185,129,0.5); border-radius:50%;"></div>
            <div style="width:14px; height:14px; background:#059669; border:2.5px solid white; border-radius:50%; box-shadow:0 2px 8px rgba(0,0,0,0.4); z-index:2;"></div>
          </div>
        `,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      });

      const userMarker = L.marker([userLoc.lat, userLoc.lng], {
        icon: userIcon,
        zIndexOffset: 1000,
      }).addTo(initialMap);
      userMarker.bindPopup('<b>📍 ตำแหน่งจริงของคุณ</b><br>อ้างอิงจากสัญญาณพิกัด GPS');
      userMarkerRef.current = userMarker;

      mapInstanceRef.current = initialMap;
    } catch {
      // Map error fallback
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Markers dynamically whenever filtered list changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Clear old hospital markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Add new markers
    filteredHospitals.forEach((h, idx) => {
      const isSelected = activeHospitalIndex === idx;
      const color =
        h.facilityType === 'รพ.เอกชน'
          ? '#2563eb'
          : h.facilityType === 'ศบส./ศูนย์สาธารณสุข'
          ? '#0d9488'
          : h.facilityType === 'คลินิกเวชกรรม/คลินิกชุมชนอบอุ่น'
          ? '#d97706'
          : '#059669'; // รพ.รัฐบาล

      const hospIcon = L.divIcon({
        className: 'hosp-marker-icon',
        html: `
          <div style="position:relative; width:34px; height:42px; display:flex; align-items:center; justify-content:center; cursor:pointer;">
            <svg width="34" height="42" viewBox="0 0 34 42" fill="none">
              <path d="M17 0C7.61 0 0 7.61 0 17C0 29.75 17 42 17 42C17 42 34 29.75 34 17C34 7.61 26.39 0 17 0Z" fill="${color}" filter="drop-shadow(0px 3px 6px rgba(0,0,0,0.35))"/>
              <circle cx="17" cy="17" r="8" fill="white"/>
              <path d="M17 13V21M13 17H21" stroke="${color}" stroke-width="2.2" stroke-linecap="round"/>
            </svg>
          </div>
        `,
        iconSize: [34, 42],
        iconAnchor: [17, 42],
      });

      const marker = L.marker([h.coordinates.lat, h.coordinates.lng], { icon: hospIcon })
        .addTo(mapInstanceRef.current!)
        .bindPopup(`<b>${h.name}</b><br>[${h.facilityType || h.type}]<br>รอ ~${h.estWaitMinutes} นาที`);

      marker.on('click', () => {
        setActiveHospitalIndex(idx);
        handleStartInAppNavigation(h, idx);
      });

      markersRef.current.push(marker);
    });

    // Auto fit map view if filtered to another region/province
    if (filteredHospitals.length > 0 && selectedProvince !== 'ทั้งหมด' && mapInstanceRef.current) {
      const first = filteredHospitals[0];
      mapInstanceRef.current.flyTo([first.coordinates.lat, first.coordinates.lng], 13, { duration: 1.0 });
    }
  }, [filteredHospitals, activeHospitalIndex, selectedProvince]);

  const handleStartInAppNavigation = (hospital: Hospital, idx: number) => {
    setActiveHospitalIndex(idx);
    setNavigatingHospitalName(hospital.name);

    if (!mapInstanceRef.current) return;

    if (routeLineRef.current) {
      mapInstanceRef.current.removeLayer(routeLineRef.current);
      routeLineRef.current = null;
    }

    const start: [number, number] = [userLoc.lat, userLoc.lng];
    const end: [number, number] = [hospital.coordinates.lat, hospital.coordinates.lng];

    const midLat = (start[0] + end[0]) / 2 + 0.003;
    const midLng = (start[1] + end[1]) / 2 + 0.002;
    const pathPoints: [number, number][] = [start, [midLat, midLng], end];

    const polyline = L.polyline(pathPoints, {
      color: '#059669',
      weight: 5,
      opacity: 0.85,
      dashArray: '8, 8',
    }).addTo(mapInstanceRef.current);

    routeLineRef.current = polyline;
    mapInstanceRef.current.fitBounds(polyline.getBounds(), { padding: [40, 40] });

    const dist = calculateDistanceKm(start[0], start[1], end[0], end[1]);
    const mins = Math.max(5, Math.round(dist * 3 + 4));
    setRouteInfo({ km: dist.toFixed(1), mins });
  };

  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut();
  };

  const handleLocateMe = () => {
    requestLiveGPS();
  };

  const FACILITY_TYPE_OPTIONS: { id: string; label: string; badgeClass: string }[] = [
    { id: 'ทั้งหมด', label: 'ทั้งหมด', badgeClass: '' },
    { id: 'รพ.รัฐบาล', label: '[รพ.รัฐบาล]', badgeClass: 'text-emerald-700' },
    { id: 'รพ.เอกชน', label: '[รพ.เอกชน]', badgeClass: 'text-blue-700' },
    { id: 'ศบส./ศูนย์สาธารณสุข', label: '[ศบส./ศูนย์สาธารณสุข]', badgeClass: 'text-teal-700' },
    { id: 'คลินิกเวชกรรม/คลินิกชุมชนอบอุ่น', label: '[คลินิกเวชกรรมชุมชน]', badgeClass: 'text-amber-800' },
  ];

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] select-none">
      {/* Top Header with Back Button */}
      <div className="bg-white/95 backdrop-blur-md px-4 py-3 border-b border-slate-100 flex items-center justify-between z-10 shrink-0">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center justify-center transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="text-center">
          <h2 className="font-heading font-extrabold text-sm sm:text-base text-slate-900 leading-tight">
            สถานพยาบาลใกล้ฉัน & แผนที่ GPS
          </h2>
          <p className="text-[10px] text-emerald-700 font-medium">
            {isGpsLive ? '● จับพิกัด GPS สดอัตโนมัติ' : '● พิกัดอ้างอิงกรุงเทพฯ'}
          </p>
        </div>

        <button
          onClick={requestLiveGPS}
          disabled={isLocating}
          title="รีเฟรชพิกัด GPS ปัจจุบัน"
          className="w-9 h-9 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 flex items-center justify-center transition cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLocating ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Prominent "ใช้พิกัดปัจจุบัน ในแผนที่ (GPS)" Button */}
      <div className="bg-gradient-to-r from-[#163d2d] to-[#1c4c39] px-4 py-2.5 flex items-center justify-between text-white shrink-0 shadow-xs">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${isGpsLive ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
          <p className="text-[11px] font-sans text-emerald-100 truncate">
            {gpsStatusText}
          </p>
        </div>

        <button
          onClick={requestLiveGPS}
          disabled={isLocating}
          className="bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-emerald-950 font-heading font-extrabold text-xs px-3 py-1.5 rounded-xl shadow-xs shrink-0 flex items-center gap-1.5 transition cursor-pointer"
        >
          <LocateFixed className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
          <span>ใช้พิกัดปัจจุบัน ในแผนที่ (GPS)</span>
        </button>
      </div>

      {/* Regional & Area Filters (Cascading Dropdowns) */}
      <div className="bg-white border-b border-slate-200 px-3 py-2 space-y-2 shrink-0">
        <div className="flex items-center gap-1.5 text-xs text-slate-600 font-bold font-heading">
          <Filter className="w-3.5 h-3.5 text-emerald-700" />
          <span>กรองพื้นที่สถานพยาบาล:</span>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          {/* 1. ภูมิภาค Dropdown */}
          <div>
            <label className="block text-[9.5px] font-bold text-slate-500 mb-0.5">ภูมิภาค</label>
            <select
              value={selectedRegion}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedRegion(val);
                setSelectedProvince('ทั้งหมด');
                setSelectedDistrict('ทั้งหมด');
              }}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-[11px] rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-600"
            >
              <option value="ทั้งหมด">ทุกภูมิภาค</option>
              <option value="กทม./ปริมณฑล">กทม./ปริมณฑล</option>
              <option value="ภาคเหนือ">ภาคเหนือ</option>
              <option value="ภาคอีสาน">ภาคอีสาน</option>
              <option value="ภาคใต้">ภาคใต้</option>
              <option value="ภาคกลาง/ตะวันออก">ภาคกลาง/ตะวันออก</option>
            </select>
          </div>

          {/* 2. จังหวัด Dropdown */}
          <div>
            <label className="block text-[9.5px] font-bold text-slate-500 mb-0.5">จังหวัด</label>
            <select
              value={selectedProvince}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedProvince(val);
                setSelectedDistrict('ทั้งหมด');
              }}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-[11px] rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-600"
            >
              <option value="ทั้งหมด">ทุกจังหวัด</option>
              {availableProvinces.map((prov) => (
                <option key={prov} value={prov}>
                  {prov}
                </option>
              ))}
            </select>
          </div>

          {/* 3. เขต/อำเภอ Dropdown */}
          <div>
            <label className="block text-[9.5px] font-bold text-slate-500 mb-0.5">เขต / อำเภอ</label>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              disabled={selectedProvince === 'ทั้งหมด'}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-[11px] rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-600 disabled:opacity-50"
            >
              <option value="ทั้งหมด">ทุกเขต/อำเภอ</option>
              {availableDistricts.map((dist) => (
                <option key={dist} value={dist}>
                  {dist}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Multi-Facility Types Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pt-1">
          {FACILITY_TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setSelectedFacilityType(opt.id)}
              className={`px-2.5 py-1 rounded-full whitespace-nowrap text-[10.5px] font-bold transition cursor-pointer ${
                selectedFacilityType === opt.id
                  ? 'bg-emerald-800 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Map Frame Area */}
      <div className="relative w-full h-[250px] bg-slate-200 shrink-0 overflow-hidden border-b border-slate-200">
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Zoom Controls */}
        <div className="absolute top-3 right-3 z-[400] flex flex-col bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
          <button
            onClick={handleZoomIn}
            className="w-8 h-8 flex items-center justify-center text-slate-800 hover:bg-slate-50 font-bold border-b border-slate-100 text-base cursor-pointer"
          >
            +
          </button>
          <button
            onClick={handleZoomOut}
            className="w-8 h-8 flex items-center justify-center text-slate-800 hover:bg-slate-50 font-bold text-base cursor-pointer"
          >
            −
          </button>
        </div>

        {/* Locate Me Floating Button */}
        <button
          onClick={handleLocateMe}
          className="absolute bottom-3 left-3 z-[400] bg-white text-slate-800 hover:text-emerald-700 px-3 py-1.5 rounded-full text-xs font-heading font-bold shadow-md border border-slate-200 flex items-center gap-1.5 transition cursor-pointer"
        >
          <LocateFixed className="w-3.5 h-3.5 text-emerald-600" />
          <span>จับพิกัดฉันสด</span>
        </button>
      </div>

      {/* In-app Navigation Route Banner */}
      {navigatingHospitalName && routeInfo && (
        <div className="bg-emerald-900 text-white px-4 py-2.5 flex items-center justify-between text-xs font-heading animate-in fade-in duration-200 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>
              กำลังนำทางไปยัง <strong>{navigatingHospitalName}</strong> (~{routeInfo.km} กม. · {routeInfo.mins} นาที)
            </span>
          </div>
          <button
            onClick={() => {
              setNavigatingHospitalName(null);
              setRouteInfo(null);
              if (routeLineRef.current && mapInstanceRef.current) {
                mapInstanceRef.current.removeLayer(routeLineRef.current);
                routeLineRef.current = null;
              }
            }}
            className="text-[10px] text-emerald-200 hover:text-white underline cursor-pointer"
          >
            ยกเลิกเส้นทาง
          </button>
        </div>
      )}

      {/* Hospital List Area */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5 no-scrollbar">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-heading font-extrabold text-xs sm:text-sm text-slate-900">
            สถานพยาบาลที่พบ ({filteredHospitals.length} แห่ง)
          </h3>
          <span className="text-[10.5px] text-slate-500 font-medium">
            เรียงตามระยะทางจากพิกัด GPS
          </span>
        </div>

        {filteredHospitals.length === 0 ? (
          <div className="text-center py-10 px-4 bg-white rounded-2xl border border-slate-200">
            <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-700 font-heading">ไม่พบสถานพยาบาลตามตัวกรองที่ระบุ</p>
            <p className="text-[11px] text-slate-400 mt-1">ลองเปลี่ยนภูมิภาคหรือเลือกประเภทสถานพยาบาลทั้งหมด</p>
            <button
              onClick={() => {
                setSelectedRegion('ทั้งหมด');
                setSelectedProvince('ทั้งหมด');
                setSelectedDistrict('ทั้งหมด');
                setSelectedFacilityType('ทั้งหมด');
              }}
              className="mt-3 px-3.5 py-1.5 text-xs bg-emerald-700 text-white rounded-xl font-bold cursor-pointer"
            >
              รีเซ็ตตัวกรองทั้งหมด
            </button>
          </div>
        ) : (
          filteredHospitals.map((hospital, idx) => {
            const isSelected = activeHospitalIndex === idx;
            const isNavigatingThis = navigatingHospitalName === hospital.name;

            return (
              <div
                key={hospital.id}
                className={`bg-white rounded-[22px] p-3.5 border transition-all duration-150 card-shadow relative ${
                  isSelected
                    ? 'border-emerald-600 ring-1 ring-emerald-500/20'
                    : 'border-slate-100 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  {/* Left Type Icon */}
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                      (hospital.facilityType || hospital.type).includes('เอกชน')
                        ? 'bg-blue-50 text-blue-700'
                        : (hospital.facilityType || hospital.type).includes('สาธารณสุข') || (hospital.facilityType || hospital.type).includes('ศบส')
                        ? 'bg-teal-50 text-teal-700'
                        : (hospital.facilityType || hospital.type).includes('คลินิก')
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-emerald-50 text-emerald-700'
                    }`}
                  >
                    <Building2 className="w-5 h-5" />
                  </div>

                  {/* Center Hospital Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="font-heading font-bold text-xs sm:text-sm text-slate-900 leading-snug">
                        {hospital.name}
                      </h4>
                      {/* Explicit Requested Multi-Facility Tags */}
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
                    </div>

                    <p className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span>{hospital.district}, {hospital.province}</span>
                    </p>

                    <p className="text-[11px] text-slate-500 mt-1 font-medium">
                      {hospital.congestionPct < 40
                        ? 'คนใช้น้อย'
                        : hospital.congestionPct < 70
                        ? 'คนใช้ปานกลาง'
                        : 'คนใช้หนาแน่น'}{' '}
                      · รอ ~{hospital.estWaitMinutes} นาที · ห่าง {hospital.distanceKm} กม.
                    </p>

                    {/* Start In-app Navigation & Action Buttons */}
                    <div className="flex items-center gap-2 mt-2.5">
                      <button
                        onClick={() => handleStartInAppNavigation(hospital, idx)}
                        className={`text-xs font-heading font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-xs ${
                          isNavigatingThis
                            ? 'bg-emerald-700 text-white'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        <Navigation className="w-3.5 h-3.5" />
                        <span>{isNavigatingThis ? 'กำลังนำทาง...' : 'เริ่มนำทางในแอป'}</span>
                      </button>

                      <button
                        onClick={() => onSelectHospital(hospital)}
                        className="text-xs font-heading font-semibold px-2.5 py-1.5 rounded-xl text-slate-600 hover:bg-slate-100 border border-slate-200 cursor-pointer transition"
                      >
                        จองคิว
                      </button>
                    </div>
                  </div>

                  {/* Right Green Circle Arrow Button for Google Maps */}
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&origin=${userLoc.lat},${userLoc.lng}&destination=${hospital.coordinates.lat},${hospital.coordinates.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    title="เปิดเส้นทางนำทางใน Google Maps"
                    className="w-10 h-10 rounded-full bg-[#1c4c39] hover:bg-[#153c2c] text-white flex items-center justify-center shrink-0 shadow-md transition cursor-pointer active:scale-95"
                  >
                    <Send className="w-4 h-4" />
                  </a>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
