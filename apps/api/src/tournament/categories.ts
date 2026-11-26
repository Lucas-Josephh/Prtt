/**
 * Catégories proposées pour les bornes d'un tableau (même liste que apps/web/src/lib/categories.ts).
 * Les catégories « spéciales » ne peuvent être qu'une borne maximale.
 */
export const MIN_CATEGORIES = [
  "NC", "599", "699", "799", "899", "999", "1199", "1299", "1399", "1499", "1599", "1699", "1799", "1899", "1999",
] as const;

export const MAX_ONLY_CATEGORIES = ["Non numéroté", "Toute série", "Toute série Femme", "Handicap"] as const;

export const MAX_CATEGORIES = [...MIN_CATEGORIES, ...MAX_ONLY_CATEGORIES] as const;

/** Rang d'une catégorie dans la liste (sert à vérifier min ≤ max) ; -1 si elle n'en fait pas partie. */
export function categoryRank(category: string): number {
  return (MAX_CATEGORIES as readonly string[]).indexOf(category);
}

/** Vrai si la borne minimale n'est pas au-dessus de la borne maximale. */
export function isCategoryRangeValid(minimumCat: string, maximumCat: string): boolean {
  const min = categoryRank(minimumCat);
  const max = categoryRank(maximumCat);
  return min !== -1 && max !== -1 && min <= max;
}
