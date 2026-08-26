import React, { useState, useEffect } from 'react';
import { supabase } from '../src/lib/supabase';
import { 
  Plus, Edit, Trash2, Pin,
  FileText, ExternalLink, Eye, ShieldCheck,
  Bell, Clock, MapPin, Sparkles, Check, Calendar as CalendarIcon, Link as LinkIcon, RefreshCw, Megaphone, Newspaper, Upload, Image as ImageIcon, Loader2, Film, Images, XCircle, Users, BarChart3, Globe2, TrendingUp
} from 'lucide-react';
import { CircularLetter, EmergencyAlert, SchoolEvent, GradeLevel, ScheduledReminder, RecurrenceType, AdminUser } from '../types';

interface AdminPanelProps {
  circulars: CircularLetter[];
  alerts: EmergencyAlert[];
  events: SchoolEvent[];
  reminders: ScheduledReminder[];
  onAddCircular: (
    newCirc: CircularLetter
  ) => Promise<boolean>;
  onUpdateCircular: (
    updatedCirc: CircularLetter
  ) => Promise<boolean>;
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
  content: string;
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


const INFO_DRAFT_STORAGE_KEY = 'lazuardi_admin_info_draft_v1';

interface InfoDraftSnapshot {
  isOpen: boolean;
  editingInfoId: string | null;
  title: string;
  content: string;
  grades: string[];
  publishDate: string;
  link: string;
  isPinned: boolean;
  imageUrl: string;
}

const readInfoDraft = (): InfoDraftSnapshot | null => {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(INFO_DRAFT_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as InfoDraftSnapshot) : null;
  } catch {
    return null;
  }
};



const INFO_DRAFT_FILE_DB_NAME =
  'lazuardi-info-terkini-draft-db';

const INFO_DRAFT_FILE_STORE_NAME =
  'draft-files';

const INFO_DRAFT_FILE_KEY =
  'info-terkini-flyer';

interface StoredInfoDraftFile {
  blob: Blob;
  name: string;
  type: string;
  lastModified: number;
}

const openInfoDraftFileDb = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(
      INFO_DRAFT_FILE_DB_NAME,
      1
    );

    request.onupgradeneeded = () => {
      const db = request.result;

      if (
        !db.objectStoreNames.contains(
          INFO_DRAFT_FILE_STORE_NAME
        )
      ) {
        db.createObjectStore(
          INFO_DRAFT_FILE_STORE_NAME
        );
      }
    };

    request.onsuccess = () =>
      resolve(request.result);

    request.onerror = () =>
      reject(request.error);
  });
};

const saveInfoDraftFileToBrowser = async (
  file: File
) => {
  if (
    typeof window === 'undefined' ||
    !('indexedDB' in window)
  ) {
    return;
  }

  const db = await openInfoDraftFileDb();

  try {
    await new Promise<void>(
      (resolve, reject) => {
        const transaction = db.transaction(
          INFO_DRAFT_FILE_STORE_NAME,
          'readwrite'
        );

        const store =
          transaction.objectStore(
            INFO_DRAFT_FILE_STORE_NAME
          );

        const storedFile: StoredInfoDraftFile = {
          blob: file,
          name: file.name,
          type: file.type,
          lastModified: file.lastModified,
        };

        store.put(
          storedFile,
          INFO_DRAFT_FILE_KEY
        );

        transaction.oncomplete = () =>
          resolve();

        transaction.onerror = () =>
          reject(transaction.error);

        transaction.onabort = () =>
          reject(transaction.error);
      }
    );
  } finally {
    db.close();
  }
};

const readInfoDraftFileFromBrowser =
  async (): Promise<File | null> => {
    if (
      typeof window === 'undefined' ||
      !('indexedDB' in window)
    ) {
      return null;
    }

    const db = await openInfoDraftFileDb();

    try {
      return await new Promise<File | null>(
        (resolve, reject) => {
          const transaction = db.transaction(
            INFO_DRAFT_FILE_STORE_NAME,
            'readonly'
          );

          const store =
            transaction.objectStore(
              INFO_DRAFT_FILE_STORE_NAME
            );

          const request = store.get(
            INFO_DRAFT_FILE_KEY
          );

          request.onsuccess = () => {
            const value =
              request.result as
                | StoredInfoDraftFile
                | undefined;

            if (!value) {
              resolve(null);
              return;
            }

            resolve(
              new File(
                [value.blob],
                value.name,
                {
                  type: value.type,
                  lastModified:
                    value.lastModified,
                }
              )
            );
          };

          request.onerror = () =>
            reject(request.error);
        }
      );
    } finally {
      db.close();
    }
  };

const clearInfoDraftFileFromBrowser =
  async () => {
    if (
      typeof window === 'undefined' ||
      !('indexedDB' in window)
    ) {
      return;
    }

    const db = await openInfoDraftFileDb();

    try {
      await new Promise<void>(
        (resolve, reject) => {
          const transaction = db.transaction(
            INFO_DRAFT_FILE_STORE_NAME,
            'readwrite'
          );

          transaction
            .objectStore(
              INFO_DRAFT_FILE_STORE_NAME
            )
            .delete(INFO_DRAFT_FILE_KEY);

          transaction.oncomplete = () =>
            resolve();

          transaction.onerror = () =>
            reject(transaction.error);

          transaction.onabort = () =>
            reject(transaction.error);
        }
      );
    } finally {
      db.close();
    }
  };



interface ElementaryMediaDraftItem {
  id: string;
  file?: File;
  url?: string;
  previewUrl: string;
  type: 'image' | 'video';
  name: string;
  isExisting?: boolean;

  // true = media baru sudah langsung di-upload ke Supabase,
  // tetapi belum dipublikasikan ke posting Elementary Updates.
  isDraftUpload?: boolean;

  // path Supabase Storage untuk menghapus media draft bila dibatalkan.
  storagePath?: string;
}

const ELEMENTARY_MEDIA_DRAFT_DB_NAME =
  'lazuardi-elementary-media-draft-db';

const ELEMENTARY_MEDIA_DRAFT_STORE_NAME =
  'draft-media';

const ELEMENTARY_MEDIA_DRAFT_KEY =
  'elementary-update-media';

interface StoredElementaryMediaFile {
  id: string;
  blob: Blob;
  name: string;
  type: string;
  lastModified: number;
  mediaType: 'image' | 'video';
}

const openElementaryMediaDraftDb =
  (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(
        ELEMENTARY_MEDIA_DRAFT_DB_NAME,
        1
      );

      request.onupgradeneeded = () => {
        const db = request.result;

        if (
          !db.objectStoreNames.contains(
            ELEMENTARY_MEDIA_DRAFT_STORE_NAME
          )
        ) {
          db.createObjectStore(
            ELEMENTARY_MEDIA_DRAFT_STORE_NAME
          );
        }
      };

      request.onsuccess = () =>
        resolve(request.result);

      request.onerror = () =>
        reject(request.error);
    });
  };

const saveElementaryMediaDraftFiles =
  async (
    items: ElementaryMediaDraftItem[]
  ) => {
    if (
      typeof window === 'undefined' ||
      !('indexedDB' in window)
    ) {
      return;
    }

    const files = items
      .filter(
        (item) =>
          item.file && !item.isExisting
      )
      .map((item) => ({
        id: item.id,
        blob: item.file as Blob,
        name: item.file!.name,
        type: item.file!.type,
        lastModified:
          item.file!.lastModified,
        mediaType: item.type,
      }));

    const db =
      await openElementaryMediaDraftDb();

    try {
      await new Promise<void>(
        (resolve, reject) => {
          const tx = db.transaction(
            ELEMENTARY_MEDIA_DRAFT_STORE_NAME,
            'readwrite'
          );

          tx.objectStore(
            ELEMENTARY_MEDIA_DRAFT_STORE_NAME
          ).put(
            files,
            ELEMENTARY_MEDIA_DRAFT_KEY
          );

          tx.oncomplete = () => resolve();
          tx.onerror = () =>
            reject(tx.error);
          tx.onabort = () =>
            reject(tx.error);
        }
      );
    } finally {
      db.close();
    }
  };

const readElementaryMediaDraftFiles =
  async (): Promise<
    ElementaryMediaDraftItem[]
  > => {
    if (
      typeof window === 'undefined' ||
      !('indexedDB' in window)
    ) {
      return [];
    }

    const db =
      await openElementaryMediaDraftDb();

    try {
      return await new Promise(
        (resolve, reject) => {
          const tx = db.transaction(
            ELEMENTARY_MEDIA_DRAFT_STORE_NAME,
            'readonly'
          );

          const request = tx
            .objectStore(
              ELEMENTARY_MEDIA_DRAFT_STORE_NAME
            )
            .get(
              ELEMENTARY_MEDIA_DRAFT_KEY
            );

          request.onsuccess = () => {
            const files =
              (request.result ??
                []) as StoredElementaryMediaFile[];

            resolve(
              files.map((stored) => {
                const file = new File(
                  [stored.blob],
                  stored.name,
                  {
                    type: stored.type,
                    lastModified:
                      stored.lastModified,
                  }
                );

                return {
                  id: stored.id,
                  file,
                  previewUrl:
                    URL.createObjectURL(
                      file
                    ),
                  type:
                    stored.mediaType,
                  name: stored.name,
                  isExisting: false,
                };
              })
            );
          };

          request.onerror = () =>
            reject(request.error);
        }
      );
    } finally {
      db.close();
    }
  };

