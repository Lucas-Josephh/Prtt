"use client";

import Navbar from '@web/component/navbar/Navbar'
import './page.scss'
import Tag from '@web/component/tag/Tag'
import Image from 'next/image'
import { Calendar, MapPin, Trophy, Users } from 'lucide-react'
import Footer from '@web/component/footer/Footer'
import Button from '@web/component/button/Button'
import Table from '@web/component/table/table'
import { useState } from 'react';

export default function Tournoi() {
    const [open, setOpen] = useState(false);

    const handleTogglePop = (state: boolean) => {
        setOpen(state);
    }

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
                <div className='app-tournament-main-head'>
                    <h1 className='app-tournament-main-head_title'>Prochaine édition – 2026</h1>
                    <Tag variant='primary' lib="Inscriptions ouvertes" />
                </div>
                <div className='app-tournament-main-info'>
                    <div className='app-tournament-main-info-edition'>
                        <Image src="/open.png" className='app-tournament-main-info-edition_img' loading="eager" width={80} height={80} alt="logo"/>
                        <div className='app-tournament-main-info-edition-content'>
                            <h2 className='app-tournament-main-info-edition-content_title'>17ème Tournoi International du PRTT</h2>
                            <div className='app-tournament-main-info-edition-content-detail'>
                                <span className='app-tournament-main-info-edition-content-detail_span'><Calendar size="14" color='#fb923c' /> 23 – 24 mai 2026</span>
                                <span className='app-tournament-main-info-edition-content-detail_span'><MapPin size="14" color='#fb923c' />Salle Henri Blanc, Perpignan (66000)</span>
                                <span className='app-tournament-main-info-edition-content-detail_span'><Trophy size="14" color='#fb923c' /> 5 000+ euros de dotation</span>
                                <span className='app-tournament-main-info-edition-content-detail_span'><Users size="14" color='#fb923c' /> 200+ participants attendus</span>
                            </div>
                            <p className='app-tournament-main-info-edition-content_description'>Le rendez-vous incontournable du ping catalan ! Plus de 200 participants attendus. Tableaux de 500 à Toutes catégories. Buvette et restauration sur place.</p>
                        </div>
                    </div>
                    <div className='app-tournament-main-info-form'>
                        <div className='app-tournament-main-info-form-head'>
                            <h2 className='app-tournament-main-info-form-head_title'>Formulaire d&apos;inscription</h2>
                            <h3 className='app-tournament-main-info-form-head_subtitle'>Tous les champs * sont obligatoires</h3>
                        </div>
                        <form className='app-tournament-main-info-form-inscription'>
                            <div className='app-tournament-main-info-form-inscription-grid'>
                                <div className='app-tournament-main-info-form-inscription-grid-container'>
                                    <label className='app-tournament-main-info-form-inscription-grid-container_label'>Nom *</label>
                                    <input className='app-tournament-main-info-form-inscription-grid-container_input' type="text" placeholder="Votre nom" required />
                                </div>
                                <div className='app-tournament-main-info-form-inscription-grid-container'>
                                    <label className='app-tournament-main-info-form-inscription-grid-container_label'>Prénom *</label>
                                    <input className='app-tournament-main-info-form-inscription-grid-container_input' type="text" placeholder="Votre prénom" required />
                                </div>
                                <div className='app-tournament-main-info-form-inscription-grid-container'>
                                    <label className='app-tournament-main-info-form-inscription-grid-container_label'>Classement FFTT *</label>
                                    <input className='app-tournament-main-info-form-inscription-grid-container_input' type="text" placeholder="Ex: 1250" />
                                </div>
                                <div className='app-tournament-main-info-form-inscription-grid-container'>
                                    <label className='app-tournament-main-info-form-inscription-grid-container_label'>Club *</label>
                                    <input className='app-tournament-main-info-form-inscription-grid-container_input' type="text" placeholder="Votre club" required />
                                </div>
                                <div className='app-tournament-main-info-form-inscription-grid-container'>
                                    <label className='app-tournament-main-info-form-inscription-grid-container_label'>Email *</label>
                                    <input className='app-tournament-main-info-form-inscription-grid-container_input' type="text" placeholder="votre@gmail.com" required />
                                </div>
                                <div className='app-tournament-main-info-form-inscription-grid-container'>
                                    <label className='app-tournament-main-info-form-inscription-grid-container_label'>Téléphone *</label>
                                    <input className='app-tournament-main-info-form-inscription-grid-container_input' type="text" placeholder="06 XX XX XX XX" required />
                                </div>
                            </div>
                            <Button type="button" variant="action" lib="Choisir mes tableaux" onClick={() => handleTogglePop(true)} className='app-tournament-main-info-form-inscription-grid_btn' width='100%' height='40px' />
                            <Button type="button" variant="secondary" lib="Valider mon inscription" width='100%' height='40px' />
                        </form>
                    </div>
                </div>
            </main>
            <Table close={open} handleTogglePop={handleTogglePop} />
            <Footer />
        </div>
    )
}