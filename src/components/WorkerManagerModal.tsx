import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  Layers, 
  FileText, 
  CheckCircle, 
  UserPlus, 
  ArrowRight,
  Printer,
  Sparkles,
  Phone,
  X,
  UserX
} from 'lucide-react';
import { FactorySettings, LotInvoice, Worker } from '../types';

interface WorkerManagerModalProps {
  workers: Worker[];
  allLots: LotInvoice[];
  settings: FactorySettings;
  onSelectWorker: (worker: Worker) => void;
  onSaveWorker: (worker: Worker) => void;
  onDeleteWorker: (workerId: string) => void;
}

export const WorkerManagerModal: React.FC<WorkerManagerModalProps> = ({
  workers,
  allLots,
  settings,
  onSelectWorker,
  onSaveWorker,
  onDeleteWorker,
}) => {
  const [search, setSearch] = useState('');
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // New worker form fields
  const [formName, setFormName] = useState('');
  const [formCardNo, setFormCardNo] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formDesignation, setFormDesignation] = useState(settings.defaultDesignation || 'Plain Machine Operator');
  const [formRate, setFormRate] = useState('');
  const [formSize, setFormSize] = useState('14/20');

  // Compute stats per worker
  const workerStatsMap = useMemo(() => {
    const map = new Map<string, { lotsCount: number; totalDZ: number; totalEarned: number }>();

    allLots.forEach((lot) => {
      lot.items.forEach((item) => {
        const current = map.get(item.workerId) || { lotsCount: 0, totalDZ: 0, totalEarned: 0 };
        current.totalDZ += Number(item.quantity) || 0;
        current.totalEarned += Number(item.totalPrice) || 0;
        map.set(item.workerId, current);
      });
    });

    // Count distinct lots
    workers.forEach((w) => {
      const distinctLots = new Set(
        allLots.filter((lot) => lot.items.some((i) => i.workerId === w.id)).map((l) => l.id)
      ).size;
      const stats = map.get(w.id) || { lotsCount: 0, totalDZ: 0, totalEarned: 0 };
      stats.lotsCount = distinctLots;
      map.set(w.id, stats);
    });

    return map;
  }, [allLots, workers]);

  // Filter workers
  const filteredWorkers = useMemo(() => {
    return workers.filter((w) => {
      const q = search.toLowerCase().trim();
      return (
        w.name.toLowerCase().includes(q) ||
        (w.cardNo && w.cardNo.toLowerCase().includes(q)) ||
        (w.designation && w.designation.toLowerCase().includes(q))
      );
    });
  }, [workers, search]);

  const handleStartEdit = (w: Worker) => {
    setEditingWorker(w);
    setFormName(w.name);
    setFormCardNo(w.cardNo || '');
    setFormPhone(w.phone || '');
    setFormDesignation(w.designation || 'Plain Machine Operator');
    setFormRate(w.defaultRate ? String(w.defaultRate) : '');
    setFormSize(w.defaultSize || '14/20');
    setShowAddForm(true);
  };

  const handleStartAdd = () => {
    setEditingWorker(null);
    setFormName('');
    setFormCardNo(`OP-${String(workers.length + 1).padStart(2, '0')}`);
    setFormPhone('');
    setFormDesignation(settings.defaultDesignation || 'Plain Machine Operator');
    setFormRate('');
    setFormSize('14/20');
    setShowAddForm(true);
  };

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      alert('অনুগ্রহ করে কারিগরের নাম লিখুন');
      return;
    }

    const workerToSave: Worker = {
      id: editingWorker ? editingWorker.id : `w-${Date.now()}`,
      name: formName.trim(),
      cardNo: formCardNo.trim() || undefined,
      phone: formPhone.trim() || undefined,
      designation: formDesignation.trim() || 'Plain Machine Operator',
      defaultRate: parseFloat(formRate) || undefined,
      defaultSize: formSize.trim() || undefined,
      active: true,
      createdAt: editingWorker ? editingWorker.createdAt : new Date().toISOString(),
    };

    onSaveWorker(workerToSave);
    setShowAddForm(false);
    setEditingWorker(null);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" />
            <span>সুইং সেকশন কারিগর তালিকা ({workers.length} জন)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            যে কোনো কারিগরের নামের ওপর ক্লিক করলে তার সম্পূর্ণ ব্যক্তিগত খতিয়ান খুলে যাবে
          </p>
        </div>

        <button
          onClick={handleStartAdd}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs sm:text-sm px-4 py-2.5 rounded-lg flex items-center gap-2 shadow-xs transition-all active:scale-95 shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>নতুন কারিগর যোগ করুন</span>
        </button>
      </div>

      {/* Add / Edit Worker Drawer Form */}
      {showAddForm && (
        <form onSubmit={handleSaveSubmit} className="bg-white rounded-xl border border-emerald-300 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-sm text-slate-900">
              {editingWorker ? `কারিগর এডিট: ${editingWorker.name}` : 'নতুন কারিগর নিবন্ধন'}
            </h3>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-xs text-slate-500 hover:text-slate-800"
            >
              বাতিল
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">কারিগর নাম *</label>
              <input
                type="text"
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="যেমন: Ruhul Amin"
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">কার্ড / আইডি নং</label>
              <input
                type="text"
                value={formCardNo}
                onChange={(e) => setFormCardNo(e.target.value)}
                placeholder="OP-12"
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">পদবি (Designation)</label>
              <input
                type="text"
                value={formDesignation}
                onChange={(e) => setFormDesignation(e.target.value)}
                placeholder="Plain Machine Operator"
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">মোবাইল নম্বর (ঐচ্ছিক)</label>
              <input
                type="text"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                placeholder="017xxxxxxxx"
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">রেট (ঐচ্ছিক)</label>
              <input
                type="number"
                step="0.01"
                value={formRate}
                onChange={(e) => setFormRate(e.target.value)}
                placeholder="মালের অনুযায়ী ম্যানুয়ালি দেওয়া হয়"
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-[10px] text-slate-400">প্রতি মালে ম্যানুয়ালি রেট ইনপুট হবে</span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">ডিফল্ট সাইজ</label>
              <input
                type="text"
                value={formSize}
                onChange={(e) => setFormSize(e.target.value)}
                placeholder="14/20"
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm"
            >
              সংরক্ষণ করুন
            </button>
          </div>
        </form>
      )}

      {/* Search Input & Status */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="কারিগরের নাম (Worker Name), কার্ড নং বা পদবি দিয়ে খুঁজুন..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-9 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-200 transition-colors"
              title="সার্চ মুছুন"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <div className="text-xs text-slate-500 font-medium shrink-0 flex items-center gap-1.5 self-end sm:self-auto">
          <span>মোট:</span>
          <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
            {filteredWorkers.length} / {workers.length} জন
          </span>
        </div>
      </div>

      {/* Workers Grid or Empty Search State */}
      {filteredWorkers.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
          <UserX className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-slate-700">কোনো কারিগর পাওয়া যায়নি</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {search ? `"${search}" নামের সাথে মিল রেখে কোনো কারিগর নেই।` : 'এখনো কোনো কারিগর যুক্ত করা হয়নি। নতুন কারিগর যোগ করুন।'}
          </p>
          {search && (
            <button
              onClick={() => setSearch('')}
              className="mt-3 text-xs font-semibold text-emerald-600 hover:text-emerald-700 underline"
            >
              সার্চ ফিল্টার ক্লিয়ার করুন
            </button>
          )}
        </div>
      ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredWorkers.map((worker) => {
          const stats = workerStatsMap.get(worker.id) || { lotsCount: 0, totalDZ: 0, totalEarned: 0 };
          return (
            <div
              key={worker.id}
              className="bg-white rounded-xl border border-slate-200 hover:border-emerald-400 hover:shadow-md transition-all p-4 flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 group-hover:bg-emerald-100 group-hover:text-emerald-800 transition-colors flex items-center justify-center font-bold text-sm">
                      {worker.name.charAt(0)}
                    </div>
                    <div>
                      <h4 
                        onClick={() => onSelectWorker(worker)}
                        className="font-bold text-sm text-slate-900 group-hover:text-emerald-700 cursor-pointer hover:underline"
                        title="খতিয়ান দেখতে ক্লিক করুন"
                      >
                        {worker.name}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {worker.designation || 'Plain Machine Operator'}
                      </p>
                    </div>
                  </div>

                  {worker.cardNo && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                      {worker.cardNo}
                    </span>
                  )}
                </div>

                {/* Worker Quick Stats */}
                <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100 text-center text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">মোট লট</span>
                    <span className="font-bold text-slate-800">{stats.lotsCount} টি</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">মোট কাজ</span>
                    <span className="font-bold text-slate-800">{stats.totalDZ.toFixed(1)} DZ</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">মোট বিল</span>
                    <span className="font-bold text-emerald-700">৳ {Math.round(stats.totalEarned).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => onSelectWorker(worker)}
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>ব্যক্তিগত খতিয়ান ↗</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleStartEdit(worker)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100"
                    title="এডিট"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`আপনি কি নিশ্চিত যে "${worker.name}" কে তালিকা থেকে মুছতে চান?`)) {
                        onDeleteWorker(worker.id);
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded hover:bg-slate-100"
                    title="মুছুন"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            </div>
          );
        })}
      </div>
      )}

    </div>
  );
};
