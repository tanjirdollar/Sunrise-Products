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
  GoogleAuthProvider,
  User 
} from 'firebase/auth';
import { auth, db, googleProvider } from '../firebase/config';
import { FactorySettings, LotInvoice, Worker, WorkerPayment } from '../types';
import { defaultFactorySettings, initialLots, initialWorkers, demoWorkers, demoLots } from '../data/seedData';
import { 
  setGoogleAccessToken, 
  getGoogleAccessToken, 
  syncLotsToGoogleSheets, 
  syncWorkersToGoogleSheets,
  getOrCreateSpreadsheet,
  getSpreadsheetUrl,
  getSavedSpreadsheetId
} from './googleSheets';

// Use clean storage keys to guarantee fresh empty slate
const LOTS_STORAGE_KEY = 'stitchtrack_lots_v2';
const WORKERS_STORAGE_KEY = 'stitchtrack_workers_v2';
const SETTINGS_STORAGE_KEY = 'stitchtrack_settings_v2';
const PAYMENTS_STORAGE_KEY = 'stitchtrack_payments_v2';

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
export const signInWithGoogle = async (): Promise<{ user: User; accessToken: string | null }> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const accessToken = credential?.accessToken || null;
    if (accessToken) {
      setGoogleAccessToken(accessToken);
    }
    return { user: result.user, accessToken };
  } catch (error) {
    console.error('Google Sign-In Error:', error);
    throw error;
  }
};

export const logOut = async (): Promise<void> => {
  try {
    await fbSignOut(auth);
    setGoogleAccessToken(null);
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

// Initialize data: Load 50 demo workers & sample lot by default (can be reset anytime)
export const initializeData = async () => {
  // Clear any old mock data from previous version keys
  localStorage.removeItem('stitchtrack_lots_v1');
  localStorage.removeItem('stitchtrack_workers_v1');

  const hasBeenReset = localStorage.getItem('stitchtrack_has_been_reset');
  if (!hasBeenReset) {
    const existingWorkers = getLocalData<Worker[]>(WORKERS_STORAGE_KEY, []);
    if (existingWorkers.length === 0) {
      setLocalData(WORKERS_STORAGE_KEY, demoWorkers);
    }
    const existingLots = getLocalData<LotInvoice[]>(LOTS_STORAGE_KEY, []);
    if (existingLots.length === 0) {
      setLocalData(LOTS_STORAGE_KEY, demoLots);
    }
  } else {
    if (!localStorage.getItem(WORKERS_STORAGE_KEY)) {
      setLocalData(WORKERS_STORAGE_KEY, []);
    }
    if (!localStorage.getItem(LOTS_STORAGE_KEY)) {
      setLocalData(LOTS_STORAGE_KEY, []);
    }
  }

  if (!localStorage.getItem(SETTINGS_STORAGE_KEY)) {
    setLocalData(SETTINGS_STORAGE_KEY, defaultFactorySettings);
  }
};

// Load 50 Demo Garments Workers & 32-Worker Sample Lot
export const loadDemoData = async (): Promise<{ workers: Worker[]; lots: LotInvoice[] }> => {
  localStorage.removeItem('stitchtrack_has_been_reset');
  setLocalData(WORKERS_STORAGE_KEY, demoWorkers);
  setLocalData(LOTS_STORAGE_KEY, demoLots);

  try {
    for (const w of demoWorkers) {
      await setDoc(doc(db, WORKERS_COLLECTION, w.id), w, { merge: true });
    }
    for (const l of demoLots) {
      await setDoc(doc(db, LOTS_COLLECTION, l.id), l, { merge: true });
    }
  } catch (e) {
    console.warn('Firestore demo save deferred:', e);
  }

  if (getGoogleAccessToken()) {
    try {
      await syncLotsToGoogleSheets(demoLots);
      await syncWorkersToGoogleSheets(demoWorkers);
    } catch (e) {
      console.warn('Sheets demo sync deferred:', e);
    }
  }

  return { workers: demoWorkers, lots: demoLots };
};

// Reset all demo data to clean slate
export const resetAllData = async (): Promise<{ workers: Worker[]; lots: LotInvoice[] }> => {
  localStorage.setItem('stitchtrack_has_been_reset', 'true');
  const currentWorkers = getLocalData<Worker[]>(WORKERS_STORAGE_KEY, []);
  const currentLots = getLocalData<LotInvoice[]>(LOTS_STORAGE_KEY, []);

  try {
    for (const w of currentWorkers) {
      await deleteDoc(doc(db, WORKERS_COLLECTION, w.id));
    }
    for (const l of currentLots) {
      await deleteDoc(doc(db, LOTS_COLLECTION, l.id));
    }
  } catch (e) {
    console.warn('Firestore reset clear deferred:', e);
  }

  setLocalData(WORKERS_STORAGE_KEY, []);
  setLocalData(LOTS_STORAGE_KEY, []);
  setLocalData(PAYMENTS_STORAGE_KEY, []);

  if (getGoogleAccessToken()) {
    try {
      await syncLotsToGoogleSheets([]);
      await syncWorkersToGoogleSheets([]);
    } catch (e) {
      console.warn('Sheets reset sync deferred:', e);
    }
  }

  return { workers: [], lots: [] };
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
          const local = getLocalData<LotInvoice[]>(LOTS_STORAGE_KEY, []);
          onData(local);
        }
      },
      (err) => {
        console.warn('Firestore lots listener error (falling back to local):', err);
        const local = getLocalData<LotInvoice[]>(LOTS_STORAGE_KEY, []);
        onData(local);
        if (onError) onError(err);
      }
    );
  } catch (err) {
    console.warn('Failed to start Firestore lots listener:', err);
    onData(getLocalData<LotInvoice[]>(LOTS_STORAGE_KEY, []));
    return () => {};
  }
};

