import "./Card.scss"

export default function Card({title, subtitle, info, className}: {title: string, subtitle: string, info: string, className?: string}) {
    return (
        <div className={`card ${className}`}>
            <h1 className="card_title">{title}</h1>
            <span className="card_subtitle">{subtitle}</span>
            <span className="card_info">{info}</span>
        </div>
    )
}