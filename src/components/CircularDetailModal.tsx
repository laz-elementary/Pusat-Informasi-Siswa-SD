import React from 'react';
import { 
  Printer as PrintIcon, 
  Share2 as ShareIcon, 
  CheckCircle2 as CheckIcon,
  X as XIcon, 
  ExternalLink as ExtLinkIcon
} from 'lucide-react';
import { CircularLetter } from '../types';

interface CircularDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  circular: CircularLetter | null;
  appUrl: string;
}

export const CircularDetailModal: React.FC<CircularDetailModalProps> = ({
  isOpen,
  onClose,
  circular,
  appUrl,
}) => {
  const [copiedLink, setCopiedLink] = React.useState(false);

  if (!isOpen || !circular) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyDirectLink = () => {
    const url = `${appUrl || (typeof window !== 'undefined' ? window.location.origin : '')}?letter=${circular.id}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const formatPeruntukan = (grades: string[]) => {
    if (!grades || grades.length === 0) return 'Semua Kelas';
    if (grades.includes('Semua Kelas')) {
      return 'Semua Kelas';
    }
    return grades.join(', ');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full my-auto max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Modal Top Bar */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
              {circular.nomorSurat}
            </span>
            <span className="text-xs text-slate-300 hidden sm:inline">•</span>
            <span className="text-xs text-slate-300 hidden sm:inline">
              Untuk: {formatPeruntukan(circular.gradeLevels)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {circular.gdriveLink && (
              <a
                href={circular.gdriveLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1 rounded-lg flex items-center gap-1 transition-colors font-medium"
              >
                <ExtLinkIcon className="w-3.5 h-3.5" />
                <span>Buka di Google Drive</span>
              </a>
            )}
            <button
              onClick={handleCopyDirectLink}
              className="text-xs text-slate-300 hover:text-white px-2.5 py-1 bg-white/10 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
              title="Salin Tautan Langsung Surat Ini"
            >
              {copiedLink ? <CheckIcon className="w-3.5 h-3.5 text-emerald-400" /> : <ShareIcon className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Link Tersalin' : 'Salin Link'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="text-xs text-slate-300 hover:text-white px-2.5 py-1 bg-white/10 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
              title="Cetak Surat atau Simpan PDF"
            >
              <PrintIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cetak / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors ml-1 cursor-pointer"
            >
              <XIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body - School Letter Format */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6 bg-slate-50 text-slate-900 print:bg-white print:p-0">
          {/* Authentic Formal Letterhead (KOP SURAT) */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200 space-y-6">
            {/* Kop Surat Header */}
            <div className="border-b-2 border-slate-900 pb-4 text-center relative">
              <div className="flex items-center justify-between gap-4">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-blue-900 to-indigo-900 text-white font-black text-xl flex items-center justify-center shadow-md border-2 border-amber-400 shrink-0">
                  LZ
                </div>
                <div className="flex-1 text-center">
                  <h1 className="text-base sm:text-xl font-bold tracking-tight text-blue-950 uppercase">
                    YAYASAN LAZUARDI HAYATI
                  </h1>
                  <h2 className="text-sm sm:text-lg font-extrabold text-blue-900 uppercase tracking-wide">
                    SD LAZUARDI GLOBAL COMPASSIONATE SCHOOL
                  </h2>
                  <p className="text-[11px] sm:text-xs text-slate-600 font-medium">
                    NPSN: 20108921 • Terakreditasi "A" Unggul • Cambridge & Kurikulum Nasional
                  </p>
                  <p className="text-[10px] sm:text-[11px] text-slate-500">
                    Jl. Margonda Raya / Meruya Ilir, Telp: (021) 7788-9900 • Email: info@lazuardi.sch.id
                  </p>
                </div>
                <div className="w-14 sm:w-16 hidden sm:block" />
              </div>
              <div className="border-t border-slate-400 mt-3 pt-0.5" />
            </div>

            {/* Letter Metadata Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700 bg-slate-50/80 p-3.5 rounded-xl border border-slate-100">
              <div className="space-y-1">
                <div><span className="font-semibold text-slate-500 w-28 inline-block">Nomor Surat:</span> <span className="font-mono font-bold text-blue-900">{circular.nomorSurat}</span></div>
                <div><span className="font-semibold text-slate-500 w-28 inline-block">Peruntukan:</span> <span className="font-bold text-slate-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">{formatPeruntukan(circular.gradeLevels)}</span></div>
              </div>
              <div className="space-y-1 sm:text-right">
                <div><span className="font-semibold text-slate-500">Tanggal Terbit:</span> <span className="font-medium text-slate-900">{circular.publishDate}</span></div>
                <div><span className="font-semibold text-slate-500">Masa Berlaku:</span> <span className="font-medium text-slate-900">{circular.effectiveDate}</span></div>
              </div>
            </div>

            {/* Subject Title */}
            <div className="border-l-4 border-blue-900 pl-4 py-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Perihal:</span>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5 leading-snug">
                {circular.title}
              </h3>
            </div>

            {/* Letter Body Content */}
            <div className="prose prose-sm max-w-none text-slate-800 text-xs sm:text-sm leading-relaxed space-y-4 whitespace-pre-line border-t border-slate-100 pt-4">
              {circular.content}
            </div>

            {/* Google Drive Link Box if available */}
            {circular.gdriveLink && (
              <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    GDrive
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-bold text-emerald-950">
                      Tautan Dokumen Surat di Google Drive
                    </div>
                    <div className="text-[11px] text-emerald-700">
                      Klik tombol di samping untuk membuka atau mengunduh dokumen langsung dari Google Drive.
                    </div>
                  </div>
                </div>
                <a
                  href={circular.gdriveLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors shrink-0"
                >
                  <ExtLinkIcon className="w-3.5 h-3.5" />
                  Buka Google Drive
                </a>
              </div>
            )}

            {/* Official Signature and Stamp Box */}
            <div className="pt-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 border-t border-slate-200">
              <div className="text-xs text-slate-600 space-y-1">
                <div className="font-semibold text-slate-700">Tembusan Kepada:</div>
                <ul className="list-disc list-inside text-slate-500 space-y-0.5">
                  {circular.tembusan.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="text-center sm:text-right space-y-2 self-end">
                <div className="text-xs text-slate-600">Jakarta, {circular.publishDate}</div>
                <div className="text-xs font-bold text-slate-800">Kepala Sekolah / Pejabat Berwenang</div>
                
                {/* Simulated Official Stamp & Signature */}
                <div className="py-2 relative flex justify-end">
                  <div className="relative inline-block">
                    <div className="w-32 h-14 border-2 border-dashed border-emerald-600/40 rounded-lg bg-emerald-50/30 flex items-center justify-center text-emerald-800 font-serif italic text-xs">
                      [Tanda Tangan Digital]
                    </div>
                    <div className="absolute -top-1 -right-3 w-12 h-12 rounded-full border border-blue-700 text-blue-800 flex items-center justify-center text-[8px] font-bold uppercase rotate-12 opacity-85 bg-blue-50/90 shadow-xs">
                      SD LAZUARDI
                    </div>
                  </div>
                </div>

                <div className="text-xs font-extrabold text-blue-950 underline">{circular.signedBy}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="bg-white border-t border-slate-200 p-4 px-6 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            {circular.gdriveLink && (
              <a
                href={circular.gdriveLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors"
              >
                <ExtLinkIcon className="w-4 h-4" />
                <span>Buka di Google Drive</span>
              </a>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-medium rounded-xl transition-colors border border-slate-300 cursor-pointer"
            >
              Cetak Dokumen
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2 bg-blue-900 hover:bg-blue-950 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm transition-colors cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
