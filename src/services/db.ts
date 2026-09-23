import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  onSnapshot, 
  deleteDoc, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { 
  signInWithPopup, 
  signOut as fbSignOut, 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import { auth, db, googleProvider } from '../firebase/config';
import { FactorySettings, LotInvoice, Worker, WorkerPayment } from '../types';
import { defaultFactorySettings, initialLots, initialWorkers } from '../data/seedData';

const LOTS_STORAGE_KEY = 'stitchtrack_lots_v1';
const WORKERS_STORAGE_KEY = 'stitchtrack_workers_v1';
const SETTINGS_STORAGE_KEY = 'stitchtrack_settings_v1';
const PAYMENTS_STORAGE_KEY = 'stitchtrack_payments_v1';

// Local storage helper
export const getLocalData = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (e) {
    console.error('Error reading localStorage:', e);
    return defaultValue;
  }
};

export const setLocalData = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Error saving localStorage:', e);
  }
};

// Auth functions
export const signInWithGoogle = async (): Promise<User | null> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Google Sign-In Error:', error);
    throw error;
  }
};

export const logOut = async (): Promise<void> => {
  try {
    await fbSignOut(auth);
  } catch (error) {
    console.error('Logout Error:', error);
    throw error;
  }
};

export const subscribeToAuth = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// Firestore collections
const LOTS_COLLECTION = 'lots';
const WORKERS_COLLECTION = 'workers';
const SETTINGS_COLLECTION = 'settings';
const PAYMENTS_COLLECTION = 'payments';

// Initialize default data if empty
export const initializeData = async () => {
  // Check local storage first
  const existingWorkers = getLocalData<Worker[]>(WORKERS_STORAGE_KEY, []);
  if (existingWorkers.length === 0) {
    setLocalData(WORKERS_STORAGE_KEY, initialWorkers);
  }

  const existingLots = getLocalData<LotInvoice[]>(LOTS_STORAGE_KEY, []);
  if (existingLots.length === 0) {
    setLocalData(LOTS_STORAGE_KEY, initialLots);
  }

  const existingSettings = getLocalData<FactorySettings>(SETTINGS_STORAGE_KEY, defaultFactorySettings);
  setLocalData(SETTINGS_STORAGE_KEY, existingSettings);
};

// Firestore Realtime Subscription for Lots
export const subscribeLots = (
  onData: (lots: LotInvoice[]) => void,
  onError?: (error: Error) => void
) => {
  try {
    const lotsRef = collection(db, LOTS_COLLECTION);
    const q = query(lotsRef, orderBy('createdAt', 'desc'));
    
    return onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const remoteLots: LotInvoice[] = [];
          snapshot.forEach((docSnap) => {
            remoteLots.push(docSnap.data() as LotInvoice);
          });
          setLocalData(LOTS_STORAGE_KEY, remoteLots);
          onData(remoteLots);
        } else {
          // If remote is empty, provide local
          const local = getLocalData<LotInvoice[]>(LOTS_STORAGE_KEY, initialLots);
          onData(local);
        }
      },
      (err) => {
        console.warn('Firestore lots listener error (falling back to local):', err);
        const local = getLocalData<LotInvoice[]>(LOTS_STORAGE_KEY, initialLots);
        onData(local);
        if (onError) onError(err);
      }
    );
  } catch (err) {
    console.warn('Failed to start Firestore lots listener:', err);
    onData(getLocalData<LotInvoice[]>(LOTS_STORAGE_KEY, initialLots));
    return () => {};
  }
};

// Save a Lot
export const saveLotInvoice = async (lot: LotInvoice): Promise<void> => {
  // Update local storage immediately for fast UI
  const lots = getLocalData<LotInvoice[]>(LOTS_STORAGE_KEY, initialLots);
  const index = lots.findIndex((l) => l.id === lot.id);
  let updatedLots: LotInvoice[];
  if (index >= 0) {
    updatedLots = [...lots];
    updatedLots[index] = lot;
  } else {
    updatedLots = [lot, ...lots];
  }
  setLocalData(LOTS_STORAGE_KEY, updatedLots);

  // Sync to Firestore
  try {
    const lotRef = doc(db, LOTS_COLLECTION, lot.id);
    await setDoc(lotRef, lot, { merge: true });
  } catch (e) {
    console.warn('Firestore lot save deferred or failed:', e);
  }
};

