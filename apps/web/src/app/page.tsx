"use client";

import Navbar from "@web/component/navbar/Navbar";
import History from "@web/component/history/History";
import './page.scss';
import Image from "next/image";
import { JSX, useEffect, useState } from "react";
import Card from "@web/component/card/Card";
import Skill from "@web/component/skill/Skill";
import { ArrowRight, Award, Heart, Map, MapPin, Target, Trophy, Users, Zap } from "lucide-react";
import Button from "@web/component/button/Button";
import News from "@web/component/news/News";
import Footer from "@web/component/footer/Footer";
import { useRouter } from "next/navigation";
import type { NewsArticle } from "@web/component/newsForm/NewsForm";
import { apiFetch, imageSrc } from "@web/lib/api";

const dateFormatter = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" });

/** Nombre d'actualités affichées sur la page d'accueil */
const HOME_NEWS_COUNT = 4;

type HistoryType = {
  id?: string;
  selectedId?: string;
  logo?: string;
  logoName?: string;
  tagName?: string;
  title?: string;
  color?: string;
  description?: JSX.Element;
}

type SkillType = {
  logo: JSX.Element;
  title: string;
  description: string;
  color?: string;
}

export default function Home() {
  const [selectedId, setSelectedId] = useState("");
  const router = useRouter();
  const [historyBubble] = useState<HistoryType[]>([
    {id: crypto.randomUUID(), logo: "🏓", logoName: "1987", title: "La naissance du PRTT", color: "#f97316", description: (
    <div>
      <p>Le Perpignan Roussillon Tennis de Table (PRTT) voit le jour en 1987, issu de la fusion entre le Foyer Léo Lagrange Perpignan et le club de Saint-Assiscle.</p>

      <p>À l’origine de cette création, trois figures fondatrices :</p>

      <ul>
        <li>Bernard Garonnat, premier président du club</li>
        <li>Jean-Pierre Clusells</li>
        <li>Henri Blanc, aujourd’hui disparu, dont la salle porte le nom en hommage</li>
      </ul>

      <p>Dès ses débuts, le club affirme une ambition forte : allier formation, convivialité et développement sportif.</p>
    </div>
  )},
    {id: crypto.randomUUID(), logo: "📚", logoName: "Développement", title: "L'essor de la formation jeunesse", color: "#3b82f6", description: (
      <div>
        <p>
          Au fil des premières années, le club se structure et se développe sous l’impulsion de Francis Vizuete, qui permet au PRTT de franchir un cap majeur en atteignant le niveau national.
          Cette dynamique se poursuit ensuite sous la direction de Guillaume Lebecq, consolidant les bases sportives et organisationnelles du club.
        </p>
      </div>
    )},
    {id: crypto.randomUUID(), logo: "🏆", logoName: "2002", title: "L'accession en Nationale 3", color: "#f97316", description: (
      <div>
        <p>
          Après des débuts marqués par un maintien difficile en Régionale 2, le club progresse régulièrement.
          En 2002, cette montée en puissance est récompensée par une accession en Nationale 3, marquant une étape clé dans l’histoire sportive du PRTT.
        </p>
      </div>
    )},
    {id: crypto.randomUUID(), logo: "⭐", logoName: "Formation", title: "L'âge d'or du club", color: "#eab308", description: (
      <div>
        <p>
          Le club intensifie son engagement auprès des jeunes en développant des partenariats avec les écoles primaires et collèges.
          Ce travail de formation s’amplifie au fil des années, permettant au club de dépasser les 100 adhérents, dont près de 70 % ont entre 4 et 18 ans.
          Malgré cette croissance, le PRTT conserve son identité : une ambiance conviviale et familiale, où chaque joueur trouve sa place, quel que soit son niveau.
          Les générations de jeunes formés au club commencent alors à alimenter durablement les différentes équipes.
        </p>
      </div>
    )},
    {id: crypto.randomUUID(), logo: "💪", logoName: "2009 – 2016", title: "La résilience, valeur fondamentale", color: "#10b981", description: (
      <div>
        <p>
          Le club connaît deux descentes, en 2009 puis en 2016, mais ces périodes ne freinent pas sa progression.
        </p>

        <span>Au contraire, elles renforcent sa volonté de s’appuyer sur ses fondamentaux :</span>
        <ul style={{listStyle: "none", padding: "0", marginLeft: "1rem"}}>
          <li>👉 la formation</li>
          <li>👉 le renouvellement des générations</li>
        </ul>

        <p>Le PRTT démontre ainsi sa capacité à rebondir et à construire sur le long terme.</p>
      </div>
    )},
    {id: crypto.randomUUID(), logo: "🔧", logoName: "Dynamique", title: "La reconstruction", color: "#8b5cf6", description: (
      <div>
        <p>
          Le club s’affirme comme une structure solide, reposant sur :
        </p>
        <ul>
          <li>une équipe dirigeante organisée</li>
          <li>une forte implication des bénévoles</li>
          <li>une politique de formation efficace</li>
        </ul>
        <p>Chaque année, le PRTT organise notamment un tournoi international, mobilisant plus de 20 bénévoles pendant deux jours, preuve de son dynamisme et de son ancrage local.</p>

        <p>Sportivement, l’équipe fanion se stabilise durablement au niveau national.</p>
      </div>
    )},
    {id: crypto.randomUUID(), logo: "🚀", logoName: "2022", title: "Retour en Nationale – moment historique", color: "#f97316", description: (
      <div>
        <p>L’année 2022 marque un tournant majeur :</p>
        <ul style={{listStyle: "none", padding: "0", marginLeft: "1rem"}}>
          <li>👉 montée en Nationale 1</li>
          <li>👉 et surtout maintien historique à ce niveau</li>
        </ul>
        <p>Une performance qui vient récompenser des années de travail et d’investissement.</p>
      </div>
    )},
    {id: crypto.randomUUID(), logo: "🌟", logoName: "Aujourd'hui", title: "Une nouvelle ère sous l'égide de Karen", color: "#ec4899", description: (
      <div>
        <p>Aujourd’hui, le PRTT est :</p>

        <p>Le club reste fidèle à ses valeurs fondatrices :</p>
        <ul style={{listStyle: "none", padding: "0", marginLeft: "1rem"}}>
          <li>👉 formation</li>
          <li>👉 épanouissement de tous</li>
          <li>👉 esprit familial</li>
        </ul>
        <p>Sa présidence est assurée par Karen Almagro, entourée d’une équipe de bénévoles engagés.</p>

        <p>Le PRTT demeure un club à taille humaine, où joueurs débutants comme confirmés évoluent dans un cadre accueillant et passionné.</p>
      </div>
    )},
  ])

  const [skill] = useState<SkillType[]>([
    {logo: <Heart color="#ef4444"/>, color: "#ef4444", title: "Convivialité", description: "Ambiance familiale et bienveillante, ouverte à tous les niveaux, du débutant au national."},
    {logo: <Target color="#f97316" />, color: "#f97316", title: "Formation", description: "Des jeunes formés via des partenariats scolaires actifs et une école de TT structurée."},
    {logo: <Zap color="#3b82f6" />, color: "#3b82f6", title: "Performance", description: "8 équipes engagées de la D3 à la N3 en constante progression."},
    {logo: <Users color="#10b981" />, color: "#10b981", title: "Bénévolat", description: "Plus de 20 bénévoles mobilisés chaque semaine pour faire vivre le club."},
    {logo: <Award color="#8b5cf6" />, color: "#8b5cf6", title: "Palmarès", description: "Champion départemental plusieurs fois. Tournoi international avec +200 participants."},
    {logo: <Map color="#06b6d4" />, color: "#06b6d4", title: "Ancrage local", description: "Salle Henri Blanc à Perpignan. Partenaire de la Ligue Occitanie de Tennis de Table."},
  ])

  // Les 4 dernières actualités publiées (la plus récente en premier)
  const [news, setNews] = useState<NewsArticle[]>([]);
  useEffect(() => {
    apiFetch<NewsArticle[]>(`/news?limit=${HOME_NEWS_COUNT}`)
      .then(setNews)
      .catch(() => setNews([]));
  }, []);

  // Les boutons « Tournoi » ne s'affichent que si un tournoi est créé (en cours ou à venir)
  const [hasTournament, setHasTournament] = useState(false);
  useEffect(() => {
    apiFetch<{ tournament: unknown | null }>("/tournaments/current")
      .then((current) => setHasTournament(current.tournament !== null))
      .catch(() => setHasTournament(false));
  }, []);

  const tournamentButton = hasTournament && (
    <Button variant="secondary" lib={`Tournoi ${new Date().getFullYear()}`} onClick={() => router.push("/tournoi")} />
  );

  return (
    <div className="app-home">
      <Navbar select="Accueil" />
      <div className="app-home-header">
        <Image className="app-home-header_img" src="/header.png" loading="eager" fill alt="background"/>
        <div className="app-home-header_overlay"></div>

        <div className="app-home-header-container">
          <div className="app-home-header-container-badges">
            <span className="app-home-header-container-badges-club">Club N°1 des Pyrénées-Orientales</span>
            <span className="app-home-header-container-badges-location"><MapPin size={12} /> Perpignan · Salle Henri Blanc</span>
          </div>

          <div className="app-home-header-container-logo">
            <div className="app-home-header-container-logo-container">
              <Image src="/logo.jpg" loading="eager" width={100} height={100} alt="logo"/>
            </div>

            <div className="app-home-header-container-logo-text">
              <h1 className="app-home-header-container-logo-text-title">PRTT</h1>
              <span className="app-home-header-container-logo-text-sub">
                Perpignan Roussillon Tennis de Table · Depuis 1987
              </span>
            </div>
          </div>

          <div className="app-home-header-container-buttons">
            <Button variant="primary" lib="Voir nos équipes →" />
            {tournamentButton}
            <Button variant="tertiary" lib="Nous rejoindre" />
          </div>
        </div>
      </div>
      <div className="app-home-stats">
        <div className="app-home-stats-container">
          <span className="app-home-stats-container_title">N3</span>
          <span className="app-home-stats-container_subtitle">Equipe fanion</span>
          <span className="app-home-stats-container_desc">National 3</span>
        </div>
        <div className="app-home-stats-container">
          <span className="app-home-stats-container_title">80+</span>
          <span className="app-home-stats-container_subtitle">Licenciés</span>
          <span className="app-home-stats-container_desc">passionnés du sport</span>
        </div>
        <div className="app-home-stats-container">
          <span className="app-home-stats-container_title">{new Date().getFullYear() - 1987} ans</span>
          <span className="app-home-stats-container_subtitle">d&apos;existence</span>
          <span className="app-home-stats-container_desc">Fondé en 1987</span>
        </div>
      </div>
      <div className="app-home-history">
        <h1 className="app-home_title">Notre histoire – Près de 40 ans d&apos;existence</h1>
        <div className="app-home-history-container">
          <ul className="app-home-history-container-bubble">
            {historyBubble.map((item: HistoryType, index: number) => (
              <li key={index} className="app-home-history-container-bubble_li" onClick={() => item.id === selectedId ? setSelectedId("") : setSelectedId(item.id ?? "")}>
                <History
                  id={item.id}
                  logo={item.logo} 
                  logoName={item.logoName} 
                  description={item.description} 
                  {...(item.id === selectedId && { color: item.color })}
                />
              </li>
            ))}
          </ul>
          <span className="app-home-history-container-line"></span>
        </div>
        {selectedId && (() => {
          const selectedItem = historyBubble.find(item => item.id === selectedId);
          return selectedItem ? (
            <div className="app-home-history-description open" style={{border: `1px solid ${selectedItem.color}4d`}}>
              <div className="app-home-history-description-title">
                <span className="app-home-history-description-title_tag" style={{backgroundColor: selectedItem.color}}>{selectedItem.tagName || selectedItem.logoName}</span>
                <h2 className="app-home-history-description-title_text">{selectedItem.title}</h2>
              </div>
              <div className="app-home-history-description_explain">{selectedItem.description}</div>
            </div>
          ) : null;
        })()}
      </div>
      {!selectedId && <p className="app-home_info">Cliquez sur une époque pour en savoir plus</p>}
      <div className="app-home_announcement">🏓 Depuis 1987, le PRTT forme, compétit et rassemble la communauté du tennis de table en Roussillon.</div>
      <div className="app-home-card">
          <Card className="app-home-card_smooth" title={`${new Date().getFullYear() - 1987}`} subtitle={"ans d'existence"} info={"Fondé en 1987"} />
          <Card className="app-home-card_smooth" title={"8"} subtitle={"équipes en compét."} info={"D3 à N3"} />
          <Card className="app-home-card_smooth" title={"80+"} subtitle={"licenciés"} info={"passionnés du sport"} />
          <Card className="app-home-card_smooth" title={"20+"} subtitle={"bénévoles"} info={"mobilisés chaque saison"} />
      </div>

      <h1 className="app-home_title">Les valeurs du club</h1>
      <div className="app-home-skill">
        {skill.map((item: SkillType, index) => (
          <ul key={index} className="app-home-skill-list">
            <li className="app-home-skill-list_li">
              <Skill logo={item.logo} color={item.color} title={item.title} description={item.description} />
            </li>
          </ul>
        ))}
      </div>
      <div className="app-home-links">
        <Button variant="primary" lib="Voir nos équipes →" />
        {tournamentButton}
        <Button variant="tertiary" lib="Nous rejoindre" />
      </div>

      <div className="app-home-head">
        <h1 className="app-home_title">Dernières actualités</h1>
        <Button className="app-home-head_redirect" variant="primary" lib="Tout voir →" onClick={() => router.push("/actualites")} />
      </div>

      <ul className="app-home-news">
        {news.map((article) => (
          <li key={article.id}>
            <News
              src={imageSrc(article.imageUrl)}
              tagName={article.category}
              date={dateFormatter.format(new Date(article.publishedAt ?? article.createdAt))}
              title={article.title}
              description={article.content}
            />
          </li>
        ))}
      </ul>
      <Footer />
    </div>
  );
}
