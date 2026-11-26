"use client";

import { Clock, Users, X } from "lucide-react"
import "./table.scss"
import type { TournamentTable } from "@web/component/tournamentForm/TournamentForm"
import { hasRankingBounds, isRankingAllowed } from "@web/lib/ranking"

const dayFormatter = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long" })
export const priceFormatter = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" })
const hourFormatter = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" })

/** "samedi 23 mai" → "Samedi 23 mai" */
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

/** Regroupe les tableaux par jour de début (ils arrivent déjà triés par heure). */
function groupByDay(tables: TournamentTable[]) {
    const groups = new Map<string, TournamentTable[]>()
    for (const table of tables) {
        const day = capitalize(dayFormatter.format(new Date(table.startAt)))
        groups.set(day, [...(groups.get(day) ?? []), table])
    }
    return [...groups.entries()]
}

/**
 * Raison pour laquelle un joueur ne peut pas choisir ce tableau, ou null s'il le peut.
 * Les bornes non interprétables (« N°300 », « TC »…) ne bloquent jamais : seuls NC et les nombres sont contrôlés.
 */
export function tableUnavailableReason(table: TournamentTable, ranking: number | null): string | null {
    if (new Date(table.startAt) <= new Date()) return "Déjà commencé"
    if (table._count.players >= table.maxPlayers) return "Complet"
    if (hasRankingBounds(table.minimumCat, table.maximumCat)) {
        if (ranking === null) return "Indiquez votre classement"
        if (!isRankingAllowed(ranking, table.minimumCat, table.maximumCat)) return "Hors de votre classement"
    }
    return null
}

/** Jour local "AAAA-MM-JJ" d'un tableau (pour la limite de tableaux par jour). */
const dayKey = (iso: string) => new Date(iso).toLocaleDateString("en-CA")

/**
 * Limite de tableaux par jour atteinte pour ce tableau ? Les tableaux « en plus » ne comptent pas et
 * restent toujours sélectionnables ; un tableau déjà sélectionné peut toujours être désélectionné.
 */
export function dayLimitReached(table: TournamentTable, tables: TournamentTable[], selected: string[], tabMax: number): boolean {
    if (table.extra || selected.includes(table.id)) return false
    const day = dayKey(table.startAt)
    const count = tables.filter((t) => !t.extra && selected.includes(t.id) && dayKey(t.startAt) === day).length
    return count >= tabMax
}

/** Popup « Choisir mes tableaux » : tableaux du tournoi en cours, regroupés par jour. */
export default function Table({ close, handleTogglePop, tables, selected, onToggle, ranking, tabMax }: {
    close: boolean
    handleTogglePop: (state: boolean) => void
    tables: TournamentTable[]
    selected: string[]
    onToggle: (tableId: string) => void
    /** Classement saisi par le joueur (null tant qu'il n'est pas renseigné) */
    ranking: number | null
    /** Nombre maximum de tableaux par jour (hors tableaux « en plus ») */
    tabMax: number
}) {
    return (
        <>
            {close &&
                <>
                    <div className="extranet-table-filter" onClick={() => handleTogglePop(false)}></div>
                    <div className="extranet-table" role="dialog" aria-modal="true" aria-labelledby="table-title">
                        <div className="extranet-table-header">
                            <div className="extranet-table-header-head">
                                <h1 id="table-title" className="extranet-table-header-head_title">Choisir mes tableaux</h1>
                                <span className="extranet-table-header-head_subtitle">
                                    {ranking === null
                                        ? "Indiquez votre classement dans le formulaire pour voir les tableaux qui vous sont ouverts"
                                        : `Tableaux accessibles avec votre classement (${ranking} pts)`}
                                    {" · "}{tabMax} tableau{tabMax > 1 ? "x" : ""} maximum par jour, hors tableaux « en plus »
                                </span>
                            </div>
                            <X size="18" style={{cursor: "pointer"}} onClick={() => handleTogglePop(false)} />
                        </div>
                        <div className="extranet-table-main">
                            {tables.length === 0 && <p className="extranet-table-main_empty">Aucun tableau pour ce tournoi.</p>}
                            {groupByDay(tables).map(([day, dayTables]) => (
                                <div key={day} className="extranet-table-main-day">
                                    <h2 className="extranet-table-main_date">{day}</h2>
                                    <ul className="extranet-table-main-list">
                                        {dayTables.map((table) => {
                                            const isSelected = selected.includes(table.id)
                                            const reason = tableUnavailableReason(table, ranking)
                                                ?? (dayLimitReached(table, tables, selected, tabMax) ? `Limite de ${tabMax} tableau${tabMax > 1 ? "x" : ""} ce jour atteinte` : null)
                                            const unavailable = reason !== null
                                            return (
                                                <li key={table.id} className={`extranet-table-main-list-li ${isSelected ? "extranet-table-main-list-li--selected" : ""} ${unavailable ? "extranet-table-main-list-li--disabled" : ""}`}>
                                                    <button
                                                        type="button"
                                                        className="extranet-table-main-list-li-btn"
                                                        onClick={() => onToggle(table.id)}
                                                        // Un tableau sélectionné reste désélectionnable même s'il n'est plus accessible
                                                        disabled={unavailable && !isSelected}
                                                        aria-pressed={isSelected}
                                                        title={reason ?? undefined}
                                                    >
                                                        <div className="extranet-table-main-list-li-btn_num">{table.letter}</div>
                                                        <div className="extranet-table-main-list-li-btn-contain">
                                                            <div className="extranet-table-main-list-li-btn-contain-content">
                                                                <span className="extranet-table-main-list-li-btn-contain-content_tb">Tableau {table.letter}</span>
                                                                {table.extra && <span className="extranet-table-main-list-li-btn-contain-content_extra" title="Ne compte pas dans la limite de tableaux par jour">En plus</span>}
                                                                <span className="extranet-table-main-list-li-btn-contain-content_classe">{table.minimumCat} - {table.maximumCat}</span>
                                                                <span className="extranet-table-main-list-li-btn-contain-content_price">{priceFormatter.format(Number(table.price))}</span>
                                                            </div>
                                                            <div className="extranet-table-main-list-li-btn-contain-content">
                                                                <span className="extranet-table-main-list-li-btn-contain-content_date"><Clock size="10" />{hourFormatter.format(new Date(table.startAt)).replace(":", "h")}</span>
                                                                <span className={`extranet-table-main-list-li-btn-contain-content_number ${table._count.players >= table.maxPlayers ? "extranet-table-main-list-li-btn-contain-content_number--full" : ""}`}>
                                                                    <Users size="10" /> {table._count.players}/{table.maxPlayers}
                                                                </span>
                                                                {reason && <span className="extranet-table-main-list-li-btn-contain-content_reason">{reason}</span>}
                                                            </div>
                                                        </div>
                                                    </button>
                                                </li>
                                            )
                                        })}
                                    </ul>
                                </div>
                            ))}
                            <p className="extranet-table-main_payment">Paiement sur place, le jour du tournoi</p>
                            <button type="button" className="extranet-table-main_done" onClick={() => handleTogglePop(false)}>
                                Valider ma sélection ({selected.length})
                            </button>
                        </div>
                    </div>
                </>
            }
        </>
    )
}
