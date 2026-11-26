"use client";

import Navbar from '@web/component/navbar/Navbar'
import './page.scss'
import Tag from '@web/component/tag/Tag'
import { Calendar, CalendarClock, Clock, FilePlus, FileSpreadsheet, LayoutGrid, ListChecks, Mail, Pencil, Phone, Plus, Trash2, UserRound, Users } from 'lucide-react'
import Footer from '@web/component/footer/Footer'
import RegistrationForm from '@web/component/registrationForm/RegistrationForm'
import NewsPlaceholder from '@web/component/news/NewsPlaceholder'
import { useCallback, useEffect, useState } from 'react';
import { useSession } from '@web/component/session/SessionProvider'
import TournamentForm, { type Tournament } from '@web/component/tournamentForm/TournamentForm'
import NewsForm, { type NewsArticle } from '@web/component/newsForm/NewsForm'
import ConfirmDialog from '@web/component/modal/ConfirmDialog'
import PlayerManager from '@web/component/playerManager/PlayerManager'
import { ApiError, apiDownload, apiFetch, imageSrc } from '@web/lib/api'

const dayFormatter = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" });
const closingFormatter = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });

/** « 23 – 24 mai 2026 », ou les deux dates complètes si le mois ou l'année diffèrent. */
function formatRange(startIso: string, endIso: string) {
    const start = new Date(startIso);
    const end = new Date(endIso);
    if (start.toDateString() === end.toDateString()) return dayFormatter.format(start);
    if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
        return `${start.getDate()} – ${dayFormatter.format(end)}`;
    }
    return `${dayFormatter.format(start)} – ${dayFormatter.format(end)}`;
}

/** Message d'erreur lisible pour une action d'administration qui échoue. */
function adminError(error: unknown, fallback: string) {
    if (error instanceof ApiError && error.status === 401) return "Votre session a expiré, reconnectez-vous";
    return fallback;
}

interface CurrentTournament {
    tournament: Tournament | null
    article: NewsArticle | null
}

