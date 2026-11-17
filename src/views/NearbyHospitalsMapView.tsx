import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import {
  ArrowLeft,
  Navigation,
  Send,
  Building2,
  MapPin,
  Clock,
  RefreshCw,
  LocateFixed,
  Search,
  Star,
  Phone,
  Car,
  Footprints,
  Bike,
  TrainFront,
  CornerUpLeft,
  CornerUpRight,
  ArrowUp,
  RotateCcw,
  Flag,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  X,
  Compass,
  AlertCircle,
  Loader2,
  Crosshair,
  Check,
  ShieldCheck,
} from 'lucide-react';
import {
  Map as GoogleMap,
  AdvancedMarker,
  InfoWindow,
  useMap,
  useMapsLibrary,
  useAdvancedMarkerRef,
  type MapMouseEvent,
} from '@vis.gl/react-google-maps';
import { Hospital, UserProfile } from '../types';
import {
  buildLivePlaceFacility,
  calculateDistanceKm,
  DEFAULT_THAILAND_CENTER,
  extractAreaDetails,
  facilityToHospitalBridge,
  GMP_ATTRIBUTION_ID,
  hasForeignScript,
  isQuotaError,
  isValidThaiHealthPlace,
  isWithinThailand,
  LivePlaceFacility,
  PLACE_SEARCH_FIELDS,
  sortFacilitiesByPriority,
  toLatLngLiteral,
} from '../services/realPlaces';

interface NearbyHospitalsMapViewProps {
  hospitals?: Hospital[];
  user?: UserProfile;
  initialFocusFacility?: LivePlaceFacility | null;
  onBack: () => void;
  onSelectHospital: (hospital: Hospital) => void;
}

type FacilityCategoryFilter = 'all' | 'hospital' | 'clinic' | 'pharmacy';
type TravelModeOption = 'DRIVING' | 'TWO_WHEELER' | 'WALKING' | 'TRANSIT';
type LocationSourceMode = 'detecting' | 'gps' | 'manual' | 'pinned' | 'fallback';

interface AutocompleteItem {
  placeId: string;
  mainText: string;
  secondaryText: string;
  fullText: string;
  types: string[];
  prediction: google.maps.places.PlacePrediction;
}

interface NavigationStep {
  index: number;
  instruction: string;
  maneuver: string;
  distanceMeters: number;
  distanceText: string;
  durationText: string;
  startLocation: google.maps.LatLngLiteral | null;
  endLocation: google.maps.LatLngLiteral | null;
}

interface ComputedRouteSummary {
  destinationId: string;
  destinationName: string;
  destinationLocation: google.maps.LatLngLiteral;
  destinationURI: string | null;
  travelMode: TravelModeOption;
  distanceMeters: number;
  distanceText: string;
  durationMillis: number;
  durationText: string;
  steps: NavigationStep[];
  warnings: string[];
}

const HEALTH_FACILITY_TYPES = new Set([
  'hospital',
  'general_hospital',
  'medical_center',
  'medical_clinic',
  'pharmacy',
  'drugstore',
  'doctor',
  'dental_clinic',
  'dentist',
  'physiotherapist',
  'medical_lab',
  'chiropractor',
]);

