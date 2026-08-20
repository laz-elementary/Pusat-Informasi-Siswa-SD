import React from 'react';
import {
  BellRing,
  CalendarDays,
  CheckCircle2,
  Clock3,
  MapPin,
  Users,
} from 'lucide-react';

import { ScheduledReminder } from '../types';

interface ScheduledReminderBannerProps {
  reminders: ScheduledReminder[];
}

const DAY_NAMES = [
  'Minggu',
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
];

const normalizeText = (value: unknown) =>
  String(value ?? '')
    .trim()
    .toLowerCase();

const getJakartaNow = () => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
  }).formatToParts(new Date());

  const getPart = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? '';

  const year = Number(getPart('year'));
  const month = Number(getPart('month'));
  const day = Number(getPart('day'));

  const weekdayShort = getPart('weekday').toLowerCase();

  const weekdayMap: Record<string, number> = {
    sun: 0,
    mon: 1,
    tue: 2,
    wed: 3,
    thu: 4,
    fri: 5,
    sat: 6,
  };

  const weekday = weekdayMap[weekdayShort] ?? new Date().getDay();

  return {
    year,
    month,
    day,
    weekday,
    dateKey: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(
      2,
      '0'
    )}`,
  };
};

const toDateKey = (value: unknown): string => {
  if (!value) return '';

  const raw = String(value).trim();

  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
    return raw.slice(0, 10);
  }

  const parsed = new Date(raw);

  if (Number.isNaN(parsed.getTime())) return '';

  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(parsed);
};

const normalizeDayValue = (value: unknown): number | null => {
  if (typeof value === 'number' && value >= 0 && value <= 6) {
    return value;
  }

  const raw = normalizeText(value);

  const numeric = Number(raw);
  if (!Number.isNaN(numeric) && numeric >= 0 && numeric <= 6) {
    return numeric;
  }

  const dayMap: Record<string, number> = {
    minggu: 0,
    sunday: 0,
    sun: 0,

    senin: 1,
    monday: 1,
    mon: 1,

    selasa: 2,
    tuesday: 2,
    tue: 2,

    rabu: 3,
    wednesday: 3,
    wed: 3,

    kamis: 4,
    thursday: 4,
    thu: 4,

    jumat: 5,
    "jum'at": 5,
    friday: 5,
    fri: 5,

    sabtu: 6,
    saturday: 6,
    sat: 6,
  };

  return dayMap[raw] ?? null;
};

const getReminderField = (reminder: any, keys: string[]) => {
  for (const key of keys) {
    if (
      reminder?.[key] !== undefined &&
      reminder?.[key] !== null &&
      reminder?.[key] !== ''
    ) {
      return reminder[key];
    }
  }

  return undefined;
};

const isReminderActive = (reminder: any) => {
  if (reminder?.isActive === false) return false;
  if (reminder?.active === false) return false;
  if (reminder?.enabled === false) return false;

  const status = normalizeText(reminder?.status);

  if (
    ['inactive', 'nonaktif', 'disabled', 'off', 'draft'].includes(status)
  ) {
    return false;
  }

  return true;
};

const isReminderForToday = (
  reminder: ScheduledReminder,
  today: ReturnType<typeof getJakartaNow>
) => {
  const item = reminder as any;

  if (!isReminderActive(item)) return false;

  const startDate = toDateKey(
    getReminderField(item, ['startDate', 'start_date'])
  );

  const endDate = toDateKey(
    getReminderField(item, ['endDate', 'end_date'])
  );

  if (startDate && today.dateKey < startDate) return false;
  if (endDate && today.dateKey > endDate) return false;

  const recurrence = normalizeText(
    getReminderField(item, [
      'recurrenceType',
      'recurrence',
      'repeat',
      'frequency',
      'scheduleType',
    ])
  );

  const specificDate = toDateKey(
    getReminderField(item, [
      'date',
      'scheduledDate',
      'targetDate',
      'reminderDate',
    ])
  );

  if (
    recurrence === 'always' ||
    recurrence === 'daily' ||
    recurrence === 'setiap hari'
  ) {
    return true;
  }

  if (recurrence === 'weekly' || recurrence === 'mingguan') {
    const rawDays = getReminderField(item, [
      'daysOfWeek',
      'weekDays',
      'weekdays',
      'days',
      'dayOfWeek',
      'weekday',
      'weeklyDay',
    ]);

    const days = Array.isArray(rawDays) ? rawDays : [rawDays];

    return days
      .map(normalizeDayValue)
      .filter((day): day is number => day !== null)
      .includes(today.weekday);
  }

  if (recurrence === 'monthly' || recurrence === 'bulanan') {
    const rawDay = getReminderField(item, [
      'dayOfMonth',
      'dateOfMonth',
      'monthlyDay',
    ]);

    const dayOfMonth = Number(rawDay);

    if (!Number.isNaN(dayOfMonth) && dayOfMonth > 0) {
      return dayOfMonth === today.day;
    }

    if (specificDate) {
      return Number(specificDate.slice(8, 10)) === today.day;
    }

    return false;
  }

  if (specificDate) {
    return specificDate === today.dateKey;
  }

  const rawDays = getReminderField(item, [
    'daysOfWeek',
    'weekDays',
    'weekdays',
    'days',
    'dayOfWeek',
    'weekday',
  ]);

  if (rawDays !== undefined) {
    const days = Array.isArray(rawDays) ? rawDays : [rawDays];

    return days
      .map(normalizeDayValue)
      .filter((day): day is number => day !== null)
      .includes(today.weekday);
  }

  // Jika admin membuat reminder tanpa aturan hari/tanggal,
  // reminder dianggap berlaku setiap hari selama statusnya aktif.
  return true;
};

const asDisplayText = (value: unknown): string => {
  if (Array.isArray(value)) {
    return value.filter(Boolean).join(', ');
  }

  return String(value ?? '').trim();
};

const getRecurrenceLabel = (
  reminder: ScheduledReminder,
  dayName: string
) => {
  const item = reminder as any;

  const recurrence = normalizeText(
    getReminderField(item, [
      'recurrenceType',
      'recurrence',
      'repeat',
      'frequency',
      'scheduleType',
    ])
  );

  if (recurrence === 'weekly' || recurrence === 'mingguan') {
    return `Mingguan · Setiap ${dayName}`;
  }

  if (recurrence === 'monthly' || recurrence === 'bulanan') {
    return 'Pengingat Bulanan';
  }

  if (recurrence === 'daily' || recurrence === 'setiap hari') {
    return 'Pengingat Harian';
  }

  if (recurrence === 'always') {
    return 'Pengingat Aktif';
  }

  return `Pengingat ${dayName}`;
};

export const ScheduledReminderBanner: React.FC<
  ScheduledReminderBannerProps
> = ({ reminders }) => {
  const today = getJakartaNow();
  const todayName = DAY_NAMES[today.weekday];

  const todayReminders = (reminders ?? []).filter((reminder) =>
    isReminderForToday(reminder, today)
  );

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-slate-600">
        <CalendarDays className="w-4 h-4 text-blue-900" />
        <span>
          Hari Aktif:{' '}
          <strong className="text-slate-900">{todayName}</strong>
        </span>
      </div>

      {todayReminders.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />

          <p className="text-sm text-slate-600">
            Tidak ada pengingat khusus untuk hari {todayName}.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {todayReminders.map((reminder, index) => {
            const item = reminder as any;

            const title = asDisplayText(
              getReminderField(item, [
                'title',
                'name',
                'label',
                'reminderTitle',
              ])
            );

            const message = asDisplayText(
              getReminderField(item, [
                'message',
                'description',
                'content',
                'note',
                'notes',
              ])
            );

            const time = asDisplayText(
              getReminderField(item, [
                'time',
                'reminderTime',
                'startTime',
                'scheduledTime',
              ])
            );

            const location = asDisplayText(
              getReminderField(item, [
                'location',
                'locationText',
                'place',
              ])
            );

            const audience = asDisplayText(
              getReminderField(item, [
                'gradeLevels',
                'targetGrades',
                'grades',
                'targetClasses',
                'classes',
                'target',
                'audience',
              ])
            );

            const id =
              asDisplayText(item?.id) ||
              `${today.dateKey}-${index}`;

            return (
              <article
                key={id}
                className="bg-amber-50 border border-amber-200 rounded-2xl px-4 sm:px-5 py-4 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0">
                    <BellRing className="w-5 h-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className="inline-flex items-center rounded-full border border-amber-300 bg-white px-2.5 py-1 text-[10px] sm:text-xs font-bold uppercase tracking-wide text-amber-800">
                        {getRecurrenceLabel(reminder, todayName)}
                      </span>

                      {audience && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] sm:text-xs font-semibold text-slate-600">
                          <Users className="w-3.5 h-3.5" />
                          {audience}
                        </span>
                      )}
                    </div>

                    <h3 className="font-extrabold text-slate-900 text-sm sm:text-base leading-snug">
                      {title || 'Pengingat Sekolah'}
                    </h3>

                    {message && (
                      <p className="mt-1 text-sm text-slate-700 leading-relaxed">
                        {message}
                      </p>
                    )}

                    {(time || location) && (
                      <div className="flex flex-wrap gap-x-5 gap-y-2 mt-3 text-xs sm:text-sm">
                        {time && (
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <Clock3 className="w-4 h-4 text-blue-900" />
                            <span>{time} WIB</span>
                          </div>
                        )}

                        {location && (
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <MapPin className="w-4 h-4 text-amber-700" />
                            <span>{location}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};
