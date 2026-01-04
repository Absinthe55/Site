import { Task } from "../types";

// KVDB.io: Hızlı, key-value store.
// Kullanıcının kendi belirlediği bir ID (Bucket) üzerinden işlem yapacağız.
const BASE_URL = 'https://kvdb.io';

export interface SyncResult {
  success: boolean;
  data?: Task[];
  error?: string;
  blobId?: string;
}

// Verileri buluttan çeker veya yoksa başlatır
export const fetchCloudTasks = async (blobId: string): Promise<SyncResult> => {
  try {
    // Cache'i önlemek için timestamp ekliyoruz
    const response = await fetch(`${BASE_URL}/${blobId}/tasks?_t=${Date.now()}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (response.ok) {
      const result = await response.json();
      if (Array.isArray(result)) {
        return { success: true, data: result };
      }
      return { success: true, data: [] };
    } else if (response.status === 404) {
      // Veri yoksa (404), bu yeni bir oda demektir.
      // Başarılı dönüyoruz ama data boş, böylece App.tsx bunu anlayıp initialize edecek.
      return { success: true, data: [], error: 'NOT_FOUND' };
    } else {
      return { success: false, error: 'Veri çekilemedi.' };
    }
  } catch (error) {
    return { success: false, error: 'İnternet bağlantısı yok.' };
  }
};

// Verileri buluta kaydeder (Oluşturma veya Güncelleme)
export const updateCloudTasks = async (blobId: string, tasks: Task[]): Promise<SyncResult> => {
  try {
    const response = await fetch(`${BASE_URL}/${blobId}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(tasks)
    });

    if (response.ok) {
      return { success: true };
    } else {
      // KVDB bazen POST yerine PUT isteyebilir veya bucket create gerekebilir.
      // Ancak çoğu açık endpoint POST ile upsert (update/insert) yapar.
      return { success: false, error: 'Sunucuya kayıt yapılamadı.' };
    }
  } catch (error) {
    return { success: false, error: 'Bağlantı hatası.' };
  }
};