type ScoreInput = {
  title: string;
  summary?: string;
  sourceReliability?: number;
  publishedAt?: Date | null;
};

export function scoreNewsItem({ title, summary = "", sourceReliability = 70, publishedAt }: ScoreInput) {
  const haystack = `${title} ${summary}`.toLowerCase();
  let score = Math.round(sourceReliability * 0.45);

  if (/(besancon|bisontin|doubs|grand besancon|battant|vauban|micaud|granvelle)/.test(haystack)) score += 20;
  if (/(week-end|aujourd'hui|demain|ce soir|urgence|travaux|circulation|ouverture)/.test(haystack)) score += 14;
  if (/(festival|commerce|restaurant|marche|exposition|initiative|association|etudiant)/.test(haystack)) score += 12;
  if (/(accident|violence|drame|incendie)/.test(haystack)) score -= 12;

  if (publishedAt) {
    const ageHours = (Date.now() - publishedAt.getTime()) / 36e5;
    if (ageHours <= 24) score += 12;
    else if (ageHours <= 72) score += 6;
  }

  return Math.max(5, Math.min(100, score));
}

export function urgencyFromScore(score: number) {
  if (score >= 90) return "urgent";
  if (score >= 75) return "high";
  if (score >= 45) return "medium";
  return "low";
}
