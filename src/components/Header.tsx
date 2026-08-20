import React from 'react';
import { Shield, Calendar, FileText, LogOut, UserCheck } from 'lucide-react';
import { AdminUser } from '../types';

interface HeaderProps {
  currentRole: 'parent' | 'admin';
  adminUser: AdminUser | null;
  onOpenLoginModal: () => void;
  onLogout: () => void;
  activeView: 'letters' | 'calendar' | 'admin';
  onChangeView: (view: 'letters' | 'calendar' | 'admin') => void;
  isEmbedded: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  adminUser,
  onOpenLoginModal,
  onLogout,
  activeView,
  onChangeView,
  isEmbedded,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Logo and Brand */}
        <div className="flex items-center justify-between">
          <div
            onClick={() => onChangeView('letters')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            {/* Lazuardi Crest Emblem */}
            <div className="w-9 h-9 rounded-xl bg-blue-900 text-white flex items-center justify-center font-black text-sm shadow-xs border border-amber-400 group-hover:scale-105 transition-transform">
              LZ
            </div>
            <div>
              <h1 className="font-extrabold text-base sm:text-lg text-blue-950 tracking-tight leading-none">
                Pusat Informasi SD Lazuardi
              </h1>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                Surat Edaran & Agenda Kegiatan Sekolah
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs self-start md:self-center">
          <button
            onClick={() => onChangeView('letters')}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeView === 'letters'
                ? 'bg-white text-blue-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Surat Edaran
          </button>
          <button
            onClick={() => onChangeView('calendar')}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeView === 'calendar'
                ? 'bg-white text-blue-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            Agenda & Kegiatan
          </button>
          {currentRole === 'admin' && adminUser && !isEmbedded && (
            <button
              onClick={() => onChangeView('admin')}
              className={`px-3.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeView === 'admin'
                  ? 'bg-amber-400 text-slate-950 shadow-xs'
                  : 'text-amber-800 hover:text-amber-950'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              Kelola Admin
            </button>
          )}
        </div>

        {/* Right Controls - Google Login / Admin State */}
        <div className="flex items-center gap-2 self-end md:self-center">
          {!isEmbedded && (
            <>
              {currentRole === 'admin' && adminUser ? (
                <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 pl-2 pr-1 py-1 rounded-xl">
                  <div className="flex items-center gap-2">
                    <img
                      src={adminUser.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(adminUser.name)}`}
                      alt={adminUser.name}
                      className="w-6 h-6 rounded-full border border-blue-300"
                    />
                    <div className="hidden sm:block text-left leading-tight pr-1">
                      <div className="text-[11px] font-bold text-blue-950 flex items-center gap-1">
                        <span>{adminUser.name}</span>
                        <span className="text-[9px] px-1 py-0.2 bg-blue-200 text-blue-900 rounded font-semibold">Admin</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono truncate max-w-[130px]">
                        {adminUser.email}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={onLogout}
                    title="Keluar dari Mode Admin"
                    className="p-1.5 hover:bg-white text-slate-600 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={onOpenLoginModal}
                  className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 shadow-2xs hover:border-blue-700 transition-all cursor-pointer"
                  title="Login khusus guru & pengelola SD Lazuardi menggunakan Google"
                >
                  {/* Google Mini Icon */}
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.36 7.33 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.94 0 12s.46 3.84 1.26 5.42l4.02-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.25 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                  <Shield className="w-3.5 h-3.5 text-blue-900" />
                  <span>Login Admin Google</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
};
