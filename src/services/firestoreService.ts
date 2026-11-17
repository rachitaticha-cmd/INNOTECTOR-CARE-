import { User as FirebaseUser } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { NotificationItem, QueueTicket, TriageAssessment, UserProfile } from '../types';

function clampString(val: string | undefined | null, maxLen: number, fallback = ''): string {
  const s = (val ?? fallback).toString();
  return s.length > maxLen ? s.slice(0, maxLen) : s;
}

function clampStringList(arr: string[] | undefined, maxItems: number, itemMaxLen: number, fallback: string[]): string[] {
  const src = Array.isArray(arr) && arr.length > 0 ? arr : fallback;
  return src.slice(0, maxItems).map((item) => clampString(item, itemMaxLen, '')).filter(Boolean);
}

function formatTimestamp(ts: unknown): string {
  if (ts instanceof Timestamp) {
    return ts.toDate().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  }
  if (typeof ts === 'string' && ts) return ts;
  return new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
}

function getTimestampMillis(ts: unknown): number {
  if (ts instanceof Timestamp) return ts.toMillis();
  if (typeof ts === 'number') return ts;
  return 0;
}

function buildDefaultProfile(fbUser: FirebaseUser): UserProfile {
  const shortHnNum = fbUser.uid.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase() || '000001';
  const safeAvatar =
    fbUser.photoURL && fbUser.photoURL.length <= 49000 ? fbUser.photoURL : '';

  return {
    id: fbUser.uid,
    name: clampString(fbUser.displayName, 120, 'ผู้ใช้งาน'),
    email: clampString(fbUser.email, 200, 'user@email.com'),
    hn: `68-${shortHnNum}`,
    nationalId: '-',
    age: 30,
    gender: 'อื่นๆ',
    bloodType: 'O',
    heightCm: 170,
    weightKg: 65,
    bmi: 22.5,
    drugAllergies: ['ไม่มีประวัติแพ้ยา'],
    chronicDiseases: ['ไม่มี'],
    medicalRight: 'สิทธิหลักประกันสุขภาพถ้วนหน้า (บัตรทอง)',
    assignedHospital: '',
    secondaryHospital: '',
    insuranceCompany: 'ไม่มี',
    insurancePolicyNumber: '',
    emergencyContact: {
      name: '',
      relationship: 'ครอบครัว',
      phone: fbUser.phoneNumber || '',
    },
    avatarUrl: safeAvatar,
    weightLog: [],
  };
}

function sanitizeProfilePayload(user: UserProfile, uid: string) {
  const safeWeight = Number.isFinite(user.weightKg) && user.weightKg >= 1 && user.weightKg <= 500 ? user.weightKg : 65;
  const safeHeight = Number.isFinite(user.heightCm) && user.heightCm >= 30 && user.heightCm <= 300 ? user.heightCm : 170;
  const computedBmi = Number((safeWeight / ((safeHeight / 100) * (safeHeight / 100))).toFixed(1));
  const safeBmi = Number.isFinite(computedBmi) && computedBmi >= 5 && computedBmi <= 100 ? computedBmi : 22.5;
  const safeAge = Number.isFinite(user.age) && user.age >= 0 && user.age <= 150 ? Math.round(user.age) : 30;

  const weightLog = Array.isArray(user.weightLog)
    ? user.weightLog.slice(0, 30).map((entry) => ({
        day: clampString(entry.day, 10, '01'),
        mon: clampString(entry.mon, 20, 'ม.ค.'),
        weight: Number.isFinite(entry.weight) ? entry.weight : safeWeight,
        dateStr: clampString(entry.dateStr, 40, ''),
      }))
    : [];

  return {
    id: uid,
    name: clampString(user.name, 120, 'ผู้ใช้งาน').trim() || 'ผู้ใช้งาน',
    email: clampString(user.email, 200, 'user@email.com').trim() || 'user@email.com',
    hn: clampString(user.hn, 40, '68-000001'),
    nationalId: clampString(user.nationalId, 30, '-'),
    age: safeAge,
    gender: (['ชาย', 'หญิง', 'อื่นๆ'].includes(user.gender) ? user.gender : 'อื่นๆ') as UserProfile['gender'],
    bloodType: (['A', 'B', 'AB', 'O'].includes(user.bloodType) ? user.bloodType : 'O') as UserProfile['bloodType'],
    heightCm: safeHeight,
    weightKg: safeWeight,
    bmi: safeBmi,
    drugAllergies: clampStringList(user.drugAllergies, 20, 120, ['ไม่มีประวัติแพ้ยา']),
    chronicDiseases: clampStringList(user.chronicDiseases, 20, 120, ['ไม่มี']),
    medicalRight: clampString(
      user.medicalRight,
      150,
      'สิทธิหลักประกันสุขภาพถ้วนหน้า (บัตรทอง)'
    ) as UserProfile['medicalRight'],
    assignedHospital: clampString(user.assignedHospital, 200, ''),
    secondaryHospital: clampString(user.secondaryHospital, 200, ''),
    insuranceCompany: clampString(user.insuranceCompany, 150, 'ไม่มี'),
    insurancePolicyNumber: clampString(user.insurancePolicyNumber, 80, ''),
    emergencyContact: {
      name: clampString(user.emergencyContact?.name, 120, ''),
      relationship: clampString(user.emergencyContact?.relationship, 60, 'ครอบครัว'),
      phone: clampString(user.emergencyContact?.phone, 40, ''),
    },
    avatarUrl: clampString(user.avatarUrl, 49000, ''),
    weightLog,
  };
}

