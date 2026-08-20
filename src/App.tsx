import { supabase } from './lib/supabase';
import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { EmergencyBanner } from './components/EmergencyBanner';
import { ScheduledReminderBanner } from './components/ScheduledReminderBanner';
import { FilterBar } from './components/FilterBar';
import { CircularCard } from './components/CircularCard';
import { CircularDetailModal } from './components/CircularDetailModal';
import { SchoolCalendarView } from './components/SchoolCalendarView';
import { AdminPanel } from './components/AdminPanel';
import { AdminLoginModal } from './components/AdminLoginModal';

import { 
  CircularLetter, 
  EmergencyAlert, 
  SchoolEvent, 
  FilterState, 
  GradeLevel,
  ScheduledReminder,
  AdminUser
} from './types';

import { 
  INITIAL_CIRCULARS, 
  INITIAL_ALERTS, 
  INITIAL_EVENTS, 
  INITIAL_REMINDERS
} from './data/initialData';

import { BookOpen, Shield, Lock } from 'lucide-react';

export default function App() {
  // Persistence state in localStorage (fresh clean slate)
  const [circulars, setCirculars] = useState<CircularLetter[]>([]);

useEffect(() => {
  const loadCirculars = async () => {
    const { data, error } = await supabase
      .from('informasi')
      .select('*')
      .eq('status', 'published')
      .order('pinned', { ascending: false })
      .order('tanggal', { ascending: false });

    if (error) {
      console.error('Gagal mengambil informasi dari Supabase:', error);
      return;
    }

    const mappedCirculars: CircularLetter[] = (data ?? []).map((row) => ({
      id: row.id,
      nomorSurat: row.nomor_surat ?? '',
      title: row.judul,
      category: row.kategori,
      gradeLevels: row.target_grade ?? ['Semua'],
      publishDate: row.tanggal,
      effectiveDate: row.effective_date ?? '',
      deadlineConfirmation: row.deadline_confirmation ?? undefined,

      urgency: (row.urgency ?? 'normal') as CircularLetter['urgency'],

      summary: row.summary ?? '',
      content: row.isi,

      actionRequired: row.action_required ?? undefined,

      attachmentName: row.attachment_name ?? undefined,
      attachmentSize: row.attachment_size ?? undefined,
      attachmentType: row.attachment_type ?? undefined,

      gdriveLink:
        row.gdrive_link ??
        row.lampiran_url ??
        row.tautan_url ??
        undefined,

      signedBy: row.signed_by ?? '',
      tembusan: row.tembusan ?? [],

      whatsappBroadcastText:
        row.whatsapp_broadcast_text ?? undefined,

      isPinned: row.pinned ?? false,
      viewCount: row.view_count ?? 0,
    }));

    setCirculars(mappedCirculars);
  };

  loadCirculars();
}, []);

  const [alerts, setAlerts] = useState<EmergencyAlert[]>(() => {
    const saved = localStorage.getItem('lazuardi_clean_alerts');
    return saved ? JSON.parse(saved) : INITIAL_ALERTS;
  });

  const [events, setEvents] = useState<SchoolEvent[]>(() => {
    const saved = localStorage.getItem('lazuardi_clean_events');
    return saved ? JSON.parse(saved) : INITIAL_EVENTS;
  });

  const [reminders, setReminders] = useState<ScheduledReminder[]>(() => {
    const saved = localStorage.getItem('lazuardi_clean_reminders');
    return saved ? JSON.parse(saved) : INITIAL_REMINDERS;
  });

  const DEFAULT_GCAL_URL =
    'https://calendar.google.com/calendar/embed?src=c_281c658374a1ec976b5e2339c5973e2ad2653a6fb84a37bbb408465908be3563%40group.calendar.google.com&ctz=Asia%2FJakarta';

  const [calendarUrl, setCalendarUrl] = useState<string>(() => {
    const saved = localStorage.getItem('lazuardi_gcalendar_url_v2');
    return saved || DEFAULT_GCAL_URL;
  });

  // Admin User & Google Authentication State
  const [adminUser, setAdminUser] = useState<AdminUser | null>(() => {
    const saved = localStorage.getItem('lazuardi_admin_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Save to localStorage when changed
  useEffect(() => {
    localStorage.setItem('lazuardi_clean_circulars', JSON.stringify(circulars));
  }, [circulars]);

  useEffect(() => {
    localStorage.setItem('lazuardi_clean_alerts', JSON.stringify(alerts));
  }, [alerts]);

  useEffect(() => {
    localStorage.setItem('lazuardi_clean_events', JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    localStorage.setItem('lazuardi_clean_reminders', JSON.stringify(reminders));
  }, [reminders]);

  useEffect(() => {
    localStorage.setItem('lazuardi_gcalendar_url_v2', calendarUrl);
  }, [calendarUrl]);

  useEffect(() => {
    if (adminUser) {
      localStorage.setItem('lazuardi_admin_user', JSON.stringify(adminUser));
    } else {
      localStorage.removeItem('lazuardi_admin_user');
    }
  }, [adminUser]);

  // Navigation & Role State
  const [currentRole, setCurrentRole] = useState<'parent' | 'admin'>(() => {
    return adminUser ? 'admin' : 'parent';
  });

  const [activeView, setActiveView] = useState<'letters' | 'calendar' | 'admin'>('letters');

  // Modals state
  const [selectedCircular, setSelectedCircular] = useState<CircularLetter | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Filter State - only search & grade levels (no category filter)
  const [filter, setFilter] = useState<FilterState>({
    search: '',
    gradeLevel: 'Semua Kelas',
    category: '',
    month: '',
    onlyUrgent: false,
    onlyUnread: false,
  });

  const appUrl = typeof window !== 'undefined' ? window.location.href : '';

  // Check URL parameters for direct circular link & auto-detect embed in Google Sites
  const [isEmbedded, setIsEmbedded] = useState(false);

  useEffect(() => {
    // Detect iframe embedding (Google Sites)
    try {
      if (window.self !== window.top) {
        setIsEmbedded(true);
      }
    } catch {
      setIsEmbedded(true);
    }

    const params = new URLSearchParams(window.location.search);
    const letterId = params.get('letter');
    if (letterId) {
      const found = circulars.find((c) => c.id === letterId);
      if (found) {
        setSelectedCircular(found);
        setIsDetailOpen(true);
      }
    }
  }, [circulars]);

  // Handle Login Success
  const handleLoginSuccess = (user: AdminUser) => {
    setAdminUser(user);
    setCurrentRole('admin');
    setActiveView('admin');
  };

  // Handle Logout
  const handleLogout = () => {
    setAdminUser(null);
    setCurrentRole('parent');
    if (activeView === 'admin') {
      setActiveView('letters');
    }
  };

  // Handle requesting to open admin mode
  const handleRequestAdminMode = () => {
    if (adminUser) {
      setCurrentRole('admin');
      setActiveView('admin');
    } else {
      setIsLoginModalOpen(true);
    }
  };

  // Grade Options requested:
  // Semua Kelas, Kelas 1, Kelas 2, Kelas 3, Kelas 4, Kelas 5, Kelas 6, Fase A, Fase B, Fase C
  const gradeOptions: GradeLevel[] = [
    'Semua Kelas',
    'Kelas 1',
    'Kelas 2',
    'Kelas 3',
    'Kelas 4',
    'Kelas 5',
    'Kelas 6',
    'Fase A',
    'Fase B',
    'Fase C',
  ];

  // Filtering Circulars
  const filteredCirculars = circulars.filter((circ) => {
    if (filter.search) {
      const q = filter.search.toLowerCase();
      const matchTitle = circ.title.toLowerCase().includes(q);
      const matchNomor = circ.nomorSurat.toLowerCase().includes(q);
      const matchSummary = circ.summary.toLowerCase().includes(q);
      if (!matchTitle && !matchNomor && !matchSummary) return false;
    }

    if (filter.gradeLevel && filter.gradeLevel !== 'Semua Kelas') {
      const hasGrade =
        circ.gradeLevels.includes('Semua Kelas') ||
        circ.gradeLevels.includes(filter.gradeLevel);
      if (!hasGrade) return false;
    }

    return true;
  });

  const handleOpenDetail = (circular: CircularLetter) => {
    setSelectedCircular(circular);
    setIsDetailOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans antialiased text-slate-900 selection:bg-amber-200">
      {/* Top Header */}
      <Header
        currentRole={adminUser ? 'admin' : 'parent'}
        adminUser={adminUser}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
        activeView={activeView}
        onChangeView={(view) => {
          if (view === 'admin' && !adminUser) {
            setIsLoginModalOpen(true);
          } else {
            setActiveView(view);
          }
        }}
        isEmbedded={isEmbedded}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Emergency Alert Banner */}
        <EmergencyBanner
          alerts={alerts}
          onOpenCircularDetail={(circularId) => {
            const found = circulars.find((c) => c.id === circularId);
            if (found) handleOpenDetail(found);
          }}
        />

        {/* Scheduled Reminders (Pick-up, Uniform, Jumatan, etc.) */}
        <ScheduledReminderBanner reminders={reminders} />

        {/* Main View Router */}
        {activeView === 'letters' && (
          <div className="space-y-6">
            {/* Filter and Search Bar */}
            <FilterBar
              filter={filter}
              onChangeFilter={(newFilter) => setFilter((prev) => ({ ...prev, ...newFilter }))}
              gradeOptions={gradeOptions}
            />

            {/* Circular Letters List */}
            {filteredCirculars.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredCirculars.map((circ) => (
                  <CircularCard
                    key={circ.id}
                    circular={circ}
                    onOpenDetail={handleOpenDetail}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <BookOpen className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">
                  {circulars.length === 0 ? 'Belum Ada Surat Edaran' : 'Tidak ada surat edaran yang sesuai'}
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {circulars.length === 0 
                    ? 'Surat edaran sekolah yang dipublikasikan akan tampil di sini.'
                    : 'Coba ubah kata kunci pencarian atau ganti pilihan filter jenjang kelas di atas.'}
                </p>
                {circulars.length === 0 ? (
                  <button
                    onClick={handleRequestAdminMode}
                    className="px-4 py-2 bg-blue-900 hover:bg-blue-950 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                  >
                    + Buat Surat Edaran Baru
                  </button>
                ) : (
                  <button
                    onClick={() =>
                      setFilter({
                        search: '',
                        gradeLevel: 'Semua Kelas',
                        category: '',
                        month: '',
                        onlyUrgent: false,
                        onlyUnread: false,
                      })
                    }
                    className="px-4 py-2 bg-blue-900 text-white rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Reset Filter
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {activeView === 'calendar' && (
          <SchoolCalendarView
            events={events}
            circulars={circulars}
            onOpenCircular={handleOpenDetail}
            calendarUrl={calendarUrl}
            onUpdateCalendarUrl={setCalendarUrl}
          />
        )}

        {activeView === 'admin' && (
          <>
            {adminUser ? (
              <AdminPanel
                circulars={circulars}
                alerts={alerts}
                events={events}
                reminders={reminders}
                calendarUrl={calendarUrl}
                onUpdateCalendarUrl={setCalendarUrl}
                adminUser={adminUser}
                onLogout={handleLogout}
                onAddCircular={(newCirc) => setCirculars((prev) => [newCirc, ...prev])}
                onUpdateCircular={(updCirc) =>
                  setCirculars((prev) => prev.map((c) => (c.id === updCirc.id ? updCirc : c)))
                }
                onDeleteCircular={(id) =>
                  setCirculars((prev) => prev.filter((c) => c.id !== id))
                }
                onUpdateAlerts={setAlerts}
                onUpdateReminders={setReminders}
                onAddEvent={(newEv) => setEvents((prev) => [newEv, ...prev])}
                onDeleteEvent={(id) => setEvents((prev) => prev.filter((e) => e.id !== id))}
                onOpenCircularDetail={handleOpenDetail}
              />
            ) : (
              <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 max-w-lg mx-auto my-8 space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-900 flex items-center justify-center mx-auto border border-blue-200">
                  <Lock className="w-7 h-7 text-blue-900" />
                </div>
                <h3 className="font-extrabold text-lg text-slate-900">
                  Akses Terbatas: Khusus Admin & Staf
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Halaman pengelolaan surat edaran, arsip dokumen, dan kalender hanya dapat diakses setelah login menggunakan akun Google resmi SD Lazuardi.
                </p>
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="px-6 py-2.5 bg-blue-900 hover:bg-blue-950 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Login Akun Google Admin
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Clean, Simple Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-5 text-slate-600 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-blue-950 text-amber-400 font-bold flex items-center justify-center text-[10px]">
              LZ
            </div>
            <span className="text-slate-700 font-medium">
              <strong>SD Lazuardi</strong> — Pusat Informasi Surat Edaran Orang Tua
            </span>
          </div>

          <div className="text-slate-500 text-[11px]">
            Lazuardi Global Compassionate School
          </div>
        </div>
      </footer>

      {/* Modals */}
      <CircularDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        circular={selectedCircular}
        appUrl={appUrl}
      />

      {/* Google Admin Login Modal */}
      <AdminLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}
