import React from 'react';
import { 
  Printer, 
  Download, 
  ArrowLeft, 
  Edit3, 
  UserCheck, 
  FileSpreadsheet,
  Share2,
  CheckCircle2
} from 'lucide-react';
import { FactorySettings, LotInvoice } from '../types';
import { exportLotToCSV } from '../services/db';

interface PrintableBillProps {
  lot: LotInvoice;
  settings: FactorySettings;
  onBack: () => void;
  onEdit: (lot: LotInvoice) => void;
  onSelectWorker: (workerId: string, workerName: string) => void;
}

export const PrintableBill: React.FC<PrintableBillProps> = ({
  lot,
  settings,
  onBack,
  onEdit,
  onSelectWorker
}) => {
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

  return (
    <div className="min-h-screen bg-slate-100 py-6 sm:py-8 px-2 sm:px-6">
      
      {/* Top Action Bar (Hidden in Print) */}
      <div className="max-w-4xl mx-auto mb-6 flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl shadow-sm border border-slate-200 no-print">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3.5 py-2 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>চালান তালিকায় ফিরুন</span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onEdit(lot)}
            className="flex items-center gap-1.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 px-3.5 py-2 rounded-lg transition-colors"
          >
            <Edit3 className="w-4 h-4 text-slate-600" />
            <span>চালান এডিট</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 text-sm font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3.5 py-2 rounded-lg transition-colors"
            title="Google Sheets বা Excel এ খোলার জন্য CSV ফাইল ডাউনলোড"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Excel / Sheets এক্সপোর্ট</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 px-5 py-2 rounded-lg shadow-sm transition-all active:scale-95"
          >
            <Printer className="w-4 h-4 text-emerald-400" />
            <span>বিল প্রিন্ট করুন (A4)</span>
          </button>
        </div>
      </div>

      {/* Main Printable Document Card */}
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md border border-slate-300 p-6 sm:p-10 text-slate-900 print-container">
        
        {/* Factory Header (Exact match with photo) */}
        <div className="text-center border-b border-transparent pb-3 mb-3">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-950 font-serif">
            {lot.factoryUnit || settings.factoryName}
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-700 mt-0.5">
            {settings.addressLine1}
          </p>
          <p className="text-xs sm:text-sm font-medium text-slate-700">
            {settings.addressLine2}
          </p>
          <p className="text-xs sm:text-sm font-medium text-slate-700">
            {settings.country}
          </p>

          <div className="mt-3">
            <h2 className="text-lg sm:text-xl font-bold tracking-wide text-slate-900 uppercase underline underline-offset-4 decoration-1 font-serif">
              {settings.billTitle || 'PCS Rate Worker Bill'}
            </h2>
          </div>
        </div>

        {/* Invoice Metadata Grid (Exact layout from photo) */}
        <div className="grid grid-cols-2 text-xs sm:text-sm font-sans mb-4 pt-1">
          {/* Left Metadata Column */}
          <div className="space-y-1">
            <div className="flex">
              <span className="font-semibold w-24 sm:w-28 text-slate-800">Invoice No :</span>
              <span className="font-bold text-slate-950">{lot.invoiceNo}</span>
            </div>
            <div className="flex">
              <span className="font-semibold w-24 sm:w-28 text-slate-800">Line :</span>
              <span className="text-slate-900">{lot.line}</span>
            </div>
            <div className="flex">
              <span className="font-semibold w-24 sm:w-28 text-slate-800">Factory Unit :</span>
              <span className="text-slate-900">{lot.factoryUnit || settings.factoryName}</span>
            </div>
            <div className="flex">
              <span className="font-semibold w-24 sm:w-28 text-slate-800">Category :</span>
              <span className="font-medium text-slate-900">{lot.category}</span>
            </div>
            <div className="flex">
              <span className="font-semibold w-24 sm:w-28 text-slate-800">Item :</span>
              <span className="font-bold text-slate-950">{lot.item}</span>
            </div>
            <div className="flex">
              <span className="font-semibold w-24 sm:w-28 text-slate-800">Total DZ :</span>
              <span className="font-bold text-slate-950">{(lot.totalTargetDZ || lot.totalQty).toFixed(2)}</span>
            </div>
          </div>

          {/* Right Metadata Column */}
          <div className="space-y-1 text-right sm:text-right">
            <div className="flex justify-end">
              <span className="font-semibold text-slate-800 mr-2">Invoice Date :</span>
              <span className="font-medium text-slate-950">{lot.invoiceDate}</span>
            </div>
            <div className="flex justify-end">
              <span className="font-semibold text-slate-800 mr-2">Receive Date :</span>
              <span className="font-medium text-slate-950">{lot.receiveDate}</span>
            </div>
            <div className="flex justify-end text-xs text-slate-500 pt-3 no-print">
              <span>মোট কারিগর: {lot.items.length} জন</span>
            </div>
          </div>
        </div>

        {/* Bill Table (Exact replica of photo with crisp borders) */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-slate-900 text-xs sm:text-sm print-table">
            <thead>
              <tr className="bg-slate-100 text-slate-950 text-center font-bold">
                <th className="border border-slate-900 px-2 py-1.5 w-12">SL No</th>
                <th className="border border-slate-900 px-3 py-1.5 text-left">Employee</th>
                <th className="border border-slate-900 px-3 py-1.5 text-left">Designation</th>
                <th className="border border-slate-900 px-2 py-1.5 w-16">Size</th>
                <th className="border border-slate-900 px-2 py-1.5 w-20">Qty DZ</th>
                <th className="border border-slate-900 px-2 py-1.5 w-20">Price</th>
                <th className="border border-slate-900 px-2 py-1.5 w-24">Total Price</th>
                <th className="border border-slate-900 px-3 py-1.5 w-28 sm:w-32">Signature</th>
              </tr>
            </thead>
            <tbody>
              {lot.items.map((item, index) => (
                <tr key={item.id || index} className="hover:bg-slate-50">
                  {/* SL No */}
                  <td className="border border-slate-900 px-2 py-1 text-center font-medium text-slate-800">
                    {index + 1}
                  </td>

                  {/* Employee Name (Clickable on screen to open Khotiyan) */}
                  <td className="border border-slate-900 px-3 py-1 font-medium text-slate-950">
                    <button
                      type="button"
                      onClick={() => onSelectWorker(item.workerId, item.workerName)}
                      className="text-left font-semibold hover:text-emerald-700 hover:underline group flex items-center justify-between w-full"
                      title="খতিয়ান দেখতে ক্লিক করুন"
                    >
                      <span>{item.workerName}</span>
                      <span className="no-print text-[10px] text-emerald-600 opacity-0 group-hover:opacity-100 font-sans ml-1">
                        খতিয়ান ↗
                      </span>
                    </button>
                  </td>

                  {/* Designation */}
                  <td className="border border-slate-900 px-3 py-1 text-slate-800">
                    {item.designation}
                  </td>

                  {/* Size */}
                  <td className="border border-slate-900 px-2 py-1 text-center text-slate-800">
                    {item.size || '14/20'}
                  </td>

                  {/* Qty DZ */}
                  <td className="border border-slate-900 px-2 py-1 text-center font-semibold text-slate-950">
                    {item.quantity}
                  </td>

                  {/* Price / Rate */}
                  <td className="border border-slate-900 px-2 py-1 text-right text-slate-900">
                    {item.rate.toFixed(2)}
                  </td>

                  {/* Total Price */}
                  <td className="border border-slate-900 px-2 py-1 text-right font-bold text-slate-950">
                    {formatMoney(item.totalPrice)}
                  </td>

                  {/* Signature Box (For manual physical signing on print) */}
                  <td className="border border-slate-900 px-2 py-1 text-center align-middle h-8">
                    {/* Visual signature placeholder line */}
                    <div className="w-full border-b border-dotted border-slate-300 print:border-transparent h-4"></div>
                  </td>
                </tr>
              ))}

              {/* Total Row (Exact matching style) */}
              <tr className="bg-slate-100 font-bold text-slate-950">
                <td colSpan={4} className="border border-slate-900 px-3 py-2 text-center text-sm font-serif uppercase tracking-wider">
                  Total
                </td>
                <td className="border border-slate-900 px-2 py-2 text-center text-sm font-bold">
                  {lot.totalQty.toFixed(2)}
                </td>
                <td className="border border-slate-900 px-2 py-2 text-center text-xs text-slate-600">
                  {/* Average or total unit rate if applicable */}
                  -
                </td>
                <td className="border border-slate-900 px-2 py-2 text-right text-sm font-extrabold">
                  {formatMoney(lot.totalPrice)}
                </td>
                <td className="border border-slate-900 px-2 py-2 text-center">
                  ✓
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Amount in words & Notes (Screen helper) */}
        <div className="mt-3 flex justify-between items-center text-xs text-slate-600 no-print">
          <div>
            <span>মোট বিল: </span>
            <span className="font-bold text-slate-900">৳ {formatMoney(lot.totalPrice)} টাকা</span>
          </div>
          <div>
            <span>আইটেম সংখ্যা: </span>
            <span className="font-medium text-slate-800">{lot.items.length} জন কারিগর</span>
          </div>
        </div>

        {/* Footer Signature Blocks (Exact matching layout from photo) */}
        <div className="mt-16 sm:mt-24 pt-6 grid grid-cols-3 gap-6 text-center text-xs sm:text-sm font-medium text-slate-900 page-break-inside-avoid">
          {/* Prepared By */}
          <div className="flex flex-col items-center">
            <div className="w-36 sm:w-44 border-t border-slate-800 pt-1">
              <p className="font-bold text-slate-950 font-serif">Prepared By</p>
              <p className="text-[11px] text-slate-600">{lot.preparedBy || 'Production Incharge'}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Date: {lot.invoiceDate}</p>
            </div>
          </div>

          {/* Checked By */}
          <div className="flex flex-col items-center">
            <div className="w-36 sm:w-44 border-t border-slate-800 pt-1">
              <p className="font-bold text-slate-950 font-serif">Checked By</p>
              <p className="text-[11px] text-slate-600">{lot.checkedBy || 'Sweing Supervisor'}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Date: ____________</p>
            </div>
          </div>

          {/* Received By */}
          <div className="flex flex-col items-center">
            <div className="w-36 sm:w-44 border-t border-slate-800 pt-1">
              <p className="font-bold text-slate-950 font-serif">Received By</p>
              <p className="text-[11px] text-slate-600">{lot.receivedBy || 'Accounts / Admin'}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Date: ____________</p>
            </div>
          </div>
        </div>

      </div>

      {/* Screen tips for manager */}
      <div className="max-w-4xl mx-auto mt-4 text-center text-xs text-slate-500 no-print">
        💡 টিপস: যে কোনো কারিগরের নামের ওপর ক্লিক করলে তার সম্পূর্ণ ব্যক্তিগত খতিয়ান খুলে যাবে। বিল শিটটি প্রিন্ট করার জন্য উপরের <strong>"বিল প্রিন্ট করুন (A4)"</strong> বাটনে চাপ দিন।
      </div>

    </div>
  );
};
