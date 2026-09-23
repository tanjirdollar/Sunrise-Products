import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { 
  Scissors, 
  FileSpreadsheet, 
  Users, 
  PlusCircle, 
  Settings, 
  LogIn, 
  LogOut, 
  CloudCheck, 
  CloudAlert,
  Printer,
  ChevronDown
} from 'lucide-react';
import { FactorySettings } from '../types';

interface NavbarProps {
  user: User | null;
  settings: FactorySettings;
  activeTab: 'lots' | 'workers' | 'settings';
  setActiveTab: (tab: 'lots' | 'workers' | 'settings') => void;
  onOpenNewLot: () => void;
  onLogin: () => void;
  onLogout: () => void;
  isSyncing: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  settings,
  activeTab,
  setActiveTab,
  onOpenNewLot,
  onLogin,
  onLogout,
  isSyncing
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-md no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Factory Info */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('lots')}>
            <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-inner font-bold">
              <Scissors className="w-5 h-5 -rotate-45" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-white">{settings.factoryName}</span>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                  সুইং বিল
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate max-w-[200px] sm:max-w-none">
                {settings.addressLine2 || 'Narayanganj'} • পিস-রেট হিসাব খতিয়ান
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            <button
              onClick={() => setActiveTab('lots')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'lots' 
                  ? 'bg-slate-800 text-emerald-400 font-semibold shadow-sm' 
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              লট ও বিল সমূহ
            </button>

            <button
              onClick={() => setActiveTab('workers')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'workers' 
                  ? 'bg-slate-800 text-emerald-400 font-semibold shadow-sm' 
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              কারিগর ও খতিয়ান (৫০+ জন)
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'settings' 
                  ? 'bg-slate-800 text-emerald-400 font-semibold shadow-sm' 
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <Settings className="w-4 h-4" />
              ফ্যাক্টরি সেটিংস
            </button>
          </nav>

          {/* Right Action buttons */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* New Lot Button */}
            <button
              onClick={onOpenNewLot}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-3 sm:px-4 py-2 rounded-lg text-sm flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">নতুন চালান</span> এন্ট্রি
            </button>

            {/* Cloud Status Pill */}
            <div 
              title={user ? `Firebase ক্লাউডে সিঙ্ক হচ্ছে (${user.email})` : 'লোকাল মেমোরি ব্যবহার হচ্ছে, ক্লাউড ব্যাকআপের জন্য লগইন করুন'}
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-slate-800 text-slate-300 border border-slate-700"
            >
              <span className={`w-2 h-2 rounded-full ${user ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
              <span>{user ? 'ক্লাউড সুরক্ষিত' : 'অফলাইন রেডি'}</span>
            </div>

            {/* Auth / User Profile */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  {user.photoURL ? (
                    <img 
                      src={user.photoURL} 
                      alt={user.displayName || 'User'} 
                      className="w-8 h-8 rounded-full border border-slate-600 object-cover" 
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-emerald-800 text-emerald-200 flex items-center justify-center font-bold text-sm">
                      {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                    </div>
                  )}
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-xl py-2 z-50 text-slate-200">
                    <div className="px-4 py-2 border-b border-slate-800">
                      <p className="text-xs text-slate-400">লগইন একাউন্ট</p>
                      <p className="text-sm font-semibold truncate text-white">{user.displayName || 'কারখানা অ্যাডমিন'}</p>
                      <p className="text-xs text-emerald-400 truncate">{user.email}</p>
                    </div>
                    <div className="px-2 py-1">
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          setActiveTab('settings');
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-slate-800 flex items-center gap-2"
                      >
                        <Settings className="w-3.5 h-3.5" />
                        কারখানা সেটিংস ও প্রিন্ট হেডার
                      </button>
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          onLogout();
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg text-xs text-red-400 hover:bg-red-950/40 hover:text-red-300 flex items-center gap-2 mt-1"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        লগআউট করুন
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onLogin}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 border border-slate-700 transition-colors"
                title="গুগল দিয়ে লগইন করে মোবাইল ও পিসিতে ডাটা সিঙ্ক রাখুন"
              >
                <LogIn className="w-3.5 h-3.5 text-emerald-400" />
                <span>লগইন</span>
              </button>
            )}

          </div>

        </div>

        {/* Mobile Navigation bar */}
        <div className="flex md:hidden border-t border-slate-800 py-2 justify-around">
          <button
            onClick={() => setActiveTab('lots')}
            className={`px-3 py-1.5 rounded text-xs font-medium ${
              activeTab === 'lots' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400'
            }`}
          >
            📋 লট বিল
          </button>
          <button
            onClick={() => setActiveTab('workers')}
            className={`px-3 py-1.5 rounded text-xs font-medium ${
              activeTab === 'workers' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400'
            }`}
          >
            👥 কারিগর খতিয়ান
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3 py-1.5 rounded text-xs font-medium ${
              activeTab === 'settings' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400'
            }`}
          >
            ⚙️ সেটিংস
          </button>
        </div>
      </div>
    </header>
  );
};
