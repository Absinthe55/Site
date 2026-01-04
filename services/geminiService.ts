import { GoogleGenAI } from "@google/genai";

// Initialize safely to prevent crash if API key is missing during deployment
const apiKey = process.env.API_KEY || '';

// Lazy initialization logic
const getAiClient = () => {
    try {
        if(apiKey) return new GoogleGenAI({ apiKey });
    } catch (e) {
        console.error("AI Client Init Error", e);
    }
    return null;
}

const ai = getAiClient();

export const generateTaskDetails = async (taskTitle: string, machineType: string): Promise<string> => {
  if (!apiKey || !ai) {
    console.warn("API Key is missing. AI features disabled.");
    return "⚠️ AI Önerisi Kapalı: Sistem ayarlarında API anahtarı eksik. Lütfen yönetici ile görüşün.";
  }

  try {
    const prompt = `
      Sen uzman bir hidrolik bakım mühendisisin.
      Aşağıdaki görev için fabrikadaki bakım ustasına yönelik kısa, maddeler halinde teknik talimatlar ve güvenlik uyarıları hazırla.
      
      Görev: ${taskTitle}
      Makine Tipi: ${machineType}
      
      Yanıtı şu formatta ver (HTML değil, düz metin):
      ⚠️ GÜVENLİK:
      - [Güvenlik önlemi]
      
      🔧 ADIMLAR:
      1. [Adım 1]
      2. [Adım 2]
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "Detay oluşturulamadı.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Yapay zeka önerileri şu anda kullanılamıyor (Bağlantı hatası).";
  }
};