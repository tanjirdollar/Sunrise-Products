import React, { useState, useMemo } from 'react';
import { 
  X, 
  Printer, 
  Download, 
  Calendar, 
  Briefcase, 
  DollarSign, 
  PlusCircle, 
  FileText, 
  Layers, 
  CheckCircle, 
  Trash2,
  Phone,
  UserCheck
} from 'lucide-react';
import { FactorySettings, LotInvoice, Worker, WorkerPayment } from '../types';

interface WorkerLedgerModalProps {
  worker: Worker | null;
  allLots: LotInvoice[];
  payments: WorkerPayment[];
  settings: FactorySettings;
  onClose: () => void;
  onOpenLot: (lot: LotInvoice) => void;
  onAddPayment: (payment: WorkerPayment) => void;
  onDeletePayment: (paymentId: string) => void;
}

export const WorkerLedgerModal: React.FC<WorkerLedgerModalProps> = ({
  worker,
  allLots,
  payments,
  settings,
  onClose,
  onOpenLot,
  onAddPayment,
  onDeletePayment,
}) => {
  const [filterMonth, setFilterMonth] = useState<string>('all');
  const [showAddPaymentForm, setShowAddPaymentForm] = useState(false);
  const [showPrintSlipMode, setShowPrintSlipMode] = useState(false);

  // New Payment Form state
  const [payAmount, setPayAmount] = useState('');
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [payType, setPayType] = useState<'advance' | 'salary' | 'bonus' | 'deduction'>('advance');
  const [payNote, setPayNote] = useState('');

  if (!worker) return null;

  // Extract all line items worked by this worker across all lots
  const workerHistory = useMemo(() => {
    const list: Array<{
      lot: LotInvoice;
      item: LotInvoice['items'][0];
    }> = [];

    allLots.forEach((lot) => {
      lot.items.forEach((item) => {
        if (item.workerId === worker.id || item.workerName.toLowerCase().trim() === worker.name.toLowerCase().trim()) {
          list.push({ lot, item });
        }
      });
    });

    // Sort by lot date descending
    return list.sort((a, b) => new Date(b.lot.invoiceDate).getTime() - new Date(a.lot.invoiceDate).getTime());
  }, [allLots, worker]);

  // Worker payments
  const workerPayments = useMemo(() => {
    return payments
      .filter((p) => p.workerId === worker.id || p.workerName === worker.name)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [payments, worker]);

  // Aggregate Calculations
  const totalLotsCount = new Set(workerHistory.map((h) => h.lot.id)).size;
  const totalDZ = workerHistory.reduce((sum, h) => sum + (Number(h.item.quantity) || 0), 0);
  const totalGrossEarned = workerHistory.reduce((sum, h) => sum + (Number(h.item.totalPrice) || 0), 0);
  
  const totalAdvancePaid = workerPayments
    .filter((p) => p.type === 'advance' || p.type === 'salary')
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const totalDeductions = workerPayments
    .filter((p) => p.type === 'deduction')
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const netPayableDue = totalGrossEarned - totalAdvancePaid - totalDeductions;

  // Format currency
  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(val);
  };

  const handleCreatePayment = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(payAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert('সঠিক টাকার অঙ্ক দিন');
      return;
    }

    const newPayment: WorkerPayment = {
      id: `pay-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      workerId: worker.id,
      workerName: worker.name,
      date: payDate,
      amount: amountNum,
      type: payType,
      note: payNote.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    onAddPayment(newPayment);
    setPayAmount('');
    setPayNote('');
    setShowAddPaymentForm(false);
  };

  const handlePrintSlip = () => {
    setShowPrintSlipMode(true);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handleExportCSV = () => {
    const headers = ['Invoice Date', 'Invoice No', 'Category', 'Item Description', 'Size', 'Qty DZ', 'Rate', 'Total Bill Tk'];
    const rows = workerHistory.map((h) => [
      `"${h.lot.invoiceDate}"`,
      `"${h.lot.invoiceNo}"`,
      `"${h.lot.category}"`,
      `"${h.lot.item}"`,
      `"${h.item.size}"`,
      h.item.quantity,
      h.item.rate.toFixed(2),
      h.item.totalPrice.toFixed(2),
    ]);

    const csvContent = [
      [`"Worker Ledger: ${worker.name}"`],
      [`"Designation: ${worker.designation}"`],
      [`"Factory: ${settings.factoryName}"`],
      [`"Total DZ: ${totalDZ.toFixed(2)} DZ"`],
      [`"Total Earned: ৳ ${totalGrossEarned}"`],
      [],
      headers.join(','),
      ...rows.map((r) => r.join(',')),
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Khotiyan_${worker.name.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* Top Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between border-b border-slate-800 no-print">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow-inner">
              {worker.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-white">{worker.name}</h2>
                {worker.cardNo && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    কার্ড: {worker.cardNo}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                পদবি: {worker.designation} • ব্যক্তিগত কাজের খতিয়ান ও বিল হিস্ট্রি
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
              title="CSV ডাউনলোড করুন"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">CSV এক্সপোর্ট</span>
            </button>

            <button
              onClick={handlePrintSlip}
              className="text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>কারিগর স্লিপ প্রিন্ট</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* STATS OVERVIEW CARDS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 no-print">
            
            {/* Total Lots Worked */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-col justify-between">
              <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-slate-400" />
                মোট লটে কাজ
              </span>
              <p className="text-2xl font-bold text-slate-900 mt-2">
                {totalLotsCount} <span className="text-xs font-normal text-slate-500">টি চালান</span>
              </p>
            </div>

            {/* Total DZ Sewn */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-col justify-between">
              <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                মোট কাজ সম্পন্ন
              </span>
              <p className="text-2xl font-bold text-slate-900 mt-2">
                {totalDZ.toFixed(2)} <span className="text-xs font-normal text-slate-500">DZ</span>
              </p>
            </div>

            {/* Total Gross Bill */}
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 flex flex-col justify-between">
              <span className="text-xs font-medium text-emerald-800 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                সর্বমোট অর্জিত বিল
              </span>
              <p className="text-2xl font-extrabold text-emerald-800 mt-2">
                ৳ {formatMoney(totalGrossEarned)}
              </p>
            </div>

            {/* Net Balance / Payable */}
            <div className="bg-slate-900 text-white rounded-xl p-3.5 flex flex-col justify-between shadow-xs">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-slate-300">নিট প্রাপ্য টাকা</span>
                {totalAdvancePaid > 0 && (
                  <span className="text-[10px] text-amber-300">অগ্রিম: ৳{formatMoney(totalAdvancePaid)}</span>
                )}
              </div>
              <p className="text-2xl font-extrabold text-emerald-400 mt-2">
                ৳ {formatMoney(netPayableDue)}
              </p>
            </div>

          </div>

          {/* Quick Action: Record Payment / Advance */}
          <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 no-print">
            <div>
              <p className="text-xs sm:text-sm font-semibold text-slate-900">
                অগ্রিম বা পেমেন্ট হিসাব
              </p>
              <p className="text-xs text-slate-500">
                কারিগরকে কোনো অগ্রিম বা নগদ টাকা দেওয়া হলে তা যোগ করে রাখুন
              </p>
            </div>

            <button
              onClick={() => setShowAddPaymentForm(!showAddPaymentForm)}
              className="text-xs font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <PlusCircle className="w-4 h-4 text-emerald-700" />
              <span>{showAddPaymentForm ? 'ফরম বন্ধ করুন' : 'টাকা প্রদান / অগ্রিম এন্ট্রি'}</span>
            </button>
          </div>

          {/* Payment Form (Collapsible) */}
          {showAddPaymentForm && (
            <form onSubmit={handleCreatePayment} className="bg-emerald-50 border border-emerald-300 rounded-xl p-4 text-xs space-y-3 no-print">
              <h4 className="font-bold text-slate-900 text-sm">নতুন পেমেন্ট বা অগ্রিম যুক্ত করুন</h4>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">তারিখ</label>
                  <input
                    type="date"
                    required
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-md p-2"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">টাকার পরিমাণ (৳)</label>
                  <input
                    type="number"
                    step="1"
                    required
                    placeholder="যেমন 1000"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-md p-2 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">পেমেন্টের ধরন</label>
                  <select
                    value={payType}
                    onChange={(e) => setPayType(e.target.value as any)}
                    className="w-full bg-white border border-slate-300 rounded-md p-2"
                  >
                    <option value="advance">অগ্রিম (Advance)</option>
                    <option value="salary">বিল পরিশোধ (Payment)</option>
                    <option value="deduction">কর্তন / জরিমানা</option>
                    <option value="bonus">বোনাস / উপহার</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">নোট / বিবরণ</label>
                  <input
                    type="text"
                    placeholder="প্রয়োজনে কারণ লিখুন"
                    value={payNote}
                    onChange={(e) => setPayNote(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-md p-2"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddPaymentForm(false)}
                  className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-md"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-md"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          )}

          {/* ITEM HISTORY TABLE (Work Breakdown) */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 flex justify-between items-center text-xs font-bold text-slate-800">
              <span>কাজের খতিয়ান তালিকা ({workerHistory.length} টি লট কাজ)</span>
              <span className="text-slate-500 font-normal">চালান নম্বরে ক্লিক করে মূল চালান শিট দেখতে পারেন</span>
            </div>

            {workerHistory.length === 0 ? (
              <div className="p-8 text-center bg-white text-slate-500 text-xs">
                এই কারিগরের নামে এখনও কোনো লটের কাজ এন্ট্রি হয়নি। নতুন চালানে এই কারিগরকে সিলেক্ট করলে এখানে সব হিসেব এসে জমা হবে।
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-800 text-white">
                    <tr>
                      <th className="py-2.5 px-3">তারিখ</th>
                      <th className="py-2.5 px-3">চালান নং</th>
                      <th className="py-2.5 px-3">লট / আইটেম বিবরণ</th>
                      <th className="py-2.5 px-2 text-center">সাইজ</th>
                      <th className="py-2.5 px-3 text-center">পরিমাণ (DZ)</th>
                      <th className="py-2.5 px-3 text-right">রেট (৳)</th>
                      <th className="py-2.5 px-3 text-right">মোট বিল (৳)</th>
                      <th className="py-2.5 px-3 text-center no-print">চালান</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {workerHistory.map(({ lot, item }, idx) => (
                      <tr key={`${lot.id}-${item.id}-${idx}`} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-medium text-slate-700">
                          {lot.invoiceDate}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">
                          #{lot.invoiceNo}
                        </td>
                        <td className="py-2.5 px-3">
                          <p className="font-semibold text-slate-900">{lot.item}</p>
                          <p className="text-[11px] text-slate-500">{lot.category} • {item.designation}</p>
                        </td>
                        <td className="py-2.5 px-2 text-center font-medium text-slate-700">
                          {item.size || '14/20'}
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-slate-950">
                          {item.quantity}
                        </td>
                        <td className="py-2.5 px-3 text-right font-medium text-slate-700">
                          {item.rate.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-emerald-700 text-sm">
                          ৳ {formatMoney(item.totalPrice)}
                        </td>
                        <td className="py-2.5 px-3 text-center no-print">
                          <button
                            onClick={() => {
                              onClose();
                              onOpenLot(lot);
                            }}
                            className="text-emerald-700 hover:text-emerald-900 hover:underline font-semibold text-[11px]"
                          >
                            শিট দেখুন ↗
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-100 border-t-2 border-slate-300 font-bold text-slate-900">
                    <tr>
                      <td colSpan={4} className="py-2.5 px-3 text-center uppercase tracking-wide text-xs">
                        মোট হিসাব (Grand Total)
                      </td>
                      <td className="py-2.5 px-3 text-center text-sm font-bold">
                        {totalDZ.toFixed(2)} DZ
                      </td>
                      <td></td>
                      <td className="py-2.5 px-3 text-right text-sm font-extrabold text-slate-950">
                        ৳ {formatMoney(totalGrossEarned)}
                      </td>
                      <td className="no-print"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* PAYMENT & ADVANCES HISTORY (If any exists) */}
          {workerPayments.length > 0 && (
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs no-print">
              <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex justify-between items-center text-xs font-bold text-slate-800">
                <span>অগ্রিম ও পেমেন্ট হিস্ট্রি ({workerPayments.length} টি রেকর্ড)</span>
                <span className="text-amber-700">মোট প্রদান: ৳ {formatMoney(totalAdvancePaid)}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-200 text-slate-800 font-semibold">
                    <tr>
                      <th className="py-2 px-3">তারিখ</th>
                      <th className="py-2 px-3">বিবরণ</th>
                      <th className="py-2 px-3">ধরন</th>
                      <th className="py-2 px-3 text-right">টাকা (৳)</th>
                      <th className="py-2 px-3 text-center">মুছুন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {workerPayments.map((p) => (
                      <tr key={p.id}>
                        <td className="py-2 px-3 text-slate-700">{p.date}</td>
                        <td className="py-2 px-3 text-slate-800">{p.note || 'পেমেন্ট'}</td>
                        <td className="py-2 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800">
                            {p.type === 'advance' ? 'অগ্রিম' : p.type === 'salary' ? 'বিল পরিশোধ' : p.type}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-slate-900">৳ {formatMoney(p.amount)}</td>
                        <td className="py-2 px-3 text-center">
                          <button
                            onClick={() => onDeletePayment(p.id)}
                            className="text-red-500 hover:text-red-700"
                            title="মুছুন"
                          >
                            <Trash2 className="w-3.5 h-3.5 inline" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* DEDICATED PRINTABLE SLIP (Appears when printing from this modal) */}
          <div className="print-only border-2 border-slate-900 p-6 bg-white rounded-lg">
            <div className="text-center pb-2 mb-3 border-b-2 border-slate-900">
              <h1 className="text-xl font-bold font-serif">{settings.factoryName}</h1>
              <p className="text-xs">{settings.addressLine1}, {settings.addressLine2}</p>
              <h2 className="text-sm font-bold uppercase mt-1 tracking-wider underline">
                কারিগর কাজের রসিদ ও ব্যক্তিগত বিল স্লিপ (Worker Khotiyan Slip)
              </h2>
            </div>

            <div className="grid grid-cols-2 text-xs mb-3">
              <div>
                <p><strong>কারিগর নাম:</strong> {worker.name}</p>
                <p><strong>কার্ড নং:</strong> {worker.cardNo || 'N/A'}</p>
                <p><strong>পদবি:</strong> {worker.designation}</p>
              </div>
              <div className="text-right">
                <p><strong>প্রিন্ট তারিখ:</strong> {new Date().toLocaleDateString('en-GB')}</p>
                <p><strong>মোট কাজের লট:</strong> {totalLotsCount} টি</p>
                <p><strong>মোট সম্পন্ন কাজ:</strong> {totalDZ.toFixed(2)} DZ</p>
              </div>
            </div>

            <table className="w-full border-collapse border border-slate-900 text-xs mb-3 print-table">
              <thead>
                <tr className="bg-slate-100 font-bold">
                  <th className="border border-slate-900 px-2 py-1">তারিখ</th>
                  <th className="border border-slate-900 px-2 py-1">চালান নং</th>
                  <th className="border border-slate-900 px-2 py-1 text-left">আইটেম ও বিবরণ</th>
                  <th className="border border-slate-900 px-2 py-1">সাইজ</th>
                  <th className="border border-slate-900 px-2 py-1">পরিমাণ (DZ)</th>
                  <th className="border border-slate-900 px-2 py-1">রেট</th>
                  <th className="border border-slate-900 px-2 py-1 text-right">মোট টাকা</th>
                </tr>
              </thead>
              <tbody>
                {workerHistory.map(({ lot, item }, idx) => (
                  <tr key={idx}>
                    <td className="border border-slate-900 px-2 py-1 text-center">{lot.invoiceDate}</td>
                    <td className="border border-slate-900 px-2 py-1 text-center font-bold">#{lot.invoiceNo}</td>
                    <td className="border border-slate-900 px-2 py-1">{lot.item} ({lot.category})</td>
                    <td className="border border-slate-900 px-2 py-1 text-center">{item.size}</td>
                    <td className="border border-slate-900 px-2 py-1 text-center font-bold">{item.quantity}</td>
                    <td className="border border-slate-900 px-2 py-1 text-right">{item.rate.toFixed(2)}</td>
                    <td className="border border-slate-900 px-2 py-1 text-right font-bold">৳ {formatMoney(item.totalPrice)}</td>
                  </tr>
                ))}
                <tr className="font-bold bg-slate-100">
                  <td colSpan={4} className="border border-slate-900 px-2 py-1 text-center">সর্বমোট</td>
                  <td className="border border-slate-900 px-2 py-1 text-center">{totalDZ.toFixed(2)} DZ</td>
                  <td className="border border-slate-900 px-2 py-1"></td>
                  <td className="border border-slate-900 px-2 py-1 text-right">৳ {formatMoney(totalGrossEarned)}</td>
                </tr>
              </tbody>
            </table>

            {/* Slip Financial summary */}
            <div className="flex justify-between items-center text-xs font-semibold border-t border-slate-300 pt-2 mb-8">
              <div>
                <span>মোট বিল: ৳ {formatMoney(totalGrossEarned)}</span>
                {totalAdvancePaid > 0 && <span className="ml-4 text-slate-700">অগ্রিম কর্তন: ৳ {formatMoney(totalAdvancePaid)}</span>}
              </div>
              <div className="text-sm font-bold">
                নিট প্রাপ্য টাকা: ৳ {formatMoney(netPayableDue)}
              </div>
            </div>

            {/* Printable signatures */}
            <div className="grid grid-cols-2 pt-10 text-center text-xs font-bold">
              <div>
                <div className="w-36 border-t border-slate-900 mx-auto pt-1">
                  কারিগরের স্বাক্ষর
                </div>
              </div>
              <div>
                <div className="w-36 border-t border-slate-900 mx-auto pt-1">
                  ইনচার্জ / অথরাইজড স্বাক্ষর
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
