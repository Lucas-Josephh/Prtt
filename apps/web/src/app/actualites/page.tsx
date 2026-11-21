"use client";

import Navbar from "@web/component/navbar/Navbar"
import "./page.scss"
import Image from "next/image"
import Tag from "@web/component/tag/Tag"
import { Calendar } from "lucide-react"
import News from "@web/component/news/News"
import Button from "@web/component/button/Button"
import { useState } from "react"
import Footer from "@web/component/footer/Footer";

type NewsType = {
    type?: "card" | "template";
    src?: string;
    tagName: string;
    imgHeight?: string;
    imgWidth?: string;
    date: string;
    title: string;
    description: string;
}

export default function Actualite() {
    const [selected, setSelected] = useState("toutes");
    const [news] = useState<NewsType[]>([
        {type: "template", src: "/feminine.jpg", tagName: "tournoi", date: "31 mars 2026", title: "Belle journée pour les féminines au championnat régional", description: "Les joueuses du PRTT ont participé ce week-end au championnat régional, qui s’est tenu à Ferrière-sur-Ariège. À cette occasion, elles ont évolué avec leurs nouveaux maillots, généreusement offerts par nos sponsors Panther et Sushi Sakura.", },
        {type: "template", src: "/tests.jpg", tagName: "tournoi", date: "31 mars 2026", title: "Top occitanie Poussin / Benjamin", description: "Ce samedi s'est déroulé le top occitanie réunissant les meilleurs poussins et Benjamins de la région. Et pour une fois c'est en pays catalan, à Canohes que cette rencontre se déroulait.\nDeux de nos jeunes étaient retenus pour cette compétition.\nAlienor DE SAINT MARTIN en catégorie Benjamine et Noi HUANG poussin surclassé en catégorie Benjamin.\nIls étaient coachés pour l'occasion par leur entraîneur Ivan MELEY.\nLeur combativité et leur sérieux leur ont permis d'obtenir de très bons résultats. Alienor termine Vice championne d'occitanie s'inclinant en finale. Noi est sacré champion d'occitanie Benjamin en n'étant que poussin. La preuve est que les entraînements payent.\nBravo à nos jeunes et à leur entraîneur pour le travail réalisé. La relève est assurée.\n\nVamos PRTT !"},
        {type: "template", src: "/criterium.jpg", tagName: "tournoi", date: "15 mars 2026", title: "Nos jeunes aux critériums pré-nationale", description: "Bilan de la pré-nationale : de belles performances pour le club avec Noï qui termine 9ᵉ en benjamin, Louis 8ᵉ en minime. En junior, Pénélope se classe 7ᵉ, Chloé réalise une très belle performance en montant sur la 2ᵉ marche du podium, et Gabriel prend la 4ᵉ place. Une compétition très positive pour l’ensemble du groupe, qui confirme les progrès de chacun et qui nous a offert un beau spectacle. Le coach est fière de la combativité et de l’engagement de ses athlètes 🏓💪", },
        {type: "template", src: "/open.png", tagName: "tournoi", date: "17 février 2026", title: "Lancement de l'open National du PRTT", description: "🏓 17e OPEN NATIONAL DE PERPIGNAN – Tennis de table\n23–24 mai 2026\nDeux jours de compétition, de perf’ et d’ambiance au soleil !📍\nPerpignan , Parc des sports\n✅ Inscriptions\nSMS / Téléphone : 06 33 54 55 59\nMail : prtt.tournois@gmail.com\nRèglement détaillé disponible sur : prtt.fr", },
        {type: "template", src: "/champJeunes.jpg", tagName: "tournoi", date: "16 novembre 2025", title: "Incroyable weekend pour nos jeunes", description: "🌟 Résumé du championnat jeunes 🌟\nQuel incroyable weekend pour nos jeunes champions !\n\n🥇Louis et Noï montent brillament sur la 1ère marche du podium !\n🥇Quentin et Robin décrochent eux aussi une magnifique première place !\n🥈Pénélope et Aliénor réalisent une superbe performance et terminent 2e !\n🥉 Chloé et Auguste complètent le tableau avec une très belle 3e place !\n\nBravo à tous pour votre énergie, votre progression et votre esprit d'équipe. Vous pouvez être fiers de vous !", },
        {type: "template", src: "/result1s.jpg", tagName: "match", date: "16 novembre 2025", title: "Une défaite amère", description: "Une défaite amère chez nous pour nos catalans\nPour la 4ème journée de N2, le PRTT recevait Montpellier.\nL'équipe adverse affichait des joueurs homogènes (2000 à N°100), alors que nos catalans étaient classés entre 1800 à N°300.\n\nAprès une bataille acharnée, le PRTT s'incline 1-8.\n\n Faits marquants:\n\nIvan Meley (capitaine) et Iker Gonzales, pas dans leur meilleure forme face à Montpellier qui étaient monstrueux.\nJeremy Bonifazi signe une perf à 20 contre Zabban Eric.\nEt notre Jean Baptiste qui s'incline contre Eric Zabban malgré une belle remontée à la belle.", },
        {type: "template", src: "/top_occitanie.jpg", tagName: "tournoi", date: "5 octobre 2025", title: "Nos jeunes au Top Occitanie", description: "Hier s'est déroulé le top Occitanie ! Une belle 7e place pour Noï en benjamin étant encore poussin et un beau résultat pour Aliénor  qui se glisse sur la plus petite marche du podium, bravo à nos 2 mascottes. Merci à nos 2 coach présents sur cette compétition Karen almagro et Ivan Meley.", },
    ])
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
                    <Button variant="tertiary" height="40px" lib="Toutes" className={selected.toLowerCase() === "toutes" ? `app-news-nav-btn_selected` : ""} onClick={() => setSelected("toutes")} />
                    <Button variant="tertiary" height="40px" lib="Matchs" className={selected.toLowerCase() === "match" ? `app-news-nav-btn_selected` : ""} onClick={() => setSelected("match")} />
                    <Button variant="tertiary" height="40px" lib="Tournois" className={selected.toLowerCase() === "tournoi" ? `app-news-nav-btn_selected` : ""} onClick={() => setSelected("tournoi")} />
                    <Button variant="tertiary" height="40px" lib="Club" className={selected.toLowerCase() === "club" ? `app-news-nav-btn_selected` : ""} onClick={() => setSelected("club")} />
                    <Button variant="tertiary" height="40px" lib="Formation" className={selected.toLowerCase() === "formation" ? `app-news-nav-btn_selected` : ""} onClick={() => setSelected("formation")} />
                    <Button variant="tertiary" height="40px" lib="Autre" className={selected.toLowerCase() === "autre" ? `app-news-nav-btn_selected` : ""} onClick={() => setSelected("autre")} />
                </nav>
            </div>
            <main className="app-news-main">
                <div className="app-news-main-featured">
                    <Image src="/tournament.jpg" className="app-news-main-featured_img" loading="eager" width={80} height={80} alt="background"/>
                    <div className="app-news-main-featured-content">
                        <div className="app-news-main-featured-content-head">
                            <Tag news="tournoi" />
                            <div className="app-news-main-featured-content-head_date">
                                <Calendar size={10} />
                                17 février 2026
                            </div>
                        </div>
                        <h1 className="app-news-main-featured-content_title">OPEN NATIONAL DE PERPIGNAN</h1>
                        <div className="app-news-main-featured-content_description">
                            <p>
                                Le moment est venu de montrer ton niveau ! 💪
                                <br />
                                Le tournoi national de tennis de table du PRTT est officiellement lancé et on t’attend sur les tables 🏓
                            </p>
                            <p>
                                👉 Que tu sois joueur confirmé ou passionné prêt à te challenger, c’est l’événement à ne pas manquer !
                            </p>
                            <p style={{display: "flex", flexDirection: "column"}}>
                                <span>🎯 Ambiance compétitive</span>
                                <span>🏆 Récompenses à la clé</span>
                                <span>🤝 200+ joueurs sont attendus</span>
                            </p>
                            <p>
                                📅 Inscris-toi dès maintenant et viens défendre tes couleurs !
                            </p>
                            <p>
                                ⚡ Places limitées ne tarde pas !
                            </p>
                        </div>
                    </div>
                </div>

                <ul className="app-news-main-news">
                    {news.map((item: NewsType, index) => {
                        if (selected === item.tagName || selected === "toutes") {
                            return (
                                <li key={index}>
                                    <News 
                                        type={item.type}
                                        src={item.src}
                                        tagName={item.tagName}
                                        title={item.title}
                                        imgHeight="11rem"
                                        date={item.date}
                                        description={item.description}
                                    />
                                </li>
                            );
                        }

                        return null;
                    })}
                </ul>
            </main>
            <Footer />
        </div>
    )
}