export async function ensureUserProfile(fbUser: FirebaseUser): Promise<UserProfile> {
  const userPath = `users/${fbUser.uid}`;
  const ref = doc(db, 'users', fbUser.uid);

  try {
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data() as UserProfile;
      return {
        ...buildDefaultProfile(fbUser),
        ...data,
        id: fbUser.uid,
      };
    }

    const initialProfile = buildDefaultProfile(fbUser);
    const payload = sanitizeProfilePayload(initialProfile, fbUser.uid);
    await setDoc(ref, {
      ...payload,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return initialProfile;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, userPath);
  }
}

export async function saveUserProfileToFirestore(uid: string, profile: UserProfile): Promise<UserProfile> {
  const userPath = `users/${uid}`;
  const ref = doc(db, 'users', uid);
  const sanitized = sanitizeProfilePayload(profile, uid);

  try {
    const { id: _id, ...updatableFields } = sanitized;
    await updateDoc(ref, {
      ...updatableFields,
      updatedAt: serverTimestamp(),
    });
    return sanitized;
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, userPath);
  }
}

export function subscribeUserProfile(
  uid: string,
  onData: (profile: UserProfile) => void
): Unsubscribe {
  const userPath = `users/${uid}`;
  return onSnapshot(
    doc(db, 'users', uid),
    (snapshot) => {
      if (snapshot.exists()) {
        onData(snapshot.data() as UserProfile);
      }
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, userPath);
    }
  );
}

export function subscribeUserQueues(
  uid: string,
  onData: (queues: QueueTicket[]) => void
): Unsubscribe {
  const path = `users/${uid}/queues`;
  const q = query(collection(db, 'users', uid, 'queues'), where('userId', '==', uid));

  return onSnapshot(
    q,
    (snapshot) => {
      const docs = snapshot.docs
        .map((d) => {
          const data = d.data();
          return {
            ...(data as QueueTicket),
            id: d.id,
            createdAt: formatTimestamp(data.createdAt),
            _sortMs: getTimestampMillis(data.createdAt),
          };
        })
        .sort((a, b) => b._sortMs - a._sortMs)
        .map(({ _sortMs: _unused, ...ticket }) => ticket);

      onData(docs);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, path);
    }
  );
}

