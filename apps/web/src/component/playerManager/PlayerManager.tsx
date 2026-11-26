"use client";

import { useEffect, useRef, useState } from "react"
import { CircleAlert, LoaderCircle, Search, Trash2, UserX, Users, X } from "lucide-react"
import { ApiError, apiFetch } from "@web/lib/api"
import "@web/component/modal/Modal.scss"
import "./PlayerManager.scss"

interface PlayerTable {
    tableId: string
    letter: string
    startAt: string
}

interface RegisteredPlayer {
    licence: string
    name: string
    surname: string
    club: string
    ranking: number
    numbered: number | null
    email: string
    phone: string | null
    tables: PlayerTable[]
}

/** Action en attente de confirmation : désinscription d'un tableau, ou suppression du tournoi. */
type Pending =
    | { kind: "table", player: RegisteredPlayer, table: PlayerTable }
    | { kind: "tournament", player: RegisteredPlayer }

const DEBOUNCE_MS = 250
const dayFormatter = new Intl.DateTimeFormat("fr-FR", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })

function errorMessage(error: unknown, fallback: string) {
    if (error instanceof ApiError && error.status === 401) return "Votre session a expiré, reconnectez-vous"
    if (error instanceof ApiError && error.status === 404) return error.message
    return fallback
}

/** Met en gras la partie du texte qui correspond à la recherche. */
function Highlight({ text, query }: { text: string, query: string }) {
    const words = query.trim().split(/\s+/).filter(Boolean).map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    if (words.length === 0) return <>{text}</>
    const parts = text.split(new RegExp(`(${words.join("|")})`, "gi"))
    return <>{parts.map((part, i) => i % 2 === 1 ? <mark key={i}>{part}</mark> : part)}</>
}

/**
 * Fenêtre d'administration des inscrits : recherche dynamique d'un joueur (nom, prénom, licence, club),
 * puis désinscription d'un tableau ou suppression du tournoi. `onChanged` recharge le nombre d'inscrits.
 */
