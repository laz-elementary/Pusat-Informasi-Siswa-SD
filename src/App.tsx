import { supabase } from './src/lib/supabase';
import React, { useEffect, useState } from 'react';

import { Header } from './components/Header';
import { EmergencyBanner } from './components/EmergencyBanner';
import { ScheduledReminderBanner } from './components/ScheduledReminderBanner';
import { FilterBar } from './components/FilterBar';
import { CircularCard } from './components/CircularCard';
import { CircularDetailModal } from './components/CircularDetailModal';
import { SchoolCalendarView } from './components/SchoolCalendarView';
import { AdminPanel } from './components/AdminPanel';

import {
  CircularLetter,
  EmergencyAlert,
  SchoolEvent,
  FilterState,
  GradeLevel,
  ScheduledReminder,
  AdminUser,
} from './types';

import {
  INITIAL_ALERTS,
  INITIAL_EVENTS,
  INITIAL_REMINDERS,
} from './data/initialData';

import { BookOpen, Lock, X } from 'lucide-react';

export default function App() {
  // =========================================================
  // CIRCULAR / INFORMASI — SUPABASE
  // =========================================================

  const [circulars, setCirculars] = useState<CircularLetter[]>([]);
  const [circularLoading, setCircularLoading] = useState(true);

  const normalizeGradeLevels = (grades: unknown): string[] => {
    if (!Array.isArray(grades) || grades.length === 0) {
      return ['Semua Kelas'];
    }

    return grades.map((grade) =>
      grade === 'Semua' ? 'Semua Kelas' : String(grade)
    );
  };

  const mapDatabaseRowToCircular = (row: any): CircularLetter => ({
    id: row.id,
    nomorSurat: row.nomor_surat ?? '',
    title: row.judul ?? '',
    category: row.kategori ?? 'Pengumuman',
    gradeLevels: normalizeGradeLevels(row.target_grade),
    publishDate: row.tanggal ?? '',
    effectiveDate: row.effective_date ?? '',
    deadlineConfirmation: row.deadline_confirmation ?? undefined,

    urgency: (row.urgency ?? 'normal') as CircularLetter['urgency'],

    summary: row.summary ?? '',
    content: row.isi ?? '',

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
  });

  const loadCirculars = async () => {
    setCircularLoading(true);

    const { data, error } = await supabase
      .from('informasi')
      .select('*')
      .order('pinned', { ascending: false })
      .order('tanggal', { ascending: false });

    if (error) {
      console.error(
        'Gagal mengambil informasi dari Supabase:',
        error
      );

      setCircularLoading(false);
      return;
    }

    const mappedCirculars = (data ?? []).map(
      mapDatabaseRowToCircular
    );

    setCirculars(mappedCirculars);
    setCircularLoading(false);
  };

  useEffect(() => {
    void loadCirculars();
  }, []);

  // =========================================================
  // ALERTS — LOCAL STORAGE
  // =========================================================

  const [alerts, setAlerts] = useState<EmergencyAlert[]>(() => {
    const saved = localStorage.getItem(
      'lazuardi_clean_alerts'
    );

    return saved ? JSON.parse(saved) : INITIAL_ALERTS;
  });

  // =========================================================
  // EVENTS — LOCAL STORAGE
  // =========================================================

  const [events, setEvents] = useState<SchoolEvent[]>(() => {
    const saved = localStorage.getItem(
      'lazuardi_clean_events'
    );

    return saved ? JSON.parse(saved) : INITIAL_EVENTS;
  });

  // =========================================================
  // REMINDERS — LOCAL STORAGE
  // =========================================================

  const [reminders, setReminders] =
  useState<ScheduledReminder[]>([]);

const [remindersLoading, setRemindersLoading] =
  useState(true);

const loadReminders = async () => {
  setRemindersLoading(true);

  const { data, error } = await supabase
    .from('reminders')
    .select('id, payload')
    .order('created_at', { ascending: true });

  if (error) {
    console.error(
      'Gagal mengambil reminder dari Supabase:',
      error
    );

    setRemindersLoading(false);
    return;
  }

  const loadedReminders: ScheduledReminder[] =
    (data ?? []).map(
      (row) => row.payload as ScheduledReminder
    );

  setReminders(loadedReminders);
  setRemindersLoading(false);
};

useEffect(() => {
  void loadReminders();
}, []);

  // =========================================================
  // GOOGLE CALENDAR
  // =========================================================

  const DEFAULT_GCAL_URL =
    'https://calendar.google.com/calendar/embed?src=c_281c658374a1ec976b5e2339c5973e2ad2653a6fb84a37bbb408465908be3563%40group.calendar.google.com&ctz=Asia%2FJakarta';

  const [calendarUrl, setCalendarUrl] =
    useState<string>(() => {
      const saved = localStorage.getItem(
        'lazuardi_gcalendar_url_v2'
      );

      return saved || DEFAULT_GCAL_URL;
    });

  // =========================================================
  // SIMPAN DATA NON-CIRCULAR KE LOCAL STORAGE
  // =========================================================

  useEffect(() => {
    localStorage.setItem(
      'lazuardi_clean_alerts',
      JSON.stringify(alerts)
    );
  }, [alerts]);

  useEffect(() => {
    localStorage.setItem(
      'lazuardi_clean_events',
      JSON.stringify(events)
    );
  }, [events]);

  useEffect(() => {
    localStorage.setItem(
      'lazuardi_gcalendar_url_v2',
      calendarUrl
    );
  }, [calendarUrl]);

  // =========================================================
  // ADMIN AUTH — SUPABASE
  // =========================================================

  const [adminUser, setAdminUser] =
    useState<AdminUser | null>(null);

  const [adminAuthLoading, setAdminAuthLoading] =
    useState(true);

  const [isLoginModalOpen, setIsLoginModalOpen] =
    useState(false);

  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminLoginLoading, setAdminLoginLoading] =
    useState(false);

  const [adminLoginError, setAdminLoginError] =
    useState('');

  // =========================================================
  // VIEW / NAVIGATION
  // =========================================================

  const [activeView, setActiveView] = useState<
    'letters' | 'calendar' | 'admin'
  >('letters');

  // =========================================================
  // CEK SESSION ADMIN
  // =========================================================

  const checkAdminSession = async () => {
    setAdminAuthLoading(true);

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      setAdminUser(null);
      setAdminAuthLoading(false);

      // Setelah logout, muat ulang data.
      // RLS akan membuat publik hanya melihat published.
      await loadCirculars();

      return;
    }

    const { data: admin, error: adminError } =
      await supabase
        .from('admin_users')
        .select('email')
        .eq('user_id', session.user.id)
        .maybeSingle();

    if (adminError || !admin) {
      await supabase.auth.signOut();

      setAdminUser(null);
      setAdminAuthLoading(false);

      await loadCirculars();

      return;
    }

    const userForApp = {
      email: session.user.email ?? admin.email,
    } as AdminUser;

    setAdminUser(userForApp);
    setAdminAuthLoading(false);

    // Admin boleh melihat semua informasi sesuai RLS,
    // termasuk jika nanti ada draft.
    await loadCirculars();
  };

  useEffect(() => {
    void checkAdminSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session?.user) {
          setAdminUser(null);
          setAdminAuthLoading(false);

          window.setTimeout(() => {
            void loadCirculars();
          }, 0);

          return;
        }

        window.setTimeout(() => {
          void checkAdminSession();
        }, 0);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // =========================================================
  // LOGIN ADMIN
  // =========================================================

  const handleAdminLogin = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setAdminLoginError('');

    if (!adminEmail.trim() || !adminPassword) {
      setAdminLoginError(
        'Silakan masukkan email dan password admin.'
      );

      return;
    }

    setAdminLoginLoading(true);

    const { data, error } =
      await supabase.auth.signInWithPassword({
        email: adminEmail.trim(),
        password: adminPassword,
      });

    if (error || !data.user) {
      console.error('Login Supabase gagal:', error);

      setAdminLoginError(
        'Email atau password admin tidak sesuai.'
      );

      setAdminLoginLoading(false);
      return;
    }

    const { data: admin, error: adminError } =
      await supabase
        .from('admin_users')
        .select('email')
        .eq('user_id', data.user.id)
        .maybeSingle();

    if (adminError || !admin) {
      await supabase.auth.signOut();

      setAdminLoginError(
        'Akun ini tidak memiliki akses sebagai admin.'
      );

      setAdminLoginLoading(false);
      return;
    }

    const userForApp = {
      email: data.user.email ?? admin.email,
    } as AdminUser;

    setAdminUser(userForApp);

    setAdminEmail('');
    setAdminPassword('');
    setAdminLoginError('');
    setAdminLoginLoading(false);

    setIsLoginModalOpen(false);
    setActiveView('admin');

    await loadCirculars();
  };

  // =========================================================
  // LOGOUT ADMIN
  // =========================================================

  const handleLogout = async () => {
    await supabase.auth.signOut();

    setAdminUser(null);
    setAdminEmail('');
    setAdminPassword('');
    setAdminLoginError('');

    if (activeView === 'admin') {
      setActiveView('letters');
    }

    await loadCirculars();
  };

  // =========================================================
  // BUKA ADMIN
  // =========================================================

  const handleRequestAdminMode = () => {
    if (adminUser) {
      setActiveView('admin');
    } else {
      setIsLoginModalOpen(true);
    }
  };

  // =========================================================
  // SLUG
  // =========================================================

  const createSlug = (title: string) => {
    const baseSlug = title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const finalBase =
      baseSlug || 'informasi-sekolah';

    return `${finalBase}-${Date.now()}`;
  };

  // =========================================================
  // CONVERT CIRCULAR → SUPABASE
  // =========================================================

  const circularToDatabasePayload = (
    circular: CircularLetter
  ) => ({
    nomor_surat: circular.nomorSurat || null,

    judul: circular.title,

    isi: circular.content || '',

    kategori:
      circular.category || 'Pengumuman',

    target_grade:
      circular.gradeLevels?.length > 0
        ? circular.gradeLevels
        : ['Semua Kelas'],

    tanggal:
      circular.publishDate ||
      new Date().toISOString().split('T')[0],

    effective_date:
      circular.effectiveDate || null,

    deadline_confirmation:
      circular.deadlineConfirmation || null,

    urgency:
      circular.urgency || 'normal',

    summary:
      circular.summary || '',

    action_required:
      circular.actionRequired || null,

    attachment_name:
      circular.attachmentName || null,

    attachment_size:
      circular.attachmentSize || null,

    attachment_type:
      circular.attachmentType || null,

    gdrive_link:
      circular.gdriveLink || null,

    signed_by:
      circular.signedBy || null,

    tembusan:
      circular.tembusan ?? [],

    whatsapp_broadcast_text:
      circular.whatsappBroadcastText || null,

    pinned:
      circular.isPinned ?? false,

    view_count:
      circular.viewCount ?? 0,
  });

  // =========================================================
  // TAMBAH INFORMASI → SUPABASE
  // =========================================================

  const handleAddCircular = async (
    newCircular: CircularLetter
  ) => {
    if (!adminUser) {
      alert(
        'Silakan login sebagai admin terlebih dahulu.'
      );
      return;
    }

    const payload = {
      ...circularToDatabasePayload(newCircular),

      slug: createSlug(newCircular.title),

      // Untuk versi sekarang semua informasi
      // yang dibuat admin langsung dipublikasikan.
      status: 'published',
    };

    const { data, error } = await supabase
      .from('informasi')
      .insert(payload)
      .select('*')
      .single();

    if (error) {
      console.error(
        'Gagal menambah informasi:',
        error
      );

      alert(
        `Informasi belum berhasil disimpan ke Supabase.\n\n${error.message}`
      );

      return;
    }

    const savedCircular =
      mapDatabaseRowToCircular(data);

    setCirculars((prev) => [
      savedCircular,
      ...prev.filter(
        (item) => item.id !== savedCircular.id
      ),
    ]);

    alert(
      'Informasi berhasil dipublikasikan.'
    );
  };

  // =========================================================
  // UPDATE INFORMASI → SUPABASE
  // =========================================================

  const handleUpdateCircular = async (
    updatedCircular: CircularLetter
  ) => {
    if (!adminUser) {
      alert(
        'Silakan login sebagai admin terlebih dahulu.'
      );
      return;
    }

    const payload =
      circularToDatabasePayload(updatedCircular);

    const { data, error } = await supabase
      .from('informasi')
      .update({
        ...payload,
        updated_at: new Date().toISOString(),
      })
      .eq('id', updatedCircular.id)
      .select('*')
      .single();

    if (error) {
      console.error(
        'Gagal memperbarui informasi:',
        error
      );

      alert(
        `Perubahan belum berhasil disimpan.\n\n${error.message}`
      );

      return;
    }

    const savedCircular =
      mapDatabaseRowToCircular(data);

    setCirculars((prev) =>
      prev.map((item) =>
        item.id === savedCircular.id
          ? savedCircular
          : item
      )
    );

    if (
      selectedCircular?.id ===
      savedCircular.id
    ) {
      setSelectedCircular(savedCircular);
    }

    alert(
      'Perubahan informasi berhasil disimpan.'
    );
  };

  // =========================================================
  // HAPUS INFORMASI → SUPABASE
  // =========================================================

  const handleDeleteCircular = async (
    id: string
  ) => {
    if (!adminUser) {
      alert(
        'Silakan login sebagai admin terlebih dahulu.'
      );
      return;
    }

    const { error } = await supabase
      .from('informasi')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(
        'Gagal menghapus informasi:',
        error
      );

      alert(
        `Informasi belum berhasil dihapus.\n\n${error.message}`
      );

      return;
    }

    setCirculars((prev) =>
      prev.filter((item) => item.id !== id)
    );

    if (selectedCircular?.id === id) {
      setSelectedCircular(null);
      setIsDetailOpen(false);
    }

    alert('Informasi berhasil dihapus.');
  };

  // =========================================================
  // GRADE OPTIONS
  // =========================================================

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

  // =========================================================
  // MODAL DETAIL
  // =========================================================

  const [
    selectedCircular,
    setSelectedCircular,
  ] = useState<CircularLetter | null>(null);

  const [
    isDetailOpen,
    setIsDetailOpen,
  ] = useState(false);

  // =========================================================
  // FILTER
  // =========================================================

  const [filter, setFilter] =
    useState<FilterState>({
      search: '',
      gradeLevel: 'Semua Kelas',
      category: '',
      month: '',
      onlyUrgent: false,
      onlyUnread: false,
    });

  // =========================================================
  // URL APP
  // =========================================================

  const appUrl =
    typeof window !== 'undefined'
      ? window.location.href
      : '';

  // =========================================================
  // GOOGLE SITES EMBED
  // =========================================================

  const [isEmbedded, setIsEmbedded] =
    useState(false);

  useEffect(() => {
    try {
      if (window.self !== window.top) {
        setIsEmbedded(true);
      }
    } catch {
      setIsEmbedded(true);
    }

    const params = new URLSearchParams(
      window.location.search
    );

    const letterId = params.get('letter');

    if (letterId) {
      const found = circulars.find(
        (circular) =>
          circular.id === letterId
      );

      if (found) {
        setSelectedCircular(found);
        setIsDetailOpen(true);
      }
    }
  }, [circulars]);

  // =========================================================
  // FILTERING CIRCULAR
  // =========================================================

  const filteredCirculars =
    circulars.filter((circ) => {
      if (filter.search) {
        const query =
          filter.search.toLowerCase();

        const matchTitle =
          (circ.title || '')
            .toLowerCase()
            .includes(query);

        const matchNomor =
          (circ.nomorSurat || '')
            .toLowerCase()
            .includes(query);

        const matchSummary =
          (circ.summary || '')
            .toLowerCase()
            .includes(query);

        if (
          !matchTitle &&
          !matchNomor &&
          !matchSummary
        ) {
          return false;
        }
      }

      if (
        filter.gradeLevel &&
        filter.gradeLevel !== 'Semua Kelas'
      ) {
        const hasGrade =
          circ.gradeLevels.includes(
            'Semua Kelas'
          ) ||
          circ.gradeLevels.includes(
            filter.gradeLevel
          );

        if (!hasGrade) {
          return false;
        }
      }

      return true;
    });

  // =========================================================
  // OPEN DETAIL
  // =========================================================

  const handleOpenDetail = (
    circular: CircularLetter
  ) => {
    setSelectedCircular(circular);
    setIsDetailOpen(true);
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans antialiased text-slate-900 selection:bg-amber-200">
      {/* HEADER */}
      <Header
        currentRole={
          adminUser ? 'admin' : 'parent'
        }
        adminUser={adminUser}
        onOpenLoginModal={() => {
          setAdminLoginError('');
          setIsLoginModalOpen(true);
        }}
        onLogout={() => {
          void handleLogout();
        }}
        activeView={activeView}
        onChangeView={(view) => {
          if (
            view === 'admin' &&
            !adminUser
          ) {
            setAdminLoginError('');
            setIsLoginModalOpen(true);
          } else {
            setActiveView(view);
          }
        }}
        isEmbedded={isEmbedded}
      />

      {/* MAIN */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* EMERGENCY */}
        <EmergencyBanner
          alerts={alerts}
          onOpenCircularDetail={(
            circularId
          ) => {
            const found = circulars.find(
              (circular) =>
                circular.id === circularId
            );

            if (found) {
              handleOpenDetail(found);
            }
          }}
        />

        {/* REMINDERS */}
        <ScheduledReminderBanner
          reminders={reminders}
        />

        {/* LETTERS */}
        {activeView === 'letters' && (
          <div className="space-y-6">
            <FilterBar
              filter={filter}
              onChangeFilter={(
                newFilter
              ) =>
                setFilter((prev) => ({
                  ...prev,
                  ...newFilter,
                }))
              }
              gradeOptions={gradeOptions}
            />

            {circularLoading ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
                <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-900 rounded-full animate-spin mx-auto mb-4" />

                <p className="text-sm font-semibold text-slate-700">
                  Memuat informasi sekolah...
                </p>
              </div>
            ) : filteredCirculars.length >
              0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredCirculars.map(
                  (circ) => (
                    <CircularCard
                      key={circ.id}
                      circular={circ}
                      onOpenDetail={
                        handleOpenDetail
                      }
                    />
                  )
                )}
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <BookOpen className="w-6 h-6" />
                </div>

                <h3 className="font-bold text-slate-900 text-base">
                  {circulars.length === 0
                    ? 'Belum Ada Surat Edaran'
                    : 'Tidak ada surat edaran yang sesuai'}
                </h3>

                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {circulars.length === 0
                    ? 'Surat edaran sekolah yang dipublikasikan akan tampil di sini.'
                    : 'Coba ubah kata kunci pencarian atau ganti pilihan filter jenjang kelas di atas.'}
                </p>

                {circulars.length === 0 ? (
                  <button
                    onClick={
                      handleRequestAdminMode
                    }
                    className="px-4 py-2 bg-blue-900 hover:bg-blue-950 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                  >
                    + Buat Surat Edaran Baru
                  </button>
                ) : (
                  <button
                    onClick={() =>
                      setFilter({
                        search: '',
                        gradeLevel:
                          'Semua Kelas',
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

        {/* CALENDAR */}
        {activeView === 'calendar' && (
          <SchoolCalendarView
            events={events}
            circulars={circulars}
            onOpenCircular={
              handleOpenDetail
            }
            calendarUrl={calendarUrl}
            onUpdateCalendarUrl={
              setCalendarUrl
            }
          />
        )}

        {/* ADMIN */}
        {activeView === 'admin' && (
          <>
            {adminAuthLoading ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 max-w-lg mx-auto my-8">
                <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-900 rounded-full animate-spin mx-auto mb-4" />

                <p className="text-sm font-semibold text-slate-700">
                  Memeriksa sesi admin...
                </p>
              </div>
            ) : adminUser ? (
              <AdminPanel
                circulars={circulars}
                alerts={alerts}
                events={events}
                reminders={reminders}
                calendarUrl={calendarUrl}
                onUpdateCalendarUrl={
                  setCalendarUrl
                }
                adminUser={adminUser}
                onLogout={() => {
                  void handleLogout();
                }}
                onAddCircular={(
                  newCirc
                ) => {
                  void handleAddCircular(
                    newCirc
                  );
                }}
                onUpdateCircular={(
                  updatedCirc
                ) => {
                  void handleUpdateCircular(
                    updatedCirc
                  );
                }}
                onDeleteCircular={(id) => {
                  void handleDeleteCircular(
                    id
                  );
                }}
                onUpdateAlerts={
                  setAlerts
                }
                onUpdateReminders={
                  setReminders
                }
                onAddEvent={(newEvent) =>
                  setEvents((prev) => [
                    newEvent,
                    ...prev,
                  ])
                }
                onDeleteEvent={(id) =>
                  setEvents((prev) =>
                    prev.filter(
                      (event) =>
                        event.id !== id
                    )
                  )
                }
                onOpenCircularDetail={
                  handleOpenDetail
                }
              />
            ) : (
              <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 max-w-lg mx-auto my-8 space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-900 flex items-center justify-center mx-auto border border-blue-200">
                  <Lock className="w-7 h-7 text-blue-900" />
                </div>

                <h3 className="font-extrabold text-lg text-slate-900">
                  Akses Terbatas: Khusus
                  Admin & Staf
                </h3>

                <p className="text-xs text-slate-500 leading-relaxed">
                  Halaman pengelolaan
                  informasi sekolah hanya dapat
                  diakses menggunakan akun admin
                  yang terdaftar.
                </p>

                <button
                  onClick={() => {
                    setAdminLoginError('');
                    setIsLoginModalOpen(
                      true
                    );
                  }}
                  className="px-6 py-2.5 bg-blue-900 hover:bg-blue-950 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Login Admin
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-5 text-slate-600 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <img
  src="/favicon.png"
  alt="Logo Lazuardi"
  className="w-8 h-8 object-contain"
/>

            <span className="text-slate-700 font-medium">
              <strong>
                SD Lazuardi
              </strong>{' '}
              — Pusat Informasi Surat
              Edaran Orang Tua
            </span>
          </div>

          <div className="text-slate-500 text-[11px]">
            Lazuardi Global Compassionate
            School
          </div>
        </div>
      </footer>

      {/* DETAIL MODAL */}
      <CircularDetailModal
        isOpen={isDetailOpen}
        onClose={() =>
          setIsDetailOpen(false)
        }
        circular={selectedCircular}
        appUrl={appUrl}
      />

      {/* =====================================================
          LOGIN ADMIN MODAL — SUPABASE EMAIL + PASSWORD
         ===================================================== */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
              <div>
                <h2 className="font-extrabold text-lg text-slate-900">
                  Login Admin
                </h2>

                <p className="text-xs text-slate-500 mt-1">
                  Pusat Informasi SD
                  Lazuardi
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (
                    !adminLoginLoading
                  ) {
                    setIsLoginModalOpen(
                      false
                    );

                    setAdminLoginError(
                      ''
                    );

                    setAdminPassword('');
                  }
                }}
                className="w-9 h-9 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleAdminLogin}
              className="p-6 space-y-5"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Email Admin
                </label>

                <input
                  type="email"
                  value={adminEmail}
                  onChange={(event) =>
                    setAdminEmail(
                      event.target.value
                    )
                  }
                  placeholder="admin@lazuardi.sch.id"
                  autoComplete="email"
                  disabled={
                    adminLoginLoading
                  }
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-blue-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Password
                </label>

                <input
                  type="password"
                  value={adminPassword}
                  onChange={(event) =>
                    setAdminPassword(
                      event.target.value
                    )
                  }
                  placeholder="Masukkan password"
                  autoComplete="current-password"
                  disabled={
                    adminLoginLoading
                  }
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-blue-900"
                />
              </div>

              {adminLoginError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">
                  {adminLoginError}
                </div>
              )}

              <button
                type="submit"
                disabled={
                  adminLoginLoading
                }
                className="w-full px-4 py-3 rounded-xl bg-blue-950 hover:bg-blue-900 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-bold transition-colors"
              >
                {adminLoginLoading
                  ? 'Memeriksa akun...'
                  : 'Masuk ke Admin'}
              </button>

              <p className="text-[11px] text-center text-slate-400 leading-relaxed">
                Hanya akun yang telah
                didaftarkan sebagai admin di
                sistem yang dapat masuk.
              </p>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
