export interface DailyQuest {
  id: string;
  title: string;
  target: number;
  current: number;
  completed: boolean;
  xpReward: number;
  icon: string;
}

export interface AchievementBadge {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
  category: "talk" | "streak" | "games" | "mastery";
}

export interface StudentMemoryFact {
  id: string;
  category: "city" | "job" | "family" | "goal" | "custom";
  fact: string;
  discoveredAt: string;
}

export interface WeeklyReportData {
  practiceMinutes: number;
  wordsLearned: number;
  dialoguesCount: number;
  topOvercomeMistake: string;
  alexRecommendation: string;
}

export interface RoadmapStep {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  status: "completed" | "current" | "locked";
  xpReward: number;
}

export function calculateLevel(xp: number): {
  levelNumber: number;
  title: string;
  nextLevelXp: number;
  currentLevelThreshold: number;
  progressPercent: number;
} {
  const levels = [
    { lvl: 1, title: "Новичок (A0)", threshold: 0 },
    { lvl: 2, title: "Первые слова (A0+)", threshold: 150 },
    { lvl: 3, title: "Смелый турист (A1)", threshold: 400 },
    { lvl: 4, title: "Уверенный собеседник (A1+)", threshold: 800 },
    { lvl: 5, title: "Свободно говорю для жизни (A2)", threshold: 1500 }
  ];

  let currentLevel = levels[0];
  let nextLevel = levels[1];

  for (let i = levels.length - 1; i >= 0; i--) {
    if (xp >= levels[i].threshold) {
      currentLevel = levels[i];
      nextLevel = levels[i + 1] || { lvl: 6, title: "Мастер английского", threshold: 2500 };
      break;
    }
  }

  const range = nextLevel.threshold - currentLevel.threshold;
  const currentInLvl = Math.max(0, xp - currentLevel.threshold);
  const progressPercent = Math.min(100, Math.round((currentInLvl / range) * 100));

  return {
    levelNumber: currentLevel.lvl,
    title: currentLevel.title,
    nextLevelXp: nextLevel.threshold,
    currentLevelThreshold: currentLevel.threshold,
    progressPercent
  };
}

export const ALL_BADGES: AchievementBadge[] = [
  { id: "b1", title: "Первые слова", description: "Сказал первые 5 реплик учителю Алексу", icon: "🌱", unlocked: true, unlockedAt: "Вчера", category: "talk" },
  { id: "b2", title: "Мясной эксперт", description: "Завершил переговоры по поставкам на рынке", icon: "🥩", unlocked: true, unlockedAt: "Вчера", category: "mastery" },
  { id: "b3", title: "Голосовой герой", description: "Ответил голосом через микрофон", icon: "🎙️", unlocked: true, unlockedAt: "Вчера", category: "talk" },
  { id: "b4", title: "Телефонный мастер", description: "Поговорил с Алексом через режим видеозвонка", icon: "📞", unlocked: true, unlockedAt: "Сегодня", category: "talk" },
  { id: "b5", title: "Без ошибок", description: "Отправил ответ без единой грамматической ошибки", icon: "🎯", unlocked: true, unlockedAt: "Сегодня", category: "mastery" },
  { id: "b6", title: "Огонь 3 дня", description: "Занимался 3 дня подряд без единого пропуска", icon: "🔥", unlocked: false, category: "streak" },
  { id: "b7", title: "Суперслух", description: "Правильно понял фразу на слух в игре", icon: "🎧", unlocked: false, category: "games" },
  { id: "b8", title: "Мастер фразы", description: "Собрал правильный порядок слов в мини-игре", icon: "🧩", unlocked: false, category: "games" },
  { id: "b9", title: "Быстрый ответ", description: "Успел ответить за 10 секунд в блиц-раунде", icon: "⚡", unlocked: false, category: "games" },
  { id: "b10", title: "Охотник за словами", description: "Выучил более 10 новых полезных слов", icon: "📚", unlocked: false, category: "mastery" },
  { id: "b11", title: "Неделя триумфа", description: "Держал стрик 7 дней подряд", icon: "🏆", unlocked: false, category: "streak" },
  { id: "b12", title: "Полиглот A1", description: "Набрал 500 XP и перешёл на следующий языковой уровень", icon: "👑", unlocked: false, category: "mastery" }
];

export const INITIAL_STUDENT_FACTS: StudentMemoryFact[] = [
  { id: "f1", category: "city", fact: "Живёт в Киеве (Kyiv)", discoveredAt: "Вчера" },
  { id: "f2", category: "job", fact: "Работает в мясной сфере (meat business)", discoveredAt: "Вчера" },
  { id: "f3", category: "family", fact: "Семья: двое детей (two children)", discoveredAt: "Вчера" },
  { id: "f4", category: "goal", fact: "Цель: понимать на слух и говорить для путешествий и работы", discoveredAt: "Сегодня" }
];

export const INITIAL_DAILY_QUESTS: DailyQuest[] = [
  { id: "q1", title: "Поговорить с учителем 5 минут", target: 5, current: 3, completed: false, xpReward: 30, icon: "💬" },
  { id: "q2", title: "Пройти 1 ролевую сценку", target: 1, current: 1, completed: true, xpReward: 50, icon: "🎬" },
  { id: "q3", title: "Сыграть в 1 мини-игру", target: 1, current: 1, completed: true, xpReward: 20, icon: "🎮" }
];

