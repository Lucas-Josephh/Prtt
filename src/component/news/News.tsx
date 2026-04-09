import Image from 'next/image'
import './News.scss'
import { Calendar } from 'lucide-react'
import Tag from '../tag/Tag'

export default function News({type="card", src="/header.jpg", imgWidth="100%", imgHeight="9rem", tagName, date, title, description}: {type?: "card" | "template", src?: string, imgWidth?: string, imgHeight?: string,  tagName: string, date: string, title: string, description: string}) {
    return (
        <div className='extranet-news'>
            <div className='extranet-news-img' style={{width: `${imgWidth}`, height: `${imgHeight}`}}>
                <Image className='extranet-news-img_illustration' src={src ?? ""} loading="eager" fill alt="actualité"/>
                {type.toLowerCase() === "card" && <Tag news={tagName} className='extranet-news-img_tag' />}
            </div>
            <div className='extranet-news-container'>
                <div className='extranet-news-container-head'>
                    {type.toLowerCase() === "template" && <Tag news={tagName} />}
                    <div className='extranet-news-container-head_date'>
                        <Calendar size={10} />
                        <span>{date}</span>
                    </div>
                </div>
                <h2 className='extranet-news-container_title'>{title}</h2>
                <p className='extranet-news-container_description'>{description}</p>
            </div>
        </div>
    )
}