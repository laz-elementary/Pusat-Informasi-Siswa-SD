import React, { useState, useEffect } from 'react';
import { 
  Plus, Edit, Trash2, Pin,
  FileText, ExternalLink, Eye, ShieldCheck,
  Bell, Clock, MapPin, Sparkles, Check, Calendar as CalendarIcon, Link as LinkIcon, RefreshCw
} from 'lucide-react';
import { CircularLetter, EmergencyAlert, SchoolEvent, GradeLevel, ScheduledReminder, RecurrenceType, AdminUser } from '../types';

interface AdminPanelProps {
  circulars: CircularLetter[];
  alerts: EmergencyAlert[];
  events: SchoolEvent[];
  reminders: ScheduledReminder[];
  onAddCircular: (newCirc: CircularLetter) => void;
  onUpdateCircular: (updatedCirc: CircularLetter) => void;
  onDeleteCircular: (id: string) => void;
  onUpdateAlerts: (updatedAlerts: EmergencyAlert[]) => void;
  onUpdateReminders: (updatedReminders: ScheduledReminder[]) => void;
  onAddEvent: (newEvent: SchoolEvent) => void;
  onDeleteEvent: (id: string) => void;
  onOpenCircularDetail: (circ: CircularLetter) => void;
  calendarUrl?: string;
  onUpdateCalendarUrl?: (url: string) => void;
  adminUser?: AdminUser | null;
  onLogout?: () => void;
}


const CIRCULAR_DRAFT_STORAGE_KEY = 'lazuardi_admin_circular_draft_v1';

interface CircularDraftSnapshot {
  isOpen: boolean;
  editingCircularId: string | null;
  title: string;
  nomor: string;
  grades: string[];
  publishDate: string;
  effectiveDate: string;
  gdriveLink: string;
  urgency: 'normal' | 'penting' | 'segera';
}

const readCircularDraft = (): CircularDraftSnapshot | null => {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(CIRCULAR_DRAFT_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CircularDraftSnapshot) : null;
  } catch {
    return null;
  }
};

