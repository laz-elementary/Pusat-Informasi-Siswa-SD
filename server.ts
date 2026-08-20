import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Helper to get GoogleGenAI client
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
  });
});

// AI Draft Circular Generator
app.post("/api/ai/draft-circular", async (req, res) => {
  try {
    const { title, targetAudience, keyPoints, category, urgency, tone } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      // Fallback generator when API key is not yet set
      const fallbackCircular = {
        title: title || "Surat Pemberitahuan Kegiatan Sekolah",
        nomorSurat: `0${Math.floor(Math.random() * 80 + 10)}/ED-SD-LAZ/${new Date().getMonth() + 1}/${new Date().getFullYear()}`,
        summary: `Pemberitahuan resmi kepada ${targetAudience || "seluruh orang tua/wali murid"} terkait ${title || "kegiatan penting sekolah"}.`,
        content: `Assalamu’alaikum Warahmatullahi Wabarakatuh,\n\nSalam sejahtera bagi kita semua. Semoga Ayah dan Bunda senantiasa dalam keadaan sehat dan dilimpahi keberkahan.\n\nSehubungan dengan agenda akademik dan pengembangan karakter siswa di SD Lazuardi, bersama ini kami sampaikan informasi mengenai ${title || "kegiatan sekolah"}:\n\n${keyPoints || "1. Pelaksanaan kegiatan akan dimulai tepat waktu.\n2. Siswa diharapkan mengenakan seragam rapi.\n3. Mohon konfirmasi kehadiran melalui portal orang tua."}\n\nDemikian surat edaran ini kami sampaikan. Atas perhatian, kerjasama, dan dukungan penuh Ayah/Bunda, kami ucapkan terima kasih yang sebesar-besarnya.\n\nWassalamu’alaikum Warahmatullahi Wabarakatuh.`,
        whatsappBroadcast: `📢 *INFO RESMI SD LAZUARDI*\n📌 *Perihal:* ${title || "Pemberitahuan Kegiatan"}\n👥 *Sasaran:* ${targetAudience || "Orang Tua/Wali Murid"}\n\nAyah/Bunda yang berbahagia, berikut poin penting surat edaran terbaru:\n• ${keyPoints ? keyPoints.replace(/\n/g, "\n• ") : "Harap perhatikan jadwal dan persiapan ananda."}\n\n📄 *Surat Resmi & Konfirmasi Baca:* Silakan buka portal informasi orang tua untuk membaca detail & melakukan tanda terima digital.`,
        actionRequired: "Konfirmasi Baca & Tanda Terima Digital",
      };
      return res.json({ success: true, data: fallbackCircular, isFallback: true });
    }

    const prompt = `Anda adalah asisten administrasi sekolah SD Lazuardi (sekolah berkarakter compassionate & inklusif).
Buatlah draf Surat Edaran resmi sekolah dan ringkasan siaran WhatsApp yang ramah, sopan, jelas, dan memikat untuk orang tua murid.

Detail Informasi:
- Judul/Perihal: ${title || "Pemberitahuan Kegiatan Sekolah"}
- Sasaran Jenjang/Kelas: ${targetAudience || "Seluruh Orang Tua / Wali Murid"}
- Kategori: ${category || "Surat Edaran Resmi"}
- Tingkat Urgensi: ${urgency || "Normal"}
- Nada Bahasa (Tone): ${tone || "Hangat, santun, profesional (khas Lazuardi Compassionate School)"}
- Poin-poin Utama / Catatan: ${keyPoints || "Pelaksanaan kegiatan dan koordinasi orang tua"}

Format output JSON dengan field:
{
  "nomorSurat": "contoh: 042/ED-SD-LAZ/X/2026",
  "title": "Judul resmi surat edaran",
  "summary": "Ringkasan 1-2 kalimat tujuan surat",
  "content": "Isi lengkap surat formal sekolah diawali salam (Assalamu'alaikum Warahmatullahi Wabarakatuh / Salam sejahtera), isi terstruktur rapi, dan penutup",
  "whatsappBroadcast": "Teks ringkas siap broadcast WA dengan format tebal (*), poin (•), emoji yang proporsional, dan ajakan cek link portal",
  "actionRequired": "Tindakan yang diharapkan dari orang tua (misal: Konfirmasi Baca / Pengembalian Form / Pembayaran / dll)"
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error("AI Draft error:", error);
    res.status(500).json({ success: false, error: error.message || "Gagal membuat draf dengan AI" });
  }
});

// AI WhatsApp Summarizer
app.post("/api/ai/summarize-wa", async (req, res) => {
  try {
    const { title, content, targetAudience } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      const waText = `📢 *INFO SURAT EDARAN SD LAZUARDI*\n*${title || "Pengumuman Sekolah"}*\nUntuk: ${targetAudience || "Orang Tua Siswa"}\n\nAyah/Bunda yang kami hormati, informasi lengkap telah diunggah ke Portal Informasi Orang Tua. Mohon membaca dan memberikan konfirmasi baca pada sistem.\n\n🔗 Akses surat di portal sekolah. Terima kasih!`;
      return res.json({ success: true, whatsappBroadcast: waText, isFallback: true });
    }

    const prompt = `Ubah isi surat edaran sekolah SD Lazuardi berikut menjadi pesan broadcast WhatsApp yang sangat ringkas, padat, menarik, dan tidak membuat orang tua bosan membaca:

Judul: ${title}
Sasaran: ${targetAudience}
Isi Dokumen:
${content}

Aturan format:
1. Gunakan emoji secara proporsional.
2. Sorot tanggal, waktu, atau batas akhir konfirmasi dengan huruf tebal *.
3. Buat 3-4 butir poin penting maksimal.
4. Sertakan penutup sopan dan ajakan membuka portal informasi untuk detail surat lengkap & tanda terima digital.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
    });

    res.json({ success: true, whatsappBroadcast: response.text });
  } catch (error: any) {
    console.error("AI WA Summarizer error:", error);
    res.status(500).json({ success: false, error: error.message || "Gagal merangkum teks WA" });
  }
});

// AI Parent Q&A Assistant regarding school circulars and announcements
app.post("/api/ai/ask-assistant", async (req, res) => {
  try {
    const { query, activeCircularsContext } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      return res.json({
        success: true,
        answer: "Asisten AI siap membantu menjawab pertanyaan seputar surat edaran dan kegiatan SD Lazuardi. Silakan pastikan kunci API terhubung atau gunakan fitur pencarian langsung di katalog surat.",
        isFallback: true,
      });
    }

    const prompt = `Anda adalah Asisten Virtual Pusat Informasi Orangtua SD Lazuardi (Lazuardi Global Compassionate School).
Tugas Anda adalah menjawab pertanyaan Ayah/Bunda (orang tua murid) dengan bahasa yang sangat santun, ramah, jelas, dan akurat berdasarkan informasi surat edaran dan agenda yang tersedia di bawah ini.

Daftar Surat Edaran & Agenda Aktif Saat Ini:
${JSON.stringify(activeCircularsContext || [], null, 2)}

Pertanyaan Orang Tua: "${query}"

Jawablah dengan hangat khas Lazuardi. Jika info spesifik tidak tercantum di surat yang ada, sarankan dengan ramah untuk menghubungi Hotline Tata Usaha / Wali Kelas.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
    });

    res.json({ success: true, answer: response.text });
  } catch (error: any) {
    console.error("AI QA error:", error);
    res.status(500).json({ success: false, error: error.message || "Gagal memproses pertanyaan" });
  }
});

// Vite middleware setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Pusat Informasi Orangtua SD Lazuardi running on http://localhost:${PORT}`);
  });
}

startServer();
