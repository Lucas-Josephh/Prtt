"use client";

import { useEffect, useState, type FormEvent } from "react"
import { CircleAlert, X } from "lucide-react"
import Button from "@web/component/button/Button"
import ImageField from "@web/component/imageField/ImageField"
import { ApiError, apiFetch } from "@web/lib/api"
import "../modal/Modal.scss"

export const NEWS_CATEGORIES = [
    { value: "match", label: "Match" },
    { value: "tournoi", label: "Tournoi" },
    { value: "club", label: "Club" },
    { value: "formation", label: "Formation" },
    { value: "autre", label: "Autre" },
] as const

export type NewsCategory = (typeof NEWS_CATEGORIES)[number]["value"]

/** Actualité telle que renvoyée par l'API. */
export interface NewsArticle {
    id: string
    title: string
    content: string
    featured: boolean
    /** true = article de présentation du tournoi (page Tournoi), exclu des actualités */
    tournament: boolean
    category: NewsCategory
    publishedAt: string | null
    /** Image de couverture (« /uploads/<id>.webp »), null = visuel par défaut */
    imageUrl: string | null
    createdAt: string
}

type Field = "title" | "content" | "publishedAt"
type FieldErrors = Partial<Record<Field, string>>

const TITLE_MAX = 191
const CONTENT_MAX = 50_000

/** Date/heure locale au format attendu par <input type="datetime-local">. */
function toInputDate(date: Date) {
    const local = new Date(date)
    local.setMinutes(local.getMinutes() - local.getTimezoneOffset())
    return local.toISOString().slice(0, 16)
}

/**
 * Création (sans `article`) ou modification (avec `article`) d'une actualité.
 * `tournament` : article de présentation du tournoi (catégorie « tournoi », sans date ni « à la une »).
 * Monté uniquement quand il est ouvert : l'état repart de zéro à chaque ouverture.
 */
