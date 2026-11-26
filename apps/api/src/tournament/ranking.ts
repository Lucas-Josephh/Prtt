/**
 * Convertit une borne de catégorie de tableau en points de classement :
 * - « NC » (non classé) → 0
 * - un nombre (« 800 », « 1000 »…) → ce nombre
 * - tout autre texte (« N°300 », « TC », « Non numéroté »…) → null : on ne peut pas l'interpréter,
 *   donc aucun contrôle n'est fait sur cette borne.
 */
export function categoryToPoints(category: string): number | null {
  const value = category.trim().toUpperCase();
  if (value === "NC") return 0;
  if (/^\d+$/.test(value)) return Number(value);
  return null;
}

/** Vrai si un classement respecte les bornes (interprétables) d'un tableau. */
export function isRankingAllowed(ranking: number, minimumCat: string, maximumCat: string): boolean {
  const min = categoryToPoints(minimumCat);
  const max = categoryToPoints(maximumCat);
  if (min !== null && ranking < min) return false;
  if (max !== null && ranking > max) return false;
  return true;
}
