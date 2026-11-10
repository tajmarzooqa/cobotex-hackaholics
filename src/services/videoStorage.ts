import { VideoEvidence } from '../types';

const DB_NAME = 'ResQ_EvidenceDB_v1';
const DB_VERSION = 1;
const STORE_NAME = 'videos';

export interface StoredVideoRecord {
  incidentId: string;
  videoId: string;
  blob: Blob;
  recordedAt: string;
  durationSeconds: number;
  mimeType: string;
  sizeBytes: number;
  hasAudio: boolean;
  fileName?: string;
  resolution?: string;
  notes?: string;
}

/**
 * Initialize and open IndexedDB for ResQ Evidence Management
 */
export const openEvidenceDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('IndexedDB is not supported in this browser environment'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'incidentId' });
        store.createIndex('videoId', 'videoId', { unique: false });
        store.createIndex('recordedAt', 'recordedAt', { unique: false });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error || new Error('Failed to open IndexedDB'));
    };
  });
};

/**
 * Store video blob and metadata associated with an incident ID
 */
export const saveVideoToDB = async (
  incidentId: string,
  videoBlob: Blob,
  meta: {
    durationSeconds: number;
    mimeType: string;
    hasAudio?: boolean;
    fileName?: string;
    resolution?: string;
    notes?: string;
    recordedAt?: string;
    id?: string;
  }
): Promise<VideoEvidence> => {
  const db = await openEvidenceDB();

  const videoId = meta.id || `vid-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const recordedAt = meta.recordedAt || new Date().toISOString();
  const sizeBytes = videoBlob.size;
  const hasAudio = meta.hasAudio ?? true;
  const mimeType = meta.mimeType || videoBlob.type || 'video/webm';
  const durationSeconds = Math.max(1, Math.round(meta.durationSeconds));

  const record: StoredVideoRecord = {
    incidentId,
    videoId,
    blob: videoBlob,
    recordedAt,
    durationSeconds,
    mimeType,
    sizeBytes,
    hasAudio,
    fileName: meta.fileName || `emergency_evidence_${incidentId}.webm`,
    resolution: meta.resolution || '720p HD',
    notes: meta.notes
  };

  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const putRequest = store.put(record);

      putRequest.onsuccess = () => {
        resolve({
          id: videoId,
          incidentId,
          recordedAt,
          durationSeconds,
          mimeType,
          sizeBytes,
          hasAudio,
          fileName: record.fileName,
          resolution: record.resolution,
          notes: record.notes,
          storedInIndexedDB: true
        });
      };

      putRequest.onerror = () => {
        reject(putRequest.error || new Error('Failed to write video record to IndexedDB'));
      };

      tx.oncomplete = () => {
        db.close();
      };
    } catch (err) {
      db.close();
      reject(err);
    }
  });
};

/**
 * Retrieve video record, blob, and active playback object URL
 */
export const getVideoFromDB = async (
  incidentId: string
): Promise<{ blob: Blob; metadata: VideoEvidence; objectUrl: string } | null> => {
  try {
    const db = await openEvidenceDB();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const getRequest = store.get(incidentId);

      getRequest.onsuccess = () => {
        const record = getRequest.result as StoredVideoRecord | undefined;
        if (!record || !record.blob) {
          resolve(null);
          return;
        }

        const objectUrl = URL.createObjectURL(record.blob);
        const metadata: VideoEvidence = {
          id: record.videoId,
          incidentId: record.incidentId,
          recordedAt: record.recordedAt,
          durationSeconds: record.durationSeconds,
          mimeType: record.mimeType,
          sizeBytes: record.sizeBytes,
          hasAudio: record.hasAudio,
          fileName: record.fileName,
          resolution: record.resolution,
          notes: record.notes,
          storedInIndexedDB: true
        };

        resolve({ blob: record.blob, metadata, objectUrl });
      };

      getRequest.onerror = () => {
        reject(getRequest.error || new Error('Failed to read video from IndexedDB'));
      };

      tx.oncomplete = () => {
        db.close();
      };
    });
  } catch (err) {
    console.warn(`Error reading video for ${incidentId} from IndexedDB:`, err);
    return null;
  }
};

/**
 * Check if video evidence exists in IndexedDB
 */
export const hasVideoInDB = async (incidentId: string): Promise<boolean> => {
  try {
    const db = await openEvidenceDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.count(incidentId);
      req.onsuccess = () => {
        resolve(req.result > 0);
      };
      req.onerror = () => {
        resolve(false);
      };
      tx.oncomplete = () => db.close();
    });
  } catch {
    return false;
  }
};

/**
 * Delete video from IndexedDB
 */
export const deleteVideoFromDB = async (incidentId: string): Promise<boolean> => {
  try {
    const db = await openEvidenceDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(incidentId);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
      tx.oncomplete = () => db.close();
    });
  } catch (err) {
    console.warn('Failed to delete video from IndexedDB', err);
    return false;
  }
};

/**
 * Transfer a temporary draft video to a confirmed incident ID upon report submission
 */
export const transferDraftVideo = async (
  tempKey: string,
  newIncidentId: string
): Promise<VideoEvidence | null> => {
  try {
    const existing = await getVideoFromDB(tempKey);
    if (!existing) return null;

    // Save under the new incident ID
    const saved = await saveVideoToDB(newIncidentId, existing.blob, {
      id: existing.metadata.id,
      durationSeconds: existing.metadata.durationSeconds,
      mimeType: existing.metadata.mimeType,
      hasAudio: existing.metadata.hasAudio,
      fileName: `emergency_evidence_${newIncidentId}.webm`,
      resolution: existing.metadata.resolution,
      notes: existing.metadata.notes,
      recordedAt: existing.metadata.recordedAt
    });

    // Clean up temporary draft
    await deleteVideoFromDB(tempKey);

    return saved;
  } catch (err) {
    console.error('Failed to transfer draft video to incident:', err);
    return null;
  }
};

/**
 * Generates an actual valid WebM video file using Canvas & MediaRecorder
 * for instant testing/simulation when camera is unavailable or denied.
 */
export const generateSimulatedVideoBlob = async (
  title: string,
  category: string,
  durationSeconds: number = 5
): Promise<{ blob: Blob; mimeType: string; duration: number }> => {
  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 360;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Canvas 2D context unavailable');
      }

      // Check supported mime types
      let mimeType = 'video/webm';
      if (typeof MediaRecorder !== 'undefined') {
        if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')) {
          mimeType = 'video/webm;codecs=vp8,opus';
        } else if (MediaRecorder.isTypeSupported('video/webm')) {
          mimeType = 'video/webm';
        } else if (MediaRecorder.isTypeSupported('video/mp4')) {
          mimeType = 'video/mp4';
        }
      }

      const stream = canvas.captureStream(25); // 25 fps
      const recorder = new MediaRecorder(stream, { mimeType });
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        const fullBlob = new Blob(chunks, { type: mimeType });
        resolve({ blob: fullBlob, mimeType, duration: durationSeconds });
      };

      recorder.start();

      let frame = 0;
      const totalFrames = durationSeconds * 25;
      const interval = setInterval(() => {
        frame++;

        // Draw tactical simulated emergency camera feed
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Grid lines
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1;
        for (let x = 0; x < canvas.width; x += 40) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, canvas.height);
          ctx.stroke();
        }
        for (let y = 0; y < canvas.height; y += 40) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(canvas.width, y);
          ctx.stroke();
        }

        // Animated radar scanner sweep
        const sweepY = (frame * 4) % canvas.height;
        ctx.fillStyle = 'rgba(239, 68, 68, 0.15)';
        ctx.fillRect(0, sweepY, canvas.width, 24);

        // Tactical HUD Box
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.strokeRect(30, 30, canvas.width - 60, canvas.height - 60);

        // Header info
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 16px monospace';
        ctx.fillText('● RESQ EMERGENCY FIELD EVIDENCE', 45, 60);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 18px sans-serif';
        ctx.fillText(title || 'Incident Emergency Feed', 45, 95);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '13px monospace';
        ctx.fillText(`CATEGORY: ${category.toUpperCase()}`, 45, 125);
        ctx.fillText(`TIME: ${new Date().toISOString()}`, 45, 145);
        ctx.fillText(`FRAME: ${frame} / ${totalFrames} (25 FPS)`, 45, 165);

        // Center crosshair
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
        ctx.strokeStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(cx, cy, 35, 0, Math.PI * 2);
        ctx.moveTo(cx - 50, cy);
        ctx.lineTo(cx + 50, cy);
        ctx.moveTo(cx, cy - 50);
        ctx.lineTo(cx, cy + 50);
        ctx.stroke();

        // Pulsing alert indicator
        const alpha = Math.abs(Math.sin(frame / 6));
        ctx.fillStyle = `rgba(239, 68, 68, ${alpha})`;
        ctx.beginPath();
        ctx.arc(canvas.width - 65, 60, 10, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#f87171';
        ctx.font = 'bold 12px monospace';
        ctx.fillText('ACTIVE SENSOR', canvas.width - 185, 64);

        if (frame >= totalFrames) {
          clearInterval(interval);
          recorder.stop();
        }
      }, 40);
    } catch (err) {
      reject(err);
    }
  });
};
