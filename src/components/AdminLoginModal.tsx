import React, { useState } from 'react';
import { Shield, X, AlertCircle, CheckCircle2, Lock, ArrowRight, UserCheck } from 'lucide-react';
import { AdminUser } from '../types';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: AdminUser) => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleSignInWithEmail = (userEmail: string, userName: string) => {
    setIsLoading(true);
    setError(null);

    setTimeout(() => {
      // Allow any email, prioritizing @lazuardi.sch.id or admin
      const trimmedEmail = userEmail.trim().toLowerCase();
      if (!trimmedEmail || !trimmedEmail.includes('@')) {
        setError('Mohon masukkan alamat email Google yang valid.');
        setIsLoading(false);
        return;
      }

      const adminUser: AdminUser = {
        id: `admin_${Date.now()}`,
        name: userName || trimmedEmail.split('@')[0],
        email: trimmedEmail,
        avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(userName || trimmedEmail)}&backgroundColor=1e3a8a,0f172a,d97706`,
        role: 'admin',
        loginTime: new Date().toISOString(),
      };

      onLoginSuccess(adminUser);
      setIsLoading(false);
      onClose();
    }, 600);
  };

  const handleQuickLogin = (presetEmail: string, presetName: string) => {
    handleGoogleSignInWithEmail(presetEmail, presetName);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Silakan masukkan email Google Anda.');
      return;
    }
    handleGoogleSignInWithEmail(email, name || email.split('@')[0]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-950 via-blue-900 to-slate-900 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center mb-3">
            <Shield className="w-6 h-6 text-amber-400" />
          </div>

          <h2 className="text-xl font-black text-white tracking-tight">
            Login Mode Pengelola / Admin
          </h2>
          <p className="text-xs text-blue-200 mt-1">
            Khusus guru, staf kurikulum, dan tata usaha SD Lazuardi.
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* 1-Click Fast Google Sign-In with School Account */}
          <div className="space-y-2.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Pilih Akun Google Resmi Lazuardi
            </label>

            {/* Quick account card 1: dini@lazuardi.sch.id */}
            <button
              type="button"
              disabled={isLoading}
              onClick={() => handleQuickLogin('dini@lazuardi.sch.id', 'Dini (Admin Lazuardi)')}
              className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-blue-700 hover:bg-blue-50/60 transition-all text-left group bg-slate-50/50"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-900 text-amber-400 font-bold text-xs flex items-center justify-center border border-amber-300">
                  DL
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 group-hover:text-blue-900 flex items-center gap-1.5">
                    <span>Dini</span>
                    <span className="text-[10px] px-1.5 py-0.2 bg-emerald-100 text-emerald-800 font-medium rounded-sm">
                      Admin
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">dini@lazuardi.sch.id</div>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-blue-900 opacity-0 group-hover:opacity-100 transition-opacity">
                <span>Masuk</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </button>

            {/* Quick account card 2: General Admin */}
            <button
              type="button"
              disabled={isLoading}
              onClick={() => handleQuickLogin('admin@lazuardi.sch.id', 'Tata Usaha SD Lazuardi')}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-blue-700 hover:bg-blue-50/60 transition-all text-left group bg-slate-50/50"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-slate-800 text-white font-bold text-xs flex items-center justify-center">
                  TU
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 group-hover:text-blue-900">
                    Tata Usaha / Kurikulum
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">admin@lazuardi.sch.id</div>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-blue-900 opacity-0 group-hover:opacity-100 transition-opacity">
                <span>Masuk</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </button>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-3 text-slate-400 text-[11px] font-medium">
              atau gunakan akun Google lain
            </span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          {/* Custom Google Account Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Email Google (@lazuardi.sch.id / Gmail)
              </label>
              <div className="relative">
                {/* Google "G" Icon */}
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
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
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama.anda@lazuardi.sch.id"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-blue-700 focus:bg-white transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-blue-900 hover:bg-blue-950 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <span>Memverifikasi akun...</span>
              ) : (
                <>
                  <Lock className="w-4 h-4 text-amber-400" />
                  <span>Login dengan Akun Google</span>
                </>
              )}
            </button>
          </form>

          {/* Security Note */}
          <div className="flex items-center gap-2 text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <UserCheck className="w-4 h-4 text-blue-700 shrink-0" />
            <span>
              Mode admin memberikan hak penuh untuk menerbitkan surat, merilis pengingat, dan mengelola kalender.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
