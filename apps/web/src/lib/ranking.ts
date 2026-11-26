/**
 * Même règle que l'API (apps/api/src/tournament/ranking.ts) :
 * - « NC » (non classé) → 0
 * - un nombre (« 800 », « 1000 »…) → ce nombre
 * - tout autre texte (« N°300 », « TC », « Non numéroté »…) → null : aucun contrôle sur cette borne.
 */
export function categoryToPoints(category: string): number | null {
    const value = category.trim().toUpperCase()
    if (value === "NC") return 0
    if (/^\d+$/.test(value)) return Number(value)
    return null
}

/** Le tableau a-t-il au moins une borne interprétable (et donc un contrôle de classement) ? */
export function hasRankingBounds(minimumCat: string, maximumCat: string): boolean {
    return categoryToPoints(minimumCat) !== null || categoryToPoints(maximumCat) !== null
}

/** Vrai si un classement respecte les bornes (interprétables) d'un tableau. */
export function isRankingAllowed(ranking: number, minimumCat: string, maximumCat: string): boolean {
    const min = categoryToPoints(minimumCat)
    const max = categoryToPoints(maximumCat)
    if (min !== null && ranking < min) return false
    if (max !== null && ranking > max) return false
    return true
}
