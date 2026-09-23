import React, { useState } from 'react';
import { 
  Building2, 
  MapPin, 
  Printer, 
  Save, 
  RotateCcw, 
  Check, 
  Cloud, 
  ShieldCheck,
  FileSpreadsheet
} from 'lucide-react';
import { FactorySettings } from '../types';
import { defaultFactorySettings } from '../data/seedData';

interface SettingsModalProps {
  settings: FactorySettings;
  onSave: (settings: FactorySettings) => void;
  onResetDefaults: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onSave,
  onResetDefaults,
}) => {
  const [formData, setFormData] = useState<FactorySettings>({ ...settings });
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Top Title */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-600" />
            <span>কারখানা ও বিল প্রিন্ট সেটিংস</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            এখানে দেওয়া নাম ও ঠিকানা সরাসরি প্রিন্ট কপির হেডারে প্রদর্শিত হবে
          </p>
        </div>

        {savedSuccess && (
          <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 animate-bounce">
            <Check className="w-4 h-4" /> সংরক্ষিত হয়েছে
          </span>
        )}
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
        
        {/* Factory Name & Brand */}
        <div>
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3">
            কারখানার পরিচয় ও বিল হেডার
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                কারখানার নাম (Factory Unit Name) *
              </label>
              <input
                type="text"
                required
                value={formData.factoryName}
                onChange={(e) => setFormData({ ...formData, factoryName: e.target.value })}
                placeholder="Tex Wear Fashion"
                className="w-full text-sm font-bold p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                বিল শিরোনাম (Bill Header Title) *
              </label>
              <input
                type="text"
                required
                value={formData.billTitle}
                onChange={(e) => setFormData({ ...formData, billTitle: e.target.value })}
                placeholder="PCS Rate Worker Bill"
                className="w-full text-sm font-bold p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                ঠিকানা লাইন ১ (মার্কেট / প্লাজা / ফ্লোর)
              </label>
              <input
                type="text"
                value={formData.addressLine1}
                onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                placeholder="Mrydha Olonkar Plaza 3 rd Floor"
                className="w-full text-sm p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                ঠিকানা লাইন ২ (এলাকা / থানা / পোস্টকোড)
              </label>
              <input
                type="text"
                value={formData.addressLine2}
                onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
                placeholder="Tanbazar, Narayanganj 1400"
                className="w-full text-sm p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">দেশ (Country)</label>
              <input
                type="text"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                placeholder="Bangladesh"
                className="w-full text-sm p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">মুদ্রা চিহ্ন (Currency)</label>
              <input
                type="text"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                placeholder="৳"
                className="w-full text-sm p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Operational Defaults */}
        <div className="pt-4 border-t border-slate-200">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3">
            সুইং সেকশন ডিফল্ট মান
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                ডিফল্ট সেকশন / লাইন নাম
              </label>
              <input
                type="text"
                value={formData.defaultLine}
                onChange={(e) => setFormData({ ...formData, defaultLine: e.target.value })}
                placeholder="Sweing"
                className="w-full text-sm p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                কারিগরদের ডিফল্ট পদবি (Designation)
              </label>
              <input
                type="text"
                value={formData.defaultDesignation}
                onChange={(e) => setFormData({ ...formData, defaultDesignation: e.target.value })}
                placeholder="Plain Machine Operator"
                className="w-full text-sm p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                যেমন: ৫০-৬০ জন কারিগরের পদবি ডিফল্টভাবে 'Plain Machine Operator' থাকবে
              </p>
            </div>
          </div>
        </div>

        {/* Cloud & Security Status Card */}
        <div className="pt-4 border-t border-slate-200">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">ফায়ারবেস ক্লাউড ডাটাবেজ সক্রিয়</h4>
                <p className="text-xs text-slate-500">
                  আপনার সমস্ত চালান ও খতিয়ান ক্লাউডে সংরক্ষিত এবং যেকোনো মোবাইল বা কম্পিউটার থেকে অ্যাক্সেসযোগ্য।
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded bg-emerald-100 text-emerald-800">
              Cloud Ready
            </span>
          </div>
        </div>

        {/* Buttons */}
        <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onResetDefaults}
            className="text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-slate-100"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>ডেমো ডাটা অনুযায়ী রিসেট</span>
          </button>

          <button
            type="submit"
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-6 py-2.5 rounded-lg flex items-center gap-2 shadow-sm transition-all active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>সেটিংস সংরক্ষণ করুন</span>
          </button>
        </div>

      </form>

    </div>
  );
};
