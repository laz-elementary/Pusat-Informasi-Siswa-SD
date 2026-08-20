import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, ExternalLink, Plus, Check, Copy, Info, Sparkles, RefreshCw
} from 'lucide-react';
import { SchoolEvent, CircularLetter } from '../types';

interface SchoolCalendarViewProps {
  events?: SchoolEvent[];
  circulars?: CircularLetter[];
  onOpenCircular?: (circular: CircularLetter) => void;
  calendarUrl?: string;
  onUpdateCalendarUrl?: (url: string) => void;
  isAdmin?: boolean;
}

export const SchoolCalendarView: React.FC<SchoolCalendarViewProps> = ({
  calendarUrl = 'https://calendar.google.com/calendar/embed?src=c_281c658374a1ec976b5e2339c5973e2ad2653a6fb84a37bbb408465908be3563%40group.calendar.google.com&ctz=Asia%2FJakarta',
}) => {
  const [copiedIcs, setCopiedIcs] = useState(false);
  const [copiedWeb, setCopiedWeb] = useState(false);
  const [calendarKey, setCalendarKey] = useState(0); // for reloading iframe

  // Extract calendar ID dynamically from URL or fallback
  let calendarId = 'c_281c658374a1ec976b5e2339c5973e2ad2653a6fb84a37bbb408465908be3563@group.calendar.google.com';
  try {
    const urlObj = new URL(calendarUrl);
    const srcParam = urlObj.searchParams.get('src');
    if (srcParam) {
      calendarId = decodeURIComponent(srcParam);
    }
  } catch {
    // fallback to default
  }
  
  // 1-Click direct subscribe to Google Calendar URL
  const googleSubscribeUrl = `https://calendar.google.com/calendar/render?cid=${encodeURIComponent(calendarId)}`;
  
  // Public iCal URL for iPhone / Apple Calendar / Outlook / Thunderbird
  const icalPublicUrl = `https://calendar.google.com/calendar/ical/${encodeURIComponent(calendarId)}/public/basic.ics`;

  const handleCopyIcs = () => {
    navigator.clipboard.writeText(icalPublicUrl);
    setCopiedIcs(true);
    setTimeout(() => setCopiedIcs(false), 2500);
  };

  const handleCopyWeb = () => {
    navigator.clipboard.writeText(calendarUrl);
    setCopiedWeb(true);
    setTimeout(() => setCopiedWeb(false), 2500);
  };

  return (
    <div className="space-y-5">
      {/* Calendar Header & Quick Subscribe Bar */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-900 text-amber-400 flex items-center justify-center font-bold shadow-xs border border-blue-800 shrink-0">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-base sm:text-lg text-slate-950">
              Kalender Akademik & Agenda Kegiatan
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Tersinkronisasi otomatis langsung dari Google Calendar SD Lazuardi
            </p>
          </div>
        </div>

        {/* Action Buttons for Parents & Staff */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Direct 1-Click Subscribe for Google Calendar */}
          <a
            href={googleSubscribeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-900 hover:bg-blue-950 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-all hover:scale-[1.02]"
            title="Tambahkan kalender ini ke Google Calendar di akun/HP Anda"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>+ Subscribe ke Google Calendar</span>
          </a>

          {/* Open full page in Google Calendar */}
          <a
            href={calendarUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl transition-colors border border-slate-200"
            title="Buka tampilan penuh di Google Calendar"
          >
            <ExternalLink className="w-3.5 h-3.5 text-slate-600" />
            <span>Buka Kalender</span>
          </a>

          {/* Copy iCal Link */}
          <button
            onClick={handleCopyIcs}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-xl transition-colors border border-slate-200"
            title="Salin tautan iCal (.ics) untuk Apple Calendar / iPhone / Outlook"
          >
            {copiedIcs ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
            <span>{copiedIcs ? 'Link iCal Tersalin' : 'Salin Link iCal'}</span>
          </button>
        </div>
      </div>

      {/* Guide Pill for Parents */}
      <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-4 flex items-start gap-3 text-xs text-amber-950">
        <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="font-bold">Tips untuk Orang Tua Murid:</strong> Klik tombol{' '}
          <span className="font-bold text-blue-900 bg-white px-1.5 py-0.5 rounded border border-amber-200">+ Subscribe ke Google Calendar</span>{' '}
          di atas agar semua agenda kegiatan sekolah, jadwal 3WC, evaluasi belajar, dan hari libur langsung otomatis muncul di kalender HP (Android / iPhone) Ayah & Bunda.
        </div>
      </div>

      {/* Google Calendar Interactive Embedded Container */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        {/* Frame Top Header */}
        <div className="bg-slate-900 text-white px-4 py-2.5 flex items-center justify-between border-b border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-semibold text-slate-200">Google Calendar Terhubung (WIB / Asia Jakarta)</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCalendarKey((prev) => prev + 1)}
              className="text-slate-300 hover:text-white px-2 py-1 bg-white/10 rounded flex items-center gap-1 transition-colors text-[11px]"
              title="Muat Ulang Kalender"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Muat Ulang</span>
            </button>
          </div>
        </div>

        {/* Embedded Iframe */}
        <div className="relative w-full h-[650px] sm:h-[750px] bg-slate-50">
          <iframe
            key={calendarKey}
            src={calendarUrl}
            title="Kalender Akademik SD Lazuardi"
            className="w-full h-full border-0"
            frameBorder="0"
            scrolling="no"
          />
        </div>
      </div>
    </div>
  );
};
