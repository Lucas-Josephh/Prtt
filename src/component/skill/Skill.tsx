import { JSX } from "react"
import "./Skill.scss"

export default function Skill({logo, color, title, description}: {logo: JSX.Element, color?: string, title: string, description: string}) {
    return (
        <div className="skill" style={{borderLeft: `2px solid ${color}`}}>
            {logo}            
            <h2 className="skill_title">{title}</h2>
            <p className="skill_description">{description}</p>
        </div>
    )
}