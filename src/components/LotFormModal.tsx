import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  Users, 
  Search, 
  Save, 
  Layers, 
  Calculator,
  AlertCircle,
  FileText,
  Clock,
  CheckCircle2,
  Package
} from 'lucide-react';
import { FactorySettings, LotInvoice, LotItemEntry, Worker } from '../types';

interface LotFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (lot: LotInvoice) => void;
  initialLot?: LotInvoice | null;
  workers: Worker[];
  settings: FactorySettings;
  existingLots: LotInvoice[];
}

export const LotFormModal: React.FC<LotFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialLot,
  workers,
  settings,
  existingLots,
}) => {
  // Auto invoice number for new lot
  const nextInvoiceNo = useMemo(() => {
    if (initialLot) return initialLot.invoiceNo;
    const nums = existingLots
      .map((l) => parseInt(l.invoiceNo.replace(/\D/g, ''), 10))
      .filter((n) => !isNaN(n));
    const maxNum = nums.length > 0 ? Math.max(...nums) : 2616;
    return String(maxNum + 1);
  }, [initialLot, existingLots]);

  const todayStr = new Date().toISOString().split('T')[0];

  // Lot Core Details
  const [invoiceNo, setInvoiceNo] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(todayStr);
  const [receiveDate, setReceiveDate] = useState(todayStr);
  const [line, setLine] = useState(settings.defaultLine || 'Sweing');
  const [factoryUnit, setFactoryUnit] = useState(settings.factoryName || 'Tex Wear Fashion');
  const [category, setCategory] = useState('হাফ হাতা');
  const [customCategory, setCustomCategory] = useState('');
  const [item, setItem] = useState('');

  // Total Quantity: Pieces & Dozen
  const [totalLotPieces, setTotalLotPieces] = useState<string>('720');
  const [totalTargetDZ, setTotalTargetDZ] = useState<string>('60.00');

  const [preparedBy, setPreparedBy] = useState('Production Incharge');
  const [checkedBy, setCheckedBy] = useState('Sweing Supervisor');
  const [receivedBy, setReceivedBy] = useState('Factory Admin');
  const [status, setStatus] = useState<'draft' | 'completed' | 'paid'>('completed');

  // Items assigned to workers (initially empty for new lots)
  const [items, setItems] = useState<LotItemEntry[]>([]);

  // Manual worker assignment state inside modal (for editing existing lots or optionally assigning)
  const [showAddWorkerRow, setShowAddWorkerRow] = useState(false);
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [workerCustomName, setWorkerCustomName] = useState('');
  const [workerDesignation, setWorkerDesignation] = useState(settings.defaultDesignation || 'Plain Machine Operator');
  const [workerSize, setWorkerSize] = useState('14/20');
  const [workerInputPcs, setWorkerInputPcs] = useState('');
  const [workerInputRate, setWorkerInputRate] = useState(''); // No default rate!

  // Reset or initialize
  useEffect(() => {
    if (!isOpen) return;

    if (initialLot) {
      setInvoiceNo(initialLot.invoiceNo);
      setInvoiceDate(initialLot.invoiceDate);
      setReceiveDate(initialLot.receiveDate);
      setLine(initialLot.line);
      setFactoryUnit(initialLot.factoryUnit);
      setCategory(initialLot.category);
      setItem(initialLot.item);

      const lotDZ = initialLot.totalTargetDZ || initialLot.totalQty || 0;
      const lotPcs = initialLot.totalLotPieces || Math.round(lotDZ * 12);
      setTotalLotPieces(lotPcs > 0 ? String(lotPcs) : '');
      setTotalTargetDZ(lotDZ > 0 ? lotDZ.toFixed(2) : '');

      setPreparedBy(initialLot.preparedBy || 'Production Incharge');
      setCheckedBy(initialLot.checkedBy || 'Sweing Supervisor');
      setReceivedBy(initialLot.receivedBy || 'Factory Admin');
      setStatus(initialLot.status);
      setItems(initialLot.items || []);
    } else {
      setInvoiceNo(nextInvoiceNo);
      setInvoiceDate(todayStr);
      setReceiveDate(todayStr);
      setLine(settings.defaultLine || 'Sweing');
      setFactoryUnit(settings.factoryName || 'Tex Wear Fashion');
      setCategory('হাফ হাতা');
      setItem('');
      setTotalLotPieces('720');
      setTotalTargetDZ('60.00');
      setPreparedBy('Production Incharge');
      setCheckedBy('Sweing Supervisor');
      setReceivedBy('Factory Admin');
      setStatus('completed');
      setItems([]); // Empty: No workers entered initially as requested!
    }

    setShowAddWorkerRow(false);
    setSelectedWorkerId('');
    setWorkerCustomName('');
    setWorkerInputPcs('');
    setWorkerInputRate('');
  }, [isOpen, initialLot, nextInvoiceNo, settings, todayStr]);

  if (!isOpen) return null;

  // Handle Lot Quantity Pcs change -> Auto calc Dozen
  const handlePcsChange = (pcsStr: string) => {
    setTotalLotPieces(pcsStr);
    const pcsNum = parseFloat(pcsStr);
    if (!isNaN(pcsNum) && pcsNum >= 0) {
      setTotalTargetDZ((pcsNum / 12).toFixed(2));
    } else {
      setTotalTargetDZ('');
    }
  };

  // Handle Lot Quantity Dozen change -> Auto calc Pcs
  const handleDZChange = (dzStr: string) => {
    setTotalTargetDZ(dzStr);
    const dzNum = parseFloat(dzStr);
    if (!isNaN(dzNum) && dzNum >= 0) {
      setTotalLotPieces(String(Math.round(dzNum * 12)));
    } else {
      setTotalLotPieces('');
    }
  };

  // Update existing item row
  const handleUpdateItemRow = (id: string, field: keyof LotItemEntry, val: any) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        const updated = { ...it, [field]: val };

        if (field === 'pieces') {
          const pcs = parseFloat(val) || 0;
          updated.pieces = pcs;
          updated.quantity = Math.round((pcs / 12) * 100) / 100;
          updated.totalPrice = Math.round(updated.quantity * (updated.rate || 0) * 100) / 100;
        } else if (field === 'quantity') {
          const qtyDZ = parseFloat(val) || 0;
          updated.quantity = qtyDZ;
          updated.pieces = Math.round(qtyDZ * 12);
          updated.totalPrice = Math.round(qtyDZ * (updated.rate || 0) * 100) / 100;
        } else if (field === 'rate') {
          const rateNum = parseFloat(val) || 0;
          updated.rate = rateNum;
          updated.totalPrice = Math.round((updated.quantity || 0) * rateNum * 100) / 100;
        }

        return updated;
      })
    );
  };

  // Add a new worker row
  const handleAddWorkerToLot = () => {
    let name = workerCustomName.trim();
    let designation = workerDesignation.trim() || 'Plain Machine Operator';
    let size = workerSize.trim() || '14/20';

    if (selectedWorkerId) {
      const found = workers.find((w) => w.id === selectedWorkerId);
      if (found) {
        name = found.name;
        designation = found.designation || designation;
        size = found.defaultSize || size;
      }
    }

    if (!name) {
      alert('অনুগ্রহ করে কারিগরের নাম নির্বাচন বা লিখুন');
      return;
    }

    const pcs = parseFloat(workerInputPcs) || 0;
    if (pcs <= 0) {
      alert('অনুগ্রহ করে মালের পরিমাণ (পিস) দিন');
      return;
    }

    const rate = parseFloat(workerInputRate) || 0;
    if (rate <= 0) {
      if (!confirm('রেট ০ বা ফাঁকা রয়েছে। আপনি কি রেট ছাড়া মাল যোগ করতে চান? (পরেও রেট দেওয়া যাবে)')) {
        return;
      }
    }

    const qtyDZ = Math.round((pcs / 12) * 100) / 100;
    const total = Math.round(qtyDZ * rate * 100) / 100;

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
      totalPrice: total,
    };

    setItems((prev) => [...prev, newItem]);

    // Reset single worker inputs
    setSelectedWorkerId('');
    setWorkerCustomName('');
    setWorkerInputPcs('');
    setWorkerInputRate('');
    setShowAddWorkerRow(false);
  };

  const handleRemoveItem = (itemId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== itemId));
  };

  // Totals calculation
  const totalAssignedDZ = items.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0);
  const totalAssignedPieces = items.reduce((sum, i) => sum + (Number(i.pieces) || Math.round((Number(i.quantity) || 0) * 12)), 0);
  const totalBillAmount = items.reduce((sum, i) => sum + (Number(i.totalPrice) || 0), 0);

  const lotTargetDZ = parseFloat(totalTargetDZ) || totalAssignedDZ;
  const lotTargetPieces = parseFloat(totalLotPieces) || Math.round(lotTargetDZ * 12);
  const remainingPieces = lotTargetPieces - totalAssignedPieces;
  const remainingDZ = Math.round((lotTargetDZ - totalAssignedDZ) * 100) / 100;

  // Form Submit
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!invoiceNo.trim()) {
      alert('অনুগ্রহ করে চালান বা ইনভয়েস নম্বর দিন');
      return;
    }

    if (!item.trim()) {
      alert('অনুগ্রহ করে মালের নাম বা বিবরণ দিন (যেমন: Formal Shirt বা T-Shirt)');
      return;
    }

    const finalCategory = category === 'অন্যান্য' && customCategory.trim() ? customCategory.trim() : category;

    const lotData: LotInvoice = {
      id: initialLot ? initialLot.id : `lot-${invoiceNo.trim()}-${Date.now()}`,
      invoiceNo: invoiceNo.trim(),
      invoiceDate,
      receiveDate,
      line,
      factoryUnit,
      category: finalCategory,
      item: item.trim(),
      totalLotPieces: lotTargetPieces,
      totalTargetDZ: lotTargetDZ,
      items, // Can be empty when creating lot first!
      totalQty: Math.round(totalAssignedDZ * 100) / 100,
      totalPrice: Math.round(totalBillAmount * 100) / 100,
      preparedBy,
      checkedBy,
      receivedBy,
      status,
      createdAt: initialLot ? initialLot.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(lotData);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">
                {initialLot ? `লট চালান এডিট: #${initialLot.invoiceNo}` : 'নতুন লট এন্ট্রি (Lot Entry)'}
              </h2>
              <p className="text-xs text-slate-400">
                আগে চালান ও মালের বিবরণ দিয়ে লট সংরক্ষণ করুন, পরে পর্যায়ক্রমে কারিগরকে মাল দেওয়া যাবে
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* STEP 1: Lot Master Information */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>১. লট ও চালানের প্রাথমিক বিবরণ</span>
              </h3>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                লট তৈরি
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              {/* Invoice No */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  চালান নং (Invoice No) *
                </label>
                <input
                  type="text"
                  required
                  value={invoiceNo}
                  onChange={(e) => setInvoiceNo(e.target.value)}
                  placeholder="যেমন: 2616"
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Invoice Date */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">চালানের তারিখ</label>
                <input
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Receive Date */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">মাল গ্রহণের তারিখ</label>
                <input
                  type="date"
                  value={receiveDate}
                  onChange={(e) => setReceiveDate(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Line */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">লাইন (Line)</label>
                <input
                  type="text"
                  value={line}
                  onChange={(e) => setLine(e.target.value)}
                  placeholder="Sweing"
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs pt-1">
              {/* Item Name */}
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">
                  মালের নাম ও বিবরণ (Item Description) *
                </label>
                <input
                  type="text"
                  required
                  value={item}
                  onChange={(e) => setItem(e.target.value)}
                  placeholder="যেমন: New York City Shirt Hata / Polo T-Shirt"
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">ক্যাটাগরি</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="হাফ হাতা">হাফ হাতা</option>
                  <option value="ফুল হাতা">ফুল হাতা</option>
                  <option value="টি-শার্ট">টি-শার্ট</option>
                  <option value="পোলো শার্ট">পোলো শার্ট</option>
                  <option value="প্যান্ট / ট্রাউজার">প্যান্ট / ট্রাউজার</option>
                  <option value="অন্যান্য">অন্যান্য</option>
                </select>
                {category === 'অন্যান্য' && (
                  <input
                    type="text"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="ক্যাটাগরির নাম লিখুন"
                    className="w-full mt-1.5 p-2 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                )}
              </div>
            </div>

            {/* LOT QUANTITY: Pieces & Dozen Converter */}
            <div className="bg-white border border-emerald-200 rounded-xl p-3.5 mt-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <div>
                  <h4 className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                    <Calculator className="w-4 h-4 text-emerald-600" />
                    <span>লটের মোট মালের পরিমাণ (Total Lot Quantity)</span>
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    পিস (Pieces) লিখলে স্বয়ংক্রিয়ভাবে ডজন (DZ) হিসাব হবে (১ ডজন = ১২ পিস)
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    মোট মাল (পিস / Pieces) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="1"
                      min="1"
                      value={totalLotPieces}
                      onChange={(e) => handlePcsChange(e.target.value)}
                      placeholder="যেমন: 720"
                      className="w-full p-2.5 pl-3 pr-14 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">
                      PCS
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    মোট মাল (ডজন / DZ)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={totalTargetDZ}
                      onChange={(e) => handleDZChange(e.target.value)}
                      placeholder="যেমন: 60.00"
                      className="w-full p-2.5 pl-3 pr-12 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">
                      DZ
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Optional Authorities */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">প্রস্তুতকারক (Prepared By)</label>
                <input
                  type="text"
                  value={preparedBy}
                  onChange={(e) => setPreparedBy(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-700"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">যাচাইকারী (Checked By)</label>
                <input
                  type="text"
                  value={checkedBy}
                  onChange={(e) => setCheckedBy(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-700"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">গ্রহণকারী (Received By)</label>
                <input
                  type="text"
                  value={receivedBy}
                  onChange={(e) => setReceivedBy(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-700"
                />
              </div>
            </div>
          </div>

          {/* STEP 2: Worker Distribution Section (Sequential / Optional on initial creation) */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-600" />
                  <span>২. কারিগরদের মাল প্রদান (Worker Distribution)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  লট তৈরি করার পর একজন একজন করে কারিগরকে মাল বিতরণ করা যাবে। ডিফল্ট কোনো রেট নেই, ম্যানুয়ালি ইনপুট হবে।
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddWorkerRow(!showAddWorkerRow)}
                className="self-start sm:self-auto flex items-center gap-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-2 rounded-lg shadow-xs transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>+ কারিগরকে মাল প্রদান করুন</span>
              </button>
            </div>

            {/* Live Distribution Progress Bar */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 font-medium text-slate-700 mb-1.5">
                <span>লটের মোট মাল: <strong>{lotTargetPieces} পিস ({lotTargetDZ} DZ)</strong></span>
                <span>বিতরণ হয়েছে: <strong className="text-emerald-700">{totalAssignedPieces} পিস ({totalAssignedDZ.toFixed(2)} DZ)</strong></span>
                <span>অবশিষ্ট বাকি: <strong className={remainingPieces < 0 ? 'text-red-600' : 'text-amber-600'}>{remainingPieces} পিস ({remainingDZ.toFixed(2)} DZ)</strong></span>
              </div>
              <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    remainingPieces < 0 ? 'bg-red-500' : 'bg-emerald-500'
                  }`}
                  style={{
                    width: `${Math.min(100, Math.max(0, lotTargetPieces > 0 ? (totalAssignedPieces / lotTargetPieces) * 100 : 0))}%`,
                  }}
                />
              </div>
            </div>

            {/* Quick Add Worker Form Drawer */}
            {showAddWorkerRow && (
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 animate-in fade-in slide-in-from-top-2 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5 text-emerald-600" />
                    <span>কারিগরকে নির্দিষ্ট মালের পরিমাণ ও রেট প্রদান</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => setShowAddWorkerRow(false)}
                    className="text-slate-400 hover:text-slate-600 p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5 text-xs">
                  {/* Select Worker */}
                  <div className="md:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">কারিগর নির্বাচন *</label>
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
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-800 font-medium"
                      >
                        <option value="">-- কারিগর নির্বাচন করুন ({workers.length} জন আছেন) --</option>
                        {workers.map((w) => (
                          <option key={w.id} value={w.id}>
                            {w.name} {w.cardNo ? `(${w.cardNo})` : ''} - {w.designation || 'Operator'}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={workerCustomName}
                        onChange={(e) => setWorkerCustomName(e.target.value)}
                        placeholder="কারিগরের নাম লিখুন"
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-800"
                      />
                    )}
                    {workers.length > 0 && !selectedWorkerId && (
                      <input
                        type="text"
                        value={workerCustomName}
                        onChange={(e) => setWorkerCustomName(e.target.value)}
                        placeholder="অথবা নতুন কারিগরের নাম টাইপ করুন"
                        className="w-full mt-1.5 p-1.5 bg-white border border-slate-300 rounded-lg text-[11px]"
                      />
                    )}
                  </div>

                  {/* Quantity in Pieces */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">মালের পরিমাণ (পিস) *</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="1"
                        min="1"
                        value={workerInputPcs}
                        onChange={(e) => setWorkerInputPcs(e.target.value)}
                        placeholder="যেমন: 60"
                        className="w-full p-2 pr-10 bg-white border border-slate-300 rounded-lg font-bold text-slate-900"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
                        PCS
                      </span>
                    </div>
                    {parseFloat(workerInputPcs) > 0 && (
                      <span className="text-[10px] text-emerald-700 font-medium block mt-0.5">
                        = {(parseFloat(workerInputPcs) / 12).toFixed(2)} DZ
                      </span>
                    )}
                  </div>

                  {/* Rate: Manual Input, No Default! */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      রেট (৳ / DZ) *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        value={workerInputRate}
                        onChange={(e) => setWorkerInputRate(e.target.value)}
                        placeholder="ম্যানুয়াল রেট দিন"
                        className="w-full p-2 pr-8 bg-white border border-slate-300 rounded-lg font-bold text-emerald-700 placeholder:text-slate-400 placeholder:font-normal"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                        ৳
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      একেক মালে ম্যানুয়ালি ইনপুট
                    </span>
                  </div>

                  {/* Add Button & Calculated Subtotal */}
                  <div className="flex flex-col justify-end">
                    <button
                      type="button"
                      onClick={handleAddWorkerToLot}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-3 rounded-lg flex items-center justify-center gap-1 shadow-xs transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>যোগ করুন</span>
                    </button>
                    {parseFloat(workerInputPcs) > 0 && parseFloat(workerInputRate) > 0 && (
                      <span className="text-[10px] text-center font-bold text-slate-700 mt-1">
                        মোট: ৳ {Math.round((parseFloat(workerInputPcs) / 12) * parseFloat(workerInputRate)).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Workers Table or Empty Guidance */}
            {items.length === 0 ? (
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center bg-slate-50/50">
                <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <h4 className="text-xs sm:text-sm font-bold text-slate-700">
                  এখনো কোনো কারিগরকে মাল দেওয়া হয়নি
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  লটটি সংরক্ষণ করার পরও চালান ভিউ থেকে যেকোনো সময় একজন একজন করে কারিগর যুক্ত করে পিস ও রেট এন্ট্রি করতে পারবেন।
                </p>
                <button
                  type="button"
                  onClick={() => setShowAddWorkerRow(true)}
                  className="mt-3 text-xs font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200"
                >
                  + এখনই প্রথম কারিগরকে মাল দিন
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5 w-10 text-center">#</th>
                      <th className="p-2.5">কারিগরের নাম</th>
                      <th className="p-2.5">পদবি</th>
                      <th className="p-2.5 w-20">সাইজ</th>
                      <th className="p-2.5 w-28 text-center">মালের পরিমাণ (PCS)</th>
                      <th className="p-2.5 w-24 text-center">ডজন (DZ)</th>
                      <th className="p-2.5 w-28 text-right">রেট (৳ / DZ)</th>
                      <th className="p-2.5 w-28 text-right">মোট টাকা</th>
                      <th className="p-2.5 w-12 text-center">মুছুন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {items.map((itemRow, idx) => {
                      const itemPcs = itemRow.pieces ?? Math.round(itemRow.quantity * 12);
                      return (
                        <tr key={itemRow.id} className="hover:bg-slate-50">
                          <td className="p-2 text-center text-slate-400 font-mono">
                            {idx + 1}
                          </td>
                          <td className="p-2 font-bold text-slate-900">
                            {itemRow.workerName}
                          </td>
                          <td className="p-2 text-slate-600">
                            <input
                              type="text"
                              value={itemRow.designation}
                              onChange={(e) => handleUpdateItemRow(itemRow.id, 'designation', e.target.value)}
                              className="w-full p-1 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-emerald-500 focus:bg-white rounded text-xs"
                            />
                          </td>
                          <td className="p-2 text-center text-slate-700">
                            <input
                              type="text"
                              value={itemRow.size}
                              onChange={(e) => handleUpdateItemRow(itemRow.id, 'size', e.target.value)}
                              className="w-16 p-1 text-center bg-transparent border-b border-transparent hover:border-slate-300 focus:border-emerald-500 focus:bg-white rounded text-xs font-mono"
                            />
                          </td>
                          <td className="p-2 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <input
                                type="number"
                                step="1"
                                min="0"
                                value={itemPcs}
                                onChange={(e) => handleUpdateItemRow(itemRow.id, 'pieces', e.target.value)}
                                className="w-20 p-1 text-center font-bold text-slate-900 border border-slate-200 rounded focus:border-emerald-500 focus:bg-white"
                              />
                              <span className="text-[10px] text-slate-400 font-semibold">PCS</span>
                            </div>
                          </td>
                          <td className="p-2 text-center font-bold text-emerald-700">
                            {itemRow.quantity.toFixed(2)} DZ
                          </td>
                          <td className="p-2 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <span className="text-slate-400 text-xs">৳</span>
                              <input
                                type="number"
                                step="0.01"
                                value={itemRow.rate || ''}
                                placeholder="রেট দিন"
                                onChange={(e) => handleUpdateItemRow(itemRow.id, 'rate', e.target.value)}
                                className="w-20 p-1 text-right font-bold text-slate-900 border border-slate-200 rounded focus:border-emerald-500 focus:bg-white placeholder:text-slate-300 placeholder:font-normal"
                              />
                            </div>
                          </td>
                          <td className="p-2 text-right font-bold text-slate-950">
                            ৳ {Math.round(itemRow.totalPrice).toLocaleString()}
                          </td>
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(itemRow.id)}
                              className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-red-50"
                              title="বাদ দিন"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-slate-50 font-bold border-t border-slate-300 text-slate-900">
                    <tr>
                      <td colSpan={4} className="p-2.5 text-center uppercase font-mono text-xs">
                        মোট বিতরণকৃত মাল
                      </td>
                      <td className="p-2.5 text-center font-bold text-slate-900">
                        {totalAssignedPieces} PCS
                      </td>
                      <td className="p-2.5 text-center font-bold text-emerald-700">
                        {totalAssignedDZ.toFixed(2)} DZ
                      </td>
                      <td className="p-2.5 text-right text-xs text-slate-500">
                        মোট মজুরি:
                      </td>
                      <td className="p-2.5 text-right text-emerald-800 text-sm">
                        ৳ {Math.round(totalBillAmount).toLocaleString()}
                      </td>
                      <td className="p-2.5"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* Modal Footer Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200 bg-white sticky bottom-0">
            <div className="text-xs text-slate-600 flex items-center gap-2">
              <span className="font-semibold">চালান অবস্থা:</span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="p-1.5 bg-slate-50 border border-slate-300 rounded-md font-medium text-xs text-slate-800"
              >
                <option value="completed">সম্পন্ন (Completed)</option>
                <option value="draft">ড্রাফট (Draft)</option>
                <option value="paid">পরিশোধিত (Paid)</option>
              </select>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-none px-4 py-2.5 text-xs sm:text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                বাতিল
              </button>

              <button
                type="submit"
                className="flex-1 sm:flex-none px-6 py-2.5 text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>{initialLot ? 'লট আপডেট করুন' : 'লট সংরক্ষণ করুন'}</span>
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
