import React from 'react';
import { 
  Calendar, ChevronRight, ExternalLink, Pin, FileText
} from 'lucide-react';
import { CircularLetter } from '../types';

interface CircularCardProps {
  circular: CircularLetter;
  onOpenDetail: (circ: CircularLetter) => void;
}

export const CircularCard: React.FC<CircularCardProps> = ({
  circular,
  onOpenDetail,
}) => {
  // Format peruntukan agar ringkas: jika 'Semua Kelas', tulis 'Semua Kelas' saja (jangan dobel 'Semua Kelas, Kelas 1, Kelas 2...')
  const formatPeruntukan = (grades: string[]) => {
    if (!grades || grades.length === 0) return 'Semua Kelas';
    if (grades.includes('Semua Kelas')) {
      return 'Semua Kelas';
    }
    return grades.join(', ');
  };

  return (
    <div
      className={`group bg-white rounded-2xl border transition-all duration-150 flex flex-col justify-between hover:shadow-md ${
        circular.isPinned
          ? 'border-amber-300 ring-1 ring-amber-300/50'
          : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      <div className="p-5 space-y-3">
        {/* Top Info: Tanggal & Nomor Surat */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-mono text-xs font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
              {circular.nomorSurat}
            </span>

            {circular.isPinned && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                <Pin className="w-2.5 h-2.5" /> Disematkan
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 text-xs text-slate-400">
            <Calendar className="w-3.5 h-3.5" />
            <span>{circular.publishDate}</span>
          </div>
        </div>

        {/* Title - Clean, Prominent */}
        <h3
          onClick={() => onOpenDetail(circular)}
          className="font-bold text-base sm:text-lg text-slate-900 group-hover:text-blue-900 transition-colors cursor-pointer leading-snug"
        >
          {circular.title}
        </h3>

        {/* Short & Clean Summary */}
        <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed">
          {circular.summary}
        </p>

        {/* Peruntukan Sesuai Sasaran Kelas / Fase */}
        <div className="text-xs text-slate-500 pt-1">
          <span className="font-medium text-slate-400">Untuk: </span>
          <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
            {formatPeruntukan(circular.gradeLevels)}
          </span>
        </div>
      </div>

      {/* Footer Action: Baca Selengkapnya & Link Google Drive */}
      <div className="px-5 pb-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        {circular.gdriveLink ? (
          <a
            href={circular.gdriveLink}
            target="_blank"
            rel="noopener noreferrer"
            title="Buka Dokumen di Google Drive"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-xl border border-emerald-200 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
            <span>Google Drive</span>
          </a>
        ) : (
          <div className="w-1" />
        )}

        <button
          onClick={() => onOpenDetail(circular)}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-900 hover:bg-blue-950 rounded-xl transition-colors shadow-xs ml-auto"
        >
          <span>Baca Selengkapnya</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