export const AdminPanel: React.FC<AdminPanelProps> = ({
  circulars,
  alerts,
  events,
  reminders,
  onAddCircular,
  onUpdateCircular,
  onDeleteCircular,
  onUpdateAlerts,
  onUpdateReminders,
  onAddEvent,
  onDeleteEvent,
  onOpenCircularDetail,
  calendarUrl = 'https://calendar.google.com/calendar/embed?src=c_281c658374a1ec976b5e2339c5973e2ad2653a6fb84a37bbb408465908be3563%40group.calendar.google.com&ctz=Asia%2FJakarta',
  onUpdateCalendarUrl,
  adminUser,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<'surat' | 'reminders' | 'calendar'>('surat');
  const [inputCalUrl, setInputCalUrl] = useState(calendarUrl);
  const [calSavedSuccess, setCalSavedSuccess] = useState(false);

  useEffect(() => {
    setInputCalUrl(calendarUrl);
  }, [calendarUrl]);

  let activeCalendarId = 'c_281c658374a1ec976b5e2339c5973e2ad2653a6fb84a37bbb408465908be3563@group.calendar.google.com';
  try {
    const urlObj = new URL(inputCalUrl);
    const srcParam = urlObj.searchParams.get('src');
    if (srcParam) {
      activeCalendarId = decodeURIComponent(srcParam);
    }
  } catch {
    // fallback
  }

  // New Circular Form State
  // Draft form disimpan sementara agar tidak hilang jika iframe/halaman
  // ter-refresh saat admin berpindah tab browser.
  const [restoredCircularDraft] = useState<CircularDraftSnapshot | null>(() =>
    readCircularDraft()
  );

  const [showAddModal, setShowAddModal] = useState(
    () => restoredCircularDraft?.isOpen ?? false
  );

  const [editingCircular, setEditingCircular] = useState<CircularLetter | null>(null);

  // Form inputs - restore dari draft jika ada
  const [formTitle, setFormTitle] = useState(
    () => restoredCircularDraft?.title ?? ''
  );
  const [formNomor, setFormNomor] = useState(
    () => restoredCircularDraft?.nomor ?? ''
  );
  const [formGrades, setFormGrades] = useState<string[]>(
    () => restoredCircularDraft?.grades ?? ['Semua Kelas']
  );
  const [formPublishDate, setFormPublishDate] = useState(
    () =>
      restoredCircularDraft?.publishDate ??
      new Date().toISOString().split('T')[0]
  );
  const [formEffectiveDate, setFormEffectiveDate] = useState(
    () => restoredCircularDraft?.effectiveDate ?? ''
  );
  const [formGdriveLink, setFormGdriveLink] = useState(
    () => restoredCircularDraft?.gdriveLink ?? ''
  );
  const [formUrgency, setFormUrgency] = useState<
    'normal' | 'penting' | 'segera'
  >(() => restoredCircularDraft?.urgency ?? 'normal');

  // Jika draft yang dipulihkan adalah mode Edit, hubungkan kembali ke surat aslinya.
  useEffect(() => {
    const editingId = restoredCircularDraft?.editingCircularId;
    if (!editingId || editingCircular) return;

    const found = circulars.find((circ) => circ.id === editingId);
    if (found) {
      setEditingCircular(found);
    }
  }, [circulars, editingCircular, restoredCircularDraft]);

  // Autosave draft selama modal surat sedang terbuka.
  useEffect(() => {
    if (!showAddModal || typeof window === 'undefined') return;

    const snapshot: CircularDraftSnapshot = {
      isOpen: true,
      editingCircularId:
        editingCircular?.id ??
        restoredCircularDraft?.editingCircularId ??
        null,
      title: formTitle,
      nomor: formNomor,
      grades: formGrades,
      publishDate: formPublishDate,
      effectiveDate: formEffectiveDate,
      gdriveLink: formGdriveLink,
      urgency: formUrgency,
    };

    window.localStorage.setItem(
      CIRCULAR_DRAFT_STORAGE_KEY,
      JSON.stringify(snapshot)
    );
  }, [
    showAddModal,
    editingCircular,
    restoredCircularDraft,
    formTitle,
    formNomor,
    formGrades,
    formPublishDate,
    formEffectiveDate,
    formGdriveLink,
    formUrgency,
  ]);

  const clearCircularDraft = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(CIRCULAR_DRAFT_STORAGE_KEY);
    }
  };

  // Reminder Form & Management State
  const [reminderList, setReminderList] = useState<ScheduledReminder[]>(reminders);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [editingReminder, setEditingReminder] = useState<ScheduledReminder | null>(null);

  // Reminder Form inputs
  const [remTitle, setRemTitle] = useState('');
  const [remMessage, setRemMessage] = useState('');
  const [remRecurrence, setRemRecurrence] = useState<RecurrenceType>('weekly');
  const [remDaysOfWeek, setRemDaysOfWeek] = useState<number[]>([5]); // Default: 5 (Jumat)
  const [remDayOfMonth, setRemDayOfMonth] = useState<number>(1);
  const [remTimeInfo, setRemTimeInfo] = useState('');
  const [remTargetClass, setRemTargetClass] = useState('');
  const [remLocation, setRemLocation] = useState('');
  const [remPriority, setRemPriority] = useState<'normal' | 'penting' | 'khusus'>('penting');

  const DAYS = [
    { label: 'Senin', value: 1 },
    { label: 'Selasa', value: 2 },
    { label: 'Rabu', value: 3 },
    { label: 'Kamis', value: 4 },
    { label: 'Jumat', value: 5 },
    { label: 'Sabtu', value: 6 },
    { label: 'Minggu', value: 0 },
  ];

  const GRADE_OPTIONS: GradeLevel[] = [
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

  const resetReminderForm = () => {
    setEditingReminder(null);
    setRemTitle('');
    setRemMessage('');
    setRemRecurrence('weekly');
    setRemDaysOfWeek([5]);
    setRemDayOfMonth(1);
    setRemTimeInfo('');
    setRemTargetClass('Kelas 5 & 6');
    setRemLocation('Pos 3 (Gerbang Barat)');
    setRemPriority('penting');
  };

  const handleEditReminder = (rem: ScheduledReminder) => {
    setEditingReminder(rem);
    setRemTitle(rem.title);
    setRemMessage(rem.message);
    setRemRecurrence(rem.recurrence);
    setRemDaysOfWeek(rem.daysOfWeek || [5]);
    setRemDayOfMonth(rem.dayOfMonth || 1);
    setRemTimeInfo(rem.timeInfo || '');
    setRemTargetClass(rem.targetClass || '');
    setRemLocation(rem.locationInfo || '');
    setRemPriority(rem.priority);
    setShowReminderModal(true);
  };

  const handleSaveReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!remTitle.trim() || !remMessage.trim()) return;

    let updated: ScheduledReminder[];
    if (editingReminder) {
      updated = reminderList.map((item) =>
        item.id === editingReminder.id
          ? {
              ...item,
              title: remTitle,
              message: remMessage,
              recurrence: remRecurrence,
              daysOfWeek: remRecurrence === 'weekly' || remRecurrence === 'daily' ? remDaysOfWeek : undefined,
              dayOfMonth: remRecurrence === 'monthly' ? remDayOfMonth : undefined,
              timeInfo: remTimeInfo || undefined,
              targetClass: remTargetClass || undefined,
              locationInfo: remLocation || undefined,
              priority: remPriority,
            }
          : item
      );
    } else {
      const newRem: ScheduledReminder = {
        id: `rem-${Date.now()}`,
        title: remTitle,
        message: remMessage,
        recurrence: remRecurrence,
        daysOfWeek: remRecurrence === 'weekly' || remRecurrence === 'daily' ? remDaysOfWeek : undefined,
        dayOfMonth: remRecurrence === 'monthly' ? remDayOfMonth : undefined,
        timeInfo: remTimeInfo || undefined,
        targetClass: remTargetClass || undefined,
        locationInfo: remLocation || undefined,
        priority: remPriority,
        active: true,
        colorTheme: 'amber',
      };
      updated = [newRem, ...reminderList];
    }

    setReminderList(updated);
    onUpdateReminders(updated);
    setShowReminderModal(false);
    resetReminderForm();
  };

  const handleDeleteReminder = (id: string) => {
    if (confirm('Hapus pengingat rutin ini?')) {
      const updated = reminderList.filter((r) => r.id !== id);
      setReminderList(updated);
      onUpdateReminders(updated);
    }
  };

  const toggleDaySelection = (dayVal: number) => {
    if (remDaysOfWeek.includes(dayVal)) {
      setRemDaysOfWeek(remDaysOfWeek.filter((d) => d !== dayVal));
    } else {
      setRemDaysOfWeek([...remDaysOfWeek, dayVal]);
    }
  };

  const toggleGradeSelection = (g: string) => {
    if (g === 'Semua Kelas') {
      setFormGrades(['Semua Kelas']);
      return;
    }

    const withoutSemua = formGrades.filter((item) => item !== 'Semua Kelas');
    if (withoutSemua.includes(g)) {
      const next = withoutSemua.filter((item) => item !== g);
      setFormGrades(next.length === 0 ? ['Semua Kelas'] : next);
    } else {
      setFormGrades([...withoutSemua, g]);
    }
  };

  const resetForm = () => {
    setEditingCircular(null);
    setFormTitle('');
    setFormNomor(`0${Math.floor(Math.random() * 80 + 20)}/ED-SD/LAZ-JKT/VIII/2026`);
    setFormGrades(['Semua Kelas']);
    setFormPublishDate(new Date().toISOString().split('T')[0]);
    setFormEffectiveDate('');
    setFormGdriveLink('');
    setFormUrgency('normal');
  };

  const closeCircularModal = () => {
    setShowAddModal(false);
    clearCircularDraft();
    resetForm();
  };

  const handleEditClick = (circ: CircularLetter) => {
    clearCircularDraft();
    setEditingCircular(circ);
    setFormTitle(circ.title);
    setFormNomor(circ.nomorSurat);
    setFormGrades(circ.gradeLevels);
    setFormPublishDate(circ.publishDate);
    setFormEffectiveDate(circ.effectiveDate);
    setFormGdriveLink(circ.gdriveLink || '');
    setFormUrgency(circ.urgency);
    setShowAddModal(true);
  };

  const handleSaveCircular = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formNomor.trim()) return;

    if (editingCircular) {
      const updated: CircularLetter = {
        ...editingCircular,
        title: formTitle,
        nomorSurat: formNomor,
        gradeLevels: formGrades,
        publishDate: formPublishDate,
        effectiveDate: formEffectiveDate || 'Segera',
        gdriveLink: formGdriveLink || undefined,
        urgency: formUrgency,
        summary: editingCircular.summary || formTitle,
        content: editingCircular.content || `Surat Edaran resmi SD Lazuardi mengenai ${formTitle}. Informasi dan instruksi lengkap dapat diakses melalui dokumen Google Drive yang terlampir.`,
        signedBy: editingCircular.signedBy || 'Kepala Sekolah SD Lazuardi',
      };
      onUpdateCircular(updated);
    } else {
      const newCirc: CircularLetter = {
        id: `ed-${Date.now()}`,
        nomorSurat: formNomor,
        title: formTitle,
        gradeLevels: formGrades,
        publishDate: formPublishDate,
        effectiveDate: formEffectiveDate || 'Segera',
        gdriveLink: formGdriveLink || undefined,
        urgency: formUrgency,
        summary: formTitle,
        content: `Surat Edaran resmi SD Lazuardi mengenai ${formTitle}.\n\nSehubungan dengan agenda sekolah tersebut, seluruh orang tua/wali murid dimohon untuk memperhatikan dan mengikuti petunjuk teknis yang telah ditentukan. Dokumen lengkap, rincian jadwal, serta lampiran resmi dapat diakses dan diunduh melalui tautan Google Drive yang terlampir.\n\nDemikian surat edaran ini kami sampaikan. Atas perhatian, kerjasama, dan dukungan Bapak/Ibu sekalian kami ucapkan terima kasih.`,
        signedBy: 'Dra. Hj. Siti Nurjanah, M.Pd (Kepala Sekolah SD Lazuardi)',
        tembusan: ['Yayasan Lazuardi', 'Komite Sekolah', 'Wali Kelas'],
        isPinned: false,
        viewCount: 1,
      };
      onAddCircular(newCirc);
    }

    setShowAddModal(false);
    clearCircularDraft();
    resetForm();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Admin Panel */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-slate-800">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-400 text-slate-950 uppercase tracking-wide">
              Panel Pengelola Sekolah
            </span>
            {adminUser && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-blue-950 text-blue-200 border border-blue-800">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>Terautentikasi: <strong>{adminUser.email}</strong></span>
              </span>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-1">
            Pengelolaan Informasi & Surat Edaran
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mt-1 leading-relaxed">
            Kelola arsip surat edaran, tautan Google Drive, pengingat harian/mingguan (seperti pos penjemputan), serta integrasi Kalender Google.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 w-full md:w-auto">
          <button
            onClick={() => {
              clearCircularDraft();
              resetForm();
              setShowAddModal(true);
            }}
            className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Surat Edaran Baru</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-xl shadow-xs p-1.5 gap-1.5 overflow-x-auto">
        <button
          onClick={() => setActiveTab('surat')}
          className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'surat' ? 'bg-blue-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          Daftar Surat Edaran ({circulars.length})
        </button>
        <button
          onClick={() => setActiveTab('reminders')}
          className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'reminders' ? 'bg-blue-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Bell className="w-4 h-4 text-amber-400" />
          Pengingat Terjadwal / Rutin ({reminderList.length})
        </button>
        <button
          onClick={() => setActiveTab('calendar')}
          className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'calendar' ? 'bg-blue-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <CalendarIcon className="w-4 h-4 text-amber-400" />
          Integrasi Google Calendar
        </button>
      </div>

      {/* Tab Content: Pengingat Terjadwal (Recurring Reminders) */}
      {activeTab === 'reminders' && (
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-base text-slate-900">Kelola Pengingat Rutin & Terjadwal</h3>
              <p className="text-xs text-slate-500">
                Otomatis tampil di bagian atas portal orang tua sesuai hari pengulangan (misal: pengingat Jumat pulang lewat Pos 3).
              </p>
            </div>
            <button
              onClick={() => {
                resetReminderForm();
                setShowReminderModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-900 hover:bg-blue-950 text-white text-xs font-bold rounded-xl transition-colors shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Pengingat Baru</span>
            </button>
          </div>

          <div className="space-y-3">
            {reminderList.map((rem) => {
              const dayLabels = rem.daysOfWeek?.map((d) => DAYS.find((item) => item.value === d)?.label).filter(Boolean);
              return (
                <div
                  key={rem.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300 uppercase">
                        {rem.recurrence === 'weekly'
                          ? `Mingguan: Setiap ${dayLabels?.join(', ')}`
                          : rem.recurrence === 'daily'
                          ? 'Harian (Daily)'
                          : rem.recurrence === 'monthly'
                          ? `Bulanan: Tgl ${rem.dayOfMonth}`
                          : 'Selalu Tampil'}
                      </span>
                      {rem.targetClass && (
                        <span className="text-[11px] font-semibold text-slate-700 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                          {rem.targetClass}
                        </span>
                      )}
                      {rem.timeInfo && (
                        <span className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {rem.timeInfo}
                        </span>
                      )}
                    </div>

                    <h4 className="font-bold text-sm text-slate-900">{rem.title}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">{rem.message}</p>
                    {rem.locationInfo && (
                      <div className="text-[11px] text-amber-900 font-semibold flex items-center gap-1 pt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-amber-700" />
                        <span>Titik Lokasi: {rem.locationInfo}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                    <button
                      onClick={() => {
                        const updated = reminderList.map((item) =>
                          item.id === rem.id ? { ...item, active: !item.active } : item
                        );
                        setReminderList(updated);
                        onUpdateReminders(updated);
                      }}
                      className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 ${
                        rem.active
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {rem.active ? 'Aktif' : 'Non-aktif'}
                    </button>
                    <button
                      onClick={() => handleEditReminder(rem)}
                      className="p-1.5 text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-200"
                      title="Edit Pengingat"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteReminder(rem.id)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg border border-red-200"
                      title="Hapus Pengingat"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab Content: Surat Edaran */}
      {activeTab === 'surat' && (
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <h3 className="font-bold text-base text-slate-900">Daftar Seluruh Surat Edaran</h3>
            <span className="text-xs text-slate-500">
              Menampilkan {circulars.length} dokumen tersimpan
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-y border-slate-200">
                <tr>
                  <th className="py-3 px-3">Nomor & Tanggal</th>
                  <th className="py-3 px-3">Perihal / Judul Surat</th>
                  <th className="py-3 px-3">Peruntukan (Sasaran)</th>
                  <th className="py-3 px-3">Google Drive Link</th>
                  <th className="py-3 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {circulars.map((circ) => {
                  const peruntukanText = circ.gradeLevels?.includes('Semua Kelas')
                    ? 'Semua Kelas'
                    : circ.gradeLevels?.join(', ');

                  return (
                    <tr key={circ.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 align-top whitespace-nowrap">
                        <div className="font-mono font-bold text-blue-900">{circ.nomorSurat}</div>
                        <div className="text-[11px] text-slate-500">{circ.publishDate}</div>
                        {circ.isPinned && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200 font-medium mt-1">
                            <Pin className="w-2.5 h-2.5" /> Pinned
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 align-top max-w-xs sm:max-w-md">
                        <div className="font-bold text-slate-900 hover:text-blue-700 cursor-pointer" onClick={() => onOpenCircularDetail(circ)}>
                          {circ.title}
                        </div>
                        <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{circ.summary}</div>
                      </td>
                      <td className="py-3 px-3 align-top whitespace-nowrap">
                        <span className="inline-block bg-slate-100 text-slate-800 px-2 py-0.5 rounded font-medium text-[11px]">
                          {peruntukanText}
                        </span>
                      </td>
                      <td className="py-3 px-3 align-top">
                        {circ.gdriveLink ? (
                          <a
                            href={circ.gdriveLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-emerald-700 hover:underline font-semibold"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Link GDrive</span>
                          </a>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-3 align-top text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onOpenCircularDetail(circ)}
                            title="Lihat Pratinjau Surat"
                            className="p-1.5 text-blue-700 hover:bg-blue-50 rounded-lg border border-blue-200 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleEditClick(circ)}
                            title="Edit Surat"
                            className="p-1.5 text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-200 cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Hapus surat edaran "${circ.title}"?`)) {
                                onDeleteCircular(circ.id);
                              }
                            }}
                            title="Hapus Surat"
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg border border-red-200 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Content: Integrasi Google Calendar */}
      {activeTab === 'calendar' && (
        <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold text-base text-slate-950 flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-blue-900" />
                Integrasi Kalender Akademik Google
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Pengaturan tautan embed dan sinkronisasi Google Calendar resmi SD Lazuardi.
              </p>
            </div>
            <a
              href="https://calendar.google.com/calendar"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors shrink-0"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Buka Google Calendar
            </a>
          </div>

          <div className="space-y-4 max-w-3xl">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                URL Google Calendar Embed (iFrame) *
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="url"
                  value={inputCalUrl}
                  onChange={(e) => setInputCalUrl(e.target.value)}
                  placeholder="https://calendar.google.com/calendar/embed?src=..."
                  className="flex-1 text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 font-mono focus:outline-none focus:border-blue-700 focus:bg-white"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (onUpdateCalendarUrl) {
                      onUpdateCalendarUrl(inputCalUrl);
                      setCalSavedSuccess(true);
                      setTimeout(() => setCalSavedSuccess(false), 3000);
                    }
                  }}
                  className="px-5 py-2.5 bg-blue-900 hover:bg-blue-950 text-white font-bold text-xs rounded-xl shadow-xs transition-colors shrink-0 flex items-center justify-center gap-1.5"
                >
                  {calSavedSuccess ? <Check className="w-4 h-4 text-amber-400" /> : <RefreshCw className="w-4 h-4" />}
                  <span>{calSavedSuccess ? 'Tersimpan!' : 'Simpan Perubahan'}</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5">
                Tautan ini didapat dari menu <em>Google Calendar Settings → Integrate Calendar → Embed code / Public URL</em>.
              </p>
            </div>

            {/* Information Card */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2 text-xs text-slate-700">
              <div className="font-bold text-slate-900">ID Kalender yang Terhubung:</div>
              <div className="font-mono bg-white p-2 rounded-lg border border-slate-200 text-[11px] select-all break-all text-blue-950 font-bold">
                {activeCalendarId}
              </div>
              <div className="text-[11px] text-slate-500 leading-relaxed pt-1">
                ✓ Kalender ini telah diatur ke zona waktu <strong>Asia/Jakarta (WIB)</strong>.<br />
                ✓ Setiap jadwal yang ditambahkan di Google Calendar SD Lazuardi akan otomatis muncul di portal orang tua tanpa perlu memuat ulang data.
              </div>
            </div>

            {/* Live Preview Box */}
            <div className="pt-2">
              <div className="text-xs font-bold text-slate-800 mb-2">Pratinjau Tampilan Kalender:</div>
              <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50 h-[450px]">
                <iframe
                  src={inputCalUrl}
                  title="Pratinjau Kalender"
                  className="w-full h-full border-0"
                  frameBorder="0"
                />
              </div>
            </div>
          </div>
        </div>
      )}
      {showReminderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full my-auto flex flex-col overflow-hidden border border-slate-200">
            <div className="bg-blue-900 text-white p-4 px-6 flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm">
                <Bell className="w-4 h-4 text-amber-400" />
                <span>{editingReminder ? 'Edit Pengingat Rutin' : 'Buat Pengingat Terjadwal / Rutin'}</span>
              </div>
              <button
                onClick={() => setShowReminderModal(false)}
                className="text-blue-200 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveReminder} className="p-6 space-y-4 text-xs sm:text-sm text-slate-800">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Judul Pengingat *
                </label>
                <input
                  type="text"
                  required
                  value={remTitle}
                  onChange={(e) => setRemTitle(e.target.value)}
                  placeholder="Contoh: Kepulangan Siswa Hari Jumat: Kelas 5 & 6 Melalui Pos 3"
                  className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pola Pengulangan (Recurrence) *
                </label>
                <select
                  value={remRecurrence}
                  onChange={(e) => setRemRecurrence(e.target.value as RecurrenceType)}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900"
                >
                  <option value="weekly">Mingguan (Weekly - Pilih Hari Tertentu, misal: Setiap Jumat)</option>
                  <option value="daily">Harian (Daily - Setiap Hari Sekolah)</option>
                  <option value="monthly">Bulanan (Monthly - Pada Tanggal Tertentu)</option>
                  <option value="always">Selalu Tampil (Always On)</option>
                </select>
              </div>

              {/* Day selector for weekly recurrence */}
              {remRecurrence === 'weekly' && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Pilih Hari Munculnya Pengingat:
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {DAYS.map((d) => (
                      <button
                        type="button"
                        key={d.value}
                        onClick={() => toggleDaySelection(d.value)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                          remDaysOfWeek.includes(d.value)
                            ? 'bg-blue-900 text-white shadow-xs'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Day of month for monthly */}
              {remRecurrence === 'monthly' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Muncul Setiap Tanggal: (1 - 31)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={remDayOfMonth}
                    onChange={(e) => setRemDayOfMonth(Number(e.target.value))}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Sasaran Siswa / Kelas
                  </label>
                  <input
                    type="text"
                    value={remTargetClass}
                    onChange={(e) => setRemTargetClass(e.target.value)}
                    placeholder="Contoh: Kelas 5 & 6"
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Titik Lokasi / Pos Jemput
                  </label>
                  <input
                    type="text"
                    value={remLocation}
                    onChange={(e) => setRemLocation(e.target.value)}
                    placeholder="Contoh: Pos 3 (Gerbang Barat)"
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Waktu / Jam Penjemputan
                </label>
                <input
                  type="text"
                  value={remTimeInfo}
                  onChange={(e) => setRemTimeInfo(e.target.value)}
                  placeholder="Contoh: 13.15 WIB (Setelah Sholat Jumat)"
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pesan Lengkap Pengingat *
                </label>
                <textarea
                  rows={3}
                  required
                  value={remMessage}
                  onChange={(e) => setRemMessage(e.target.value)}
                  placeholder="Ketik keterangan pengingat untuk orang tua..."
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowReminderModal(false)}
                  className="px-4 py-2 bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-900 hover:bg-blue-950 text-white rounded-xl text-xs font-bold shadow-md"
                >
                  {editingReminder ? 'Simpan Perubahan' : 'Terbitkan Pengingat'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Circular Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full my-auto max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
            <div className="bg-blue-900 text-white p-4 px-6 flex items-center justify-between">
              <h3 className="font-bold text-base">
                {editingCircular ? 'Edit Surat Edaran' : 'Buat Surat Edaran Baru'}
              </h3>
              <button
                onClick={closeCircularModal}
                className="text-blue-200 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCircular} className="p-6 overflow-y-auto space-y-4 flex-1 text-xs sm:text-sm text-slate-800">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nomor Surat *</label>
                  <input
                    type="text"
                    required
                    value={formNomor}
                    onChange={(e) => setFormNomor(e.target.value)}
                    className="w-full text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Terbit</label>
                  <input
                    type="date"
                    value={formPublishDate}
                    onChange={(e) => setFormPublishDate(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Judul / Perihal Surat *</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Contoh: Pelaksanaan 3-Way Conference (3WC) & Laporan Belajar Siswa"
                  className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 font-semibold"
                />
              </div>

              {/* Peruntukan Kelas / Jenjang Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Peruntukan Surat (Sasaran Kelas / Fase) *
                </label>
                <div className="flex flex-wrap gap-1.5 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  {GRADE_OPTIONS.map((g) => {
                    const isSelected = formGrades.includes(g);
                    return (
                      <button
                        type="button"
                        key={g}
                        onClick={() => toggleGradeSelection(g)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                          isSelected
                            ? 'bg-blue-900 text-white shadow-xs'
                            : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        {g}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Pilih "Semua Kelas" untuk umum, atau klik kelas/fase spesifik (misal: Kelas 3, Kelas 4, Fase B).
                </p>
              </div>

              {/* Google Drive Link Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Link Dokumen Google Drive (Opsional)
                </label>
                <input
                  type="url"
                  value={formGdriveLink}
                  onChange={(e) => setFormGdriveLink(e.target.value)}
                  placeholder="https://drive.google.com/file/d/... atau https://drive.google.com/drive/folders/..."
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900"
                />
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Orang tua dapat langsung mengklik "Google Drive" di kartu surat untuk melihat file asli.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Masa Pelaksanaan / Waktu</label>
                <input
                  type="text"
                  value={formEffectiveDate}
                  onChange={(e) => setFormEffectiveDate(e.target.value)}
                  placeholder="Contoh: 28 - 29 Agustus 2026"
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={closeCircularModal}
                  className="px-4 py-2 bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-900 hover:bg-blue-950 text-white rounded-xl text-xs font-bold shadow-md"
                >
                  {editingCircular ? 'Simpan Perubahan' : 'Publikasikan Surat'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