export default function PlayerManager({ tournamentId, onClose, onChanged }: {
    tournamentId: string
    onClose: () => void
    onChanged: () => void
}) {
    const inputRef = useRef<HTMLInputElement>(null)
    const [query, setQuery] = useState("")
    const [results, setResults] = useState<RegisteredPlayer[] | null>(null)
    const [searching, setSearching] = useState(false)
    const [searchError, setSearchError] = useState<string | null>(null)
    const [pending, setPending] = useState<Pending | null>(null)
    const [working, setWorking] = useState(false)
    const [actionError, setActionError] = useState<string | null>(null)
    const [notice, setNotice] = useState<string | null>(null)

    useEffect(() => { inputRef.current?.focus() }, [])

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key !== "Escape" || working) return
            if (pending) setPending(null)
            else onClose()
        }
        window.addEventListener("keydown", onKey)
        return () => window.removeEventListener("keydown", onKey)
    }, [pending, working, onClose])

    // Recherche dynamique : relancée à chaque frappe, après une courte pause ; la réponse d'une ancienne frappe est ignorée
    // Sans recherche : tous les inscrits, chargés immédiatement
    useEffect(() => {
        const q = query.trim()
        let cancelled = false
        setSearching(true)
        const timer = setTimeout(() => {
            apiFetch<RegisteredPlayer[]>(`/tournaments/${tournamentId}/players?q=${encodeURIComponent(q)}`)
                .then((players) => { if (!cancelled) { setResults(players); setSearchError(null) } })
                .catch((error) => { if (!cancelled) setSearchError(errorMessage(error, "Impossible de rechercher les joueurs, réessayez")) })
                .finally(() => { if (!cancelled) setSearching(false) })
        }, q ? DEBOUNCE_MS : 0)
        return () => { cancelled = true; clearTimeout(timer) }
    }, [query, tournamentId])

    const confirm = async () => {
        if (!pending || working) return
        setWorking(true)
        setActionError(null)
        const { player } = pending
        const fullName = `${player.name} ${player.surname.toUpperCase()}`
        try {
            if (pending.kind === "table") {
                await apiFetch(`/tournaments/${tournamentId}/players/${encodeURIComponent(player.licence)}/tables/${pending.table.tableId}`, { method: "DELETE" })
                const tableId = pending.table.tableId
                // Sans tableau restant, le joueur n'est plus inscrit au tournoi : on le retire de la liste
                setResults((prev) => prev && prev
                    .map((p) => p.licence === player.licence ? { ...p, tables: p.tables.filter((t) => t.tableId !== tableId) } : p)
                    .filter((p) => p.tables.length > 0))
                setNotice(`${fullName} a été désinscrit(e) du tableau ${pending.table.letter}`)
            } else {
                await apiFetch(`/tournaments/${tournamentId}/players/${encodeURIComponent(player.licence)}`, { method: "DELETE" })
                setResults((prev) => prev && prev.filter((p) => p.licence !== player.licence))
                setNotice(`${fullName} a été supprimé(e) du tournoi`)
            }
            setPending(null)
            onChanged()
        } catch (error) {
            setActionError(errorMessage(error, "L'opération a échoué, réessayez plus tard"))
        } finally {
            setWorking(false)
        }
    }

    const ask = (next: Pending) => {
        setActionError(null)
        setNotice(null)
        setPending(next)
    }

    const isPending = (player: RegisteredPlayer, tableId?: string) =>
        pending?.player.licence === player.licence && (tableId ? pending.kind === "table" && pending.table.tableId === tableId : pending.kind === "tournament")

    return (
        <>
            <div className="extranet-modal-filter" onClick={() => !working && onClose()}></div>
            <div className="extranet-modal extranet-modal--large player-manager" role="dialog" aria-modal="true" aria-labelledby="player-manager-title">
                <div className="extranet-modal-header">
                    <div className="extranet-modal-header-head">
                        <h1 id="player-manager-title" className="extranet-modal-header-head_title">Gérer les inscrits</h1>
                        <span className="extranet-modal-header-head_subtitle">Désinscrire un joueur d&apos;un tableau ou le supprimer du tournoi</span>
                    </div>
                    <button type="button" className="extranet-modal-header_close" onClick={onClose} disabled={working} aria-label="Fermer">
                        <X size={18} />
                    </button>
                </div>

                <div className="extranet-modal-main">
                    <div className="player-manager-search">
                        <Search size={18} className="player-manager-search_icon" />
                        <input
                            ref={inputRef}
                            type="search"
                            className="player-manager-search_input"
                            placeholder="Rechercher par nom, prénom, licence ou club…"
                            value={query}
                            maxLength={100}
                            onChange={(e) => { setQuery(e.target.value); setNotice(null); setPending(null) }}
                            aria-label="Rechercher un joueur"
                            autoComplete="off"
                        />
                        {searching && <LoaderCircle size={18} className="player-manager-search_spinner" aria-label="Recherche en cours" />}
                    </div>

                    {notice && <div className="player-manager_notice" role="status">{notice}</div>}
                    {(searchError || actionError) && (
                        <div className="extranet-modal-main_alert" role="alert">
                            <CircleAlert size={16} /> {searchError ?? actionError}
                        </div>
                    )}

                    <div className="player-manager-results" aria-live="polite">
                        {results === null && !searchError && (
                            <div className="player-manager-empty">
                                <LoaderCircle size={32} className="player-manager-search_spinner player-manager-empty_spinner" />
                                <span>Chargement des inscrits…</span>
                            </div>
                        )}
                        {results?.length === 0 && !searching && (
                            <div className="player-manager-empty">
                                {query.trim() ? <UserX size={32} /> : <Users size={32} />}
                                <span>{query.trim() ? <>Aucun inscrit ne correspond à « {query.trim()} ».</> : "Aucun joueur n'est encore inscrit à ce tournoi."}</span>
                            </div>
                        )}
                        {results && results.length > 0 && (
                            <p className="player-manager_count">
                                {query.trim()
                                    ? <>{results.length} joueur{results.length > 1 ? "s" : ""} trouvé{results.length > 1 ? "s" : ""}</>
                                    : <>{results.length} joueur{results.length > 1 ? "s" : ""} inscrit{results.length > 1 ? "s" : ""}</>}
                            </p>
                        )}

                        {results?.map((player) => (
                            <article key={player.licence} className="player-manager-card">
                                <div className="player-manager-card-head">
                                    <div className="player-manager-card-head-identity">
                                        <span className="player-manager-card-head-identity_name">
                                            <Highlight text={`${player.name} ${player.surname.toUpperCase()}`} query={query} />
                                        </span>
                                        <span className="player-manager-card-head-identity_meta">
                                            Licence <Highlight text={player.licence} query={query} /> · <Highlight text={player.club} query={query} /> · {player.ranking} pts{player.numbered ? ` · N°${player.numbered}` : ""}
                                        </span>
                                        <span className="player-manager-card-head-identity_meta">
                                            {player.email}{player.phone ? ` · ${player.phone}` : ""}
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        className="player-manager-card-head_remove"
                                        onClick={() => ask({ kind: "tournament", player })}
                                        disabled={working}
                                    >
                                        <Trash2 size={14} /> Supprimer du tournoi
                                    </button>
                                </div>

                                <div className="player-manager-card-tables">
                                    {player.tables.map((table) => (
                                        <span key={table.tableId} className={`player-manager-card-tables-chip ${isPending(player, table.tableId) ? "player-manager-card-tables-chip--pending" : ""}`}>
                                            <strong>Tableau {table.letter}</strong>
                                            <span className="player-manager-card-tables-chip_date">{dayFormatter.format(new Date(table.startAt))}</span>
                                            <button
                                                type="button"
                                                className="player-manager-card-tables-chip_btn"
                                                onClick={() => ask({ kind: "table", player, table })}
                                                disabled={working}
                                                aria-label={`Désinscrire du tableau ${table.letter}`}
                                                title={`Désinscrire du tableau ${table.letter}`}
                                            >
                                                <X size={14} />
                                            </button>
                                        </span>
                                    ))}
                                </div>

                                {pending && pending.player.licence === player.licence && (
                                    <div className="player-manager-card-confirm" role="alertdialog" aria-label="Confirmation">
                                        <span>
                                            {pending.kind === "table"
                                                ? <>Désinscrire <strong>{player.name} {player.surname.toUpperCase()}</strong> du <strong>tableau {pending.table.letter}</strong>{player.tables.length === 1 ? " ? C'est son seul tableau : il ne sera plus inscrit au tournoi." : " ?"}</>
                                                : <>Supprimer <strong>{player.name} {player.surname.toUpperCase()}</strong> du tournoi ? Il sera désinscrit de {player.tables.length > 1 ? `ses ${player.tables.length} tableaux` : "son tableau"}.</>}
                                        </span>
                                        <div className="player-manager-card-confirm-actions">
                                            <button type="button" className="player-manager-card-confirm-actions_cancel" onClick={() => setPending(null)} disabled={working}>
                                                Annuler
                                            </button>
                                            <button type="button" className="player-manager-card-confirm-actions_confirm" onClick={confirm} disabled={working}>
                                                {working ? "Suppression…" : pending.kind === "table" ? "Désinscrire" : "Supprimer"}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </article>
                        ))}

                    </div>
                </div>
            </div>
        </>
    )
}