// Delete a Lot
export const deleteLotInvoice = async (lotId: string): Promise<void> => {
  const lots = getLocalData<LotInvoice[]>(LOTS_STORAGE_KEY, initialLots);
  const updatedLots = lots.filter((l) => l.id !== lotId);
  setLocalData(LOTS_STORAGE_KEY, updatedLots);

  try {
    const lotRef = doc(db, LOTS_COLLECTION, lotId);
    await deleteDoc(lotRef);
  } catch (e) {
    console.warn('Firestore lot delete error:', e);
  }
};

// Firestore Realtime Subscription for Workers
export const subscribeWorkers = (
  onData: (workers: Worker[]) => void,
  onError?: (error: Error) => void
) => {
  try {
    const workersRef = collection(db, WORKERS_COLLECTION);
    return onSnapshot(
      workersRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const remoteWorkers: Worker[] = [];
          snapshot.forEach((docSnap) => {
            remoteWorkers.push(docSnap.data() as Worker);
          });
          setLocalData(WORKERS_STORAGE_KEY, remoteWorkers);
          onData(remoteWorkers);
        } else {
          const local = getLocalData<Worker[]>(WORKERS_STORAGE_KEY, initialWorkers);
          onData(local);
        }
      },
      (err) => {
        console.warn('Firestore workers listener error:', err);
        onData(getLocalData<Worker[]>(WORKERS_STORAGE_KEY, initialWorkers));
        if (onError) onError(err);
      }
    );
  } catch (err) {
    console.warn('Failed to start Firestore workers listener:', err);
    onData(getLocalData<Worker[]>(WORKERS_STORAGE_KEY, initialWorkers));
    return () => {};
  }
};

// Save Worker
export const saveWorker = async (worker: Worker): Promise<void> => {
  const workers = getLocalData<Worker[]>(WORKERS_STORAGE_KEY, initialWorkers);
  const index = workers.findIndex((w) => w.id === worker.id);
  let updatedWorkers: Worker[];
  if (index >= 0) {
    updatedWorkers = [...workers];
    updatedWorkers[index] = worker;
  } else {
    updatedWorkers = [...workers, worker];
  }
  setLocalData(WORKERS_STORAGE_KEY, updatedWorkers);

  try {
    const docRef = doc(db, WORKERS_COLLECTION, worker.id);
    await setDoc(docRef, worker, { merge: true });
  } catch (e) {
    console.warn('Firestore worker save error:', e);
  }
};

// Save Multiple Workers (e.g. bulk import/reset)
export const saveWorkersBulk = async (workers: Worker[]): Promise<void> => {
  setLocalData(WORKERS_STORAGE_KEY, workers);
  try {
    for (const w of workers) {
      const docRef = doc(db, WORKERS_COLLECTION, w.id);
      await setDoc(docRef, w, { merge: true });
    }
  } catch (e) {
    console.warn('Firestore workers bulk save error:', e);
  }
};

// Delete Worker
export const deleteWorker = async (workerId: string): Promise<void> => {
  const workers = getLocalData<Worker[]>(WORKERS_STORAGE_KEY, initialWorkers);
  const updatedWorkers = workers.filter((w) => w.id !== workerId);
  setLocalData(WORKERS_STORAGE_KEY, updatedWorkers);

  try {
    const docRef = doc(db, WORKERS_COLLECTION, workerId);
    await deleteDoc(docRef);
  } catch (e) {
    console.warn('Firestore worker delete error:', e);
  }
};