export const ROADMAP_STEPS: RoadmapStep[] = [
  { id: "step-1", title: "Приветствие и имя", subtitle: "Hello, my name is Daud", icon: "👋", status: "completed", xpReward: 50 },
  { id: "step-2", title: "Откуда ты и семья", subtitle: "I am from Kyiv, two children", icon: "🏡", status: "completed", xpReward: 50 },
  { id: "step-3", title: "Работа и мясо", subtitle: "I work with beef and pork", icon: "🥩", status: "current", xpReward: 75 },
  { id: "step-4", title: "Кофе и заказ", subtitle: "One coffee, please", icon: "☕", status: "locked", xpReward: 75 },
  { id: "step-5", title: "Аэропорт и паспорт", subtitle: "Here is my passport", icon: "✈️", status: "locked", xpReward: 100 },
  { id: "step-6", title: "Отель и ключ", subtitle: "I have a reservation", icon: "🏨", status: "locked", xpReward: 100 },
  { id: "step-7", title: "Поездка на такси", subtitle: "Take me to city center", icon: "🚖", status: "locked", xpReward: 100 },
  { id: "step-8", title: "Магазин и покупки", subtitle: "How much is this?", icon: "🛍️", status: "locked", xpReward: 100 },
  { id: "step-9", title: "Аптека и помощь", subtitle: "I need help, please", icon: "💊", status: "locked", xpReward: 120 },
  { id: "step-10", title: "Свободная беседа", subtitle: "Talking about everything", icon: "🌟", status: "locked", xpReward: 150 }
];

export const INITIAL_WEEKLY_REPORT: WeeklyReportData = {
  practiceMinutes: 38,
  wordsLearned: 14,
  dialoguesCount: 9,
  topOvercomeMistake: "Запомнил форму «I have two children» вместо «I has two child»! Отличная победа.",
  alexRecommendation: "Ты уже уверенно говоришь про себя, семью и работу. Следующий шаг — научиться легко заказывать еду в кафе и понимать цены на слух!"
};

// Local storage keys
const XP_KEY = "daily_english_xp";
const FACTS_KEY = "daily_english_facts";
const BADGES_KEY = "daily_english_badges";
const QUESTS_KEY = "daily_english_quests";

export function getStoredXP(): number {
  if (typeof window === "undefined") return 260;
  const raw = localStorage.getItem(XP_KEY);
  if (!raw) {
    localStorage.setItem(XP_KEY, "260");
    return 260;
  }
  return parseInt(raw, 10) || 260;
}

export function awardXP(amount: number): { newXP: number; leveledUp: boolean; newLevel: number } {
  if (typeof window === "undefined") return { newXP: 260, leveledUp: false, newLevel: 2 };
  const current = getStoredXP();
  const oldLevel = calculateLevel(current).levelNumber;
  const newXP = current + amount;
  localStorage.setItem(XP_KEY, newXP.toString());
  const newLevel = calculateLevel(newXP).levelNumber;

  return {
    newXP,
    leveledUp: newLevel > oldLevel,
    newLevel
  };
}

export function getStoredFacts(): StudentMemoryFact[] {
  if (typeof window === "undefined") return INITIAL_STUDENT_FACTS;
  const raw = localStorage.getItem(FACTS_KEY);
  if (!raw) {
    localStorage.setItem(FACTS_KEY, JSON.stringify(INITIAL_STUDENT_FACTS));
    return INITIAL_STUDENT_FACTS;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return INITIAL_STUDENT_FACTS;
  }
}

export function saveFact(factText: string, category: StudentMemoryFact["category"] = "custom"): StudentMemoryFact[] {
  const facts = getStoredFacts();
  const newFact: StudentMemoryFact = {
    id: "f-" + Date.now(),
    category,
    fact: factText,
    discoveredAt: "Сегодня"
  };
  const updated = [...facts, newFact];
  if (typeof window !== "undefined") {
    localStorage.setItem(FACTS_KEY, JSON.stringify(updated));
  }
  return updated;
}

export function removeFact(id: string): StudentMemoryFact[] {
  const facts = getStoredFacts();
  const updated = facts.filter((f) => f.id !== id);
  if (typeof window !== "undefined") {
    localStorage.setItem(FACTS_KEY, JSON.stringify(updated));
  }
  return updated;
}

export function getStoredBadges(): AchievementBadge[] {
  if (typeof window === "undefined") return ALL_BADGES;
  const raw = localStorage.getItem(BADGES_KEY);
  if (!raw) {
    localStorage.setItem(BADGES_KEY, JSON.stringify(ALL_BADGES));
    return ALL_BADGES;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return ALL_BADGES;
  }
}

export function unlockBadge(badgeId: string): { badges: AchievementBadge[]; justUnlocked: boolean } {
  const badges = getStoredBadges();
  let justUnlocked = false;
  const updated = badges.map((b) => {
    if (b.id === badgeId && !b.unlocked) {
      justUnlocked = true;
      return { ...b, unlocked: true, unlockedAt: "Только что!" };
    }
    return b;
  });
  if (justUnlocked && typeof window !== "undefined") {
    localStorage.setItem(BADGES_KEY, JSON.stringify(updated));
  }
  return { badges: updated, justUnlocked };
}
