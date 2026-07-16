export function categorizeNewsItem(title: string, summary = "", tags: string[] = []) {
  const haystack = `${title} ${summary} ${tags.join(" ")}`.toLowerCase();

  if (/(travaux|circulation|route|tram|bus|stationnement|chantier)/.test(haystack)) {
    return "travaux / circulation";
  }

  if (/(concert|festival|exposition|theatre|cinema|culture|spectacle)/.test(haystack)) {
    return "culture";
  }

  if (/(commerce|boutique|restaurant|ouverture|marche|artisan)/.test(haystack)) {
    return "commerces";
  }

  if (/(sport|club|match|course|velo|fitness)/.test(haystack)) {
    return "sport";
  }

  if (/(restaurant|producteur|gastronomie|fromage|vin|food|cuisine)/.test(haystack)) {
    return "gastronomie";
  }

  if (/(etudiant|universite|campus|crous)/.test(haystack)) {
    return "vie etudiante";
  }

  if (/(association|benevole|solidarite|collecte)/.test(haystack)) {
    return "associations";
  }

  return "initiatives locales";
}
