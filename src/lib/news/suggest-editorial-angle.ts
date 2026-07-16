export function suggestEditorialAngle(category: string, title: string) {
  const lowered = title.toLowerCase();

  if (category === "travaux / circulation") {
    return "Transformer en format pratique : ce qui change, quand, et l'itineraire conseille.";
  }

  if (category === "culture") {
    return "Proposer un format agenda court avec raisons d'y aller, infos utiles et lien source.";
  }

  if (category === "commerces" || lowered.includes("ouverture")) {
    return "Creer un portrait commerce local et tester une approche partenariat leger.";
  }

  if (category === "gastronomie") {
    return "Preparer une story guide ou un reel degustation avec angle local et utile.";
  }

  if (category === "associations") {
    return "Valoriser l'initiative avec un format humain, sobre et oriente appel a participation.";
  }

  return "Noter l'info, verifier la source et chercher un angle utile pour la communaute.";
}
