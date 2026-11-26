/**
 * Catégories proposées pour les bornes d'un tableau (même liste que apps/api/src/tournament/categories.ts).
 * Les catégories « spéciales » ne peuvent être qu'une borne maximale.
 */
export const MIN_CATEGORIES = [
    "NC", "599", "699", "799", "899", "999", "1199", "1299", "1399", "1499", "1599", "1699", "1799", "1899", "1999",
] as const

export const MAX_ONLY_CATEGORIES = ["Non numéroté", "Toute série", "Toute série Femme", "Handicap"] as const

export const MAX_CATEGORIES = [...MIN_CATEGORIES, ...MAX_ONLY_CATEGORIES] as const

/** Rang d'une catégorie dans la liste (sert à vérifier min ≤ max) ; -1 si elle n'en fait pas partie. */
export function categoryRank(category: string): number {
    return (MAX_CATEGORIES as readonly string[]).indexOf(category)
}
