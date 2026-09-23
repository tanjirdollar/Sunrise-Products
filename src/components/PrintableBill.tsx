import React, { useState } from 'react';
import { 
  Printer, 
  Download, 
  ArrowLeft, 
  Edit3, 
  UserCheck, 
  FileSpreadsheet,
  Share2,
  CheckCircle2,
  Plus,
  Trash2,
  Users,
  Calculator,
  AlertTriangle,
  Layers,
  Save,
  X
} from 'lucide-react';
import { FactorySettings, LotInvoice, LotItemEntry, Worker } from '../types';
import { exportLotToCSV } from '../services/db';

interface PrintableBillProps {
  lot: LotInvoice;
  settings: FactorySettings;
  workers: Worker[];
  onUpdateLot: (updatedLot: LotInvoice) => void;
  onBack: () => void;
  onEdit: (lot: LotInvoice) => void;
  onSelectWorker: (workerId: string, workerName: string) => void;
}

export const PrintableBill: React.FC<PrintableBillProps> = ({
  lot,
  settings,
  workers,
  onUpdateLot,
  onBack,
  onEdit,
  onSelectWorker
}) => {
  // Worker Assignment Panel State
  const [showAssignDrawer, setShowAssignDrawer] = useState(false);
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [customWorkerName, setCustomWorkerName] = useState('');
  const [workerDesignation, setWorkerDesignation] = useState(settings.defaultDesignation || 'Plain Machine Operator');
  const [workerSize, setWorkerSize] = useState('14/20');
  const [inputPieces, setInputPieces] = useState('');
  const [inputRate, setInputRate] = useState(''); // No default rate! Manual input

  // Inline edit state
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editPieces, setEditPieces] = useState<string>('');
  const [editRate, setEditRate] = useState<string>('');

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    exportLotToCSV(lot, settings);
  };

  // Format currency
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Calculations for progress & totals
  const totalAssignedDZ = lot.items.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0);
  const totalAssignedPcs = lot.items.reduce((sum, i) => sum + (Number(i.pieces) || Math.round((Number(i.quantity) || 0) * 12)), 0);
  const lotTargetDZ = lot.totalTargetDZ || (lot.totalLotPieces ? lot.totalLotPieces / 12 : totalAssignedDZ);
  const lotTargetPcs = lot.totalLotPieces || Math.round(lotTargetDZ * 12);
  const remainingPcs = lotTargetPcs - totalAssignedPcs;
  const remainingDZ = Math.round((lotTargetDZ - totalAssignedDZ) * 100) / 100;

  // Add Worker to this Lot
  const handleAddWorker = () => {
    let name = customWorkerName.trim();
    let designation = workerDesignation.trim() || 'Plain Machine Operator';
    let size = workerSize.trim() || '14/20';

    if (selectedWorkerId) {
      const w = workers.find((item) => item.id === selectedWorkerId);
      if (w) {
        name = w.name;
        designation = w.designation || designation;
        size = w.defaultSize || size;
      }
    }

    if (!name) {
      alert('অনুগ্রহ করে কারিগরের নাম নির্বাচন বা টাইপ করুন');
      return;
    }

    const pcs = parseFloat(inputPieces) || 0;
    if (pcs <= 0) {
      alert('অনুগ্রহ করে মালের পরিমাণ (পিস) দিন');
      return;
    }

    const rate = parseFloat(inputRate) || 0;
    if (rate <= 0) {
      if (!confirm('রেট ০ বা ফাঁকা রয়েছে। আপনি কি এই কারিগরকে রেট ছাড়া মাল যুক্ত করতে চান? (পরেও রেট দেওয়া যাবে)')) {
        return;
      }
    }

    const qtyDZ = Math.round((pcs / 12) * 100) / 100;
    const lineTotal = Math.round(qtyDZ * rate * 100) / 100;

    const newItem: LotItemEntry = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      workerId: selectedWorkerId || `w-custom-${Date.now()}`,
      workerName: name,
      designation,
      size,
      unit: 'DZ',
      pieces: pcs,
      quantity: qtyDZ,
      rate,
      totalPrice: lineTotal,
    };

    const updatedItems = [...lot.items, newItem];
    const newTotalDZ = updatedItems.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0);
    const newTotalPrice = updatedItems.reduce((sum, i) => sum + (Number(i.totalPrice) || 0), 0);

    const updatedLot: LotInvoice = {
      ...lot,
      items: updatedItems,
      totalQty: Math.round(newTotalDZ * 100) / 100,
      totalPrice: Math.round(newTotalPrice * 100) / 100,
      updatedAt: new Date().toISOString(),
    };

    onUpdateLot(updatedLot);

    // Reset inputs
    setSelectedWorkerId('');
    setCustomWorkerName('');
    setInputPieces('');
    setInputRate('');
    setShowAssignDrawer(false);
  };

  // Delete worker row from lot
  const handleDeleteItem = (itemId: string) => {
    if (!confirm('আপনি কি এই কারিগরের এন্ট্রি মুছে ফেলতে চান?')) return;

    const updatedItems = lot.items.filter((i) => i.id !== itemId);
    const newTotalDZ = updatedItems.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0);
    const newTotalPrice = updatedItems.reduce((sum, i) => sum + (Number(i.totalPrice) || 0), 0);

    const updatedLot: LotInvoice = {
      ...lot,
      items: updatedItems,
      totalQty: Math.round(newTotalDZ * 100) / 100,
      totalPrice: Math.round(newTotalPrice * 100) / 100,
      updatedAt: new Date().toISOString(),
    };

    onUpdateLot(updatedLot);
  };

  // Start inline edit
  const handleStartEdit = (item: LotItemEntry) => {
    setEditingItemId(item.id);
    setEditPieces(String(item.pieces ?? Math.round(item.quantity * 12)));
    setEditRate(String(item.rate));
  };

  // Save inline edit
  const handleSaveEdit = (itemId: string) => {
    const pcs = parseFloat(editPieces) || 0;
    const rate = parseFloat(editRate) || 0;
    const qtyDZ = Math.round((pcs / 12) * 100) / 100;
    const lineTotal = Math.round(qtyDZ * rate * 100) / 100;

    const updatedItems = lot.items.map((it) => {
      if (it.id !== itemId) return it;
      return {
        ...it,
        pieces: pcs,
        quantity: qtyDZ,
        rate,
        totalPrice: lineTotal,
      };
    });

    const newTotalDZ = updatedItems.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0);
    const newTotalPrice = updatedItems.reduce((sum, i) => sum + (Number(i.totalPrice) || 0), 0);

    const updatedLot: LotInvoice = {
      ...lot,
      items: updatedItems,
      totalQty: Math.round(newTotalDZ * 100) / 100,
      totalPrice: Math.round(newTotalPrice * 100) / 100,
      updatedAt: new Date().toISOString(),
    };

    onUpdateLot(updatedLot);
    setEditingItemId(null);
  };

  return (
    <div className="min-h-screen bg-slate-100 py-4 sm:py-8 px-2 sm:px-6">
      
      {/* Embedded High-Precision Print Stylesheet */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 5mm 7mm 5mm 7mm !important;
          }
          html, body {
            background: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            font-size: 8.5pt !important;
          }
          .no-print {
            display: none !important;
          }
          .print-container {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
          }
          .print-header {
            margin-bottom: 3px !important;
            padding-bottom: 2px !important;
          }
          .print-meta {
            margin-bottom: 4px !important;
            font-size: 8pt !important;
            line-height: 1.25 !important;
          }
          .print-table {
            width: 100% !important;
            border-collapse: collapse !important;
            border: 1.2px solid #000 !important;
          }
          .print-table th {
            border: 1px solid #000 !important;
            padding: 2px 2px !important;
            font-size: 8pt !important;
            background-color: #f1f5f9 !important;
            font-weight: 700 !important;
            color: #000 !important;
          }
          .print-table td {
            border: 1px solid #000 !important;
            padding: 1.5px 2.5px !important;
            font-size: 8pt !important;
            line-height: 1.15 !important;
            color: #000 !important;
          }
          .print-table tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            height: 17px !important;
          }
          .print-sig-col {
            height: 14px !important;
            padding: 0 !important;
          }
          .print-signatures {
            margin-top: 14px !important;
            padding-top: 10px !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            font-size: 8pt !important;
          }
        }
      `}</style>

      {/* Top Action Bar (Hidden in Print) */}
      <div className="max-w-4xl mx-auto mb-4 flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-xl shadow-sm border border-slate-200 no-print">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3.5 py-2 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>চালান তালিকায় ফিরুন</span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowAssignDrawer(!showAssignDrawer)}
            className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3.5 py-2 rounded-lg shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ কারিগরকে মাল প্রদান করুন</span>
          </button>

          <button
            onClick={() => onEdit(lot)}
            className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-lg transition-colors"
          >
            <Edit3 className="w-4 h-4 text-slate-600" />
            <span>চালান এডিট</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-2 rounded-lg transition-colors"
            title="Excel বা Sheets এ খোলার জন্য CSV ফাইল ডাউনলোড"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">Excel / Sheets</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 px-4 py-2 rounded-lg shadow-sm transition-all active:scale-95"
          >
            <Printer className="w-4 h-4 text-emerald-400" />
            <span>বিল প্রিন্ট (A4)</span>
          </button>
        </div>
      </div>

      {/* Lot Allocation Summary Card (no-print) */}
      <div className="max-w-4xl mx-auto mb-5 bg-white rounded-xl border border-slate-200 p-4 shadow-sm no-print space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600" />
              <span>লট মালের বন্টন ও অগ্রগতি (চালান #{lot.invoiceNo}: {lot.item})</span>
            </h3>
            <p className="text-[11px] text-slate-500">
              একজন একজন করে কারিগরকে মাল দিন। পিস লিখলে স্বয়ংক্রিয়ভাবে ডজন হিসাব হবে।
            </p>
          </div>

          <button
            onClick={() => setShowAssignDrawer(!showAssignDrawer)}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200 flex items-center gap-1 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{showAssignDrawer ? 'ফর্ম বন্ধ করুন' : 'নতুন কারিগরকে মাল দিন'}</span>
          </button>
        </div>

        {/* Progress Metrics */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200">
          <div>
            <span className="text-[10px] text-slate-500 block">লটের মোট মাল</span>
            <span className="font-bold text-slate-900">{lotTargetPcs} PCS</span>
            <span className="text-[10px] text-slate-500 block">({lotTargetDZ.toFixed(2)} DZ)</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block">কারিগরদের দেওয়া হয়েছে</span>
            <span className="font-bold text-emerald-700">{totalAssignedPcs} PCS</span>
            <span className="text-[10px] text-emerald-600 block">({totalAssignedDZ.toFixed(2)} DZ)</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block">অবশিষ্ট বাকি আছে</span>
            <span className={`font-bold ${remainingPcs < 0 ? 'text-red-600' : 'text-amber-600'}`}>
              {remainingPcs} PCS
            </span>
            <span className="text-[10px] text-slate-500 block">({remainingDZ.toFixed(2)} DZ)</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all ${remainingPcs < 0 ? 'bg-red-500' : 'bg-emerald-600'}`}
            style={{
              width: `${Math.min(100, Math.max(0, lotTargetPcs > 0 ? (totalAssignedPcs / lotTargetPcs) * 100 : 0))}%`,
            }}
          />
        </div>

        {/* Worker Assignment Drawer */}
        {showAssignDrawer && (
          <div className="bg-emerald-50/80 border border-emerald-300 rounded-xl p-4 mt-3 space-y-3 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
              <h4 className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-emerald-600" />
                <span>কারিগর নির্বাচন ও মালের পরিমাণ ইনপুট</span>
              </h4>
              <button
                onClick={() => setShowAssignDrawer(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5 text-xs">
              {/* Worker Dropdown / Name */}
              <div className="md:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">কারিগর *</label>
                {workers.length > 0 ? (
                  <select
                    value={selectedWorkerId}
                    onChange={(e) => {
                      setSelectedWorkerId(e.target.value);
                      if (e.target.value) {
                        const w = workers.find((item) => item.id === e.target.value);
                        if (w) {
                          setWorkerDesignation(w.designation || 'Plain Machine Operator');
                          setWorkerSize(w.defaultSize || '14/20');
                        }
                      }
                    }}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-medium"
                  >
                    <option value="">-- কারিগর বেছে নিন ({workers.length} জন আছেন) --</option>
                    {workers.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} {w.cardNo ? `(${w.cardNo})` : ''} - {w.designation || 'Operator'}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={customWorkerName}
                    onChange={(e) => setCustomWorkerName(e.target.value)}
                    placeholder="কারিগরের নাম লিখুন"
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900"
                  />
                )}
                {workers.length > 0 && !selectedWorkerId && (
                  <input
                    type="text"
                    value={customWorkerName}
                    onChange={(e) => setCustomWorkerName(e.target.value)}
                    placeholder="অথবা নতুন কারিগরের নাম লিখুন"
                    className="w-full mt-1.5 p-1.5 bg-white border border-slate-300 rounded-lg text-[11px]"
                  />
                )}
              </div>

              {/* Pieces Input */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">মালের পরিমাণ (পিস) *</label>
                <div className="relative">
                  <input
                    type="number"
                    step="1"
                    min="1"
                    value={inputPieces}
                    onChange={(e) => setInputPieces(e.target.value)}
                    placeholder="যেমন: 60"
                    className="w-full p-2 pr-9 bg-white border border-slate-300 rounded-lg font-bold text-slate-900"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
                    PCS
                  </span>
                </div>
                {parseFloat(inputPieces) > 0 && (
                  <span className="text-[10px] text-emerald-700 font-bold block mt-0.5">
                    = {(parseFloat(inputPieces) / 12).toFixed(2)} DZ
                  </span>
                )}
              </div>

              {/* Rate Input: Manual, No Default */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">রেট (৳ / DZ) *</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    value={inputRate}
                    onChange={(e) => setInputRate(e.target.value)}
                    placeholder="ম্যানুয়াল রেট"
                    className="w-full p-2 pr-7 bg-white border border-slate-300 rounded-lg font-bold text-emerald-700 placeholder:text-slate-400 placeholder:font-normal"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    ৳
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 block mt-0.5">ম্যানুয়ালি ইনপুট</span>
              </div>

              {/* Action Button */}
              <div className="flex flex-col justify-end">
                <button
                  type="button"
                  onClick={handleAddWorker}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-1 shadow-sm transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>মাল প্রদান করুন</span>
                </button>
                {parseFloat(inputPieces) > 0 && parseFloat(inputRate) > 0 && (
                  <span className="text-[10px] text-center font-bold text-slate-800 mt-1">
                    মোট: ৳ {Math.round((parseFloat(inputPieces) / 12) * parseFloat(inputRate)).toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Printable Document Card (High-Density Print Formation) */}
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md border border-slate-300 p-4 sm:p-8 text-slate-900 print-container">
        
        {/* Factory Header */}
        <div className="text-center print-header pb-2 mb-2">
          <h1 className="text-2xl sm:text-3xl print:text-xl font-bold tracking-tight text-slate-950 font-serif leading-tight">
            {lot.factoryUnit || settings.factoryName}
          </h1>
          <p className="text-xs sm:text-sm print:text-[8.5pt] font-medium text-slate-700 mt-0.5 leading-tight">
            {settings.addressLine1}, {settings.addressLine2}, {settings.country}
          </p>

          <div className="mt-1.5 print:mt-1">
            <h2 className="text-base sm:text-lg print:text-[11pt] font-bold tracking-wide text-slate-950 uppercase underline underline-offset-4 decoration-1 font-serif">
              {settings.billTitle || 'PCS Rate Worker Bill'}
            </h2>
          </div>
        </div>

        {/* Invoice Metadata Grid (Item description clearly directly above worker list) */}
        <div className="grid grid-cols-2 text-xs sm:text-sm print:text-[8pt] font-sans mb-3 print:mb-1.5 pt-1 border-y border-slate-200 print:border-black py-1.5 print:py-1 print-meta">
          {/* Left Metadata Column */}
          <div className="space-y-0.5 print:space-y-0">
            <div className="flex">
              <span className="font-bold w-24 sm:w-28 print:w-20 text-slate-800 print:text-black">Invoice No :</span>
              <span className="font-extrabold text-slate-950 font-mono">{lot.invoiceNo}</span>
            </div>
            <div className="flex">
              <span className="font-bold w-24 sm:w-28 print:w-20 text-slate-800 print:text-black">Line :</span>
              <span className="text-slate-900 font-medium">{lot.line}</span>
            </div>
            <div className="flex">
              <span className="font-bold w-24 sm:w-28 print:w-20 text-slate-800 print:text-black">Factory Unit :</span>
              <span className="text-slate-900 font-medium">{lot.factoryUnit || settings.factoryName}</span>
            </div>
            <div className="flex">
              <span className="font-bold w-24 sm:w-28 print:w-20 text-slate-800 print:text-black">Category :</span>
              <span className="font-medium text-slate-900">{lot.category}</span>
            </div>
            <div className="flex bg-slate-100 print:bg-transparent px-1 py-0.5 rounded">
              <span className="font-bold w-24 sm:w-28 print:w-20 text-slate-900 print:text-black">Item :</span>
              <span className="font-bold text-slate-950 underline underline-offset-2">{lot.item}</span>
            </div>
          </div>

          {/* Right Metadata Column */}
          <div className="space-y-0.5 print:space-y-0 text-right">
            <div className="flex justify-end">
              <span className="font-bold text-slate-800 print:text-black mr-2">Invoice Date :</span>
              <span className="font-medium text-slate-950 font-mono">{lot.invoiceDate}</span>
            </div>
            <div className="flex justify-end">
              <span className="font-bold text-slate-800 print:text-black mr-2">Receive Date :</span>
              <span className="font-medium text-slate-950 font-mono">{lot.receiveDate}</span>
            </div>
            <div className="flex justify-end pt-1">
              <span className="font-bold text-slate-800 print:text-black mr-2">Total Lot :</span>
              <span className="font-black text-slate-950 font-mono bg-slate-100 print:bg-transparent px-1.5 py-0.5 rounded">
                {lotTargetDZ.toFixed(2)} DZ ({lotTargetPcs} PCS)
              </span>
            </div>
            <div className="flex justify-end text-[11px] print:text-[7.5pt] text-slate-600 print:text-black pt-0.5">
              <span>মাল প্রাপ্ত কারিগর: {lot.items.length} জন</span>
            </div>
          </div>
        </div>

        {/* Bill Table (Engineered to fit at least 30-35 workers on Page 1) */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-slate-900 print:border-black text-xs sm:text-sm print:text-[8pt] print-table">
            <thead>
              <tr className="bg-slate-100 print:bg-slate-200 text-slate-950 text-center font-bold">
                <th className="border border-slate-900 print:border-black px-1.5 py-1 print:py-0.5 w-8 print:w-7">SL</th>
                <th className="border border-slate-900 print:border-black px-2 py-1 print:py-0.5 text-left w-48 print:w-36">Employee</th>
                <th className="border border-slate-900 print:border-black px-2 py-1 print:py-0.5 text-left w-44 print:w-32">Designation</th>
                <th className="border border-slate-900 print:border-black px-1.5 py-1 print:py-0.5 w-14 print:w-12">Size</th>
                <th className="border border-slate-900 print:border-black px-1.5 py-1 print:py-0.5 w-18 print:w-16">Qty (PCS)</th>
                <th className="border border-slate-900 print:border-black px-1.5 py-1 print:py-0.5 w-18 print:w-16">Qty DZ</th>
                <th className="border border-slate-900 print:border-black px-1.5 py-1 print:py-0.5 w-16 print:w-14">Price</th>
                <th className="border border-slate-900 print:border-black px-2 py-1 print:py-0.5 w-24 print:w-20">Total Price</th>
                <th className="border border-slate-900 print:border-black px-2 py-1 print:py-0.5 w-24 print:w-20">Signature</th>
                <th className="border border-slate-900 px-1 py-1 w-14 no-print">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody>
              {lot.items.length === 0 ? (
                <tr>
                  <td colSpan={10} className="border border-slate-900 p-8 text-center bg-slate-50">
                    <Users className="w-8 h-8 text-slate-300 mx-auto mb-2 no-print" />
                    <p className="font-bold text-slate-700 text-sm">
                      এই লটে এখনো কোনো কারিগরকে মাল প্রদান করা হয়নি
                    </p>
                    <p className="text-xs text-slate-500 mt-1 no-print">
                      উপরে <strong>"+ কারিগরকে মাল প্রদান করুন"</strong> বাটনে ক্লিক করে একজন একজন করে কারিগরকে মাল দিন।
                    </p>
                    <button
                      onClick={() => setShowAssignDrawer(true)}
                      className="mt-3 text-xs font-semibold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-4 py-1.5 rounded-lg border border-emerald-300 no-print"
                    >
                      + প্রথম কারিগরকে মাল দিন
                    </button>
                  </td>
                </tr>
              ) : (
                lot.items.map((item, index) => {
                  const pcs = item.pieces ?? Math.round(item.quantity * 12);
                  const isEditing = editingItemId === item.id;

                  return (
                    <tr key={item.id || index} className="hover:bg-slate-50">
                      {/* SL No */}
                      <td className="border border-slate-900 print:border-black px-1 py-0.5 text-center font-bold text-slate-800 print:text-black font-mono">
                        {index + 1}
                      </td>

                      {/* Employee Name */}
                      <td className="border border-slate-900 print:border-black px-2 py-0.5 font-bold text-slate-950 print:text-black">
                        <button
                          type="button"
                          onClick={() => onSelectWorker(item.workerId, item.workerName)}
                          className="text-left font-bold hover:text-emerald-700 hover:underline group flex items-center justify-between w-full"
                          title="খতিয়ান দেখতে ক্লিক করুন"
                        >
                          <span className="truncate">{item.workerName}</span>
                          <span className="no-print text-[10px] text-emerald-600 opacity-0 group-hover:opacity-100 font-sans ml-1">
                            খতিয়ান ↗
                          </span>
                        </button>
                      </td>

                      {/* Designation */}
                      <td className="border border-slate-900 print:border-black px-2 py-0.5 text-slate-800 print:text-black truncate">
                        {item.designation}
                      </td>

                      {/* Size */}
                      <td className="border border-slate-900 print:border-black px-1 py-0.5 text-center text-slate-800 print:text-black font-mono">
                        {item.size || '14/20'}
                      </td>

                      {/* Qty PCS */}
                      <td className="border border-slate-900 print:border-black px-1 py-0.5 text-center font-bold text-slate-950 print:text-black font-mono">
                        {isEditing ? (
                          <input
                            type="number"
                            step="1"
                            value={editPieces}
                            onChange={(e) => setEditPieces(e.target.value)}
                            className="w-14 p-0.5 text-center font-bold border border-emerald-400 rounded"
                          />
                        ) : (
                          `${pcs}`
                        )}
                      </td>

                      {/* Qty DZ */}
                      <td className="border border-slate-900 print:border-black px-1 py-0.5 text-center font-bold text-slate-950 print:text-black font-mono">
                        {isEditing && parseFloat(editPieces) > 0
                          ? (parseFloat(editPieces) / 12).toFixed(2)
                          : item.quantity.toFixed(2)}
                      </td>

                      {/* Price / Rate (Tk/DZ) */}
                      <td className="border border-slate-900 print:border-black px-1.5 py-0.5 text-right font-medium text-slate-900 print:text-black font-mono">
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.01"
                            value={editRate}
                            onChange={(e) => setEditRate(e.target.value)}
                            className="w-14 p-0.5 text-right font-bold border border-emerald-400 rounded"
                          />
                        ) : (
                          item.rate.toFixed(2)
                        )}
                      </td>

                      {/* Total Price */}
                      <td className="border border-slate-900 print:border-black px-2 py-0.5 text-right font-bold text-slate-950 print:text-black font-mono">
                        {isEditing && parseFloat(editPieces) > 0 && parseFloat(editRate) > 0
                          ? formatMoney((parseFloat(editPieces) / 12) * parseFloat(editRate))
                          : formatMoney(item.totalPrice)}
                      </td>

                      {/* Signature Box */}
                      <td className="border border-slate-900 print:border-black px-1 py-0.5 text-center align-middle print-sig-col">
                        <div className="w-full border-b border-dotted border-slate-300 print:border-transparent h-3.5 print:h-2"></div>
                      </td>

                      {/* Action column (Hidden in print) */}
                      <td className="border border-slate-900 px-1 py-0.5 text-center no-print">
                        {isEditing ? (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleSaveEdit(item.id)}
                              className="p-1 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded"
                              title="সংরক্ষণ"
                            >
                              <Save className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingItemId(null)}
                              className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded"
                              title="বাতিল"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleStartEdit(item)}
                              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded"
                              title="পিস বা রেট পরিবর্তন"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteItem(item.id)}
                              className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                              title="মুছে ফেলুন"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}

              {/* Total Row */}
              <tr className="bg-slate-100 print:bg-slate-200 font-bold text-slate-950">
                <td colSpan={4} className="border border-slate-900 print:border-black px-2 py-1 print:py-0.5 text-center text-xs print:text-[8pt] font-serif uppercase tracking-wider">
                  Total
                </td>
                <td className="border border-slate-900 print:border-black px-1.5 py-1 print:py-0.5 text-center font-black text-slate-950 font-mono">
                  {totalAssignedPcs}
                </td>
                <td className="border border-slate-900 print:border-black px-1.5 py-1 print:py-0.5 text-center font-black text-slate-950 font-mono">
                  {lot.totalQty.toFixed(2)}
                </td>
                <td className="border border-slate-900 print:border-black px-1 py-1 print:py-0.5 text-center text-xs text-slate-600">
                  -
                </td>
                <td className="border border-slate-900 print:border-black px-2 py-1 print:py-0.5 text-right font-black text-slate-950 font-mono">
                  {formatMoney(lot.totalPrice)}
                </td>
                <td className="border border-slate-900 print:border-black px-1 py-1 print:py-0.5 text-center text-[10px] print:text-[7pt] text-slate-600 font-medium">
                  {lot.items.length} জন
                </td>
                <td className="border border-slate-900 px-1 py-1 no-print"></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Triple Signature Blocks (Compact & fit on page 1) */}
        <div className="grid grid-cols-3 gap-6 pt-10 sm:pt-14 print:pt-4 mt-5 print:mt-2 text-xs sm:text-sm print:text-[8pt] text-slate-900 font-medium print-signatures">
          {/* Prepared By */}
          <div className="text-center">
            <div className="border-t border-slate-900 print:border-black pt-1 font-bold text-slate-950">
              Prepared By
            </div>
            <p className="text-[11px] print:text-[7pt] text-slate-600 print:text-black mt-0.5">
              {lot.preparedBy || 'Production Incharge'}
            </p>
          </div>

          {/* Checked By */}
          <div className="text-center">
            <div className="border-t border-slate-900 print:border-black pt-1 font-bold text-slate-950">
              Checked By
            </div>
            <p className="text-[11px] print:text-[7pt] text-slate-600 print:text-black mt-0.5">
              {lot.checkedBy || 'Sweing Supervisor'}
            </p>
          </div>

          {/* Received By */}
          <div className="text-center">
            <div className="border-t border-slate-900 print:border-black pt-1 font-bold text-slate-950">
              Received By
            </div>
            <p className="text-[11px] print:text-[7pt] text-slate-600 print:text-black mt-0.5">
              {lot.receivedBy || 'Factory Admin'}
            </p>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-6 print:mt-1.5 pt-2 print:pt-1 border-t border-slate-200 print:border-slate-400 flex items-center justify-between text-[11px] print:text-[7pt] text-slate-500 print:text-black">
          <span>চালান সিস্টেম: StitchTrack Pro • Narayanganj Garments Hub</span>
          <span>প্রিন্ট তারিখ: {new Date().toLocaleDateString('en-GB')}</span>
        </div>

      </div>

    </div>
  );
};
