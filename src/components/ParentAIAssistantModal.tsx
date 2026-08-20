import React, { useState } from 'react';
import { Bot, Send, Sparkles, X, User, ArrowRight, BookOpen, AlertCircle, HelpCircle } from 'lucide-react';
import { CircularLetter, SchoolEvent } from '../types';

interface ParentAIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  circulars: CircularLetter[];
  events: SchoolEvent[];
  onSelectCircular: (circular: CircularLetter) => void;
}

export const ParentAIAssistantModal: React.FC<ParentAIAssistantModalProps> = ({
  isOpen,
  onClose,
  circulars,
  events,
  onSelectCircular,
}) => {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string; time: string }>>([
    {
      role: 'assistant',
      text: 'Assalamu’alaikum Ayah & Bunda! Saya Asisten Virtual Pusat Informasi SD Lazuardi. Ada yang dapat saya bantu terkait surat edaran, agenda 3WC, field trip, katering, atau kegiatan sekolah lainnya?',
      time: 'Baru saja',
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const quickQuestions = [
    'Kapan pelaksanaan 3-Way Conference (3WC)?',
    'Apa saja yang perlu dibawa saat Field Trip ke Sentul?',
    'Apa saja kegiatan semarak kemerdekaan RI?',
    'Apakah ada program ekskul baru semester ini?',
  ];

  const handleSendMessage = async (queryText?: string) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim()) return;

    const userTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages((prev) => [...prev, { role: 'user', text: textToSend, time: userTime }]);
    setInputQuery('');
    setIsLoading(true);

    try {
      // Build context of active circulars and events
      const contextData = circulars.map((c) => ({
        nomorSurat: c.nomorSurat,
        judul: c.title,
        kategori: c.category,
        sasaran: c.gradeLevels,
        tanggalTerbit: c.publishDate,
        pelaksanaan: c.effectiveDate,
        ringkasan: c.summary,
        isi: c.content,
        tindakanOrangTua: c.actionRequired,
      }));

      const res = await fetch('/api/ai/ask-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: textToSend,
          activeCircularsContext: contextData,
        }),
      });

      const data = await res.json();
      const assistantText = data.answer || 'Mohon maaf, terjadi kendala saat memproses informasi. Ayah/Bunda dapat langsung membuka katalog surat di portal atau menghubungi Tata Usaha SD Lazuardi.';
      const resTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      setMessages((prev) => [...prev, { role: 'assistant', text: assistantText, time: resTime }]);
    } catch (err) {
      console.error('AI error:', err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: 'Informasi lengkap terkait pertanyaan Ayah/Bunda dapat dicek langsung pada surat edaran resmi yang terdaftar di halaman utama portal.',
          time: 'Baru saja',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[88vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-800 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-blue-950 flex items-center justify-center font-bold shadow-sm">
              <Bot className="w-6 h-6 text-blue-950" />
            </div>
            <div>
              <h3 className="font-bold text-base flex items-center gap-1.5">
                Tanya Asisten AI Lazuardi
                <span className="text-[10px] bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-400/30">
                  Gemini AI
                </span>
              </h3>
              <p className="text-xs text-blue-200">
                Pencarian instan & jawaban cerdas seputar edaran dan info sekolah
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-blue-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat History */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4 bg-slate-50">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-blue-900 text-amber-300 flex items-center justify-center text-xs shrink-0 shadow-xs">
                  <Bot className="w-4 h-4" />
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed shadow-xs ${
                  m.role === 'user'
                    ? 'bg-blue-700 text-white rounded-tr-xs'
                    : 'bg-white text-slate-800 border border-slate-200 rounded-tl-xs'
                }`}
              >
                <div className="whitespace-pre-line">{m.text}</div>
                <div
                  className={`text-[10px] mt-1.5 flex justify-end ${
                    m.role === 'user' ? 'text-blue-200' : 'text-slate-400'
                  }`}
                >
                  {m.time}
                </div>
              </div>
              {m.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-slate-700 text-white flex items-center justify-center text-xs shrink-0 shadow-xs">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-blue-900 text-amber-300 flex items-center justify-center text-xs shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-xs p-3.5 shadow-xs flex items-center gap-2 text-xs text-slate-600">
                <Sparkles className="w-4 h-4 text-amber-500 animate-spin" />
                <span>Mencari jawaban di database surat edaran SD Lazuardi...</span>
              </div>
            </div>
          )}
        </div>

        {/* Quick Suggestion Chips */}
        <div className="p-3 bg-white border-t border-slate-200 overflow-x-auto whitespace-nowrap space-x-1.5 flex items-center">
          <span className="text-[11px] text-slate-400 font-medium shrink-0 flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5" /> Contoh:
          </span>
          {quickQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(q)}
              className="text-xs bg-slate-100 hover:bg-blue-50 hover:text-blue-900 text-slate-700 px-3 py-1 rounded-full border border-slate-200 shrink-0 transition-colors"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input Field */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 flex items-center gap-2"
        >
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="Ketik pertanyaan Ayah/Bunda di sini..."
            className="flex-1 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-blue-700"
          />
          <button
            type="submit"
            disabled={isLoading || !inputQuery.trim()}
            className="px-4 py-2.5 bg-blue-900 hover:bg-blue-950 text-white rounded-xl font-semibold text-xs sm:text-sm shadow-sm transition-colors disabled:opacity-50 flex items-center gap-1"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Kirim</span>
          </button>
        </form>
      </div>
    </div>
  );
};
