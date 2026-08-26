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
} from './data/initialData';

import { BookOpen, Lock, X, FileText, Megaphone, Pin, CalendarDays, ExternalLink, Newspaper } from 'lucide-react';

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
    tipeKonten: (row.tipe_konten ?? 'surat') as CircularLetter['tipeKonten'],
    category: row.kategori ?? 'Pengumuman',
    gradeLevels: normalizeGradeLevels(row.target_grade),
    publishDate: row.tanggal ?? '',
    effectiveDate: row.effective_date ?? '',
    deadlineConfirmation: row.deadline_confirmation ?? undefined,

    urgency: (row.urgency ?? 'normal') as CircularLetter['urgency'],

    summary: row.summary ?? '',
    content: row.isi ?? '',

    imageUrl: row.image_url ?? undefined,

    mediaItems: Array.isArray(row.media_items)
      ? row.media_items
      : [],

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
  // REMINDERS — SUPABASE
  // =========================================================

  const [reminders, setReminders] = useState<ScheduledReminder[]>([]);
  const [remindersLoading, setRemindersLoading] = useState(true);

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

    const loadedReminders: ScheduledReminder[] = (data ?? []).map(
      (row) => row.payload as ScheduledReminder
    );

    setReminders(loadedReminders);
    setRemindersLoading(false);
  };

  const migrateLocalRemindersToSupabase = async () => {
    const saved = localStorage.getItem('lazuardi_clean_reminders');

    if (!saved) return;

    let localReminders: ScheduledReminder[] = [];

    try {
      localReminders = JSON.parse(saved);
    } catch {
      console.error('Data reminder lama di localStorage tidak valid.');
      return;
    }

    if (localReminders.length === 0) {
      localStorage.removeItem('lazuardi_clean_reminders');
      return;
    }

    const { data: existing, error: existingError } = await supabase
      .from('reminders')
      .select('id')
      .limit(1);

    if (existingError) {
      console.error(
        'Gagal mengecek reminder Supabase sebelum migrasi:',
        existingError
      );
      return;
    }

    // Jika Supabase sudah memiliki reminder, jangan menimpa data yang ada.
    if (existing && existing.length > 0) {
      return;
    }

    const rows = localReminders.map((reminder) => ({
      id: reminder.id,
      payload: reminder,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from('reminders')
      .upsert(rows, {
        onConflict: 'id',
      });

    if (error) {
      console.error('Migrasi reminder gagal:', error);
      return;
    }

    localStorage.removeItem('lazuardi_clean_reminders');

    console.log(
      'Reminder lama berhasil dipindahkan ke Supabase.'
    );
  };

  useEffect(() => {
    void loadReminders();
  }, []);

  // =========================================================
  // REALTIME SUPABASE
  // =========================================================
  //
  // Setiap ada INSERT / UPDATE / DELETE pada tabel informasi
  // atau reminders, portal yang sedang terbuka akan mengambil
  // data terbaru tanpa perlu refresh manual.
  //
  // Selain realtime, saat user kembali ke tab/browser ini,
  // data juga diperiksa ulang sebagai fallback.

  useEffect(() => {
    let refreshTimer: number | undefined;

    const refreshPortalData = () => {
      if (refreshTimer) {
        window.clearTimeout(refreshTimer);
      }

      // Debounce singkat untuk menghindari reload berkali-kali
      // bila beberapa perubahan terjadi hampir bersamaan.
      refreshTimer = window.setTimeout(() => {
        void loadCirculars();
        void loadReminders();
      }, 250);
    };

    const realtimeChannel = supabase
      .channel('lazuardi-parent-portal-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'informasi',
        },
        () => {
          refreshPortalData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reminders',
        },
        () => {
          refreshPortalData();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(
            'Realtime Pusat Informasi SD Lazuardi aktif.'
          );
        }

        if (
          status === 'CHANNEL_ERROR' ||
          status === 'TIMED_OUT'
        ) {
          console.warn(
            'Realtime mengalami gangguan. Data tetap akan diperiksa saat tab kembali aktif.'
          );
        }
      });

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshPortalData();
      }
    };

    const handleWindowFocus = () => {
      refreshPortalData();
    };

    document.addEventListener(
      'visibilitychange',
      handleVisibilityChange
    );

    window.addEventListener(
      'focus',
      handleWindowFocus
    );

    return () => {
      if (refreshTimer) {
        window.clearTimeout(refreshTimer);
      }

      document.removeEventListener(
        'visibilitychange',
        handleVisibilityChange
      );

      window.removeEventListener(
        'focus',
        handleWindowFocus
      );

      void supabase.removeChannel(realtimeChannel);
    };
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

  // Sub-menu portal orang tua: surat resmi vs info singkat
  const [parentContentView, setParentContentView] = useState<
    'surat' | 'info' | 'elementary_update'
  >('surat');

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

    // Admin boleh melihat semua informasi sesuai RLS.
    await loadCirculars();

    // Migrasikan reminder lama dari browser admin hanya jika
    // tabel Supabase masih kosong, lalu muat reminder terbaru.
    await migrateLocalRemindersToSupabase();
    await loadReminders();
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

    await migrateLocalRemindersToSupabase();
    await loadCirculars();
    await loadReminders();
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
    await loadReminders();
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

    tipe_konten: circular.tipeKonten ?? 'surat',

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

    image_url:
      circular.imageUrl || null,

    media_items:
      circular.mediaItems ?? [],

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
      return false;
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

      return false;
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

    return true;
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
      return false;
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

      return false;
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

    return true;
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

  const handleUpdateReminders = async (
  nextReminders: ScheduledReminder[]
) => {
  if (!adminUser) {
    alert(
      'Silakan login sebagai admin terlebih dahulu.'
    );
    return;
  }

  const currentIds = reminders.map(
    (reminder) => reminder.id
  );

  const nextIds = nextReminders.map(
    (reminder) => reminder.id
  );

  // =====================================================
  // TAMBAH / UPDATE
  // =====================================================

  if (nextReminders.length > 0) {
    const rows = nextReminders.map(
      (reminder) => ({
        id: reminder.id,
        payload: reminder,
        updated_at: new Date().toISOString(),
      })
    );

    const { error: upsertError } =
      await supabase
        .from('reminders')
        .upsert(rows, {
          onConflict: 'id',
        });

    if (upsertError) {
      console.error(
        'Gagal menyimpan reminder:',
        upsertError
      );

      alert(
        `Reminder belum berhasil disimpan.\n\n${upsertError.message}`
      );

      return;
    }
  }

  // =====================================================
  // HAPUS DATA YANG SUDAH DIHAPUS DARI ADMIN
  // =====================================================

  const deletedIds = currentIds.filter(
    (id) => !nextIds.includes(id)
  );

  if (deletedIds.length > 0) {
    const { error: deleteError } =
      await supabase
        .from('reminders')
        .delete()
        .in('id', deletedIds);

    if (deleteError) {
      console.error(
        'Gagal menghapus reminder:',
        deleteError
      );

      alert(
        `Reminder belum berhasil dihapus.\n\n${deleteError.message}`
      );

      return;
    }
  }

  setReminders(nextReminders);
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
  // FILTERING CONTENT
  // =========================================================

  const matchesPortalFilter = (circ: CircularLetter) => {
    if (filter.search) {
      const query = filter.search.toLowerCase();

      const matchTitle = (circ.title || '')
        .toLowerCase()
        .includes(query);

      const matchNomor = (circ.nomorSurat || '')
        .toLowerCase()
        .includes(query);

      const matchSummary = (circ.summary || '')
        .toLowerCase()
        .includes(query);

      const matchContent = (circ.content || '')
        .toLowerCase()
        .includes(query);

      if (
        !matchTitle &&
        !matchNomor &&
        !matchSummary &&
        !matchContent
      ) {
        return false;
      }
    }

    if (
      filter.gradeLevel &&
      filter.gradeLevel !== 'Semua Kelas'
    ) {
      const hasGrade =
        circ.gradeLevels.includes('Semua Kelas') ||
        circ.gradeLevels.includes(filter.gradeLevel);

      if (!hasGrade) {
        return false;
      }
    }

    return true;
  };

  const suratCirculars = circulars.filter(
    (circ) => (circ.tipeKonten ?? 'surat') === 'surat'
  );

  const infoCirculars = circulars.filter(
    (circ) => circ.tipeKonten === 'info'
  );

  // Info Terkini yang di-pin:
  // tampilkan yang paling baru sebagai pengumuman kecil di bawah header.
  const pinnedInfoCirculars = infoCirculars
    .filter((circ) => circ.isPinned)
    .sort((a, b) =>
      (b.publishDate || '').localeCompare(
        a.publishDate || ''
      )
    );

  const headerPinnedInfos =
    pinnedInfoCirculars.slice(0, 3);

  const elementaryUpdateCirculars = circulars.filter(
    (circ) => circ.tipeKonten === 'elementary_update'
  );

  const filteredSuratCirculars = suratCirculars.filter(
    matchesPortalFilter
  );

  const filteredInfoCirculars = infoCirculars.filter(
    matchesPortalFilter
  );

  const filteredElementaryUpdateCirculars =
    elementaryUpdateCirculars.filter(matchesPortalFilter);

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

      {/* PINNED INFO TERKINI — MAKSIMAL 3 */}
      {headerPinnedInfos.length > 0 &&
        activeView !== 'admin' && (
          <div className="w-full bg-amber-50 border-b border-amber-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2">
              <div className="flex flex-col lg:flex-row lg:items-center gap-2">
                <div className="shrink-0">
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 text-slate-950 px-2 py-0.5 text-[10px] sm:text-xs font-extrabold">
                    <Pin className="w-3 h-3" />
                    Info Penting
                  </span>
                </div>

                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-1.5">
                  {headerPinnedInfos.map(
                    (info, index) => (
                      <button
                        key={info.id}
                        type="button"
                        onClick={() => {
                          setActiveView(
                            'letters'
                          );
                          setParentContentView(
                            'info'
                          );
                          handleOpenDetail(
                            info
                          );
                        }}
                        className="min-w-0 flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left hover:bg-amber-100 transition-colors group"
                      >
                        <span className="shrink-0 w-5 h-5 rounded-full bg-white border border-amber-200 flex items-center justify-center text-[10px] font-extrabold text-amber-800">
                          {index + 1}
                        </span>

                        <span className="min-w-0 flex-1 truncate text-xs sm:text-sm font-semibold text-slate-800 group-hover:text-blue-950">
                          {info.title}
                        </span>

                        <span className="shrink-0 text-[10px] font-bold text-blue-900">
                          Lihat →
                        </span>
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

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

        {/* PORTAL INFORMASI ORANG TUA */}
        {activeView === 'letters' && (
          <div className="space-y-5">
            {/* Sub menu: Surat Edaran / Info Terkini */}
            <div className="bg-white border border-slate-200 rounded-2xl p-1.5 shadow-xs flex gap-1.5 overflow-x-auto">
              <button
                type="button"
                onClick={() => setParentContentView('surat')}
                className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  parentContentView === 'surat'
                    ? 'bg-blue-950 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Surat Edaran</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                    parentContentView === 'surat'
                      ? 'bg-white/15 text-white'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {suratCirculars.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setParentContentView('info')}
                className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  parentContentView === 'info'
                    ? 'bg-amber-400 text-slate-950 shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Megaphone className="w-4 h-4" />
                <span>Info Terkini</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                    parentContentView === 'info'
                      ? 'bg-slate-950/10 text-slate-800'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {infoCirculars.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setParentContentView('elementary_update')}
                className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  parentContentView === 'elementary_update'
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Newspaper className="w-4 h-4" />
                <span>Elementary Updates</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                    parentContentView === 'elementary_update'
                      ? 'bg-white/15 text-white'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {elementaryUpdateCirculars.length}
                </span>
              </button>
            </div>

            <FilterBar
              filter={filter}
              onChangeFilter={(newFilter) =>
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
            ) : parentContentView === 'surat' ? (
              <>
                {filteredSuratCirculars.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredSuratCirculars.map((circ) => (
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
                      {suratCirculars.length === 0
                        ? 'Belum Ada Surat Edaran'
                        : 'Tidak ada surat edaran yang sesuai'}
                    </h3>

                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      {suratCirculars.length === 0
                        ? 'Surat edaran resmi sekolah yang dipublikasikan akan tampil di sini.'
                        : 'Coba ubah kata kunci pencarian atau pilihan jenjang kelas.'}
                    </p>

                    {suratCirculars.length === 0 && adminUser && (
                      <button
                        onClick={handleRequestAdminMode}
                        className="px-4 py-2 bg-blue-900 hover:bg-blue-950 text-white rounded-xl text-xs font-semibold transition-colors"
                      >
                        + Buat Surat Edaran Baru
                      </button>
                    )}
                  </div>
                )}
              </>
            ) : parentContentView === 'info' ? (
              <>
                {filteredInfoCirculars.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredInfoCirculars.map((info) => {
                      const peruntukan =
                        info.gradeLevels?.includes('Semua Kelas')
                          ? 'Semua Kelas'
                          : info.gradeLevels?.join(', ');

                      return (
                        <article
                          key={info.id}
                          className={`bg-white rounded-2xl border shadow-xs overflow-hidden ${
                            info.isPinned
                              ? 'border-amber-300'
                              : 'border-slate-200'
                          }`}
                        >
                          {info.imageUrl && (
                            <a
                              href={info.imageUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block bg-slate-50 border-b border-slate-200"
                              title="Buka flyer ukuran penuh"
                            >
                              <img
                                src={info.imageUrl}
                                alt={`Flyer ${info.title}`}
                                loading="lazy"
                                className="w-full max-h-[620px] object-contain bg-slate-50"
                              />
                            </a>
                          )}

                          <div className="p-5">
                            <div className="flex items-start justify-between gap-4">
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2 mb-3">
                                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 border border-amber-200 text-amber-900 px-2.5 py-1 text-[10px] sm:text-xs font-extrabold uppercase tracking-wide">
                                    <Megaphone className="w-3.5 h-3.5" />
                                    Info Terkini
                                  </span>

                                  {info.isPinned && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 text-blue-900 px-2.5 py-1 text-[10px] font-bold">
                                      <Pin className="w-3 h-3" />
                                      Penting
                                    </span>
                                  )}
                                </div>

                                <h3 className="font-extrabold text-base sm:text-lg text-slate-950 leading-snug">
                                  {info.title}
                                </h3>

                                {(info.summary || info.content) && (
                                  <p className="mt-2 text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                                    {info.summary || info.content}
                                  </p>
                                )}
                              </div>

                              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center justify-center shrink-0">
                                <Megaphone className="w-5 h-5" />
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-4 pt-3 border-t border-slate-100 text-[11px] sm:text-xs text-slate-500">
                              <span className="inline-flex items-center gap-1.5">
                                <CalendarDays className="w-3.5 h-3.5 text-blue-900" />
                                {info.publishDate}
                              </span>

                              {peruntukan && (
                                <span className="font-semibold text-slate-600">
                                  {peruntukan}
                                </span>
                              )}

                              {info.gdriveLink && (
                                <a
                                  href={info.gdriveLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 font-bold text-blue-800 hover:underline"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                  Buka Tautan
                                </a>
                              )}
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-3">
                    <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                      <Megaphone className="w-6 h-6" />
                    </div>

                    <h3 className="font-bold text-slate-900 text-base">
                      {infoCirculars.length === 0
                        ? 'Belum Ada Info Terkini'
                        : 'Tidak ada informasi yang sesuai'}
                    </h3>

                    <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                      {infoCirculars.length === 0
                        ? 'Pengumuman singkat, reminder khusus, dan informasi terbaru untuk orang tua akan tampil di bagian ini.'
                        : 'Coba ubah kata kunci pencarian atau pilihan jenjang kelas.'}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <>
                {filteredElementaryUpdateCirculars.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {filteredElementaryUpdateCirculars.map((update) => {
                      const peruntukan =
                        update.gradeLevels?.includes('Semua Kelas')
                          ? 'Elementary'
                          : update.gradeLevels?.join(', ');

                      return (
                        <article
                          key={update.id}
                          className="group bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden hover:shadow-md transition-shadow"
                        >
                          <div className="h-2 bg-emerald-600" />

                          {update.mediaItems &&
                            update.mediaItems.length > 0 && (
                              <div
                                className={`grid gap-1 bg-slate-100 ${
                                  update.mediaItems.length === 1
                                    ? 'grid-cols-1'
                                    : 'grid-cols-2'
                                }`}
                              >
                                {update.mediaItems
                                  .slice(0, 4)
                                  .map((media, index) => (
                                    <div
                                      key={`${media.url}-${index}`}
                                      className={`relative bg-slate-100 overflow-hidden ${
                                        update.mediaItems!.length === 3 &&
                                        index === 0
                                          ? 'col-span-2'
                                          : ''
                                      }`}
                                    >
                                      {media.type === 'video' ? (
                                        <video
                                          src={media.url}
                                          controls
                                          preload="metadata"
                                          playsInline
                                          className="w-full h-full min-h-[220px] max-h-[460px] object-contain bg-black"
                                        />
                                      ) : (
                                        <a
                                          href={media.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="block"
                                        >
                                          <img
                                            src={media.url}
                                            alt={
                                              media.name ||
                                              `Foto ${update.title}`
                                            }
                                            loading="lazy"
                                            className="w-full h-full min-h-[220px] max-h-[460px] object-cover"
                                          />
                                        </a>
                                      )}

                                      {index === 3 &&
                                        update.mediaItems!.length > 4 && (
                                          <div className="absolute inset-0 bg-slate-950/65 text-white flex items-center justify-center text-lg font-extrabold pointer-events-none">
                                            +
                                            {update.mediaItems!.length -
                                              4}{' '}
                                            media
                                          </div>
                                        )}
                                    </div>
                                  ))}
                              </div>
                            )}

                          <div className="p-5 sm:p-6">
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 px-2.5 py-1 text-[10px] sm:text-xs font-extrabold uppercase tracking-wide">
                                <Newspaper className="w-3.5 h-3.5" />
                                Elementary Updates
                              </span>

                              <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-500">
                                <CalendarDays className="w-3.5 h-3.5" />
                                {update.publishDate}
                              </span>

                              {peruntukan && (
                                <span className="text-[11px] font-semibold text-slate-600">
                                  {peruntukan}
                                </span>
                              )}
                            </div>

                            <h3 className="font-extrabold text-lg sm:text-xl text-slate-950 leading-snug group-hover:text-emerald-800 transition-colors">
                              {update.title}
                            </h3>

                            {(update.summary || update.content) && (
                              <p className="mt-2.5 text-sm text-slate-600 leading-relaxed whitespace-pre-line line-clamp-5">
                                {update.summary || update.content}
                              </p>
                            )}

                            <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-3">
                              <button
                                type="button"
                                onClick={() => handleOpenDetail(update)}
                                className="text-xs font-extrabold text-emerald-800 hover:text-emerald-950"
                              >
                                Baca Selengkapnya →
                              </button>

                              {update.gdriveLink && (
                                <a
                                  href={update.gdriveLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-xs font-bold text-blue-800 hover:underline"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                  Tautan
                                </a>
                              )}
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                      <Newspaper className="w-6 h-6" />
                    </div>

                    <h3 className="font-bold text-slate-900 text-base">
                      {elementaryUpdateCirculars.length === 0
                        ? 'Belum Ada Elementary Updates'
                        : 'Tidak ada update yang sesuai'}
                    </h3>

                    <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                      {elementaryUpdateCirculars.length === 0
                        ? 'Highlight kegiatan, project, prestasi, dan cerita terbaru dari Elementary akan tampil di sini.'
                        : 'Coba ubah kata kunci pencarian atau pilihan jenjang kelas.'}
                    </p>
                  </div>
                )}
              </>
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
                onAddCircular={
                  handleAddCircular
                }
                onUpdateCircular={
                  handleUpdateCircular
                }
                onDeleteCircular={(id) => {
                  void handleDeleteCircular(
                    id
                  );
                }}
                onUpdateAlerts={
                  setAlerts
                }
                onUpdateReminders={(nextReminders) => {
                  void handleUpdateReminders(nextReminders);
                }}
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
