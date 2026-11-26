"use client";

import { useEffect, useState, type FormEvent } from "react"
import { CircleAlert, X } from "lucide-react"
import Button from "@web/component/button/Button"
import ImageField from "@web/component/imageField/ImageField"
import { ApiError, apiFetch } from "@web/lib/api"
import "../modal/Modal.scss"

/** Membre du bureau tel que renvoyé par l'API. */
export interface DeskMember {
    id: string
    name: string
    surname: string
    role: string
    position: number
    email: string
    phone: string | null
    description: string | null
    /** Photo (« /uploads/<id>.webp »), null = silhouette par défaut */
    imageUrl: string | null
}

type Field = "name" | "surname" | "role" | "email" | "phone" | "description"
type FieldErrors = Partial<Record<Field, string>>

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Ajout (sans `member`) ou modification (avec `member`) d'un membre du bureau.
 * L'ordre d'affichage n'est pas modifiable ici : un nouveau membre est ajouté en fin de liste.
 * Monté uniquement quand il est ouvert : l'état repart de zéro à chaque ouverture.
 */
export default function DeskForm({ member, onClose, onSaved }: { member?: DeskMember, onClose: () => void, onSaved: (member: DeskMember) => void }) {
    const editing = !!member
    const [values, setValues] = useState<Record<Field, string>>({
        name: member?.name ?? "",
        surname: member?.surname ?? "",
        role: member?.role ?? "",
        email: member?.email ?? "",
        phone: member?.phone ?? "",
        description: member?.description ?? "",
    })
    const [imageUrl, setImageUrl] = useState<string | null>(member?.imageUrl ?? null)
    const [uploading, setUploading] = useState(false)
    const [errors, setErrors] = useState<FieldErrors>({})
    const [formError, setFormError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !loading) onClose() }
        window.addEventListener("keydown", onKey)
        return () => window.removeEventListener("keydown", onKey)
    }, [loading, onClose])

    const update = (field: Field, value: string) => {
        setValues((prev) => ({ ...prev, [field]: value }))
        setErrors((prev) => ({ ...prev, [field]: undefined }))
        setFormError(null)
    }

    const validate = (): FieldErrors => {
        const result: FieldErrors = {}
        if (!values.name.trim()) result.name = "Le prénom est obligatoire"
        if (!values.surname.trim()) result.surname = "Le nom est obligatoire"
        if (!values.role.trim()) result.role = "Le rôle est obligatoire"
        if (!values.email.trim()) result.email = "L'email est obligatoire"
        else if (!EMAIL_REGEX.test(values.email.trim())) result.email = "L'email est invalide"
        if (values.phone.trim().length > 20) result.phone = "Le téléphone ne doit pas dépasser 20 caractères"
        if (values.description.length > 5000) result.description = "La description ne doit pas dépasser 5 000 caractères"
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
            const saved = await apiFetch<DeskMember>(member ? `/desk/${member.id}` : "/desk", {
                method: member ? "PATCH" : "POST",
                body: JSON.stringify({
                    name: values.name.trim(),
                    surname: values.surname.trim(),
                    role: values.role.trim(),
                    email: values.email.trim(),
                    phone: values.phone.trim() || null,
                    description: values.description.trim() || null,
                    imageUrl,
                }),
            })
            onSaved(saved)
            onClose()
        } catch (error) {
            if (error instanceof ApiError && error.status === 401) setFormError("Votre session a expiré, reconnectez-vous")
            else if (error instanceof ApiError && error.status === 404) setFormError("Ce membre n'existe plus")
            else if (error instanceof ApiError && error.status === 400) setFormError(error.message)
            else setFormError(editing ? "Impossible d'enregistrer les modifications, réessayez plus tard" : "Impossible d'ajouter ce membre, réessayez plus tard")
            setLoading(false)
        }
    }

    const input = (field: Field, label: string, props: { type?: string, placeholder?: string, maxLength?: number } = {}) => (
        <div className="extranet-modal-main-container">
            <label htmlFor={`desk-${field}`} className="extranet-modal-main-container_label">{label}</label>
            <input
                id={`desk-${field}`}
                className={`extranet-modal-main-container_input ${errors[field] ? "extranet-modal-main-container_input--error" : ""}`}
                type={props.type ?? "text"}
                placeholder={props.placeholder}
                maxLength={props.maxLength}
                value={values[field]}
                onChange={(e) => update(field, e.target.value)}
                aria-invalid={!!errors[field]}
            />
            <div className="extranet-modal-main-container-foot">
                <span className="extranet-modal-main-container-foot_error">{errors[field]}</span>
            </div>
        </div>
    )

    return (
        <>
            <div className="extranet-modal-filter" onClick={() => !loading && onClose()}></div>
            <div className="extranet-modal" role="dialog" aria-modal="true" aria-labelledby="desk-form-title">
                <div className="extranet-modal-header">
                    <div className="extranet-modal-header-head">
                        <h1 id="desk-form-title" className="extranet-modal-header-head_title">{editing ? "Modifier un membre du bureau" : "Ajouter un membre du bureau"}</h1>
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

                    <div className="extranet-modal-main-grid">
                        {input("name", "Prénom *", { placeholder: "Prénom", maxLength: 100 })}
                        {input("surname", "Nom *", { placeholder: "Nom", maxLength: 100 })}
                    </div>

                    {input("role", "Rôle *", { placeholder: "Ex : Trésorière / Commission financière", maxLength: 100 })}

                    <div className="extranet-modal-main-grid">
                        {input("email", "Email *", { type: "email", placeholder: "prenom@exemple.fr", maxLength: 191 })}
                        {input("phone", "Téléphone", { type: "tel", placeholder: "06 XX XX XX XX", maxLength: 20 })}
                    </div>

                    <div className="extranet-modal-main-container">
                        <label htmlFor="desk-description" className="extranet-modal-main-container_label">Description</label>
                        <textarea
                            id="desk-description"
                            className={`extranet-modal-main-container_input extranet-modal-main-container_textarea ${errors.description ? "extranet-modal-main-container_input--error" : ""}`}
                            placeholder="Quelques mots sur ce membre (facultatif)"
                            rows={4}
                            value={values.description}
                            onChange={(e) => update("description", e.target.value)}
                            aria-invalid={!!errors.description}
                        />
                        <div className="extranet-modal-main-container-foot">
                            <span className="extranet-modal-main-container-foot_error">{errors.description}</span>
                        </div>
                    </div>

                    <ImageField
                        id="desk-image"
                        label="Photo"
                        shape="portrait"
                        hint="Privilégiez une photo verticale, visage centré : elle est recadrée en portrait pour le membre mis en avant et en bandeau pour les autres."
                        value={imageUrl}
                        onChange={setImageUrl}
                        onUploadingChange={setUploading}
                        disabled={loading}
                    />

                    <div className="extranet-modal-main-actions">
                        <Button type="button" variant="tertiary" lib="Annuler" height="40px" onClick={onClose} disabled={loading} />
                        <Button type="submit" variant="secondary" lib={loading ? "Enregistrement…" : editing ? "Enregistrer les modifications" : "Ajouter le membre"} height="40px" disabled={loading || uploading} />
                    </div>
                </form>
            </div>
        </>
    )
}
