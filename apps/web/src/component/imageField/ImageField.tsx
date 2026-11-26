"use client";

import { useEffect, useRef, useState, type ChangeEvent, type DragEvent, type KeyboardEvent } from "react"
import Image from "next/image"
import { AlertCircle, ImagePlus, LoaderCircle, RefreshCw, Trash2, UploadCloud } from "lucide-react"
import { ApiError, MAX_IMAGE_BYTES, apiUpload, imageSrc } from "@web/lib/api"
import "./ImageField.scss"

const ACCEPT = "image/jpeg,image/png,image/webp"

/**
 * Champ « image » d'un formulaire d'administration : l'image est envoyée dès qu'elle est choisie
 * (cliquer ou glisser-déposer ; compressée par l'API), et `onChange` reçoit son chemin. `null` = pas d'image.
 * `onUploadingChange` permet au formulaire de bloquer l'enregistrement pendant l'envoi.
 * `shape` règle le format de l'aperçu : « wide » (couverture d'article) ou « portrait » (photo d'un membre).
 */
export default function ImageField({ id, label, value, onChange, onUploadingChange, disabled, shape = "wide", hint }: {
    id: string
    label: string
    value: string | null
    onChange: (path: string | null) => void
    onUploadingChange?: (uploading: boolean) => void
    disabled?: boolean
    shape?: "wide" | "portrait"
    /** Conseil affiché sous la zone (ex. format recommandé). */
    hint?: string
}) {
    const inputRef = useRef<HTMLInputElement>(null)
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [dragging, setDragging] = useState(false)
    // Aperçu local affiché pendant l'envoi (avant que l'API ne renvoie le chemin)
    const [localPreview, setLocalPreview] = useState<string | null>(null)

    useEffect(() => () => { if (localPreview) URL.revokeObjectURL(localPreview) }, [localPreview])

    const src = localPreview ?? imageSrc(value)
    const busy = disabled || uploading

    const setBusy = (state: boolean) => {
        setUploading(state)
        onUploadingChange?.(state)
    }

    const openPicker = () => { if (!busy) inputRef.current?.click() }

    const upload = async (file: File | undefined) => {
        if (!file || busy) return
        setError(null)
        if (!ACCEPT.split(",").includes(file.type)) return setError("Formats acceptés : JPG, PNG ou WebP")
        if (file.size > MAX_IMAGE_BYTES) return setError("L'image ne doit pas dépasser 20 Mo")

        setLocalPreview(URL.createObjectURL(file))
        setBusy(true)
        try {
            onChange(await apiUpload(file))
        } catch (err) {
            if (err instanceof ApiError && err.status === 401) setError("Votre session a expiré, reconnectez-vous")
            else if (err instanceof ApiError && (err.status === 400 || err.status === 413)) setError(err.message)
            else setError("Impossible d'envoyer l'image, réessayez plus tard")
        } finally {
            setLocalPreview(null)
            setBusy(false)
        }
    }

    const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        event.target.value = "" // permet de choisir à nouveau le même fichier
        void upload(file)
    }

    const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault()
        if (!busy) setDragging(true)
    }

    const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
        // Ignore les sorties vers un élément enfant de la zone
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false)
    }

    const handleDrop = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault()
        setDragging(false)
        void upload(event.dataTransfer.files?.[0])
    }

    const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        // Seulement quand la zone elle-même a le focus (pas les boutons « Changer » / « Retirer »)
        if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) {
            event.preventDefault()
            openPicker()
        }
    }

    const zoneClass = [
        "extranet-image-field-zone",
        `extranet-image-field-zone--${shape}`,
        src ? "extranet-image-field-zone--filled" : "",
        dragging ? "extranet-image-field-zone--dragging" : "",
        error ? "extranet-image-field-zone--error" : "",
        busy ? "extranet-image-field-zone--busy" : "",
    ].filter(Boolean).join(" ")

    return (
        <div className="extranet-modal-main-container">
            <label htmlFor={id} className="extranet-modal-main-container_label">{label}</label>

            <div className={`extranet-image-field extranet-image-field--${shape}`}>
                <div
                    className={zoneClass}
                    // Vide : la zone entière est le bouton ; remplie : ce sont les boutons de la barre
                    role={src ? undefined : "button"}
                    tabIndex={src || busy ? undefined : 0}
                    aria-label={src ? undefined : `${label} : choisir une image`}
                    aria-busy={uploading}
                    aria-disabled={busy}
                    onClick={src ? undefined : openPicker}
                    onKeyDown={handleKeyDown}
                    onDragOver={handleDragOver}
                    onDragEnter={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    {src ? (
                        <>
                            <Image className="extranet-image-field-zone_img" src={src} fill unoptimized sizes="40rem" alt="Aperçu de l'image" />
                            {!uploading && (
                                <div className="extranet-image-field-zone-toolbar">
                                    <button type="button" className="extranet-image-field-zone-toolbar_btn" onClick={openPicker} disabled={busy}>
                                        <RefreshCw size={14} /> Changer
                                    </button>
                                    <button
                                        type="button"
                                        className="extranet-image-field-zone-toolbar_btn extranet-image-field-zone-toolbar_btn--danger"
                                        onClick={() => { setError(null); onChange(null) }}
                                        disabled={busy}
                                    >
                                        <Trash2 size={14} /> Retirer
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="extranet-image-field-zone-empty">
                            <span className="extranet-image-field-zone-empty_icon">
                                {dragging ? <UploadCloud size={24} /> : <ImagePlus size={24} />}
                            </span>
                            <span className="extranet-image-field-zone-empty_title">
                                {dragging ? "Déposez l'image ici" : <>Glissez une image ou <u>parcourez</u></>}
                            </span>
                            <span className="extranet-image-field-zone-empty_hint">JPG, PNG ou WebP · 20 Mo max</span>
                        </div>
                    )}

                    {uploading && (
                        <div className="extranet-image-field-zone-overlay">
                            <LoaderCircle size={28} className="extranet-image-field-zone-overlay_spinner" />
                            <span>Compression et envoi…</span>
                        </div>
                    )}

                    {dragging && src && (
                        <div className="extranet-image-field-zone-overlay extranet-image-field-zone-overlay--drop">
                            <UploadCloud size={28} />
                            <span>Déposez pour remplacer</span>
                        </div>
                    )}
                </div>

                {hint && <p className="extranet-image-field_hint">{hint}</p>}
                <input ref={inputRef} id={id} type="file" accept={ACCEPT} hidden onChange={handleFile} />
            </div>

            <div className="extranet-modal-main-container-foot">
                {error && (
                    <span className="extranet-modal-main-container-foot_error extranet-image-field_error" role="alert">
                        <AlertCircle size={13} /> {error}
                    </span>
                )}
            </div>
        </div>
    )
}
