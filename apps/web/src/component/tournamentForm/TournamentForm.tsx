"use client";

import { useEffect, useState, type FormEvent } from "react"
import { CircleAlert, Trash2, X } from "lucide-react"
import Button from "@web/component/button/Button"
import { ApiError, apiFetch } from "@web/lib/api"
import { MAX_CATEGORIES, MAX_ONLY_CATEGORIES, MIN_CATEGORIES, categoryRank } from "@web/lib/categories"
import "../modal/Modal.scss"
import "./TournamentForm.scss"

/** Tableau tel que renvoyé par l'API. */
export interface TournamentTable {
    id: string
    tournamentId: string
    letter: string
    minimumCat: string
    maximumCat: string
    startAt: string
    maxPlayers: number
    /** Prix en euros (décimal renvoyé sous forme de texte par l'API, ex. "8.5") */
    price: string
    /** Tableau « en plus » : ne compte pas dans la limite de tableaux par jour */
    extra: boolean
    /** Nombre de joueurs déjà inscrits */
    _count: { players: number }
}

/** Tournoi tel que renvoyé par l'API. */
export interface Tournament {
    id: string
    title: string
    /** Nom du juge-arbitre */
    ja: string
    /** Email du JA (facultatif) */
    email: string | null
    /** Téléphone du JA (facultatif) */
    phone: string | null
    /** Adresse de la salle */
    address: string
    startDate: string
    endDate: string
    /** Clôture des inscriptions */
    registrationEndAt: string
    /** Nombre maximum de tableaux par jour et par joueur (hors tableaux « en plus ») */
    tabMax: number
    createdAt: string
    tables: TournamentTable[]
}

interface TableRow {
    /** Clé locale pour React */
    key: number
    /** Id en base pour un tableau existant (modification), absent pour un nouveau tableau */
    id?: string
    /** Nombre d'inscrits (tableau existant) */
    players: number
    letter: string
    minimumCat: string
    maximumCat: string
    /** Jour du tableau "AAAA-MM-JJ" (choisi seulement si le tournoi dure plusieurs jours) */
    day: string
    /** Heure de début "HH:MM" */
    time: string
    maxPlayers: string
    /** Prix saisi en euros (« 8,50 » ou « 8.50 ») */
    price: string
    /** Tableau « en plus » (hors limite par jour) */
    extra: boolean
}