const clearElementaryMediaDraftFiles =
  async () => {
    if (
      typeof window === 'undefined' ||
      !('indexedDB' in window)
    ) {
      return;
    }

    const db =
      await openElementaryMediaDraftDb();

    try {
      await new Promise<void>(
        (resolve, reject) => {
          const tx = db.transaction(
            ELEMENTARY_MEDIA_DRAFT_STORE_NAME,
            'readwrite'
          );

          tx.objectStore(
            ELEMENTARY_MEDIA_DRAFT_STORE_NAME
          ).delete(
            ELEMENTARY_MEDIA_DRAFT_KEY
          );

          tx.oncomplete = () => resolve();
          tx.onerror = () =>
            reject(tx.error);
          tx.onabort = () =>
            reject(tx.error);
        }
      );
    } finally {
      db.close();
    }
  };

const ELEMENTARY_UPDATE_DRAFT_STORAGE_KEY =
  'lazuardi_admin_elementary_update_draft_v1';

interface ElementaryUpdateDraftSnapshot {
  isOpen: boolean;
  editingUpdateId: string | null;
  title: string;
  content: string;
  grades: string[];
  publishDate: string;
  link: string;
  isFeatured: boolean;
  existingMedia?: Array<{
    url: string;
    type: 'image' | 'video';
    name?: string;
    isDraftUpload?: boolean;
    storagePath?: string;
  }>;
}

