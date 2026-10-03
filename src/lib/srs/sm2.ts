export type SRSGrade = "again" | "hard" | "good" | "easy";

export interface SRSItem {
  id: string;
  repetitions: number;
  interval: number; // in days
  easinessFactor: number; // default 2.5
  nextReviewDate: string; // ISO date string
  lastReviewedDate?: string;
}

/**
 * SuperMemo 2 (SM-2) algorithm adapted for vocabulary learning.
 */
export function calculateSM2(
  item: {
    repetitions: number;
    interval: number;
    easinessFactor: number;
  },
  grade: SRSGrade
): {
  repetitions: number;
  interval: number;
  easinessFactor: number;
  nextReviewDate: string;
} {
  let { repetitions, interval, easinessFactor } = item;
  
  // Grade map to SM-2 scale (0-5)
  // again: 1, hard: 3, good: 4, easy: 5
  let numericGrade = 4;
  switch (grade) {
    case "again":
      numericGrade = 1;
      break;
    case "hard":
      numericGrade = 3;
      break;
    case "good":
      numericGrade = 4;
      break;
    case "easy":
      numericGrade = 5;
      break;
  }

  if (numericGrade >= 3) {
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = grade === "hard" ? 2 : 4;
    } else {
      interval = Math.round(interval * easinessFactor);
      if (grade === "hard") {
        interval = Math.max(1, Math.round(interval * 0.8));
      } else if (grade === "easy") {
        interval = Math.round(interval * 1.3);
      }
    }
    repetitions += 1;
  } else {
    // Failed / Again
    repetitions = 0;
    interval = 1;
  }

  // Update Easiness Factor (EF)
  easinessFactor = easinessFactor + (0.1 - (5 - numericGrade) * (0.08 + (5 - numericGrade) * 0.02));
  if (easinessFactor < 1.3) {
    easinessFactor = 1.3;
  }

  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + interval);

  return {
    repetitions,
    interval,
    easinessFactor: parseFloat(easinessFactor.toFixed(2)),
    nextReviewDate: nextDate.toISOString()
  };
}
