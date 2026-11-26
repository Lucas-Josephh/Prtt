import Image from 'next/image'
import './NewsPlaceholder.scss'

/**
 * Cadre d'image d'une actualité : affiche la photo `src` si elle existe,
 * sinon un visuel de remplacement aux couleurs du club (même taille dans les deux cas).
 */
export default function NewsPlaceholder({ className = "", logoSize = 56, src = null, alt = "" }: { className?: string, logoSize?: number, src?: string | null, alt?: string }) {
    if (src) {
        return (
            <div className={`extranet-news-placeholder extranet-news-placeholder--photo ${className}`}>
                <Image className='extranet-news-placeholder_photo' src={src} fill sizes="(max-width: 768px) 100vw, 50vw" alt={alt} />
            </div>
        )
    }
    return (
        <div className={`extranet-news-placeholder ${className}`} aria-hidden="true">
            <Image className='extranet-news-placeholder_logo' src="/logo.jpg" width={logoSize} height={logoSize} alt="" />
            <span className='extranet-news-placeholder_name'>PRTT</span>
        </div>
    )
}