function formatDistanceMeters(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} กม.`;
  }
  return `${Math.round(meters)} ม.`;
}

function formatDurationMillis(millis: number): string {
  const totalMinutes = Math.max(1, Math.round(millis / 60000));
  if (totalMinutes >= 60) {
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return mins > 0 ? `${hrs} ชม. ${mins} นาที` : `${hrs} ชม.`;
  }
  return `${totalMinutes} นาที`;
}

function getManeuverIcon(maneuver: string) {
  const m = maneuver.toUpperCase();
  if (m.includes('LEFT') || m.includes('UTURN_LEFT')) {
    return m.includes('UTURN') ? <RotateCcw className="w-5 h-5" /> : <CornerUpLeft className="w-5 h-5" />;
  }
  if (m.includes('RIGHT') || m.includes('UTURN_RIGHT')) {
    return m.includes('UTURN') ? (
      <RotateCcw className="w-5 h-5 scale-x-[-1]" />
    ) : (
      <CornerUpRight className="w-5 h-5" />
    );
  }
  if (m.includes('DESTINATION') || m.includes('ARRIVE')) {
    return <Flag className="w-5 h-5" />;
  }
  return <ArrowUp className="w-5 h-5" />;
}

interface FacilityMarkerProps {
  facility: LivePlaceFacility;
  isSelected: boolean;
  isNavigating: boolean;
  onSelect: (facility: LivePlaceFacility, marker: google.maps.marker.AdvancedMarkerElement) => void;
}

const FacilityMarker: React.FC<FacilityMarkerProps> = ({
  facility,
  isSelected,
  isNavigating,
  onSelect,
}) => {
  const [markerRef, marker] = useAdvancedMarkerRef();

  const colors =
    facility.category === 'hospital'
      ? { bg: '#059669', label: 'H' }
      : facility.category === 'clinic'
      ? { bg: '#d97706', label: 'C' }
      : { bg: '#0284c7', label: 'Rx' };

  return (
    <AdvancedMarker
      ref={markerRef}
      position={facility.location}
      title={facility.name}
      zIndex={isNavigating ? 1000 : isSelected ? 900 : 100}
      onClick={() => {
        if (marker) {
          onSelect(facility, marker);
        }
      }}
    >
      <div
        className={`relative flex flex-col items-center cursor-pointer transition-transform duration-150 ${
          isSelected || isNavigating ? 'scale-125' : 'hover:scale-110'
        }`}
      >
        <div
          className="px-2 py-1 rounded-full shadow-lg border-2 border-white flex items-center gap-1 text-white font-heading font-bold text-[10px]"
          style={{
            backgroundColor: isNavigating ? '#163d2d' : colors.bg,
          }}
        >
          <span className="font-mono font-extrabold">{colors.label}</span>
          {(isSelected || isNavigating) && (
            <span className="max-w-[115px] truncate">{facility.name}</span>
          )}
        </div>
        <div
          className="w-0 h-0 border-l-[5px] border-r-[5px] border-t-[6px] border-l-transparent border-r-transparent -mt-[1px]"
          style={{ borderTopColor: isNavigating ? '#163d2d' : colors.bg }}
        />
      </div>
    </AdvancedMarker>
  );
};

interface RouteOverlayControllerProps {
  origin: google.maps.LatLngLiteral;
  destination: google.maps.LatLngLiteral | null;
  destinationId: string | null;
  destinationName: string | null;
  destinationURI: string | null;
  travelMode: TravelModeOption;
  followUser: boolean;
  onRouteComputed: (summary: ComputedRouteSummary | null) => void;
  onRouteLoading: (loading: boolean) => void;
  onRouteError: (error: string | null) => void;
  focusStepLocation: google.maps.LatLngLiteral | null;
}

const RouteOverlayController: React.FC<RouteOverlayControllerProps> = ({
  origin,
  destination,
  destinationId,
  destinationName,
  destinationURI,
  travelMode,
  followUser,
  onRouteComputed,
  onRouteLoading,
  onRouteError,
  focusStepLocation,
}) => {
  const map = useMap();
  const routesLib = useMapsLibrary('routes');
  const polylinesRef = useRef<google.maps.Polyline[]>([]);
  const lastFittedKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!map || !focusStepLocation) return;
    map.panTo(focusStepLocation);
    const z = map.getZoom();
    if (!z || z < 16) {
      map.setZoom(16);
    }
  }, [map, focusStepLocation]);

  useEffect(() => {
    if (!map || !followUser || !destination) return;
    map.panTo(origin);
    const z = map.getZoom();
    if (!z || z < 16) {
      map.setZoom(16);
    }
  }, [map, followUser, origin.lat, origin.lng, destination]);

  useEffect(() => {
    polylinesRef.current.forEach((p) => p.setMap(null));
    polylinesRef.current = [];

    if (!routesLib || !map || !destination || !destinationId || !destinationName) {
      onRouteComputed(null);
      onRouteError(null);
      lastFittedKeyRef.current = null;
      return;
    }

    let isCancelled = false;
    onRouteLoading(true);
    onRouteError(null);

    const isMotorized = travelMode === 'DRIVING' || travelMode === 'TWO_WHEELER';
    const request: google.maps.routes.ComputeRoutesRequest = {
      origin: { lat: origin.lat, lng: origin.lng },
      destination: { lat: destination.lat, lng: destination.lng },
      travelMode,
      ...(isMotorized ? { routingPreference: 'TRAFFIC_AWARE' as const } : {}),
      fields: [
        'path',
        'distanceMeters',
        'durationMillis',
        'viewport',
        'legs',
        'localizedValues',
        'warnings',
      ],
      language: 'th',
      region: 'TH',
      internalUsageAttributionIds: [GMP_ATTRIBUTION_ID],
    };

    routesLib.Route.computeRoutes(request)
      .then(({ routes }) => {
        if (isCancelled) return;
        onRouteLoading(false);

        if (!routes || routes.length === 0) {
          onRouteComputed(null);
          onRouteError('ไม่พบเส้นทางสำหรับการเดินทางรูปแบบนี้ กรุณาลองเปลี่ยนรูปแบบการเดินทาง');
          return;
        }

        const route = routes[0];
        const createdPolylines = route.createPolylines();
        createdPolylines.forEach((polyline) => {
          if (travelMode !== 'TRANSIT') {
            polyline.setOptions({
              strokeColor: travelMode === 'WALKING' ? '#0284c7' : '#059669',
              strokeOpacity: 0.92,
              strokeWeight: 6,
              zIndex: 20,
            });
          } else {
            polyline.setOptions({ zIndex: 20 });
          }
          polyline.setMap(map);
        });
        polylinesRef.current = createdPolylines;

        const routeKey = `${destinationId}:${travelMode}`;
        if (route.viewport && lastFittedKeyRef.current !== routeKey && !followUser) {
          map.fitBounds(route.viewport, { top: 48, right: 32, bottom: 48, left: 32 });
          lastFittedKeyRef.current = routeKey;
        }

        const steps: NavigationStep[] = [];
        let stepCounter = 0;
        (route.legs || []).forEach((leg) => {
          (leg.steps || []).forEach((step) => {
            stepCounter += 1;
            const rawInstruction = (step.instructions || 'เดินทางต่อไปตามเส้นทาง')
              .replace(/<[^>]+>/g, ' ')
              .replace(/\s+/g, ' ')
              .trim();
            steps.push({
              index: stepCounter,
              instruction: rawInstruction,
              maneuver: step.maneuver || 'STRAIGHT',
              distanceMeters: step.distanceMeters || 0,
              distanceText:
                step.localizedValues?.distance || formatDistanceMeters(step.distanceMeters || 0),
              durationText: step.localizedValues?.staticDuration || '',
              startLocation: toLatLngLiteral(step.startLocation),
              endLocation: toLatLngLiteral(step.endLocation),
            });
          });
        });

        const totalMeters = route.distanceMeters ?? 0;
        const totalMillis = route.durationMillis ?? 0;

        onRouteComputed({
          destinationId,
          destinationName,
          destinationLocation: destination,
          destinationURI,
          travelMode,
          distanceMeters: totalMeters,
          distanceText: route.localizedValues?.distance || formatDistanceMeters(totalMeters),
          durationMillis: totalMillis,
          durationText: route.localizedValues?.duration || formatDurationMillis(totalMillis),
          steps,
          warnings: route.warnings || [],
        });
      })
      .catch((err) => {
        if (isCancelled) return;
        onRouteLoading(false);
        if (isQuotaError(err)) {
          window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
        }
        onRouteComputed(null);
        onRouteError(
          'ไม่สามารถคำนวณเส้นทางได้ในขณะนี้ (รูปแบบการเดินทางอาจไม่รองรับในเส้นทางนี้)'
        );
      });

    return () => {
      isCancelled = true;
      polylinesRef.current.forEach((p) => p.setMap(null));
      polylinesRef.current = [];
    };
  }, [
    routesLib,
    map,
    origin.lat,
    origin.lng,
    destination?.lat,
    destination?.lng,
    destinationId,
    destinationName,
    destinationURI,
    travelMode,
  ]);

  return null;
};

interface MapCameraSyncProps {
  center: google.maps.LatLngLiteral;
  triggerCount: number;
  zoom?: number;
}

const MapCameraSync: React.FC<MapCameraSyncProps> = ({ center, triggerCount, zoom = 15 }) => {
  const map = useMap();
  useEffect(() => {
    if (!map || triggerCount === 0) return;
    map.panTo(center);
    map.setZoom(zoom);
  }, [map, center.lat, center.lng, triggerCount, zoom]);
  return null;
};

export const NearbyHospitalsMapView: React.FC<NearbyHospitalsMapViewProps> = ({
  user,
  initialFocusFacility,
  onBack,
  onSelectHospital,
}) => {
  const placesLib = useMapsLibrary('places');

  // Real GPS & Search Center State
  const [userLoc, setUserLoc] = useState<google.maps.LatLngLiteral>(DEFAULT_THAILAND_CENTER);
  const [searchCenter, setSearchCenter] = useState<google.maps.LatLngLiteral>(DEFAULT_THAILAND_CENTER);
  const [cameraTrigger, setCameraTrigger] = useState<number>(0);
  const [cameraZoom, setCameraZoom] = useState<number>(15);

  const [locationSource, setLocationSource] = useState<LocationSourceMode>('detecting');
  const [isInitialLocatePending, setIsInitialLocatePending] = useState<boolean>(true);
  const [isLocating, setIsLocating] = useState<boolean>(true);
  const [gpsPermissionDenied, setGpsPermissionDenied] = useState<boolean>(false);
  const [outsideThailandCoords, setOutsideThailandCoords] =
    useState<google.maps.LatLngLiteral | null>(null);
  const [gpsAccuracyMeters, setGpsAccuracyMeters] = useState<number | null>(null);
  const [gpsStatusText, setGpsStatusText] = useState<string>('กำลังตรวจจับพิกัด GPS ปัจจุบันของคุณ...');
  const [detectedAreaName, setDetectedAreaName] = useState<string | null>(null);
  const [isWatchingPosition, setIsWatchingPosition] = useState<boolean>(false);
  const [isPinningMode, setIsPinningMode] = useState<boolean>(false);
  const watchIdRef = useRef<number | null>(null);
  const userLocRef = useRef<google.maps.LatLngLiteral>(userLoc);
  userLocRef.current = userLoc;
  const locationSourceRef = useRef<LocationSourceMode>(locationSource);
  locationSourceRef.current = locationSource;

  // Places Search & Autocomplete State
  const [categoryFilter, setCategoryFilter] = useState<FacilityCategoryFilter>('all');
  const [onlyOpenNow, setOnlyOpenNow] = useState<boolean>(false);
  const [onlyRightCompatible, setOnlyRightCompatible] = useState<boolean>(false);
  const [radiusMeters, setRadiusMeters] = useState<number>(5000);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [suggestions, setSuggestions] = useState<AutocompleteItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState<boolean>(false);
  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);

  const [facilities, setFacilities] = useState<LivePlaceFacility[]>([]);
  const [isSearchingPlaces, setIsSearchingPlaces] = useState<boolean>(false);
  const [placesError, setPlacesError] = useState<string | null>(null);

  // Selection & InfoWindow State
  const [selectedFacility, setSelectedFacility] = useState<LivePlaceFacility | null>(
    initialFocusFacility || null
  );
  const [selectedMarker, setSelectedMarker] = useState<google.maps.marker.AdvancedMarkerElement | null>(
    null
  );

  // Real Routes Navigation State
  const [navTarget, setNavTarget] = useState<LivePlaceFacility | null>(
    initialFocusFacility || null
  );
  const [travelMode, setTravelMode] = useState<TravelModeOption>('DRIVING');
  const [computedRoute, setComputedRoute] = useState<ComputedRouteSummary | null>(null);
  const [isRouteLoading, setIsRouteLoading] = useState<boolean>(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [followUserCamera, setFollowUserCamera] = useState<boolean>(false);
  const [activeStepIdx, setActiveStepIdx] = useState<number>(0);
  const [focusStepLocation, setFocusStepLocation] = useState<google.maps.LatLngLiteral | null>(null);
  const [showAllSteps, setShowAllSteps] = useState<boolean>(true);
  const [isMapExpanded, setIsMapExpanded] = useState<boolean>(Boolean(initialFocusFacility));

  const isGpsLive = locationSource === 'gps';

  // Detect live GPS
  const requestLiveGPS = useCallback((moveCamera = true, allowOutsideThailand = false) => {
    if (!('geolocation' in navigator)) {
      setLocationSource('fallback');
      setIsLocating(false);
      setIsInitialLocatePending(false);
      setGpsStatusText('เบราว์เซอร์ไม่รองรับ GPS · พิมพ์ค้นหาพื้นที่ในไทยหรือปักหมุดบนแผนที่ได้');
      return;
    }

    setIsLocating(true);
    setGpsPermissionDenied(false);
    setOutsideThailandCoords(null);
    setGpsStatusText('กำลังจับพิกัด GPS ปัจจุบันของคุณ...');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: google.maps.LatLngLiteral = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        const accuracy = pos.coords.accuracy ? Math.round(pos.coords.accuracy) : null;
        setGpsAccuracyMeters(accuracy);
        setIsLocating(false);
        setIsInitialLocatePending(false);

        if (!allowOutsideThailand && !isWithinThailand(coords)) {
          setOutsideThailandCoords(coords);
          setLocationSource('fallback');
          setUserLoc(DEFAULT_THAILAND_CENTER);
          setSearchCenter(DEFAULT_THAILAND_CENTER);
          setGpsStatusText(
            `พิกัดเครือข่าย (${coords.lat.toFixed(2)}, ${coords.lng.toFixed(
              2
            )}) อยู่นอกประเทศไทย · แสดงพื้นที่เริ่มต้นในไทย (ค้นหา/ปักหมุดพื้นที่จริงของคุณได้)`
          );
          if (moveCamera) {
            setCameraZoom(14);
            setCameraTrigger((c) => c + 1);
          }
          return;
        }

        setOutsideThailandCoords(null);
        setUserLoc(coords);
        setSearchCenter(coords);
        setLocationSource('gps');
        setDetectedAreaName(null);
        setGpsStatusText(
          `จับตำแหน่งจริงสำเร็จ (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`
        );
        if (moveCamera) {
          setCameraZoom(15);
          setCameraTrigger((c) => c + 1);
        }
      },
      (err) => {
        setIsLocating(false);
        setIsInitialLocatePending(false);
        setLocationSource('fallback');
        const denied = err.code === err.PERMISSION_DENIED;
        setGpsPermissionDenied(denied);
        const reason = denied
          ? 'เบราว์เซอร์ยังไม่ได้อนุญาตสิทธิ์ตำแหน่ง (GPS)'
          : 'ไม่สามารถรับสัญญาณ GPS ได้ในขณะนี้';
        setGpsStatusText(`${reason} · พิมพ์ค้นหาพื้นที่ของคุณหรือแตะปักหมุดบนแผนที่`);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, []);

  useEffect(() => {
    requestLiveGPS(true);
    return () => {
      if (watchIdRef.current !== null && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [requestLiveGPS]);

  // Continuous live GPS watchPosition when navigating or live-tracking is active
  useEffect(() => {
    const shouldWatch = (Boolean(navTarget) || isWatchingPosition) && locationSource === 'gps';
    if (!shouldWatch || !('geolocation' in navigator)) {
      if (watchIdRef.current !== null && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const nextCoords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        if (!isWithinThailand(nextCoords) && !outsideThailandCoords) return;
        setUserLoc(nextCoords);
        setGpsAccuracyMeters(pos.coords.accuracy ? Math.round(pos.coords.accuracy) : null);
        setGpsStatusText(
          `ติดตามตำแหน่งสด: ${nextCoords.lat.toFixed(4)}, ${nextCoords.lng.toFixed(4)}`
        );
      },
      () => {
        // Ignore transient watch timeouts
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 2000,
      }
    );

    return () => {
      if (watchIdRef.current !== null && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [navTarget, isWatchingPosition, locationSource, outsideThailandCoords]);

  // Auto-advance closest navigation step as user moves
  useEffect(() => {
    if (!computedRoute || computedRoute.steps.length === 0 || !isGpsLive) return;
    let bestIdx = 0;
    let bestDist = Number.POSITIVE_INFINITY;
    computedRoute.steps.forEach((step, idx) => {
      const targetPt = step.startLocation || step.endLocation;
      if (!targetPt) return;
      const d = calculateDistanceKm(userLoc, targetPt);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = idx;
      }
    });
    if (bestDist < 0.5) {
      setActiveStepIdx(bestIdx);
    }
  }, [userLoc.lat, userLoc.lng, computedRoute, isGpsLive]);

  const mapPlacesToFacilities = useCallback(
    async (
      places: google.maps.places.Place[],
      referenceOrigin: google.maps.LatLngLiteral,
      enforceThailandFilter: boolean
    ): Promise<LivePlaceFacility[]> => {
      const valid = places.filter((place) => {
        const loc = toLatLngLiteral(place.location);
        return (
          loc &&
          isValidThaiHealthPlace(place, loc, enforceThailandFilter) &&
          place.businessStatus !== 'CLOSED_PERMANENTLY'
        );
      });

      const built = await Promise.all(
        valid.map((place) => buildLivePlaceFacility(place, referenceOrigin, user))
      );
      const cleanList = built.filter((f): f is LivePlaceFacility => f !== null);
      return sortFacilitiesByPriority(cleanList, true, false);
    },
    [user]
  );

  // Nearby Search using Places API (New): Place.searchNearby()
  const runNearbySearch = useCallback(
    async (
      center: google.maps.LatLngLiteral,
      filter: FacilityCategoryFilter,
      radius: number
    ) => {
      if (!placesLib) return;
      setIsSearchingPlaces(true);
      setPlacesError(null);

      const includedTypes =
        filter === 'hospital'
          ? ['hospital', 'general_hospital', 'medical_center']
          : filter === 'clinic'
          ? ['medical_clinic', 'dental_clinic', 'physiotherapist', 'medical_lab']
          : filter === 'pharmacy'
          ? ['pharmacy', 'drugstore']
          : ['hospital', 'general_hospital', 'medical_center', 'medical_clinic', 'pharmacy'];

      const enforceThailandFilter = isWithinThailand(center);

      try {
        const request: google.maps.places.SearchNearbyRequest = {
          fields: PLACE_SEARCH_FIELDS,
          locationRestriction: {
            center,
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
        const mapped = await mapPlacesToFacilities(
          places || [],
          userLocRef.current,
          enforceThailandFilter
        );
        setFacilities(mapped);

        if (mapped.length > 0 && mapped[0].areaSummary) {
          setDetectedAreaName((prev) =>
            locationSourceRef.current === 'manual' && prev ? prev : mapped[0].areaSummary
          );
        }
      } catch (err) {
        if (isQuotaError(err)) {
          window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
        }
        setPlacesError('ไม่สามารถดึงข้อมูลสถานพยาบาลใกล้เคียงได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง');
      } finally {
        setIsSearchingPlaces(false);
      }
    },
    [placesLib, mapPlacesToFacilities]
  );

  // Trigger Nearby Search once initial GPS attempt settles and whenever searchCenter/filter/radius changes
  useEffect(() => {
    if (!placesLib || isInitialLocatePending) return;
    void runNearbySearch(searchCenter, categoryFilter, radiusMeters);
  }, [
    placesLib,
    isInitialLocatePending,
    searchCenter.lat,
    searchCenter.lng,
    categoryFilter,
    radiusMeters,
    runNearbySearch,
  ]);

  // Real Google Places Autocomplete (restricted to Thailand 'th')
  useEffect(() => {
    if (!placesLib || navTarget) {
      setSuggestions([]);
      return;
    }

    const trimmed = searchQuery.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setIsFetchingSuggestions(false);
      return;
    }

    let isCancelled = false;
    setIsFetchingSuggestions(true);

    const timer = window.setTimeout(async () => {
      try {
        if (!sessionTokenRef.current) {
          sessionTokenRef.current = new placesLib.AutocompleteSessionToken();
        }

        const request: google.maps.places.AutocompleteRequest = {
          input: trimmed,
          includedRegionCodes: ['th'],
          language: 'th',
          region: 'TH',
          locationBias: {
            center: searchCenter,
            radius: 50000,
          },
          sessionToken: sessionTokenRef.current,
          internalUsageAttributionIds: [GMP_ATTRIBUTION_ID],
        };

        const { suggestions: rawSuggestions } =
          await placesLib.AutocompleteSuggestion.fetchAutocompleteSuggestions(request);

        if (isCancelled) return;

        const cleanItems: AutocompleteItem[] = [];
        (rawSuggestions || []).forEach((s) => {
          const pred = s.placePrediction;
          if (!pred) return;
          const mainText = pred.mainText?.text || pred.text?.text || '';
          const secondaryText = pred.secondaryText?.text || '';
          const fullText = pred.text?.text || `${mainText} ${secondaryText}`.trim();
          if (!mainText || hasForeignScript(mainText) || hasForeignScript(secondaryText)) return;

          cleanItems.push({
            placeId: pred.placeId,
            mainText,
            secondaryText,
            fullText,
            types: pred.types || [],
            prediction: pred,
          });
        });

        setSuggestions(cleanItems);
        setShowSuggestions(cleanItems.length > 0);
      } catch (err) {
        if (isQuotaError(err)) {
          window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
        }
        if (!isCancelled) {
          setSuggestions([]);
        }
      } finally {
        if (!isCancelled) {
          setIsFetchingSuggestions(false);
        }
      }
    }, 280);

    return () => {
      isCancelled = true;
      window.clearTimeout(timer);
    };
  }, [placesLib, searchQuery, searchCenter.lat, searchCenter.lng, navTarget]);

  const handleSelectAutocompleteItem = async (
    item: AutocompleteItem,
    forceSetAsMyLocation = false
  ) => {
    if (!placesLib) return;
    setShowSuggestions(false);
    setSuggestions([]);
    setSearchQuery(item.mainText);
    setPlacesError(null);

    try {
      const place = item.prediction.toPlace();
      await place.fetchFields({
        fields: PLACE_SEARCH_FIELDS,
      });
      sessionTokenRef.current = null;

      const loc = toLatLngLiteral(place.location);
      if (!loc) {
        setPlacesError('ไม่พบพิกัดของสถานที่ที่เลือก กรุณาลองเลือกสถานที่อื่น');
        return;
      }

      const areaDetails = extractAreaDetails(place);
      const isHealthPlace =
        !forceSetAsMyLocation &&
        ((place.primaryType && HEALTH_FACILITY_TYPES.has(place.primaryType)) ||
          (place.types || []).some((t) => HEALTH_FACILITY_TYPES.has(t)));

      if (isHealthPlace) {
        setSearchCenter(loc);
        setCameraZoom(15);
        setCameraTrigger((c) => c + 1);
        setDetectedAreaName(areaDetails.areaSummary || item.mainText);

        const mapped = await mapPlacesToFacilities([place], userLoc, isWithinThailand(loc));
        if (mapped.length > 0) {
          setSelectedFacility(mapped[0]);
        }
      } else {
        // Set as user's exact current/starting location!
        setUserLoc(loc);
        setSearchCenter(loc);
        setLocationSource('manual');
        setGpsPermissionDenied(false);
        setOutsideThailandCoords(null);
        setSelectedFacility(null);
        setSelectedMarker(null);
        setDetectedAreaName(place.displayName || areaDetails.areaSummary || item.mainText);
        setGpsStatusText(`ตำแหน่งที่เลือก: ${place.displayName || item.mainText}`);
        setCameraZoom(15);
        setCameraTrigger((c) => c + 1);
      }
    } catch (err) {
      if (isQuotaError(err)) {
        window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
      }
      setPlacesError('ไม่สามารถดึงข้อมูลพิกัดของสถานที่นี้ได้ กรุณาลองใหม่อีกครั้ง');
    }
  };

  // Text Search using Places API (New): Place.searchByText()
  const handleTextSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!placesLib || !searchQuery.trim()) return;

    setShowSuggestions(false);
    setIsSearchingPlaces(true);
    setPlacesError(null);
    setSelectedFacility(null);
    setSelectedMarker(null);

    try {
      const trimmed = searchQuery.trim();
      const request: google.maps.places.SearchByTextRequest = {
        textQuery: `${trimmed} โรงพยาบาล คลินิก ร้านยา`,
        fields: PLACE_SEARCH_FIELDS,
        locationBias: {
          center: searchCenter,
          radius: 30000,
        },
        maxResultCount: 20,
        language: 'th',
        region: 'TH',
        internalUsageAttributionIds: [GMP_ATTRIBUTION_ID],
      };

      const { places } = await placesLib.Place.searchByText(request);
      const mapped = await mapPlacesToFacilities(places || [], userLoc, true);
      setFacilities(mapped);

      if (mapped.length > 0) {
        setSearchCenter(mapped[0].location);
        setCameraZoom(14);
        setCameraTrigger((c) => c + 1);
        if (mapped[0].areaSummary) {
          setDetectedAreaName(mapped[0].areaSummary);
        }
      } else {
        setPlacesError(`ไม่พบสถานพยาบาลในไทยที่ตรงกับ "${trimmed}"`);
      }
    } catch (err) {
      if (isQuotaError(err)) {
        window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
      }
      setPlacesError('การค้นหาสถานที่ล้มเหลว กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsSearchingPlaces(false);
    }
  };

  const applyPinnedLocation = useCallback((coords: google.maps.LatLngLiteral) => {
    setUserLoc(coords);
    setSearchCenter(coords);
    setLocationSource('pinned');
    setGpsPermissionDenied(false);
    setOutsideThailandCoords(null);
    setDetectedAreaName(null);
    setSelectedFacility(null);
    setSelectedMarker(null);
    setIsPinningMode(false);
    setGpsStatusText(`ปักหมุดตำแหน่งของคุณ (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`);
    setCameraZoom(15);
    setCameraTrigger((c) => c + 1);
  }, []);

  const handleMapClick = (event: MapMouseEvent) => {
    if (isPinningMode && event.detail.latLng) {
      applyPinnedLocation(event.detail.latLng);
      return;
    }
    if (selectedFacility) {
      setSelectedFacility(null);
      setSelectedMarker(null);
    }
    setShowSuggestions(false);
  };

  const handleUserMarkerDragEnd = (e: google.maps.MapMouseEvent) => {
    const next = toLatLngLiteral(e.latLng);
    if (next) {
      applyPinnedLocation(next);
    }
  };

  const handleStartNavigation = (facility: LivePlaceFacility) => {
    setNavTarget(facility);
    setSelectedFacility(facility);
    setShowSuggestions(false);
    setIsPinningMode(false);
    setActiveStepIdx(0);
    setFocusStepLocation(null);
    setIsWatchingPosition(locationSource === 'gps');
    setIsMapExpanded(true);
  };

  const handleStopNavigation = () => {
    setNavTarget(null);
    setComputedRoute(null);
    setRouteError(null);
    setFollowUserCamera(false);
    setFocusStepLocation(null);
    setIsWatchingPosition(false);
    setIsMapExpanded(false);
  };

  const currentStep = useMemo(() => {
    if (!computedRoute || computedRoute.steps.length === 0) return null;
    return computedRoute.steps[Math.min(activeStepIdx, computedRoute.steps.length - 1)] || null;
  }, [computedRoute, activeStepIdx]);

  const visibleFacilities = useMemo(() => {
    return facilities.filter((f) => {
      if (onlyOpenNow && f.isOpenNow === false) return false;
      if (onlyRightCompatible && !f.rightCompatible) return false;
      return true;
    });
  }, [facilities, onlyOpenNow, onlyRightCompatible]);

  const CATEGORY_PILLS: { id: FacilityCategoryFilter; label: string }[] = [
    { id: 'all', label: 'ทั้งหมดใกล้ฉัน' },
    { id: 'hospital', label: 'โรงพยาบาล' },
    { id: 'clinic', label: 'คลินิก / ศูนย์แพทย์' },
    { id: 'pharmacy', label: 'ร้านยา' },
  ];

  const TRAVEL_MODES: { id: TravelModeOption; label: string; icon: React.ReactNode }[] = [
    { id: 'DRIVING', label: 'รถยนต์', icon: <Car className="w-3.5 h-3.5" /> },
    { id: 'TWO_WHEELER', label: 'มอเตอร์ไซค์', icon: <Bike className="w-3.5 h-3.5" /> },
    { id: 'WALKING', label: 'เดิน', icon: <Footprints className="w-3.5 h-3.5" /> },
    { id: 'TRANSIT', label: 'ขนส่งสาธารณะ', icon: <TrainFront className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] select-none">
      {/* Top Header */}
      <div className="bg-white/95 backdrop-blur-md px-3.5 py-2.5 border-b border-slate-100 flex items-center justify-between z-20 shrink-0">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center justify-center transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="text-center min-w-0 px-2">
          <h2 className="font-heading font-extrabold text-sm text-slate-900 leading-tight truncate">
            สถานพยาบาลจริงในไทย & ระบบนำทาง
          </h2>
          <p className="text-[10px] text-emerald-700 font-medium truncate">
            {locationSource === 'gps'
              ? `● GPS จริง${gpsAccuracyMeters ? ` (±${gpsAccuracyMeters}ม.)` : ''}${
                  detectedAreaName ? ` · ${detectedAreaName}` : ''
                }`
              : locationSource === 'pinned' || locationSource === 'manual'
              ? `● ตำแหน่งของคุณ${detectedAreaName ? `: ${detectedAreaName}` : ' (ปักหมุดบนแผนที่)'}`
              : locationSource === 'detecting'
              ? '● กำลังตรวจจับพิกัดของคุณ...'
              : detectedAreaName
              ? `● พื้นที่: ${detectedAreaName}`
              : '● พื้นที่เริ่มต้นประเทศไทย'}
          </p>
        </div>

        <button
          onClick={() => requestLiveGPS(true)}
          disabled={isLocating}
          title="จับตำแหน่ง GPS ปัจจุบัน"
          className="w-9 h-9 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 flex items-center justify-center transition cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLocating ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Live GPS Status Bar */}
      <div className="bg-gradient-to-r from-[#163d2d] to-[#1c4c39] px-3.5 py-2 flex items-center justify-between gap-2 text-white shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`w-2.5 h-2.5 rounded-full shrink-0 ${
              locationSource === 'gps'
                ? 'bg-emerald-400 animate-pulse'
                : locationSource === 'manual' || locationSource === 'pinned'
                ? 'bg-sky-400'
                : 'bg-amber-400'
            }`}
          />
          <p className="text-[11px] font-sans text-emerald-100 truncate">{gpsStatusText}</p>
        </div>

        <button
          onClick={() => requestLiveGPS(true)}
          disabled={isLocating}
          className="bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-emerald-950 font-heading font-extrabold text-[11px] px-2.5 py-1.5 rounded-xl shrink-0 flex items-center gap-1 transition cursor-pointer"
        >
          <LocateFixed className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
          <span>จับตำแหน่งฉัน</span>
        </button>
      </div>

      {/* Prompt Banner if GPS was denied or resolved outside Thailand */}
      {!navTarget && (gpsPermissionDenied || outsideThailandCoords) && (
        <div className="bg-amber-50 border-b border-amber-200 px-3.5 py-2 text-[11px] text-amber-950 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-start gap-1.5 min-w-0">
            <AlertCircle className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
            <span className="leading-snug">
              {outsideThailandCoords
                ? 'พิกัดเครือข่ายอยู่นอกไทย — พิมพ์พื้นที่ของคุณด้านล่าง หรือแตะ "ปักหมุดตำแหน่งฉัน" บนแผนที่'
                : 'ยังไม่ได้รับสิทธิ์ GPS — พิมพ์ชื่อเขต/ซอย/สถานที่ด้านล่าง หรือลากหมุดสีฟ้าบนแผนที่'}
            </span>
          </div>
          {outsideThailandCoords ? (
            <button
              onClick={() => requestLiveGPS(true, true)}
              className="bg-amber-200 hover:bg-amber-300 text-amber-950 font-bold px-2 py-1 rounded-lg shrink-0 text-[10px] cursor-pointer"
            >
              ใช้พิกัดนี้
            </button>
          ) : (
            <button
              onClick={() => setIsPinningMode(true)}
              className="bg-amber-200 hover:bg-amber-300 text-amber-950 font-bold px-2 py-1 rounded-lg shrink-0 text-[10px] cursor-pointer"
            >
              ปักหมุดบนแผนที่
            </button>
          )}
        </div>
      )}

      {/* Real Place Autocomplete Search & Category Filter */}
      {!navTarget && (
        <div className="bg-white border-b border-slate-200 px-3 py-2 space-y-2 shrink-0 relative z-20">
          <form onSubmit={handleTextSearch} className="flex items-center gap-1.5 relative">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onFocus={() => {
                  if (suggestions.length > 0) setShowSuggestions(true);
                }}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                placeholder="พิมพ์ตำแหน่งปัจจุบันของคุณ หรือชื่อ รพ./คลินิกในไทย..."
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl pl-8 pr-7 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
              {isFetchingSuggestions ? (
                <Loader2 className="w-3.5 h-3.5 text-emerald-600 animate-spin absolute right-2 top-1/2 -translate-y-1/2" />
              ) : searchQuery ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSuggestions([]);
                    setShowSuggestions(false);
                    setSearchCenter(userLoc);
                    setCameraTrigger((c) => c + 1);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : null}

              {/* Google Places Autocomplete Suggestions Dropdown (Thailand Only) */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl max-h-60 overflow-y-auto z-30 divide-y divide-slate-100">
                  {suggestions.map((item) => {
                    const isMedical = item.types.some((t) => HEALTH_FACILITY_TYPES.has(t));
                    return (
                      <div
                        key={item.placeId}
                        className="flex items-center justify-between gap-2 px-3 py-2 hover:bg-emerald-50/70 transition"
                      >
                        <button
                          type="button"
                          onClick={() => void handleSelectAutocompleteItem(item, false)}
                          className="flex items-start gap-2 text-left flex-1 min-w-0 cursor-pointer"
                        >
                          <MapPin
                            className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
                              isMedical ? 'text-emerald-600' : 'text-sky-600'
                            }`}
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-heading font-bold text-slate-900 truncate">
                              {item.mainText}
                            </p>
                            {item.secondaryText && (
                              <p className="text-[10px] text-slate-500 truncate">
                                {item.secondaryText}
                              </p>
                            )}
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleSelectAutocompleteItem(item, true)}
                          className="text-[9.5px] font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 px-2 py-1 rounded-lg shrink-0 cursor-pointer"
                          title="ตั้งสถานที่นี้เป็นจุดเริ่มต้นของฉัน"
                        >
                          ตั้งเป็นตำแหน่งฉัน
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={isSearchingPlaces}
              className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-heading font-bold px-3 py-1.5 rounded-xl shrink-0 cursor-pointer disabled:opacity-50"
            >
              ค้นหา
            </button>
          </form>

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
              {CATEGORY_PILLS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setCategoryFilter(opt.id)}
                  className={`px-2.5 py-1 rounded-full whitespace-nowrap text-[10.5px] font-bold transition cursor-pointer ${
                    categoryFilter === opt.id
                      ? 'bg-emerald-800 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <select
              value={radiusMeters}
              onChange={(e) => setRadiusMeters(Number(e.target.value))}
              aria-label="รัศมีค้นหา"
              className="bg-slate-50 border border-slate-200 text-slate-700 text-[10.5px] font-bold rounded-lg px-2 py-1 shrink-0 focus:outline-none focus:ring-1 focus:ring-emerald-600 cursor-pointer"
            >
              <option value={3000}>รัศมี 3 กม.</option>
              <option value={5000}>รัศมี 5 กม.</option>
              <option value={10000}>รัศมี 10 กม.</option>
              <option value={20000}>รัศมี 20 กม.</option>
            </select>
          </div>

          {/* Open Now & Healthcare Right Real Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5">
            <button
              type="button"
              onClick={() => setOnlyOpenNow((prev) => !prev)}
              className={`px-2.5 py-1 rounded-full whitespace-nowrap text-[10.5px] font-bold border flex items-center gap-1 transition cursor-pointer ${
                onlyOpenNow
                  ? 'bg-emerald-700 text-white border-emerald-700'
                  : 'bg-emerald-50/70 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              <Clock className="w-3 h-3" />
              <span>เปิดอยู่ตอนนี้</span>
            </button>

            <button
              type="button"
              onClick={() => setOnlyRightCompatible((prev) => !prev)}
              className={`px-2.5 py-1 rounded-full whitespace-nowrap text-[10.5px] font-bold border flex items-center gap-1 transition cursor-pointer ${
                onlyRightCompatible
                  ? 'bg-sky-700 text-white border-sky-700'
                  : 'bg-sky-50/70 text-sky-800 border-sky-200 hover:bg-sky-100'
              }`}
            >
              <ShieldCheck className="w-3 h-3" />
              <span>ตรงสิทธิฉัน ({user?.medicalRight?.includes('ประกันสังคม') ? 'ประกันสังคม' : user?.medicalRight?.includes('ข้าราชการ') ? 'ข้าราชการ' : 'บัตรทอง'})</span>
            </button>
          </div>
        </div>
      )}

      {/* Interactive Google Map Viewport (Explicit height per CF2) */}
      <div
        className={`relative w-full bg-slate-200 shrink-0 overflow-hidden border-b border-slate-200 transition-all duration-200 ${
          isMapExpanded ? 'h-[290px] sm:h-[320px]' : 'h-[245px]'
        }`}
      >
        <GoogleMap
          mapId="DEMO_MAP_ID"
          defaultCenter={userLoc}
          defaultZoom={15}
          gestureHandling="greedy"
          disableDefaultUI={false}
          streetViewControl={false}
          mapTypeControl={false}
          fullscreenControl={false}
          onClick={handleMapClick}
          internalUsageAttributionIds={[GMP_ATTRIBUTION_ID]}
          style={{ width: '100%', height: '100%' }}
        >
          <MapCameraSync center={searchCenter} triggerCount={cameraTrigger} zoom={cameraZoom} />

          {/* Real User Current / Draggable Pin Marker */}
          <AdvancedMarker
            position={userLoc}
            title="ตำแหน่งปัจจุบันของคุณ (ลากเพื่อปรับตำแหน่งได้)"
            zIndex={1100}
            draggable={!navTarget}
            onDragEnd={handleUserMarkerDragEnd}
          >
            <div className="relative flex flex-col items-center cursor-grab active:cursor-grabbing">
              <div className="relative flex items-center justify-center w-8 h-8">
                <span className="absolute inset-0 rounded-full bg-sky-500/35 animate-ping" />
                <span className="w-4.5 h-4.5 rounded-full bg-sky-600 border-2 border-white shadow-md z-10" />
              </div>
              <span className=" -mt-1 px-1.5 py-0.5 rounded-full bg-slate-900/85 text-white text-[9px] font-heading font-bold whitespace-nowrap shadow">
                ตำแหน่งฉัน
              </span>
            </div>
          </AdvancedMarker>

          {/* Real Nearby Healthcare Markers */}
          {visibleFacilities.map((facility) => (
            <FacilityMarker
              key={facility.id}
              facility={facility}
              isSelected={selectedFacility?.id === facility.id}
              isNavigating={navTarget?.id === facility.id}
              onSelect={(fac, marker) => {
                setSelectedFacility(fac);
                setSelectedMarker(marker);
                setShowSuggestions(false);
              }}
            />
          ))}

          {/* InfoWindow anchored to clicked marker */}
          {selectedFacility && selectedMarker && (
            <InfoWindow
              anchor={selectedMarker}
              onCloseClick={() => {
                setSelectedFacility(null);
                setSelectedMarker(null);
              }}
              maxWidth={250}
            >
              <div className="p-1 text-slate-900 space-y-1.5 font-sans">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-heading font-bold text-xs leading-snug text-slate-900">
                    {selectedFacility.name}
                  </h4>
                </div>
                <p className="text-[10.5px] text-emerald-700 font-semibold">
                  {selectedFacility.primaryTypeLabel} · ห่าง {selectedFacility.distanceKm} กม. · {selectedFacility.openStatusLabel}
                </p>
                <p className="text-[10px] text-sky-800 font-medium">{selectedFacility.rightMatchReason}</p>
                {selectedFacility.rating !== null && (
                  <p className="text-[10px] text-amber-600 font-bold flex items-center gap-1">
                    ★ {selectedFacility.rating.toFixed(1)} ({selectedFacility.userRatingCount || 0} รีวิว)
                  </p>
                )}
                <p className="text-[10px] text-slate-600 line-clamp-2">{selectedFacility.address}</p>
                <div className="flex items-center gap-1.5 pt-1">
                  <button
                    onClick={() => handleStartNavigation(selectedFacility)}
                    className="flex-1 bg-emerald-700 text-white text-[10.5px] font-bold px-2.5 py-1 rounded-lg cursor-pointer"
                  >
                    นำทางในแอป
                  </button>
                  <button
                    onClick={() => onSelectHospital(facilityToHospitalBridge(selectedFacility))}
                    className="bg-slate-100 text-slate-800 text-[10.5px] font-bold px-2.5 py-1 rounded-lg cursor-pointer"
                  >
                    จองคิว
                  </button>
                </div>
              </div>
            </InfoWindow>
          )}

          {/* Real Routes API v2 Polyline & Step Calculation */}
          <RouteOverlayController
            origin={userLoc}
            destination={navTarget?.location || null}
            destinationId={navTarget?.id || null}
            destinationName={navTarget?.name || null}
            destinationURI={navTarget?.googleMapsURI || null}
            travelMode={travelMode}
            followUser={followUserCamera}
            onRouteComputed={setComputedRoute}
            onRouteLoading={setIsRouteLoading}
            onRouteError={setRouteError}
            focusStepLocation={focusStepLocation}
          />
        </GoogleMap>

        {/* Active Pinning Mode Hint */}
        {isPinningMode && (
          <div className="absolute top-2.5 left-1/2 -translate-x-1/2 z-10 bg-sky-700 text-white text-[11px] font-heading font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 whitespace-nowrap">
            <MapPin className="w-3.5 h-3.5 animate-bounce" />
            <span>แตะตำแหน่งที่ต้องการบนแผนที่</span>
            <button
              onClick={() => setIsPinningMode(false)}
              className="ml-1 bg-white/20 hover:bg-white/30 rounded-full p-0.5 cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Map Floating Controls */}
        <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => {
              if (navTarget) {
                setFollowUserCamera((prev) => {
                  const next = !prev;
                  if (next) requestLiveGPS(true);
                  return next;
                });
              } else {
                requestLiveGPS(true);
              }
            }}
            className={`px-2.5 py-1.5 rounded-full text-[11px] font-heading font-bold shadow-md border flex items-center gap-1 transition cursor-pointer ${
              followUserCamera
                ? 'bg-emerald-700 text-white border-emerald-600'
                : 'bg-white text-slate-800 hover:text-emerald-700 border-slate-200'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>{followUserCamera ? 'ติดตามตำแหน่งสด' : 'ใช้ GPS จริง'}</span>
          </button>

          {!navTarget && (
            <button
              onClick={() => setIsPinningMode((prev) => !prev)}
              className={`px-2.5 py-1.5 rounded-full text-[11px] font-heading font-bold shadow-md border flex items-center gap-1 transition cursor-pointer ${
                isPinningMode
                  ? 'bg-sky-700 text-white border-sky-600'
                  : 'bg-white text-slate-800 hover:text-sky-700 border-slate-200'
              }`}
            >
              {isPinningMode ? <Check className="w-3.5 h-3.5" /> : <MapPin className="w-3.5 h-3.5" />}
              <span>{isPinningMode ? 'กำลังเลือกจุด...' : 'ปักหมุดตำแหน่งฉัน'}</span>
            </button>
          )}

          <button
            onClick={() => setIsMapExpanded((prev) => !prev)}
            className="bg-white text-slate-700 hover:text-slate-900 px-2.5 py-1.5 rounded-full text-[11px] font-heading font-bold shadow-md border border-slate-200 flex items-center gap-1 cursor-pointer"
          >
            {isMapExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            <span>{isMapExpanded ? 'ย่อ' : 'ขยาย'}</span>
          </button>
        </div>
      </div>

      {/* Active In-App Turn-by-Turn Navigation Panel */}
      {navTarget ? (
        <div className="flex-1 overflow-y-auto bg-white flex flex-col no-scrollbar">
          {/* Active Route Header + Travel Mode Selector */}
          <div className="bg-emerald-950 text-white px-4 py-3 space-y-2.5 shrink-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-[10px] text-emerald-300 font-bold uppercase">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>ระบบนำทางจริงในแอป (Google Routes)</span>
                </div>
                <h3 className="font-heading font-bold text-sm text-white truncate mt-0.5">
                  ไปยัง: {navTarget.name}
                </h3>
                {computedRoute ? (
                  <p className="text-xs text-emerald-100 mt-0.5 font-medium">
                    ระยะทาง <strong className="text-white">{computedRoute.distanceText}</strong> · ใช้เวลาประมาณ{' '}
                    <strong className="text-amber-300">{computedRoute.durationText}</strong>
                  </p>
                ) : isRouteLoading ? (
                  <p className="text-xs text-emerald-200 mt-0.5 flex items-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> กำลังคำนวณเส้นทางจริง...
                  </p>
                ) : null}
              </div>

              <button
                onClick={handleStopNavigation}
                className="bg-white/15 hover:bg-white/25 text-white text-[11px] font-heading font-bold px-2.5 py-1.5 rounded-xl shrink-0 cursor-pointer"
              >
                ปิดนำทาง
              </button>
            </div>

            {/* Travel Mode Switcher */}
            <div className="grid grid-cols-4 gap-1.5">
              {TRAVEL_MODES.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setTravelMode(m.id)}
                  className={`py-1.5 px-1 rounded-xl text-[10.5px] font-heading font-bold flex items-center justify-center gap-1 transition cursor-pointer ${
                    travelMode === m.id
                      ? 'bg-emerald-500 text-emerald-950 shadow-xs'
                      : 'bg-white/10 text-emerald-100 hover:bg-white/20'
                  }`}
                >
                  {m.icon}
                  <span className="truncate">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Route Error */}
          {routeError && (
            <div className="m-3 p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>{routeError}</span>
            </div>
          )}

          {/* Next Turn Highlight Card */}
          {currentStep && (
            <div className="p-3 bg-emerald-50 border-b border-emerald-200 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-sm">
                  {getManeuverIcon(currentStep.maneuver)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between text-[10px] text-emerald-800 font-bold">
                    <span>
                      ขั้นตอนที่ {activeStepIdx + 1} / {computedRoute?.steps.length || 1}
                    </span>
                    <span>
                      {currentStep.distanceText}
                      {currentStep.durationText ? ` · ${currentStep.durationText}` : ''}
                    </span>
                  </div>
                  <p className="font-heading font-bold text-xs sm:text-sm text-slate-900 mt-0.5 leading-snug">
                    {currentStep.instruction}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 mt-2.5">
                <div className="flex items-center gap-1.5">
                  <button
                    disabled={activeStepIdx <= 0}
                    onClick={() => {
                      const prevIdx = Math.max(0, activeStepIdx - 1);
                      setActiveStepIdx(prevIdx);
                      const pt = computedRoute?.steps[prevIdx]?.startLocation || null;
                      setFocusStepLocation(pt);
                      setFollowUserCamera(false);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white border border-emerald-200 text-emerald-900 text-[11px] font-bold flex items-center gap-0.5 disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" /> ก่อนหน้า
                  </button>
                  <button
                    disabled={!computedRoute || activeStepIdx >= computedRoute.steps.length - 1}
                    onClick={() => {
                      if (!computedRoute) return;
                      const nextIdx = Math.min(computedRoute.steps.length - 1, activeStepIdx + 1);
                      setActiveStepIdx(nextIdx);
                      const pt = computedRoute.steps[nextIdx]?.startLocation || null;
                      setFocusStepLocation(pt);
                      setFollowUserCamera(false);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white border border-emerald-200 text-emerald-900 text-[11px] font-bold flex items-center gap-0.5 disabled:opacity-40 cursor-pointer"
                  >
                    ถัดไป <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() =>
                      onSelectHospital(
                        facilityToHospitalBridge(
                          navTarget,
                          Math.round((computedRoute?.durationMillis || 600000) / 60000)
                        )
                      )
                    }
                    className="px-2.5 py-1 rounded-lg bg-emerald-700 text-white text-[11px] font-bold cursor-pointer"
                  >
                    จองคิวที่นี่
                  </button>
                  <a
                    href={
                      navTarget.googleMapsURI ||
                      `https://www.google.com/maps/dir/?api=1&origin=${userLoc.lat},${userLoc.lng}&destination=${navTarget.location.lat},${navTarget.location.lng}`
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 text-[11px] font-bold flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" /> Google Maps
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Turn-by-Turn Steps List */}
          {computedRoute && computedRoute.steps.length > 0 && (
            <div className="p-3.5 pb-20 space-y-2">
              <button
                onClick={() => setShowAllSteps((prev) => !prev)}
                className="w-full flex items-center justify-between text-xs font-heading font-bold text-slate-800 cursor-pointer"
              >
                <span>ขั้นตอนการเดินทางทั้งหมด ({computedRoute.steps.length} ขั้นตอน)</span>
                {showAllSteps ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showAllSteps && (
                <div className="space-y-1.5 pt-1">
                  {computedRoute.steps.map((step, idx) => {
                    const isCurrent = idx === activeStepIdx;
                    return (
                      <button
                        key={step.index}
                        onClick={() => {
                          setActiveStepIdx(idx);
                          setFocusStepLocation(step.startLocation);
                          setFollowUserCamera(false);
                        }}
                        className={`w-full text-left p-2.5 rounded-2xl border flex items-start gap-2.5 transition cursor-pointer ${
                          isCurrent
                            ? 'bg-emerald-50 border-emerald-400'
                            : 'bg-slate-50/70 border-slate-100 hover:border-slate-300'
                        }`}
                      >
                        <div
                          className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                            isCurrent
                              ? 'bg-emerald-700 text-white'
                              : 'bg-white text-slate-600 border border-slate-200'
                          }`}
                        >
                          {getManeuverIcon(step.maneuver)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-900 leading-snug">
                            {step.instruction}
                          </p>
                          <p className="text-[10.5px] text-slate-500 mt-0.5">
                            {step.distanceText}
                            {step.durationText ? ` · ${step.durationText}` : ''}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Real Nearby Healthcare Facilities List */
        <div className="flex-1 overflow-y-auto p-3.5 pb-20 space-y-2.5 no-scrollbar">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-heading font-extrabold text-xs sm:text-sm text-slate-900 flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-emerald-700" />
              <span>สถานพยาบาลจริงในไทย ({visibleFacilities.length} แห่ง)</span>
            </h3>
            <span className="text-[10.5px] text-slate-500 font-medium">เปิดอยู่ · ตรงสิทธิ · ใกล้สุด</span>
          </div>

          {placesError && (
            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>{placesError}</span>
            </div>
          )}

          {isInitialLocatePending || isSearchingPlaces ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-500 gap-2 bg-white rounded-2xl border border-slate-100">
              <Loader2 className="w-7 h-7 text-emerald-600 animate-spin" />
              <p className="text-xs font-heading font-semibold">
                {isInitialLocatePending
                  ? 'กำลังตรวจจับพิกัดปัจจุบันของคุณ...'
                  : 'กำลังค้นหาสถานพยาบาลจริงในไทยรอบตำแหน่งของคุณ...'}
              </p>
            </div>
          ) : visibleFacilities.length === 0 ? (
            <div className="text-center py-10 px-4 bg-white rounded-2xl border border-slate-200">
              <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700 font-heading">
                ไม่พบสถานพยาบาลในเงื่อนไขและรัศมี {radiusMeters / 1000} กม.
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                ลองปิดตัวกรองชั่วคราว ขยายรัศมีค้นหาเป็น 10-20 กม. หรือพิมพ์ชื่อเขตของคุณ
              </p>
              <div className="flex items-center justify-center gap-2 mt-3">
                {(onlyOpenNow || onlyRightCompatible) && (
                  <button
                    onClick={() => {
                      setOnlyOpenNow(false);
                      setOnlyRightCompatible(false);
                    }}
                    className="px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                  >
                    แสดงทุกสถานพยาบาล
                  </button>
                )}
                <button
                  onClick={() => setRadiusMeters(20000)}
                  className="px-3.5 py-1.5 text-xs bg-emerald-700 text-white rounded-xl font-bold cursor-pointer"
                >
                  ขยายรัศมีเป็น 20 กม.
                </button>
              </div>
            </div>
          ) : (
            visibleFacilities.map((facility) => {
              const isSelected = selectedFacility?.id === facility.id;
              return (
                <div
                  key={facility.id}
                  onClick={() => {
                    setSelectedFacility(facility);
                    setSearchCenter(facility.location);
                    setCameraZoom(15);
                    setCameraTrigger((c) => c + 1);
                  }}
                  className={`bg-white rounded-[22px] p-3.5 border transition-all duration-150 card-shadow cursor-pointer ${
                    isSelected
                      ? 'border-emerald-600 ring-1 ring-emerald-500/20'
                      : 'border-slate-100 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    {/* Left Category Icon */}
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                        facility.category === 'pharmacy'
                          ? 'bg-sky-50 text-sky-700'
                          : facility.category === 'clinic'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-emerald-50 text-emerald-700'
                      }`}
                    >
                      <Building2 className="w-5 h-5" />
                    </div>

                    {/* Center Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="font-heading font-bold text-xs sm:text-sm text-slate-900 leading-snug">
                          {facility.name}
                        </h4>
                        <span
                          className={`text-[9.5px] font-bold px-2 py-0.5 rounded-md border ${
                            facility.category === 'pharmacy'
                              ? 'bg-sky-50 text-sky-700 border-sky-200'
                              : facility.category === 'clinic'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          }`}
                        >
                          {facility.primaryTypeLabel}
                        </span>
                        <span
                          className={`text-[9.5px] font-bold px-2 py-0.5 rounded-md ${
                            facility.isOpenNow === true || facility.is24Hours
                              ? 'bg-emerald-600 text-white'
                              : facility.isOpenNow === false
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {facility.openStatusLabel}
                        </span>
                      </div>

                      <div className="flex items-center gap-2.5 text-[11px] text-slate-600 mt-1 flex-wrap">
                        <span className="font-bold text-emerald-700">ห่าง {facility.distanceKm} กม.</span>
                        {facility.rating !== null && (
                          <span className="flex items-center gap-0.5 text-amber-600 font-bold">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                            {facility.rating.toFixed(1)}
                            {facility.userRatingCount !== null && (
                              <span className="text-slate-400 font-normal">
                                ({facility.userRatingCount})
                              </span>
                            )}
                          </span>
                        )}
                      </div>

                      <p
                        className={`text-[10.5px] mt-1 font-semibold flex items-center gap-1 ${
                          facility.rightExactMatch
                            ? 'text-emerald-700'
                            : facility.rightCompatible
                            ? 'text-sky-700'
                            : 'text-slate-500'
                        }`}
                      >
                        <ShieldCheck className="w-3 h-3 shrink-0" />
                        <span className="truncate">{facility.rightMatchReason}</span>
                      </p>

                      <p className="text-[10.5px] text-slate-500 mt-1 flex items-start gap-1">
                        <MapPin className="w-3 h-3 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{facility.address}</span>
                      </p>

                      {facility.openHoursText && (
                        <p className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{facility.openHoursText}</span>
                        </p>
                      )}

                      {facility.phone && (
                        <p className="text-[10px] text-slate-600 mt-0.5 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-emerald-600 shrink-0" />
                          <a
                            href={`tel:${facility.phone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="hover:underline font-medium"
                          >
                            {facility.phone}
                          </a>
                        </p>
                      )}

                      {facility.attributions.length > 0 && (
                        <p className="text-[9.5px] text-slate-400 mt-1">
                          ข้อมูลจาก:{' '}
                          {facility.attributions.map((a, i) => (
                            <span key={`${facility.id}-attr-${i}`}>
                              {i > 0 ? ', ' : ''}
                              {a.providerURI ? (
                                <a
                                  href={a.providerURI}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="underline"
                                >
                                  {a.provider}
                                </a>
                              ) : (
                                a.provider
                              )}
                            </span>
                          ))}
                        </p>
                      )}

                      {/* Action Buttons */}
                      <div
                        className="flex items-center gap-2 mt-2.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => handleStartNavigation(facility)}
                          className="text-xs font-heading font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-xs bg-emerald-700 hover:bg-emerald-800 text-white"
                        >
                          <Navigation className="w-3.5 h-3.5" />
                          <span>นำทางในแอป</span>
                        </button>

                        <button
                          onClick={() => onSelectHospital(facilityToHospitalBridge(facility))}
                          className="text-xs font-heading font-semibold px-2.5 py-1.5 rounded-xl text-slate-700 hover:bg-slate-100 border border-slate-200 cursor-pointer transition"
                        >
                          จองคิว
                        </button>
                      </div>
                    </div>

                    {/* Right Google Maps External Directions Shortcut */}
                    <a
                      href={
                        facility.googleMapsURI ||
                        `https://www.google.com/maps/dir/?api=1&origin=${userLoc.lat},${userLoc.lng}&destination=${facility.location.lat},${facility.location.lng}`
                      }
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      title="เปิดเส้นทางใน Google Maps"
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
      )}
    </div>
  );
};
