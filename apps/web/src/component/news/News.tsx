import Image from 'next/image'
import './News.scss'
import { Calendar, Pencil, Trash2 } from 'lucide-react'
import Tag from '../tag/Tag'
import NewsPlaceholder from './NewsPlaceholder'

/**
 * `src={null}` : actualité sans photo, un visuel de remplacement prend sa place
 * pour garder le format photo + texte.
 * `onEdit` / `onDelete` : affichent les boutons « Modifier » / « Supprimer » (réservés à l'admin).
 */
export default function News({type="card", src="/header.jpg", imgWidth="100%", imgHeight="9rem", tagName, date, title, description, badge, onEdit, onDelete}: {type?: "card" | "template", src?: string | null, imgWidth?: string, imgHeight?: string,  tagName: string, date: string, title: string, description: string, badge?: string, onEdit?: () => void, onDelete?: () => void}) {
    return (
        <div className='extranet-news'>
            <div className='extranet-news-img' style={{width: `${imgWidth}`, height: `${imgHeight}`}}>
                {src === null
                    ? <NewsPlaceholder />
                    : <Image className='extranet-news-img_illustration' src={src ?? ""} loading="eager" fill alt="actualité"/>
                }
                {type.toLowerCase() === "card" && <Tag news={tagName} className='extranet-news-img_tag' />}
                {(onEdit || onDelete) && (
                    <div className='extranet-news-img-actions'>
                        {onEdit && (
                            <button type="button" className='extranet-news-img-actions_btn' onClick={onEdit} aria-label={`Modifier l'actualité « ${title} »`}>
                                <Pencil size={12} /> Modifier
                            </button>
                        )}
                        {onDelete && (
                            <button type="button" className='extranet-news-img-actions_btn extranet-news-img-actions_btn--danger' onClick={onDelete} aria-label={`Supprimer l'actualité « ${title} »`}>
                                <Trash2 size={12} /> Supprimer
                            </button>
                        )}
                    </div>
                )}
            </div>
            <div className='extranet-news-container'>
                <div className='extranet-news-container-head'>
                    {type.toLowerCase() === "template" && <Tag news={tagName} />}
                    <div className='extranet-news-container-head_date'>
                        <Calendar size={10} />
                        <span>{date}</span>
                    </div>
                    {badge && <span className='extranet-news-container-head_badge'>{badge}</span>}
                </div>
                <h2 className='extranet-news-container_title'>{title}</h2>
                <p className='extranet-news-container_description'>{description}</p>
            </div>
        </div>
    )
}
