import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  Users, 
  Search, 
  Check, 
  CheckSquare, 
  Square, 
  Save, 
  Layers, 
  Calculator,
  AlertCircle
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
  // Determine next auto invoice number if creating new
  const nextInvoiceNo = useMemo(() => {
    if (initialLot) return initialLot.invoiceNo;
    const nums = existingLots
      .map((l) => parseInt(l.invoiceNo.replace(/\D/g, ''), 10))
      .filter((n) => !isNaN(n));
    const maxNum = nums.length > 0 ? Math.max(...nums) : 2616;
    return String(maxNum + 1);
  }, [initialLot, existingLots]);

  // Today's date YYYY-MM-DD
  const todayStr = new Date().toISOString().split('T')[0];

  // Form State
  const [invoiceNo, setInvoiceNo] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(todayStr);
  const [receiveDate, setReceiveDate] = useState(todayStr);
  const [line, setLine] = useState(settings.defaultLine || 'Sweing');
  const [factoryUnit, setFactoryUnit] = useState(settings.factoryName || 'Tex Wear Fashion');
  const [category, setCategory] = useState('হাফ হাতা');
  const [customCategory, setCustomCategory] = useState('');
  const [item, setItem] = useState('');
  const [totalTargetDZ, setTotalTargetDZ] = useState<number | string>(72);
  const [preparedBy, setPreparedBy] = useState('Production Incharge');
  const [checkedBy, setCheckedBy] = useState('Sweing Supervisor');
  const [receivedBy, setReceivedBy] = useState('Factory Admin');
  const [status, setStatus] = useState<'draft' | 'completed' | 'paid'>('completed');

  // Items
  const [items, setItems] = useState<LotItemEntry[]>([]);

  // Worker selector modal inside form
  const [showWorkerPicker, setShowWorkerPicker] = useState(false);
  const [workerSearch, setWorkerSearch] = useState('');
  const [selectedWorkerIds, setSelectedWorkerIds] = useState<Set<string>>(new Set());

  // Batch fill helpers
  const [bulkRate, setBulkRate] = useState<string>('246');
  const [bulkSize, setBulkSize] = useState<string>('14/20');
  const [bulkDesignation, setBulkDesignation] = useState<string>(settings.defaultDesignation || 'Plain Machine Operator');

  // Initialize or reset form
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
      setTotalTargetDZ(initialLot.totalTargetDZ || initialLot.totalQty);
      setPreparedBy(initialLot.preparedBy || 'Production Incharge');
      setCheckedBy(initialLot.checkedBy || 'Sweing Supervisor');
      setReceivedBy(initialLot.receivedBy || 'Factory Admin');
      setStatus(initialLot.status);
      setItems(initialLot.items || []);
      setSelectedWorkerIds(new Set((initialLot.items || []).map((i) => i.workerId)));
    } else {
      setInvoiceNo(nextInvoiceNo);
      setInvoiceDate(todayStr);
      setReceiveDate(todayStr);
      setLine(settings.defaultLine || 'Sweing');
      setFactoryUnit(settings.factoryName || 'Tex Wear Fashion');
      setCategory('হাফ হাতা');
      setItem('');
      setTotalTargetDZ(72);
      setPreparedBy('Production Incharge');
      setCheckedBy('Sweing Supervisor');
      setReceivedBy('Factory Admin');
      setStatus('completed');
      setItems([]);
      setSelectedWorkerIds(new Set());
    }
  }, [isOpen, initialLot, nextInvoiceNo, settings, todayStr]);

  if (!isOpen) return null;

  // Filtered workers for picker
  const filteredWorkers = workers.filter((w) => {
    const q = workerSearch.toLowerCase().trim();
    return (
      w.name.toLowerCase().includes(q) ||
      (w.cardNo && w.cardNo.toLowerCase().includes(q)) ||
      (w.designation && w.designation.toLowerCase().includes(q))
    );
  });

  // Toggle worker in picker
  const handleToggleWorker = (workerId: string) => {
    const next = new Set(selectedWorkerIds);
    if (next.has(workerId)) {
      next.delete(workerId);
    } else {
      next.add(workerId);
    }
    setSelectedWorkerIds(next);
  };

  const handleSelectAllWorkers = () => {
    const next = new Set(filteredWorkers.map((w) => w.id));
    setSelectedWorkerIds(next);
  };

  const handleClearAllWorkers = () => {
    setSelectedWorkerIds(new Set());
  };

  // Confirm worker picker selection and synchronize items table
  const handleApplyWorkerSelection = () => {
    const currentItemWorkerIds = new Set(items.map((i) => i.workerId));
    
    // Add newly selected workers
    const newItems: LotItemEntry[] = [...items];

    selectedWorkerIds.forEach((wId) => {
      if (!currentItemWorkerIds.has(wId)) {
        const worker = workers.find((w) => w.id === wId);
        if (worker) {
          newItems.push({
            id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            workerId: worker.id,
            workerName: worker.name,
            designation: worker.designation || settings.defaultDesignation || 'Plain Machine Operator',
            size: worker.defaultSize || bulkSize || '14/20',
            unit: 'DZ',
            quantity: 5, // reasonable starting quantity
            rate: worker.defaultRate || (parseFloat(bulkRate) || 246),
            totalPrice: 5 * (worker.defaultRate || (parseFloat(bulkRate) || 246)),
          });
        }
      }
    });

    // Optionally keep existing items or remove unselected
    const filteredItems = newItems.filter((item) => selectedWorkerIds.has(item.workerId));
    setItems(filteredItems);
    setShowWorkerPicker(false);
  };

  // Item row editing
  const handleUpdateItem = (id: string, field: keyof LotItemEntry, value: any) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        if (field === 'quantity' || field === 'rate') {
          const qty = field === 'quantity' ? parseFloat(value) || 0 : item.quantity;
          const rate = field === 'rate' ? parseFloat(value) || 0 : item.rate;
          updated.totalPrice = Math.round(qty * rate * 100) / 100;
        }
        return updated;
      })
    );
  };

  // Remove row
  const handleRemoveItem = (id: string, workerId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    const nextSelected = new Set(selectedWorkerIds);
    // Only remove from selection if no other row has this workerId
    const otherRows = items.filter((i) => i.id !== id && i.workerId === workerId);
    if (otherRows.length === 0) {
      nextSelected.delete(workerId);
      setSelectedWorkerIds(nextSelected);
    }
  };

  // Duplicate row for same worker (e.g., Md. Roni did 2 different sizes or operations)
  const handleDuplicateRow = (item: LotItemEntry) => {
    const newItem: LotItemEntry = {
      ...item,
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    };
    setItems((prev) => [...prev, newItem]);
  };

  // Batch actions
  const handleApplyBulkRate = () => {
    const rateNum = parseFloat(bulkRate);
    if (isNaN(rateNum)) return;
    setItems((prev) =>
      prev.map((item) => ({
        ...item,
        rate: rateNum,
        totalPrice: Math.round(item.quantity * rateNum * 100) / 100,
      }))
    );
  };

  const handleApplyBulkSize = () => {
    if (!bulkSize.trim()) return;
    setItems((prev) =>
      prev.map((item) => ({
        ...item,
        size: bulkSize,
      }))
    );
  };

  const handleApplyBulkDesignation = () => {
    if (!bulkDesignation.trim()) return;
    setItems((prev) =>
      prev.map((item) => ({
        ...item,
        designation: bulkDesignation,
      }))
    );
  };

  // Totals
  const totalQtyDZ = items.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0);
  const totalBillAmount = items.reduce((sum, i) => sum + (Number(i.totalPrice) || 0), 0);
  const targetDZ = parseFloat(String(totalTargetDZ)) || 0;
  const dzDifference = Math.round((totalQtyDZ - targetDZ) * 100) / 100;

  // Save handler
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!invoiceNo.trim()) {
      alert('অনুগ্রহ করে চালান বা ইনভয়েস নম্বর দিন');
      return;
    }

    if (items.length === 0) {
      alert('অনুগ্রহ করে অন্তত একজন কারিগরের নাম সিলেক্ট করুন');
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
      item: item.trim() || 'Shirt Sweing Lot',
      totalTargetDZ: targetDZ || totalQtyDZ,
      items,
      totalQty: Math.round(totalQtyDZ * 100) / 100,
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
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between border-b border-slate-800">
          <div>
            <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-400" />
              <span>{initialLot ? `চালান সম্পাদন (Invoice #${invoiceNo})` : 'নতুন লট চালান এন্ট্রি'}</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              কারিগরের নাম, সাইজ, ডজন ও রেট এন্ট্রি করুন • স্বয়ংক্রিয়ভাবে মোট হিসাব তৈরি হবে
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* Section 1: Lot Header / Meta Information */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              চালানের মূল তথ্য (Header Information)
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              
              {/* Invoice No */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Invoice No (চালান নং) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={invoiceNo}
                  onChange={(e) => setInvoiceNo(e.target.value)}
                  placeholder="e.g. 2616"
                  className="w-full text-sm font-semibold bg-white border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Line */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Line (সেকশন / লাইন)
                </label>
                <input
                  type="text"
                  value={line}
                  onChange={(e) => setLine(e.target.value)}
                  placeholder="Sweing"
                  className="w-full text-sm bg-white border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Invoice Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Invoice Date (চালানের তারিখ)
                </label>
                <input
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="w-full text-sm bg-white border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Receive Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Receive Date (গ্রহণের তারিখ)
                </label>
                <input
                  type="date"
                  value={receiveDate}
                  onChange={(e) => setReceiveDate(e.target.value)}
                  className="w-full text-sm bg-white border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Category (ক্যাটাগরি)
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full text-sm bg-white border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="হাফ হাতা">হাফ হাতা (Half Sleeve)</option>
                  <option value="ফুল হাতা">ফুল হাতা (Full Sleeve)</option>
                  <option value="টি-শার্ট">টি-শার্ট (T-Shirt)</option>
                  <option value="পোলো শার্ট">পোলো শার্ট (Polo Shirt)</option>
                  <option value="ক্যাজুয়াল শার্ট">ক্যাজুয়াল শার্ট</option>
                  <option value="প্যান্ট / ট্রাউজার">প্যান্ট / ট্রাউজার</option>
                  <option value="অন্যান্য">অন্যান্য (Custom)</option>
                </select>
                {category === 'অন্যান্য' && (
                  <input
                    type="text"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="ক্যাটাগরির নাম লিখুন"
                    className="w-full mt-1 text-sm bg-white border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                )}
              </div>

              {/* Item / Lot Description */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Item Description (মালের নাম / লট বিবরণ) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={item}
                  onChange={(e) => setItem(e.target.value)}
                  placeholder="যেমন: New York City Shirt Hata"
                  className="w-full text-sm font-medium bg-white border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Total Target DZ */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Total DZ Target (লটের মোট ডজন)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    value={totalTargetDZ}
                    onChange={(e) => setTotalTargetDZ(e.target.value)}
                    placeholder="72.00"
                    className="w-full text-sm font-bold bg-white border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none text-emerald-800"
                  />
                  <span className="absolute right-3 top-2 text-xs font-semibold text-slate-400">DZ</span>
                </div>
              </div>

            </div>
          </div>

          {/* Section 2: Worker Selection & Fast Batch Tools */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-600" />
                  <span>কারিগর নির্বাচন ও বরাদ্দ ({items.length} জন কাজ পেয়েছেন)</span>
                </h3>
                <p className="text-xs text-slate-500">
                  ৫০-৬০ জন কারিগরের তালিকা থেকে কেবল যারা এই লটে মাল পেয়েছে তাদের সিলেক্ট করুন
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowWorkerPicker(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs sm:text-sm px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>কারিগর তালিকা থেকে বাছুন ({selectedWorkerIds.size} নির্বাচিত)</span>
                </button>
              </div>
            </div>

            {/* Quick Bulk Fill Tools */}
            <div className="bg-white border border-slate-200 rounded-lg p-3 text-xs flex flex-wrap items-center gap-3">
              <span className="font-semibold text-slate-600 flex items-center gap-1">
                <Calculator className="w-3.5 h-3.5 text-slate-500" />
                একসাথে রেট / সাইজ বসান:
              </span>

              {/* Bulk Size */}
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={bulkSize}
                  onChange={(e) => setBulkSize(e.target.value)}
                  placeholder="14/20"
                  className="w-20 px-2 py-1 text-xs border border-slate-300 rounded"
                />
                <button
                  type="button"
                  onClick={handleApplyBulkSize}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-medium border border-slate-300"
                >
                  সবাইকে সাইজ দিন
                </button>
              </div>

              {/* Bulk Rate */}
              <div className="flex items-center gap-1">
                <span className="text-slate-500">রেট:</span>
                <input
                  type="number"
                  step="0.01"
                  value={bulkRate}
                  onChange={(e) => setBulkRate(e.target.value)}
                  placeholder="246"
                  className="w-20 px-2 py-1 text-xs border border-slate-300 rounded font-semibold"
                />
                <button
                  type="button"
                  onClick={handleApplyBulkRate}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-medium border border-slate-300"
                >
                  সবাইকে রেট দিন
                </button>
              </div>

              {/* Bulk Designation */}
              <div className="flex items-center gap-1">
                <select
                  value={bulkDesignation}
                  onChange={(e) => setBulkDesignation(e.target.value)}
                  className="px-2 py-1 text-xs border border-slate-300 rounded"
                >
                  <option value="Plain Machine Operator">Plain Machine Operator</option>
                  <option value="Lock Machine Operator">Lock Machine Operator</option>
                  <option value="Overlock Machine Operator">Overlock Machine Operator</option>
                  <option value="Helper / Finisher">Helper / Finisher</option>
                </select>
                <button
                  type="button"
                  onClick={handleApplyBulkDesignation}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-medium border border-slate-300"
                >
                  পদবি দিন
                </button>
              </div>
            </div>

            {/* Live Progress / Balance Card */}
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <p className="text-slate-500">মোট কারিগর</p>
                <p className="text-base font-bold text-slate-900">{items.length} জন</p>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <p className="text-slate-500">টার্গেট ডজন</p>
                <p className="text-base font-bold text-slate-900">{targetDZ.toFixed(2)} DZ</p>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <p className="text-slate-500">এন্ট্রি করা মোট ডজন</p>
                <p className={`text-base font-bold ${Math.abs(dzDifference) < 0.01 ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {totalQtyDZ.toFixed(2)} DZ
                </p>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <p className="text-slate-500">মোট বিল (Total)</p>
                <p className="text-base font-bold text-emerald-700">৳ {totalBillAmount.toLocaleString()}</p>
              </div>
            </div>

            {Math.abs(dzDifference) > 0.01 && targetDZ > 0 && (
              <div className="mt-2 text-xs flex items-center justify-between px-3 py-1.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
                <div className="flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    টার্গেটের তুলনায় ব্যালেন্স:{' '}
                    <strong>{dzDifference > 0 ? `+${dzDifference.toFixed(2)} DZ বেশি` : `${dzDifference.toFixed(2)} DZ কম`}</strong>
                  </span>
                </div>
                <span className="text-[11px] text-amber-700">টার্গেট: {targetDZ.toFixed(2)} DZ | এন্ট্রি: {totalQtyDZ.toFixed(2)} DZ</span>
              </div>
            )}
          </div>

          {/* Section 3: Interactive Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex justify-between items-center text-xs font-bold text-slate-700">
              <span>চালানের কারিগর হিসাব তালিকা ({items.length} টি সারি)</span>
              <span className="text-slate-500">সাইজ, পরিমাণ ও রেট পরিবর্তন করলে মোট টাকা স্বয়ংক্রিয়ভাবে হিসাব হবে</span>
            </div>

            {items.length === 0 ? (
              <div className="p-8 text-center bg-white">
                <Users className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">এখনও কোনো কারিগর যোগ করা হয়নি</p>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  উপরের <strong>"কারিগর তালিকা থেকে বাছুন"</strong> বাটনে ক্লিক করে যে ২০-৩০ জন মাল পেয়েছে তাদের টিক চিহ্ন দিয়ে তালিকায় আনুন।
                </p>
                <button
                  type="button"
                  onClick={() => setShowWorkerPicker(true)}
                  className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-lg inline-flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  কারিগর সিলেক্ট করুন
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[360px]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-800 text-white sticky top-0 z-10">
                    <tr>
                      <th className="py-2 px-2 text-center w-10">#</th>
                      <th className="py-2 px-3">কারিগর (Employee)</th>
                      <th className="py-2 px-3 w-44">পদবি (Designation)</th>
                      <th className="py-2 px-2 w-20 text-center">সাইজ</th>
                      <th className="py-2 px-2 w-24 text-center">পরিমাণ (DZ)</th>
                      <th className="py-2 px-2 w-24 text-right">রেট (৳)</th>
                      <th className="py-2 px-3 w-28 text-right">মোট টাকা</th>
                      <th className="py-2 px-2 w-16 text-center">অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {items.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-slate-50">
                        {/* Index */}
                        <td className="py-2 px-2 text-center font-medium text-slate-500">
                          {idx + 1}
                        </td>

                        {/* Worker Name */}
                        <td className="py-2 px-3 font-semibold text-slate-900">
                          {item.workerName}
                        </td>

                        {/* Designation */}
                        <td className="py-1 px-2">
                          <input
                            type="text"
                            value={item.designation}
                            onChange={(e) => handleUpdateItem(item.id, 'designation', e.target.value)}
                            className="w-full px-2 py-1 text-xs border border-slate-200 rounded focus:border-emerald-500 focus:outline-none"
                          />
                        </td>

                        {/* Size */}
                        <td className="py-1 px-2 text-center">
                          <input
                            type="text"
                            value={item.size}
                            onChange={(e) => handleUpdateItem(item.id, 'size', e.target.value)}
                            className="w-full text-center px-1.5 py-1 text-xs border border-slate-200 rounded focus:border-emerald-500 focus:outline-none font-medium"
                          />
                        </td>

                        {/* Quantity DZ */}
                        <td className="py-1 px-2">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.quantity}
                            onChange={(e) => handleUpdateItem(item.id, 'quantity', e.target.value)}
                            className="w-full text-center px-2 py-1 text-xs font-bold border border-slate-300 rounded focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none text-slate-900 bg-emerald-50/40"
                          />
                        </td>

                        {/* Rate */}
                        <td className="py-1 px-2">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.rate}
                            onChange={(e) => handleUpdateItem(item.id, 'rate', e.target.value)}
                            className="w-full text-right px-2 py-1 text-xs font-medium border border-slate-300 rounded focus:border-emerald-500 focus:outline-none text-slate-900"
                          />
                        </td>

                        {/* Total Price */}
                        <td className="py-2 px-3 text-right font-bold text-slate-950">
                          ৳ {item.totalPrice.toFixed(2)}
                        </td>

                        {/* Actions */}
                        <td className="py-2 px-2 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleDuplicateRow(item)}
                              title="একই কারিগরের আরেকটি এন্ট্রি যোগ করুন"
                              className="p-1 text-slate-400 hover:text-emerald-600 rounded hover:bg-slate-100"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.id, item.workerId)}
                              title="বাদ দিন"
                              className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-slate-100"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {/* Table Total Row */}
                  <tfoot className="bg-slate-100 border-t-2 border-slate-300 font-bold text-slate-900">
                    <tr>
                      <td colSpan={4} className="py-2.5 px-3 text-center uppercase tracking-wide text-xs">
                        সর্বমোট (Total)
                      </td>
                      <td className="py-2.5 px-2 text-center font-bold text-emerald-800 text-sm">
                        {totalQtyDZ.toFixed(2)} DZ
                      </td>
                      <td className="py-2.5 px-2 text-right text-xs text-slate-500">
                        -
                      </td>
                      <td className="py-2.5 px-3 text-right font-extrabold text-slate-950 text-sm">
                        ৳ {totalBillAmount.toLocaleString()}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* Section 4: Signatories / Approvals */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              প্রিন্ট কপির অনুমোদনকারী (Signatures Footer)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Prepared By (প্রস্তুতকারক)
                </label>
                <input
                  type="text"
                  value={preparedBy}
                  onChange={(e) => setPreparedBy(e.target.value)}
                  placeholder="Production Incharge"
                  className="w-full text-xs bg-white border border-slate-300 rounded px-2.5 py-1.5"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Checked By (যাচাইকারী)
                </label>
                <input
                  type="text"
                  value={checkedBy}
                  onChange={(e) => setCheckedBy(e.target.value)}
                  placeholder="Sweing Supervisor"
                  className="w-full text-xs bg-white border border-slate-300 rounded px-2.5 py-1.5"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Received By (গ্রহণকারী)
                </label>
                <input
                  type="text"
                  value={receivedBy}
                  onChange={(e) => setReceivedBy(e.target.value)}
                  placeholder="Factory Admin"
                  className="w-full text-xs bg-white border border-slate-300 rounded px-2.5 py-1.5"
                />
              </div>
            </div>
          </div>

          {/* Modal Bottom Actions */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              বাতিল করুন
            </button>

            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-6 py-2.5 rounded-lg flex items-center gap-2 shadow-md transition-all active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>চালান সংরক্ষণ ও বিল তৈরি করুন</span>
            </button>
          </div>

        </form>

        {/* WORKER PICKER MODAL (Selecting the 20-30 operators from 50-60 roster) */}
        {showWorkerPicker && (
          <div className="fixed inset-0 z-60 bg-black/70 flex items-center justify-center p-3 sm:p-6 backdrop-blur-xs">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col border border-slate-300 overflow-hidden">
              
              <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-400" />
                    <span>কারিগর সিলেক্ট করুন ({selectedWorkerIds.size} জন নির্বাচিত)</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    লটে যারা কাজ পেয়েছে কেবল তাদের নামের পাশে টিক দিন
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowWorkerPicker(false)}
                  className="text-slate-400 hover:text-white p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search & Fast Selection Toolbar */}
              <div className="p-3 border-b border-slate-200 bg-slate-50 space-y-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="কারিগর এর নাম বা কার্ড নং খুঁজুন..."
                    value={workerSearch}
                    onChange={(e) => setWorkerSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    autoFocus
                  />
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAllWorkers}
                      className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 rounded border border-slate-300 font-medium"
                    >
                      সবাইকে সিলেক্ট
                    </button>
                    <button
                      type="button"
                      onClick={handleClearAllWorkers}
                      className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 rounded border border-slate-300 font-medium"
                    >
                      সব খালি
                    </button>
                  </div>
                  <span className="text-slate-500 font-medium">
                    মোট {filteredWorkers.length} জনের মধ্যে {selectedWorkerIds.size} জন সিলেক্টেড
                  </span>
                </div>
              </div>

              {/* Workers Grid / Checklist */}
              <div className="flex-1 overflow-y-auto p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {filteredWorkers.map((worker) => {
                  const isSelected = selectedWorkerIds.has(worker.id);
                  return (
                    <div
                      key={worker.id}
                      onClick={() => handleToggleWorker(worker.id)}
                      className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-emerald-50 border-emerald-500 shadow-xs'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${
                            isSelected
                              ? 'bg-emerald-600 text-white'
                              : 'border border-slate-300 bg-white'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                        <div className="truncate">
                          <p className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
                            {worker.name}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate">
                            {worker.cardNo ? `${worker.cardNo} • ` : ''}
                            {worker.designation || 'Plain Machine Operator'}
                          </p>
                        </div>
                      </div>
                      {isSelected && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                          কাজ পেয়েছে
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Picker Footer */}
              <div className="p-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">
                  {selectedWorkerIds.size} জন কারিগর চালানে যুক্ত হতে প্রস্তুত
                </span>
                <button
                  type="button"
                  onClick={handleApplyWorkerSelection}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm px-5 py-2 rounded-lg shadow-sm"
                >
                  তালিকায় যোগ করুন ({selectedWorkerIds.size})
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
};
