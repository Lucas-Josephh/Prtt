"use client";

import Link from 'next/link';
import './Navbar.scss';
import Image from 'next/image';
import { Menu } from 'lucide-react';
import { useState } from 'react';

export default function Navbar({select}: {select: string}) {
  const [navMobile, setNavMobile] = useState(false);

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
        <ul className="navbar-list">
          {['Accueil', 'Actualités', 'Bureau', 'Tournoi', 'Informations'].map((item: string, index: number) => (
            <li key={index} className="navbar-list-li">
              <Link href={index === 0 ? "/" : `/${item.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`} className={`navbar-list-li-link ${select.toLowerCase() === item.toLowerCase() && 'navbar-list-li-selected'}`}>
                {item}
              </Link>
            </li>
          ))}
        </ul>
        <button className="navbar-mobile" onClick={() => setNavMobile(!navMobile)}><Menu /></button>
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
      </nav>
    </>
  );
}