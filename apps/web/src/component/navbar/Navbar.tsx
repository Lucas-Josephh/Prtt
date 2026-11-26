"use client";

import Link from 'next/link';
import './Navbar.scss';
import Image from 'next/image';
import { LogOut, Menu, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { useSession } from '@web/component/session/SessionProvider';
import { useRouter } from 'next/navigation';

export default function Navbar({select}: {select: string}) {
  const [navMobile, setNavMobile] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const { session, logout } = useSession();
  const router = useRouter();
  const admin = session.status === "authenticated" ? session.user : null;

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    setLoggingOut(false);
    setNavMobile(false);
    // La connexion se fait sur l'application séparée (apps/login) : après déconnexion, on reste sur le site
    router.push('/');
  };

  return (
    <>
      <div className="navbar-tag">🏓 PRTT – Perpignan Roussillon Tennis de Table · Salle Henri Blanc, 66000 Perpignan</div>
      <nav className="navbar">
        <Link href="/" className='navbar-mark'>
          <Image className='navbar-mark_img' src="/logo.jpg" loading="eager" width={80} height={80} alt="background"/>
          <div className='navbar-mark-info '>
            <h1 className='navbar-mark-info_title'>PRTT</h1>
            <h2 className='navbar-mark-info_subtitle'>Perpignan Roussillon TT</h2>
          </div>
        </Link>
        <div className="navbar-right">
        <ul className="navbar-list">
          {['Accueil', 'Actualités', 'Bureau', 'Tournoi', 'Informations'].map((item: string, index: number) => (
            <li key={index} className="navbar-list-li">
              <Link href={index === 0 ? "/" : `/${item.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`} className={`navbar-list-li-link ${select.toLowerCase() === item.toLowerCase() && 'navbar-list-li-selected'}`}>
                {item}
              </Link>
            </li>
          ))}
        </ul>
        {admin && (
          <div className="navbar-admin">
            <span className="navbar-admin_badge" title={`Connecté en tant que ${admin.identifier}`}>
              <ShieldCheck size={14} /> Mode admin
            </span>
            <button type="button" className="navbar-admin_logout" onClick={handleLogout} disabled={loggingOut}>
              <LogOut size={14} /> {loggingOut ? "Déconnexion…" : "Déconnexion"}
            </button>
          </div>
        )}
        <button className="navbar-mobile" onClick={() => setNavMobile(!navMobile)}><Menu /></button>
        </div>
      </nav>

      {navMobile && (
        <div className='navbar-mobile-filter' onClick={() => setNavMobile(false)}></div>
      )}

      <nav className={`navbar-mobile-container ${navMobile ? "open" : ""}`}>
        <div className="navbar-mobile-topline"></div>
        
        <div className="navbar-mobile-header">
          <div className="navbar-mobile-logo-mark">
            <Image src="/logo.jpg" width={30} height={30} alt="logo" />
          </div>
          <div>
            <div className="navbar-mobile-brand-name">PRTT</div>
            <div className="navbar-mobile-brand-sub">Perpignan Roussillon TT</div>
          </div>
        </div>

        <ul className='navbar-mobile-container-menu'>
          {['Accueil', 'Actualités', 'Bureau', 'Tournoi', 'Informations'].map((item: string, index: number) => (
            <li
              key={index}
              className="navbar-mobile-container-menu-list"
              style={{ '--index': index } as React.CSSProperties}
            >
              <Link 
                href={index === 0 ? "/" : `/${item.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`} 
                onClick={() => setNavMobile(false)}
                className={`navbar-mobile-container-menu-list-link ${select.toLowerCase() === item.toLowerCase() ? 'navbar-mobile-container-menu-list-link_selected' : ''}`}
              >
                {item}
              </Link>
            </li>
          ))}
        </ul>

        {admin && (
          <div className="navbar-mobile-admin">
            <span className="navbar-mobile-admin_badge">
              <ShieldCheck size={14} /> Mode admin
            </span>
            <span className="navbar-mobile-admin_user">Connecté en tant que {admin.identifier}</span>
            <button type="button" className="navbar-mobile-admin_logout" onClick={handleLogout} disabled={loggingOut}>
              <LogOut size={16} /> {loggingOut ? "Déconnexion…" : "Déconnexion"}
            </button>
          </div>
        )}
      </nav>
    </>
  );
}