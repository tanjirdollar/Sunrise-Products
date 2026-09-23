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
  subscribeToAuth 
} from './services/db';
import { FactorySettings, LotInvoice, Worker, WorkerPayment } from './types';
import { defaultFactorySettings, initialLots, initialWorkers } from './data/seedData';
import { Navbar } from './components/Navbar';
import { LotList } from './components/LotList';
import { PrintableBill } from './components/PrintableBill';
import { LotFormModal } from './components/LotFormModal';
import { WorkerLedgerModal } from './components/WorkerLedgerModal';
import { WorkerManagerModal } from './components/WorkerManagerModal';
import { SettingsModal } from './components/SettingsModal';

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

  // Initialize and subscribe
  useEffect(() => {
    initializeData();
    setSettings(getFactorySettings());
    setPayments(getWorkerPayments());

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
      await signInWithGoogle();
    } catch (err: any) {
      alert('Google Sign-in এ সমস্যা হয়েছে: ' + (err.message || err));
    }
  };

  const handleLogout = async () => {
    try {
      await logOut();
    } catch (err: any) {
      console.error('Logout error:', err);
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
    setIsSyncing(false);
    setIsLotFormOpen(false);
    setEditingLot(null);
    // Open the printable bill immediately so user can review/print
    setViewingLot(lot);
  };

  const handleDeleteLot = async (lotId: string) => {
    await deleteLotInvoice(lotId);
    if (viewingLot && viewingLot.id === lotId) {
      setViewingLot(null);
    }
  };

  // Worker Handlers
  const handleSaveWorker = async (worker: Worker) => {
    await saveWorker(worker);
  };

  const handleDeleteWorker = async (workerId: string) => {
    await deleteWorker(workerId);
  };

  const handleSelectWorkerByNameOrId = (workerId: string, workerName: string) => {
    let found = workers.find((w) => w.id === workerId);
    if (!found) {
      found = workers.find((w) => w.name.toLowerCase().trim() === workerName.toLowerCase().trim());
    }
    if (!found) {
      // Create temporary worker object for khotiyan if missing
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
    if (confirm('আপনি কি ফ্যাক্টরি সেটিংস ডেমো মান অনুযায়ী রিসেট করতে চান?')) {
      handleSaveSettings(defaultFactorySettings);
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
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 lg:p-8">
        
        {/* If viewing a printable bill sheet */}
        {viewingLot ? (
          <PrintableBill
            lot={viewingLot}
            settings={settings}
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
              />
            )}

            {/* Tab: Factory Settings */}
            {activeTab === 'settings' && (
              <SettingsModal
                settings={settings}
                onSave={handleSaveSettings}
                onResetDefaults={handleResetSettings}
              />
            )}
          </>
        )}

      </main>

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
          {settings.factoryName} • পিস-রেট কারিগর বিলিং ও খতিয়ান ম্যানেজমেন্ট সিস্টেম • Firebase ক্লাউড ব্যাকআপ
        </p>
      </footer>

    </div>
  );
}
