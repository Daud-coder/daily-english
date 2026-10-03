import { StorageAdapter, ChatMessageItem, WordItem, UserProgress, LessonProgress } from "./types";
import { calculateSM2, SRSGrade } from "../srs/sm2";

const DB_NAME = "daily_english_db";
const DB_VERSION = 1;

function getTodayString(): string {
  return new Date().toISOString().split("T")[0];
}

class IndexedDBAdapter implements StorageAdapter {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private getDB(): Promise<IDBDatabase> {
    if (typeof window === "undefined") {
      return Promise.reject(new Error("IndexedDB is only available in browser"));
    }

    if (!this.dbPromise) {
      this.dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains("messages")) {
            db.createObjectStore("messages", { keyPath: "id" });
          }
          if (!db.objectStoreNames.contains("words")) {
            db.createObjectStore("words", { keyPath: "id" });
          }
          if (!db.objectStoreNames.contains("progress")) {
            db.createObjectStore("progress", { keyPath: "key" });
          }
          if (!db.objectStoreNames.contains("lessons")) {
            db.createObjectStore("lessons", { keyPath: "topicId" });
          }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    }

    return this.dbPromise;
  }

  // --- Messages ---
  async getMessages(): Promise<ChatMessageItem[]> {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction("messages", "readonly");
        const store = tx.objectStore("messages");
        const request = store.getAll();
        request.onsuccess = () => {
          const msgs = (request.result as ChatMessageItem[]) || [];
          msgs.sort((a, b) => a.timestamp - b.timestamp);
          resolve(msgs);
        };
        request.onerror = () => resolve([]);
      });
    } catch (e) {
      console.warn("Failed to get messages from indexedDB:", e);
      return [];
    }
  }

  async saveMessage(msg: ChatMessageItem): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction("messages", "readwrite");
        const store = tx.objectStore("messages");
        const request = store.put(msg);
        request.onsuccess = () => resolve();
        request.onerror = () => resolve();
      });
    } catch (e) {
      console.warn("Failed to save message to indexedDB:", e);
    }
  }

  async clearMessages(): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction("messages", "readwrite");
        const store = tx.objectStore("messages");
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => resolve();
      });
    } catch (e) {
      console.warn("Failed to clear messages:", e);
    }
  }

  // --- Words (SRS) ---
  async getWords(): Promise<WordItem[]> {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction("words", "readonly");
        const store = tx.objectStore("words");
        const request = store.getAll();
        request.onsuccess = async () => {
          let words = (request.result as WordItem[]) || [];
          if (words.length === 0) {
            words = await this.seedStarterWords();
          }
          resolve(words);
        };
        request.onerror = () => resolve([]);
      });
    } catch (e) {
      console.warn("Failed to get words from indexedDB:", e);
      return [];
    }
  }

  private async seedStarterWords(): Promise<WordItem[]> {
    const starterWords: Array<Omit<WordItem, "id" | "repetitions" | "interval" | "easinessFactor" | "nextReviewDate" | "addedAt">> = [
      { english: "Hello", russian: "Привет", transcription: "Хэлло́у", contextSentence: "Hello! How are you?" },
      { english: "Thank you", russian: "Спасибо", transcription: "Сэнк ю", contextSentence: "Thank you very much." },
      { english: "Coffee", russian: "Кофе", transcription: "Ко́фи", contextSentence: "One coffee, please." },
      { english: "Water", russian: "Вода", transcription: "Уо́тэ", contextSentence: "Can I have water?" },
      { english: "Please", russian: "Пожалуйста (просьба)", transcription: "Плииз", contextSentence: "Help me, please." }
    ];

    const results: WordItem[] = [];
    for (const item of starterWords) {
      const saved = await this.saveWord(item);
      results.push(saved);
    }
    return results;
  }

  async saveWord(item: Omit<WordItem, "id" | "repetitions" | "interval" | "easinessFactor" | "nextReviewDate" | "addedAt">): Promise<WordItem> {
    const db = await this.getDB();
    const newWord: WordItem = {
      ...item,
      id: "word-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7),
      repetitions: 0,
      interval: 1,
      easinessFactor: 2.5,
      nextReviewDate: new Date().toISOString(),
      addedAt: Date.now()
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction("words", "readwrite");
      const store = tx.objectStore("words");
      const request = store.put(newWord);
      request.onsuccess = () => resolve(newWord);
      request.onerror = () => reject(request.error);
    });
  }

  async updateWordSRS(id: string, grade: SRSGrade): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve) => {
      const tx = db.transaction("words", "readwrite");
      const store = tx.objectStore("words");
      const getReq = store.get(id);

      getReq.onsuccess = () => {
        const word = getReq.result as WordItem;
        if (!word) return resolve();

        const srs = calculateSM2(
          {
            repetitions: word.repetitions,
            interval: word.interval,
            easinessFactor: word.easinessFactor
          },
          grade
        );

        const updated: WordItem = {
          ...word,
          ...srs,
          lastReviewedDate: new Date().toISOString()
        };

        const putReq = store.put(updated);
        putReq.onsuccess = () => resolve();
        putReq.onerror = () => resolve();
      };
      getReq.onerror = () => resolve();
    });
  }

  async deleteWord(id: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve) => {
      const tx = db.transaction("words", "readwrite");
      const store = tx.objectStore("words");
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => resolve();
    });
  }

  // --- Student Name Profile ---
  async getStudentName(): Promise<string> {
    if (typeof window !== "undefined") {
      const local = localStorage.getItem("daily_english_student_name");
      if (local && local.trim()) return local.trim();
    }
    const progress = await this.getProgress();
    return progress.studentName || "Daud";
  }

  async setStudentName(name: string): Promise<void> {
    const trimmed = name.trim() || "Daud";
    if (typeof window !== "undefined") {
      localStorage.setItem("daily_english_student_name", trimmed);
    }
    await this.updateProgress({ studentName: trimmed });
  }

  // --- Progress & Stats (NO RECURSION, SINGLE SOURCE OF WORDS) ---
  async getProgress(): Promise<UserProgress> {
    try {
      const db = await this.getDB();
      const today = getTodayString();
      
      // Get exact word count directly from words store
      const words = await this.getWords();
      const exactWordsCount = words.length;

      return new Promise((resolve) => {
        const tx = db.transaction("progress", "readwrite");
        const store = tx.objectStore("progress");
        const request = store.get("user_stats");

        request.onsuccess = () => {
          let stats: UserProgress;
          if (request.result && request.result.data) {
            stats = request.result.data as UserProgress;
            stats = this.checkStreak(stats, today);
            stats.learnedWordsCount = exactWordsCount;
            if (!stats.studentName) stats.studentName = "Daud";
          } else {
            stats = {
              studentName: "Daud",
              streak: 1,
              totalPracticeMinutes: 0,
              learnedWordsCount: exactWordsCount,
              completedTopicsCount: 0,
              lastActiveDate: today,
              frequentMistakes: []
            };
          }

          store.put({ key: "user_stats", data: stats });
          resolve(stats);
        };

        request.onerror = () => {
          resolve({
            studentName: "Daud",
            streak: 1,
            totalPracticeMinutes: 0,
            learnedWordsCount: exactWordsCount,
            completedTopicsCount: 0,
            lastActiveDate: today,
            frequentMistakes: []
          });
        };
      });
    } catch (e) {
      console.warn("Failed to get progress from indexedDB:", e);
      return {
        studentName: "Daud",
        streak: 1,
        totalPracticeMinutes: 0,
        learnedWordsCount: 5,
        completedTopicsCount: 0,
        lastActiveDate: getTodayString(),
        frequentMistakes: []
      };
    }
  }

  private checkStreak(stats: UserProgress, today: string): UserProgress {
    if (!stats.lastActiveDate) {
      stats.lastActiveDate = today;
      return stats;
    }
    if (stats.lastActiveDate === today) {
      return stats;
    }
    const lastDate = new Date(stats.lastActiveDate);
    const currentDate = new Date(today);
    const diffDays = Math.round((currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      stats.streak += 1;
    } else if (diffDays > 1) {
      stats.streak = 1;
    }
    stats.lastActiveDate = today;
    return stats;
  }

  async updateProgress(updater: Partial<UserProgress>): Promise<UserProgress> {
    try {
      const db = await this.getDB();
      const today = getTodayString();
      const words = await this.getWords();
      const exactWordsCount = words.length;

      return new Promise((resolve) => {
        const tx = db.transaction("progress", "readwrite");
        const store = tx.objectStore("progress");
        const request = store.get("user_stats");

        request.onsuccess = () => {
          const current: UserProgress = (request.result && request.result.data)
            ? request.result.data
            : {
                studentName: "Daud",
                streak: 1,
                totalPracticeMinutes: 0,
                learnedWordsCount: exactWordsCount,
                completedTopicsCount: 0,
                lastActiveDate: today,
                frequentMistakes: []
              };

          const updated: UserProgress = {
            ...current,
            ...updater,
            learnedWordsCount: exactWordsCount,
            lastActiveDate: today
          };

          const putReq = store.put({ key: "user_stats", data: updated });
          putReq.onsuccess = () => resolve(updated);
          putReq.onerror = () => resolve(updated);
        };

        request.onerror = () => {
          resolve({
            studentName: "Daud",
            streak: 1,
            totalPracticeMinutes: 0,
            learnedWordsCount: exactWordsCount,
            completedTopicsCount: 0,
            lastActiveDate: today,
            frequentMistakes: []
          });
        };
      });
    } catch (e) {
      console.warn("Failed to update progress:", e);
      return {
        studentName: "Daud",
        streak: 1,
        totalPracticeMinutes: 0,
        learnedWordsCount: 5,
        completedTopicsCount: 0,
        lastActiveDate: getTodayString(),
        frequentMistakes: []
      };
    }
  }

  async recordPracticeTime(minutes: number): Promise<void> {
    try {
      const current = await this.getProgress();
      await this.updateProgress({
        totalPracticeMinutes: current.totalPracticeMinutes + minutes
      });
    } catch (e) {
      console.warn("Failed to record practice time:", e);
    }
  }

  async addMistake(mistake: string): Promise<void> {
    if (!mistake) return;
    try {
      const current = await this.getProgress();
      const set = new Set(current.frequentMistakes);
      set.add(mistake);
      await this.updateProgress({
        frequentMistakes: Array.from(set).slice(-10)
      });
    } catch (e) {
      console.warn("Failed to add mistake:", e);
    }
  }

  // --- Lessons ---
  async getLessonProgress(topicId: string): Promise<LessonProgress | null> {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction("lessons", "readonly");
        const store = tx.objectStore("lessons");
        const request = store.get(topicId);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => resolve(null);
      });
    } catch (e) {
      return null;
    }
  }

  async saveLessonProgress(progress: LessonProgress): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction("lessons", "readwrite");
        const store = tx.objectStore("lessons");
        const request = store.put(progress);
        request.onsuccess = () => resolve();
        request.onerror = () => resolve();
      });
    } catch (e) {
      // ignore
    }
  }

  async getAllCompletedLessons(): Promise<string[]> {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction("lessons", "readonly");
        const store = tx.objectStore("lessons");
        const request = store.getAll();
        request.onsuccess = () => {
          const lessons = (request.result as LessonProgress[]) || [];
          const completed = lessons
            .filter((l) => l.completedStep1 && l.completedStep2 && l.completedStep3)
            .map((l) => l.topicId);
          resolve(completed);
        };
        request.onerror = () => resolve([]);
      });
    } catch (e) {
      return [];
    }
  }
}

export const dbAdapter = new IndexedDBAdapter();
