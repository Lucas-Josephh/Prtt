"use client"

import Image from "next/image"
import { useEffect, useState, type FormEvent } from "react"
import { ArrowLeft, ArrowRight, CircleAlert, LockKeyhole, ShieldCheck, UserRound } from "lucide-react"
import Button from "@login/component/button/Button"
import { ApiError, SITE_URL, apiFetch } from "@login/lib/api"
import "./page.scss"

type Field = "identifier" | "password"
type FieldErrors = Partial<Record<Field, string>>

interface SessionResponse {
    user: { id: string; identifier: string }
    expiresAt: number
}

function validate(identifier: string, password: string): FieldErrors {
    const errors: FieldErrors = {}
    if (!identifier.trim()) errors.identifier = "L'identifiant est obligatoire"
    else if (identifier.trim().length > 191) errors.identifier = "L'identifiant est trop long"
    if (!password) errors.password = "Le mot de passe est obligatoire"
    else if (password.length > 255) errors.password = "Le mot de passe est trop long"
    return errors
}

export default function Login() {
    // Déjà connecté (cookie de session encore valide) : on propose d'aller directement sur le site
    const [connectedAs, setConnectedAs] = useState<string | null>(null)
    useEffect(() => {
        apiFetch<SessionResponse>("/auth/me")
            .then((data) => setConnectedAs(data.user.identifier))
            .catch(() => setConnectedAs(null))
    }, [])

    const [identifier, setIdentifier] = useState("")
    const [password, setPassword] = useState("")
    const [errors, setErrors] = useState<FieldErrors>({})
    const [formError, setFormError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    const clearError = (field: Field) => {
        setErrors((prev) => ({ ...prev, [field]: undefined }))
        setFormError(null)
    }

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (loading) return

        const fieldErrors = validate(identifier, password)
        setErrors(fieldErrors)
        setFormError(null)
        if (Object.keys(fieldErrors).length > 0) return

        setLoading(true)
        try {
            await apiFetch<SessionResponse>("/auth/login", {
                method: "POST",
                body: JSON.stringify({ identifier: identifier.trim(), password }),
            })
            // Le site est sur un autre domaine : navigation complète, il relira la session au chargement
            window.location.assign(`${SITE_URL}/`)
        } catch (error) {
            if (error instanceof ApiError && error.status === 401) setFormError("Identifiant ou mot de passe incorrect")
            else if (error instanceof ApiError && error.status === 429) setFormError("Trop de tentatives, réessayez dans une minute")
            else setFormError("Impossible de contacter le serveur, réessayez plus tard")
            setPassword("")
            setLoading(false)
        }
    }

    return (
        <div className="app-login">
            <div className="app-login-card">
                <div className="app-login-card-head">
                    <Image className="app-login-card-head_logo" src="/logo.jpg" loading="eager" width={64} height={64} alt="Logo PRTT" />
                    <h1 className="app-login-card-head_title">prtt</h1>
                    <h2 className="app-login-card-head_subtitle">Espace administration</h2>
                    <p className="app-login-card-head_description">Connectez-vous pour gérer le site du club</p>
                </div>

                <form className="app-login-card-form" onSubmit={handleSubmit} noValidate>
                    {connectedAs && (
                        <a href={`${SITE_URL}/`} className="app-login-card-form_connected">
                            <ShieldCheck size={16} />
                            <span>Déjà connecté en tant que <strong>{connectedAs}</strong></span>
                            <ArrowRight size={16} />
                        </a>
                    )}
                    {formError && (
                        <div className="app-login-card-form_alert" role="alert">
                            <CircleAlert size={16} /> {formError}
                        </div>
                    )}

                    <div className="app-login-card-form-container">
                        <label htmlFor="identifier" className="app-login-card-form-container_label">Identifiant</label>
                        <div className={`app-login-card-form-container-field ${errors.identifier ? "app-login-card-form-container-field--error" : ""}`}>
                            <UserRound size={16} className="app-login-card-form-container-field_icon" />
                            <input
                                id="identifier"
                                name="identifier"
                                className="app-login-card-form-container-field_input"
                                type="text"
                                placeholder="Votre identifiant"
                                autoComplete="username"
                                value={identifier}
                                onChange={(e) => { setIdentifier(e.target.value); clearError("identifier") }}
                                aria-invalid={!!errors.identifier}
                                aria-describedby={errors.identifier ? "identifier-error" : undefined}
                            />
                        </div>
                        {errors.identifier && <span id="identifier-error" className="app-login-card-form-container_error">{errors.identifier}</span>}
                    </div>

                    <div className="app-login-card-form-container">
                        <label htmlFor="password" className="app-login-card-form-container_label">Mot de passe</label>
                        <div className={`app-login-card-form-container-field ${errors.password ? "app-login-card-form-container-field--error" : ""}`}>
                            <LockKeyhole size={16} className="app-login-card-form-container-field_icon" />
                            <input
                                id="password"
                                name="password"
                                className="app-login-card-form-container-field_input"
                                type="password"
                                placeholder="••••••••"
                                autoComplete="current-password"
                                value={password}
                                onChange={(e) => { setPassword(e.target.value); clearError("password") }}
                                aria-invalid={!!errors.password}
                                aria-describedby={errors.password ? "password-error" : undefined}
                            />
                        </div>
                        {errors.password && <span id="password-error" className="app-login-card-form-container_error">{errors.password}</span>}
                    </div>

                    <Button type="submit" variant="secondary" lib={loading ? "Connexion…" : "Se connecter"} width="100%" height="40px" className="app-login-card-form_btn" disabled={loading} />
                </form>

                <a href={`${SITE_URL}/`} className="app-login-card_back">
                    <ArrowLeft size={14} /> Retour au site
                </a>
            </div>
        </div>
    )
}
