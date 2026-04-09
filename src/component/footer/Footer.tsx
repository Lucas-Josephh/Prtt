import Image from "next/image"
import "./Footer.scss"
import Link from "next/link"

export default function Footer() {
    return (
        <footer className="extranet-footer">
            <div className="extranet-footer-element">
                <div className="extranet-footer-element-section">
                    <div className="extranet-footer-element-section-mark">
                        <Image className="extranet-footer-element-section-mark_img" src="/logo.jpg" loading="eager" width={80} height={80} alt="background"/>
                        <div className="extranet-footer-element-section-mark-club">
                            <h1 className="extranet-footer-element-section-mark-club_title">PRTT</h1>
                            <h2 className="extranet-footer-element-section-mark-club_subtitle">Perpignan Roussillon Tennis de Table</h2>
                        </div>
                    </div>
                    <p className="extranet-footer-element-section-mark_description">Présent dans le département depuis 1987, un club où chacun trouve sa place en Occitanie.</p>
                </div>
                <div className="extranet-footer-element-section-content-container">
                    <div className="extranet-footer-element-section-content-container-div">
                        <h1 className="extranet-footer-element-section-content-container-div_title">Nous contacter</h1>
                        <div className="extranet-footer-element-section-content-container-div-contain">
                            <a className="extranet-footer-element-section-content-container-div-contain_text extranet-footer_link">Envoyer un message</a>
                            <span className="extranet-footer-element-section-content-container-div-contain_text">prttcontact@gmail.com</span>
                        </div>
                    </div>
                    <div className="extranet-footer-element-section-content-container-div">
                        <h1 className="extranet-footer-element-section-content-container-div_title">Informations</h1>
                        <div className="extranet-footer-element-section-content-container-div-contain">
                            <Link href={"/informations"} className="extranet-footer-element-section-content-container-div-contain_text extranet-footer_link">Tarifs</Link>
                            <Link href={"/informations"} className="extranet-footer-element-section-content-container-div-contain_text extranet-footer_link">Planning</Link>
                            <Link href={"/actualites"} className="extranet-footer-element-section-content-container-div-contain_text extranet-footer_link">Actualités</Link>
                            <Link href={"/tournoi"} className="extranet-footer-element-section-content-container-div-contain_text extranet-footer_link">Tournoi</Link>
                        </div>
                    </div>
                    <div className="extranet-footer-element-section-content-container-div">
                        <h1 className="extranet-footer-element-section-content-container-div_title">Localisation</h1>
                        <div className="extranet-footer-element-section-content-container-div-contain">
                            <span className="extranet-footer-element-section-content-container-div-contain_text" style={{display: "flex", flexDirection: "column"}}>Salle Henri Blanc <span>66000 Perpignan</span></span>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    )
}