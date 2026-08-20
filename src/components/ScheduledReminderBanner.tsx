import React, { useState } from 'react';
import { 
  Bell, Calendar, Clock, MapPin, Users, CheckCircle, Sparkles, ChevronRight, X 
} from 'lucide-react';
import { ScheduledReminder } from '../types';

interface ScheduledReminderBannerProps {
  reminders: ScheduledReminder[];
}

const DAY_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

export const ScheduledReminderBanner: React.FC<ScheduledReminderBannerProps> = ({
  reminders,
}) => {
  const actualDay = new Date().getDay(); // 0-6
  const actualDate = new Date().getDate(); // 1-31

  // Allow simulating day to test Friday reminder easily
  const [simulatedDay, setSimulatedDay] = useState<number | null>(null);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  const activeDay = simulatedDay !== null ? simulatedDay : actualDay;

  // Filter reminders active for the current/simulated day
  const activeReminders = reminders.filter((rem) => {
    if (!rem.active || dismissedIds.includes(rem.id)) return false;

    if (rem.recurrence === 'always') return true;

    if (rem.recurrence === 'daily') {
      if (rem.daysOfWeek && rem.daysOfWeek.length > 0) {
        return rem.daysOfWeek.includes(activeDay);
      }
      return true;
    }

    if (rem.recurrence === 'weekly') {
      return rem.daysOfWeek?.includes(activeDay);
    }

    if (rem.recurrence === 'monthly') {
      return rem.dayOfMonth === actualDate;
    }

    return false;
  });

  const handleDismiss = (id: string) => {
    setDismissedIds((prev) => [...prev, id]);
  };

  return (
    <div className="space-y-2">
      {/* Simulation Bar for Testing / Checking Day-Specific Reminders */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 py-0.5 text-xs text-slate-500">
        <div className="flex items-center gap-1.5 font-medium">
          <Calendar className="w-3.5 h-3.5 text-blue-900" />
          <span>
            Hari Aktif: <strong className="text-slate-800">{DAY_NAMES[activeDay]}</strong>
          </span>
          {simulatedDay !== null && (
            <span className="text-[10px] bg-amber-100 text-amber-900 px-2 py-0.2 rounded-full font-bold border border-amber-300">
              (Mode Simulasi Hari)
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <span className="text-[11px] text-slate-400 mr-1 hidden sm:inline">Uji Tampilan:</span>
          <button
            onClick={() => setSimulatedDay(null)}
            className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold transition-colors ${
              simulatedDay === null
                ? 'bg-blue-900 text-white'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            Hari Ini ({DAY_NAMES[actualDay]})
          </button>
          <button
            onClick={() => setSimulatedDay(5)}
            className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold transition-colors ${
              simulatedDay === 5
                ? 'bg-amber-500 text-slate-950 ring-1 ring-amber-600'
                : 'bg-amber-100 hover:bg-amber-200 text-amber-900'
            }`}
            title="Coba lihat pengingat khusus hari Jumat"
          >
            🔔 Hari Jumat (Pos 3)
          </button>
          <button
            onClick={() => setSimulatedDay(1)}
            className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold transition-colors ${
              simulatedDay === 1
                ? 'bg-blue-900 text-white'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            Senin
          </button>
        </div>
      </div>

      {/* Render Active Reminders */}
      {activeReminders.length > 0 ? (
        activeReminders.map((rem) => {
          const isAmber = rem.colorTheme === 'amber' || rem.priority === 'penting';
          return (
            <div
              key={rem.id}
              className={`rounded-2xl p-4 sm:p-5 border transition-all shadow-sm relative overflow-hidden ${
                isAmber
                  ? 'bg-amber-50 border-amber-300 text-amber-950 ring-1 ring-amber-400/40'
                  : 'bg-blue-50 border-blue-200 text-blue-950'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3.5">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0 mt-0.5 shadow-xs ${
                      isAmber
                        ? 'bg-amber-500 text-slate-950 border border-amber-600/30'
                        : 'bg-blue-600 text-white'
                    }`}
                  >
                    <Bell className="w-5 h-5 animate-bounce" />
                  </div>

                  <div className="space-y-1.5">
                    {/* Header tags */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ${
                          isAmber
                            ? 'bg-amber-200/80 text-amber-900 border-amber-300'
                            : 'bg-blue-200/80 text-blue-900 border-blue-300'
                        }`}
                      >
                        {rem.recurrence === 'weekly'
                          ? `Pengingat Khusus ${DAY_NAMES[activeDay]}`
                          : 'Pengingat Harian'}
                      </span>

                      {rem.targetClass && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white text-slate-800 border border-slate-200">
                          {rem.targetClass}
                        </span>
                      )}

                      {rem.timeInfo && (
                        <span className="text-[11px] font-medium text-slate-600 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          {rem.timeInfo}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="font-bold text-base sm:text-lg text-slate-950 leading-snug">
                      {rem.title}
                    </h3>

                    {/* Description */}
                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed max-w-3xl">
                      {rem.message}
                    </p>

                    {/* Location or Action pill */}
                    {rem.locationInfo && (
                      <div className="pt-1 flex items-center gap-1 text-xs font-bold text-slate-900">
                        <MapPin className="w-4 h-4 text-amber-600" />
                        <span>Lokasi / Titik Jemput: </span>
                        <span className="bg-white px-2 py-0.5 rounded-lg border border-amber-300 text-amber-900">
                          {rem.locationInfo}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleDismiss(rem.id)}
                  title="Tutup pengingat ini"
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-black/5 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })
      ) : (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-500 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>Tidak ada pengingat khusus penjemputan untuk hari {DAY_NAMES[activeDay]}.</span>
          </div>
          <button
            onClick={() => setSimulatedDay(5)}
            className="text-blue-900 font-bold hover:underline"
          >
            Lihat contoh pengingat Jumat (Pos 3) &rarr;
          </button>
        </div>
      )}
    </div>
  );
};
