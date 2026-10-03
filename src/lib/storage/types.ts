import { SRSGrade } from "../srs/sm2";

export interface ChatMessageItem {
  id: string;
  sender: "user" | "teacher";
  english: string;
  russian: string;
  timestamp: number;
  correction?: string | null;
  repeatPrompt?: string | null;
  praise?: string | null;
  isAudio?: boolean;
}

export interface WordItem {
  id: string;
  english: string;
  russian: string;
  transcription?: string;
  contextSentence?: string;
  addedAt: number;
  // SRS properties
  repetitions: number;
  interval: number;
  easinessFactor: number;
  nextReviewDate: string;
  lastReviewedDate?: string;
}

export interface UserProgress {
  studentName: string;
  streak: number;
  totalPracticeMinutes: number;
  learnedWordsCount: number;
  completedTopicsCount: number;
  lastActiveDate: string; // YYYY-MM-DD
  frequentMistakes: string[];
}

export interface LessonProgress {
  topicId: string;
  completedStep1: boolean;
  completedStep2: boolean;
  completedStep3: boolean;
  completedAt?: string;
}

export interface StorageAdapter {
  // Chat Messages
  getMessages(): Promise<ChatMessageItem[]>;
  saveMessage(msg: ChatMessageItem): Promise<void>;
  clearMessages(): Promise<void>;

  // Vocabulary
  getWords(): Promise<WordItem[]>;
  saveWord(word: Omit<WordItem, "id" | "repetitions" | "interval" | "easinessFactor" | "nextReviewDate" | "addedAt">): Promise<WordItem>;
  updateWordSRS(id: string, grade: SRSGrade): Promise<void>;
  deleteWord(id: string): Promise<void>;

  // Student Profile & Progress
  getStudentName(): Promise<string>;
  setStudentName(name: string): Promise<void>;
  getProgress(): Promise<UserProgress>;
  updateProgress(updater: Partial<UserProgress>): Promise<UserProgress>;
  recordPracticeTime(minutes: number): Promise<void>;
  addMistake(mistake: string): Promise<void>;

  // Daily Lessons
  getLessonProgress(topicId: string): Promise<LessonProgress | null>;
  saveLessonProgress(progress: LessonProgress): Promise<void>;
  getAllCompletedLessons(): Promise<string[]>;
}