// Save a Lot & Auto-Sync to Google Sheets
export const saveLotInvoice = async (lot: LotInvoice): Promise<void> => {
  const lots = getLocalData<LotInvoice[]>(LOTS_STORAGE_KEY, []);
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

  // Automatic Google Sheets Sync
  if (getGoogleAccessToken()) {
    try {
      await syncLotsToGoogleSheets(updatedLots);
    } catch (sheetError) {
      console.warn('Auto Google Sheets sync for lot deferred:', sheetError);
    }
  }
};

// Delete a Lot & Auto-Sync to Google Sheets (removes from sheet immediately)
export const deleteLotInvoice = async (lotId: string): Promise<void> => {
  const lots = getLocalData<LotInvoice[]>(LOTS_STORAGE_KEY, []);
  const updatedLots = lots.filter((l) => l.id !== lotId);
  setLocalData(LOTS_STORAGE_KEY, updatedLots);

  try {
    const lotRef = doc(db, LOTS_COLLECTION, lotId);
    await deleteDoc(lotRef);
  } catch (e) {
    console.warn('Firestore lot delete error:', e);
  }

  // Immediate deletion from Google Sheets
  if (getGoogleAccessToken()) {
    try {
      await syncLotsToGoogleSheets(updatedLots);
    } catch (sheetError) {
      console.warn('Google Sheets lot deletion sync deferred:', sheetError);
    }
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
          const local = getLocalData<Worker[]>(WORKERS_STORAGE_KEY, []);
          onData(local);
        }
      },
      (err) => {
        console.warn('Firestore workers listener error:', err);
        onData(getLocalData<Worker[]>(WORKERS_STORAGE_KEY, []));
        if (onError) onError(err);
      }
    );
  } catch (err) {
    console.warn('Failed to start Firestore workers listener:', err);
    onData(getLocalData<Worker[]>(WORKERS_STORAGE_KEY, []));
    return () => {};
  }
};

// Save Worker & Auto-Sync to Google Sheets
export const saveWorker = async (worker: Worker): Promise<void> => {
  const workers = getLocalData<Worker[]>(WORKERS_STORAGE_KEY, []);
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

  // Automatic Google Sheets Sync
  if (getGoogleAccessToken()) {
    try {
      await syncWorkersToGoogleSheets(updatedWorkers);
    } catch (sheetError) {
      console.warn('Auto Google Sheets sync for worker deferred:', sheetError);
    }
  }
};

// Delete Worker & Auto-Sync to Google Sheets (removes from sheet immediately)
export const deleteWorker = async (workerId: string): Promise<void> => {
  const workers = getLocalData<Worker[]>(WORKERS_STORAGE_KEY, []);
  const updatedWorkers = workers.filter((w) => w.id !== workerId);
  setLocalData(WORKERS_STORAGE_KEY, updatedWorkers);

  try {
    const docRef = doc(db, WORKERS_COLLECTION, workerId);
    await deleteDoc(docRef);
  } catch (e) {
    console.warn('Firestore worker delete error:', e);
  }

  // Immediate deletion from Google Sheets
  if (getGoogleAccessToken()) {
    try {
      await syncWorkersToGoogleSheets(updatedWorkers);
    } catch (sheetError) {
      console.warn('Google Sheets worker deletion sync deferred:', sheetError);
    }
  }
};

// Resync All data to Google Sheets
export const resyncAllToGoogleSheets = async (): Promise<string> => {
  const lots = getLocalData<LotInvoice[]>(LOTS_STORAGE_KEY, []);
  const workers = getLocalData<Worker[]>(WORKERS_STORAGE_KEY, []);
  
  const spreadsheetId = await getOrCreateSpreadsheet();
  await syncLotsToGoogleSheets(lots);
  await syncWorkersToGoogleSheets(workers);
  return getSpreadsheetUrl(spreadsheetId) || '';
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

// CSV Export for backup
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