export default function Tournoi() {
    const { session } = useSession();
    const isAdmin = session.status === "authenticated";

    // undefined = chargement
    const [data, setData] = useState<CurrentTournament | undefined>(undefined);
    const [loadError, setLoadError] = useState(false);

    // Fenêtres d'administration
    const [tournamentForm, setTournamentForm] = useState<null | "new" | "edit">(null);
    const [articleForm, setArticleForm] = useState<null | "new" | "edit">(null);
    const [toDelete, setToDelete] = useState<null | "tournament" | "article">(null);
    const [playerManagerOpen, setPlayerManagerOpen] = useState(false);
    const closePlayerManager = useCallback(() => setPlayerManagerOpen(false), []);

    const load = useCallback(() => apiFetch<CurrentTournament>("/tournaments/current")
        .then((current) => { setData(current); setLoadError(false) })
        .catch(() => { setData((prev) => prev ?? { tournament: null, article: null }); setLoadError(true) }), []);

    useEffect(() => { void load() }, [load]);
    // Après une inscription : recharge le tournoi pour mettre à jour le nombre d'inscrits par tableau
    const refresh = useCallback(() => { void load() }, [load]);

    const tournament = data?.tournament ?? null;
    const article = data?.article ?? null;

    const closeTournamentForm = useCallback(() => setTournamentForm(null), []);
    const closeArticleForm = useCallback(() => setArticleForm(null), []);
    const closeDelete = useCallback(() => setToDelete(null), []);

    // Export Excel des inscrits (admin)
    const [exporting, setExporting] = useState(false);
    const [exportError, setExportError] = useState<string | null>(null);
    const handleExport = async () => {
        if (!tournament || exporting) return;
        setExporting(true);
        setExportError(null);
        try {
            await apiDownload(`/tournaments/${tournament.id}/registrations/export`, "inscrits.xlsx");
        } catch (error) {
            setExportError(adminError(error, "Impossible d'exporter les inscrits, réessayez plus tard"));
        } finally {
            setExporting(false);
        }
    };

    const handleTournamentSaved = useCallback((saved: Tournament) => {
        setData((prev) => ({ tournament: saved, article: prev?.tournament?.id === saved.id ? prev.article : null }));
        setLoadError(false);
    }, []);

    const handleArticleSaved = useCallback((saved: NewsArticle) => {
        setData((prev) => prev && { ...prev, article: saved });
    }, []);

    const confirmDelete = async () => {
        if (toDelete === "tournament" && tournament) {
            try {
                await apiFetch(`/tournaments/${tournament.id}`, { method: "DELETE" });
            } catch (error) {
                if (!(error instanceof ApiError && error.status === 404)) throw new Error(adminError(error, "Impossible de supprimer le tournoi, réessayez plus tard"));
            }
            setData({ tournament: null, article: null });
        }
        if (toDelete === "article" && article) {
            try {
                await apiFetch(`/news/${article.id}`, { method: "DELETE" });
            } catch (error) {
                if (!(error instanceof ApiError && error.status === 404)) throw new Error(adminError(error, "Impossible de supprimer l'article, réessayez plus tard"));
            }
            setData((prev) => prev && { ...prev, article: null });
        }
    };

    const upcoming = tournament ? new Date(tournament.startDate) > new Date() : false;
    // Sans article, les visiteurs ne voient que le formulaire (l'admin voit l'emplacement pour le créer)
    const showLeftColumn = !!article || isAdmin;

    return (
        <div className='app-tournament'>
            <Navbar select='tournoi' />
            <header className="app-tournament-header">
                <div className="app-tournament-header-mark">
                    <h1 className="app-tournament-header-mark_title">prtt</h1>
                    <h2 className="app-tournament-header-mark_subtitle">Tournoi International</h2>
                </div>
            </header>

            <main className='app-tournament-main'>
                {data === undefined && <p className='app-tournament-main_status'>Chargement du tournoi…</p>}

                {/* Bandeau d'administration */}
                {isAdmin && data !== undefined && (
                    <div className={`app-tournament-main-admin ${tournament ? 'app-tournament-main-admin--locked' : ''}`}>
                        {tournament ? (
                            <>
                                <CalendarClock size={18} className='app-tournament-main-admin_icon' />
                                <p className='app-tournament-main-admin_text'>
                                    <strong>Tournoi en cours : {tournament.title}</strong>
                                    <span>
                                        {formatRange(tournament.startDate, tournament.endDate)}
                                        {" · "}{tournament.tables.length} tableau{tournament.tables.length > 1 ? "x" : ""} · JA : {tournament.ja}
                                    </span>
                                    <span>Un nouveau tournoi pourra être créé une fois celui-ci terminé.</span>
                                    {exportError && <span className='app-tournament-main-admin_error'>{exportError}</span>}
                                </p>
                                <div className='app-tournament-actions'>
                                    <button type='button' className='app-tournament-actions_btn' onClick={() => setPlayerManagerOpen(true)}>
                                        <Users size={12} /> Gérer les inscrits
                                    </button>
                                    <button type='button' className='app-tournament-actions_btn' onClick={handleExport} disabled={exporting}>
                                        <FileSpreadsheet size={12} /> {exporting ? "Export…" : "Exporter les inscrits"}
                                    </button>
                                    <button type='button' className='app-tournament-actions_btn' onClick={() => setTournamentForm("edit")}>
                                        <Pencil size={12} /> Modifier
                                    </button>
                                    <button type='button' className='app-tournament-actions_btn app-tournament-actions_btn--danger' onClick={() => setToDelete("tournament")}>
                                        <Trash2 size={12} /> Supprimer
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <p className='app-tournament-main-admin_text'>
                                    <strong>Aucun tournoi en cours</strong>
                                    <span>Créez le prochain tournoi et ses tableaux.</span>
                                </p>
                                <button type='button' className='app-tournament-main-admin_create' onClick={() => setTournamentForm("new")}>
                                    <Plus size={16} /> Créer un tournoi
                                </button>
                            </>
                        )}
                    </div>
                )}

                {/* Aucun tournoi : page vide pour les visiteurs */}
                {data !== undefined && !tournament && !isAdmin && (
                    <div className='app-tournament-main-empty'>
                        <CalendarClock size={40} className='app-tournament-main-empty_icon' />
                        <h2 className='app-tournament-main-empty_title'>Aucun tournoi n&apos;est prévu pour le moment</h2>
                        <p className='app-tournament-main-empty_text'>
                            {loadError ? "Impossible de charger le tournoi, réessayez plus tard." : "Revenez bientôt : les inscriptions ouvriront dès l'annonce de la prochaine édition."}
                        </p>
                    </div>
                )}

                {tournament && (
                    <>
                        <div className='app-tournament-main-head'>
                            <h1 className='app-tournament-main-head_title'>{tournament.title}</h1>
                            <Tag variant='primary' lib={upcoming ? "Inscriptions ouvertes" : "Tournoi en cours"} />
                        </div>
                        <div className={`app-tournament-main-info ${showLeftColumn ? '' : 'app-tournament-main-info--single'}`}>
                            {article ? (
                                <div className='app-tournament-main-info-edition'>
                                    <NewsPlaceholder className='app-tournament-main-info-edition_placeholder' logoSize={72} src={imageSrc(article.imageUrl)} alt={article.title} />
                                    <div className='app-tournament-main-info-edition-content'>
                                        <div className='app-tournament-main-info-edition-content-head'>
                                            <h2 className='app-tournament-main-info-edition-content_title'>{article.title}</h2>
                                            {isAdmin && (
                                                <div className='app-tournament-actions'>
                                                    <button type='button' className='app-tournament-actions_btn' onClick={() => setArticleForm("edit")}>
                                                        <Pencil size={12} /> Modifier
                                                    </button>
                                                    <button type='button' className='app-tournament-actions_btn app-tournament-actions_btn--danger' onClick={() => setToDelete("article")}>
                                                        <Trash2 size={12} /> Supprimer
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                        <div className='app-tournament-main-info-edition-content-detail'>
                                            <span className='app-tournament-main-info-edition-content-detail_span'><Calendar size="14" color='#fb923c' /> {formatRange(tournament.startDate, tournament.endDate)}</span>
                                            <span className='app-tournament-main-info-edition-content-detail_span'><LayoutGrid size="14" color='#fb923c' /> {tournament.tables.length} tableau{tournament.tables.length > 1 ? "x" : ""}</span>
                                            <span className='app-tournament-main-info-edition-content-detail_span'><ListChecks size="14" color='#fb923c' /> {tournament.tabMax} tableau{tournament.tabMax > 1 ? "x" : ""} maximum par jour</span>
                                            <span className='app-tournament-main-info-edition-content-detail_span'><Clock size="14" color='#fb923c' /> Inscriptions jusqu&apos;au {closingFormatter.format(new Date(tournament.registrationEndAt))}</span>
                                            <span className='app-tournament-main-info-edition-content-detail_span'><UserRound size="14" color='#fb923c' /> Juge-arbitre : {tournament.ja}</span>
                                            {/* Contact du JA : facultatif */}
                                            {tournament.email && <span className='app-tournament-main-info-edition-content-detail_span'><Mail size="14" color='#fb923c' /> {tournament.email}</span>}
                                            {tournament.phone && <span className='app-tournament-main-info-edition-content-detail_span'><Phone size="14" color='#fb923c' /> {tournament.phone}</span>}
                                        </div>
                                        <p className='app-tournament-main-info-edition-content_description app-tournament-main-info-edition-content_description--text'>{article.content}</p>
                                    </div>
                                </div>
                            ) : isAdmin && (
                                <div className='app-tournament-main-info-article-empty'>
                                    <FilePlus size={32} className='app-tournament-main-info-article-empty_icon' />
                                    <h2 className='app-tournament-main-info-article-empty_title'>Article de présentation</h2>
                                    <p className='app-tournament-main-info-article-empty_text'>
                                        Présentez le tournoi aux joueurs : lieu, dotation, participants attendus…
                                        Il s&apos;affichera ici, à côté du formulaire d&apos;inscription.
                                    </p>
                                    <button type='button' className='app-tournament-main-admin_create' onClick={() => setArticleForm("new")}>
                                        <Plus size={16} /> Créer l&apos;article du tournoi
                                    </button>
                                </div>
                            )}
                            <RegistrationForm tournament={tournament} onRegistered={refresh} />
                        </div>
                    </>
                )}
            </main>

            {isAdmin && tournamentForm && (
                <TournamentForm
                    key={tournamentForm}
                    tournament={tournamentForm === "edit" && tournament ? tournament : undefined}
                    onClose={closeTournamentForm}
                    onSaved={handleTournamentSaved}
                />
            )}
            {isAdmin && articleForm && tournament && (
                <NewsForm
                    key={articleForm}
                    tournament
                    article={articleForm === "edit" && article ? article : undefined}
                    onClose={closeArticleForm}
                    onSaved={handleArticleSaved}
                />
            )}
            {isAdmin && playerManagerOpen && tournament && (
                <PlayerManager tournamentId={tournament.id} onClose={closePlayerManager} onChanged={refresh} />
            )}
            {isAdmin && toDelete && (
                <ConfirmDialog
                    title={toDelete === "tournament" ? "Supprimer le tournoi" : "Supprimer l'article du tournoi"}
                    message={toDelete === "tournament"
                        ? <>Voulez-vous vraiment supprimer <strong>« {tournament?.title} »</strong> ? Ses tableaux, toutes les inscriptions et son article de présentation seront aussi supprimés.</>
                        : <>Voulez-vous vraiment supprimer l&apos;article <strong>« {article?.title} »</strong> ?</>}
                    onConfirm={confirmDelete}
                    onClose={closeDelete}
                />
            )}
            <Footer />
        </div>
    )
}
