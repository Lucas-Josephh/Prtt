"use client";

import Navbar from "@web/component/navbar/Navbar"
import "./page.scss"
import Tag from "@web/component/tag/Tag"
import { Calendar, Pencil, Plus, Trash2 } from "lucide-react"
import News from "@web/component/news/News"
import NewsPlaceholder from "@web/component/news/NewsPlaceholder"
import Button from "@web/component/button/Button"
import { useCallback, useEffect, useMemo, useState } from "react"
import Footer from "@web/component/footer/Footer";
import NewsForm, { type NewsArticle } from "@web/component/newsForm/NewsForm"
import { useSession } from "@web/component/session/SessionProvider"
import { ApiError, apiFetch, imageSrc } from "@web/lib/api"
import ConfirmDialog from "@web/component/modal/ConfirmDialog"

const dateFormatter = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" })

/** Date utilisée pour le tri et l'affichage : publication, ou création pour un brouillon. */
function articleDate(article: NewsArticle): Date {
    return new Date(article.publishedAt ?? article.createdAt)
}

/** Date affichée + éventuel badge (brouillon / programmée). */
function articleMeta(article: NewsArticle): { date: string, badge?: string } {
    const date = dateFormatter.format(articleDate(article))
    if (!article.publishedAt) return { date, badge: "Brouillon" }
    return { date, badge: new Date(article.publishedAt) > new Date() ? "Programmée" : undefined }
}

const FILTERS = [
    { value: "toutes", label: "Toutes" },
    { value: "match", label: "Matchs" },
    { value: "tournoi", label: "Tournois" },
    { value: "club", label: "Club" },
    { value: "formation", label: "Formation" },
    { value: "autre", label: "Autre" },
]

