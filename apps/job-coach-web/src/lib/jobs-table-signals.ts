export const NEW_JOB_WINDOW_MS = 48 * 60 * 60 * 1000;

export type MatchScoreState =
  | {
      state: "matched";
      score: number;
      percentage: number;
      tone: "green" | "yellow" | "gray";
    }
  | {
      state: "unmatched";
    };

export type RankedJobSignal = {
  createdAt?: string | null;
  score?: number | null;
};

export function isRecentlyImported(createdAt: string | null | undefined, now = Date.now()) {
  if (!createdAt) {
    return false;
  }

  const createdTime = Date.parse(createdAt);

  if (Number.isNaN(createdTime)) {
    return false;
  }

  const ageMs = now - createdTime;

  return ageMs >= 0 && ageMs <= NEW_JOB_WINDOW_MS;
}

export function getMatchScoreState(score: number | null | undefined): MatchScoreState {
  if (typeof score !== "number" || Number.isNaN(score)) {
    return { state: "unmatched" };
  }

  const clampedScore = Math.max(0, Math.min(score, 1));
  const percentage = Math.round(clampedScore * 100);

  return {
    state: "matched",
    score: clampedScore,
    percentage,
    tone: percentage >= 75 ? "green" : percentage >= 50 ? "yellow" : "gray",
  };
}

export function compareRankedJobSignals(
  first: RankedJobSignal,
  second: RankedJobSignal,
  now = Date.now(),
) {
  const firstIsNew = isRecentlyImported(first.createdAt, now);
  const secondIsNew = isRecentlyImported(second.createdAt, now);

  if (firstIsNew !== secondIsNew) {
    return firstIsNew ? -1 : 1;
  }

  const firstScore = getMatchScoreState(first.score);
  const secondScore = getMatchScoreState(second.score);
  const firstIsMatched = firstScore.state === "matched";
  const secondIsMatched = secondScore.state === "matched";

  if (firstIsMatched !== secondIsMatched) {
    return firstIsMatched ? -1 : 1;
  }

  if (firstScore.state === "matched" && secondScore.state === "matched") {
    const scoreSort = secondScore.score - firstScore.score;

    if (scoreSort !== 0) {
      return scoreSort;
    }
  }

  return (second.createdAt ?? "").localeCompare(first.createdAt ?? "");
}
