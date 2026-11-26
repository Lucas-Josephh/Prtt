"use client"

import Image from "next/image"
import Navbar from "@web/component/navbar/Navbar"
import "./page.scss"
import Tag from "@web/component/tag/Tag"
import Footer from "@web/component/footer/Footer"
import { Mail, Pencil, Phone, Plus, Trash2, UserRound } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { ApiError, apiFetch, imageSrc } from "@web/lib/api"
import { useSession } from "@web/component/session/SessionProvider"
import DeskForm, { type DeskMember } from "@web/component/deskForm/DeskForm"
import ConfirmDialog from "@web/component/modal/ConfirmDialog"

/** Boutons Modifier / Supprimer, visibles uniquement par l'administrateur. */
function AdminActions({ member, onEdit, onDelete }: { member: DeskMember, onEdit: () => void, onDelete: () => void }) {
    const fullName = `${member.name} ${member.surname}`
    return (
        <div className="app-desk-actions">
            <button type="button" className="app-desk-actions_btn" onClick={onEdit} aria-label={`Modifier ${fullName}`}>
                <Pencil size={12} /> Modifier
            </button>
            <button type="button" className="app-desk-actions_btn app-desk-actions_btn--danger" onClick={onDelete} aria-label={`Supprimer ${fullName}`}>
                <Trash2 size={12} /> Supprimer
            </button>
        </div>
    )
}

export default function Bureau() {
    const { session } = useSession()
    const isAdmin = session.status === "authenticated"
    // null = chargement en cours
    const [members, setMembers] = useState<DeskMember[] | null>(null)
    const [error, setError] = useState(false)
    // null = fermé ; "new" = ajout ; DeskMember = modification de ce membre
    const [toEdit, setToEdit] = useState<null | "new" | DeskMember>(null)
    const [toDelete, setToDelete] = useState<DeskMember | null>(null)

    useEffect(() => {
        apiFetch<DeskMember[]>("/desk")
            .then(setMembers)
            .catch(() => { setMembers([]); setError(true) })
    }, [])

    // Modification : remplacé sur place (l'ordre ne bouge pas) ; ajout : placé en fin de liste
    const handleSaved = useCallback((saved: DeskMember) => {
        setMembers((prev) => {
            const list = prev ?? []
            return list.some((m) => m.id === saved.id)
                ? list.map((m) => (m.id === saved.id ? saved : m))
                : [...list, saved]
        })
        setError(false)
    }, [])

    const deleteMember = useCallback(async (member: DeskMember) => {
        try {
            await apiFetch(`/desk/${member.id}`, { method: "DELETE" })
        } catch (e) {
            // Déjà supprimé ailleurs : on le retire quand même de la liste
            if (!(e instanceof ApiError && e.status === 404)) {
                throw new Error(e instanceof ApiError && e.status === 401
                    ? "Votre session a expiré, reconnectez-vous"
                    : "Impossible de supprimer ce membre, réessayez plus tard")
            }
        }
        setMembers((prev) => prev?.filter((m) => m.id !== member.id) ?? prev)
    }, [])

    const closeEdit = useCallback(() => setToEdit(null), [])
    const closeDelete = useCallback(() => setToDelete(null), [])

    // Le premier membre (position la plus basse) est mis en avant
    const [boss, ...others] = members ?? []

    return (
        <div className="app-desk">
            <Navbar select="bureau" />
            <header className="app-desk-header">
                <div className="app-desk-header-mark">
                    <h1 className="app-desk-header-mark_title">prtt</h1>
                    <h2 className="app-desk-header-mark_subtitle">Le Bureau du club</h2>
                    <p className="app-desk-header-mark_description">L&apos;équipe de bénévoles qui fait vivre le PRTT</p>
                </div>
            </header>
            <main className="app-desk-main">
                {isAdmin && (
                    <div className="app-desk-main-toolbar">
                        <button type="button" className="app-desk-main-toolbar_add" onClick={() => setToEdit("new")}>
                            <Plus size={16} /> Ajouter un membre
                        </button>
                    </div>
                )}
                {members === null && <p className="app-desk-main_status">Chargement du bureau…</p>}
                {error && <p className="app-desk-main_status">Impossible de charger le bureau pour le moment.</p>}
                {members !== null && !error && members.length === 0 && <p className="app-desk-main_status">Aucun membre du bureau pour le moment.</p>}

                {boss && (
                    <div className="app-desk-main-boss">
                        <div className="app-desk-main-boss-img">
                            {boss.imageUrl
                                ? <Image className="app-desk-main-boss-img_illustration" src={imageSrc(boss.imageUrl) ?? ""} fill sizes="14rem" alt={`${boss.name} ${boss.surname}`} />
                                : <UserRound color="rgb(231, 231, 231)" size={200}/>}
                        </div>
                        <div className="app-desk-main-boss-content">
                            <div className="app-desk-main-boss-content-head">
                                <Tag lib={boss.role} />
                                {isAdmin && <AdminActions member={boss} onEdit={() => setToEdit(boss)} onDelete={() => setToDelete(boss)} />}
                            </div>
                            <h1 className="app-desk-main-boss-content_title">{boss.name} {boss.surname}</h1>
                            <span className="app-desk-main-boss-content_email"><Mail size={14} />{boss.email}</span>
                            {boss.phone && <span className="app-desk-main-boss-content_email"><Phone size={14} />{boss.phone}</span>}
                            {boss.description && <p className="app-desk-main-boss-content_description">{boss.description}</p>}
                        </div>
                    </div>
                )}

                {others.length > 0 && (
                    <div className="app-desk-main-members">
                        {others.map((member) => (
                            <div key={member.id} className="app-desk-main-members-container">
                                <div className="app-desk-main-members-container-support">
                                    {member.imageUrl
                                        ? <Image className="app-desk-main-members-container-support_img" src={imageSrc(member.imageUrl) ?? ""} fill sizes="(max-width: 768px) 100vw, 20rem" alt={`${member.name} ${member.surname}`} />
                                        : <UserRound color="rgb(231, 231, 231)" size={100}/>}
                                    {isAdmin && <AdminActions member={member} onEdit={() => setToEdit(member)} onDelete={() => setToDelete(member)} />}
                                </div>
                                <div className="app-desk-main-members-container-info">
                                    <h2 className="app-desk-main-members-container-info_name">{member.name} {member.surname}</h2>
                                    <h3 className="app-desk-main-members-container-info_status">{member.role}</h3>
                                    <span className="app-desk-main-members-container-info_email"><Mail size={10} />{member.email}</span>
                                    {member.phone && <span className="app-desk-main-members-container-info_email"><Phone size={10} />{member.phone}</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
            {isAdmin && toEdit && (
                <DeskForm
                    key={toEdit === "new" ? "new" : toEdit.id}
                    member={toEdit === "new" ? undefined : toEdit}
                    onClose={closeEdit}
                    onSaved={handleSaved}
                />
            )}
            {isAdmin && toDelete && (
                <ConfirmDialog
                    title="Supprimer un membre du bureau"
                    message={<>Voulez-vous vraiment retirer <strong>{toDelete.name} {toDelete.surname}</strong> ({toDelete.role}) du bureau ?</>}
                    onConfirm={() => deleteMember(toDelete)}
                    onClose={closeDelete}
                />
            )}
            <Footer />
        </div>
    )
}
