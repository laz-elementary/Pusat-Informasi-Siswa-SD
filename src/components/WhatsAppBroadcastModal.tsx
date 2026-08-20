import React, { useState } from 'react';
import { MessageSquare, Copy, Check, Send, Sparkles, RefreshCw, X, Smartphone, ArrowRight, Share2 } from 'lucide-react';
import { CircularLetter } from '../types';

interface WhatsAppBroadcastModalProps {
  isOpen: boolean;
  onClose: () => void;
  circular: CircularLetter | null;
  appUrl: string;
}

export const WhatsAppBroadcastModal: React.FC<WhatsAppBroadcastModalProps> = ({
  isOpen,
  onClose,
  circular,
  appUrl,
}) => {
  const [copied, setCopied] = useState(false);
  const [customText, setCustomText] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiTone, setAiTone] = useState<'ringkas' | 'santun' | 'urgent'>('santun');

  React.useEffect(() => {
    if (circular) {
      const shareUrl = `${appUrl || (typeof window !== 'undefined' ? window.location.origin : '')}?letter=${circular.id}`;
      const defaultText = circular.whatsappBroadcastText || `📢 *INFO RESMI SD LAZUARDI*
📌 *Perihal:* ${circular.title}
🏷️ *Kategori:* ${circular.category}
👥 *Sasaran:* ${circular.gradeLevels.join(', ')}

Ayah & Bunda yang kami hormati,
Surat edaran resmi nomor *${circular.nomorSurat}* telah diterbitkan. 

${circular.summary}

${circular.deadlineConfirmation ? `⏰ *Batas Waktu Konfirmasi:* ${circular.deadlineConfirmation}\n` : ''}📄 *Baca Lengkap & Konfirmasi Baca:*
${shareUrl}

Terima kasih atas perhatian dan kerjasama Ayah & Bunda. 🙏✨
_Lazuardi Global Compassionate School_`;

      setCustomText(defaultText);
    }
  }, [circular, appUrl]);

  if (!isOpen || !circular) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(customText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenWhatsApp = () => {
    const encoded = encodeURIComponent(customText);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  const handleRegenerateAI = async () => {
    setIsGeneratingAI(true);
    try {
      const res = await fetch('/api/ai/summarize-wa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: circular.title,
          content: circular.content,
          targetAudience: circular.gradeLevels.join(', '),
          tone: aiTone,
        }),
      });
      const data = await res.json();
      if (data.success && data.whatsappBroadcast) {
        const shareUrl = `${appUrl || (typeof window !== 'undefined' ? window.location.origin : '')}?letter=${circular.id}`;
        setCustomText(`${data.whatsappBroadcast}\n\n🔗 *Akses Surat Lengkap di Portal:* \n${shareUrl}`);
      }
    } catch (err) {
      console.error('AI summary error:', err);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-700/80 flex items-center justify-center border border-emerald-500/40 text-emerald-200">
              <MessageSquare className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="font-bold text-base">Format Siaran WhatsApp (Anti-Terselip)</h3>
              <p className="text-xs text-emerald-150 text-emerald-200">
                Pesan padat, rapi, dan langsung terhubung ke surat di Google Sites
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-emerald-200 hover:text-white hover:bg-emerald-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 bg-slate-50 text-slate-800">
          {/* AI Optimizer Bar */}
          <div className="bg-white border border-emerald-200 rounded-xl p-3 shadow-xs flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-900">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Optimasi Teks Siaran dengan AI:</span>
            </div>
            <div className="flex items-center gap-1.5">
              <select
                value={aiTone}
                onChange={(e) => setAiTone(e.target.value as any)}
                className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-slate-700 font-medium"
              >
                <option value="santun">Nada Santun & Hangat</option>
                <option value="ringkas">Super Ringkas (3 Poin)</option>
                <option value="urgent">Tegas & Segera</option>
              </select>
              <button
                onClick={handleRegenerateAI}
                disabled={isGeneratingAI}
                className="flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg shadow-xs transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingAI ? 'animate-spin' : ''}`} />
                {isGeneratingAI ? 'Merangkum...' : 'Buat Ulang'}
              </button>
            </div>
          </div>

          {/* WhatsApp Bubble Preview */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-600 font-medium px-1">
              <span className="flex items-center gap-1">
                <Smartphone className="w-3.5 h-3.5 text-slate-500" />
                Pratinjau Gelembung Chat WhatsApp
              </span>
              <span className="text-emerald-700 font-semibold text-[11px]">Siap Kirim ke Grup Orang Tua</span>
            </div>

            <div className="bg-[#EFEAE2] p-4 rounded-2xl border border-slate-300 relative overflow-hidden shadow-inner">
              {/* WhatsApp background doodle pattern effect */}
              <div className="bg-white rounded-2xl rounded-tl-xs p-4 shadow-md max-w-lg space-y-2 border border-emerald-100">
                <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-[11px] font-bold text-emerald-800 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    SD Lazuardi Info Resmi
                  </span>
                  <span className="text-[10px] text-slate-400">Hari ini</span>
                </div>

                <textarea
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  rows={9}
                  className="w-full text-xs font-sans text-slate-800 leading-relaxed bg-transparent border-0 focus:ring-0 focus:outline-none resize-none"
                  placeholder="Teks siaran WhatsApp..."
                />

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span>💡 Klik teks di atas jika ingin mengedit langsung</span>
                  <span className="text-emerald-600 font-medium">✓✓ Terbaca</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-white border-t border-slate-200 p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            Kirim ke grup WhatsApp kelas atau broadcast orang tua siswa.
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-semibold rounded-xl border border-slate-300 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Teks Tersalin!' : 'Salin Teks'}
            </button>
            <button
              onClick={handleOpenWhatsApp}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-md transition-colors"
            >
              <Share2 className="w-4 h-4" />
              Buka di WhatsApp
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
