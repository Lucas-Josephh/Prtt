import "./Tag.scss"

export default function Tag({className, news, lib, variant="primary"}: {className?: string, news?: string, lib?: string, variant?: string}) {
    return (
        <div>
            {news?.toLowerCase() === "match" || news?.toLowerCase() === "formation" || news?.toLowerCase() === "tournoi" || news?.toLowerCase() === "club" || news?.toLowerCase() === "autre" ?
                <span className={`extranet-tag_${news.toLowerCase()} extranet-tag_default ${className}`}>{news}</span>
            : (variant == "primary" && lib) &&
                <span className={`extranet-tag_${variant.toLowerCase()} extranet-tag_default ${className}`}>{lib}</span>
            }
        </div>
    )
}