export default function NewsForm({ article, tournament = false, onClose, onSaved }: { article?: NewsArticle, tournament?: boolean, onClose: () => void, onSaved: (article: NewsArticle) => void }) {
    const editing = !!article
    const tournamentMode = tournament || !!article?.tournament
    const [title, setTitle] = useState(article?.title ?? "")
    const [category, setCategory] = useState<NewsCategory>(article?.category ?? "autre")
    const [content, setContent] = useState(article?.content ?? "")
    const [publishedAt, setPublishedAt] = useState(() =>
        article ? (article.publishedAt ? toInputDate(new Date(article.publishedAt)) : "") : toInputDate(new Date())
    )
    const [featured, setFeatured] = useState(article?.featured ?? false)
    const [imageUrl, setImageUrl] = useState<string | null>(article?.imageUrl ?? null)
    const [uploading, setUploading] = useState(false)
    const [errors, setErrors] = useState<FieldErrors>({})
    const [formError, setFormError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    // Fermeture avec Échap
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !loading) onClose() }
        window.addEventListener("keydown", onKey)
        return () => window.removeEventListener("keydown", onKey)
    }, [loading, onClose])

    const clearError = (field: Field) => {
        setErrors((prev) => ({ ...prev, [field]: undefined }))
        setFormError(null)
    }

    const validate = (): FieldErrors => {
        const result: FieldErrors = {}
        if (!title.trim()) result.title = "Le titre est obligatoire"
        else if (title.trim().length > TITLE_MAX) result.title = `Le titre ne doit pas dépasser ${TITLE_MAX} caractères`
        if (!content.trim()) result.content = "Le contenu est obligatoire"
        else if (content.length > CONTENT_MAX) result.content = "Le contenu ne doit pas dépasser 50 000 caractères"
        if (publishedAt && Number.isNaN(new Date(publishedAt).getTime())) result.publishedAt = "La date est invalide"
        return result
    }

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (loading || uploading) return

        const fieldErrors = validate()
        setErrors(fieldErrors)
        setFormError(null)
        if (Object.keys(fieldErrors).length > 0) return

        setLoading(true)
        try {
            const saved = await apiFetch<NewsArticle>(article ? `/news/${article.id}` : "/news", {
                method: editing ? "PATCH" : "POST",
                body: JSON.stringify(tournamentMode
                    // Article de tournoi : publié immédiatement à la création, seuls titre et contenu sont modifiables
                    ? { title: title.trim(), content: content.trim(), imageUrl, ...(editing ? {} : { tournament: true, publishedAt: new Date().toISOString() }) }
                    : {
                        title: title.trim(),
                        content: content.trim(),
                        imageUrl,
                        category,
                        featured,
                        publishedAt: publishedAt ? new Date(publishedAt).toISOString() : null,
                    }),
            })
            onSaved(saved)
            onClose()
        } catch (error) {
            if (error instanceof ApiError && error.status === 401) setFormError("Votre session a expiré, reconnectez-vous")
            else if (error instanceof ApiError && error.status === 404) setFormError("Cette actualité n'existe plus")
            else if (error instanceof ApiError && error.status === 400) setFormError(error.message)
            else setFormError("Impossible d'enregistrer l'actualité, réessayez plus tard")
            setLoading(false)
        }
    }

    return (
        <>
            <div className="extranet-modal-filter" onClick={() => !loading && onClose()}></div>
            <div className="extranet-modal" role="dialog" aria-modal="true" aria-labelledby="news-form-title">
                <div className="extranet-modal-header">
                    <div className="extranet-modal-header-head">
                        <h1 id="news-form-title" className="extranet-modal-header-head_title">
                            {tournamentMode
                                ? (editing ? "Modifier l'article du tournoi" : "Créer l'article du tournoi")
                                : (editing ? "Modifier l'actualité" : "Ajouter une actualité")}
                        </h1>
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

                    <div className="extranet-modal-main-container">
                        <label htmlFor="news-title" className="extranet-modal-main-container_label">Titre *</label>
                        <input
                            id="news-title"
                            className={`extranet-modal-main-container_input ${errors.title ? "extranet-modal-main-container_input--error" : ""}`}
                            type="text"
                            placeholder={tournamentMode ? "Ex : 18ème Tournoi International du PRTT" : "Ex : Victoire de l'équipe 1 en N2"}
                            value={title}
                            maxLength={TITLE_MAX}
                            onChange={(e) => { setTitle(e.target.value); clearError("title") }}
                            aria-invalid={!!errors.title}
                        />
                        <div className="extranet-modal-main-container-foot">
                            <span className="extranet-modal-main-container-foot_error">{errors.title}</span>
                            <span className="extranet-modal-main-container-foot_count">{title.length}/{TITLE_MAX}</span>
                        </div>
                    </div>

                    {!tournamentMode && <div className="extranet-modal-main-grid">
                        <div className="extranet-modal-main-container">
                            <label htmlFor="news-category" className="extranet-modal-main-container_label">Catégorie *</label>
                            <select
                                id="news-category"
                                className="extranet-modal-main-container_input"
                                value={category}
                                onChange={(e) => setCategory(e.target.value as NewsCategory)}
                            >
                                {NEWS_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                            </select>
                        </div>

                        <div className="extranet-modal-main-container">
                            <label htmlFor="news-date" className="extranet-modal-main-container_label">Date de publication</label>
                            <input
                                id="news-date"
                                className={`extranet-modal-main-container_input ${errors.publishedAt ? "extranet-modal-main-container_input--error" : ""}`}
                                type="datetime-local"
                                value={publishedAt}
                                onChange={(e) => { setPublishedAt(e.target.value); clearError("publishedAt") }}
                                aria-invalid={!!errors.publishedAt}
                            />
                            <div className="extranet-modal-main-container-foot">
                                <span className="extranet-modal-main-container-foot_error">{errors.publishedAt}</span>
                                <span className="extranet-modal-main-container-foot_hint">Vide = brouillon</span>
                            </div>
                        </div>
                    </div>}

                    <div className="extranet-modal-main-container">
                        <label htmlFor="news-content" className="extranet-modal-main-container_label">Contenu *</label>
                        <textarea
                            id="news-content"
                            className={`extranet-modal-main-container_input extranet-modal-main-container_textarea ${errors.content ? "extranet-modal-main-container_input--error" : ""}`}
                            placeholder={tournamentMode ? "Présentez le tournoi : lieu, dotation, participants attendus, buvette…" : "Racontez l'actualité du club…"}
                            rows={8}
                            value={content}
                            onChange={(e) => { setContent(e.target.value); clearError("content") }}
                            aria-invalid={!!errors.content}
                        />
                        <div className="extranet-modal-main-container-foot">
                            <span className="extranet-modal-main-container-foot_error">{errors.content}</span>
                        </div>
                    </div>

                    <ImageField
                        id="news-image"
                        label="Image de couverture"
                        hint="Format paysage conseillé (16:9). L'aperçu correspond au recadrage affiché sur le site."
                        value={imageUrl}
                        onChange={setImageUrl}
                        onUploadingChange={setUploading}
                        disabled={loading}
                    />

                    {!tournamentMode && (
                        <label className="extranet-modal-main_checkbox">
                            <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
                            <span>Mettre à la une</span>
                        </label>
                    )}

                    <div className="extranet-modal-main-actions">
                        <Button type="button" variant="tertiary" lib="Annuler" height="40px" onClick={onClose} disabled={loading} />
                        <Button type="submit" variant="secondary" lib={loading ? "Enregistrement…" : editing ? "Enregistrer les modifications" : tournamentMode ? "Publier l'article" : "Publier l'actualité"} height="40px" disabled={loading || uploading} />
                    </div>
                </form>
            </div>
        </>
    )
}
