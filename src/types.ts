export type CircularCategory =
  | 'Surat Edaran Resmi'
  | 'Agenda & Libur'
  | 'Field Trip & Outing'
  | 'Akademik & Ekskul'
  | 'Katering & Gizi'
  | 'Kesehatan & UKS'
  | 'Kegiatan Sekolah';

export type GradeLevel =
  | 'Semua Kelas'
  | 'Kelas 1'
  | 'Kelas 2'
  | 'Kelas 3'
  | 'Kelas 4'
  | 'Kelas 5'
  | 'Kelas 6'
  | 'Fase A'
  | 'Fase B'
  | 'Fase C';

export interface CircularAcknowledgement {
  id: string;
  circularId: string;
  parentName: string;
  studentName: string;
  studentClass: string;
  parentPhone?: string;
  timestamp: string;
  note?: string;
}

export interface CircularLetter {
  id: string;
  nomorSurat: string;
  title: string;

  tipeKonten?: 'surat' | 'info' | 'elementary_update';
  
  category?: CircularCategory | string;
  gradeLevels: string[]; // e.g. ['Semua Kelas'] or ['Kelas 1', 'Fase A']
  publishDate: string;
  effectiveDate: string;
  deadlineConfirmation?: string;
  urgency: 'normal' | 'penting' | 'segera';
  summary: string;
  content: string;
  actionRequired?: string;
  attachmentName?: string;
  attachmentSize?: string;
  attachmentType?: string;
  gdriveLink?: string; // Link Google Drive untuk melihat / mengunduh file asli
  signedBy: string;
  tembusan: string[];
  whatsappBroadcastText?: string;
  isPinned?: boolean;
  viewCount: number;
}

export type RecurrenceType = 'always' | 'daily' | 'weekly' | 'monthly';

export interface ScheduledReminder {
  id: string;
  title: string;
  message: string;
  recurrence: RecurrenceType;
  daysOfWeek?: number[]; // 0: Minggu, 1: Senin, 2: Selasa, 3: Rabu, 4: Kamis, 5: Jumat, 6: Sabtu
  dayOfMonth?: number; // 1-31
  timeInfo?: string; // e.g. "13.15 WIB (Setelah Sholat Jumat)"
  targetClass?: string; // e.g. "Kelas 5 & 6"
  locationInfo?: string; // e.g. "Pos 3 (Gerbang Barat)"
  priority: 'normal' | 'penting' | 'khusus';
  active: boolean;
  colorTheme?: 'amber' | 'blue' | 'emerald' | 'rose';
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: 'admin' | 'superadmin' | 'staff';
  loginTime: string;
}

export interface EmergencyAlert {
  id: string;
  title: string;
  message: string;
  type: 'warning' | 'info' | 'urgent';
  active: boolean;
  date: string;
  linkText?: string;
  linkCircularId?: string;
}

export interface SchoolEvent {
  id: string;
  title: string;
  date: string;
  endDate?: string;
  time: string;
  location: string;
  category: CircularCategory | 'Event Khusus';
  targetClass: string;
  description: string;
  relatedCircularId?: string;
}

export interface FilterState {
  search: string;
  category: string;
  gradeLevel: string;
  month: string;
  onlyUrgent: boolean;
  onlyUnread: boolean;
}
