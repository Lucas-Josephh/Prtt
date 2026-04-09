import Navbar from "@web/component/navbar/Navbar"
import "./page.scss"
import { Clock, Euro, Mail, MapPin } from "lucide-react"
import Info from "@web/component/info/Info"
import Footer from "@web/component/footer/Footer"
import Image from "next/image"
import Network from "@web/component/network/Network"
import Link from "next/link"

export default function Informations() {
    return (
        <div className="app-information">
            <Navbar select='informations' />
            <header className="app-information-header">
                <div className="app-information-header-mark">
                    <h1 className="app-information-header-mark_title">prtt</h1>
                    <h2 className="app-information-header-mark_subtitle">Informations pratiques</h2>
                </div>
            </header>
            
            <main className="app-information-main">
                <div className="app-information-main-detail">
                    <Info title="Contact" logo={<Mail size="16" />} color="#f97316" line={["prttcontact@gmail.com"]} />
                    <Info title="Adresse" logo={<MapPin size="16" />} color="#3b82f6" line={["Salle Henri Blanc", "15 Rue du Tennis de Table", "66000 Perpignan"]} />
                    <Info title="Horaires d'entraînement" logo={<Clock size="16" />} color="#8b5cf6" line={["Régional : Mardi - Jeudi", "Départemental : Lundi - Mercredi - Vendredi", "Loisir : Lundi - Vendredi", "Jeunes : Mercredi - Vendredi", "\n", <Link key="link" href="/planning.pdf" download>Télécharger le planning</Link>]} />
                    <Info title="Tarifs saison 2025-2026" logo={<Euro size="16" />} color="#ef4444" line={["Licence compétition : 200€", "Licence loisir : 160€", "\n", <p key="line">(Réduction de 10% pour les licences famille à partir de la 3ème licence)</p>]} />
                </div>
                <div className="app-information-main-location">
                    <div className="app-information-main-location-container">
                        <div className='app-information-main-location-container-mark'>
                            <Image className='app-information-main-location-container-mark_img' src="/logo.jpg" loading="eager" width={80} height={80} alt="background"/>
                            <div className='app-information-main-location-container-mark-info '>
                                <h1 className='app-information-main-location-container-mark-info_title'>PRTT</h1>
                                <h2 className='app-information-main-location-container-mark-info_subtitle'>Perpignan Roussillon TT</h2>
                            </div>
                        </div>
                        <p className="app-information-main-location-container_description">
                            Séance d&apos;essai gratuite pour les nouveaux ! Venez nous rencontrer directement à la salle Henri Blanc.
                        </p>
                        <div className="app-information-main-location-container-network">
                            <Network type="facebook" target="_blank" href="https://www.facebook.com/perpignanroussillontennisdetable" variant="primary" />
                            <Network type="instagram" target="_blank" href="https://www.instagram.com/perpignan_tennis_de_table?igsh=NzFlb3Z3NHlxbTR5" variant="primary" />
                            <Network type="youtube" target="_blank" href="https://www.youtube.com/@perpignanroussillontennisd7049" variant="primary" />
                        </div>
                    </div>
                    <div className="app-information-main-location-iframe">
                        <iframe
                            src="https://www.google.com/maps?q=42.68962695692721,2.8731420663714684&output=embed"
                            width={"100%"}
                            height={"100%"}
                            style={{ border: "none" }}
                            loading="lazy"
                        />
                    </div>
                    <p className="app-information-main-location_description">
                        <MapPin size={14} color="#f97316" /> Salle Henri Blanc, 66000 Perpignan
                    </p>
                </div>
            </main>
            <Footer />
        </div>
    )
}