// Settings
export const getFactorySettings = (): FactorySettings => {
  return getLocalData<FactorySettings>(SETTINGS_STORAGE_KEY, defaultFactorySettings);
};

export const saveFactorySettings = async (settings: FactorySettings): Promise<void> => {
  setLocalData(SETTINGS_STORAGE_KEY, settings);
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, 'factory_main');
    await setDoc(docRef, settings, { merge: true });
  } catch (e) {
    console.warn('Firestore settings save error:', e);
  }
};

// Worker Payments / Advances
export const getWorkerPayments = (workerId?: string): WorkerPayment[] => {
  const all = getLocalData<WorkerPayment[]>(PAYMENTS_STORAGE_KEY, []);
  if (!workerId) return all;
  return all.filter((p) => p.workerId === workerId);
};

export const saveWorkerPayment = async (payment: WorkerPayment): Promise<void> => {
  const payments = getLocalData<WorkerPayment[]>(PAYMENTS_STORAGE_KEY, []);
  const updated = [payment, ...payments.filter((p) => p.id !== payment.id)];
  setLocalData(PAYMENTS_STORAGE_KEY, updated);

  try {
    const docRef = doc(db, PAYMENTS_COLLECTION, payment.id);
    await setDoc(docRef, payment, { merge: true });
  } catch (e) {
    console.warn('Firestore payment save error:', e);
  }
};

export const deleteWorkerPayment = async (paymentId: string): Promise<void> => {
  const payments = getLocalData<WorkerPayment[]>(PAYMENTS_STORAGE_KEY, []);
  const updated = payments.filter((p) => p.id !== paymentId);
  setLocalData(PAYMENTS_STORAGE_KEY, updated);

  try {
    const docRef = doc(db, PAYMENTS_COLLECTION, paymentId);
    await deleteDoc(docRef);
  } catch (e) {
    console.warn('Firestore payment delete error:', e);
  }
};

// CSV Export for Google Sheets and Google Drive
export const exportLotToCSV = (lot: LotInvoice, settings: FactorySettings) => {
  const headers = ['SL No', 'Employee', 'Designation', 'Size', 'Qty DZ', 'Price', 'Total Price', 'Signature'];
  const rows = lot.items.map((item, idx) => [
    idx + 1,
    `"${item.workerName}"`,
    `"${item.designation}"`,
    `"${item.size}"`,
    item.quantity,
    item.rate.toFixed(2),
    item.totalPrice.toFixed(2),
    '""'
  ]);

  const metaRows = [
    [`"${settings.factoryName}"`],
    [`"${settings.addressLine1}, ${settings.addressLine2}, ${settings.country}"`],
    ['"PCS Rate Worker Bill"'],
    [],
    [`"Invoice No:"`, `"${lot.invoiceNo}"`, `""`, `"Invoice Date:"`, `"${lot.invoiceDate}"`],
    [`"Line:"`, `"${lot.line}"`, `""`, `"Receive Date:"`, `"${lot.receiveDate}"`],
    [`"Factory Unit:"`, `"${lot.factoryUnit}"`],
    [`"Category:"`, `"${lot.category}"`],
    [`"Item:"`, `"${lot.item}"`],
    [`"Total DZ:"`, lot.totalTargetDZ || lot.totalQty],
    []
  ];

  const totalRow = [
    'Total',
    '""',
    '""',
    '""',
    lot.totalQty,
    '""',
    lot.totalPrice.toFixed(2),
    '""'
  ];

  const footerRows = [
    [],
    [`"Prepared By: ${lot.preparedBy || ''}"`, `""`, `"Checked By: ${lot.checkedBy || ''}"`, `""`, `"Received By: ${lot.receivedBy || ''}"`]
  ];

  const csvContent = [
    ...metaRows.map(r => r.join(',')),
    headers.join(','),
    ...rows.map(r => r.join(',')),
    totalRow.join(','),
    ...footerRows.map(r => r.join(','))
  ].join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Bill_${lot.invoiceNo}_${lot.item.replace(/\s+/g, '_')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
