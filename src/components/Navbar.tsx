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
  RefreshCw,
  ExternalLink,
  ChevronDown,
  CheckCircle2
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
  workersCount: number;
  sheetUrl: string | null;
  onManualSyncSheets: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  settings,
  activeTab,
  setActiveTab,
  onOpenNewLot,
  onLogin,
  onLogout,
  isSyncing,
  workersCount,
  sheetUrl,
  onManualSyncSheets
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-md no-print">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2">
          
          {/* Logo & Factory Info */}
          <div className="flex items-center space-x-3 cursor-pointer shrink-0" onClick={() => setActiveTab('lots')}>
            <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-inner font-bold">
              <Scissors className="w-5 h-5 -rotate-45" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base sm:text-lg tracking-tight text-white">{settings.factoryName}</span>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 hidden sm:inline-block">
                  সুইং বিল
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate max-w-[160px] sm:max-w-none">
                {settings.addressLine2 || 'Narayanganj'} • পিস-রেট হিসাব ও খতিয়ান
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            <button
              onClick={() => setActiveTab('lots')}
              className={`px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 ${
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
              className={`px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'workers' 
                  ? 'bg-slate-800 text-emerald-400 font-semibold shadow-sm' 
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              কারিগর ও খতিয়ান ({workersCount} জন)
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 ${
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
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            
            {/* Google Sheets Link & Sync Buttons (when logged in) */}
            {user && (
              <div className="flex items-center gap-1.5">
                {sheetUrl && (
                  <a
                    href={sheetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-emerald-950/70 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/60 font-medium px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-1 transition-colors"
                    title="Google Sheets এ সরাসরি স্প্রেডশিটটি খুলুন"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="hidden lg:inline">Google Sheets</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}

                <button
                  onClick={onManualSyncSheets}
                  disabled={isSyncing}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium px-2 sm:px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-1 transition-colors"
                  title="Google Sheets এর সাথে এখনই সিঙ্ক করুন"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">{isSyncing ? 'সিঙ্ক হচ্ছে...' : 'Sheets সিঙ্ক'}</span>
                </button>
              </div>
            )}

            {/* New Lot Button */}
            <button
              onClick={onOpenNewLot}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm flex items-center gap-1.5 shadow-sm transition-all active:scale-95 shrink-0"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">নতুন চালান</span> এন্ট্রি
            </button>

            {/* Auth / User Profile */}
            {user ? (
              <div className="relative shrink-0">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-1.5 p-1 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  {user.photoURL ? (
                    <img 
                      src={user.photoURL} 
                      alt={user.displayName || 'User'} 
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-slate-600 object-cover" 
                    />
                  ) : (
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emerald-800 text-emerald-200 flex items-center justify-center font-bold text-xs sm:text-sm">
                      {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                    </div>
                  )}
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-xl py-2 z-50 text-slate-200">
                    <div className="px-4 py-2 border-b border-slate-800">
                      <div className="flex items-center gap-1.5 text-emerald-400 text-[11px] font-semibold mb-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Google Sheets অটো-সিঙ্ক সংযুক্ত</span>
                      </div>
                      <p className="text-sm font-semibold truncate text-white">{user.displayName || 'কারখানা অ্যাডমিন'}</p>
                      <p className="text-xs text-slate-400 truncate">{user.email}</p>
                    </div>

                    <div className="px-2 py-1 space-y-0.5">
                      {sheetUrl && (
                        <a
                          href={sheetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-slate-800 flex items-center justify-between text-emerald-300 font-medium"
                        >
                          <span className="flex items-center gap-2">
                            <FileSpreadsheet className="w-3.5 h-3.5" />
                            Google Sheets ফাইল দেখুন
                          </span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}

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
                className="bg-white hover:bg-slate-100 text-slate-800 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors shrink-0"
                title="Google Sheets অটো-সিঙ্কের জন্য Google দিয়ে সাইন ইন করুন"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span className="hidden sm:inline">Google Sheets সিঙ্ক</span>
                <span className="sm:hidden">লগইন</span>
              </button>
            )}

          </div>

        </div>

        {/* Mobile Navigation bar */}
        <div className="flex md:hidden border-t border-slate-800 py-2 justify-around text-xs">
          <button
            onClick={() => setActiveTab('lots')}
            className={`px-3 py-1.5 rounded font-medium ${
              activeTab === 'lots' ? 'bg-slate-800 text-emerald-400 font-bold' : 'text-slate-400'
            }`}
          >
            📋 লট বিল
          </button>
          <button
            onClick={() => setActiveTab('workers')}
            className={`px-3 py-1.5 rounded font-medium ${
              activeTab === 'workers' ? 'bg-slate-800 text-emerald-400 font-bold' : 'text-slate-400'
            }`}
          >
            👥 কারিগর ({workersCount})
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3 py-1.5 rounded font-medium ${
              activeTab === 'settings' ? 'bg-slate-800 text-emerald-400 font-bold' : 'text-slate-400'
            }`}
          >
            ⚙️ সেটিংস
          </button>
        </div>
      </div>
    </header>
  );
};
