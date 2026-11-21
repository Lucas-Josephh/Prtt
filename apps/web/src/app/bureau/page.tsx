import Navbar from "@web/component/navbar/Navbar"
import "./page.scss"
import Tag from "@web/component/tag/Tag"
import Footer from "@web/component/footer/Footer"
import { Mail, UserRound } from "lucide-react"

export default function Bureau() {
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
                <div className="app-desk-main-boss">
                    <div className="app-desk-main-boss-img">
                        <UserRound color="rgb(231, 231, 231)" size={200}/>
                        {/* <Image src="/test.jpg" className="app-desk-main-boss-img_illustration" loading="eager" fill alt="logo"/> */}
                    </div>
                    <div className="app-desk-main-boss-content">
                        <Tag lib="Présidente" />
                        <h1 className="app-desk-main-boss-content_title">Karen Almagro</h1>
                        <span className="app-desk-main-boss-content_email"><Mail size={14} />prttcontact@gmail.com</span>
                        <p className="app-desk-main-boss-content_description">Présidente du PRTT, Karen pilote avec énergie et passion le développement du club vers de nouveaux horizons.</p>
                    </div>
                </div>

                <div className="app-desk-main-members">
                    <div className="app-desk-main-members-container">
                        <div className="app-desk-main-members-container-support">
                            <UserRound color="rgb(231, 231, 231)" size={100}/>
                            {/* <Image src="/header.jpg" className="app-desk-main-members-container-support_img" loading="eager" width={80} height={80} alt="logo"/> */}
                        </div>
                        <div className="app-desk-main-members-container-info">
                            <h2 className="app-desk-main-members-container-info_name">Bilal MANAI</h2>
                            <h3 className="app-desk-main-members-container-info_status">Vice-Président</h3>
                            <span className="app-desk-main-members-container-info_email"><Mail size={10} />prttcontact@gmail.com</span>
                        </div>
                    </div>
                    <div className="app-desk-main-members-container">
                        <div className="app-desk-main-members-container-support">
                            <UserRound color="rgb(231, 231, 231)" size={100}/>
                            {/* <Image src="/header.jpg" className="app-desk-main-members-container-support_img" loading="eager" width={80} height={80} alt="logo"/> */}
                        </div>
                        <div className="app-desk-main-members-container-info">
                            <h2 className="app-desk-main-members-container-info_name">Elisabeth DE SAINT MARTIN</h2>
                            <h3 className="app-desk-main-members-container-info_status">Trésorière / Commission financière</h3>
                            <span className="app-desk-main-members-container-info_email"><Mail size={10} />prttcontact@gmail.com</span>
                        </div>
                    </div>
                    <div className="app-desk-main-members-container">
                        <div className="app-desk-main-members-container-support">
                            <UserRound color="rgb(231, 231, 231)" size={100}/>
                            {/* <Image src="/header.jpg" className="app-desk-main-members-container-support_img" loading="eager" width={80} height={80} alt="logo"/> */}
                        </div>
                        <div className="app-desk-main-members-container-info">
                            <h2 className="app-desk-main-members-container-info_name">Christophe PARISELLE</h2>
                            <h3 className="app-desk-main-members-container-info_status">Secretaire / Commission arbitrage</h3>
                            <span className="app-desk-main-members-container-info_email"><Mail size={10} />prttcontact@gmail.com</span>
                        </div>
                    </div>
                    <div className="app-desk-main-members-container">
                        <div className="app-desk-main-members-container-support">
                            <UserRound color="rgb(231, 231, 231)" size={100}/>
                            {/* <Image src="/header.jpg" className="app-desk-main-members-container-support_img" loading="eager" width={80} height={80} alt="logo"/> */}
                        </div>
                        <div className="app-desk-main-members-container-info">
                            <h2 className="app-desk-main-members-container-info_name">Christophe GARRY</h2>
                            <h3 className="app-desk-main-members-container-info_status">Commission sportive</h3>
                            <span className="app-desk-main-members-container-info_email"><Mail size={10} />prttcontact@gmail.com</span>
                        </div>
                    </div>
                    <div className="app-desk-main-members-container">
                        <div className="app-desk-main-members-container-support">
                            <UserRound color="rgb(231, 231, 231)" size={100}/>
                            {/* <Image src="/header.jpg" className="app-desk-main-members-container-support_img" loading="eager" width={80} height={80} alt="logo"/> */}
                        </div>
                        <div className="app-desk-main-members-container-info">
                            <h2 className="app-desk-main-members-container-info_name">Solène HACHEMI</h2>
                            <h3 className="app-desk-main-members-container-info_status">Commission communication</h3>
                            <span className="app-desk-main-members-container-info_email"><Mail size={10} />prttcontact@gmail.com</span>
                        </div>
                    </div>
                    <div className="app-desk-main-members-container">
                        <div className="app-desk-main-members-container-support">
                            <UserRound color="rgb(231, 231, 231)" size={100}/>
                            {/* <Image src="/header.jpg" className="app-desk-main-members-container-support_img" loading="eager" width={80} height={80} alt="logo"/> */}
                        </div>
                        <div className="app-desk-main-members-container-info">
                            <h2 className="app-desk-main-members-container-info_name">Ivan MELEY</h2>
                            <h3 className="app-desk-main-members-container-info_status">Entraîneur</h3>
                            <span className="app-desk-main-members-container-info_email"><Mail size={10} />prttcontact@gmail.com</span>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    )
}