export default function Actualite() {
    const [selected, setSelected] = useState("toutes");
    const { session } = useSession();
    const isAdmin = session.status === "authenticated";
    // null = fermé ; "new" = création ; NewsArticle = modification de cette actualité
    const [form, setForm] = useState<null | "new" | NewsArticle>(null);
    // Actualité dont la suppression est en attente de confirmation
    const [toDelete, setToDelete] = useState<NewsArticle | null>(null);
    const [articles, setArticles] = useState<NewsArticle[]>([]);

    // Publiées pour tout le monde, brouillons et programmées compris pour l'admin
    useEffect(() => {
        if (session.status === "loading") return;
        let cancelled = false;
        apiFetch<NewsArticle[]>(isAdmin ? "/news/all" : "/news")
            .then((data) => { if (!cancelled) setArticles(data) })
            .catch(() => { if (!cancelled) setArticles([]) });
        return () => { cancelled = true };
    }, [session.status, isAdmin]);

    // Ajoute l'actualité créée, ou remplace celle qui vient d'être modifiée
    const handleSaved = useCallback((article: NewsArticle) => {
        setArticles((prev) => prev.some((a) => a.id === article.id)
            ? prev.map((a) => (a.id === article.id ? article : a))
            : [article, ...prev]);
    }, []);
    const closeForm = useCallback(() => setForm(null), []);
    const closeDelete = useCallback(() => setToDelete(null), []);

    const deleteArticle = useCallback(async (article: NewsArticle) => {
        try {
            await apiFetch(`/news/${article.id}`, { method: "DELETE" });
        } catch (error) {
            // Déjà supprimée ailleurs : on la retire quand même de la liste
            if (!(error instanceof ApiError && error.status === 404)) {
                throw new Error(error instanceof ApiError && error.status === 401
                    ? "Votre session a expiré, reconnectez-vous"
                    : "Impossible de supprimer l'actualité, réessayez plus tard");
            }
        }
        setArticles((prev) => prev.filter((a) => a.id !== article.id));
    }, []);

    // Filtre par catégorie puis tri du plus récent au plus ancien
    const { featured, regular } = useMemo(() => {
        const visible = articles
            .filter((a) => selected === "toutes" || a.category === selected)
            .sort((a, b) => articleDate(b).getTime() - articleDate(a).getTime());
        return { featured: visible.filter((a) => a.featured), regular: visible.filter((a) => !a.featured) };
    }, [articles, selected]);

    return (
        <div className="app-news">
            <Navbar select="Actualités" />
            <header className="app-news-header">
                <div className="app-news-header-mark">
                    <h1 className="app-news-header-mark_title">Club PRTT</h1>
                    <h2 className="app-news-header-mark_subtitle">Actualités</h2>
                </div>
            </header>
            <div className="app-news-nav">
                <nav className="app-news-nav-btn">
                    {FILTERS.map((filter) => (
                        <Button
                            key={filter.value}
                            variant="tertiary"
                            height="40px"
                            lib={filter.label}
                            className={selected === filter.value ? "app-news-nav-btn_selected" : ""}
                            onClick={() => setSelected(filter.value)}
                        />
                    ))}
                </nav>
                {isAdmin && (
                    <button type="button" className="app-news-nav_add" onClick={() => setForm("new")}>
                        <Plus size={16} /> Ajouter une actualité
                    </button>
                )}
            </div>
            <main className="app-news-main">
                {featured.map((article) => {
                    const meta = articleMeta(article);
                    return (
                        <div key={article.id} className="app-news-main-featured">
                            <NewsPlaceholder className="app-news-main-featured_placeholder" logoSize={96} src={imageSrc(article.imageUrl)} alt={article.title} />
                            <div className="app-news-main-featured-content">
                                <div className="app-news-main-featured-content-head">
                                    <Tag news={article.category} />
                                    <div className="app-news-main-featured-content-head_date">
                                        <Calendar size={10} />
                                        {meta.date}
                                    </div>
                                    {meta.badge && <span className="app-news-main-featured-content-head_badge">{meta.badge}</span>}
                                    {isAdmin && (
                                        <div className="app-news-main-featured-content-head-actions">
                                            <button type="button" className="app-news-main-featured-content-head-actions_btn" onClick={() => setForm(article)}>
                                                <Pencil size={12} /> Modifier
                                            </button>
                                            <button type="button" className="app-news-main-featured-content-head-actions_btn app-news-main-featured-content-head-actions_btn--danger" onClick={() => setToDelete(article)}>
                                                <Trash2 size={12} /> Supprimer
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <h1 className="app-news-main-featured-content_title">{article.title}</h1>
                                <p className="app-news-main-featured-content_description app-news-main-featured-content_description--text">{article.content}</p>
                            </div>
                        </div>
                    );
                })}

                <ul className="app-news-main-news">
                    {regular.map((article) => {
                        const meta = articleMeta(article);
                        return (
                            <li key={article.id}>
                                <News
                                    type="template"
                                    src={imageSrc(article.imageUrl)}
                                    imgHeight="11rem"
                                    tagName={article.category}
                                    title={article.title}
                                    date={meta.date}
                                    badge={meta.badge}
                                    description={article.content}
                                    onEdit={isAdmin ? () => setForm(article) : undefined}
                                    onDelete={isAdmin ? () => setToDelete(article) : undefined}
                                />
                            </li>
                        );
                    })}
                </ul>

                {featured.length === 0 && regular.length === 0 && (
                    <p className="app-news-main_empty">Aucune actualité pour le moment.</p>
                )}
            </main>
            {isAdmin && form && (
                <NewsForm
                    key={form === "new" ? "new" : form.id}
                    article={form === "new" ? undefined : form}
                    onClose={closeForm}
                    onSaved={handleSaved}
                />
            )}
            {isAdmin && toDelete && (
                <ConfirmDialog
                    title="Supprimer l'actualité"
                    message={<>Voulez-vous vraiment supprimer l&apos;actualité <strong>« {toDelete.title} »</strong> ?</>}
                    onConfirm={() => deleteArticle(toDelete)}
                    onClose={closeDelete}
                />
            )}
            <Footer />
        </div>
    )
}
