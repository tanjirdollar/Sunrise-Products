/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { 
  initializeData, 
  subscribeLots, 
  subscribeWorkers, 
  saveLotInvoice, 
  deleteLotInvoice, 
  saveWorker, 
  deleteWorker, 
  getFactorySettings, 
  saveFactorySettings, 
  getWorkerPayments, 
  saveWorkerPayment, 
  deleteWorkerPayment, 
  signInWithGoogle, 
  logOut, 
  subscribeToAuth,
  resyncAllToGoogleSheets,
  loadDemoData,
  resetAllData
} from './services/db';
import { getSpreadsheetUrl, getGoogleAccessToken } from './services/googleSheets';
import { FactorySettings, LotInvoice, Worker, WorkerPayment } from './types';
import { defaultFactorySettings, initialLots, initialWorkers } from './data/seedData';
import { Navbar } from './components/Navbar';
import { LotList } from './components/LotList';
import { PrintableBill } from './components/PrintableBill';
import { LotFormModal } from './components/LotFormModal';
import { WorkerLedgerModal } from './components/WorkerLedgerModal';
import { WorkerManagerModal } from './components/WorkerManagerModal';
import { SettingsModal } from './components/SettingsModal';
import { ExternalLink, Check, AlertTriangle, X, RefreshCw, Sparkles } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [lots, setLots] = useState<LotInvoice[]>(initialLots);
  const [workers, setWorkers] = useState<Worker[]>(initialWorkers);
  const [payments, setPayments] = useState<WorkerPayment[]>([]);
  const [settings, setSettings] = useState<FactorySettings>(defaultFactorySettings);
  
  // Navigation & Modal state
  const [activeTab, setActiveTab] = useState<'lots' | 'workers' | 'settings'>('lots');
  const [viewingLot, setViewingLot] = useState<LotInvoice | null>(null);
  const [isLotFormOpen, setIsLotFormOpen] = useState(false);
  const [editingLot, setEditingLot] = useState<LotInvoice | null>(null);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [sheetUrl, setSheetUrl] = useState<string | null>(getSpreadsheetUrl());
  const [syncToast, setSyncToast] = useState<{ message: string; url?: string } | null>(null);
  
  // API activation instruction modal
  const [apiActivationModal, setApiActivationModal] = useState<{
    isOpen: boolean;
    url: string;
  } | null>(null);

  // Initialize and subscribe
  useEffect(() => {
    initializeData();
    setSettings(getFactorySettings());
    setPayments(getWorkerPayments());
    setSheetUrl(getSpreadsheetUrl());

    const unsubAuth = subscribeToAuth((currentUser) => {
      setUser(currentUser);
    });

    const unsubLots = subscribeLots((updatedLots) => {
      setLots(updatedLots);
    });

    const unsubWorkers = subscribeWorkers((updatedWorkers) => {
      setWorkers(updatedWorkers);
    });

    return () => {
      unsubAuth();
      unsubLots();
      unsubWorkers();
    };
  }, []);

  // Auth Handlers
  const handleLogin = async () => {
    try {
      setIsSyncing(true);
      const res = await signInWithGoogle();
      if (res.accessToken) {
        // Attempt syncing to Google Sheets
        try {
          const url = await resyncAllToGoogleSheets();
          setSheetUrl(url);
          setSyncToast({
            message: 'Google Sheets এর সাথে সফলভাবে কানেক্ট ও সিঙ্ক হয়েছে!',
            url,
          });
          setTimeout(() => setSyncToast(null), 6000);
        } catch (sheetErr: any) {
          console.warn('Google Sheets sync deferred on login:', sheetErr);
          if (sheetErr.isApiDisabled || sheetErr.message?.includes('sheets.googleapis.com')) {
            setApiActivationModal({
              isOpen: true,
              url: sheetErr.activationUrl || 'https://console.developers.google.com/apis/api/sheets.googleapis.com/overview?project=858072248658'
            });
          }
        }
      }
    } catch (err: any) {
      alert('Google Sign-in এ সমস্যা হয়েছে: ' + (err.message || err));
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logOut();
      setUser(null);
    } catch (err: any) {
      console.error('Logout error:', err);
    }
  };

  // Manual trigger to sync all data to Google Sheets
  const handleManualSyncSheets = async () => {
    const token = getGoogleAccessToken();
    if (!user || !token) {
      await handleLogin();
      return;
    }

    try {
      setIsSyncing(true);
      const url = await resyncAllToGoogleSheets();
      setSheetUrl(url);
      setSyncToast({
        message: 'সকল চালান ও কারিগর ডেটা Google Sheets এ সিঙ্ক করা হয়েছে!',
        url,
      });
      setTimeout(() => setSyncToast(null), 6000);
    } catch (err: any) {
      if (err.isUnauthorized || err.message?.includes('Google Sign-In required') || err.message?.includes('মেয়াদোত্তীর্ণ')) {
        await handleLogin();
      } else if (err.isApiDisabled || err.message?.includes('sheets.googleapis.com')) {
        setApiActivationModal({
          isOpen: true,
          url: err.activationUrl || 'https://console.developers.google.com/apis/api/sheets.googleapis.com/overview?project=858072248658'
        });
      } else {
        alert('Google Sheets এ সিঙ্ক করতে ব্যর্থ: ' + (err.message || err));
      }
    } finally {
      setIsSyncing(false);
    }
  };

  // Lot Handlers
  const handleOpenNewLot = () => {
    setEditingLot(null);
    setIsLotFormOpen(true);
  };

  const handleEditLot = (lot: LotInvoice) => {
    setEditingLot(lot);
    setIsLotFormOpen(true);
  };

  const handleSaveLot = async (lot: LotInvoice) => {
    setIsSyncing(true);
    await saveLotInvoice(lot);
    setSheetUrl(getSpreadsheetUrl());
    setIsSyncing(false);
    setIsLotFormOpen(false);
    setEditingLot(null);
    setViewingLot(lot);

    if (user) {
      setSyncToast({
        message: `চালান #${lot.invoiceNo} সংরক্ষিত হয়েছে এবং Google Sheets এ সিঙ্ক হয়েছে`,
        url: getSpreadsheetUrl() || undefined,
      });
      setTimeout(() => setSyncToast(null), 4000);
    }
  };

  const handleDeleteLot = async (lotId: string) => {
    setIsSyncing(true);
    await deleteLotInvoice(lotId);
    setSheetUrl(getSpreadsheetUrl());
    setIsSyncing(false);

    if (viewingLot && viewingLot.id === lotId) {
      setViewingLot(null);
    }

    if (user) {
      setSyncToast({
        message: 'চালানটি মুছে ফেলা হয়েছে এবং Google Sheets থেকেও রিমুভ হয়েছে',
        url: getSpreadsheetUrl() || undefined,
      });
      setTimeout(() => setSyncToast(null), 4000);
    }
  };

  // Worker Handlers
  const handleSaveWorker = async (worker: Worker) => {
    setIsSyncing(true);
    await saveWorker(worker);
    setSheetUrl(getSpreadsheetUrl());
    setIsSyncing(false);
  };

  const handleDeleteWorker = async (workerId: string) => {
    setIsSyncing(true);
    await deleteWorker(workerId);
    setSheetUrl(getSpreadsheetUrl());
    setIsSyncing(false);
  };

  const handleSelectWorkerByNameOrId = (workerId: string, workerName: string) => {
    let found = workers.find((w) => w.id === workerId);
    if (!found) {
      found = workers.find((w) => w.name.toLowerCase().trim() === workerName.toLowerCase().trim());
    }
    if (!found) {
      found = {
        id: workerId || `w-${Date.now()}`,
        name: workerName,
        designation: 'Plain Machine Operator',
        active: true,
        createdAt: new Date().toISOString(),
      };
    }
    setSelectedWorker(found);
  };

  // Payment Handlers
  const handleAddPayment = async (payment: WorkerPayment) => {
    await saveWorkerPayment(payment);
    setPayments(getWorkerPayments());
  };

  const handleDeletePayment = async (paymentId: string) => {
    await deleteWorkerPayment(paymentId);
    setPayments(getWorkerPayments());
  };

  // Settings Handlers
  const handleSaveSettings = async (newSettings: FactorySettings) => {
    setSettings(newSettings);
    await saveFactorySettings(newSettings);
  };

  const handleResetSettings = () => {
    if (confirm('আপনি কি ফ্যাক্টরি সেটিংস ডিফল্ট মান অনুযায়ী রিসেট করতে চান?')) {
      handleSaveSettings(defaultFactorySettings);
    }
  };

  // Demo Data & Factory Reset Handlers
  const handleLoadDemoData = async () => {
    try {
      setIsSyncing(true);
      const data = await loadDemoData();
      setWorkers(data.workers);
      setLots(data.lots);
      setSyncToast({
        message: '৫০ জন ডেমো কারিগর ও নমুনা চালান সফলভাবে লোড হয়েছে!',
        url: getSpreadsheetUrl() || undefined,
      });
      setTimeout(() => setSyncToast(null), 5000);
    } catch (e: any) {
      alert('ডেমো ডেটা লোড করতে ব্যর্থ: ' + e.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleResetAllData = async () => {
    try {
      setIsSyncing(true);
      const data = await resetAllData();
      setWorkers(data.workers);
      setLots(data.lots);
      setViewingLot(null);
      setSelectedWorker(null);
      setEditingLot(null);
      setSyncToast({
        message: 'সমস্ত ডেটা মুছে কারখানা সম্পূর্ণ খালি (Clean Slate) করা হয়েছে',
      });
      setTimeout(() => setSyncToast(null), 4000);
    } catch (e: any) {
      alert('ডেটা রিসেট করতে সমস্যা হয়েছে: ' + e.message);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      
      {/* Top Navbar */}
      <Navbar
        user={user}
        settings={settings}
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setViewingLot(null);
        }}
        onOpenNewLot={handleOpenNewLot}
        onLogin={handleLogin}
        onLogout={handleLogout}
        isSyncing={isSyncing}
        workersCount={workers.length}
        sheetUrl={sheetUrl}
        onManualSyncSheets={handleManualSyncSheets}
      />

      {/* Real-time Google Sheets Sync Notification Banner */}
      {syncToast && (
        <div className="bg-emerald-900 text-emerald-100 px-4 py-2.5 shadow-md flex items-center justify-between text-xs sm:text-sm animate-fadeIn no-print">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{syncToast.message}</span>
            </div>
            {syncToast.url && (
              <a
                href={syncToast.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold underline hover:text-white flex items-center gap-1 shrink-0"
              >
                <span>Google Sheets দেখুন</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 lg:p-8">
        
        {/* If viewing a printable bill sheet */}
        {viewingLot ? (
          <PrintableBill
            lot={viewingLot}
            settings={settings}
            workers={workers}
            onUpdateLot={handleSaveLot}
            onBack={() => setViewingLot(null)}
            onEdit={handleEditLot}
            onSelectWorker={handleSelectWorkerByNameOrId}
          />
        ) : (
          <>
            {/* Tab: Lots and Invoices */}
            {activeTab === 'lots' && (
              <LotList
                lots={lots}
                settings={settings}
                onOpenLot={(lot) => setViewingLot(lot)}
                onEditLot={handleEditLot}
                onDeleteLot={handleDeleteLot}
                onNewLot={handleOpenNewLot}
              />
            )}

            {/* Tab: Workers Directory & Khotiyan */}
            {activeTab === 'workers' && (
              <WorkerManagerModal
                workers={workers}
                allLots={lots}
                settings={settings}
                onSelectWorker={(w) => setSelectedWorker(w)}
                onSaveWorker={handleSaveWorker}
                onDeleteWorker={handleDeleteWorker}
                onLoadDemoWorkers={handleLoadDemoData}
                onResetAllData={handleResetAllData}
              />
            )}

            {/* Tab: Factory Settings */}
            {activeTab === 'settings' && (
              <SettingsModal
                settings={settings}
                onSave={handleSaveSettings}
                onResetDefaults={handleResetSettings}
                onLoadDemoData={handleLoadDemoData}
                onResetAllData={handleResetAllData}
              />
            )}
          </>
        )}

      </main>

      {/* MODAL: Google Sheets API Activation Helper */}
      {apiActivationModal && apiActivationModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-amber-200 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <button
                onClick={() => setApiActivationModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <h3 className="text-base sm:text-lg font-bold text-slate-800 mt-3">
              Google Sheets API চালু (Enable) করুন
            </h3>
            
            <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
              আপনার Google প্রজেক্টে (<strong>858072248658 / scanne-bijoy</strong>) সরাসরি স্প্রেডশিট তৈরির জন্য Google Sheets API টি এখনো চালু করা হয়নি।
            </p>

            <div className="mt-4 bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 space-y-2 text-xs text-amber-900">
              <p className="font-semibold text-amber-950 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-600" />
                মাত্র ১ ক্লিকে চালু করার নিয়ম:
              </p>
              <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-700 pl-1">
                <li>নিচের নীল বাটনে ক্লিক করলে Google Cloud পেজটি খুলবে।</li>
                <li>সেখানে থাকা নীল <strong>"ENABLE"</strong> বাটনে চাপ দিন।</li>
                <li>চালু করার পর এই পেজে ফিরে এসে নিচের <strong>"এখনই সিঙ্ক করুন"</strong> চাপুন।</li>
              </ol>
            </div>

            <div className="mt-5 flex flex-col sm:flex-row gap-2.5">
              <a
                href={apiActivationModal.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-xl text-xs sm:text-sm text-center flex items-center justify-center gap-1.5 shadow-sm transition-colors"
              >
                <span>Google Sheets API চালু করুন</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                onClick={() => {
                  setApiActivationModal(null);
                  handleManualSyncSheets();
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 px-4 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>এখনই সিঙ্ক করুন</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: New Lot / Edit Lot Form */}
      <LotFormModal
        isOpen={isLotFormOpen}
        onClose={() => {
          setIsLotFormOpen(false);
          setEditingLot(null);
        }}
        onSave={handleSaveLot}
        initialLot={editingLot}
        workers={workers}
        settings={settings}
        existingLots={lots}
      />

      {/* MODAL: Worker Khotiyan (Personal Ledger & Printable Slip) */}
      {selectedWorker && (
        <WorkerLedgerModal
          worker={selectedWorker}
          allLots={lots}
          payments={payments}
          settings={settings}
          onClose={() => setSelectedWorker(null)}
          onOpenLot={(lot) => {
            setSelectedWorker(null);
            setViewingLot(lot);
          }}
          onAddPayment={handleAddPayment}
          onDeletePayment={handleDeletePayment}
        />
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500 no-print">
        <p>
          {settings.factoryName} • পিস-রেট কারিগর বিলিং ও খতিয়ান ম্যানেজমেন্ট • Google Sheets & Firebase রিয়েল-টাইম অটো-সিঙ্ক
        </p>
      </footer>

    </div>
  );
}
