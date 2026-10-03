export interface WordDiffResult {
  word: string;
  status: "correct" | "close" | "wrong" | "missing";
  spokenWord?: string;
}

export interface DiffReport {
  score: number; // 0 - 100
  words: WordDiffResult[];
  allPassed: boolean;
}

function cleanWord(str: string): string {
  return str.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()?'"“”]/g, "").trim();
}

function levenshtein(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

export function comparePronunciation(targetText: string, spokenText: string): DiffReport {
  const targetTokens = targetText.split(/\s+/).filter(Boolean);
  const spokenTokens = spokenText.split(/\s+/).filter(Boolean);

  const cleanedTargets = targetTokens.map(cleanWord);
  const cleanedSpokens = spokenTokens.map(cleanWord);

  const results: WordDiffResult[] = [];
  let matchedPoints = 0;

  for (let i = 0; i < targetTokens.length; i++) {
    const rawTarget = targetTokens[i];
    const target = cleanedTargets[i];
    
    // Look for exact or close match around position i
    let bestMatchIndex = -1;
    let bestDist = 999;

    for (let j = 0; j < cleanedSpokens.length; j++) {
      const spoken = cleanedSpokens[j];
      const dist = levenshtein(target, spoken);
      if (dist < bestDist) {
        bestDist = dist;
        bestMatchIndex = j;
      }
    }

    if (bestMatchIndex !== -1 && bestDist === 0) {
      results.push({
        word: rawTarget,
        status: "correct",
        spokenWord: spokenTokens[bestMatchIndex]
      });
      matchedPoints += 1;
      // remove used spoken token
      cleanedSpokens.splice(bestMatchIndex, 1);
      spokenTokens.splice(bestMatchIndex, 1);
    } else if (bestMatchIndex !== -1 && bestDist <= 2 && target.length > 3) {
      results.push({
        word: rawTarget,
        status: "close",
        spokenWord: spokenTokens[bestMatchIndex]
      });
      matchedPoints += 0.7;
      cleanedSpokens.splice(bestMatchIndex, 1);
      spokenTokens.splice(bestMatchIndex, 1);
    } else {
      results.push({
        word: rawTarget,
        status: "missing"
      });
    }
  }

  const score = targetTokens.length > 0 
    ? Math.round((matchedPoints / targetTokens.length) * 100) 
    : 0;

  return {
    score: Math.min(100, Math.max(0, score)),
    words: results,
    allPassed: score >= 70
  };
}
