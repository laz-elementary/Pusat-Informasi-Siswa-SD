import React, { useState } from 'react';
import { AlertTriangle, Info, Bell, X, ArrowRight, ChevronRight } from 'lucide-react';
import { EmergencyAlert, CircularLetter } from '../types';

interface EmergencyBannerProps {
  alerts: EmergencyAlert[];
  circulars: CircularLetter[];
  onOpenCircular: (circular: CircularLetter) => void;
}

export const EmergencyBanner: React.FC<EmergencyBannerProps> = ({
  alerts,
  circulars,
  onOpenCircular,
}) => {
  const activeAlerts = alerts.filter((a) => a.active);
  const [dismissed, setDismissed] = useState<Record<string, boolean>>({});

  if (activeAlerts.length === 0) return null;

  return (
    <div className="space-y-2">
      {activeAlerts.map((alert) => {
        if (dismissed[alert.id]) return null;

        const isUrgent = alert.type === 'warning' || alert.type === 'urgent';
        const linkedCirc = alert.linkCircularId
          ? circulars.find((c) => c.id === alert.linkCircularId)
          : null;

        return (
          <div
            key={alert.id}
            className={`rounded-2xl p-3.5 sm:p-4 border shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              isUrgent
                ? 'bg-amber-500/10 border-amber-300 text-amber-950'
                : 'bg-blue-50 border-blue-200 text-blue-950'
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                  isUrgent ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-blue-700 text-white'
                }`}
              >
                {isUrgent ? <AlertTriangle className="w-4 h-4" /> : <Info className="w-4 h-4" />}
              </div>
              <div className="text-xs sm:text-sm space-y-0.5">
                <div className="font-bold flex items-center gap-2">
                  <span>{alert.title}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/5 font-mono text-slate-600">
                    {alert.date}
                  </span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">{alert.message}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              {linkedCirc && (
                <button
                  onClick={() => onOpenCircular(linkedCirc)}
                  className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 bg-blue-900 hover:bg-blue-950 text-white rounded-lg transition-colors shadow-xs"
                >
                  <span>{alert.linkText || 'Lihat Surat Terkait'}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() => setDismissed((prev) => ({ ...prev, [alert.id]: true }))}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-black/5 transition-colors"
                title="Tutup Pesan Ini"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