type TournamentField = "title" | "address" | "ja" | "email" | "phone" | "startDate" | "endDate" | "registrationEndAt" | "tabMax"
type TableField = "letter" | "minimumCat" | "maximumCat" | "day" | "time" | "maxPlayers" | "price"
interface Errors {
    fields: Partial<Record<TournamentField, string>>
    tables: Record<number, Partial<Record<TableField, string>>>
    tablesList?: string
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
const noErrors = (): Errors => ({ fields: {}, tables: {} })

/** Première lettre de A à Z pas encore utilisée. */
function nextLetter(rows: TableRow[]) {
    const used = new Set(rows.map((r) => r.letter.trim().toUpperCase()))
    return [...LETTERS].find((l) => !used.has(l)) ?? ""
}

const pad = (n: number) => String(n).padStart(2, "0")
/** Date ISO → "AAAA-MM-JJ" (heure locale), pour <input type="date">. */
const toInputDay = (iso: string) => { const d = new Date(iso); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` }
/** Date ISO → "HH:MM" (heure locale), pour <input type="time">. */
const toInputTime = (iso: string) => { const d = new Date(iso); return `${pad(d.getHours())}:${pad(d.getMinutes())}` }

/** Date ISO → "AAAA-MM-JJTHH:MM" (heure locale), pour <input type="datetime-local">. */
const toInputDateTime = (iso: string) => `${toInputDay(iso)}T${toInputTime(iso)}`

/** Prix de l'API ("8.5") → saisie française ("8,50"). */
const toInputPrice = (price: string) => Number(price).toFixed(2).replace(".", ",")
/** Saisie ("8,50" ou "8.50") → nombre, ou null si invalide. */
const parsePrice = (value: string) => (/^\d{1,4}([.,]\d{1,2})?$/.test(value.trim()) ? Number(value.trim().replace(",", ".")) : null)

const DEFAULT_TIME = "09:00"
const DEFAULT_TAB_MAX = "2"
const dayLabel = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long" })

/** Jours du tournoi ("AAAA-MM-JJ") entre la date de début et la date de fin incluses (14 au maximum). */
function tournamentDays(startDate: string, endDate: string): string[] {
    if (!startDate) return []
    if (!endDate || endDate < startDate) return [startDate]
    const days: string[] = []
    const cursor = new Date(`${startDate}T12:00:00`)
    while (days.length < 14) {
        const day = `${cursor.getFullYear()}-${pad(cursor.getMonth() + 1)}-${pad(cursor.getDate())}`
        if (day > endDate) break
        days.push(day)
        cursor.setDate(cursor.getDate() + 1)
    }
    return days
}

/** Début du jour (heure locale) pour une date "AAAA-MM-JJ". */
const dayStart = (date: string) => new Date(`${date}T00:00:00`)
/** Fin du jour (heure locale) : le tournoi reste « en cours » jusqu'au soir du dernier jour. */
const dayEnd = (date: string) => new Date(`${date}T23:59:59.999`)

/**
 * Création (sans `tournament`) ou modification (avec `tournament`) d'un tournoi et de ses tableaux.
 * Monté uniquement quand il est ouvert : l'état repart de zéro à chaque ouverture.
 */
export default function TournamentForm({ tournament, onClose, onSaved }: { tournament?: Tournament, onClose: () => void, onSaved: (tournament: Tournament) => void }) {
    const editing = !!tournament
    const [values, setValues] = useState<Record<TournamentField, string>>(() => tournament
        ? {
            title: tournament.title, address: tournament.address, ja: tournament.ja, email: tournament.email ?? "", phone: tournament.phone ?? "",
            startDate: toInputDay(tournament.startDate), endDate: toInputDay(tournament.endDate),
            registrationEndAt: toInputDateTime(tournament.registrationEndAt), tabMax: String(tournament.tabMax),
        }
        : { title: "", address: "", ja: "", email: "", phone: "", startDate: "", endDate: "", registrationEndAt: "", tabMax: DEFAULT_TAB_MAX })
    const [rows, setRows] = useState<TableRow[]>(() => tournament
        ? tournament.tables.map((t, index) => ({
            key: index, id: t.id, players: t._count.players, letter: t.letter, minimumCat: t.minimumCat,
            maximumCat: t.maximumCat, day: toInputDay(t.startAt), time: toInputTime(t.startAt), maxPlayers: String(t.maxPlayers), price: toInputPrice(t.price), extra: t.extra,
        }))
        : [{ key: 0, players: 0, letter: "A", minimumCat: "", maximumCat: "", day: "", time: DEFAULT_TIME, maxPlayers: "32", price: "", extra: false }])
    const [nextKey, setNextKey] = useState(() => (tournament ? tournament.tables.length : 1))
    const [errors, setErrors] = useState<Errors>(noErrors)
    const [formError, setFormError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !loading) onClose() }
        window.addEventListener("keydown", onKey)
        return () => window.removeEventListener("keydown", onKey)
    }, [loading, onClose])

    // Dates sélectionnables : pas de début avant aujourd'hui (en modification, l'ancien début reste autorisé
    // pour un tournoi déjà commencé), et pas de fin avant le début.
    const [today] = useState(() => toInputDay(new Date().toISOString()))
    const startMin = tournament && toInputDay(tournament.startDate) < today ? toInputDay(tournament.startDate) : today
    const endMin = values.startDate && values.startDate > startMin ? values.startDate : startMin
    // Clôture des inscriptions : pas dans le passé à la création, et au plus tard le soir du dernier jour
    const [nowInput] = useState(() => toInputDateTime(new Date().toISOString()))
    const registrationMin = editing ? undefined : nowInput
    const registrationMax = values.endDate ? `${values.endDate}T23:59` : undefined

    /**
     * Ramène les dates dans les limites, sans message d'erreur : début ≥ startMin, fin ≥ début,
     * clôture des inscriptions entre maintenant et la fin du tournoi.
     * Appelé en quittant un champ date (pas pendant la frappe, pour ne pas gêner la saisie de l'année).
     */
    const normalizeDates = (prev: Record<TournamentField, string>) => {
        const next = { ...prev }
        if (next.startDate && next.startDate < startMin) next.startDate = startMin
        const minEnd = next.startDate || startMin
        if (next.endDate && next.endDate < minEnd) next.endDate = minEnd
        if (next.registrationEndAt) {
            if (registrationMin && next.registrationEndAt < registrationMin) next.registrationEndAt = registrationMin
            const max = next.endDate ? `${next.endDate}T23:59` : undefined
            if (max && next.registrationEndAt > max) next.registrationEndAt = max
        }
        return next
    }

    const updateField = (field: TournamentField, value: string) => {
        setValues((prev) => {
            const next = { ...prev, [field]: value }
            // Début choisi après la fin : la fin suit le début
            if (field === "startDate" && /^\d{4}-\d{2}-\d{2}$/.test(value) && next.endDate && next.endDate < value) next.endDate = value
            return next
        })
        setErrors((prev) => ({ ...prev, fields: { ...prev.fields, [field]: undefined } }))
        setFormError(null)
    }

    const updateRow = (key: number, field: TableField, value: string) => {
        setRows((prev) => prev.map((r) => (r.key === key ? { ...r, [field]: value } : r)))
        setErrors((prev) => ({ ...prev, tables: { ...prev.tables, [key]: { ...prev.tables[key], [field]: undefined } }, tablesList: undefined }))
        setFormError(null)
    }

    const days = tournamentDays(values.startDate, values.endDate)
    const multiDay = days.length > 1
    /** Jour réellement retenu pour un tableau : celui choisi s'il est dans le tournoi, sinon le premier jour. */
    const effectiveDay = (row: TableRow) => (days.includes(row.day) ? row.day : days[0] ?? "")

    const addRow = () => {
        // Par défaut, un nouveau tableau commence à 9h le premier jour du tournoi
        setRows((prev) => [...prev, { key: nextKey, players: 0, letter: nextLetter(prev), minimumCat: "", maximumCat: "", day: days[0] ?? "", time: DEFAULT_TIME, maxPlayers: "32", price: "", extra: false }])
        setNextKey((k) => k + 1)
        setErrors((prev) => ({ ...prev, tablesList: undefined }))
    }

    const removeRow = (key: number) => setRows((prev) => prev.filter((r) => r.key !== key))
    const toggleExtra = (key: number) => setRows((prev) => prev.map((r) => (r.key === key ? { ...r, extra: !r.extra } : r)))

    const validate = (): Errors => {
        const result = noErrors()
        const f = result.fields
        if (!values.title.trim()) f.title = "Le titre est obligatoire"
        if (!values.address.trim()) f.address = "L'adresse de la salle est obligatoire"
        if (!values.ja.trim()) f.ja = "Le nom du JA est obligatoire"
        // Email et téléphone du JA : facultatifs, mais vérifiés s'ils sont renseignés
        if (values.email.trim() && !EMAIL_REGEX.test(values.email.trim())) f.email = "L'email du JA est invalide"
        if (values.phone.trim().length > 20) f.phone = "20 caractères maximum"
        if (!values.startDate) f.startDate = "La date de début est obligatoire"
        if (!values.endDate) f.endDate = "La date de fin est obligatoire"
        // Fin avant début ou dates passées : impossibles à sélectionner (voir startMin / endMin)
        if (!values.registrationEndAt) f.registrationEndAt = "La clôture des inscriptions est obligatoire"
        const tabMax = Number(values.tabMax)
        if (!Number.isInteger(tabMax) || tabMax < 1 || tabMax > 50) f.tabMax = "Entre 1 et 50"

        if (rows.length === 0) result.tablesList = "Ajoutez au moins un tableau"
        const seen = new Set<string>()
        for (const row of rows) {
            const e: Partial<Record<TableField, string>> = {}
            const letter = row.letter.trim().toUpperCase()
            if (!/^[A-Z0-9]{1,10}$/.test(letter)) e.letter = "Lettre invalide"
            else if (seen.has(letter)) e.letter = "Déjà utilisée"
            seen.add(letter)
            const minRank = categoryRank(row.minimumCat)
            const maxRank = categoryRank(row.maximumCat)
            if (!row.minimumCat) e.minimumCat = "Obligatoire"
            else if (minRank === -1 || minRank >= MIN_CATEGORIES.length) e.minimumCat = "Choisissez dans la liste"
            if (!row.maximumCat) e.maximumCat = "Obligatoire"
            else if (maxRank === -1) e.maximumCat = "Choisissez dans la liste"
            if (!e.minimumCat && !e.maximumCat && minRank > maxRank) e.minimumCat = "Supérieure au max"
            if (!/^\d{2}:\d{2}$/.test(row.time)) e.time = "Obligatoire"
            const max = Number(row.maxPlayers)
            if (!Number.isInteger(max) || max < 2 || max > 1000) e.maxPlayers = "Entre 2 et 1000"
            else if (max < row.players) e.maxPlayers = `Au moins ${row.players} (inscrits)`
            if (!row.price.trim()) e.price = "Obligatoire"
            else if (parsePrice(row.price) === null) e.price = "Ex : 8,50"
            if (Object.keys(e).length > 0) result.tables[row.key] = e
        }
        return result
    }

    const hasErrors = (e: Errors) => Object.keys(e.fields).length > 0 || Object.keys(e.tables).length > 0 || !!e.tablesList

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (loading) return

        // Validation avec Entrée sans quitter le champ date : on applique aussi les limites
        const dates = normalizeDates(values)
        setValues(dates)

        const validation = validate()
        setErrors(validation)
        setFormError(null)
        if (hasErrors(validation)) return

        setLoading(true)
        try {
            const saved = await apiFetch<Tournament>(tournament ? `/tournaments/${tournament.id}` : "/tournaments", {
                method: tournament ? "PATCH" : "POST",
                body: JSON.stringify({
                    title: values.title.trim(),
                    address: values.address.trim(),
                    ja: values.ja.trim(),
                    email: values.email.trim() || null,
                    phone: values.phone.trim() || null,
                    startDate: dayStart(dates.startDate).toISOString(),
                    endDate: dayEnd(dates.endDate).toISOString(),
                    registrationEndAt: new Date(dates.registrationEndAt).toISOString(),
                    tabMax: Number(values.tabMax),
                    tables: rows.map((r) => ({
                        ...(r.id ? { id: r.id } : {}),
                        letter: r.letter.trim().toUpperCase(),
                        minimumCat: r.minimumCat.trim(),
                        maximumCat: r.maximumCat.trim(),
                        // Jour du tableau + heure saisie (heure locale)
                        startAt: new Date(`${effectiveDay(r)}T${r.time}:00`).toISOString(),
                        maxPlayers: Number(r.maxPlayers),
                        price: parsePrice(r.price),
                        extra: r.extra,
                    })),
                }),
            })
            onSaved(saved)
            onClose()
        } catch (error) {
            if (error instanceof ApiError && error.status === 401) setFormError("Votre session a expiré, reconnectez-vous")
            else if (error instanceof ApiError && error.status === 404) setFormError("Ce tournoi n'existe plus")
            else if (error instanceof ApiError && (error.status === 400 || error.status === 409)) setFormError(error.message)
            else setFormError(editing ? "Impossible d'enregistrer les modifications, réessayez plus tard" : "Impossible de créer le tournoi, réessayez plus tard")
            setLoading(false)
        }
    }

    const field = (name: TournamentField, label: string, props: { type?: string, placeholder?: string, maxLength?: number, hint?: string, min?: string, max?: string, digitsOnly?: boolean } = {}) => (
        <div className="extranet-modal-main-container">
            <label htmlFor={`tournament-${name}`} className="extranet-modal-main-container_label">{label}</label>
            <input
                id={`tournament-${name}`}
                className={`extranet-modal-main-container_input ${errors.fields[name] ? "extranet-modal-main-container_input--error" : ""}`}
                type={props.type ?? "text"}
                placeholder={props.placeholder}
                maxLength={props.maxLength}
                min={props.min}
                max={props.max}
                value={values[name]}
                onChange={(e) => updateField(name, props.digitsOnly ? e.target.value.replace(/\D/g, "") : e.target.value)}
                onBlur={props.type === "date" || props.type === "datetime-local" ? () => setValues(normalizeDates) : undefined}
                aria-invalid={!!errors.fields[name]}
            />
            <div className="extranet-modal-main-container-foot">
                <span className="extranet-modal-main-container-foot_error">{errors.fields[name]}</span>
                {props.hint && <span className="extranet-modal-main-container-foot_hint">{props.hint}</span>}
            </div>
        </div>
    )

    const cell = (row: TableRow, name: TableField, label: string, props: { type?: string, placeholder?: string, maxLength?: number, inputMode?: "numeric" | "decimal" } = {}) => {
        const error = errors.tables[row.key]?.[name]
        return (
            <div className="extranet-tournament-form-table_cell">
                <label htmlFor={`table-${row.key}-${name}`} className="extranet-modal-main-container_label">{label}</label>
                <input
                    id={`table-${row.key}-${name}`}
                    className={`extranet-modal-main-container_input ${error ? "extranet-modal-main-container_input--error" : ""}`}
                    type={props.type ?? "text"}
                    inputMode={props.inputMode}
                    placeholder={props.placeholder}
                    maxLength={props.maxLength}
                    value={row[name]}
                    onChange={(e) => updateRow(row.key, name, name === "maxPlayers" ? e.target.value.replace(/\D/g, "") : e.target.value)}
                    aria-invalid={!!error}
                />
                <span className="extranet-modal-main-container-foot_error">{error}</span>
            </div>
        )
    }

    /**
     * Liste déroulante d'une borne de catégorie. Les choix qui rendraient min > max sont grisés,
     * et « Non numéroté », « Toute série », « Toute série Femme » ne sont proposés qu'en max.
     * Une ancienne valeur hors liste (tableau créé avant les listes) reste affichée, à remplacer.
     */
    const categoryCell = (row: TableRow, name: "minimumCat" | "maximumCat") => {
        const error = errors.tables[row.key]?.[name]
        const isMin = name === "minimumCat"
        const options: readonly string[] = isMin ? MIN_CATEGORIES : MAX_CATEGORIES
        const value = row[name]
        const legacy = value !== "" && !options.includes(value)
        const otherRank = categoryRank(isMin ? row.maximumCat : row.minimumCat)
        const disabled = (option: string) => {
            if (otherRank === -1) return false
            const rank = categoryRank(option)
            return isMin ? rank > otherRank : rank < otherRank
        }
        return (
            <div className="extranet-tournament-form-table_cell">
                <label htmlFor={`table-${row.key}-${name}`} className="extranet-modal-main-container_label">{isMin ? "Catégorie min *" : "Catégorie max *"}</label>
                <select
                    id={`table-${row.key}-${name}`}
                    className={`extranet-modal-main-container_input ${error ? "extranet-modal-main-container_input--error" : ""}`}
                    value={value}
                    onChange={(e) => updateRow(row.key, name, e.target.value)}
                    aria-invalid={!!error}
                >
                    <option value="" disabled>Choisir…</option>
                    {legacy && <option value={value} disabled>{value} (à remplacer)</option>}
                    {!isMin && <optgroup label="Classement">{MIN_CATEGORIES.map((c) => <option key={c} value={c} disabled={disabled(c)}>{c}</option>)}</optgroup>}
                    {!isMin && <optgroup label="Autres">{MAX_ONLY_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</optgroup>}
                    {isMin && MIN_CATEGORIES.map((c) => <option key={c} value={c} disabled={disabled(c)}>{c}</option>)}
                </select>
                <span className="extranet-modal-main-container-foot_error">{error}</span>
            </div>
        )
    }

    return (
        <>
            <div className="extranet-modal-filter" onClick={() => !loading && onClose()}></div>
            <div className="extranet-modal extranet-modal--large extranet-tournament-form-modal" role="dialog" aria-modal="true" aria-labelledby="tournament-form-title">
                <div className="extranet-modal-header">
                    <div className="extranet-modal-header-head">
                        <h1 id="tournament-form-title" className="extranet-modal-header-head_title">{editing ? "Modifier le tournoi" : "Créer un tournoi"}</h1>
                        <span className="extranet-modal-header-head_subtitle">Tous les champs * sont obligatoires</span>
                    </div>
                    <button type="button" className="extranet-modal-header_close" onClick={onClose} disabled={loading} aria-label="Fermer">
                        <X size={18} />
                    </button>
                </div>

                <form className="extranet-modal-main" onSubmit={handleSubmit} noValidate>
                    {formError && (
                        <div className="extranet-modal-main_alert" role="alert">
                            <CircleAlert size={16} /> {formError}
                        </div>
                    )}

                    <h2 className="extranet-tournament-form_section">Le tournoi</h2>
                    {field("title", "Titre *", { placeholder: "Ex : 18e Open National de Perpignan", maxLength: 191 })}
                    {field("address", "Adresse de la salle *", {
                        placeholder: "Ex : Salle Henri Blanc, 15 Rue du Tennis de Table, 66000 Perpignan", maxLength: 255,
                        hint: "Affichée sur la page du tournoi et dans le mail de confirmation",
                    })}
                    <div className="extranet-modal-main-grid">
                        {field("startDate", "Début *", { type: "date", min: startMin })}
                        {field("endDate", "Fin *", { type: "date", min: endMin })}
                    </div>
                    <div className="extranet-modal-main-grid">
                        {field("registrationEndAt", "Clôture des inscriptions *", {
                            type: "datetime-local", min: registrationMin, max: registrationMax,
                            hint: "Après cette date, le formulaire d'inscription est bloqué",
                        })}
                        {field("tabMax", "Tableaux max par jour *", {
                            placeholder: "2", maxLength: 2, digitsOnly: true,
                            hint: "Par joueur, hors tableaux « en plus »",
                        })}
                    </div>

                    <h2 className="extranet-tournament-form_section">Juge-arbitre (JA)</h2>
                    {field("ja", "Nom du JA *", { placeholder: "Prénom Nom", maxLength: 191 })}
                    <div className="extranet-modal-main-grid">
                        {field("email", "Email du JA", { type: "email", placeholder: "ja@exemple.fr", maxLength: 191, hint: "Facultatif" })}
                        {field("phone", "Téléphone du JA", { type: "tel", placeholder: "06 XX XX XX XX", maxLength: 20, hint: "Facultatif" })}
                    </div>

                    <h2 className="extranet-tournament-form_section">Tableaux ({rows.length})</h2>
                    <ul className="extranet-tournament-form-tables">
                        {rows.map((row) => (
                            <li key={row.key} className={`extranet-tournament-form-table ${multiDay ? "extranet-tournament-form-table--multi-day" : ""}`}>
                                <span className="extranet-tournament-form-table_badge" title={row.players > 0 ? `${row.players} inscrit(s)` : undefined}>
                                    {row.letter.trim().toUpperCase() || "?"}
                                    {row.players > 0 && <span className="extranet-tournament-form-table_count">{row.players}</span>}
                                </span>
                                {cell(row, "letter", "Lettre *", { placeholder: "A", maxLength: 10 })}
                                {categoryCell(row, "minimumCat")}
                                {categoryCell(row, "maximumCat")}
                                {/* Le jour n'est demandé que si le tournoi dure plusieurs jours */}
                                {multiDay && (
                                    <div className="extranet-tournament-form-table_cell">
                                        <label htmlFor={`table-${row.key}-day`} className="extranet-modal-main-container_label">Jour *</label>
                                        <select
                                            id={`table-${row.key}-day`}
                                            className="extranet-modal-main-container_input"
                                            value={effectiveDay(row)}
                                            onChange={(e) => updateRow(row.key, "day", e.target.value)}
                                        >
                                            {days.map((day) => (
                                                <option key={day} value={day}>{dayLabel.format(new Date(`${day}T12:00:00`))}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                {cell(row, "time", "Heure *", { type: "time" })}
                                {cell(row, "maxPlayers", "Joueurs max *", { placeholder: "32", inputMode: "numeric", maxLength: 4 })}
                                {cell(row, "price", "Prix (€) *", { placeholder: "8,50", inputMode: "decimal", maxLength: 7 })}
                                <label
                                    className="extranet-tournament-form-table_extra"
                                    title={`Tableau en plus : peut être choisi même si la limite de ${values.tabMax || "?"} tableau(x) par jour est atteinte`}
                                >
                                    <span className="extranet-modal-main-container_label">En plus</span>
                                    <input type="checkbox" checked={row.extra} onChange={() => toggleExtra(row.key)} disabled={loading} />
                                </label>
                                <button
                                    type="button"
                                    className="extranet-tournament-form-table_remove"
                                    onClick={() => removeRow(row.key)}
                                    disabled={loading || row.players > 0}
                                    aria-label={`Retirer le tableau ${row.letter || ""}`}
                                    title={row.players > 0 ? "Ce tableau a des inscrits : il ne peut pas être retiré" : "Retirer ce tableau"}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </li>
                        ))}
                    </ul>
                    {errors.tablesList && <span className="extranet-modal-main-container-foot_error">{errors.tablesList}</span>}
                    <Button type="button" variant="action" lib="Ajouter un tableau" onClick={addRow} disabled={loading || rows.length >= 50} width="100%" />

                    <div className="extranet-modal-main-actions">
                        <Button type="button" variant="tertiary" lib="Annuler" height="40px" onClick={onClose} disabled={loading} />
                        <Button type="submit" variant="secondary" lib={loading ? "Enregistrement…" : editing ? "Enregistrer les modifications" : "Créer le tournoi"} height="40px" disabled={loading} />
                    </div>
                </form>
            </div>
        </>
    )
}