export async function createQueueTicketInFirestore(
  uid: string,
  input: Omit<QueueTicket, 'id' | 'userId' | 'createdAt' | 'status' | 'qrCodeUrl'>
): Promise<QueueTicket> {
  const queueId = `Q-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
  const path = `users/${uid}/queues/${queueId}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
    `INNOTECTOR-${queueId}`
  )}`;

  const payload = {
    id: queueId,
    userId: uid,
    hospitalId: clampString(input.hospitalId, 200, 'hospital'),
    hospitalName: clampString(input.hospitalName, 250, 'สถานพยาบาล'),
    department: clampString(input.department, 200, 'แผนกตรวจโรคทั่วไป'),
    queueNum: clampString(input.queueNum, 30, 'A-01'),
    triageLevel: input.triageLevel,
    triageTitle: clampString(input.triageTitle, 150, 'ตรวจทั่วไป'),
    ahead: Math.min(1000, Math.max(0, Math.round(input.ahead))),
    estWait: clampString(input.estWait, 80, '~15 นาที'),
    status: 'waiting' as const,
    symptomsSummary: clampString(input.symptomsSummary, 500, ''),
    qrCodeUrl: clampString(qrCodeUrl, 500, ''),
  };

  try {
    await setDoc(doc(db, 'users', uid, 'queues', queueId), {
      ...payload,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return {
      ...payload,
      createdAt: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function cancelQueueTicketInFirestore(uid: string, queueId: string): Promise<void> {
  const path = `users/${uid}/queues/${queueId}`;
  try {
    await updateDoc(doc(db, 'users', uid, 'queues', queueId), {
      status: 'cancelled',
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function createTriageAssessmentInFirestore(
  uid: string,
  input: Omit<TriageAssessment, 'id' | 'userId' | 'createdAt'>
): Promise<TriageAssessment> {
  const triageId = `TRIAGE-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
  const path = `users/${uid}/triages/${triageId}`;

  const payload: Record<string, unknown> = {
    id: triageId,
    userId: uid,
    duration: clampString(input.duration, 80, ''),
    symptoms: clampStringList(input.symptoms, 20, 150, ['อาการทั่วไป']),
    notes: clampString(input.notes, 2000, ''),
    hasRedFlags: Boolean(input.hasRedFlags),
    redFlagsList: Array.isArray(input.redFlagsList)
      ? input.redFlagsList.slice(0, 20).map((r) => clampString(r, 150, ''))
      : [],
    level: input.level,
    title: clampString(input.title, 200, 'ผลการประเมิน'),
    description: clampString(input.description, 500, ''),
    clinicalSummary: clampString(input.clinicalSummary, 3000, ''),
    recommendedHospitalId: clampString(input.recommendedHospitalId, 200, 'hospital'),
    recommendedHospitalName: clampString(input.recommendedHospitalName, 250, 'สถานพยาบาลแนะนำ'),
    recommendedService: input.recommendedService || 'โรงพยาบาล',
    createdAt: serverTimestamp(),
  };

  if (typeof input.temperature === 'number' && input.temperature >= 30 && input.temperature <= 45) {
    payload.temperature = input.temperature;
  }

  try {
    await setDoc(doc(db, 'users', uid, 'triages', triageId), payload);
    return {
      ...input,
      id: triageId,
      userId: uid,
      createdAt: new Date().toLocaleString('th-TH'),
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export function subscribeUserTriages(
  uid: string,
  onData: (triages: TriageAssessment[]) => void
): Unsubscribe {
  const path = `users/${uid}/triages`;
  const q = query(collection(db, 'users', uid, 'triages'), where('userId', '==', uid));

  return onSnapshot(
    q,
    (snapshot) => {
      const docs = snapshot.docs
        .map((d) => {
          const data = d.data();
          return {
            ...(data as TriageAssessment),
            id: d.id,
            createdAt:
              data.createdAt instanceof Timestamp
                ? data.createdAt.toDate().toLocaleString('th-TH')
                : String(data.createdAt || ''),
            _sortMs: getTimestampMillis(data.createdAt),
          };
        })
        .sort((a, b) => b._sortMs - a._sortMs)
        .map(({ _sortMs: _unused, ...item }) => item);

      onData(docs);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, path);
    }
  );
}

export function subscribeUserNotifications(
  uid: string,
  onData: (items: NotificationItem[]) => void
): Unsubscribe {
  const path = `users/${uid}/notifications`;
  const q = query(collection(db, 'users', uid, 'notifications'), where('userId', '==', uid));

  return onSnapshot(
    q,
    (snapshot) => {
      const docs = snapshot.docs
        .map((d) => {
          const data = d.data();
          return {
            ...(data as NotificationItem),
            id: d.id,
            _sortMs: getTimestampMillis(data.createdAt),
          };
        })
        .sort((a, b) => b._sortMs - a._sortMs)
        .map(({ _sortMs: _unused, ...item }) => item);

      onData(docs);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, path);
    }
  );
}

export async function createNotificationInFirestore(
  uid: string,
  item: Omit<NotificationItem, 'id' | 'read'>
): Promise<void> {
  const notifId = `notif-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
  const path = `users/${uid}/notifications/${notifId}`;

  const payload = {
    id: notifId,
    userId: uid,
    title: clampString(item.title, 200, 'การแจ้งเตือน'),
    subtitle: clampString(item.subtitle, 500, ''),
    time: clampString(
      item.time,
      40,
      new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
    ),
    color: item.color || 'emerald',
    read: false,
    linkTab: item.linkTab || 'home',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, 'users', uid, 'notifications', notifId), payload);
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function markNotificationReadInFirestore(uid: string, notifId: string): Promise<void> {
  const path = `users/${uid}/notifications/${notifId}`;
  try {
    await updateDoc(doc(db, 'users', uid, 'notifications', notifId), {
      read: true,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function deleteNotificationInFirestore(uid: string, notifId: string): Promise<void> {
  const path = `users/${uid}/notifications/${notifId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'notifications', notifId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}