const readElementaryUpdateDraft =
  (): ElementaryUpdateDraftSnapshot | null => {
    if (typeof window === 'undefined') return null;

    try {
      const raw = window.localStorage.getItem(
        ELEMENTARY_UPDATE_DRAFT_STORAGE_KEY
      );

      return raw
        ? (JSON.parse(raw) as ElementaryUpdateDraftSnapshot)
        : null;
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
  const [activeTab, setActiveTab] = useState<'surat' | 'info' | 'updates' | 'reminders' | 'calendar' | 'analytics'>('surat');
  const [inputCalUrl, setInputCalUrl] = useState(calendarUrl);
  const [calSavedSuccess, setCalSavedSuccess] = useState(false);

  interface VisitStats {
    total_visits: number;
    unique_visitors: number;
    today_visits: number;
    today_unique: number;
    last_7_days_visits: number;
    last_7_days_unique: number;
    last_30_days_visits: number;
    last_30_days_unique: number;
  }

  interface DailyVisitStat {
    day: string;
    visits: number;
    unique_visitors: number;
  }

  const [visitStats, setVisitStats] =
    useState<VisitStats | null>(null);

  const [dailyVisitStats, setDailyVisitStats] =
    useState<DailyVisitStat[]>([]);

  const [
    visitAnalyticsLoading,
    setVisitAnalyticsLoading,
  ] = useState(false);

  const [
    visitAnalyticsError,
    setVisitAnalyticsError,
  ] = useState('');

  const loadVisitAnalytics =
    async () => {
      setVisitAnalyticsLoading(
        true
      );

      setVisitAnalyticsError('');

      try {
        const {
          data: summaryData,
          error: summaryError,
        } = await supabase.rpc(
          'get_web_visit_stats'
        );

        if (summaryError) {
          throw summaryError;
        }

        const {
          data: dailyData,
          error: dailyError,
        } = await supabase.rpc(
          'get_web_visit_daily_stats',
          {
            days_count: 14,
          }
        );

        if (dailyError) {
          throw dailyError;
        }

        setVisitStats(
          (summaryData ??
            null) as VisitStats | null
        );

        setDailyVisitStats(
          (dailyData ??
            []) as DailyVisitStat[]
        );
      } catch (error: any) {
        console.error(
          'Gagal memuat statistik kunjungan:',
          error
        );

        setVisitAnalyticsError(
          error?.message ||
            'Statistik belum dapat dimuat.'
        );
      } finally {
        setVisitAnalyticsLoading(
          false
        );
      }
    };

  useEffect(() => {
    if (
      activeTab === 'analytics'
    ) {
      void loadVisitAnalytics();
    }
  }, [activeTab]);

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
  const [formContent, setFormContent] = useState(
    () => restoredCircularDraft?.content ?? ''
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
      content: formContent,
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
    formContent,
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

  // =========================================================
  // INFO TERKINI FORM STATE
  // =========================================================

  const [restoredInfoDraft] = useState<InfoDraftSnapshot | null>(() =>
    readInfoDraft()
  );

  const [showInfoModal, setShowInfoModal] = useState(
    () => restoredInfoDraft?.isOpen ?? false
  );

  const [editingInfo, setEditingInfo] = useState<CircularLetter | null>(null);

  const [infoTitle, setInfoTitle] = useState(
    () => restoredInfoDraft?.title ?? ''
  );

  const [infoContent, setInfoContent] = useState(
    () => restoredInfoDraft?.content ?? ''
  );

  const [infoGrades, setInfoGrades] = useState<string[]>(
    () => restoredInfoDraft?.grades ?? ['Semua Kelas']
  );

  const [infoPublishDate, setInfoPublishDate] = useState(
    () =>
      restoredInfoDraft?.publishDate ??
      new Date().toISOString().split('T')[0]
  );

  const [infoLink, setInfoLink] = useState(
    () => restoredInfoDraft?.link ?? ''
  );

  const [infoPinned, setInfoPinned] = useState(
    () => restoredInfoDraft?.isPinned ?? false
  );

  const [infoImageUrl, setInfoImageUrl] = useState(
    () => restoredInfoDraft?.imageUrl ?? ''
  );

  const [infoImageFile, setInfoImageFile] = useState<File | null>(null);

  const [infoImagePreview, setInfoImagePreview] = useState(
    () => restoredInfoDraft?.imageUrl ?? ''
  );

  const [infoUploading, setInfoUploading] = useState(false);

  const [
    infoDraftImageRestored,
    setInfoDraftImageRestored,
  ] = useState(false);

  const infoItems = circulars.filter(
    (item) => item.tipeKonten === 'info'
  );

  const suratItems = circulars.filter(
    (item) => (item.tipeKonten ?? 'surat') === 'surat'
  );

  useEffect(() => {
    if (infoDraftImageRestored) return;

    setInfoDraftImageRestored(true);

    if (
      !restoredInfoDraft?.isOpen ||
      restoredInfoDraft.imageUrl
    ) {
      return;
    }

    let cancelled = false;

    const restoreDraftImage = async () => {
      try {
        const storedFile =
          await readInfoDraftFileFromBrowser();

        if (
          cancelled ||
          !storedFile
        ) {
          return;
        }

        const previewUrl =
          URL.createObjectURL(storedFile);

        setInfoImageFile(storedFile);
        setInfoImagePreview(previewUrl);
      } catch (error) {
        console.warn(
          'Draft flyer tidak dapat dipulihkan:',
          error
        );
      }
    };

    void restoreDraftImage();

    return () => {
      cancelled = true;
    };
  }, [
    restoredInfoDraft,
    infoDraftImageRestored,
  ]);

  useEffect(() => {
    const editingId = restoredInfoDraft?.editingInfoId;

    if (!editingId || editingInfo) return;

    const found = circulars.find((item) => item.id === editingId);

    if (found && found.tipeKonten === 'info') {
      setEditingInfo(found);
    }
  }, [circulars, editingInfo, restoredInfoDraft]);

  useEffect(() => {
    if (!showInfoModal || typeof window === 'undefined') return;

    const snapshot: InfoDraftSnapshot = {
      isOpen: true,
      editingInfoId:
        editingInfo?.id ??
        restoredInfoDraft?.editingInfoId ??
        null,
      title: infoTitle,
      content: infoContent,
      grades: infoGrades,
      publishDate: infoPublishDate,
      link: infoLink,
      isPinned: infoPinned,
      imageUrl: infoImageUrl,
    };

    window.localStorage.setItem(
      INFO_DRAFT_STORAGE_KEY,
      JSON.stringify(snapshot)
    );
  }, [
    showInfoModal,
    editingInfo,
    restoredInfoDraft,
    infoTitle,
    infoContent,
    infoGrades,
    infoPublishDate,
    infoLink,
    infoPinned,
    infoImageUrl,
  ]);

  const clearInfoDraft = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(
        INFO_DRAFT_STORAGE_KEY
      );
    }

    void clearInfoDraftFileFromBrowser();
  };

  const resetInfoForm = () => {
    setEditingInfo(null);
    setInfoTitle('');
    setInfoContent('');
    setInfoGrades(['Semua Kelas']);
    setInfoPublishDate(new Date().toISOString().split('T')[0]);
    setInfoLink('');
    setInfoPinned(false);

    if (infoImagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(infoImagePreview);
    }

    setInfoImageUrl('');
    setInfoImageFile(null);
    setInfoImagePreview('');
    setInfoUploading(false);
  };

  const closeInfoModal = () => {
    setShowInfoModal(false);
    clearInfoDraft();
    resetInfoForm();
  };

  const handleInfoImageChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
    ];

    if (!allowedTypes.includes(file.type)) {
      alert(
        'Format flyer harus JPG, JPEG, PNG, atau WEBP.'
      );

      e.target.value = '';
      return;
    }

    const maxSize =
      5 * 1024 * 1024;

    if (file.size > maxSize) {
      alert(
        'Ukuran flyer maksimal 5 MB.'
      );

      e.target.value = '';
      return;
    }

    if (
      infoImagePreview.startsWith(
        'blob:'
      )
    ) {
      URL.revokeObjectURL(
        infoImagePreview
      );
    }

    const previewUrl =
      URL.createObjectURL(file);

    // Jika mengganti gambar lama,
    // URL lama tidak dipakai untuk draft baru.
    setInfoImageUrl('');
    setInfoImageFile(file);
    setInfoImagePreview(previewUrl);

    try {
      await saveInfoDraftFileToBrowser(
        file
      );
    } catch (error) {
      console.warn(
        'Flyer tidak dapat disimpan ke draft browser:',
        error
      );
    }

    // Memungkinkan memilih ulang file dengan nama sama.
    e.target.value = '';
  };

  const removeInfoImage = () => {
    if (
      infoImagePreview.startsWith(
        'blob:'
      )
    ) {
      URL.revokeObjectURL(
        infoImagePreview
      );
    }

    setInfoImageFile(null);
    setInfoImageUrl('');
    setInfoImagePreview('');

    void clearInfoDraftFileFromBrowser();
  };

  const getInfoImageUploadErrorMessage = (
    error: any
  ) => {
    const rawMessage = String(
      error?.message ||
        error?.error ||
        error ||
        ''
    );

    if (
      rawMessage
        .toLowerCase()
        .includes('bucket not found')
    ) {
      return [
        'Bucket "info-images" belum ditemukan.',
        '',
        'Buka Supabase project yang dipakai Vercel,',
        'lalu pastikan Storage memiliki bucket bernama:',
        'info-images',
        '',
        'Setelah itu coba upload kembali.',
      ].join('\\n');
    }

    if (
      rawMessage
        .toLowerCase()
        .includes('row-level security') ||
      rawMessage
        .toLowerCase()
        .includes('policy')
    ) {
      return [
        'Upload ditolak oleh Storage Policy.',
        '',
        'Pastikan akun admin sedang login dan policy',
        'bucket "info-images" sudah dijalankan.',
      ].join('\\n');
    }

    return rawMessage
      ? `Gagal mengunggah flyer: ${rawMessage}`
      : 'Gagal mengunggah flyer. Silakan coba kembali.';
  };

  const uploadInfoImage = async (
    file: File
  ): Promise<string> => {
    const extension =
      file.name.split('.').pop()?.toLowerCase() || 'jpg';

    const safeName = file.name
      .replace(/\.[^/.]+$/, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'flyer';

    const filePath =
      `info-terkini/${Date.now()}-${safeName}.${extension}`;

    const { error: uploadError } =
      await supabase.storage
        .from('info-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type,
        });

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage
      .from('info-images')
      .getPublicUrl(filePath);

    if (!data.publicUrl) {
      throw new Error(
        'URL flyer tidak berhasil dibuat.'
      );
    }

    return data.publicUrl;
  };

  const toggleInfoGradeSelection = (grade: string) => {
    if (grade === 'Semua Kelas') {
      setInfoGrades(['Semua Kelas']);
      return;
    }

    const withoutSemua = infoGrades.filter(
      (item) => item !== 'Semua Kelas'
    );

    if (withoutSemua.includes(grade)) {
      const next = withoutSemua.filter((item) => item !== grade);
      setInfoGrades(next.length === 0 ? ['Semua Kelas'] : next);
    } else {
      setInfoGrades([...withoutSemua, grade]);
    }
  };

  const handleEditInfo = (info: CircularLetter) => {
    clearInfoDraft();

    setEditingInfo(info);
    setInfoTitle(info.title || '');
    setInfoContent(info.content || info.summary || '');
    setInfoGrades(
      info.gradeLevels?.length > 0
        ? info.gradeLevels
        : ['Semua Kelas']
    );
    setInfoPublishDate(
      info.publishDate || new Date().toISOString().split('T')[0]
    );
    setInfoLink(info.gdriveLink || '');
    setInfoPinned(info.isPinned ?? false);
    setInfoImageUrl(info.imageUrl || '');
    setInfoImageFile(null);
    setInfoImagePreview(info.imageUrl || '');

    setShowInfoModal(true);
  };

  const handleSaveInfo = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (!infoTitle.trim() || !infoContent.trim()) {
      return;
    }

    setInfoUploading(true);

    try {
      let finalImageUrl =
        infoImageUrl || undefined;

      if (infoImageFile) {
        finalImageUrl =
          await uploadInfoImage(infoImageFile);
      }

      if (editingInfo) {
        const updatedInfo: CircularLetter = {
          ...editingInfo,
          tipeKonten: 'info',
          nomorSurat: '',
          title: infoTitle.trim(),
          category: 'Info Terkini',
          gradeLevels: infoGrades,
          publishDate: infoPublishDate,
          effectiveDate: '',
          summary: infoContent.trim(),
          content: infoContent.trim(),
          imageUrl: finalImageUrl,
          gdriveLink:
            infoLink.trim() || undefined,
          urgency: infoPinned
            ? 'penting'
            : 'normal',
          isPinned: infoPinned,
          signedBy: '',
        };

        onUpdateCircular(updatedInfo);
      } else {
        const newInfo: CircularLetter = {
          id: `info-${Date.now()}`,
          tipeKonten: 'info',
          nomorSurat: '',
          title: infoTitle.trim(),
          category: 'Info Terkini',
          gradeLevels: infoGrades,
          publishDate: infoPublishDate,
          effectiveDate: '',
          urgency: infoPinned
            ? 'penting'
            : 'normal',
          summary: infoContent.trim(),
          content: infoContent.trim(),
          imageUrl: finalImageUrl,
          gdriveLink:
            infoLink.trim() || undefined,
          signedBy: '',
          tembusan: [],
          isPinned: infoPinned,
          viewCount: 0,
        };

        onAddCircular(newInfo);
      }

      setShowInfoModal(false);
      clearInfoDraft();

      await clearInfoDraftFileFromBrowser();

      resetInfoForm();
    } catch (error: any) {
      console.error(
        'Gagal mengunggah flyer Info Terkini:',
        error
      );

      alert(
        getInfoImageUploadErrorMessage(
          error
        )
      );
    } finally {
      setInfoUploading(false);
    }
  };

  // =========================================================
  // ELEMENTARY UPDATES FORM STATE
  // =========================================================

  const [restoredElementaryUpdateDraft] =
    useState<ElementaryUpdateDraftSnapshot | null>(() =>
      readElementaryUpdateDraft()
    );

  const [showElementaryUpdateModal, setShowElementaryUpdateModal] =
    useState(
      () => restoredElementaryUpdateDraft?.isOpen ?? false
    );

  const [editingElementaryUpdate, setEditingElementaryUpdate] =
    useState<CircularLetter | null>(null);

  const [updateTitle, setUpdateTitle] = useState(
    () => restoredElementaryUpdateDraft?.title ?? ''
  );

  const [updateContent, setUpdateContent] = useState(
    () => restoredElementaryUpdateDraft?.content ?? ''
  );

  const [updateGrades, setUpdateGrades] = useState<string[]>(
    () =>
      restoredElementaryUpdateDraft?.grades ??
      ['Semua Kelas']
  );

  const [updatePublishDate, setUpdatePublishDate] =
    useState(
      () =>
        restoredElementaryUpdateDraft?.publishDate ??
        new Date().toISOString().split('T')[0]
    );

  const [updateLink, setUpdateLink] = useState(
    () => restoredElementaryUpdateDraft?.link ?? ''
  );

  const [updateFeatured, setUpdateFeatured] =
    useState(
      () =>
        restoredElementaryUpdateDraft?.isFeatured ??
        false
    );

  const [
    updateMediaItems,
    setUpdateMediaItems,
  ] = useState<ElementaryMediaDraftItem[]>(
    () =>
      (
        restoredElementaryUpdateDraft?.existingMedia ??
        []
      ).map((media, index) => ({
        id: `existing-${index}-${media.url}`,
        url: media.url,
        previewUrl: media.url,
        type: media.type,
        name:
          media.name ||
          `Media ${index + 1}`,
        isExisting: true,
        isDraftUpload:
          media.isDraftUpload ?? false,
        storagePath:
          media.storagePath,
      }))
  );

  const [
    elementaryMediaRestored,
    setElementaryMediaRestored,
  ] = useState(false);

  const [
    elementaryMediaUploading,
    setElementaryMediaUploading,
  ] = useState(false);

  const elementaryUpdateItems = circulars.filter(
    (item) => item.tipeKonten === 'elementary_update'
  );

  useEffect(() => {
    if (elementaryMediaRestored) return;

    setElementaryMediaRestored(true);

    if (
      !restoredElementaryUpdateDraft?.isOpen
    ) {
      return;
    }

    let cancelled = false;

    const restoreFiles = async () => {
      try {
        const files =
          await readElementaryMediaDraftFiles();

        if (
          cancelled ||
          files.length === 0
        ) {
          return;
        }

        setUpdateMediaItems(
          (current) => [
            ...current,
            ...files.filter(
              (file) =>
                !current.some(
                  (item) =>
                    item.id ===
                    file.id
                )
            ),
          ]
        );
      } catch (error) {
        console.warn(
          'Draft media Elementary Updates tidak dapat dipulihkan:',
          error
        );
      }
    };

    void restoreFiles();

    return () => {
      cancelled = true;
    };
  }, [
    elementaryMediaRestored,
    restoredElementaryUpdateDraft,
  ]);

  useEffect(() => {
    const editingId =
      restoredElementaryUpdateDraft?.editingUpdateId;

    if (!editingId || editingElementaryUpdate) return;

    const found = circulars.find(
      (item) => item.id === editingId
    );

    if (
      found &&
      found.tipeKonten === 'elementary_update'
    ) {
      setEditingElementaryUpdate(found);
    }
  }, [
    circulars,
    editingElementaryUpdate,
    restoredElementaryUpdateDraft,
  ]);

  useEffect(() => {
    if (
      !showElementaryUpdateModal ||
      typeof window === 'undefined'
    ) {
      return;
    }

    const snapshot: ElementaryUpdateDraftSnapshot = {
      isOpen: true,
      editingUpdateId:
        editingElementaryUpdate?.id ??
        restoredElementaryUpdateDraft?.editingUpdateId ??
        null,
      title: updateTitle,
      content: updateContent,
      grades: updateGrades,
      publishDate: updatePublishDate,
      link: updateLink,
      isFeatured: updateFeatured,
      existingMedia: updateMediaItems
        .filter(
          (item) =>
            item.isExisting &&
            item.url
        )
        .map((item) => ({
          url: item.url!,
          type: item.type,
          name: item.name,
          isDraftUpload:
            item.isDraftUpload ?? false,
          storagePath:
            item.storagePath,
        })),
    };

    window.localStorage.setItem(
      ELEMENTARY_UPDATE_DRAFT_STORAGE_KEY,
      JSON.stringify(snapshot)
    );
  }, [
    showElementaryUpdateModal,
    editingElementaryUpdate,
    restoredElementaryUpdateDraft,
    updateTitle,
    updateContent,
    updateGrades,
    updatePublishDate,
    updateLink,
    updateFeatured,
    updateMediaItems,
  ]);

  useEffect(() => {
    if (!showElementaryUpdateModal) {
      return;
    }

    void saveElementaryMediaDraftFiles(
      updateMediaItems
    );
  }, [
    showElementaryUpdateModal,
    updateMediaItems,
  ]);

  const clearElementaryUpdateDraft = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(
        ELEMENTARY_UPDATE_DRAFT_STORAGE_KEY
      );
    }

    void clearElementaryMediaDraftFiles();
  };

  const persistElementaryUpdateDraftNow = (
    mediaItems: ElementaryMediaDraftItem[]
  ) => {
    if (
      typeof window === 'undefined'
    ) {
      return;
    }

    const snapshot:
      ElementaryUpdateDraftSnapshot = {
      isOpen: true,
      editingUpdateId:
        editingElementaryUpdate?.id ??
        restoredElementaryUpdateDraft?.editingUpdateId ??
        null,
      title: updateTitle,
      content: updateContent,
      grades: updateGrades,
      publishDate:
        updatePublishDate,
      link: updateLink,
      isFeatured:
        updateFeatured,
      existingMedia: mediaItems
        .filter(
          (item) =>
            item.url
        )
        .map((item) => ({
          url: item.url!,
          type: item.type,
          name: item.name,
          isDraftUpload:
            item.isDraftUpload ??
            false,
          storagePath:
            item.storagePath,
        })),
    };

    window.localStorage.setItem(
      ELEMENTARY_UPDATE_DRAFT_STORAGE_KEY,
      JSON.stringify(snapshot)
    );
  };

  const resetElementaryUpdateForm = () => {
    setEditingElementaryUpdate(null);
    setUpdateTitle('');
    setUpdateContent('');
    setUpdateGrades(['Semua Kelas']);
    setUpdatePublishDate(
      new Date().toISOString().split('T')[0]
    );
    setUpdateLink('');
    setUpdateFeatured(false);

    updateMediaItems.forEach(
      (item) => {
        if (
          !item.isExisting &&
          item.previewUrl.startsWith(
            'blob:'
          )
        ) {
          URL.revokeObjectURL(
            item.previewUrl
          );
        }
      }
    );

    setUpdateMediaItems([]);
    setElementaryMediaUploading(false);
  };

  const closeElementaryUpdateModal = () => {
    // Tombol Batal/X berarti draft memang dibatalkan,
    // jadi media baru yang sudah ter-upload dibersihkan.
    updateMediaItems
      .filter(
        (item) =>
          item.isDraftUpload &&
          item.storagePath
      )
      .forEach(
        (item) => {
          void deleteElementaryDraftStorageFile(
            item.storagePath
          );
        }
      );

    setShowElementaryUpdateModal(false);
    clearElementaryUpdateDraft();
    resetElementaryUpdateForm();
  };

  const uploadElementaryMediaImmediately =
    async (
      file: File,
      mediaType: 'image' | 'video'
    ): Promise<{
      url: string;
      storagePath: string;
    }> => {
      const extension =
        file.name
          .split('.')
          .pop()
          ?.toLowerCase() ||
        (mediaType === 'video'
          ? 'mp4'
          : 'jpg');

      const safeName =
        file.name
          .replace(/\.[^/.]+$/, '')
          .toLowerCase()
          .replace(
            /[^a-z0-9]+/g,
            '-'
          )
          .replace(
            /^-+|-+$/g,
            ''
          )
          .slice(0, 60) ||
        'media';

      const storagePath =
        `drafts/${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}-${safeName}.${extension}`;

      const { error } =
        await supabase.storage
          .from(
            'elementary-media'
          )
          .upload(
            storagePath,
            file,
            {
              cacheControl:
                '3600',
              upsert: false,
              contentType:
                file.type,
            }
          );

      if (error) {
        throw error;
      }

      const { data } =
        supabase.storage
          .from(
            'elementary-media'
          )
          .getPublicUrl(
            storagePath
          );

      if (!data.publicUrl) {
        throw new Error(
          `URL ${file.name} tidak berhasil dibuat.`
        );
      }

      return {
        url: data.publicUrl,
        storagePath,
      };
    };

  const deleteElementaryDraftStorageFile =
    async (
      storagePath?: string
    ) => {
      if (!storagePath) return;

      const { error } =
        await supabase.storage
          .from(
            'elementary-media'
          )
          .remove([
            storagePath,
          ]);

      if (error) {
        console.warn(
          'Gagal membersihkan media draft:',
          error
        );
      }
    };

  const handleElementaryMediaChange =
    async (
      e: React.ChangeEvent<HTMLInputElement>
    ) => {
      const selectedFiles = Array.from(
        e.target.files ?? []
      );

      // Penting: reset input supaya file yang sama
      // dapat dipilih lagi jika upload gagal.
      e.target.value = '';

      if (selectedFiles.length === 0) {
        return;
      }

      const remainingSlots =
        6 - updateMediaItems.length;

      if (remainingSlots <= 0) {
        alert(
          'Maksimal 6 foto/video untuk satu Elementary Update.'
        );
        return;
      }

      const files =
        selectedFiles.slice(
          0,
          remainingSlots
        );

      setElementaryMediaUploading(
        true
      );

      try {
        for (const file of files) {
          const isImage =
            [
              'image/jpeg',
              'image/png',
              'image/webp',
            ].includes(file.type);

          const isVideo =
            [
              'video/mp4',
              'video/webm',
            ].includes(file.type);

          if (!isImage && !isVideo) {
            alert(
              `${file.name}: format tidak didukung. Gunakan JPG, PNG, WEBP, MP4, atau WEBM.`
            );
            continue;
          }

          const maxSize = isImage
            ? 10 * 1024 * 1024
            : 50 * 1024 * 1024;

          if (file.size > maxSize) {
            alert(
              isImage
                ? `${file.name}: foto maksimal 10 MB.`
                : `${file.name}: video maksimal 50 MB.`
            );
            continue;
          }

          const mediaType:
            'image' | 'video' =
            isVideo
              ? 'video'
              : 'image';

          // Upload LANGSUNG saat file dipilih.
          // Setelah ini preview tidak bergantung pada blob browser.
          const uploaded =
            await uploadElementaryMediaImmediately(
              file,
              mediaType
            );

          const uploadedItem:
            ElementaryMediaDraftItem = {
            id: `draft-upload-${Date.now()}-${Math.random()
              .toString(36)
              .slice(2)}`,
            url: uploaded.url,
            previewUrl:
              uploaded.url,
            type: mediaType,
            name: file.name,
            isExisting: true,
            isDraftUpload: true,
            storagePath:
              uploaded.storagePath,
          };

          setUpdateMediaItems(
            (current) => {
              const next = [
                ...current,
                uploadedItem,
              ];

              // Simpan URL Supabase ke localStorage
              // pada saat yang sama, tanpa menunggu useEffect.
              persistElementaryUpdateDraftNow(
                next
              );

              return next;
            }
          );
        }
      } catch (error: any) {
        console.error(
          'Gagal upload media draft Elementary Updates:',
          error
        );

        alert(
          getElementaryMediaUploadError(
            error
          )
        );
      } finally {
        setElementaryMediaUploading(
          false
        );
      }
    };

  const removeElementaryMedia = (
    id: string
  ) => {
    const removing =
      updateMediaItems.find(
        (item) =>
          item.id === id
      );

    setUpdateMediaItems(
      (current) => {
        const next =
          current.filter(
            (item) =>
              item.id !== id
          );

        persistElementaryUpdateDraftNow(
          next
        );

        return next;
      }
    );

    // Jangan hapus file media yang sudah menjadi bagian
    // dari posting lama. Hanya hapus media draft baru.
    if (
      removing?.isDraftUpload &&
      removing.storagePath
    ) {
      void deleteElementaryDraftStorageFile(
        removing.storagePath
      );
    }

    if (
      removing &&
      !removing.isExisting &&
      removing.previewUrl.startsWith(
        'blob:'
      )
    ) {
      URL.revokeObjectURL(
        removing.previewUrl
      );
    }
  };

  const uploadElementaryMedia =
    async (
      item: ElementaryMediaDraftItem
    ): Promise<{
      url: string;
      type: 'image' | 'video';
      name: string;
    }> => {
      if (
        item.isExisting &&
        item.url
      ) {
        return {
          url: item.url,
          type: item.type,
          name: item.name,
        };
      }

      if (!item.file) {
        throw new Error(
          `File ${item.name} tidak tersedia.`
        );
      }

      const extension =
        item.file.name
          .split('.')
          .pop()
          ?.toLowerCase() ||
        (item.type === 'video'
          ? 'mp4'
          : 'jpg');

      const safeName =
        item.file.name
          .replace(/\.[^/.]+$/, '')
          .toLowerCase()
          .replace(
            /[^a-z0-9]+/g,
            '-'
          )
          .replace(
            /^-+|-+$/g,
            ''
          )
          .slice(0, 60) ||
        'media';

      const filePath =
        `updates/${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}-${safeName}.${extension}`;

      const { error } =
        await supabase.storage
          .from(
            'elementary-media'
          )
          .upload(
            filePath,
            item.file,
            {
              cacheControl:
                '3600',
              upsert: false,
              contentType:
                item.file.type,
            }
          );

      if (error) {
        throw error;
      }

      const { data } =
        supabase.storage
          .from(
            'elementary-media'
          )
          .getPublicUrl(
            filePath
          );

      if (!data.publicUrl) {
        throw new Error(
          `URL ${item.name} tidak berhasil dibuat.`
        );
      }

      return {
        url: data.publicUrl,
        type: item.type,
        name: item.name,
      };
    };

  const getElementaryMediaUploadError =
    (error: any) => {
      const message = String(
        error?.message ||
          error?.error ||
          error ||
          ''
      );

      if (
        message
          .toLowerCase()
          .includes(
            'bucket not found'
          )
      ) {
        return [
          'Bucket "elementary-media" belum ditemukan.',
          '',
          'Jalankan SQL STEP10 pada project Supabase yang dipakai Vercel, lalu coba kembali.',
        ].join('\\n');
      }

      if (
        message
          .toLowerCase()
          .includes(
            'row-level security'
          ) ||
        message
          .toLowerCase()
          .includes('policy')
      ) {
        return [
          'Upload ditolak oleh Storage Policy.',
          '',
          'Pastikan admin sedang login dan policy bucket elementary-media sudah aktif.',
        ].join('\\n');
      }

      return message
        ? `Gagal upload media: ${message}`
        : 'Gagal upload foto/video. Silakan coba kembali.';
    };

  const toggleUpdateGradeSelection = (
    grade: string
  ) => {
    if (grade === 'Semua Kelas') {
      setUpdateGrades(['Semua Kelas']);
      return;
    }

    const withoutSemua = updateGrades.filter(
      (item) => item !== 'Semua Kelas'
    );

    if (withoutSemua.includes(grade)) {
      const next = withoutSemua.filter(
        (item) => item !== grade
      );

      setUpdateGrades(
        next.length === 0 ? ['Semua Kelas'] : next
      );
    } else {
      setUpdateGrades([...withoutSemua, grade]);
    }
  };

  const handleEditElementaryUpdate = (
    update: CircularLetter
  ) => {
    clearElementaryUpdateDraft();

    setEditingElementaryUpdate(update);
    setUpdateTitle(update.title || '');
    setUpdateContent(
      update.content || update.summary || ''
    );
    setUpdateGrades(
      update.gradeLevels?.length > 0
        ? update.gradeLevels
        : ['Semua Kelas']
    );
    setUpdatePublishDate(
      update.publishDate ||
        new Date().toISOString().split('T')[0]
    );
    setUpdateLink(update.gdriveLink || '');
    setUpdateFeatured(update.isPinned ?? false);

    setUpdateMediaItems(
      (update.mediaItems ?? []).map(
        (media, index) => ({
          id: `existing-${index}-${media.url}`,
          url: media.url,
          previewUrl: media.url,
          type: media.type,
          name:
            media.name ||
            `Media ${index + 1}`,
          isExisting: true,
          isDraftUpload: false,
        })
      )
    );

    setShowElementaryUpdateModal(true);
  };

  const handleSaveElementaryUpdate =
    async (
      e: React.FormEvent
    ) => {
      e.preventDefault();

      if (
        !updateTitle.trim() ||
        !updateContent.trim()
      ) {
        return;
      }

      setElementaryMediaUploading(
        true
      );

      try {
        // Media yang sudah di-upload saat dipilih hanya
        // dikumpulkan URL-nya di sini, tidak di-upload ulang.
        const uploadedMedia =
          await Promise.all(
            updateMediaItems.map(
              uploadElementaryMedia
            )
          );

        let saved = false;

        if (editingElementaryUpdate) {
          const updatedItem:
            CircularLetter = {
            ...editingElementaryUpdate,
            tipeKonten:
              'elementary_update',
            nomorSurat: '',
            title:
              updateTitle.trim(),
            category:
              'Elementary Updates',
            gradeLevels:
              updateGrades,
            publishDate:
              updatePublishDate,
            effectiveDate: '',
            summary:
              updateContent.trim(),
            content:
              updateContent.trim(),
            mediaItems:
              uploadedMedia,
            gdriveLink:
              updateLink.trim() ||
              undefined,
            urgency:
              updateFeatured
                ? 'penting'
                : 'normal',
            isPinned:
              updateFeatured,
            signedBy: '',
          };

          saved =
            await onUpdateCircular(
              updatedItem
            );
        } else {
          const newItem:
            CircularLetter = {
            id: `elementary-update-${Date.now()}`,
            tipeKonten:
              'elementary_update',
            nomorSurat: '',
            title:
              updateTitle.trim(),
            category:
              'Elementary Updates',
            gradeLevels:
              updateGrades,
            publishDate:
              updatePublishDate,
            effectiveDate: '',
            urgency:
              updateFeatured
                ? 'penting'
                : 'normal',
            summary:
              updateContent.trim(),
            content:
              updateContent.trim(),
            mediaItems:
              uploadedMedia,
            gdriveLink:
              updateLink.trim() ||
              undefined,
            signedBy: '',
            tembusan: [],
            isPinned:
              updateFeatured,
            viewCount: 0,
          };

          saved =
            await onAddCircular(
              newItem
            );
        }

        // KRITIS:
        // Kalau Supabase gagal, JANGAN tutup form
        // dan JANGAN hapus draft/media.
        if (!saved) {
          persistElementaryUpdateDraftNow(
            updateMediaItems
          );

          return;
        }

        // Baru setelah database benar-benar berhasil:
        // tutup dan bersihkan draft lokal.
        setShowElementaryUpdateModal(
          false
        );

        clearElementaryUpdateDraft();

        await clearElementaryMediaDraftFiles();

        resetElementaryUpdateForm();
      } catch (error: any) {
        console.error(
          'Gagal menyimpan Elementary Updates:',
          error
        );

        // Pertahankan draft supaya media dan isian tidak hilang.
        persistElementaryUpdateDraftNow(
          updateMediaItems
        );

        alert(
          getElementaryMediaUploadError(
            error
          )
        );
      } finally {
        setElementaryMediaUploading(
          false
        );
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
    setFormContent('');
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
    setFormContent(circ.content || circ.summary || '');
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
        summary: formContent.trim() || formTitle,
        content:
          formContent.trim() ||
          editingCircular.content ||
          `Informasi mengenai ${formTitle}.`,
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
        summary: formContent.trim() || formTitle,
        content:
          formContent.trim() ||
          `Informasi mengenai ${formTitle}.`,
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

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0 w-full md:w-auto">
          <button
            onClick={() => {
              // Jangan hapus draft yang sudah ada.
              // Jika user kembali ke form, lanjutkan draft sebelumnya.
              setActiveTab('updates');
              setShowElementaryUpdateModal(true);
            }}
            className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all cursor-pointer"
          >
            <Newspaper className="w-4 h-4" />
            <span>Buat Elementary Update</span>
          </button>

          <button
            onClick={() => {
              clearInfoDraft();
              resetInfoForm();
              setActiveTab('info');
              setShowInfoModal(true);
            }}
            className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-blue-950 border border-white/70 font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all cursor-pointer"
          >
            <Megaphone className="w-4 h-4 text-amber-600" />
            <span>Buat Info Terkini</span>
          </button>

          <button
            onClick={() => {
              clearCircularDraft();
              resetForm();
              setActiveTab('surat');
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
          Daftar Surat Edaran ({suratItems.length})
        </button>

        <button
          onClick={() => setActiveTab('info')}
          className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'info' ? 'bg-amber-400 text-slate-950 shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Megaphone className="w-4 h-4" />
          Info Terkini ({infoItems.length})
        </button>

        <button
          onClick={() => setActiveTab('updates')}
          className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'updates' ? 'bg-emerald-700 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Newspaper className="w-4 h-4" />
          Elementary Updates ({elementaryUpdateItems.length})
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
          onClick={() =>
            setActiveTab('analytics')
          }
          className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'analytics'
              ? 'bg-violet-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Statistik Kunjungan
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

      {/* Tab Content: Elementary Updates */}
      {activeTab === 'updates' && (
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Newspaper className="w-4 h-4 text-emerald-700" />
                Kelola Elementary Updates
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Untuk headline kegiatan, project, prestasi, dan cerita terbaru dari Elementary.
              </p>
            </div>

            <button
              onClick={() => {
                // Resume draft jika sebelumnya sudah mulai mengisi.
                setShowElementaryUpdateModal(true);
              }}
              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition-colors shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              Tambah Elementary Update
            </button>
          </div>

          {elementaryUpdateItems.length > 0 ? (
            <div className="space-y-3">
              {elementaryUpdateItems.map((update) => {
                const peruntukanText =
                  update.gradeLevels?.includes(
                    'Semua Kelas'
                  )
                    ? 'Elementary'
                    : update.gradeLevels?.join(', ');

                return (
                  <div
                    key={update.id}
                    className={`rounded-xl border p-4 flex flex-col lg:flex-row lg:items-start justify-between gap-4 ${
                      update.isPinned
                        ? 'border-emerald-300 bg-emerald-50/50'
                        : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold uppercase tracking-wide">
                          <Newspaper className="w-3 h-3" />
                          Elementary Updates
                        </span>

                        {update.isPinned && (
                          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 bg-blue-50 border border-blue-200 text-blue-900 text-[10px] font-bold">
                            <Pin className="w-3 h-3" />
                            Featured
                          </span>
                        )}

                        <span className="text-[11px] text-slate-500">
                          {update.publishDate}
                        </span>

                        {peruntukanText && (
                          <span className="text-[11px] font-semibold text-slate-600 bg-white border border-slate-200 rounded-md px-2 py-0.5">
                            {peruntukanText}
                          </span>
                        )}
                      </div>

                      <h4 className="font-extrabold text-sm sm:text-base text-slate-950">
                        {update.title}
                      </h4>

                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mt-1.5 whitespace-pre-line line-clamp-4">
                        {update.content || update.summary}
                      </p>

                      {update.mediaItems &&
                        update.mediaItems.length > 0 && (
                          <div className="flex items-center gap-1.5 mt-2">
                            <Images className="w-3.5 h-3.5 text-emerald-700" />
                            <span className="text-[11px] font-semibold text-slate-500">
                              {update.mediaItems.length}{' '}
                              foto/video
                            </span>
                          </div>
                        )}

                      {update.gdriveLink && (
                        <a
                          href={update.gdriveLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 mt-2 text-xs text-emerald-800 font-bold hover:underline"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Buka Tautan
                        </a>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end lg:self-start">
                      <button
                        onClick={() => {
                          onUpdateCircular({
                            ...update,
                            isPinned: !update.isPinned,
                            urgency: !update.isPinned
                              ? 'penting'
                              : 'normal',
                          });
                        }}
                        className={`p-2 rounded-lg border transition-colors ${
                          update.isPinned
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-emerald-50'
                        }`}
                        title={
                          update.isPinned
                            ? 'Lepas Featured'
                            : 'Jadikan Featured'
                        }
                      >
                        <Pin className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() =>
                          handleEditElementaryUpdate(update)
                        }
                        className="p-2 text-slate-700 hover:bg-white rounded-lg border border-slate-200"
                        title="Edit Elementary Update"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => {
                          if (
                            confirm(
                              `Hapus Elementary Update "${update.title}"?`
                            )
                          ) {
                            onDeleteCircular(update.id);
                          }
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg border border-red-200"
                        title="Hapus Elementary Update"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-3">
                <Newspaper className="w-5 h-5" />
              </div>

              <h4 className="font-bold text-sm text-slate-900">
                Belum ada Elementary Updates
              </h4>

              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Tambahkan headline kegiatan, project, prestasi, atau cerita terbaru dari Elementary.
              </p>
            </div>
          )}
        </div>
      )}

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

      {/* Tab Content: Info Terkini */}
      {activeTab === 'info' && (
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-amber-600" />
                Kelola Info Terkini
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Untuk pengumuman singkat atau informasi orang tua yang tidak memerlukan nomor surat.
              </p>
            </div>

            <button
              onClick={() => {
                clearInfoDraft();
                resetInfoForm();
                setShowInfoModal(true);
              }}
              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs font-bold rounded-xl transition-colors shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              Tambah Info Terkini
            </button>
          </div>

          {infoItems.length > 0 ? (
            <div className="space-y-3">
              {infoItems.map((info) => {
                const peruntukanText = info.gradeLevels?.includes('Semua Kelas')
                  ? 'Semua Kelas'
                  : info.gradeLevels?.join(', ');

                return (
                  <div
                    key={info.id}
                    className={`rounded-xl border p-4 flex flex-col lg:flex-row lg:items-start justify-between gap-4 ${
                      info.isPinned
                        ? 'border-amber-300 bg-amber-50/50'
                        : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 bg-amber-100 border border-amber-200 text-amber-900 text-[10px] font-bold uppercase tracking-wide">
                          <Megaphone className="w-3 h-3" />
                          Info Terkini
                        </span>

                        {info.isPinned && (
                          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 bg-blue-50 border border-blue-200 text-blue-900 text-[10px] font-bold">
                            <Pin className="w-3 h-3" />
                            Penting
                          </span>
                        )}

                        <span className="text-[11px] text-slate-500">
                          {info.publishDate}
                        </span>

                        {peruntukanText && (
                          <span className="text-[11px] font-semibold text-slate-600 bg-white border border-slate-200 rounded-md px-2 py-0.5">
                            {peruntukanText}
                          </span>
                        )}
                      </div>

                      <h4 className="font-extrabold text-sm sm:text-base text-slate-950">
                        {info.title}
                      </h4>

                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mt-1.5 whitespace-pre-line">
                        {info.content || info.summary}
                      </p>

                      {info.gdriveLink && (
                        <a
                          href={info.gdriveLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 mt-2 text-xs text-blue-800 font-bold hover:underline"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Buka Tautan
                        </a>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end lg:self-start">
                      <button
                        onClick={() => {
                          onUpdateCircular({
                            ...info,
                            isPinned: !info.isPinned,
                            urgency: !info.isPinned ? 'penting' : 'normal',
                          });
                        }}
                        className={`p-2 rounded-lg border transition-colors ${
                          info.isPinned
                            ? 'bg-amber-100 text-amber-800 border-amber-300'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-amber-50'
                        }`}
                        title={info.isPinned ? 'Lepas tanda penting' : 'Tandai penting'}
                      >
                        <Pin className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleEditInfo(info)}
                        className="p-2 text-slate-700 hover:bg-white rounded-lg border border-slate-200"
                        title="Edit Info"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => {
                          if (confirm(`Hapus info "${info.title}"?`)) {
                            onDeleteCircular(info.id);
                          }
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg border border-red-200"
                        title="Hapus Info"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
              <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto mb-3">
                <Megaphone className="w-5 h-5" />
              </div>

              <h4 className="font-bold text-sm text-slate-900">
                Belum ada Info Terkini
              </h4>

              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Gunakan Info Terkini untuk informasi singkat yang tidak memerlukan nomor surat resmi.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tab Content: Surat Edaran */}
      {activeTab === 'surat' && (
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <h3 className="font-bold text-base text-slate-900">Daftar Seluruh Surat Edaran</h3>
            <span className="text-xs text-slate-500">
              Menampilkan {suratItems.length} dokumen tersimpan
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
                {suratItems.map((circ) => {
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

      {/* Tab Content: Statistik Kunjungan */}
      {activeTab === 'analytics' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div>
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-violet-700" />
                  Statistik Kunjungan Portal Orang Tua
                </h3>

                <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
                  Menghitung kunjungan dari Google Sites / embed.
                  Pengunjung unik merupakan perkiraan berdasarkan browser/perangkat anonim,
                  bukan nama atau identitas orang tua.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  void loadVisitAnalytics()
                }
                disabled={
                  visitAnalyticsLoading
                }
                className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-60 text-xs font-bold text-slate-700 shrink-0"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${
                    visitAnalyticsLoading
                      ? 'animate-spin'
                      : ''
                  }`}
                />
                Refresh
              </button>
            </div>
          </div>

          {visitAnalyticsError ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
              <strong>Statistik belum dapat dimuat.</strong>
              <div className="mt-1 text-xs">
                {visitAnalyticsError}
              </div>
            </div>
          ) : visitAnalyticsLoading &&
            !visitStats ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-violet-700" />
              <p className="text-xs text-slate-500 mt-2">
                Memuat statistik...
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-white rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-700 flex items-center justify-center">
                      <Users className="w-4 h-4" />
                    </div>

                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      Semua Waktu
                    </span>
                  </div>

                  <div className="mt-3 text-2xl font-extrabold text-slate-950">
                    {visitStats?.unique_visitors ?? 0}
                  </div>

                  <div className="text-xs font-semibold text-slate-600">
                    Pengunjung Unik
                  </div>

                  <div className="text-[11px] text-slate-400 mt-1">
                    {visitStats?.total_visits ?? 0} total kunjungan
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                      <Eye className="w-4 h-4" />
                    </div>

                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      Hari Ini
                    </span>
                  </div>

                  <div className="mt-3 text-2xl font-extrabold text-slate-950">
                    {visitStats?.today_unique ?? 0}
                  </div>

                  <div className="text-xs font-semibold text-slate-600">
                    Pengunjung Hari Ini
                  </div>

                  <div className="text-[11px] text-slate-400 mt-1">
                    {visitStats?.today_visits ?? 0} kunjungan
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4" />
                    </div>

                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      7 Hari
                    </span>
                  </div>

                  <div className="mt-3 text-2xl font-extrabold text-slate-950">
                    {visitStats?.last_7_days_unique ?? 0}
                  </div>

                  <div className="text-xs font-semibold text-slate-600">
                    Pengunjung Unik
                  </div>

                  <div className="text-[11px] text-slate-400 mt-1">
                    {visitStats?.last_7_days_visits ?? 0} kunjungan
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                      <Globe2 className="w-4 h-4" />
                    </div>

                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      30 Hari
                    </span>
                  </div>

                  <div className="mt-3 text-2xl font-extrabold text-slate-950">
                    {visitStats?.last_30_days_unique ?? 0}
                  </div>

                  <div className="text-xs font-semibold text-slate-600">
                    Pengunjung Unik
                  </div>

                  <div className="text-[11px] text-slate-400 mt-1">
                    {visitStats?.last_30_days_visits ?? 0} kunjungan
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <div className="flex items-center justify-between gap-3 mb-5">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">
                      Aktivitas 14 Hari Terakhir
                    </h4>

                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Batang menunjukkan jumlah kunjungan harian dari Google Sites / embed.
                    </p>
                  </div>
                </div>

                {dailyVisitStats.length > 0 ? (
                  <div className="space-y-2.5">
                    {(() => {
                      const maxVisits = Math.max(
                        1,
                        ...dailyVisitStats.map(
                          (item) =>
                            Number(item.visits) || 0
                        )
                      );

                      return dailyVisitStats.map(
                        (item) => {
                          const visits =
                            Number(item.visits) || 0;

                          const uniqueVisitors =
                            Number(
                              item.unique_visitors
                            ) || 0;

                          const percent =
                            Math.max(
                              visits > 0 ? 4 : 0,
                              (visits /
                                maxVisits) *
                                100
                            );

                          const date =
                            new Date(
                              `${item.day}T00:00:00`
                            );

                          const label =
                            Number.isNaN(
                              date.getTime()
                            )
                              ? item.day
                              : date.toLocaleDateString(
                                  'id-ID',
                                  {
                                    day: '2-digit',
                                    month: 'short',
                                  }
                                );

                          return (
                            <div
                              key={item.day}
                              className="grid grid-cols-[62px_1fr_92px] sm:grid-cols-[80px_1fr_120px] gap-3 items-center"
                            >
                              <div className="text-[11px] font-semibold text-slate-500">
                                {label}
                              </div>

                              <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-violet-600"
                                  style={{
                                    width: `${percent}%`,
                                  }}
                                />
                              </div>

                              <div className="text-[11px] text-right text-slate-500">
                                <strong className="text-slate-800">
                                  {visits}
                                </strong>{' '}
                                visit · {uniqueVisitors} unik
                              </div>
                            </div>
                          );
                        }
                      );
                    })()}
                  </div>
                ) : (
                  <div className="py-10 text-center text-xs text-slate-500">
                    Belum ada data kunjungan yang tercatat.
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-[11px] sm:text-xs text-blue-950 leading-relaxed">
                <strong>Catatan:</strong> satu orang tua yang membuka dari HP dan laptop
                dapat dihitung sebagai dua pengunjung unik. Sebaliknya, beberapa orang yang
                memakai browser/perangkat yang sama dapat dihitung sebagai satu.
                Statistik ini cocok untuk melihat tingkat akses portal, bukan sebagai daftar hadir.
              </div>
            </>
          )}
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

      {/* Add / Edit Elementary Updates Modal */}
      {showElementaryUpdateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full my-auto max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
            <div className="bg-emerald-700 text-white p-4 px-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Newspaper className="w-5 h-5" />
                <h3 className="font-extrabold text-base">
                  {editingElementaryUpdate
                    ? 'Edit Elementary Update'
                    : 'Buat Elementary Update'}
                </h3>
              </div>

              <button
                type="button"
                onClick={closeElementaryUpdateModal}
                className="text-emerald-100 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleSaveElementaryUpdate}
              className="p-6 overflow-y-auto space-y-4 flex-1 text-xs sm:text-sm text-slate-800"
            >
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-xs text-emerald-950 leading-relaxed">
                <strong>Elementary Updates</strong> digunakan untuk
                headline kegiatan, project, prestasi siswa, dan cerita
                terbaru dari Elementary.
              </div>

              {updateMediaItems.length > 0 && (
                <div className="rounded-xl bg-blue-50 border border-blue-200 px-4 py-3 text-xs text-blue-950 flex items-start gap-2">
                  <span className="font-extrabold">Draft aman:</span>
                  <span>
                    {updateMediaItems.length} media sudah tersimpan. Draft tidak akan dihapus hanya karena berpindah tab.
                  </span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Headline / Judul *
                </label>

                <input
                  type="text"
                  required
                  value={updateTitle}
                  onChange={(e) =>
                    setUpdateTitle(e.target.value)
                  }
                  placeholder="Contoh: Grade 4 Memulai Project Eco Explorers"
                  className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Cerita / Update *
                </label>

                <textarea
                  rows={8}
                  required
                  value={updateContent}
                  onChange={(e) =>
                    setUpdateContent(e.target.value)
                  }
                  placeholder="Tuliskan highlight kegiatan, project, prestasi, atau cerita terbaru..."
                  className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 leading-relaxed"
                />

                <p className="text-[11px] text-slate-500 mt-1">
                  Paragraf pertama akan menjadi ringkasan/headline
                  yang terlihat di portal.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Foto / Video Kegiatan
                  <span className="font-normal text-slate-400">
                    {' '}(Opsional)
                  </span>
                </label>

                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 space-y-3">
                  {updateMediaItems.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {updateMediaItems.map(
                        (media) => (
                          <div
                            key={media.id}
                            className="relative rounded-xl overflow-hidden border border-slate-200 bg-white"
                          >
                            {media.type === 'video' ? (
                              <video
                                src={
                                  media.previewUrl
                                }
                                controls
                                preload="metadata"
                                playsInline
                                className="w-full h-48 object-contain bg-black"
                              />
                            ) : (
                              <img
                                src={
                                  media.previewUrl
                                }
                                alt={
                                  media.name
                                }
                                className="w-full h-48 object-cover"
                              />
                            )}

                            {media.url && (
                              <div className="absolute top-2 left-2 px-2 py-1 rounded-md bg-emerald-700/90 text-white text-[10px] font-bold">
                                Tersimpan
                              </div>
                            )}

                            <div className="p-2.5 flex items-center justify-between gap-2">
                              <div className="min-w-0 flex items-center gap-2">
                                {media.type === 'video' ? (
                                  <Film className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                                ) : (
                                  <ImageIcon className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                                )}

                                <span className="text-[11px] text-slate-600 truncate">
                                  {media.name}
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  removeElementaryMedia(
                                    media.id
                                  )
                                }
                                className="shrink-0 p-1.5 rounded-lg text-red-600 hover:bg-red-50"
                                title="Hapus media"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  )}

                  {updateMediaItems.length < 6 && (
                    <label className="flex flex-col items-center justify-center gap-2 py-6 cursor-pointer text-center">
                      <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                        <Images className="w-5 h-5" />
                      </div>

                      <div>
                        <p className="text-xs font-bold text-slate-800">
                          Upload foto atau video
                        </p>

                        <p className="text-[11px] text-slate-500 mt-1">
                          Maksimal 6 media • Foto 10 MB • Video 50 MB
                        </p>

                        <p className="text-[11px] text-slate-500">
                          JPG, PNG, WEBP, MP4, WEBM
                        </p>
                      </div>

                      <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs font-bold text-emerald-800">
                        {elementaryMediaUploading ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Upload className="w-3.5 h-3.5" />
                        )}
                        {elementaryMediaUploading
                          ? 'Mengunggah...'
                          : 'Pilih Foto / Video'}
                      </span>

                      <input
                        type="file"
                        multiple
                        disabled={
                          elementaryMediaUploading
                        }
                        accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
                        onChange={
                          handleElementaryMediaChange
                        }
                        className="hidden"
                      />
                    </label>
                  )}

                  {updateMediaItems.length >= 6 && (
                    <p className="text-center text-[11px] font-semibold text-slate-500 py-2">
                      Maksimal 6 media sudah dipilih.
                    </p>
                  )}
                </div>

                <p className="text-[11px] text-slate-500 mt-1">
                  Foto/video langsung disimpan ke Supabase saat dipilih, jadi tetap ada walaupun pindah tab atau refresh sebelum dipublikasikan.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Kelas / Fase Terkait
                </label>

                <div className="flex flex-wrap gap-1.5 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  {GRADE_OPTIONS.map((grade) => {
                    const isSelected =
                      updateGrades.includes(grade);

                    return (
                      <button
                        type="button"
                        key={grade}
                        onClick={() =>
                          toggleUpdateGradeSelection(
                            grade
                          )
                        }
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                          isSelected
                            ? 'bg-emerald-700 text-white shadow-xs'
                            : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        {grade}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tanggal Publikasi
                  </label>

                  <input
                    type="date"
                    value={updatePublishDate}
                    onChange={(e) =>
                      setUpdatePublishDate(
                        e.target.value
                      )
                    }
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tautan Tambahan (Opsional)
                  </label>

                  <input
                    type="url"
                    value={updateLink}
                    onChange={(e) =>
                      setUpdateLink(e.target.value)
                    }
                    placeholder="Google Drive, album foto, website, dll."
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900"
                  />
                </div>
              </div>

              <label className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={updateFeatured}
                  onChange={(e) =>
                    setUpdateFeatured(
                      e.target.checked
                    )
                  }
                  className="mt-0.5 w-4 h-4 accent-emerald-600"
                />

                <div>
                  <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                    <Pin className="w-3.5 h-3.5 text-emerald-700" />
                    Jadikan Featured Update
                  </div>

                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Gunakan untuk update yang ingin lebih
                    ditonjolkan kepada orang tua.
                  </p>
                </div>
              </label>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={closeElementaryUpdateModal}
                  className="px-4 py-2 bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-300"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={
                    elementaryMediaUploading
                  }
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl text-xs font-extrabold shadow-md inline-flex items-center gap-2"
                >
                  {elementaryMediaUploading && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  )}

                  {elementaryMediaUploading
                    ? 'Mengunggah Media...'
                    : editingElementaryUpdate
                      ? 'Simpan Perubahan'
                      : 'Publikasikan Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Info Terkini Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full my-auto max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
            <div className="bg-amber-400 text-slate-950 p-4 px-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Megaphone className="w-5 h-5" />
                <h3 className="font-extrabold text-base">
                  {editingInfo ? 'Edit Info Terkini' : 'Buat Info Terkini'}
                </h3>
              </div>

              <button
                type="button"
                onClick={closeInfoModal}
                className="text-slate-700 hover:text-slate-950 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleSaveInfo}
              className="p-6 overflow-y-auto space-y-4 flex-1 text-xs sm:text-sm text-slate-800"
            >
              <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-950 leading-relaxed">
                <strong>Info Terkini</strong> digunakan untuk informasi singkat kepada orang tua.
                Tidak memerlukan nomor surat atau format surat resmi.
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Judul Informasi *
                </label>
                <input
                  type="text"
                  required
                  value={infoTitle}
                  onChange={(e) => setInfoTitle(e.target.value)}
                  placeholder="Contoh: Informasi Kepulangan Siswa Hari Jumat"
                  className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pengantar / Isi Informasi *
                </label>
                <textarea
                  rows={6}
                  required
                  value={infoContent}
                  onChange={(e) => setInfoContent(e.target.value)}
                  placeholder="Ayah/Bunda, kami informasikan bahwa..."
                  className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 leading-relaxed"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Bisa ditulis langsung seperti pengantar WhatsApp kepada orang tua.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Flyer / Gambar Informasi
                  <span className="font-normal text-slate-400">
                    {' '}(Opsional)
                  </span>
                </label>

                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
                  {infoImagePreview ? (
                    <div className="space-y-3">
                      <div className="rounded-xl overflow-hidden border border-slate-200 bg-white">
                        <img
                          src={infoImagePreview}
                          alt="Preview flyer Info Terkini"
                          className="w-full max-h-[420px] object-contain bg-slate-50"
                        />
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-900 hover:bg-blue-950 text-white text-xs font-bold cursor-pointer">
                          <Upload className="w-3.5 h-3.5" />
                          Ganti Gambar
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={handleInfoImageChange}
                            className="hidden"
                          />
                        </label>

                        <button
                          type="button"
                          onClick={removeInfoImage}
                          className="px-3 py-2 rounded-lg border border-red-200 bg-white text-red-600 hover:bg-red-50 text-xs font-bold"
                        >
                          Hapus Gambar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center gap-2 py-6 cursor-pointer text-center">
                      <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                        <ImageIcon className="w-5 h-5" />
                      </div>

                      <div>
                        <p className="text-xs font-bold text-slate-800">
                          Upload flyer atau gambar informasi
                        </p>
                        <p className="text-[11px] text-slate-500 mt-1">
                          JPG, PNG, atau WEBP • maksimal 5 MB
                        </p>
                      </div>

                      <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs font-bold text-blue-900">
                        <Upload className="w-3.5 h-3.5" />
                        Pilih Gambar
                      </span>

                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleInfoImageChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                <p className="text-[11px] text-slate-500 mt-1">
                  Flyer akan tampil langsung pada kartu Info Terkini di portal orang tua.
                  Pilihan gambar juga disimpan sebagai draft browser sampai informasi dipublikasikan.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Sasaran Kelas / Fase *
                </label>
                <div className="flex flex-wrap gap-1.5 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  {GRADE_OPTIONS.map((grade) => {
                    const isSelected = infoGrades.includes(grade);

                    return (
                      <button
                        type="button"
                        key={grade}
                        onClick={() => toggleInfoGradeSelection(grade)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                          isSelected
                            ? 'bg-blue-900 text-white shadow-xs'
                            : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        {grade}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tanggal Publikasi
                  </label>
                  <input
                    type="date"
                    value={infoPublishDate}
                    onChange={(e) => setInfoPublishDate(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tautan Tambahan (Opsional)
                  </label>
                  <input
                    type="url"
                    value={infoLink}
                    onChange={(e) => setInfoLink(e.target.value)}
                    placeholder="Google Form, Drive, website, dll."
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900"
                  />
                </div>
              </div>

              <label className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={infoPinned}
                  onChange={(e) => setInfoPinned(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-amber-500"
                />

                <div>
                  <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                    <Pin className="w-3.5 h-3.5 text-amber-700" />
                    Tandai sebagai informasi penting
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Informasi penting akan mendapat penanda khusus di portal orang tua.
                  </p>
                </div>
              </label>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={closeInfoModal}
                  className="px-4 py-2 bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-300"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={infoUploading}
                  className="px-5 py-2 bg-amber-400 hover:bg-amber-500 disabled:opacity-60 disabled:cursor-not-allowed text-slate-950 rounded-xl text-xs font-extrabold shadow-md inline-flex items-center gap-2"
                >
                  {infoUploading && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  )}

                  {infoUploading
                    ? 'Mengunggah Flyer...'
                    : editingInfo
                      ? 'Simpan Perubahan'
                      : 'Publikasikan Info'}
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

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pengantar / Informasi Singkat
                </label>
                <textarea
                  rows={6}
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder={`Contoh:\nAssalamu'alaikum warahmatullahi wabarakatuh,\n\nDear Parents,\n\nKami informasikan bahwa...`}
                  className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-lg p-3 text-slate-900 leading-relaxed"
                />
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Teks ini akan tampil ketika orang tua membuka detail Surat Edaran.
                  Bisa berupa salam, latar belakang singkat, atau poin utama sebelum membuka lampiran.
                  Jika menulis URL seperti https://forms.gle/... link akan tetap dapat diklik di portal.
                </p>
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
