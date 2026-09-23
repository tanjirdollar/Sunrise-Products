import React, { useState, useMemo } from 'react';
import { 
  FileSpreadsheet, 
  Search, 
  PlusCircle, 
  Printer, 
  Eye, 
  Edit3, 
  Trash2, 
  Calendar, 
  Filter, 
  Download, 
  Layers, 
  CheckCircle2,
  Clock,
  ArrowRight
} from 'lucide-react';
import { FactorySettings, LotInvoice } from '../types';

interface LotListProps {
  lots: LotInvoice[];
  settings: FactorySettings;
  onOpenLot: (lot: LotInvoice) => void;
  onEditLot: (lot: LotInvoice) => void;
  onDeleteLot: (lotId: string) => void;
  onNewLot: () => void;
}

export const LotList: React.FC<LotListProps> = ({
  lots,
  settings,
  onOpenLot,
  onEditLot,
  onDeleteLot,
  onNewLot,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Filter lots
  const filteredLots = useMemo(() => {
    return lots.filter((lot) => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch =
        lot.invoiceNo.toLowerCase().includes(q) ||
        lot.item.toLowerCase().includes(q) ||
        lot.category.toLowerCase().includes(q) ||
        lot.items.some((i) => i.workerName.toLowerCase().includes(q));

      const matchesCat = categoryFilter === 'all' || lot.category === categoryFilter;

      return matchesSearch && matchesCat;
    });
  }, [lots, searchTerm, categoryFilter]);

  // Overall metrics
  const totalProducedDZ = lots.reduce((sum, l) => sum + (Number(l.totalQty) || 0), 0);
  const totalAmountBilled = lots.reduce((sum, l) => sum + (Number(l.totalPrice) || 0), 0);

  // Distinct categories
  const categories = useMemo(() => {
    return Array.from(new Set(lots.map((l) => l.category).filter(Boolean)));
  }, [lots]);

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 2,
    }).format(val);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner / Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Total Invoices */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              মোট লট চালান
            </p>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              {lots.length} <span className="text-sm font-normal text-slate-500">টি</span>
            </p>
            <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" /> সুইং সেকশন রানিং
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        {/* Total DZ Sewn */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              মোট সেলাইকৃত মাল
            </p>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              {totalProducedDZ.toFixed(2)} <span className="text-sm font-normal text-slate-500">DZ</span>
            </p>
            <p className="text-xs text-slate-500 mt-1">
              প্রায় {(totalProducedDZ * 12).toLocaleString()} টি পিস
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
        </div>

        {/* Total Bill Amount */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              সর্বমোট কারিগর বিল
            </p>
            <p className="text-2xl sm:text-3xl font-extrabold text-emerald-700 mt-1">
              ৳ {formatMoney(totalAmountBilled)}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              নিখুঁত পিস-রেট হিসাব
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center text-emerald-400">
            <span className="text-xl font-bold">৳</span>
          </div>
        </div>

      </div>

      {/* Control bar: Search, Filter, New Button */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="চালান নং, মালের নাম বা কারিগরের নাম দিয়ে খুঁজুন..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-transparent focus:outline-none font-medium text-slate-800"
            >
              <option value="all">সকল ক্যাটাগরি</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* New Lot Button */}
          <button
            onClick={onNewLot}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs sm:text-sm px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>নতুন চালান তৈরি</span>
          </button>
        </div>

      </div>

      {/* Lots Grid / Cards List */}
      <div className="space-y-3">
        {filteredLots.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <FileSpreadsheet className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-800">কোনো চালান পাওয়া যায়নি</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              নতুন লট আসলে চালান তৈরি করতে উপরের <strong>"নতুন চালান তৈরি"</strong> বাটনে ক্লিক করুন।
            </p>
          </div>
        ) : (
          filteredLots.map((lot) => (
            <div
              key={lot.id}
              className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
            >
              {/* Left Info */}
              <div 
                onClick={() => onOpenLot(lot)}
                className="cursor-pointer flex-1"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-extrabold text-base sm:text-lg text-slate-900 group-hover:text-emerald-700 transition-colors">
                    চালান #{lot.invoiceNo}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                    {lot.category}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {lot.line}
                  </span>
                </div>

                <h4 className="text-sm font-semibold text-slate-800 mt-1">
                  {lot.item}
                </h4>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-2">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    তারিখ: {lot.invoiceDate}
                  </span>
                  <span>•</span>
                  <span>কাজ করেছেন: <strong className="text-slate-700 font-semibold">{lot.items.length} জন কারিগর</strong></span>
                  <span>•</span>
                  <span>মোট মাল: <strong className="text-slate-900 font-bold">{lot.totalQty.toFixed(2)} DZ</strong></span>
                </div>
              </div>

              {/* Middle Financials */}
              <div className="sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 flex sm:flex-col justify-between items-center sm:items-end">
                <div>
                  <span className="text-xs text-slate-500 block">মোট বিল</span>
                  <span className="text-lg sm:text-xl font-black text-slate-950">
                    ৳ {formatMoney(lot.totalPrice)}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 sm:mt-1">
                  গড় রেট: ৳ {(lot.totalPrice / (lot.totalQty || 1)).toFixed(1)}/DZ
                </div>
              </div>

              {/* Right Action buttons */}
              <div className="flex items-center gap-2 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 justify-end">
                <button
                  onClick={() => onOpenLot(lot)}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
                  title="প্রিন্ট কপি ও বিস্তারিত দেখুন"
                >
                  <Printer className="w-3.5 h-3.5 text-emerald-400" />
                  <span>বিল প্রিন্ট</span>
                </button>

                <button
                  onClick={() => onEditLot(lot)}
                  className="p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                  title="চালান এডিট করুন"
                >
                  <Edit3 className="w-4 h-4" />
                </button>

                <button
                  onClick={() => {
                    if (confirm(`আপনি কি নিশ্চিত যে চালান #${lot.invoiceNo} মুছে ফেলতে চান?`)) {
                      onDeleteLot(lot.id);
                    }
                  }}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="মুছে ফেলুন"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

            </div>
          ))
        )}
      </div>

    </div>
  );
};
