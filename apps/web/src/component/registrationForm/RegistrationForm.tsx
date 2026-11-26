"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react"
import { CircleAlert, CircleCheck, Lock, Mail, Wallet } from "lucide-react"
import Button from "@web/component/button/Button"
import Table, { priceFormatter, tableUnavailableReason } from "@web/component/table/table"
import type { Tournament } from "@web/component/tournamentForm/TournamentForm"
import { ApiError, apiFetch } from "@web/lib/api"

/** À partir de ce classement, le joueur peut indiquer son numéro (joueurs numérotés). */
const NUMBERED_MIN_RANKING = 2000

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
/** Nombre maximum de chiffres du classement FFTT (identique au contrôle de l'API). */
const RANKING_MAX_DIGITS = 4

const closingFormatter = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })

type Field = "surname" | "name" | "licence" | "ranking" | "numbered" | "club" | "email" | "phone" | "tables"
type Values = Record<Exclude<Field, "tables">, string>

const EMPTY: Values = { surname: "", name: "", licence: "", ranking: "", numbered: "", club: "", email: "", phone: "" }

/** Formulaire d'inscription d'un joueur au tournoi en cours. */
export default function RegistrationForm({ tournament, onRegistered }: { tournament: Tournament, onRegistered: () => void }) {
    const [values, setValues] = useState<Values>(EMPTY)
    const [selected, setSelected] = useState<string[]>([])
    const [popupOpen, setPopupOpen] = useState(false)
    const [errors, setErrors] = useState<Partial<Record<Field, string>>>({})
    const [formError, setFormError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState<{ tables: string[], email: string } | null>(null)

    // Clôture des inscriptions : vérifiée toutes les 30 s pour bloquer le formulaire même si la page reste ouverte
    // (l'API refuse de toute façon toute inscription après la clôture)
    const [now, setNow] = useState(() => Date.now())
    const [closedByServer, setClosedByServer] = useState(false)
    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), 30_000)
        return () => clearInterval(timer)
    }, [])
    const closed = closedByServer || new Date(tournament.registrationEndAt).getTime() <= now

    const rankingValue = /^\d+$/.test(values.ranking) ? Number(values.ranking) : null
    const canBeNumbered = rankingValue !== null && rankingValue >= NUMBERED_MIN_RANKING

    // Tableaux sélectionnés encore accessibles : si le classement change, ceux qui ne conviennent plus sont retirés
    const effectiveSelected = useMemo(() => selected.filter((id) => {
        const table = tournament.tables.find((t) => t.id === id)
        return table && tableUnavailableReason(table, rankingValue) === null
    }), [selected, tournament.tables, rankingValue])

    const selectedTables = tournament.tables.filter((t) => effectiveSelected.includes(t.id))
    const selectedLetters = selectedTables.map((t) => t.letter)
    const total = selectedTables.reduce((sum, t) => sum + Number(t.price), 0)

    const update = (field: keyof Values, raw: string) => {
        // Classement : 4 chiffres au maximum (même si maxLength est contourné, ex. remplissage automatique)
        const value = field === "ranking" ? raw.slice(0, RANKING_MAX_DIGITS) : raw
        setValues((prev) => {
            const next = { ...prev, [field]: value }
            // Sous 2000, le champ « Numéroté » disparaît : on oublie la valeur saisie
            if (field === "ranking" && !(/^\d+$/.test(value) && Number(value) >= NUMBERED_MIN_RANKING)) next.numbered = ""
            return next
        })
        setErrors((prev) => ({ ...prev, [field]: undefined }))
        setFormError(null)
    }

    const toggleTable = (tableId: string) => {
        setSelected((prev) => (prev.includes(tableId) ? prev.filter((id) => id !== tableId) : [...prev, tableId]))
        setErrors((prev) => ({ ...prev, tables: undefined }))
        setFormError(null)
    }

    const validate = () => {
        const e: Partial<Record<Field, string>> = {}
        if (!values.surname.trim()) e.surname = "Le nom est obligatoire"
        if (!values.name.trim()) e.name = "Le prénom est obligatoire"
        if (!values.licence.trim()) e.licence = "Le numéro de licence est obligatoire"
        else if (!/^[A-Za-z0-9]{1,20}$/.test(values.licence.trim())) e.licence = "Lettres et chiffres uniquement"
        if (!values.ranking) e.ranking = "Le classement est obligatoire"
        else if (!new RegExp(`^\\d{1,${RANKING_MAX_DIGITS}}$`).test(values.ranking)) e.ranking = `${RANKING_MAX_DIGITS} chiffres maximum`
        else if (rankingValue === null || rankingValue > 5000) e.ranking = "Classement invalide"
        if (!values.club.trim()) e.club = "Le club est obligatoire"
        if (!values.email.trim()) e.email = "L'email est obligatoire"
        else if (!EMAIL_REGEX.test(values.email.trim())) e.email = "L'email est invalide"
        if (values.phone.trim().length > 20) e.phone = "20 caractères maximum"
        if (effectiveSelected.length === 0) e.tables = "Choisissez au moins un tableau"
        return e
    }

    // Le bouton « Valider » ne devient disponible que lorsque tout est rempli et qu'au moins un tableau est choisi
    const complete = Object.keys(validate()).length === 0

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (loading || closed) return

        const fieldErrors = validate()
        setErrors(fieldErrors)
        setFormError(null)
        if (Object.keys(fieldErrors).length > 0) return

        setLoading(true)
        try {
            const result = await apiFetch<{ tables: string[] }>(`/tournaments/${tournament.id}/registrations`, {
                method: "POST",
                body: JSON.stringify({
                    surname: values.surname.trim(),
                    name: values.name.trim(),
                    licence: values.licence.trim(),
                    ranking: rankingValue,
                    numbered: canBeNumbered && values.numbered ? Number(values.numbered) : null,
                    club: values.club.trim(),
                    email: values.email.trim(),
                    phone: values.phone.trim() || null,
                    tableIds: effectiveSelected,
                }),
            })
            setSuccess({ tables: result.tables, email: values.email.trim() })
            setValues(EMPTY)
            setSelected([])
            onRegistered()
        } catch (error) {
            if (error instanceof ApiError && error.status === 403) setClosedByServer(true)
            else if (error instanceof ApiError && (error.status === 400 || error.status === 409)) setFormError(error.message)
            else if (error instanceof ApiError && error.status === 429) setFormError("Trop de tentatives, réessayez dans une minute")
            else if (error instanceof ApiError && error.status === 404) setFormError("Ce tournoi n'existe plus")
            else setFormError("Impossible d'enregistrer votre inscription, réessayez plus tard")
        } finally {
            setLoading(false)
        }
    }

    const fieldClass = (field: Field) =>
        `app-tournament-main-info-form-inscription-grid-container_input ${errors[field] ? "app-tournament-main-info-form-inscription-grid-container_input--error" : ""}`

    const input = (field: keyof Values, label: string, props: { type?: string, placeholder?: string, maxLength?: number, inputMode?: "numeric" | "email" | "tel", digitsOnly?: boolean, hint?: string } = {}) => (
        <div className='app-tournament-main-info-form-inscription-grid-container'>
            <label htmlFor={`registration-${field}`} className='app-tournament-main-info-form-inscription-grid-container_label'>{label}</label>
            <input
                id={`registration-${field}`}
                className={fieldClass(field)}
                type={props.type ?? "text"}
                inputMode={props.inputMode}
                placeholder={props.placeholder}
                maxLength={props.maxLength}
                value={values[field]}
                onChange={(e) => update(field, props.digitsOnly ? e.target.value.replace(/\D/g, "") : e.target.value)}
                aria-invalid={!!errors[field]}
            />
            {errors[field]
                ? <span className='app-tournament-main-info-form-inscription-grid-container_error'>{errors[field]}</span>
                : props.hint && <span className='app-tournament-main-info-form-inscription-grid-container_hint'>{props.hint}</span>}
        </div>
    )

    return (
        <div className='app-tournament-main-info-form'>
            <div className='app-tournament-main-info-form-head'>
                <h2 className='app-tournament-main-info-form-head_title'>Formulaire d&apos;inscription</h2>
                <h3 className='app-tournament-main-info-form-head_subtitle'>
                    {closed ? "Inscriptions closes" : `Tous les champs * sont obligatoires · Clôture le ${closingFormatter.format(new Date(tournament.registrationEndAt))}`}
                </h3>
            </div>

            {closed ? (
                <div className='app-tournament-main-info-form-success app-tournament-main-info-form-success--closed' role="status">
                    <Lock size={40} className='app-tournament-main-info-form-success_icon' />
                    <h3 className='app-tournament-main-info-form-success_title'>Inscriptions closes</h3>
                    <p className='app-tournament-main-info-form-success_text'>
                        Les inscriptions à ce tournoi sont closes depuis le {closingFormatter.format(new Date(tournament.registrationEndAt))}.
                    </p>
                </div>
            ) : success ? (
                <div className='app-tournament-main-info-form-success' role="status">
                    <CircleCheck size={40} className='app-tournament-main-info-form-success_icon' />
                    <h3 className='app-tournament-main-info-form-success_title'>Inscription enregistrée !</h3>
                    <p className='app-tournament-main-info-form-success_text'>
                        Vous êtes inscrit{success.tables.length > 1 ? " aux tableaux " : " au tableau "}<strong>{success.tables.join(", ")}</strong>. À bientôt sur les tables 🏓
                    </p>
                    <div className='app-tournament-main-info-form-success-notices'>
                        <p className='app-tournament-main-info-form-inscription_payment'>
                            <Mail size={14} />
                            <span>Un récapitulatif vous a été envoyé à <strong>{success.email}</strong>. Sa réception peut prendre plusieurs minutes : pensez à vérifier vos spams.</span>
                        </p>
                        <p className='app-tournament-main-info-form-inscription_payment'>
                            <Wallet size={14} />
                            <span>Le paiement se fait sur place, le jour du tournoi.</span>
                        </p>
                    </div>
                    <Button type="button" variant="tertiary" lib="Inscrire un autre joueur" height="40px" onClick={() => setSuccess(null)} />
                </div>
            ) : (
                <form className='app-tournament-main-info-form-inscription' onSubmit={handleSubmit} noValidate>
                    {formError && (
                        <div className='app-tournament-main-info-form-inscription_alert' role="alert">
                            <CircleAlert size={16} /> {formError}
                        </div>
                    )}
                    <div className='app-tournament-main-info-form-inscription-grid'>
                        {input("surname", "Nom *", { placeholder: "Votre nom", maxLength: 100 })}
                        {input("name", "Prénom *", { placeholder: "Votre prénom", maxLength: 100 })}
                        {input("licence", "N° de licence *", { placeholder: "Ex: 6612345", maxLength: 20 })}
                        {input("ranking", "Classement FFTT *", { placeholder: "Ex: 1250", inputMode: "numeric", maxLength: RANKING_MAX_DIGITS, digitsOnly: true })}
                        {canBeNumbered && (
                            <div className='app-tournament-main-info-form-inscription-grid-container'>
                                <label htmlFor='registration-numbered' className='app-tournament-main-info-form-inscription-grid-container_label'>Numéroté</label>
                                <input
                                    id='registration-numbered'
                                    className={fieldClass("numbered")}
                                    type="text"
                                    inputMode="numeric"
                                    placeholder="Ex: 350"
                                    maxLength={6}
                                    value={values.numbered}
                                    onChange={(e) => update("numbered", e.target.value.replace(/\D/g, ""))}
                                    aria-describedby='registration-numbered-hint'
                                />
                                <span id='registration-numbered-hint' className='app-tournament-main-info-form-inscription-grid-container_hint'>
                                    Laissez vide si vous n&apos;êtes pas numéroté
                                </span>
                            </div>
                        )}
                        {input("club", "Club *", { placeholder: "Votre club", maxLength: 191 })}
                        {input("email", "Email *", { type: "email", inputMode: "email", placeholder: "votre@gmail.com", maxLength: 191 })}
                        {input("phone", "Téléphone", {
                            type: "tel", inputMode: "tel", placeholder: "06 XX XX XX XX", maxLength: 20,
                            hint: "Facultatif, mais important : il permet de vous appeler lors des annonces de match",
                        })}
                    </div>

                    <Button
                        type="button"
                        variant="action"
                        lib={effectiveSelected.length > 0 ? `Mes tableaux : ${selectedLetters.join(", ")} (modifier)` : "Choisir mes tableaux"}
                        onClick={() => setPopupOpen(true)}
                        className='app-tournament-main-info-form-inscription-grid_btn'
                        width='100%'
                        height='40px'
                    />
                    {errors.tables && <span className='app-tournament-main-info-form-inscription-grid-container_error app-tournament-main-info-form-inscription_tables-error'>{errors.tables}</span>}
                    {selectedTables.length > 0 && (
                        <p className='app-tournament-main-info-form-inscription_total'>
                            Total : <strong>{priceFormatter.format(total)}</strong>
                            <span> ({selectedTables.length} tableau{selectedTables.length > 1 ? "x" : ""})</span>
                        </p>
                    )}
                    <p className='app-tournament-main-info-form-inscription_payment'>
                        <Wallet size={14} /> Le paiement se fait sur place, le jour du tournoi.
                    </p>
                    <Button
                        type="submit"
                        variant="secondary"
                        lib={loading ? "Inscription…" : "Valider mon inscription"}
                        width='100%'
                        height='40px'
                        disabled={loading || !complete}
                    />
                    {!complete && (
                        <p className='app-tournament-main-info-form-inscription_hint'>
                            Remplissez tous les champs obligatoires (*) et choisissez au moins un tableau pour valider votre inscription.
                        </p>
                    )}
                </form>
            )}

            <Table
                close={popupOpen && !closed}
                tabMax={tournament.tabMax}
                handleTogglePop={setPopupOpen}
                tables={tournament.tables}
                selected={effectiveSelected}
                onToggle={toggleTable}
                ranking={rankingValue}
            />
        </div>
    )
}
