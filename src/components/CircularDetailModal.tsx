import React, { useEffect } from 'react';
import {
  X,
  CalendarDays,
  Users,
  ExternalLink,
  FileText,
} from 'lucide-react';
import { CircularLetter } from '../types';

interface CircularDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  circular: CircularLetter | null;
  appUrl?: string;
}

const formatDate = (value?: string) => {
  if (!value) return '';

  const date = new Date(
    value.includes('T')
      ? value
      : `${value}T00:00:00`
  );

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

const getTypeLabel = (
  circular: CircularLetter
) => {
  if (
    circular.tipeKonten ===
    'elementary_update'
  ) {
    return 'Elementary Updates';
  }

  if (circular.tipeKonten === 'info') {
    return 'Info Terkini';
  }

  return 'Surat Edaran';
};


const AutoLinkText: React.FC<{
  text: string;
}> = ({ text }) => {
  const urlRegex =
    /((?:https?:\/\/|www\.)[^\s<]+)/gi;

  const parts = text.split(urlRegex);

  return (
    <>
      {parts.map((part, index) => {
        const isUrl =
          /^(?:https?:\/\/|www\.)/i.test(
            part
          );

        if (!isUrl) {
          return (
            <React.Fragment
              key={`${index}-${part}`}
            >
              {part}
            </React.Fragment>
          );
        }

        // Tanda baca penutup kalimat tidak ikut link.
        const match = part.match(
          /^(.*?)([),.;!?]+)?$/
        );

        const rawUrl =
          match?.[1] ?? part;

        const trailing =
          match?.[2] ?? '';

        const href =
          rawUrl.startsWith('www.')
            ? `https://${rawUrl}`
            : rawUrl;

        return (
          <React.Fragment
            key={`${index}-${part}`}
          >
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-blue-700 underline decoration-blue-300 underline-offset-2 hover:text-blue-900 break-all"
            >
              {rawUrl}
            </a>
            {trailing}
          </React.Fragment>
        );
      })}
    </>
  );
};

export const CircularDetailModal: React.FC<
  CircularDetailModalProps
> = ({
  isOpen,
  onClose,
  circular,
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (
      event: KeyboardEvent
    ) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener(
      'keydown',
      handleKeyDown
    );

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      'hidden';

    return () => {
      document.removeEventListener(
        'keydown',
        handleKeyDown
      );

      document.body.style.overflow =
        previousOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen || !circular) {
    return null;
  }

  const typeLabel =
    getTypeLabel(circular);

  const targetText =
    circular.gradeLevels?.length > 0
      ? circular.gradeLevels.join(', ')
      : 'Semua Kelas';

  const isLetter =
    (circular.tipeKonten ?? 'surat') ===
    'surat';

  const bodyText =
    circular.content ||
    circular.summary ||
    '';

  return (
    <div
      className="fixed inset-0 z-[9999] bg-slate-950/55 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-4xl max-h-[92vh] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* HEADER SEDERHANA */}
        <div className="shrink-0 px-5 sm:px-7 py-4 border-b border-slate-200 bg-white flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
              <FileText className="w-4 h-4" />
              <span>
                {typeLabel}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ISI */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-5 sm:px-8 py-7 sm:py-9">
            {/* META */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500 mb-5">
              {circular.publishDate && (
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="w-4 h-4" />
                  {formatDate(
                    circular.publishDate
                  )}
                </span>
              )}

              <span className="inline-flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                {targetText}
              </span>

              {isLetter &&
                circular.nomorSurat && (
                  <span>
                    No.{' '}
                    <strong className="font-semibold text-slate-700">
                      {circular.nomorSurat}
                    </strong>
                  </span>
                )}
            </div>

            {/* JUDUL */}
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-950 leading-snug">
              {circular.title}
            </h1>

            {isLetter &&
              circular.effectiveDate && (
                <p className="mt-2 text-xs sm:text-sm text-slate-500">
                  Masa pelaksanaan:{' '}
                  <span className="font-semibold text-slate-700">
                    {
                      circular.effectiveDate
                    }
                  </span>
                </p>
              )}

            {/* FLYER INFO TERKINI */}
            {circular.imageUrl && (
              <div className="mt-6 rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                <img
                  src={
                    circular.imageUrl
                  }
                  alt={`Gambar ${circular.title}`}
                  className="w-full max-h-[650px] object-contain"
                />
              </div>
            )}

            {/* MEDIA ELEMENTARY UPDATE */}
            {circular.mediaItems &&
              circular.mediaItems.length >
                0 && (
                <div
                  className={`mt-6 grid gap-2 ${
                    circular.mediaItems
                      .length === 1
                      ? 'grid-cols-1'
                      : 'grid-cols-1 sm:grid-cols-2'
                  }`}
                >
                  {circular.mediaItems.map(
                    (media, index) => (
                      <div
                        key={`${media.url}-${index}`}
                        className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50"
                      >
                        {media.type ===
                        'video' ? (
                          <video
                            src={
                              media.url
                            }
                            controls
                            playsInline
                            preload="metadata"
                            className="w-full max-h-[500px] bg-black object-contain"
                          />
                        ) : (
                          <img
                            src={
                              media.url
                            }
                            alt={
                              media.name ||
                              `Foto ${index + 1}`
                            }
                            className="w-full max-h-[500px] object-contain"
                          />
                        )}
                      </div>
                    )
                  )}
                </div>
              )}

            {/* BODY */}
            {bodyText && (
              <div className="mt-7 pt-6 border-t border-slate-100">
                <div className="text-sm sm:text-[15px] text-slate-700 leading-7 whitespace-pre-line">
                  <AutoLinkText
                    text={bodyText}
                  />
                </div>
              </div>
            )}

            {/* ACTION REQUIRED */}
            {circular.actionRequired && (
              <div className="mt-6 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
                <p className="text-xs font-bold text-amber-900 mb-1">
                  Perlu diperhatikan
                </p>

                <p className="text-sm text-amber-950 whitespace-pre-line">
                  <AutoLinkText
                    text={
                      circular.actionRequired
                    }
                  />
                </p>
              </div>
            )}

            {/* LAMPIRAN / LINK */}
            {circular.gdriveLink && (
              <div className="mt-7 pt-5 border-t border-slate-100">
                <a
                  href={
                    circular.gdriveLink
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Buka Lampiran / Tautan
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
