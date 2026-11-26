"use client";

import { useEffect, useState, type ReactNode } from "react"
import { CircleAlert, Trash2, X } from "lucide-react"
import Button from "@web/component/button/Button"
import "./Modal.scss"

/**
 * Fenêtre de confirmation d'une action destructrice.
 * `onConfirm` peut être asynchrone : en cas d'erreur, son message est affiché et la fenêtre reste ouverte.
 */
export default function ConfirmDialog({ title, message, confirmLabel = "Supprimer", onConfirm, onClose }: {
    title: string
    message: ReactNode
    confirmLabel?: string
    onConfirm: () => Promise<void>
    onClose: () => void
}) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !loading) onClose() }
        window.addEventListener("keydown", onKey)
        return () => window.removeEventListener("keydown", onKey)
    }, [loading, onClose])

    const handleConfirm = async () => {
        setLoading(true)
        setError(null)
        try {
            await onConfirm()
            onClose()
        } catch (e) {
            setError(e instanceof Error ? e.message : "Une erreur est survenue")
            setLoading(false)
        }
    }

    return (
        <>
            <div className="extranet-modal-filter" onClick={() => !loading && onClose()}></div>
            <div className="extranet-modal extranet-modal--small" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title">
                <div className="extranet-modal-header">
                    <div className="extranet-modal-header-head">
                        <h1 id="confirm-title" className="extranet-modal-header-head_title">{title}</h1>
                        <span className="extranet-modal-header-head_subtitle">Cette action est définitive</span>
                    </div>
                    <button type="button" className="extranet-modal-header_close" onClick={onClose} disabled={loading} aria-label="Fermer">
                        <X size={18} />
                    </button>
                </div>
                <div className="extranet-modal-main">
                    {error && (
                        <div className="extranet-modal-main_alert" role="alert">
                            <CircleAlert size={16} /> {error}
                        </div>
                    )}
                    <p className="extranet-modal-main_text">{message}</p>
                    <div className="extranet-modal-main-actions">
                        <Button type="button" variant="tertiary" lib="Annuler" height="40px" onClick={onClose} disabled={loading} />
                        <button type="button" className="extranet-modal-main-actions_danger" onClick={handleConfirm} disabled={loading}>
                            <Trash2 size={16} /> {loading ? "Suppression…" : confirmLabel}
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}
